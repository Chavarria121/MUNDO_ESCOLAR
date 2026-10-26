/* =========================================================================
   PROYECTO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR
   SCRIPT: 10_CrearProcedimientos.sql (y Procedimientos_Almacenados.sql)
   REQUERIMIENTOS: RF1–RF6, RA1–RA5
   REFERENCIA DOCUMENTACIÓN: Sección 17.8.10 (Página 446) y Catálogo de 91 SPs
   DESCRIPCIÓN: Implementación integral de los 91 Procedimientos Almacenados
     organizados en 10 módulos de negocio:
       - MÓDULO 1: Usuarios y Clientes (SPs 1 a 8)
       - MÓDULO 2: Proveedores y Catálogo de Compra (SPs 9 a 14)
       - MÓDULO 3: Compras a Proveedores (SPs 15 a 22)
       - MÓDULO 4: Categorías, Productos y Servicios (SPs 23 a 31)
       - MÓDULO 5: Movimientos e Inventario (SPs 32 a 37)
       - MÓDULO 6: Ventas Comerciales (SPs 38 a 46)
       - MÓDULO 7: Facturación, Pagos y Cuentas por Cobrar (SPs 47 a 53)
       - MÓDULO 8: Seguridad, Usuarios, Roles y Permisos (SPs 54 a 68)
       - MÓDULO 9: DBA, Respaldos y Monitoreo (SPs 69 a 79)
       - MÓDULO 10: ETL y Carga Dimensional (SPs 80 a 91)
   ========================================================================= */

USE MUNDO_ESCOLAR
GO

-- =========================================================================
-- MÓDULO 1: USUARIOS Y CLIENTES (SPs 1 a 8)
-- =========================================================================

-- 1. SP_Usuario_Crear
CREATE OR ALTER PROCEDURE dbo.SP_Usuario_Crear
    @Nombre_Usuario VARCHAR(50),
    @Correo VARCHAR(150),
    @ContrasenaHash VARCHAR(255),
    @Id_Usuario_Nuevo INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF @Nombre_Usuario IS NULL OR LTRIM(RTRIM(@Nombre_Usuario)) = ''
            THROW 50001, 'El nombre de usuario no puede estar vacío.', 1;
        IF @Correo IS NULL OR @Correo NOT LIKE '%_@__%.__%'
            THROW 50002, 'El correo electrónico no posee un formato válido.', 1;
        IF @ContrasenaHash IS NULL OR LEN(@ContrasenaHash) < 10
            THROW 50003, 'El hash de contraseña es requerido y no es válido.', 1;
        IF EXISTS (SELECT 1 FROM Usuario WHERE Nombre_Usuario = @Nombre_Usuario)
            THROW 50004, 'El nombre de usuario ya se encuentra registrado.', 1;
        IF EXISTS (SELECT 1 FROM Usuario WHERE Correo = @Correo)
            THROW 50005, 'El correo electrónico ya se encuentra registrado.', 1;

        INSERT INTO Usuario (Nombre_Usuario, Correo, Contrasena, Fecha_Registro, Estado)
        VALUES (LTRIM(RTRIM(@Nombre_Usuario)), LTRIM(RTRIM(@Correo)), @ContrasenaHash, GETDATE(), 1);

        SET @Id_Usuario_Nuevo = SCOPE_IDENTITY();
        SELECT @Id_Usuario_Nuevo AS Id_Usuario, 'Usuario creado satisfactoriamente.' AS Mensaje;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
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

-- 3. SP_Cliente_Actualizar
CREATE OR ALTER PROCEDURE dbo.SP_Cliente_Actualizar
    @Id_Cliente INT,
    @Telefono VARCHAR(30) = NULL,
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

        IF NOT EXISTS (SELECT 1 FROM Cliente WHERE Id_Cliente = @Id_Cliente)
            THROW 50020, 'El cliente especificado no existe.', 1;

        UPDATE Cliente 
        SET Telefono = ISNULL(@Telefono, Telefono),
            Direccion = ISNULL(@Direccion, Direccion),
            Estado = @Estado
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
        SELECT @Id_Cliente AS Id_Cliente, 'Cliente actualizado correctamente.' AS Mensaje;
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
    @Id_Usuario INT
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
            VALUES (@CursorProd, @IdTipoEntrada, @Id_Usuario, @CursorCant, GETDATE(), CONCAT('Recepción de Compra #', @Id_Compra));

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
-- MÓDULO 4: CATEGORÍAS, PRODUCTOS Y SERVICIOS (SPs 23 a 31)
-- =========================================================================

-- 23. SP_Categoria_Crear
CREATE OR ALTER PROCEDURE dbo.SP_Categoria_Crear
    @Nombre VARCHAR(20),
    @Descripcion VARCHAR(150) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF @Nombre IS NULL OR LTRIM(RTRIM(@Nombre)) = ''
            THROW 50100, 'El nombre de la categoría es obligatorio.', 1;
        IF LEN(@Nombre) > 20
            THROW 50101, 'El nombre de categoría no debe superar 20 caracteres.', 1;
        IF EXISTS (SELECT 1 FROM Categoria WHERE Nombre = @Nombre)
            THROW 50102, 'La categoría ya existe.', 1;

        INSERT INTO Categoria (Nombre, Descripcion, Estado)
        VALUES (LTRIM(RTRIM(@Nombre)), @Descripcion, 1);

        SELECT SCOPE_IDENTITY() AS Id_Categoria, 'Categoría creada exitosamente.' AS Mensaje;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 24. SP_Categoria_Actualizar
CREATE OR ALTER PROCEDURE dbo.SP_Categoria_Actualizar
    @Id_Categoria INT,
    @Nombre VARCHAR(20),
    @Descripcion VARCHAR(150),
    @Estado BIT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Categoria WHERE Id_Categoria = @Id_Categoria)
            THROW 50105, 'La categoría no existe.', 1;

        UPDATE Categoria
        SET Nombre = LTRIM(RTRIM(@Nombre)),
            Descripcion = @Descripcion,
            Estado = @Estado
        WHERE Id_Categoria = @Id_Categoria;

        SELECT 'Categoría actualizada exitosamente.' AS Mensaje;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 25. SP_Producto_Crear
CREATE OR ALTER PROCEDURE dbo.SP_Producto_Crear
    @Id_Categoria INT,
    @Nombre VARCHAR(50),
    @Descripcion VARCHAR(150) = NULL,
    @Precio_Venta DECIMAL(12, 2),
    @Stock_Inicial INT = 0,
    @Punto_Reorden INT = 0,
    @Id_Producto_Nuevo INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Categoria WHERE Id_Categoria = @Id_Categoria AND Estado = 1)
            THROW 50110, 'La categoría no existe o está inactiva.', 1;
        IF @Nombre IS NULL OR LTRIM(RTRIM(@Nombre)) = ''
            THROW 50111, 'El nombre del producto es obligatorio.', 1;
        IF @Precio_Venta < 0.00
            THROW 50112, 'El precio de venta no puede ser negativo.', 1;
        IF @Stock_Inicial < 0 OR @Punto_Reorden < 0
            THROW 50113, 'El stock inicial y el punto de reorden deben ser mayores o iguales a cero.', 1;

        INSERT INTO Producto (Id_Categoria, Nombre, Descripcion, Precio_Venta, Stock_Actual, Punto_Reorden, Estado)
        VALUES (@Id_Categoria, LTRIM(RTRIM(@Nombre)), @Descripcion, @Precio_Venta, @Stock_Inicial, @Punto_Reorden, 1);

        SET @Id_Producto_Nuevo = SCOPE_IDENTITY();
        SELECT @Id_Producto_Nuevo AS Id_Producto, 'Producto creado con éxito.' AS Mensaje;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 26. SP_Producto_Actualizar
CREATE OR ALTER PROCEDURE dbo.SP_Producto_Actualizar
    @Id_Producto INT,
    @Id_Categoria INT,
    @Nombre VARCHAR(50),
    @Descripcion VARCHAR(150),
    @Precio_Venta DECIMAL(12, 2),
    @Punto_Reorden INT,
    @Estado BIT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Producto WHERE Id_Producto = @Id_Producto)
            THROW 50115, 'El producto no existe.', 1;
        IF NOT EXISTS (SELECT 1 FROM Categoria WHERE Id_Categoria = @Id_Categoria)
            THROW 50116, 'La categoría seleccionada no existe.', 1;
        IF @Precio_Venta < 0.00 OR @Punto_Reorden < 0
            THROW 50117, 'Valores numéricos no válidos.', 1;

        UPDATE Producto
        SET Id_Categoria = @Id_Categoria,
            Nombre = LTRIM(RTRIM(@Nombre)),
            Descripcion = @Descripcion,
            Precio_Venta = @Precio_Venta,
            Punto_Reorden = @Punto_Reorden,
            Estado = @Estado
        WHERE Id_Producto = @Id_Producto;

        SELECT 'Producto actualizado exitosamente.' AS Mensaje;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 27. SP_Producto_Consultar
CREATE OR ALTER PROCEDURE dbo.SP_Producto_Consultar
    @Id_Producto INT = NULL,
    @Id_Categoria INT = NULL,
    @TerminoBusqueda VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        p.Id_Producto,
        p.Id_Categoria,
        c.Nombre AS Categoria,
        p.Nombre,
        p.Descripcion,
        p.Precio_Venta,
        p.Stock_Actual,
        p.Punto_Reorden,
        dbo.FN_EstaBajoReorden(p.Stock_Actual, p.Punto_Reorden) AS BajoReorden,
        dbo.FN_EstaAgotado(p.Stock_Actual) AS Agotado,
        p.Estado
    FROM Producto p
    INNER JOIN Categoria c ON p.Id_Categoria = c.Id_Categoria
    WHERE (@Id_Producto IS NULL OR p.Id_Producto = @Id_Producto)
      AND (@Id_Categoria IS NULL OR p.Id_Categoria = @Id_Categoria)
      AND (@TerminoBusqueda IS NULL OR p.Nombre LIKE '%' + @TerminoBusqueda + '%');
END;
GO

-- 28. SP_Servicio_Crear
CREATE OR ALTER PROCEDURE dbo.SP_Servicio_Crear
    @Nombre VARCHAR(50),
    @Descripcion VARCHAR(150) = NULL,
    @Precio_Base DECIMAL(12, 2),
    @Id_Servicio_Nuevo INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF @Nombre IS NULL OR LTRIM(RTRIM(@Nombre)) = ''
            THROW 50120, 'El nombre del servicio es obligatorio.', 1;
        IF @Precio_Base < 0.00
            THROW 50121, 'El precio base no puede ser negativo.', 1;

        INSERT INTO Servicio (Nombre, Descripcion, Precio_Base, Estado)
        VALUES (LTRIM(RTRIM(@Nombre)), @Descripcion, @Precio_Base, 1);

        SET @Id_Servicio_Nuevo = SCOPE_IDENTITY();
        SELECT @Id_Servicio_Nuevo AS Id_Servicio, 'Servicio creado correctamente.' AS Mensaje;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 29. SP_Servicio_Actualizar
CREATE OR ALTER PROCEDURE dbo.SP_Servicio_Actualizar
    @Id_Servicio INT,
    @Nombre VARCHAR(50),
    @Descripcion VARCHAR(150),
    @Precio_Base DECIMAL(12, 2),
    @Estado BIT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Servicio WHERE Id_Servicio = @Id_Servicio)
            THROW 50125, 'El servicio no existe.', 1;
        IF @Precio_Base < 0.00
            THROW 50126, 'El precio base no puede ser negativo.', 1;

        UPDATE Servicio
        SET Nombre = LTRIM(RTRIM(@Nombre)),
            Descripcion = @Descripcion,
            Precio_Base = @Precio_Base,
            Estado = @Estado
        WHERE Id_Servicio = @Id_Servicio;

        SELECT 'Servicio actualizado satisfactoriamente.' AS Mensaje;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 30. SP_Servicio_Consultar
CREATE OR ALTER PROCEDURE dbo.SP_Servicio_Consultar
    @Id_Servicio INT = NULL,
    @TerminoBusqueda VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        Id_Servicio,
        Nombre,
        Descripcion,
        Precio_Base,
        Estado
    FROM Servicio
    WHERE (@Id_Servicio IS NULL OR Id_Servicio = @Id_Servicio)
      AND (@TerminoBusqueda IS NULL OR Nombre LIKE '%' + @TerminoBusqueda + '%');
END;
GO

-- 31. SP_Servicio_Desactivar
CREATE OR ALTER PROCEDURE dbo.SP_Servicio_Desactivar
    @Id_Servicio INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Servicio WHERE Id_Servicio = @Id_Servicio)
            THROW 50130, 'El servicio no existe.', 1;

        UPDATE Servicio SET Estado = 0 WHERE Id_Servicio = @Id_Servicio;
        SELECT 'Servicio deshabilitado para nuevas ventas.' AS Mensaje;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- =========================================================================
-- MÓDULO 5: MOVIMIENTOS E INVENTARIO (SPs 32 a 37)
-- =========================================================================

-- 32. SP_Inventario_Entrada
CREATE OR ALTER PROCEDURE dbo.SP_Inventario_Entrada
    @Id_Producto INT,
    @Cantidad INT,
    @Id_Usuario INT,
    @Motivo VARCHAR(150)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        IF NOT EXISTS (SELECT 1 FROM Producto WHERE Id_Producto = @Id_Producto AND Estado = 1)
            THROW 50140, 'El producto no existe o está inactivo.', 1;
        IF @Cantidad <= 0
            THROW 50141, 'La cantidad de entrada debe ser mayor a cero.', 1;

        DECLARE @IdTipoMov INT = (SELECT Id_Tipo_Movimiento FROM Tipo_Movimiento WHERE Nombre = 'Ajuste Positivo');

        UPDATE Producto SET Stock_Actual = Stock_Actual + @Cantidad WHERE Id_Producto = @Id_Producto;

        INSERT INTO Movimiento_Inventario (Id_Producto, Id_Tipo_Movimiento, Id_Usuario, Cantidad, Fecha, Motivo)
        VALUES (@Id_Producto, @IdTipoMov, @Id_Usuario, @Cantidad, GETDATE(), @Motivo);

        COMMIT TRANSACTION;
        SELECT 'Entrada manual de inventario registrada con éxito.' AS Mensaje;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- 33. SP_Inventario_Salida
CREATE OR ALTER PROCEDURE dbo.SP_Inventario_Salida
    @Id_Producto INT,
    @Cantidad INT,
    @Id_Usuario INT,
    @Motivo VARCHAR(150)
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

        DECLARE @IdTipoMov INT = (SELECT Id_Tipo_Movimiento FROM Tipo_Movimiento WHERE Nombre = 'Ajuste Negativo');

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

-- 34. SP_Inventario_Ajustar
CREATE OR ALTER PROCEDURE dbo.SP_Inventario_Ajustar
    @Id_Producto INT,
    @StockFisicoReal INT,
    @Id_Usuario INT,
    @Motivo VARCHAR(150)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        DECLARE @StockActual INT;
        SELECT @StockActual = Stock_Actual FROM Producto WHERE Id_Producto = @Id_Producto;

        IF @StockActual IS NULL
            THROW 50150, 'El producto no existe.', 1;
        IF @StockFisicoReal < 0
            THROW 50151, 'El stock físico real no puede ser negativo.', 1;

        DECLARE @Diferencia INT = @StockFisicoReal - @StockActual;
        IF @Diferencia = 0
        BEGIN
            COMMIT TRANSACTION;
            SELECT 'El stock físico coincide con el sistema; no se requiere ajuste.' AS Mensaje;
            RETURN;
        END

        DECLARE @IdTipoMov INT;
        IF @Diferencia > 0
            SET @IdTipoMov = (SELECT Id_Tipo_Movimiento FROM Tipo_Movimiento WHERE Nombre = 'Ajuste Positivo');
        ELSE
            SET @IdTipoMov = (SELECT Id_Tipo_Movimiento FROM Tipo_Movimiento WHERE Nombre = 'Ajuste Negativo');

        UPDATE Producto SET Stock_Actual = @StockFisicoReal WHERE Id_Producto = @Id_Producto;

        INSERT INTO Movimiento_Inventario (Id_Producto, Id_Tipo_Movimiento, Id_Usuario, Cantidad, Fecha, Motivo)
        VALUES (@Id_Producto, @IdTipoMov, @Id_Usuario, ABS(@Diferencia), GETDATE(), CONCAT('Conteo físico: ', @Motivo));

        COMMIT TRANSACTION;
        SELECT 'Ajuste de inventario aplicado exitosamente.' AS Mensaje;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- 35. SP_Inventario_ConsultarMovimientos
CREATE OR ALTER PROCEDURE dbo.SP_Inventario_ConsultarMovimientos
    @Id_Producto INT = NULL,
    @FechaInicio DATETIME = NULL,
    @FechaFin DATETIME = NULL,
    @Id_Tipo_Movimiento INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        m.Id_Movimiento_Inventario,
        m.Fecha,
        m.Id_Producto,
        p.Nombre AS Producto,
        tm.Nombre AS Tipo_Movimiento,
        tm.Naturaleza,
        m.Cantidad,
        m.Motivo,
        u.Nombre_Usuario AS Responsable
    FROM Movimiento_Inventario m
    INNER JOIN Producto p ON m.Id_Producto = p.Id_Producto
    INNER JOIN Tipo_Movimiento tm ON m.Id_Tipo_Movimiento = tm.Id_Tipo_Movimiento
    INNER JOIN Usuario u ON m.Id_Usuario = u.Id_Usuario
    WHERE (@Id_Producto IS NULL OR m.Id_Producto = @Id_Producto)
      AND (@FechaInicio IS NULL OR m.Fecha >= @FechaInicio)
      AND (@FechaFin IS NULL OR m.Fecha <= @FechaFin)
      AND (@Id_Tipo_Movimiento IS NULL OR m.Id_Tipo_Movimiento = @Id_Tipo_Movimiento)
    ORDER BY m.Fecha DESC;
END;
GO

-- 36. SP_Inventario_ProductosBajoReorden
CREATE OR ALTER PROCEDURE dbo.SP_Inventario_ProductosBajoReorden
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        p.Id_Producto,
        c.Nombre AS Categoria,
        p.Nombre,
        p.Precio_Venta,
        p.Stock_Actual,
        p.Punto_Reorden,
        (p.Punto_Reorden - p.Stock_Actual) AS UnidadesFaltantes
    FROM Producto p
    INNER JOIN Categoria c ON p.Id_Categoria = c.Id_Categoria
    WHERE p.Stock_Actual <= p.Punto_Reorden AND p.Estado = 1
    ORDER BY (p.Punto_Reorden - p.Stock_Actual) DESC;
END;
GO

-- 37. SP_Inventario_RevertirMovimiento
CREATE OR ALTER PROCEDURE dbo.SP_Inventario_RevertirMovimiento
    @Id_Movimiento_Inventario INT,
    @Id_Usuario INT,
    @Motivo VARCHAR(150)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        DECLARE @IdProd INT, @IdTipoMov INT, @Cant INT, @Naturaleza VARCHAR(20);
        SELECT 
            @IdProd = m.Id_Producto, 
            @IdTipoMov = m.Id_Tipo_Movimiento, 
            @Cant = m.Cantidad,
            @Naturaleza = tm.Naturaleza
        FROM Movimiento_Inventario m
        INNER JOIN Tipo_Movimiento tm ON m.Id_Tipo_Movimiento = tm.Id_Tipo_Movimiento
        WHERE m.Id_Movimiento_Inventario = @Id_Movimiento_Inventario;

        IF @IdProd IS NULL
            THROW 50160, 'El movimiento de inventario no existe.', 1;

        IF @Naturaleza IN ('Entrada', 'Devolución')
        BEGIN
            -- Se había sumado, ahora se debe restar
            IF (SELECT Stock_Actual FROM Producto WHERE Id_Producto = @IdProd) < @Cant
                THROW 50161, 'Stock insuficiente para revertir movimiento de entrada.', 1;

            UPDATE Producto SET Stock_Actual = Stock_Actual - @Cant WHERE Id_Producto = @IdProd;
        END
        ELSE IF @Naturaleza = 'Salida'
        BEGIN
            -- Se había restado, ahora se suma
            UPDATE Producto SET Stock_Actual = Stock_Actual + @Cant WHERE Id_Producto = @IdProd;
        END

        INSERT INTO Movimiento_Inventario (Id_Producto, Id_Tipo_Movimiento, Id_Usuario, Cantidad, Fecha, Motivo)
        VALUES (@IdProd, @IdTipoMov, @Id_Usuario, @Cant, GETDATE(), CONCAT('Reversa de Movimiento #', @Id_Movimiento_Inventario, ': ', @Motivo));

        COMMIT TRANSACTION;
        SELECT 'Movimiento de inventario revertido correctamente.' AS Mensaje;
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
        EXEC dbo.SP_Factura_Generar @Id_Venta, @IdFacturaNueva OUTPUT;

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

-- 47. SP_Factura_Generar
CREATE OR ALTER PROCEDURE dbo.SP_Factura_Generar
    @Id_Venta INT,
    @Id_Factura_Nueva INT OUTPUT
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

        INSERT INTO Factura (Id_Venta, Id_Estado_Factura, Fecha_Emision, Fecha_Vencimiento, Monto_Total, Saldo_Pendiente)
        VALUES (@Id_Venta, @IdEstadoPendiente, GETDATE(), @FechaVenc, @MontoTotal, @MontoTotal);

        SET @Id_Factura_Nueva = SCOPE_IDENTITY();
        SELECT @Id_Factura_Nueva AS Id_Factura, 'Factura emitida correctamente.' AS Mensaje;
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

-- =========================================================================
-- MÓDULO 8: SEGURIDAD, USUARIOS, ROLES Y PERMISOS (SPs 54 a 68)
-- =========================================================================

-- 54. SP_Usuario_Desactivar
CREATE OR ALTER PROCEDURE dbo.SP_Usuario_Desactivar
    @Id_Usuario INT,
    @Id_Usuario_Ejecutor INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Usuario WHERE Id_Usuario = @Id_Usuario)
            THROW 50250, 'El usuario a desactivar no existe.', 1;

        -- Regla de oro: No permitir desactivar al último administrador activo
        IF EXISTS (
            SELECT 1 FROM Rol_Usuario ru
            INNER JOIN Rol r ON ru.Id_Rol = r.Id_Rol
            WHERE ru.Id_Usuario = @Id_Usuario AND r.Nombre = 'Administrador'
        )
        BEGIN
            DECLARE @AdminsActivos INT;
            SELECT @AdminsActivos = COUNT(DISTINCT u.Id_Usuario)
            FROM Usuario u
            INNER JOIN Rol_Usuario ru ON u.Id_Usuario = ru.Id_Usuario
            INNER JOIN Rol r ON ru.Id_Rol = r.Id_Rol
            WHERE r.Nombre = 'Administrador' AND u.Estado = 1;

            IF @AdminsActivos <= 1
                THROW 50251, 'Operación denegada: no se puede desactivar al único administrador activo del sistema.', 1;
        END

        UPDATE Usuario SET Estado = 0 WHERE Id_Usuario = @Id_Usuario;
        SELECT 'Usuario desactivado satisfactoriamente.' AS Mensaje;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 55. SP_Usuario_ObtenerParaAutenticacion
CREATE OR ALTER PROCEDURE dbo.SP_Usuario_ObtenerParaAutenticacion
    @Nombre_Usuario VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        Id_Usuario,
        Nombre_Usuario,
        Correo,
        Contrasena AS HashContrasena,
        Estado
    FROM Usuario
    WHERE Nombre_Usuario = @Nombre_Usuario;
END;
GO

-- 56. SP_Usuario_AsignarRol
CREATE OR ALTER PROCEDURE dbo.SP_Usuario_AsignarRol
    @Id_Usuario INT,
    @Id_Rol INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Usuario WHERE Id_Usuario = @Id_Usuario AND Estado = 1)
            THROW 50255, 'El usuario no existe o está inactivo.', 1;
        IF NOT EXISTS (SELECT 1 FROM Rol WHERE Id_Rol = @Id_Rol AND Estado = 1)
            THROW 50256, 'El rol no existe o está inactivo.', 1;

        IF EXISTS (SELECT 1 FROM Rol_Usuario WHERE Id_Usuario = @Id_Usuario AND Id_Rol = @Id_Rol)
            THROW 50257, 'El usuario ya posee asignado dicho rol.', 1;

        INSERT INTO Rol_Usuario (Id_Rol, Id_Usuario)
        VALUES (@Id_Rol, @Id_Usuario);

        SELECT 'Rol asignado al usuario con éxito.' AS Mensaje;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 57. SP_Usuario_RemoverRol
CREATE OR ALTER PROCEDURE dbo.SP_Usuario_RemoverRol
    @Id_Usuario INT,
    @Id_Rol INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        -- Protección del último administrador
        IF (SELECT Nombre FROM Rol WHERE Id_Rol = @Id_Rol) = 'Administrador'
        BEGIN
            DECLARE @TotalAdmins INT;
            SELECT @TotalAdmins = COUNT(*) 
            FROM Rol_Usuario ru
            INNER JOIN Usuario u ON ru.Id_Usuario = u.Id_Usuario
            WHERE ru.Id_Rol = @Id_Rol AND u.Estado = 1;

            IF @TotalAdmins <= 1
                THROW 50260, 'Operación denegada: no se puede revocar el rol al único Administrador activo del sistema.', 1;
        END

        DELETE FROM Rol_Usuario WHERE Id_Usuario = @Id_Usuario AND Id_Rol = @Id_Rol;
        SELECT 'Rol removido del usuario exitosamente.' AS Mensaje;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 58. SP_Rol_Crear
CREATE OR ALTER PROCEDURE dbo.SP_Rol_Crear
    @Nombre VARCHAR(100),
    @Descripcion VARCHAR(150) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF @Nombre IS NULL OR LTRIM(RTRIM(@Nombre)) = ''
            THROW 50265, 'El nombre del rol es obligatorio.', 1;
        IF EXISTS (SELECT 1 FROM Rol WHERE Nombre = @Nombre)
            THROW 50266, 'Ya existe un rol con ese nombre.', 1;

        INSERT INTO Rol (Nombre, Descripcion, Estado)
        VALUES (LTRIM(RTRIM(@Nombre)), @Descripcion, 1);

        SELECT SCOPE_IDENTITY() AS Id_Rol, 'Rol creado exitosamente.' AS Mensaje;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 59. SP_Rol_Actualizar
CREATE OR ALTER PROCEDURE dbo.SP_Rol_Actualizar
    @Id_Rol INT,
    @Nombre VARCHAR(100),
    @Descripcion VARCHAR(150),
    @Estado BIT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Rol WHERE Id_Rol = @Id_Rol)
            THROW 50270, 'El rol no existe.', 1;

        UPDATE Rol
        SET Nombre = LTRIM(RTRIM(@Nombre)),
            Descripcion = @Descripcion,
            Estado = @Estado
        WHERE Id_Rol = @Id_Rol;

        SELECT 'Rol actualizado correctamente.' AS Mensaje;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 60. SP_Rol_Consultar
CREATE OR ALTER PROCEDURE dbo.SP_Rol_Consultar
    @Id_Rol INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id_Rol, Nombre, Descripcion, Estado
    FROM Rol
    WHERE (@Id_Rol IS NULL OR Id_Rol = @Id_Rol);
END;
GO

-- 61. SP_Rol_AsignarPermiso
CREATE OR ALTER PROCEDURE dbo.SP_Rol_AsignarPermiso
    @Id_Rol INT,
    @Id_Permiso INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Rol WHERE Id_Rol = @Id_Rol AND Estado = 1)
            THROW 50275, 'El rol no existe o está inactivo.', 1;
        IF NOT EXISTS (SELECT 1 FROM Permiso WHERE Id_Permiso = @Id_Permiso)
            THROW 50276, 'El permiso no existe.', 1;

        IF EXISTS (SELECT 1 FROM Rol_Permiso WHERE Id_Rol = @Id_Rol AND Id_Permiso = @Id_Permiso)
            THROW 50277, 'El permiso ya está asignado a este rol.', 1;

        INSERT INTO Rol_Permiso (Id_Rol, Id_Permiso)
        VALUES (@Id_Rol, @Id_Permiso);

        SELECT 'Permiso asignado al rol con éxito.' AS Mensaje;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 62. SP_Rol_RemoverPermiso
CREATE OR ALTER PROCEDURE dbo.SP_Rol_RemoverPermiso
    @Id_Rol INT,
    @Id_Permiso INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DELETE FROM Rol_Permiso WHERE Id_Rol = @Id_Rol AND Id_Permiso = @Id_Permiso;
        SELECT 'Permiso revocado del rol exitosamente.' AS Mensaje;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 63. SP_Permiso_Crear
CREATE OR ALTER PROCEDURE dbo.SP_Permiso_Crear
    @Nombre VARCHAR(100),
    @Descripcion VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF @Nombre IS NULL OR LTRIM(RTRIM(@Nombre)) = ''
            THROW 50280, 'El nombre de permiso es obligatorio.', 1;
        IF EXISTS (SELECT 1 FROM Permiso WHERE Nombre = @Nombre)
            THROW 50281, 'El permiso ya se encuentra registrado.', 1;

        INSERT INTO Permiso (Nombre, Descripcion)
        VALUES (LTRIM(RTRIM(@Nombre)), @Descripcion);

        SELECT SCOPE_IDENTITY() AS Id_Permiso, 'Permiso creado exitosamente.' AS Mensaje;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 64. SP_Permiso_Actualizar
CREATE OR ALTER PROCEDURE dbo.SP_Permiso_Actualizar
    @Id_Permiso INT,
    @Nombre VARCHAR(100),
    @Descripcion VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM Permiso WHERE Id_Permiso = @Id_Permiso)
            THROW 50285, 'El permiso no existe.', 1;

        UPDATE Permiso
        SET Nombre = LTRIM(RTRIM(@Nombre)),
            Descripcion = @Descripcion
        WHERE Id_Permiso = @Id_Permiso;

        SELECT 'Permiso actualizado correctamente.' AS Mensaje;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 65. SP_Permiso_Consultar
CREATE OR ALTER PROCEDURE dbo.SP_Permiso_Consultar
    @Id_Permiso INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id_Permiso, Nombre, Descripcion
    FROM Permiso
    WHERE (@Id_Permiso IS NULL OR Id_Permiso = @Id_Permiso);
END;
GO

-- 66. SP_Permiso_ConsultarUsuario
CREATE OR ALTER PROCEDURE dbo.SP_Permiso_ConsultarUsuario
    @Id_Usuario INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT DISTINCT
        p.Id_Permiso,
        p.Nombre AS Nombre_Permiso,
        p.Descripcion
    FROM Permiso p
    INNER JOIN Rol_Permiso rp ON p.Id_Permiso = rp.Id_Permiso
    INNER JOIN Rol r ON rp.Id_Rol = r.Id_Rol
    INNER JOIN Rol_Usuario ru ON r.Id_Rol = ru.Id_Rol
    WHERE ru.Id_Usuario = @Id_Usuario AND r.Estado = 1;
END;
GO

-- 67. SP_Auditoria_Registrar
CREATE OR ALTER PROCEDURE dbo.SP_Auditoria_Registrar
    @Id_Usuario INT,
    @Accion VARCHAR(100),
    @Tabla_Afectada VARCHAR(100),
    @Id_Registro_Afectado INT = NULL,
    @Descripcion VARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
    VALUES (@Id_Usuario, @Accion, @Tabla_Afectada, @Id_Registro_Afectado, GETDATE(), @Descripcion);
END;
GO

-- 68. SP_Auditoria_Consultar
CREATE OR ALTER PROCEDURE dbo.SP_Auditoria_Consultar
    @Id_Usuario INT = NULL,
    @FechaInicio DATETIME = NULL,
    @FechaFin DATETIME = NULL,
    @Tabla VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
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
    INNER JOIN Usuario u ON b.Id_Usuario = u.Id_Usuario
    WHERE (@Id_Usuario IS NULL OR b.Id_Usuario = @Id_Usuario)
      AND (@FechaInicio IS NULL OR b.Fecha_Hora >= @FechaInicio)
      AND (@FechaFin IS NULL OR b.Fecha_Hora <= @FechaFin)
      AND (@Tabla IS NULL OR b.Tabla_Afectada = @Tabla)
    ORDER BY b.Fecha_Hora DESC;
END;
GO


-- =========================================================================
-- MÓDULO 9: DBA, RESPALDOS Y MONITOREO (SPs 69 a 79)
-- =========================================================================

-- 69. SP_DBA_EjecutarBackupCompleto
CREATE OR ALTER PROCEDURE dbo.SP_DBA_EjecutarBackupCompleto
    @RutaCarpetaBackup VARCHAR(255) = 'C:\SQLBackup'
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @FechaStr VARCHAR(20) = REPLACE(REPLACE(REPLACE(CONVERT(VARCHAR(19), GETDATE(), 120), '-', ''), ':', ''), ' ', '_');
        DECLARE @ArchivoBak VARCHAR(500) = @RutaCarpetaBackup + '\MUNDO_ESCOLAR_FULL_' + @FechaStr + '.bak';

        DECLARE @Sql NVARCHAR(MAX) = N'BACKUP DATABASE MUNDO_ESCOLAR TO DISK = ''' + @ArchivoBak + ''' WITH FORMAT, INIT, COMPRESSION, STATS = 10;';
        EXEC sp_executesql @Sql;

        INSERT INTO Bitacora (Id_Usuario, Accion, Tabla_Afectada, Fecha_Hora, Descripcion)
        VALUES (1, 'BACKUP_FULL', 'DATABASE', GETDATE(), CONCAT('Respaldo completo generado en: ', @ArchivoBak));

        SELECT 'Respaldo completo generado exitosamente.' AS Mensaje, @ArchivoBak AS Archivo;
    END TRY
    BEGIN CATCH
        INSERT INTO Bitacora (Id_Usuario, Accion, Tabla_Afectada, Fecha_Hora, Descripcion)
        VALUES (1, 'ERROR_BACKUP_FULL', 'DATABASE', GETDATE(), CONCAT('Fallo en backup completo: ', ERROR_MESSAGE()));
        THROW;
    END CATCH
END;
GO

-- 70. SP_DBA_EjecutarBackupDiferencial
CREATE OR ALTER PROCEDURE dbo.SP_DBA_EjecutarBackupDiferencial
    @RutaCarpetaBackup VARCHAR(255) = 'C:\SQLBackup'
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @FechaStr VARCHAR(20) = REPLACE(REPLACE(REPLACE(CONVERT(VARCHAR(19), GETDATE(), 120), '-', ''), ':', ''), ' ', '_');
        DECLARE @ArchivoBak VARCHAR(500) = @RutaCarpetaBackup + '\MUNDO_ESCOLAR_DIFF_' + @FechaStr + '.bak';

        DECLARE @Sql NVARCHAR(MAX) = N'BACKUP DATABASE MUNDO_ESCOLAR TO DISK = ''' + @ArchivoBak + ''' WITH DIFFERENTIAL, FORMAT, INIT, COMPRESSION, STATS = 10;';
        EXEC sp_executesql @Sql;

        INSERT INTO Bitacora (Id_Usuario, Accion, Tabla_Afectada, Fecha_Hora, Descripcion)
        VALUES (1, 'BACKUP_DIFF', 'DATABASE', GETDATE(), CONCAT('Respaldo diferencial generado en: ', @ArchivoBak));

        SELECT 'Respaldo diferencial generado exitosamente.' AS Mensaje, @ArchivoBak AS Archivo;
    END TRY
    BEGIN CATCH
        INSERT INTO Bitacora (Id_Usuario, Accion, Tabla_Afectada, Fecha_Hora, Descripcion)
        VALUES (1, 'ERROR_BACKUP_DIFF', 'DATABASE', GETDATE(), CONCAT('Fallo en backup diferencial: ', ERROR_MESSAGE()));
        THROW;
    END CATCH
END;
GO

-- 71. SP_DBA_EjecutarBackupLog
CREATE OR ALTER PROCEDURE dbo.SP_DBA_EjecutarBackupLog
    @RutaCarpetaBackup VARCHAR(255) = 'C:\SQLBackup'
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @RecoveryModel VARCHAR(50);
        SELECT @RecoveryModel = recovery_model_desc FROM sys.databases WHERE name = 'MUNDO_ESCOLAR';

        IF @RecoveryModel = 'SIMPLE'
        BEGIN
            SELECT 'El modelo de recuperación de MUNDO_ESCOLAR es SIMPLE; no requiere respaldo del registro de transacciones (.trn).' AS Mensaje;
            RETURN;
        END

        DECLARE @FechaStr VARCHAR(20) = REPLACE(REPLACE(REPLACE(CONVERT(VARCHAR(19), GETDATE(), 120), '-', ''), ':', ''), ' ', '_');
        DECLARE @ArchivoTrn VARCHAR(500) = @RutaCarpetaBackup + '\MUNDO_ESCOLAR_LOG_' + @FechaStr + '.trn';

        DECLARE @Sql NVARCHAR(MAX) = N'BACKUP LOG MUNDO_ESCOLAR TO DISK = ''' + @ArchivoTrn + ''' WITH FORMAT, INIT, COMPRESSION;';
        EXEC sp_executesql @Sql;

        INSERT INTO Bitacora (Id_Usuario, Accion, Tabla_Afectada, Fecha_Hora, Descripcion)
        VALUES (1, 'BACKUP_LOG', 'DATABASE', GETDATE(), CONCAT('Respaldo de log generado en: ', @ArchivoTrn));

        SELECT 'Respaldo de Log ejecutado exitosamente.' AS Mensaje, @ArchivoTrn AS Archivo;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 72. SP_DBA_VerificarIntegridadBackup
CREATE OR ALTER PROCEDURE dbo.SP_DBA_VerificarIntegridadBackup
    @RutaArchivoBak VARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @Sql NVARCHAR(MAX) = N'RESTORE VERIFYONLY FROM DISK = ''' + @RutaArchivoBak + ''';';
        EXEC sp_executesql @Sql;

        INSERT INTO Bitacora (Id_Usuario, Accion, Tabla_Afectada, Fecha_Hora, Descripcion)
        VALUES (1, 'VERIFY_BACKUP_OK', 'DATABASE', GETDATE(), CONCAT('Archivo verificado correctamente: ', @RutaArchivoBak));

        SELECT 'El archivo de respaldo es técnicamente íntegro y legible por SQL Server.' AS Resultado, @RutaArchivoBak AS Archivo;
    END TRY
    BEGIN CATCH
        INSERT INTO Bitacora (Id_Usuario, Accion, Tabla_Afectada, Fecha_Hora, Descripcion)
        VALUES (1, 'VERIFY_BACKUP_FAIL', 'DATABASE', GETDATE(), CONCAT('Fallo en verificación de backup: ', ERROR_MESSAGE()));
        THROW;
    END CATCH
END;
GO

-- 73. SP_DBA_VerificarIntegridadBD
CREATE OR ALTER PROCEDURE dbo.SP_DBA_VerificarIntegridadBD
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DBCC CHECKDB ('MUNDO_ESCOLAR') WITH NO_INFOMSGS, ALL_ERRORMSGS;

        INSERT INTO Bitacora (Id_Usuario, Accion, Tabla_Afectada, Fecha_Hora, Descripcion)
        VALUES (1, 'CHECKDB_OK', 'MUNDO_ESCOLAR', GETDATE(), 'DBCC CHECKDB ejecutado sin errores de consistencia.');

        SELECT 'Consistencia física y lógica de MUNDO_ESCOLAR verificada: 0 errores detectados.' AS EstadoConsistencia;
    END TRY
    BEGIN CATCH
        INSERT INTO Bitacora (Id_Usuario, Accion, Tabla_Afectada, Fecha_Hora, Descripcion)
        VALUES (1, 'CHECKDB_ERROR', 'MUNDO_ESCOLAR', GETDATE(), CONCAT('Errores de consistencia detectados: ', ERROR_MESSAGE()));
        THROW;
    END CATCH
END;
GO

-- 74. SP_DBA_MantenimientoIndices
CREATE OR ALTER PROCEDURE dbo.SP_DBA_MantenimientoIndices
    @Modo VARCHAR(20) = 'SoloAnalizar' -- 'SoloAnalizar' o 'Ejecutar'
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        DECLARE @Resultados TABLE (
            Tabla VARCHAR(100),
            Indice VARCHAR(100),
            Fragmentacion DECIMAL(5, 2),
            AccionRecomendada VARCHAR(50)
        );

        INSERT INTO @Resultados (Tabla, Indice, Fragmentacion, AccionRecomendada)
        SELECT 
            t.name AS Tabla,
            i.name AS Indice,
            ROUND(ps.avg_fragmentation_in_percent, 2) AS Fragmentacion,
            CASE 
                WHEN ps.avg_fragmentation_in_percent > 30.0 THEN 'ALTER INDEX REBUILD'
                WHEN ps.avg_fragmentation_in_percent BETWEEN 10.0 AND 30.0 THEN 'ALTER INDEX REORGANIZE'
                ELSE 'Ninguna (Fragmentación aceptable)'
            END AS AccionRecomendada
        FROM sys.dm_db_index_physical_stats(DB_ID('MUNDO_ESCOLAR'), NULL, NULL, NULL, 'LIMITED') ps
        INNER JOIN sys.tables t ON ps.object_id = t.object_id
        INNER JOIN sys.indexes i ON ps.object_id = i.object_id AND ps.index_id = i.index_id
        WHERE ps.page_count > 10 -- Evaluar índices significativos
          AND i.name IS NOT NULL;

        IF UPPER(@Modo) = 'EJECUTAR'
        BEGIN
            DECLARE @T VARCHAR(100), @I VARCHAR(100), @Accion VARCHAR(50);
            DECLARE cur_idx CURSOR LOCAL FAST_FORWARD FOR
                SELECT Tabla, Indice, AccionRecomendada FROM @Resultados WHERE AccionRecomendada LIKE 'ALTER INDEX%';

            OPEN cur_idx;
            FETCH NEXT FROM cur_idx INTO @T, @I, @Accion;
            WHILE @@FETCH_STATUS = 0
            BEGIN
                DECLARE @SqlIndex NVARCHAR(MAX) = @Accion + ' [' + @I + '] ON dbo.[' + @T + '];';
                EXEC sp_executesql @SqlIndex;
                FETCH NEXT FROM cur_idx INTO @T, @I, @Accion;
            END
            CLOSE cur_idx;
            DEALLOCATE cur_idx;

            INSERT INTO Bitacora (Id_Usuario, Accion, Tabla_Afectada, Fecha_Hora, Descripcion)
            VALUES (1, 'MANTENIMIENTO_INDICES', 'INDICES', GETDATE(), 'Mantenimiento de índices ejecutado.');
        END

        SELECT * FROM @Resultados ORDER BY Fragmentacion DESC;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 75. SP_DBA_ActualizarEstadisticas
CREATE OR ALTER PROCEDURE dbo.SP_DBA_ActualizarEstadisticas
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        UPDATE STATISTICS dbo.Venta WITH FULLSCAN;
        UPDATE STATISTICS dbo.Factura WITH FULLSCAN;
        UPDATE STATISTICS dbo.Pago WITH FULLSCAN;
        UPDATE STATISTICS dbo.Producto WITH FULLSCAN;
        UPDATE STATISTICS dbo.Movimiento_Inventario WITH FULLSCAN;

        INSERT INTO Bitacora (Id_Usuario, Accion, Tabla_Afectada, Fecha_Hora, Descripcion)
        VALUES (1, 'ESTADISTICAS_ACTUALIZADAS', 'TABLAS_CRITICAS', GETDATE(), 'Actualización con FULLSCAN en tablas transaccionales de alto volumen.');

        SELECT 'Estadísticas de consulta actualizadas para tablas de alta concurrencia.' AS Mensaje, GETDATE() AS FechaHora;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- 76. SP_DBA_MonitorearEspacioArchivos
CREATE OR ALTER PROCEDURE dbo.SP_DBA_MonitorearEspacioArchivos
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        name AS NombreLogico,
        type_desc AS TipoArchivo,
        physical_name AS RutaFisica,
        ROUND((size * 8.0) / 1024.0, 2) AS TamanoAsignadoMB,
        ROUND(((size - FILEPROPERTY(name, 'SpaceUsed')) * 8.0) / 1024.0, 2) AS EspacioLibreInternoMB,
        ROUND((((size - FILEPROPERTY(name, 'SpaceUsed')) * 1.0) / size) * 100.0, 2) AS PorcentajeEspacioLibre,
        CASE 
            WHEN ((((size - FILEPROPERTY(name, 'SpaceUsed')) * 1.0) / size) * 100.0) < 15.0 THEN 'ALERTA: Espacio libre menor al 15%'
            ELSE 'Óptimo'
        END AS EstadoAlerta
    FROM sys.database_files;
END;
GO

-- 77. SP_DBA_ConsultarHistorialBackups
CREATE OR ALTER PROCEDURE dbo.SP_DBA_ConsultarHistorialBackups
    @DiasAtras INT = 30
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        bs.database_name AS BaseDatos,
        CASE bs.type 
            WHEN 'D' THEN 'Completo (Full)'
            WHEN 'I' THEN 'Diferencial'
            WHEN 'L' THEN 'Log de Transacciones'
            ELSE bs.type
        END AS TipoRespaldo,
        bs.backup_start_date AS Inicio,
        bs.backup_finish_date AS Fin,
        ROUND((bs.backup_size / 1048576.0), 2) AS TamanoMB,
        ROUND((bs.compressed_backup_size / 1048576.0), 2) AS TamanoComprimidoMB,
        bmf.physical_device_name AS ArchivoDestino,
        bs.user_name AS UsuarioEjecutor
    FROM msdb.dbo.backupset bs
    INNER JOIN msdb.dbo.backupmediafamily bmf ON bs.media_set_id = bmf.media_set_id
    WHERE bs.database_name = 'MUNDO_ESCOLAR'
      AND bs.backup_start_date >= DATEADD(DAY, -@DiasAtras, GETDATE())
    ORDER BY bs.backup_start_date DESC;
END;
GO

-- 78. SP_DBA_MonitorearBloqueosYSesiones
CREATE OR ALTER PROCEDURE dbo.SP_DBA_MonitorearBloqueosYSesiones
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        r.session_id AS SessionID,
        s.login_name AS LoginName,
        s.host_name AS HostName,
        r.status AS Estado,
        r.blocking_session_id AS BloqueadoPorSessionID,
        r.wait_type AS TipoEspera,
        r.wait_time AS TiempoEsperaMs,
        t.text AS ConsultaEjecutada
    FROM sys.dm_exec_requests r
    INNER JOIN sys.dm_exec_sessions s ON r.session_id = s.session_id
    CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t
    WHERE r.session_id <> @@SPID;
END;
GO

-- 79. SP_DBA_AuditoriaPermisosFallidos
CREATE OR ALTER PROCEDURE dbo.SP_DBA_AuditoriaPermisosFallidos
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        Id_Bitacora,
        Fecha_Hora,
        Id_Usuario,
        Accion,
        Tabla_Afectada,
        Descripcion
    FROM Bitacora
    WHERE Accion LIKE '%ERROR%' 
       OR Accion LIKE '%DENEGADO%' 
       OR Accion LIKE '%FALLIDO%'
       OR Descripcion LIKE '%denegad%'
    ORDER BY Fecha_Hora DESC;
END;
GO

-- =========================================================================
-- MÓDULO 10: ETL Y CARGA DIMENSIONAL (SPs 80 a 91)
-- =========================================================================

-- Aseguramiento del esquema dw para soporte dimensional local o enlazado
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'dw')
    EXEC('CREATE SCHEMA dw AUTHORIZATION dbo;');
GO

-- Tablas dimensionales mínimas para soporte del ETL
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'DimFecha' AND schema_id = SCHEMA_ID('dw'))
BEGIN
    CREATE TABLE dw.DimFecha (
        Sk_Fecha INT PRIMARY KEY,
        Fecha DATE NOT NULL UNIQUE,
        Anio INT NOT NULL,
        Mes INT NOT NULL,
        Nombre_Mes VARCHAR(20) NOT NULL,
        Trimestre INT NOT NULL,
        Dia_Semana INT NOT NULL,
        Es_Fin_Semana BIT NOT NULL
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'DimCliente' AND schema_id = SCHEMA_ID('dw'))
BEGIN
    CREATE TABLE dw.DimCliente (
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
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'DimProducto' AND schema_id = SCHEMA_ID('dw'))
BEGIN
    CREATE TABLE dw.DimProducto (
        Sk_Producto INT IDENTITY(1,1) PRIMARY KEY,
        Id_Producto INT NOT NULL,
        Nombre_Producto VARCHAR(100) NOT NULL,
        Categoria VARCHAR(50) NOT NULL,
        Precio_Venta_Actual DECIMAL(12,2) NOT NULL,
        Estado BIT NOT NULL
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'DimServicio' AND schema_id = SCHEMA_ID('dw'))
BEGIN
    CREATE TABLE dw.DimServicio (
        Sk_Servicio INT IDENTITY(1,1) PRIMARY KEY,
        Id_Servicio INT NOT NULL,
        Nombre_Servicio VARCHAR(100) NOT NULL,
        Precio_Base DECIMAL(12,2) NOT NULL,
        Estado BIT NOT NULL
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'DimCondicionPago' AND schema_id = SCHEMA_ID('dw'))
BEGIN
    CREATE TABLE dw.DimCondicionPago (
        Sk_Condicion_Pago INT IDENTITY(1,1) PRIMARY KEY,
        Id_Condicion_Pago INT NOT NULL,
        Nombre VARCHAR(50) NOT NULL,
        Dias_Credito INT NOT NULL
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'DimVendedor' AND schema_id = SCHEMA_ID('dw'))
BEGIN
    CREATE TABLE dw.DimVendedor (
        Sk_Vendedor INT IDENTITY(1,1) PRIMARY KEY,
        Id_Usuario INT NOT NULL,
        Nombre_Usuario VARCHAR(50) NOT NULL,
        Rol VARCHAR(50) NOT NULL
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'DimMetodoPago' AND schema_id = SCHEMA_ID('dw'))
BEGIN
    CREATE TABLE dw.DimMetodoPago (
        Sk_Metodo_Pago INT IDENTITY(1,1) PRIMARY KEY,
        Id_Metodo_Pago INT NOT NULL,
        Nombre VARCHAR(50) NOT NULL
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'FactVentas' AND schema_id = SCHEMA_ID('dw'))
BEGIN
    CREATE TABLE dw.FactVentas (
        Id_Venta INT PRIMARY KEY,
        Sk_Fecha INT NOT NULL,
        Sk_Cliente INT NOT NULL,
        Sk_Vendedor INT NOT NULL,
        Sk_Condicion_Pago INT NOT NULL,
        Subtotal DECIMAL(12,2) NOT NULL,
        Impuesto DECIMAL(12,2) NOT NULL,
        Monto_Total DECIMAL(12,2) NOT NULL
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'FactVentaProducto' AND schema_id = SCHEMA_ID('dw'))
BEGIN
    CREATE TABLE dw.FactVentaProducto (
        Id_Venta_Producto INT PRIMARY KEY,
        Id_Venta INT NOT NULL,
        Sk_Fecha INT NOT NULL,
        Sk_Producto INT NOT NULL,
        Cantidad INT NOT NULL,
        Precio_Unitario DECIMAL(12,2) NOT NULL,
        Subtotal DECIMAL(12,2) NOT NULL
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'FactVentaServicio' AND schema_id = SCHEMA_ID('dw'))
BEGIN
    CREATE TABLE dw.FactVentaServicio (
        Id_Venta_Servicio INT PRIMARY KEY,
        Id_Venta INT NOT NULL,
        Sk_Fecha INT NOT NULL,
        Sk_Servicio INT NOT NULL,
        Cantidad INT NOT NULL,
        Precio_Unitario DECIMAL(12,2) NOT NULL,
        Subtotal DECIMAL(12,2) NOT NULL
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'FactPagos' AND schema_id = SCHEMA_ID('dw'))
BEGIN
    CREATE TABLE dw.FactPagos (
        Id_Pago INT PRIMARY KEY,
        Id_Factura INT NOT NULL,
        Sk_Fecha INT NOT NULL,
        Sk_Metodo_Pago INT NOT NULL,
        Monto_Pagado DECIMAL(12,2) NOT NULL
    );
END
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

-- 81. SP_ETL_CargarDimCliente
CREATE OR ALTER PROCEDURE dbo.SP_ETL_CargarDimCliente
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dw.DimCliente (Id_Cliente, Tipo_Cliente, Identificacion, Nombre_Completo, Telefono, Direccion, Estado_Operacional, Fecha_Inicio, Es_Actual)
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
    WHERE NOT EXISTS (SELECT 1 FROM dw.DimCliente dc WHERE dc.Id_Cliente = c.Id_Cliente AND dc.Es_Actual = 1);

    SELECT COUNT(*) AS TotalDimCliente FROM dw.DimCliente;
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

-- 87. SP_ETL_CargarFactVentas
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
    FROM Venta v
    INNER JOIN Estado_Venta ev ON v.Id_Estado_Venta = ev.Id_Estado_Venta
    INNER JOIN dw.DimCliente dc ON v.Id_Cliente = dc.Id_Cliente AND dc.Es_Actual = 1
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
    INSERT INTO dw.FactVentaProducto (Id_Venta_Producto, Id_Venta, Sk_Fecha, Sk_Producto, Cantidad, Precio_Unitario, Subtotal)
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
    INNER JOIN dw.DimProducto dp ON vp.Id_Producto = dp.Id_Producto
    WHERE ev.Nombre_Estado = 'Confirmada'
      AND NOT EXISTS (SELECT 1 FROM dw.FactVentaProducto fvp WHERE fvp.Id_Venta_Producto = vp.Id_Venta_Producto);

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

PRINT '91 Procedimientos Almacenados instalados exitosamente en MUNDO_ESCOLAR.';
GO
