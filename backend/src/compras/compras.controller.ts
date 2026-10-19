import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
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
import { ComprasService } from './compras.service';
import {
  AgregarProductoCompraDto,
  AnularCompraDto,
  ConsultarComprasDto,
  CrearCompraDto,
  ModificarDetalleCompraDto,
} from './dto/compras.dto';

@ApiTags('Compras')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('compras')
export class ComprasController {
  constructor(private readonly compras: ComprasService) {}

  @Get('detalles/vista')
  @RequierePermisos(PERMISOS.COMPRAS_REGISTRAR)
  @ApiOperation({ summary: 'Listar detalles de todas las compras (VW_ComprasDetalle)' })
  detallesVista() {
    return this.compras.listarDetallesVista();
  }

  @Get()
  @RequierePermisos(PERMISOS.COMPRAS_REGISTRAR)
  @ApiOperation({ summary: 'Consultar compras con filtros de estado, proveedor y fechas (SP_Compra_Consultar)' })
  consultar(@Query() query: ConsultarComprasDto) {
    return this.compras.consultar(query);
  }

  @Get(':id')
  @RequierePermisos(PERMISOS.COMPRAS_REGISTRAR)
  @ApiOperation({ summary: 'Consultar orden de compra con sus líneas de producto por ID' })
  async consultarPorId(@Param('id', ParseIntPipe) id: number) {
    const c = await this.compras.consultarPorId(id);
    if (!c) throw new NotFoundException('Orden de compra no encontrada');
    return c;
  }

  @Get(':id/total')
  @RequierePermisos(PERMISOS.COMPRAS_REGISTRAR)
  @ApiOperation({ summary: 'Recalcular y consultar total acumulado de una orden (SP_Compra_CalcularTotal)' })
  calcularTotal(@Param('id', ParseIntPipe) id: number) {
    return this.compras.calcularTotal(id);
  }

  @Post()
  @RequierePermisos(PERMISOS.COMPRAS_REGISTRAR)
  @ApiOperation({ summary: 'Crear nueva orden de compra en estado Pendiente (SP_Compra_Crear)' })
  crear(@Body() dto: CrearCompraDto, @UsuarioActual() u: UsuarioSesion) {
    return this.compras.crearCompra(dto, u.idUsuario);
  }

  @Post(':id/productos')
  @RequierePermisos(PERMISOS.COMPRAS_REGISTRAR)
  @ApiOperation({ summary: 'Agregar producto a orden de compra pendiente (SP_Compra_AgregarProducto)' })
  agregarProducto(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AgregarProductoCompraDto,
    @UsuarioActual() u: UsuarioSesion,
  ) {
    return this.compras.agregarProducto(id, dto, u.idUsuario);
  }

  @Put('detalles/:idDetalle')
  @RequierePermisos(PERMISOS.COMPRAS_REGISTRAR)
  @ApiOperation({ summary: 'Modificar cantidad o costo de una línea de compra (SP_Compra_ModificarDetalle)' })
  modificarDetalle(
    @Param('idDetalle', ParseIntPipe) idDetalle: number,
    @Body() dto: ModificarDetalleCompraDto,
    @UsuarioActual() u: UsuarioSesion,
  ) {
    return this.compras.modificarDetalle(idDetalle, dto, u.idUsuario);
  }

  @Delete('detalles/:idDetalle')
  @RequierePermisos(PERMISOS.COMPRAS_REGISTRAR)
  @ApiOperation({ summary: 'Eliminar una línea de producto de compra (SP_Compra_EliminarDetalle)' })
  eliminarDetalle(
    @Param('idDetalle', ParseIntPipe) idDetalle: number,
    @UsuarioActual() u: UsuarioSesion,
  ) {
    return this.compras.eliminarDetalle(idDetalle, u.idUsuario);
  }

  @Post(':id/confirmar')
  @RequierePermisos(PERMISOS.COMPRAS_RECEPCIONAR)
  @ApiOperation({ summary: 'Confirmar y recepcionar compra: ingresa existencias al stock (SP_Compra_Confirmar)' })
  confirmar(@Param('id', ParseIntPipe) id: number, @UsuarioActual() u: UsuarioSesion) {
    return this.compras.confirmarCompra(id, u.idUsuario);
  }

  @Post(':id/anular')
  @RequierePermisos(PERMISOS.COMPRAS_ANULAR)
  @ApiOperation({ summary: 'Anular orden de compra y reversar inventario si fue recibida (SP_Compra_Anular)' })
  anular(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AnularCompraDto,
    @UsuarioActual() u: UsuarioSesion,
  ) {
    return this.compras.anularCompra(id, dto, u.idUsuario);
  }
}
