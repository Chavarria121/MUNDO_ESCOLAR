/* =========================================================================
   PROYECTO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR
   MODULO: MÓDULO 5: ADMINISTRACIÓN DE BASE DE DATOS (DBA) Y MANTENIMIENTO
   DESCRIPCIÓN: Estrategia de Backups (FULL, DIFF, LOG), Monitoreo de Filegroups, Mantenimiento de Índices y DBCC
   TOTAL PROCEDIMIENTOS: 11
   USO EN EXPOSICIÓN: Pestaña temática lista para ejecución y demostración en SSMS 22.
   ========================================================================= */

USE MUNDO_ESCOLAR;
GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

-- =========================================================================
-- MÓDULO 9: DBA, RESPALDOS Y MONITOREO (SPs 69 a 79)
-- =========================================================================

-- 69. SP_DBA_EjecutarBackupCompleto
CREATE OR ALTER PROCEDURE dbo.SP_DBA_EjecutarBackupCompleto
    @Id_Usuario INT = NULL,
    @ArchivoGenerado NVARCHAR(500) = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @GuidStr VARCHAR(50) = CONVERT(VARCHAR(50), NEWID());
        DECLARE @FechaStr VARCHAR(20) = REPLACE(REPLACE(REPLACE(CONVERT(VARCHAR(19), GETDATE(), 120), '-', ''), ':', ''), ' ', '_');
        
        -- Confinamiento estricto en el servidor (C:\SQLBackup\) con GUID anti-colisión
        DECLARE @ArchivoBak NVARCHAR(500) = N'C:\SQLBackup\MUNDO_ESCOLAR_FULL_' + @FechaStr + N'_' + @GuidStr + N'.bak';
        SET @ArchivoGenerado = @ArchivoBak;

        DECLARE @EngineEdition INT = CAST(SERVERPROPERTY('EngineEdition') AS INT);
        DECLARE @Edicion NVARCHAR(128) = CAST(SERVERPROPERTY('Edition') AS NVARCHAR(128));

        -- Compatibilidad con SQL Server Express y Web: solo comprimir si la edición lo soporta
        IF @EngineEdition <> 4 AND @Edicion NOT LIKE '%Express%' AND @Edicion NOT LIKE '%Web%'
        BEGIN
            BACKUP DATABASE MUNDO_ESCOLAR 
            TO DISK = @ArchivoBak 
            WITH COMPRESSION, STATS = 10, CHECKSUM;
        END
        ELSE
        BEGIN
            BACKUP DATABASE MUNDO_ESCOLAR 
            TO DISK = @ArchivoBak 
            WITH STATS = 10, CHECKSUM;
        END

        DECLARE @DescDetalle VARCHAR(200) = CASE 
            WHEN @Id_Usuario IS NULL THEN LEFT(CONCAT('Respaldo completo automático (SQL Agent) en: ', @ArchivoBak), 200)
            ELSE LEFT(CONCAT('Respaldo completo manual en: ', @ArchivoBak), 200)
        END;

        INSERT INTO Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        VALUES (@Id_Usuario, 'BACKUP_FULL', 'DATABASE', 0, GETDATE(), @DescDetalle);

        SELECT 'Respaldo completo generado exitosamente.' AS Mensaje, @ArchivoBak AS Archivo;
    END TRY
    BEGIN CATCH
        INSERT INTO Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        VALUES (@Id_Usuario, 'ERROR_BACKUP_FULL', 'DATABASE', 0, GETDATE(), LEFT(CONCAT('Fallo en backup completo: ', ERROR_MESSAGE()), 200));
        THROW;
    END CATCH
END;
GO

-- 70. SP_DBA_EjecutarBackupDiferencial
CREATE OR ALTER PROCEDURE dbo.SP_DBA_EjecutarBackupDiferencial
    @Id_Usuario INT = NULL,
    @ArchivoGenerado NVARCHAR(500) = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @GuidStr VARCHAR(50) = CONVERT(VARCHAR(50), NEWID());
        DECLARE @FechaStr VARCHAR(20) = REPLACE(REPLACE(REPLACE(CONVERT(VARCHAR(19), GETDATE(), 120), '-', ''), ':', ''), ' ', '_');
        
        -- Confinamiento estricto en el servidor (C:\SQLBackup\) con GUID anti-colisión
        DECLARE @ArchivoBak NVARCHAR(500) = N'C:\SQLBackup\MUNDO_ESCOLAR_DIFF_' + @FechaStr + N'_' + @GuidStr + N'.bak';
        SET @ArchivoGenerado = @ArchivoBak;

        DECLARE @EngineEdition INT = CAST(SERVERPROPERTY('EngineEdition') AS INT);
        DECLARE @Edicion NVARCHAR(128) = CAST(SERVERPROPERTY('Edition') AS NVARCHAR(128));

        -- Compatibilidad con SQL Server Express y Web
        IF @EngineEdition <> 4 AND @Edicion NOT LIKE '%Express%' AND @Edicion NOT LIKE '%Web%'
        BEGIN
            BACKUP DATABASE MUNDO_ESCOLAR 
            TO DISK = @ArchivoBak 
            WITH DIFFERENTIAL, COMPRESSION, STATS = 10, CHECKSUM;
        END
        ELSE
        BEGIN
            BACKUP DATABASE MUNDO_ESCOLAR 
            TO DISK = @ArchivoBak 
            WITH DIFFERENTIAL, STATS = 10, CHECKSUM;
        END

        DECLARE @DescDetalle VARCHAR(200) = CASE 
            WHEN @Id_Usuario IS NULL THEN LEFT(CONCAT('Respaldo diferencial automático (SQL Agent) en: ', @ArchivoBak), 200)
            ELSE LEFT(CONCAT('Respaldo diferencial manual en: ', @ArchivoBak), 200)
        END;

        INSERT INTO Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        VALUES (@Id_Usuario, 'BACKUP_DIFF', 'DATABASE', 0, GETDATE(), @DescDetalle);

        SELECT 'Respaldo diferencial generado exitosamente.' AS Mensaje, @ArchivoBak AS Archivo;
    END TRY
    BEGIN CATCH
        INSERT INTO Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        VALUES (@Id_Usuario, 'ERROR_BACKUP_DIFF', 'DATABASE', 0, GETDATE(), LEFT(CONCAT('Fallo en backup diferencial: ', ERROR_MESSAGE()), 200));
        THROW;
    END CATCH
END;
GO

-- 71. SP_DBA_EjecutarBackupLog
CREATE OR ALTER PROCEDURE dbo.SP_DBA_EjecutarBackupLog
    @Id_Usuario INT = NULL,
    @ArchivoGenerado NVARCHAR(500) = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @RecoveryModel VARCHAR(50);
        SELECT @RecoveryModel = recovery_model_desc FROM sys.databases WHERE name = 'MUNDO_ESCOLAR';

        IF @RecoveryModel = 'SIMPLE'
        BEGIN
            SELECT 'El modelo de recuperación de MUNDO_ESCOLAR es SIMPLE; no requiere respaldo del registro de transacciones (.trn).' AS Mensaje;
            RETURN;
        END

        DECLARE @GuidStr VARCHAR(50) = CONVERT(VARCHAR(50), NEWID());
        DECLARE @FechaStr VARCHAR(20) = REPLACE(REPLACE(REPLACE(CONVERT(VARCHAR(19), GETDATE(), 120), '-', ''), ':', ''), ' ', '_');
        
        -- Confinamiento estricto en el servidor (C:\SQLBackup\) con GUID anti-colisión
        DECLARE @ArchivoTrn NVARCHAR(500) = N'C:\SQLBackup\MUNDO_ESCOLAR_LOG_' + @FechaStr + N'_' + @GuidStr + N'.trn';
        SET @ArchivoGenerado = @ArchivoTrn;

        DECLARE @EngineEdition INT = CAST(SERVERPROPERTY('EngineEdition') AS INT);
        DECLARE @Edicion NVARCHAR(128) = CAST(SERVERPROPERTY('Edition') AS NVARCHAR(128));

        -- Compatibilidad con SQL Server Express y Web: solo comprimir si la edición lo soporta
        IF @EngineEdition <> 4 AND @Edicion NOT LIKE '%Express%' AND @Edicion NOT LIKE '%Web%'
        BEGIN
            BACKUP LOG MUNDO_ESCOLAR 
            TO DISK = @ArchivoTrn 
            WITH COMPRESSION, STATS = 10, CHECKSUM;
        END
        ELSE
        BEGIN
            BACKUP LOG MUNDO_ESCOLAR 
            TO DISK = @ArchivoTrn 
            WITH STATS = 10, CHECKSUM;
        END

        DECLARE @DescDetalle VARCHAR(200) = CASE 
            WHEN @Id_Usuario IS NULL THEN LEFT(CONCAT('Respaldo de log automático (SQL Agent) en: ', @ArchivoTrn), 200)
            ELSE LEFT(CONCAT('Respaldo de log manual en: ', @ArchivoTrn), 200)
        END;

        INSERT INTO Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        VALUES (@Id_Usuario, 'BACKUP_LOG', 'DATABASE', 0, GETDATE(), @DescDetalle);

        SELECT 'Respaldo de Log ejecutado exitosamente.' AS Mensaje, @ArchivoTrn AS Archivo;
    END TRY
    BEGIN CATCH
        INSERT INTO Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        VALUES (@Id_Usuario, 'ERROR_BACKUP_LOG', 'DATABASE', 0, GETDATE(), LEFT(CONCAT('Fallo en backup de log: ', ERROR_MESSAGE()), 200));
        THROW;
    END CATCH
END;
GO

-- 72. SP_DBA_VerificarIntegridadBackup
CREATE OR ALTER PROCEDURE dbo.SP_DBA_VerificarIntegridadBackup
    @RutaArchivoBak NVARCHAR(500),
    @Id_Usuario INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- Validación canónica estricta contra Path Traversal e inyección de archivos
        IF @RutaArchivoBak LIKE '%..%' 
           OR @RutaArchivoBak LIKE '%\\%' 
           OR (@RutaArchivoBak NOT LIKE 'C:\SQLBackup\%.bak' AND @RutaArchivoBak NOT LIKE 'C:\SQLBackup\%.trn')
        BEGIN
            THROW 50001, 'Ruta de archivo no autorizada o no canónica.', 1;
        END;

        -- SINTAXIS NATIVA DIRECTA (Cero sp_executesql, erradica inyección SQL)
        RESTORE VERIFYONLY FROM DISK = @RutaArchivoBak;

        INSERT INTO Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        VALUES (@Id_Usuario, 'VERIFY_BACKUP_OK', 'DATABASE', 0, GETDATE(), LEFT(CONCAT('Archivo verificado correctamente: ', @RutaArchivoBak), 200));

        SELECT 'El archivo de respaldo es técnicamente íntegro y legible por SQL Server.' AS Resultado, @RutaArchivoBak AS Archivo;
    END TRY
    BEGIN CATCH
        INSERT INTO Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        VALUES (@Id_Usuario, 'VERIFY_BACKUP_FAIL', 'DATABASE', 0, GETDATE(), LEFT(CONCAT('Fallo en verificación de backup: ', ERROR_MESSAGE()), 200));
        THROW;
    END CATCH
END;
GO

-- 73. SP_DBA_VerificarIntegridadBD
CREATE OR ALTER PROCEDURE dbo.SP_DBA_VerificarIntegridadBD
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DBCC CHECKDB ('MUNDO_ESCOLAR') WITH NO_INFOMSGS, ALL_ERRORMSGS;

        INSERT INTO Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        VALUES (1, 'CHECKDB_OK', 'MUNDO_ESCOLAR', 0, GETDATE(), 'DBCC CHECKDB ejecutado sin errores de consistencia.');

        SELECT 'Consistencia física y lógica de MUNDO_ESCOLAR verificada: 0 errores detectados.' AS EstadoConsistencia;
    END TRY
    BEGIN CATCH
        INSERT INTO Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        VALUES (1, 'CHECKDB_ERROR', 'MUNDO_ESCOLAR', 0, GETDATE(), LEFT(CONCAT('Errores de consistencia detectados: ', ERROR_MESSAGE()), 200));
        THROW;
    END CATCH
END;
GO

-- 74. SP_DBA_MantenimientoIndices
CREATE OR ALTER PROCEDURE dbo.SP_DBA_MantenimientoIndices
    @Modo VARCHAR(20) = 'SoloAnalizar' -- 'SoloAnalizar' o 'Ejecutar'
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @Resultados TABLE (
            Tabla VARCHAR(100),
            Indice VARCHAR(100),
            Fragmentacion DECIMAL(5, 2),
            AccionRecomendada VARCHAR(50)
        );

        INSERT INTO @Resultados (Tabla, Indice, Fragmentacion, AccionRecomendada)
        SELECT 
            t.name AS Tabla,
            i.name AS Indice,
            ROUND(ps.avg_fragmentation_in_percent, 2) AS Fragmentacion,
            CASE 
                WHEN ps.avg_fragmentation_in_percent > 30.0 THEN 'ALTER INDEX REBUILD'
                WHEN ps.avg_fragmentation_in_percent BETWEEN 10.0 AND 30.0 THEN 'ALTER INDEX REORGANIZE'
                ELSE 'Ninguna (Fragmentación aceptable)'
            END AS AccionRecomendada
        FROM sys.dm_db_index_physical_stats(DB_ID('MUNDO_ESCOLAR'), NULL, NULL, NULL, 'LIMITED') ps
        INNER JOIN sys.tables t ON ps.object_id = t.object_id
        INNER JOIN sys.indexes i ON ps.object_id = i.object_id AND ps.index_id = i.index_id
        WHERE ps.page_count > 10 -- Evaluar índices significativos
          AND i.name IS NOT NULL;

        IF UPPER(@Modo) = 'EJECUTAR'
        BEGIN
            DECLARE @T VARCHAR(100), @I VARCHAR(100), @Accion VARCHAR(50);
            DECLARE cur_idx CURSOR LOCAL FAST_FORWARD FOR
                SELECT Tabla, Indice, AccionRecomendada FROM @Resultados WHERE AccionRecomendada LIKE 'ALTER INDEX%';

            OPEN cur_idx;
            FETCH NEXT FROM cur_idx INTO @T, @I, @Accion;
            WHILE @@FETCH_STATUS = 0
            BEGIN
                DECLARE @SqlIndex NVARCHAR(MAX) = @Accion + ' [' + @I + '] ON dbo.[' + @T + '];';
                EXEC sp_executesql @SqlIndex;
                FETCH NEXT FROM cur_idx INTO @T, @I, @Accion;
            END
            CLOSE cur_idx;
            DEALLOCATE cur_idx;

            INSERT INTO Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
            VALUES (1, 'MANTENIMIENTO_INDICES', 'INDICES', 0, GETDATE(), 'Mantenimiento de índices ejecutado.');
        END

        SELECT * FROM @Resultados ORDER BY Fragmentacion DESC;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 75. SP_DBA_ActualizarEstadisticas
CREATE OR ALTER PROCEDURE dbo.SP_DBA_ActualizarEstadisticas
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        UPDATE STATISTICS dbo.Venta WITH FULLSCAN;
        UPDATE STATISTICS dbo.Factura WITH FULLSCAN;
        UPDATE STATISTICS dbo.Pago WITH FULLSCAN;
        UPDATE STATISTICS dbo.Producto WITH FULLSCAN;
        UPDATE STATISTICS dbo.Movimiento_Inventario WITH FULLSCAN;

        INSERT INTO Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        VALUES (1, 'ESTADISTICAS_ACTUALIZADAS', 'TABLAS_CRITICAS', 0, GETDATE(), 'Actualización con FULLSCAN en tablas transaccionales de alto volumen.');

        SELECT 'Estadísticas de consulta actualizadas para tablas de alta concurrencia.' AS Mensaje, GETDATE() AS FechaHora;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 76. SP_DBA_MonitorearEspacioArchivos
CREATE OR ALTER PROCEDURE dbo.SP_DBA_MonitorearEspacioArchivos
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        name AS NombreLogico,
        type_desc AS TipoArchivo,
        physical_name AS RutaFisica,
        ROUND((size * 8.0) / 1024.0, 2) AS TamanoAsignadoMB,
        ROUND(((size - FILEPROPERTY(name, 'SpaceUsed')) * 8.0) / 1024.0, 2) AS EspacioLibreInternoMB,
        ROUND((((size - FILEPROPERTY(name, 'SpaceUsed')) * 1.0) / size) * 100.0, 2) AS PorcentajeEspacioLibre,
        CASE 
            WHEN ((((size - FILEPROPERTY(name, 'SpaceUsed')) * 1.0) / size) * 100.0) < 15.0 THEN 'ALERTA: Espacio libre menor al 15%'
            ELSE 'Óptimo'
        END AS EstadoAlerta
    FROM sys.database_files;
END;
GO

-- 77. SP_DBA_ConsultarHistorialBackups
CREATE OR ALTER PROCEDURE dbo.SP_DBA_ConsultarHistorialBackups
    @DiasAtras INT = 30
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        bs.database_name AS BaseDatos,
        CASE bs.type 
            WHEN 'D' THEN 'Completo (Full)'
            WHEN 'I' THEN 'Diferencial'
            WHEN 'L' THEN 'Log de Transacciones'
            ELSE bs.type
        END AS TipoRespaldo,
        bs.backup_start_date AS Inicio,
        bs.backup_finish_date AS Fin,
        ROUND((bs.backup_size / 1048576.0), 2) AS TamanoMB,
        ROUND((bs.compressed_backup_size / 1048576.0), 2) AS TamanoComprimidoMB,
        bmf.physical_device_name AS ArchivoDestino,
        bs.user_name AS UsuarioEjecutor
    FROM msdb.dbo.backupset bs
    INNER JOIN msdb.dbo.backupmediafamily bmf ON bs.media_set_id = bmf.media_set_id
    WHERE bs.database_name = 'MUNDO_ESCOLAR'
      AND bs.backup_start_date >= DATEADD(DAY, -@DiasAtras, GETDATE())
    ORDER BY bs.backup_start_date DESC;
END;
GO

-- 78. SP_DBA_MonitorearBloqueosYSesiones
CREATE OR ALTER PROCEDURE dbo.SP_DBA_MonitorearBloqueosYSesiones
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        r.session_id AS SessionID,
        s.login_name AS LoginName,
        s.host_name AS HostName,
        r.status AS Estado,
        r.blocking_session_id AS BloqueadoPorSessionID,
        r.wait_type AS TipoEspera,
        r.wait_time AS TiempoEsperaMs,
        t.text AS ConsultaEjecutada
    FROM sys.dm_exec_requests r
    INNER JOIN sys.dm_exec_sessions s ON r.session_id = s.session_id
    CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t
    WHERE r.session_id <> @@SPID;
END;
GO

-- 79. SP_DBA_AuditoriaPermisosFallidos
CREATE OR ALTER PROCEDURE dbo.SP_DBA_AuditoriaPermisosFallidos
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        Id_Bitacora,
        Fecha_Hora,
        Id_Usuario,
        Accion,
        Tabla_Afectada,
        Descripcion
    FROM Bitacora
    WHERE Accion LIKE '%ERROR%' 
       OR Accion LIKE '%DENEGADO%' 
       OR Accion LIKE '%FALLIDO%'
       OR Descripcion LIKE '%denegad%'
    ORDER BY Fecha_Hora DESC;
END;
GO
