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
import { VentasService } from './ventas.service';
import {
  AgregarProductoVentaDto,
  AgregarServicioVentaDto,
  AnularVentaDto,
  ConsultarVentasDto,
  CrearVentaDto,
  ModificarDetalleVentaDto,
} from './dto/ventas.dto';

@ApiTags('Ventas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('ventas')
export class VentasController {
  constructor(private readonly ventas: VentasService) {}

  @Get('vista')
  @RequierePermisos(PERMISOS.VENTAS_REGISTRAR)
  @ApiOperation({ summary: 'Listar todas las ventas con datos consolidados (VW_Ventas)' })
  ventasVista() {
    return this.ventas.listarVentasVista();
  }

  @Get('pendientes-facturacion')
  @RequierePermisos(PERMISOS.VENTAS_REGISTRAR)
  @ApiOperation({ summary: 'Listar ventas pendientes de facturación (VW_VentasPendientesFacturacion)' })
  pendientesFacturacion() {
    return this.ventas.listarPendientesFacturacion();
  }

  @Get()
  @RequierePermisos(PERMISOS.VENTAS_REGISTRAR)
  @ApiOperation({ summary: 'Consultar ventas con filtros de fecha, cliente y estado (SP_Venta_Consultar)' })
  consultar(@Query() query: ConsultarVentasDto) {
    return this.ventas.consultar(query);
  }

  @Get(':id')
  @RequierePermisos(PERMISOS.VENTAS_REGISTRAR)
  @ApiOperation({ summary: 'Consultar una venta por ID con sus líneas de productos y servicios' })
  async consultarPorId(@Param('id', ParseIntPipe) id: number) {
    const v = await this.ventas.consultarPorId(id);
    if (!v) throw new NotFoundException('Venta no encontrada');
    return v;
  }

  @Get(':id/totales')
  @RequierePermisos(PERMISOS.VENTAS_REGISTRAR)
  @ApiOperation({ summary: 'Recalcular y consultar subtotales, IVA 13% y total (SP_Venta_CalcularTotales)' })
  calcularTotales(@Param('id', ParseIntPipe) id: number) {
    return this.ventas.calcularTotales(id);
  }

  @Post()
  @RequierePermisos(PERMISOS.VENTAS_REGISTRAR)
  @ApiOperation({ summary: 'Crear nueva orden de venta en estado Pendiente (SP_Venta_Crear)' })
  crear(@Body() dto: CrearVentaDto, @UsuarioActual() u: UsuarioSesion) {
    return this.ventas.crearVenta(dto, u.idUsuario);
  }

  @Post(':id/productos')
  @RequierePermisos(PERMISOS.VENTAS_REGISTRAR)
  @ApiOperation({ summary: 'Agregar producto a orden de venta (SP_Venta_AgregarProducto)' })
  agregarProducto(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AgregarProductoVentaDto,
    @UsuarioActual() u: UsuarioSesion,
  ) {
    return this.ventas.agregarProducto(id, dto, u.idUsuario);
  }

  @Post(':id/servicios')
  @RequierePermisos(PERMISOS.VENTAS_REGISTRAR)
  @ApiOperation({ summary: 'Agregar servicio a orden de venta (SP_Venta_AgregarServicio)' })
  agregarServicio(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AgregarServicioVentaDto,
    @UsuarioActual() u: UsuarioSesion,
  ) {
    return this.ventas.agregarServicio(id, dto, u.idUsuario);
  }

  @Put('detalles/producto/:idDetalle')
  @RequierePermisos(PERMISOS.VENTAS_REGISTRAR)
  @ApiOperation({ summary: 'Modificar línea de producto en venta (SP_Venta_ModificarDetalle)' })
  modificarProducto(
    @Param('idDetalle', ParseIntPipe) idDetalle: number,
    @Body() dto: ModificarDetalleVentaDto,
    @UsuarioActual() u: UsuarioSesion,
  ) {
    return this.ventas.modificarDetalle('Producto', idDetalle, dto, u.idUsuario);
  }

  @Put('detalles/servicio/:idDetalle')
  @RequierePermisos(PERMISOS.VENTAS_REGISTRAR)
  @ApiOperation({ summary: 'Modificar línea de servicio en venta (SP_Venta_ModificarDetalle)' })
  modificarServicio(
    @Param('idDetalle', ParseIntPipe) idDetalle: number,
    @Body() dto: ModificarDetalleVentaDto,
    @UsuarioActual() u: UsuarioSesion,
  ) {
    return this.ventas.modificarDetalle('Servicio', idDetalle, dto, u.idUsuario);
  }

  @Delete('detalles/producto/:idDetalle')
  @RequierePermisos(PERMISOS.VENTAS_REGISTRAR)
  @ApiOperation({ summary: 'Eliminar línea de producto de venta (SP_Venta_EliminarDetalle)' })
  eliminarProducto(@Param('idDetalle', ParseIntPipe) idDetalle: number, @UsuarioActual() u: UsuarioSesion) {
    return this.ventas.eliminarDetalle('Producto', idDetalle, u.idUsuario);
  }

  @Delete('detalles/servicio/:idDetalle')
  @RequierePermisos(PERMISOS.VENTAS_REGISTRAR)
  @ApiOperation({ summary: 'Eliminar línea de servicio de venta (SP_Venta_EliminarDetalle)' })
  eliminarServicio(@Param('idDetalle', ParseIntPipe) idDetalle: number, @UsuarioActual() u: UsuarioSesion) {
    return this.ventas.eliminarDetalle('Servicio', idDetalle, u.idUsuario);
  }

  @Post(':id/confirmar')
  @RequierePermisos(PERMISOS.VENTAS_CONFIRMAR)
  @ApiOperation({
    summary: 'Confirmar venta: descuenta stock, registra salida en kárdex y genera factura fiscal (SP_Venta_Confirmar)',
  })
  confirmar(@Param('id', ParseIntPipe) id: number, @UsuarioActual() u: UsuarioSesion) {
    return this.ventas.confirmarVenta(id, u.idUsuario);
  }

  @Post(':id/anular')
  @RequierePermisos(PERMISOS.VENTAS_ANULAR)
  @ApiOperation({
    summary: 'Anular venta: reingresa existencias a bodega con motivo Devolución y anula factura (SP_Venta_Anular)',
  })
  anular(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AnularVentaDto,
    @UsuarioActual() u: UsuarioSesion,
  ) {
    return this.ventas.anularVenta(id, dto, u.idUsuario);
  }
}
