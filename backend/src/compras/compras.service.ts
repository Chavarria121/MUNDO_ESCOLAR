import { Injectable } from '@nestjs/common';
import { SqlService } from '../database/sql.service';
import {
  AgregarProductoCompraDto,
  AnularCompraDto,
  ConsultarComprasDto,
  CrearCompraDto,
  ModificarDetalleCompraDto,
} from './dto/compras.dto';

@Injectable()
export class ComprasService {
  constructor(private readonly sql: SqlService) {}

  listarDetallesVista() {
    return this.sql.consultarVista('VW_ComprasDetalle');
  }

  consultar(dto: ConsultarComprasDto) {
    return this.sql.consultarSP('SP_Compra_Consultar', {
      Id_Compra: dto.id ?? null,
      FechaInicio: dto.fechaInicio ? new Date(dto.fechaInicio) : null,
      FechaFin: dto.fechaFin ? new Date(dto.fechaFin) : null,
      Id_Proveedor: dto.idProveedor ?? null,
      Id_Estado_Compra: dto.idEstadoCompra ?? null,
    });
  }

  async consultarPorId(id: number) {
    const cabeceras = await this.consultar({ id });
    const cabecera = cabeceras[0] ?? null;
    if (!cabecera) return null;

    // Obtener líneas de detalle asociadas desde la vista VW_ComprasDetalle
    const todosDetalles = await this.sql.consultarVista('VW_ComprasDetalle');
    const detalles = todosDetalles.filter((d: any) => d.Id_Compra === id);
    return { ...cabecera, detalles };
  }

  async crearCompra(dto: CrearCompraDto, idUsuario: number) {
    const r = await this.sql.ejecutarSP(
      'SP_Compra_Crear',
      {
        Id_Proveedor: dto.idProveedor,
        Id_Usuario: idUsuario,
      },
      { idUsuario, salidas: { Id_Compra_Nueva: 'int' } },
    );
    return r.filas[0] ?? { Id_Compra: r.salida.Id_Compra_Nueva };
  }

  async agregarProducto(idCompra: number, dto: AgregarProductoCompraDto, idUsuario: number) {
    const r = await this.sql.ejecutarSP(
      'SP_Compra_AgregarProducto',
      {
        Id_Compra: idCompra,
        Id_Producto: dto.idProducto,
        Cantidad: dto.cantidad,
        Costo_Unitario: dto.costoUnitario ?? null,
      },
      { idUsuario },
    );
    return r.filas[0] ?? { Mensaje: 'Producto agregado a la compra con éxito.' };
  }

  async modificarDetalle(
    idCompraProducto: number,
    dto: ModificarDetalleCompraDto,
    idUsuario: number,
  ) {
    const r = await this.sql.ejecutarSP(
      'SP_Compra_ModificarDetalle',
      {
        Id_Compra_Producto: idCompraProducto,
        Cantidad: dto.cantidad,
        Costo_Unitario: dto.costoUnitario,
      },
      { idUsuario },
    );
    return r.filas[0] ?? { Mensaje: 'Detalle de compra modificado con éxito.' };
  }

  async eliminarDetalle(idCompraProducto: number, idUsuario: number) {
    const r = await this.sql.ejecutarSP(
      'SP_Compra_EliminarDetalle',
      { Id_Compra_Producto: idCompraProducto },
      { idUsuario },
    );
    return r.filas[0] ?? { Mensaje: 'Detalle eliminado con éxito.' };
  }

  async calcularTotal(idCompra: number) {
    return this.sql.consultarSPUno('SP_Compra_CalcularTotal', { Id_Compra: idCompra });
  }

  async confirmarCompra(idCompra: number, idUsuario: number) {
    const r = await this.sql.ejecutarSP(
      'SP_Compra_Confirmar',
      {
        Id_Compra: idCompra,
        Id_Usuario: idUsuario,
      },
      { idUsuario },
    );
    return r.filas[0] ?? { Mensaje: 'Compra confirmada y existencias ingresadas al stock.' };
  }

  async anularCompra(idCompra: number, dto: AnularCompraDto, idUsuario: number) {
    const r = await this.sql.ejecutarSP(
      'SP_Compra_Anular',
      {
        Id_Compra: idCompra,
        Id_Usuario: idUsuario,
        Motivo: dto.motivo,
      },
      { idUsuario },
    );
    return r.filas[0] ?? { Mensaje: 'Compra anulada con éxito.' };
  }
}
