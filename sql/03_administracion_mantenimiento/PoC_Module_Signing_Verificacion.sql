/* =========================================================================
   PROYECTO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR
   SCRIPT: PoC_Module_Signing_Verificacion.sql
   PROPÓSITO: Demostración técnica reproducible de Module Signing
              con TRUSTWORTHY OFF y Principio de Mínimo Privilegio (PoLP).
   AUTOR: Equipo de Desarrollo y DBA Mundo Escolar
   VALIDACIÓN: Microsoft SQL Server 2022 / 2025
   ========================================================================= */

USE master;
GO

-- 1. LIMPIEZA PREVIA Y CREACIÓN DE BASE DE DATOS AISLADA
IF EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'login_app_test')
    DROP LOGIN login_app_test;
IF EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'login_cert_poc_dba')
    DROP LOGIN login_cert_poc_dba;
IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'usr_cert_master')
    DROP USER usr_cert_master;
IF EXISTS (SELECT 1 FROM sys.certificates WHERE name = 'Cert_PoC_DBA')
    DROP CERTIFICATE Cert_PoC_DBA;

IF EXISTS (SELECT 1 FROM sys.databases WHERE name = 'MUNDO_ESCOLAR_POC_TEST')
BEGIN
    ALTER DATABASE MUNDO_ESCOLAR_POC_TEST SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE MUNDO_ESCOLAR_POC_TEST;
END
GO

CREATE DATABASE MUNDO_ESCOLAR_POC_TEST;
GO

-- COMPROBACIÓN CRÍTICA: TRUSTWORTHY PERMANECE APAGADO (OFF)
ALTER DATABASE MUNDO_ESCOLAR_POC_TEST SET TRUSTWORTHY OFF;
GO

SELECT name, is_trustworthy_on 
FROM sys.databases 
WHERE name = 'MUNDO_ESCOLAR_POC_TEST';
-- Resultado esperado: is_trustworthy_on = 0 (OFF)
GO

-- 2. CREACIÓN DE MASTER KEY Y CERTIFICADO EN LA BASE DE PRUEBA
USE MUNDO_ESCOLAR_POC_TEST;
GO

CREATE MASTER KEY ENCRYPTION BY PASSWORD = 'MasterKeyPassword2026*!Complex';
GO

CREATE CERTIFICATE Cert_PoC_DBA 
WITH SUBJECT = 'Certificado PoC Firma DBA Mundo Escolar';
GO

-- Crear principal de base de datos asociado al certificado con permisos de respaldo
CREATE USER usr_cert_dba FROM CERTIFICATE Cert_PoC_DBA;
GRANT BACKUP DATABASE TO usr_cert_dba;
GRANT BACKUP LOG TO usr_cert_dba;
GO

-- 3. EXPORTAR CLAVE PÚBLICA DEL CERTIFICADO E IMPORTAR EN MASTER
-- Se utiliza un identificador único para permitir ejecuciones consecutivas sin conflicto de archivo existente
DECLARE @RutaCer VARCHAR(500) = 'C:\SQLBackup\Cert_PoC_DBA_' + REPLACE(CONVERT(VARCHAR(50), NEWID()), '-', '') + '.cer';
DECLARE @SqlExport NVARCHAR(MAX) = N'BACKUP CERTIFICATE Cert_PoC_DBA TO FILE = ''' + @RutaCer + ''';';
EXEC sp_executesql @SqlExport;

DECLARE @SqlImport NVARCHAR(MAX) = N'
USE master;
IF EXISTS (SELECT 1 FROM sys.certificates WHERE name = ''Cert_PoC_DBA'')
    DROP CERTIFICATE Cert_PoC_DBA;
CREATE CERTIFICATE Cert_PoC_DBA FROM FILE = ''' + @RutaCer + ''';
';
EXEC sp_executesql @SqlImport;
GO

USE master;
GO

-- Crear login mapeado al certificado en master y conceder permisos necesarios
IF EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'login_cert_poc_dba')
    DROP LOGIN login_cert_poc_dba;
GO

CREATE LOGIN login_cert_poc_dba FROM CERTIFICATE Cert_PoC_DBA;
GO

-- AUTHENTICATE SERVER permite que el token del certificado en la base de usuario
-- cruce la frontera hacia master sin requerir TRUSTWORTHY ON.
GRANT AUTHENTICATE SERVER TO login_cert_poc_dba;
-- CREATE ANY DATABASE satisface el requisito interno de RESTORE VERIFYONLY.
GRANT CREATE ANY DATABASE TO login_cert_poc_dba;
GO

-- 4. CREAR PROCEDIMIENTOS ESTÁTICOS NATIVOS EN LA BASE DE PRUEBA
USE MUNDO_ESCOLAR_POC_TEST;
GO

-- Procedimiento de respaldo completo (Sintaxis nativa estática, nombre con GUID)
CREATE OR ALTER PROCEDURE dbo.SP_PoC_EjecutarBackup
    @ArchivoGenerado NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @GuidStr VARCHAR(50) = CONVERT(VARCHAR(50), NEWID());
    DECLARE @FechaStr VARCHAR(20) = REPLACE(REPLACE(REPLACE(CONVERT(VARCHAR(19), GETDATE(), 120), '-', ''), ':', ''), ' ', '_');
    
    -- Destino estrictamente confinado en C:\SQLBackup\
    SET @ArchivoGenerado = N'C:\SQLBackup\MUNDO_ESCOLAR_POC_' + @FechaStr + N'_' + @GuidStr + N'.bak';

    -- SINTAXIS NATIVA DIRECTA (Cero sp_executesql, cero inyección SQL)
    BACKUP DATABASE MUNDO_ESCOLAR_POC_TEST 
    TO DISK = @ArchivoGenerado 
    WITH STATS = 10;

    SELECT 'Backup generado exitosamente' AS Mensaje, @ArchivoGenerado AS Archivo;
END;
GO

-- Procedimiento de verificación de integridad (Sintaxis nativa estática)
CREATE OR ALTER PROCEDURE dbo.SP_PoC_VerificarBackup
    @RutaArchivo NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validación canónica estricta de ruta (evita path traversal y caracteres maliciosos)
    IF @RutaArchivo LIKE '%..%' OR @RutaArchivo LIKE '%\\%' OR @RutaArchivo NOT LIKE 'C:\SQLBackup\%.bak'
    BEGIN
        THROW 50001, 'Ruta de archivo no autorizada o no canónica.', 1;
    END;

    -- SINTAXIS NATIVA DIRECTA (Cero sp_executesql)
    RESTORE VERIFYONLY FROM DISK = @RutaArchivo;
    
    SELECT 'Copia íntegra y verificada' AS Resultado, @RutaArchivo AS Archivo;
END;
GO

-- 5. FIRMAR AMBOS PROCEDIMIENTOS CON EL CERTIFICADO (MODULE SIGNING)
ADD SIGNATURE TO dbo.SP_PoC_EjecutarBackup BY CERTIFICATE Cert_PoC_DBA;
ADD SIGNATURE TO dbo.SP_PoC_VerificarBackup BY CERTIFICATE Cert_PoC_DBA;
GO

-- Evidencia de registro de firmas criptográficas en el catálogo
SELECT 
    o.name AS Objeto_Firmado,
    o.type_desc AS Tipo_Objeto,
    cp.crypt_type_desc AS Metodo_Firma
FROM sys.crypt_properties cp
JOIN sys.objects o ON cp.major_id = o.object_id;
GO

-- 6. CONFIGURAR USUARIO DE APLICACIÓN CON PRIVILEGIOS MÍNIMOS (PoLP)
USE master;
GO

CREATE LOGIN login_app_test WITH PASSWORD = 'AppTestSecure2026*!', CHECK_POLICY = OFF;
GO

USE MUNDO_ESCOLAR_POC_TEST;
GO

CREATE USER usr_app_test FOR LOGIN login_app_test;
-- Único permiso otorgado: EXECUTE sobre los SPs de mantenimiento
GRANT EXECUTE ON dbo.SP_PoC_EjecutarBackup TO usr_app_test;
GRANT EXECUTE ON dbo.SP_PoC_VerificarBackup TO usr_app_test;
GO

-- 7. EJECUCIÓN DE PRUEBAS DE SEGURIDAD (EVIDENCIAS TÉCNICAS)
-- NOTA TÉCNICA: Se utiliza EXECUTE AS LOGIN para simular la conexión real del backend
-- a nivel de servidor, permitiendo validar la delegación de tokens hacia master.

PRINT '------------------------------------------------------------';
PRINT 'PRUEBA NEGATIVA 1: Intento de BACKUP DATABASE directo';
PRINT '------------------------------------------------------------';
USE MUNDO_ESCOLAR_POC_TEST;
EXECUTE AS LOGIN = 'login_app_test';
BEGIN TRY
    BACKUP DATABASE MUNDO_ESCOLAR_POC_TEST TO DISK = 'C:\SQLBackup\intruso.bak';
    REVERT;
    PRINT '[FALLO PoLP]: El login pudo hacer backup directo.';
END TRY
BEGIN CATCH
    REVERT;
    PRINT '[BLOQUEO CORRECTO PoLP]: SQL Server rechazó el comando directo.';
    PRINT 'Error Number : ' + CAST(ERROR_NUMBER() AS VARCHAR(10));
    PRINT 'Error Message: ' + ERROR_MESSAGE();
    -- Error real emitido: Msg 262: BACKUP DATABASE permission denied in database 'MUNDO_ESCOLAR_POC_TEST'.
END CATCH;
GO

PRINT '------------------------------------------------------------';
PRINT 'PRUEBA POSITIVA 1: Ejecutar SP_PoC_EjecutarBackup firmado';
PRINT '------------------------------------------------------------';
USE MUNDO_ESCOLAR_POC_TEST;
EXECUTE AS LOGIN = 'login_app_test';
DECLARE @RutaOutput NVARCHAR(500);
EXEC dbo.SP_PoC_EjecutarBackup @ArchivoGenerado = @RutaOutput OUTPUT;
REVERT;
PRINT 'Archivo generado con éxito: ' + @RutaOutput;
GO

PRINT '------------------------------------------------------------';
PRINT 'PRUEBA NEGATIVA 2: Intento de RESTORE VERIFYONLY directo';
PRINT '------------------------------------------------------------';
USE MUNDO_ESCOLAR_POC_TEST;
EXECUTE AS LOGIN = 'login_app_test';
BEGIN TRY
    RESTORE VERIFYONLY FROM DISK = 'C:\SQLBackup\dummy.bak';
    REVERT;
    PRINT '[FALLO PoLP]: El login pudo verificar directo.';
END TRY
BEGIN CATCH
    REVERT;
    PRINT '[BLOQUEO CORRECTO PoLP]: SQL Server rechazó la verificación directa.';
    PRINT 'Error Number : ' + CAST(ERROR_NUMBER() AS VARCHAR(10));
    PRINT 'Error Message: ' + ERROR_MESSAGE();
    -- Error real emitido: Msg 262: CREATE DATABASE permission denied in database 'master'.
END CATCH;
GO

PRINT '------------------------------------------------------------';
PRINT 'PRUEBA POSITIVA 2: Ejecutar SP_PoC_VerificarBackup firmado';
PRINT '------------------------------------------------------------';
USE MUNDO_ESCOLAR_POC_TEST;
DECLARE @UltimoBak NVARCHAR(500);
SELECT TOP 1 @UltimoBak = physical_device_name
FROM msdb.dbo.backupmediafamily
WHERE physical_device_name LIKE 'C:\SQLBackup\MUNDO_ESCOLAR_POC_%'
ORDER BY media_set_id DESC;

EXECUTE AS LOGIN = 'login_app_test';
EXEC dbo.SP_PoC_VerificarBackup @RutaArchivo = @UltimoBak;
REVERT;
PRINT 'Verificación de integridad completada exitosamente vía procedimiento firmado.';
GO
