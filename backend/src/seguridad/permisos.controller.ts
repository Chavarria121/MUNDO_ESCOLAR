import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermisosGuard } from '../auth/guards/permisos.guard';
import { RequierePermisos } from '../auth/decorators/requiere-permisos.decorator';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator';
import { UsuarioSesion } from '../auth/interfaces/usuario-sesion.interface';
import { PERMISOS } from '../auth/permisos.constants';
import { SeguridadService } from './seguridad.service';
import { GuardarPermisoDto } from './dto/seguridad.dto';

@ApiTags('Seguridad - Permisos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@RequierePermisos(PERMISOS.SEGURIDAD_GESTIONAR)
@Controller('permisos')
export class PermisosController {
  constructor(private readonly seguridad: SeguridadService) {}

  @Get()
  @ApiOperation({ summary: 'Listar permisos (SP_Permiso_Consultar)' })
  listar(@UsuarioActual() u: UsuarioSesion) {
    return this.seguridad.consultarPermisos(null, u.idUsuario);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un permiso (SP_Permiso_Consultar)' })
  async obtener(@Param('id', ParseIntPipe) id: number, @UsuarioActual() u: UsuarioSesion) {
    return (await this.seguridad.consultarPermisos(id, u.idUsuario))[0] ?? null;
  }

  @Post()
  @ApiOperation({ summary: 'Crear permiso (SP_Permiso_Crear)' })
  crear(@Body() dto: GuardarPermisoDto, @UsuarioActual() u: UsuarioSesion) {
    return this.seguridad.crearPermiso(dto, u.idUsuario);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar permiso (SP_Permiso_Actualizar)' })
  actualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: GuardarPermisoDto, @UsuarioActual() u: UsuarioSesion) {
    return this.seguridad.actualizarPermiso(id, dto, u.idUsuario);
  }
}
