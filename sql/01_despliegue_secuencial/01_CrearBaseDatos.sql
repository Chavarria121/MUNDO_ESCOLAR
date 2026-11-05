/* =========================================================================
   SCRIPT 01: CREACIÓN DE LA BASE DE DATOS Y FILEGROUPS
   CASO DE ESTUDIO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR (LIBERIA)
   REQUERIMIENTO ASOCIADO: RA4.1 / H4 / Inconsistencia I-08
   ESTILO: TORRENTES (SSMS 22)
   
   POLÍTICA DE DESPLIEGUE SEGURO (NON-DESTRUCTIVE):
   Este script implementa salvaguarda operacional mediante IF NOT EXISTS.
   Si la base de datos ya existe, NO se destruye para preservar los datos.
   ========================================================================= */

USE master
GO

-- =========================================================================
-- SALVAGUARDA DE SEGURIDAD OPERACIONAL:
-- Si un DBA requiere forzar una recreación destructiva desde cero, debe
-- descomentar manualmente el siguiente bloque:
/*
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'MUNDO_ESCOLAR')
BEGIN
    ALTER DATABASE MUNDO_ESCOLAR SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE MUNDO_ESCOLAR;
END
GO
*/
-- =========================================================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'MUNDO_ESCOLAR')
BEGIN
    PRINT '>>> Creando la base de datos MUNDO_ESCOLAR con arquitectura multidisco (4 Filegroups)...';

    CREATE DATABASE MUNDO_ESCOLAR
    ON PRIMARY
    (
        NAME = 'MUNDO_ESCOLAR_data',
        FILENAME = 'C:\SQLData\MUNDO_ESCOLAR_data.mdf',
        SIZE = 3072MB,          -- 3GB inicial
        MAXSIZE = 20480MB,      -- 20GB máximo
        FILEGROWTH = 1024MB     -- Crecimiento de 1GB
    ),
    FILEGROUP FG_TRANSACCIONAL
    (
        NAME = 'ME_Transaccional',
        FILENAME = 'C:\SQLData\ME_Transaccional.ndf',
        SIZE = 100MB,
        MAXSIZE = UNLIMITED,
        FILEGROWTH = 50MB
    ),
    FILEGROUP FG_DW
    (
        NAME = 'ME_DW',
        FILENAME = 'C:\SQLData\ME_DW.ndf',
        SIZE = 100MB,
        MAXSIZE = UNLIMITED,
        FILEGROWTH = 50MB
    ),
    FILEGROUP FG_AUDITORIA
    (
        NAME = 'ME_Auditoria',
        FILENAME = 'C:\SQLData\ME_Auditoria.ndf',
        SIZE = 50MB,
        MAXSIZE = UNLIMITED,
        FILEGROWTH = 25MB
    ),
    FILEGROUP FG_CATALOGOS
    (
        NAME = 'ME_Catalogos',
        FILENAME = 'C:\SQLData\ME_Catalogos.ndf',
        SIZE = 25MB,
        MAXSIZE = UNLIMITED,
        FILEGROWTH = 10MB
    )
    LOG ON
    (
        NAME = 'MUNDO_ESCOLAR_log',
        FILENAME = 'C:\SQLLog\MUNDO_ESCOLAR_log.ldf',
        SIZE = 1024MB,          -- 1GB inicial
        MAXSIZE = 5120MB,       -- 5GB máximo
        FILEGROWTH = 512MB      -- Crecimiento de 512MB
    );

    PRINT '>>> Base de datos MUNDO_ESCOLAR creada exitosamente.';
END
ELSE
BEGIN
    PRINT '>>> [AVISO DE SEGURIDAD]: La base de datos MUNDO_ESCOLAR ya existe en este servidor.';
    PRINT '>>> Se omite la creación física para salvaguardar la integridad de los datos existentes.';
END
GO

USE MUNDO_ESCOLAR
GO

-- Asignación de dueño sa para evitar Error 15404 en diagramas de SSMS
ALTER AUTHORIZATION ON DATABASE::MUNDO_ESCOLAR TO sa;
GO

-- Seguridad: Mantener TRUSTWORTHY OFF. La delegación de privilegios administrativos
-- se realiza de forma segura mediante Module Signing (Firma criptográfica con certificados).
ALTER DATABASE MUNDO_ESCOLAR SET TRUSTWORTHY OFF;
GO

-- Creación del tipo alias BOOL para compatibilidad exacta con el modelo relacional
IF NOT EXISTS (SELECT * FROM sys.types WHERE name = 'BOOL')
BEGIN
    CREATE TYPE BOOL FROM BIT;
END
GO

EXEC sp_helpdb MUNDO_ESCOLAR
GO
