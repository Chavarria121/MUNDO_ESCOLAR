/* =========================================================================
   PROYECTO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR
   SCRIPT: 07_CrearIndices.sql
   REQUERIMIENTOS: RA4.4
   REFERENCIA DOCUMENTACIÓN: Sección 17.8.7 (Páginas 444-445)
   DESCRIPCIÓN: Creación de índices no agrupados (Non-Clustered) para optimizar
     búsquedas frecuentes, filtros de fecha, estados y claves foráneas,
     evitando redundancias con las restricciones PK y UNIQUE.
   ========================================================================= */

USE MUNDO_ESCOLAR
GO

-- 1. ÍNDICES DE CLAVES FORÁNEAS Y FILTROS TRANSACCIONALES
-- Ventas y Detalle
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Venta_Cliente_Fecha' AND object_id = OBJECT_ID('dbo.Venta'))
    CREATE NONCLUSTERED INDEX IX_Venta_Cliente_Fecha ON dbo.Venta (Id_Cliente, Fecha)
    INCLUDE (Monto_Total, Id_Estado_Venta);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Venta_EstadoVenta' AND object_id = OBJECT_ID('dbo.Venta'))
    CREATE NONCLUSTERED INDEX IX_Venta_EstadoVenta ON dbo.Venta (Id_Estado_Venta);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_VentaProducto_Venta' AND object_id = OBJECT_ID('dbo.Venta_Producto'))
    CREATE NONCLUSTERED INDEX IX_VentaProducto_Venta ON dbo.Venta_Producto (Id_Venta)
    INCLUDE (Id_Producto, Cantidad, Subtotal);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_VentaProducto_Producto' AND object_id = OBJECT_ID('dbo.Venta_Producto'))
    CREATE NONCLUSTERED INDEX IX_VentaProducto_Producto ON dbo.Venta_Producto (Id_Producto);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_VentaServicio_Venta' AND object_id = OBJECT_ID('dbo.Venta_Servicio'))
    CREATE NONCLUSTERED INDEX IX_VentaServicio_Venta ON dbo.Venta_Servicio (Id_Venta)
    INCLUDE (Id_Servicio, Cantidad, Subtotal);
GO

-- Facturación y Cobranza
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Factura_Venta' AND object_id = OBJECT_ID('dbo.Factura'))
    CREATE NONCLUSTERED INDEX IX_Factura_Venta ON dbo.Factura (Id_Venta);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Factura_Estado_Vencimiento' AND object_id = OBJECT_ID('dbo.Factura'))
    CREATE NONCLUSTERED INDEX IX_Factura_Estado_Vencimiento ON dbo.Factura (Id_Estado_Factura, Fecha_Vencimiento)
    INCLUDE (Saldo_Pendiente, Monto_Total);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Pago_Factura' AND object_id = OBJECT_ID('dbo.Pago'))
    CREATE NONCLUSTERED INDEX IX_Pago_Factura ON dbo.Pago (Id_Factura, Fecha_Pago)
    INCLUDE (Monto_Pagado, Id_Metodo_Pago);
GO

-- Compras a Proveedores
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Compra_Proveedor_Fecha' AND object_id = OBJECT_ID('dbo.Compra'))
    CREATE NONCLUSTERED INDEX IX_Compra_Proveedor_Fecha ON dbo.Compra (Id_Proveedor, Fecha_Compra)
    INCLUDE (Id_Estado_Compra);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CompraProducto_Compra' AND object_id = OBJECT_ID('dbo.Compra_Producto'))
    CREATE NONCLUSTERED INDEX IX_CompraProducto_Compra ON dbo.Compra_Producto (Id_Compra)
    INCLUDE (Id_Producto, Cantidad, Subtotal);
GO

-- Inventario y Movimientos
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Movimiento_Producto_Fecha' AND object_id = OBJECT_ID('dbo.Movimiento_Inventario'))
    CREATE NONCLUSTERED INDEX IX_Movimiento_Producto_Fecha ON dbo.Movimiento_Inventario (Id_Producto, Fecha)
    INCLUDE (Id_Tipo_Movimiento, Cantidad);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Producto_Categoria' AND object_id = OBJECT_ID('dbo.Producto'))
    CREATE NONCLUSTERED INDEX IX_Producto_Categoria ON dbo.Producto (Id_Categoria)
    INCLUDE (Nombre, Precio_Venta, Stock_Actual, Punto_Reorden);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ProductoProveedor_Producto' AND object_id = OBJECT_ID('dbo.Producto_Proveedor'))
    CREATE NONCLUSTERED INDEX IX_ProductoProveedor_Producto ON dbo.Producto_Proveedor (Id_Producto, Id_Proveedor)
    INCLUDE (Precio_Compra, EsPrincipal);
GO

-- Seguridad y Auditoría
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Bitacora_Usuario_Fecha' AND object_id = OBJECT_ID('dbo.Bitacora'))
    CREATE NONCLUSTERED INDEX IX_Bitacora_Usuario_Fecha ON dbo.Bitacora (Id_Usuario, Fecha_Hora)
    INCLUDE (Accion, Tabla_Afectada);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Bitacora_TablaAfectada' AND object_id = OBJECT_ID('dbo.Bitacora'))
    CREATE NONCLUSTERED INDEX IX_Bitacora_TablaAfectada ON dbo.Bitacora (Tabla_Afectada, Fecha_Hora);
GO

PRINT 'Índices no agrupados (07_CrearIndices.sql) creados exitosamente.';
GO
