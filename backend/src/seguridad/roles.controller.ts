import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermisosGuard } from '../auth/guards/permisos.guard';
import { RequierePermisos } from '../auth/decorators/requiere-permisos.decorator';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator';
import { UsuarioSesion } from '../auth/interfaces/usuario-sesion.interface';
import { PERMISOS } from '../auth/permisos.constants';
import { SeguridadService } from './seguridad.service';
import { ActualizarRolDto, AsignarPermisoDto, CrearRolDto } from './dto/seguridad.dto';

@ApiTags('Seguridad - Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@RequierePermisos(PERMISOS.SEGURIDAD_GESTIONAR)
@Controller('roles')
export class RolesController {
  constructor(private readonly seguridad: SeguridadService) {}

  @Get()
  @ApiOperation({ summary: 'Listar roles (SP_Rol_Consultar)' })
  listar(@UsuarioActual() u: UsuarioSesion) {
    return this.seguridad.consultarRoles(null, u.idUsuario);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un rol (SP_Rol_Consultar)' })
  async obtener(@Param('id', ParseIntPipe) id: number, @UsuarioActual() u: UsuarioSesion) {
    return (await this.seguridad.consultarRoles(id, u.idUsuario))[0] ?? null;
  }

  @Post()
  @ApiOperation({ summary: 'Crear rol (SP_Rol_Crear)' })
  crear(@Body() dto: CrearRolDto, @UsuarioActual() u: UsuarioSesion) {
    return this.seguridad.crearRol(dto, u.idUsuario);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar rol (SP_Rol_Actualizar)' })
  actualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: ActualizarRolDto, @UsuarioActual() u: UsuarioSesion) {
    return this.seguridad.actualizarRol(id, dto, u.idUsuario);
  }

  @Post(':id/permisos')
  @ApiOperation({ summary: 'Asignar permiso a rol (SP_Rol_AsignarPermiso)' })
  asignarPermiso(@Param('id', ParseIntPipe) id: number, @Body() dto: AsignarPermisoDto, @UsuarioActual() u: UsuarioSesion) {
    return this.seguridad.asignarPermisoARol(id, dto.idPermiso, u.idUsuario);
  }

  @Delete(':id/permisos/:idPermiso')
  @ApiOperation({ summary: 'Remover permiso de rol (SP_Rol_RemoverPermiso)' })
  removerPermiso(
    @Param('id', ParseIntPipe) id: number,
    @Param('idPermiso', ParseIntPipe) idPermiso: number,
    @UsuarioActual() u: UsuarioSesion,
  ) {
    return this.seguridad.removerPermisoDeRol(id, idPermiso, u.idUsuario);
  }
}
