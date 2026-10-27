USE DW_MundoEscolar;
GO

SET XACT_ABORT ON;
GO

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @FechaCorte DATETIME = GETDATE();
    DECLARE @TieneFechaInicio BIT = CASE WHEN COL_LENGTH('dbo.DimProducto', 'Fecha_Inicio') IS NULL THEN 0 ELSE 1 END;
    DECLARE @TieneFechaFin BIT = CASE WHEN COL_LENGTH('dbo.DimProducto', 'Fecha_Fin') IS NULL THEN 0 ELSE 1 END;
    DECLARE @TieneEsActual BIT = CASE WHEN COL_LENGTH('dbo.DimProducto', 'Es_Actual') IS NULL THEN 0 ELSE 1 END;

    IF OBJECT_ID('dbo.DimCliente', 'U') IS NULL
       OR OBJECT_ID('dbo.DimProducto', 'U') IS NULL
       OR OBJECT_ID('dbo.FactVenta', 'U') IS NULL
       OR OBJECT_ID('dbo.FactVentaProducto', 'U') IS NULL
    BEGIN
        ;THROW 51039, 'H04 detenido: faltan tablas requeridas en DW_MundoEscolar.dbo.', 1;
    END;

    IF (@TieneFechaInicio + @TieneFechaFin + @TieneEsActual) NOT IN (0, 3)
    BEGIN
        ;THROW 51040, 'H04 detenido: DimProducto tiene una migracion parcial de columnas SCD2. Revise el esquema antes de continuar.', 1;
    END;

    IF EXISTS (
        SELECT 1
        FROM dbo.DimCliente
        WHERE Es_Actual IS NULL
           OR Fecha_Inicio IS NULL
           OR (Es_Actual = 1 AND Fecha_Fin IS NOT NULL)
           OR (Es_Actual = 0 AND (Fecha_Fin IS NULL OR Fecha_Fin <= Fecha_Inicio))
    )
    BEGIN
        ;THROW 51041, 'H04 detenido: DimCliente contiene indicadores o fechas de vigencia inconsistentes.', 1;
    END;

    IF EXISTS (
        SELECT Id_Cliente
        FROM dbo.DimCliente
        WHERE Es_Actual = 1
        GROUP BY Id_Cliente
        HAVING COUNT(*) > 1
    )
    BEGIN
        ;THROW 51042, 'H04 detenido: DimCliente tiene mas de una version actual para un Id_Cliente.', 1;
    END;

    IF EXISTS (
        SELECT 1
        FROM dbo.DimCliente a
        INNER JOIN dbo.DimCliente b
            ON a.Id_Cliente = b.Id_Cliente
           AND a.Sk_Cliente < b.Sk_Cliente
           AND a.Fecha_Inicio < ISNULL(b.Fecha_Fin, CONVERT(DATETIME, '99991231', 112))
           AND b.Fecha_Inicio < ISNULL(a.Fecha_Fin, CONVERT(DATETIME, '99991231', 112))
    )
    BEGIN
        ;THROW 51043, 'H04 detenido: DimCliente contiene intervalos de vigencia solapados.', 1;
    END;

    IF EXISTS (
        SELECT Id_Producto
        FROM dbo.DimProducto
        GROUP BY Id_Producto
        HAVING COUNT(*) > 1
    )
    BEGIN
        ;THROW 51044, 'H04 detenido: DimProducto contiene Id_Producto duplicados; la version inicial no puede asignarse sin una regla aprobada.', 1;
    END;

    IF OBJECT_ID('dbo.SCD2_ControlH04', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.SCD2_ControlH04 (
            Id_Control TINYINT NOT NULL PRIMARY KEY
                CONSTRAINT CK_SCD2_ControlH04_Id CHECK (Id_Control = 1),
            Fecha_Corte DATETIME NOT NULL
        );
    END
    ELSE IF COL_LENGTH('dbo.SCD2_ControlH04', 'Id_Control') IS NULL
         OR COL_LENGTH('dbo.SCD2_ControlH04', 'Fecha_Corte') IS NULL
    BEGIN
        ;THROW 51054, 'H04 detenido: dbo.SCD2_ControlH04 existe con una estructura incompatible.', 1;
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.SCD2_ControlH04 WHERE Id_Control = 1)
    BEGIN
        IF EXISTS (SELECT 1 FROM dbo.SCD2_ControlH04)
        BEGIN
            ;THROW 51055, 'H04 detenido: dbo.SCD2_ControlH04 contiene una fila de control inesperada.', 1;
        END;

        INSERT INTO dbo.SCD2_ControlH04 (Id_Control, Fecha_Corte)
        VALUES (1, @FechaCorte);
    END;

    IF EXISTS (
        SELECT 1
        FROM dbo.SCD2_ControlH04
        WHERE Id_Control IS NULL OR Id_Control <> 1 OR Fecha_Corte IS NULL
    )
    BEGIN
        ;THROW 51064, 'H04 detenido: dbo.SCD2_ControlH04 contiene valores de control invalidos.', 1;
    END;

    SELECT @FechaCorte = Fecha_Corte
    FROM dbo.SCD2_ControlH04
    WHERE Id_Control = 1;

    IF @FechaCorte IS NULL
    BEGIN
        ;THROW 51065, 'H04 detenido: no se pudo determinar una fecha de corte valida.', 1;
    END;

    IF EXISTS (
        SELECT 1
        FROM dbo.FactVenta f
        LEFT JOIN dbo.DimCliente d ON d.Sk_Cliente = f.Sk_Cliente
        WHERE d.Sk_Cliente IS NULL
    )
    BEGIN
        ;THROW 51045, 'H04 detenido: FactVenta contiene claves Sk_Cliente sin dimension correspondiente.', 1;
    END;

    IF EXISTS (
        SELECT 1
        FROM dbo.FactVentaProducto f
        LEFT JOIN dbo.DimProducto d ON d.Sk_Producto = f.Sk_Producto
        WHERE d.Sk_Producto IS NULL
    )
    BEGIN
        ;THROW 51046, 'H04 detenido: FactVentaProducto contiene claves Sk_Producto sin dimension correspondiente.', 1;
    END;

    IF @TieneFechaInicio = 0
    BEGIN
        ALTER TABLE dbo.DimProducto
            ADD Fecha_Inicio DATETIME NULL,
                Fecha_Fin DATETIME NULL,
                Es_Actual BIT NULL;

        UPDATE dbo.DimProducto
        SET Fecha_Inicio = @FechaCorte,
            Fecha_Fin = NULL,
            Es_Actual = 1;
    END
    ELSE IF EXISTS (
        SELECT 1
        FROM dbo.DimProducto
        WHERE Fecha_Inicio IS NULL
           OR Es_Actual IS NULL
           OR (Es_Actual = 1 AND Fecha_Fin IS NOT NULL)
           OR (Es_Actual = 0 AND (Fecha_Fin IS NULL OR Fecha_Fin <= Fecha_Inicio))
    )
    BEGIN
        ;THROW 51047, 'H04 detenido: DimProducto contiene valores SCD2 nulos o vigencias inconsistentes.', 1;
    END;

    IF EXISTS (
        SELECT 1
        FROM dbo.DimProducto a
        INNER JOIN dbo.DimProducto b
            ON a.Id_Producto = b.Id_Producto
           AND a.Sk_Producto < b.Sk_Producto
           AND a.Fecha_Inicio < ISNULL(b.Fecha_Fin, CONVERT(DATETIME, '99991231', 112))
           AND b.Fecha_Inicio < ISNULL(a.Fecha_Fin, CONVERT(DATETIME, '99991231', 112))
    )
    BEGIN
        ;THROW 51048, 'H04 detenido: DimProducto contiene intervalos de vigencia solapados.', 1;
    END;

    IF EXISTS (
        SELECT Id_Producto
        FROM dbo.DimProducto
        WHERE Es_Actual = 1
        GROUP BY Id_Producto
        HAVING COUNT(*) > 1
    )
    BEGIN
        ;THROW 51049, 'H04 detenido: DimProducto tiene mas de una version actual para un Id_Producto.', 1;
    END;

    ALTER TABLE dbo.DimProducto ALTER COLUMN Fecha_Inicio DATETIME NOT NULL;
    ALTER TABLE dbo.DimProducto ALTER COLUMN Es_Actual BIT NOT NULL;

    IF NOT EXISTS (
        SELECT 1 FROM sys.check_constraints
        WHERE parent_object_id = OBJECT_ID('dbo.DimCliente')
          AND name = 'CK_DimCliente_Vigencia_H04'
    )
        ALTER TABLE dbo.DimCliente WITH CHECK
            ADD CONSTRAINT CK_DimCliente_Vigencia_H04
            CHECK (
                (Es_Actual = 1 AND Fecha_Fin IS NULL)
                OR (Es_Actual = 0 AND Fecha_Fin IS NOT NULL AND Fecha_Fin > Fecha_Inicio)
            );

    IF NOT EXISTS (
        SELECT 1 FROM sys.check_constraints
        WHERE parent_object_id = OBJECT_ID('dbo.DimProducto')
          AND name = 'CK_DimProducto_Vigencia_H04'
    )
        ALTER TABLE dbo.DimProducto WITH CHECK
            ADD CONSTRAINT CK_DimProducto_Vigencia_H04
            CHECK (
                (Es_Actual = 1 AND Fecha_Fin IS NULL)
                OR (Es_Actual = 0 AND Fecha_Fin IS NOT NULL AND Fecha_Fin > Fecha_Inicio)
            );

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID('dbo.DimCliente')
          AND name = 'UX_DimCliente_Id_Actual_H04'
    )
        CREATE UNIQUE INDEX UX_DimCliente_Id_Actual_H04
            ON dbo.DimCliente (Id_Cliente)
            WHERE Es_Actual = 1;

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID('dbo.DimProducto')
          AND name = 'UX_DimProducto_Id_Actual_H04'
    )
        CREATE UNIQUE INDEX UX_DimProducto_Id_Actual_H04
            ON dbo.DimProducto (Id_Producto)
            WHERE Es_Actual = 1;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
