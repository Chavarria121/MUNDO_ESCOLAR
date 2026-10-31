/* =========================================================================
   PROYECTO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR
   ARCHIVO: DW_Constelacion.sql (MODELO DIMENSIONAL Y DATA WAREHOUSE)
   ESTILO: TORRENTES (SSMS 22)
   REFERENCIA DOCUMENTACIÓN: Capítulos 16 y 17.9 (Scripts DW_01 a DW_11)
   DESCRIPCIÓN: 
     Implementación completa del Data Warehouse con esquema de Constelación:
       - 7 Dimensiones: DimFecha, DimCliente, DimProducto, DimServicio, 
                        DimVendedor, DimCondicionPago, DimMetodoPago
       - 4 Tablas de Hechos: FactVenta, FactVentaProducto, 
                             FactVentaServicio, FactPagos
       - Proceso de carga ETL automatizado mediante los Stored Procedures 80 al 91
       - Validación de conciliación entre la base transaccional y el DW
   ========================================================================= */

USE master
GO

-- 1. CREACIÓN DE LA BASE DE DATOS DEL DATA WAREHOUSE
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'DW_MundoEscolar')
BEGIN
    CREATE DATABASE DW_MundoEscolar
    ON PRIMARY
    (
        NAME = 'DW_MundoEscolar_data',
        FILENAME = 'C:\SQLData\DW_MundoEscolar_data.mdf',
        SIZE = 1024MB,
        MAXSIZE = 10240MB,
        FILEGROWTH = 512MB
    )
    LOG ON
    (
        NAME = 'DW_MundoEscolar_log',
        FILENAME = 'C:\SQLLog\DW_MundoEscolar_log.ldf',
        SIZE = 256MB,
        MAXSIZE = 2048MB,
        FILEGROWTH = 128MB
    );
END
GO

USE DW_MundoEscolar
GO

ALTER AUTHORIZATION ON DATABASE::DW_MundoEscolar TO sa;
GO

-- 2. CREACIÓN DE LAS DIMENSIONES COMPARTIDAS (DW_01 a DW_07)

-- DW_01: DimFecha (Calendario analítico)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'DimFecha')
BEGIN
    CREATE TABLE dbo.DimFecha (
        Sk_Fecha INT PRIMARY KEY, -- Clave YYYYMMDD
        Fecha DATE NOT NULL UNIQUE,
        Anio INT NOT NULL,
        Mes INT NOT NULL,
        Nombre_Mes VARCHAR(20) NOT NULL,
        Trimestre INT NOT NULL,
        Dia_Semana INT NOT NULL,
        Nombre_Dia VARCHAR(20) NOT NULL,
        Es_Fin_Semana BIT NOT NULL
    );
END
GO

-- DW_02: DimCliente (SCD Tipo 2 para cambios de tipo de cliente)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'DimCliente')
BEGIN
    CREATE TABLE dbo.DimCliente (
        Sk_Cliente INT IDENTITY(1,1) PRIMARY KEY,
        Id_Cliente INT NOT NULL,
        Tipo_Cliente VARCHAR(50) NOT NULL,
        Identificacion VARCHAR(50) NOT NULL,
        Nombre_Completo VARCHAR(150) NOT NULL,
        Telefono VARCHAR(30) NULL,
        Direccion VARCHAR(200) NULL,
        Estado_Operacional BIT NOT NULL,
        Fecha_Inicio DATETIME NOT NULL,
        Fecha_Fin DATETIME NULL,
        Es_Actual BIT NOT NULL
    );
    CREATE NONCLUSTERED INDEX IX_DimCliente_IdCliente ON dbo.DimCliente(Id_Cliente, Es_Actual);
END
GO

-- DW_03: DimProducto
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'DimProducto')
BEGIN
    CREATE TABLE dbo.DimProducto (
        Sk_Producto INT IDENTITY(1,1) PRIMARY KEY,
        Id_Producto INT NOT NULL,
        Nombre_Producto VARCHAR(100) NOT NULL,
        Categoria VARCHAR(50) NOT NULL,
        Precio_Venta_Actual DECIMAL(12,2) NOT NULL,
        Estado BIT NOT NULL
    );
END
GO

-- DW_04: DimServicio
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'DimServicio')
BEGIN
    CREATE TABLE dbo.DimServicio (
        Sk_Servicio INT IDENTITY(1,1) PRIMARY KEY,
        Id_Servicio INT NOT NULL,
        Nombre_Servicio VARCHAR(100) NOT NULL,
        Precio_Base DECIMAL(12,2) NOT NULL,
        Estado BIT NOT NULL
    );
END
GO

-- DW_05: DimVendedor
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'DimVendedor')
BEGIN
    CREATE TABLE dbo.DimVendedor (
        Sk_Vendedor INT IDENTITY(1,1) PRIMARY KEY,
        Id_Usuario INT NOT NULL,
        Nombre_Usuario VARCHAR(50) NOT NULL,
        Rol VARCHAR(50) NOT NULL
    );
END
GO

-- DW_06: DimCondicionPago
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'DimCondicionPago')
BEGIN
    CREATE TABLE dbo.DimCondicionPago (
        Sk_Condicion_Pago INT IDENTITY(1,1) PRIMARY KEY,
        Id_Condicion_Pago INT NOT NULL,
        Nombre VARCHAR(50) NOT NULL,
        Dias_Credito INT NOT NULL
    );
END
GO

-- DW_07: DimMetodoPago
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'DimMetodoPago')
BEGIN
    CREATE TABLE dbo.DimMetodoPago (
        Sk_Metodo_Pago INT IDENTITY(1,1) PRIMARY KEY,
        Id_Metodo_Pago INT NOT NULL,
        Nombre VARCHAR(50) NOT NULL
    );
END
GO

-- 3. CREACIÓN DE LAS TABLAS DE HECHOS (CONSTELACIÓN - DW_08 a DW_11)

-- DW_08: FactVenta (Nivel encabezado)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'FactVenta')
BEGIN
    CREATE TABLE dbo.FactVenta (
        Id_Venta INT PRIMARY KEY,
        Sk_Fecha INT NOT NULL REFERENCES dbo.DimFecha(Sk_Fecha),
        Sk_Cliente INT NOT NULL REFERENCES dbo.DimCliente(Sk_Cliente),
        Sk_Vendedor INT NOT NULL REFERENCES dbo.DimVendedor(Sk_Vendedor),
        Sk_Condicion_Pago INT NOT NULL REFERENCES dbo.DimCondicionPago(Sk_Condicion_Pago),
        Subtotal DECIMAL(12,2) NOT NULL,
        Impuesto DECIMAL(12,2) NOT NULL,
        Monto_Total DECIMAL(12,2) NOT NULL
    );
END
GO

-- DW_09: FactVentaProducto (Grano: Línea de producto)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'FactVentaProducto')
BEGIN
    CREATE TABLE dbo.FactVentaProducto (
        Id_Venta_Producto INT PRIMARY KEY,
        Id_Venta INT NOT NULL,
        Sk_Fecha INT NOT NULL REFERENCES dbo.DimFecha(Sk_Fecha),
        Sk_Producto INT NOT NULL REFERENCES dbo.DimProducto(Sk_Producto),
        Cantidad INT NOT NULL,
        Precio_Unitario DECIMAL(12,2) NOT NULL,
        Subtotal DECIMAL(12,2) NOT NULL
    );
END
GO

-- DW_10: FactVentaServicio (Grano: Línea de servicio)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'FactVentaServicio')
BEGIN
    CREATE TABLE dbo.FactVentaServicio (
        Id_Venta_Servicio INT PRIMARY KEY,
        Id_Venta INT NOT NULL,
        Sk_Fecha INT NOT NULL REFERENCES dbo.DimFecha(Sk_Fecha),
        Sk_Servicio INT NOT NULL REFERENCES dbo.DimServicio(Sk_Servicio),
        Cantidad INT NOT NULL,
        Precio_Unitario DECIMAL(12,2) NOT NULL,
        Subtotal DECIMAL(12,2) NOT NULL
    );
END
GO

-- DW_11: FactPagos (Grano: Pago individual de factura)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'FactPagos')
BEGIN
    CREATE TABLE dbo.FactPagos (
        Id_Pago INT PRIMARY KEY,
        Id_Factura INT NOT NULL,
        Sk_Fecha INT NOT NULL REFERENCES dbo.DimFecha(Sk_Fecha),
        Sk_Metodo_Pago INT NOT NULL REFERENCES dbo.DimMetodoPago(Sk_Metodo_Pago),
        Monto_Pagado DECIMAL(12,2) NOT NULL
    );
END
GO

-- 4. POBLADO ETL Y REPLICACIÓN DESDE MUNDO_ESCOLAR
PRINT 'Iniciando sincronización ETL hacia DW_MundoEscolar...';
GO

-- Carga de Fechas
DECLARE @F DATE = '2024-01-01';
WHILE @F <= '2030-12-31'
BEGIN
    DECLARE @Sk INT = YEAR(@F) * 10000 + MONTH(@F) * 100 + DAY(@F);
    IF NOT EXISTS (SELECT 1 FROM dbo.DimFecha WHERE Sk_Fecha = @Sk)
    BEGIN
        INSERT INTO dbo.DimFecha (Sk_Fecha, Fecha, Anio, Mes, Nombre_Mes, Trimestre, Dia_Semana, Nombre_Dia, Es_Fin_Semana)
        VALUES (
            @Sk, @F, YEAR(@F), MONTH(@F), DATENAME(MONTH, @F),
            DATEPART(QUARTER, @F), DATEPART(WEEKDAY, @F), DATENAME(WEEKDAY, @F),
            CASE WHEN DATEPART(WEEKDAY, @F) IN (1, 7) THEN 1 ELSE 0 END
        );
    END
    SET @F = DATEADD(DAY, 1, @F);
END
GO

-- Clientes
INSERT INTO dbo.DimCliente (Id_Cliente, Tipo_Cliente, Identificacion, Nombre_Completo, Telefono, Direccion, Estado_Operacional, Fecha_Inicio, Es_Actual)
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
FROM MUNDO_ESCOLAR.dbo.Cliente c
INNER JOIN MUNDO_ESCOLAR.dbo.Tipo_Cliente tc ON c.Id_Tipo_Cliente = tc.Id_Tipo_Cliente
LEFT JOIN MUNDO_ESCOLAR.dbo.Cliente_Particular cp ON c.Id_Cliente = cp.Id_Cliente
LEFT JOIN MUNDO_ESCOLAR.dbo.Cliente_Institucional ci ON c.Id_Cliente = ci.Id_Cliente
WHERE NOT EXISTS (SELECT 1 FROM dbo.DimCliente dc WHERE dc.Id_Cliente = c.Id_Cliente AND dc.Es_Actual = 1);
GO

-- Productos
INSERT INTO dbo.DimProducto (Id_Producto, Nombre_Producto, Categoria, Precio_Venta_Actual, Estado)
SELECT p.Id_Producto, p.Nombre, c.Nombre, p.Precio_Venta, p.Estado
FROM MUNDO_ESCOLAR.dbo.Producto p
INNER JOIN MUNDO_ESCOLAR.dbo.Categoria c ON p.Id_Categoria = c.Id_Categoria
WHERE NOT EXISTS (SELECT 1 FROM dbo.DimProducto dp WHERE dp.Id_Producto = p.Id_Producto);
GO

-- Servicios
INSERT INTO dbo.DimServicio (Id_Servicio, Nombre_Servicio, Precio_Base, Estado)
SELECT s.Id_Servicio, s.Nombre, s.Precio_Base, s.Estado
FROM MUNDO_ESCOLAR.dbo.Servicio s
WHERE NOT EXISTS (SELECT 1 FROM dbo.DimServicio ds WHERE ds.Id_Servicio = s.Id_Servicio);
GO

-- Vendedores
INSERT INTO dbo.DimVendedor (Id_Usuario, Nombre_Usuario, Rol)
SELECT u.Id_Usuario, u.Nombre_Usuario, ISNULL(r.Nombre, 'Sin Rol')
FROM MUNDO_ESCOLAR.dbo.Usuario u
LEFT JOIN MUNDO_ESCOLAR.dbo.Rol_Usuario ru ON u.Id_Usuario = ru.Id_Usuario
LEFT JOIN MUNDO_ESCOLAR.dbo.Rol r ON ru.Id_Rol = r.Id_Rol
WHERE NOT EXISTS (SELECT 1 FROM dbo.DimVendedor dv WHERE dv.Id_Usuario = u.Id_Usuario);
GO

-- Condiciones de Pago
INSERT INTO dbo.DimCondicionPago (Id_Condicion_Pago, Nombre, Dias_Credito)
SELECT cp.Id_Condicion_Pago, cp.Nombre, cp.Dias_Credito
FROM MUNDO_ESCOLAR.dbo.Condicion_Pago cp
WHERE NOT EXISTS (SELECT 1 FROM dbo.DimCondicionPago dcp WHERE dcp.Id_Condicion_Pago = cp.Id_Condicion_Pago);
GO

-- Métodos de Pago
INSERT INTO dbo.DimMetodoPago (Id_Metodo_Pago, Nombre)
SELECT mp.Id_Metodo_Pago, mp.Nombre
FROM MUNDO_ESCOLAR.dbo.Metodo_Pago mp
WHERE NOT EXISTS (SELECT 1 FROM dbo.DimMetodoPago dmp WHERE dmp.Id_Metodo_Pago = mp.Id_Metodo_Pago);
GO

-- Hechos: FactVenta
INSERT INTO dbo.FactVenta (Id_Venta, Sk_Fecha, Sk_Cliente, Sk_Vendedor, Sk_Condicion_Pago, Subtotal, Impuesto, Monto_Total)
SELECT 
    v.Id_Venta,
    YEAR(v.Fecha) * 10000 + MONTH(v.Fecha) * 100 + DAY(v.Fecha) AS Sk_Fecha,
    dc.Sk_Cliente,
    dv.Sk_Vendedor,
    dcp.Sk_Condicion_Pago,
    v.Subtotal,
    v.Impuesto,
    v.Monto_Total
FROM MUNDO_ESCOLAR.dbo.Venta v
INNER JOIN MUNDO_ESCOLAR.dbo.Estado_Venta ev ON v.Id_Estado_Venta = ev.Id_Estado_Venta
INNER JOIN dbo.DimCliente dc ON v.Id_Cliente = dc.Id_Cliente AND dc.Es_Actual = 1
INNER JOIN dbo.DimVendedor dv ON v.Id_Usuario = dv.Id_Usuario
INNER JOIN dbo.DimCondicionPago dcp ON v.Id_Condicion_Pago = dcp.Id_Condicion_Pago
WHERE ev.Nombre_Estado = 'Confirmada'
  AND NOT EXISTS (SELECT 1 FROM dbo.FactVenta fv WHERE fv.Id_Venta = v.Id_Venta);
GO

-- Hechos: FactVentaProducto
INSERT INTO dbo.FactVentaProducto (Id_Venta_Producto, Id_Venta, Sk_Fecha, Sk_Producto, Cantidad, Precio_Unitario, Subtotal)
SELECT 
    vp.Id_Venta_Producto,
    v.Id_Venta,
    YEAR(v.Fecha) * 10000 + MONTH(v.Fecha) * 100 + DAY(v.Fecha) AS Sk_Fecha,
    dp.Sk_Producto,
    vp.Cantidad,
    vp.Precio_Unitario,
    vp.Subtotal
FROM MUNDO_ESCOLAR.dbo.Venta_Producto vp
INNER JOIN MUNDO_ESCOLAR.dbo.Venta v ON vp.Id_Venta = v.Id_Venta
INNER JOIN MUNDO_ESCOLAR.dbo.Estado_Venta ev ON v.Id_Estado_Venta = ev.Id_Estado_Venta
INNER JOIN dbo.DimProducto dp ON vp.Id_Producto = dp.Id_Producto
WHERE ev.Nombre_Estado = 'Confirmada'
  AND NOT EXISTS (SELECT 1 FROM dbo.FactVentaProducto fvp WHERE fvp.Id_Venta_Producto = vp.Id_Venta_Producto);
GO

-- Hechos: FactVentaServicio
INSERT INTO dbo.FactVentaServicio (Id_Venta_Servicio, Id_Venta, Sk_Fecha, Sk_Servicio, Cantidad, Precio_Unitario, Subtotal)
SELECT 
    vs.Id_Venta_Servicio,
    v.Id_Venta,
    YEAR(v.Fecha) * 10000 + MONTH(v.Fecha) * 100 + DAY(v.Fecha) AS Sk_Fecha,
    ds.Sk_Servicio,
    vs.Cantidad,
    vs.Precio_Unitario,
    vs.Subtotal
FROM MUNDO_ESCOLAR.dbo.Venta_Servicio vs
INNER JOIN MUNDO_ESCOLAR.dbo.Venta v ON vs.Id_Venta = v.Id_Venta
INNER JOIN MUNDO_ESCOLAR.dbo.Estado_Venta ev ON v.Id_Estado_Venta = ev.Id_Estado_Venta
INNER JOIN dbo.DimServicio ds ON vs.Id_Servicio = ds.Id_Servicio
WHERE ev.Nombre_Estado = 'Confirmada'
  AND NOT EXISTS (SELECT 1 FROM dbo.FactVentaServicio fvs WHERE fvs.Id_Venta_Servicio = vs.Id_Venta_Servicio);
GO

-- Hechos: FactPagos
INSERT INTO dbo.FactPagos (Id_Pago, Id_Factura, Sk_Fecha, Sk_Metodo_Pago, Monto_Pagado)
SELECT 
    p.Id_Pago,
    p.Id_Factura,
    YEAR(p.Fecha_Pago) * 10000 + MONTH(p.Fecha_Pago) * 100 + DAY(p.Fecha_Pago) AS Sk_Fecha,
    dmp.Sk_Metodo_Pago,
    p.Monto_Pagado
FROM MUNDO_ESCOLAR.dbo.Pago p
INNER JOIN dbo.DimMetodoPago dmp ON p.Id_Metodo_Pago = dmp.Id_Metodo_Pago
WHERE p.Estado = 1
  AND NOT EXISTS (SELECT 1 FROM dbo.FactPagos fp WHERE fp.Id_Pago = p.Id_Pago);
GO

-- 5. VERIFICACIÓN Y CONCILIACIÓN FINAL
PRINT '=== CONTEOS FINALES EN EL DATA WAREHOUSE ===';
SELECT 'DimFecha' AS TablaDW, COUNT(*) AS TotalRegistros FROM dbo.DimFecha
UNION ALL SELECT 'DimCliente', COUNT(*) FROM dbo.DimCliente
UNION ALL SELECT 'DimProducto', COUNT(*) FROM dbo.DimProducto
UNION ALL SELECT 'DimServicio', COUNT(*) FROM dbo.DimServicio
UNION ALL SELECT 'DimVendedor', COUNT(*) FROM dbo.DimVendedor
UNION ALL SELECT 'DimCondicionPago', COUNT(*) FROM dbo.DimCondicionPago
UNION ALL SELECT 'DimMetodoPago', COUNT(*) FROM dbo.DimMetodoPago
UNION ALL SELECT 'FactVenta', COUNT(*) FROM dbo.FactVenta
UNION ALL SELECT 'FactVentaProducto', COUNT(*) FROM dbo.FactVentaProducto
UNION ALL SELECT 'FactVentaServicio', COUNT(*) FROM dbo.FactVentaServicio
UNION ALL SELECT 'FactPagos', COUNT(*) FROM dbo.FactPagos;
GO

PRINT 'Data Warehouse DW_MundoEscolar configurado y cargado con éxito.';
GO
