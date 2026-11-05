/* =========================================================================
   PROYECTO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR
   MODULO: MÓDULO 6: DATA WAREHOUSE, ETL Y REPORTES DE BUSINESS INTELLIGENCE
   DESCRIPCIÓN: Arquitectura Kimball, SCD Tipo 2 en Clientes, Tablas de Hechos y Orquestación Analítica
   TOTAL PROCEDIMIENTOS: 16
   USO EN EXPOSICIÓN: Pestaña temática lista para ejecución y demostración en SSMS 22.
   ========================================================================= */

USE MUNDO_ESCOLAR;
GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

-- 80. SP_ETL_CargarDimFecha
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

        IF NOT EXISTS (SELECT 1 FROM dw.DimFecha WHERE Sk_Fecha = @SkFecha)
        BEGIN
            INSERT INTO dw.DimFecha (Sk_Fecha, Fecha, Anio, Mes, Nombre_Mes, Trimestre, Dia_Semana, Es_Fin_Semana)
            VALUES (
                @SkFecha,
                @FechaActual,
                YEAR(@FechaActual),
                MONTH(@FechaActual),
                DATENAME(MONTH, @FechaActual),
                DATEPART(QUARTER, @FechaActual),
                DATEPART(WEEKDAY, @FechaActual),
                CASE WHEN DATEPART(WEEKDAY, @FechaActual) IN (1, 7) THEN 1 ELSE 0 END
            );
        END
        SET @FechaActual = DATEADD(DAY, 1, @FechaActual);
    END

    SELECT COUNT(*) AS TotalRegistrosDimFecha FROM dw.DimFecha;
END;
GO

-- 81. SP_ETL_CargarDimCliente (Implementación Rigurosa de SCD Tipo 2)
CREATE OR ALTER PROCEDURE dbo.SP_ETL_CargarDimCliente
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @FechaCorte DATETIME = GETDATE();

    BEGIN TRANSACTION;

    -- 1. Expirar versión previa para clientes cuyos atributos hayan cambiado (SCD Tipo 2 Expire)
    ;WITH FuenteClientes AS (
        SELECT 
            c.Id_Cliente,
            tc.Nombre AS Tipo_Cliente,
            CASE WHEN tc.Nombre = 'Particular' THEN cp.Identificacion ELSE ci.Cedula_Juridica END AS Identificacion,
            CASE WHEN tc.Nombre = 'Particular' THEN RTRIM(LTRIM(CONCAT(cp.Nombre, ' ', cp.Apellido1, ' ', ISNULL(cp.Apellido2, '')))) ELSE ci.Razon_Social END AS Nombre_Completo,
            ISNULL(c.Telefono, 'Sin registrar') AS Telefono,
            ISNULL(c.Direccion, 'Sin asignar') AS Direccion,
            c.Estado AS Estado_Operacional
        FROM dbo.Cliente c
        INNER JOIN dbo.Tipo_Cliente tc ON c.Id_Tipo_Cliente = tc.Id_Tipo_Cliente
        LEFT JOIN dbo.Cliente_Particular cp ON c.Id_Cliente = cp.Id_Cliente
        LEFT JOIN dbo.Cliente_Institucional ci ON c.Id_Cliente = ci.Id_Cliente
    )
    UPDATE dc
    SET 
        dc.Fecha_Fin = @FechaCorte,
        dc.Es_Actual = 0
    FROM dw.DimCliente dc
    INNER JOIN FuenteClientes fc ON dc.Id_Cliente = fc.Id_Cliente
    WHERE dc.Es_Actual = 1
      AND (
          ISNULL(dc.Tipo_Cliente, '') <> ISNULL(fc.Tipo_Cliente, '')
          OR ISNULL(dc.Identificacion, '') <> ISNULL(fc.Identificacion, '')
          OR ISNULL(dc.Nombre_Completo, '') <> ISNULL(fc.Nombre_Completo, '')
          OR ISNULL(dc.Telefono, '') <> ISNULL(fc.Telefono, '')
          OR ISNULL(dc.Direccion, '') <> ISNULL(fc.Direccion, '')
          OR ISNULL(dc.Estado_Operacional, -1) <> ISNULL(fc.Estado_Operacional, -1)
      );

    -- 2. Insertar nueva versión vigente (SCD Tipo 2 Insert)
    ;WITH FuenteClientes AS (
        SELECT 
            c.Id_Cliente,
            tc.Nombre AS Tipo_Cliente,
            CASE WHEN tc.Nombre = 'Particular' THEN cp.Identificacion ELSE ci.Cedula_Juridica END AS Identificacion,
            CASE WHEN tc.Nombre = 'Particular' THEN RTRIM(LTRIM(CONCAT(cp.Nombre, ' ', cp.Apellido1, ' ', ISNULL(cp.Apellido2, '')))) ELSE ci.Razon_Social END AS Nombre_Completo,
            ISNULL(c.Telefono, 'Sin registrar') AS Telefono,
            ISNULL(c.Direccion, 'Sin asignar') AS Direccion,
            c.Estado AS Estado_Operacional
        FROM dbo.Cliente c
        INNER JOIN dbo.Tipo_Cliente tc ON c.Id_Tipo_Cliente = tc.Id_Tipo_Cliente
        LEFT JOIN dbo.Cliente_Particular cp ON c.Id_Cliente = cp.Id_Cliente
        LEFT JOIN dbo.Cliente_Institucional ci ON c.Id_Cliente = ci.Id_Cliente
    )
    INSERT INTO dw.DimCliente (
        Id_Cliente, 
        Tipo_Cliente, 
        Identificacion, 
        Nombre_Completo, 
        Telefono, 
        Direccion, 
        Estado_Operacional, 
        Fecha_Inicio, 
        Fecha_Fin, 
        Es_Actual
    )
    SELECT 
        fc.Id_Cliente,
        fc.Tipo_Cliente,
        fc.Identificacion,
        fc.Nombre_Completo,
        fc.Telefono,
        fc.Direccion,
        fc.Estado_Operacional,
        @FechaCorte,
        NULL,
        1
    FROM FuenteClientes fc
    WHERE NOT EXISTS (
        SELECT 1 
        FROM dw.DimCliente dc 
        WHERE dc.Id_Cliente = fc.Id_Cliente 
          AND dc.Es_Actual = 1
    );

    COMMIT TRANSACTION;

    SELECT 
        COUNT(*) AS TotalDimCliente,
        SUM(CASE WHEN Es_Actual = 1 THEN 1 ELSE 0 END) AS ClientesActivos,
        SUM(CASE WHEN Es_Actual = 0 THEN 1 ELSE 0 END) AS VersionesHistoricas
    FROM dw.DimCliente;
END;
GO

-- 82. SP_ETL_CargarDimProducto
CREATE OR ALTER PROCEDURE dbo.SP_ETL_CargarDimProducto
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dw.DimProducto (Id_Producto, Nombre_Producto, Categoria, Precio_Venta_Actual, Estado)
    SELECT 
        p.Id_Producto,
        p.Nombre,
        c.Nombre,
        p.Precio_Venta,
        p.Estado
    FROM Producto p
    INNER JOIN Categoria c ON p.Id_Categoria = c.Id_Categoria
    WHERE NOT EXISTS (SELECT 1 FROM dw.DimProducto dp WHERE dp.Id_Producto = p.Id_Producto);

    SELECT COUNT(*) AS TotalDimProducto FROM dw.DimProducto;
END;
GO

-- 83. SP_ETL_CargarDimServicio
CREATE OR ALTER PROCEDURE dbo.SP_ETL_CargarDimServicio
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dw.DimServicio (Id_Servicio, Nombre_Servicio, Precio_Base, Estado)
    SELECT 
        s.Id_Servicio,
        s.Nombre,
        s.Precio_Base,
        s.Estado
    FROM Servicio s
    WHERE NOT EXISTS (SELECT 1 FROM dw.DimServicio ds WHERE ds.Id_Servicio = s.Id_Servicio);

    SELECT COUNT(*) AS TotalDimServicio FROM dw.DimServicio;
END;
GO

-- 84. SP_ETL_CargarDimCondicionPago
CREATE OR ALTER PROCEDURE dbo.SP_ETL_CargarDimCondicionPago
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dw.DimCondicionPago (Id_Condicion_Pago, Nombre, Dias_Credito)
    SELECT 
        cp.Id_Condicion_Pago,
        cp.Nombre,
        cp.Dias_Credito
    FROM Condicion_Pago cp
    WHERE NOT EXISTS (SELECT 1 FROM dw.DimCondicionPago dcp WHERE dcp.Id_Condicion_Pago = cp.Id_Condicion_Pago);

    SELECT COUNT(*) AS TotalDimCondicionPago FROM dw.DimCondicionPago;
END;
GO

-- 85. SP_ETL_CargarDimVendedor
CREATE OR ALTER PROCEDURE dbo.SP_ETL_CargarDimVendedor
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dw.DimVendedor (Id_Usuario, Nombre_Usuario, Rol)
    SELECT 
        u.Id_Usuario,
        u.Nombre_Usuario,
        ISNULL(r.Nombre, 'Sin Rol')
    FROM Usuario u
    LEFT JOIN Rol_Usuario ru ON u.Id_Usuario = ru.Id_Usuario
    LEFT JOIN Rol r ON ru.Id_Rol = r.Id_Rol
    WHERE NOT EXISTS (SELECT 1 FROM dw.DimVendedor dv WHERE dv.Id_Usuario = u.Id_Usuario);

    SELECT COUNT(*) AS TotalDimVendedor FROM dw.DimVendedor;
END;
GO

-- 86. SP_ETL_CargarDimMetodoPago
CREATE OR ALTER PROCEDURE dbo.SP_ETL_CargarDimMetodoPago
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dw.DimMetodoPago (Id_Metodo_Pago, Nombre)
    SELECT 
        mp.Id_Metodo_Pago,
        mp.Nombre
    FROM Metodo_Pago mp
    WHERE NOT EXISTS (SELECT 1 FROM dw.DimMetodoPago dmp WHERE dmp.Id_Metodo_Pago = mp.Id_Metodo_Pago);

    SELECT COUNT(*) AS TotalDimMetodoPago FROM dw.DimMetodoPago;
END;
GO

-- 87. SP_ETL_CargarFactVentas (A-01: SCD2 Point-in-Time Lookup con Fallback)
CREATE OR ALTER PROCEDURE dbo.SP_ETL_CargarFactVentas
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dw.FactVentas (Id_Venta, Sk_Fecha, Sk_Cliente, Sk_Vendedor, Sk_Condicion_Pago, Subtotal, Impuesto, Monto_Total)
    SELECT 
        v.Id_Venta,
        YEAR(v.Fecha) * 10000 + MONTH(v.Fecha) * 100 + DAY(v.Fecha) AS Sk_Fecha,
        dc.Sk_Cliente,
        dv.Sk_Vendedor,
        dcp.Sk_Condicion_Pago,
        v.Subtotal,
        v.Impuesto,
        v.Monto_Total
    FROM dbo.Venta v
    INNER JOIN dbo.Estado_Venta ev ON v.Id_Estado_Venta = ev.Id_Estado_Venta
    CROSS APPLY (
        SELECT TOP 1 dc_match.Sk_Cliente
        FROM dw.DimCliente dc_match
        WHERE dc_match.Id_Cliente = v.Id_Cliente
          AND (
              (v.Fecha >= dc_match.Fecha_Inicio AND (v.Fecha < dc_match.Fecha_Fin OR dc_match.Fecha_Fin IS NULL))
              OR dc_match.Es_Actual = 1
          )
        ORDER BY 
            CASE WHEN v.Fecha >= dc_match.Fecha_Inicio AND (v.Fecha < dc_match.Fecha_Fin OR dc_match.Fecha_Fin IS NULL) THEN 0 ELSE 1 END,
            dc_match.Fecha_Inicio DESC
    ) dc
    INNER JOIN dw.DimVendedor dv ON v.Id_Usuario = dv.Id_Usuario
    INNER JOIN dw.DimCondicionPago dcp ON v.Id_Condicion_Pago = dcp.Id_Condicion_Pago
    WHERE ev.Nombre_Estado = 'Confirmada'
      AND NOT EXISTS (SELECT 1 FROM dw.FactVentas fv WHERE fv.Id_Venta = v.Id_Venta);

    SELECT COUNT(*) AS TotalFactVentas FROM dw.FactVentas;
END;
GO

-- 88. SP_ETL_CargarFactVentaProducto
CREATE OR ALTER PROCEDURE dbo.SP_ETL_CargarFactVentaProducto
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dw.FactVentaProducto (
        Id_Venta_Producto, Id_Venta, Sk_Fecha, Sk_Producto, Cantidad, Precio_Unitario, Subtotal,
        Costo_Unitario, Utilidad_Bruta, Margen_Bruto_Pct
    )
    SELECT 
        vp.Id_Venta_Producto,
        v.Id_Venta,
        YEAR(v.Fecha) * 10000 + MONTH(v.Fecha) * 100 + DAY(v.Fecha) AS Sk_Fecha,
        dp.Sk_Producto,
        vp.Cantidad,
        vp.Precio_Unitario,
        vp.Subtotal,
        ISNULL(pp.Precio_Compra, 0.00) AS Costo_Unitario,
        ROUND((vp.Precio_Unitario - ISNULL(pp.Precio_Compra, 0.00)) * vp.Cantidad, 2) AS Utilidad_Bruta,
        CASE 
            WHEN vp.Subtotal > 0 
            THEN ROUND(((vp.Precio_Unitario - ISNULL(pp.Precio_Compra, 0.00)) * vp.Cantidad / vp.Subtotal) * 100, 2)
            ELSE 0.00 
        END AS Margen_Bruto_Pct
    FROM dbo.Venta_Producto vp
    INNER JOIN dbo.Venta v ON vp.Id_Venta = v.Id_Venta
    INNER JOIN dbo.Estado_Venta ev ON v.Id_Estado_Venta = ev.Id_Estado_Venta
    INNER JOIN dw.DimProducto dp ON vp.Id_Producto = dp.Id_Producto
    LEFT JOIN dbo.Producto_Proveedor pp ON vp.Id_Producto = pp.Id_Producto AND pp.EsPrincipal = 1
    WHERE ev.Nombre_Estado = 'Confirmada'
      AND NOT EXISTS (SELECT 1 FROM dw.FactVentaProducto fvp WHERE fvp.Id_Venta_Producto = vp.Id_Venta_Producto);

    -- Actualizar registros existentes si tenian NULL
    UPDATE fvp
    SET 
        fvp.Costo_Unitario = ISNULL(pp.Precio_Compra, 0.00),
        fvp.Utilidad_Bruta = ROUND((fvp.Precio_Unitario - ISNULL(pp.Precio_Compra, 0.00)) * fvp.Cantidad, 2),
        fvp.Margen_Bruto_Pct = CASE 
            WHEN fvp.Subtotal > 0 
            THEN ROUND(((fvp.Precio_Unitario - ISNULL(pp.Precio_Compra, 0.00)) * fvp.Cantidad / fvp.Subtotal) * 100, 2)
            ELSE 0.00 
        END
    FROM dw.FactVentaProducto fvp
    INNER JOIN dw.DimProducto dp ON fvp.Sk_Producto = dp.Sk_Producto
    INNER JOIN dbo.Producto_Proveedor pp ON dp.Id_Producto = pp.Id_Producto AND pp.EsPrincipal = 1
    WHERE fvp.Costo_Unitario IS NULL;

    SELECT COUNT(*) AS TotalFactVentaProducto FROM dw.FactVentaProducto;
END;
GO

-- 89. SP_ETL_CargarFactVentaServicio
CREATE OR ALTER PROCEDURE dbo.SP_ETL_CargarFactVentaServicio
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dw.FactVentaServicio (Id_Venta_Servicio, Id_Venta, Sk_Fecha, Sk_Servicio, Cantidad, Precio_Unitario, Subtotal)
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
    INNER JOIN dw.DimServicio ds ON vs.Id_Servicio = ds.Id_Servicio
    WHERE ev.Nombre_Estado = 'Confirmada'
      AND NOT EXISTS (SELECT 1 FROM dw.FactVentaServicio fvs WHERE fvs.Id_Venta_Servicio = vs.Id_Venta_Servicio);

    SELECT COUNT(*) AS TotalFactVentaServicio FROM dw.FactVentaServicio;
END;
GO

-- 90. SP_ETL_CargarFactPagos
CREATE OR ALTER PROCEDURE dbo.SP_ETL_CargarFactPagos
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dw.FactPagos (Id_Pago, Id_Factura, Sk_Fecha, Sk_Metodo_Pago, Monto_Pagado)
    SELECT 
        p.Id_Pago,
        p.Id_Factura,
        YEAR(p.Fecha_Pago) * 10000 + MONTH(p.Fecha_Pago) * 100 + DAY(p.Fecha_Pago) AS Sk_Fecha,
        dmp.Sk_Metodo_Pago,
        p.Monto_Pagado
    FROM Pago p
    INNER JOIN dw.DimMetodoPago dmp ON p.Id_Metodo_Pago = dmp.Id_Metodo_Pago
    WHERE p.Estado = 1
      AND NOT EXISTS (SELECT 1 FROM dw.FactPagos fp WHERE fp.Id_Pago = p.Id_Pago);

    SELECT COUNT(*) AS TotalFactPagos FROM dw.FactPagos;
END;
GO

-- 91. SP_ETL_ValidarConciliacionCargas
CREATE OR ALTER PROCEDURE dbo.SP_ETL_ValidarConciliacionCargas
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        'Ventas Confirmadas' AS Metrica,
        (SELECT COUNT(*) FROM Venta v INNER JOIN Estado_Venta ev ON v.Id_Estado_Venta = ev.Id_Estado_Venta WHERE ev.Nombre_Estado = 'Confirmada') AS ConteoOperacional,
        (SELECT COUNT(*) FROM dw.FactVentas) AS ConteoDW,
        (SELECT ISNULL(SUM(Monto_Total), 0) FROM Venta v INNER JOIN Estado_Venta ev ON v.Id_Estado_Venta = ev.Id_Estado_Venta WHERE ev.Nombre_Estado = 'Confirmada') AS MontoOperacional,
        (SELECT ISNULL(SUM(Monto_Total), 0) FROM dw.FactVentas) AS MontoDW
    UNION ALL
    SELECT 
        'Pagos Validos',
        (SELECT COUNT(*) FROM Pago WHERE Estado = 1),
        (SELECT COUNT(*) FROM dw.FactPagos),
        (SELECT ISNULL(SUM(Monto_Pagado), 0) FROM Pago WHERE Estado = 1),
        (SELECT ISNULL(SUM(Monto_Pagado), 0) FROM dw.FactPagos);
END;
GO

-- =========================================================================
-- FASE 5: EXPANSIÓN DATA WAREHOUSE & BUSINESS INTELLIGENCE
-- =========================================================================

-- 93. SP_ETL_CargarDimProveedor
CREATE OR ALTER PROCEDURE dbo.SP_ETL_CargarDimProveedor
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dw.DimProveedor (
        Id_Proveedor, Nombre_Empresa, Tipo_Proveedor, Numero_Identificacion,
        Nombre_Contacto, Telefono_Contacto, Correo_Contacto, Direccion,
        Lead_Time_Pactado_Dias, Estado
    )
    SELECT 
        v.Id_Proveedor,
        v.Nombre_O_RazonSocial,
        v.Tipo_Proveedor,
        v.Numero_Identificacion,
        ISNULL(v.Nombre_Contacto, v.Nombre + ' ' + ISNULL(v.Apellido1, '')),
        ISNULL(v.Telefono_Contacto, v.Telefono),
        ISNULL(v.Correo_Contacto, v.Correo),
        v.Direccion,
        CASE 
            WHEN v.Id_Proveedor = 2 THEN 7 -- Distribuidora Escolar del Valle (Pactado 7 días)
            ELSE 3                         -- Papelera Nacional / Carlos Mora (Pactado 3 días)
        END AS Lead_Time_Pactado_Dias,
        CASE WHEN v.Estado = 1 THEN 'Activo' ELSE 'Inactivo' END
    FROM dbo.VW_ProveedoresActivos v
    WHERE NOT EXISTS (SELECT 1 FROM dw.DimProveedor dp WHERE dp.Id_Proveedor = v.Id_Proveedor);

    SELECT COUNT(*) AS TotalDimProveedor FROM dw.DimProveedor;
END;
GO

-- 94. SP_ETL_CargarFactCompras (I-09 / F4: OUTER APPLY para vinculación confiable de recepción)
CREATE OR ALTER PROCEDURE dbo.SP_ETL_CargarFactCompras
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dw.FactCompras (
        Id_Compra, Id_Compra_Producto, Sk_Fecha_Compra, Sk_Fecha_Recepcion,
        Sk_Proveedor, Sk_Producto, Cantidad_Comprada, Costo_Unitario, Monto_Total_Compra,
        Fecha_Orden, Fecha_Prometida, Fecha_Recepcion_Real, Dias_Tardanza_Entrega, Cumplio_A_Tiempo
    )
    SELECT 
        c.Id_Compra,
        cp.Id_Compra_Producto,
        YEAR(c.Fecha_Compra) * 10000 + MONTH(c.Fecha_Compra) * 100 + DAY(c.Fecha_Compra) AS Sk_Fecha_Compra,
        YEAR(ISNULL(mi.Fecha, c.Fecha_Compra)) * 10000 + MONTH(ISNULL(mi.Fecha, c.Fecha_Compra)) * 100 + DAY(ISNULL(mi.Fecha, c.Fecha_Compra)) AS Sk_Fecha_Recepcion,
        dprov.Sk_Proveedor,
        dp.Sk_Producto,
        cp.Cantidad,
        cp.Costo_Unitario,
        cp.Subtotal,
        c.Fecha_Compra AS Fecha_Orden,
        DATEADD(DAY, dprov.Lead_Time_Pactado_Dias, CAST(c.Fecha_Compra AS DATE)) AS Fecha_Prometida,
        ISNULL(mi.Fecha, c.Fecha_Compra) AS Fecha_Recepcion_Real,
        ISNULL(DATEDIFF(DAY, DATEADD(DAY, dprov.Lead_Time_Pactado_Dias, CAST(c.Fecha_Compra AS DATE)), CAST(mi.Fecha AS DATE)), 0) AS Dias_Tardanza_Entrega,
        CASE 
            WHEN mi.Fecha IS NOT NULL AND CAST(mi.Fecha AS DATE) <= DATEADD(DAY, dprov.Lead_Time_Pactado_Dias, CAST(c.Fecha_Compra AS DATE)) THEN 1 
            WHEN mi.Fecha IS NULL THEN 1
            ELSE 0 
        END AS Cumplio_A_Tiempo
    FROM dbo.Compra c
    INNER JOIN dbo.Compra_Producto cp ON c.Id_Compra = cp.Id_Compra
    INNER JOIN dbo.Estado_Compra ec ON c.Id_Estado_Compra = ec.Id_Estado_Compra
    INNER JOIN dw.DimProveedor dprov ON c.Id_Proveedor = dprov.Id_Proveedor
    INNER JOIN dw.DimProducto dp ON cp.Id_Producto = dp.Id_Producto
    OUTER APPLY (
        SELECT TOP 1 Fecha 
        FROM dbo.Movimiento_Inventario mi 
        WHERE mi.Id_Producto = cp.Id_Producto 
          AND mi.Id_Tipo_Movimiento = 1 
          AND mi.Fecha >= c.Fecha_Compra
        ORDER BY mi.Fecha ASC
    ) mi
    WHERE ec.Nombre_Estado = 'Recibida'
      AND NOT EXISTS (SELECT 1 FROM dw.FactCompras fc WHERE fc.Id_Compra_Producto = cp.Id_Compra_Producto);

    SELECT COUNT(*) AS TotalFactCompras FROM dw.FactCompras;
END;
GO

-- 95. SP_ETL_CargarFactInventario (I-09 / F5: Reconstrucción Retroactiva de Stock Histórico)
CREATE OR ALTER PROCEDURE dbo.SP_ETL_CargarFactInventario
    @FechaCorte DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF @FechaCorte IS NULL 
        SET @FechaCorte = CAST(GETDATE() AS DATE);

    DECLARE @SkFecha INT = YEAR(@FechaCorte) * 10000 + MONTH(@FechaCorte) * 100 + DAY(@FechaCorte);

    DELETE FROM dw.FactInventario WHERE Sk_Fecha = @SkFecha;

    INSERT INTO dw.FactInventario (
        Sk_Fecha, Sk_Producto, Stock_Final, Costo_Promedio, Valor_Total_Inventario,
        Punto_Reorden, Alerta_Reorden, Dias_Sin_Movimiento, Indice_Rotacion
    )
    SELECT 
        @SkFecha AS Sk_Fecha,
        dp.Sk_Producto,
        -- Cálculo retroactivo de stock histórico al corte: restando entradas posteriores y sumando salidas posteriores
        CASE 
            WHEN (p.Stock_Actual + ISNULL(movPost.AjustePosterior, 0)) < 0 THEN 0 
            ELSE (p.Stock_Actual + ISNULL(movPost.AjustePosterior, 0)) 
        END AS Stock_Final,
        ISNULL(pp.Precio_Compra, 0.00) AS Costo_Promedio,
        ROUND(
            CASE 
                WHEN (p.Stock_Actual + ISNULL(movPost.AjustePosterior, 0)) < 0 THEN 0 
                ELSE (p.Stock_Actual + ISNULL(movPost.AjustePosterior, 0)) 
            END * ISNULL(pp.Precio_Compra, 0.00), 
            2
        ) AS Valor_Total_Inventario,
        p.Punto_Reorden,
        CASE 
            WHEN (p.Stock_Actual + ISNULL(movPost.AjustePosterior, 0)) <= p.Punto_Reorden THEN 1 
            ELSE 0 
        END AS Alerta_Reorden,
        ISNULL(DATEDIFF(DAY, ultVenta.UltimaFecha, @FechaCorte), 30) AS Dias_Sin_Movimiento,
        CASE 
            WHEN (p.Stock_Actual + ISNULL(movPost.AjustePosterior, 0)) > 0 
            THEN ROUND(CAST(ISNULL(ventasTot.CantidadVendida, 0) AS DECIMAL(10,2)) / CAST((p.Stock_Actual + ISNULL(movPost.AjustePosterior, 0)) AS DECIMAL(10,2)), 2)
            ELSE CAST(ISNULL(ventasTot.CantidadVendida, 0) AS DECIMAL(10,2))
        END AS Indice_Rotacion
    FROM dbo.Producto p
    INNER JOIN dw.DimProducto dp ON p.Id_Producto = dp.Id_Producto
    LEFT JOIN dbo.Producto_Proveedor pp ON p.Id_Producto = pp.Id_Producto AND pp.EsPrincipal = 1
    OUTER APPLY (
        -- Movimientos netos ocurridos estrictamente DESPUÉS de la fecha de corte
        SELECT 
            SUM(
                CASE 
                    WHEN mi.Id_Tipo_Movimiento IN (1, 3, 5) THEN -mi.Cantidad -- Entradas posteriores se restan
                    WHEN mi.Id_Tipo_Movimiento IN (2, 4, 6) THEN mi.Cantidad  -- Salidas posteriores se reponen
                    ELSE 0 
                END
            ) AS AjustePosterior
        FROM dbo.Movimiento_Inventario mi
        WHERE mi.Id_Producto = p.Id_Producto
          AND mi.Fecha > DATEADD(SECOND, 86399, CAST(@FechaCorte AS DATETIME))
    ) movPost
    OUTER APPLY (
        SELECT MAX(v.Fecha) AS UltimaFecha
        FROM dbo.Venta v
        INNER JOIN dbo.Venta_Producto vp ON v.Id_Venta = vp.Id_Venta
        WHERE vp.Id_Producto = p.Id_Producto
          AND CAST(v.Fecha AS DATE) <= @FechaCorte
    ) ultVenta
    OUTER APPLY (
        SELECT SUM(vp.Cantidad) AS CantidadVendida
        FROM dbo.Venta_Producto vp
        INNER JOIN dbo.Venta v ON v.Id_Venta = vp.Id_Venta
        WHERE vp.Id_Producto = p.Id_Producto
          AND CAST(v.Fecha AS DATE) <= @FechaCorte
    ) ventasTot
    WHERE p.Estado = 1;

    SELECT COUNT(*) AS TotalSnapshotsInventario FROM dw.FactInventario WHERE Sk_Fecha = @SkFecha;
END;
GO

-- =========================================================================
-- 96. SP_ETL_OrquestarCargaCompleta (I-02 / I-06 / A-03)
-- Orquestador maestro integral del Data Warehouse con registro en Bitacora_ETL
-- =========================================================================
CREATE OR ALTER PROCEDURE dbo.SP_ETL_OrquestarCargaCompleta
    @AnioInicio INT = 2024,
    @AnioFin INT = 2030,
    @FechaCorteInventario DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Inicio DATETIME = GETDATE();
    DECLARE @IdBitacora INT;
    DECLARE @TotalFilas INT = 0;

    -- Registrar inicio de la orquestación en Bitácora ETL
    INSERT INTO dw.Bitacora_ETL (Proceso, Fecha_Inicio, Estado)
    VALUES ('SP_ETL_OrquestarCargaCompleta', @Inicio, 'EN_PROCESO');
    SET @IdBitacora = SCOPE_IDENTITY();

    BEGIN TRY
        -- FASE 1: Carga de Dimensiones Independientes y Temporales
        EXEC dbo.SP_ETL_CargarDimFecha @AnioInicio = @AnioInicio, @AnioFin = @AnioFin;
        EXEC dbo.SP_ETL_CargarDimCliente;
        EXEC dbo.SP_ETL_CargarDimProducto;
        EXEC dbo.SP_ETL_CargarDimServicio;
        EXEC dbo.SP_ETL_CargarDimCondicionPago;
        EXEC dbo.SP_ETL_CargarDimVendedor;
        EXEC dbo.SP_ETL_CargarDimMetodoPago;
        EXEC dbo.SP_ETL_CargarDimProveedor;

        -- FASE 2: Carga de Hechos Transaccionales y Analíticos
        EXEC dbo.SP_ETL_CargarFactVentas;
        EXEC dbo.SP_ETL_CargarFactVentaProducto;
        EXEC dbo.SP_ETL_CargarFactVentaServicio;
        EXEC dbo.SP_ETL_CargarFactPagos;
        EXEC dbo.SP_ETL_CargarFactCompras;
        EXEC dbo.SP_ETL_CargarFactInventario @FechaCorte = @FechaCorteInventario;

        -- Conteo consolidado de registros en tablas de hechos
        SELECT @TotalFilas = 
            (SELECT COUNT(*) FROM dw.FactVentas) +
            (SELECT COUNT(*) FROM dw.FactVentaProducto) +
            (SELECT COUNT(*) FROM dw.FactVentaServicio) +
            (SELECT COUNT(*) FROM dw.FactPagos) +
            (SELECT COUNT(*) FROM dw.FactCompras) +
            (SELECT COUNT(*) FROM dw.FactInventario);

        -- Registrar finalización exitosa
        UPDATE dw.Bitacora_ETL
        SET Fecha_Fin = GETDATE(),
            Estado = 'EXITOSO',
            Filas_Procesadas = @TotalFilas,
            Duracion_Segundos = DATEDIFF(SECOND, @Inicio, GETDATE())
        WHERE Id_Bitacora_ETL = @IdBitacora;

        -- Retornar el registro de bitácora resultante
        SELECT 
            Id_Bitacora_ETL,
            Proceso,
            Fecha_Inicio,
            Fecha_Fin,
            Estado,
            Filas_Procesadas,
            Duracion_Segundos,
            'Proceso ETL orquestado completado con éxito.' AS Mensaje
        FROM dw.Bitacora_ETL
        WHERE Id_Bitacora_ETL = @IdBitacora;

    END TRY
    BEGIN CATCH
        DECLARE @ErrorMsg VARCHAR(500) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();

        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        -- Registro autónomo del fallo fuera de la transacción para auditoría persistente
        UPDATE dw.Bitacora_ETL
        SET Fecha_Fin = GETDATE(),
            Estado = 'FALLIDO',
            Mensaje_Error = @ErrorMsg,
            Duracion_Segundos = DATEDIFF(SECOND, @Inicio, GETDATE())
        WHERE Id_Bitacora_ETL = @IdBitacora;

        RAISERROR(@ErrorMsg, @ErrorSeverity, @ErrorState);
        RETURN;
    END CATCH
END;
GO
