/* =========================================================================
   PROYECTO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR
   SCRIPT: 08_CrearFunciones.sql
   REQUERIMIENTOS: RF1.10, RF2.5–RF2.6, RF3.4–RF3.6, RF4.9–RF4.10, RF6.6, RA5.4
   REFERENCIA DOCUMENTACIÓN: Secciones 17.5 (Escalares) y 17.6 (TVF) (Págs. 427-433)
   DESCRIPCIÓN: Creación de funciones escalares y funciones con valores de tabla:
     -- FUNCIONES ESCALARES (17.5):
     1. FN_CalcularSubtotalDetalle
     2. FN_CalcularImpuesto
     3. FN_CalcularTotalVenta
     4. FN_CalcularSaldoFactura
     5. FN_EstaBajoReorden
     6. FN_EstaAgotado
     7. FN_DiasAtraso
     -- FUNCIONES CON VALORES DE TABLA (TVF) (17.6):
     8. TF_VentasPorCliente
     9. TF_VentasPorPeriodo
     10. TF_ProductosMasVendidos
     11. TF_FacturasPendientes
     12. TF_CuentasVencidas
     13. TF_MovimientosInventario
     14. TF_ActividadUsuario
     15. TF_ComprasPorProveedor
   ========================================================================= */

USE MUNDO_ESCOLAR
GO

-- =========================================================================
-- 1. FUNCIONES ESCALARES (17.5)
-- =========================================================================

-- 17.5.1. FN_CalcularSubtotalDetalle
CREATE OR ALTER FUNCTION dbo.FN_CalcularSubtotalDetalle
(
    @Cantidad INT,
    @PrecioUnitario DECIMAL(12, 2)
)
RETURNS DECIMAL(12, 2)
WITH SCHEMABINDING
AS
BEGIN
    RETURN ROUND(ISNULL(@Cantidad, 0) * ISNULL(@PrecioUnitario, 0.00), 2);
END;
GO

-- 17.5.2. FN_CalcularImpuesto (Tasa por defecto 13% IVA Costa Rica)
CREATE OR ALTER FUNCTION dbo.FN_CalcularImpuesto
(
    @BaseImponible DECIMAL(12, 2),
    @Tasa DECIMAL(5, 4) = 0.1300
)
RETURNS DECIMAL(12, 2)
WITH SCHEMABINDING
AS
BEGIN
    RETURN ROUND(ISNULL(@BaseImponible, 0.00) * ISNULL(@Tasa, 0.1300), 2);
END;
GO

-- 17.5.3. FN_CalcularTotalVenta
CREATE OR ALTER FUNCTION dbo.FN_CalcularTotalVenta
(
    @Subtotal DECIMAL(12, 2),
    @Impuesto DECIMAL(12, 2)
)
RETURNS DECIMAL(12, 2)
WITH SCHEMABINDING
AS
BEGIN
    RETURN ROUND(ISNULL(@Subtotal, 0.00) + ISNULL(@Impuesto, 0.00), 2);
END;
GO

-- 17.5.4. FN_CalcularSaldoFactura
CREATE OR ALTER FUNCTION dbo.FN_CalcularSaldoFactura
(
    @MontoTotal DECIMAL(12, 2),
    @TotalPagadoValido DECIMAL(12, 2)
)
RETURNS DECIMAL(12, 2)
WITH SCHEMABINDING
AS
BEGIN
    DECLARE @Saldo DECIMAL(12, 2) = ISNULL(@MontoTotal, 0.00) - ISNULL(@TotalPagadoValido, 0.00);
    IF @Saldo < 0.00
        SET @Saldo = 0.00;
    RETURN ROUND(@Saldo, 2);
END;
GO

-- 17.5.5. FN_EstaBajoReorden
CREATE OR ALTER FUNCTION dbo.FN_EstaBajoReorden
(
    @StockActual INT,
    @PuntoReorden INT
)
RETURNS BIT
WITH SCHEMABINDING
AS
BEGIN
    IF ISNULL(@StockActual, 0) <= ISNULL(@PuntoReorden, 0)
        RETURN 1;
    RETURN 0;
END;
GO

-- 17.5.6. FN_EstaAgotado
CREATE OR ALTER FUNCTION dbo.FN_EstaAgotado
(
    @StockActual INT
)
RETURNS BIT
WITH SCHEMABINDING
AS
BEGIN
    IF ISNULL(@StockActual, 0) <= 0
        RETURN 1;
    RETURN 0;
END;
GO

-- 17.5.7. FN_DiasAtraso
CREATE OR ALTER FUNCTION dbo.FN_DiasAtraso
(
    @FechaVencimiento DATETIME,
    @FechaCorte DATETIME,
    @Saldo DECIMAL(12, 2)
)
RETURNS INT
WITH SCHEMABINDING
AS
BEGIN
    IF ISNULL(@Saldo, 0.00) > 0.00 AND @FechaCorte > @FechaVencimiento
        RETURN DATEDIFF(DAY, @FechaVencimiento, @FechaCorte);
    RETURN 0;
END;
GO

-- =========================================================================
-- 2. FUNCIONES CON VALORES DE TABLA (TVF) (17.6)
-- =========================================================================

-- 17.6.1. TF_VentasPorCliente
CREATE OR ALTER FUNCTION dbo.TF_VentasPorCliente
(
    @Id_Cliente INT,
    @Fecha_Inicio DATETIME,
    @Fecha_Fin DATETIME,
    @Id_Condicion_Pago INT = NULL,
    @Id_Estado_Venta INT = NULL
)
RETURNS TABLE
AS
RETURN
(
    SELECT 
        v.Id_Venta,
        v.Id_Cliente,
        CASE 
            WHEN tc.Nombre = 'Particular' THEN RTRIM(LTRIM(CONCAT(cp.Nombre, ' ', cp.Apellido1, ' ', ISNULL(cp.Apellido2, ''))))
            WHEN tc.Nombre = 'Institucional' THEN ci.Razon_Social
            ELSE 'No identificado'
        END AS Nombre_Cliente,
        CASE 
            WHEN tc.Nombre = 'Particular' THEN cp.Identificacion
            WHEN tc.Nombre = 'Institucional' THEN ci.Cedula_Juridica
            ELSE 'N/A'
        END AS Cedula_Cliente,
        v.Id_Usuario,
        u.Nombre_Usuario AS Vendedor,
        v.Id_Condicion_Pago,
        cpago.Nombre AS Condicion_Pago,
        v.Id_Estado_Venta,
        ev.Nombre_Estado AS Estado_Venta,
        v.Fecha,
        v.Subtotal,
        v.Impuesto,
        v.Monto_Total
    FROM Venta v
    INNER JOIN Estado_Venta ev ON v.Id_Estado_Venta = ev.Id_Estado_Venta
    INNER JOIN Condicion_Pago cpago ON v.Id_Condicion_Pago = cpago.Id_Condicion_Pago
    INNER JOIN Usuario u ON v.Id_Usuario = u.Id_Usuario
    INNER JOIN Cliente c ON v.Id_Cliente = c.Id_Cliente
    INNER JOIN Tipo_Cliente tc ON c.Id_Tipo_Cliente = tc.Id_Tipo_Cliente
    LEFT JOIN Cliente_Particular cp ON c.Id_Cliente = cp.Id_Cliente
    LEFT JOIN Cliente_Institucional ci ON c.Id_Cliente = ci.Id_Cliente
    WHERE v.Id_Cliente = @Id_Cliente
      AND v.Fecha BETWEEN @Fecha_Inicio AND @Fecha_Fin
      AND (@Id_Condicion_Pago IS NULL OR v.Id_Condicion_Pago = @Id_Condicion_Pago)
      AND (@Id_Estado_Venta IS NULL OR v.Id_Estado_Venta = @Id_Estado_Venta)
);
GO

-- 17.6.2. TF_VentasPorPeriodo
CREATE OR ALTER FUNCTION dbo.TF_VentasPorPeriodo
(
    @Fecha_Inicio DATETIME,
    @Fecha_Fin DATETIME,
    @Id_Cliente INT = NULL,
    @Id_Usuario INT = NULL,
    @Id_Condicion_Pago INT = NULL,
    @Id_Estado_Venta INT = NULL
)
RETURNS TABLE
AS
RETURN
(
    SELECT 
        v.Id_Venta,
        v.Id_Cliente,
        CASE 
            WHEN tc.Nombre = 'Particular' THEN RTRIM(LTRIM(CONCAT(cp.Nombre, ' ', cp.Apellido1, ' ', ISNULL(cp.Apellido2, ''))))
            WHEN tc.Nombre = 'Institucional' THEN ci.Razon_Social
            ELSE 'No identificado'
        END AS Nombre_Cliente,
        v.Id_Usuario,
        u.Nombre_Usuario AS Vendedor,
        v.Id_Condicion_Pago,
        cpago.Nombre AS Condicion_Pago,
        v.Id_Estado_Venta,
        ev.Nombre_Estado AS Estado_Venta,
        v.Fecha,
        v.Subtotal,
        v.Impuesto,
        v.Monto_Total
    FROM Venta v
    INNER JOIN Estado_Venta ev ON v.Id_Estado_Venta = ev.Id_Estado_Venta
    INNER JOIN Condicion_Pago cpago ON v.Id_Condicion_Pago = cpago.Id_Condicion_Pago
    INNER JOIN Usuario u ON v.Id_Usuario = u.Id_Usuario
    INNER JOIN Cliente c ON v.Id_Cliente = c.Id_Cliente
    INNER JOIN Tipo_Cliente tc ON c.Id_Tipo_Cliente = tc.Id_Tipo_Cliente
    LEFT JOIN Cliente_Particular cp ON c.Id_Cliente = cp.Id_Cliente
    LEFT JOIN Cliente_Institucional ci ON c.Id_Cliente = ci.Id_Cliente
    WHERE v.Fecha BETWEEN @Fecha_Inicio AND @Fecha_Fin
      AND (@Id_Cliente IS NULL OR v.Id_Cliente = @Id_Cliente)
      AND (@Id_Usuario IS NULL OR v.Id_Usuario = @Id_Usuario)
      AND (@Id_Condicion_Pago IS NULL OR v.Id_Condicion_Pago = @Id_Condicion_Pago)
      AND (@Id_Estado_Venta IS NULL OR v.Id_Estado_Venta = @Id_Estado_Venta)
);
GO

-- 17.6.3. TF_ProductosMasVendidos (Solo ventas Confirmadas)
CREATE OR ALTER FUNCTION dbo.TF_ProductosMasVendidos
(
    @FechaInicio DATETIME,
    @FechaFin DATETIME
)
RETURNS TABLE
AS
RETURN
(
    SELECT 
        p.Id_Producto,
        p.Nombre AS Nombre_Producto,
        cat.Nombre AS Categoria,
        SUM(vp.Cantidad) AS Unidades_Vendidas,
        SUM(vp.Subtotal) AS Monto_Total_Vendido
    FROM Venta_Producto vp
    INNER JOIN Venta v ON vp.Id_Venta = v.Id_Venta
    INNER JOIN Estado_Venta ev ON v.Id_Estado_Venta = ev.Id_Estado_Venta
    INNER JOIN Producto p ON vp.Id_Producto = p.Id_Producto
    INNER JOIN Categoria cat ON p.Id_Categoria = cat.Id_Categoria
    WHERE ev.Nombre_Estado = 'Confirmada'
      AND v.Fecha BETWEEN @FechaInicio AND @FechaFin
    GROUP BY p.Id_Producto, p.Nombre, cat.Nombre
);
GO

-- 17.6.4. TF_FacturasPendientes (Facturas no Anuladas con Saldo_Pendiente > 0)
CREATE OR ALTER FUNCTION dbo.TF_FacturasPendientes
(
    @Id_Cliente INT = NULL,
    @Fecha_Corte DATETIME = NULL,
    @Id_Condicion_Pago INT = NULL
)
RETURNS TABLE
AS
RETURN
(
    SELECT 
        f.Id_Factura,
        f.Id_Venta,
        v.Id_Cliente,
        CASE 
            WHEN tc.Nombre = 'Particular' THEN RTRIM(LTRIM(CONCAT(cp.Nombre, ' ', cp.Apellido1, ' ', ISNULL(cp.Apellido2, ''))))
            WHEN tc.Nombre = 'Institucional' THEN ci.Razon_Social
            ELSE 'No identificado'
        END AS Nombre_Cliente,
        cpago.Nombre AS Condicion_Pago,
        f.Fecha_Emision,
        f.Fecha_Vencimiento,
        f.Monto_Total,
        f.Saldo_Pendiente,
        (f.Monto_Total - f.Saldo_Pendiente) AS Total_Pagado,
        ef.Nombre_Estado AS Estado_Factura
    FROM Factura f
    INNER JOIN Estado_Factura ef ON f.Id_Estado_Factura = ef.Id_Estado_Factura
    INNER JOIN Venta v ON f.Id_Venta = v.Id_Venta
    INNER JOIN Condicion_Pago cpago ON v.Id_Condicion_Pago = cpago.Id_Condicion_Pago
    INNER JOIN Cliente c ON v.Id_Cliente = c.Id_Cliente
    INNER JOIN Tipo_Cliente tc ON c.Id_Tipo_Cliente = tc.Id_Tipo_Cliente
    LEFT JOIN Cliente_Particular cp ON c.Id_Cliente = cp.Id_Cliente
    LEFT JOIN Cliente_Institucional ci ON c.Id_Cliente = ci.Id_Cliente
    WHERE ef.Nombre_Estado <> 'Anulada'
      AND f.Saldo_Pendiente > 0.00
      AND (@Id_Cliente IS NULL OR v.Id_Cliente = @Id_Cliente)
      AND (@Fecha_Corte IS NULL OR f.Fecha_Emision <= @Fecha_Corte)
      AND (@Id_Condicion_Pago IS NULL OR v.Id_Condicion_Pago = @Id_Condicion_Pago)
);
GO

-- 17.6.5. TF_CuentasVencidas (Facturas no Anuladas con Saldo > 0 y Vencimiento superado)
CREATE OR ALTER FUNCTION dbo.TF_CuentasVencidas
(
    @FechaCorte DATETIME,
    @Id_Cliente INT = NULL
)
RETURNS TABLE
AS
RETURN
(
    SELECT 
        f.Id_Factura,
        f.Id_Venta,
        v.Id_Cliente,
        CASE 
            WHEN tc.Nombre = 'Particular' THEN RTRIM(LTRIM(CONCAT(cp.Nombre, ' ', cp.Apellido1, ' ', ISNULL(cp.Apellido2, ''))))
            WHEN tc.Nombre = 'Institucional' THEN ci.Razon_Social
            ELSE 'No identificado'
        END AS Nombre_Cliente,
        cpago.Nombre AS Condicion_Pago,
        f.Fecha_Emision,
        f.Fecha_Vencimiento,
        f.Monto_Total,
        f.Saldo_Pendiente,
        (f.Monto_Total - f.Saldo_Pendiente) AS Total_Pagado,
        DATEDIFF(DAY, f.Fecha_Vencimiento, @FechaCorte) AS Dias_Atraso,
        ef.Nombre_Estado AS Estado_Factura
    FROM Factura f
    INNER JOIN Estado_Factura ef ON f.Id_Estado_Factura = ef.Id_Estado_Factura
    INNER JOIN Venta v ON f.Id_Venta = v.Id_Venta
    INNER JOIN Condicion_Pago cpago ON v.Id_Condicion_Pago = cpago.Id_Condicion_Pago
    INNER JOIN Cliente c ON v.Id_Cliente = c.Id_Cliente
    INNER JOIN Tipo_Cliente tc ON c.Id_Tipo_Cliente = tc.Id_Tipo_Cliente
    LEFT JOIN Cliente_Particular cp ON c.Id_Cliente = cp.Id_Cliente
    LEFT JOIN Cliente_Institucional ci ON c.Id_Cliente = ci.Id_Cliente
    WHERE ef.Nombre_Estado <> 'Anulada'
      AND f.Saldo_Pendiente > 0.00
      AND f.Fecha_Vencimiento < @FechaCorte
      AND (@Id_Cliente IS NULL OR v.Id_Cliente = @Id_Cliente)
);
GO

-- 17.6.6. TF_MovimientosInventario
CREATE OR ALTER FUNCTION dbo.TF_MovimientosInventario
(
    @Id_Producto INT = NULL,
    @FechaInicio DATETIME,
    @FechaFin DATETIME,
    @IdTipo INT = NULL
)
RETURNS TABLE
AS
RETURN
(
    SELECT 
        m.Id_Movimiento_Inventario,
        m.Id_Producto,
        p.Nombre AS Producto,
        m.Id_Tipo_Movimiento,
        tm.Nombre AS Tipo_Movimiento,
        tm.Naturaleza,
        m.Cantidad,
        m.Fecha,
        m.Motivo,
        m.Id_Usuario,
        u.Nombre_Usuario AS Responsable
    FROM Movimiento_Inventario m
    INNER JOIN Producto p ON m.Id_Producto = p.Id_Producto
    INNER JOIN Tipo_Movimiento tm ON m.Id_Tipo_Movimiento = tm.Id_Tipo_Movimiento
    INNER JOIN Usuario u ON m.Id_Usuario = u.Id_Usuario
    WHERE m.Fecha BETWEEN @FechaInicio AND @FechaFin
      AND (@Id_Producto IS NULL OR m.Id_Producto = @Id_Producto)
      AND (@IdTipo IS NULL OR m.Id_Tipo_Movimiento = @IdTipo)
);
GO

-- 17.6.7. TF_ActividadUsuario
CREATE OR ALTER FUNCTION dbo.TF_ActividadUsuario
(
    @Id_Usuario INT,
    @FechaInicio DATETIME,
    @FechaFin DATETIME
)
RETURNS TABLE
AS
RETURN
(
    SELECT 
        b.Id_Bitacora,
        b.Id_Usuario,
        u.Nombre_Usuario,
        b.Accion,
        b.Tabla_Afectada,
        b.Id_Registro_Afectado,
        b.Fecha_Hora,
        b.Descripcion
    FROM Bitacora b
    INNER JOIN Usuario u ON b.Id_Usuario = u.Id_Usuario
    WHERE b.Id_Usuario = @Id_Usuario
      AND b.Fecha_Hora BETWEEN @FechaInicio AND @FechaFin
);
GO

-- 17.6.8. TF_ComprasPorProveedor
CREATE OR ALTER FUNCTION dbo.TF_ComprasPorProveedor
(
    @Id_Proveedor INT,
    @Fecha_Inicio DATETIME,
    @Fecha_Fin DATETIME,
    @Id_Estado_Compra INT = NULL
)
RETURNS TABLE
AS
RETURN
(
    SELECT 
        c.Id_Compra,
        c.Id_Proveedor,
        CASE 
            WHEN tp.Nombre = 'Particular' THEN RTRIM(LTRIM(CONCAT(pp.Nombre, ' ', pp.Apellido1, ' ', ISNULL(pp.Apellido2, ''))))
            WHEN tp.Nombre = 'Institucional' THEN pi.Razon_Social
            ELSE 'No identificado'
        END AS Proveedor,
        c.Id_Estado_Compra,
        ec.Nombre_Estado AS Estado_Compra,
        c.Fecha_Compra,
        cp.Id_Producto,
        p.Nombre AS Producto,
        cp.Cantidad,
        cp.Costo_Unitario,
        cp.Subtotal,
        u.Nombre_Usuario AS Responsable
    FROM Compra c
    INNER JOIN Estado_Compra ec ON c.Id_Estado_Compra = ec.Id_Estado_Compra
    INNER JOIN Compra_Producto cp ON c.Id_Compra = cp.Id_Compra
    INNER JOIN Producto p ON cp.Id_Producto = p.Id_Producto
    INNER JOIN Proveedor prov ON c.Id_Proveedor = prov.Id_Proveedor
    INNER JOIN Tipo_Proveedor tp ON prov.Id_Tipo_Proveedor = tp.Id_Tipo_Proveedor
    LEFT JOIN Proveedor_Particular pp ON prov.Id_Proveedor = pp.Id_Proveedor
    LEFT JOIN Proveedor_Institucional pi ON prov.Id_Proveedor = pi.Id_Proveedor
    INNER JOIN Usuario u ON c.Id_Usuario = u.Id_Usuario
    WHERE c.Id_Proveedor = @Id_Proveedor
      AND c.Fecha_Compra BETWEEN @Fecha_Inicio AND @Fecha_Fin
      AND (@Id_Estado_Compra IS NULL OR c.Id_Estado_Compra = @Id_Estado_Compra)
);
GO

PRINT 'Funciones escalares y de tabla (08_CrearFunciones.sql) instaladas exitosamente.';
GO
