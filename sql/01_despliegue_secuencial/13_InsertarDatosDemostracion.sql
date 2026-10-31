/* =========================================================================
   PROYECTO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR
   SCRIPT: seed_cadena_suministro_completa.sql
   FASE: 4 - Reinicio Controlado y Siembra Realista de Cadena de Suministro
   DESCRIPCIÓN:
     1. Purgado seguro y ordenado de tablas de hechos (DW) y transaccionales (OLTP).
     2. Reseteo de contadores de identidad (IDENTITY) y puesta a cero de stock.
     3. Aseguramiento de catálogo de proveedores y contratos comerciales (Producto_Proveedor).
     4. Siembra de Órdenes de Compra con Lead Time y recepción formal en bodega (Kardex):
        - OC-001: Papelera Nacional S.A. (Oct 01 -> Recibida Oct 04, a tiempo)
        - OC-002: Distribuidora Escolar del Valle (Oct 02 -> Recibida Oct 05, a tiempo)
        - OC-003: Carlos Mora Solano (Oct 04 -> Recibida Oct 07, a tiempo)
        - OC-004: Distribuidora Escolar del Valle (Oct 03 -> Recibida Oct 19, RETRASO CRÍTICO +9 DÍAS en Mochilas)
     5. Siembra de 15 ventas realistas en POS (mostrador y crédito) de Oct 08 a Oct 26:
        - Registro de Venta, Venta_Producto, Venta_Servicio.
        - Emisión formal de Facturas y Registro de Pagos (Efectivo, Tarjeta, SINPE, Transferencia).
        - Despacho y salida física de bodega en Movimiento_Inventario.
        - Descuento exacto en Stock_Actual de Producto.
     6. Ejecución del pipeline de extracción ETL hacia el Data Warehouse.
   ========================================================================= */

USE MUNDO_ESCOLAR;
GO

SET NOCOUNT ON;
BEGIN TRY
    BEGIN TRANSACTION;

    PRINT '>>> PASO 1: Purgado de Tablas de Hechos (DW) y Transaccionales (OLTP)...';

    -- 1.1 Limpieza de Hechos del Data Warehouse
    DELETE FROM dw.FactPagos;
    DELETE FROM dw.FactVentaServicio;
    DELETE FROM dw.FactVentaProducto;
    DELETE FROM dw.FactVentas;

    -- 1.2 Limpieza de Tablas Transaccionales
    DELETE FROM dbo.Pago;
    DELETE FROM dbo.Factura;
    DELETE FROM dbo.Venta_Servicio;
    DELETE FROM dbo.Venta_Producto;
    DELETE FROM dbo.Venta;
    DELETE FROM dbo.Movimiento_Inventario;
    DELETE FROM dbo.Compra_Producto;
    DELETE FROM dbo.Compra;

    -- 1.3 Reinicio de Secuencias IDENTITY
    DBCC CHECKIDENT ('dbo.Compra', RESEED, 0);
    DBCC CHECKIDENT ('dbo.Compra_Producto', RESEED, 0);
    DBCC CHECKIDENT ('dbo.Movimiento_Inventario', RESEED, 0);
    DBCC CHECKIDENT ('dbo.Venta', RESEED, 0);
    DBCC CHECKIDENT ('dbo.Venta_Producto', RESEED, 0);
    DBCC CHECKIDENT ('dbo.Venta_Servicio', RESEED, 0);
    DBCC CHECKIDENT ('dbo.Factura', RESEED, 0);
    DBCC CHECKIDENT ('dbo.Pago', RESEED, 0);

    -- 1.4 Puesta a CERO del Stock en Almacén
    UPDATE dbo.Producto SET Stock_Actual = 0;

    PRINT '>>> PASO 2: Verificación de Contratos Proveedor-Producto (dbo.Producto_Proveedor)...';

    -- Asegurar Producto 13 (Libro para Escuela) asociado al Proveedor 3 (Carlos Mora Solano)
    IF NOT EXISTS (SELECT 1 FROM dbo.Producto_Proveedor WHERE Id_Producto = 13 AND Id_Proveedor = 3)
    BEGIN
        INSERT INTO dbo.Producto_Proveedor (Id_Producto, Id_Proveedor, Precio_Compra, EsPrincipal, Estado)
        VALUES (13, 3, 1200.00, 1, 1);
    END

    -- Asegurar Producto 12 (Mochila QuickSilver) asociado al Proveedor 2 (Distribuidora Escolar del Valle)
    IF NOT EXISTS (SELECT 1 FROM dbo.Producto_Proveedor WHERE Id_Producto = 12 AND Id_Proveedor = 2)
    BEGIN
        INSERT INTO dbo.Producto_Proveedor (Id_Producto, Id_Proveedor, Precio_Compra, EsPrincipal, Estado)
        VALUES (12, 2, 18500.00, 1, 1);
    END
    ELSE
    BEGIN
        UPDATE dbo.Producto_Proveedor 
        SET Precio_Compra = 18500.00, EsPrincipal = 1, Estado = 1 
        WHERE Id_Producto = 12 AND Id_Proveedor = 2;
    END

    PRINT '>>> PASO 3: Generación de Compras y Recepción en Bodega (Kardex)...';

    DECLARE @IdBodeguero INT = 3; -- mario.bodega
    DECLARE @IdVendedor INT = 2;   -- carlos.vargas
    DECLARE @IdAdmin INT = 1;      -- admin

    -- -------------------------------------------------------------
    -- COMPRA 1: Papelera Nacional S.A. (Id_Proveedor = 1)
    -- Fecha Orden: 2026-10-01 08:30 | Recepción: 2026-10-04 10:00 (A tiempo)
    -- -------------------------------------------------------------
    INSERT INTO dbo.Compra (Id_Proveedor, Id_Usuario, Id_Estado_Compra, Fecha_Compra)
    VALUES (1, @IdBodeguero, 2, '2026-10-01 08:30:00');
    DECLARE @OC1 INT = SCOPE_IDENTITY();

    INSERT INTO dbo.Compra_Producto (Id_Compra, Id_Producto, Cantidad, Costo_Unitario, Subtotal)
    VALUES 
    (@OC1, 1, 120, 812.50, 97500.00),   -- Cuaderno Cosido
    (@OC1, 2, 100, 942.50, 94250.00),   -- Cuaderno Espiral
    (@OC1, 7, 60, 2470.00, 148200.00),  -- Resma Bond
    (@OC1, 8, 80, 227.50, 18200.00);    -- Cartulina Blanca

    -- Asientos Kardex de Entrada OC-001
    INSERT INTO dbo.Movimiento_Inventario (Id_Producto, Id_Tipo_Movimiento, Id_Usuario, Cantidad, Fecha, Motivo)
    VALUES 
    (1, 1, @IdBodeguero, 120, '2026-10-04 10:00:00', 'Recepción OC-001 Papelera Nacional (Entrega en 3 días)'),
    (2, 1, @IdBodeguero, 100, '2026-10-04 10:00:00', 'Recepción OC-001 Papelera Nacional (Entrega en 3 días)'),
    (7, 1, @IdBodeguero, 60, '2026-10-04 10:00:00', 'Recepción OC-001 Papelera Nacional (Entrega en 3 días)'),
    (8, 1, @IdBodeguero, 80, '2026-10-04 10:00:00', 'Recepción OC-001 Papelera Nacional (Entrega en 3 días)');

    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual + 120 WHERE Id_Producto = 1;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual + 100 WHERE Id_Producto = 2;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual + 60 WHERE Id_Producto = 7;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual + 80 WHERE Id_Producto = 8;

    -- -------------------------------------------------------------
    -- COMPRA 2: Distribuidora Escolar del Valle S.A. (Id_Proveedor = 2)
    -- Fecha Orden: 2026-10-02 09:15 | Recepción: 2026-10-05 14:30 (A tiempo)
    -- -------------------------------------------------------------
    INSERT INTO dbo.Compra (Id_Proveedor, Id_Usuario, Id_Estado_Compra, Fecha_Compra)
    VALUES (2, @IdBodeguero, 2, '2026-10-02 09:15:00');
    DECLARE @OC2 INT = SCOPE_IDENTITY();

    INSERT INTO dbo.Compra_Producto (Id_Compra, Id_Producto, Cantidad, Costo_Unitario, Subtotal)
    VALUES 
    (@OC2, 3, 200, 150.00, 30000.00),   -- Bolígrafo Azul
    (@OC2, 4, 200, 150.00, 30000.00),   -- Bolígrafo Negro
    (@OC2, 5, 300, 120.00, 36000.00),   -- Lápiz Grafito
    (@OC2, 6, 150, 180.00, 27000.00),   -- Borrador Blanco
    (@OC2, 9, 60, 1110.00, 66600.00),   -- Caja Lápices Color
    (@OC2, 10, 80, 390.00, 31200.00),   -- Goma Líquida
    (@OC2, 11, 50, 900.00, 45000.00);   -- Juego Geometría

    -- Asientos Kardex de Entrada OC-002
    INSERT INTO dbo.Movimiento_Inventario (Id_Producto, Id_Tipo_Movimiento, Id_Usuario, Cantidad, Fecha, Motivo)
    VALUES 
    (3, 1, @IdBodeguero, 200, '2026-10-05 14:30:00', 'Recepción OC-002 Distribuidora Escolar (Entrega en 3 días)'),
    (4, 1, @IdBodeguero, 200, '2026-10-05 14:30:00', 'Recepción OC-002 Distribuidora Escolar (Entrega en 3 días)'),
    (5, 1, @IdBodeguero, 300, '2026-10-05 14:30:00', 'Recepción OC-002 Distribuidora Escolar (Entrega en 3 días)'),
    (6, 1, @IdBodeguero, 150, '2026-10-05 14:30:00', 'Recepción OC-002 Distribuidora Escolar (Entrega en 3 días)'),
    (9, 1, @IdBodeguero, 60, '2026-10-05 14:30:00', 'Recepción OC-002 Distribuidora Escolar (Entrega en 3 días)'),
    (10, 1, @IdBodeguero, 80, '2026-10-05 14:30:00', 'Recepción OC-002 Distribuidora Escolar (Entrega en 3 días)'),
    (11, 1, @IdBodeguero, 50, '2026-10-05 14:30:00', 'Recepción OC-002 Distribuidora Escolar (Entrega en 3 días)');

    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual + 200 WHERE Id_Producto = 3;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual + 200 WHERE Id_Producto = 4;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual + 300 WHERE Id_Producto = 5;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual + 150 WHERE Id_Producto = 6;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual + 60 WHERE Id_Producto = 9;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual + 80 WHERE Id_Producto = 10;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual + 50 WHERE Id_Producto = 11;

    -- -------------------------------------------------------------
    -- COMPRA 3: Carlos Mora Solano (Id_Proveedor = 3)
    -- Fecha Orden: 2026-10-04 10:00 | Recepción: 2026-10-07 11:00 (A tiempo)
    -- -------------------------------------------------------------
    INSERT INTO dbo.Compra (Id_Proveedor, Id_Usuario, Id_Estado_Compra, Fecha_Compra)
    VALUES (3, @IdBodeguero, 2, '2026-10-04 10:00:00');
    DECLARE @OC3 INT = SCOPE_IDENTITY();

    INSERT INTO dbo.Compra_Producto (Id_Compra, Id_Producto, Cantidad, Costo_Unitario, Subtotal)
    VALUES (@OC3, 13, 50, 1200.00, 60000.00); -- Libro para Escuela

    INSERT INTO dbo.Movimiento_Inventario (Id_Producto, Id_Tipo_Movimiento, Id_Usuario, Cantidad, Fecha, Motivo)
    VALUES (13, 1, @IdBodeguero, 50, '2026-10-07 11:00:00', 'Recepción OC-003 Libros Escolares (Entrega en 3 días)');

    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual + 50 WHERE Id_Producto = 13;

    -- -------------------------------------------------------------
    -- COMPRA 4: Distribuidora Escolar del Valle S.A. (Id_Proveedor = 2)
    -- RETRASO CRÍTICO: Fecha Orden: 2026-10-03 11:30 | Prometida: 2026-10-10
    -- Recepción Real: 2026-10-19 16:30 (+9 DÍAS DE RETRASO)
    -- -------------------------------------------------------------
    INSERT INTO dbo.Compra (Id_Proveedor, Id_Usuario, Id_Estado_Compra, Fecha_Compra)
    VALUES (2, @IdBodeguero, 2, '2026-10-03 11:30:00');
    DECLARE @OC4 INT = SCOPE_IDENTITY();

    INSERT INTO dbo.Compra_Producto (Id_Compra, Id_Producto, Cantidad, Costo_Unitario, Subtotal)
    VALUES (@OC4, 12, 25, 18500.00, 462500.00); -- Mochila QuickSilver

    INSERT INTO dbo.Movimiento_Inventario (Id_Producto, Id_Tipo_Movimiento, Id_Usuario, Cantidad, Fecha, Motivo)
    VALUES (12, 1, @IdBodeguero, 25, '2026-10-19 16:30:00', 'Recepción tardía OC-004 (+9 días retraso proveedor - entrada a clases)');

    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual + 25 WHERE Id_Producto = 12;

    PRINT '>>> PASO 4: Generación de 15 Ventas con Costos Reales, Facturas y Pagos...';

    DECLARE @VentaId INT;

    -- =============================================================
    -- VENTA 1: 2026-10-08 09:30:00 | Cliente 1 (María Rodríguez) - Contado (Efectivo)
    -- =============================================================
    INSERT INTO dbo.Venta (Id_Cliente, Id_Usuario, Id_Estado_Venta, Id_Condicion_Pago, Fecha, Subtotal, Impuesto, Monto_Total)
    VALUES (1, @IdVendedor, 2, 1, '2026-10-08 09:30:00', 7600.00, 988.00, 8588.00);
    SET @VentaId = SCOPE_IDENTITY();

    INSERT INTO dbo.Venta_Producto (Id_Producto, Id_Venta, Cantidad, Precio_Unitario, Subtotal)
    VALUES 
    (1, @VentaId, 4, 1250.00, 5000.00),
    (3, @VentaId, 6, 250.00, 1500.00),
    (5, @VentaId, 5, 200.00, 1000.00);

    INSERT INTO dbo.Venta_Servicio (Id_Venta, Id_Servicio, Cantidad, Precio_Unitario, Subtotal)
    VALUES (@VentaId, 1, 4, 25.00, 100.00); -- Fotocopia B/N

    INSERT INTO dbo.Movimiento_Inventario (Id_Producto, Id_Tipo_Movimiento, Id_Usuario, Cantidad, Fecha, Motivo)
    VALUES 
    (1, 2, @IdVendedor, 4, '2026-10-08 09:30:00', 'Salida por Venta #1'),
    (3, 2, @IdVendedor, 6, '2026-10-08 09:30:00', 'Salida por Venta #1'),
    (5, 2, @IdVendedor, 5, '2026-10-08 09:30:00', 'Salida por Venta #1');

    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 4 WHERE Id_Producto = 1;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 6 WHERE Id_Producto = 3;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 5 WHERE Id_Producto = 5;

    INSERT INTO dbo.Factura (Id_Venta, Id_Estado_Factura, Fecha_Emision, Fecha_Vencimiento, Monto_Total, Saldo_Pendiente)
    VALUES (@VentaId, 3, '2026-10-08 09:30:00', '2026-10-08 09:30:00', 8588.00, 0.00);

    INSERT INTO dbo.Pago (Id_Factura, Id_Metodo_Pago, Fecha_Pago, Monto_Pagado, Numero_Referencia, Estado)
    VALUES (SCOPE_IDENTITY(), 1, '2026-10-08 09:30:00', 8588.00, 'EFEC-CASH-001', 1);

    -- =============================================================
    -- VENTA 2: 2026-10-09 11:15:00 | Cliente 2 (Esteban Solís) - Contado (SINPE Móvil)
    -- =============================================================
    INSERT INTO dbo.Venta (Id_Cliente, Id_Usuario, Id_Estado_Venta, Id_Condicion_Pago, Fecha, Subtotal, Impuesto, Monto_Total)
    VALUES (2, @IdVendedor, 2, 1, '2026-10-09 11:15:00', 10250.00, 1332.50, 11582.50);
    SET @VentaId = SCOPE_IDENTITY();

    INSERT INTO dbo.Venta_Producto (Id_Producto, Id_Venta, Cantidad, Precio_Unitario, Subtotal)
    VALUES 
    (2, @VentaId, 3, 1450.00, 4350.00),
    (9, @VentaId, 2, 1850.00, 3700.00),
    (6, @VentaId, 3, 300.00, 900.00),
    (10, @VentaId, 2, 650.00, 1300.00);

    INSERT INTO dbo.Movimiento_Inventario (Id_Producto, Id_Tipo_Movimiento, Id_Usuario, Cantidad, Fecha, Motivo)
    VALUES 
    (2, 2, @IdVendedor, 3, '2026-10-09 11:15:00', 'Salida por Venta #2'),
    (9, 2, @IdVendedor, 2, '2026-10-09 11:15:00', 'Salida por Venta #2'),
    (6, 2, @IdVendedor, 3, '2026-10-09 11:15:00', 'Salida por Venta #2'),
    (10, 2, @IdVendedor, 2, '2026-10-09 11:15:00', 'Salida por Venta #2');

    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 3 WHERE Id_Producto = 2;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 2 WHERE Id_Producto = 9;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 3 WHERE Id_Producto = 6;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 2 WHERE Id_Producto = 10;

    INSERT INTO dbo.Factura (Id_Venta, Id_Estado_Factura, Fecha_Emision, Fecha_Vencimiento, Monto_Total, Saldo_Pendiente)
    VALUES (@VentaId, 3, '2026-10-09 11:15:00', '2026-10-09 11:15:00', 11582.50, 0.00);

    INSERT INTO dbo.Pago (Id_Factura, Id_Metodo_Pago, Fecha_Pago, Monto_Pagado, Numero_Referencia, Estado)
    VALUES (SCOPE_IDENTITY(), 5, '2026-10-09 11:15:00', 11582.50, 'SINPE-99281', 1);

    -- =============================================================
    -- VENTA 3: 2026-10-11 14:00:00 | Cliente 3 (Esc. Rep. Colombia) - Crédito 15 días
    -- =============================================================
    INSERT INTO dbo.Venta (Id_Cliente, Id_Usuario, Id_Estado_Venta, Id_Condicion_Pago, Fecha, Subtotal, Impuesto, Monto_Total)
    VALUES (3, @IdVendedor, 2, 2, '2026-10-11 14:00:00', 90750.00, 11797.50, 102547.50);
    SET @VentaId = SCOPE_IDENTITY();

    INSERT INTO dbo.Venta_Producto (Id_Producto, Id_Venta, Cantidad, Precio_Unitario, Subtotal)
    VALUES 
    (7, @VentaId, 15, 3800.00, 57000.00),
    (8, @VentaId, 25, 350.00, 8750.00),
    (1, @VentaId, 20, 1250.00, 25000.00);

    INSERT INTO dbo.Movimiento_Inventario (Id_Producto, Id_Tipo_Movimiento, Id_Usuario, Cantidad, Fecha, Motivo)
    VALUES 
    (7, 2, @IdVendedor, 15, '2026-10-11 14:00:00', 'Salida por Venta Crédito #3'),
    (8, 2, @IdVendedor, 25, '2026-10-11 14:00:00', 'Salida por Venta Crédito #3'),
    (1, 2, @IdVendedor, 20, '2026-10-11 14:00:00', 'Salida por Venta Crédito #3');

    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 15 WHERE Id_Producto = 7;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 25 WHERE Id_Producto = 8;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 20 WHERE Id_Producto = 1;

    INSERT INTO dbo.Factura (Id_Venta, Id_Estado_Factura, Fecha_Emision, Fecha_Vencimiento, Monto_Total, Saldo_Pendiente)
    VALUES (@VentaId, 1, '2026-10-11 14:00:00', '2026-10-26 14:00:00', 102547.50, 102547.50);
    DECLARE @Factura3 INT = SCOPE_IDENTITY();

    -- =============================================================
    -- VENTA 4: 2026-10-12 16:45:00 | Cliente 8 (Liberia) - Contado (Tarjeta Débito)
    -- =============================================================
    INSERT INTO dbo.Venta (Id_Cliente, Id_Usuario, Id_Estado_Venta, Id_Condicion_Pago, Fecha, Subtotal, Impuesto, Monto_Total)
    VALUES (8, @IdVendedor, 2, 1, '2026-10-12 16:45:00', 8400.00, 1092.00, 9492.00);
    SET @VentaId = SCOPE_IDENTITY();

    INSERT INTO dbo.Venta_Producto (Id_Producto, Id_Venta, Cantidad, Precio_Unitario, Subtotal)
    VALUES 
    (13, @VentaId, 2, 2000.00, 4000.00),
    (2, @VentaId, 2, 1450.00, 2900.00),
    (11, @VentaId, 1, 1500.00, 1500.00);

    INSERT INTO dbo.Movimiento_Inventario (Id_Producto, Id_Tipo_Movimiento, Id_Usuario, Cantidad, Fecha, Motivo)
    VALUES 
    (13, 2, @IdVendedor, 2, '2026-10-12 16:45:00', 'Salida por Venta #4'),
    (2, 2, @IdVendedor, 2, '2026-10-12 16:45:00', 'Salida por Venta #4'),
    (11, 2, @IdVendedor, 1, '2026-10-12 16:45:00', 'Salida por Venta #4');

    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 2 WHERE Id_Producto = 13;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 2 WHERE Id_Producto = 2;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 1 WHERE Id_Producto = 11;

    INSERT INTO dbo.Factura (Id_Venta, Id_Estado_Factura, Fecha_Emision, Fecha_Vencimiento, Monto_Total, Saldo_Pendiente)
    VALUES (@VentaId, 3, '2026-10-12 16:45:00', '2026-10-12 16:45:00', 9492.00, 0.00);

    INSERT INTO dbo.Pago (Id_Factura, Id_Metodo_Pago, Fecha_Pago, Monto_Pagado, Numero_Referencia, Estado)
    VALUES (SCOPE_IDENTITY(), 2, '2026-10-12 16:45:00', 9492.00, 'POS-AUTH-1092', 1);

    -- =============================================================
    -- VENTA 5: 2026-10-14 10:20:00 | Cliente 4 (Col. Científico UTN) - Crédito 30 días
    -- =============================================================
    INSERT INTO dbo.Venta (Id_Cliente, Id_Usuario, Id_Estado_Venta, Id_Condicion_Pago, Fecha, Subtotal, Impuesto, Monto_Total)
    VALUES (4, @IdVendedor, 2, 3, '2026-10-14 10:20:00', 105750.00, 13747.50, 119497.50);
    SET @VentaId = SCOPE_IDENTITY();

    INSERT INTO dbo.Venta_Producto (Id_Producto, Id_Venta, Cantidad, Precio_Unitario, Subtotal)
    VALUES 
    (7, @VentaId, 20, 3800.00, 76000.00),
    (3, @VentaId, 40, 250.00, 10000.00),
    (4, @VentaId, 40, 250.00, 10000.00),
    (10, @VentaId, 15, 650.00, 9750.00);

    INSERT INTO dbo.Movimiento_Inventario (Id_Producto, Id_Tipo_Movimiento, Id_Usuario, Cantidad, Fecha, Motivo)
    VALUES 
    (7, 2, @IdVendedor, 20, '2026-10-14 10:20:00', 'Salida por Venta Crédito #5'),
    (3, 2, @IdVendedor, 40, '2026-10-14 10:20:00', 'Salida por Venta Crédito #5'),
    (4, 2, @IdVendedor, 40, '2026-10-14 10:20:00', 'Salida por Venta Crédito #5'),
    (10, 2, @IdVendedor, 15, '2026-10-14 10:20:00', 'Salida por Venta Crédito #5');

    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 20 WHERE Id_Producto = 7;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 40 WHERE Id_Producto = 3;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 40 WHERE Id_Producto = 4;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 15 WHERE Id_Producto = 10;

    INSERT INTO dbo.Factura (Id_Venta, Id_Estado_Factura, Fecha_Emision, Fecha_Vencimiento, Monto_Total, Saldo_Pendiente)
    VALUES (@VentaId, 1, '2026-10-14 10:20:00', '2026-11-13 10:20:00', 119497.50, 119497.50);

    -- =============================================================
    -- VENTA 6: 2026-10-15 15:30:00 | Cliente 5 (Samir Campos) - Contado (SINPE)
    -- =============================================================
    INSERT INTO dbo.Venta (Id_Cliente, Id_Usuario, Id_Estado_Venta, Id_Condicion_Pago, Fecha, Subtotal, Impuesto, Monto_Total)
    VALUES (5, @IdVendedor, 2, 1, '2026-10-15 15:30:00', 10600.00, 1378.00, 11978.00);
    SET @VentaId = SCOPE_IDENTITY();

    INSERT INTO dbo.Venta_Producto (Id_Producto, Id_Venta, Cantidad, Precio_Unitario, Subtotal)
    VALUES 
    (11, @VentaId, 2, 1500.00, 3000.00),
    (1, @VentaId, 3, 1250.00, 3750.00),
    (9, @VentaId, 1, 1850.00, 1850.00);

    INSERT INTO dbo.Venta_Servicio (Id_Venta, Id_Servicio, Cantidad, Precio_Unitario, Subtotal)
    VALUES (@VentaId, 8, 2, 1000.00, 2000.00); -- Plastificado Carta

    INSERT INTO dbo.Movimiento_Inventario (Id_Producto, Id_Tipo_Movimiento, Id_Usuario, Cantidad, Fecha, Motivo)
    VALUES 
    (11, 2, @IdVendedor, 2, '2026-10-15 15:30:00', 'Salida por Venta #6'),
    (1, 2, @IdVendedor, 3, '2026-10-15 15:30:00', 'Salida por Venta #6'),
    (9, 2, @IdVendedor, 1, '2026-10-15 15:30:00', 'Salida por Venta #6');

    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 2 WHERE Id_Producto = 11;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 3 WHERE Id_Producto = 1;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 1 WHERE Id_Producto = 9;

    INSERT INTO dbo.Factura (Id_Venta, Id_Estado_Factura, Fecha_Emision, Fecha_Vencimiento, Monto_Total, Saldo_Pendiente)
    VALUES (@VentaId, 3, '2026-10-15 15:30:00', '2026-10-15 15:30:00', 11978.00, 0.00);

    INSERT INTO dbo.Pago (Id_Factura, Id_Metodo_Pago, Fecha_Pago, Monto_Pagado, Numero_Referencia, Estado)
    VALUES (SCOPE_IDENTITY(), 5, '2026-10-15 15:30:00', 11978.00, 'SINPE-44821', 1);

    -- =============================================================
    -- VENTA 7: 2026-10-17 11:00:00 | Cliente 12 (Mauricio) - Contado (Tarjeta Débito)
    -- =============================================================
    INSERT INTO dbo.Venta (Id_Cliente, Id_Usuario, Id_Estado_Venta, Id_Condicion_Pago, Fecha, Subtotal, Impuesto, Monto_Total)
    VALUES (12, @IdVendedor, 2, 1, '2026-10-17 11:00:00', 15000.00, 1950.00, 16950.00);
    SET @VentaId = SCOPE_IDENTITY();

    INSERT INTO dbo.Venta_Producto (Id_Producto, Id_Venta, Cantidad, Precio_Unitario, Subtotal)
    VALUES 
    (13, @VentaId, 3, 2000.00, 6000.00),
    (2, @VentaId, 4, 1450.00, 5800.00),
    (5, @VentaId, 10, 200.00, 2000.00),
    (6, @VentaId, 4, 300.00, 1200.00);

    INSERT INTO dbo.Movimiento_Inventario (Id_Producto, Id_Tipo_Movimiento, Id_Usuario, Cantidad, Fecha, Motivo)
    VALUES 
    (13, 2, @IdVendedor, 3, '2026-10-17 11:00:00', 'Salida por Venta #7'),
    (2, 2, @IdVendedor, 4, '2026-10-17 11:00:00', 'Salida por Venta #7'),
    (5, 2, @IdVendedor, 10, '2026-10-17 11:00:00', 'Salida por Venta #7'),
    (6, 2, @IdVendedor, 4, '2026-10-17 11:00:00', 'Salida por Venta #7');

    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 3 WHERE Id_Producto = 13;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 4 WHERE Id_Producto = 2;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 10 WHERE Id_Producto = 5;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 4 WHERE Id_Producto = 6;

    INSERT INTO dbo.Factura (Id_Venta, Id_Estado_Factura, Fecha_Emision, Fecha_Vencimiento, Monto_Total, Saldo_Pendiente)
    VALUES (@VentaId, 3, '2026-10-17 11:00:00', '2026-10-17 11:00:00', 16950.00, 0.00);

    INSERT INTO dbo.Pago (Id_Factura, Id_Metodo_Pago, Fecha_Pago, Monto_Pagado, Numero_Referencia, Estado)
    VALUES (SCOPE_IDENTITY(), 2, '2026-10-17 11:00:00', 16950.00, 'POS-AUTH-3321', 1);

    -- =============================================================
    -- VENTA 8: 2026-10-18 17:00:00 | Cliente 2 (Esteban) - Contado (Efectivo)
    -- =============================================================
    INSERT INTO dbo.Venta (Id_Cliente, Id_Usuario, Id_Estado_Venta, Id_Condicion_Pago, Fecha, Subtotal, Impuesto, Monto_Total)
    VALUES (2, @IdVendedor, 2, 1, '2026-10-18 17:00:00', 12600.00, 1638.00, 14238.00);
    SET @VentaId = SCOPE_IDENTITY();

    INSERT INTO dbo.Venta_Producto (Id_Producto, Id_Venta, Cantidad, Precio_Unitario, Subtotal)
    VALUES 
    (7, @VentaId, 2, 3800.00, 7600.00),
    (3, @VentaId, 10, 250.00, 2500.00),
    (4, @VentaId, 10, 250.00, 2500.00);

    INSERT INTO dbo.Movimiento_Inventario (Id_Producto, Id_Tipo_Movimiento, Id_Usuario, Cantidad, Fecha, Motivo)
    VALUES 
    (7, 2, @IdVendedor, 2, '2026-10-18 17:00:00', 'Salida por Venta #8'),
    (3, 2, @IdVendedor, 10, '2026-10-18 17:00:00', 'Salida por Venta #8'),
    (4, 2, @IdVendedor, 10, '2026-10-18 17:00:00', 'Salida por Venta #8');

    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 2 WHERE Id_Producto = 7;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 10 WHERE Id_Producto = 3;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 10 WHERE Id_Producto = 4;

    INSERT INTO dbo.Factura (Id_Venta, Id_Estado_Factura, Fecha_Emision, Fecha_Vencimiento, Monto_Total, Saldo_Pendiente)
    VALUES (@VentaId, 3, '2026-10-18 17:00:00', '2026-10-18 17:00:00', 14238.00, 0.00);

    INSERT INTO dbo.Pago (Id_Factura, Id_Metodo_Pago, Fecha_Pago, Monto_Pagado, Numero_Referencia, Estado)
    VALUES (SCOPE_IDENTITY(), 1, '2026-10-18 17:00:00', 14238.00, 'EFEC-CASH-002', 1);

    -- =============================================================
    -- VENTA 9: 2026-10-20 10:15:00 | Cliente 1 (María) - Contado (Tarjeta Crédito)
    -- PRIMERA VENTA DE MOCHILAS TRAS LLEGADA TARDÍA EL 19 DE OCTUBRE
    -- =============================================================
    INSERT INTO dbo.Venta (Id_Cliente, Id_Usuario, Id_Estado_Venta, Id_Condicion_Pago, Fecha, Subtotal, Impuesto, Monto_Total)
    VALUES (1, @IdVendedor, 2, 1, '2026-10-20 10:15:00', 37100.00, 4823.00, 41923.00);
    SET @VentaId = SCOPE_IDENTITY();

    INSERT INTO dbo.Venta_Producto (Id_Producto, Id_Venta, Cantidad, Precio_Unitario, Subtotal)
    VALUES 
    (12, @VentaId, 1, 30000.00, 30000.00), -- Mochila QuickSilver
    (1, @VentaId, 3, 1250.00, 3750.00),
    (11, @VentaId, 1, 1500.00, 1500.00),
    (9, @VentaId, 1, 1850.00, 1850.00);

    INSERT INTO dbo.Movimiento_Inventario (Id_Producto, Id_Tipo_Movimiento, Id_Usuario, Cantidad, Fecha, Motivo)
    VALUES 
    (12, 2, @IdVendedor, 1, '2026-10-20 10:15:00', 'Salida por Venta #9 (Mochila)'),
    (1, 2, @IdVendedor, 3, '2026-10-20 10:15:00', 'Salida por Venta #9'),
    (11, 2, @IdVendedor, 1, '2026-10-20 10:15:00', 'Salida por Venta #9'),
    (9, 2, @IdVendedor, 1, '2026-10-20 10:15:00', 'Salida por Venta #9');

    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 1 WHERE Id_Producto = 12;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 3 WHERE Id_Producto = 1;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 1 WHERE Id_Producto = 11;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 1 WHERE Id_Producto = 9;

    INSERT INTO dbo.Factura (Id_Venta, Id_Estado_Factura, Fecha_Emision, Fecha_Vencimiento, Monto_Total, Saldo_Pendiente)
    VALUES (@VentaId, 3, '2026-10-20 10:15:00', '2026-10-20 10:15:00', 41923.00, 0.00);

    INSERT INTO dbo.Pago (Id_Factura, Id_Metodo_Pago, Fecha_Pago, Monto_Pagado, Numero_Referencia, Estado)
    VALUES (SCOPE_IDENTITY(), 3, '2026-10-20 10:15:00', 41923.00, 'POS-AUTH-7711', 1);

    -- =============================================================
    -- VENTA 10: 2026-10-21 14:40:00 | Cliente 8 (Liberia) - Contado (SINPE)
    -- =============================================================
    INSERT INTO dbo.Venta (Id_Cliente, Id_Usuario, Id_Estado_Venta, Id_Condicion_Pago, Fecha, Subtotal, Impuesto, Monto_Total)
    VALUES (8, @IdVendedor, 2, 1, '2026-10-21 14:40:00', 35350.00, 4595.50, 39945.50);
    SET @VentaId = SCOPE_IDENTITY();

    INSERT INTO dbo.Venta_Producto (Id_Producto, Id_Venta, Cantidad, Precio_Unitario, Subtotal)
    VALUES 
    (12, @VentaId, 1, 30000.00, 30000.00), -- Mochila QuickSilver
    (2, @VentaId, 3, 1450.00, 4350.00),
    (3, @VentaId, 4, 250.00, 1000.00);

    INSERT INTO dbo.Movimiento_Inventario (Id_Producto, Id_Tipo_Movimiento, Id_Usuario, Cantidad, Fecha, Motivo)
    VALUES 
    (12, 2, @IdVendedor, 1, '2026-10-21 14:40:00', 'Salida por Venta #10 (Mochila)'),
    (2, 2, @IdVendedor, 3, '2026-10-21 14:40:00', 'Salida por Venta #10'),
    (3, 2, @IdVendedor, 4, '2026-10-21 14:40:00', 'Salida por Venta #10');

    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 1 WHERE Id_Producto = 12;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 3 WHERE Id_Producto = 2;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 4 WHERE Id_Producto = 3;

    INSERT INTO dbo.Factura (Id_Venta, Id_Estado_Factura, Fecha_Emision, Fecha_Vencimiento, Monto_Total, Saldo_Pendiente)
    VALUES (@VentaId, 3, '2026-10-21 14:40:00', '2026-10-21 14:40:00', 39945.50, 0.00);

    INSERT INTO dbo.Pago (Id_Factura, Id_Metodo_Pago, Fecha_Pago, Monto_Pagado, Numero_Referencia, Estado)
    VALUES (SCOPE_IDENTITY(), 5, '2026-10-21 14:40:00', 39945.50, 'SINPE-77290', 1);

    -- =============================================================
    -- VENTA 11: 2026-10-22 16:10:00 | Cliente 13 (Prueba) - Contado (Tarjeta Débito)
    -- =============================================================
    INSERT INTO dbo.Venta (Id_Cliente, Id_Usuario, Id_Estado_Venta, Id_Condicion_Pago, Fecha, Subtotal, Impuesto, Monto_Total)
    VALUES (13, @IdVendedor, 2, 1, '2026-10-22 16:10:00', 33500.00, 4355.00, 37855.00);
    SET @VentaId = SCOPE_IDENTITY();

    INSERT INTO dbo.Venta_Producto (Id_Producto, Id_Venta, Cantidad, Precio_Unitario, Subtotal)
    VALUES 
    (12, @VentaId, 1, 30000.00, 30000.00), -- Mochila QuickSilver
    (13, @VentaId, 1, 2000.00, 2000.00),
    (11, @VentaId, 1, 1500.00, 1500.00);

    INSERT INTO dbo.Movimiento_Inventario (Id_Producto, Id_Tipo_Movimiento, Id_Usuario, Cantidad, Fecha, Motivo)
    VALUES 
    (12, 2, @IdVendedor, 1, '2026-10-22 16:10:00', 'Salida por Venta #11 (Mochila)'),
    (13, 2, @IdVendedor, 1, '2026-10-22 16:10:00', 'Salida por Venta #11'),
    (11, 2, @IdVendedor, 1, '2026-10-22 16:10:00', 'Salida por Venta #11');

    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 1 WHERE Id_Producto = 12;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 1 WHERE Id_Producto = 13;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 1 WHERE Id_Producto = 11;

    INSERT INTO dbo.Factura (Id_Venta, Id_Estado_Factura, Fecha_Emision, Fecha_Vencimiento, Monto_Total, Saldo_Pendiente)
    VALUES (@VentaId, 3, '2026-10-22 16:10:00', '2026-10-22 16:10:00', 37855.00, 0.00);

    INSERT INTO dbo.Pago (Id_Factura, Id_Metodo_Pago, Fecha_Pago, Monto_Pagado, Numero_Referencia, Estado)
    VALUES (SCOPE_IDENTITY(), 2, '2026-10-22 16:10:00', 37855.00, 'POS-AUTH-8822', 1);

    -- =============================================================
    -- VENTA 12: 2026-10-23 11:30:00 | Cliente 9 (Colegio Vocacional) - Crédito 15 días
    -- =============================================================
    INSERT INTO dbo.Venta (Id_Cliente, Id_Usuario, Id_Estado_Venta, Id_Condicion_Pago, Fecha, Subtotal, Impuesto, Monto_Total)
    VALUES (9, @IdVendedor, 2, 2, '2026-10-23 11:30:00', 68750.00, 8937.50, 77687.50);
    SET @VentaId = SCOPE_IDENTITY();

    INSERT INTO dbo.Venta_Producto (Id_Producto, Id_Venta, Cantidad, Precio_Unitario, Subtotal)
    VALUES 
    (7, @VentaId, 10, 3800.00, 38000.00),
    (8, @VentaId, 20, 350.00, 7000.00),
    (1, @VentaId, 15, 1250.00, 18750.00),
    (4, @VentaId, 20, 250.00, 5000.00);

    INSERT INTO dbo.Movimiento_Inventario (Id_Producto, Id_Tipo_Movimiento, Id_Usuario, Cantidad, Fecha, Motivo)
    VALUES 
    (7, 2, @IdVendedor, 10, '2026-10-23 11:30:00', 'Salida por Venta Crédito #12'),
    (8, 2, @IdVendedor, 20, '2026-10-23 11:30:00', 'Salida por Venta Crédito #12'),
    (1, 2, @IdVendedor, 15, '2026-10-23 11:30:00', 'Salida por Venta Crédito #12'),
    (4, 2, @IdVendedor, 20, '2026-10-23 11:30:00', 'Salida por Venta Crédito #12');

    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 10 WHERE Id_Producto = 7;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 20 WHERE Id_Producto = 8;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 15 WHERE Id_Producto = 1;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 20 WHERE Id_Producto = 4;

    INSERT INTO dbo.Factura (Id_Venta, Id_Estado_Factura, Fecha_Emision, Fecha_Vencimiento, Monto_Total, Saldo_Pendiente)
    VALUES (@VentaId, 1, '2026-10-23 11:30:00', '2026-11-07 11:30:00', 77687.50, 77687.50);

    -- =============================================================
    -- VENTA 13: 2026-10-24 15:00:00 | Cliente 14 - Contado (Efectivo)
    -- =============================================================
    INSERT INTO dbo.Venta (Id_Cliente, Id_Usuario, Id_Estado_Venta, Id_Condicion_Pago, Fecha, Subtotal, Impuesto, Monto_Total)
    VALUES (14, @IdVendedor, 2, 1, '2026-10-24 15:00:00', 37450.00, 4868.50, 42318.50);
    SET @VentaId = SCOPE_IDENTITY();

    INSERT INTO dbo.Venta_Producto (Id_Producto, Id_Venta, Cantidad, Precio_Unitario, Subtotal)
    VALUES 
    (12, @VentaId, 1, 30000.00, 30000.00), -- Mochila QuickSilver
    (9, @VentaId, 3, 1850.00, 5550.00),
    (10, @VentaId, 3, 650.00, 1950.00);

    INSERT INTO dbo.Movimiento_Inventario (Id_Producto, Id_Tipo_Movimiento, Id_Usuario, Cantidad, Fecha, Motivo)
    VALUES 
    (12, 2, @IdVendedor, 1, '2026-10-24 15:00:00', 'Salida por Venta #13 (Mochila)'),
    (9, 2, @IdVendedor, 3, '2026-10-24 15:00:00', 'Salida por Venta #13'),
    (10, 2, @IdVendedor, 3, '2026-10-24 15:00:00', 'Salida por Venta #13');

    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 1 WHERE Id_Producto = 12;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 3 WHERE Id_Producto = 9;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 3 WHERE Id_Producto = 10;

    INSERT INTO dbo.Factura (Id_Venta, Id_Estado_Factura, Fecha_Emision, Fecha_Vencimiento, Monto_Total, Saldo_Pendiente)
    VALUES (@VentaId, 3, '2026-10-24 15:00:00', '2026-10-24 15:00:00', 42318.50, 0.00);

    INSERT INTO dbo.Pago (Id_Factura, Id_Metodo_Pago, Fecha_Pago, Monto_Pagado, Numero_Referencia, Estado)
    VALUES (SCOPE_IDENTITY(), 1, '2026-10-24 15:00:00', 42318.50, 'EFEC-CASH-003', 1);

    -- =============================================================
    -- VENTA 14: 2026-10-25 10:45:00 | Cliente 15 - Contado (Tarjeta Débito)
    -- =============================================================
    INSERT INTO dbo.Venta (Id_Cliente, Id_Usuario, Id_Estado_Venta, Id_Condicion_Pago, Fecha, Subtotal, Impuesto, Monto_Total)
    VALUES (15, @IdVendedor, 2, 1, '2026-10-25 10:45:00', 36500.00, 4745.00, 41245.00);
    SET @VentaId = SCOPE_IDENTITY();

    INSERT INTO dbo.Venta_Producto (Id_Producto, Id_Venta, Cantidad, Precio_Unitario, Subtotal)
    VALUES 
    (12, @VentaId, 1, 30000.00, 30000.00), -- Mochila QuickSilver
    (1, @VentaId, 4, 1250.00, 5000.00),
    (11, @VentaId, 1, 1500.00, 1500.00);

    INSERT INTO dbo.Movimiento_Inventario (Id_Producto, Id_Tipo_Movimiento, Id_Usuario, Cantidad, Fecha, Motivo)
    VALUES 
    (12, 2, @IdVendedor, 1, '2026-10-25 10:45:00', 'Salida por Venta #14 (Mochila)'),
    (1, 2, @IdVendedor, 4, '2026-10-25 10:45:00', 'Salida por Venta #14'),
    (11, 2, @IdVendedor, 1, '2026-10-25 10:45:00', 'Salida por Venta #14');

    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 1 WHERE Id_Producto = 12;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 4 WHERE Id_Producto = 1;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 1 WHERE Id_Producto = 11;

    INSERT INTO dbo.Factura (Id_Venta, Id_Estado_Factura, Fecha_Emision, Fecha_Vencimiento, Monto_Total, Saldo_Pendiente)
    VALUES (@VentaId, 3, '2026-10-25 10:45:00', '2026-10-25 10:45:00', 41245.00, 0.00);

    INSERT INTO dbo.Pago (Id_Factura, Id_Metodo_Pago, Fecha_Pago, Monto_Pagado, Numero_Referencia, Estado)
    VALUES (SCOPE_IDENTITY(), 2, '2026-10-25 10:45:00', 41245.00, 'POS-AUTH-9954', 1);

    -- =============================================================
    -- VENTA 15: 2026-10-26 12:30:00 | Cliente 2 (Esteban) - Contado (SINPE)
    -- =============================================================
    INSERT INTO dbo.Venta (Id_Cliente, Id_Usuario, Id_Estado_Venta, Id_Condicion_Pago, Fecha, Subtotal, Impuesto, Monto_Total)
    VALUES (2, @IdVendedor, 2, 1, '2026-10-26 12:30:00', 9000.00, 1170.00, 10170.00);
    SET @VentaId = SCOPE_IDENTITY();

    INSERT INTO dbo.Venta_Producto (Id_Producto, Id_Venta, Cantidad, Precio_Unitario, Subtotal)
    VALUES 
    (13, @VentaId, 2, 2000.00, 4000.00),
    (2, @VentaId, 2, 1450.00, 2900.00),
    (4, @VentaId, 6, 250.00, 1500.00),
    (6, @VentaId, 2, 300.00, 600.00);

    INSERT INTO dbo.Movimiento_Inventario (Id_Producto, Id_Tipo_Movimiento, Id_Usuario, Cantidad, Fecha, Motivo)
    VALUES 
    (13, 2, @IdVendedor, 2, '2026-10-26 12:30:00', 'Salida por Venta #15'),
    (2, 2, @IdVendedor, 2, '2026-10-26 12:30:00', 'Salida por Venta #15'),
    (4, 2, @IdVendedor, 6, '2026-10-26 12:30:00', 'Salida por Venta #15'),
    (6, 2, @IdVendedor, 2, '2026-10-26 12:30:00', 'Salida por Venta #15');

    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 2 WHERE Id_Producto = 13;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 2 WHERE Id_Producto = 2;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 6 WHERE Id_Producto = 4;
    UPDATE dbo.Producto SET Stock_Actual = Stock_Actual - 2 WHERE Id_Producto = 6;

    INSERT INTO dbo.Factura (Id_Venta, Id_Estado_Factura, Fecha_Emision, Fecha_Vencimiento, Monto_Total, Saldo_Pendiente)
    VALUES (@VentaId, 3, '2026-10-26 12:30:00', '2026-10-26 12:30:00', 10170.00, 0.00);

    INSERT INTO dbo.Pago (Id_Factura, Id_Metodo_Pago, Fecha_Pago, Monto_Pagado, Numero_Referencia, Estado)
    VALUES (SCOPE_IDENTITY(), 5, '2026-10-26 12:30:00', 10170.00, 'SINPE-88401', 1);

    -- =============================================================
    -- ABONO PARCIAL DE CLIENTE INSTITUCIONAL (Factura 3 - Esc. Rep. Colombia)
    -- =============================================================
    INSERT INTO dbo.Pago (Id_Factura, Id_Metodo_Pago, Fecha_Pago, Monto_Pagado, Numero_Referencia, Estado)
    VALUES (@Factura3, 4, '2026-10-25 15:45:00', 50000.00, 'TRANSF-BCR-55901', 1);

    UPDATE dbo.Factura 
    SET Saldo_Pendiente = Saldo_Pendiente - 50000.00,
        Id_Estado_Factura = 2 -- Parcial
    WHERE Id_Factura = @Factura3;

    PRINT '>>> PASO 5: Ejecutando Pipeline ETL para Actualizar Data Warehouse...';

    EXEC dbo.SP_ETL_CargarDimProducto;
    EXEC dbo.SP_ETL_CargarDimCliente;
    EXEC dbo.SP_ETL_CargarFactVentas;
    EXEC dbo.SP_ETL_CargarFactVentaProducto;
    EXEC dbo.SP_ETL_CargarFactVentaServicio;
    EXEC dbo.SP_ETL_CargarFactPagos;

    COMMIT TRANSACTION;
    PRINT '>>> ¡ÉXITO! FASE 4 completada satisfactoriamente con integridad transaccional.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    PRINT '>>> ERROR FATAL EN FASE 4: ' + ERROR_MESSAGE();
    THROW;
END CATCH;
GO
