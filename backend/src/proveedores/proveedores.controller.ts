import {
  Body,
  Controller,
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
import { ProveedoresService } from './proveedores.service';
import {
  ActualizarProductoProveedorDto,
  ActualizarProveedorDto,
  AsociarProductoProveedorDto,
  ConsultarProductoProveedorDto,
  ConsultarProveedoresDto,
  CrearProveedorInstitucionalDto,
  CrearProveedorParticularDto,
} from './dto/proveedores.dto';

@ApiTags('Proveedores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('proveedores')
export class ProveedoresController {
  constructor(private readonly proveedores: ProveedoresService) {}

  @Get('activos')
  @RequierePermisos(PERMISOS.PROVEEDORES_CONSULTAR)
  @ApiOperation({ summary: 'Listar proveedores activos (VW_ProveedoresActivos)' })
  activos() {
    return this.proveedores.listarActivos();
  }

  @Get()
  @RequierePermisos(PERMISOS.PROVEEDORES_CONSULTAR)
  @ApiOperation({ summary: 'Consultar proveedores con filtros (SP_Proveedor_Consultar)' })
  consultar(@Query() query: ConsultarProveedoresDto) {
    return this.proveedores.consultar(query);
  }

  @Get('productos-asociados/vista')
  @RequierePermisos(PERMISOS.PROVEEDORES_CONSULTAR)
  @ApiOperation({ summary: 'Listar asociaciones producto-proveedor (VW_ProductoProveedor)' })
  asociadosVista() {
    return this.proveedores.listarProductoProveedorVista();
  }

  @Get('productos-asociados')
  @RequierePermisos(PERMISOS.PROVEEDORES_CONSULTAR)
  @ApiOperation({ summary: 'Consultar asociaciones producto-proveedor (SP_ProductoProveedor_Consultar)' })
  asociadosSp(@Query() query: ConsultarProductoProveedorDto) {
    return this.proveedores.consultarProductoProveedor(query);
  }

  @Post('productos-asociados')
  @RequierePermisos(PERMISOS.PROVEEDORES_GESTIONAR)
  @ApiOperation({ summary: 'Asociar producto a proveedor con precio de compra (SP_ProductoProveedor_Asociar)' })
  asociarProducto(@Body() dto: AsociarProductoProveedorDto, @UsuarioActual() u: UsuarioSesion) {
    return this.proveedores.asociarProductoProveedor(dto, u.idUsuario);
  }

  @Put('productos-asociados/:id')
  @RequierePermisos(PERMISOS.PROVEEDORES_GESTIONAR)
  @ApiOperation({ summary: 'Actualizar asociación producto-proveedor (SP_ProductoProveedor_Actualizar)' })
  actualizarAsociacion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarProductoProveedorDto,
    @UsuarioActual() u: UsuarioSesion,
  ) {
    return this.proveedores.actualizarProductoProveedor(id, dto, u.idUsuario);
  }

  @Get(':id')
  @RequierePermisos(PERMISOS.PROVEEDORES_CONSULTAR)
  @ApiOperation({ summary: 'Consultar un proveedor por ID' })
  async consultarPorId(@Param('id', ParseIntPipe) id: number) {
    const p = await this.proveedores.consultarPorId(id);
    if (!p) throw new NotFoundException('Proveedor no encontrado');
    return p;
  }

  @Post('particular')
  @RequierePermisos(PERMISOS.PROVEEDORES_GESTIONAR)
  @ApiOperation({ summary: 'Registrar proveedor particular en 3FN (SP_Proveedor_Crear)' })
  crearParticular(@Body() dto: CrearProveedorParticularDto, @UsuarioActual() u: UsuarioSesion) {
    return this.proveedores.crearParticular(dto, u.idUsuario);
  }

  @Post('institucional')
  @RequierePermisos(PERMISOS.PROVEEDORES_GESTIONAR)
  @ApiOperation({ summary: 'Registrar proveedor institucional en 3FN (SP_Proveedor_Crear)' })
  crearInstitucional(@Body() dto: CrearProveedorInstitucionalDto, @UsuarioActual() u: UsuarioSesion) {
    return this.proveedores.crearInstitucional(dto, u.idUsuario);
  }

  @Put(':id')
  @RequierePermisos(PERMISOS.PROVEEDORES_GESTIONAR)
  @ApiOperation({ summary: 'Actualizar datos de proveedor en 3FN (SP_Proveedor_Actualizar)' })
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarProveedorDto,
    @UsuarioActual() u: UsuarioSesion,
  ) {
    return this.proveedores.actualizar(id, dto, u.idUsuario);
  }
}
