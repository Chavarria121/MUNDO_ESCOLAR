/* =========================================================================
   PROYECTO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR
   EXPOSICIÓN FINAL 2026 - PESTAÑA 3 EN SSMS (MAURICIO CHAVARRÍA)
   SCRIPT: 03_DEMO_POLP_RBAC_MATRIZ.sql
   MOMENTO DE EJECUCIÓN: Bloque de Seguridad y Demostración en Vivo de PoLP.
   INSTRUCCIÓN: Ejecutar por bloques según la explicación verbal.
   ========================================================================= */

USE MUNDO_ESCOLAR;
GO

PRINT '======================================================================='
PRINT '>>> 1. MATRIZ DE SEGURIDAD BASADA EN ROLES (RBAC) Y PERMISOS'
PRINT '======================================================================='
SELECT 
    Rol_O_Usuario = pr.name,
    Permiso = pe.permission_name,
    Estado = pe.state_desc,
    Objeto = ISNULL(obj.name, 'Nivel Base de Datos'),
    Tipo_Objeto = ISNULL(obj.type_desc, 'DATABASE')
FROM sys.database_permissions pe
INNER JOIN sys.database_principals pr ON pe.grantee_principal_id = pr.principal_id
LEFT JOIN sys.objects obj ON pe.major_id = obj.object_id
WHERE pr.name IN ('rol_db_administrador', 'rol_db_vendedor', 'rol_db_bodeguero', 'rol_db_contador', 'rol_db_aplicacion')
ORDER BY pr.name, pe.state_desc DESC, obj.name;
GO

PRINT '======================================================================='
PRINT '>>> 2. SIMULACIÓN EN VIVO: CAMBIO DE CONTEXTO A "usr_mundo_vendedor"'
PRINT '======================================================================='
EXECUTE AS USER = 'usr_mundo_vendedor';
SELECT 
    Usuario_Activo = CURRENT_USER,
    Rol_Operativo = 'Vendedor de Mostrador (PoLP)';
GO

PRINT '======================================================================='
PRINT '>>> 3. PRUEBA DE ATAQUE / CONSULTA INDEBIDA: INTENTO DE LEER CREDENCIALES'
PRINT '======================================================================='
-- El vendedor intenta consultar la tabla física de Usuarios / Contraseñas
-- DEBE FALLAR con error 229: The SELECT permission was denied on the object 'Usuario'
BEGIN TRY
    EXEC sp_executesql N'SELECT TOP 1 Id_Usuario, Nombre_Usuario, Contrasena FROM dbo.Usuario;';
    PRINT '¡ERROR GRAVE! El usuario pudo acceder a datos confidenciales.';
END TRY
BEGIN CATCH
    PRINT '>> ÉXITO DE SEGURIDAD PoLP (ACCESO DENEGADO CORRECTAMENTE POR EL MOTOR):';
    PRINT '   Error SQL: ' + CAST(ERROR_NUMBER() AS VARCHAR(10)) + ' - ' + ERROR_MESSAGE();
END CATCH;
GO

PRINT '======================================================================='
PRINT '>>> 4. CONSULTA AUTORIZADA: ACCESO MEDIANTE VISTA DE NEGOCIO OPTIMIZADA'
PRINT '======================================================================='
-- El vendedor sí tiene permiso SELECT sobre la vista pública del catálogo de productos
SELECT TOP 5 
    Id_Producto,
    Categoria,
    Nombre,
    Precio_Venta,
    IVA = CAST(Porcentaje_IVA AS VARCHAR(10)) + '%'
FROM dbo.VW_ProductosCatalogo;
GO

PRINT '======================================================================='
PRINT '>>> 5. RESTAURAR CONTEXTO ORIGINAL DE ADMINISTRADOR (DBA)'
PRINT '======================================================================='
REVERT;
SELECT 
    Usuario_Restaurado = CURRENT_USER,
    Estado = 'Contexto DBA Restaurado con Éxito';
GO
