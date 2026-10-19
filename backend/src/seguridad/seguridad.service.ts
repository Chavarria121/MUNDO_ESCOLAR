import { Injectable } from '@nestjs/common';
import { SqlService } from '../database/sql.service';
import { hashContrasena } from '../auth/password.util';
import {
  ActualizarRolDto, CrearRolDto, CrearUsuarioDto, GuardarPermisoDto,
} from './dto/seguridad.dto';

/**
 * Cada método es un pase directo a un procedimiento almacenado.
 * El idEjecutor se envía como SESSION_CONTEXT para que los triggers auditen en Bitacora.
 */
@Injectable()
export class SeguridadService {
  constructor(private readonly sql: SqlService) {}

  // ---------- Usuarios ----------
  async crearUsuario(dto: CrearUsuarioDto, idEjecutor: number) {
    const r = await this.sql.ejecutarSP(
      'SP_Usuario_Crear',
      { Nombre_Usuario: dto.nombreUsuario, Correo: dto.correo, ContrasenaHash: hashContrasena(dto.contrasena) },
      { idUsuario: idEjecutor, salidas: { Id_Usuario_Nuevo: 'int' } },
    );
    return r.filas[0] ?? { Id_Usuario: r.salida.Id_Usuario_Nuevo };
  }

  desactivarUsuario(idUsuario: number, idEjecutor: number) {
    return this.sql.consultarSPUno('SP_Usuario_Desactivar',
      { Id_Usuario: idUsuario, Id_Usuario_Ejecutor: idEjecutor }, { idUsuario: idEjecutor });
  }

  asignarRol(idUsuario: number, idRol: number, idEjecutor: number) {
    return this.sql.consultarSPUno('SP_Usuario_AsignarRol', { Id_Usuario: idUsuario, Id_Rol: idRol }, { idUsuario: idEjecutor });
  }

  removerRol(idUsuario: number, idRol: number, idEjecutor: number) {
    return this.sql.consultarSPUno('SP_Usuario_RemoverRol', { Id_Usuario: idUsuario, Id_Rol: idRol }, { idUsuario: idEjecutor });
  }

  permisosDeUsuario(idUsuario: number, idEjecutor: number) {
    return this.sql.consultarSP('SP_Permiso_ConsultarUsuario', { Id_Usuario: idUsuario }, { idUsuario: idEjecutor });
  }

  // ---------- Roles ----------
  consultarRoles(idRol: number | null, idEjecutor: number) {
    return this.sql.consultarSP('SP_Rol_Consultar', { Id_Rol: idRol }, { idUsuario: idEjecutor });
  }

  crearRol(dto: CrearRolDto, idEjecutor: number) {
    return this.sql.consultarSPUno('SP_Rol_Crear', { Nombre: dto.nombre, Descripcion: dto.descripcion }, { idUsuario: idEjecutor });
  }

  actualizarRol(idRol: number, dto: ActualizarRolDto, idEjecutor: number) {
    return this.sql.consultarSPUno('SP_Rol_Actualizar',
      { Id_Rol: idRol, Nombre: dto.nombre, Descripcion: dto.descripcion, Estado: dto.estado }, { idUsuario: idEjecutor });
  }

  asignarPermisoARol(idRol: number, idPermiso: number, idEjecutor: number) {
    return this.sql.consultarSPUno('SP_Rol_AsignarPermiso', { Id_Rol: idRol, Id_Permiso: idPermiso }, { idUsuario: idEjecutor });
  }

  removerPermisoDeRol(idRol: number, idPermiso: number, idEjecutor: number) {
    return this.sql.consultarSPUno('SP_Rol_RemoverPermiso', { Id_Rol: idRol, Id_Permiso: idPermiso }, { idUsuario: idEjecutor });
  }

  // ---------- Permisos ----------
  consultarPermisos(idPermiso: number | null, idEjecutor: number) {
    return this.sql.consultarSP('SP_Permiso_Consultar', { Id_Permiso: idPermiso }, { idUsuario: idEjecutor });
  }

  crearPermiso(dto: GuardarPermisoDto, idEjecutor: number) {
    return this.sql.consultarSPUno('SP_Permiso_Crear', { Nombre: dto.nombre, Descripcion: dto.descripcion }, { idUsuario: idEjecutor });
  }

  actualizarPermiso(idPermiso: number, dto: GuardarPermisoDto, idEjecutor: number) {
    return this.sql.consultarSPUno('SP_Permiso_Actualizar',
      { Id_Permiso: idPermiso, Nombre: dto.nombre, Descripcion: dto.descripcion }, { idUsuario: idEjecutor });
  }
}
