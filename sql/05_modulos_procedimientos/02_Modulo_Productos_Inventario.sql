/* =========================================================================
   PROYECTO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR
   ========================================================================= */

USE MUNDO_ESCOLAR;
GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
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
    @Porcentaje_IVA DECIMAL(5, 2) = 13.00,
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
        IF @Porcentaje_IVA < 0.00
            THROW 50114, 'El porcentaje de IVA no puede ser negativo.', 1;

        INSERT INTO Producto (Id_Categoria, Nombre, Descripcion, Precio_Venta, Stock_Actual, Punto_Reorden, Porcentaje_IVA, Estado)
        VALUES (@Id_Categoria, LTRIM(RTRIM(@Nombre)), @Descripcion, @Precio_Venta, @Stock_Inicial, @Punto_Reorden, ISNULL(@Porcentaje_IVA, 13.00), 1);

        SET @Id_Producto_Nuevo = SCOPE_IDENTITY();

        -- Si se ingresó stock inicial, registrar movimiento inicial en kárdex
        IF @Stock_Inicial > 0
        BEGIN
            DECLARE @IdUsuarioSesion INT = ISNULL(CAST(SESSION_CONTEXT(N'Id_Usuario') AS INT), (SELECT TOP 1 Id_Usuario FROM dbo.Usuario WHERE Nombre_Usuario = 'admin'));
            INSERT INTO dbo.Movimiento_Inventario (Id_Producto, Id_Tipo_Movimiento, Id_Usuario, Cantidad, Fecha, Motivo)
            VALUES (@Id_Producto_Nuevo, 3, @IdUsuarioSesion, @Stock_Inicial, GETDATE(), 'Carga de inventario inicial al registrar producto');
        END

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
    @Descripcion VARCHAR(150) = NULL,
    @Precio_Venta DECIMAL(12, 2),
    @Punto_Reorden INT,
    @Porcentaje_IVA DECIMAL(5, 2) = NULL,
    @Estado BIT = 1
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
        IF @Porcentaje_IVA IS NOT NULL AND @Porcentaje_IVA < 0.00
            THROW 50118, 'El porcentaje de IVA no puede ser negativo.', 1;

        UPDATE Producto
        SET Id_Categoria = @Id_Categoria,
            Nombre = LTRIM(RTRIM(@Nombre)),
            Descripcion = @Descripcion,
            Precio_Venta = @Precio_Venta,
            Punto_Reorden = @Punto_Reorden,
            Porcentaje_IVA = ISNULL(@Porcentaje_IVA, Porcentaje_IVA),
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
        p.Porcentaje_IVA,
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

-- 27B. SP_Producto_CambiarEstado
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

/* =========================================================================
   GUÍA PRÁCTICA DE EXPOSICIÓN EN VIVO: CONSULTAS ANTES Y DESPUÉS
   MODULO 2: PRODUCTOS, CATÁLOGO E INVENTARIO
   INSTRUCCIONES PARA EL EXPOSITOR (SSMS 22):
   - Selecciona con el mouse el bloque de consulta indicado y presiona F5.
   - Sigue los pasos numerados coordinando con tu compañero en el Frontend.
   ========================================================================= */

-- -------------------------------------------------------------------------
-- CASO 1: AJUSTE DE INVENTARIO FÍSICO POR MERMA / TOMA FÍSICA (SP_Inventario_Ajustar)
-- -------------------------------------------------------------------------
-- PASO 1 (ANTES): Consulta el stock actual del artículo antes del ajuste (Ejemplo: Producto #14)
SELECT 
    p.Id_Producto,
    p.Nombre AS Producto,
    c.Nombre AS Categoria,
    p.Stock_Actual,
    p.Punto_Reorden,
    p.Precio_Venta,
    p.Estado
FROM dbo.Producto p
INNER JOIN dbo.Categoria c ON p.Id_Categoria = c.Id_Categoria
WHERE p.Id_Producto = 14;

-- Ver los últimos movimientos de Kárdex registrados para ese producto:
SELECT TOP 2 
    m.Id_Movimiento_Inventario,
    m.Fecha,
    m.Tipo_Movimiento,
    m.Naturaleza,
    m.Cantidad,
    m.Motivo,
    m.Responsable
FROM dbo.VW_MovimientosInventario m
WHERE m.Id_Producto = 14
ORDER BY m.Id_Movimiento_Inventario DESC;

-- PASO 2 (ACCIÓN DEL COMPAÑERO EN EL FRONTEND):
-- En la pantalla Inventario (/inventario), el compañero localiza el artículo #14 (Cuaderno Escolar),
-- presiona el botón de "Ajustar Stock", ingresa una salida por merma de 2 unidades y confirma.

-- PASO 3 (DESPUÉS): Ejecuta nuevamente la consulta para demostrar:
-- 1. La disminución exacta de 2 unidades en el stock físico de dbo.Producto.
-- 2. El nuevo asiento en VW_MovimientosInventario con tipo 'Ajuste Negativo' o 'Salida'.
-- 3. La bitácora transversal registrando quién hizo el ajuste.
SELECT 
    p.Id_Producto,
    p.Nombre AS Producto,
    p.Stock_Actual AS Stock_Actualizado,
    p.Punto_Reorden
FROM dbo.Producto p
WHERE p.Id_Producto = 14;

SELECT TOP 1 
    m.Id_Movimiento_Inventario,
    m.Fecha,
    m.Producto,
    m.Tipo_Movimiento,
    m.Cantidad,
    m.Motivo,
    m.Responsable
FROM dbo.VW_MovimientosInventario m
WHERE m.Id_Producto = 14
ORDER BY m.Id_Movimiento_Inventario DESC;

SELECT TOP 1 
    b.Id_Bitacora, b.Fecha_Hora, ISNULL(u.Nombre_Usuario, 'Sistema') AS Usuario,
    b.Accion, b.Tabla_Afectada, b.Id_Registro_Afectado, b.Descripcion
FROM dbo.Bitacora b
LEFT JOIN dbo.Usuario u ON b.Id_Usuario = u.Id_Usuario
WHERE b.Tabla_Afectada = 'Producto' AND b.Id_Registro_Afectado = 14
ORDER BY b.Id_Bitacora DESC;
GO


-- -------------------------------------------------------------------------
-- CASO 2: GESTIÓN DE SERVICIOS ESCOLARES (FOTOCOPIAS / ANILLADOS)
-- -------------------------------------------------------------------------
-- PASO 1 (ANTES): Consulta el catálogo de servicios escolares y sus tarifas activas
SELECT 
    Id_Servicio,
    Nombre,
    Descripcion,
    Precio_Base,
    Estado
FROM dbo.Servicio
ORDER BY Id_Servicio;

-- PASO 2 (ACCIÓN DEL COMPAÑERO EN EL FRONTEND):
-- En /inventario (Pestaña "Servicios Escolares"), el compañero edita el precio base de un servicio
-- o registra uno nuevo (ej. "Encuadernación Térmica").

-- PASO 3 (DESPUÉS): Vuelve a ejecutar la consulta del PASO 1 para ver la actualización reflejada en la tabla física.
GO
