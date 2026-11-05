/* =========================================================================
   PROYECTO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR
   ========================================================================= */

USE MUNDO_ESCOLAR;
GO

PRINT '======================================================================='
PRINT '>>> 1. ESTADO PREVIO DEL DATA WAREHOUSE (dw.FactVentas / dw.FactCompras)'
PRINT '======================================================================='
SELECT 
    Tabla_Hechos = 'dw.FactVentas', 
    Registros_Actuales = COUNT(*) 
FROM dw.FactVentas
UNION ALL
SELECT 
    Tabla_Hechos = 'dw.FactCompras', 
    Registros_Actuales = COUNT(*) 
FROM dw.FactCompras;
GO

PRINT '======================================================================='
PRINT '>>> 2. EJECUCIÓN DEL PIPELINE ETL TRANSACCIONAL (OLTP -> DW)'
PRINT '======================================================================='
-- Dispara los Stored Procedures de carga incremental y transformación dimensional
BEGIN TRY
    EXEC dbo.SP_ETL_CargarFactVentas;
    EXEC dbo.SP_ETL_CargarFactCompras;
    PRINT '>> ETL COMPLETADO CON ÉXITO: Hechos y dimensiones sincronizados.';
END TRY
BEGIN CATCH
    PRINT '>> Error en ETL: ' + ERROR_MESSAGE();
END CATCH;
GO

PRINT '======================================================================='
PRINT '>>> 3. VERIFICACIÓN DE HECHOS DISPONIBLES EN EL DATA WAREHOUSE'
PRINT '======================================================================='
SELECT TOP 5
    F.Id_Venta,
    Surrogate_Fecha = F.Sk_Fecha,
    Surrogate_Cliente = F.Sk_Cliente,
    Surrogate_Vendedor = F.Sk_Vendedor,
    F.Subtotal,
    F.Impuesto,
    Total_Hecho = F.Monto_Total
FROM dw.FactVentas F
ORDER BY F.Id_Venta DESC;
GO

PRINT '======================================================================='
PRINT '>>> 4. TRASPASO EN VIVO A SAMIR (POWER BI DASHBOARD)'
PRINT '======================================================================='
PRINT '>> Los datos analíticos ya residen en el esquema [dw].';
PRINT '>> "Samir, procedemos a actualizar el tablero directivo en Power BI..."';
GO
