/* =========================================================================
   PROYECTO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR
   SCRIPT: 01_Migracion_Filegroups_Segura.sql
   UBICACIÓN: sql/03_administracion_mantenimiento/
   REQUERIMIENTO: H4 / RA4.1 / Inconsistencia I-08
   DESCRIPCIÓN: Script de migración incremental NO DESTRUCTIVO para la creación
     y configuración de Filegroups secundarios y archivos de datos (.ndf).
     A diferencia de 01_CrearBaseDatos.sql (diseñado para despliegue inicial limpio),
     este script puede ejecutarse de forma segura sobre bases de datos existentes
     con datos de producción, preservando la totalidad de la información.
   FILEGROUPS CONFIGURADOS:
     - FG_TRANSACCIONAL: Tablas transaccionales de alto volumen de escritura.
     - FG_DW: Dimensiones y tablas de hechos del Data Warehouse analítico.
     - FG_AUDITORIA: Registros históricos de bitácora y trazabilidad.
     - FG_CATALOGOS: Tablas maestras de catálogos y configuración.
   ========================================================================= */

USE master;
GO

IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = 'MUNDO_ESCOLAR')
BEGIN
    RAISERROR(N'La base de datos MUNDO_ESCOLAR no existe. Ejecute primero el script de instalación inicial.', 16, 1);
    RETURN;
END;
GO

USE MUNDO_ESCOLAR;
GO

SET NOCOUNT ON;
PRINT '=========================================================================';
PRINT '   INICIANDO MIGRACIÓN SEGURA DE FILEGROUPS - MUNDO_ESCOLAR';
PRINT '=========================================================================';

-- 1. Detección dinámica de la ruta de almacenamiento de la base de datos
DECLARE @DataPath NVARCHAR(500);
SELECT @DataPath = SUBSTRING(physical_name, 1, LEN(physical_name) - CHARINDEX('\', REVERSE(physical_name)) + 1)
FROM sys.database_files
WHERE file_id = 1;

IF @DataPath IS NULL OR @DataPath = ''
BEGIN
    SET @DataPath = CAST(SERVERPROPERTY('InstanceDefaultDataPath') AS NVARCHAR(500));
END;

IF @DataPath IS NULL OR @DataPath = ''
BEGIN
    SET @DataPath = 'C:\SQLData\';
END;

PRINT 'Ruta de almacenamiento detectada: ' + @DataPath;

-- 2. Declaración de Filegroups y Archivos a crear
DECLARE @SQL NVARCHAR(MAX);

-- 2.1 FILEGROUP: FG_TRANSACCIONAL
IF NOT EXISTS (SELECT 1 FROM sys.filegroups WHERE name = 'FG_TRANSACCIONAL')
BEGIN
    PRINT '-> Creando Filegroup [FG_TRANSACCIONAL]...';
    SET @SQL = N'ALTER DATABASE MUNDO_ESCOLAR ADD FILEGROUP FG_TRANSACCIONAL;';
    EXEC sp_executesql @SQL;
END
ELSE
BEGIN
    PRINT '-> Filegroup [FG_TRANSACCIONAL] ya existe.';
END;

IF NOT EXISTS (SELECT 1 FROM sys.database_files WHERE name = 'ME_Transaccional')
BEGIN
    PRINT '-> Agregando archivo de datos secundario ME_Transaccional.ndf...';
    SET @SQL = N'ALTER DATABASE MUNDO_ESCOLAR ADD FILE ('
             + N'NAME = ''ME_Transaccional'', '
             + N'FILENAME = ''' + @DataPath + N'ME_Transaccional.ndf'', '
             + N'SIZE = 100MB, '
             + N'MAXSIZE = UNLIMITED, '
             + N'FILEGROWTH = 50MB'
             + N') TO FILEGROUP FG_TRANSACCIONAL;';
    EXEC sp_executesql @SQL;
END
ELSE
BEGIN
    PRINT '-> Archivo de datos ME_Transaccional ya existe.';
END;

-- 2.2 FILEGROUP: FG_DW
IF NOT EXISTS (SELECT 1 FROM sys.filegroups WHERE name = 'FG_DW')
BEGIN
    PRINT '-> Creando Filegroup [FG_DW]...';
    SET @SQL = N'ALTER DATABASE MUNDO_ESCOLAR ADD FILEGROUP FG_DW;';
    EXEC sp_executesql @SQL;
END
ELSE
BEGIN
    PRINT '-> Filegroup [FG_DW] ya existe.';
END;

IF NOT EXISTS (SELECT 1 FROM sys.database_files WHERE name = 'ME_DW')
BEGIN
    PRINT '-> Agregando archivo de datos secundario ME_DW.ndf...';
    SET @SQL = N'ALTER DATABASE MUNDO_ESCOLAR ADD FILE ('
             + N'NAME = ''ME_DW'', '
             + N'FILENAME = ''' + @DataPath + N'ME_DW.ndf'', '
             + N'SIZE = 100MB, '
             + N'MAXSIZE = UNLIMITED, '
             + N'FILEGROWTH = 50MB'
             + N') TO FILEGROUP FG_DW;';
    EXEC sp_executesql @SQL;
END
ELSE
BEGIN
    PRINT '-> Archivo de datos ME_DW ya existe.';
END;

-- 2.3 FILEGROUP: FG_AUDITORIA
IF NOT EXISTS (SELECT 1 FROM sys.filegroups WHERE name = 'FG_AUDITORIA')
BEGIN
    PRINT '-> Creando Filegroup [FG_AUDITORIA]...';
    SET @SQL = N'ALTER DATABASE MUNDO_ESCOLAR ADD FILEGROUP FG_AUDITORIA;';
    EXEC sp_executesql @SQL;
END
ELSE
BEGIN
    PRINT '-> Filegroup [FG_AUDITORIA] ya existe.';
END;

IF NOT EXISTS (SELECT 1 FROM sys.database_files WHERE name = 'ME_Auditoria')
BEGIN
    PRINT '-> Agregando archivo de datos secundario ME_Auditoria.ndf...';
    SET @SQL = N'ALTER DATABASE MUNDO_ESCOLAR ADD FILE ('
             + N'NAME = ''ME_Auditoria'', '
             + N'FILENAME = ''' + @DataPath + N'ME_Auditoria.ndf'', '
             + N'SIZE = 50MB, '
             + N'MAXSIZE = UNLIMITED, '
             + N'FILEGROWTH = 25MB'
             + N') TO FILEGROUP FG_AUDITORIA;';
    EXEC sp_executesql @SQL;
END
ELSE
BEGIN
    PRINT '-> Archivo de datos ME_Auditoria ya existe.';
END;

-- 2.4 FILEGROUP: FG_CATALOGOS
IF NOT EXISTS (SELECT 1 FROM sys.filegroups WHERE name = 'FG_CATALOGOS')
BEGIN
    PRINT '-> Creando Filegroup [FG_CATALOGOS]...';
    SET @SQL = N'ALTER DATABASE MUNDO_ESCOLAR ADD FILEGROUP FG_CATALOGOS;';
    EXEC sp_executesql @SQL;
END
ELSE
BEGIN
    PRINT '-> Filegroup [FG_CATALOGOS] ya existe.';
END;

IF NOT EXISTS (SELECT 1 FROM sys.database_files WHERE name = 'ME_Catalogos')
BEGIN
    PRINT '-> Agregando archivo de datos secundario ME_Catalogos.ndf...';
    SET @SQL = N'ALTER DATABASE MUNDO_ESCOLAR ADD FILE ('
             + N'NAME = ''ME_Catalogos'', '
             + N'FILENAME = ''' + @DataPath + N'ME_Catalogos.ndf'', '
             + N'SIZE = 25MB, '
             + N'MAXSIZE = UNLIMITED, '
             + N'FILEGROWTH = 10MB'
             + N') TO FILEGROUP FG_CATALOGOS;';
    EXEC sp_executesql @SQL;
END
ELSE
BEGIN
    PRINT '-> Archivo de datos ME_Catalogos ya existe.';
END;

-- 3. Reubicación segura de tablas que se encuentren indebidamente en PRIMARY
PRINT '-------------------------------------------------------------------------';
PRINT '   VERIFICACIÓN DE UBICACIÓN FÍSICA DE TABLAS CRÍTICAS';
PRINT '-------------------------------------------------------------------------';

-- Reubicación de dbo.Bitacora -> FG_AUDITORIA
IF EXISTS (
    SELECT 1 FROM sys.tables t
    JOIN sys.indexes i ON t.object_id = i.object_id AND i.index_id <= 1
    JOIN sys.data_spaces ds ON i.data_space_id = ds.data_space_id
    WHERE t.object_id = OBJECT_ID('dbo.Bitacora') AND ds.name != 'FG_AUDITORIA'
)
BEGIN
    PRINT '-> Reubicando dbo.Bitacora hacia FG_AUDITORIA...';
    ALTER TABLE dbo.Bitacora DROP CONSTRAINT PK_Bitacora WITH (MOVE TO FG_AUDITORIA);
    ALTER TABLE dbo.Bitacora ADD CONSTRAINT PK_Bitacora PRIMARY KEY CLUSTERED (Id_Bitacora) ON FG_AUDITORIA;
    PRINT '   dbo.Bitacora reubicada exitosamente.';
END
ELSE
BEGIN
    PRINT '-> dbo.Bitacora ya reside en FG_AUDITORIA o no requiere reubicación.';
END;

-- Reubicación de dbo.Movimiento_Inventario -> FG_TRANSACCIONAL
IF EXISTS (
    SELECT 1 FROM sys.tables t
    JOIN sys.indexes i ON t.object_id = i.object_id AND i.index_id <= 1
    JOIN sys.data_spaces ds ON i.data_space_id = ds.data_space_id
    WHERE t.object_id = OBJECT_ID('dbo.Movimiento_Inventario') AND ds.name != 'FG_TRANSACCIONAL'
)
BEGIN
    PRINT '-> Reubicando dbo.Movimiento_Inventario hacia FG_TRANSACCIONAL...';
    ALTER TABLE dbo.Movimiento_Inventario DROP CONSTRAINT PK_Movimiento_Inventario WITH (MOVE TO FG_TRANSACCIONAL);
    ALTER TABLE dbo.Movimiento_Inventario ADD CONSTRAINT PK_Movimiento_Inventario PRIMARY KEY CLUSTERED (Id_Movimiento_Inventario) ON FG_TRANSACCIONAL;
    PRINT '   dbo.Movimiento_Inventario reubicada exitosamente.';
END
ELSE
BEGIN
    PRINT '-> dbo.Movimiento_Inventario ya reside en FG_TRANSACCIONAL.';
END;

-- Reubicación de dbo.Compra_Producto -> FG_TRANSACCIONAL
IF EXISTS (
    SELECT 1 FROM sys.tables t
    JOIN sys.indexes i ON t.object_id = i.object_id AND i.index_id <= 1
    JOIN sys.data_spaces ds ON i.data_space_id = ds.data_space_id
    WHERE t.object_id = OBJECT_ID('dbo.Compra_Producto') AND ds.name != 'FG_TRANSACCIONAL'
)
BEGIN
    PRINT '-> Reubicando dbo.Compra_Producto hacia FG_TRANSACCIONAL...';
    ALTER TABLE dbo.Compra_Producto DROP CONSTRAINT PK_Compra_Producto WITH (MOVE TO FG_TRANSACCIONAL);
    ALTER TABLE dbo.Compra_Producto ADD CONSTRAINT PK_Compra_Producto PRIMARY KEY CLUSTERED (Id_Compra_Producto) ON FG_TRANSACCIONAL;
    PRINT '   dbo.Compra_Producto reubicada exitosamente.';
END
ELSE
BEGIN
    PRINT '-> dbo.Compra_Producto ya reside en FG_TRANSACCIONAL.';
END;

-- Reubicación de dbo.Venta_Producto -> FG_TRANSACCIONAL
IF EXISTS (
    SELECT 1 FROM sys.tables t
    JOIN sys.indexes i ON t.object_id = i.object_id AND i.index_id <= 1
    JOIN sys.data_spaces ds ON i.data_space_id = ds.data_space_id
    WHERE t.object_id = OBJECT_ID('dbo.Venta_Producto') AND ds.name != 'FG_TRANSACCIONAL'
)
BEGIN
    PRINT '-> Reubicando dbo.Venta_Producto hacia FG_TRANSACCIONAL...';
    ALTER TABLE dbo.Venta_Producto DROP CONSTRAINT PK_Venta_Producto WITH (MOVE TO FG_TRANSACCIONAL);
    ALTER TABLE dbo.Venta_Producto ADD CONSTRAINT PK_Venta_Producto PRIMARY KEY CLUSTERED (Id_Venta_Producto) ON FG_TRANSACCIONAL;
    PRINT '   dbo.Venta_Producto reubicada exitosamente.';
END
ELSE
BEGIN
    PRINT '-> dbo.Venta_Producto ya reside en FG_TRANSACCIONAL.';
END;

-- Reubicación de dbo.Pago -> FG_TRANSACCIONAL
IF EXISTS (
    SELECT 1 FROM sys.tables t
    JOIN sys.indexes i ON t.object_id = i.object_id AND i.index_id <= 1
    JOIN sys.data_spaces ds ON i.data_space_id = ds.data_space_id
    WHERE t.object_id = OBJECT_ID('dbo.Pago') AND ds.name != 'FG_TRANSACCIONAL'
)
BEGIN
    PRINT '-> Reubicando dbo.Pago hacia FG_TRANSACCIONAL...';
    ALTER TABLE dbo.Pago DROP CONSTRAINT PK_Pago WITH (MOVE TO FG_TRANSACCIONAL);
    ALTER TABLE dbo.Pago ADD CONSTRAINT PK_Pago PRIMARY KEY CLUSTERED (Id_Pago) ON FG_TRANSACCIONAL;
    PRINT '   dbo.Pago reubicada exitosamente.';
END
ELSE
BEGIN
    PRINT '-> dbo.Pago ya reside en FG_TRANSACCIONAL.';
END;

-- 4. Reporte final de validación de Filegroups
PRINT '-------------------------------------------------------------------------';
PRINT '   ESTADO ACTUAL DE FILEGROUPS Y ARCHIVOS FÍSICOS';
PRINT '-------------------------------------------------------------------------';
SELECT 
    df.file_id AS FileId,
    df.name AS NombreLogico,
    fg.name AS Filegroup,
    df.physical_name AS RutaFisica,
    CAST(df.size * 8.0 / 1024 AS DECIMAL(10,2)) AS TamanoMB,
    df.state_desc AS Estado
FROM sys.database_files df
LEFT JOIN sys.filegroups fg ON df.data_space_id = fg.data_space_id
ORDER BY df.file_id;
GO

-- Habilitación de TRUSTWORTHY para procedimientos de mantenimiento con EXECUTE AS OWNER
ALTER DATABASE MUNDO_ESCOLAR SET TRUSTWORTHY ON;
PRINT '-> TRUSTWORTHY habilitado en MUNDO_ESCOLAR para procedimientos DBA con EXECUTE AS OWNER.';

PRINT '=========================================================================';
PRINT '   MIGRACIÓN SEGURA DE FILEGROUPS COMPLETADA SIN PERDIDA DE DATOS';
PRINT '=========================================================================';
GO
