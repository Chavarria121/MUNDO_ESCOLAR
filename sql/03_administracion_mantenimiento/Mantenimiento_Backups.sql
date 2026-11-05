/* =========================================================================
   PROYECTO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR
   ARCHIVO: Mantenimiento_Backups.sql (SCRIPT MAESTRO CONSOLIDADO DE DBA)
   ESTILO: TORRENTES (SSMS 22)
   REFERENCIA DOCUMENTACIÓN: Sección 17.8.20 a 17.8.32 (Páginas 449-455)
   DESCRIPCIÓN: 
     Procedimientos y comandos operativos de administración de base de datos:
       - 20_Backup_Completo.sql
       - 21_Backup_Diferencial.sql
       - 22_Backup_Log.sql
       - 23_Verificar_Backup.sql
       - 24_Restore_Prueba.sql
       - 26_Verificar_Integridad.sql
       - 27_Revisar_Indices.sql
       - 28_Actualizar_Estadisticas.sql
       - 29_Monitorear_Espacio.sql
       - 30_Revisar_Errores_SQLServer.sql
       - 31_Revisar_UsuariosInactivos.sql
       - 32_RevisarEstadoRespaldos.sql
   ========================================================================= */

USE MUNDO_ESCOLAR
GO

-- 1. EJECUCIÓN DE RESPALDO COMPLETO (20_Backup_Completo.sql)
PRINT '=== 1. EJECUTANDO RESPALDO COMPLETO ===';
EXEC dbo.SP_DBA_EjecutarBackupCompleto @RutaCarpetaBackup = 'C:\SQLBackup';
GO

-- 2. EJECUCIÓN DE RESPALDO DIFERENCIAL (21_Backup_Diferencial.sql)
PRINT '=== 2. EJECUTANDO RESPALDO DIFERENCIAL ===';
EXEC dbo.SP_DBA_EjecutarBackupDiferencial @RutaCarpetaBackup = 'C:\SQLBackup';
GO

-- 3. EJECUCIÓN DE RESPALDO DEL REGISTRO DE TRANSACCIONES (22_Backup_Log.sql)
PRINT '=== 3. RESPALDO DE LOG ===';
EXEC dbo.SP_DBA_EjecutarBackupLog @RutaCarpetaBackup = 'C:\SQLBackup';
GO

-- 4. VERIFICACIÓN DE INTEGRIDAD DE RESPALDOS (23_Verificar_Backup.sql)
PRINT '=== 4. VERIFICACIÓN TÉCNICA DE RESPALDOS ===';
DECLARE @UltimoBak VARCHAR(500);
SELECT TOP 1 @UltimoBak = bmf.physical_device_name
FROM msdb.dbo.backupset bs
INNER JOIN msdb.dbo.backupmediafamily bmf ON bs.media_set_id = bmf.media_set_id
WHERE bs.database_name = 'MUNDO_ESCOLAR'
ORDER BY bs.backup_start_date DESC;

IF @UltimoBak IS NOT NULL
BEGIN
    PRINT CONCAT('Verificando archivo: ', @UltimoBak);
    EXEC dbo.SP_DBA_VerificarIntegridadBackup @RutaArchivoBak = @UltimoBak;
END
ELSE
    PRINT 'No se encontraron respaldos previos en msdb.';
GO

-- 5. SIMULACIÓN DE RESTORE DE PRUEBA EN AMBIENTE DE CONTINGENCIA (24_Restore_Prueba.sql)
PRINT '=== 5. PROCEDIMIENTO DE RESTORE EN AMBIENTE DE PRUEBA ===';
PRINT 'El script 24_Restore_Prueba.sql se ejecuta exclusivamente en servidor de pruebas o contingencia.';
PRINT 'Comando estándar: RESTORE DATABASE MUNDO_ESCOLAR_TEST FROM DISK = ''C:\SQLBackup\...bak'' WITH MOVE ...;';
GO

-- 6. VERIFICACIÓN DE INTEGRIDAD FÍSICA Y LÓGICA (26_Verificar_Integridad.sql)
PRINT '=== 6. VERIFICANDO INTEGRIDAD CON DBCC CHECKDB ===';
EXEC dbo.SP_DBA_VerificarIntegridadBD;
GO

-- 7. REVISIÓN Y MANTENIMIENTO DE ÍNDICES (27_Revisar_Indices.sql)
PRINT '=== 7. ANÁLISIS DE FRAGMENTACIÓN DE ÍNDICES ===';
EXEC dbo.SP_DBA_MantenimientoIndices @Modo = 'SoloAnalizar';
GO

-- 8. ACTUALIZACIÓN DE ESTADÍSTICAS DEL OPTIMIZADOR (28_Actualizar_Estadisticas.sql)
PRINT '=== 8. ACTUALIZANDO ESTADÍSTICAS ===';
EXEC dbo.SP_DBA_ActualizarEstadisticas;
GO

-- 9. MONITOREO DE ESPACIO DE ARCHIVOS MDF Y LDF (29_Monitorear_Espacio.sql)
PRINT '=== 9. MONITOREO DE ESPACIO FÍSICO ===';
EXEC dbo.SP_DBA_MonitorearEspacioArchivos;
GO

-- 10. REVISIÓN DE ERRORES DEL MOTOR SQL SERVER (30_Revisar_Errores_SQLServer.sql)
PRINT '=== 10. REVISIÓN DE ERRORLOG ===';
BEGIN TRY
    EXEC xp_readerrorlog 0, 1, N'error', NULL, NULL, NULL, N'desc';
END TRY
BEGIN CATCH
    PRINT 'Permiso VIEW SERVER STATE requerido para lectura directa de errorlog.';
END CATCH
GO

-- 11. REVISIÓN DE USUARIOS INACTIVOS (31_Revisar_UsuariosInactivos.sql)
PRINT '=== 11. AUDITORÍA DE USUARIOS INACTIVOS ===';
SELECT 
    Id_Usuario,
    Nombre_Usuario,
    Correo,
    Fecha_Registro,
    Estado
FROM Usuario
WHERE Estado = 0;
GO

-- 12. REVISIÓN DE HISTORIAL DE RESPALDOS (32_RevisarEstadoRespaldos.sql)
PRINT '=== 12. HISTORIAL DE RESPALDOS EJECUTADOS ===';
EXEC dbo.SP_DBA_ConsultarHistorialBackups @DiasAtras = 30;
GO

PRINT 'Rutina de mantenimiento y auditoría DBA finalizada.';
GO
