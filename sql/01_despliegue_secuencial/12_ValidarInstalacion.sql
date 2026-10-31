/* =========================================================================
   PROYECTO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR
   SCRIPT: 12_ValidarInstalacion.sql
   REQUERIMIENTOS: RF7.1–RF7.7
   REFERENCIA DOCUMENTACIÓN: Sección 17.8.12 (Páginas 446-447)
   DESCRIPCIÓN: Script de validación técnica no destructiva para verificar
     la correcta instalación e integridad de todos los objetos del sistema:
       1. Conteo de Tablas físicas (Esperadas: 33)
       2. Conteo de Claves Primarias (Esperadas: 33)
       3. Conteo de Claves Foráneas (Esperadas: 37)
       4. Conteo de Restricciones UNIQUE (Esperadas: 28)
       5. Conteo de Restricciones CHECK (Esperadas: 25)
       6. Conteo de Restricciones DEFAULT (Esperadas: 18)
       7. Conteo de Funciones (Esperadas: 15)
       8. Conteo de Vistas (Esperadas: 19)
       9. Conteo de Procedimientos Almacenados (Esperados: 91)
       10. Conteo de Triggers de Auditoría (Esperados: 16)
       11. Verificación de Catálogos Poblados
   ========================================================================= */

USE MUNDO_ESCOLAR
GO

SET NOCOUNT ON;
PRINT '=========================================================================';
PRINT '   REVISIÓN TÉCNICA DE INSTALACIÓN - MUNDO_ESCOLAR';
PRINT '=========================================================================';

DECLARE @TotalTablas INT = (SELECT COUNT(*) FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo'));
DECLARE @TotalPKs INT = (SELECT COUNT(*) FROM sys.key_constraints WHERE type = 'PK' AND schema_id = SCHEMA_ID('dbo'));
DECLARE @TotalFKs INT = (SELECT COUNT(*) FROM sys.foreign_keys WHERE schema_id = SCHEMA_ID('dbo'));
DECLARE @TotalUQs INT = (SELECT COUNT(*) FROM sys.key_constraints WHERE type = 'UQ' AND schema_id = SCHEMA_ID('dbo'));
DECLARE @TotalCKs INT = (SELECT COUNT(*) FROM sys.check_constraints WHERE schema_id = SCHEMA_ID('dbo'));
DECLARE @TotalDFs INT = (SELECT COUNT(*) FROM sys.default_constraints WHERE schema_id = SCHEMA_ID('dbo'));
DECLARE @TotalFunciones INT = (SELECT COUNT(*) FROM sys.objects WHERE type IN ('FN', 'IF', 'TF') AND schema_id = SCHEMA_ID('dbo'));
DECLARE @TotalVistas INT = (SELECT COUNT(*) FROM sys.views WHERE schema_id = SCHEMA_ID('dbo'));
DECLARE @TotalSPs INT = (SELECT COUNT(*) FROM sys.procedures WHERE schema_id = SCHEMA_ID('dbo') AND is_ms_shipped = 0);
DECLARE @TotalTriggers INT = (SELECT COUNT(*) FROM sys.triggers WHERE parent_class = 1 AND is_ms_shipped = 0);

SELECT 
    '1. Tablas en 3FN' AS Componente, 33 AS MetaDocumentada, @TotalTablas AS Instaladas,
    CASE WHEN @TotalTablas = 33 THEN 'OK' ELSE 'FALLO' END AS Diagnostico
UNION ALL
SELECT '2. Claves Primarias (PK)', 33, @TotalPKs, CASE WHEN @TotalPKs = 33 THEN 'OK' ELSE 'FALLO' END
UNION ALL
SELECT '3. Claves Foráneas (FK)', 37, @TotalFKs, CASE WHEN @TotalFKs = 37 THEN 'OK' ELSE 'FALLO' END
UNION ALL
SELECT '4. Restricciones UNIQUE (UQ)', 28, @TotalUQs, CASE WHEN @TotalUQs = 28 THEN 'OK' ELSE 'FALLO' END
UNION ALL
SELECT '5. Restricciones CHECK (CK)', 25, @TotalCKs, CASE WHEN @TotalCKs = 25 THEN 'OK' ELSE 'FALLO' END
UNION ALL
SELECT '6. Restricciones DEFAULT (DF)', 18, @TotalDFs, CASE WHEN @TotalDFs = 18 THEN 'OK' ELSE 'FALLO' END
UNION ALL
SELECT '7. Funciones (Escalares + TVF)', 15, @TotalFunciones, CASE WHEN @TotalFunciones = 15 THEN 'OK' ELSE 'FALLO' END
UNION ALL
SELECT '8. Vistas Operativas/Analíticas', 19, @TotalVistas, CASE WHEN @TotalVistas = 19 THEN 'OK' ELSE 'FALLO' END
UNION ALL
SELECT '9. Procedimientos Almacenados', 91, @TotalSPs, CASE WHEN @TotalSPs = 91 THEN 'OK' ELSE 'FALLO' END
UNION ALL
SELECT '10. Triggers de Auditoría', 16, @TotalTriggers, CASE WHEN @TotalTriggers = 16 THEN 'OK' ELSE 'FALLO' END;
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

PRINT 'Diagnóstico de instalación completado exitosamente.';
GO
