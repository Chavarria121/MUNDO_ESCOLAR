import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermisosGuard } from '../auth/guards/permisos.guard';
import { RequierePermisos } from '../auth/decorators/requiere-permisos.decorator';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator';
import { UsuarioSesion } from '../auth/interfaces/usuario-sesion.interface';
import { PERMISOS } from '../auth/permisos.constants';
import { SeguridadService } from './seguridad.service';
import { AsignarRolDto, CrearUsuarioDto } from './dto/seguridad.dto';

@ApiTags('Seguridad - Usuarios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@RequierePermisos(PERMISOS.SEGURIDAD_GESTIONAR)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly seguridad: SeguridadService) {}

  @Post()
  @ApiOperation({ summary: 'Crear usuario (SP_Usuario_Crear)' })
  crear(@Body() dto: CrearUsuarioDto, @UsuarioActual() u: UsuarioSesion) {
    return this.seguridad.crearUsuario(dto, u.idUsuario);
  }

  @Patch(':id/desactivar')
  @ApiOperation({ summary: 'Desactivar usuario (SP_Usuario_Desactivar)' })
  desactivar(@Param('id', ParseIntPipe) id: number, @UsuarioActual() u: UsuarioSesion) {
    return this.seguridad.desactivarUsuario(id, u.idUsuario);
  }

  @Post(':id/roles')
  @ApiOperation({ summary: 'Asignar rol a usuario (SP_Usuario_AsignarRol)' })
  asignarRol(@Param('id', ParseIntPipe) id: number, @Body() dto: AsignarRolDto, @UsuarioActual() u: UsuarioSesion) {
    return this.seguridad.asignarRol(id, dto.idRol, u.idUsuario);
  }

  @Delete(':id/roles/:idRol')
  @ApiOperation({ summary: 'Remover rol de usuario (SP_Usuario_RemoverRol)' })
  removerRol(
    @Param('id', ParseIntPipe) id: number,
    @Param('idRol', ParseIntPipe) idRol: number,
    @UsuarioActual() u: UsuarioSesion,
  ) {
    return this.seguridad.removerRol(id, idRol, u.idUsuario);
  }

  @Get(':id/permisos')
  @ApiOperation({ summary: 'Permisos efectivos de un usuario (SP_Permiso_ConsultarUsuario)' })
  permisos(@Param('id', ParseIntPipe) id: number, @UsuarioActual() u: UsuarioSesion) {
    return this.seguridad.permisosDeUsuario(id, u.idUsuario);
  }
}
