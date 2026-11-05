import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { SqlService } from '../database/sql.service';
import { hashContrasena, generarContrasenaTemporal } from '../auth/password.util';
import { EmailService } from '../email/email.service';
import {
  ActualizarClienteDto,
  AutorizarCondicionPagoDto,
  ConsultarHistorialDto,
  ConsultarHistorialGeneralDto,
  CrearClienteInstitucionalDto,
  CrearClienteParticularDto,
} from './dto/clientes.dto';

@Injectable()
export class ClientesService {
  constructor(private readonly sql: SqlService, private readonly emailService: EmailService) {}

  
  async consultarTse(identificacion: string) {
    const limpia = (identificacion || '').replace(/\D/g, '');
    if (!limpia || limpia.length < 8) {
      return {
        encontrado: false,
        mensaje: 'La identificación debe poseer al menos 9 dígitos (cédula física) o 10 dígitos (cédula jurídica).',
      };
    }

    try {
      const res = await fetch(`https://api.hacienda.go.cr/fe/ae?identificacion=${limpia}`, {
        headers: { 'User-Agent': 'MundoEscolar-ERP/2.0' },
        signal: AbortSignal.timeout(6000),
      });

      if (!res.ok) {
        return {
          encontrado: false,
          identificacionLimpia: limpia,
          mensaje: 'Identificación no encontrada en el padrón del TSE ni en la Dirección General de Tributación.',
        };
      }

      const data: any = await res.json();
      const rawNombre = (data.nombre || '').trim();

      if (limpia.length === 10 || data.tipoIdentificacion === '02') {
        // Persona Jurídica / Institucional
        const formateada = `${limpia.slice(0, 1)}-${limpia.slice(1, 4)}-${limpia.slice(4)}`;
        return {
          encontrado: true,
          tipo: 'JURIDICA',
          identificacionLimpia: limpia,
          cedulaJuridica: formateada,
          razonSocial: rawNombre,
          nombreCompleto: rawNombre,
          situacion: data.situacion?.estado || 'Inscrito',
        };
      }

      // Persona Física (TSE)
      // Formato típico en Costa Rica: NOMBRE [NOMBRE2] APELLIDO1 APELLIDO2
      const partes = rawNombre.split(/\s+/);
      let nombre = rawNombre;
      let apellido1 = '';
      let apellido2 = '';

      if (partes.length >= 3) {
        apellido2 = partes.pop();
        apellido1 = partes.pop();
        nombre = partes.join(' ');
      } else if (partes.length === 2) {
        apellido1 = partes.pop();
        nombre = partes[0];
      }

      const formatoCedula = limpia.length === 9
        ? `${limpia.slice(0, 1)}-${limpia.slice(1, 5)}-${limpia.slice(5)}`
        : limpia;

      return {
        encontrado: true,
        tipo: 'FISICA',
        identificacionLimpia: limpia,
        identificacionFormateada: formatoCedula,
        nombreCompleto: rawNombre,
        nombre,
        apellido1,
        apellido2,
        situacion: data.situacion?.estado || 'Registrado',
      };
    } catch (err: any) {
      return {
        encontrado: false,
        identificacionLimpia: limpia,
        mensaje: 'No fue posible conectar con el servicio de Hacienda/TSE: ' + (err.message || 'Tiempo de espera agotado'),
      };
    }
  }

  listarClientesActivos() {
    return this.sql.consultarVista('VW_ClientesActivos');
  }

  consultar(id?: number, busqueda?: string) {
    return this.sql.consultarSP('SP_Cliente_Consultar', {
      Id_Cliente: id ?? null,
      TerminoBusqueda: busqueda ?? null,
    });
  }

  async consultarPorId(id: number) {
    const clientes = await this.consultar(id);
    return clientes[0] ?? null;
  }

  consultarHistorial(idCliente: number, dto: ConsultarHistorialDto) {
    return this.sql.consultarSP('SP_Cliente_HistorialOperaciones', {
      Id_Cliente: idCliente,
      FechaInicio: dto.fechaInicio ? new Date(dto.fechaInicio) : null,
      FechaFin: dto.fechaFin ? new Date(dto.fechaFin) : null,
    });
  }

  consultarHistorialGeneral(dto: ConsultarHistorialGeneralDto) {
    return this.sql.consultarSP('SP_Cliente_HistorialGeneral', {
      Id_Cliente: dto.idCliente ?? null,
      Tipo_Cliente: dto.tipoCliente ?? null,
      FechaInicio: dto.fechaInicio ? new Date(dto.fechaInicio) : null,
      FechaFin: dto.fechaFin ? new Date(dto.fechaFin) : null,
      Estado_Venta: dto.estadoVenta ?? null,
    });
  }

  async crearParticular(dto: CrearClienteParticularDto, idEjecutor: number | null = null) {
    const num = dto.identificacion.replace(/[^0-9]/g, '');
    const nomUser = (dto.nombreUsuario && dto.nombreUsuario.trim()) || ('cli.' + num);
    const correoUser = dto.correo.trim();

    let passPlano = dto.contrasena?.trim();
    let esTemporal = false;
    if (!passPlano) {
      passPlano = generarContrasenaTemporal();
      esTemporal = true;
    }
    const requiereCambio = esTemporal ? 1 : 0;

    // 1. Verificar disponibilidad de usuario/correo via SP (PoLP estricto sin SELECT directo)
    const disp = await this.sql.consultarSPUno<{ NombreUsuarioExiste: boolean; CorreoExiste: boolean }>(
      'SP_Usuario_VerificarDisponibilidad',
      { Nombre_Usuario: nomUser, Correo: correoUser },
    );

    if (disp?.NombreUsuarioExiste || disp?.CorreoExiste) {
      throw new ConflictException(
        'El nombre de usuario o correo electrónico ya se encuentra registrado. Inicie sesión para vincular su cuenta.',
      );
    }

    // 2. Crear usuario asociado de manera segura
    const user = await this.sql.ejecutarSP(
      'SP_Usuario_Crear',
      {
        Nombre_Usuario: nomUser,
        Correo: correoUser,
        ContrasenaHash: hashContrasena(passPlano),
        Requiere_Cambio_Contrasena: requiereCambio,
      },
      { idUsuario: idEjecutor, salidas: { Id_Usuario_Nuevo: 'int' } },
    );
    const idUsuarioCliente = user.filas[0]?.Id_Usuario ?? user.salida?.Id_Usuario_Nuevo;

    // 3. Crear perfil de cliente particular
    const r = await this.sql.ejecutarSP(
      'SP_Cliente_CrearPerfil',
      {
        Id_Tipo_Cliente: 1,
        Identificacion: dto.identificacion,
        Nombre: dto.nombre,
        Apellido1: dto.apellido1,
        Apellido2: dto.apellido2 || '',
        Telefono: dto.telefono || 'Sin registrar',
        Direccion: dto.direccion || 'Sin asignar',
        Id_Usuario: idUsuarioCliente,
      },
      { idUsuario: idEjecutor, salidas: { Id_Cliente_Nuevo: 'int' } },
    );

    // 4. Despacho asíncrono no bloqueante del correo de bienvenida
    this.emailService
      .enviarCredencialesBienvenida({
        destinatario: correoUser,
        nombreCliente: dto.nombre + ' ' + dto.apellido1,
        identificacion: dto.identificacion,
        nombreUsuario: nomUser,
        contrasenaTemporal: passPlano,
      })
      .catch((err) => console.error('Error enviando correo de bienvenida (Particular):', err));

    return r.filas[0] ?? { Id_Cliente: r.salida.Id_Cliente_Nuevo };
  }

  async crearInstitucional(dto: CrearClienteInstitucionalDto, idEjecutor: number | null = null) {
    const num = dto.cedulaJuridica.replace(/[^0-9]/g, '');
    const nomUser = (dto.nombreUsuario && dto.nombreUsuario.trim()) || ('inst.' + num);
    const correoUser = dto.correoContacto.trim();

    let passPlano = dto.contrasena?.trim();
    let esTemporal = false;
    if (!passPlano) {
      passPlano = generarContrasenaTemporal();
      esTemporal = true;
    }
    const requiereCambio = esTemporal ? 1 : 0;

    // 1. Verificar disponibilidad de usuario/correo via SP (PoLP estricto sin SELECT directo)
    const disp = await this.sql.consultarSPUno<{ NombreUsuarioExiste: boolean; CorreoExiste: boolean }>(
      'SP_Usuario_VerificarDisponibilidad',
      { Nombre_Usuario: nomUser, Correo: correoUser },
    );

    if (disp?.NombreUsuarioExiste || disp?.CorreoExiste) {
      throw new ConflictException(
        'El nombre de usuario o correo electrónico ya se encuentra registrado. Inicie sesión para vincular su cuenta institucional.',
      );
    }

    // 2. Crear usuario asociado de manera segura
    const user = await this.sql.ejecutarSP(
      'SP_Usuario_Crear',
      {
        Nombre_Usuario: nomUser,
        Correo: correoUser,
        ContrasenaHash: hashContrasena(passPlano),
        Requiere_Cambio_Contrasena: requiereCambio,
      },
      { idUsuario: idEjecutor, salidas: { Id_Usuario_Nuevo: 'int' } },
    );
    const idUsuarioCliente = user.filas[0]?.Id_Usuario ?? user.salida?.Id_Usuario_Nuevo;

    // 3. Crear perfil de cliente institucional
    const r = await this.sql.ejecutarSP(
      'SP_Cliente_CrearPerfil',
      {
        Id_Tipo_Cliente: 2,
        Cedula_Juridica: dto.cedulaJuridica,
        Razon_Social: dto.razonSocial,
        Nombre_Contacto: dto.nombreContacto || 'Encargado de Compras',
        Telefono_Contacto: dto.telefonoContacto || dto.telefono || 'Sin registrar',
        Correo_Contacto: correoUser,
        Telefono: dto.telefono || 'Sin registrar',
        Direccion: dto.direccion || 'Sin asignar',
        Id_Usuario: idUsuarioCliente,
      },
      { idUsuario: idEjecutor, salidas: { Id_Cliente_Nuevo: 'int' } },
    );

    // 4. Despacho asíncrono no bloqueante del correo de bienvenida institucional
    this.emailService
      .enviarCredencialesBienvenida({
        destinatario: correoUser,
        nombreCliente: dto.razonSocial,
        identificacion: dto.cedulaJuridica,
        nombreUsuario: nomUser,
        contrasenaTemporal: passPlano,
      })
      .catch((err) => console.error('Error enviando correo de bienvenida (Institucional):', err));

    return r.filas[0] ?? { Id_Cliente: r.salida.Id_Cliente_Nuevo };
  }

  async actualizar(idCliente: number, dto: ActualizarClienteDto, idEjecutor: number) {
    if (dto.correo && dto.correo.trim()) {
      await this.sql.consultarSPUno(
        'SP_Cliente_ActualizarCorreoUsuario',
        { Id_Cliente: idCliente, NuevoCorreo: dto.correo.trim() },
        { idUsuario: idEjecutor },
      );
    }
    return this.sql.consultarSPUno(
      'SP_Cliente_Actualizar',
      {
        Id_Cliente: idCliente,
        Telefono: dto.telefono ?? null,
        Direccion: dto.direccion ?? null,
        Estado: dto.estado !== undefined ? dto.estado : 1,
        Nombre: dto.nombre ?? null,
        Apellido1: dto.apellido1 ?? null,
        Apellido2: dto.apellido2 ?? null,
        Razon_Social: dto.razonSocial ?? null,
        Nombre_Contacto: dto.nombreContacto ?? null,
        Telefono_Contacto: dto.telefonoContacto ?? null,
        Correo_Contacto: dto.correoContacto ?? null,
      },
      { idUsuario: idEjecutor },
    );
  }

  async consultarEstadoCredito(idCliente: number) {
    const res = await this.sql.consultarSP<any>('SP_Cliente_ConsultarEstadoCredito', {
      Id_Cliente: idCliente,
    });
    const c = res[0];
    if (!c) return null;

    const saldo = Number(c.Saldo_Adeudado || 0);
    const limiteMonto = Number(c.Limite_Credito_Monto || 300000);
    const limiteFact = Number(c.Limite_Facturas || 3);
    const factActivas = Number(c.Facturas_Activas_Credito || 0);
    const disp = Number(c.Credito_Disponible != null ? c.Credito_Disponible : Math.max(0, limiteMonto - saldo));

    return {
      idCliente: c.Id_Cliente,
      nombreCliente: c.Nombre_Cliente,
      esMoroso: Boolean(c.Es_Moroso),
      facturasVencidas: Number(c.Facturas_Vencidas || 0),
      facturasActivasCredito: factActivas,
      facturasCreditoActivas: factActivas,
      limiteFacturas: limiteFact,
      limiteCreditoFacturas: limiteFact,
      saldoAdeudado: saldo,
      deudaActual: saldo,
      limiteCreditoMonto: limiteMonto,
      creditoDisponible: disp,
      saldoCreditoDisponible: disp,
      permiteCredito: Boolean(c.Permite_Credito),
      puedeComprarCredito: Boolean(c.Puede_Comprar_Credito),
      puedeComprarContado: Boolean(c.Puede_Comprar_Contado),
    };
  }

  consultarCondicionesPago(idCliente: number) {
    return this.sql.consultarSP('SP_ClienteCondicionPago_Consultar', { Id_Cliente: idCliente });
  }

  autorizarCondicionPago(idCliente: number, dto: AutorizarCondicionPagoDto, idEjecutor: number) {
    return this.sql.consultarSPUno(
      'SP_ClienteCondicionPago_Autorizar',
      { Id_Cliente: idCliente, Id_Condicion_Pago: dto.idCondicionPago },
      { idUsuario: idEjecutor },
    );
  }

  deshabilitarCondicionPago(idCliente: number, idCondicionPago: number, idEjecutor: number) {
    return this.sql.consultarSPUno(
      'SP_ClienteCondicionPago_Deshabilitar',
      { Id_Cliente: idCliente, Id_Condicion_Pago: idCondicionPago },
      { idUsuario: idEjecutor },
    );
  }

  async obtenerPerfilPorUsuario(idUsuario: number) {
    const filas = await this.sql.consultarQuery<any>(
      `SELECT * FROM VW_ClientesActivos WHERE Id_Usuario = @id`,
      { id: idUsuario },
    );
    return filas[0] ?? null;
  }

  async consultarHistorialPorUsuario(idUsuario: number) {
    const perfil = await this.obtenerPerfilPorUsuario(idUsuario);
    if (!perfil) return [];
    return this.sql.consultarSP('SP_Cliente_HistorialOperaciones', {
      Id_Cliente: perfil.Id_Cliente,
      FechaInicio: null,
      FechaFin: null,
    });
  }

}
