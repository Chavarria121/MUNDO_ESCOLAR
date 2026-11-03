import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SqlService } from '../database/sql.service';
import { hashContrasena, verificarContrasena } from './password.util';
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
  ) {}

  /** SP_Permiso_ConsultarUsuario: permisos efectivos según Rol_Usuario + Rol_Permiso. */
  private async permisosDe(idUsuario: number): Promise<string[]> {
    const filas = await this.sql.consultarSP<{ Nombre_Permiso: string }>('SP_Permiso_ConsultarUsuario', {
      Id_Usuario: idUsuario,
    });
    return filas.map((f) => f.Nombre_Permiso);
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

    return {
      idUsuario: fila.Id_Usuario,
      nombreUsuario: fila.Nombre_Usuario,
      correo: fila.Correo,
      permisos: await this.permisosDe(fila.Id_Usuario),
      requiereCambioContrasena: Boolean(fila.Requiere_Cambio_Contrasena),
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
}
