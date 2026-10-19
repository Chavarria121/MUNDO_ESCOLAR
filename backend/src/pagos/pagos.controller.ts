import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermisosGuard } from '../auth/guards/permisos.guard';
import { RequierePermisos } from '../auth/decorators/requiere-permisos.decorator';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator';
import { UsuarioSesion } from '../auth/interfaces/usuario-sesion.interface';
import { PERMISOS } from '../auth/permisos.constants';
import { PagosService } from './pagos.service';
import { AnularPagoDto, RegistrarPagoDto } from './dto/pagos.dto';

@ApiTags('Pagos Multimétodo')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('pagos')
export class PagosController {
  constructor(private readonly pagos: PagosService) {}

  @Get('vista')
  @RequierePermisos(PERMISOS.PAGOS_REGISTRAR)
  @ApiOperation({ summary: 'Listar todos los pagos registrados (VW_Pagos)' })
  pagosVista() {
    return this.pagos.listarPagosVista();
  }

  @Get('factura/:idFactura')
  @RequierePermisos(PERMISOS.PAGOS_REGISTRAR)
  @ApiOperation({ summary: 'Consultar abonos o pagos registrados para una factura específica' })
  pagosPorFactura(@Param('idFactura', ParseIntPipe) idFactura: number) {
    return this.pagos.consultarPagosFactura(idFactura);
  }

  @Post()
  @RequierePermisos(PERMISOS.PAGOS_REGISTRAR)
  @ApiOperation({
    summary: 'Registrar pago multimétodo: rebaja saldo de factura y actualiza estado a Parcial o Pagada (SP_Pago_Registrar)',
  })
  registrarPago(@Body() dto: RegistrarPagoDto, @UsuarioActual() u: UsuarioSesion) {
    return this.pagos.registrarPago(dto, u.idUsuario);
  }

  @Post(':id/anular')
  @RequierePermisos(PERMISOS.PAGOS_REGISTRAR)
  @ApiOperation({
    summary: 'Anular pago: restituye el saldo a la factura y revierte el estado (SP_Pago_Anular)',
  })
  anularPago(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AnularPagoDto,
    @UsuarioActual() u: UsuarioSesion,
  ) {
    return this.pagos.anularPago(id, dto, u.idUsuario);
  }
}
