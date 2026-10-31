/* =========================================================================
   PROYECTO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR
   SCRIPT: 09_CrearVistas.sql
   REQUERIMIENTOS: RF1.6, RF1.8–RF1.9, RF2.4–RF2.6, RF2.10, RF3.8–RF3.9, RF4.x, RF6.6, RA5.4
   REFERENCIA DOCUMENTACIÓN: Sección 17.7 (Páginas 433-441)
   DESCRIPCIÓN: Implementación de las 19 vistas operativas, administrativas y de consulta:
     1. VW_ClientesActivos
     2. VW_ProveedoresActivos
     3. VW_ProductoProveedor
     4. VW_ProductosCatalogo
     5. VW_ProductosInventario
     6. VW_MovimientosInventario
     7. VW_ComprasDetalle
     8. VW_Ventas
     9. VW_VentaProductos
     10. VW_VentaServicios
     11. VW_Facturas
     12. VW_Pagos
     13. VW_CuentasPorCobrar
     14. VW_Auditoria
     15. VW_MetodosPagoActivos
     16. VW_CategoriasActivas
     17. VW_TiposClienteActivos
     18. VW_CondicionesPagoActivas
     19. VW_VentasPendientesFacturacion
   ========================================================================= */

USE MUNDO_ESCOLAR
GO

-- 17.7.1. VW_ClientesActivos
CREATE OR ALTER VIEW dbo.VW_ClientesActivos
AS
SELECT 
    c.Id_Cliente,
    tc.Nombre AS Tipo_Cliente,
    CASE 
        WHEN tc.Nombre = 'Particular' THEN cp.Identificacion
        WHEN tc.Nombre = 'Institucional' THEN ci.Cedula_Juridica
        ELSE 'N/A'
    END AS Numero_Identificacion,
    CASE 
        WHEN tc.Nombre = 'Particular' THEN RTRIM(LTRIM(CONCAT(cp.Nombre, ' ', cp.Apellido1, ' ', ISNULL(cp.Apellido2, ''))))
        WHEN tc.Nombre = 'Institucional' THEN ci.Razon_Social
        ELSE 'No especificado'
    END AS Nombre_O_RazonSocial,
    cp.Nombre,
    cp.Apellido1,
    cp.Apellido2,
    ci.Razon_Social,
    ci.Cedula_Juridica,
    ci.Nombre_Contacto,
    ci.Telefono_Contacto,
    ci.Correo_Contacto,
    COALESCE(ci.Correo_Contacto, u.Correo) AS Correo,
    u.Correo AS Correo_Usuario,
    c.Telefono,
    c.Direccion,
    c.Id_Usuario,
    u.Nombre_Usuario,
    c.Estado,
    CAST(CASE WHEN EXISTS (
        SELECT 1 FROM Cliente_Condicion_Pago ccp 
        INNER JOIN Condicion_Pago cpago ON ccp.Id_Condicion_Pago = cpago.Id_Condicion_Pago
        WHERE ccp.Id_Cliente = c.Id_Cliente AND ccp.Estado = 1 AND cpago.Dias_Credito > 0
    ) THEN 1 ELSE 0 END AS BIT) AS Tiene_Credito_Activo,
    (
        SELECT STRING_AGG(cpago.Nombre, ', ')
        FROM Cliente_Condicion_Pago ccp 
        INNER JOIN Condicion_Pago cpago ON ccp.Id_Condicion_Pago = cpago.Id_Condicion_Pago
        WHERE ccp.Id_Cliente = c.Id_Cliente AND ccp.Estado = 1
    ) AS Condiciones_Autorizadas
FROM Cliente c
INNER JOIN Tipo_Cliente tc ON c.Id_Tipo_Cliente = tc.Id_Tipo_Cliente
LEFT JOIN Cliente_Particular cp ON c.Id_Cliente = cp.Id_Cliente
LEFT JOIN Cliente_Institucional ci ON c.Id_Cliente = ci.Id_Cliente
LEFT JOIN Usuario u ON c.Id_Usuario = u.Id_Usuario
WHERE c.Estado = 1;
GO

-- 17.7.2. VW_ProveedoresActivos
CREATE OR ALTER VIEW dbo.VW_ProveedoresActivos
AS
SELECT 
    p.Id_Proveedor,
    tp.Nombre AS Tipo_Proveedor,
    CASE 
        WHEN tp.Nombre = 'Particular' THEN pp.Identificacion
        WHEN tp.Nombre = 'Institucional' THEN pi.Cedula_Juridica
        ELSE 'N/A'
    END AS Numero_Identificacion,
    CASE 
        WHEN tp.Nombre = 'Particular' THEN RTRIM(LTRIM(CONCAT(pp.Nombre, ' ', pp.Apellido1, ' ', ISNULL(pp.Apellido2, ''))))
        WHEN tp.Nombre = 'Institucional' THEN pi.Razon_Social
        ELSE 'No especificado'
    END AS Nombre_O_RazonSocial,
    pp.Nombre,
    pp.Apellido1,
    pp.Apellido2,
    pi.Razon_Social,
    pi.Cedula_Juridica,
    pi.Nombre_Contacto,
    pi.Telefono_Contacto,
    pi.Correo_Contacto,
    p.Correo,
    p.Telefono,
    p.Direccion,
    p.Estado
FROM Proveedor p
INNER JOIN Tipo_Proveedor tp ON p.Id_Tipo_Proveedor = tp.Id_Tipo_Proveedor
LEFT JOIN Proveedor_Particular pp ON p.Id_Proveedor = pp.Id_Proveedor
LEFT JOIN Proveedor_Institucional pi ON p.Id_Proveedor = pi.Id_Proveedor
WHERE p.Estado = 1;
GO

-- 17.7.3. VW_ProductoProveedor
CREATE OR ALTER VIEW dbo.VW_ProductoProveedor
AS
SELECT 
    ppr.Id_Producto_Proveedor,
    ppr.Id_Producto,
    prod.Nombre AS Nombre_Producto,
    cat.Nombre AS Categoria,
    ppr.Id_Proveedor,
    tp.Nombre AS Tipo_Proveedor,
    CASE 
        WHEN tp.Nombre = 'Particular' THEN RTRIM(LTRIM(CONCAT(pp.Nombre, ' ', pp.Apellido1, ' ', ISNULL(pp.Apellido2, ''))))
        WHEN tp.Nombre = 'Institucional' THEN pi.Razon_Social
        ELSE 'No especificado'
    END AS Nombre_Proveedor,
    ppr.Precio_Compra,
    prod.Precio_Venta,
    ppr.EsPrincipal,
    ppr.Estado AS Estado_Asociacion,
    prov.Estado AS Estado_Proveedor
FROM Producto_Proveedor ppr
INNER JOIN Producto prod ON ppr.Id_Producto = prod.Id_Producto
INNER JOIN Categoria cat ON prod.Id_Categoria = cat.Id_Categoria
INNER JOIN Proveedor prov ON ppr.Id_Proveedor = prov.Id_Proveedor
INNER JOIN Tipo_Proveedor tp ON prov.Id_Tipo_Proveedor = tp.Id_Tipo_Proveedor
LEFT JOIN Proveedor_Particular pp ON prov.Id_Proveedor = pp.Id_Proveedor
LEFT JOIN Proveedor_Institucional pi ON prov.Id_Proveedor = pi.Id_Proveedor;
GO

-- 17.7.4. VW_ProductosCatalogo
CREATE OR ALTER VIEW dbo.VW_ProductosCatalogo
AS
SELECT 
    p.Id_Producto,
    p.Id_Categoria,
    c.Nombre AS Categoria,
    p.Nombre,
    p.Descripcion,
    p.Precio_Venta,
    p.Estado
FROM Producto p
INNER JOIN Categoria c ON p.Id_Categoria = c.Id_Categoria;
GO

-- 17.7.5. VW_ProductosInventario
CREATE OR ALTER VIEW dbo.VW_ProductosInventario
AS
SELECT 
    p.Id_Producto,
    c.Nombre AS Categoria,
    p.Nombre,
    p.Descripcion,
    p.Precio_Venta,
    p.Stock_Actual,
    p.Punto_Reorden,
    CASE 
        WHEN p.Stock_Actual = 0 THEN 'Agotado'
        WHEN p.Stock_Actual <= p.Punto_Reorden THEN 'Bajo Reorden'
        ELSE 'Normal'
    END AS Estado_Disponibilidad,
    p.Estado
FROM Producto p
INNER JOIN Categoria c ON p.Id_Categoria = c.Id_Categoria;
GO

-- 17.7.6. VW_MovimientosInventario
CREATE OR ALTER VIEW dbo.VW_MovimientosInventario
AS
SELECT 
    m.Id_Movimiento_Inventario,
    m.Id_Producto,
    p.Nombre AS Producto,
    cat.Nombre AS Categoria,
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
INNER JOIN Categoria cat ON p.Id_Categoria = cat.Id_Categoria
INNER JOIN Tipo_Movimiento tm ON m.Id_Tipo_Movimiento = tm.Id_Tipo_Movimiento
INNER JOIN Usuario u ON m.Id_Usuario = u.Id_Usuario;
GO

-- 17.7.7. VW_ComprasDetalle
CREATE OR ALTER VIEW dbo.VW_ComprasDetalle
AS
SELECT 
    c.Id_Compra,
    c.Fecha_Compra,
    c.Id_Estado_Compra,
    ec.Nombre_Estado AS Estado_Compra,
    c.Id_Proveedor,
    tp.Nombre AS Tipo_Proveedor,
    CASE 
        WHEN tp.Nombre = 'Particular' THEN RTRIM(LTRIM(CONCAT(pp.Nombre, ' ', pp.Apellido1, ' ', ISNULL(pp.Apellido2, ''))))
        WHEN tp.Nombre = 'Institucional' THEN pi.Razon_Social
        ELSE 'No especificado'
    END AS Nombre_Proveedor,
    c.Id_Usuario,
    u.Nombre_Usuario AS Responsable,
    cp.Id_Producto,
    p.Nombre AS Producto,
    cat.Nombre AS Categoria,
    cp.Cantidad,
    cp.Costo_Unitario,
    cp.Subtotal
FROM Compra c
INNER JOIN Estado_Compra ec ON c.Id_Estado_Compra = ec.Id_Estado_Compra
INNER JOIN Compra_Producto cp ON c.Id_Compra = cp.Id_Compra
INNER JOIN Producto p ON cp.Id_Producto = p.Id_Producto
INNER JOIN Categoria cat ON p.Id_Categoria = cat.Id_Categoria
INNER JOIN Proveedor prov ON c.Id_Proveedor = prov.Id_Proveedor
INNER JOIN Tipo_Proveedor tp ON prov.Id_Tipo_Proveedor = tp.Id_Tipo_Proveedor
LEFT JOIN Proveedor_Particular pp ON prov.Id_Proveedor = pp.Id_Proveedor
LEFT JOIN Proveedor_Institucional pi ON prov.Id_Proveedor = pi.Id_Proveedor
INNER JOIN Usuario u ON c.Id_Usuario = u.Id_Usuario;
GO

-- 17.7.8. VW_Ventas
CREATE OR ALTER VIEW dbo.VW_Ventas
AS
SELECT 
    v.Id_Venta,
    v.Fecha,
    v.Id_Estado_Venta,
    ev.Nombre_Estado AS Estado_Venta,
    v.Id_Cliente,
    tc.Nombre AS Tipo_Cliente,
    CASE 
        WHEN tc.Nombre = 'Particular' THEN RTRIM(LTRIM(CONCAT(cp.Nombre, ' ', cp.Apellido1, ' ', ISNULL(cp.Apellido2, ''))))
        WHEN tc.Nombre = 'Institucional' THEN ci.Razon_Social
        ELSE 'No especificado'
    END AS Nombre_Cliente,
    v.Id_Usuario,
    u.Nombre_Usuario AS Vendedor,
    v.Id_Condicion_Pago,
    cpago.Nombre AS Condicion_Pago,
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
LEFT JOIN Cliente_Institucional ci ON c.Id_Cliente = ci.Id_Cliente;
GO

-- 17.7.9. VW_VentaProductos
CREATE OR ALTER VIEW dbo.VW_VentaProductos
AS
SELECT 
    vp.Id_Venta_Producto,
    vp.Id_Venta,
    v.Fecha,
    ev.Nombre_Estado AS Estado_Venta,
    vp.Id_Producto,
    p.Nombre AS Producto,
    cat.Nombre AS Categoria,
    vp.Cantidad,
    vp.Precio_Unitario,
    vp.Subtotal
FROM Venta_Producto vp
INNER JOIN Venta v ON vp.Id_Venta = v.Id_Venta
INNER JOIN Estado_Venta ev ON v.Id_Estado_Venta = ev.Id_Estado_Venta
INNER JOIN Producto p ON vp.Id_Producto = p.Id_Producto
INNER JOIN Categoria cat ON p.Id_Categoria = cat.Id_Categoria;
GO

-- 17.7.10. VW_VentaServicios
CREATE OR ALTER VIEW dbo.VW_VentaServicios
AS
SELECT 
    vs.Id_Venta_Servicio,
    vs.Id_Venta,
    v.Fecha,
    ev.Nombre_Estado AS Estado_Venta,
    vs.Id_Servicio,
    s.Nombre AS Servicio,
    vs.Cantidad,
    vs.Precio_Unitario,
    vs.Subtotal
FROM Venta_Servicio vs
INNER JOIN Venta v ON vs.Id_Venta = v.Id_Venta
INNER JOIN Estado_Venta ev ON v.Id_Estado_Venta = ev.Id_Estado_Venta
INNER JOIN Servicio s ON vs.Id_Servicio = s.Id_Servicio;
GO

-- 17.7.11. VW_Facturas
CREATE OR ALTER VIEW dbo.VW_Facturas
AS
SELECT 
    f.Id_Factura,
    f.Id_Venta,
    v.Id_Cliente,
    tc.Nombre AS Tipo_Cliente,
    CASE 
        WHEN tc.Nombre = 'Particular' THEN RTRIM(LTRIM(CONCAT(cp.Nombre, ' ', cp.Apellido1, ' ', ISNULL(cp.Apellido2, ''))))
        WHEN tc.Nombre = 'Institucional' THEN ci.Razon_Social
        ELSE 'No especificado'
    END AS Nombre_Cliente,
    v.Id_Usuario AS Id_Vendedor,
    u.Nombre_Usuario AS Vendedor,
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
INNER JOIN Usuario u ON v.Id_Usuario = u.Id_Usuario
INNER JOIN Cliente c ON v.Id_Cliente = c.Id_Cliente
INNER JOIN Tipo_Cliente tc ON c.Id_Tipo_Cliente = tc.Id_Tipo_Cliente
LEFT JOIN Cliente_Particular cp ON c.Id_Cliente = cp.Id_Cliente
LEFT JOIN Cliente_Institucional ci ON c.Id_Cliente = ci.Id_Cliente;
GO

-- 17.7.12. VW_Pagos
CREATE OR ALTER VIEW dbo.VW_Pagos
AS
SELECT 
    p.Id_Pago,
    p.Id_Factura,
    f.Id_Venta,
    p.Fecha_Pago,
    p.Monto_Pagado,
    p.Id_Metodo_Pago,
    mp.Nombre AS Metodo_Pago,
    p.Numero_Referencia,
    p.Estado
FROM Pago p
INNER JOIN Factura f ON p.Id_Factura = f.Id_Factura
INNER JOIN Metodo_Pago mp ON p.Id_Metodo_Pago = mp.Id_Metodo_Pago;
GO

-- 17.7.13. VW_CuentasPorCobrar (Facturas no Anuladas con Saldo_Pendiente > 0)
CREATE OR ALTER VIEW dbo.VW_CuentasPorCobrar
AS
SELECT 
    f.Id_Factura,
    f.Id_Venta,
    v.Id_Cliente,
    tc.Nombre AS Tipo_Cliente,
    CASE 
        WHEN tc.Nombre = 'Particular' THEN RTRIM(LTRIM(CONCAT(cp.Nombre, ' ', cp.Apellido1, ' ', ISNULL(cp.Apellido2, ''))))
        WHEN tc.Nombre = 'Institucional' THEN ci.Razon_Social
        ELSE 'No especificado'
    END AS Nombre_Cliente,
    cpago.Nombre AS Condicion_Pago,
    cpago.Dias_Credito,
    f.Fecha_Emision,
    f.Fecha_Vencimiento,
    f.Monto_Total,
    (f.Monto_Total - f.Saldo_Pendiente) AS Total_Pagado,
    f.Saldo_Pendiente,
    ef.Nombre_Estado AS Estado_Factura,
    CASE 
        WHEN GETDATE() > f.Fecha_Vencimiento THEN DATEDIFF(DAY, f.Fecha_Vencimiento, GETDATE())
        ELSE 0
    END AS Dias_Mora
FROM Factura f
INNER JOIN Estado_Factura ef ON f.Id_Estado_Factura = ef.Id_Estado_Factura
INNER JOIN Venta v ON f.Id_Venta = v.Id_Venta
INNER JOIN Condicion_Pago cpago ON v.Id_Condicion_Pago = cpago.Id_Condicion_Pago
INNER JOIN Cliente c ON v.Id_Cliente = c.Id_Cliente
INNER JOIN Tipo_Cliente tc ON c.Id_Tipo_Cliente = tc.Id_Tipo_Cliente
LEFT JOIN Cliente_Particular cp ON c.Id_Cliente = cp.Id_Cliente
LEFT JOIN Cliente_Institucional ci ON c.Id_Cliente = ci.Id_Cliente
WHERE ef.Nombre_Estado <> 'Anulada'
  AND f.Saldo_Pendiente > 0.00;
GO

-- 17.7.14. VW_Auditoria
CREATE OR ALTER VIEW dbo.VW_Auditoria
AS
SELECT 
    b.Id_Bitacora,
    b.Fecha_Hora,
    b.Id_Usuario,
    u.Nombre_Usuario,
    b.Accion,
    b.Tabla_Afectada,
    b.Id_Registro_Afectado,
    b.Descripcion
FROM Bitacora b
INNER JOIN Usuario u ON b.Id_Usuario = u.Id_Usuario;
GO

-- 17.7.15. VW_MetodosPagoActivos
CREATE OR ALTER VIEW dbo.VW_MetodosPagoActivos
AS
SELECT 
    Id_Metodo_Pago,
    Nombre,
    Descripcion,
    Estado
FROM Metodo_Pago
WHERE Estado = 1;
GO

-- 17.7.16. VW_CategoriasActivas
CREATE OR ALTER VIEW dbo.VW_CategoriasActivas
AS
SELECT 
    Id_Categoria,
    Nombre,
    Descripcion,
    Estado
FROM Categoria
WHERE Estado = 1;
GO

-- 17.7.17. VW_TiposClienteActivos
CREATE OR ALTER VIEW dbo.VW_TiposClienteActivos
AS
SELECT 
    Id_Tipo_Cliente,
    Nombre,
    Descripcion,
    Estado
FROM Tipo_Cliente
WHERE Estado = 1;
GO

-- 17.7.18. VW_CondicionesPagoActivas
CREATE OR ALTER VIEW dbo.VW_CondicionesPagoActivas
AS
SELECT 
    Id_Condicion_Pago,
    Nombre,
    Dias_Credito,
    Descripcion,
    Estado
FROM Condicion_Pago
WHERE Estado = 1;
GO

-- 17.7.19. VW_VentasPendientesFacturacion
-- Ventas Confirmadas sin Factura asociada
CREATE OR ALTER VIEW dbo.VW_VentasPendientesFacturacion
AS
SELECT 
    v.Id_Venta,
    v.Fecha,
    ev.Nombre_Estado AS Estado_Venta,
    v.Id_Cliente,
    tc.Nombre AS Tipo_Cliente,
    CASE 
        WHEN tc.Nombre = 'Particular' THEN RTRIM(LTRIM(CONCAT(cp.Nombre, ' ', cp.Apellido1, ' ', ISNULL(cp.Apellido2, ''))))
        WHEN tc.Nombre = 'Institucional' THEN ci.Razon_Social
        ELSE 'No especificado'
    END AS Nombre_Cliente,
    v.Subtotal,
    v.Impuesto,
    v.Monto_Total,
    v.Id_Condicion_Pago,
    cpago.Nombre AS Condicion_Pago
FROM Venta v
INNER JOIN Estado_Venta ev ON v.Id_Estado_Venta = ev.Id_Estado_Venta
INNER JOIN Condicion_Pago cpago ON v.Id_Condicion_Pago = cpago.Id_Condicion_Pago
INNER JOIN Cliente c ON v.Id_Cliente = c.Id_Cliente
INNER JOIN Tipo_Cliente tc ON c.Id_Tipo_Cliente = tc.Id_Tipo_Cliente
LEFT JOIN Cliente_Particular cp ON c.Id_Cliente = cp.Id_Cliente
LEFT JOIN Cliente_Institucional ci ON c.Id_Cliente = ci.Id_Cliente
LEFT JOIN Factura f ON v.Id_Venta = f.Id_Venta
WHERE ev.Nombre_Estado = 'Confirmada'
  AND f.Id_Factura IS NULL;
GO

PRINT '19 Vistas operativas y analíticas (09_CrearVistas.sql) instaladas exitosamente.';
GO
