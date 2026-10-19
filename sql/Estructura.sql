/* =========================================================================
   CASO DE ESTUDIO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR (LIBERIA)
   CREACIÓN DE BASE DE DATOS Y ESQUEMA FÍSICO RELACIONAL (33 TABLAS)
   ESTILO: TORRENTES (SSMS 22)
   DOCUMENTO DE DISEÑO TÉCNICO, NORMALIZACIÓN (3FN) Y DICCIONARIO DE DATOS
   ========================================================================= */

-- =========================================================================
-- 1. CREACIÓN DE LA BASE DE DATOS
-- =========================================================================
USE master
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = 'MUNDO_ESCOLAR')
BEGIN
    ALTER DATABASE MUNDO_ESCOLAR SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE MUNDO_ESCOLAR;
END
GO

CREATE DATABASE MUNDO_ESCOLAR
ON PRIMARY
(
    NAME = 'MUNDO_ESCOLAR_data',
    FILENAME = 'C:\SQLData\MUNDO_ESCOLAR_data.mdf',
    SIZE = 3072MB,          -- 3GB inicial
    MAXSIZE = 20480MB,      -- 20GB máximo
    FILEGROWTH = 1024MB     -- Crecimiento de 1GB
)
LOG ON
(
    NAME = 'MUNDO_ESCOLAR_log',
    FILENAME = 'C:\SQLLog\MUNDO_ESCOLAR_log.ldf',
    SIZE = 1024MB,          -- 1GB inicial
    MAXSIZE = 5120MB,       -- 5GB máximo
    FILEGROWTH = 512MB      -- Crecimiento de 512MB
)
GO

EXEC sp_helpdb MUNDO_ESCOLAR
GO

-- =========================================================================
-- 2. ASIGNACIÓN DE AUTORIZACIÓN Y TIPO ALIAS
-- =========================================================================
USE MUNDO_ESCOLAR
GO

-- Asignación de dueño sa para evitar Error 15404 en diagramas de SSMS
ALTER AUTHORIZATION ON DATABASE::MUNDO_ESCOLAR TO sa;
GO

-- Creación del tipo alias BOOL para compatibilidad exacta con el modelo relacional
CREATE TYPE BOOL FROM BIT
GO

-- =========================================================================
-- 3. CREACIÓN DE TABLAS (33 TABLAS NORMALIZADAS EN 3FN)
-- =========================================================================

-- -------------------------------------------------------------------------
-- 3.1 CATÁLOGOS BASE INDEPENDIENTES
-- -------------------------------------------------------------------------

-- Tabla 1: Tipo_Cliente
CREATE TABLE Tipo_Cliente (
    Id_Tipo_Cliente INT IDENTITY(1,1) NOT NULL,
    Nombre VARCHAR(50) NOT NULL,
    Descripcion VARCHAR(150) NULL,
    Estado BOOL NOT NULL,
    CONSTRAINT PK_Tipo_Cliente PRIMARY KEY (Id_Tipo_Cliente),
    CONSTRAINT UQ_Tipo_Cliente_Nombre UNIQUE (Nombre)
)
GO

-- Tabla 2: Condicion_Pago
CREATE TABLE Condicion_Pago (
    Id_Condicion_Pago INT IDENTITY(1,1) NOT NULL,
    Nombre VARCHAR(30) NOT NULL,
    Dias_Credito INT NOT NULL,
    Descripcion VARCHAR(150) NULL,
    Estado BOOL NOT NULL,
    CONSTRAINT PK_Condicion_Pago PRIMARY KEY (Id_Condicion_Pago),
    CONSTRAINT UQ_Condicion_Pago_Nombre UNIQUE (Nombre),
    CONSTRAINT CK_CondicionPago_DiasCredito CHECK (Dias_Credito >= 0)
)
GO

-- Tabla 3: Tipo_Proveedor
CREATE TABLE Tipo_Proveedor (
    Id_Tipo_Proveedor INT IDENTITY(1,1) NOT NULL,
    Nombre VARCHAR(50) NOT NULL,
    Estado BOOL NOT NULL,
    CONSTRAINT PK_Tipo_Proveedor PRIMARY KEY (Id_Tipo_Proveedor),
    CONSTRAINT UQ_Tipo_Proveedor_Nombre UNIQUE (Nombre)
)
GO

-- Tabla 4: Categoria
CREATE TABLE Categoria (
    Id_Categoria INT IDENTITY(1,1) NOT NULL,
    Nombre VARCHAR(20) NOT NULL,
    Descripcion VARCHAR(150) NULL,
    Estado BOOL NOT NULL,
    CONSTRAINT PK_Categoria PRIMARY KEY (Id_Categoria),
    CONSTRAINT UQ_Categoria_Nombre UNIQUE (Nombre)
)
GO

-- Tabla 5: Tipo_Movimiento
CREATE TABLE Tipo_Movimiento (
    Id_Tipo_Movimiento INT IDENTITY(1,1) NOT NULL,
    Nombre VARCHAR(50) NOT NULL,
    Naturaleza VARCHAR(20) NOT NULL,
    Estado BOOL NOT NULL,
    Descripcion VARCHAR(255) NULL,
    CONSTRAINT PK_Tipo_Movimiento PRIMARY KEY (Id_Tipo_Movimiento),
    CONSTRAINT UQ_Tipo_Movimiento_Nombre UNIQUE (Nombre),
    CONSTRAINT CK_TipoMovimiento_Naturaleza CHECK (Naturaleza IN ('Entrada', 'Salida', 'Ajuste', 'Devolución'))
)
GO

-- Tabla 6: Estado_Compra
CREATE TABLE Estado_Compra (
    Id_Estado_Compra INT IDENTITY(1,1) NOT NULL,
    Nombre_Estado VARCHAR(20) NOT NULL,
    CONSTRAINT PK_Estado_Compra PRIMARY KEY (Id_Estado_Compra),
    CONSTRAINT UQ_Estado_Compra_Nombre UNIQUE (Nombre_Estado)
)
GO

-- Tabla 7: Estado_Venta
CREATE TABLE Estado_Venta (
    Id_Estado_Venta INT IDENTITY(1,1) NOT NULL,
    Nombre_Estado VARCHAR(20) NOT NULL,
    CONSTRAINT PK_Estado_Venta PRIMARY KEY (Id_Estado_Venta),
    CONSTRAINT UQ_Estado_Venta_Nombre UNIQUE (Nombre_Estado)
)
GO

-- Tabla 8: Estado_Factura
CREATE TABLE Estado_Factura (
    Id_Estado_Factura INT IDENTITY(1,1) NOT NULL,
    Nombre_Estado VARCHAR(20) NOT NULL,
    CONSTRAINT PK_Estado_Factura PRIMARY KEY (Id_Estado_Factura),
    CONSTRAINT UQ_Estado_Factura_Nombre UNIQUE (Nombre_Estado)
)
GO

-- Tabla 9: Metodo_Pago
CREATE TABLE Metodo_Pago (
    Id_Metodo_Pago INT IDENTITY(1,1) NOT NULL,
    Nombre VARCHAR(50) NOT NULL,
    Descripcion VARCHAR(150) NULL,
    Estado BOOL NOT NULL,
    CONSTRAINT PK_Metodo_Pago PRIMARY KEY (Id_Metodo_Pago),
    CONSTRAINT UQ_Metodo_Pago_Nombre UNIQUE (Nombre)
)
GO

-- Tabla 10: Rol
CREATE TABLE Rol (
    Id_Rol INT IDENTITY(1,1) NOT NULL,
    Nombre VARCHAR(100) NOT NULL,
    Descripcion VARCHAR(150) NULL,
    Estado BOOL NOT NULL,
    CONSTRAINT PK_Rol PRIMARY KEY (Id_Rol),
    CONSTRAINT UQ_Rol_Nombre UNIQUE (Nombre)
)
GO

-- Tabla 11: Permiso
CREATE TABLE Permiso (
    Id_Permiso INT IDENTITY(1,1) NOT NULL,
    Nombre VARCHAR(100) NOT NULL,
    Descripcion VARCHAR(255) NULL,
    CONSTRAINT PK_Permiso PRIMARY KEY (Id_Permiso),
    CONSTRAINT UQ_Permiso_Nombre UNIQUE (Nombre)
)
GO

-- Tabla 12: Servicio
CREATE TABLE Servicio (
    Id_Servicio INT IDENTITY(1,1) NOT NULL,
    Nombre VARCHAR(50) NOT NULL,
    Descripcion VARCHAR(150) NULL,
    Precio_Base DECIMAL(12,2) NOT NULL,
    Estado BOOL NOT NULL,
    CONSTRAINT PK_Servicio PRIMARY KEY (Id_Servicio),
    CONSTRAINT UQ_Servicio_Nombre UNIQUE (Nombre),
    CONSTRAINT CK_Servicio_PrecioBase CHECK (Precio_Base >= 0)
)
GO

-- -------------------------------------------------------------------------
-- 3.2 SEGURIDAD, AUTENTICACIÓN Y AUDITORÍA
-- -------------------------------------------------------------------------

-- Tabla 13: Usuario
CREATE TABLE Usuario (
    Id_Usuario INT IDENTITY(1,1) NOT NULL,
    Nombre_Usuario VARCHAR(50) NOT NULL,
    Correo VARCHAR(150) NOT NULL,
    Contrasena VARCHAR(255) NOT NULL,
    Fecha_Registro DATETIME NOT NULL CONSTRAINT DF_Usuario_FechaRegistro DEFAULT GETDATE(),
    Estado BOOL NOT NULL CONSTRAINT DF_Usuario_Estado DEFAULT 1,
    CONSTRAINT PK_Usuario PRIMARY KEY (Id_Usuario),
    CONSTRAINT UQ_Usuario_NombreUsuario UNIQUE (Nombre_Usuario),
    CONSTRAINT UQ_Usuario_Correo UNIQUE (Correo)
)
GO

-- Tabla 14: Rol_Usuario (N:M)
CREATE TABLE Rol_Usuario (
    Id_Rol_Usuario INT IDENTITY(1,1) NOT NULL,
    Id_Rol INT NOT NULL,
    Id_Usuario INT NOT NULL,
    CONSTRAINT PK_Rol_Usuario PRIMARY KEY (Id_Rol_Usuario),
    CONSTRAINT UQ_Rol_Usuario UNIQUE (Id_Rol, Id_Usuario),
    CONSTRAINT FK_RolUsuario_Rol FOREIGN KEY (Id_Rol) REFERENCES Rol(Id_Rol),
    CONSTRAINT FK_RolUsuario_Usuario FOREIGN KEY (Id_Usuario) REFERENCES Usuario(Id_Usuario)
)
GO

-- Tabla 15: Rol_Permiso (N:M)
CREATE TABLE Rol_Permiso (
    Id_Rol_Permiso INT IDENTITY(1,1) NOT NULL,
    Id_Rol INT NOT NULL,
    Id_Permiso INT NOT NULL,
    CONSTRAINT PK_Rol_Permiso PRIMARY KEY (Id_Rol_Permiso),
    CONSTRAINT UQ_Rol_Permiso UNIQUE (Id_Rol, Id_Permiso),
    CONSTRAINT FK_RolPermiso_Rol FOREIGN KEY (Id_Rol) REFERENCES Rol(Id_Rol),
    CONSTRAINT FK_RolPermiso_Permiso FOREIGN KEY (Id_Permiso) REFERENCES Permiso(Id_Permiso)
)
GO

-- Tabla 16: Bitacora
CREATE TABLE Bitacora (
    Id_Bitacora INT IDENTITY(1,1) NOT NULL,
    Id_Usuario INT NOT NULL,
    Accion VARCHAR(100) NOT NULL,
    Tabla_Afectada VARCHAR(100) NOT NULL,
    Id_Registro_Afectado INT NOT NULL,
    Fecha_Hora DATETIME NOT NULL CONSTRAINT DF_Bitacora_FechaHora DEFAULT GETDATE(),
    Descripcion VARCHAR(200) NULL,
    CONSTRAINT PK_Bitacora PRIMARY KEY (Id_Bitacora),
    CONSTRAINT FK_Bitacora_Usuario FOREIGN KEY (Id_Usuario) REFERENCES Usuario(Id_Usuario)
)
GO

-- -------------------------------------------------------------------------
-- 3.3 CLIENTES, PROVEEDORES Y SUS SUBTIPOS ESPECIALIZADOS
-- -------------------------------------------------------------------------

-- Tabla 17: Cliente (Supertipo)
CREATE TABLE Cliente (
    Id_Cliente INT IDENTITY(1,1) NOT NULL,
    Id_Tipo_Cliente INT NOT NULL,
    Id_Usuario INT NOT NULL,
    Telefono VARCHAR(30) NOT NULL,
    Direccion VARCHAR(200) NOT NULL,
    Estado BOOL NOT NULL CONSTRAINT DF_Cliente_Estado DEFAULT 1,
    CONSTRAINT PK_Cliente PRIMARY KEY (Id_Cliente),
    CONSTRAINT UQ_Cliente_Usuario UNIQUE (Id_Usuario),
    CONSTRAINT FK_Cliente_TipoCliente FOREIGN KEY (Id_Tipo_Cliente) REFERENCES Tipo_Cliente(Id_Tipo_Cliente),
    CONSTRAINT FK_Cliente_Usuario FOREIGN KEY (Id_Usuario) REFERENCES Usuario(Id_Usuario)
)
GO

-- Tabla 18: Cliente_Particular (Subtipo Exclusivo)
CREATE TABLE Cliente_Particular (
    Id_Cliente INT NOT NULL,
    Identificacion VARCHAR(20) NOT NULL,
    Nombre VARCHAR(50) NOT NULL,
    Apellido1 VARCHAR(50) NOT NULL,
    Apellido2 VARCHAR(50) NOT NULL,
    CONSTRAINT PK_Cliente_Particular PRIMARY KEY (Id_Cliente),
    CONSTRAINT UQ_ClienteParticular_Identificacion UNIQUE (Identificacion),
    CONSTRAINT FK_ClienteParticular_Cliente FOREIGN KEY (Id_Cliente) REFERENCES Cliente(Id_Cliente)
)
GO

-- Tabla 19: Cliente_Institucional (Subtipo Exclusivo)
CREATE TABLE Cliente_Institucional (
    Id_Cliente INT NOT NULL,
    Razon_Social VARCHAR(50) NOT NULL,
    Cedula_Juridica VARCHAR(50) NOT NULL,
    Nombre_Contacto VARCHAR(50) NOT NULL,
    Telefono_Contacto VARCHAR(50) NOT NULL,
    Correo_Contacto VARCHAR(50) NOT NULL,
    CONSTRAINT PK_Cliente_Institucional PRIMARY KEY (Id_Cliente),
    CONSTRAINT UQ_ClienteInstitucional_CedulaJuridica UNIQUE (Cedula_Juridica),
    CONSTRAINT FK_ClienteInstitucional_Cliente FOREIGN KEY (Id_Cliente) REFERENCES Cliente(Id_Cliente)
)
GO

-- Tabla 20: Cliente_Condicion_Pago (N:M Autorizaciones Financieras)
CREATE TABLE Cliente_Condicion_Pago (
    Id_Cliente_Condicion_Pago INT IDENTITY(1,1) NOT NULL,
    Id_Cliente INT NOT NULL,
    Id_Condicion_Pago INT NOT NULL,
    Fecha_Autorizacion DATE NOT NULL CONSTRAINT DF_ClienteCondicion_Fecha DEFAULT CAST(GETDATE() AS DATE),
    Estado BOOL NOT NULL CONSTRAINT DF_ClienteCondicion_Estado DEFAULT 1,
    CONSTRAINT PK_Cliente_Condicion_Pago PRIMARY KEY (Id_Cliente_Condicion_Pago),
    CONSTRAINT UQ_Cliente_CondicionPago UNIQUE (Id_Cliente, Id_Condicion_Pago),
    CONSTRAINT FK_ClienteCondicion_Cliente FOREIGN KEY (Id_Cliente) REFERENCES Cliente(Id_Cliente),
    CONSTRAINT FK_ClienteCondicion_CondicionPago FOREIGN KEY (Id_Condicion_Pago) REFERENCES Condicion_Pago(Id_Condicion_Pago)
)
GO

-- Tabla 21: Proveedor (Supertipo)
CREATE TABLE Proveedor (
    Id_Proveedor INT IDENTITY(1,1) NOT NULL,
    Id_Tipo_Proveedor INT NOT NULL,
    Correo VARCHAR(150) NOT NULL,
    Telefono VARCHAR(100) NOT NULL,
    Direccion VARCHAR(200) NOT NULL,
    Estado BOOL NOT NULL CONSTRAINT DF_Proveedor_Estado DEFAULT 1,
    CONSTRAINT PK_Proveedor PRIMARY KEY (Id_Proveedor),
    CONSTRAINT FK_Proveedor_TipoProveedor FOREIGN KEY (Id_Tipo_Proveedor) REFERENCES Tipo_Proveedor(Id_Tipo_Proveedor)
)
GO

-- Tabla 22: Proveedor_Particular (Subtipo Exclusivo)
CREATE TABLE Proveedor_Particular (
    Id_Proveedor INT NOT NULL,
    Identificacion VARCHAR(20) NOT NULL,
    Nombre VARCHAR(50) NOT NULL,
    Apellido1 VARCHAR(50) NOT NULL,
    Apellido2 VARCHAR(50) NOT NULL,
    CONSTRAINT PK_Proveedor_Particular PRIMARY KEY (Id_Proveedor),
    CONSTRAINT UQ_ProveedorParticular_Identificacion UNIQUE (Identificacion),
    CONSTRAINT FK_ProveedorParticular_Proveedor FOREIGN KEY (Id_Proveedor) REFERENCES Proveedor(Id_Proveedor)
)
GO

-- Tabla 23: Proveedor_Institucional (Subtipo Exclusivo)
CREATE TABLE Proveedor_Institucional (
    Id_Proveedor INT NOT NULL,
    Razon_Social VARCHAR(50) NOT NULL,
    Cedula_Juridica VARCHAR(50) NOT NULL,
    Nombre_Contacto VARCHAR(50) NOT NULL,
    Telefono_Contacto VARCHAR(50) NOT NULL,
    Correo_Contacto VARCHAR(50) NOT NULL,
    CONSTRAINT PK_Proveedor_Institucional PRIMARY KEY (Id_Proveedor),
    CONSTRAINT UQ_ProveedorInstitucional_CedulaJuridica UNIQUE (Cedula_Juridica),
    CONSTRAINT FK_ProveedorInstitucional_Proveedor FOREIGN KEY (Id_Proveedor) REFERENCES Proveedor(Id_Proveedor)
)
GO

-- -------------------------------------------------------------------------
-- 3.4 CATÁLOGO DE PRODUCTOS E INVENTARIO
-- -------------------------------------------------------------------------

-- Tabla 24: Producto
CREATE TABLE Producto (
    Id_Producto INT IDENTITY(1,1) NOT NULL,
    Id_Categoria INT NOT NULL,
    Nombre VARCHAR(50) NOT NULL,
    Descripcion VARCHAR(150) NULL,
    Precio_Venta DECIMAL(12,2) NOT NULL,
    Stock_Actual INT NOT NULL CONSTRAINT DF_Producto_StockActual DEFAULT 0,
    Punto_Reorden INT NOT NULL CONSTRAINT DF_Producto_PuntoReorden DEFAULT 0,
    Estado BOOL NOT NULL CONSTRAINT DF_Producto_Estado DEFAULT 1,
    CONSTRAINT PK_Producto PRIMARY KEY (Id_Producto),
    CONSTRAINT UQ_Producto_Nombre UNIQUE (Nombre),
    CONSTRAINT FK_Producto_Categoria FOREIGN KEY (Id_Categoria) REFERENCES Categoria(Id_Categoria),
    CONSTRAINT CK_Producto_PrecioVenta CHECK (Precio_Venta >= 0),
    CONSTRAINT CK_Producto_StockActual CHECK (Stock_Actual >= 0),
    CONSTRAINT CK_Producto_PuntoReorden CHECK (Punto_Reorden >= 0)
)
GO

-- Tabla 25: Producto_Proveedor (N:M Suministro)
CREATE TABLE Producto_Proveedor (
    Id_Producto_Proveedor INT IDENTITY(1,1) NOT NULL,
    Id_Producto INT NOT NULL,
    Id_Proveedor INT NOT NULL,
    Precio_Compra DECIMAL(12,2) NOT NULL,
    EsPrincipal BOOL NOT NULL CONSTRAINT DF_ProductoProveedor_EsPrincipal DEFAULT 0,
    Estado BOOL NOT NULL CONSTRAINT DF_ProductoProveedor_Estado DEFAULT 1,
    CONSTRAINT PK_Producto_Proveedor PRIMARY KEY (Id_Producto_Proveedor),
    CONSTRAINT UQ_Producto_Proveedor UNIQUE (Id_Producto, Id_Proveedor),
    CONSTRAINT FK_ProductoProveedor_Producto FOREIGN KEY (Id_Producto) REFERENCES Producto(Id_Producto),
    CONSTRAINT FK_ProductoProveedor_Proveedor FOREIGN KEY (Id_Proveedor) REFERENCES Proveedor(Id_Proveedor),
    CONSTRAINT CK_ProductoProveedor_PrecioCompra CHECK (Precio_Compra >= 0)
)
GO

-- Tabla 26: Movimiento_Inventario
CREATE TABLE Movimiento_Inventario (
    Id_Movimiento_Inventario INT IDENTITY(1,1) NOT NULL,
    Id_Producto INT NOT NULL,
    Id_Tipo_Movimiento INT NOT NULL,
    Id_Usuario INT NOT NULL,
    Cantidad INT NOT NULL,
    Fecha DATETIME NOT NULL CONSTRAINT DF_Movimiento_Fecha DEFAULT GETDATE(),
    Motivo VARCHAR(150) NOT NULL,
    CONSTRAINT PK_Movimiento_Inventario PRIMARY KEY (Id_Movimiento_Inventario),
    CONSTRAINT FK_Movimiento_Producto FOREIGN KEY (Id_Producto) REFERENCES Producto(Id_Producto),
    CONSTRAINT FK_Movimiento_TipoMovimiento FOREIGN KEY (Id_Tipo_Movimiento) REFERENCES Tipo_Movimiento(Id_Tipo_Movimiento),
    CONSTRAINT FK_Movimiento_Usuario FOREIGN KEY (Id_Usuario) REFERENCES Usuario(Id_Usuario),
    CONSTRAINT CK_Movimiento_Cantidad CHECK (Cantidad > 0)
)
GO

-- -------------------------------------------------------------------------
-- 3.5 MÓDULO DE COMPRAS A PROVEEDORES
-- -------------------------------------------------------------------------

-- Tabla 27: Compra (Cabecera)
CREATE TABLE Compra (
    Id_Compra INT IDENTITY(1,1) NOT NULL,
    Id_Proveedor INT NOT NULL,
    Id_Usuario INT NOT NULL,
    Id_Estado_Compra INT NOT NULL,
    Fecha_Compra DATETIME NOT NULL CONSTRAINT DF_Compra_FechaCompra DEFAULT GETDATE(),
    CONSTRAINT PK_Compra PRIMARY KEY (Id_Compra),
    CONSTRAINT FK_Compra_Proveedor FOREIGN KEY (Id_Proveedor) REFERENCES Proveedor(Id_Proveedor),
    CONSTRAINT FK_Compra_Usuario FOREIGN KEY (Id_Usuario) REFERENCES Usuario(Id_Usuario),
    CONSTRAINT FK_Compra_EstadoCompra FOREIGN KEY (Id_Estado_Compra) REFERENCES Estado_Compra(Id_Estado_Compra)
)
GO

-- Tabla 28: Compra_Producto (Líneas de Compra)
CREATE TABLE Compra_Producto (
    Id_Compra_Producto INT IDENTITY(1,1) NOT NULL,
    Id_Compra INT NOT NULL,
    Id_Producto INT NOT NULL,
    Cantidad INT NOT NULL,
    Costo_Unitario DECIMAL(12,2) NOT NULL,
    Subtotal DECIMAL(12,2) NOT NULL,
    CONSTRAINT PK_Compra_Producto PRIMARY KEY (Id_Compra_Producto),
    CONSTRAINT UQ_Compra_Producto UNIQUE (Id_Compra, Id_Producto),
    CONSTRAINT FK_CompraProducto_Compra FOREIGN KEY (Id_Compra) REFERENCES Compra(Id_Compra),
    CONSTRAINT FK_CompraProducto_Producto FOREIGN KEY (Id_Producto) REFERENCES Producto(Id_Producto),
    CONSTRAINT CK_CompraProducto_Cantidad CHECK (Cantidad > 0),
    CONSTRAINT CK_CompraProducto_CostoUnitario CHECK (Costo_Unitario >= 0),
    CONSTRAINT CK_CompraProducto_Subtotal CHECK (Subtotal >= 0)
)
GO

-- -------------------------------------------------------------------------
-- 3.6 MÓDULO DE VENTAS Y SERVICIOS
-- -------------------------------------------------------------------------

-- Tabla 29: Venta (Cabecera Comercial)
CREATE TABLE Venta (
    Id_Venta INT IDENTITY(1,1) NOT NULL,
    Id_Cliente INT NOT NULL,
    Id_Usuario INT NOT NULL,
    Id_Estado_Venta INT NOT NULL,
    Id_Condicion_Pago INT NOT NULL,
    Fecha DATETIME NOT NULL CONSTRAINT DF_Venta_Fecha DEFAULT GETDATE(),
    Subtotal DECIMAL(12,2) NOT NULL,
    Impuesto DECIMAL(12,2) NOT NULL,
    Monto_Total DECIMAL(12,2) NOT NULL,
    CONSTRAINT PK_Venta PRIMARY KEY (Id_Venta),
    CONSTRAINT FK_Venta_Cliente FOREIGN KEY (Id_Cliente) REFERENCES Cliente(Id_Cliente),
    CONSTRAINT FK_Venta_Usuario FOREIGN KEY (Id_Usuario) REFERENCES Usuario(Id_Usuario),
    CONSTRAINT FK_Venta_EstadoVenta FOREIGN KEY (Id_Estado_Venta) REFERENCES Estado_Venta(Id_Estado_Venta),
    CONSTRAINT FK_Venta_CondicionPago FOREIGN KEY (Id_Condicion_Pago) REFERENCES Condicion_Pago(Id_Condicion_Pago),
    CONSTRAINT CK_Venta_Subtotal CHECK (Subtotal >= 0),
    CONSTRAINT CK_Venta_Impuesto CHECK (Impuesto >= 0),
    CONSTRAINT CK_Venta_MontoTotal CHECK (Monto_Total >= 0),
    CONSTRAINT CK_Venta_TotalCalculado CHECK (Monto_Total = Subtotal + Impuesto)
)
GO

-- Tabla 30: Venta_Producto (Líneas de Artículos)
CREATE TABLE Venta_Producto (
    Id_Venta_Producto INT IDENTITY(1,1) NOT NULL,
    Id_Producto INT NOT NULL,
    Id_Venta INT NOT NULL,
    Cantidad INT NOT NULL,
    Precio_Unitario DECIMAL(12,2) NOT NULL,
    Subtotal DECIMAL(12,2) NOT NULL,
    CONSTRAINT PK_Venta_Producto PRIMARY KEY (Id_Venta_Producto),
    CONSTRAINT UQ_Venta_Producto UNIQUE (Id_Venta, Id_Producto),
    CONSTRAINT FK_VentaProducto_Producto FOREIGN KEY (Id_Producto) REFERENCES Producto(Id_Producto),
    CONSTRAINT FK_VentaProducto_Venta FOREIGN KEY (Id_Venta) REFERENCES Venta(Id_Venta),
    CONSTRAINT CK_VentaProducto_Cantidad CHECK (Cantidad > 0),
    CONSTRAINT CK_VentaProducto_PrecioUnitario CHECK (Precio_Unitario >= 0),
    CONSTRAINT CK_VentaProducto_Subtotal CHECK (Subtotal >= 0)
)
GO

-- Tabla 31: Venta_Servicio (Líneas de Servicios)
CREATE TABLE Venta_Servicio (
    Id_Venta_Servicio INT IDENTITY(1,1) NOT NULL,
    Id_Venta INT NOT NULL,
    Id_Servicio INT NOT NULL,
    Cantidad INT NOT NULL,
    Precio_Unitario DECIMAL(12,2) NOT NULL,
    Subtotal DECIMAL(12,2) NOT NULL,
    CONSTRAINT PK_Venta_Servicio PRIMARY KEY (Id_Venta_Servicio),
    CONSTRAINT UQ_Venta_Servicio UNIQUE (Id_Venta, Id_Servicio),
    CONSTRAINT FK_VentaServicio_Venta FOREIGN KEY (Id_Venta) REFERENCES Venta(Id_Venta),
    CONSTRAINT FK_VentaServicio_Servicio FOREIGN KEY (Id_Servicio) REFERENCES Servicio(Id_Servicio),
    CONSTRAINT CK_VentaServicio_Cantidad CHECK (Cantidad > 0),
    CONSTRAINT CK_VentaServicio_PrecioUnitario CHECK (Precio_Unitario >= 0),
    CONSTRAINT CK_VentaServicio_Subtotal CHECK (Subtotal >= 0)
)
GO

-- -------------------------------------------------------------------------
-- 3.7 FACTURACIÓN, PAGOS Y CUENTAS POR COBRAR
-- -------------------------------------------------------------------------

-- Tabla 32: Factura
CREATE TABLE Factura (
    Id_Factura INT IDENTITY(1,1) NOT NULL,
    Id_Venta INT NOT NULL,
    Id_Estado_Factura INT NOT NULL,
    Fecha_Emision DATETIME NOT NULL CONSTRAINT DF_Factura_FechaEmision DEFAULT GETDATE(),
    Fecha_Vencimiento DATETIME NOT NULL,
    Monto_Total DECIMAL(12,2) NOT NULL,
    Saldo_Pendiente DECIMAL(12,2) NOT NULL,
    CONSTRAINT PK_Factura PRIMARY KEY (Id_Factura),
    CONSTRAINT UQ_Factura_Venta UNIQUE (Id_Venta),
    CONSTRAINT FK_Factura_Venta FOREIGN KEY (Id_Venta) REFERENCES Venta(Id_Venta),
    CONSTRAINT FK_Factura_EstadoFactura FOREIGN KEY (Id_Estado_Factura) REFERENCES Estado_Factura(Id_Estado_Factura),
    CONSTRAINT CK_Factura_MontoTotal CHECK (Monto_Total >= 0),
    CONSTRAINT CK_Factura_SaldoPendiente CHECK (Saldo_Pendiente >= 0),
    CONSTRAINT CK_Factura_SaldoNoMayor CHECK (Saldo_Pendiente <= Monto_Total)
)
GO

-- Tabla 33: Pago (Abonos Individuales)
CREATE TABLE Pago (
    Id_Pago INT IDENTITY(1,1) NOT NULL,
    Id_Factura INT NOT NULL,
    Id_Metodo_Pago INT NOT NULL,
    Fecha_Pago DATETIME NOT NULL CONSTRAINT DF_Pago_FechaPago DEFAULT GETDATE(),
    Monto_Pagado DECIMAL(12,2) NOT NULL,
    Numero_Referencia VARCHAR(100) NULL,
    Estado BOOL NOT NULL CONSTRAINT DF_Pago_Estado DEFAULT 1,
    CONSTRAINT PK_Pago PRIMARY KEY (Id_Pago),
    CONSTRAINT FK_Pago_Factura FOREIGN KEY (Id_Factura) REFERENCES Factura(Id_Factura),
    CONSTRAINT FK_Pago_MetodoPago FOREIGN KEY (Id_Metodo_Pago) REFERENCES Metodo_Pago(Id_Metodo_Pago),
    CONSTRAINT CK_Pago_MontoPagado CHECK (Monto_Pagado > 0)
)
GO

-- =========================================================================
-- 4. VERIFICACIÓN FINAL DEL ESQUEMA FÍSICO
-- =========================================================================
SELECT 
    t.name AS Tabla,
    c.name AS Columna,
    ty.name AS TipoDato,
    c.max_length AS LongitudBytes,
    c.is_nullable AS PermiteNulos,
    c.is_identity AS EsIdentity
FROM sys.tables t
INNER JOIN sys.columns c ON t.object_id = c.object_id
INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
ORDER BY t.name, c.column_id;
GO

SELECT 
    COUNT(*) AS TotalTablasInstaladas 
FROM sys.tables;
GO
