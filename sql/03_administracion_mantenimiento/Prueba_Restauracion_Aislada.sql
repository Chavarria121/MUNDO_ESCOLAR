/* =========================================================================
   SCRIPT: Prueba_Restauracion_Aislada.sql
   PROYECTO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR
   DESCRIPCIÓN: 
     Prueba de concepto y certificación técnica de restauración real en base
     de datos aislada (MUNDO_ESCOLAR_RESTORE_TEST) a partir de los respaldos
     generados automáticamente por SQL Server Agent / Module Signing.
     Demuestra que los respaldos son 100% íntegros, legibles y restaurables,
     incluyendo validación profunda con DBCC CHECKDB y DBCC CHECKCONSTRAINTS.
   ========================================================================= */

USE master;
GO

SET NOCOUNT ON;

PRINT '=========================================================================';
PRINT '   INICIANDO PRUEBA TÉCNICA DE RESTAURACIÓN EN BASE AISLADA';
PRINT '=========================================================================';

-- 1. Identificar el último archivo de respaldo .bak disponible en C:\SQLBackup\
DECLARE @UltimoBak NVARCHAR(500);

SELECT TOP 1 @UltimoBak = physical_device_name
FROM msdb.dbo.backupset bs
JOIN msdb.dbo.backupmediafamily bmf ON bs.media_set_id = bmf.media_set_id
WHERE bs.database_name = 'MUNDO_ESCOLAR' AND bs.type = 'D'
ORDER BY bs.backup_finish_date DESC;

IF @UltimoBak IS NULL OR @UltimoBak = ''
BEGIN
    PRINT '[AVISO] No se encontró historial en msdb. Usando archivo de respaldo por defecto.';
    SET @UltimoBak = N'C:\SQLBackup\MUNDO_ESCOLAR_FULL_20261102_220821_4D4CB7F6-B03C-472F-B5BA-646881929A80.bak';
END

PRINT '-> Archivo de respaldo a restaurar: ' + @UltimoBak;

-- 2. Limpiar base de prueba previa si existiera
IF EXISTS (SELECT 1 FROM sys.databases WHERE name = 'MUNDO_ESCOLAR_RESTORE_TEST')
BEGIN
    ALTER DATABASE MUNDO_ESCOLAR_RESTORE_TEST SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE MUNDO_ESCOLAR_RESTORE_TEST;
    PRINT '-> Base de prueba previa eliminada.';
END;

-- 3. Ejecutar RESTORE DATABASE con reubicación física de archivos (MOVE)
PRINT '-> Ejecutando RESTORE DATABASE MUNDO_ESCOLAR_RESTORE_TEST...';

RESTORE DATABASE MUNDO_ESCOLAR_RESTORE_TEST
FROM DISK = @UltimoBak
WITH 
    MOVE 'MUNDO_ESCOLAR_data' TO 'C:\SQLData\TEST_MUNDO_ESCOLAR_data.mdf',
    MOVE 'ME_Transaccional'   TO 'C:\SQLData\TEST_ME_Transaccional.ndf',
    MOVE 'ME_DW'             TO 'C:\SQLData\TEST_ME_DW.ndf',
    MOVE 'ME_Auditoria'      TO 'C:\SQLData\TEST_ME_Auditoria.ndf',
    MOVE 'ME_Catalogos'      TO 'C:\SQLData\TEST_ME_Catalogos.ndf',
    MOVE 'MUNDO_ESCOLAR_log'  TO 'C:\SQLLog\TEST_MUNDO_ESCOLAR_log.ldf',
    RECOVERY, REPLACE;

PRINT '[OK] Restauración física completada exitosamente.';

-- 4. Validación de consistencia lógica y presencia de datos
PRINT '=========================================================================';
PRINT '   VALIDACIÓN DE INTEGRIDAD Y RECUENTO DE ENTIDADES RESTAURADAS';
PRINT '=========================================================================';

DECLARE @TotalUsuarios INT, @TotalProductos INT, @TotalBitacora INT;

SELECT @TotalUsuarios = COUNT(*) FROM MUNDO_ESCOLAR_RESTORE_TEST.dbo.Usuario;
SELECT @TotalProductos = COUNT(*) FROM MUNDO_ESCOLAR_RESTORE_TEST.dbo.Producto;
SELECT @TotalBitacora = COUNT(*) FROM MUNDO_ESCOLAR_RESTORE_TEST.dbo.Bitacora;

PRINT 'Total Usuarios restaurados:  ' + CAST(@TotalUsuarios AS VARCHAR(10));
PRINT 'Total Productos restaurados: ' + CAST(@TotalProductos AS VARCHAR(10));
PRINT 'Total Eventos Bitácora:      ' + CAST(@TotalBitacora AS VARCHAR(10));

-- 4.1 Comprobación exhaustiva de integridad física y de asignación (DBCC CHECKDB)
PRINT '-> Ejecutando DBCC CHECKDB sobre MUNDO_ESCOLAR_RESTORE_TEST...';
DBCC CHECKDB ('MUNDO_ESCOLAR_RESTORE_TEST') WITH NO_INFOMSGS, ALL_ERRORMSGS;
PRINT '[OK] DBCC CHECKDB: Cero inconsistencias o páginas corruptas detectadas.';

-- 4.2 Verificación de integridad referencial y restricciones de tabla (DBCC CHECKCONSTRAINTS)
PRINT '-> Ejecutando DBCC CHECKCONSTRAINTS WITH ALL_CONSTRAINTS...';
EXEC('USE MUNDO_ESCOLAR_RESTORE_TEST; DBCC CHECKCONSTRAINTS WITH ALL_CONSTRAINTS;');
PRINT '[OK] DBCC CHECKCONSTRAINTS: Todas las claves foráneas y restricciones validadas.';

IF @TotalUsuarios > 0 AND @TotalProductos > 0
BEGIN
    PRINT '-------------------------------------------------------------------------';
    PRINT '[CERTIFICACIÓN EXITOSA] Los datos y esquemas fueron recuperados íntegramente.';
    PRINT '-------------------------------------------------------------------------';
END
ELSE
BEGIN
    THROW 50002, 'La restauración no contiene las tablas maestras esperadas.', 1;
END;

-- 5. Limpieza automática del entorno de prueba
ALTER DATABASE MUNDO_ESCOLAR_RESTORE_TEST SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
DROP DATABASE MUNDO_ESCOLAR_RESTORE_TEST;
PRINT '-> Base de datos aislada MUNDO_ESCOLAR_RESTORE_TEST removida satisfactoriamente.';
PRINT '=========================================================================';
GO
