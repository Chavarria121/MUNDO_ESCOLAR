/* =========================================================================
   CASO DE ESTUDIO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR (LIBERIA)
   CREACIÓN DE BASE DE DATOS
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
    SIZE = 3072MB,          -- 3GB
    MAXSIZE = 20480MB,      -- 20GB
    FILEGROWTH = 1024MB     -- Crecimiento de 1GB
)
LOG ON
(
    NAME = 'MUNDO_ESCOLAR_log',
    FILENAME = 'C:\SQLLog\MUNDO_ESCOLAR_log.ldf',
    SIZE = 1024MB,          -- 1GB 
    MAXSIZE = 5120MB,       -- 5GB 
    FILEGROWTH = 512MB      -- Crecimiento de 512MB
)
GO

EXEC sp_helpdb MUNDO_ESCOLAR
GO

-- =========================================================================
-- 2. ASIGNACIÓN DE AUTORIZACIÓN Y TIPO BOOL
-- =========================================================================
USE MUNDO_ESCOLAR
GO

-- Asignación de dueño sa para evitar el Error 15404 en los diagramas de SSMS
ALTER AUTHORIZATION ON DATABASE::MUNDO_ESCOLAR TO sa;
GO

-- Creación del tipo alias BOOL para compatibilidad exacta con el MER
CREATE TYPE BOOL FROM BIT
GO

-- =========================================================================
-- 3. CREACIÓN DE TABLAS (ESTRUCTURA EXACTA NORMALIZADA)
-- =========================================================================

-- Tabla: Tipo_Cliente
CREATE TABLE Tipo_Cliente (
    Id_Tipo_Cliente INT IDENTITY(1,1) NOT NULL,
    Nombre VARCHAR(50) NOT NULL,
    Descripcion VARCHAR(150) NULL,
    Estado BOOL NOT NULL,
    CONSTRAINT PK_Tipo_Cliente 
    PRIMARY KEY (Id_Tipo_Cliente)
)



GO

-- Tabla: Condicion_Pago
CREATE TABLE Condicion_Pago (
    Id_Condicion_Pago INT IDENTITY(1,1) NOT NULL,
    Nombre VARCHAR(50) NOT NULL,
    Dias_Credito INT NOT NULL,
    Descripcion VARCHAR(150) NULL,
    Estado BOOL NOT NULL,
    CONSTRAINT PK_Condicion_Pago 
    PRIMARY KEY (Id_Condicion_Pago)
)

GO

-- Tabla: Rol
CREATE TABLE Rol (
    Id_Rol INT IDENTITY(1,1) NOT NULL,
    Nombre VARCHAR(100) NOT NULL,
    Descripcion VARCHAR(150) NULL,
    Estado BOOL NOT NULL,
    CONSTRAINT PK_Rol 
    PRIMARY KEY (Id_Rol)
)

GO

-- Tabla: Permiso
CREATE TABLE Permiso (
    Id_Permiso INT IDENTITY(1,1) NOT NULL,
    Nombre VARCHAR(100) NOT NULL,
    Descripcion VARCHAR(255) NULL,
    CONSTRAINT PK_Permiso 
    PRIMARY KEY (Id_Permiso)
)
 
GO

-- Tabla: Rol_Permiso
CREATE TABLE Rol_Permiso (
    Id_Rol_Permiso INT IDENTITY(1,1) NOT NULL,
    Id_Rol INT NOT NULL,
    Id_Permiso INT NOT NULL,
    CONSTRAINT PK_Rol_Permiso 
    PRIMARY KEY (Id_Rol_Permiso)
)

GO

-- Tabla: Usuario
CREATE TABLE Usuario (
    Id_Usuario INT IDENTITY(1,1) NOT NULL,
    Nombre_Usuario VARCHAR(50) NOT NULL,
    Correo VARCHAR(100) NOT NULL,
    Contrasena VARCHAR(255) NOT NULL,
    Fecha_Registro DATETIME NOT NULL,
    Estado BOOL NOT NULL,
    CONSTRAINT PK_Usuario 
    PRIMARY KEY (Id_Usuario)
)

GO

-- Tabla: Rol_Usuario
CREATE TABLE Rol_Usuario (
    Id_Rol_Usuario INT IDENTITY(1,1) NOT NULL,
    Id_Rol INT NOT NULL,
    Id_Usuario INT NOT NULL,
    CONSTRAINT PK_Rol_Usuario 
    PRIMARY KEY (Id_Rol_Usuario)
)

GO

-- Tabla: Bitacora
CREATE TABLE Bitacora (
    Id_Bitacora INT IDENTITY(1,1) NOT NULL,
    Id_Usuario INT NOT NULL,
    Accion VARCHAR(100) NOT NULL,
    Tabla_Afectada VARCHAR(100) NOT NULL,
    Id_Registro_Afectado INT NOT NULL,
    Fecha_Hora DATETIME NOT NULL,
    Descripcion VARCHAR(255) NULL,
    CONSTRAINT PK_Bitacora 
    PRIMARY KEY (Id_Bitacora)
)

GO

-- Tabla: Cliente
CREATE TABLE Cliente (
    Id_Cliente INT IDENTITY(1,1) NOT NULL,
    Id_Tipo_Cliente INT NOT NULL,
    Id_Condicion_Pago INT NOT NULL,
    Id_Usuario INT NOT NULL,
    Identificacion VARCHAR(100) NOT NULL,
    Nombre VARCHAR(50) NOT NULL,
    Apellido1 VARCHAR(100) NOT NULL,
    Apellido2 VARCHAR(100) NOT NULL,
    Nombre_Institucional VARCHAR(150) NULL,
    Correo VARCHAR(150) NOT NULL,
    Telefono VARCHAR(50) NOT NULL,
    Direccion VARCHAR(250) NOT NULL,
    Estado BOOL NOT NULL,
    CONSTRAINT PK_Cliente 
    PRIMARY KEY (Id_Cliente)
)

GO

-- Tabla: Tipo_Movimiento
CREATE TABLE Tipo_Movimiento (
    Id_Tipo_Movimiento INT IDENTITY(1,1) NOT NULL,
    Nombre VARCHAR(50) NOT NULL,
    Naturaleza VARCHAR(20) NOT NULL,
    Estado BOOL NOT NULL,
    Descripcion VARCHAR(255) NULL,
    CONSTRAINT PK_Tipo_Movimiento 
    PRIMARY KEY (Id_Tipo_Movimiento)
)

GO

-- Tabla: Categoria
CREATE TABLE Categoria (
    Id_Categoria INT IDENTITY(1,1) NOT NULL,
    Nombre VARCHAR(50) NOT NULL,
    Descripcion VARCHAR(150) NULL,
    Estado BOOL NOT NULL,
    CONSTRAINT PK_Categoria 
    PRIMARY KEY (Id_Categoria)
)

GO

-- Tabla: Producto
CREATE TABLE Producto (
    Id_Producto INT IDENTITY(1,1) NOT NULL,
    Id_Categoria INT NOT NULL,
    Nombre VARCHAR(100) NOT NULL,
    Descripcion VARCHAR(200) NULL,
    Precio_Venta DECIMAL(12, 2) NOT NULL,
    Stock_Actual VARCHAR(50) NOT NULL,
    Punto_Reorden INT NOT NULL,
    Estado BOOL NOT NULL,
    CONSTRAINT PK_Producto 
    PRIMARY KEY (Id_Producto)
)

GO

-- Tabla: Proveedor
CREATE TABLE Proveedor (
    Id_Proveedor INT IDENTITY(1,1) NOT NULL,
    Cedula_Juridica VARCHAR(50) NOT NULL,
    Nombre_Proveedor VARCHAR(50) NOT NULL,
    Nombre_Contacto VARCHAR(50) NOT NULL,
    Apellido1_Contacto VARCHAR(50) NOT NULL,
    Apellido2_Contacto VARCHAR(50) NOT NULL,
    Correo VARCHAR(150) NOT NULL,
    Telefono VARCHAR(50) NOT NULL,
    Direccion VARCHAR(200) NOT NULL,
    Fecha_Registro DATETIME NOT NULL,
    Estado BOOL NOT NULL,
    CONSTRAINT PK_Proveedor 
    PRIMARY KEY (Id_Proveedor)
)
 
GO

-- Tabla: Compra (NUEVA TABLA NORMALIZADA - ENCABEZADO)
CREATE TABLE Compra (
    Id_Compra INT IDENTITY(1,1) NOT NULL,
    Id_Proveedor INT NOT NULL,
    Id_Usuario INT NOT NULL,
    Fecha_Compra DATETIME NOT NULL,
    Estado VARCHAR(50) NOT NULL,
    CONSTRAINT PK_Compra 
    PRIMARY KEY (Id_Compra)
)

GO

-- Tabla: Compra_Producto (NUEVA TABLA NORMALIZADA - DETALLE)
CREATE TABLE Compra_Producto (
    Id_Compra_Producto INT IDENTITY(1,1) NOT NULL,
    Id_Compra INT NOT NULL,
    Id_Producto INT NOT NULL,
    Cantidad INT NOT NULL,
    Costo_Unitario DECIMAL(12, 2) NOT NULL,
    Subtotal DECIMAL(12, 2) NOT NULL,
    CONSTRAINT PK_Compra_Producto 
    PRIMARY KEY (Id_Compra_Producto)
)

GO

-- Tabla: Movimiento_Inventario
CREATE TABLE Movimiento_Inventario (
    Id_Movimiento_Inventario INT IDENTITY(1,1) NOT NULL,
    Id_Producto INT NOT NULL,
    Id_Tipo_Movimiento INT NOT NULL,
    Id_Usuario INT NOT NULL,
    Cantidad INT NOT NULL,
    Fecha DATETIME NOT NULL,
    Motivo VARCHAR(150) NOT NULL,
    CONSTRAINT PK_Movimiento_Inventario 
    PRIMARY KEY (Id_Movimiento_Inventario)
)

GO

-- Tabla: Servicio
CREATE TABLE Servicio (
    Id_Servicio INT IDENTITY(1,1) NOT NULL,
    Nombre VARCHAR(50) NOT NULL,
    Descripcion VARCHAR(150) NULL,
    Precio_Base DECIMAL(12, 2) NOT NULL,
    Estado BOOL NOT NULL,
    CONSTRAINT PK_Servicio 
    PRIMARY KEY (Id_Servicio)
)

GO

-- Tabla: Venta
CREATE TABLE Venta (
    Id_Venta INT IDENTITY(1,1) NOT NULL,
    Id_Cliente INT NOT NULL,
    Id_Usuario INT NOT NULL,
    Fecha DATETIME NOT NULL,
    Subtotal DECIMAL(12, 2) NOT NULL,
    Impuesto DECIMAL(12, 2) NOT NULL,
    Monto_Total DECIMAL(12, 2) NOT NULL,
    Estado VARCHAR(50) NOT NULL,
    CONSTRAINT PK_Venta 
    PRIMARY KEY (Id_Venta)
)

GO

-- Tabla: Venta_Producto
CREATE TABLE Venta_Producto (
    Id_Venta_Producto INT IDENTITY(1,1) NOT NULL,
    Id_Producto INT NOT NULL,
    Id_Venta INT NOT NULL,
    Cantidad VARCHAR(50) NOT NULL,
    Subtotal VARCHAR(50) NOT NULL,
    Estado BOOL NOT NULL,
    CONSTRAINT PK_Venta_Producto 
    PRIMARY KEY (Id_Venta_Producto)
)

GO

-- Tabla: Venta_Servicio
CREATE TABLE Venta_Servicio (
    Id_Venta_Servicio INT IDENTITY(1,1) NOT NULL,
    Id_Venta INT NOT NULL,
    Id_Servicio INT NOT NULL,
    Cantidad INT NOT NULL,
    Precio_Unitario DECIMAL(12, 2) NOT NULL,
    Subtotal DECIMAL(12, 2) NOT NULL,
    CONSTRAINT PK_Venta_Servicio 
    PRIMARY KEY (Id_Venta_Servicio)
)

GO

-- Tabla: Estado_Factura
CREATE TABLE Estado_Factura (
    Id_Estado_Factura INT IDENTITY(1,1) NOT NULL,
    Nombre_Estado VARCHAR(50) NOT NULL,
    CONSTRAINT PK_Estado_Factura 
    PRIMARY KEY (Id_Estado_Factura)
)

GO

-- Tabla: Factura
CREATE TABLE Factura (
    Id_Factura INT IDENTITY(1,1) NOT NULL,
    Id_Venta INT NOT NULL,
    Id_Usuario INT NOT NULL,
    Id_Estado_Factura INT NOT NULL,
    Fecha_Emision DATETIME NOT NULL,
    Fecha_Vencimiento DATETIME NOT NULL,
    Monto_Total DECIMAL(12, 2) NOT NULL,
    Saldo_Pendiente DECIMAL(12, 2) NOT NULL,
    CONSTRAINT PK_Factura 
    PRIMARY KEY (Id_Factura)
)

GO

-- Tabla: Metodo_Pago
CREATE TABLE Metodo_Pago (
    Id_Metodo_Pago INT IDENTITY(1,1) NOT NULL,
    Nombre VARCHAR(50) NOT NULL,
    Descripcion VARCHAR(150) NULL,
    Estado BOOL NOT NULL,
    CONSTRAINT PK_Metodo_Pago 
    PRIMARY KEY (Id_Metodo_Pago)
)

GO

-- Tabla: Pago
CREATE TABLE Pago (
    Id_Pago INT IDENTITY(1,1) NOT NULL,
    Id_Factura INT NOT NULL,
    Id_Metodo_Pago INT NOT NULL,
    Fecha_Pago DATETIME NOT NULL,
    Monto_Pagado DECIMAL(12, 2) NOT NULL,
    Numero_Referencia INT NOT NULL,
    Estado BOOL NOT NULL,
    CONSTRAINT PK_Pago 
    PRIMARY KEY (Id_Pago)
)

GO


-- =========================================================================
-- 4. ASIGNACIÓN DE RESTRICCIONES FOREIGN KEY (FK - RELACIONES)
-- =========================================================================
USE MUNDO_ESCOLAR
GO

-- Seguridad
ALTER TABLE Rol_Permiso ADD CONSTRAINT FK_Rol_Permiso_Rol 
FOREIGN KEY (Id_Rol) REFERENCES Rol(Id_Rol)
GO

ALTER TABLE Rol_Permiso ADD CONSTRAINT FK_Rol_Permiso_Permiso 
FOREIGN KEY (Id_Permiso) REFERENCES Permiso(Id_Permiso)
GO

ALTER TABLE Rol_Usuario ADD CONSTRAINT FK_Rol_Usuario_Rol 
FOREIGN KEY (Id_Rol) REFERENCES Rol(Id_Rol)
GO

ALTER TABLE Rol_Usuario ADD CONSTRAINT FK_Rol_Usuario_Usuario 
FOREIGN KEY (Id_Usuario) REFERENCES Usuario(Id_Usuario)
GO

ALTER TABLE Bitacora ADD CONSTRAINT FK_Bitacora_Usuario 
FOREIGN KEY (Id_Usuario) REFERENCES Usuario(Id_Usuario)
GO

-- Clientes
ALTER TABLE Cliente ADD CONSTRAINT FK_Cliente_Tipo_Cliente 
FOREIGN KEY (Id_Tipo_Cliente) REFERENCES Tipo_Cliente(Id_Tipo_Cliente)
GO

ALTER TABLE Cliente ADD CONSTRAINT FK_Cliente_Condicion_Pago 
FOREIGN KEY (Id_Condicion_Pago) REFERENCES Condicion_Pago(Id_Condicion_Pago)
GO

ALTER TABLE Cliente ADD CONSTRAINT FK_Cliente_Usuario 
FOREIGN KEY (Id_Usuario) REFERENCES Usuario(Id_Usuario)
GO

-- Inventario y Categorías
ALTER TABLE Producto ADD CONSTRAINT FK_Producto_Categoria 
FOREIGN KEY (Id_Categoria) REFERENCES Categoria(Id_Categoria)
GO

-- Compras Normalizadas (Relaciones de Compra y Compra_Producto)
ALTER TABLE Compra ADD CONSTRAINT FK_Compra_Proveedor 
FOREIGN KEY (Id_Proveedor) REFERENCES Proveedor(Id_Proveedor)
GO

ALTER TABLE Compra ADD CONSTRAINT FK_Compra_Usuario 
FOREIGN KEY (Id_Usuario) REFERENCES Usuario(Id_Usuario)
GO

ALTER TABLE Compra_Producto ADD CONSTRAINT FK_Compra_Producto_Compra 
FOREIGN KEY (Id_Compra) REFERENCES Compra(Id_Compra)
GO

ALTER TABLE Compra_Producto ADD CONSTRAINT FK_Compra_Producto_Producto 
FOREIGN KEY (Id_Producto) REFERENCES Producto(Id_Producto)
GO

-- Movimientos de Inventario
ALTER TABLE Movimiento_Inventario ADD CONSTRAINT FK_Movimiento_Inventario_Producto 
FOREIGN KEY (Id_Producto) REFERENCES Producto(Id_Producto)
GO

ALTER TABLE Movimiento_Inventario ADD CONSTRAINT FK_Movimiento_Inventario_Tipo_Movimiento 
FOREIGN KEY (Id_Tipo_Movimiento) REFERENCES Tipo_Movimiento(Id_Tipo_Movimiento)
GO

ALTER TABLE Movimiento_Inventario ADD CONSTRAINT FK_Movimiento_Inventario_Usuario 
FOREIGN KEY (Id_Usuario) REFERENCES Usuario(Id_Usuario)
GO

-- Ventas y Detalle
ALTER TABLE Venta ADD CONSTRAINT FK_Venta_Cliente 
FOREIGN KEY (Id_Cliente) REFERENCES Cliente(Id_Cliente)
GO

ALTER TABLE Venta ADD CONSTRAINT FK_Venta_Usuario 
FOREIGN KEY (Id_Usuario) REFERENCES Usuario(Id_Usuario)
GO

ALTER TABLE Venta_Producto ADD CONSTRAINT FK_Venta_Producto_Producto 
FOREIGN KEY (Id_Producto) REFERENCES Producto(Id_Producto)
GO

ALTER TABLE Venta_Producto ADD CONSTRAINT FK_Venta_Producto_Venta 
FOREIGN KEY (Id_Venta) REFERENCES Venta(Id_Venta)
GO

ALTER TABLE Venta_Servicio ADD CONSTRAINT FK_Venta_Servicio_Venta 
FOREIGN KEY (Id_Venta) REFERENCES Venta(Id_Venta)
GO

ALTER TABLE Venta_Servicio ADD CONSTRAINT FK_Venta_Servicio_Servicio 
FOREIGN KEY (Id_Servicio) REFERENCES Servicio(Id_Servicio)
GO

-- Facturación y Pagos
ALTER TABLE Factura ADD CONSTRAINT FK_Factura_Venta 
FOREIGN KEY (Id_Venta) REFERENCES Venta(Id_Venta)
GO

ALTER TABLE Factura ADD CONSTRAINT FK_Factura_Usuario 
FOREIGN KEY (Id_Usuario) REFERENCES Usuario(Id_Usuario)
GO

ALTER TABLE Factura ADD CONSTRAINT FK_Factura_Estado_Factura 
FOREIGN KEY (Id_Estado_Factura) REFERENCES Estado_Factura(Id_Estado_Factura)
GO

ALTER TABLE Pago ADD CONSTRAINT FK_Pago_Factura 
FOREIGN KEY (Id_Factura) REFERENCES Factura(Id_Factura)
GO

ALTER TABLE Pago ADD CONSTRAINT FK_Pago_Metodo_Pago 
FOREIGN KEY (Id_Metodo_Pago) REFERENCES Metodo_Pago(Id_Metodo_Pago)
GO

-- =========================================================================
-- 5. RESTRICCIONES DE UNICIDAD (UNIQUE)
-- =========================================================================
USE MUNDO_ESCOLAR
GO

ALTER TABLE Rol ADD CONSTRAINT UQ_Rol_Nombre UNIQUE (Nombre)
GO

ALTER TABLE Permiso ADD CONSTRAINT UQ_Permiso_Nombre UNIQUE (Nombre)
GO

ALTER TABLE Usuario ADD CONSTRAINT UQ_Usuario_Correo UNIQUE (Correo)
GO

ALTER TABLE Cliente ADD CONSTRAINT UQ_Cliente_Identificacion UNIQUE (Identificacion)
GO

ALTER TABLE Proveedor ADD CONSTRAINT UQ_Proveedor_Cedula_Juridica UNIQUE (Cedula_Juridica)
GO

-- =========================================================================
-- 6. VERIFICACIÓN FINAL
-- =========================================================================
USE MUNDO_ESCOLAR
GO

SELECT 
    name AS 'Tabla_Creada' 
FROM sysobjects 
WHERE TYPE = 'U' 
ORDER BY name ASC
GO
