import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermisosGuard } from '../auth/guards/permisos.guard';
import { RequierePermisos } from '../auth/decorators/requiere-permisos.decorator';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator';
import { UsuarioSesion } from '../auth/interfaces/usuario-sesion.interface';
import { PERMISOS } from '../auth/permisos.constants';
import { CatalogosService } from './catalogos.service';
import { ActualizarCategoriaDto, CrearCategoriaDto } from './dto/catalogos.dto';

@ApiTags('Catálogos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('catalogos')
export class CatalogosController {
  constructor(private readonly catalogos: CatalogosService) {}

  @Get('tipos-cliente')
  @ApiOperation({ summary: 'Listar tipos de cliente activos (VW_TiposClienteActivos)' })
  tiposCliente() {
    return this.catalogos.listarTiposCliente();
  }

  @Get('condiciones-pago')
  @ApiOperation({ summary: 'Listar condiciones de pago activas (VW_CondicionesPagoActivas)' })
  condicionesPago() {
    return this.catalogos.listarCondicionesPago();
  }

  @Get('metodos-pago')
  @ApiOperation({ summary: 'Listar métodos de pago activos (VW_MetodosPagoActivos)' })
  metodosPago() {
    return this.catalogos.listarMetodosPago();
  }

  @Get('categorias')
  @ApiOperation({ summary: 'Listar categorías de productos activas (VW_CategoriasActivas)' })
  categorias() {
    return this.catalogos.listarCategorias();
  }

  @Post('categorias')
  @RequierePermisos(PERMISOS.INVENTARIO_GESTIONAR)
  @ApiOperation({ summary: 'Crear nueva categoría (SP_Categoria_Crear)' })
  crearCategoria(@Body() dto: CrearCategoriaDto, @UsuarioActual() u: UsuarioSesion) {
    return this.catalogos.crearCategoria(dto, u.idUsuario);
  }

  @Put('categorias/:id')
  @RequierePermisos(PERMISOS.INVENTARIO_GESTIONAR)
  @ApiOperation({ summary: 'Actualizar categoría existente (SP_Categoria_Actualizar)' })
  actualizarCategoria(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarCategoriaDto,
    @UsuarioActual() u: UsuarioSesion,
  ) {
    return this.catalogos.actualizarCategoria(id, dto, u.idUsuario);
  }
}
