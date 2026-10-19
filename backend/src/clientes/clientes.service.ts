import { Injectable } from '@nestjs/common';
import { SqlService } from '../database/sql.service';
import { hashContrasena } from '../auth/password.util';
import {
  ActualizarClienteDto,
  AutorizarCondicionPagoDto,
  ConsultarHistorialDto,
  CrearClienteInstitucionalDto,
  CrearClienteParticularDto,
} from './dto/clientes.dto';

@Injectable()
export class ClientesService {
  constructor(private readonly sql: SqlService) {}

  
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

    async crearParticular(dto: CrearClienteParticularDto, idEjecutor: number) {
    let idUsuarioCliente = dto.idUsuario;
    if (!idUsuarioCliente) {
      const num = dto.identificacion.replace(/[^0-9]/g, '');
      const nomUser = 'cli.' + num;
      const correoUser = nomUser + '@mundoescolar.cr';

      // 1. Verificar si el usuario ya existe en Usuario
      const existentes = await this.sql.consultarQuery<{ Id_Usuario: number; Vinculado: number }>(
        `SELECT u.Id_Usuario, (SELECT COUNT(1) FROM Cliente c WHERE c.Id_Usuario = u.Id_Usuario) AS Vinculado
         FROM Usuario u WHERE u.Nombre_Usuario = @nom OR u.Correo = @correo`,
        { nom: nomUser, correo: correoUser },
      );

      if (existentes && existentes.length > 0) {
        if (existentes[0].Vinculado === 0) {
          idUsuarioCliente = existentes[0].Id_Usuario;
        } else {
          // Generar sufijo único para evitar colisión de UQ_Cliente_Usuario
          const rnd = Math.floor(1000 + Math.random() * 9000);
          const nomUserNuevo = `cli.${num}.${rnd}`;
          const user = await this.sql.ejecutarSP(
            'SP_Usuario_Crear',
            {
              Nombre_Usuario: nomUserNuevo,
              Correo: `${nomUserNuevo}@mundoescolar.cr`,
              ContrasenaHash: hashContrasena('Cliente2026!'),
            },
            { idUsuario: idEjecutor, salidas: { Id_Usuario_Nuevo: 'int' } },
          );
          idUsuarioCliente = user.filas[0]?.Id_Usuario ?? user.salida?.Id_Usuario_Nuevo;
        }
      } else {
        const user = await this.sql.ejecutarSP(
          'SP_Usuario_Crear',
          {
            Nombre_Usuario: nomUser,
            Correo: correoUser,
            ContrasenaHash: hashContrasena('Cliente2026!'),
          },
          { idUsuario: idEjecutor, salidas: { Id_Usuario_Nuevo: 'int' } },
        );
        idUsuarioCliente = user.filas[0]?.Id_Usuario ?? user.salida?.Id_Usuario_Nuevo;
      }
    }

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
    return r.filas[0] ?? { Id_Cliente: r.salida.Id_Cliente_Nuevo };
  }

    async crearInstitucional(dto: CrearClienteInstitucionalDto, idEjecutor: number) {
    let idUsuarioCliente = dto.idUsuario;
    if (!idUsuarioCliente) {
      const num = dto.cedulaJuridica.replace(/[^0-9]/g, '');
      const nomUser = 'inst.' + num;
      const correoUser = nomUser + '@mundoescolar.cr';

      const existentes = await this.sql.consultarQuery<{ Id_Usuario: number; Vinculado: number }>(
        `SELECT u.Id_Usuario, (SELECT COUNT(1) FROM Cliente c WHERE c.Id_Usuario = u.Id_Usuario) AS Vinculado
         FROM Usuario u WHERE u.Nombre_Usuario = @nom OR u.Correo = @correo`,
        { nom: nomUser, correo: correoUser },
      );

      if (existentes && existentes.length > 0) {
        if (existentes[0].Vinculado === 0) {
          idUsuarioCliente = existentes[0].Id_Usuario;
        } else {
          const rnd = Math.floor(1000 + Math.random() * 9000);
          const nomUserNuevo = `inst.${num}.${rnd}`;
          const user = await this.sql.ejecutarSP(
            'SP_Usuario_Crear',
            {
              Nombre_Usuario: nomUserNuevo,
              Correo: `${nomUserNuevo}@mundoescolar.cr`,
              ContrasenaHash: hashContrasena('Cliente2026!'),
            },
            { idUsuario: idEjecutor, salidas: { Id_Usuario_Nuevo: 'int' } },
          );
          idUsuarioCliente = user.filas[0]?.Id_Usuario ?? user.salida?.Id_Usuario_Nuevo;
        }
      } else {
        const user = await this.sql.ejecutarSP(
          'SP_Usuario_Crear',
          {
            Nombre_Usuario: nomUser,
            Correo: correoUser,
            ContrasenaHash: hashContrasena('Cliente2026!'),
          },
          { idUsuario: idEjecutor, salidas: { Id_Usuario_Nuevo: 'int' } },
        );
        idUsuarioCliente = user.filas[0]?.Id_Usuario ?? user.salida?.Id_Usuario_Nuevo;
      }
    }

    const r = await this.sql.ejecutarSP(
      'SP_Cliente_CrearPerfil',
      {
        Id_Tipo_Cliente: 2,
        Cedula_Juridica: dto.cedulaJuridica,
        Razon_Social: dto.razonSocial,
        Nombre_Contacto: dto.nombreContacto || 'Encargado de Compras',
        Telefono_Contacto: dto.telefonoContacto || dto.telefono || '2550-0000',
        Correo_Contacto: dto.correoContacto || 'contacto@institucion.cr',
        Telefono: dto.telefono || '2550-0000',
        Direccion: dto.direccion || 'Sin asignar',
        Id_Usuario: idUsuarioCliente,
      },
      { idUsuario: idEjecutor, salidas: { Id_Cliente_Nuevo: 'int' } },
    );
    return r.filas[0] ?? { Id_Cliente: r.salida.Id_Cliente_Nuevo };
  }

  actualizar(idCliente: number, dto: ActualizarClienteDto, idEjecutor: number) {
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
}
