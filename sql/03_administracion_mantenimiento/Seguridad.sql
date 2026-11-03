/* =========================================================================
   PROYECTO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR
   ARCHIVO: Seguridad.sql (SCRIPT MAESTRO CONSOLIDADO DE SEGURIDAD Y PERMISOS)
   ESTILO: TORRENTES (SSMS 22)
   REFERENCIA DOCUMENTACIÓN: Sección 17.8.14 a 17.8.19 (Páginas 447-449)
   DESCRIPCIÓN: 
     Configuración integral de la seguridad técnica en SQL Server bajo PoLP:
       1. 14_CrearLogins.sql               (Cuentas de servidor)
       2. 15_CrearUsuariosBD.sql          (Usuarios de base de datos)
       3. 16_CrearRolesBD.sql              (Database Roles de SQL Server)
       4. 17_AsignarPermisos.sql           (Concesión de privilegios mínimos sobre SPs y Vistas)
       5. 18_DenegarPermisosSensibles.sql   (DENY explícito sobre tablas operativas y Bitácora)
       6. 19_ValidarPermisos.sql           (Comprobación técnica de la matriz de seguridad)
       7. Module Signing                   (Certificados y firma criptográfica de SPs DBA)
   ========================================================================= */

USE master
GO

/* =========================================================================
   NOTA DE DESPLIEGUE SEGURO (SEPARACIÓN DE SECRETOS):
   En entornos de producción, las contraseñas de logins y clave maestra deben
   ser provistas externamente mediante variables de entorno en el pipeline de
   despliegue (ej. sqlcmd -v APP_PWD="...") y nunca fijarse en código fuente.
   ========================================================================= */

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
-- Concesión de rol db_backupoperator eliminada por PoLP (Hallazgo S05).
-- La delegación de permisos de respaldo se realiza exclusivamente mediante Module Signing.
GO

-- 4. CONCESIÓN DE PERMISOS MÍNIMOS (17_AsignarPermisos.sql)
-- Rol Administrador: Control total sobre objetos de esquema dbo
GRANT EXECUTE ON SCHEMA::dbo TO rol_db_administrador;
GRANT SELECT ON SCHEMA::dbo TO rol_db_administrador;
GRANT VIEW DEFINITION TO rol_db_administrador;

-- Rol Aplicación (Sistema Backend) - Principio de Menor Privilegio (PoLP estricto)
-- 4.1 Permisos de ejecución de procedimientos almacenados de negocio
GRANT EXECUTE ON SCHEMA::dbo TO rol_db_aplicacion;

-- 4.2 Concesión de lectura EXCLUSIVA sobre vistas operativas del negocio (Cero SELECT directo sobre tablas base)
GRANT SELECT ON dbo.VW_ClientesActivos TO rol_db_aplicacion;
GRANT SELECT ON dbo.VW_ProductosCatalogo TO rol_db_aplicacion;
GRANT SELECT ON dbo.VW_ProductosInventario TO rol_db_aplicacion;
GRANT SELECT ON dbo.VW_Ventas TO rol_db_aplicacion;
GRANT SELECT ON dbo.VW_MetodosPagoActivos TO rol_db_aplicacion;
GRANT SELECT ON dbo.VW_ProveedoresActivos TO rol_db_aplicacion;
GRANT SELECT ON dbo.VW_ProductoProveedor TO rol_db_aplicacion;
GRANT SELECT ON dbo.VW_MovimientosInventario TO rol_db_aplicacion;
GRANT SELECT ON dbo.VW_ComprasDetalle TO rol_db_aplicacion;
GRANT SELECT ON dbo.VW_Facturas TO rol_db_aplicacion;
GRANT SELECT ON dbo.VW_Pagos TO rol_db_aplicacion;
GRANT SELECT ON dbo.VW_CuentasPorCobrar TO rol_db_aplicacion;
GRANT SELECT ON dbo.VW_CondicionesPagoActivas TO rol_db_aplicacion;

-- 4.3 DENEGACIÓN EXPLÍCITA SOBRE TABLAS SENSIBLES
-- Previene que conexiones directas bajo login_mundo_app consulten hashes de contraseñas o alteren bitácora
DENY SELECT, INSERT, UPDATE, DELETE ON dbo.Usuario TO rol_db_aplicacion;
DENY SELECT, INSERT, UPDATE, DELETE ON dbo.TB_Historial_Contrasenas TO rol_db_aplicacion;
DENY SELECT, INSERT, UPDATE, DELETE ON dbo.Bitacora TO rol_db_aplicacion;
DENY SELECT, INSERT, UPDATE, DELETE ON dbo.TB_Token_Revocado TO rol_db_aplicacion;

-- 4.4 DENEGACIÓN EXPLÍCITA DE PROCEDIMIENTOS DE MANTENIMIENTO DEL MOTOR A LA APLICACIÓN
-- El backend no debe invocar comprobaciones profundas de consistencia o reparación física
DENY EXECUTE ON dbo.SP_DBA_VerificarIntegridadBD TO rol_db_aplicacion;

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

-- 7. CONFIGURACIÓN DE MODULE SIGNING (DELEGACIÓN SEGURA DE RESPALDOS CON TRUSTWORTHY OFF)
-- Satisface S04 y S05: El usuario usr_mundo_app NO requiere db_backupoperator ni TRUSTWORTHY ON.
USE MUNDO_ESCOLAR;
GO

-- 7.1 Asegurar Master Key en MUNDO_ESCOLAR con cifrado por Service Master Key
IF NOT EXISTS (SELECT 1 FROM sys.symmetric_keys WHERE name = '##MS_DatabaseMasterKey##')
BEGIN
    CREATE MASTER KEY ENCRYPTION BY PASSWORD = 'MasterKeyPassword2026*!Complex';
    ALTER MASTER KEY ADD ENCRYPTION BY SERVICE MASTER KEY;
END
GO

-- 7.2 Crear Certificado de Firma DBA si no existe
IF NOT EXISTS (SELECT 1 FROM sys.certificates WHERE name = 'Cert_MundoEscolar_DBA')
BEGIN
    CREATE CERTIFICATE Cert_MundoEscolar_DBA
    WITH SUBJECT = 'Certificado Firma DBA Mundo Escolar (Module Signing)';
END
GO

-- 7.3 Crear principal de BD asociado al certificado y conceder permisos de respaldo
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'usr_cert_dba')
BEGIN
    CREATE USER usr_cert_dba FROM CERTIFICATE Cert_MundoEscolar_DBA;
END
GRANT BACKUP DATABASE TO usr_cert_dba;
GRANT BACKUP LOG TO usr_cert_dba;
GO

-- 7.4 Exportar clave pública e importar en master para permisos a nivel servidor
DECLARE @RutaCer VARCHAR(500) = 'C:\SQLBackup\Cert_MundoEscolar_DBA_' + REPLACE(CONVERT(VARCHAR(50), NEWID()), '-', '') + '.cer';
DECLARE @SqlExport NVARCHAR(MAX) = N'BACKUP CERTIFICATE Cert_MundoEscolar_DBA TO FILE = ''' + @RutaCer + ''';';
EXEC sp_executesql @SqlExport;

DECLARE @SqlImport NVARCHAR(MAX) = N'
USE master;
IF NOT EXISTS (SELECT 1 FROM sys.certificates WHERE name = ''Cert_MundoEscolar_DBA'')
    CREATE CERTIFICATE Cert_MundoEscolar_DBA FROM FILE = ''' + @RutaCer + ''';
';
EXEC sp_executesql @SqlImport;
GO

USE master;
GO

-- 7.5 Crear login de certificado en master con AUTHENTICATE SERVER y CREATE ANY DATABASE
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'login_cert_dba')
BEGIN
    CREATE LOGIN login_cert_dba FROM CERTIFICATE Cert_MundoEscolar_DBA;
END
GRANT AUTHENTICATE SERVER TO login_cert_dba;
GRANT CREATE ANY DATABASE TO login_cert_dba;
GO

USE MUNDO_ESCOLAR;
GO

-- 7.6 Firmar criptográficamente los procedimientos de respaldo (SPs 69-72)
-- Toda modificación a los SPs invalida su firma, por lo que este paso se ejecuta siempre al final del despliegue.
ADD SIGNATURE TO dbo.SP_DBA_EjecutarBackupCompleto BY CERTIFICATE Cert_MundoEscolar_DBA;
ADD SIGNATURE TO dbo.SP_DBA_EjecutarBackupDiferencial BY CERTIFICATE Cert_MundoEscolar_DBA;
ADD SIGNATURE TO dbo.SP_DBA_EjecutarBackupLog BY CERTIFICATE Cert_MundoEscolar_DBA;
ADD SIGNATURE TO dbo.SP_DBA_VerificarIntegridadBackup BY CERTIFICATE Cert_MundoEscolar_DBA;
GO

PRINT 'Seguridad y matriz de permisos PoLP instaladas exitosamente.';
GO
