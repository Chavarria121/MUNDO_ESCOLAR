/* =========================================================================
   SCRIPT 05: CREACIÓN DE JOBS EN SQL SERVER AGENT (EDICIONES COMPLETAS)
   PROYECTO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR
   COMPATIBILIDAD: SQL Server Developer, Standard y Enterprise
   DESCRIPCIÓN: 
     Configura automáticamente los tres trabajos programados en SQL Agent:
       1. Respaldo Completo Semanal (Domingos 01:00 AM)
       2. Respaldo Diferencial Diario (Lunes a Sábado 01:00 AM)
       3. Respaldo de Registro de Transacciones (Cada 4 horas si modelo es FULL)
     En SQL Server Express, el script desactiva su ejecución mediante SET NOEXEC ON
     para no generar errores en msdb y redirige a Windows Task Scheduler.
   ========================================================================= */

USE msdb;
GO

SET NOCOUNT ON;

PRINT '=========================================================================';
PRINT '   CONFIGURACIÓN DE JOBS DE SQL SERVER AGENT - MUNDO ESCOLAR';
PRINT '=========================================================================';

-- 1. Validar si SQL Server Agent está habilitado y disponible (Express NO soporta Agent)
IF NOT EXISTS (SELECT 1 FROM sys.configurations WHERE name = 'Agent XPs' AND value_in_use = 1)
   OR CAST(SERVERPROPERTY('EngineEdition') AS INT) = 4
   OR CAST(SERVERPROPERTY('Edition') AS NVARCHAR(128)) LIKE '%Express%'
BEGIN
    PRINT '[AVISO] SQL Server Agent no está activo o la instancia es SQL Server Express.';
    PRINT '-> Omitiendo creación de jobs. Para SQL Server Express utilice:';
    PRINT '   sql/03_administracion_mantenimiento/04_Automatizacion_Respaldos_TaskScheduler.bat';
    SET NOEXEC ON; -- Desactiva la ejecución de los lotes subsiguientes de forma segura
END;
GO

-- =========================================================================
-- JOB 1: RESPALDO COMPLETO SEMANAL
-- =========================================================================
DECLARE @JobId BINARY(16);

IF EXISTS (SELECT job_id FROM msdb.dbo.sysjobs WHERE name = N'MundoEscolar_Backup_Semanal')
    EXEC sp_delete_job @job_name = N'MundoEscolar_Backup_Semanal';

EXEC sp_add_job 
    @job_name = N'MundoEscolar_Backup_Semanal',
    @enabled = 1,
    @description = N'Respaldo completo de la base de datos MUNDO_ESCOLAR con compatibilidad multi-edición y GUID.',
    @category_name = N'Database Maintenance',
    @job_id = @JobId OUTPUT;

EXEC sp_add_jobstep 
    @job_name = N'MundoEscolar_Backup_Semanal',
    @step_name = N'Ejecutar Backup Completo',
    @subsystem = N'TSQL',
    @command = N'EXEC MUNDO_ESCOLAR.dbo.SP_DBA_EjecutarBackupCompleto @Id_Usuario = NULL;',
    @database_name = N'MUNDO_ESCOLAR',
    @on_success_action = 1,
    @on_fail_action = 2;

EXEC sp_add_jobschedule 
    @job_name = N'MundoEscolar_Backup_Semanal',
    @name = N'Horario_Semanal_Domingo_01AM',
    @freq_type = 8,        -- Semanal
    @freq_interval = 1,    -- Domingo
    @freq_recurrence_factor = 1,
    @active_start_time = 010000; -- 01:00 AM

EXEC sp_add_jobserver 
    @job_name = N'MundoEscolar_Backup_Semanal',
    @server_name = N'(LOCAL)';

PRINT '[OK] Job "MundoEscolar_Backup_Semanal" configurado (Domingos 01:00 AM).';
GO

-- =========================================================================
-- JOB 2: RESPALDO DIFERENCIAL DIARIO
-- =========================================================================
DECLARE @JobId BINARY(16);

IF EXISTS (SELECT job_id FROM msdb.dbo.sysjobs WHERE name = N'MundoEscolar_Backup_Diferencial')
    EXEC sp_delete_job @job_name = N'MundoEscolar_Backup_Diferencial';

EXEC sp_add_job 
    @job_name = N'MundoEscolar_Backup_Diferencial',
    @enabled = 1,
    @description = N'Respaldo diferencial diario de MUNDO_ESCOLAR con compatibilidad multi-edición y GUID.',
    @category_name = N'Database Maintenance',
    @job_id = @JobId OUTPUT;

EXEC sp_add_jobstep 
    @job_name = N'MundoEscolar_Backup_Diferencial',
    @step_name = N'Ejecutar Backup Diferencial',
    @subsystem = N'TSQL',
    @command = N'EXEC MUNDO_ESCOLAR.dbo.SP_DBA_EjecutarBackupDiferencial @Id_Usuario = NULL;',
    @database_name = N'MUNDO_ESCOLAR',
    @on_success_action = 1,
    @on_fail_action = 2;

EXEC sp_add_jobschedule 
    @job_name = N'MundoEscolar_Backup_Diferencial',
    @name = N'Horario_Diario_Lunes_a_Sabado_01AM',
    @freq_type = 8,         -- Semanal
    @freq_interval = 126,   -- Lunes a Sábado (2+4+8+16+32+64)
    @freq_recurrence_factor = 1,
    @active_start_time = 010000; -- 01:00 AM

EXEC sp_add_jobserver 
    @job_name = N'MundoEscolar_Backup_Diferencial',
    @server_name = N'(LOCAL)';

PRINT '[OK] Job "MundoEscolar_Backup_Diferencial" configurado (Lunes a Sábado 01:00 AM).';
GO

-- =========================================================================
-- JOB 3: RESPALDO DE LOG CADA 4 HORAS (CONDICIONAL)
-- =========================================================================
DECLARE @JobId BINARY(16);

IF EXISTS (SELECT job_id FROM msdb.dbo.sysjobs WHERE name = N'MundoEscolar_Backup_Log')
    EXEC sp_delete_job @job_name = N'MundoEscolar_Backup_Log';

EXEC sp_add_job 
    @job_name = N'MundoEscolar_Backup_Log',
    @enabled = 1,
    @description = N'Respaldo periódico del log de transacciones de MUNDO_ESCOLAR con compatibilidad multi-edición y GUID.',
    @category_name = N'Database Maintenance',
    @job_id = @JobId OUTPUT;

EXEC sp_add_jobstep 
    @job_name = N'MundoEscolar_Backup_Log',
    @step_name = N'Ejecutar Backup Log',
    @subsystem = N'TSQL',
    @command = N'EXEC MUNDO_ESCOLAR.dbo.SP_DBA_EjecutarBackupLog @Id_Usuario = NULL;',
    @database_name = N'MUNDO_ESCOLAR',
    @on_success_action = 1,
    @on_fail_action = 2;

EXEC sp_add_jobschedule 
    @job_name = N'MundoEscolar_Backup_Log',
    @name = N'Horario_Cada_4_Horas',
    @freq_type = 4,         -- Diario
    @freq_interval = 1,
    @freq_subday_type = 8,  -- Horas
    @freq_subday_interval = 4,
    @active_start_time = 000000;

EXEC sp_add_jobserver 
    @job_name = N'MundoEscolar_Backup_Log',
    @server_name = N'(LOCAL)';

PRINT '[OK] Job "MundoEscolar_Backup_Log" configurado (Cada 4 horas).';
PRINT '=========================================================================';
PRINT '   TODOS LOS JOBS FUERON CONFIGURADOS EXITOSAMENTE';
PRINT '=========================================================================';
GO

-- Restaurar ejecución normal de lotes
SET NOEXEC OFF;
GO
