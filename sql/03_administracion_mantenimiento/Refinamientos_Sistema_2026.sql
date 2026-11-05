USE MUNDO_ESCOLAR;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- =========================================================================
-- REFINAMIENTOS SISTEMA MUNDO ESCOLAR 2026
-- 1. SP_Usuario_Consultar
-- 2. SP_Cliente_HistorialGeneral
-- 3. SP_Inventario_Salida (con Id_Tipo_Movimiento)
-- 4. SP_Inventario_ConsultarMovimientos (con Id_Usuario y validación fechas)
-- 5. SP_Producto_CambiarEstado
-- 6. SP_Cliente_Actualizar (RF1.5 con retorno de antes/después)
-- =========================================================================

-- 1. SP_Usuario_Consultar
CREATE OR ALTER PROCEDURE dbo.SP_Usuario_Consultar
    @Id_Usuario INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        u.Id_Usuario,
        u.Nombre_Usuario,
        u.Correo,
        u.Estado,
        u.Fecha_Registro,
        u.Fecha_Registro AS Fecha_Creacion,
        u.Requiere_Cambio_Contrasena,
        ISNULL((
            SELECT STRING_AGG(r.Nombre, ', ')
            FROM Rol_Usuario ru
            INNER JOIN Rol r ON ru.Id_Rol = r.Id_Rol
            WHERE ru.Id_Usuario = u.Id_Usuario
        ), 'Sin Rol') AS Roles,
        ISNULL((
            SELECT r.Id_Rol, r.Nombre
            FROM Rol_Usuario ru
            INNER JOIN Rol r ON ru.Id_Rol = r.Id_Rol
            WHERE ru.Id_Usuario = u.Id_Usuario
            FOR JSON PATH
        ), '[]') AS RolesJson
    FROM Usuario u
    WHERE (@Id_Usuario IS NULL OR u.Id_Usuario = @Id_Usuario)
    ORDER BY u.Id_Usuario ASC;
END;
GO

-- 2. SP_Cliente_HistorialGeneral
CREATE OR ALTER PROCEDURE dbo.SP_Cliente_HistorialGeneral
    @Id_Cliente INT = NULL,
    @Tipo_Cliente VARCHAR(20) = NULL,
    @FechaInicio DATETIME = NULL,
    @FechaFin DATETIME = NULL,
    @Estado_Venta VARCHAR(30) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        v.Id_Venta,
        v.Fecha,
        v.Id_Cliente,
        tc.Nombre AS Tipo_Cliente,
        CASE 
            WHEN tc.Nombre = 'Particular' THEN RTRIM(LTRIM(CONCAT(cp.Nombre, ' ', cp.Apellido1, ' ', ISNULL(cp.Apellido2, ''))))
            WHEN tc.Nombre = 'Institucional' THEN ci.Razon_Social
            ELSE 'No especificado'
        END AS Nombre_Cliente,
        CASE 
            WHEN tc.Nombre = 'Particular' THEN cp.Identificacion
            WHEN tc.Nombre = 'Institucional' THEN ci.Cedula_Juridica
            ELSE 'N/A'
        END AS Identificacion,
        ev.Nombre_Estado AS Estado_Venta,
        cpago.Nombre AS Condicion_Pago,
        v.Subtotal,
        v.Impuesto,
        v.Monto_Total,
        f.Id_Factura,
        ISNULL(ef.Nombre_Estado, 'Sin Facturar') AS Estado_Factura,
        ISNULL(f.Saldo_Pendiente, 0.00) AS Saldo_Pendiente
    FROM Venta v
    INNER JOIN Cliente c ON v.Id_Cliente = c.Id_Cliente
    INNER JOIN Tipo_Cliente tc ON c.Id_Tipo_Cliente = tc.Id_Tipo_Cliente
    LEFT JOIN Cliente_Particular cp ON c.Id_Cliente = cp.Id_Cliente
    LEFT JOIN Cliente_Institucional ci ON c.Id_Cliente = ci.Id_Cliente
    INNER JOIN Estado_Venta ev ON v.Id_Estado_Venta = ev.Id_Estado_Venta
    INNER JOIN Condicion_Pago cpago ON v.Id_Condicion_Pago = cpago.Id_Condicion_Pago
    LEFT JOIN Factura f ON v.Id_Venta = f.Id_Venta
    LEFT JOIN Estado_Factura ef ON f.Id_Estado_Factura = ef.Id_Estado_Factura
    WHERE (@Id_Cliente IS NULL OR v.Id_Cliente = @Id_Cliente)
      AND (@Tipo_Cliente IS NULL OR tc.Nombre = @Tipo_Cliente)
      AND (@FechaInicio IS NULL OR v.Fecha >= @FechaInicio)
      AND (@FechaFin IS NULL OR v.Fecha <= DATEADD(second, 86399, @FechaFin))
      AND (@Estado_Venta IS NULL OR ev.Nombre_Estado = @Estado_Venta)
    ORDER BY v.Fecha DESC;
END;
GO

-- 3. SP_Inventario_Salida
CREATE OR ALTER PROCEDURE dbo.SP_Inventario_Salida
    @Id_Producto INT,
    @Cantidad INT,
    @Id_Usuario INT,
    @Motivo VARCHAR(150),
    @Id_Tipo_Movimiento INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        DECLARE @StockActual INT;
        SELECT @StockActual = Stock_Actual FROM Producto WHERE Id_Producto = @Id_Producto;

        IF @StockActual IS NULL
            THROW 50145, 'El producto no existe.', 1;
        IF @Cantidad <= 0
            THROW 50146, 'La cantidad debe ser mayor a cero.', 1;
        IF @StockActual < @Cantidad
            THROW 50147, 'Existencias insuficientes para realizar la salida.', 1;

        DECLARE @IdTipoMov INT = @Id_Tipo_Movimiento;
        IF @IdTipoMov IS NULL
            SELECT @IdTipoMov = Id_Tipo_Movimiento FROM Tipo_Movimiento WHERE Nombre = 'Ajuste Negativo';

        UPDATE Producto SET Stock_Actual = Stock_Actual - @Cantidad WHERE Id_Producto = @Id_Producto;

        INSERT INTO Movimiento_Inventario (Id_Producto, Id_Tipo_Movimiento, Id_Usuario, Cantidad, Fecha, Motivo)
        VALUES (@Id_Producto, @IdTipoMov, @Id_Usuario, @Cantidad, GETDATE(), @Motivo);

        COMMIT TRANSACTION;
        SELECT 'Salida de inventario aplicada con éxito.' AS Mensaje;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- 4. SP_Inventario_ConsultarMovimientos
CREATE OR ALTER PROCEDURE dbo.SP_Inventario_ConsultarMovimientos
    @Id_Producto INT = NULL,
    @FechaInicio DATETIME = NULL,
    @FechaFin DATETIME = NULL,
    @Id_Tipo_Movimiento INT = NULL,
    @Id_Usuario INT = NULL,
    @OrdenAscendente BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @FechaInicio IS NOT NULL AND @FechaFin IS NOT NULL AND @FechaInicio > @FechaFin
        THROW 50148, 'La fecha inicial no puede ser posterior a la fecha final.', 1;

    SELECT 
        m.Id_Movimiento_Inventario,
        m.Fecha,
        m.Id_Producto,
        p.Nombre AS Producto,
        m.Id_Tipo_Movimiento,
        tm.Nombre AS Tipo_Movimiento,
        tm.Naturaleza,
        m.Cantidad,
        m.Motivo,
        m.Id_Usuario,
        u.Nombre_Usuario AS Responsable
    FROM Movimiento_Inventario m
    INNER JOIN Producto p ON m.Id_Producto = p.Id_Producto
    INNER JOIN Tipo_Movimiento tm ON m.Id_Tipo_Movimiento = tm.Id_Tipo_Movimiento
    INNER JOIN Usuario u ON m.Id_Usuario = u.Id_Usuario
    WHERE (@Id_Producto IS NULL OR m.Id_Producto = @Id_Producto)
      AND (@FechaInicio IS NULL OR m.Fecha >= @FechaInicio)
      AND (@FechaFin IS NULL OR m.Fecha <= DATEADD(second, 86399, @FechaFin))
      AND (@Id_Tipo_Movimiento IS NULL OR m.Id_Tipo_Movimiento = @Id_Tipo_Movimiento)
      AND (@Id_Usuario IS NULL OR m.Id_Usuario = @Id_Usuario)
    ORDER BY 
        CASE WHEN @OrdenAscendente = 1 THEN m.Fecha END ASC,
        CASE WHEN @OrdenAscendente = 0 OR @OrdenAscendente IS NULL THEN m.Fecha END DESC;
END;
GO

-- 5. SP_Producto_CambiarEstado
CREATE OR ALTER PROCEDURE dbo.SP_Producto_CambiarEstado
    @Id_Producto INT,
    @Estado BIT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Producto WHERE Id_Producto = @Id_Producto)
            THROW 50115, 'El producto no existe.', 1;

        UPDATE Producto
        SET Estado = @Estado
        WHERE Id_Producto = @Id_Producto;

        SELECT 
            @Id_Producto AS Id_Producto, 
            @Estado AS NuevoEstado,
            CASE WHEN @Estado = 1 THEN 'Producto activado exitosamente.' ELSE 'Producto desactivado exitosamente.' END AS Mensaje;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 6. SP_Cliente_Actualizar (RF1.5)
CREATE OR ALTER PROCEDURE dbo.SP_Cliente_Actualizar
    @Id_Cliente INT,
    @Telefono VARCHAR(30) = NULL,
    @Direccion VARCHAR(200) = NULL,
    @Estado BIT = NULL,
    @Nombre VARCHAR(50) = NULL,
    @Apellido1 VARCHAR(50) = NULL,
    @Apellido2 VARCHAR(50) = NULL,
    @Razon_Social VARCHAR(50) = NULL,
    @Nombre_Contacto VARCHAR(50) = NULL,
    @Telefono_Contacto VARCHAR(50) = NULL,
    @Correo_Contacto VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM Cliente WHERE Id_Cliente = @Id_Cliente)
            THROW 50020, 'El cliente especificado no existe.', 1;

        -- 1. Capturar datos anteriores para auditoría y retorno
        DECLARE @PrevTelefono VARCHAR(30), @PrevDireccion VARCHAR(200), @PrevEstado BIT, @IdTipoCliente INT;
        SELECT 
            @PrevTelefono = Telefono, 
            @PrevDireccion = Direccion, 
            @PrevEstado = Estado,
            @IdTipoCliente = Id_Tipo_Cliente
        FROM Cliente WHERE Id_Cliente = @Id_Cliente;

        DECLARE @PrevNombre VARCHAR(50), @PrevApellido1 VARCHAR(50), @PrevApellido2 VARCHAR(50);
        SELECT 
            @PrevNombre = Nombre, 
            @PrevApellido1 = Apellido1, 
            @PrevApellido2 = Apellido2 
        FROM Cliente_Particular WHERE Id_Cliente = @Id_Cliente;

        DECLARE @PrevRazonSocial VARCHAR(50), @PrevNombreContacto VARCHAR(50), @PrevTelContacto VARCHAR(50), @PrevCorreoContacto VARCHAR(50);
        SELECT 
            @PrevRazonSocial = Razon_Social, 
            @PrevNombreContacto = Nombre_Contacto, 
            @PrevTelContacto = Telefono_Contacto, 
            @PrevCorreoContacto = Correo_Contacto 
        FROM Cliente_Institucional WHERE Id_Cliente = @Id_Cliente;

        DECLARE @PrevCorreoUsuario VARCHAR(150);
        SELECT @PrevCorreoUsuario = u.Correo
        FROM Cliente c
        INNER JOIN Usuario u ON c.Id_Usuario = u.Id_Usuario
        WHERE c.Id_Cliente = @Id_Cliente;

        -- 2. Ejecutar UPDATE únicamente sobre campos enviados
        UPDATE Cliente 
        SET Telefono = ISNULL(@Telefono, Telefono),
            Direccion = ISNULL(@Direccion, Direccion),
            Estado = ISNULL(@Estado, Estado)
        WHERE Id_Cliente = @Id_Cliente;

        IF EXISTS (SELECT 1 FROM Cliente_Particular WHERE Id_Cliente = @Id_Cliente)
        BEGIN
            UPDATE Cliente_Particular
            SET Nombre = ISNULL(@Nombre, Nombre),
                Apellido1 = ISNULL(@Apellido1, Apellido1),
                Apellido2 = ISNULL(@Apellido2, Apellido2)
            WHERE Id_Cliente = @Id_Cliente;
        END

        IF EXISTS (SELECT 1 FROM Cliente_Institucional WHERE Id_Cliente = @Id_Cliente)
        BEGIN
            UPDATE Cliente_Institucional
            SET Razon_Social = ISNULL(@Razon_Social, Razon_Social),
                Nombre_Contacto = ISNULL(@Nombre_Contacto, Nombre_Contacto),
                Telefono_Contacto = ISNULL(@Telefono_Contacto, Telefono_Contacto),
                Correo_Contacto = ISNULL(@Correo_Contacto, Correo_Contacto)
            WHERE Id_Cliente = @Id_Cliente;
        END

        COMMIT TRANSACTION;

        -- 3. Retornar confirmación con datos anteriores y actualizados
        SELECT 
            @Id_Cliente AS Id_Cliente,
            'Cliente actualizado exitosamente.' AS Mensaje,
            -- Datos Anteriores
            @PrevTelefono AS Telefono_Anterior,
            @PrevDireccion AS Direccion_Anterior,
            @PrevEstado AS Estado_Anterior,
            @PrevNombre AS Nombre_Anterior,
            @PrevApellido1 AS Apellido1_Anterior,
            @PrevApellido2 AS Apellido2_Anterior,
            @PrevRazonSocial AS Razon_Social_Anterior,
            @PrevNombreContacto AS Nombre_Contacto_Anterior,
            @PrevTelContacto AS Telefono_Contacto_Anterior,
            @PrevCorreoContacto AS Correo_Contacto_Anterior,
            -- Datos Actuales
            c.Telefono AS Telefono_Actual,
            c.Direccion AS Direccion_Actual,
            c.Estado AS Estado_Actual,
            cp.Nombre AS Nombre_Actual,
            cp.Apellido1 AS Apellido1_Actual,
            cp.Apellido2 AS Apellido2_Actual,
            ci.Razon_Social AS Razon_Social_Actual,
            ci.Nombre_Contacto AS Nombre_Contacto_Actual,
            ci.Telefono_Contacto AS Telefono_Contacto_Actual,
            ci.Correo_Contacto AS Correo_Contacto_Actual,
            @PrevCorreoUsuario AS Correo_Usuario_Anterior,
            u.Correo AS Correo_Usuario_Actual
        FROM Cliente c
        LEFT JOIN Usuario u ON c.Id_Usuario = u.Id_Usuario
        LEFT JOIN Cliente_Particular cp ON c.Id_Cliente = cp.Id_Cliente
        LEFT JOIN Cliente_Institucional ci ON c.Id_Cliente = ci.Id_Cliente
        WHERE c.Id_Cliente = @Id_Cliente;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
