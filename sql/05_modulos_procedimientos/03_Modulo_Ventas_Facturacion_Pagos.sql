/* =========================================================================
   PROYECTO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR
   MODULO: MÓDULO 3: VENTAS, FACTURACIÓN ELECTRÓNICA Y PAGOS
   DESCRIPCIÓN: Punto de Venta (POS), Facturación Electrónica con Clave DGT 50 dígitos, Recaudación y CxC
   TOTAL PROCEDIMIENTOS: 16
   USO EN EXPOSICIÓN: Pestaña temática lista para ejecución y demostración en SSMS 22.
   ========================================================================= */

USE MUNDO_ESCOLAR;
GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

-- 38. SP_Venta_Crear
CREATE OR ALTER PROCEDURE dbo.SP_Venta_Crear
    @Id_Cliente INT,
    @Id_Usuario INT,
    @Id_Condicion_Pago INT,
    @Id_Venta_Nueva INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Cliente WHERE Id_Cliente = @Id_Cliente AND Estado = 1)
            THROW 50170, 'El cliente no existe o está inactivo.', 1;
        IF NOT EXISTS (SELECT 1 FROM Usuario WHERE Id_Usuario = @Id_Usuario AND Estado = 1)
            THROW 50171, 'El usuario vendedor no existe o está inactivo.', 1;
        IF NOT EXISTS (
            SELECT 1 FROM Cliente_Condicion_Pago 
            WHERE Id_Cliente = @Id_Cliente AND Id_Condicion_Pago = @Id_Condicion_Pago AND Estado = 1
        )
            THROW 50172, 'La condición de pago seleccionada no está autorizada para este cliente.', 1;

        DECLARE @IdEstadoPendiente INT = (SELECT Id_Estado_Venta FROM Estado_Venta WHERE Nombre_Estado = 'Pendiente');

        INSERT INTO Venta (Id_Cliente, Id_Usuario, Id_Estado_Venta, Id_Condicion_Pago, Fecha, Subtotal, Impuesto, Monto_Total)
        VALUES (@Id_Cliente, @Id_Usuario, @IdEstadoPendiente, @Id_Condicion_Pago, GETDATE(), 0.00, 0.00, 0.00);

        SET @Id_Venta_Nueva = SCOPE_IDENTITY();
        SELECT @Id_Venta_Nueva AS Id_Venta, 'Borrador de venta inicializado con éxito.' AS Mensaje;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 39. SP_Venta_AgregarProducto
CREATE OR ALTER PROCEDURE dbo.SP_Venta_AgregarProducto
    @Id_Venta INT,
    @Id_Producto INT,
    @Cantidad INT,
    @Precio_Unitario DECIMAL(12, 2) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @EstadoVenta VARCHAR(20);
        SELECT @EstadoVenta = ev.Nombre_Estado
        FROM Venta v
        INNER JOIN Estado_Venta ev ON v.Id_Estado_Venta = ev.Id_Estado_Venta
        WHERE v.Id_Venta = @Id_Venta;

        IF @EstadoVenta IS NULL
            THROW 50175, 'La venta no existe.', 1;
        IF @EstadoVenta <> 'Pendiente'
            THROW 50176, 'Solo se pueden agregar productos a ventas en estado Pendiente.', 1;
        IF @Cantidad <= 0
            THROW 50177, 'La cantidad debe ser mayor a cero.', 1;

        -- Validar existencia y stock disponible
        DECLARE @StockActual INT, @PrecioCatalogo DECIMAL(12, 2);
        SELECT @StockActual = Stock_Actual, @PrecioCatalogo = Precio_Venta
        FROM Producto WHERE Id_Producto = @Id_Producto AND Estado = 1;

        IF @StockActual IS NULL
            THROW 50178, 'El producto no existe o está inactivo.', 1;

        DECLARE @CantidadPrevia INT = ISNULL((SELECT Cantidad FROM Venta_Producto WHERE Id_Venta = @Id_Venta AND Id_Producto = @Id_Producto), 0);
        IF (@StockActual < (@CantidadPrevia + @Cantidad))
            THROW 50179, 'Stock insuficiente en bodega para cubrir la cantidad solicitada.', 1;

        IF @Precio_Unitario IS NULL OR @Precio_Unitario < 0.00
            SET @Precio_Unitario = @PrecioCatalogo;

        DECLARE @Subtotal DECIMAL(12, 2) = dbo.FN_CalcularSubtotalDetalle(@Cantidad, @Precio_Unitario);

        IF EXISTS (SELECT 1 FROM Venta_Producto WHERE Id_Venta = @Id_Venta AND Id_Producto = @Id_Producto)
        BEGIN
            UPDATE Venta_Producto
            SET Cantidad = Cantidad + @Cantidad,
                Precio_Unitario = @Precio_Unitario,
                Subtotal = dbo.FN_CalcularSubtotalDetalle(Cantidad + @Cantidad, @Precio_Unitario)
            WHERE Id_Venta = @Id_Venta AND Id_Producto = @Id_Producto;
        END
        ELSE
        BEGIN
            INSERT INTO Venta_Producto (Id_Producto, Id_Venta, Cantidad, Precio_Unitario, Subtotal)
            VALUES (@Id_Producto, @Id_Venta, @Cantidad, @Precio_Unitario, @Subtotal);
        END

        -- Recalcular totales de venta
        EXEC dbo.SP_Venta_CalcularTotales @Id_Venta;

        SELECT 'Producto agregado a la venta correctamente.' AS Mensaje;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 40. SP_Venta_AgregarServicio
CREATE OR ALTER PROCEDURE dbo.SP_Venta_AgregarServicio
    @Id_Venta INT,
    @Id_Servicio INT,
    @Cantidad INT,
    @Precio_Unitario DECIMAL(12, 2) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @EstadoVenta VARCHAR(20);
        SELECT @EstadoVenta = ev.Nombre_Estado
        FROM Venta v
        INNER JOIN Estado_Venta ev ON v.Id_Estado_Venta = ev.Id_Estado_Venta
        WHERE v.Id_Venta = @Id_Venta;

        IF @EstadoVenta IS NULL
            THROW 50180, 'La venta no existe.', 1;
        IF @EstadoVenta <> 'Pendiente'
            THROW 50181, 'Solo se pueden agregar servicios a ventas en estado Pendiente.', 1;
        IF @Cantidad <= 0
            THROW 50182, 'La cantidad de servicios debe ser mayor a cero.', 1;

        DECLARE @PrecioBase DECIMAL(12, 2);
        SELECT @PrecioBase = Precio_Base FROM Servicio WHERE Id_Servicio = @Id_Servicio AND Estado = 1;
        IF @PrecioBase IS NULL
            THROW 50183, 'El servicio no existe o se encuentra inactivo.', 1;

        IF @Precio_Unitario IS NULL OR @Precio_Unitario < 0.00
            SET @Precio_Unitario = @PrecioBase;

        DECLARE @Subtotal DECIMAL(12, 2) = dbo.FN_CalcularSubtotalDetalle(@Cantidad, @Precio_Unitario);

        IF EXISTS (SELECT 1 FROM Venta_Servicio WHERE Id_Venta = @Id_Venta AND Id_Servicio = @Id_Servicio)
        BEGIN
            UPDATE Venta_Servicio
            SET Cantidad = Cantidad + @Cantidad,
                Precio_Unitario = @Precio_Unitario,
                Subtotal = dbo.FN_CalcularSubtotalDetalle(Cantidad + @Cantidad, @Precio_Unitario)
            WHERE Id_Venta = @Id_Venta AND Id_Servicio = @Id_Servicio;
        END
        ELSE
        BEGIN
            INSERT INTO Venta_Servicio (Id_Venta, Id_Servicio, Cantidad, Precio_Unitario, Subtotal)
            VALUES (@Id_Venta, @Id_Servicio, @Cantidad, @Precio_Unitario, @Subtotal);
        END

        EXEC dbo.SP_Venta_CalcularTotales @Id_Venta;
        SELECT 'Servicio agregado a la venta correctamente.' AS Mensaje;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 41. SP_Venta_ModificarDetalle
CREATE OR ALTER PROCEDURE dbo.SP_Venta_ModificarDetalle
    @TipoDetalle VARCHAR(10), -- 'PRODUCTO' o 'SERVICIO'
    @Id_Detalle INT,
    @Cantidad INT,
    @Precio_Unitario DECIMAL(12, 2)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF @Cantidad <= 0 OR @Precio_Unitario < 0.00
            THROW 50185, 'Cantidad debe ser positiva y precio unitario no negativo.', 1;

        DECLARE @IdVenta INT;

        IF UPPER(@TipoDetalle) = 'PRODUCTO'
        BEGIN
            SELECT @IdVenta = Id_Venta FROM Venta_Producto WHERE Id_Venta_Producto = @Id_Detalle;
            IF @IdVenta IS NULL THROW 50186, 'Línea de producto no encontrada.', 1;

            -- Validar estado de la venta
            IF (SELECT ev.Nombre_Estado FROM Venta v INNER JOIN Estado_Venta ev ON v.Id_Estado_Venta = ev.Id_Estado_Venta WHERE v.Id_Venta = @IdVenta) <> 'Pendiente'
                THROW 50187, 'Solo ventas en estado Pendiente pueden ser modificadas.', 1;

            UPDATE Venta_Producto
            SET Cantidad = @Cantidad,
                Precio_Unitario = @Precio_Unitario,
                Subtotal = dbo.FN_CalcularSubtotalDetalle(@Cantidad, @Precio_Unitario)
            WHERE Id_Venta_Producto = @Id_Detalle;
        END
        ELSE IF UPPER(@TipoDetalle) = 'SERVICIO'
        BEGIN
            SELECT @IdVenta = Id_Venta FROM Venta_Servicio WHERE Id_Venta_Servicio = @Id_Detalle;
            IF @IdVenta IS NULL THROW 50188, 'Línea de servicio no encontrada.', 1;

            IF (SELECT ev.Nombre_Estado FROM Venta v INNER JOIN Estado_Venta ev ON v.Id_Estado_Venta = ev.Id_Estado_Venta WHERE v.Id_Venta = @IdVenta) <> 'Pendiente'
                THROW 50189, 'Solo ventas en estado Pendiente pueden ser modificadas.', 1;

            UPDATE Venta_Servicio
            SET Cantidad = @Cantidad,
                Precio_Unitario = @Precio_Unitario,
                Subtotal = dbo.FN_CalcularSubtotalDetalle(@Cantidad, @Precio_Unitario)
            WHERE Id_Venta_Servicio = @Id_Detalle;
        END
        ELSE
            THROW 50190, 'Tipo de detalle no reconocido. Use PRODUCTO o SERVICIO.', 1;

        EXEC dbo.SP_Venta_CalcularTotales @IdVenta;
        SELECT 'Detalle modificado exitosamente.' AS Mensaje;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 42. SP_Venta_EliminarDetalle
CREATE OR ALTER PROCEDURE dbo.SP_Venta_EliminarDetalle
    @TipoDetalle VARCHAR(10),
    @Id_Detalle INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @IdVenta INT;
        IF UPPER(@TipoDetalle) = 'PRODUCTO'
        BEGIN
            SELECT @IdVenta = Id_Venta FROM Venta_Producto WHERE Id_Venta_Producto = @Id_Detalle;
            IF @IdVenta IS NULL THROW 50192, 'Línea no existe.', 1;

            DELETE FROM Venta_Producto WHERE Id_Venta_Producto = @Id_Detalle;
        END
        ELSE IF UPPER(@TipoDetalle) = 'SERVICIO'
        BEGIN
            SELECT @IdVenta = Id_Venta FROM Venta_Servicio WHERE Id_Venta_Servicio = @Id_Detalle;
            IF @IdVenta IS NULL THROW 50193, 'Línea no existe.', 1;

            DELETE FROM Venta_Servicio WHERE Id_Venta_Servicio = @Id_Detalle;
        END
        ELSE
            THROW 50194, 'Tipo no válido.', 1;

        EXEC dbo.SP_Venta_CalcularTotales @IdVenta;
        SELECT 'Línea eliminada de la venta con éxito.' AS Mensaje;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 43. SP_Venta_CalcularTotales
CREATE OR ALTER PROCEDURE dbo.SP_Venta_CalcularTotales
    @Id_Venta INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @SubtotalProd DECIMAL(12, 2) = ISNULL((SELECT SUM(Subtotal) FROM Venta_Producto WHERE Id_Venta = @Id_Venta), 0.00);
        DECLARE @SubtotalServ DECIMAL(12, 2) = ISNULL((SELECT SUM(Subtotal) FROM Venta_Servicio WHERE Id_Venta = @Id_Venta), 0.00);
        DECLARE @SubtotalNeto DECIMAL(12, 2) = @SubtotalProd + @SubtotalServ;
        
        DECLARE @Impuesto DECIMAL(12, 2) = dbo.FN_CalcularImpuesto(@SubtotalNeto, 0.1300);
        DECLARE @Total DECIMAL(12, 2) = dbo.FN_CalcularTotalVenta(@SubtotalNeto, @Impuesto);

        UPDATE Venta
        SET Subtotal = @SubtotalNeto,
            Impuesto = @Impuesto,
            Monto_Total = @Total
        WHERE Id_Venta = @Id_Venta;

        SELECT @Id_Venta AS Id_Venta, @SubtotalNeto AS Subtotal, @Impuesto AS Impuesto, @Total AS Monto_Total;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 44. SP_Venta_Confirmar
CREATE OR ALTER PROCEDURE dbo.SP_Venta_Confirmar
    @Id_Venta INT,
    @Id_Usuario INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @EstadoActual VARCHAR(20);
        SELECT @EstadoActual = ev.Nombre_Estado
        FROM Venta v
        INNER JOIN Estado_Venta ev ON v.Id_Estado_Venta = ev.Id_Estado_Venta
        WHERE v.Id_Venta = @Id_Venta;

        IF @EstadoActual IS NULL
            THROW 50200, 'La venta no existe.', 1;
        IF @EstadoActual <> 'Pendiente'
            THROW 50201, 'Solo ventas en estado Pendiente pueden ser confirmadas.', 1;

        IF NOT EXISTS (SELECT 1 FROM Venta_Producto WHERE Id_Venta = @Id_Venta)
           AND NOT EXISTS (SELECT 1 FROM Venta_Servicio WHERE Id_Venta = @Id_Venta)
            THROW 50202, 'La venta no tiene líneas de detalle registradas.', 1;

        -- Validar existencias suficientes
        IF EXISTS (
            SELECT 1 FROM Venta_Producto vp
            INNER JOIN Producto p ON vp.Id_Producto = p.Id_Producto
            WHERE vp.Id_Venta = @Id_Venta AND p.Stock_Actual < vp.Cantidad
        )
            THROW 50203, 'No se puede confirmar la venta: uno o más productos tienen existencias insuficientes.', 1;

        -- Descontar stock y registrar salidas de inventario
        DECLARE @ProdId INT, @CantVendida INT;
        DECLARE @IdTipoSalida INT = (SELECT Id_Tipo_Movimiento FROM Tipo_Movimiento WHERE Nombre = 'Salida por Venta');

        DECLARE cur_vta CURSOR LOCAL FAST_FORWARD FOR
            SELECT Id_Producto, Cantidad FROM Venta_Producto WHERE Id_Venta = @Id_Venta;

        OPEN cur_vta;
        FETCH NEXT FROM cur_vta INTO @ProdId, @CantVendida;
        WHILE @@FETCH_STATUS = 0
        BEGIN
            UPDATE Producto SET Stock_Actual = Stock_Actual - @CantVendida WHERE Id_Producto = @ProdId;

            INSERT INTO Movimiento_Inventario (Id_Producto, Id_Tipo_Movimiento, Id_Usuario, Cantidad, Fecha, Motivo)
            VALUES (@ProdId, @IdTipoSalida, @Id_Usuario, @CantVendida, GETDATE(), CONCAT('Salida por Venta #', @Id_Venta));

            FETCH NEXT FROM cur_vta INTO @ProdId, @CantVendida;
        END
        CLOSE cur_vta;
        DEALLOCATE cur_vta;

        -- Actualizar estado a Confirmada
        DECLARE @IdEstadoConf INT = (SELECT Id_Estado_Venta FROM Estado_Venta WHERE Nombre_Estado = 'Confirmada');
        UPDATE Venta 
        SET Id_Estado_Venta = @IdEstadoConf,
            Fecha = GETDATE()
        WHERE Id_Venta = @Id_Venta;

        -- Generar automáticamente factura asociada
        DECLARE @IdFacturaNueva INT;
        EXEC dbo.SP_Factura_Generar @Id_Venta = @Id_Venta, @Id_Factura_Nueva = @IdFacturaNueva OUTPUT;

        COMMIT TRANSACTION;
        SELECT @Id_Venta AS Id_Venta, @IdFacturaNueva AS Id_Factura, 'Venta confirmada, stock rebajado y factura generada con éxito.' AS Mensaje;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- 45. SP_Venta_Consultar
CREATE OR ALTER PROCEDURE dbo.SP_Venta_Consultar
    @Id_Venta INT = NULL,
    @FechaInicio DATETIME = NULL,
    @FechaFin DATETIME = NULL,
    @Id_Cliente INT = NULL,
    @Id_Estado_Venta INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
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
        END AS Cliente,
        u.Nombre_Usuario AS Vendedor,
        cpago.Nombre AS Condicion_Pago,
        v.Subtotal,
        v.Impuesto,
        v.Monto_Total,
        f.Id_Factura,
        ef.Nombre_Estado AS Estado_Factura,
        f.Saldo_Pendiente
    FROM Venta v
    INNER JOIN Estado_Venta ev ON v.Id_Estado_Venta = ev.Id_Estado_Venta
    INNER JOIN Condicion_Pago cpago ON v.Id_Condicion_Pago = cpago.Id_Condicion_Pago
    INNER JOIN Usuario u ON v.Id_Usuario = u.Id_Usuario
    INNER JOIN Cliente c ON v.Id_Cliente = c.Id_Cliente
    INNER JOIN Tipo_Cliente tc ON c.Id_Tipo_Cliente = tc.Id_Tipo_Cliente
    LEFT JOIN Cliente_Particular cp ON c.Id_Cliente = cp.Id_Cliente
    LEFT JOIN Cliente_Institucional ci ON c.Id_Cliente = ci.Id_Cliente
    LEFT JOIN Factura f ON v.Id_Venta = f.Id_Venta
    LEFT JOIN Estado_Factura ef ON f.Id_Estado_Factura = ef.Id_Estado_Factura
    WHERE (@Id_Venta IS NULL OR v.Id_Venta = @Id_Venta)
      AND (@FechaInicio IS NULL OR v.Fecha >= @FechaInicio)
      AND (@FechaFin IS NULL OR v.Fecha <= @FechaFin)
      AND (@Id_Cliente IS NULL OR v.Id_Cliente = @Id_Cliente)
      AND (@Id_Estado_Venta IS NULL OR v.Id_Estado_Venta = @Id_Estado_Venta)
    ORDER BY v.Fecha DESC;
END;
GO

-- 46. SP_Venta_Anular
CREATE OR ALTER PROCEDURE dbo.SP_Venta_Anular
    @Id_Venta INT,
    @Id_Usuario INT,
    @Motivo VARCHAR(150)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @EstadoActual VARCHAR(20);
        SELECT @EstadoActual = ev.Nombre_Estado 
        FROM Venta v 
        INNER JOIN Estado_Venta ev ON v.Id_Estado_Venta = ev.Id_Estado_Venta 
        WHERE v.Id_Venta = @Id_Venta;

        IF @EstadoActual IS NULL
            THROW 50210, 'La venta no existe.', 1;
        IF @EstadoActual = 'Anulada'
            THROW 50211, 'La venta ya se encuentra anulada.', 1;

        -- Reintegrar stock si estaba confirmada
        IF @EstadoActual = 'Confirmada'
        BEGIN
            DECLARE @IdTipoDevolucion INT = (SELECT Id_Tipo_Movimiento FROM Tipo_Movimiento WHERE Nombre = 'Devolución de Cliente');
            DECLARE @ProdAnul INT, @CantAnul INT;

            DECLARE cur_anul CURSOR LOCAL FAST_FORWARD FOR
                SELECT Id_Producto, Cantidad FROM Venta_Producto WHERE Id_Venta = @Id_Venta;

            OPEN cur_anul;
            FETCH NEXT FROM cur_anul INTO @ProdAnul, @CantAnul;
            WHILE @@FETCH_STATUS = 0
            BEGIN
                UPDATE Producto SET Stock_Actual = Stock_Actual + @CantAnul WHERE Id_Producto = @ProdAnul;

                INSERT INTO Movimiento_Inventario (Id_Producto, Id_Tipo_Movimiento, Id_Usuario, Cantidad, Fecha, Motivo)
                VALUES (@ProdAnul, @IdTipoDevolucion, @Id_Usuario, @CantAnul, GETDATE(), CONCAT('Reingreso por Anulación Venta #', @Id_Venta, ': ', @Motivo));

                FETCH NEXT FROM cur_anul INTO @ProdAnul, @CantAnul;
            END
            CLOSE cur_anul;
            DEALLOCATE cur_anul;

            -- Anular factura y pagos asociados
            DECLARE @IdFactura INT = (SELECT Id_Factura FROM Factura WHERE Id_Venta = @Id_Venta);
            IF @IdFactura IS NOT NULL
            BEGIN
                EXEC dbo.SP_Factura_Anular @IdFactura, @Id_Usuario, @Motivo;
            END
        END

        DECLARE @IdEstadoAnulada INT = (SELECT Id_Estado_Venta FROM Estado_Venta WHERE Nombre_Estado = 'Anulada');
        UPDATE Venta SET Id_Estado_Venta = @IdEstadoAnulada WHERE Id_Venta = @Id_Venta;

        COMMIT TRANSACTION;
        SELECT @Id_Venta AS Id_Venta, 'Venta anulada y stock retornado a bodega exitosamente.' AS Mensaje;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- =========================================================================
-- MÓDULO 7: FACTURACIÓN, PAGOS Y CUENTAS POR COBRAR (SPs 47 a 53)
-- =========================================================================

-- 47. SP_Factura_Generar (I-10 / F6: Clave Numérica Fiscal DGT Simulada)
CREATE OR ALTER PROCEDURE dbo.SP_Factura_Generar
    @Id_Venta INT,
    @Id_Factura_Nueva INT OUTPUT,
    @Clave_Numerica_Fiscal VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF EXISTS (SELECT 1 FROM Factura WHERE Id_Venta = @Id_Venta)
        BEGIN
            SET @Id_Factura_Nueva = (SELECT Id_Factura FROM Factura WHERE Id_Venta = @Id_Venta);
            SELECT @Id_Factura_Nueva AS Id_Factura, 'Factura ya existente para esta venta.' AS Mensaje;
            RETURN;
        END

        DECLARE @MontoTotal DECIMAL(12, 2), @DiasCredito INT;
        SELECT @MontoTotal = v.Monto_Total, @DiasCredito = cp.Dias_Credito
        FROM Venta v
        INNER JOIN Condicion_Pago cp ON v.Id_Condicion_Pago = cp.Id_Condicion_Pago
        WHERE v.Id_Venta = @Id_Venta;

        IF @MontoTotal IS NULL
            THROW 50220, 'La venta especificada no existe.', 1;

        DECLARE @IdEstadoPendiente INT = (SELECT Id_Estado_Factura FROM Estado_Factura WHERE Nombre_Estado = 'Pendiente');
        IF @IdEstadoPendiente IS NULL SET @IdEstadoPendiente = 1;
        DECLARE @FechaVenc DATETIME = DATEADD(DAY, ISNULL(@DiasCredito, 0), GETDATE());

        -- Generación pedagógica de clave fiscal DGT de 50 dígitos si no se suministra
        IF @Clave_Numerica_Fiscal IS NULL OR LEN(@Clave_Numerica_Fiscal) < 50
        BEGIN
            DECLARE @DiaStr VARCHAR(2) = RIGHT('0' + CAST(DAY(GETDATE()) AS VARCHAR(2)), 2);
            DECLARE @MesStr VARCHAR(2) = RIGHT('0' + CAST(MONTH(GETDATE()) AS VARCHAR(2)), 2);
            DECLARE @AnioStr VARCHAR(2) = RIGHT(CAST(YEAR(GETDATE()) AS VARCHAR(4)), 2);
            DECLARE @CedulaEmisor VARCHAR(12) = '003101123456'; -- Cédula jurídica simulada Mundo Escolar
            DECLARE @Consecutivo VARCHAR(20) = '0010000101' + RIGHT('0000000000' + CAST(@Id_Venta AS VARCHAR(10)), 10);
            DECLARE @Situacion VARCHAR(1) = '1'; -- 1=Normal DGT
            DECLARE @CodSeguridad VARCHAR(8) = '88888888';
            SET @Clave_Numerica_Fiscal = '506' + @DiaStr + @MesStr + @AnioStr + @CedulaEmisor + @Consecutivo + @Situacion + @CodSeguridad;
        END

        INSERT INTO Factura (Id_Venta, Id_Estado_Factura, Fecha_Emision, Fecha_Vencimiento, Monto_Total, Saldo_Pendiente, Clave_Numerica_Fiscal)
        VALUES (@Id_Venta, @IdEstadoPendiente, GETDATE(), @FechaVenc, @MontoTotal, @MontoTotal, @Clave_Numerica_Fiscal);

        SET @Id_Factura_Nueva = SCOPE_IDENTITY();
        SELECT @Id_Factura_Nueva AS Id_Factura, 'Factura emitida correctamente con clave fiscal simulada.' AS Mensaje;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 48. SP_Factura_Consultar
CREATE OR ALTER PROCEDURE dbo.SP_Factura_Consultar
    @Id_Factura INT = NULL,
    @Id_Venta INT = NULL,
    @Id_Cliente INT = NULL,
    @Id_Estado_Factura INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        f.Id_Factura,
        f.Id_Venta,
        f.Fecha_Emision,
        f.Fecha_Vencimiento,
        f.Monto_Total,
        f.Saldo_Pendiente,
        (f.Monto_Total - f.Saldo_Pendiente) AS Total_Pagado,
        ef.Nombre_Estado AS Estado_Factura,
        v.Id_Cliente,
        tc.Nombre AS Tipo_Cliente,
        CASE 
            WHEN tc.Nombre = 'Particular' THEN RTRIM(LTRIM(CONCAT(cp.Nombre, ' ', cp.Apellido1, ' ', ISNULL(cp.Apellido2, ''))))
            WHEN tc.Nombre = 'Institucional' THEN ci.Razon_Social
            ELSE 'No especificado'
        END AS Cliente,
        cpago.Nombre AS Condicion_Pago
    FROM Factura f
    INNER JOIN Estado_Factura ef ON f.Id_Estado_Factura = ef.Id_Estado_Factura
    INNER JOIN Venta v ON f.Id_Venta = v.Id_Venta
    INNER JOIN Condicion_Pago cpago ON v.Id_Condicion_Pago = cpago.Id_Condicion_Pago
    INNER JOIN Cliente c ON v.Id_Cliente = c.Id_Cliente
    INNER JOIN Tipo_Cliente tc ON c.Id_Tipo_Cliente = tc.Id_Tipo_Cliente
    LEFT JOIN Cliente_Particular cp ON c.Id_Cliente = cp.Id_Cliente
    LEFT JOIN Cliente_Institucional ci ON c.Id_Cliente = ci.Id_Cliente
    WHERE (@Id_Factura IS NULL OR f.Id_Factura = @Id_Factura)
      AND (@Id_Venta IS NULL OR f.Id_Venta = @Id_Venta)
      AND (@Id_Cliente IS NULL OR v.Id_Cliente = @Id_Cliente)
      AND (@Id_Estado_Factura IS NULL OR f.Id_Estado_Factura = @Id_Estado_Factura)
    ORDER BY f.Fecha_Emision DESC;
END;
GO

-- 49. SP_Factura_Anular
CREATE OR ALTER PROCEDURE dbo.SP_Factura_Anular
    @Id_Factura INT,
    @Id_Usuario INT,
    @Motivo VARCHAR(150)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF @Motivo IS NULL OR LTRIM(RTRIM(@Motivo)) = ''
            THROW 50228, 'El motivo de anulación de la factura es obligatorio.', 1;

        DECLARE @EstadoActual VARCHAR(20);
        SELECT @EstadoActual = ef.Nombre_Estado
        FROM Factura f
        INNER JOIN Estado_Factura ef ON f.Id_Estado_Factura = ef.Id_Estado_Factura
        WHERE f.Id_Factura = @Id_Factura;

        IF @EstadoActual IS NULL
            THROW 50225, 'La factura no existe.', 1;
        IF @EstadoActual = 'Anulada'
            THROW 50226, 'La factura ya se encuentra anulada.', 1;

        -- REGLA OFICIAL DE LA TESIS (Pág. 381): Si posee pagos activos, se rechaza
        IF EXISTS (SELECT 1 FROM Pago WHERE Id_Factura = @Id_Factura AND Estado = 1)
            THROW 50227, 'No se puede anular la factura porque registra pagos activos. Debe anular primero los pagos individualmente mediante SP_Pago_Anular.', 1;

        DECLARE @IdEstadoAnulada INT = (SELECT Id_Estado_Factura FROM Estado_Factura WHERE Nombre_Estado = 'Anulada');
        UPDATE Factura 
        SET Id_Estado_Factura = @IdEstadoAnulada,
            Saldo_Pendiente = 0.00
        WHERE Id_Factura = @Id_Factura;

        -- Auditoría de anulación de factura con motivo y usuario
        INSERT INTO dbo.Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        VALUES (@Id_Usuario, 'ANULACION', 'Factura', @Id_Factura, GETDATE(), CONCAT('Anulación de Factura #', @Id_Factura, '. Motivo: ', @Motivo));

        COMMIT TRANSACTION;
        SELECT @Id_Factura AS Id_Factura, 'Factura anulada correctamente conforme a la normativa.' AS Mensaje;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- 50. SP_Pago_Registrar
CREATE OR ALTER PROCEDURE dbo.SP_Pago_Registrar
    @Id_Factura INT,
    @Id_Metodo_Pago INT,
    @Monto_Pagado DECIMAL(12, 2),
    @Numero_Referencia VARCHAR(100) = NULL,
    @Id_Pago_Nuevo INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF @Monto_Pagado <= 0.00
            THROW 50230, 'El monto pagado debe ser mayor a cero.', 1;
        IF NOT EXISTS (SELECT 1 FROM Metodo_Pago WHERE Id_Metodo_Pago = @Id_Metodo_Pago AND Estado = 1)
            THROW 50231, 'Método de pago no válido o inactivo.', 1;

        DECLARE @SaldoActual DECIMAL(12, 2), @MontoTotal DECIMAL(12, 2), @EstadoFact VARCHAR(20);
        SELECT 
            @SaldoActual = f.Saldo_Pendiente,
            @MontoTotal = f.Monto_Total,
            @EstadoFact = ef.Nombre_Estado
        FROM Factura f
        INNER JOIN Estado_Factura ef ON f.Id_Estado_Factura = ef.Id_Estado_Factura
        WHERE f.Id_Factura = @Id_Factura;

        IF @SaldoActual IS NULL
            THROW 50232, 'La factura no existe.', 1;
        IF @EstadoFact = 'Anulada'
            THROW 50233, 'No se pueden registrar pagos en facturas anuladas.', 1;
        IF @SaldoActual <= 0.00
            THROW 50234, 'La factura ya se encuentra completamente cancelada.', 1;
        IF @Monto_Pagado > @SaldoActual
            THROW 50235, 'El monto a pagar excede el saldo pendiente de la factura.', 1;

        INSERT INTO Pago (Id_Factura, Id_Metodo_Pago, Fecha_Pago, Monto_Pagado, Numero_Referencia, Estado)
        VALUES (@Id_Factura, @Id_Metodo_Pago, GETDATE(), @Monto_Pagado, @Numero_Referencia, 1);

        SET @Id_Pago_Nuevo = SCOPE_IDENTITY();

        -- Calcular nuevo saldo y estado
        DECLARE @NuevoSaldo DECIMAL(12, 2) = @SaldoActual - @Monto_Pagado;
        DECLARE @IdNuevoEstadoFact INT;

        IF @NuevoSaldo = 0.00
            SET @IdNuevoEstadoFact = (SELECT Id_Estado_Factura FROM Estado_Factura WHERE Nombre_Estado = 'Pagada');
        ELSE
            SET @IdNuevoEstadoFact = (SELECT Id_Estado_Factura FROM Estado_Factura WHERE Nombre_Estado = 'Parcial');

        UPDATE Factura
        SET Saldo_Pendiente = @NuevoSaldo,
            Id_Estado_Factura = @IdNuevoEstadoFact
        WHERE Id_Factura = @Id_Factura;

        COMMIT TRANSACTION;
        SELECT @Id_Pago_Nuevo AS Id_Pago, @NuevoSaldo AS Saldo_Pendiente, 'Pago registrado y saldo actualizado con éxito.' AS Mensaje;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- 51. SP_Pago_Anular
CREATE OR ALTER PROCEDURE dbo.SP_Pago_Anular
    @Id_Pago INT,
    @Id_Usuario INT,
    @Motivo VARCHAR(150)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF @Motivo IS NULL OR LTRIM(RTRIM(@Motivo)) = ''
            THROW 50242, 'El motivo de anulación del pago es obligatorio.', 1;

        DECLARE @IdFactura INT, @MontoReversar DECIMAL(12, 2), @EstadoPago BIT;
        SELECT @IdFactura = Id_Factura, @MontoReversar = Monto_Pagado, @EstadoPago = Estado
        FROM Pago WHERE Id_Pago = @Id_Pago;

        IF @IdFactura IS NULL
            THROW 50240, 'El pago especificado no existe.', 1;
        IF @EstadoPago = 0
            THROW 50241, 'El pago ya se encuentra anulado.', 1;

        UPDATE Pago SET Estado = 0 WHERE Id_Pago = @Id_Pago;

        -- Recalcular saldo de factura
        DECLARE @NuevoSaldo DECIMAL(12, 2), @MontoTotal DECIMAL(12, 2);
        SELECT @MontoTotal = Monto_Total, @NuevoSaldo = Saldo_Pendiente + @MontoReversar
        FROM Factura WHERE Id_Factura = @IdFactura;

        DECLARE @IdEstadoFact INT;
        IF @NuevoSaldo >= @MontoTotal
            SET @IdEstadoFact = (SELECT Id_Estado_Factura FROM Estado_Factura WHERE Nombre_Estado = 'Pendiente');
        ELSE
            SET @IdEstadoFact = (SELECT Id_Estado_Factura FROM Estado_Factura WHERE Nombre_Estado = 'Parcial');

        UPDATE Factura
        SET Saldo_Pendiente = @NuevoSaldo,
            Id_Estado_Factura = @IdEstadoFact
        WHERE Id_Factura = @IdFactura;

        -- Registrar en Bitacora con motivo explícito y responsable
        INSERT INTO dbo.Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        VALUES (@Id_Usuario, 'ANULACION', 'Pago', @Id_Pago, GETDATE(), CONCAT('Anulación de pago ID ', @Id_Pago, ' (Factura #', @IdFactura, ', Monto: ', @MontoReversar, '). Motivo: ', @Motivo));

        COMMIT TRANSACTION;
        SELECT @Id_Pago AS Id_Pago, @NuevoSaldo AS NuevoSaldoFactura, 'Pago anulado y saldo restituido.' AS Mensaje;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- 52. SP_CuentaPorCobrar_Consultar
CREATE OR ALTER PROCEDURE dbo.SP_CuentaPorCobrar_Consultar
    @Id_Cliente INT = NULL,
    @SoloVencidas BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        f.Id_Factura,
        f.Id_Venta,
        v.Id_Cliente,
        CASE 
            WHEN tc.Nombre = 'Particular' THEN RTRIM(LTRIM(CONCAT(cp.Nombre, ' ', cp.Apellido1, ' ', ISNULL(cp.Apellido2, ''))))
            WHEN tc.Nombre = 'Institucional' THEN ci.Razon_Social
            ELSE 'No identificado'
        END AS Cliente,
        c.Telefono,
        cpago.Nombre AS Condicion_Pago,
        f.Fecha_Emision,
        f.Fecha_Vencimiento,
        f.Monto_Total,
        f.Saldo_Pendiente,
        ef.Nombre_Estado AS Estado_Factura,
        dbo.FN_DiasAtraso(f.Fecha_Vencimiento, GETDATE(), f.Saldo_Pendiente) AS Dias_Atraso
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
      AND (@SoloVencidas = 0 OR GETDATE() > f.Fecha_Vencimiento)
    ORDER BY f.Fecha_Vencimiento ASC;
END;
GO

-- 53. SP_CuentaPorCobrar_Vencidas
CREATE OR ALTER PROCEDURE dbo.SP_CuentaPorCobrar_Vencidas
    @FechaCorte DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF @FechaCorte IS NULL SET @FechaCorte = GETDATE();

    SELECT * FROM dbo.TF_CuentasVencidas(@FechaCorte, NULL)
    ORDER BY Dias_Atraso DESC;
END;
GO

/* =========================================================================
   GUÍA PRÁCTICA DE EXPOSICIÓN EN VIVO: CONSULTAS ANTES Y DESPUÉS
   MODULO 3: VENTAS, FACTURACIÓN ELECTRÓNICA Y PAGOS (POS)
   INSTRUCCIONES PARA EL EXPOSITOR (SSMS 22):
   - Selecciona con el mouse el bloque de consulta indicado y presiona F5.
   - Sigue los pasos numerados coordinando con tu compañero en el Frontend.
   ========================================================================= */

-- -------------------------------------------------------------------------
-- CASO 1: VENTA EN MOSTRADOR (POS), FACTURACIÓN DGT 50 DÍGITOS Y KÁRDEX
-- -------------------------------------------------------------------------
-- PASO 1 (ANTES): Consulta el stock disponible del producto antes de venderlo
-- y el consecutivo de la última factura emitida.
SELECT 
    p.Id_Producto,
    p.Nombre AS Producto,
    p.Stock_Actual,
    p.Precio_Venta
FROM dbo.Producto p
WHERE p.Id_Producto = 1; -- (Ejemplo: Cuaderno Cosido 100 Hojas)

SELECT TOP 1 
    f.Id_Factura,
    f.Clave_Numerica_Fiscal,
    LEN(f.Clave_Numerica_Fiscal) AS Longitud_Clave,
    f.Monto_Total,
    f.Fecha_Emision
FROM dbo.Factura f
ORDER BY f.Id_Factura DESC;

-- PASO 2 (ACCIÓN DEL COMPAÑERO EN EL FRONTEND):
-- En la pantalla Caja / POS (/caja), el compañero agrega 1 Cuaderno Cosido y 1 Servicio de Fotocopia,
-- selecciona el método de pago Efectivo o SINPE y presiona "Completar Venta y Emitir Factura".

-- PASO 3 (DESPUÉS): Ejecuta esta consulta para demostrar a Torrentes la integración 100% transaccional:
-- 1. La Venta cerrada en dbo.Venta con desglose de impuestos y total.
-- 2. La Factura Electrónica con la Clave Numérica de 50 dígitos exigida por la DGT (Ley 9635).
-- 3. El Recibo financiero en dbo.Pago con el método utilizado.
-- 4. El rebajo inmediato en el libro Kárdex de Inventario.

-- 1. Cabecera de la Venta:
SELECT TOP 1 
    v.Id_Venta,
    v.Fecha,
    c.Nombre_O_RazonSocial AS Cliente,
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

-- 2. Factura Electrónica Oficial (Verificar Clave Numérica de 50 dígitos):
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

-- 3. Asiento de Pago Financiero:
SELECT TOP 1 
    p.Id_Pago,
    p.Fecha_Pago,
    p.Monto_Pagado,
    mp.Nombre AS Metodo_Pago,
    p.Numero_Referencia
FROM dbo.Pago p
INNER JOIN dbo.Metodo_Pago mp ON p.Id_Metodo_Pago = mp.Id_Metodo_Pago
ORDER BY p.Id_Pago DESC;

-- 4. Movimiento de Salida en Kárdex:
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


-- -------------------------------------------------------------------------
-- CASO 2: VENTA INSTITUCIONAL A CRÉDITO Y CREACIÓN DE CARTERA
-- -------------------------------------------------------------------------
-- PASO 1 (ANTES): Consulta el límite y permisos de crédito de un cliente institucional
SELECT 
    c.Id_Cliente,
    c.Nombre_O_RazonSocial AS Cliente,
    c.Limite_Credito_Monto,
    c.Limite_Credito_Facturas,
    c.Permite_Credito,
    c.Condiciones_Autorizadas
FROM dbo.VW_ClientesActivos c
WHERE c.Id_Cliente = 1;

-- PASO 2 (ACCIÓN DEL COMPAÑERO EN EL FRONTEND):
-- En /caja, el compañero selecciona al cliente institucional, elige condición de pago "Crédito"
-- y procesa la venta.

-- PASO 3 (DESPUÉS): Ejecuta esta consulta para demostrar la venta y factura en estado de crédito:
SELECT TOP 1 
    f.Id_Factura,
    f.Clave_Numerica_Fiscal,
    f.Monto_Total,
    f.Saldo_Pendiente,
    ef.Nombre_Estado AS Estado_Factura,
    f.Fecha_Vencimiento
FROM dbo.Factura f
INNER JOIN dbo.Estado_Factura ef ON f.Id_Estado_Factura = ef.Id_Estado_Factura
ORDER BY f.Id_Factura DESC;
GO
