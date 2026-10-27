import { Injectable, Logger } from '@nestjs/common';
import { SqlService } from '../database/sql.service';
import { CargarDimFechaDto } from './dto/bi.dto';

@Injectable()
export class BiService {
  private readonly logger = new Logger(BiService.name);

  constructor(private readonly sql: SqlService) {}

  async cargarDimFecha(dto: CargarDimFechaDto) {
    return this.sql.consultarSP('SP_ETL_CargarDimFecha', {
      AnioInicio: dto.anioInicio ?? 2024,
      AnioFin: dto.anioFin ?? 2030,
    });
  }

  async cargarDimensiones() {
    const [cliente, prod, serv, cond, metodo, vend] = await Promise.all([
      this.sql.consultarSP('SP_ETL_CargarDimCliente'),
      this.sql.consultarSP('SP_ETL_CargarDimProducto'),
      this.sql.consultarSP('SP_ETL_CargarDimServicio'),
      this.sql.consultarSP('SP_ETL_CargarDimCondicionPago'),
      this.sql.consultarSP('SP_ETL_CargarDimMetodoPago'),
      this.sql.consultarSP('SP_ETL_CargarDimVendedor'),
    ]);
    return {
      DimCliente: cliente[0],
      DimProducto: prod[0],
      DimServicio: serv[0],
      DimCondicionPago: cond[0],
      DimMetodoPago: metodo[0],
      DimVendedor: vend[0],
    };
  }

  async cargarHechos() {
    const [ventas, vtaProd, vtaServ, pagos] = await Promise.all([
      this.sql.consultarSP('SP_ETL_CargarFactVentas'),
      this.sql.consultarSP('SP_ETL_CargarFactVentaProducto'),
      this.sql.consultarSP('SP_ETL_CargarFactVentaServicio'),
      this.sql.consultarSP('SP_ETL_CargarFactPagos'),
    ]);
    return {
      FactVentas: ventas[0],
      FactVentaProducto: vtaProd[0],
      FactVentaServicio: vtaServ[0],
      FactPagos: pagos[0],
    };
  }

  async ejecutarCargaCompleta(dto: CargarDimFechaDto) {
    this.logger.log('Iniciando ejecución completa de ETL de Constelación...');
    await this.cargarDimFecha(dto);
    const dimensiones = await this.cargarDimensiones();
    const hechos = await this.cargarHechos();
    const conciliacion = await this.validarConciliacion();
    return {
      mensaje: 'Proceso ETL de Constelación completado exitosamente.',
      dimensiones,
      hechos,
      conciliacion,
    };
  }

  validarConciliacion() {
    return this.sql.consultarSP('SP_ETL_ValidarConciliacionCargas');
  }

  async obtenerDashboardDW(tipoCliente?: string) {
    const params = tipoCliente ? { tipoCliente } : {};
    const whereClienteVentas = tipoCliente ? 'WHERE c.Tipo_Cliente = @tipoCliente' : '';
    const whereClienteJoin = tipoCliente
      ? 'INNER JOIN dw.FactVentas fv_filter ON fvp.Id_Venta = fv_filter.Id_Venta INNER JOIN dw.DimCliente c ON fv_filter.Sk_Cliente = c.Sk_Cliente WHERE c.Tipo_Cliente = @tipoCliente'
      : '';
    const whereClientePagos = tipoCliente
      ? 'INNER JOIN dw.FactVentas fv_filter ON fp.Id_Factura = fv_filter.Id_Venta INNER JOIN dw.DimCliente c ON fv_filter.Sk_Cliente = c.Sk_Cliente WHERE c.Tipo_Cliente = @tipoCliente'
      : '';

    const [kpisRes, pagosRes, unidadesRes, categorias, meses, metodos, vendedores, tiposCliente] =
      await Promise.all([
        this.sql.consultarQuery(`
          SELECT 
            ISNULL(SUM(fv.Monto_Total), 0) AS totalVentas,
            COUNT(*) AS totalFacturas,
            ISNULL(AVG(fv.Monto_Total), 0) AS ticketPromedio
          FROM dw.FactVentas fv
          ${tipoCliente ? 'INNER JOIN dw.DimCliente c ON fv.Sk_Cliente = c.Sk_Cliente' : ''}
          ${whereClienteVentas}
        `, params),

        this.sql.consultarQuery(`
          SELECT ISNULL(SUM(fp.Monto_Pagado), 0) AS totalPagos 
          FROM dw.FactPagos fp
          ${whereClientePagos}
        `, params),

        this.sql.consultarQuery(`
          SELECT ISNULL(SUM(fvp.Cantidad), 0) AS totalUnidades 
          FROM dw.FactVentaProducto fvp
          ${whereClienteJoin}
        `, params),

        this.sql.consultarQuery(`
          SELECT 
            p.Categoria AS categoria,
            ISNULL(SUM(fvp.Subtotal), 0) AS subtotal,
            ISNULL(SUM(fvp.Cantidad), 0) AS cantidad
          FROM dw.FactVentaProducto fvp
          INNER JOIN dw.DimProducto p ON fvp.Sk_Producto = p.Sk_Producto
          ${whereClienteJoin ? whereClienteJoin : ''}
          GROUP BY p.Categoria
          ORDER BY subtotal DESC
        `, params),

        this.sql.consultarQuery(`
          SELECT 
            f.Mes AS mes,
            f.Nombre_Mes AS nombreMes,
            ISNULL(SUM(fv.Monto_Total), 0) AS total
          FROM dw.FactVentas fv
          INNER JOIN dw.DimFecha f ON fv.Sk_Fecha = f.Sk_Fecha
          ${tipoCliente ? 'INNER JOIN dw.DimCliente c ON fv.Sk_Cliente = c.Sk_Cliente' : ''}
          ${whereClienteVentas}
          GROUP BY f.Mes, f.Nombre_Mes
          ORDER BY f.Mes ASC
        `, params),

        this.sql.consultarQuery(`
          SELECT 
            mp.Nombre AS metodo,
            ISNULL(SUM(fp.Monto_Pagado), 0) AS total
          FROM dw.FactPagos fp
          INNER JOIN dw.DimMetodoPago mp ON fp.Sk_Metodo_Pago = mp.Sk_Metodo_Pago
          ${whereClientePagos}
          GROUP BY mp.Nombre
          ORDER BY total DESC
        `, params),

        this.sql.consultarQuery(`
          SELECT 
            vend.Nombre_Usuario AS vendedor,
            vend.Rol AS rol,
            ISNULL(SUM(fv.Monto_Total), 0) AS total
          FROM dw.FactVentas fv
          INNER JOIN dw.DimVendedor vend ON fv.Sk_Vendedor = vend.Sk_Vendedor
          ${tipoCliente ? 'INNER JOIN dw.DimCliente c ON fv.Sk_Cliente = c.Sk_Cliente' : ''}
          ${whereClienteVentas}
          GROUP BY vend.Nombre_Usuario, vend.Rol
          ORDER BY total DESC
        `, params),

        this.sql.consultarQuery(`
          SELECT DISTINCT Tipo_Cliente AS tipoCliente 
          FROM dw.DimCliente 
          WHERE Tipo_Cliente IS NOT NULL
        `),
      ]);

    const kpiBase = kpisRes[0] || { totalVentas: 0, totalFacturas: 0, ticketPromedio: 0 };
    const totalPagos = pagosRes[0]?.totalPagos || 0;
    const totalUnidades = unidadesRes[0]?.totalUnidades || 0;

    const totalMetodos = metodos.reduce((acc, m) => acc + (Number(m.total) || 0), 0);
    const metodosConPorcentaje = metodos.map((m) => ({
      ...m,
      porcentaje: totalMetodos > 0 ? Number(((Number(m.total) / totalMetodos) * 100).toFixed(1)) : 0,
    }));

    return {
      kpis: {
        totalVentas: Number(kpiBase.totalVentas || 0),
        totalFacturas: Number(kpiBase.totalFacturas || 0),
        ticketPromedio: Number(kpiBase.ticketPromedio || 0),
        totalPagos: Number(totalPagos),
        totalUnidades: Number(totalUnidades),
      },
      ventasPorCategoria: categorias.map(c => ({
        categoria: c.categoria,
        subtotal: Number(c.subtotal || 0),
        cantidad: Number(c.cantidad || 0)
      })),
      ventasPorMes: meses.map(m => ({
        mes: Number(m.mes),
        nombreMes: m.nombreMes,
        total: Number(m.total || 0)
      })),
      metodosPago: metodosConPorcentaje.map(m => ({
        metodo: m.metodo,
        total: Number(m.total || 0),
        porcentaje: Number(m.porcentaje || 0)
      })),
      ventasPorVendedor: vendedores.map(v => ({
        vendedor: v.vendedor,
        rol: v.rol,
        total: Number(v.total || 0)
      })),
      tiposCliente: tiposCliente.map((t) => t.tipoCliente),
      filtroActivo: tipoCliente || 'Todos',
      ultimaActualizacion: new Date().toISOString(),
    };
  }
}
