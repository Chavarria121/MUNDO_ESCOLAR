import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sql from 'mssql';

export interface OpcionesSP {
  idUsuario?: number | null;
  salidas?: Record<string, 'int' | 'varchar' | 'decimal' | 'bit'>;
}

export interface ResultadoSP<T = any> {
  filas: T[];
  recordsets: T[][];
  salida: Record<string, any>;
}

const IDENTIFICADOR = /^[A-Za-z0-9_#]+$/;

@Injectable()
export class SqlService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SqlService.name);
  private pool: sql.ConnectionPool | null = null;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    await this.obtenerPool();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.pool && this.pool.connected) {
      await this.pool.close();
      this.logger.log('Pool de conexiones a SQL Server cerrado');
    }
  }

  async obtenerPool(): Promise<sql.ConnectionPool> {
    if (this.pool && this.pool.connected) return this.pool;

    const host = this.config.get<string>('database.server', 'localhost');
    const port = this.config.get<number>('database.port', 1433);
    const user = this.config.get<string>('database.user', 'sa');
    const password = this.config.get<string>('database.password', 'MundoEscolar2026*');
    const database = this.config.get<string>('database.name', 'MUNDO_ESCOLAR');

    const configSql: sql.config = {
      server: host,
      port,
      user,
      password,
      database,
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
      },
      pool: {
        max: 20,
        min: 2,
        idleTimeoutMillis: 30000,
      },
    };

    this.logger.log(`Conectando a SQL Server en ${host}:${port}/${database} con usuario ${user}...`);
    this.pool = await new sql.ConnectionPool(configSql).connect();
    this.logger.log('Pool de SQL Server listo y saludable');
    return this.pool;
  }

  private agregarEntrada(request: sql.Request, nombre: string, valor: unknown): void {
    if (valor === null || valor === undefined) {
      request.input(nombre, sql.VarChar, null);
    } else if (typeof valor === 'number') {
      if (Number.isInteger(valor)) request.input(nombre, sql.Int, valor);
      else request.input(nombre, sql.Decimal(12, 2), valor);
    } else if (typeof valor === 'boolean') {
      request.input(nombre, sql.Bit, valor);
    } else if (valor instanceof Date) {
      request.input(nombre, sql.DateTime, valor);
    } else {
      request.input(nombre, sql.VarChar, String(valor));
    }
  }

  private mapTipoSalida(tipo: 'int' | 'varchar' | 'decimal' | 'bit'): sql.ISqlType | (() => sql.ISqlType) {
    switch (tipo) {
      case 'int': return sql.Int;
      case 'bit': return sql.Bit;
      case 'decimal': return sql.Decimal(12, 2);
      default: return sql.VarChar(sql.MAX);
    }
  }

  async ejecutarSP<T = any>(
    nombreSP: string,
    parametros: Record<string, unknown> = {},
    opciones: OpcionesSP = {},
  ): Promise<ResultadoSP<T>> {
    if (!IDENTIFICADOR.test(nombreSP)) throw new Error(`Nombre de procedimiento inválido: ${nombreSP}`);

    const pool = await this.obtenerPool();
    const request = pool.request();
    const asignaciones: string[] = [];

    for (const [nombre, valor] of Object.entries(parametros)) {
      if (valor === undefined) continue;
      if (!IDENTIFICADOR.test(nombre)) throw new Error(`Nombre de parámetro inválido: ${nombre}`);
      this.agregarEntrada(request, nombre, valor);
      asignaciones.push(`@${nombre} = @${nombre}`);
    }

    for (const [nombre, tipo] of Object.entries(opciones.salidas ?? {})) {
      if (!IDENTIFICADOR.test(nombre)) throw new Error(`Nombre de salida inválido: ${nombre}`);
      request.output(nombre, this.mapTipoSalida(tipo));
      asignaciones.push(`@${nombre} = @${nombre} OUTPUT`);
    }

    const setContexto =
      opciones.idUsuario !== undefined && opciones.idUsuario !== null
        ? `EXEC sys.sp_set_session_context @key = N'Id_Usuario', @value = ${Number(opciones.idUsuario)};`
        : `EXEC sys.sp_set_session_context @key = N'Id_Usuario', @value = NULL;`;

    const lote =
      setContexto + '\n' +
      `EXEC dbo.[${nombreSP}] ${asignaciones.join(', ')};`;

    this.logger.debug(`SP ${nombreSP} (usuario: ${opciones.idUsuario ?? 'anónimo'})`);
    const resultado = await request.query(lote);
    const recordsets = (resultado.recordsets as any[][]) ?? [];

    return {
      filas: (recordsets[0] as T[]) ?? [],
      recordsets,
      salida: resultado.output ?? {},
    };
  }

  async consultarSP<T = any>(nombreSP: string, parametros: Record<string, unknown> = {}, opciones: OpcionesSP = {}): Promise<T[]> {
    return (await this.ejecutarSP<T>(nombreSP, parametros, opciones)).filas;
  }

  async consultarSPUno<T = any>(nombreSP: string, parametros: Record<string, unknown> = {}, opciones: OpcionesSP = {}): Promise<T | null> {
    const filas = await this.consultarSP<T>(nombreSP, parametros, opciones);
    return filas.length ? filas[0] : null;
  }

  async consultarVista<T = any>(nombreVista: string, filtros: Record<string, unknown> = {}): Promise<T[]> {
    if (!/^VW_[A-Za-z0-9_]+$/.test(nombreVista)) throw new Error(`Vista inválida: ${nombreVista}`);
    const pool = await this.obtenerPool();
    const request = pool.request();
    const condiciones: string[] = [];
    for (const [columna, valor] of Object.entries(filtros)) {
      if (valor === undefined) continue;
      if (!IDENTIFICADOR.test(columna)) throw new Error(`Columna inválida: ${columna}`);
      this.agregarEntrada(request, columna, valor);
      condiciones.push(`[${columna}] = @${columna}`);
    }
    const where = condiciones.length ? ` WHERE ${condiciones.join(' AND ')}` : '';
    const resultado = await request.query<T>(`SELECT * FROM dbo.[${nombreVista}]${where}`);
    return resultado.recordset ?? [];
  }

  async consultarFuncionTabla<T = any>(
    nombreFuncion: string,
    parametros: Array<unknown> = [],
  ): Promise<T[]> {
    if (!/^TF_[A-Za-z0-9_]+$/.test(nombreFuncion)) throw new Error(`Función de tabla inválida: ${nombreFuncion}`);
    const pool = await this.obtenerPool();
    const request = pool.request();
    const args: string[] = [];
    parametros.forEach((valor, i) => {
      const pName = `p${i}`;
      this.agregarEntrada(request, pName, valor ?? null);
      args.push(`@${pName}`);
    });
    const query = `SELECT * FROM dbo.[${nombreFuncion}](${args.join(', ')});`;
    this.logger.debug(`TF ${nombreFuncion}`);
    const resultado = await request.query<T>(query);
    return resultado.recordset ?? [];
  }

  async consultarQuery<T = any>(
    consulta: string,
    parametros: Record<string, unknown> = {},
  ): Promise<T[]> {
    const pool = await this.obtenerPool();
    const request = pool.request();
    for (const [nombre, valor] of Object.entries(parametros)) {
      if (valor === undefined) continue;
      this.agregarEntrada(request, nombre, valor);
    }
    const resultado = await request.query<T>(consulta);
    return (resultado.recordset as T[]) ?? [];
  }

  async healthCheck(): Promise<any> {
    try {
      const pool = await this.obtenerPool();
      const r = await pool.request().query(`
        SELECT
          DB_NAME() AS BaseDatos,
          CAST(SERVERPROPERTY('ProductVersion') AS VARCHAR(50)) AS VersionSQL,
          (SELECT COUNT(*) FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo')) AS TablasOLTP,
          (SELECT COUNT(*) FROM sys.tables WHERE schema_id = SCHEMA_ID('dw'))  AS TablasEsquemaDW,
          (SELECT COUNT(*) FROM sys.procedures WHERE is_ms_shipped = 0) AS Procedimientos,
          (SELECT COUNT(*) FROM sys.views WHERE is_ms_shipped = 0) AS Vistas,
          (SELECT COUNT(*) FROM sys.objects WHERE type IN ('FN','IF','TF')) AS Funciones,
          (SELECT COUNT(*) FROM sys.triggers WHERE is_ms_shipped = 0) AS Triggers
      `);
      return { status: 'ONLINE', info: r.recordset[0], timestamp: new Date().toISOString() };
    } catch (err: any) {
      return { status: 'OFFLINE', error: err.message, timestamp: new Date().toISOString() };
    }
  }
}
