import { Injectable } from '@nestjs/common';
import { SqlService } from '../database/sql.service';
import {
  ConsultarHistorialBackupsDto,
  EjecutarBackupDto,
  MantenimientoIndicesDto,
  VerificarIntegridadBackupDto,
} from './dto/dba.dto';

@Injectable()
export class DbaService {
  constructor(private readonly sql: SqlService) {}

  mantenimientoIndices(dto: MantenimientoIndicesDto) {
    return this.sql.consultarSP('SP_DBA_MantenimientoIndices', {
      Modo: dto.modo,
    });
  }

  consultarHistorialBackups(dto: ConsultarHistorialBackupsDto) {
    return this.sql.consultarSP('SP_DBA_ConsultarHistorialBackups', {
      DiasAtras: dto.diasAtras ?? 30,
    });
  }

  async ejecutarBackupCompleto(dto: EjecutarBackupDto) {
    return this.sql.consultarSPUno('SP_DBA_EjecutarBackupCompleto', {
      RutaCarpetaBackup: dto.rutaCarpetaBackup ?? 'C:\\SQLBackup',
    });
  }

  async ejecutarBackupDiferencial(dto: EjecutarBackupDto) {
    return this.sql.consultarSPUno('SP_DBA_EjecutarBackupDiferencial', {
      RutaCarpetaBackup: dto.rutaCarpetaBackup ?? 'C:\\SQLBackup',
    });
  }

  async ejecutarBackupLog(dto: EjecutarBackupDto) {
    return this.sql.consultarSPUno('SP_DBA_EjecutarBackupLog', {
      RutaCarpetaBackup: dto.rutaCarpetaBackup ?? 'C:\\SQLBackup',
    });
  }

  async verificarIntegridad(dto: VerificarIntegridadBackupDto) {
    return this.sql.consultarSPUno('SP_DBA_VerificarIntegridadBackup', {
      RutaArchivoBak: dto.rutaArchivoBak,
    });
  }
}
