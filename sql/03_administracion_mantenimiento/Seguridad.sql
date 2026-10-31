/* =========================================================================
   PROYECTO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR
   ARCHIVO: Seguridad.sql (SCRIPT MAESTRO CONSOLIDADO DE SEGURIDAD Y PERMISOS)
   ESTILO: TORRENTES (SSMS 22)
   REFERENCIA DOCUMENTACIÓN: Sección 17.8.14 a 17.8.19 (Páginas 447-449)
   DESCRIPCIÓN: 
     Configuración integral de la seguridad técnica en SQL Server:
       1. 14_CrearLogins.sql               (Cuentas de servidor)
       2. 15_CrearUsuariosBD.sql          (Usuarios de base de datos)
       3. 16_CrearRolesBD.sql              (Database Roles de SQL Server)
       4. 17_AsignarPermisos.sql           (Concesión de privilegios mínimos sobre SPs y Vistas)
       5. 18_DenegarPermisosSensibles.sql   (DENY explícito sobre tablas operativas y Bitácora)
       6. 19_ValidarPermisos.sql           (Comprobación técnica de la matriz de seguridad)
   ========================================================================= */

USE master
GO

-- 1. CREACIÓN DE LOGINS A NIVEL DE SERVIDOR (14_CrearLogins.sql)
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'login_mundo_admin')
    CREATE LOGIN login_mundo_admin WITH PASSWORD = N'AdminSecure2026!', CHECK_POLICY = ON;

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'login_mundo_vendedor')
    CREATE LOGIN login_mundo_vendedor WITH PASSWORD = N'VentaSecure2026!', CHECK_POLICY = ON;

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'login_mundo_bodeguero')
    CREATE LOGIN login_mundo_bodeguero WITH PASSWORD = N'BodegaSecure2026!', CHECK_POLICY = ON;

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'login_mundo_contador')
    CREATE LOGIN login_mundo_contador WITH PASSWORD = N'ContaSecure2026!', CHECK_POLICY = ON;

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'login_mundo_app')
    CREATE LOGIN login_mundo_app WITH PASSWORD = N'AppSecure2026!', CHECK_POLICY = ON;
GO

USE MUNDO_ESCOLAR
GO

-- 2. CREACIÓN DE USUARIOS DENTRO DE LA BASE DE DATOS (15_CrearUsuariosBD.sql)
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'usr_mundo_admin')
    CREATE USER usr_mundo_admin FOR LOGIN login_mundo_admin;

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'usr_mundo_vendedor')
    CREATE USER usr_mundo_vendedor FOR LOGIN login_mundo_vendedor;

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'usr_mundo_bodeguero')
    CREATE USER usr_mundo_bodeguero FOR LOGIN login_mundo_bodeguero;

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'usr_mundo_contador')
    CREATE USER usr_mundo_contador FOR LOGIN login_mundo_contador;

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'usr_mundo_app')
    CREATE USER usr_mundo_app FOR LOGIN login_mundo_app;
GO

-- 3. CREACIÓN DE ROLES TÉCNICOS DE BASE DE DATOS (16_CrearRolesBD.sql)
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'rol_db_administrador' AND type = 'R')
    CREATE ROLE rol_db_administrador;

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'rol_db_vendedor' AND type = 'R')
    CREATE ROLE rol_db_vendedor;

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'rol_db_bodeguero' AND type = 'R')
    CREATE ROLE rol_db_bodeguero;

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'rol_db_contador' AND type = 'R')
    CREATE ROLE rol_db_contador;

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'rol_db_aplicacion' AND type = 'R')
    CREATE ROLE rol_db_aplicacion;
GO

-- Asignación de usuarios a sus respectivos roles de base de datos
ALTER ROLE rol_db_administrador ADD MEMBER usr_mundo_admin;
ALTER ROLE rol_db_vendedor ADD MEMBER usr_mundo_vendedor;
ALTER ROLE rol_db_bodeguero ADD MEMBER usr_mundo_bodeguero;
ALTER ROLE rol_db_contador ADD MEMBER usr_mundo_contador;
ALTER ROLE rol_db_aplicacion ADD MEMBER usr_mundo_app;
GO

-- 4. CONCESIÓN DE PERMISOS MÍNIMOS (17_AsignarPermisos.sql)
-- Rol Administrador: Control total sobre objetos de esquema dbo
GRANT EXECUTE ON SCHEMA::dbo TO rol_db_administrador;
GRANT SELECT ON SCHEMA::dbo TO rol_db_administrador;
GRANT VIEW DEFINITION TO rol_db_administrador;

-- Rol Aplicación (Sistema Backend)
GRANT EXECUTE ON SCHEMA::dbo TO rol_db_aplicacion;
GRANT SELECT ON SCHEMA::dbo TO rol_db_aplicacion;

-- Rol Vendedor: Permisos sobre ventas, clientes, inventario y facturación
GRANT EXECUTE ON dbo.SP_Cliente_Consultar TO rol_db_vendedor;
GRANT EXECUTE ON dbo.SP_Cliente_CrearPerfil TO rol_db_vendedor;
GRANT EXECUTE ON dbo.SP_Producto_Consultar TO rol_db_vendedor;
GRANT EXECUTE ON dbo.SP_Servicio_Consultar TO rol_db_vendedor;
GRANT EXECUTE ON dbo.SP_Venta_Crear TO rol_db_vendedor;
GRANT EXECUTE ON dbo.SP_Venta_AgregarProducto TO rol_db_vendedor;
GRANT EXECUTE ON dbo.SP_Venta_AgregarServicio TO rol_db_vendedor;
GRANT EXECUTE ON dbo.SP_Venta_ModificarDetalle TO rol_db_vendedor;
GRANT EXECUTE ON dbo.SP_Venta_EliminarDetalle TO rol_db_vendedor;
GRANT EXECUTE ON dbo.SP_Venta_CalcularTotales TO rol_db_vendedor;
GRANT EXECUTE ON dbo.SP_Venta_Confirmar TO rol_db_vendedor;
GRANT EXECUTE ON dbo.SP_Venta_Consultar TO rol_db_vendedor;
GRANT EXECUTE ON dbo.SP_Factura_Consultar TO rol_db_vendedor;
GRANT EXECUTE ON dbo.SP_Pago_Registrar TO rol_db_vendedor;

GRANT SELECT ON dbo.VW_ClientesActivos TO rol_db_vendedor;
GRANT SELECT ON dbo.VW_ProductosCatalogo TO rol_db_vendedor;
GRANT SELECT ON dbo.VW_ProductosInventario TO rol_db_vendedor;
GRANT SELECT ON dbo.VW_Ventas TO rol_db_vendedor;
GRANT SELECT ON dbo.VW_MetodosPagoActivos TO rol_db_vendedor;

-- Rol Bodeguero: Permisos sobre productos, compras y movimientos de almacén
GRANT EXECUTE ON dbo.SP_Producto_Consultar TO rol_db_bodeguero;
GRANT EXECUTE ON dbo.SP_Proveedor_Consultar TO rol_db_bodeguero;
GRANT EXECUTE ON dbo.SP_Compra_Crear TO rol_db_bodeguero;
GRANT EXECUTE ON dbo.SP_Compra_AgregarProducto TO rol_db_bodeguero;
GRANT EXECUTE ON dbo.SP_Compra_Confirmar TO rol_db_bodeguero;
GRANT EXECUTE ON dbo.SP_Compra_Consultar TO rol_db_bodeguero;
GRANT EXECUTE ON dbo.SP_Inventario_Entrada TO rol_db_bodeguero;
GRANT EXECUTE ON dbo.SP_Inventario_Salida TO rol_db_bodeguero;
GRANT EXECUTE ON dbo.SP_Inventario_Ajustar TO rol_db_bodeguero;
GRANT EXECUTE ON dbo.SP_Inventario_ConsultarMovimientos TO rol_db_bodeguero;
GRANT EXECUTE ON dbo.SP_Inventario_ProductosBajoReorden TO rol_db_bodeguero;

GRANT SELECT ON dbo.VW_ProveedoresActivos TO rol_db_bodeguero;
GRANT SELECT ON dbo.VW_ProductoProveedor TO rol_db_bodeguero;
GRANT SELECT ON dbo.VW_ProductosInventario TO rol_db_bodeguero;
GRANT SELECT ON dbo.VW_MovimientosInventario TO rol_db_bodeguero;
GRANT SELECT ON dbo.VW_ComprasDetalle TO rol_db_bodeguero;

-- Rol Contador: Permisos sobre facturación, pagos, compras y reportes financieros
GRANT EXECUTE ON dbo.SP_Cliente_Consultar TO rol_db_contador;
GRANT EXECUTE ON dbo.SP_ClienteCondicionPago_Autorizar TO rol_db_contador;
GRANT EXECUTE ON dbo.SP_ClienteCondicionPago_Deshabilitar TO rol_db_contador;
GRANT EXECUTE ON dbo.SP_ClienteCondicionPago_Consultar TO rol_db_contador;
GRANT EXECUTE ON dbo.SP_Factura_Consultar TO rol_db_contador;
GRANT EXECUTE ON dbo.SP_Factura_Anular TO rol_db_contador;
GRANT EXECUTE ON dbo.SP_Pago_Registrar TO rol_db_contador;
GRANT EXECUTE ON dbo.SP_Pago_Anular TO rol_db_contador;
GRANT EXECUTE ON dbo.SP_CuentaPorCobrar_Consultar TO rol_db_contador;
GRANT EXECUTE ON dbo.SP_CuentaPorCobrar_Vencidas TO rol_db_contador;
GRANT EXECUTE ON dbo.SP_Compra_Consultar TO rol_db_contador;
GRANT EXECUTE ON dbo.SP_Venta_Consultar TO rol_db_contador;

GRANT SELECT ON dbo.VW_Facturas TO rol_db_contador;
GRANT SELECT ON dbo.VW_Pagos TO rol_db_contador;
GRANT SELECT ON dbo.VW_CuentasPorCobrar TO rol_db_contador;
GRANT SELECT ON dbo.VW_Ventas TO rol_db_contador;
GRANT SELECT ON dbo.VW_ComprasDetalle TO rol_db_contador;
GRANT SELECT ON dbo.VW_CondicionesPagoActivas TO rol_db_contador;
GO

-- 5. DENEGACIÓN EXPLÍCITA DE ACCIONES SENSIBLES (18_DenegarPermisosSensibles.sql)
-- Ningún rol operativo puede realizar DELETE ni UPDATE directos sobre tablas transaccionales o de auditoría
DENY DELETE, UPDATE ON dbo.Bitacora TO rol_db_vendedor, rol_db_bodeguero, rol_db_contador;
DENY DELETE ON dbo.Venta TO rol_db_vendedor, rol_db_bodeguero, rol_db_contador;
DENY DELETE ON dbo.Venta_Producto TO rol_db_vendedor, rol_db_bodeguero, rol_db_contador;
DENY DELETE ON dbo.Venta_Servicio TO rol_db_vendedor, rol_db_bodeguero, rol_db_contador;
DENY DELETE ON dbo.Factura TO rol_db_vendedor, rol_db_bodeguero, rol_db_contador;
DENY DELETE ON dbo.Pago TO rol_db_vendedor, rol_db_bodeguero, rol_db_contador;
DENY DELETE ON dbo.Compra TO rol_db_vendedor, rol_db_bodeguero, rol_db_contador;
DENY DELETE ON dbo.Movimiento_Inventario TO rol_db_vendedor, rol_db_bodeguero, rol_db_contador;

-- Impedir escritura directa en tablas (deben usar siempre Stored Procedures)
DENY INSERT, UPDATE, DELETE ON dbo.Producto TO rol_db_vendedor, rol_db_bodeguero, rol_db_contador;
DENY INSERT, UPDATE, DELETE ON dbo.Usuario TO rol_db_vendedor, rol_db_bodeguero, rol_db_contador;
DENY INSERT, UPDATE, DELETE ON dbo.Rol TO rol_db_vendedor, rol_db_bodeguero, rol_db_contador;
DENY INSERT, UPDATE, DELETE ON dbo.Permiso TO rol_db_vendedor, rol_db_bodeguero, rol_db_contador;
GO

-- 6. VALIDACIÓN DE PERMISOS TÉCNICOS (19_ValidarPermisos.sql)
SELECT 
    pr.name AS Rol_O_Usuario,
    pe.permission_name AS Permiso,
    pe.state_desc AS EstadoPermiso,
    obj.name AS ObjetoAfectado,
    obj.type_desc AS TipoObjeto
FROM sys.database_permissions pe
INNER JOIN sys.database_principals pr ON pe.grantee_principal_id = pr.principal_id
LEFT JOIN sys.objects obj ON pe.major_id = obj.object_id
WHERE pr.name IN ('rol_db_administrador', 'rol_db_vendedor', 'rol_db_bodeguero', 'rol_db_contador', 'rol_db_aplicacion')
ORDER BY pr.name, pe.state_desc, obj.name;
GO

PRINT 'Seguridad y matriz de permisos instaladas exitosamente.';
GO
