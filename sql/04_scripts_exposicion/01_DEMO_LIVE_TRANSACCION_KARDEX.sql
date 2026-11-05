/* =========================================================================
   PROYECTO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR
   EXPOSICIÓN FINAL 2026 - PESTAÑA 1 EN SSMS (MAURICIO CHAVARRÍA)
   SCRIPT: 01_DEMO_LIVE_TRANSACCION_KARDEX.sql
   MOMENTO DE EJECUCIÓN: Justo cuando Melissa confirme una Venta en el POS
                         y Daniel confirme una Recepción en Compras.
   INSTRUCCIÓN: Seleccionar todo y presionar [F5] para proyectar los cambios.
   ========================================================================= */

USE MUNDO_ESCOLAR;
GO

PRINT '======================================================================='
PRINT '>>> 1. ÚLTIMAS VENTAS REGISTRADAS EN TIEMPO REAL (ACID COMMIT)'
PRINT '======================================================================='
SELECT TOP 3 
    Id_Venta,
    Fecha,
    Estado = Estado_Venta,
    Tipo_Cliente,
    Cliente = Nombre_Cliente,
    Vendedor,
    Condicion = Condicion_Pago,
    Subtotal,
    Impuesto,
    Total = Monto_Total
FROM dbo.VW_Ventas
ORDER BY Id_Venta DESC;
GO

PRINT '======================================================================='
PRINT '>>> 2. LÍNEAS DE ARTÍCULOS DE LA ÚLTIMA VENTA'
PRINT '======================================================================='
SELECT TOP 5
    VP.Id_Venta,
    Producto = P.Nombre,
    VP.Cantidad,
    VP.Precio_Unitario,
    VP.Subtotal,
    IVA_Pct = CAST(VP.Porcentaje_IVA AS VARCHAR(10)) + '%'
FROM dbo.Venta_Producto VP
INNER JOIN dbo.Producto P ON VP.Id_Producto = P.Id_Producto
WHERE VP.Id_Venta = (SELECT MAX(Id_Venta) FROM dbo.Venta)
ORDER BY VP.Id_Venta_Producto ASC;
GO

PRINT '======================================================================='
PRINT '>>> 3. KÁRDEX: MOVIMIENTOS DE INVENTARIO DISPARADOS EN CALIENTE'
PRINT '======================================================================='
SELECT TOP 5
    MI.Id_Movimiento_Inventario,
    MI.Fecha,
    Producto = P.Nombre,
    Tipo = TM.Nombre,
    MI.Cantidad,
    MI.Motivo,
    Usuario = U.Nombre_Usuario
FROM dbo.Movimiento_Inventario MI
INNER JOIN dbo.Producto P ON MI.Id_Producto = P.Id_Producto
INNER JOIN dbo.Tipo_Movimiento TM ON MI.Id_Tipo_Movimiento = TM.Id_Tipo_Movimiento
INNER JOIN dbo.Usuario U ON MI.Id_Usuario = U.Id_Usuario
ORDER BY MI.Id_Movimiento_Inventario DESC;
GO

PRINT '======================================================================='
PRINT '>>> 4. AUDITORÍA INMUTABLE: TRIGGERS DML EN ACCIÓN'
PRINT '======================================================================='
SELECT TOP 5
    B.Id_Bitacora,
    B.Fecha_Hora,
    B.Accion,
    B.Tabla_Afectada,
    B.Id_Registro_Afectado,
    B.Descripcion
FROM dbo.Bitacora B
ORDER BY B.Id_Bitacora DESC;
GO

PRINT '======================================================================='
PRINT '>>> 5. COMPROBACIÓN DE SALDO DE STOCK EN BODEGA'
PRINT '======================================================================='
SELECT TOP 5
    P.Id_Producto,
    P.Nombre,
    P.Stock_Actual,
    P.Punto_Reorden,
    Estado_Stock = CASE 
        WHEN P.Stock_Actual <= P.Punto_Reorden THEN '¡ALERTA REORDEN!'
        ELSE 'Stock Óptimo'
    END
FROM dbo.Producto P
ORDER BY P.Stock_Actual ASC;
GO
