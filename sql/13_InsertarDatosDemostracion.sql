/* =========================================================================
   PROYECTO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR
   SCRIPT: 13_InsertarDatosDemostracion.sql
   REQUERIMIENTOS: RF7.1, RF7.3, RF7.9
   REFERENCIA DOCUMENTACIÓN: Sección 17.8.13 (Página 447)
   DESCRIPCIÓN: Inserción de operaciones transaccionales para pruebas y demostración:
     1. Compras a proveedores (Compra y Compra_Producto)
     2. Movimientos de inventario asociados (Movimiento_Inventario)
     3. Ventas de mostrador y a crédito (Venta, Venta_Producto, Venta_Servicio)
     4. Emisión de facturas (Factura)
     5. Registro de pagos totales y parciales (Pago)
     6. Registro en Bitácora de auditoría (Bitacora)
   ========================================================================= */

USE MUNDO_ESCOLAR
GO

SET NOCOUNT ON;
PRINT 'Iniciando carga de transacciones demostrativas en MUNDO_ESCOLAR...';
GO

DECLARE @IdAdmin INT = (SELECT Id_Usuario FROM Usuario WHERE Nombre_Usuario = 'admin');
DECLARE @IdVendedor INT = (SELECT Id_Usuario FROM Usuario WHERE Nombre_Usuario = 'carlos.vargas');
DECLARE @IdBodeguero INT = (SELECT Id_Usuario FROM Usuario WHERE Nombre_Usuario = 'mario.bodega');

DECLARE @IdProvPapelera INT = (
    SELECT p.Id_Proveedor FROM Proveedor p 
    JOIN Proveedor_Institucional pi ON p.Id_Proveedor = pi.Id_Proveedor 
    WHERE pi.Cedula_Juridica = '3-101-555888'
);

DECLARE @IdProvValle INT = (
    SELECT p.Id_Proveedor FROM Proveedor p 
    JOIN Proveedor_Institucional pi ON p.Id_Proveedor = pi.Id_Proveedor 
    WHERE pi.Cedula_Juridica = '3-101-999333'
);

DECLARE @IdCliPart1 INT = (
    SELECT c.Id_Cliente FROM Cliente c 
    JOIN Cliente_Particular cp ON c.Id_Cliente = cp.Id_Cliente 
    WHERE cp.Identificacion = '1-1122-0334'
);

DECLARE @IdCliInst1 INT = (
    SELECT c.Id_Cliente FROM Cliente c 
    JOIN Cliente_Institucional ci ON c.Id_Cliente = ci.Id_Cliente 
    WHERE ci.Cedula_Juridica = '3-008-045612'
);

DECLARE @IdEstadoCompRecibida INT = (SELECT Id_Estado_Compra FROM Estado_Compra WHERE Nombre_Estado = 'Recibida');
DECLARE @IdEstadoVentaConf INT = (SELECT Id_Estado_Venta FROM Estado_Venta WHERE Nombre_Estado = 'Confirmada');
DECLARE @IdEstadoFactPagada INT = (SELECT Id_Estado_Factura FROM Estado_Factura WHERE Nombre_Estado = 'Pagada');
DECLARE @IdEstadoFactEmitida INT = (SELECT Id_Estado_Factura FROM Estado_Factura WHERE Nombre_Estado = 'Emitida');

DECLARE @IdCondContado INT = (SELECT Id_Condicion_Pago FROM Condicion_Pago WHERE Nombre = 'Contado');
DECLARE @IdCondCred30 INT = (SELECT Id_Condicion_Pago FROM Condicion_Pago WHERE Nombre = 'Crédito 30 días');

DECLARE @IdMetodoEfec INT = (SELECT Id_Metodo_Pago FROM Metodo_Pago WHERE Nombre = 'Efectivo');
DECLARE @IdMetodoSinpe INT = (SELECT Id_Metodo_Pago FROM Metodo_Pago WHERE Nombre = 'SINPE Móvil');

DECLARE @IdTipoMovEntrada INT = (SELECT Id_Tipo_Movimiento FROM Tipo_Movimiento WHERE Nombre = 'Entrada por Compra');
DECLARE @IdTipoMovSalida INT = (SELECT Id_Tipo_Movimiento FROM Tipo_Movimiento WHERE Nombre = 'Salida por Venta');

-- 1. Transacción de Compra Demostrativa #1 (Papelera Nacional)
IF NOT EXISTS (SELECT 1 FROM Compra WHERE Id_Proveedor = @IdProvPapelera AND Id_Estado_Compra = @IdEstadoCompRecibida)
BEGIN
    INSERT INTO Compra (Id_Proveedor, Id_Usuario, Id_Estado_Compra, Fecha_Compra)
    VALUES (@IdProvPapelera, @IdBodeguero, @IdEstadoCompRecibida, DATEADD(DAY, -10, GETDATE()));
    
    DECLARE @IdComp1 INT = SCOPE_IDENTITY();
    
    -- Resma Papel Bond: 50 unidades a 2470.00
    DECLARE @IdProdResma INT = (SELECT Id_Producto FROM Producto WHERE Nombre = 'Resma Papel Bond Carta 75g');
    INSERT INTO Compra_Producto (Id_Compra, Id_Producto, Cantidad, Costo_Unitario, Subtotal)
    VALUES (@IdComp1, @IdProdResma, 50, 2470.00, 123500.00);
    
    -- Movimiento de Inventario de Entrada
    INSERT INTO Movimiento_Inventario (Id_Producto, Id_Tipo_Movimiento, Id_Usuario, Cantidad, Fecha, Motivo)
    VALUES (@IdProdResma, @IdTipoMovEntrada, @IdBodeguero, 50, DATEADD(DAY, -10, GETDATE()), 'Entrada por Compra inicial #1');
    
    -- Cuaderno Cosido: 60 unidades a 812.50
    DECLARE @IdProdCuad INT = (SELECT Id_Producto FROM Producto WHERE Nombre = 'Cuaderno Cosido 100 Hojas');
    INSERT INTO Compra_Producto (Id_Compra, Id_Producto, Cantidad, Costo_Unitario, Subtotal)
    VALUES (@IdComp1, @IdProdCuad, 60, 812.50, 48750.00);
    
    INSERT INTO Movimiento_Inventario (Id_Producto, Id_Tipo_Movimiento, Id_Usuario, Cantidad, Fecha, Motivo)
    VALUES (@IdProdCuad, @IdTipoMovEntrada, @IdBodeguero, 60, DATEADD(DAY, -10, GETDATE()), 'Entrada por Compra inicial #1');
END

-- 2. Transacción de Venta Demostrativa #1 (Venta de Contado en Caja a Cliente Particular)
-- Productos + Servicio de Plastificado
IF NOT EXISTS (SELECT 1 FROM Venta WHERE Id_Cliente = @IdCliPart1 AND Id_Condicion_Pago = @IdCondContado)
BEGIN
    -- Subtotal: 2 Cuadernos (2500) + 4 Bolígrafos Azules (1000) + 1 Plastificado Carta (1000) = 4500.00
    -- Impuesto (13%): 585.00
    -- Total: 5085.00
    INSERT INTO Venta (Id_Cliente, Id_Usuario, Id_Estado_Venta, Id_Condicion_Pago, Fecha, Subtotal, Impuesto, Monto_Total)
    VALUES (@IdCliPart1, @IdVendedor, @IdEstadoVentaConf, @IdCondContado, DATEADD(DAY, -2, GETDATE()), 4500.00, 585.00, 5085.00);
    
    DECLARE @IdVenta1 INT = SCOPE_IDENTITY();
    
    DECLARE @IdProdCuad2 INT = (SELECT Id_Producto FROM Producto WHERE Nombre = 'Cuaderno Cosido 100 Hojas');
    DECLARE @IdProdBolig INT = (SELECT Id_Producto FROM Producto WHERE Nombre = 'Bolígrafo Azul 0.7mm');
    DECLARE @IdServPlast INT = (SELECT Id_Servicio FROM Servicio WHERE Nombre = 'Plastificado Carta');
    
    INSERT INTO Venta_Producto (Id_Producto, Id_Venta, Cantidad, Precio_Unitario, Subtotal)
    VALUES (@IdProdCuad2, @IdVenta1, 2, 1250.00, 2500.00);
    
    INSERT INTO Venta_Producto (Id_Producto, Id_Venta, Cantidad, Precio_Unitario, Subtotal)
    VALUES (@IdProdBolig, @IdVenta1, 4, 250.00, 1000.00);
    
    INSERT INTO Venta_Servicio (Id_Venta, Id_Servicio, Cantidad, Precio_Unitario, Subtotal)
    VALUES (@IdVenta1, @IdServPlast, 1, 1000.00, 1000.00);
    
    -- Salida de Inventario
    INSERT INTO Movimiento_Inventario (Id_Producto, Id_Tipo_Movimiento, Id_Usuario, Cantidad, Fecha, Motivo)
    VALUES (@IdProdCuad2, @IdTipoMovSalida, @IdVendedor, 2, DATEADD(DAY, -2, GETDATE()), 'Salida por Venta #1');
    
    INSERT INTO Movimiento_Inventario (Id_Producto, Id_Tipo_Movimiento, Id_Usuario, Cantidad, Fecha, Motivo)
    VALUES (@IdProdBolig, @IdTipoMovSalida, @IdVendedor, 4, DATEADD(DAY, -2, GETDATE()), 'Salida por Venta #1');
    
    -- Factura Generada (Pagada de inmediato por Contado)
    INSERT INTO Factura (Id_Venta, Id_Estado_Factura, Fecha_Emision, Fecha_Vencimiento, Monto_Total, Saldo_Pendiente)
    VALUES (@IdVenta1, @IdEstadoFactPagada, DATEADD(DAY, -2, GETDATE()), DATEADD(DAY, -2, GETDATE()), 5085.00, 0.00);
    
    DECLARE @IdFact1 INT = SCOPE_IDENTITY();
    
    -- Pago Total con Efectivo
    INSERT INTO Pago (Id_Factura, Id_Metodo_Pago, Fecha_Pago, Monto_Pagado, Numero_Referencia, Estado)
    VALUES (@IdFact1, @IdMetodoEfec, DATEADD(DAY, -2, GETDATE()), 5085.00, 'EFECTIVO-REC-001', 1);
END

-- 3. Transacción de Venta Demostrativa #2 (Venta Institucional a Crédito 30 días)
IF NOT EXISTS (SELECT 1 FROM Venta WHERE Id_Cliente = @IdCliInst1 AND Id_Condicion_Pago = @IdCondCred30)
BEGIN
    -- Subtotal: 10 Resmas (38000) + 20 Cajas Colores (37000) = 75000.00
    -- Impuesto (13%): 9750.00
    -- Total: 84750.00
    INSERT INTO Venta (Id_Cliente, Id_Usuario, Id_Estado_Venta, Id_Condicion_Pago, Fecha, Subtotal, Impuesto, Monto_Total)
    VALUES (@IdCliInst1, @IdVendedor, @IdEstadoVentaConf, @IdCondCred30, DATEADD(DAY, -1, GETDATE()), 75000.00, 9750.00, 84750.00);
    
    DECLARE @IdVenta2 INT = SCOPE_IDENTITY();
    
    DECLARE @IdProdResma2 INT = (SELECT Id_Producto FROM Producto WHERE Nombre = 'Resma Papel Bond Carta 75g');
    DECLARE @IdProdColores INT = (SELECT Id_Producto FROM Producto WHERE Nombre = 'Caja Lápices Color 12 Uds');
    
    INSERT INTO Venta_Producto (Id_Producto, Id_Venta, Cantidad, Precio_Unitario, Subtotal)
    VALUES (@IdProdResma2, @IdVenta2, 10, 3800.00, 38000.00);
    
    INSERT INTO Venta_Producto (Id_Producto, Id_Venta, Cantidad, Precio_Unitario, Subtotal)
    VALUES (@IdProdColores, @IdVenta2, 20, 1850.00, 37000.00);
    
    -- Salida de Inventario
    INSERT INTO Movimiento_Inventario (Id_Producto, Id_Tipo_Movimiento, Id_Usuario, Cantidad, Fecha, Motivo)
    VALUES (@IdProdResma2, @IdTipoMovSalida, @IdVendedor, 10, DATEADD(DAY, -1, GETDATE()), 'Salida por Venta a Crédito #2');
    
    INSERT INTO Movimiento_Inventario (Id_Producto, Id_Tipo_Movimiento, Id_Usuario, Cantidad, Fecha, Motivo)
    VALUES (@IdProdColores, @IdTipoMovSalida, @IdVendedor, 20, DATEADD(DAY, -1, GETDATE()), 'Salida por Venta a Crédito #2');
    
    -- Factura a Crédito (Emitida con saldo pendiente y vencimiento a 30 días)
    INSERT INTO Factura (Id_Venta, Id_Estado_Factura, Fecha_Emision, Fecha_Vencimiento, Monto_Total, Saldo_Pendiente)
    VALUES (@IdVenta2, @IdEstadoFactEmitida, DATEADD(DAY, -1, GETDATE()), DATEADD(DAY, 29, GETDATE()), 84750.00, 84750.00);
    
    DECLARE @IdFact2 INT = SCOPE_IDENTITY();
    
    -- Abono parcial de 40000.00 vía SINPE Móvil
    INSERT INTO Pago (Id_Factura, Id_Metodo_Pago, Fecha_Pago, Monto_Pagado, Numero_Referencia, Estado)
    VALUES (@IdFact2, @IdMetodoSinpe, GETDATE(), 40000.00, 'SINPE-TRF-9823412', 1);
    
    -- Actualizar estado de la factura a Parcial y saldo a 44750.00
    DECLARE @IdEstadoFactParcial INT = (SELECT Id_Estado_Factura FROM Estado_Factura WHERE Nombre_Estado = 'Parcial');
    UPDATE Factura
    SET Saldo_Pendiente = 44750.00,
        Id_Estado_Factura = @IdEstadoFactParcial
    WHERE Id_Factura = @IdFact2;
END

-- 4. Registro de Auditoría Inicial (Bitacora)
INSERT INTO Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
VALUES 
(@IdAdmin, 'INSTALACION_SISTEMA', 'Sistema', 1, GETDATE(), 'Inicialización y validación exitosa de catálogos y datos maestros'),
(@IdAdmin, 'CARGA_DATOS_DEMO', 'Venta/Factura', 2, GETDATE(), 'Carga de transacciones de prueba para demostración y evaluación');
GO

PRINT 'Transacciones demostrativas cargadas exitosamente.';
GO
