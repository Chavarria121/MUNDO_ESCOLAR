import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermisosGuard } from '../auth/guards/permisos.guard';
import { RequierePermisos } from '../auth/decorators/requiere-permisos.decorator';
import { PERMISOS } from '../auth/permisos.constants';
import { ReportesService } from './reportes.service';
import {
  ActividadUsuarioReporteDto,
  ComprasPorProveedorDto,
  CuentasVencidasDto,
  FacturasPendientesDto,
  MovimientosInventarioReporteDto,
  ProductosMasVendidosDto,
  VentasPorClienteDto,
  VentasPorPeriodoDto,
} from './dto/reportes.dto';

@ApiTags('Reportes Analíticos (Funciones de Tabla TF_*)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportes: ReportesService) {}

  @Get('productos-mas-vendidos')
  @RequierePermisos(PERMISOS.REPORTES_VER)
  @ApiOperation({ summary: 'Productos más vendidos por rango de fechas (TF_ProductosMasVendidos)' })
  productosMasVendidos(@Query() query: ProductosMasVendidosDto) {
    return this.reportes.productosMasVendidos(query);
  }

  @Get('ventas-periodo')
  @RequierePermisos(PERMISOS.REPORTES_VER)
  @ApiOperation({ summary: 'Análisis de ventas multidimensional por período (TF_VentasPorPeriodo)' })
  ventasPorPeriodo(@Query() query: VentasPorPeriodoDto) {
    return this.reportes.ventasPorPeriodo(query);
  }

  @Get('ventas-cliente')
  @RequierePermisos(PERMISOS.REPORTES_VER)
  @ApiOperation({ summary: 'Historial y consolidado de ventas por cliente (TF_VentasPorCliente)' })
  ventasPorCliente(@Query() query: VentasPorClienteDto) {
    return this.reportes.ventasPorCliente(query);
  }

  @Get('compras-proveedor')
  @RequierePermisos(PERMISOS.REPORTES_VER)
  @ApiOperation({ summary: 'Compras realizadas a un proveedor específico (TF_ComprasPorProveedor)' })
  comprasPorProveedor(@Query() query: ComprasPorProveedorDto) {
    return this.reportes.comprasPorProveedor(query);
  }

  @Get('cuentas-vencidas')
  @RequierePermisos(PERMISOS.REPORTES_VER)
  @ApiOperation({ summary: 'Cuentas y facturas con plazo vencido para gestión de cobro (TF_CuentasVencidas)' })
  cuentasVencidas(@Query() query: CuentasVencidasDto) {
    return this.reportes.cuentasVencidas(query);
  }

  @Get('facturas-pendientes')
  @RequierePermisos(PERMISOS.REPORTES_VER)
  @ApiOperation({ summary: 'Facturas pendientes de cobro y saldos (TF_FacturasPendientes)' })
  facturasPendientes(@Query() query: FacturasPendientesDto) {
    return this.reportes.facturasPendientes(query);
  }

  @Get('movimientos-inventario')
  @RequierePermisos(PERMISOS.REPORTES_VER)
  @ApiOperation({ summary: 'Auditoría de movimientos de kárdex (TF_MovimientosInventario)' })
  movimientosInventario(@Query() query: MovimientosInventarioReporteDto) {
    return this.reportes.movimientosInventario(query);
  }

  @Get('actividad-usuario')
  @RequierePermisos(PERMISOS.REPORTES_VER)
  @ApiOperation({ summary: 'Consolidado de acciones de un usuario específico (TF_ActividadUsuario)' })
  actividadUsuario(@Query() query: ActividadUsuarioReporteDto) {
    return this.reportes.actividadUsuario(query);
  }
}
