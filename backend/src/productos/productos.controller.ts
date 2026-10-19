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
import { ProductosService } from './productos.service';
import {
  ActualizarProductoDto,
  ActualizarServicioDto,
  ConsultarProductosDto,
  ConsultarServiciosDto,
  CrearProductoDto,
  CrearServicioDto,
} from './dto/productos.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller()
export class ProductosController {
  constructor(private readonly productos: ProductosService) {}

  // ================= PRODUCTOS =================
  @ApiTags('Productos')
  @Get('productos/catalogo')
  @ApiOperation({ summary: 'Listar catálogo general de productos (VW_ProductosCatalogo)' })
  catalogo() {
    return this.productos.listarCatalogo();
  }

  @ApiTags('Productos')
  @Get('productos/inventario')
  @RequierePermisos(PERMISOS.INVENTARIO_CONSULTAR)
  @ApiOperation({ summary: 'Listar productos con stock y disponibilidad (VW_ProductosInventario)' })
  inventario() {
    return this.productos.listarInventario();
  }

  @ApiTags('Productos')
  @Get('productos')
  @ApiOperation({ summary: 'Consultar productos con filtros (SP_Producto_Consultar)' })
  consultar(@Query() query: ConsultarProductosDto) {
    return this.productos.consultar(query);
  }

  @ApiTags('Productos')
  @Get('productos/:id')
  @ApiOperation({ summary: 'Consultar un producto por ID' })
  async consultarPorId(@Param('id', ParseIntPipe) id: number) {
    const prod = await this.productos.consultarPorId(id);
    if (!prod) throw new NotFoundException('Producto no encontrado');
    return prod;
  }

  @ApiTags('Productos')
  @Post('productos')
  @RequierePermisos(PERMISOS.INVENTARIO_GESTIONAR)
  @ApiOperation({ summary: 'Crear nuevo producto (SP_Producto_Crear)' })
  crearProducto(@Body() dto: CrearProductoDto, @UsuarioActual() u: UsuarioSesion) {
    return this.productos.crearProducto(dto, u.idUsuario);
  }

  @ApiTags('Productos')
  @Put('productos/:id')
  @RequierePermisos(PERMISOS.INVENTARIO_GESTIONAR)
  @ApiOperation({ summary: 'Actualizar producto (SP_Producto_Actualizar)' })
  actualizarProducto(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarProductoDto,
    @UsuarioActual() u: UsuarioSesion,
  ) {
    return this.productos.actualizarProducto(id, dto, u.idUsuario);
  }

  // ================= SERVICIOS =================
  @ApiTags('Servicios')
  @Get('servicios')
  @ApiOperation({ summary: 'Consultar servicios con filtros (SP_Servicio_Consultar)' })
  consultarServicios(@Query() query: ConsultarServiciosDto) {
    return this.productos.consultarServicios(query);
  }

  @ApiTags('Servicios')
  @Get('servicios/:id')
  @ApiOperation({ summary: 'Consultar un servicio por ID' })
  async consultarServicioPorId(@Param('id', ParseIntPipe) id: number) {
    const s = await this.productos.consultarServicioPorId(id);
    if (!s) throw new NotFoundException('Servicio no encontrado');
    return s;
  }

  @ApiTags('Servicios')
  @Post('servicios')
  @RequierePermisos(PERMISOS.INVENTARIO_GESTIONAR)
  @ApiOperation({ summary: 'Crear nuevo servicio (SP_Servicio_Crear)' })
  crearServicio(@Body() dto: CrearServicioDto, @UsuarioActual() u: UsuarioSesion) {
    return this.productos.crearServicio(dto, u.idUsuario);
  }

  @ApiTags('Servicios')
  @Put('servicios/:id')
  @RequierePermisos(PERMISOS.INVENTARIO_GESTIONAR)
  @ApiOperation({ summary: 'Actualizar servicio (SP_Servicio_Actualizar)' })
  actualizarServicio(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarServicioDto,
    @UsuarioActual() u: UsuarioSesion,
  ) {
    return this.productos.actualizarServicio(id, dto, u.idUsuario);
  }

  @ApiTags('Servicios')
  @Delete('servicios/:id')
  @RequierePermisos(PERMISOS.INVENTARIO_GESTIONAR)
  @ApiOperation({ summary: 'Desactivar servicio (SP_Servicio_Desactivar)' })
  desactivarServicio(@Param('id', ParseIntPipe) id: number, @UsuarioActual() u: UsuarioSesion) {
    return this.productos.desactivarServicio(id, u.idUsuario);
  }
}
