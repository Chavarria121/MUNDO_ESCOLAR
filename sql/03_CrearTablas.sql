/* =========================================================================
   SCRIPT 03: CREACIÓN DE TABLAS DEL MODELO RELACIONAL (33 TABLAS)
   CASO DE ESTUDIO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR (LIBERIA)
   REQUERIMIENTOS ASOCIADOS: RF1–RF6, RA1, RA3, RA5
   NORMALIZACIÓN: TERCERA FORMA NORMAL (3FN)
   ESTILO: TORRENTES (SSMS 22)
   ========================================================================= */

USE MUNDO_ESCOLAR
GO

-- =========================================================================
-- 1. CATÁLOGOS BASE INDEPENDIENTES
-- =========================================================================

-- Tabla 1: Tipo_Cliente
CREATE TABLE Tipo_Cliente (
    Id_Tipo_Cliente INT IDENTITY(1,1) NOT NULL,
    Nombre VARCHAR(50) NOT NULL,
    Descripcion VARCHAR(150) NULL,
    Estado BOOL NOT NULL,
    CONSTRAINT PK_Tipo_Cliente PRIMARY KEY (Id_Tipo_Cliente)
)
GO

-- Tabla 2: Condicion_Pago
CREATE TABLE Condicion_Pago (
    Id_Condicion_Pago INT IDENTITY(1,1) NOT NULL,
    Nombre VARCHAR(30) NOT NULL,
    Dias_Credito INT NOT NULL,
    Descripcion VARCHAR(150) NULL,
    Estado BOOL NOT NULL,
    CONSTRAINT PK_Condicion_Pago PRIMARY KEY (Id_Condicion_Pago)
)
GO

-- Tabla 3: Tipo_Proveedor
CREATE TABLE Tipo_Proveedor (
    Id_Tipo_Proveedor INT IDENTITY(1,1) NOT NULL,
    Nombre VARCHAR(50) NOT NULL,
    Estado BOOL NOT NULL,
    CONSTRAINT PK_Tipo_Proveedor PRIMARY KEY (Id_Tipo_Proveedor)
)
GO

-- Tabla 4: Categoria
CREATE TABLE Categoria (
    Id_Categoria INT IDENTITY(1,1) NOT NULL,
    Nombre VARCHAR(20) NOT NULL,
    Descripcion VARCHAR(150) NULL,
    Estado BOOL NOT NULL,
    CONSTRAINT PK_Categoria PRIMARY KEY (Id_Categoria)
)
GO

-- Tabla 5: Tipo_Movimiento
CREATE TABLE Tipo_Movimiento (
    Id_Tipo_Movimiento INT IDENTITY(1,1) NOT NULL,
    Nombre VARCHAR(50) NOT NULL,
    Naturaleza VARCHAR(20) NOT NULL,
    Estado BOOL NOT NULL,
    Descripcion VARCHAR(255) NULL,
    CONSTRAINT PK_Tipo_Movimiento PRIMARY KEY (Id_Tipo_Movimiento)
)
GO

-- Tabla 6: Estado_Compra
CREATE TABLE Estado_Compra (
    Id_Estado_Compra INT IDENTITY(1,1) NOT NULL,
    Nombre_Estado VARCHAR(20) NOT NULL,
    CONSTRAINT PK_Estado_Compra PRIMARY KEY (Id_Estado_Compra)
)
GO

-- Tabla 7: Estado_Venta
CREATE TABLE Estado_Venta (
    Id_Estado_Venta INT IDENTITY(1,1) NOT NULL,
    Nombre_Estado VARCHAR(20) NOT NULL,
    CONSTRAINT PK_Estado_Venta PRIMARY KEY (Id_Estado_Venta)
)
GO

-- Tabla 8: Estado_Factura
CREATE TABLE Estado_Factura (
    Id_Estado_Factura INT IDENTITY(1,1) NOT NULL,
    Nombre_Estado VARCHAR(20) NOT NULL,
    CONSTRAINT PK_Estado_Factura PRIMARY KEY (Id_Estado_Factura)
)
GO

-- Tabla 9: Metodo_Pago
CREATE TABLE Metodo_Pago (
    Id_Metodo_Pago INT IDENTITY(1,1) NOT NULL,
    Nombre VARCHAR(50) NOT NULL,
    Descripcion VARCHAR(150) NULL,
    Estado BOOL NOT NULL,
    CONSTRAINT PK_Metodo_Pago PRIMARY KEY (Id_Metodo_Pago)
)
GO

-- Tabla 10: Rol
CREATE TABLE Rol (
    Id_Rol INT IDENTITY(1,1) NOT NULL,
    Nombre VARCHAR(100) NOT NULL,
    Descripcion VARCHAR(150) NULL,
    Estado BOOL NOT NULL,
    CONSTRAINT PK_Rol PRIMARY KEY (Id_Rol)
)
GO

-- Tabla 11: Permiso
CREATE TABLE Permiso (
    Id_Permiso INT IDENTITY(1,1) NOT NULL,
    Nombre VARCHAR(100) NOT NULL,
    Descripcion VARCHAR(255) NULL,
    CONSTRAINT PK_Permiso PRIMARY KEY (Id_Permiso)
)
GO

-- Tabla 12: Servicio
CREATE TABLE Servicio (
    Id_Servicio INT IDENTITY(1,1) NOT NULL,
    Nombre VARCHAR(50) NOT NULL,
    Descripcion VARCHAR(150) NULL,
    Precio_Base DECIMAL(12,2) NOT NULL,
    Estado BOOL NOT NULL,
    CONSTRAINT PK_Servicio PRIMARY KEY (Id_Servicio)
)
GO

-- =========================================================================
-- 2. SEGURIDAD, AUTENTICACIÓN Y AUDITORÍA
-- =========================================================================

-- Tabla 13: Usuario
CREATE TABLE Usuario (
    Id_Usuario INT IDENTITY(1,1) NOT NULL,
    Nombre_Usuario VARCHAR(50) NOT NULL,
    Correo VARCHAR(150) NOT NULL,
    Contrasena VARCHAR(255) NOT NULL,
    Fecha_Registro DATETIME NOT NULL,
    Estado BOOL NOT NULL,
    CONSTRAINT PK_Usuario PRIMARY KEY (Id_Usuario)
)
GO

-- Tabla 14: Rol_Usuario (N:M)
CREATE TABLE Rol_Usuario (
    Id_Rol_Usuario INT IDENTITY(1,1) NOT NULL,
    Id_Rol INT NOT NULL,
    Id_Usuario INT NOT NULL,
    CONSTRAINT PK_Rol_Usuario PRIMARY KEY (Id_Rol_Usuario)
)
GO

-- Tabla 15: Rol_Permiso (N:M)
CREATE TABLE Rol_Permiso (
    Id_Rol_Permiso INT IDENTITY(1,1) NOT NULL,
    Id_Rol INT NOT NULL,
    Id_Permiso INT NOT NULL,
    CONSTRAINT PK_Rol_Permiso PRIMARY KEY (Id_Rol_Permiso)
)
GO

-- Tabla 16: Bitacora
CREATE TABLE Bitacora (
    Id_Bitacora INT IDENTITY(1,1) NOT NULL,
    Id_Usuario INT NOT NULL,
    Accion VARCHAR(100) NOT NULL,
    Tabla_Afectada VARCHAR(100) NOT NULL,
    Id_Registro_Afectado INT NOT NULL,
    Fecha_Hora DATETIME NOT NULL,
    Descripcion VARCHAR(200) NULL,
    CONSTRAINT PK_Bitacora PRIMARY KEY (Id_Bitacora)
)
GO

-- =========================================================================
-- 3. CLIENTES, PROVEEDORES Y SUS SUBTIPOS ESPECIALIZADOS
-- =========================================================================

-- Tabla 17: Cliente (Supertipo)
CREATE TABLE Cliente (
    Id_Cliente INT IDENTITY(1,1) NOT NULL,
    Id_Tipo_Cliente INT NOT NULL,
    Id_Usuario INT NOT NULL,
    Telefono VARCHAR(30) NOT NULL,
    Direccion VARCHAR(200) NOT NULL,
    Estado BOOL NOT NULL,
    CONSTRAINT PK_Cliente PRIMARY KEY (Id_Cliente)
)
GO

-- Tabla 18: Cliente_Particular (Subtipo Exclusivo)
CREATE TABLE Cliente_Particular (
    Id_Cliente INT NOT NULL,
    Identificacion VARCHAR(20) NOT NULL,
    Nombre VARCHAR(50) NOT NULL,
    Apellido1 VARCHAR(50) NOT NULL,
    Apellido2 VARCHAR(50) NOT NULL,
    CONSTRAINT PK_Cliente_Particular PRIMARY KEY (Id_Cliente)
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
    CONSTRAINT PK_Cliente_Institucional PRIMARY KEY (Id_Cliente)
)
GO

-- Tabla 20: Cliente_Condicion_Pago (N:M)
CREATE TABLE Cliente_Condicion_Pago (
    Id_Cliente_Condicion_Pago INT IDENTITY(1,1) NOT NULL,
    Id_Cliente INT NOT NULL,
    Id_Condicion_Pago INT NOT NULL,
    Fecha_Autorizacion DATE NOT NULL,
    Estado BOOL NOT NULL,
    CONSTRAINT PK_Cliente_Condicion_Pago PRIMARY KEY (Id_Cliente_Condicion_Pago)
)
GO

-- Tabla 21: Proveedor (Supertipo)
CREATE TABLE Proveedor (
    Id_Proveedor INT IDENTITY(1,1) NOT NULL,
    Id_Tipo_Proveedor INT NOT NULL,
    Correo VARCHAR(150) NOT NULL,
    Telefono VARCHAR(100) NOT NULL,
    Direccion VARCHAR(200) NOT NULL,
    Estado BOOL NOT NULL,
    CONSTRAINT PK_Proveedor PRIMARY KEY (Id_Proveedor)
)
GO

-- Tabla 22: Proveedor_Particular (Subtipo Exclusivo)
CREATE TABLE Proveedor_Particular (
    Id_Proveedor INT NOT NULL,
    Identificacion VARCHAR(20) NOT NULL,
    Nombre VARCHAR(50) NOT NULL,
    Apellido1 VARCHAR(50) NOT NULL,
    Apellido2 VARCHAR(50) NOT NULL,
    CONSTRAINT PK_Proveedor_Particular PRIMARY KEY (Id_Proveedor)
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
    CONSTRAINT PK_Proveedor_Institucional PRIMARY KEY (Id_Proveedor)
)
GO

-- =========================================================================
-- 4. PRODUCTOS, PROVEEDORES E INVENTARIO
-- =========================================================================

-- Tabla 24: Producto
CREATE TABLE Producto (
    Id_Producto INT IDENTITY(1,1) NOT NULL,
    Id_Categoria INT NOT NULL,
    Nombre VARCHAR(50) NOT NULL,
    Descripcion VARCHAR(150) NULL,
    Precio_Venta DECIMAL(12,2) NOT NULL,
    Stock_Actual INT NOT NULL,
    Punto_Reorden INT NOT NULL,
    Estado BOOL NOT NULL,
    CONSTRAINT PK_Producto PRIMARY KEY (Id_Producto)
)
GO

-- Tabla 25: Producto_Proveedor (N:M)
CREATE TABLE Producto_Proveedor (
    Id_Producto_Proveedor INT IDENTITY(1,1) NOT NULL,
    Id_Producto INT NOT NULL,
    Id_Proveedor INT NOT NULL,
    Precio_Compra DECIMAL(12,2) NOT NULL,
    EsPrincipal BOOL NOT NULL,
    Estado BOOL NOT NULL,
    CONSTRAINT PK_Producto_Proveedor PRIMARY KEY (Id_Producto_Proveedor)
)
GO

-- Tabla 26: Movimiento_Inventario
CREATE TABLE Movimiento_Inventario (
    Id_Movimiento_Inventario INT IDENTITY(1,1) NOT NULL,
    Id_Producto INT NOT NULL,
    Id_Tipo_Movimiento INT NOT NULL,
    Id_Usuario INT NOT NULL,
    Cantidad INT NOT NULL,
    Fecha DATETIME NOT NULL,
    Motivo VARCHAR(150) NOT NULL,
    CONSTRAINT PK_Movimiento_Inventario PRIMARY KEY (Id_Movimiento_Inventario)
)
GO

-- =========================================================================
-- 5. COMPRAS A PROVEEDORES
-- =========================================================================

-- Tabla 27: Compra (Cabecera)
CREATE TABLE Compra (
    Id_Compra INT IDENTITY(1,1) NOT NULL,
    Id_Proveedor INT NOT NULL,
    Id_Usuario INT NOT NULL,
    Id_Estado_Compra INT NOT NULL,
    Fecha_Compra DATETIME NOT NULL,
    CONSTRAINT PK_Compra PRIMARY KEY (Id_Compra)
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
    CONSTRAINT PK_Compra_Producto PRIMARY KEY (Id_Compra_Producto)
)
GO

-- =========================================================================
-- 6. VENTAS Y SERVICIOS
-- =========================================================================

-- Tabla 29: Venta (Cabecera)
CREATE TABLE Venta (
    Id_Venta INT IDENTITY(1,1) NOT NULL,
    Id_Cliente INT NOT NULL,
    Id_Usuario INT NOT NULL,
    Id_Estado_Venta INT NOT NULL,
    Id_Condicion_Pago INT NOT NULL,
    Fecha DATETIME NOT NULL,
    Subtotal DECIMAL(12,2) NOT NULL,
    Impuesto DECIMAL(12,2) NOT NULL,
    Monto_Total DECIMAL(12,2) NOT NULL,
    CONSTRAINT PK_Venta PRIMARY KEY (Id_Venta)
)
GO

-- Tabla 30: Venta_Producto (Líneas de Productos)
CREATE TABLE Venta_Producto (
    Id_Venta_Producto INT IDENTITY(1,1) NOT NULL,
    Id_Producto INT NOT NULL,
    Id_Venta INT NOT NULL,
    Cantidad INT NOT NULL,
    Precio_Unitario DECIMAL(12,2) NOT NULL,
    Subtotal DECIMAL(12,2) NOT NULL,
    CONSTRAINT PK_Venta_Producto PRIMARY KEY (Id_Venta_Producto)
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
    CONSTRAINT PK_Venta_Servicio PRIMARY KEY (Id_Venta_Servicio)
)
GO

-- =========================================================================
-- 7. FACTURACIÓN Y PAGOS
-- =========================================================================

-- Tabla 32: Factura
CREATE TABLE Factura (
    Id_Factura INT IDENTITY(1,1) NOT NULL,
    Id_Venta INT NOT NULL,
    Id_Estado_Factura INT NOT NULL,
    Fecha_Emision DATETIME NOT NULL,
    Fecha_Vencimiento DATETIME NOT NULL,
    Monto_Total DECIMAL(12,2) NOT NULL,
    Saldo_Pendiente DECIMAL(12,2) NOT NULL,
    CONSTRAINT PK_Factura PRIMARY KEY (Id_Factura)
)
GO

-- Tabla 33: Pago (Abonos Individuales)
CREATE TABLE Pago (
    Id_Pago INT IDENTITY(1,1) NOT NULL,
    Id_Factura INT NOT NULL,
    Id_Metodo_Pago INT NOT NULL,
    Fecha_Pago DATETIME NOT NULL,
    Monto_Pagado DECIMAL(12,2) NOT NULL,
    Numero_Referencia VARCHAR(100) NULL,
    Estado BOOL NOT NULL,
    CONSTRAINT PK_Pago PRIMARY KEY (Id_Pago)
)
GO
