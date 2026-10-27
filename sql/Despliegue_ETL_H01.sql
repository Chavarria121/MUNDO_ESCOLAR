USE MUNDO_ESCOLAR;
GO

CREATE OR ALTER PROCEDURE dbo.SP_ETL_CargarDimFecha
    @AnioInicio INT = 2024,
    @AnioFin INT = 2030
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @FechaActual DATE = DATEFROMPARTS(@AnioInicio, 1, 1);
    DECLARE @FechaLimite DATE = DATEFROMPARTS(@AnioFin, 12, 31);

    WHILE @FechaActual <= @FechaLimite
    BEGIN
        DECLARE @SkFecha INT = YEAR(@FechaActual) * 10000 + MONTH(@FechaActual) * 100 + DAY(@FechaActual);

        IF NOT EXISTS (SELECT 1 FROM DW_MundoEscolar.dbo.DimFecha WHERE Sk_Fecha = @SkFecha)
        BEGIN
            INSERT INTO DW_MundoEscolar.dbo.DimFecha (Sk_Fecha, Fecha, Anio, Mes, Nombre_Mes, Trimestre, Dia_Semana, Nombre_Dia, Es_Fin_Semana)
            VALUES (
                @SkFecha,
                @FechaActual,
                YEAR(@FechaActual),
                MONTH(@FechaActual),
                DATENAME(MONTH, @FechaActual),
                DATEPART(QUARTER, @FechaActual),
                DATEPART(WEEKDAY, @FechaActual),
                DATENAME(WEEKDAY, @FechaActual),
                CASE WHEN DATEPART(WEEKDAY, @FechaActual) IN (1, 7) THEN 1 ELSE 0 END
            );
        END
        SET @FechaActual = DATEADD(DAY, 1, @FechaActual);
    END

    SELECT COUNT(*) AS TotalRegistrosDimFecha FROM DW_MundoEscolar.dbo.DimFecha;
END;
GO

CREATE OR ALTER PROCEDURE dbo.SP_ETL_CargarDimCliente
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO DW_MundoEscolar.dbo.DimCliente (Id_Cliente, Tipo_Cliente, Identificacion, Nombre_Completo, Telefono, Direccion, Estado_Operacional, Fecha_Inicio, Es_Actual)
    SELECT
        c.Id_Cliente,
        tc.Nombre,
        CASE WHEN tc.Nombre = 'Particular' THEN cp.Identificacion ELSE ci.Cedula_Juridica END,
        CASE WHEN tc.Nombre = 'Particular' THEN RTRIM(LTRIM(CONCAT(cp.Nombre, ' ', cp.Apellido1, ' ', ISNULL(cp.Apellido2, '')))) ELSE ci.Razon_Social END,
        c.Telefono,
        c.Direccion,
        c.Estado,
        GETDATE(),
        1
    FROM Cliente c
    INNER JOIN Tipo_Cliente tc ON c.Id_Tipo_Cliente = tc.Id_Tipo_Cliente
    LEFT JOIN Cliente_Particular cp ON c.Id_Cliente = cp.Id_Cliente
    LEFT JOIN Cliente_Institucional ci ON c.Id_Cliente = ci.Id_Cliente
    WHERE NOT EXISTS (SELECT 1 FROM DW_MundoEscolar.dbo.DimCliente dc WHERE dc.Id_Cliente = c.Id_Cliente AND dc.Es_Actual = 1);

    SELECT COUNT(*) AS TotalDimCliente FROM DW_MundoEscolar.dbo.DimCliente;
END;
GO

CREATE OR ALTER PROCEDURE dbo.SP_ETL_CargarDimProducto
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO DW_MundoEscolar.dbo.DimProducto (Id_Producto, Nombre_Producto, Categoria, Precio_Venta_Actual, Estado)
    SELECT
        p.Id_Producto,
        p.Nombre,
        c.Nombre,
        p.Precio_Venta,
        p.Estado
    FROM Producto p
    INNER JOIN Categoria c ON p.Id_Categoria = c.Id_Categoria
    WHERE NOT EXISTS (SELECT 1 FROM DW_MundoEscolar.dbo.DimProducto dp WHERE dp.Id_Producto = p.Id_Producto);

    SELECT COUNT(*) AS TotalDimProducto FROM DW_MundoEscolar.dbo.DimProducto;
END;
GO

CREATE OR ALTER PROCEDURE dbo.SP_ETL_CargarDimServicio
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO DW_MundoEscolar.dbo.DimServicio (Id_Servicio, Nombre_Servicio, Precio_Base, Estado)
    SELECT
        s.Id_Servicio,
        s.Nombre,
        s.Precio_Base,
        s.Estado
    FROM Servicio s
    WHERE NOT EXISTS (SELECT 1 FROM DW_MundoEscolar.dbo.DimServicio ds WHERE ds.Id_Servicio = s.Id_Servicio);

    SELECT COUNT(*) AS TotalDimServicio FROM DW_MundoEscolar.dbo.DimServicio;
END;
GO

CREATE OR ALTER PROCEDURE dbo.SP_ETL_CargarDimCondicionPago
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO DW_MundoEscolar.dbo.DimCondicionPago (Id_Condicion_Pago, Nombre, Dias_Credito)
    SELECT
        cp.Id_Condicion_Pago,
        cp.Nombre,
        cp.Dias_Credito
    FROM Condicion_Pago cp
    WHERE NOT EXISTS (SELECT 1 FROM DW_MundoEscolar.dbo.DimCondicionPago dcp WHERE dcp.Id_Condicion_Pago = cp.Id_Condicion_Pago);

    SELECT COUNT(*) AS TotalDimCondicionPago FROM DW_MundoEscolar.dbo.DimCondicionPago;
END;
GO

CREATE OR ALTER PROCEDURE dbo.SP_ETL_CargarDimVendedor
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO DW_MundoEscolar.dbo.DimVendedor (Id_Usuario, Nombre_Usuario, Rol)
    SELECT
        u.Id_Usuario,
        u.Nombre_Usuario,
        ISNULL(r.Nombre, 'Sin Rol')
    FROM Usuario u
    LEFT JOIN Rol_Usuario ru ON u.Id_Usuario = ru.Id_Usuario
    LEFT JOIN Rol r ON ru.Id_Rol = r.Id_Rol
    WHERE NOT EXISTS (SELECT 1 FROM DW_MundoEscolar.dbo.DimVendedor dv WHERE dv.Id_Usuario = u.Id_Usuario);

    SELECT COUNT(*) AS TotalDimVendedor FROM DW_MundoEscolar.dbo.DimVendedor;
END;
GO

CREATE OR ALTER PROCEDURE dbo.SP_ETL_CargarDimMetodoPago
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO DW_MundoEscolar.dbo.DimMetodoPago (Id_Metodo_Pago, Nombre)
    SELECT
        mp.Id_Metodo_Pago,
        mp.Nombre
    FROM Metodo_Pago mp
    WHERE NOT EXISTS (SELECT 1 FROM DW_MundoEscolar.dbo.DimMetodoPago dmp WHERE dmp.Id_Metodo_Pago = mp.Id_Metodo_Pago);

    SELECT COUNT(*) AS TotalDimMetodoPago FROM DW_MundoEscolar.dbo.DimMetodoPago;
END;
GO

CREATE OR ALTER PROCEDURE dbo.SP_ETL_CargarFactVentas
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO DW_MundoEscolar.dbo.FactVenta (Id_Venta, Sk_Fecha, Sk_Cliente, Sk_Vendedor, Sk_Condicion_Pago, Subtotal, Impuesto, Monto_Total)
    SELECT
        v.Id_Venta,
        YEAR(v.Fecha) * 10000 + MONTH(v.Fecha) * 100 + DAY(v.Fecha) AS Sk_Fecha,
        dc.Sk_Cliente,
        dv.Sk_Vendedor,
        dcp.Sk_Condicion_Pago,
        v.Subtotal,
        v.Impuesto,
        v.Monto_Total
    FROM Venta v
    INNER JOIN Estado_Venta ev ON v.Id_Estado_Venta = ev.Id_Estado_Venta
    INNER JOIN DW_MundoEscolar.dbo.DimCliente dc ON v.Id_Cliente = dc.Id_Cliente AND dc.Es_Actual = 1
    INNER JOIN DW_MundoEscolar.dbo.DimVendedor dv ON v.Id_Usuario = dv.Id_Usuario
    INNER JOIN DW_MundoEscolar.dbo.DimCondicionPago dcp ON v.Id_Condicion_Pago = dcp.Id_Condicion_Pago
    WHERE ev.Nombre_Estado = 'Confirmada'
      AND NOT EXISTS (SELECT 1 FROM DW_MundoEscolar.dbo.FactVenta fv WHERE fv.Id_Venta = v.Id_Venta);

    SELECT COUNT(*) AS TotalFactVentas FROM DW_MundoEscolar.dbo.FactVenta;
END;
GO

CREATE OR ALTER PROCEDURE dbo.SP_ETL_CargarFactVentaProducto
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO DW_MundoEscolar.dbo.FactVentaProducto (Id_Venta_Producto, Id_Venta, Sk_Fecha, Sk_Producto, Cantidad, Precio_Unitario, Subtotal)
    SELECT
        vp.Id_Venta_Producto,
        v.Id_Venta,
        YEAR(v.Fecha) * 10000 + MONTH(v.Fecha) * 100 + DAY(v.Fecha) AS Sk_Fecha,
        dp.Sk_Producto,
        vp.Cantidad,
        vp.Precio_Unitario,
        vp.Subtotal
    FROM Venta_Producto vp
    INNER JOIN Venta v ON vp.Id_Venta = v.Id_Venta
    INNER JOIN Estado_Venta ev ON v.Id_Estado_Venta = ev.Id_Estado_Venta
    INNER JOIN DW_MundoEscolar.dbo.DimProducto dp ON vp.Id_Producto = dp.Id_Producto
    WHERE ev.Nombre_Estado = 'Confirmada'
      AND NOT EXISTS (SELECT 1 FROM DW_MundoEscolar.dbo.FactVentaProducto fvp WHERE fvp.Id_Venta_Producto = vp.Id_Venta_Producto);

    SELECT COUNT(*) AS TotalFactVentaProducto FROM DW_MundoEscolar.dbo.FactVentaProducto;
END;
GO

CREATE OR ALTER PROCEDURE dbo.SP_ETL_CargarFactVentaServicio
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO DW_MundoEscolar.dbo.FactVentaServicio (Id_Venta_Servicio, Id_Venta, Sk_Fecha, Sk_Servicio, Cantidad, Precio_Unitario, Subtotal)
    SELECT
        vs.Id_Venta_Servicio,
        v.Id_Venta,
        YEAR(v.Fecha) * 10000 + MONTH(v.Fecha) * 100 + DAY(v.Fecha) AS Sk_Fecha,
        ds.Sk_Servicio,
        vs.Cantidad,
        vs.Precio_Unitario,
        vs.Subtotal
    FROM Venta_Servicio vs
    INNER JOIN Venta v ON vs.Id_Venta = v.Id_Venta
    INNER JOIN Estado_Venta ev ON v.Id_Estado_Venta = ev.Id_Estado_Venta
    INNER JOIN DW_MundoEscolar.dbo.DimServicio ds ON vs.Id_Servicio = ds.Id_Servicio
    WHERE ev.Nombre_Estado = 'Confirmada'
      AND NOT EXISTS (SELECT 1 FROM DW_MundoEscolar.dbo.FactVentaServicio fvs WHERE fvs.Id_Venta_Servicio = vs.Id_Venta_Servicio);

    SELECT COUNT(*) AS TotalFactVentaServicio FROM DW_MundoEscolar.dbo.FactVentaServicio;
END;
GO

CREATE OR ALTER PROCEDURE dbo.SP_ETL_CargarFactPagos
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO DW_MundoEscolar.dbo.FactPagos (Id_Pago, Id_Factura, Sk_Fecha, Sk_Metodo_Pago, Monto_Pagado)
    SELECT
        p.Id_Pago,
        p.Id_Factura,
        YEAR(p.Fecha_Pago) * 10000 + MONTH(p.Fecha_Pago) * 100 + DAY(p.Fecha_Pago) AS Sk_Fecha,
        dmp.Sk_Metodo_Pago,
        p.Monto_Pagado
    FROM Pago p
    INNER JOIN DW_MundoEscolar.dbo.DimMetodoPago dmp ON p.Id_Metodo_Pago = dmp.Id_Metodo_Pago
    WHERE p.Estado = 1
      AND NOT EXISTS (SELECT 1 FROM DW_MundoEscolar.dbo.FactPagos fp WHERE fp.Id_Pago = p.Id_Pago);

    SELECT COUNT(*) AS TotalFactPagos FROM DW_MundoEscolar.dbo.FactPagos;
END;
GO

CREATE OR ALTER PROCEDURE dbo.SP_ETL_ValidarConciliacionCargas
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        'Ventas Confirmadas' AS Metrica,
        (SELECT COUNT(*) FROM Venta v INNER JOIN Estado_Venta ev ON v.Id_Estado_Venta = ev.Id_Estado_Venta WHERE ev.Nombre_Estado = 'Confirmada') AS ConteoOperacional,
        (SELECT COUNT(*) FROM DW_MundoEscolar.dbo.FactVenta) AS ConteoDW,
        (SELECT ISNULL(SUM(Monto_Total), 0) FROM Venta v INNER JOIN Estado_Venta ev ON v.Id_Estado_Venta = ev.Id_Estado_Venta WHERE ev.Nombre_Estado = 'Confirmada') AS MontoOperacional,
        (SELECT ISNULL(SUM(Monto_Total), 0) FROM DW_MundoEscolar.dbo.FactVenta) AS MontoDW
    UNION ALL
    SELECT
        'Pagos Validos',
        (SELECT COUNT(*) FROM Pago WHERE Estado = 1),
        (SELECT COUNT(*) FROM DW_MundoEscolar.dbo.FactPagos),
        (SELECT ISNULL(SUM(Monto_Pagado), 0) FROM Pago WHERE Estado = 1),
        (SELECT ISNULL(SUM(Monto_Pagado), 0) FROM DW_MundoEscolar.dbo.FactPagos);
END;
GO
