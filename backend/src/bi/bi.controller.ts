import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermisosGuard } from '../auth/guards/permisos.guard';
import { RequierePermisos } from '../auth/decorators/requiere-permisos.decorator';
import { PERMISOS } from '../auth/permisos.constants';
import { BiService } from './bi.service';
import { CargarDimFechaDto } from './dto/bi.dto';

@ApiTags('Business Intelligence & Constelación DW')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('bi')
export class BiController {
  constructor(private readonly bi: BiService) {}

  @Get('dashboard')
  @RequierePermisos(PERMISOS.REPORTES_VER)
  @ApiOperation({ summary: 'Obtener métricas y dimensiones del Data Warehouse para el tablero web' })
  obtenerDashboard(@Query('tipoCliente') tipoCliente?: string) {
    return this.bi.obtenerDashboardDW(tipoCliente);
  }

  @Get('conciliacion')
  @RequierePermisos(PERMISOS.REPORTES_VER)
  @ApiOperation({ summary: 'Validar conciliación OLTP vs Data Warehouse (SP_ETL_ValidarConciliacionCargas)' })
  conciliacion() {
    return this.bi.validarConciliacion();
  }

  @Post('etl/completo')
  @RequierePermisos(PERMISOS.DBA_MANTENIMIENTO)
  @ApiOperation({ summary: 'Ejecutar carga completa de todas las dimensiones y hechos de la constelación' })
  ejecutarEtlCompleto(@Body() dto: CargarDimFechaDto) {
    return this.bi.ejecutarCargaCompleta(dto);
  }

  @Post('etl/dimensiones')
  @RequierePermisos(PERMISOS.DBA_MANTENIMIENTO)
  @ApiOperation({ summary: 'Cargar exclusivamente las dimensiones (Cliente, Producto, Servicio, etc.)' })
  cargarDimensiones() {
    return this.bi.cargarDimensiones();
  }

  @Post('etl/hechos')
  @RequierePermisos(PERMISOS.DBA_MANTENIMIENTO)
  @ApiOperation({ summary: 'Cargar exclusivamente las tablas de hechos (FactVentas, FactPagos, etc.)' })
  cargarHechos() {
    return this.bi.cargarHechos();
  }
}
