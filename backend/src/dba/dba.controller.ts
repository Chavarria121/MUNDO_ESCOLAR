import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermisosGuard } from '../auth/guards/permisos.guard';
import { RequierePermisos } from '../auth/decorators/requiere-permisos.decorator';
import { PERMISOS } from '../auth/permisos.constants';
import { DbaService } from './dba.service';
import {
  ConsultarHistorialBackupsDto,
  EjecutarBackupDto,
  MantenimientoIndicesDto,
  VerificarIntegridadBackupDto,
} from './dto/dba.dto';

@ApiTags('DBA y Mantenimiento de Base de Datos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('dba')
export class DbaController {
  constructor(private readonly dba: DbaService) {}

  @Get('backups/historial')
  @RequierePermisos(PERMISOS.DBA_MANTENIMIENTO)
  @ApiOperation({ summary: 'Consultar bitácora oficial de respaldos en msdb (SP_DBA_ConsultarHistorialBackups)' })
  historialBackups(@Query() query: ConsultarHistorialBackupsDto) {
    return this.dba.consultarHistorialBackups(query);
  }

  @Post('backups/completo')
  @RequierePermisos(PERMISOS.DBA_MANTENIMIENTO)
  @ApiOperation({ summary: 'Ejecutar respaldo completo (.bak) de MUNDO_ESCOLAR con compresión (SP_DBA_EjecutarBackupCompleto)' })
  backupCompleto(@Body() dto: EjecutarBackupDto) {
    return this.dba.ejecutarBackupCompleto(dto);
  }

  @Post('backups/diferencial')
  @RequierePermisos(PERMISOS.DBA_MANTENIMIENTO)
  @ApiOperation({ summary: 'Ejecutar respaldo diferencial de MUNDO_ESCOLAR (SP_DBA_EjecutarBackupDiferencial)' })
  backupDiferencial(@Body() dto: EjecutarBackupDto) {
    return this.dba.ejecutarBackupDiferencial(dto);
  }

  @Post('backups/log')
  @RequierePermisos(PERMISOS.DBA_MANTENIMIENTO)
  @ApiOperation({ summary: 'Ejecutar respaldo de log de transacciones (SP_DBA_EjecutarBackupLog)' })
  backupLog(@Body() dto: EjecutarBackupDto) {
    return this.dba.ejecutarBackupLog(dto);
  }

  @Post('backups/verificar')
  @RequierePermisos(PERMISOS.DBA_MANTENIMIENTO)
  @ApiOperation({ summary: 'Verificar integridad física de un archivo .bak mediante RESTORE VERIFYONLY (SP_DBA_VerificarIntegridadBackup)' })
  verificar(@Body() dto: VerificarIntegridadBackupDto) {
    return this.dba.verificarIntegridad(dto);
  }

  @Post('indices/mantenimiento')
  @RequierePermisos(PERMISOS.DBA_MANTENIMIENTO)
  @ApiOperation({ summary: 'Analizar o ejecutar mantenimiento dinámico de índices (REORGANIZE / REBUILD) (SP_DBA_MantenimientoIndices)' })
  mantenimientoIndices(@Body() dto: MantenimientoIndicesDto) {
    return this.dba.mantenimientoIndices(dto);
  }
}
