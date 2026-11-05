/* =========================================================================
   PROYECTO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR
   ========================================================================= */

USE MUNDO_ESCOLAR;
GO

SET NOCOUNT ON;
GO


-- =========================================================================
-- 1. CLIENTES Y GESTIÓN DE CRÉDITO (DANIEL)
-- =========================================================================

-- Consulta de estado previo en catálogo de clientes
SELECT TOP 1 
    c.Id_Cliente,
    c.Nombre_O_RazonSocial AS Cliente,
    c.Tipo_Cliente,
    c.Numero_Identificacion,
    c.Limite_Credito_Monto,
    c.Permite_Credito,
    c.Condiciones_Autorizadas
FROM dbo.VW_ClientesActivos c
ORDER BY c.Id_Cliente DESC;

-- Verificación de cliente creado y asignación de línea de crédito
SELECT TOP 1 
    c.Id_Cliente,
    c.Nombre_O_RazonSocial AS Cliente,
    c.Tipo_Cliente,
    c.Numero_Identificacion,
    c.Limite_Credito_Monto,
    c.Limite_Credito_Facturas,
    c.Permite_Credito,
    cp.Nombre AS Condicion_Asignada,
    cp.Dias_Credito,
    ccp.Fecha_Autorizacion
FROM dbo.VW_ClientesActivos c
LEFT JOIN dbo.Cliente_Condicion_Pago ccp ON c.Id_Cliente = ccp.Id_Cliente AND ccp.Estado = 1
LEFT JOIN dbo.Condicion_Pago cp ON ccp.Id_Condicion_Pago = cp.Id_Condicion_Pago
ORDER BY c.Id_Cliente DESC;
GO


-- =========================================================================
-- 2. RECEPCIÓN DE COMPRAS Y MOVIMIENTO EN KÁRDEX (JOSE)
-- =========================================================================

-- Consulta de orden de compra pendiente y existencias actuales
SELECT TOP 1 
    c.Id_Compra,
    CONCAT('OC-', RIGHT('00000000' + CAST(c.Id_Compra AS VARCHAR(10)), 8)) AS Numero_Orden,
    prv.Nombre_O_RazonSocial AS Proveedor,
    ec.Nombre_Estado AS Estado_Compra,
    c.Fecha_Compra,
    tot.TotalCompra AS Monto_Total,
    tot.TotalArticulos AS Total_Unidades
FROM dbo.Compra c
INNER JOIN dbo.Estado_Compra ec ON c.Id_Estado_Compra = ec.Id_Estado_Compra
INNER JOIN dbo.VW_ProveedoresActivos prv ON c.Id_Proveedor = prv.Id_Proveedor
OUTER APPLY (
    SELECT SUM(Subtotal) AS TotalCompra, SUM(Cantidad) AS TotalArticulos 
    FROM dbo.Compra_Producto WHERE Id_Compra = c.Id_Compra
) tot
WHERE c.Id_Estado_Compra = 1 -- Pendiente
ORDER BY c.Id_Compra DESC;

SELECT Id_Producto, Nombre AS Producto, Stock_Actual, Punto_Reorden 
FROM dbo.Producto WHERE Id_Producto = 14;

-- Verificación de recepción, actualización de stock y asiento en Kárdex
SELECT TOP 1 
    c.Id_Compra,
    CONCAT('OC-', RIGHT('00000000' + CAST(c.Id_Compra AS VARCHAR(10)), 8)) AS Numero_Orden,
    prv.Nombre_O_RazonSocial AS Proveedor,
    ec.Nombre_Estado AS Estado_Compra,
    c.Fecha_Compra,
    u.Nombre_Usuario AS Responsable,
    tot.TotalCompra AS Monto_Total
FROM dbo.Compra c
INNER JOIN dbo.Estado_Compra ec ON c.Id_Estado_Compra = ec.Id_Estado_Compra
INNER JOIN dbo.VW_ProveedoresActivos prv ON c.Id_Proveedor = prv.Id_Proveedor
INNER JOIN dbo.Usuario u ON c.Id_Usuario = u.Id_Usuario
OUTER APPLY (
    SELECT SUM(Subtotal) AS TotalCompra FROM dbo.Compra_Producto WHERE Id_Compra = c.Id_Compra
) tot
ORDER BY c.Id_Compra DESC;

SELECT Id_Producto, Nombre AS Producto, Stock_Actual, Punto_Reorden 
FROM dbo.Producto WHERE Id_Producto = 14;

SELECT TOP 1 
    m.Id_Movimiento_Inventario,
    m.Fecha,
    m.Producto,
    m.Tipo_Movimiento,
    m.Naturaleza,
    m.Cantidad,
    m.Motivo,
    m.Responsable
FROM dbo.VW_MovimientosInventario m
WHERE m.Naturaleza = 'Entrada'
ORDER BY m.Id_Movimiento_Inventario DESC;
GO


-- =========================================================================
-- 3. CONTROL DE INVENTARIO Y AJUSTES DE BODEGA (DAUREN)
-- =========================================================================

-- Consulta de stock antes del ajuste
SELECT Id_Producto, Nombre AS Producto, Stock_Actual, Punto_Reorden, Precio_Venta
FROM dbo.Producto WHERE Id_Producto = 14;

-- Verificación de rebajo físico y asiento de ajuste en Kárdex
SELECT Id_Producto, Nombre AS Producto, Stock_Actual, Punto_Reorden
FROM dbo.Producto WHERE Id_Producto = 14;

SELECT TOP 1 
    m.Id_Movimiento_Inventario,
    m.Fecha,
    m.Producto,
    m.Tipo_Movimiento,
    m.Cantidad,
    m.Motivo,
    m.Responsable
FROM dbo.VW_MovimientosInventario m
ORDER BY m.Id_Movimiento_Inventario DESC;
GO


-- =========================================================================
-- 4. VENTAS, FACTURACIÓN DGT Y RECAUDO (MELISSA)
-- =========================================================================

-- Consulta de existencias y cuenta del cliente
SELECT Id_Producto, Nombre AS Producto, Stock_Actual, Precio_Venta FROM dbo.Producto WHERE Id_Producto = 14;

SELECT TOP 1 Id_Cliente, Nombre_O_RazonSocial AS Cliente, Limite_Credito_Monto, Permite_Credito
FROM dbo.VW_ClientesActivos ORDER BY Id_Cliente DESC;

-- Verificación de venta confirmada, factura con clave DGT de 50 dígitos, pago y salida de Kárdex
SELECT TOP 1 
    v.Id_Venta,
    v.Fecha,
    c.Nombre_O_RazonSocial AS Cliente,
    v.Subtotal,
    v.Impuesto,
    v.Monto_Total,
    ev.Nombre_Estado AS Estado_Venta,
    u.Nombre_Usuario AS Cajero
FROM dbo.Venta v
INNER JOIN dbo.VW_ClientesActivos c ON v.Id_Cliente = c.Id_Cliente
INNER JOIN dbo.Estado_Venta ev ON v.Id_Estado_Venta = ev.Id_Estado_Venta
INNER JOIN dbo.Usuario u ON v.Id_Usuario = u.Id_Usuario
ORDER BY v.Id_Venta DESC;

SELECT TOP 1 
    f.Id_Factura,
    f.Clave_Numerica_Fiscal,
    LEN(f.Clave_Numerica_Fiscal) AS Longitud_Clave,
    f.Monto_Total,
    f.Saldo_Pendiente,
    ef.Nombre_Estado AS Estado_Factura
FROM dbo.Factura f
INNER JOIN dbo.Estado_Factura ef ON f.Id_Estado_Factura = ef.Id_Estado_Factura
ORDER BY f.Id_Factura DESC;

SELECT TOP 1 
    p.Id_Pago,
    p.Fecha_Pago,
    p.Monto_Pagado,
    mp.Nombre AS Metodo_Pago,
    p.Numero_Referencia
FROM dbo.Pago p
INNER JOIN dbo.Metodo_Pago mp ON p.Id_Metodo_Pago = mp.Id_Metodo_Pago
ORDER BY p.Id_Pago DESC;

SELECT TOP 1 
    m.Id_Movimiento_Inventario,
    m.Producto,
    m.Tipo_Movimiento,
    m.Cantidad,
    m.Motivo,
    m.Responsable
FROM dbo.VW_MovimientosInventario m
WHERE m.Naturaleza = 'Salida'
ORDER BY m.Id_Movimiento_Inventario DESC;
GO


-- =========================================================================
-- 5. AUDITORÍA TRANSVERSAL Y ADMINISTRACIÓN DBA (GEISON)
-- =========================================================================

-- Trazabilidad unificada en bitácora (Filegroup ME_Auditoria)
SELECT TOP 8 
    b.Id_Bitacora,
    b.Fecha_Hora,
    ISNULL(u.Nombre_Usuario, 'admin') AS Usuario,
    b.Accion,
    b.Tabla_Afectada,
    b.Id_Registro_Afectado,
    b.Descripcion
FROM dbo.Bitacora b
LEFT JOIN dbo.Usuario u ON b.Id_Usuario = u.Id_Usuario
ORDER BY b.Id_Bitacora DESC;

-- Ejecución de respaldo diferencial y consulta de historial en MSDB
EXEC dbo.SP_DBA_EjecutarBackupDiferencial;
EXEC dbo.SP_DBA_ConsultarHistorialBackups;

-- Monitoreo físico de Filegroups
EXEC dbo.SP_DBA_MonitorearEspacioArchivos;
GO


-- =========================================================================
-- 6. DATA WAREHOUSE Y BUSINESS INTELLIGENCE (SAMIR)
-- =========================================================================

-- Estado previo en Data Warehouse
SELECT 
    COUNT(*) AS Total_Ventas_En_DW,
    ISNULL(SUM(Monto_Total), 0) AS Total_Colones_DW
FROM dw.FactVentas;

-- Orquestación de pipeline ETL y conciliación matemática
EXEC dbo.SP_ETL_OrquestarCargaCompleta;
EXEC dbo.SP_ETL_ValidarConciliacionCargas;

-- Verificación de venta consolidada en DW
SELECT TOP 1 
    Id_Venta,
    Sk_Fecha,
    Sk_Cliente,
    Sk_Vendedor,
    Subtotal,
    Impuesto,
    Monto_Total
FROM dw.FactVentas
ORDER BY Id_Venta DESC;

-- Verificación de SCD Tipo 2 en dimensión cliente
SELECT TOP 3 
    Sk_Cliente,
    Id_Cliente,
    Nombre_Completo,
    Estado_Operacional,
    Fecha_Inicio,
    Fecha_Fin,
    Es_Actual
FROM dw.DimCliente
ORDER BY Id_Cliente, Sk_Cliente;
GO
