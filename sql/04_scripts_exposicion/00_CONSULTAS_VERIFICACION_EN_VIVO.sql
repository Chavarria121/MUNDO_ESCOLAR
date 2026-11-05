/* =========================================================================
   PROYECTO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR
   ========================================================================= */

USE MUNDO_ESCOLAR;
GO

-- =========================================================================
-- MÓDULO 1: CLIENTES, PROVEEDORES Y COMPRAS
-- =========================================================================
-- Compras y Recepción de Mercadería:
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

-- Control de Línea de Crédito a Clientes:
SELECT 
    c.Id_Cliente,
    c.Nombre_O_RazonSocial AS Cliente,
    c.Tipo_Cliente,
    c.Limite_Credito_Monto,
    c.Limite_Credito_Facturas,
    c.Permite_Credito,
    c.Condiciones_Autorizadas
FROM dbo.VW_ClientesActivos c
WHERE c.Id_Cliente = 1;


-- =========================================================================
-- MÓDULO 2: PRODUCTOS, CATÁLOGO E INVENTARIO (KÁRDEX)
-- =========================================================================
-- Existencias en Bodega:
SELECT p.Id_Producto, p.Nombre, p.Stock_Actual, p.Punto_Reorden, p.Precio_Venta
FROM dbo.Producto p WHERE p.Id_Producto = 14;

-- Movimientos recientes en el Kárdex:
SELECT TOP 2 
    m.Id_Movimiento_Inventario, m.Fecha, m.Producto, m.Tipo_Movimiento, m.Cantidad, m.Motivo, m.Responsable
FROM dbo.VW_MovimientosInventario m
ORDER BY m.Id_Movimiento_Inventario DESC;


-- =========================================================================
-- MÓDULO 3: VENTAS, FACTURACIÓN ELECTRÓNICA Y PAGOS (POS)
-- =========================================================================
-- Venta Confirmada:
SELECT TOP 1 
    v.Id_Venta, v.Fecha, c.Nombre_O_RazonSocial AS Cliente, v.Subtotal, v.Impuesto, v.Monto_Total, ev.Nombre_Estado AS Estado_Venta
FROM dbo.Venta v
INNER JOIN dbo.VW_ClientesActivos c ON v.Id_Cliente = c.Id_Cliente
INNER JOIN dbo.Estado_Venta ev ON v.Id_Estado_Venta = ev.Id_Estado_Venta
ORDER BY v.Id_Venta DESC;

-- Factura Electrónica DGT (Clave 50 dígitos):
SELECT TOP 1 
    f.Id_Factura, f.Clave_Numerica_Fiscal, LEN(f.Clave_Numerica_Fiscal) AS Longitud_Clave, f.Monto_Total, f.Saldo_Pendiente, ef.Nombre_Estado AS Estado_Factura
FROM dbo.Factura f
INNER JOIN dbo.Estado_Factura ef ON f.Id_Estado_Factura = ef.Id_Estado_Factura
ORDER BY f.Id_Factura DESC;

-- Recibo de Pago:
SELECT TOP 1 p.Id_Pago, p.Fecha_Pago, p.Monto_Pagado, mp.Nombre AS Metodo_Pago, p.Numero_Referencia
FROM dbo.Pago p INNER JOIN dbo.Metodo_Pago mp ON p.Id_Metodo_Pago = mp.Id_Metodo_Pago
ORDER BY p.Id_Pago DESC;


-- =========================================================================
-- MÓDULO 4: SEGURIDAD, CONTROL DE ACCESO Y AUDITORÍA TRANSVERSAL
-- =========================================================================
-- Revocación de Tokens JWT:
SELECT TOP 3 Id_Token, Token_Hash, Fecha_Revocacion, Fecha_Expiracion
FROM dbo.TB_Token_Revocado ORDER BY Id_Token DESC;

-- Historial de Contraseñas (NIST):
SELECT TOP 3 h.Id_Historial, u.Nombre_Usuario, h.Contrasena_Hash, h.Fecha_Modificacion
FROM dbo.TB_Historial_Contrasenas h INNER JOIN dbo.Usuario u ON h.Id_Usuario = u.Id_Usuario
ORDER BY h.Id_Historial DESC;

-- Bitácora Transversal (Filegroup ME_Auditoria):
SELECT TOP 5 b.Id_Bitacora, b.Fecha_Hora, ISNULL(u.Nombre_Usuario, 'Sistema') AS Usuario, b.Accion, b.Tabla_Afectada, b.Id_Registro_Afectado, b.Descripcion
FROM dbo.Bitacora b LEFT JOIN dbo.Usuario u ON b.Id_Usuario = u.Id_Usuario
ORDER BY b.Id_Bitacora DESC;


-- =========================================================================
-- MÓDULO 5: ADMINISTRACIÓN DBA, MANTENIMIENTO Y FILEGROUPS
-- =========================================================================
-- Historial de Backups en MSDB:
EXEC dbo.SP_DBA_ConsultarHistorialBackups;

-- Monitoreo de Filegroups:
EXEC dbo.SP_DBA_MonitorearEspacioArchivos;


-- =========================================================================
-- MÓDULO 6: DATA WAREHOUSE, ETL Y REPORTES ANALÍTICOS (BI)
-- =========================================================================
-- SCD Tipo 2 en Clientes:
SELECT Sk_Cliente, Id_Cliente, Nombre_Completo, Estado_Operacional, Fecha_Inicio, Fecha_Fin, Es_Actual
FROM dw.DimCliente WHERE Id_Cliente = 1 ORDER BY Sk_Cliente;

-- Conciliación Matemática OLTP vs DW:
EXEC dbo.SP_ETL_ValidarConciliacionCargas;
GO
