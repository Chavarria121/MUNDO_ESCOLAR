import { Injectable, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(ComprasService.name);

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

    // Obtener datos de logística y tiempos de entrega desde FactCompras o Movimiento_Inventario
    let logistica: any = null;
    try {
      const factRes = await this.sql.consultarQuery(`
        SELECT TOP 1 
          fc.Fecha_Orden,
          fc.Fecha_Prometida,
          fc.Fecha_Recepcion_Real,
          fc.Dias_Tardanza_Entrega,
          fc.Cumplio_A_Tiempo
        FROM dw.FactCompras fc
        WHERE fc.Id_Compra = ${id}
      `);
      if (factRes && factRes.length > 0) {
        logistica = factRes[0];
      }
    } catch {
      // Ignorar si dw no está disponible
    }

    // Si aún no está en FactCompras pero ya se recepcionó en Kárdex
    if (!logistica && cabecera.Estado_Compra === 'Recibida') {
      try {
        const movRes = await this.sql.consultarQuery(`
          SELECT TOP 1 mi.Fecha AS Fecha_Recepcion_Real
          FROM dbo.Movimiento_Inventario mi
          WHERE mi.Motivo LIKE '%Compra #${id}%'
          ORDER BY mi.Fecha DESC
        `);
        if (movRes && movRes.length > 0) {
          logistica = {
            Fecha_Orden: cabecera.Fecha_Compra,
            Fecha_Recepcion_Real: movRes[0].Fecha_Recepcion_Real,
          };
        }
      } catch {}
    }

    // Datos detallados del proveedor y su Lead Time pactado
    let proveedorInfo: any = null;
    try {
      const provRes = await this.sql.consultarQuery(`
        SELECT TOP 1
          v.Nombre_O_RazonSocial,
          v.Numero_Identificacion,
          v.Tipo_Proveedor,
          v.Telefono_Contacto,
          v.Correo_Contacto,
          p.Direccion,
          ISNULL(dp.Lead_Time_Pactado_Dias, 3) AS Lead_Time_Pactado_Dias
        FROM dbo.Compra c
        INNER JOIN dbo.Proveedor p ON c.Id_Proveedor = p.Id_Proveedor
        INNER JOIN dbo.VW_ProveedoresActivos v ON p.Id_Proveedor = v.Id_Proveedor
        LEFT JOIN dw.DimProveedor dp ON p.Id_Proveedor = dp.Id_Proveedor
        WHERE c.Id_Compra = ${id}
      `);
      if (provRes && provRes.length > 0) {
        proveedorInfo = provRes[0];
      }
    } catch {}

    return { 
      ...cabecera, 
      detalles, 
      productos: detalles,
      logistica,
      proveedorInfo,
    };
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

  async confirmarCompra(idCompra: number, idUsuario: number, fechaRecepcion?: string) {
    const r = await this.sql.ejecutarSP(
      'SP_Compra_Confirmar',
      {
        Id_Compra: idCompra,
        Id_Usuario: idUsuario,
        Fecha_Recepcion: fechaRecepcion ? new Date(fechaRecepcion) : null,
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

  async obtenerSugerenciasReabastecimiento() {
    return this.sql.consultarSP('SP_ObtenerSugerenciasReabastecimiento', {});
  }

  async generarOrdenesSugeridas(
    dto: { ordenes: Array<{ idProveedor: number; items: Array<{ idProducto: number; cantidad: number; costoUnitario?: number }> }> },
    idUsuario: number,
  ) {
    const ordenesCreadas: any[] = [];
    for (const ord of (dto.ordenes || [])) {
      if (!ord.items?.length) continue;
      const resCompra = await this.crearCompra({ idProveedor: ord.idProveedor }, idUsuario);
      const idCompra = resCompra.Id_Compra;
      try {
        for (const it of ord.items) {
          await this.agregarProducto(
            idCompra,
            {
              idProducto: it.idProducto,
              cantidad: it.cantidad,
              costoUnitario: it.costoUnitario,
            },
            idUsuario,
          );
        }
        ordenesCreadas.push({ idCompra, idProveedor: ord.idProveedor, totalItems: ord.items.length });
      } catch (err) {
        this.logger.error(`Fallo al agregar líneas a la orden sugerida #${idCompra}. Anulando orden preventiva...`, err);
        try {
          await this.anularCompra(idCompra, { motivo: 'Anulación automática por error en agregado de líneas de orden sugerida' }, idUsuario);
        } catch (anulaErr) {
          this.logger.error(`No se pudo anular la orden #${idCompra}:`, anulaErr);
        }
        throw err;
      }
    }
    return {
      mensaje: 'Órdenes de compra generadas exitosamente en estado Pendiente',
      totalOrdenes: ordenesCreadas.length,
      ordenes: ordenesCreadas,
    };
  }
}
