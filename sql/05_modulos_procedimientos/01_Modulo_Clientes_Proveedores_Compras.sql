/* =========================================================================
   PROYECTO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR
   ========================================================================= */

USE MUNDO_ESCOLAR;
GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

-- 2. SP_Cliente_CrearPerfil
CREATE OR ALTER PROCEDURE dbo.SP_Cliente_CrearPerfil
    @Id_Tipo_Cliente INT,
    @Telefono VARCHAR(30) = NULL,
    @Direccion VARCHAR(200) = NULL,
    @Identificacion VARCHAR(20) = NULL,
    @Nombre VARCHAR(50) = NULL,
    @Apellido1 VARCHAR(50) = NULL,
    @Apellido2 VARCHAR(50) = NULL,
    @Razon_Social VARCHAR(50) = NULL,
    @Cedula_Juridica VARCHAR(50) = NULL,
    @Nombre_Contacto VARCHAR(50) = NULL,
    @Telefono_Contacto VARCHAR(50) = NULL,
    @Correo_Contacto VARCHAR(50) = NULL,
    @Id_Usuario INT = NULL,
    @Id_Cliente_Nuevo INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @TipoNombre VARCHAR(50);
        SELECT @TipoNombre = Nombre FROM Tipo_Cliente WHERE Id_Tipo_Cliente = @Id_Tipo_Cliente AND Estado = 1;
        IF @TipoNombre IS NULL
            THROW 50010, 'El tipo de cliente especificado no existe o está inactivo.', 1;

        IF @TipoNombre = 'Particular'
        BEGIN
            IF @Identificacion IS NULL OR LTRIM(RTRIM(@Identificacion)) = ''
                THROW 50011, 'La identificación física del cliente particular es obligatoria.', 1;
            IF @Nombre IS NULL OR @Apellido1 IS NULL
                THROW 50012, 'El nombre y primer apellido son obligatorios para cliente particular.', 1;
            IF EXISTS (SELECT 1 FROM Cliente_Particular WHERE Identificacion = @Identificacion)
                THROW 50013, 'Ya existe un cliente particular con esa identificación.', 1;
        END
        ELSE IF @TipoNombre = 'Institucional'
        BEGIN
            IF @Cedula_Juridica IS NULL OR LTRIM(RTRIM(@Cedula_Juridica)) = ''
                THROW 50014, 'La cédula jurídica del cliente institucional es obligatoria.', 1;
            IF @Razon_Social IS NULL OR LTRIM(RTRIM(@Razon_Social)) = ''
                THROW 50015, 'La razón social es obligatoria para cliente institucional.', 1;
            IF EXISTS (SELECT 1 FROM Cliente_Institucional WHERE Cedula_Juridica = @Cedula_Juridica)
                THROW 50016, 'Ya existe un cliente institucional con esa cédula jurídica.', 1;
        END

        INSERT INTO Cliente (Id_Tipo_Cliente, Id_Usuario, Telefono, Direccion, Estado)
        VALUES (@Id_Tipo_Cliente, @Id_Usuario, @Telefono, @Direccion, 1);

        SET @Id_Cliente_Nuevo = SCOPE_IDENTITY();

        IF @TipoNombre = 'Particular'
        BEGIN
            INSERT INTO Cliente_Particular (Id_Cliente, Identificacion, Nombre, Apellido1, Apellido2)
            VALUES (@Id_Cliente_Nuevo, LTRIM(RTRIM(@Identificacion)), LTRIM(RTRIM(@Nombre)), LTRIM(RTRIM(@Apellido1)), @Apellido2);
        END
        ELSE IF @TipoNombre = 'Institucional'
        BEGIN
            INSERT INTO Cliente_Institucional (Id_Cliente, Razon_Social, Cedula_Juridica, Nombre_Contacto, Telefono_Contacto, Correo_Contacto)
            VALUES (@Id_Cliente_Nuevo, LTRIM(RTRIM(@Razon_Social)), LTRIM(RTRIM(@Cedula_Juridica)), @Nombre_Contacto, @Telefono_Contacto, @Correo_Contacto);
        END

        -- Asignar condición Contado por defecto
        DECLARE @IdContado INT = (SELECT Id_Condicion_Pago FROM Condicion_Pago WHERE Nombre = 'Contado');
        IF @IdContado IS NOT NULL
        BEGIN
            INSERT INTO Cliente_Condicion_Pago (Id_Cliente, Id_Condicion_Pago, Fecha_Autorizacion, Estado)
            VALUES (@Id_Cliente_Nuevo, @IdContado, CAST(GETDATE() AS DATE), 1);
        END

        COMMIT TRANSACTION;
        SELECT @Id_Cliente_Nuevo AS Id_Cliente, 'Cliente registrado con éxito.' AS Mensaje;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- 3. SP_Cliente_Actualizar (RF1.5)
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

-- 4. SP_Cliente_Consultar
CREATE OR ALTER PROCEDURE dbo.SP_Cliente_Consultar
    @Id_Cliente INT = NULL,
    @TerminoBusqueda VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        c.Id_Cliente,
        tc.Nombre AS Tipo_Cliente,
        CASE 
            WHEN tc.Nombre = 'Particular' THEN cp.Identificacion
            WHEN tc.Nombre = 'Institucional' THEN ci.Cedula_Juridica
            ELSE 'N/A'
        END AS Identificacion,
        CASE 
            WHEN tc.Nombre = 'Particular' THEN RTRIM(LTRIM(CONCAT(cp.Nombre, ' ', cp.Apellido1, ' ', ISNULL(cp.Apellido2, ''))))
            WHEN tc.Nombre = 'Institucional' THEN ci.Razon_Social
            ELSE 'No especificado'
        END AS Nombre_Cliente,
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
        c.Estado
    FROM Cliente c
    INNER JOIN Tipo_Cliente tc ON c.Id_Tipo_Cliente = tc.Id_Tipo_Cliente
    LEFT JOIN Cliente_Particular cp ON c.Id_Cliente = cp.Id_Cliente
    LEFT JOIN Cliente_Institucional ci ON c.Id_Cliente = ci.Id_Cliente
    LEFT JOIN Usuario u ON c.Id_Usuario = u.Id_Usuario
    WHERE (@Id_Cliente IS NULL OR c.Id_Cliente = @Id_Cliente)
      AND (@TerminoBusqueda IS NULL OR 
           cp.Identificacion LIKE '%' + @TerminoBusqueda + '%' OR
           ci.Cedula_Juridica LIKE '%' + @TerminoBusqueda + '%' OR
           cp.Nombre LIKE '%' + @TerminoBusqueda + '%' OR
           cp.Apellido1 LIKE '%' + @TerminoBusqueda + '%' OR
           ci.Razon_Social LIKE '%' + @TerminoBusqueda + '%');
END;
GO

-- 5. SP_Cliente_HistorialOperaciones
CREATE OR ALTER PROCEDURE dbo.SP_Cliente_HistorialOperaciones
    @Id_Cliente INT,
    @FechaInicio DATETIME = NULL,
    @FechaFin DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM Cliente WHERE Id_Cliente = @Id_Cliente)
        THROW 50025, 'El cliente no existe.', 1;

    SELECT 
        v.Id_Venta,
        v.Fecha,
        ev.Nombre_Estado AS Estado_Venta,
        cp.Nombre AS Condicion_Pago,
        v.Monto_Total,
        f.Id_Factura,
        ef.Nombre_Estado AS Estado_Factura,
        ISNULL(f.Saldo_Pendiente, 0.00) AS Saldo_Pendiente
    FROM Venta v
    INNER JOIN Estado_Venta ev ON v.Id_Estado_Venta = ev.Id_Estado_Venta
    INNER JOIN Condicion_Pago cp ON v.Id_Condicion_Pago = cp.Id_Condicion_Pago
    LEFT JOIN Factura f ON v.Id_Venta = f.Id_Venta
    LEFT JOIN Estado_Factura ef ON f.Id_Estado_Factura = ef.Id_Estado_Factura
    WHERE v.Id_Cliente = @Id_Cliente
      AND (@FechaInicio IS NULL OR v.Fecha >= @FechaInicio)
      AND (@FechaFin IS NULL OR v.Fecha <= @FechaFin)
    ORDER BY v.Fecha DESC;
END;
GO

-- 5B. SP_Cliente_HistorialGeneral
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

-- 6. SP_ClienteCondicionPago_Autorizar
CREATE OR ALTER PROCEDURE dbo.SP_ClienteCondicionPago_Autorizar
    @Id_Cliente INT,
    @Id_Condicion_Pago INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Cliente WHERE Id_Cliente = @Id_Cliente AND Estado = 1)
            THROW 50030, 'El cliente no existe o está inactivo.', 1;
        IF NOT EXISTS (SELECT 1 FROM Condicion_Pago WHERE Id_Condicion_Pago = @Id_Condicion_Pago AND Estado = 1)
            THROW 50031, 'La condición de pago no existe o está inactiva.', 1;

        IF EXISTS (SELECT 1 FROM Cliente_Condicion_Pago WHERE Id_Cliente = @Id_Cliente AND Id_Condicion_Pago = @Id_Condicion_Pago)
        BEGIN
            UPDATE Cliente_Condicion_Pago 
            SET Estado = 1, Fecha_Autorizacion = CAST(GETDATE() AS DATE)
            WHERE Id_Cliente = @Id_Cliente AND Id_Condicion_Pago = @Id_Condicion_Pago;
        END
        ELSE
        BEGIN
            INSERT INTO Cliente_Condicion_Pago (Id_Cliente, Id_Condicion_Pago, Fecha_Autorizacion, Estado)
            VALUES (@Id_Cliente, @Id_Condicion_Pago, CAST(GETDATE() AS DATE), 1);
        END

        SELECT 'Condición de pago autorizada correctamente al cliente.' AS Mensaje;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 7. SP_ClienteCondicionPago_Deshabilitar
CREATE OR ALTER PROCEDURE dbo.SP_ClienteCondicionPago_Deshabilitar
    @Id_Cliente INT,
    @Id_Condicion_Pago INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @IdContado INT = (SELECT Id_Condicion_Pago FROM Condicion_Pago WHERE Nombre = 'Contado');
        IF @Id_Condicion_Pago = @IdContado
            THROW 50035, 'No se puede deshabilitar la condición de Contado obligatoria.', 1;

        UPDATE Cliente_Condicion_Pago 
        SET Estado = 0
        WHERE Id_Cliente = @Id_Cliente AND Id_Condicion_Pago = @Id_Condicion_Pago;

        SELECT 'Condición de pago deshabilitada con éxito para el cliente.' AS Mensaje;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 8. SP_ClienteCondicionPago_Consultar
CREATE OR ALTER PROCEDURE dbo.SP_ClienteCondicionPago_Consultar
    @Id_Cliente INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        ccp.Id_Cliente_Condicion_Pago,
        ccp.Id_Cliente,
        ccp.Id_Condicion_Pago,
        cp.Nombre AS Condicion_Pago,
        cp.Dias_Credito,
        ccp.Fecha_Autorizacion,
        ccp.Estado
    FROM Cliente_Condicion_Pago ccp
    INNER JOIN Condicion_Pago cp ON ccp.Id_Condicion_Pago = cp.Id_Condicion_Pago
    WHERE ccp.Id_Cliente = @Id_Cliente
    ORDER BY cp.Dias_Credito ASC;
END;
GO

-- =========================================================================
-- MÓDULO 2: PROVEEDORES Y PRODUCTO_PROVEEDOR (SPs 9 a 14)
-- =========================================================================

-- 9. SP_Proveedor_Crear
CREATE OR ALTER PROCEDURE dbo.SP_Proveedor_Crear
    @Id_Tipo_Proveedor INT,
    @Correo VARCHAR(150),
    @Telefono VARCHAR(100),
    @Direccion VARCHAR(200),
    @Identificacion VARCHAR(20) = NULL,
    @Nombre VARCHAR(50) = NULL,
    @Apellido1 VARCHAR(50) = NULL,
    @Apellido2 VARCHAR(50) = NULL,
    @Razon_Social VARCHAR(50) = NULL,
    @Cedula_Juridica VARCHAR(50) = NULL,
    @Nombre_Contacto VARCHAR(50) = NULL,
    @Telefono_Contacto VARCHAR(50) = NULL,
    @Correo_Contacto VARCHAR(50) = NULL,
    @Id_Proveedor_Nuevo INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @TipoNombre VARCHAR(50);
        SELECT @TipoNombre = Nombre FROM Tipo_Proveedor WHERE Id_Tipo_Proveedor = @Id_Tipo_Proveedor AND Estado = 1;
        IF @TipoNombre IS NULL
            THROW 50040, 'El tipo de proveedor especificado no existe o está inactivo.', 1;

        IF @TipoNombre = 'Particular'
        BEGIN
            IF @Identificacion IS NULL OR LTRIM(RTRIM(@Identificacion)) = ''
                THROW 50041, 'La identificación del proveedor particular es obligatoria.', 1;
            IF @Nombre IS NULL OR @Apellido1 IS NULL
                THROW 50042, 'Nombre y primer apellido son obligatorios.', 1;
            IF EXISTS (SELECT 1 FROM Proveedor_Particular WHERE Identificacion = @Identificacion)
                THROW 50043, 'Ya existe un proveedor particular con esa identificación.', 1;
        END
        ELSE IF @TipoNombre = 'Institucional'
        BEGIN
            IF @Cedula_Juridica IS NULL OR LTRIM(RTRIM(@Cedula_Juridica)) = ''
                THROW 50044, 'La cédula jurídica es obligatoria.', 1;
            IF @Razon_Social IS NULL OR LTRIM(RTRIM(@Razon_Social)) = ''
                THROW 50045, 'La razón social es obligatoria.', 1;
            IF EXISTS (SELECT 1 FROM Proveedor_Institucional WHERE Cedula_Juridica = @Cedula_Juridica)
                THROW 50046, 'Ya existe un proveedor institucional con esa cédula jurídica.', 1;
        END

        INSERT INTO Proveedor (Id_Tipo_Proveedor, Correo, Telefono, Direccion, Estado)
        VALUES (@Id_Tipo_Proveedor, @Correo, @Telefono, @Direccion, 1);

        SET @Id_Proveedor_Nuevo = SCOPE_IDENTITY();

        IF @TipoNombre = 'Particular'
        BEGIN
            INSERT INTO Proveedor_Particular (Id_Proveedor, Identificacion, Nombre, Apellido1, Apellido2)
            VALUES (@Id_Proveedor_Nuevo, LTRIM(RTRIM(@Identificacion)), LTRIM(RTRIM(@Nombre)), LTRIM(RTRIM(@Apellido1)), @Apellido2);
        END
        ELSE IF @TipoNombre = 'Institucional'
        BEGIN
            INSERT INTO Proveedor_Institucional (Id_Proveedor, Razon_Social, Cedula_Juridica, Nombre_Contacto, Telefono_Contacto, Correo_Contacto)
            VALUES (@Id_Proveedor_Nuevo, LTRIM(RTRIM(@Razon_Social)), LTRIM(RTRIM(@Cedula_Juridica)), @Nombre_Contacto, @Telefono_Contacto, @Correo_Contacto);
        END

        COMMIT TRANSACTION;
        SELECT @Id_Proveedor_Nuevo AS Id_Proveedor, 'Proveedor registrado satisfactoriamente.' AS Mensaje;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- 10. SP_Proveedor_Actualizar
CREATE OR ALTER PROCEDURE dbo.SP_Proveedor_Actualizar
    @Id_Proveedor INT,
    @Correo VARCHAR(150) = NULL,
    @Telefono VARCHAR(100) = NULL,
    @Direccion VARCHAR(200) = NULL,
    @Estado BIT = 1,
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
        IF NOT EXISTS (SELECT 1 FROM Proveedor WHERE Id_Proveedor = @Id_Proveedor)
            THROW 50050, 'El proveedor no existe.', 1;

        UPDATE Proveedor
        SET Correo = ISNULL(@Correo, Correo),
            Telefono = ISNULL(@Telefono, Telefono),
            Direccion = ISNULL(@Direccion, Direccion),
            Estado = @Estado
        WHERE Id_Proveedor = @Id_Proveedor;

        IF EXISTS (SELECT 1 FROM Proveedor_Particular WHERE Id_Proveedor = @Id_Proveedor)
        BEGIN
            UPDATE Proveedor_Particular
            SET Nombre = ISNULL(@Nombre, Nombre),
                Apellido1 = ISNULL(@Apellido1, Apellido1),
                Apellido2 = ISNULL(@Apellido2, Apellido2)
            WHERE Id_Proveedor = @Id_Proveedor;
        END

        IF EXISTS (SELECT 1 FROM Proveedor_Institucional WHERE Id_Proveedor = @Id_Proveedor)
        BEGIN
            UPDATE Proveedor_Institucional
            SET Razon_Social = ISNULL(@Razon_Social, Razon_Social),
                Nombre_Contacto = ISNULL(@Nombre_Contacto, Nombre_Contacto),
                Telefono_Contacto = ISNULL(@Telefono_Contacto, Telefono_Contacto),
                Correo_Contacto = ISNULL(@Correo_Contacto, Correo_Contacto)
            WHERE Id_Proveedor = @Id_Proveedor;
        END

        COMMIT TRANSACTION;
        SELECT @Id_Proveedor AS Id_Proveedor, 'Proveedor actualizado correctamente.' AS Mensaje;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- 11. SP_Proveedor_Consultar
CREATE OR ALTER PROCEDURE dbo.SP_Proveedor_Consultar
    @Id_Proveedor INT = NULL,
    @TerminoBusqueda VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        p.Id_Proveedor,
        tp.Nombre AS Tipo_Proveedor,
        CASE 
            WHEN tp.Nombre = 'Particular' THEN pp.Identificacion
            WHEN tp.Nombre = 'Institucional' THEN pi.Cedula_Juridica
            ELSE 'N/A'
        END AS Identificacion,
        CASE 
            WHEN tp.Nombre = 'Particular' THEN RTRIM(LTRIM(CONCAT(pp.Nombre, ' ', pp.Apellido1, ' ', ISNULL(pp.Apellido2, ''))))
            WHEN tp.Nombre = 'Institucional' THEN pi.Razon_Social
            ELSE 'No especificado'
        END AS Nombre_Proveedor,
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
    WHERE (@Id_Proveedor IS NULL OR p.Id_Proveedor = @Id_Proveedor)
      AND (@TerminoBusqueda IS NULL OR 
           pp.Identificacion LIKE '%' + @TerminoBusqueda + '%' OR
           pi.Cedula_Juridica LIKE '%' + @TerminoBusqueda + '%' OR
           pp.Nombre LIKE '%' + @TerminoBusqueda + '%' OR
           pi.Razon_Social LIKE '%' + @TerminoBusqueda + '%');
END;
GO

-- 12. SP_ProductoProveedor_Asociar
CREATE OR ALTER PROCEDURE dbo.SP_ProductoProveedor_Asociar
    @Id_Producto INT,
    @Id_Proveedor INT,
    @Precio_Compra DECIMAL(12, 2),
    @EsPrincipal BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Producto WHERE Id_Producto = @Id_Producto AND Estado = 1)
            THROW 50060, 'El producto no existe o está inactivo.', 1;
        IF NOT EXISTS (SELECT 1 FROM Proveedor WHERE Id_Proveedor = @Id_Proveedor AND Estado = 1)
            THROW 50061, 'El proveedor no existe o está inactivo.', 1;
        IF @Precio_Compra <= 0.00
            THROW 50062, 'El precio de compra debe ser mayor a cero.', 1;

        IF @EsPrincipal = 1
        BEGIN
            UPDATE Producto_Proveedor SET EsPrincipal = 0 WHERE Id_Producto = @Id_Producto;
        END

        IF EXISTS (SELECT 1 FROM Producto_Proveedor WHERE Id_Producto = @Id_Producto AND Id_Proveedor = @Id_Proveedor)
        BEGIN
            UPDATE Producto_Proveedor
            SET Precio_Compra = @Precio_Compra,
                EsPrincipal = @EsPrincipal,
                Estado = 1
            WHERE Id_Producto = @Id_Producto AND Id_Proveedor = @Id_Proveedor;
        END
        ELSE
        BEGIN
            INSERT INTO Producto_Proveedor (Id_Producto, Id_Proveedor, Precio_Compra, EsPrincipal, Estado)
            VALUES (@Id_Producto, @Id_Proveedor, @Precio_Compra, @EsPrincipal, 1);
        END

        SELECT 'Asociación producto-proveedor guardada con éxito.' AS Mensaje;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 13. SP_ProductoProveedor_Actualizar
CREATE OR ALTER PROCEDURE dbo.SP_ProductoProveedor_Actualizar
    @Id_Producto_Proveedor INT,
    @Precio_Compra DECIMAL(12, 2),
    @EsPrincipal BIT,
    @Estado BIT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Producto_Proveedor WHERE Id_Producto_Proveedor = @Id_Producto_Proveedor)
            THROW 50065, 'La asociación especificada no existe.', 1;
        IF @Precio_Compra <= 0.00
            THROW 50066, 'El precio de compra debe ser positivo.', 1;

        IF @EsPrincipal = 1
        BEGIN
            DECLARE @IdProd INT = (SELECT Id_Producto FROM Producto_Proveedor WHERE Id_Producto_Proveedor = @Id_Producto_Proveedor);
            UPDATE Producto_Proveedor SET EsPrincipal = 0 WHERE Id_Producto = @IdProd;
        END

        UPDATE Producto_Proveedor
        SET Precio_Compra = @Precio_Compra,
            EsPrincipal = @EsPrincipal,
            Estado = @Estado
        WHERE Id_Producto_Proveedor = @Id_Producto_Proveedor;

        SELECT 'Asociación actualizada exitosamente.' AS Mensaje;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 14. SP_ProductoProveedor_Consultar
CREATE OR ALTER PROCEDURE dbo.SP_ProductoProveedor_Consultar
    @Id_Producto INT = NULL,
    @Id_Proveedor INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        pp.Id_Producto_Proveedor,
        pp.Id_Producto,
        p.Nombre AS Producto,
        pp.Id_Proveedor,
        CASE 
            WHEN tp.Nombre = 'Particular' THEN RTRIM(LTRIM(CONCAT(ppart.Nombre, ' ', ppart.Apellido1, ' ', ISNULL(ppart.Apellido2, ''))))
            WHEN tp.Nombre = 'Institucional' THEN pi.Razon_Social
            ELSE 'No identificado'
        END AS Proveedor,
        pp.Precio_Compra,
        p.Precio_Venta,
        pp.EsPrincipal,
        pp.Estado
    FROM Producto_Proveedor pp
    INNER JOIN Producto p ON pp.Id_Producto = p.Id_Producto
    INNER JOIN Proveedor prov ON pp.Id_Proveedor = prov.Id_Proveedor
    INNER JOIN Tipo_Proveedor tp ON prov.Id_Tipo_Proveedor = tp.Id_Tipo_Proveedor
    LEFT JOIN Proveedor_Particular ppart ON prov.Id_Proveedor = ppart.Id_Proveedor
    LEFT JOIN Proveedor_Institucional pi ON prov.Id_Proveedor = pi.Id_Proveedor
    WHERE (@Id_Producto IS NULL OR pp.Id_Producto = @Id_Producto)
      AND (@Id_Proveedor IS NULL OR pp.Id_Proveedor = @Id_Proveedor);
END;
GO

-- =========================================================================
-- MÓDULO 3: COMPRAS A PROVEEDORES (SPs 15 a 22)
-- =========================================================================

-- 15. SP_Compra_Crear
CREATE OR ALTER PROCEDURE dbo.SP_Compra_Crear
    @Id_Proveedor INT,
    @Id_Usuario INT,
    @Id_Compra_Nueva INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Proveedor WHERE Id_Proveedor = @Id_Proveedor AND Estado = 1)
            THROW 50070, 'El proveedor no existe o se encuentra inactivo.', 1;
        IF NOT EXISTS (SELECT 1 FROM Usuario WHERE Id_Usuario = @Id_Usuario AND Estado = 1)
            THROW 50071, 'El usuario comprador no existe o está inactivo.', 1;

        DECLARE @IdEstadoPendiente INT = (SELECT Id_Estado_Compra FROM Estado_Compra WHERE Nombre_Estado = 'Pendiente');
        IF @IdEstadoPendiente IS NULL
            THROW 50072, 'El estado Pendiente de Compra no está configurado.', 1;

        INSERT INTO Compra (Id_Proveedor, Id_Usuario, Id_Estado_Compra, Fecha_Compra)
        VALUES (@Id_Proveedor, @Id_Usuario, @IdEstadoPendiente, GETDATE());

        SET @Id_Compra_Nueva = SCOPE_IDENTITY();
        SELECT @Id_Compra_Nueva AS Id_Compra, 'Orden de compra inicializada con éxito.' AS Mensaje;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 16. SP_Compra_AgregarProducto
CREATE OR ALTER PROCEDURE dbo.SP_Compra_AgregarProducto
    @Id_Compra INT,
    @Id_Producto INT,
    @Cantidad INT,
    @Costo_Unitario DECIMAL(12, 2) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @EstadoActual VARCHAR(20);
        SELECT @EstadoActual = ec.Nombre_Estado 
        FROM Compra c 
        INNER JOIN Estado_Compra ec ON c.Id_Estado_Compra = ec.Id_Estado_Compra
        WHERE c.Id_Compra = @Id_Compra;

        IF @EstadoActual IS NULL
            THROW 50075, 'La orden de compra no existe.', 1;
        IF @EstadoActual <> 'Pendiente'
            THROW 50076, 'Solo se pueden agregar productos a compras en estado Pendiente.', 1;
        IF @Cantidad <= 0
            THROW 50077, 'La cantidad de compra debe ser estrictamente mayor a cero.', 1;

        IF @Costo_Unitario IS NULL OR @Costo_Unitario <= 0.00
        BEGIN
            -- Obtener costo sugerido desde Producto_Proveedor
            DECLARE @IdProv INT = (SELECT Id_Proveedor FROM Compra WHERE Id_Compra = @Id_Compra);
            SELECT @Costo_Unitario = Precio_Compra 
            FROM Producto_Proveedor 
            WHERE Id_Producto = @Id_Producto AND Id_Proveedor = @IdProv AND Estado = 1;

            IF @Costo_Unitario IS NULL
                THROW 50078, 'Debe especificar el costo unitario de compra para este producto.', 1;
        END

        DECLARE @Subtotal DECIMAL(12, 2) = dbo.FN_CalcularSubtotalDetalle(@Cantidad, @Costo_Unitario);

        IF EXISTS (SELECT 1 FROM Compra_Producto WHERE Id_Compra = @Id_Compra AND Id_Producto = @Id_Producto)
        BEGIN
            UPDATE Compra_Producto
            SET Cantidad = Cantidad + @Cantidad,
                Costo_Unitario = @Costo_Unitario,
                Subtotal = dbo.FN_CalcularSubtotalDetalle(Cantidad + @Cantidad, @Costo_Unitario)
            WHERE Id_Compra = @Id_Compra AND Id_Producto = @Id_Producto;
        END
        ELSE
        BEGIN
            INSERT INTO Compra_Producto (Id_Compra, Id_Producto, Cantidad, Costo_Unitario, Subtotal)
            VALUES (@Id_Compra, @Id_Producto, @Cantidad, @Costo_Unitario, @Subtotal);
        END

        SELECT 'Producto agregado a la compra correctamente.' AS Mensaje;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 17. SP_Compra_ModificarDetalle
CREATE OR ALTER PROCEDURE dbo.SP_Compra_ModificarDetalle
    @Id_Compra_Producto INT,
    @Cantidad INT,
    @Costo_Unitario DECIMAL(12, 2)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @EstadoActual VARCHAR(20);
        SELECT @EstadoActual = ec.Nombre_Estado
        FROM Compra_Producto cp
        INNER JOIN Compra c ON cp.Id_Compra = c.Id_Compra
        INNER JOIN Estado_Compra ec ON c.Id_Estado_Compra = ec.Id_Estado_Compra
        WHERE cp.Id_Compra_Producto = @Id_Compra_Producto;

        IF @EstadoActual IS NULL
            THROW 50080, 'El detalle de compra no existe.', 1;
        IF @EstadoActual <> 'Pendiente'
            THROW 50081, 'Solo se pueden modificar líneas de compras en estado Pendiente.', 1;
        IF @Cantidad <= 0 OR @Costo_Unitario <= 0.00
            THROW 50082, 'Cantidad y costo unitario deben ser mayores a cero.', 1;

        DECLARE @Subtotal DECIMAL(12, 2) = dbo.FN_CalcularSubtotalDetalle(@Cantidad, @Costo_Unitario);

        UPDATE Compra_Producto
        SET Cantidad = @Cantidad,
            Costo_Unitario = @Costo_Unitario,
            Subtotal = @Subtotal
        WHERE Id_Compra_Producto = @Id_Compra_Producto;

        SELECT 'Línea de compra modificada con éxito.' AS Mensaje;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 18. SP_Compra_EliminarDetalle
CREATE OR ALTER PROCEDURE dbo.SP_Compra_EliminarDetalle
    @Id_Compra_Producto INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @EstadoActual VARCHAR(20);
        SELECT @EstadoActual = ec.Nombre_Estado
        FROM Compra_Producto cp
        INNER JOIN Compra c ON cp.Id_Compra = c.Id_Compra
        INNER JOIN Estado_Compra ec ON c.Id_Estado_Compra = ec.Id_Estado_Compra
        WHERE cp.Id_Compra_Producto = @Id_Compra_Producto;

        IF @EstadoActual IS NULL
            THROW 50085, 'El detalle de compra no existe.', 1;
        IF @EstadoActual <> 'Pendiente'
            THROW 50086, 'Solo se pueden eliminar líneas en compras con estado Pendiente.', 1;

        DELETE FROM Compra_Producto WHERE Id_Compra_Producto = @Id_Compra_Producto;

        SELECT 'Línea de compra eliminada con éxito.' AS Mensaje;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 19. SP_Compra_CalcularTotal
CREATE OR ALTER PROCEDURE dbo.SP_Compra_CalcularTotal
    @Id_Compra INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        @Id_Compra AS Id_Compra,
        COUNT(*) AS TotalLineas,
        ISNULL(SUM(Cantidad), 0) AS TotalUnidades,
        ISNULL(SUM(Subtotal), 0.00) AS CostoTotalCompra
    FROM Compra_Producto
    WHERE Id_Compra = @Id_Compra;
END;
GO

-- 20. SP_Compra_Confirmar
CREATE OR ALTER PROCEDURE dbo.SP_Compra_Confirmar
    @Id_Compra INT,
    @Id_Usuario INT,
    @Fecha_Recepcion DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF @Fecha_Recepcion IS NULL
            SET @Fecha_Recepcion = GETDATE();

        DECLARE @EstadoActual VARCHAR(20);
        SELECT @EstadoActual = ec.Nombre_Estado 
        FROM Compra c
        INNER JOIN Estado_Compra ec ON c.Id_Estado_Compra = ec.Id_Estado_Compra
        WHERE c.Id_Compra = @Id_Compra;

        IF @EstadoActual IS NULL
            THROW 50090, 'La compra no existe.', 1;
        IF @EstadoActual <> 'Pendiente'
            THROW 50091, 'Solo compras en estado Pendiente pueden ser confirmadas.', 1;

        IF NOT EXISTS (SELECT 1 FROM Compra_Producto WHERE Id_Compra = @Id_Compra)
            THROW 50092, 'La orden de compra no posee productos registrados.', 1;

        DECLARE @IdEstadoRecibida INT = (SELECT Id_Estado_Compra FROM Estado_Compra WHERE Nombre_Estado = 'Recibida');
        DECLARE @IdTipoEntrada INT = (SELECT Id_Tipo_Movimiento FROM Tipo_Movimiento WHERE Nombre = 'Entrada por Compra');

        -- Cambiar estado a Recibida
        UPDATE Compra 
        SET Id_Estado_Compra = @IdEstadoRecibida
        WHERE Id_Compra = @Id_Compra;

        -- Entrada a inventario y actualización de stock para cada producto
        DECLARE @CursorProd INT, @CursorCant INT;
        DECLARE cur_comp CURSOR LOCAL FAST_FORWARD FOR
            SELECT Id_Producto, Cantidad FROM Compra_Producto WHERE Id_Compra = @Id_Compra;

        OPEN cur_comp;
        FETCH NEXT FROM cur_comp INTO @CursorProd, @CursorCant;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            UPDATE Producto 
            SET Stock_Actual = Stock_Actual + @CursorCant
            WHERE Id_Producto = @CursorProd;

            INSERT INTO Movimiento_Inventario (Id_Producto, Id_Tipo_Movimiento, Id_Usuario, Cantidad, Fecha, Motivo)
            VALUES (@CursorProd, @IdTipoEntrada, @Id_Usuario, @CursorCant, @Fecha_Recepcion, CONCAT('Recepción de Compra #', @Id_Compra));

            FETCH NEXT FROM cur_comp INTO @CursorProd, @CursorCant;
        END

        CLOSE cur_comp;
        DEALLOCATE cur_comp;

        COMMIT TRANSACTION;
        SELECT @Id_Compra AS Id_Compra, 'Compra recibida y stock ingresado al inventario exitosamente.' AS Mensaje;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- 21. SP_Compra_Consultar
CREATE OR ALTER PROCEDURE dbo.SP_Compra_Consultar
    @Id_Compra INT = NULL,
    @FechaInicio DATETIME = NULL,
    @FechaFin DATETIME = NULL,
    @Id_Proveedor INT = NULL,
    @Id_Estado_Compra INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
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
            ELSE 'No identificado'
        END AS Proveedor,
        u.Nombre_Usuario AS Responsable,
        ISNULL(tot.TotalCompra, 0.00) AS Monto_Total,
        ISNULL(tot.TotalArticulos, 0) AS Total_Articulos
    FROM Compra c
    INNER JOIN Estado_Compra ec ON c.Id_Estado_Compra = ec.Id_Estado_Compra
    INNER JOIN Proveedor prov ON c.Id_Proveedor = prov.Id_Proveedor
    INNER JOIN Tipo_Proveedor tp ON prov.Id_Tipo_Proveedor = tp.Id_Tipo_Proveedor
    LEFT JOIN Proveedor_Particular pp ON prov.Id_Proveedor = pp.Id_Proveedor
    LEFT JOIN Proveedor_Institucional pi ON prov.Id_Proveedor = pi.Id_Proveedor
    INNER JOIN Usuario u ON c.Id_Usuario = u.Id_Usuario
    OUTER APPLY (
        SELECT SUM(Subtotal) AS TotalCompra, SUM(Cantidad) AS TotalArticulos
        FROM Compra_Producto WHERE Id_Compra = c.Id_Compra
    ) tot
    WHERE (@Id_Compra IS NULL OR c.Id_Compra = @Id_Compra)
      AND (@FechaInicio IS NULL OR c.Fecha_Compra >= @FechaInicio)
      AND (@FechaFin IS NULL OR c.Fecha_Compra <= @FechaFin)
      AND (@Id_Proveedor IS NULL OR c.Id_Proveedor = @Id_Proveedor)
      AND (@Id_Estado_Compra IS NULL OR c.Id_Estado_Compra = @Id_Estado_Compra)
    ORDER BY c.Fecha_Compra DESC;
END;
GO

-- 22. SP_Compra_Anular
CREATE OR ALTER PROCEDURE dbo.SP_Compra_Anular
    @Id_Compra INT,
    @Id_Usuario INT,
    @Motivo VARCHAR(150)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @EstadoActual VARCHAR(20);
        SELECT @EstadoActual = ec.Nombre_Estado
        FROM Compra c
        INNER JOIN Estado_Compra ec ON c.Id_Estado_Compra = ec.Id_Estado_Compra
        WHERE c.Id_Compra = @Id_Compra;

        IF @EstadoActual IS NULL
            THROW 50095, 'La compra no existe.', 1;
        IF @EstadoActual = 'Anulada'
            THROW 50096, 'La compra ya se encuentra anulada.', 1;

        DECLARE @IdEstadoAnulada INT = (SELECT Id_Estado_Compra FROM Estado_Compra WHERE Nombre_Estado = 'Anulada');
        DECLARE @IdTipoSalidaDev INT = (SELECT Id_Tipo_Movimiento FROM Tipo_Movimiento WHERE Nombre = 'Devolución a Proveedor');

        -- Si ya estaba Recibida, reversar existencias verificando disponibilidad
        IF @EstadoActual = 'Recibida'
        BEGIN
            -- Validar stock suficiente para reversa
            IF EXISTS (
                SELECT 1 FROM Compra_Producto cp
                INNER JOIN Producto p ON cp.Id_Producto = p.Id_Producto
                WHERE cp.Id_Compra = @Id_Compra AND p.Stock_Actual < cp.Cantidad
            )
            BEGIN
                THROW 50097, 'No es posible anular la compra: el stock actual en bodega es menor a lo recibido (artículos ya vendidos).', 1;
            END

            DECLARE @ProdRev INT, @CantRev INT;
            DECLARE cur_rev CURSOR LOCAL FAST_FORWARD FOR
                SELECT Id_Producto, Cantidad FROM Compra_Producto WHERE Id_Compra = @Id_Compra;

            OPEN cur_rev;
            FETCH NEXT FROM cur_rev INTO @ProdRev, @CantRev;
            WHILE @@FETCH_STATUS = 0
            BEGIN
                UPDATE Producto 
                SET Stock_Actual = Stock_Actual - @CantRev
                WHERE Id_Producto = @ProdRev;

                INSERT INTO Movimiento_Inventario (Id_Producto, Id_Tipo_Movimiento, Id_Usuario, Cantidad, Fecha, Motivo)
                VALUES (@ProdRev, @IdTipoSalidaDev, @Id_Usuario, @CantRev, GETDATE(), CONCAT('Reversa por Anulación Compra #', @Id_Compra, ': ', @Motivo));

                FETCH NEXT FROM cur_rev INTO @ProdRev, @CantRev;
            END
            CLOSE cur_rev;
            DEALLOCATE cur_rev;
        END

        UPDATE Compra 
        SET Id_Estado_Compra = @IdEstadoAnulada
        WHERE Id_Compra = @Id_Compra;

        COMMIT TRANSACTION;
        SELECT @Id_Compra AS Id_Compra, 'Compra anulada y registros contables revertidos correctamente.' AS Mensaje;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- =========================================================================
-- MÓDULO 6: VENTAS COMERCIALES (SPs 38 a 46)
-- =========================================================================

-- 37B. SP_Cliente_ValidarCapacidadCredito (Reglas de crédito configurable y morosidad endurecida)
CREATE OR ALTER PROCEDURE dbo.SP_Cliente_ValidarCapacidadCredito
    @Id_Cliente INT,
    @Id_Condicion_Pago INT = NULL,
    @MontoVenta DECIMAL(12, 2) = 0.00
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. POLÍTICA ENDURECIDA DE MOROSIDAD (BLOQUEO TOTAL)
    -- Si el cliente tiene al menos una factura con Saldo_Pendiente > 0 y Fecha_Vencimiento < GETDATE()
    -- se prohíbe terminantemente cualquier venta: NI A CRÉDITO NI DE CONTADO.
    IF EXISTS (
        SELECT 1 FROM dbo.Factura f
        INNER JOIN dbo.Venta v ON f.Id_Venta = v.Id_Venta
        WHERE v.Id_Cliente = @Id_Cliente 
          AND f.Saldo_Pendiente > 0.00 
          AND f.Fecha_Vencimiento < GETDATE()
    )
    BEGIN
        THROW 50182, 'Operación bloqueada: El cliente presenta facturas vencidas en estado MOROSO. Se prohíbe cualquier venta (crédito o contado) hasta la cancelación total de los saldos en mora.', 1;
    END;

    -- 2. Si no se especificó condición de pago o es de contado (Dias_Credito = 0), pasa la validación crediticia
    IF @Id_Condicion_Pago IS NULL RETURN;

    DECLARE @DiasCredito INT = (SELECT Dias_Credito FROM dbo.Condicion_Pago WHERE Id_Condicion_Pago = @Id_Condicion_Pago);
    IF ISNULL(@DiasCredito, 0) = 0 RETURN;

    -- 3. UMBRALES DE CRÉDITO CONFIGURABLES (PLAZOS DE 15, 30 O 45 DÍAS)
    DECLARE @LimiteMonto DECIMAL(12, 2), @LimiteFacturas INT, @PermiteCredito BIT;
    SELECT 
        @LimiteMonto = ISNULL(Limite_Credito_Monto, 300000.00),
        @LimiteFacturas = ISNULL(Limite_Credito_Facturas, 3),
        @PermiteCredito = ISNULL(Permite_Credito, 1)
    FROM dbo.Cliente
    WHERE Id_Cliente = @Id_Cliente;

    IF @PermiteCredito = 0
        THROW 50183, 'El cliente no tiene autorizada la línea de crédito comercial.', 1;

    -- Validar cantidad máxima de compras simultáneas activas
    DECLARE @FacturasActivas INT;
    SELECT @FacturasActivas = COUNT(*)
    FROM dbo.Factura f
    INNER JOIN dbo.Venta v ON f.Id_Venta = v.Id_Venta
    WHERE v.Id_Cliente = @Id_Cliente AND f.Saldo_Pendiente > 0.00;

    IF @FacturasActivas >= @LimiteFacturas
        THROW 50180, 'Límite de compras a crédito alcanzado: El cliente ya posee el máximo de facturas activas permitidas.', 1;

    -- Validar tope de deuda acumulada
    DECLARE @SaldoActual DECIMAL(12, 2);
    SELECT @SaldoActual = ISNULL(SUM(f.Saldo_Pendiente), 0.00)
    FROM dbo.Factura f
    INNER JOIN dbo.Venta v ON f.Id_Venta = v.Id_Venta
    WHERE v.Id_Cliente = @Id_Cliente AND f.Saldo_Pendiente > 0.00;

    IF (@SaldoActual + @MontoVenta) > @LimiteMonto
        THROW 50181, 'Límite de crédito excedido: El monto total adeudado sobrepasaría el límite crediticio autorizado.', 1;
END;
GO

-- 37C. SP_Cliente_ConsultarEstadoCredito (Consulta de capacidad crediticia y morosidad sin acceso directo a tablas)
CREATE OR ALTER PROCEDURE dbo.SP_Cliente_ConsultarEstadoCredito
    @Id_Cliente INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Nombre VARCHAR(200);
    DECLARE @LimiteMonto DECIMAL(12, 2) = 300000.00;
    DECLARE @LimiteFacturas INT = 3;
    DECLARE @PermiteCredito BIT = 1;

    SELECT 
        @Nombre = CASE 
            WHEN tc.Nombre = 'Particular' THEN CONCAT(cp.Nombre, ' ', cp.Apellido1, ISNULL(' ' + cp.Apellido2, ''))
            ELSE ci.Razon_Social 
        END,
        @LimiteMonto = ISNULL(c.Limite_Credito_Monto, 300000.00),
        @LimiteFacturas = ISNULL(c.Limite_Credito_Facturas, 3),
        @PermiteCredito = ISNULL(c.Permite_Credito, 1)
    FROM dbo.Cliente c
    INNER JOIN dbo.Tipo_Cliente tc ON c.Id_Tipo_Cliente = tc.Id_Tipo_Cliente
    LEFT JOIN dbo.Cliente_Particular cp ON c.Id_Cliente = cp.Id_Cliente
    LEFT JOIN dbo.Cliente_Institucional ci ON c.Id_Cliente = ci.Id_Cliente
    WHERE c.Id_Cliente = @Id_Cliente;

    DECLARE @FacturasActivas INT = 0;
    DECLARE @SaldoAdeudado DECIMAL(12, 2) = 0.00;
    DECLARE @FacturasVencidas INT = 0;

    SELECT 
        @FacturasActivas = COUNT(*),
        @SaldoAdeudado = ISNULL(SUM(f.Saldo_Pendiente), 0.00),
        @FacturasVencidas = ISNULL(SUM(CASE WHEN f.Fecha_Vencimiento < GETDATE() AND f.Saldo_Pendiente > 0.00 THEN 1 ELSE 0 END), 0)
    FROM dbo.Factura f
    INNER JOIN dbo.Venta v ON f.Id_Venta = v.Id_Venta
    WHERE v.Id_Cliente = @Id_Cliente AND f.Saldo_Pendiente > 0.00;

    DECLARE @EsMoroso BIT = CASE WHEN @FacturasVencidas > 0 THEN 1 ELSE 0 END;
    DECLARE @CreditoDisponible DECIMAL(12, 2) = CASE WHEN @LimiteMonto > @SaldoAdeudado THEN @LimiteMonto - @SaldoAdeudado ELSE 0.00 END;
    DECLARE @PuedeComprarCredito BIT = CASE WHEN @EsMoroso = 0 AND @PermiteCredito = 1 AND @FacturasActivas < @LimiteFacturas AND @SaldoAdeudado < @LimiteMonto THEN 1 ELSE 0 END;
    DECLARE @PuedeComprarContado BIT = CASE WHEN @EsMoroso = 0 THEN 1 ELSE 0 END;

    SELECT 
        @Id_Cliente AS Id_Cliente,
        ISNULL(@Nombre, 'Cliente No Encontrado') AS Nombre_Cliente,
        @EsMoroso AS Es_Moroso,
        @FacturasVencidas AS Facturas_Vencidas,
        @FacturasActivas AS Facturas_Activas_Credito,
        @LimiteFacturas AS Limite_Facturas,
        @SaldoAdeudado AS Saldo_Adeudado,
        @LimiteMonto AS Limite_Credito_Monto,
        @CreditoDisponible AS Credito_Disponible,
        @PermiteCredito AS Permite_Credito,
        @PuedeComprarCredito AS Puede_Comprar_Credito,
        @PuedeComprarContado AS Puede_Comprar_Contado;
END;
GO

-- 55A3. SP_Cliente_ActualizarCorreoUsuario (Encapsula la actualizacion de correo de cliente bajo PoLP)
CREATE OR ALTER PROCEDURE dbo.SP_Cliente_ActualizarCorreoUsuario
    @Id_Cliente INT,
    @NuevoCorreo VARCHAR(150),
    @Id_Usuario INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @Id_Usuario_Cliente INT;
        SELECT @Id_Usuario_Cliente = Id_Usuario FROM dbo.Cliente WHERE Id_Cliente = @Id_Cliente;

        IF @Id_Usuario_Cliente IS NOT NULL
        BEGIN
            UPDATE dbo.Usuario
            SET Correo = @NuevoCorreo
            WHERE Id_Usuario = @Id_Usuario_Cliente;

            INSERT INTO dbo.Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
            VALUES (@Id_Usuario, 'UPDATE', 'Usuario', @Id_Usuario_Cliente, GETDATE(), LEFT(CONCAT('Actualizacion de correo de cliente a: ', @NuevoCorreo), 200));

            SELECT 1 AS Exito, 'Correo de usuario de cliente actualizado.' AS Mensaje;
        END
        ELSE
        BEGIN
            SELECT 0 AS Exito, 'Cliente no encontrado o sin usuario asociado.' AS Mensaje;
        END
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- =====================================================================
-- 92. SP_ObtenerSugerenciasReabastecimiento (Propuesta 1 - Smart Procurement)
-- =====================================================================
CREATE OR ALTER PROCEDURE dbo.SP_ObtenerSugerenciasReabastecimiento
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        prv.Id_Proveedor,
        prv.Nombre_O_RazonSocial AS Nombre_Proveedor,
        prv.Tipo_Proveedor,
        prv.Telefono_Contacto,
        prv.Correo_Contacto,
        p.Id_Producto,
        p.Nombre AS Nombre_Producto,
        c.Nombre AS Categoria,
        p.Stock_Actual,
        p.Punto_Reorden,
        CASE 
            WHEN ((p.Punto_Reorden * 2) - p.Stock_Actual) > 0 THEN ((p.Punto_Reorden * 2) - p.Stock_Actual)
            ELSE p.Punto_Reorden
        END AS Cantidad_Sugerida,
        pp.Precio_Compra AS Costo_Unitario,
        (
            CASE 
                WHEN ((p.Punto_Reorden * 2) - p.Stock_Actual) > 0 THEN ((p.Punto_Reorden * 2) - p.Stock_Actual)
                ELSE p.Punto_Reorden
            END * pp.Precio_Compra
        ) AS Inversion_Estimada,
        pp.EsPrincipal
    FROM dbo.Producto p
    INNER JOIN dbo.Categoria c ON p.Id_Categoria = c.Id_Categoria
    INNER JOIN dbo.Producto_Proveedor pp ON p.Id_Producto = pp.Id_Producto AND pp.EsPrincipal = 1 AND pp.Estado = 1
    INNER JOIN dbo.VW_ProveedoresActivos prv ON pp.Id_Proveedor = prv.Id_Proveedor
    WHERE p.Stock_Actual <= p.Punto_Reorden
      AND p.Estado = 1
    ORDER BY prv.Nombre_O_RazonSocial, p.Nombre;
END;
GO

/* =========================================================================
   GUÍA PRÁCTICA DE EXPOSICIÓN EN VIVO: CONSULTAS ANTES Y DESPUÉS
   MODULO 1: CLIENTES, PROVEEDORES Y COMPRAS
   INSTRUCCIONES PARA EL EXPOSITOR (SSMS 22):
   - Selecciona con el mouse el bloque de consulta indicado y presiona F5.
   - Sigue los pasos numerados coordinando con tu compañero en el Frontend.
   ========================================================================= */

-- -------------------------------------------------------------------------
-- CASO 1: RECEPCIÓN DE ORDEN DE COMPRA E INGRESO A BODEGA (SP_Compra_Confirmar)
-- -------------------------------------------------------------------------
-- PASO 1 (ANTES): Ejecuta esta consulta para ver la orden en estado PENDIENTE (Id_Estado_Compra: 1)
-- y el stock físico actual de los productos antes de que llegue la mercadería.
SELECT 
    c.Id_Compra,
    CONCAT('OC-', RIGHT('00000000' + CAST(c.Id_Compra AS VARCHAR(10)), 8)) AS Numero_Orden,
    prv.Nombre_O_RazonSocial AS Proveedor,
    ec.Nombre_Estado AS Estado_Compra,
    c.Fecha_Compra,
    u.Nombre_Usuario AS Responsable,
    tot.TotalCompra AS Monto_Total,
    tot.TotalArticulos AS Total_Articulos
FROM dbo.Compra c
INNER JOIN dbo.Estado_Compra ec ON c.Id_Estado_Compra = ec.Id_Estado_Compra
INNER JOIN dbo.VW_ProveedoresActivos prv ON c.Id_Proveedor = prv.Id_Proveedor
INNER JOIN dbo.Usuario u ON c.Id_Usuario = u.Id_Usuario
OUTER APPLY (
    SELECT SUM(Subtotal) AS TotalCompra, SUM(Cantidad) AS TotalArticulos 
    FROM dbo.Compra_Producto WHERE Id_Compra = c.Id_Compra
) tot
WHERE c.Id_Estado_Compra = 1 -- Órdenes pendientes de recepción
ORDER BY c.Id_Compra DESC;

-- PASO 2 (ACCIÓN DEL COMPAÑERO EN EL FRONTEND):
-- El compañero va a la pantalla Compras (/compras), ubica la orden pendiente y hace clic
-- en el botón "Confirmar Ingreso a Bodega" seleccionando la fecha de recepción.

-- PASO 3 (DESPUÉS): Ejecuta esta consulta para demostrar a Torrentes que:
-- 1. La orden cambió a Estado: 'Recibida' (Id_Estado_Compra: 2).
-- 2. El stock físico aumentó en dbo.Producto.
-- 3. Se generó el asiento inmutable en VW_MovimientosInventario (Kárdex).
SELECT TOP 1 
    c.Id_Compra,
    CONCAT('OC-', RIGHT('00000000' + CAST(c.Id_Compra AS VARCHAR(10)), 8)) AS Numero_Orden,
    prv.Nombre_O_RazonSocial AS Proveedor,
    ec.Nombre_Estado AS Estado_Compra,
    c.Fecha_Compra,
    u.Nombre_Usuario AS Responsable,
    tot.TotalCompra AS Monto_Total
FROM dbo.Compra c
INNER JOIN dbo.Estado_Compra ec ON c.Id_Estado_Compra = ec.Id_Estado_Compra
INNER JOIN dbo.VW_ProveedoresActivos prv ON c.Id_Proveedor = prv.Id_Proveedor
INNER JOIN dbo.Usuario u ON c.Id_Usuario = u.Id_Usuario
OUTER APPLY (
    SELECT SUM(Subtotal) AS TotalCompra FROM dbo.Compra_Producto WHERE Id_Compra = c.Id_Compra
) tot
ORDER BY c.Id_Compra DESC;

-- Asientos en Kárdex generados automáticamente por la confirmación de compra:
SELECT TOP 3 
    m.Id_Movimiento_Inventario,
    m.Fecha,
    m.Producto,
    m.Tipo_Movimiento,
    m.Cantidad,
    m.Motivo,
    m.Responsable
FROM dbo.VW_MovimientosInventario m
WHERE m.Naturaleza = 'Entrada'
ORDER BY m.Id_Movimiento_Inventario DESC;

-- Registro en la Bitácora de Auditoría Transversal:
SELECT TOP 1 
    b.Id_Bitacora, b.Fecha_Hora, ISNULL(u.Nombre_Usuario, 'Sistema') AS Usuario, 
    b.Accion, b.Tabla_Afectada, b.Id_Registro_Afectado, b.Descripcion
FROM dbo.Bitacora b
LEFT JOIN dbo.Usuario u ON b.Id_Usuario = u.Id_Usuario
WHERE b.Tabla_Afectada = 'Compra'
ORDER BY b.Id_Bitacora DESC;
GO


-- -------------------------------------------------------------------------
-- CASO 2: ASISTENTE DE REABASTECIMIENTO INTELIGENTE (Smart Procurement)
-- -------------------------------------------------------------------------
-- PASO 1 (DEMOSTRACIÓN DEL SP 92): Ejecuta el procedimiento almacenado en vivo.
-- Demuestra el algoritmo que detecta quiebres de stock (Stock <= Punto_Reorden),
-- calcula la cantidad óptima ((Punto_Reorden * 2) - Stock_Actual) y vincula
-- automáticamente el costo de compra y el proveedor homologado principal.
EXEC dbo.SP_ObtenerSugerenciasReabastecimiento;

-- PASO 2 (ACCIÓN DEL COMPAÑERO EN EL FRONTEND):
-- El compañero muestra en pantalla el banner naranja de "Smart Procurement" en /compras,
-- donde aparece la sugerencia para el Cuaderno Escolar con su costo estimado y el botón
-- "Ver Sugerencias • Emitir en 1 Clic".
GO


-- -------------------------------------------------------------------------
-- CASO 3: AUTORIZACIÓN Y CONTROL DE LÍNEA DE CRÉDITO A CLIENTE INSTITUCIONAL
-- -------------------------------------------------------------------------
-- PASO 1 (ANTES): Consulta el límite de crédito actual y las condiciones del cliente #1
SELECT 
    c.Id_Cliente,
    c.Nombre_O_RazonSocial AS Cliente,
    c.Tipo_Cliente,
    c.Limite_Credito_Monto,
    c.Limite_Credito_Facturas,
    c.Permite_Credito,
    cp.Nombre AS Condicion_Pago,
    cp.Dias_Credito,
    ccp.Estado AS Condicion_Activa
FROM dbo.VW_ClientesActivos c
LEFT JOIN dbo.Cliente_Condicion_Pago ccp ON c.Id_Cliente = ccp.Id_Cliente AND ccp.Estado = 1
LEFT JOIN dbo.Condicion_Pago cp ON ccp.Id_Condicion_Pago = cp.Id_Condicion_Pago
WHERE c.Id_Cliente = 1;

-- PASO 2 (ACCIÓN DEL COMPAÑERO EN EL FRONTEND):
-- En /clientes, el compañero edita el cliente #1 y le ajusta el límite de crédito o condición.

-- PASO 3 (DESPUÉS): Vuelve a ejecutar la consulta del PASO 1 para ver el nuevo límite aplicado en caliente.
GO
