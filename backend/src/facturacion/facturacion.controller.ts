import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermisosGuard } from '../auth/guards/permisos.guard';
import { RequierePermisos } from '../auth/decorators/requiere-permisos.decorator';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator';
import { UsuarioSesion } from '../auth/interfaces/usuario-sesion.interface';
import { PERMISOS } from '../auth/permisos.constants';
import { FacturacionService } from './facturacion.service';
import { AnularFacturaDto, ConsultarFacturasDto, GenerarFacturaDto } from './dto/facturacion.dto';

@ApiTags('Facturación Fiscal')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('facturas')
export class FacturacionController {
  constructor(private readonly facturacion: FacturacionService) {}

  @Get('vista')
  @RequierePermisos(PERMISOS.FACTURACION_EMITIR)
  @ApiOperation({ summary: 'Listar todas las facturas consolidadas con saldos (VW_Facturas)' })
  facturasVista() {
    return this.facturacion.listarFacturasVista();
  }

  @Get()
  @RequierePermisos(PERMISOS.FACTURACION_EMITIR)
  @ApiOperation({ summary: 'Consultar facturas con filtros de cliente, estado y venta (SP_Factura_Consultar)' })
  consultar(@Query() query: ConsultarFacturasDto) {
    return this.facturacion.consultar(query);
  }

  @Get(':id')
  @RequierePermisos(PERMISOS.FACTURACION_EMITIR)
  @ApiOperation({ summary: 'Consultar una factura fiscal por ID' })
  async consultarPorId(@Param('id', ParseIntPipe) id: number) {
    const f = await this.facturacion.consultarPorId(id);
    if (!f) throw new NotFoundException('Factura no encontrada');
    return f;
  }

  @Post()
  @RequierePermisos(PERMISOS.FACTURACION_EMITIR)
  @ApiOperation({ summary: 'Emitir factura fiscal para una orden de venta confirmada (SP_Factura_Generar)' })
  generar(@Body() dto: GenerarFacturaDto, @UsuarioActual() u: UsuarioSesion) {
    return this.facturacion.generarFactura(dto, u.idUsuario);
  }

  @Post(':id/anular')
  @RequierePermisos(PERMISOS.FACTURACION_EMITIR)
  @ApiOperation({ summary: 'Anular factura fiscal y revertir sus pagos (SP_Factura_Anular)' })
  anular(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AnularFacturaDto,
    @UsuarioActual() u: UsuarioSesion,
  ) {
    return this.facturacion.anularFactura(id, dto, u.idUsuario);
  }
}
