import { Injectable } from '@nestjs/common';
import { SqlService } from '../database/sql.service';
import {
  ActualizarProductoDto,
  ActualizarServicioDto,
  ConsultarProductosDto,
  ConsultarServiciosDto,
  CrearProductoDto,
  CrearServicioDto,
} from './dto/productos.dto';

@Injectable()
export class ProductosService {
  constructor(private readonly sql: SqlService) {}

  // ================= PRODUCTOS =================
  listarCatalogo() {
    return this.sql.consultarVista('VW_ProductosCatalogo');
  }

  listarInventario() {
    return this.sql.consultarVista('VW_ProductosInventario');
  }

  consultar(dto: ConsultarProductosDto) {
    return this.sql.consultarSP('SP_Producto_Consultar', {
      Id_Producto: dto.id ?? null,
      Id_Categoria: dto.idCategoria ?? null,
      TerminoBusqueda: dto.busqueda ?? null,
    });
  }

  async consultarPorId(id: number) {
    const prods = await this.consultar({ id });
    return prods[0] ?? null;
  }

  async crearProducto(dto: CrearProductoDto, idEjecutor: number) {
    const r = await this.sql.ejecutarSP(
      'SP_Producto_Crear',
      {
        Id_Categoria: dto.idCategoria,
        Nombre: dto.nombre,
        Descripcion: dto.descripcion ?? null,
        Precio_Venta: dto.precioVenta,
        Stock_Inicial: dto.stockInicial ?? 0,
        Punto_Reorden: dto.puntoReorden ?? 0,
      },
      { idUsuario: idEjecutor, salidas: { Id_Producto_Nuevo: 'int' } },
    );
    return r.filas[0] ?? { Id_Producto: r.salida.Id_Producto_Nuevo };
  }

  async actualizarProducto(id: number, dto: ActualizarProductoDto, idEjecutor: number) {
    const r = await this.sql.ejecutarSP(
      'SP_Producto_Actualizar',
      {
        Id_Producto: id,
        Id_Categoria: dto.idCategoria,
        Nombre: dto.nombre,
        Descripcion: dto.descripcion ?? null,
        Precio_Venta: dto.precioVenta,
        Punto_Reorden: dto.puntoReorden,
        Estado: dto.estado,
      },
      { idUsuario: idEjecutor },
    );
    return r.filas[0] ?? { Mensaje: 'Producto actualizado con éxito.' };
  }

  // ================= SERVICIOS =================
  consultarServicios(dto: ConsultarServiciosDto) {
    return this.sql.consultarSP('SP_Servicio_Consultar', {
      Id_Servicio: dto.id ?? null,
      TerminoBusqueda: dto.busqueda ?? null,
    });
  }

  async consultarServicioPorId(id: number) {
    const s = await this.consultarServicios({ id });
    return s[0] ?? null;
  }

  async crearServicio(dto: CrearServicioDto, idEjecutor: number) {
    const r = await this.sql.ejecutarSP(
      'SP_Servicio_Crear',
      {
        Nombre: dto.nombre,
        Descripcion: dto.descripcion ?? null,
        Precio_Base: dto.precioBase,
      },
      { idUsuario: idEjecutor, salidas: { Id_Servicio_Nuevo: 'int' } },
    );
    return r.filas[0] ?? { Id_Servicio: r.salida.Id_Servicio_Nuevo };
  }

  async actualizarServicio(id: number, dto: ActualizarServicioDto, idEjecutor: number) {
    const r = await this.sql.ejecutarSP(
      'SP_Servicio_Actualizar',
      {
        Id_Servicio: id,
        Nombre: dto.nombre,
        Descripcion: dto.descripcion ?? null,
        Precio_Base: dto.precioBase,
        Estado: dto.estado,
      },
      { idUsuario: idEjecutor },
    );
    return r.filas[0] ?? { Mensaje: 'Servicio actualizado con éxito.' };
  }

  async desactivarServicio(id: number, idEjecutor: number) {
    const r = await this.sql.ejecutarSP(
      'SP_Servicio_Desactivar',
      { Id_Servicio: id },
      { idUsuario: idEjecutor },
    );
    return r.filas[0] ?? { Mensaje: 'Servicio desactivado con éxito.' };
  }
}
