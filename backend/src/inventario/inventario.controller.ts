import {
  Body,
  Controller,
  Get,
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
import { InventarioService } from './inventario.service';
import {
  AjusteInventarioDto,
  ConsultarMovimientosDto,
  EntradaInventarioDto,
  RevertirMovimientoDto,
  SalidaInventarioDto,
} from './dto/inventario.dto';

@ApiTags('Inventario')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('inventario')
export class InventarioController {
  constructor(private readonly inventario: InventarioService) {}

  @Get('movimientos/vista')
  @RequierePermisos(PERMISOS.INVENTARIO_CONSULTAR)
  @ApiOperation({ summary: 'Listar movimientos de inventario detallados (VW_MovimientosInventario)' })
  movimientosVista() {
    return this.inventario.listarMovimientosVista();
  }

  @Get('movimientos')
  @RequierePermisos(PERMISOS.INVENTARIO_CONSULTAR)
  @ApiOperation({ summary: 'Consultar movimientos con filtros (SP_Inventario_ConsultarMovimientos)' })
  movimientosSp(@Query() query: ConsultarMovimientosDto) {
    return this.inventario.consultarMovimientos(query);
  }

  @Get('bajo-reorden')
  @RequierePermisos(PERMISOS.INVENTARIO_CONSULTAR)
  @ApiOperation({ summary: 'Alertas de productos con stock en o bajo punto de reorden (SP_Inventario_ProductosBajoReorden)' })
  bajoReorden() {
    return this.inventario.consultarBajoReorden();
  }

  @Post('entrada')
  @RequierePermisos(PERMISOS.INVENTARIO_GESTIONAR)
  @ApiOperation({ summary: 'Registrar entrada de mercancía (SP_Inventario_Entrada)' })
  entrada(@Body() dto: EntradaInventarioDto, @UsuarioActual() u: UsuarioSesion) {
    return this.inventario.registrarEntrada(dto, u.idUsuario);
  }

  @Post('salida')
  @RequierePermisos(PERMISOS.INVENTARIO_GESTIONAR)
  @ApiOperation({ summary: 'Registrar salida por merma/ajuste (SP_Inventario_Salida)' })
  salida(@Body() dto: SalidaInventarioDto, @UsuarioActual() u: UsuarioSesion) {
    return this.inventario.registrarSalida(dto, u.idUsuario);
  }

  @Post('ajuste')
  @RequierePermisos(PERMISOS.INVENTARIO_GESTIONAR)
  @ApiOperation({ summary: 'Ajuste de stock por conteo físico (SP_Inventario_Ajustar)' })
  ajuste(@Body() dto: AjusteInventarioDto, @UsuarioActual() u: UsuarioSesion) {
    return this.inventario.registrarAjuste(dto, u.idUsuario);
  }

  @Post('movimientos/:id/revertir')
  @RequierePermisos(PERMISOS.INVENTARIO_GESTIONAR)
  @ApiOperation({ summary: 'Revertir movimiento previo de inventario (SP_Inventario_RevertirMovimiento)' })
  revertir(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RevertirMovimientoDto,
    @UsuarioActual() u: UsuarioSesion,
  ) {
    return this.inventario.revertirMovimiento(id, dto, u.idUsuario);
  }
}
