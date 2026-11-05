/* =========================================================================
   PROYECTO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR
   SCRIPT: 11_CrearTriggers.sql (y Triggers.sql)
   REQUERIMIENTOS: RF6.x, RA5.x
   REFERENCIA DOCUMENTACIÓN: Sección 17.4 (Páginas 418-427) y 17.8.11 (Página 446)
   DESCRIPCIÓN: Implementación de los 16 triggers de auditoría del sistema:
     1. TR_Cliente_Auditoria
     2. TR_ClienteParticular_Auditoria
     3. TR_ClienteInstitucional_Auditoria
     4. TR_ClienteCondicionPago_Auditoria
     5. TR_Proveedor_Auditoria
     6. TR_ProveedorParticular_Auditoria
     7. TR_ProveedorInstitucional_Auditoria
     8. TR_Producto_Auditoria
     9. TR_Servicio_Auditoria
     10. TR_Compra_Auditoria
     11. TR_Venta_Auditoria
     12. TR_Factura_Auditoria
     13. TR_Pago_Auditoria
     14. TR_Usuario_Auditoria
     15. TR_RolUsuario_Auditoria
     16. TR_RolPermiso_Auditoria

   REGLAS TÉCNICAS MANDATORIAS SEGÚN DOCUMENTACIÓN:
     - Multi-registro: Procesan conjuntos mediante INSERT ... SELECT sobre inserted/deleted.
     - Contexto de Sesión: Obtienen Id_Usuario desde SESSION_CONTEXT(N'Id_Usuario') con fallback a usuario admin/sistema.
     - Responsabilidad única: NO ejecutan efectos colaterales de stock, saldos ni estados (responsabilidad de SPs).
     - Protección de contraseñas: No auditan hashes ni contraseñas en Usuario.
   ========================================================================= */

USE MUNDO_ESCOLAR
GO

-- 1. TR_Cliente_Auditoria
CREATE OR ALTER TRIGGER dbo.TR_Cliente_Auditoria
ON dbo.Cliente
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @IdUsuarioSesion INT = CAST(SESSION_CONTEXT(N'Id_Usuario') AS INT);
    IF @IdUsuarioSesion IS NULL
        SET @IdUsuarioSesion = (SELECT TOP 1 Id_Usuario FROM Usuario WHERE Nombre_Usuario = 'admin');

    -- Insertados
    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        SELECT 
            @IdUsuarioSesion,
            'INSERT',
            'Cliente',
            i.Id_Cliente,
            GETDATE(),
            CONCAT('Alta de cliente general ID ', i.Id_Cliente, ', Tipo: ', i.Id_Tipo_Cliente, ', Tel: ', ISNULL(i.Telefono, 'N/A'))
        FROM inserted i;
    END

    -- Modificados
    IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        SELECT 
            @IdUsuarioSesion,
            'UPDATE',
            'Cliente',
            i.Id_Cliente,
            GETDATE(),
            CONCAT('Actualización de cliente ID ', i.Id_Cliente, '. Estado: ', d.Estado, ' -> ', i.Estado, ', Tel: ', ISNULL(i.Telefono, 'N/A'))
        FROM inserted i
        INNER JOIN deleted d ON i.Id_Cliente = d.Id_Cliente;
    END
END;
GO

-- 2. TR_ClienteParticular_Auditoria
CREATE OR ALTER TRIGGER dbo.TR_ClienteParticular_Auditoria
ON dbo.Cliente_Particular
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @IdUsuarioSesion INT = ISNULL(CAST(SESSION_CONTEXT(N'Id_Usuario') AS INT), (SELECT TOP 1 Id_Usuario FROM Usuario WHERE Nombre_Usuario = 'admin'));

    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        SELECT 
            @IdUsuarioSesion, 'INSERT', 'Cliente_Particular', i.Id_Cliente, GETDATE(),
            CONCAT('Alta de particular ID ', i.Id_Cliente, ', Cédula: ', i.Identificacion, ', Nombre: ', i.Nombre, ' ', i.Apellido1)
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        SELECT 
            @IdUsuarioSesion, 'UPDATE', 'Cliente_Particular', i.Id_Cliente, GETDATE(),
            CONCAT('Modificación de particular ID ', i.Id_Cliente, ', Cédula: ', i.Identificacion, ', Nombre: ', i.Nombre, ' ', i.Apellido1)
        FROM inserted i;
    END
END;
GO

-- 3. TR_ClienteInstitucional_Auditoria
CREATE OR ALTER TRIGGER dbo.TR_ClienteInstitucional_Auditoria
ON dbo.Cliente_Institucional
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @IdUsuarioSesion INT = ISNULL(CAST(SESSION_CONTEXT(N'Id_Usuario') AS INT), (SELECT TOP 1 Id_Usuario FROM Usuario WHERE Nombre_Usuario = 'admin'));

    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        SELECT 
            @IdUsuarioSesion, 'INSERT', 'Cliente_Institucional', i.Id_Cliente, GETDATE(),
            CONCAT('Alta de institución ID ', i.Id_Cliente, ', Cédula Jurídica: ', i.Cedula_Juridica, ', Razón: ', i.Razon_Social)
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        SELECT 
            @IdUsuarioSesion, 'UPDATE', 'Cliente_Institucional', i.Id_Cliente, GETDATE(),
            CONCAT('Modificación de institución ID ', i.Id_Cliente, ', Cédula: ', i.Cedula_Juridica, ', Contacto: ', ISNULL(i.Nombre_Contacto, 'N/A'))
        FROM inserted i;
    END
END;
GO

-- 4. TR_ClienteCondicionPago_Auditoria
CREATE OR ALTER TRIGGER dbo.TR_ClienteCondicionPago_Auditoria
ON dbo.Cliente_Condicion_Pago
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @IdUsuarioSesion INT = ISNULL(CAST(SESSION_CONTEXT(N'Id_Usuario') AS INT), (SELECT TOP 1 Id_Usuario FROM Usuario WHERE Nombre_Usuario = 'admin'));

    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        SELECT 
            @IdUsuarioSesion, 'INSERT', 'Cliente_Condicion_Pago', i.Id_Cliente_Condicion_Pago, GETDATE(),
            CONCAT('Autorización condición ID ', i.Id_Condicion_Pago, ' a cliente ID ', i.Id_Cliente, ', Estado: ', i.Estado)
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        SELECT 
            @IdUsuarioSesion, 'UPDATE', 'Cliente_Condicion_Pago', i.Id_Cliente_Condicion_Pago, GETDATE(),
            CONCAT('Cambio estado condición pago de cliente ID ', i.Id_Cliente, '. Estado: ', d.Estado, ' -> ', i.Estado)
        FROM inserted i
        INNER JOIN deleted d ON i.Id_Cliente_Condicion_Pago = d.Id_Cliente_Condicion_Pago;
    END
END;
GO

-- 5. TR_Proveedor_Auditoria
CREATE OR ALTER TRIGGER dbo.TR_Proveedor_Auditoria
ON dbo.Proveedor
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @IdUsuarioSesion INT = ISNULL(CAST(SESSION_CONTEXT(N'Id_Usuario') AS INT), (SELECT TOP 1 Id_Usuario FROM Usuario WHERE Nombre_Usuario = 'admin'));

    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        SELECT 
            @IdUsuarioSesion, 'INSERT', 'Proveedor', i.Id_Proveedor, GETDATE(),
            CONCAT('Alta de proveedor general ID ', i.Id_Proveedor, ', Tipo: ', i.Id_Tipo_Proveedor, ', Correo: ', ISNULL(i.Correo, 'N/A'))
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        SELECT 
            @IdUsuarioSesion, 'UPDATE', 'Proveedor', i.Id_Proveedor, GETDATE(),
            CONCAT('Actualización proveedor ID ', i.Id_Proveedor, '. Estado: ', d.Estado, ' -> ', i.Estado)
        FROM inserted i
        INNER JOIN deleted d ON i.Id_Proveedor = d.Id_Proveedor;
    END
END;
GO

-- 6. TR_ProveedorParticular_Auditoria
CREATE OR ALTER TRIGGER dbo.TR_ProveedorParticular_Auditoria
ON dbo.Proveedor_Particular
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @IdUsuarioSesion INT = ISNULL(CAST(SESSION_CONTEXT(N'Id_Usuario') AS INT), (SELECT TOP 1 Id_Usuario FROM Usuario WHERE Nombre_Usuario = 'admin'));

    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        SELECT 
            @IdUsuarioSesion, 'INSERT', 'Proveedor_Particular', i.Id_Proveedor, GETDATE(),
            CONCAT('Alta de proveedor particular ID ', i.Id_Proveedor, ', Cédula: ', i.Identificacion, ', Nombre: ', i.Nombre, ' ', i.Apellido1)
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        SELECT 
            @IdUsuarioSesion, 'UPDATE', 'Proveedor_Particular', i.Id_Proveedor, GETDATE(),
            CONCAT('Modificación de proveedor particular ID ', i.Id_Proveedor, ', Nombre: ', i.Nombre, ' ', i.Apellido1)
        FROM inserted i;
    END
END;
GO

-- 7. TR_ProveedorInstitucional_Auditoria
CREATE OR ALTER TRIGGER dbo.TR_ProveedorInstitucional_Auditoria
ON dbo.Proveedor_Institucional
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @IdUsuarioSesion INT = ISNULL(CAST(SESSION_CONTEXT(N'Id_Usuario') AS INT), (SELECT TOP 1 Id_Usuario FROM Usuario WHERE Nombre_Usuario = 'admin'));

    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        SELECT 
            @IdUsuarioSesion, 'INSERT', 'Proveedor_Institucional', i.Id_Proveedor, GETDATE(),
            CONCAT('Alta de proveedor institucional ID ', i.Id_Proveedor, ', Cédula Jurídica: ', i.Cedula_Juridica, ', Razón: ', i.Razon_Social)
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        SELECT 
            @IdUsuarioSesion, 'UPDATE', 'Proveedor_Institucional', i.Id_Proveedor, GETDATE(),
            CONCAT('Modificación de proveedor institucional ID ', i.Id_Proveedor, ', Contacto: ', ISNULL(i.Nombre_Contacto, 'N/A'))
        FROM inserted i;
    END
END;
GO

-- 8. TR_Producto_Auditoria
CREATE OR ALTER TRIGGER dbo.TR_Producto_Auditoria
ON dbo.Producto
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @IdUsuarioSesion INT = ISNULL(CAST(SESSION_CONTEXT(N'Id_Usuario') AS INT), (SELECT TOP 1 Id_Usuario FROM Usuario WHERE Nombre_Usuario = 'admin'));

    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        SELECT 
            @IdUsuarioSesion, 'INSERT', 'Producto', i.Id_Producto, GETDATE(),
            CONCAT('Creación de producto: ', i.Nombre, ', Precio: ', i.Precio_Venta, ', Stock: ', i.Stock_Actual)
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        SELECT 
            @IdUsuarioSesion, 'UPDATE', 'Producto', i.Id_Producto, GETDATE(),
            CONCAT('Modificación producto ID ', i.Id_Producto, ': ', i.Nombre, '. Precio: ', d.Precio_Venta, ' -> ', i.Precio_Venta, ', Stock: ', d.Stock_Actual, ' -> ', i.Stock_Actual)
        FROM inserted i
        INNER JOIN deleted d ON i.Id_Producto = d.Id_Producto;
    END
END;
GO

-- 9. TR_Servicio_Auditoria
CREATE OR ALTER TRIGGER dbo.TR_Servicio_Auditoria
ON dbo.Servicio
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @IdUsuarioSesion INT = ISNULL(CAST(SESSION_CONTEXT(N'Id_Usuario') AS INT), (SELECT TOP 1 Id_Usuario FROM Usuario WHERE Nombre_Usuario = 'admin'));

    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        SELECT 
            @IdUsuarioSesion, 'INSERT', 'Servicio', i.Id_Servicio, GETDATE(),
            CONCAT('Creación de servicio: ', i.Nombre, ', Precio Base: ', i.Precio_Base)
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        SELECT 
            @IdUsuarioSesion, 'UPDATE', 'Servicio', i.Id_Servicio, GETDATE(),
            CONCAT('Modificación de servicio ID ', i.Id_Servicio, ': ', i.Nombre, '. Precio: ', d.Precio_Base, ' -> ', i.Precio_Base, ', Estado: ', d.Estado, ' -> ', i.Estado)
        FROM inserted i
        INNER JOIN deleted d ON i.Id_Servicio = d.Id_Servicio;
    END
END;
GO

-- 10. TR_Compra_Auditoria
CREATE OR ALTER TRIGGER dbo.TR_Compra_Auditoria
ON dbo.Compra
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @IdUsuarioSesion INT = ISNULL(CAST(SESSION_CONTEXT(N'Id_Usuario') AS INT), (SELECT TOP 1 Id_Usuario FROM Usuario WHERE Nombre_Usuario = 'admin'));

    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        SELECT 
            @IdUsuarioSesion, 'INSERT', 'Compra', i.Id_Compra, GETDATE(),
            CONCAT('Registro de orden de compra ID ', i.Id_Compra, ', Proveedor: ', i.Id_Proveedor, ', Estado: ', i.Id_Estado_Compra)
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        SELECT 
            @IdUsuarioSesion, 'UPDATE', 'Compra', i.Id_Compra, GETDATE(),
            CONCAT('Cambio de estado de compra ID ', i.Id_Compra, '. Estado: ', d.Id_Estado_Compra, ' -> ', i.Id_Estado_Compra)
        FROM inserted i
        INNER JOIN deleted d ON i.Id_Compra = d.Id_Compra;
    END
END;
GO

-- 11. TR_Venta_Auditoria
CREATE OR ALTER TRIGGER dbo.TR_Venta_Auditoria
ON dbo.Venta
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @IdUsuarioSesion INT = ISNULL(CAST(SESSION_CONTEXT(N'Id_Usuario') AS INT), (SELECT TOP 1 Id_Usuario FROM Usuario WHERE Nombre_Usuario = 'admin'));

    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        SELECT 
            @IdUsuarioSesion, 'INSERT', 'Venta', i.Id_Venta, GETDATE(),
            CONCAT('Creación de venta ID ', i.Id_Venta, ', Cliente: ', i.Id_Cliente, ', Monto: ', i.Monto_Total, ', Estado: ', i.Id_Estado_Venta)
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        SELECT 
            @IdUsuarioSesion, 'UPDATE', 'Venta', i.Id_Venta, GETDATE(),
            CONCAT('Transición de estado de venta ID ', i.Id_Venta, '. Estado: ', d.Id_Estado_Venta, ' -> ', i.Id_Estado_Venta, ', Total: ', i.Monto_Total)
        FROM inserted i
        INNER JOIN deleted d ON i.Id_Venta = d.Id_Venta;
    END
END;
GO

-- 12. TR_Factura_Auditoria
CREATE OR ALTER TRIGGER dbo.TR_Factura_Auditoria
ON dbo.Factura
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @IdUsuarioSesion INT = ISNULL(CAST(SESSION_CONTEXT(N'Id_Usuario') AS INT), (SELECT TOP 1 Id_Usuario FROM Usuario WHERE Nombre_Usuario = 'admin'));

    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        SELECT 
            @IdUsuarioSesion, 'INSERT', 'Factura', i.Id_Factura, GETDATE(),
            CONCAT('Emisión de factura ID ', i.Id_Factura, ', Venta: ', i.Id_Venta, ', Monto: ', i.Monto_Total, ', Saldo: ', i.Saldo_Pendiente)
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        SELECT 
            @IdUsuarioSesion, 'UPDATE', 'Factura', i.Id_Factura, GETDATE(),
            CONCAT('Actualización factura ID ', i.Id_Factura, '. Saldo: ', d.Saldo_Pendiente, ' -> ', i.Saldo_Pendiente, ', Estado: ', d.Id_Estado_Factura, ' -> ', i.Id_Estado_Factura)
        FROM inserted i
        INNER JOIN deleted d ON i.Id_Factura = d.Id_Factura;
    END
END;
GO

-- 13. TR_Pago_Auditoria
CREATE OR ALTER TRIGGER dbo.TR_Pago_Auditoria
ON dbo.Pago
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @IdUsuarioSesion INT = ISNULL(CAST(SESSION_CONTEXT(N'Id_Usuario') AS INT), (SELECT TOP 1 Id_Usuario FROM Usuario WHERE Nombre_Usuario = 'admin'));

    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        SELECT 
            @IdUsuarioSesion, 'INSERT', 'Pago', i.Id_Pago, GETDATE(),
            CONCAT('Registro de pago ID ', i.Id_Pago, ', Factura: ', i.Id_Factura, ', Monto: ', i.Monto_Pagado, ', Método: ', i.Id_Metodo_Pago)
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        SELECT 
            @IdUsuarioSesion, 'UPDATE', 'Pago', i.Id_Pago, GETDATE(),
            CONCAT('Cambio en pago ID ', i.Id_Pago, '. Estado: ', d.Estado, ' -> ', i.Estado)
        FROM inserted i
        INNER JOIN deleted d ON i.Id_Pago = d.Id_Pago;
    END
END;
GO

-- 14. TR_Usuario_Auditoria (Protección: NUNCA auditar hash ni contraseña)
CREATE OR ALTER TRIGGER dbo.TR_Usuario_Auditoria
ON dbo.Usuario
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @IdUsuarioSesion INT = ISNULL(CAST(SESSION_CONTEXT(N'Id_Usuario') AS INT), (SELECT TOP 1 Id_Usuario FROM Usuario WHERE Nombre_Usuario = 'admin'));

    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        SELECT 
            @IdUsuarioSesion, 'INSERT', 'Usuario', i.Id_Usuario, GETDATE(),
            CONCAT('Creación de usuario: ', i.Nombre_Usuario, ', Correo: ', i.Correo, ', Estado: ', i.Estado)
        FROM inserted i;
    END
    ELSE IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        SELECT 
            @IdUsuarioSesion, 'UPDATE', 'Usuario', i.Id_Usuario, GETDATE(),
            CONCAT('Modificación de usuario ID ', i.Id_Usuario, ' (', i.Nombre_Usuario, '). Estado: ', d.Estado, ' -> ', i.Estado)
        FROM inserted i
        INNER JOIN deleted d ON i.Id_Usuario = d.Id_Usuario;
    END
END;
GO

-- 15. TR_RolUsuario_Auditoria (Permite DELETE físico controlado)
CREATE OR ALTER TRIGGER dbo.TR_RolUsuario_Auditoria
ON dbo.Rol_Usuario
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @IdUsuarioSesion INT = ISNULL(CAST(SESSION_CONTEXT(N'Id_Usuario') AS INT), (SELECT TOP 1 Id_Usuario FROM Usuario WHERE Nombre_Usuario = 'admin'));

    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        SELECT 
            @IdUsuarioSesion, 'INSERT', 'Rol_Usuario', i.Id_Rol_Usuario, GETDATE(),
            CONCAT('Asignación de rol ID ', i.Id_Rol, ' a usuario ID ', i.Id_Usuario)
        FROM inserted i;
    END
    ELSE IF NOT EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        SELECT 
            @IdUsuarioSesion, 'DELETE', 'Rol_Usuario', d.Id_Rol_Usuario, GETDATE(),
            CONCAT('Revocación de rol ID ', d.Id_Rol, ' a usuario ID ', d.Id_Usuario)
        FROM deleted d;
    END
END;
GO

-- 16. TR_RolPermiso_Auditoria (Permite DELETE físico controlado)
CREATE OR ALTER TRIGGER dbo.TR_RolPermiso_Auditoria
ON dbo.Rol_Permiso
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @IdUsuarioSesion INT = ISNULL(CAST(SESSION_CONTEXT(N'Id_Usuario') AS INT), (SELECT TOP 1 Id_Usuario FROM Usuario WHERE Nombre_Usuario = 'admin'));

    IF EXISTS (SELECT 1 FROM inserted) AND NOT EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        SELECT 
            @IdUsuarioSesion, 'INSERT', 'Rol_Permiso', i.Id_Rol_Permiso, GETDATE(),
            CONCAT('Asignación de permiso ID ', i.Id_Permiso, ' a rol ID ', i.Id_Rol)
        FROM inserted i;
    END
    ELSE IF NOT EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
    BEGIN
        INSERT INTO dbo.Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        SELECT 
            @IdUsuarioSesion, 'DELETE', 'Rol_Permiso', d.Id_Rol_Permiso, GETDATE(),
            CONCAT('Revocación de permiso ID ', d.Id_Permiso, ' a rol ID ', d.Id_Rol)
        FROM deleted d;
    END
END;
GO

PRINT '16 Triggers de auditoría instalados exitosamente.';
GO
