/* =========================================================================
   PROYECTO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR
   ARCHIVO: 07_flujo_de_acciones.sql
   PROPÓSITO: SCRIPT MAESTRO DE DEMOSTRACIÓN INTEGRADA EN VIVO (HILO CONDUCTOR)
   TRIBUNAL EVALUADOR: Prof. Torrentes — Bases de Datos Avanzadas e Inteligencia de Negocios
   EQUIPO EXPOSITOR:
     1. DANIEL  -> Registra cliente particular y autoriza línea de crédito.
     2. JOSE    -> Recibe orden de compra en bodega; stock aumenta y genera Kárdex.
     3. DAUREN  -> Muestra existencias del producto, Kárdex y ajuste de inventario por merma.
     4. MELISSA -> Vende al cliente de Daniel el producto ingresado; factura DGT 50 dígitos y abono.
     5. GEISON  -> Muestra bitácora transversal unificada, seguridad RBAC y ejecuta respaldo DBA.
     6. SAMIR   -> Sincroniza el Data Warehouse (ETL) y demuestra la analítica en Power BI / Métricas.

   INSTRUCCIÓN PARA QUIEN MANEJA SSMS 22:
   - Mantén abierta esta única pestaña durante toda la exposición.
   - Conforme cada compañero toma la palabra, sombrea el bloque correspondiente y presiona F5.
   ========================================================================= */

USE MUNDO_ESCOLAR;
GO

SET NOCOUNT ON;
GO


-- =========================================================================
-- ETAPA 1: DANIEL — CLIENTES Y AUTORIZACIÓN DE CRÉDITO
-- =========================================================================

-- PASO 1.1 (ANTES): Consultar el último cliente registrado en el catálogo
SELECT TOP 1 
    c.Id_Cliente,
    c.Nombre_O_RazonSocial AS Ultimo_Cliente_Actual,
    c.Tipo_Cliente,
    c.Numero_Identificacion,
    c.Limite_Credito_Monto,
    c.Permite_Credito,
    c.Condiciones_Autorizadas
FROM dbo.VW_ClientesActivos c
ORDER BY c.Id_Cliente DESC;

-- PASO 1.2 (ACCIÓN DE DANIEL EN EL FRONTEND):
-- 1. Ir a la pantalla "Directorio de Clientes" (/clientes).
-- 2. Presionar "+ Nuevo Cliente".
-- 3. Registrar cliente particular:
--    - Nombre: Carlos, Primer Apellido: Vargas
--    - Cédula: 5-0422-0981, Teléfono: 8899-7766
--    - Límite de Crédito: ₡200,000, marcar "Autorizar Crédito", condición: Crédito 30 días.
-- 4. Presionar "Guardar Cliente".

-- PASO 1.3 (DESPUÉS): Demostrar la inserción en caliente del cliente de Daniel y su crédito activo
SELECT TOP 1 
    c.Id_Cliente,
    c.Nombre_O_RazonSocial AS Nuevo_Cliente_Creado,
    c.Tipo_Cliente,
    c.Numero_Identificacion,
    c.Limite_Credito_Monto,
    c.Limite_Credito_Facturas,
    c.Permite_Credito,
    cp.Nombre AS Condicion_Asignada,
    cp.Dias_Credito,
    ccp.Fecha_Autorizacion
FROM dbo.VW_ClientesActivos c
LEFT JOIN dbo.Cliente_Condicion_Pago ccp ON c.Id_Cliente = ccp.Id_Cliente AND ccp.Estado = 1
LEFT JOIN dbo.Condicion_Pago cp ON ccp.Id_Condicion_Pago = cp.Id_Condicion_Pago
ORDER BY c.Id_Cliente DESC;
GO


-- =========================================================================
-- ETAPA 2: JOSE — RECEPCIÓN DE COMPRA Y ENTRADA AL KÁRDEX
-- =========================================================================

-- PASO 2.1 (ANTES): Consultar la Orden de Compra pendiente y el stock físico antes de la recepción
SELECT TOP 1 
    c.Id_Compra,
    CONCAT('OC-', RIGHT('00000000' + CAST(c.Id_Compra AS VARCHAR(10)), 8)) AS Numero_Orden,
    prv.Nombre_O_RazonSocial AS Proveedor,
    ec.Nombre_Estado AS Estado_Actual,
    c.Fecha_Compra,
    tot.TotalCompra AS Monto_Total,
    tot.TotalArticulos AS Total_Unidades
FROM dbo.Compra c
INNER JOIN dbo.Estado_Compra ec ON c.Id_Estado_Compra = ec.Id_Estado_Compra
INNER JOIN dbo.VW_ProveedoresActivos prv ON c.Id_Proveedor = prv.Id_Proveedor
OUTER APPLY (
    SELECT SUM(Subtotal) AS TotalCompra, SUM(Cantidad) AS TotalArticulos 
    FROM dbo.Compra_Producto WHERE Id_Compra = c.Id_Compra
) tot
WHERE c.Id_Estado_Compra = 1 -- Pendiente
ORDER BY c.Id_Compra DESC;

-- Consultar stock actual del producto antes de recibirlo (Ejemplo: Cuaderno Escolar #14):
SELECT Id_Producto, Nombre AS Producto, Stock_Actual, Punto_Reorden 
FROM dbo.Producto WHERE Id_Producto = 14;

-- PASO 2.2 (ACCIÓN DE JOSE EN EL FRONTEND):
-- 1. Ir a la pantalla "Compras y Proveedores" (/compras).
-- 2. En la tabla, ubicar la orden pendiente y presionar el botón verde "Confirmar Ingreso a Bodega".
-- 3. Confirmar la fecha/hora de recepción en la ventana modal y presionar "Confirmar Ingreso a Bodega".

-- PASO 2.3 (DESPUÉS): Demostrar la transacción atómica: orden Recibida, stock incrementado y Kárdex
-- 1. Estado de la Orden actualizado a Recibida:
SELECT TOP 1 
    c.Id_Compra,
    CONCAT('OC-', RIGHT('00000000' + CAST(c.Id_Compra AS VARCHAR(10)), 8)) AS Numero_Orden,
    prv.Nombre_O_RazonSocial AS Proveedor,
    ec.Nombre_Estado AS Estado_Actualizado,
    c.Fecha_Compra,
    u.Nombre_Usuario AS Bodeguero_Receptor,
    tot.TotalCompra AS Monto_Total
FROM dbo.Compra c
INNER JOIN dbo.Estado_Compra ec ON c.Id_Estado_Compra = ec.Id_Estado_Compra
INNER JOIN dbo.VW_ProveedoresActivos prv ON c.Id_Proveedor = prv.Id_Proveedor
INNER JOIN dbo.Usuario u ON c.Id_Usuario = u.Id_Usuario
OUTER APPLY (
    SELECT SUM(Subtotal) AS TotalCompra FROM dbo.Compra_Producto WHERE Id_Compra = c.Id_Compra
) tot
ORDER BY c.Id_Compra DESC;

-- 2. Stock aumentado físicamente en dbo.Producto:
SELECT Id_Producto, Nombre AS Producto, Stock_Actual AS Stock_Con_Mercaderia_Recibida, Punto_Reorden 
FROM dbo.Producto WHERE Id_Producto = 14;

-- 3. Asiento de Entrada inmutable generado en el Kárdex:
SELECT TOP 1 
    m.Id_Movimiento_Inventario,
    m.Fecha,
    m.Producto,
    m.Tipo_Movimiento,
    m.Naturaleza,
    m.Cantidad AS Cantidad_Ingresada,
    m.Motivo,
    m.Responsable
FROM dbo.VW_MovimientosInventario m
WHERE m.Naturaleza = 'Entrada'
ORDER BY m.Id_Movimiento_Inventario DESC;
GO


-- =========================================================================
-- ETAPA 3: DAUREN — CATÁLOGO, KÁRDEX Y AJUSTE DE INVENTARIO
-- =========================================================================

-- PASO 3.1 (ANTES): Consultar el stock disponible antes del ajuste de Dauren
SELECT Id_Producto, Nombre AS Producto, Stock_Actual, Punto_Reorden, Precio_Venta
FROM dbo.Producto WHERE Id_Producto = 14;

-- PASO 3.2 (ACCIÓN DE DAUREN EN EL FRONTEND):
-- 1. Ir a la pantalla "Inventario y Kárdex" (/inventario).
-- 2. Mostrar la tarjeta del producto recibido por Jose (Cuaderno Escolar #14).
-- 3. Entrar a la pestaña "Libro Kárdex de Movimientos" para enseñar la entrada que dejó Jose.
-- 4. Volver a "Productos en Bodega", presionar el botón "Ajustar Stock" (ícono 🎚️) del producto #14:
--    - Tipo: Salida / Merma.
--    - Cantidad: 1 unidad.
--    - Motivo: "Muestra escolar / control de calidad".
-- 5. Presionar "Confirmar Ajuste".

-- PASO 3.3 (DESPUÉS): Demostrar el rebajo del stock por merma y el asiento en Kárdex
SELECT Id_Producto, Nombre AS Producto, Stock_Actual AS Stock_Tras_Merma, Punto_Reorden
FROM dbo.Producto WHERE Id_Producto = 14;

SELECT TOP 1 
    m.Id_Movimiento_Inventario,
    m.Fecha,
    m.Producto,
    m.Tipo_Movimiento,
    m.Cantidad AS Unidades_Ajustadas,
    m.Motivo,
    m.Responsable
FROM dbo.VW_MovimientosInventario m
ORDER BY m.Id_Movimiento_Inventario DESC;
GO


-- =========================================================================
-- ETAPA 4: MELISSA — VENTA AL CLIENTE DE DANIEL, FACTURA DGT Y PAGO
-- =========================================================================

-- PASO 4.1 (ANTES): Consultar stock disponible del producto y el saldo del cliente de Daniel
SELECT Id_Producto, Nombre AS Producto, Stock_Actual, Precio_Venta FROM dbo.Producto WHERE Id_Producto = 14;

SELECT TOP 1 Id_Cliente, Nombre_O_RazonSocial AS Cliente_De_Daniel, Limite_Credito_Monto, Permite_Credito
FROM dbo.VW_ClientesActivos ORDER BY Id_Cliente DESC;

-- PASO 4.2 (ACCIÓN DE MELISSA EN EL FRONTEND):
-- 1. Ir a "Caja y Punto de Venta" (/caja).
-- 2. Agregar al carrito 2 unidades de "Cuaderno Escolar" y 1 "Fotocopia B/N Carta".
-- 3. En el buscador de clientes del carrito, seleccionar al cliente creado por Daniel (Carlos Vargas).
-- 4. Método de pago: Seleccionar "Efectivo" (o SINPE).
-- 5. Presionar el botón verde "Completar Venta y Emitir Factura".

-- PASO 4.3 (DESPUÉS): Demostrar la venta, la Factura DGT con Clave de 50 dígitos y la salida de Kárdex
-- 1. Venta confirmada:
SELECT TOP 1 
    v.Id_Venta,
    v.Fecha,
    c.Nombre_O_RazonSocial AS Cliente_Comprador,
    v.Subtotal,
    v.Impuesto,
    v.Monto_Total,
    ev.Nombre_Estado AS Estado_Venta,
    u.Nombre_Usuario AS Cajero
FROM dbo.Venta v
INNER JOIN dbo.VW_ClientesActivos c ON v.Id_Cliente = c.Id_Cliente
INNER JOIN dbo.Estado_Venta ev ON v.Id_Estado_Venta = ev.Id_Estado_Venta
INNER JOIN dbo.Usuario u ON v.Id_Usuario = u.Id_Usuario
ORDER BY v.Id_Venta DESC;

-- 2. Factura Oficial con Clave Numérica de exactamente 50 dígitos (Ley 9635 DGT):
SELECT TOP 1 
    f.Id_Factura,
    f.Clave_Numerica_Fiscal,
    LEN(f.Clave_Numerica_Fiscal) AS Longitud_Clave_Hacienda, -- Debe ser exactamente 50
    f.Monto_Total,
    f.Saldo_Pendiente,
    ef.Nombre_Estado AS Estado_Factura
FROM dbo.Factura f
INNER JOIN dbo.Estado_Factura ef ON f.Id_Estado_Factura = ef.Id_Estado_Factura
ORDER BY f.Id_Factura DESC;

-- 3. Recibo financiero en dbo.Pago:
SELECT TOP 1 
    p.Id_Pago,
    p.Fecha_Pago,
    p.Monto_Pagado,
    mp.Nombre AS Metodo_Pago,
    p.Numero_Referencia
FROM dbo.Pago p
INNER JOIN dbo.Metodo_Pago mp ON p.Id_Metodo_Pago = mp.Id_Metodo_Pago
ORDER BY p.Id_Pago DESC;

-- 4. Rebajo inmediato de inventario en el Kárdex:
SELECT TOP 1 
    m.Id_Movimiento_Inventario,
    m.Producto,
    m.Tipo_Movimiento,
    m.Cantidad AS Cantidad_Rebajada,
    m.Motivo,
    m.Responsable
FROM dbo.VW_MovimientosInventario m
WHERE m.Naturaleza = 'Salida'
ORDER BY m.Id_Movimiento_Inventario DESC;
GO


-- =========================================================================
-- ETAPA 5: GEISON — AUDITORÍA TRANSVERSAL, SEGURIDAD Y RESPALDO DBA
-- =========================================================================

-- PASO 5.1 (DEMOSTRACIÓN DE AUDITORÍA):
-- Consultar la Bitácora Transversal inmutable almacenada en el Filegroup ME_Auditoria.
-- Demuestra cómo las acciones de Daniel (Cliente), Jose (Compra), Dauren (Ajuste)
-- y Melissa (Venta) quedaron cronológicamente selladas con su usuario responsable.
SELECT TOP 8 
    b.Id_Bitacora,
    b.Fecha_Hora,
    ISNULL(u.Nombre_Usuario, 'admin') AS Operador_Responsable,
    b.Accion,
    b.Tabla_Afectada,
    b.Id_Registro_Afectado,
    b.Descripcion
FROM dbo.Bitacora b
LEFT JOIN dbo.Usuario u ON b.Id_Usuario = u.Id_Usuario
ORDER BY b.Id_Bitacora DESC;

-- PASO 5.2 (ACCIÓN DE GEISON EN EL FRONTEND):
-- 1. Ir a la pantalla "Historial de Actividad" (/auditoria).
-- 2. Demostrar que los registros de la bitácora coinciden exactamente con SSMS.
-- 3. Mostrar la ordenación dinámica por columnas, paginación y descripciones traducidas en colones (₡).

-- PASO 5.3 (ADMINISTRACIÓN DBA EN SSMS):
-- 1. Ejecutar Backup Diferencial en caliente para salvaguardar las transacciones de la exposición:
EXEC dbo.SP_DBA_EjecutarBackupDiferencial;

-- 2. Consultar el historial de respaldos en MSDB:
EXEC dbo.SP_DBA_ConsultarHistorialBackups;

-- 3. Monitorear los 5 Filegroups demostrando la arquitectura Tiered Storage:
EXEC dbo.SP_DBA_MonitorearEspacioArchivos;
GO


-- =========================================================================
-- ETAPA 6: SAMIR — DATA WAREHOUSE, ORQUESTACIÓN ETL Y ANALÍTICA BI
-- =========================================================================

-- PASO 6.1 (ANTES): Consultar el estado de FactVentas antes de disparar el pipeline
SELECT 
    COUNT(*) AS Total_Ventas_En_DW,
    ISNULL(SUM(Monto_Total), 0) AS Total_Colones_Consolidados_DW
FROM dw.FactVentas;

-- PASO 6.2 (ACCIÓN DE SAMIR EN EL FRONTEND):
-- 1. Entrar a "Métricas y Estadísticas" / "Business Intelligence" (/bi).
-- 2. Mostrar los paneles analíticos interactivos y KPIs de venta diaria y abastecimiento.

-- PASO 6.3 (ORQUESTACIÓN ETL EN SSMS):
-- 1. Disparar el pipeline Kimball que extrae las transacciones de Daniel, Jose, Dauren y Melissa:
EXEC dbo.SP_ETL_OrquestarCargaCompleta;

-- 2. Certificar la Conciliación Matemática (Auditoría OLTP vs DW: CERO discrepancias):
EXEC dbo.SP_ETL_ValidarConciliacionCargas;

-- 3. Mostrar la venta procesada por Melissa ya integrada en el repositorio analítico:
SELECT TOP 1 
    Id_Venta,
    Sk_Fecha,
    Sk_Cliente,
    Sk_Vendedor,
    Subtotal,
    Impuesto,
    Monto_Total
FROM dw.FactVentas
ORDER BY Id_Venta DESC;

-- 4. Demostrar el SCD Tipo 2 (Slowly Changing Dimensions) en DimCliente:
SELECT TOP 3 
    Sk_Cliente,
    Id_Cliente,
    Nombre_Completo,
    Estado_Operacional,
    Fecha_Inicio,
    Fecha_Fin,
    Es_Actual
FROM dw.DimCliente
ORDER BY Id_Cliente, Sk_Cliente;
GO

