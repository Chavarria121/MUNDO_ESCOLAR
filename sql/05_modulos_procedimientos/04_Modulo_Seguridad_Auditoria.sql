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
-- MÓDULO 1: USUARIOS Y CLIENTES (SPs 1 a 8)
-- =========================================================================

-- 1. SP_Usuario_Crear
CREATE OR ALTER PROCEDURE dbo.SP_Usuario_Crear
    @Nombre_Usuario VARCHAR(50),
    @Correo VARCHAR(150),
    @ContrasenaHash VARCHAR(255),
    @Id_Usuario_Nuevo INT OUTPUT,
    @Requiere_Cambio_Contrasena BIT = 0
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

        INSERT INTO Usuario (Nombre_Usuario, Correo, Contrasena, Fecha_Registro, Estado, Requiere_Cambio_Contrasena)
        VALUES (LTRIM(RTRIM(@Nombre_Usuario)), LTRIM(RTRIM(@Correo)), @ContrasenaHash, GETDATE(), 1, ISNULL(@Requiere_Cambio_Contrasena, 0));

        SET @Id_Usuario_Nuevo = SCOPE_IDENTITY();
        SELECT @Id_Usuario_Nuevo AS Id_Usuario, 'Usuario creado satisfactoriamente.' AS Mensaje;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
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
    SELECT TOP 1
        u.Id_Usuario,
        u.Nombre_Usuario,
        u.Correo,
        u.Contrasena AS HashContrasena,
        u.Estado,
        ISNULL(u.Requiere_Cambio_Contrasena, 0) AS Requiere_Cambio_Contrasena
    FROM dbo.Usuario u
    LEFT JOIN dbo.Cliente c ON u.Id_Usuario = c.Id_Usuario
    LEFT JOIN dbo.Cliente_Particular cp ON c.Id_Cliente = cp.Id_Cliente
    LEFT JOIN dbo.Cliente_Institucional ci ON c.Id_Cliente = ci.Id_Cliente
    WHERE u.Nombre_Usuario = @Nombre_Usuario
       OR u.Correo = @Nombre_Usuario
       OR cp.Identificacion = @Nombre_Usuario
       OR REPLACE(cp.Identificacion, '-', '') = REPLACE(@Nombre_Usuario, '-', '')
       OR ci.Cedula_Juridica = @Nombre_Usuario
       OR REPLACE(ci.Cedula_Juridica, '-', '') = REPLACE(@Nombre_Usuario, '-', '');
END;
GO

-- 55A0. SP_Usuario_Consultar
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

-- 55A. SP_Usuario_ObtenerPorId (Sin exponer hash de contrasena)
CREATE OR ALTER PROCEDURE dbo.SP_Usuario_ObtenerPorId
    @Id_Usuario INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        Id_Usuario,
        Nombre_Usuario,
        Correo,
        Estado,
        ISNULL(Requiere_Cambio_Contrasena, 0) AS Requiere_Cambio_Contrasena
    FROM Usuario
    WHERE Id_Usuario = @Id_Usuario;
END;
GO

-- 55A1. SP_Usuario_ObtenerHashParaCambio (Acotado estrictamente a verificacion de contrasena actual)
CREATE OR ALTER PROCEDURE dbo.SP_Usuario_ObtenerHashParaCambio
    @Id_Usuario INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        Id_Usuario,
        Contrasena AS HashContrasena,
        Estado
    FROM Usuario
    WHERE Id_Usuario = @Id_Usuario;
END;
GO

-- 55A2. SP_Usuario_VerificarDisponibilidad (Permite a Clientes validar unicidad sin acceso directo a Usuario)
CREATE OR ALTER PROCEDURE dbo.SP_Usuario_VerificarDisponibilidad
    @Nombre_Usuario VARCHAR(50),
    @Correo VARCHAR(150)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        CAST(CASE WHEN EXISTS (SELECT 1 FROM dbo.Usuario WHERE Nombre_Usuario = @Nombre_Usuario) THEN 1 ELSE 0 END AS BIT) AS NombreUsuarioExiste,
        CAST(CASE WHEN EXISTS (SELECT 1 FROM dbo.Usuario WHERE Correo = @Correo) THEN 1 ELSE 0 END AS BIT) AS CorreoExiste;
END;
GO

-- 55A4. SP_Token_Revocar (Registro y purga de tokens JWT revocados)
CREATE OR ALTER PROCEDURE dbo.SP_Token_Revocar
    @Token_Hash VARCHAR(64),
    @Fecha_Expiracion DATETIME
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.TB_Token_Revocado WHERE Fecha_Expiracion < GETDATE();

    IF NOT EXISTS (SELECT 1 FROM dbo.TB_Token_Revocado WHERE Token_Hash = @Token_Hash)
    BEGIN
        INSERT INTO dbo.TB_Token_Revocado (Token_Hash, Fecha_Expiracion, Fecha_Revocacion)
        VALUES (@Token_Hash, @Fecha_Expiracion, GETDATE());
    END
END;
GO

-- 55A5. SP_Token_VerificarRevocado (Comprobacion de validez de token persistente ante reinicios)
CREATE OR ALTER PROCEDURE dbo.SP_Token_VerificarRevocado
    @Token_Hash VARCHAR(64)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT CAST(CASE WHEN EXISTS (
        SELECT 1 FROM dbo.TB_Token_Revocado 
        WHERE Token_Hash = @Token_Hash AND Fecha_Expiracion > GETDATE()
    ) THEN 1 ELSE 0 END AS BIT) AS EstaRevocado;
END;
GO

-- 55B. SP_Usuario_CambiarContrasena
CREATE OR ALTER PROCEDURE dbo.SP_Usuario_CambiarContrasena
    @Id_Usuario INT,
    @NuevoHash VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Guardar clave actual en historial
        INSERT INTO dbo.TB_Historial_Contrasenas (Id_Usuario, Contrasena_Hash, Fecha_Modificacion)
        SELECT Id_Usuario, Contrasena, GETDATE()
        FROM dbo.Usuario
        WHERE Id_Usuario = @Id_Usuario;

        -- Actualizar clave y resetear bandera de cambio obligatorio
        UPDATE dbo.Usuario
        SET Contrasena = @NuevoHash,
            Requiere_Cambio_Contrasena = 0
        WHERE Id_Usuario = @Id_Usuario;

        -- Registrar en bitácora de auditoría
        INSERT INTO dbo.Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
        VALUES (@Id_Usuario, 'PASSWORD_CHANGE', 'Usuario', @Id_Usuario, GETDATE(), 'Cambio de contraseña exitoso y restablecimiento de bandera obligatoria');

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

-- 55C. SP_Usuario_ConsultarHistorialContrasenas
CREATE OR ALTER PROCEDURE dbo.SP_Usuario_ConsultarHistorialContrasenas
    @Id_Usuario INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 5
        Contrasena_Hash,
        Fecha_Modificacion
    FROM dbo.TB_Historial_Contrasenas
    WHERE Id_Usuario = @Id_Usuario
    ORDER BY Fecha_Modificacion DESC;
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

-- 62B. SP_Rol_ConsultarMatriz
CREATE OR ALTER PROCEDURE dbo.SP_Rol_ConsultarMatriz
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        rp.Id_Rol,
        r.Nombre AS Nombre_Rol,
        rp.Id_Permiso,
        p.Nombre AS Nombre_Permiso
    FROM dbo.Rol_Permiso rp
    INNER JOIN dbo.Rol r ON rp.Id_Rol = r.Id_Rol
    INNER JOIN dbo.Permiso p ON rp.Id_Permiso = p.Id_Permiso;
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

/* =========================================================================
   GUÍA PRÁCTICA DE EXPOSICIÓN EN VIVO: CONSULTAS ANTES Y DESPUÉS
   MODULO 4: SEGURIDAD, CONTROL DE ACCESO Y AUDITORÍA TRANSVERSAL
   INSTRUCCIONES PARA EL EXPOSITOR (SSMS 22):
   - Selecciona con el mouse el bloque de consulta indicado y presiona F5.
   - Sigue los pasos numerados coordinando con tu compañero en el Frontend.
   ========================================================================= */

-- -------------------------------------------------------------------------
-- CASO 1: REVOCACIÓN CRIPTOGRÁFICA DE TOKENS JWT EN LOGOUT (SP_Token_Revocar)
-- -------------------------------------------------------------------------
-- PASO 1 (ANTES): Consulta los tokens revocados en la lista negra técnica
SELECT TOP 3 
    Id_Token,
    Token_Hash,
    Fecha_Revocacion,
    Fecha_Expiracion
FROM dbo.TB_Token_Revocado
ORDER BY Id_Token DESC;

-- PASO 2 (ACCIÓN DEL COMPAÑERO EN EL FRONTEND):
-- En la barra superior de la aplicación, el compañero hace clic en "Cerrar Sesión" (Logout).

-- PASO 3 (DESPUÉS): Vuelve a ejecutar la consulta del PASO 1.
-- Se demuestra a Torrentes que el token JWT revocado fue persistido
-- inmediatamente en la base de datos, impidiendo que pueda reutilizarse.
SELECT TOP 3 
    Id_Token,
    Token_Hash,
    Fecha_Revocacion,
    Fecha_Expiracion
FROM dbo.TB_Token_Revocado
ORDER BY Id_Token DESC;
GO


-- -------------------------------------------------------------------------
-- CASO 2: CAMBIO DE CONTRASEÑA Y PREVENCIÓN DE REÚSO NIST (SP_Usuario_CambiarContrasena)
-- -------------------------------------------------------------------------
-- PASO 1 (ANTES): Consulta el historial de contraseñas para el usuario 'admin'
SELECT TOP 3 
    h.Id_Historial,
    u.Nombre_Usuario,
    h.Contrasena_Hash,
    h.Fecha_Modificacion
FROM dbo.TB_Historial_Contrasenas h
INNER JOIN dbo.Usuario u ON h.Id_Usuario = u.Id_Usuario
WHERE u.Nombre_Usuario = 'admin'
ORDER BY h.Id_Historial DESC;

-- PASO 2 (ACCIÓN DEL COMPAÑERO EN EL FRONTEND):
-- El compañero va a /perfil y realiza un cambio de contraseña.

-- PASO 3 (DESPUÉS): Vuelve a ejecutar la consulta del PASO 1.
-- Demuestra cómo el hash previo fue automáticamente empujado a TB_Historial_Contrasenas
-- para cumplir con la norma NIST de no-reutilización de las últimas N contraseñas.
GO


-- -------------------------------------------------------------------------
-- CASO 3: TRAZABILIDAD EN LA BITÁCORA TRANSVERSAL (SP_Auditoria_Consultar)
-- -------------------------------------------------------------------------
-- Consulta los últimos 5 eventos registrados en toda la empresa.
-- Se demuestra que la tabla Bitacora almacena registros generados por
-- Ventas, Compras, Inventario y Seguridad bajo un mismo estándar inmutable en el Filegroup ME_Auditoria.
SELECT TOP 5 
    b.Id_Bitacora,
    b.Fecha_Hora,
    ISNULL(u.Nombre_Usuario, 'Sistema') AS Usuario,
    b.Accion,
    b.Tabla_Afectada,
    b.Id_Registro_Afectado,
    b.Descripcion
FROM dbo.Bitacora b
LEFT JOIN dbo.Usuario u ON b.Id_Usuario = u.Id_Usuario
ORDER BY b.Id_Bitacora DESC;
GO
