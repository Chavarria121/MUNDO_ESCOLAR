import { Injectable } from '@nestjs/common';
import { SqlService } from '../database/sql.service';
import { ConsultarAuditoriaDto, RegistrarEventoAuditoriaDto } from './dto/auditoria.dto';

@Injectable()
export class AuditoriaService {
  constructor(private readonly sql: SqlService) {}

  listarVista() {
    return this.sql.consultarVista('VW_Auditoria');
  }

  consultar(dto: ConsultarAuditoriaDto) {
    return this.sql.consultarSP('SP_Auditoria_Consultar', {
      Id_Usuario: dto.idUsuario ?? null,
      FechaInicio: dto.fechaInicio ? new Date(dto.fechaInicio) : null,
      FechaFin: dto.fechaFin ? new Date(dto.fechaFin) : null,
      Tabla: dto.tabla ?? null,
    });
  }

  async registrar(dto: RegistrarEventoAuditoriaDto, idUsuario: number) {
    const r = await this.sql.ejecutarSP(
      'SP_Auditoria_Registrar',
      {
        Id_Usuario: idUsuario,
        Accion: dto.accion,
        Tabla_Afectada: dto.tablaAfectada,
        Id_Registro_Afectado: dto.idRegistroAfectado ?? null,
        Descripcion: dto.descripcion ?? null,
      },
      { idUsuario },
    );
    return r.filas[0] ?? { Mensaje: 'Evento de auditoría registrado con éxito.' };
  }

  consultarPermisosFallidos() {
    return this.sql.consultarSP('SP_DBA_AuditoriaPermisosFallidos');
  }
}
