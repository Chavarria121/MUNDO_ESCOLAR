/* =========================================================================
   PROYECTO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR
   SCRIPT: 12_ValidarInstalacion.sql
   REQUERIMIENTOS: RF7.1–RF7.7 / Inconsistencias I-02, I-03, I-04
   REFERENCIA DOCUMENTACIÓN: Sección 17.8.12 (Páginas 446-447)
   DESCRIPCIÓN: Script de validación técnica no destructiva para verificar
     la correcta instalación, integridad física y conteo exacto de todos
     los componentes de la base de datos (OLTP y DW), excluyendo artefactos
     autogenerados por diagramas de SSMS (sysdiagrams, sp_%diagram%, fn_%diagram%):
       1. Tablas en 3FN (OLTP dbo): Esperadas 33
       2. Tablas analíticas Data Warehouse (dw): Esperadas 14 (o 15 con Bitacora_ETL)
       3. Claves Primarias (PK dbo): Esperadas 33
       4. Claves Foráneas (FK dbo): Esperadas 37
       5. Restricciones UNIQUE (UQ dbo): Esperadas 28
       6. Restricciones CHECK (CK dbo): Esperadas 25
       7. Restricciones DEFAULT (DF dbo): Esperadas 18
       8. Funciones de Negocio (15 dbo + 1 dw): Esperadas 16
       9. Vistas Operativas y Analíticas: Esperadas 19
       10. Procedimientos Almacenados de Negocio (95 funcionales + 1 ETL orquestador): Esperados 96
       11. Triggers de Auditoría: Esperados 16
       12. Filegroups Secundarios Físicos: Esperados 4 (FG_TRANSACCIONAL, FG_DW, FG_AUDITORIA, FG_CATALOGOS)
       13. Verificación de Catálogos Poblados
   ========================================================================= */

USE MUNDO_ESCOLAR
GO

SET NOCOUNT ON;
PRINT '=========================================================================';
PRINT '   REVISIÓN TÉCNICA DE INSTALACIÓN Y CONTEOS UNIFICADOS - MUNDO_ESCOLAR';
PRINT '=========================================================================';

-- Conteos OLTP (dbo) y DW (dw) filtrando artefactos de sistema y diagramas SSMS
DECLARE @TotalTablasOLTP INT = (SELECT COUNT(*) FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo') AND name != 'sysdiagrams');
DECLARE @TotalTablasDW INT = (SELECT COUNT(*) FROM sys.tables WHERE schema_id = SCHEMA_ID('dw'));
DECLARE @TotalPKs INT = (
    SELECT COUNT(*) FROM sys.key_constraints kc
    JOIN sys.tables t ON kc.parent_object_id = t.object_id
    WHERE kc.type = 'PK' AND kc.schema_id = SCHEMA_ID('dbo') AND t.name != 'sysdiagrams'
);
DECLARE @TotalFKs INT = (SELECT COUNT(*) FROM sys.foreign_keys WHERE schema_id = SCHEMA_ID('dbo'));
DECLARE @TotalUQs INT = (SELECT COUNT(*) FROM sys.key_constraints WHERE type = 'UQ' AND schema_id = SCHEMA_ID('dbo'));
DECLARE @TotalCKs INT = (SELECT COUNT(*) FROM sys.check_constraints WHERE schema_id = SCHEMA_ID('dbo'));
DECLARE @TotalDFs INT = (SELECT COUNT(*) FROM sys.default_constraints WHERE schema_id = SCHEMA_ID('dbo'));
DECLARE @TotalFunciones INT = (
    SELECT COUNT(*) FROM sys.objects 
    WHERE type IN ('FN', 'IF', 'TF') 
      AND schema_id IN (SCHEMA_ID('dbo'), SCHEMA_ID('dw'))
      AND name NOT LIKE 'fn_%diagram%'
);
DECLARE @TotalVistas INT = (SELECT COUNT(*) FROM sys.views WHERE schema_id = SCHEMA_ID('dbo'));
DECLARE @TotalSPs INT = (
    SELECT COUNT(*) FROM sys.procedures 
    WHERE schema_id IN (SCHEMA_ID('dbo'), SCHEMA_ID('dw'))
      AND is_ms_shipped = 0 
      AND name NOT LIKE 'sp_%diagram%'
);
DECLARE @TotalTriggers INT = (SELECT COUNT(*) FROM sys.triggers WHERE parent_class = 1 AND is_ms_shipped = 0);
DECLARE @TotalFilegroups INT = (SELECT COUNT(*) FROM sys.filegroups WHERE name IN ('FG_TRANSACCIONAL', 'FG_DW', 'FG_AUDITORIA', 'FG_CATALOGOS'));

SELECT 
    '1. Tablas en 3FN (OLTP dbo)' AS Componente, 33 AS MetaDocumentada, @TotalTablasOLTP AS Instaladas,
    CASE WHEN @TotalTablasOLTP = 33 THEN 'OK' ELSE 'FALLO' END AS Diagnostico
UNION ALL
SELECT '2. Tablas Data Warehouse (dw)', 15, @TotalTablasDW, CASE WHEN @TotalTablasDW = 15 THEN 'OK' ELSE 'FALLO' END
UNION ALL
SELECT '3. Claves Primarias (PK dbo)', 33, @TotalPKs, CASE WHEN @TotalPKs = 33 THEN 'OK' ELSE 'FALLO' END
UNION ALL
SELECT '4. Claves Foráneas (FK dbo)', 37, @TotalFKs, CASE WHEN @TotalFKs = 37 THEN 'OK' ELSE 'FALLO' END
UNION ALL
SELECT '5. Restricciones UNIQUE (UQ dbo)', 28, @TotalUQs, CASE WHEN @TotalUQs >= 28 THEN 'OK' ELSE 'FALLO' END
UNION ALL
SELECT '6. Restricciones CHECK (CK dbo)', 25, @TotalCKs, CASE WHEN @TotalCKs = 25 THEN 'OK' ELSE 'FALLO' END
UNION ALL
SELECT '7. Restricciones DEFAULT (DF dbo)', 18, @TotalDFs, CASE WHEN @TotalDFs = 18 THEN 'OK' ELSE 'FALLO' END
UNION ALL
SELECT '8. Funciones de Negocio (15 dbo + 1 dw)', 16, @TotalFunciones, CASE WHEN @TotalFunciones = 16 THEN 'OK' ELSE 'FALLO' END
UNION ALL
SELECT '9. Vistas Operativas/Analíticas', 19, @TotalVistas, CASE WHEN @TotalVistas = 19 THEN 'OK' ELSE 'FALLO' END
UNION ALL
SELECT '10. Procedimientos Almacenados (SPs)', 96, @TotalSPs, CASE WHEN @TotalSPs = 96 THEN 'OK' ELSE 'FALLO' END
UNION ALL
SELECT '11. Triggers de Auditoría', 16, @TotalTriggers, CASE WHEN @TotalTriggers = 16 THEN 'OK' ELSE 'FALLO' END
UNION ALL
SELECT '12. Filegroups Secundarios (FG_*)', 4, @TotalFilegroups, CASE WHEN @TotalFilegroups = 4 THEN 'OK' ELSE 'FALLO' END;
GO

PRINT '=== VERIFICACIÓN DE POBLADO DE CATÁLOGOS BASE ===';
SELECT 
    'Tipo_Cliente' AS Catalogo, COUNT(*) AS TotalFilas, CASE WHEN COUNT(*) >= 2 THEN 'POBLADO' ELSE 'VACIO' END AS Estado FROM Tipo_Cliente
UNION ALL SELECT 'Condicion_Pago', COUNT(*), CASE WHEN COUNT(*) >= 4 THEN 'POBLADO' ELSE 'VACIO' END FROM Condicion_Pago
UNION ALL SELECT 'Tipo_Proveedor', COUNT(*), CASE WHEN COUNT(*) >= 2 THEN 'POBLADO' ELSE 'VACIO' END FROM Tipo_Proveedor
UNION ALL SELECT 'Categoria', COUNT(*), CASE WHEN COUNT(*) >= 8 THEN 'POBLADO' ELSE 'VACIO' END FROM Categoria
UNION ALL SELECT 'Tipo_Movimiento', COUNT(*), CASE WHEN COUNT(*) >= 6 THEN 'POBLADO' ELSE 'VACIO' END FROM Tipo_Movimiento
UNION ALL SELECT 'Estado_Compra', COUNT(*), CASE WHEN COUNT(*) >= 3 THEN 'POBLADO' ELSE 'VACIO' END FROM Estado_Compra
UNION ALL SELECT 'Estado_Venta', COUNT(*), CASE WHEN COUNT(*) >= 3 THEN 'POBLADO' ELSE 'VACIO' END FROM Estado_Venta
UNION ALL SELECT 'Estado_Factura', COUNT(*), CASE WHEN COUNT(*) >= 4 THEN 'POBLADO' ELSE 'VACIO' END FROM Estado_Factura
UNION ALL SELECT 'Metodo_Pago', COUNT(*), CASE WHEN COUNT(*) >= 5 THEN 'POBLADO' ELSE 'VACIO' END FROM Metodo_Pago
UNION ALL SELECT 'Rol', COUNT(*), CASE WHEN COUNT(*) >= 4 THEN 'POBLADO' ELSE 'VACIO' END FROM Rol
UNION ALL SELECT 'Permiso', COUNT(*), CASE WHEN COUNT(*) >= 18 THEN 'POBLADO' ELSE 'VACIO' END FROM Permiso;
GO

PRINT 'Diagnóstico de instalación y validación completado exitosamente.';
GO
