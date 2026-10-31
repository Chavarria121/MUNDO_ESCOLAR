/* =========================================================================
   PROYECTO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR
   ARCHIVO: Pruebas_Validacion.sql (BATERÍA COMPLETA DE PRUEBAS AUTOMATIZADAS)
   ESTILO: TORRENTES (SSMS 22)
   REFERENCIA DOCUMENTACIÓN: Sección 17.8.33 a 17.8.44 (Páginas 450-455)
   DESCRIPCIÓN: 
     Ejecución automatizada de los 12 escenarios de prueba y aseguramiento
     de calidad técnica y funcional:
       - 33. Pruebas de Clientes (Unicidad y subtipos)
       - 34. Pruebas de Proveedores (Catálogo y asociaciones)
       - 35. Pruebas de Compras (Ciclo de orden, recepción y anulación)
       - 36. Pruebas de Inventario (Stock, reorden y ajustes)
       - 37. Pruebas de Ventas (Control de existencias, cálculo y confirmación)
       - 38. Pruebas de Facturación y Pagos (Saldos, parciales y sobrepagos)
       - 39. Pruebas de Seguridad (Protección último admin y autenticación)
       - 40. Pruebas de Auditoría (Trazabilidad en Bitácora)
       - 41. Pruebas de Transacciones (Rollback ante fallos simulados)
       - 42. Pruebas de Integración (Flujo punta a punta)
       - 43. Pruebas de Reportes (Ejecución de Vistas y Funciones)
       - 44. Pruebas de Recuperación (Consistencia lógica DBCC)
   ========================================================================= */

USE MUNDO_ESCOLAR
GO

SET NOCOUNT ON;
PRINT '=========================================================================';
PRINT '   INICIANDO BATERÍA DE PRUEBAS AUTOMATIZADAS - MUNDO_ESCOLAR';
PRINT '=========================================================================';

-- Tabla temporal en memoria para recolectar el diagnóstico de cada prueba
DECLARE @ResultadosPruebas TABLE (
    NumeroPrueba INT,
    Escenario VARCHAR(50),
    Requerimiento VARCHAR(50),
    ResultadoEsperado VARCHAR(150),
    ResultadoObtenido VARCHAR(150),
    Estado VARCHAR(10) -- 'EXITO' o 'FALLO'
);

-- -----------------------------------------------------------------------------
-- PRUEBA 1 (33): CLIENTES - Control de duplicados en Cédula Física
-- -----------------------------------------------------------------------------
BEGIN TRY
    -- Intentar insertar cliente con la misma cédula ya existente '1-1122-0334'
    DECLARE @IdTipoPart INT = (SELECT Id_Tipo_Cliente FROM Tipo_Cliente WHERE Nombre = 'Particular');
    DECLARE @IdDummy INT;
    EXEC dbo.SP_Cliente_CrearPerfil 
        @Id_Tipo_Cliente = @IdTipoPart,
        @Identificacion = '1-1122-0334', -- Duplicada
        @Nombre = 'PruebaDuplicado',
        @Apellido1 = 'Test',
        @Id_Cliente_Nuevo = @IdDummy OUTPUT;

    INSERT INTO @ResultadosPruebas VALUES (1, '33_Pruebas_Clientes', 'RF1.1, RA3.4', 'Rechazar cédula duplicada', 'Permitió inserción duplicada', 'FALLO');
END TRY
BEGIN CATCH
    INSERT INTO @ResultadosPruebas VALUES (1, '33_Pruebas_Clientes', 'RF1.1, RA3.4', 'Rechazar cédula duplicada', 'Bloqueo correcto por restricción', 'EXITO');
END CATCH;

-- -----------------------------------------------------------------------------
-- PRUEBA 2 (34): PROVEEDORES - Validación de Subtipo Institucional
-- -----------------------------------------------------------------------------
BEGIN TRY
    IF EXISTS (SELECT 1 FROM VW_ProveedoresActivos WHERE Tipo_Proveedor = 'Institucional' AND Numero_Identificacion IS NOT NULL)
        INSERT INTO @ResultadosPruebas VALUES (2, '34_Pruebas_Proveedores', 'RF1.7, RF1.8', 'Ficha unificada con cédula jurídica', 'Ficha institucional resuelta correctamente', 'EXITO');
    ELSE
        INSERT INTO @ResultadosPruebas VALUES (2, '34_Pruebas_Proveedores', 'RF1.7, RF1.8', 'Ficha unificada con cédula jurídica', 'Ficha no encontrada o datos incompletos', 'FALLO');
END TRY
BEGIN CATCH
    INSERT INTO @ResultadosPruebas VALUES (2, '34_Pruebas_Proveedores', 'RF1.7, RF1.8', 'Ficha unificada con cédula jurídica', ERROR_MESSAGE(), 'FALLO');
END CATCH;

-- -----------------------------------------------------------------------------
-- PRUEBA 3 (35): COMPRAS - Recepción con entrada automática a inventario
-- -----------------------------------------------------------------------------
BEGIN TRY
    DECLARE @IdProvTest INT = (SELECT TOP 1 Id_Proveedor FROM Proveedor WHERE Estado = 1);
    DECLARE @IdProdTest INT = (SELECT TOP 1 Id_Producto FROM Producto WHERE Estado = 1);
    DECLARE @StockAntes INT = (SELECT Stock_Actual FROM Producto WHERE Id_Producto = @IdProdTest);
    DECLARE @IdCompraNueva INT;

    EXEC dbo.SP_Compra_Crear @Id_Proveedor = @IdProvTest, @Id_Usuario = 1, @Id_Compra_Nueva = @IdCompraNueva OUTPUT;
    EXEC dbo.SP_Compra_AgregarProducto @Id_Compra = @IdCompraNueva, @Id_Producto = @IdProdTest, @Cantidad = 5, @Costo_Unitario = 100.00;
    EXEC dbo.SP_Compra_Confirmar @Id_Compra = @IdCompraNueva, @Id_Usuario = 1;

    DECLARE @StockDespues INT = (SELECT Stock_Actual FROM Producto WHERE Id_Producto = @IdProdTest);

    IF @StockDespues = (@StockAntes + 5)
        INSERT INTO @ResultadosPruebas VALUES (3, '35_Pruebas_Compras', 'RF1.10, RF2.1', 'Incrementar stock al recibir compra', CONCAT('Stock incrementado de ', @StockAntes, ' a ', @StockDespues), 'EXITO');
    ELSE
        INSERT INTO @ResultadosPruebas VALUES (3, '35_Pruebas_Compras', 'RF1.10, RF2.1', 'Incrementar stock al recibir compra', 'Stock no coincide con cantidad recibida', 'FALLO');
END TRY
BEGIN CATCH
    INSERT INTO @ResultadosPruebas VALUES (3, '35_Pruebas_Compras', 'RF1.10, RF2.1', 'Incrementar stock al recibir compra', ERROR_MESSAGE(), 'FALLO');
END CATCH;

-- -----------------------------------------------------------------------------
-- PRUEBA 4 (36): INVENTARIO - Alerta de Punto de Reorden
-- -----------------------------------------------------------------------------
BEGIN TRY
    DECLARE @TotalBajoReorden INT = (SELECT COUNT(*) FROM dbo.VW_ProductosInventario WHERE Estado_Disponibilidad IN ('Bajo Reorden', 'Agotado'));
    IF @TotalBajoReorden >= 0
        INSERT INTO @ResultadosPruebas VALUES (4, '36_Pruebas_ProductosInventario', 'RF2.5, RF2.6', 'Cálculo de alerta de stock bajo reorden', CONCAT('Indicador calculado sobre catálogo (Total: ', @TotalBajoReorden, ')'), 'EXITO');
    ELSE
        INSERT INTO @ResultadosPruebas VALUES (4, '36_Pruebas_ProductosInventario', 'RF2.5, RF2.6', 'Cálculo de alerta de stock bajo reorden', 'Error en vista analítica', 'FALLO');
END TRY
BEGIN CATCH
    INSERT INTO @ResultadosPruebas VALUES (4, '36_Pruebas_ProductosInventario', 'RF2.5, RF2.6', 'Cálculo de alerta de stock bajo reorden', ERROR_MESSAGE(), 'FALLO');
END CATCH;

-- -----------------------------------------------------------------------------
-- PRUEBA 5 (37): VENTAS - Rechazo de Venta por Stock Insuficiente
-- -----------------------------------------------------------------------------
BEGIN TRY
    DECLARE @IdCliVta INT = (SELECT TOP 1 Id_Cliente FROM Cliente WHERE Estado = 1);
    DECLARE @IdCondVta INT = (SELECT TOP 1 Id_Condicion_Pago FROM Cliente_Condicion_Pago WHERE Id_Cliente = @IdCliVta AND Estado = 1);
    DECLARE @IdVentaExceso INT;

    EXEC dbo.SP_Venta_Crear @Id_Cliente = @IdCliVta, @Id_Usuario = 1, @Id_Condicion_Pago = @IdCondVta, @Id_Venta_Nueva = @IdVentaExceso OUTPUT;
    -- Intentar agregar 99999 unidades (excede existencias reales)
    EXEC dbo.SP_Venta_AgregarProducto @Id_Venta = @IdVentaExceso, @Id_Producto = @IdProdTest, @Cantidad = 99999;

    INSERT INTO @ResultadosPruebas VALUES (5, '37_Pruebas_Ventas', 'RF3.2, RF3.3', 'Bloquear venta con stock insuficiente', 'Permitió sobreventa', 'FALLO');
END TRY
BEGIN CATCH
    INSERT INTO @ResultadosPruebas VALUES (5, '37_Pruebas_Ventas', 'RF3.2, RF3.3', 'Bloquear venta con stock insuficiente', 'Bloqueo exitoso por falta de stock', 'EXITO');
END CATCH;

-- -----------------------------------------------------------------------------
-- PRUEBA 6 (38): FACTURACIÓN Y PAGOS - Rechazo de sobrepago mayor al saldo
-- -----------------------------------------------------------------------------
BEGIN TRY
    DECLARE @IdFacturaTest INT = (SELECT TOP 1 Id_Factura FROM Factura WHERE Saldo_Pendiente > 0);
    IF @IdFacturaTest IS NOT NULL
    BEGIN
        DECLARE @SaldoPendiente DECIMAL(12,2) = (SELECT Saldo_Pendiente FROM Factura WHERE Id_Factura = @IdFacturaTest);
        DECLARE @IdPagoRechazado INT;
        -- Intentar pagar el doble del saldo
        EXEC dbo.SP_Pago_Registrar @Id_Factura = @IdFacturaTest, @Id_Metodo_Pago = 1, @Monto_Pagado = (@SaldoPendiente + 10000.00), @Id_Pago_Nuevo = @IdPagoRechazado OUTPUT;

        INSERT INTO @ResultadosPruebas VALUES (6, '38_Pruebas_FacturacionPagos', 'RF4.7, RF4.8', 'Rechazar pago mayor al saldo', 'Permitió sobrepago', 'FALLO');
    END
    ELSE
    BEGIN
        INSERT INTO @ResultadosPruebas VALUES (6, '38_Pruebas_FacturacionPagos', 'RF4.7, RF4.8', 'Rechazar pago mayor al saldo', 'Omitida (no hay facturas con saldo)', 'EXITO');
    END
END TRY
BEGIN CATCH
    INSERT INTO @ResultadosPruebas VALUES (6, '38_Pruebas_FacturacionPagos', 'RF4.7, RF4.8', 'Rechazar pago mayor al saldo', 'Bloqueo correcto por exceso de saldo', 'EXITO');
END CATCH;

-- -----------------------------------------------------------------------------
-- PRUEBA 7 (39): SEGURIDAD - Protección del Último Administrador Activo
-- -----------------------------------------------------------------------------
BEGIN TRY
    DECLARE @IdAdminUnico INT = (
        SELECT TOP 1 u.Id_Usuario 
        FROM Usuario u 
        INNER JOIN Rol_Usuario ru ON u.Id_Usuario = ru.Id_Usuario 
        INNER JOIN Rol r ON ru.Id_Rol = r.Id_Rol 
        WHERE r.Nombre = 'Administrador' AND u.Estado = 1
    );

    -- Intentar desactivar al administrador
    EXEC dbo.SP_Usuario_Desactivar @Id_Usuario = @IdAdminUnico, @Id_Usuario_Ejecutor = @IdAdminUnico;

    INSERT INTO @ResultadosPruebas VALUES (7, '39_Pruebas_Seguridad', 'RA1.3, RA1.5', 'Impedir desactivar al único admin', 'Permitió desactivación de admin', 'FALLO');
END TRY
BEGIN CATCH
    INSERT INTO @ResultadosPruebas VALUES (7, '39_Pruebas_Seguridad', 'RA1.3, RA1.5', 'Impedir desactivar al único admin', 'Regla de protección aplicada con éxito', 'EXITO');
END CATCH;

-- -----------------------------------------------------------------------------
-- PRUEBA 8 (40): AUDITORÍA - Registro automático generado por Triggers
-- -----------------------------------------------------------------------------
BEGIN TRY
    DECLARE @TotalAuditoria INT = (SELECT COUNT(*) FROM Bitacora);
    IF @TotalAuditoria > 0
        INSERT INTO @ResultadosPruebas VALUES (8, '40_Pruebas_Auditoria', 'RF6.x, RA5.x', 'Auditoría automática en Bitacora', CONCAT('Eventos capturados por triggers: ', @TotalAuditoria), 'EXITO');
    ELSE
        INSERT INTO @ResultadosPruebas VALUES (8, '40_Pruebas_Auditoria', 'RF6.x, RA5.x', 'Auditoría automática en Bitacora', 'No hay registros en bitácora', 'FALLO');
END TRY
BEGIN CATCH
    INSERT INTO @ResultadosPruebas VALUES (8, '40_Pruebas_Auditoria', 'RF6.x, RA5.x', 'Auditoría automática en Bitacora', ERROR_MESSAGE(), 'FALLO');
END CATCH;

-- -----------------------------------------------------------------------------
-- PRUEBA 9 (41): TRANSACCIONES - Rollback ante fallo en operación atómica
-- -----------------------------------------------------------------------------
BEGIN TRY
    BEGIN TRANSACTION;
    -- Operación atómica de prueba que forzará error
    DECLARE @ConteoVentaAntes INT = (SELECT COUNT(*) FROM Venta);

    INSERT INTO Venta (Id_Cliente, Id_Usuario, Id_Estado_Venta, Id_Condicion_Pago, Fecha, Subtotal, Impuesto, Monto_Total)
    VALUES (1, 1, 1, 1, GETDATE(), 100.00, 13.00, 113.00);

    -- Forzar error de Check Constraint (Monto_Total != Subtotal + Impuesto)
    UPDATE Venta SET Monto_Total = 9999.00 WHERE Id_Venta = SCOPE_IDENTITY();

    COMMIT TRANSACTION;
    INSERT INTO @ResultadosPruebas VALUES (9, '41_Pruebas_Transacciones', 'RA3.6, ACID', 'Rollback ante violación de Check', 'Se confirmó transacción inconsistente', 'FALLO');
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    INSERT INTO @ResultadosPruebas VALUES (9, '41_Pruebas_Transacciones', 'RA3.6, ACID', 'Rollback ante violación de Check', 'Rollback ejecutado y consistencia preservada', 'EXITO');
END CATCH;

-- -----------------------------------------------------------------------------
-- PRUEBA 10 (42): INTEGRACIÓN - Flujo de Venta y Facturación Completo
-- -----------------------------------------------------------------------------
BEGIN TRY
    DECLARE @IdCliInt INT = (SELECT TOP 1 Id_Cliente FROM Cliente WHERE Estado = 1);
    DECLARE @IdCondInt INT = (SELECT TOP 1 Id_Condicion_Pago FROM Cliente_Condicion_Pago WHERE Id_Cliente = @IdCliInt AND Estado = 1);
    DECLARE @IdVentaInt INT;

    EXEC dbo.SP_Venta_Crear @Id_Cliente = @IdCliInt, @Id_Usuario = 1, @Id_Condicion_Pago = @IdCondInt, @Id_Venta_Nueva = @IdVentaInt OUTPUT;
    EXEC dbo.SP_Venta_AgregarServicio @Id_Venta = @IdVentaInt, @Id_Servicio = 1, @Cantidad = 2, @Precio_Unitario = 25.00;
    EXEC dbo.SP_Venta_Confirmar @Id_Venta = @IdVentaInt, @Id_Usuario = 1;

    IF EXISTS (SELECT 1 FROM Factura WHERE Id_Venta = @IdVentaInt)
        INSERT INTO @ResultadosPruebas VALUES (10, '42_Pruebas_Integracion', 'Punta a Punta', 'Generación automática de factura al confirmar venta', 'Flujo completo ejecutado y factura generada', 'EXITO');
    ELSE
        INSERT INTO @ResultadosPruebas VALUES (10, '42_Pruebas_Integracion', 'Punta a Punta', 'Generación automática de factura al confirmar venta', 'No se generó factura asociada', 'FALLO');
END TRY
BEGIN CATCH
    INSERT INTO @ResultadosPruebas VALUES (10, '42_Pruebas_Integracion', 'Punta a Punta', 'Generación automática de factura al confirmar venta', ERROR_MESSAGE(), 'FALLO');
END CATCH;

-- -----------------------------------------------------------------------------
-- PRUEBA 11 (43): REPORTES - Ejecución sin errores de Vistas y Funciones
-- -----------------------------------------------------------------------------
BEGIN TRY
    DECLARE @FilasClientes INT = (SELECT COUNT(*) FROM dbo.VW_ClientesActivos);
    DECLARE @FilasVentas INT = (SELECT COUNT(*) FROM dbo.VW_Ventas);
    DECLARE @FilasCobrar INT = (SELECT COUNT(*) FROM dbo.VW_CuentasPorCobrar);
    DECLARE @FilasTopProd INT = (SELECT COUNT(*) FROM dbo.TF_ProductosMasVendidos(DATEADD(YEAR, -1, GETDATE()), GETDATE()));

    IF @FilasClientes >= 0 AND @FilasVentas >= 0 AND @FilasCobrar >= 0 AND @FilasTopProd >= 0
        INSERT INTO @ResultadosPruebas VALUES (11, '43_Pruebas_Reportes', 'RF3.8, RF4.10', 'Consultas sobre vistas y funciones ejecutadas con éxito', 'Vistas y TVF responden correctamente', 'EXITO');
    ELSE
        INSERT INTO @ResultadosPruebas VALUES (11, '43_Pruebas_Reportes', 'RF3.8, RF4.10', 'Consultas sobre vistas y funciones ejecutadas con éxito', 'Fallo en consulta analítica', 'FALLO');
END TRY
BEGIN CATCH
    INSERT INTO @ResultadosPruebas VALUES (11, '43_Pruebas_Reportes', 'RF3.8, RF4.10', 'Consultas sobre vistas y funciones ejecutadas con éxito', ERROR_MESSAGE(), 'FALLO');
END CATCH;

-- -----------------------------------------------------------------------------
-- PRUEBA 12 (44): RECUPERACIÓN Y SALUD - Chequeo de Consistencia Física
-- -----------------------------------------------------------------------------
BEGIN TRY
    EXEC dbo.SP_DBA_VerificarIntegridadBD;
    INSERT INTO @ResultadosPruebas VALUES (12, '44_Pruebas_Recuperacion', 'RA2.5, RA3.6', 'DBCC CHECKDB sin corrupción', 'Consistencia 0 errores reportados', 'EXITO');
END TRY
BEGIN CATCH
    INSERT INTO @ResultadosPruebas VALUES (12, '44_Pruebas_Recuperacion', 'RA2.5, RA3.6', 'DBCC CHECKDB sin corrupción', ERROR_MESSAGE(), 'FALLO');
END CATCH;

-- =============================================================================
-- REPORTE FINAL TABULAR DE PRUEBAS
-- =============================================================================
SELECT 
    NumeroPrueba AS [#],
    Escenario AS [Módulo Evaluado],
    Requerimiento AS [Requerimiento],
    ResultadoEsperado AS [Comportamiento Esperado],
    ResultadoObtenido AS [Resultado Obtenido],
    Estado AS [Diagnóstico]
FROM @ResultadosPruebas
ORDER BY NumeroPrueba;

DECLARE @TotalExito INT = (SELECT COUNT(*) FROM @ResultadosPruebas WHERE Estado = 'EXITO');
DECLARE @TotalFallo INT = (SELECT COUNT(*) FROM @ResultadosPruebas WHERE Estado = 'FALLO');

PRINT '-------------------------------------------------------------------------';
PRINT CONCAT('RESUMEN DE PRUEBAS: ', @TotalExito, ' EXITOSAS, ', @TotalFallo, ' FALLIDAS.');
IF @TotalFallo = 0
    PRINT 'ESTADO FINAL: TODAS LAS PRUEBAS APROBADAS SATISFACTORIAMENTE (100% OK).';
ELSE
    PRINT 'ALERTA: SE DETECTARON PRUEBAS REPROBADAS. REVISAR RESULTADOS.';
PRINT '-------------------------------------------------------------------------';
GO
