import { Injectable } from '@nestjs/common';
import { SqlService } from '../database/sql.service';
import {
  AgregarProductoVentaDto,
  AgregarServicioVentaDto,
  AnularVentaDto,
  ConsultarVentasDto,
  CrearVentaDto,
  ModificarDetalleVentaDto,
} from './dto/ventas.dto';

@Injectable()
export class VentasService {
  constructor(private readonly sql: SqlService) {}

  listarVentasVista() {
    return this.sql.consultarVista('VW_Ventas');
  }

  listarPendientesFacturacion() {
    return this.sql.consultarVista('VW_VentasPendientesFacturacion');
  }

  consultar(dto: ConsultarVentasDto) {
    return this.sql.consultarSP('SP_Venta_Consultar', {
      Id_Venta: dto.id ?? null,
      FechaInicio: dto.fechaInicio ? new Date(dto.fechaInicio) : null,
      FechaFin: dto.fechaFin ? new Date(dto.fechaFin) : null,
      Id_Cliente: dto.idCliente ?? null,
      Id_Estado_Venta: dto.idEstadoVenta ?? null,
    });
  }

  async consultarPorId(id: number) {
    const ventas = await this.consultar({ id });
    const venta = ventas[0] ?? null;
    if (!venta) return null;

    const [todosProductos, todosServicios] = await Promise.all([
      this.sql.consultarVista('VW_VentaProductos'),
      this.sql.consultarVista('VW_VentaServicios'),
    ]);

    const productos = todosProductos.filter((p: any) => p.Id_Venta === id);
    const servicios = todosServicios.filter((s: any) => s.Id_Venta === id);

    return { ...venta, productos, servicios };
  }

  async crearVenta(dto: CrearVentaDto, idUsuario: number) {
    const r = await this.sql.ejecutarSP(
      'SP_Venta_Crear',
      {
        Id_Cliente: dto.idCliente,
        Id_Usuario: idUsuario,
        Id_Condicion_Pago: dto.idCondicionPago,
      },
      { idUsuario, salidas: { Id_Venta_Nueva: 'int' } },
    );
    return r.filas[0] ?? { Id_Venta: r.salida.Id_Venta_Nueva };
  }

  async agregarProducto(idVenta: number, dto: AgregarProductoVentaDto, idUsuario: number) {
    const r = await this.sql.ejecutarSP(
      'SP_Venta_AgregarProducto',
      {
        Id_Venta: idVenta,
        Id_Producto: dto.idProducto,
        Cantidad: dto.cantidad,
        Precio_Unitario: dto.precioUnitario ?? null,
      },
      { idUsuario },
    );
    return r.filas[0] ?? { Mensaje: 'Producto agregado a la venta con éxito.' };
  }

  async agregarServicio(idVenta: number, dto: AgregarServicioVentaDto, idUsuario: number) {
    const r = await this.sql.ejecutarSP(
      'SP_Venta_AgregarServicio',
      {
        Id_Venta: idVenta,
        Id_Servicio: dto.idServicio,
        Cantidad: dto.cantidad,
        Precio_Unitario: dto.precioUnitario ?? null,
      },
      { idUsuario },
    );
    return r.filas[0] ?? { Mensaje: 'Servicio agregado a la venta con éxito.' };
  }

  async modificarDetalle(
    tipoDetalle: 'Producto' | 'Servicio',
    idDetalle: number,
    dto: ModificarDetalleVentaDto,
    idUsuario: number,
  ) {
    const r = await this.sql.ejecutarSP(
      'SP_Venta_ModificarDetalle',
      {
        TipoDetalle: tipoDetalle,
        Id_Detalle: idDetalle,
        Cantidad: dto.cantidad,
        Precio_Unitario: dto.precioUnitario,
      },
      { idUsuario },
    );
    return r.filas[0] ?? { Mensaje: 'Detalle de venta modificado con éxito.' };
  }

  async eliminarDetalle(
    tipoDetalle: 'Producto' | 'Servicio',
    idDetalle: number,
    idUsuario: number,
  ) {
    const r = await this.sql.ejecutarSP(
      'SP_Venta_EliminarDetalle',
      {
        TipoDetalle: tipoDetalle,
        Id_Detalle: idDetalle,
      },
      { idUsuario },
    );
    return r.filas[0] ?? { Mensaje: 'Detalle eliminado con éxito.' };
  }

  async calcularTotales(idVenta: number) {
    return this.sql.consultarSPUno('SP_Venta_CalcularTotales', { Id_Venta: idVenta });
  }

  async confirmarVenta(idVenta: number, idUsuario: number) {
    const r = await this.sql.ejecutarSP(
      'SP_Venta_Confirmar',
      {
        Id_Venta: idVenta,
        Id_Usuario: idUsuario,
      },
      { idUsuario },
    );
    return r.filas[0] ?? { Mensaje: 'Venta confirmada, existencias rebajadas y factura generada con éxito.' };
  }

  async anularVenta(idVenta: number, dto: AnularVentaDto, idUsuario: number) {
    const r = await this.sql.ejecutarSP(
      'SP_Venta_Anular',
      {
        Id_Venta: idVenta,
        Id_Usuario: idUsuario,
        Motivo: dto.motivo,
      },
      { idUsuario },
    );
    return r.filas[0] ?? { Mensaje: 'Venta anulada y existencias reingresadas a bodega con éxito.' };
  }
}
