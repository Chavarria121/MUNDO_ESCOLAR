import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermisosGuard } from '../auth/guards/permisos.guard';
import { RequierePermisos } from '../auth/decorators/requiere-permisos.decorator';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator';
import { UsuarioSesion } from '../auth/interfaces/usuario-sesion.interface';
import { PERMISOS } from '../auth/permisos.constants';
import { AuditoriaService } from './auditoria.service';
import { ConsultarAuditoriaDto, RegistrarEventoAuditoriaDto } from './dto/auditoria.dto';

@ApiTags('Auditoría Forense')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly auditoria: AuditoriaService) {}

  @Get('vista')
  @RequierePermisos(PERMISOS.SEGURIDAD_GESTIONAR)
  @ApiOperation({ summary: 'Listar registros de auditoría consolidados (VW_Auditoria)' })
  auditoriaVista() {
    return this.auditoria.listarVista();
  }

  @Get()
  @RequierePermisos(PERMISOS.SEGURIDAD_GESTIONAR)
  @ApiOperation({ summary: 'Consultar bitácora forense con filtros de usuario, fechas y tabla (SP_Auditoria_Consultar)' })
  consultar(@Query() query: ConsultarAuditoriaDto) {
    return this.auditoria.consultar(query);
  }

  @Get('permisos-fallidos')
  @RequierePermisos(PERMISOS.SEGURIDAD_GESTIONAR)
  @ApiOperation({ summary: 'Auditoría de intentos de accesos no autorizados o fallidos (SP_DBA_AuditoriaPermisosFallidos)' })
  permisosFallidos() {
    return this.auditoria.consultarPermisosFallidos();
  }

  @Post('evento')
  @RequierePermisos(PERMISOS.SEGURIDAD_GESTIONAR)
  @ApiOperation({ summary: 'Registrar evento administrativo o de seguridad manual en Bitácora (SP_Auditoria_Registrar)' })
  registrar(@Body() dto: RegistrarEventoAuditoriaDto, @UsuarioActual() u: UsuarioSesion) {
    return this.auditoria.registrar(dto, u.idUsuario);
  }
}
