import { Injectable } from '@nestjs/common';
import { SqlService } from '../database/sql.service';
import {
  ActualizarProductoProveedorDto,
  ActualizarProveedorDto,
  AsociarProductoProveedorDto,
  ConsultarProductoProveedorDto,
  ConsultarProveedoresDto,
  CrearProveedorInstitucionalDto,
  CrearProveedorParticularDto,
} from './dto/proveedores.dto';

@Injectable()
export class ProveedoresService {
  constructor(private readonly sql: SqlService) {}

  listarActivos() {
    return this.sql.consultarVista('VW_ProveedoresActivos');
  }

  consultar(dto: ConsultarProveedoresDto) {
    return this.sql.consultarSP('SP_Proveedor_Consultar', {
      Id_Proveedor: dto.id ?? null,
      TerminoBusqueda: dto.busqueda ?? null,
    });
  }

  async consultarPorId(id: number) {
    const list = await this.consultar({ id });
    return list[0] ?? null;
  }

  async crearParticular(dto: CrearProveedorParticularDto, idEjecutor: number) {
    const r = await this.sql.ejecutarSP(
      'SP_Proveedor_Crear',
      {
        Id_Tipo_Proveedor: 1,
        Correo: dto.correo,
        Telefono: dto.telefono,
        Direccion: dto.direccion,
        Identificacion: dto.identificacion,
        Nombre: dto.nombre,
        Apellido1: dto.apellido1,
        Apellido2: dto.apellido2 ?? null,
        Razon_Social: null,
        Cedula_Juridica: null,
        Nombre_Contacto: null,
        Telefono_Contacto: null,
        Correo_Contacto: null,
      },
      { idUsuario: idEjecutor, salidas: { Id_Proveedor_Nuevo: 'int' } },
    );
    return r.filas[0] ?? { Id_Proveedor: r.salida.Id_Proveedor_Nuevo };
  }

  async crearInstitucional(dto: CrearProveedorInstitucionalDto, idEjecutor: number) {
    const r = await this.sql.ejecutarSP(
      'SP_Proveedor_Crear',
      {
        Id_Tipo_Proveedor: 2,
        Correo: dto.correo,
        Telefono: dto.telefono,
        Direccion: dto.direccion,
        Identificacion: null,
        Nombre: null,
        Apellido1: null,
        Apellido2: null,
        Razon_Social: dto.razonSocial,
        Cedula_Juridica: dto.cedulaJuridica,
        Nombre_Contacto: dto.nombreContacto,
        Telefono_Contacto: dto.telefonoContacto,
        Correo_Contacto: dto.correoContacto,
      },
      { idUsuario: idEjecutor, salidas: { Id_Proveedor_Nuevo: 'int' } },
    );
    return r.filas[0] ?? { Id_Proveedor: r.salida.Id_Proveedor_Nuevo };
  }

  async actualizar(id: number, dto: ActualizarProveedorDto, idEjecutor: number) {
    const r = await this.sql.ejecutarSP(
      'SP_Proveedor_Actualizar',
      {
        Id_Proveedor: id,
        Correo: dto.correo,
        Telefono: dto.telefono,
        Direccion: dto.direccion,
        Estado: dto.estado,
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
    return r.filas[0] ?? { Mensaje: 'Proveedor actualizado con éxito.' };
  }

  // ================= PRODUCTO - PROVEEDOR =================
  listarProductoProveedorVista() {
    return this.sql.consultarVista('VW_ProductoProveedor');
  }

  consultarProductoProveedor(dto: ConsultarProductoProveedorDto) {
    return this.sql.consultarSP('SP_ProductoProveedor_Consultar', {
      Id_Producto: dto.idProducto ?? null,
      Id_Proveedor: dto.idProveedor ?? null,
    });
  }

  async asociarProductoProveedor(dto: AsociarProductoProveedorDto, idEjecutor: number) {
    const r = await this.sql.ejecutarSP(
      'SP_ProductoProveedor_Asociar',
      {
        Id_Producto: dto.idProducto,
        Id_Proveedor: dto.idProveedor,
        Precio_Compra: dto.precioCompra,
        EsPrincipal: dto.esPrincipal,
      },
      { idUsuario: idEjecutor },
    );
    return r.filas[0] ?? { Mensaje: 'Asociación producto-proveedor creada con éxito.' };
  }

  async actualizarProductoProveedor(
    idProductoProveedor: number,
    dto: ActualizarProductoProveedorDto,
    idEjecutor: number,
  ) {
    const r = await this.sql.ejecutarSP(
      'SP_ProductoProveedor_Actualizar',
      {
        Id_Producto_Proveedor: idProductoProveedor,
        Precio_Compra: dto.precioCompra,
        EsPrincipal: dto.esPrincipal,
        Estado: dto.estado,
      },
      { idUsuario: idEjecutor },
    );
    return r.filas[0] ?? { Mensaje: 'Asociación actualizada con éxito.' };
  }
}
