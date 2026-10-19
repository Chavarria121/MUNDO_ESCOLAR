/* =========================================================================
   SCRIPT 01: CREACIÓN DE LA BASE DE DATOS
   CASO DE ESTUDIO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR (LIBERIA)
   REQUERIMIENTO ASOCIADO: RA4.1
   ESTILO: TORRENTES (SSMS 22)
   ========================================================================= */

USE master
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = 'MUNDO_ESCOLAR')
BEGIN
    ALTER DATABASE MUNDO_ESCOLAR SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE MUNDO_ESCOLAR;
END
GO

CREATE DATABASE MUNDO_ESCOLAR
ON PRIMARY
(
    NAME = 'MUNDO_ESCOLAR_data',
    FILENAME = 'C:\SQLData\MUNDO_ESCOLAR_data.mdf',
    SIZE = 3072MB,          -- 3GB inicial
    MAXSIZE = 20480MB,      -- 20GB máximo
    FILEGROWTH = 1024MB     -- Crecimiento de 1GB
)
LOG ON
(
    NAME = 'MUNDO_ESCOLAR_log',
    FILENAME = 'C:\SQLLog\MUNDO_ESCOLAR_log.ldf',
    SIZE = 1024MB,          -- 1GB inicial
    MAXSIZE = 5120MB,       -- 5GB máximo
    FILEGROWTH = 512MB      -- Crecimiento de 512MB
)
GO

USE MUNDO_ESCOLAR
GO

-- Asignación de dueño sa para evitar Error 15404 en diagramas de SSMS
ALTER AUTHORIZATION ON DATABASE::MUNDO_ESCOLAR TO sa;
GO

-- Creación del tipo alias BOOL para compatibilidad exacta con el modelo relacional
IF NOT EXISTS (SELECT * FROM sys.types WHERE name = 'BOOL')
BEGIN
    CREATE TYPE BOOL FROM BIT;
END
GO

EXEC sp_helpdb MUNDO_ESCOLAR
GO
