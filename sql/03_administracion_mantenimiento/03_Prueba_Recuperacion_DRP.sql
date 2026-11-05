/* =========================================================================
   SCRIPT 03: PRUEBA DE RECUPERACIÓN ANTE DESASTRES (DRP) NO DESTRUCTIVA
   PROYECTO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR
   ESTILO: TORRENTES (SSMS 22)
   DESCRIPCIÓN: 
     Restaura de forma temporal y automatizada el último respaldo COMPLETO
     en una base de datos secundaria aislada (MUNDO_ESCOLAR_DRP_TEST),
     ejecuta validación lógica profunda con DBCC CHECKDB y procede a su
     eliminación segura, certificando que el respaldo es 100% restaurable.
   ========================================================================= */

USE master;
GO

SET NOCOUNT ON;

PRINT '=========================================================================';
PRINT '   INICIANDO PRUEBA DE RECUPERACIÓN ANTE DESASTRES (DRP)';
PRINT '=========================================================================';

-- 1. Identificar el archivo de respaldo COMPLETO más reciente
DECLARE @UltimoBak VARCHAR(500);

SELECT TOP 1 @UltimoBak = bmf.physical_device_name
FROM msdb.dbo.backupset bs
INNER JOIN msdb.dbo.backupmediafamily bmf ON bs.media_set_id = bmf.media_set_id
WHERE bs.database_name = 'MUNDO_ESCOLAR' 
  AND bs.type = 'D' -- Respaldo completo
ORDER BY bs.backup_finish_date DESC;

IF @UltimoBak IS NULL
BEGIN
    -- Fallback si no hay registros en msdb: buscar archivo en C:\SQLBackup
    SET @UltimoBak = 'C:\SQLBackup\MUNDO_ESCOLAR_FULL.bak';
END;

PRINT CONCAT('-> Archivo de respaldo seleccionado para prueba: ', @UltimoBak);

-- 2. Detectar ruta de almacenamiento para los archivos temporales de prueba
DECLARE @DataPath NVARCHAR(500);
SELECT @DataPath = SUBSTRING(physical_name, 1, LEN(physical_name) - CHARINDEX('\', REVERSE(physical_name)) + 1)
FROM sys.master_files
WHERE database_id = DB_ID('master') AND file_id = 1;

IF @DataPath IS NULL OR @DataPath = ''
BEGIN
    SET @DataPath = 'C:\SQLData\';
END;

-- 3. Limpieza preventiva en caso de ejecuciones anteriores incompletas
IF EXISTS (SELECT 1 FROM sys.databases WHERE name = 'MUNDO_ESCOLAR_DRP_TEST')
BEGIN
    PRINT '-> Eliminando base de datos de prueba previa MUNDO_ESCOLAR_DRP_TEST...';
    ALTER DATABASE MUNDO_ESCOLAR_DRP_TEST SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE MUNDO_ESCOLAR_DRP_TEST;
END;

-- 4. Construcción dinámica del comando RESTORE DATABASE con MOVE
PRINT '-> Restaurando base de prueba MUNDO_ESCOLAR_DRP_TEST desde el archivo .bak...';

DECLARE @SqlRestore NVARCHAR(MAX) = N'
RESTORE DATABASE MUNDO_ESCOLAR_DRP_TEST
FROM DISK = ''' + @UltimoBak + '''
WITH 
    MOVE ''MUNDO_ESCOLAR_data'' TO ''' + @DataPath + 'ME_DRP_Test_data.mdf'',
    MOVE ''ME_Transaccional''   TO ''' + @DataPath + 'ME_DRP_Test_trans.ndf'',
    MOVE ''ME_DW''              TO ''' + @DataPath + 'ME_DRP_Test_dw.ndf'',
    MOVE ''ME_Auditoria''       TO ''' + @DataPath + 'ME_DRP_Test_audi.ndf'',
    MOVE ''ME_Catalogos''       TO ''' + @DataPath + 'ME_DRP_Test_cata.ndf'',
    MOVE ''MUNDO_ESCOLAR_log''  TO ''' + @DataPath + 'ME_DRP_Test_log.ldf'',
    REPLACE, RECOVERY, STATS = 25;
';

BEGIN TRY
    EXEC sp_executesql @SqlRestore;
    PRINT '[OK] Base de datos de prueba MUNDO_ESCOLAR_DRP_TEST restaurada exitosamente.';

    -- 5. Ejecución de DBCC CHECKDB sobre la base restaurada
    PRINT '-> Ejecutando DBCC CHECKDB sobre la base restaurada...';
    DBCC CHECKDB ('MUNDO_ESCOLAR_DRP_TEST') WITH NO_INFOMSGS, ALL_ERRORMSGS;
    PRINT '[OK] DBCC CHECKDB completado sin inconsistencias físicas ni lógicas.';

    -- 6. Eliminación limpia de la base de prueba y sus archivos
    PRINT '-> Limpiando base de prueba temporal...';
    ALTER DATABASE MUNDO_ESCOLAR_DRP_TEST SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE MUNDO_ESCOLAR_DRP_TEST;
    PRINT '[OK] Base de datos temporal eliminada correctamente.';

    PRINT '=========================================================================';
    PRINT '   CERTIFICACIÓN DRP COMPLETADA EXITOSAMENTE:';
    PRINT '   El archivo de respaldo fue restaurado y verificado al 100%.';
    PRINT '=========================================================================';
END TRY
BEGIN CATCH
    PRINT CONCAT('[ERROR] Falló la prueba DRP de restauración: ', ERROR_MESSAGE());
    IF EXISTS (SELECT 1 FROM sys.databases WHERE name = 'MUNDO_ESCOLAR_DRP_TEST')
    BEGIN
        ALTER DATABASE MUNDO_ESCOLAR_DRP_TEST SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
        DROP DATABASE MUNDO_ESCOLAR_DRP_TEST;
    END;
    THROW;
END CATCH;
GO

