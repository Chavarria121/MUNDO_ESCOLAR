/* =========================================================================
   PROYECTO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR
   ARCHIVO: 00_CONSULTAS_VERIFICACION_EN_VIVO.sql
   PROPÓSITO: SCRIPT MAESTRO DE CONSULTAS (SELECT) PARA LA DEFENSA ANTE EL PROF. TORRENTES
   INSTRUCCIÓN: Tener este script abierto en una pestaña en SSMS 22.
                Al realizar una acción en el Frontend, sombrear el bloque correspondiente 
                y presionar F5 para mostrar los cambios físicos en la Base de Datos.
   ========================================================================= */

USE MUNDO_ESCOLAR;
GO

-- =========================================================================
-- MÓDULO 1: CLIENTES, PROVEEDORES Y COMPRAS
-- =========================================================================

-- Acción Frontend A: Crear o Autorizar Crédito a un Cliente en /clientes
-- Muestra el límite otorgado, saldo disponible y condiciones de pago asignadas
SELECT 
    c.Id_Cliente,
    c.Nombre_O_RazonSocial AS Cliente,
    c.Tipo_Cliente,
    c.Limite_Credito,
    c.Saldo_Pendiente,
    (c.Limite_Credito - c.Saldo_Pendiente) AS Credito_Disponible,
    cp.Descripcion AS Condicion_Pago,
    ccp.Estado AS Credito_Activo
FROM dbo.VW_ClientesActivos c
LEFT JOIN dbo.Cliente_Condicion_Pago ccp ON c.Id_Cliente = ccp.Id_Cliente AND ccp.Estado = 1
LEFT JOIN dbo.Condicion_Pago cp ON ccp.Id_Condicion = cp.Id_Condicion
ORDER BY c.Id_Cliente DESC;

-- Acción Frontend B: Confirmar Recepción de Compra en /compras ("Confirmar Ingreso a Bodega")
-- Muestra la Orden Recibida, la suma de stock en Producto y el asiento en Kárdex
SELECT TOP 1 
    c.Id_Compra,
    c.Numero_Orden,
    prv.Nombre_O_RazonSocial AS Proveedor,
    c.Monto_Total,
    c.Estado AS [Estado (2=Recibida)],
    c.Fecha_Recepcion,
    u.Nombre_Usuario AS Bodeguero_Receptor
FROM dbo.Compra c
INNER JOIN dbo.VW_ProveedoresActivos prv ON c.Id_Proveedor = prv.Id_Proveedor
INNER JOIN dbo.Usuario u ON c.Id_Usuario = u.Id_Usuario
ORDER BY c.Id_Compra DESC;

-- Asientos en Kárdex generados por la compra confirmada
SELECT TOP 3 
    k.Id_Kardex,
    k.Fecha_Movimiento,
    p.Nombre AS Articulo,
    k.Tipo_Movimiento,
    k.Cantidad,
    k.Stock_Previo,
    k.Stock_Posterior,
    k.Referencia_Documento
FROM dbo.Kardex_Inventario k
INNER JOIN dbo.Producto p ON k.Id_Producto = p.Id_Producto
WHERE k.Tipo_Movimiento = 'ENTRADA'
ORDER BY k.Id_Kardex DESC;


-- =========================================================================
-- MÓDULO 2: PRODUCTOS, CATÁLOGO E INVENTARIO
-- =========================================================================

-- Acción Frontend: Ajustar inventario por merma o toma física en /inventario
-- Muestra el stock físico actual y el registro auditado de la alteración
SELECT 
    p.Id_Producto,
    p.Nombre,
    c.Nombre AS Categoria,
    p.Stock_Actual,
    p.Punto_Reorden,
    p.Precio_Venta,
    p.Estado
FROM dbo.Producto p
INNER JOIN dbo.Categoria c ON p.Id_Categoria = c.Id_Categoria
WHERE p.Id_Producto = 14; -- (Ejemplo: Cuaderno Escolar)

-- Ver el movimiento del Kárdex correspondiente al ajuste
SELECT TOP 2 
    k.Id_Kardex,
    k.Fecha_Movimiento,
    k.Tipo_Movimiento,
    k.Cantidad,
    k.Stock_Previo,
    k.Stock_Posterior,
    k.Motivo,
    k.Referencia_Documento
FROM dbo.Kardex_Inventario k
ORDER BY k.Id_Kardex DESC;


-- =========================================================================
-- MÓDULO 3: VENTAS, FACTURACIÓN ELECTRÓNICA Y PAGOS (POS)
-- =========================================================================

-- Acción Frontend: Cobrar una venta en /caja ("Completar Venta y Facturar")
-- Muestra la venta cerrada, la Factura con Clave de 50 dígitos DGT y el Pago
SELECT TOP 1 
    v.Id_Venta,
    v.Fecha_Venta,
    c.Nombre_O_RazonSocial AS Cliente,
    v.Subtotal,
    v.Impuesto,
    v.Total,
    v.Estado AS [Estado_Venta (2=Confirmada)]
FROM dbo.Venta v
INNER JOIN dbo.VW_ClientesActivos c ON v.Id_Cliente = c.Id_Cliente
ORDER BY v.Id_Venta DESC;

-- Factura Electrónica generada (Verificar Clave Numérica de exactamente 50 dígitos de Hacienda)
SELECT TOP 1 
    f.Id_Factura,
    f.Numero_Consecutivo,
    f.Clave_Numerica_Fiscal,
    LEN(f.Clave_Numerica_Fiscal) AS Longitud_Clave_Hacienda,
    f.Monto_Total,
    f.Saldo_Pendiente,
    f.Estado_Factura
FROM dbo.Factura f
ORDER BY f.Id_Factura DESC;

-- Recibo de Pago financiero
SELECT TOP 1 
    p.Id_Pago,
    p.Fecha_Pago,
    p.Monto,
    mp.Nombre AS Metodo_Pago,
    p.Referencia_Transaccion
FROM dbo.Pago p
INNER JOIN dbo.Metodo_Pago mp ON p.Id_Metodo_Pago = mp.Id_Metodo_Pago
ORDER BY p.Id_Pago DESC;

-- Rebajo inmediato de inventario en Kárdex
SELECT TOP 2 
    k.Id_Kardex,
    pr.Nombre AS Articulo,
    k.Tipo_Movimiento,
    k.Cantidad,
    k.Stock_Previo,
    k.Stock_Posterior,
    k.Referencia_Documento
FROM dbo.Kardex_Inventario k
INNER JOIN dbo.Producto pr ON k.Id_Producto = pr.Id_Producto
WHERE k.Tipo_Movimiento = 'SALIDA'
ORDER BY k.Id_Kardex DESC;


-- =========================================================================
-- MÓDULO 4: SEGURIDAD, ROLES Y AUDITORÍA TRANSVERSAL
-- =========================================================================

-- Acción Frontend A: Cerrar Sesión (Logout) en el Frontend
-- Demuestra la revocación criptográfica del JWT en la tabla técnica de seguridad
SELECT TOP 3 
    Id_Revocado,
    Token_Id_JTI,
    Fecha_Revocacion,
    Fecha_Expiracion,
    Motivo
FROM dbo.TB_Token_Revocado
ORDER BY Id_Revocado DESC;

-- Acción Frontend B: Cambiar contraseña de usuario en perfil
-- Demuestra la política NIST de no-reutilización de contraseñas
SELECT TOP 3 
    h.Id_Historial,
    u.Nombre_Usuario,
    h.Password_Hash,
    h.Fecha_Creacion
FROM dbo.TB_Historial_Contrasenas h
INNER JOIN dbo.Usuario u ON h.Id_Usuario = u.Id_Usuario
ORDER BY h.Id_Historial DESC;

-- Acción Frontend C: Ver Bitácora de Auditoría Transversal (Filegroup ME_Auditoria)
-- Muestra el registro automático de cualquier operación realizada
SELECT TOP 5 
    Id_Bitacora,
    Fecha_Hora,
    Usuario,
    Accion,
    Tabla_Afectada,
    Registro_Id,
    Descripcion
FROM dbo.Bitacora_Auditoria
ORDER BY Id_Bitacora DESC;


-- =========================================================================
-- MÓDULO 5: ADMINISTRACIÓN DBA, MANTENIMIENTO Y FILEGROUPS
-- =========================================================================

-- 1. Consultar historial de respaldos ejecutados en MSDB
EXEC dbo.SP_DBA_ConsultarHistorialBackups;

-- 2. Monitorear el estado físico de los 5 Filegroups y sus archivos .mdf / .ndf
EXEC dbo.SP_DBA_MonitorearEspacioArchivos;

-- 3. Supervisar la fragmentación de índices del catálogo
EXEC dbo.SP_DBA_MantenimientoIndices;

-- 4. Comprobar la integridad física de la base de datos (DBCC CHECKDB)
EXEC dbo.SP_DBA_VerificarIntegridadBD;


-- =========================================================================
-- MÓDULO 6: DATA WAREHOUSE, ETL Y REPORTES ANALÍTICOS (BI)
-- =========================================================================

-- 1. Ejecutar el pipeline de orquestación ETL completa
EXEC dbo.SP_ETL_OrquestarCargaCompleta;

-- 2. Validar la Conciliación Matemática (Compara colones en OLTP vs Fact_Ventas en DW)
EXEC dbo.SP_ETL_ValidarConciliacionCargas;

-- 3. Demostrar el SCD Tipo 2 (Slowly Changing Dimensions) en Dim_Cliente
-- Al cambiar el límite de crédito en el OLTP y correr el ETL, se observa la versión previa (Es_Actual=0)
-- y la nueva versión activa (Es_Actual=1) con sus ventanas de fechas.
SELECT 
    SK_Cliente,
    Id_Cliente_BK,
    Nombre_Cliente,
    Limite_Credito,
    Fecha_Inicio,
    Fecha_Fin,
    Es_Actual
FROM dbo.Dim_Cliente
ORDER BY Id_Cliente_BK, SK_Cliente;

-- 4. Consultar las ventas consolidadas en Fact_Ventas
SELECT TOP 5 
    SK_Venta,
    Id_Venta_BK,
    SK_Fecha,
    SK_Cliente,
    Monto_Total,
    Monto_Impuesto,
    Margen_Bruto_Total
FROM dbo.Fact_Ventas
ORDER BY SK_Venta DESC;
GO
