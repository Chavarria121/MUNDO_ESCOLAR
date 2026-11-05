import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SqlService } from '../database/sql.service';
import { hashContrasena, verificarContrasena, generarCodigoOtp } from './password.util';
import { EmailService } from '../email/email.service';
import { SolicitarRecuperacionDto, ConfirmarRecuperacionDto } from './dto/recuperar-contrasena.dto';
import { JwtPayload, UsuarioSesion } from './interfaces/usuario-sesion.interface';
import { CambiarContrasenaDto } from './dto/cambiar-contrasena.dto';
import { TokenBlacklistService } from './token-blacklist.service';

interface FilaAutenticacion {
  Id_Usuario: number;
  Nombre_Usuario: string;
  Correo: string;
  HashContrasena: string;
  Estado: boolean;
  Requiere_Cambio_Contrasena: boolean;
}

interface FilaHistorialContrasena {
  Contrasena_Hash: string;
  Fecha_Modificacion: Date;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly sql: SqlService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly tokenBlacklist: TokenBlacklistService,
    private readonly emailService: EmailService,
  ) {}

  /** Formatea una palabra en Title Case (e.g., 'SAMIR' -> 'Samir'). */
  private capitalizar(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /** Extrae el primer nombre formateado con elegancia. */
  private extraerPrimerNombre(nombre: string | null | undefined, fallback: string): string {
    if (nombre && nombre.trim()) {
      const primer = nombre.trim().split(/\s+/)[0];
      return this.capitalizar(primer);
    }
    if (!fallback) return 'Usuario';
    const parte = fallback.split('.')[0] || fallback;
    return this.capitalizar(parte);
  }

  /** SP_Permiso_ConsultarUsuario: permisos efectivos según Rol_Usuario + Rol_Permiso. */
  private async permisosDe(idUsuario: number): Promise<string[]> {
    const filas = await this.sql.consultarSP<{ Nombre_Permiso: string }>('SP_Permiso_ConsultarUsuario', {
      Id_Usuario: idUsuario,
    });
    return filas.map((f) => f.Nombre_Permiso);
  }

  /** Consulta los roles asignados al usuario en SQL Server (Rol_Usuario + Rol). */
  private async rolesDe(idUsuario: number): Promise<string[]> {
    const filas = await this.sql.consultarQuery<{ Nombre: string }>(
      `SELECT r.Nombre FROM Rol_Usuario ru JOIN Rol r ON ru.Id_Rol = r.Id_Rol WHERE ru.Id_Usuario = @id AND r.Estado = 1`,
      { id: idUsuario },
    );
    return filas.map((f) => f.Nombre);
  }

  /** Consulta si el usuario está vinculado a un cliente en VW_ClientesActivos. */
  private async clienteDe(idUsuario: number) {
    const filas = await this.sql.consultarQuery<any>(
      `SELECT * FROM VW_ClientesActivos WHERE Id_Usuario = @id`,
      { id: idUsuario },
    );
    return filas[0] ?? null;
  }

  async login(nombreUsuario: string, contrasena: string) {
    // SP 55: entrega al backend únicamente lo necesario para autenticación segura
    const fila = await this.sql.consultarSPUno<FilaAutenticacion>('SP_Usuario_ObtenerParaAutenticacion', {
      Nombre_Usuario: nombreUsuario,
    });

    // Mensaje genérico: no revelar existencia del usuario (mitigación de enumeración de cuentas)
    if (!fila || !verificarContrasena(contrasena, fila.HashContrasena)) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos.');
    }
    if (!fila.Estado) {
      throw new ForbiddenException('El usuario se encuentra inactivo.');
    }

    const permisos = await this.permisosDe(fila.Id_Usuario);
    const requiereCambio = Boolean(fila.Requiere_Cambio_Contrasena);

    // 1. Determinar si el usuario es un Cliente
    const cliente = await this.clienteDe(fila.Id_Usuario);
    let esCliente = false;
    let roles: string[] = [];
    let primerNombre = '';
    let nombreCompleto = '';
    let clienteData: any = null;

    if (cliente) {
      esCliente = true;
      roles = ['Cliente'];
      clienteData = cliente;
      nombreCompleto = cliente.Nombre_O_RazonSocial || [cliente.Nombre, cliente.Apellido1].filter(Boolean).join(' ');
      primerNombre = this.extraerPrimerNombre(cliente.Nombre || cliente.Nombre_O_RazonSocial, fila.Nombre_Usuario);
    } else {
      // 2. Colaborador interno: consultar roles de la BD
      roles = await this.rolesDe(fila.Id_Usuario);
      if (roles.length === 0) {
        roles = permisos.includes('SEGURIDAD_GESTIONAR') ? ['Administrador'] : ['Usuario'];
      }
      nombreCompleto = fila.Nombre_Usuario;
      primerNombre = this.extraerPrimerNombre('', fila.Nombre_Usuario);
    }

    const payload: JwtPayload = {
      sub: fila.Id_Usuario,
      nombreUsuario: fila.Nombre_Usuario,
      requiereCambioContrasena: requiereCambio,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      tipoToken: 'Bearer',
      expiraEn: this.config.get<string>('jwt.expiresIn'),
      usuario: {
        idUsuario: fila.Id_Usuario,
        nombreUsuario: fila.Nombre_Usuario,
        correo: fila.Correo,
        requiereCambioContrasena: requiereCambio,
        esCliente,
        roles,
        primerNombre,
        nombreCompleto,
        clienteData,
      },
      permisos,
    };
  }

  /** Reconstruye la sesión desde SQL Server en cada petición autenticada. */
  async construirSesion(payload: JwtPayload): Promise<UsuarioSesion> {
    const fila = await this.sql.consultarSPUno<FilaAutenticacion>('SP_Usuario_ObtenerParaAutenticacion', {
      Nombre_Usuario: payload.nombreUsuario,
    });
    if (!fila || fila.Id_Usuario !== payload.sub) throw new UnauthorizedException('Sesión no válida.');
    if (!fila.Estado) throw new UnauthorizedException('El usuario fue desactivado.');

    const permisos = await this.permisosDe(fila.Id_Usuario);
    const cliente = await this.clienteDe(fila.Id_Usuario);
    let esCliente = false;
    let roles: string[] = [];
    let primerNombre = '';
    let nombreCompleto = '';
    let clienteData: any = null;

    if (cliente) {
      esCliente = true;
      roles = ['Cliente'];
      clienteData = cliente;
      nombreCompleto = cliente.Nombre_O_RazonSocial || [cliente.Nombre, cliente.Apellido1].filter(Boolean).join(' ');
      primerNombre = this.extraerPrimerNombre(cliente.Nombre || cliente.Nombre_O_RazonSocial, fila.Nombre_Usuario);
    } else {
      roles = await this.rolesDe(fila.Id_Usuario);
      if (roles.length === 0) {
        roles = permisos.includes('SEGURIDAD_GESTIONAR') ? ['Administrador'] : ['Usuario'];
      }
      nombreCompleto = fila.Nombre_Usuario;
      primerNombre = this.extraerPrimerNombre('', fila.Nombre_Usuario);
    }

    return {
      idUsuario: fila.Id_Usuario,
      nombreUsuario: fila.Nombre_Usuario,
      correo: fila.Correo,
      permisos,
      requiereCambioContrasena: Boolean(fila.Requiere_Cambio_Contrasena),
      esCliente,
      roles,
      primerNombre,
      nombreCompleto,
      clienteData,
    };
  }

  /** Invalida criptográficamente el token JWT registrándolo en la lista negra. */
  async logout(token: string) {
    if (token) {
      try {
        const decoded: any = this.jwtService.decode(token);
        const expMs = decoded?.exp ? decoded.exp * 1000 : Date.now() + 8 * 3600 * 1000;
        await this.tokenBlacklist.revocarToken(token, expMs);
      } catch {
        await this.tokenBlacklist.revocarToken(token, Date.now() + 8 * 3600 * 1000);
      }
    }
    return { mensaje: 'Sesión cerrada exitosamente.' };
  }

  /** Permite al usuario autenticado actualizar su contraseña bajo políticas estrictas e historial. */
  async cambiarContrasena(idUsuario: number, dto: CambiarContrasenaDto) {
    const usuario = await this.sql.consultarSPUno<FilaAutenticacion>('SP_Usuario_ObtenerHashParaCambio', {
      Id_Usuario: idUsuario,
    });

    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado.');
    }
    if (!usuario.Estado) {
      throw new ForbiddenException('El usuario se encuentra inactivo.');
    }
    if (!verificarContrasena(dto.contrasenaActual, usuario.HashContrasena)) {
      throw new UnauthorizedException('La contraseña actual es incorrecta.');
    }
    if (dto.contrasenaNueva === dto.contrasenaActual) {
      throw new BadRequestException('La nueva contraseña debe ser diferente a la contraseña actual.');
    }

    // Comprobación de no repetición contra historial de contraseñas (TB_Historial_Contrasenas)
    const historial = await this.sql.consultarSP<FilaHistorialContrasena>('SP_Usuario_ConsultarHistorialContrasenas', {
      Id_Usuario: idUsuario,
    });

    for (const h of historial) {
      if (verificarContrasena(dto.contrasenaNueva, h.Contrasena_Hash)) {
        throw new BadRequestException('La nueva contraseña no puede coincidir con ninguna de sus contraseñas anteriores.');
      }
    }

    // Hasheo criptográfico moderno mediante bcrypt (12 rondas con sal)
    const nuevaHash = hashContrasena(dto.contrasenaNueva);

    // Actualización y registro forense mediante Stored Procedure seguro (PoLP)
    await this.sql.consultarSPUno('SP_Usuario_CambiarContrasena', {
      Id_Usuario: idUsuario,
      NuevoHash: nuevaHash,
    });

    return { mensaje: 'Contraseña actualizada exitosamente.' };
  }

  // Almacenamiento seguro en memoria para códigos OTP (TTL 15 minutos)
  private otpsRecuperacion = new Map<number, { codigo: string; expiraEn: number }>();

  /**
   * Solicita el restablecimiento de contraseña generando un código OTP de 6 dígitos
   * y enviándolo al correo institucional/personal del usuario vía SMTP.
   */
  async solicitarRecuperacion(dto: SolicitarRecuperacionDto) {
    const fila = await this.sql.consultarSPUno<FilaAutenticacion>('SP_Usuario_ObtenerParaAutenticacion', {
      Nombre_Usuario: dto.identificador.trim(),
    });

    if (fila && fila.Estado && fila.Correo) {
      const codigo = generarCodigoOtp();
      const expiraEn = Date.now() + 15 * 60 * 1000; // 15 minutos

      this.otpsRecuperacion.set(fila.Id_Usuario, { codigo, expiraEn });

      // Despacho de correo en segundo plano
      this.emailService
        .enviarCodigoRecuperacion({
          destinatario: fila.Correo,
          nombreUsuario: fila.Nombre_Usuario,
          codigoOtp: codigo,
        })
        .catch((err) => console.error('Error enviando código OTP:', err));
    }

    return {
      exito: true,
      mensaje:
        'Si los datos corresponden a una cuenta registrada, se ha enviado un código de verificación de 6 dígitos a su correo electrónico.',
    };
  }

  /**
   * Valida el código OTP y actualiza la contraseña del usuario comprobando el historial.
   */
  async confirmarRecuperacion(dto: ConfirmarRecuperacionDto) {
    const fila = await this.sql.consultarSPUno<FilaAutenticacion>('SP_Usuario_ObtenerParaAutenticacion', {
      Nombre_Usuario: dto.identificador.trim(),
    });

    if (!fila || !fila.Estado) {
      throw new BadRequestException('Usuario no válido o inactivo.');
    }

    const regOtp = this.otpsRecuperacion.get(fila.Id_Usuario);
    if (!regOtp || regOtp.codigo !== dto.codigoOtp.trim() || Date.now() > regOtp.expiraEn) {
      throw new BadRequestException('El código de verificación es incorrecto o ha expirado. Solicite uno nuevo.');
    }

    // Comprobación contra historial de contraseñas
    const historial = await this.sql.consultarSP<FilaHistorialContrasena>('SP_Usuario_ConsultarHistorialContrasenas', {
      Id_Usuario: fila.Id_Usuario,
    });

    for (const h of historial) {
      if (verificarContrasena(dto.contrasenaNueva, h.Contrasena_Hash)) {
        throw new BadRequestException('La nueva contraseña no puede coincidir con ninguna de sus contraseñas anteriores.');
      }
    }

    // Hasheo seguro y actualización con SP_Usuario_CambiarContrasena
    const nuevaHash = hashContrasena(dto.contrasenaNueva);
    await this.sql.consultarSPUno('SP_Usuario_CambiarContrasena', {
      Id_Usuario: fila.Id_Usuario,
      NuevoHash: nuevaHash,
    });

    // Invalida el código utilizado
    this.otpsRecuperacion.delete(fila.Id_Usuario);

    return {
      exito: true,
      mensaje: '¡Contraseña restablecida con éxito! Ya puede iniciar sesión con su nueva clave.',
    };
  }
}
