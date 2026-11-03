import { Injectable } from '@nestjs/common';
import { SqlService } from '../database/sql.service';
import {
  ConsultarHistorialBackupsDto,
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

  async ejecutarBackupCompleto(idUsuario: number = 1) {
    return this.sql.consultarSPUno('SP_DBA_EjecutarBackupCompleto', {
      Id_Usuario: idUsuario,
    });
  }

  async ejecutarBackupDiferencial(idUsuario: number = 1) {
    return this.sql.consultarSPUno('SP_DBA_EjecutarBackupDiferencial', {
      Id_Usuario: idUsuario,
    });
  }

  async ejecutarBackupLog(idUsuario: number = 1) {
    return this.sql.consultarSPUno('SP_DBA_EjecutarBackupLog', {
      Id_Usuario: idUsuario,
    });
  }

  async verificarIntegridad(dto: VerificarIntegridadBackupDto, idUsuario: number = 1) {
    return this.sql.consultarSPUno('SP_DBA_VerificarIntegridadBackup', {
      RutaArchivoBak: dto.rutaArchivoBak,
      Id_Usuario: idUsuario,
    });
  }
}
