/* =========================================================================
   SCRIPT 04: CREACIÓN DE RESTRICCIONES DEL MODELO RELACIONAL
   CASO DE ESTUDIO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR (LIBERIA)
   REQUERIMIENTOS ASOCIADOS: RA3.1–RA3.4, RA3.6
   ESTILO: TORRENTES (SSMS 22)
   ========================================================================= */

USE MUNDO_ESCOLAR
GO

-- =========================================================================
-- 1. RESTRICCIONES DE UNICIDAD (UNIQUE)
-- =========================================================================
ALTER TABLE Tipo_Cliente ADD CONSTRAINT UQ_Tipo_Cliente_Nombre UNIQUE (Nombre);
ALTER TABLE Condicion_Pago ADD CONSTRAINT UQ_Condicion_Pago_Nombre UNIQUE (Nombre);
ALTER TABLE Tipo_Proveedor ADD CONSTRAINT UQ_Tipo_Proveedor_Nombre UNIQUE (Nombre);
ALTER TABLE Categoria ADD CONSTRAINT UQ_Categoria_Nombre UNIQUE (Nombre);
ALTER TABLE Tipo_Movimiento ADD CONSTRAINT UQ_Tipo_Movimiento_Nombre UNIQUE (Nombre);
ALTER TABLE Estado_Compra ADD CONSTRAINT UQ_Estado_Compra_Nombre UNIQUE (Nombre_Estado);
ALTER TABLE Estado_Venta ADD CONSTRAINT UQ_Estado_Venta_Nombre UNIQUE (Nombre_Estado);
ALTER TABLE Estado_Factura ADD CONSTRAINT UQ_Estado_Factura_Nombre UNIQUE (Nombre_Estado);
ALTER TABLE Metodo_Pago ADD CONSTRAINT UQ_Metodo_Pago_Nombre UNIQUE (Nombre);
ALTER TABLE Rol ADD CONSTRAINT UQ_Rol_Nombre UNIQUE (Nombre);
ALTER TABLE Permiso ADD CONSTRAINT UQ_Permiso_Nombre UNIQUE (Nombre);
ALTER TABLE Servicio ADD CONSTRAINT UQ_Servicio_Nombre UNIQUE (Nombre);
ALTER TABLE Producto ADD CONSTRAINT UQ_Producto_Nombre UNIQUE (Nombre);
ALTER TABLE Usuario ADD CONSTRAINT UQ_Usuario_NombreUsuario UNIQUE (Nombre_Usuario);
ALTER TABLE Usuario ADD CONSTRAINT UQ_Usuario_Correo UNIQUE (Correo);
ALTER TABLE Cliente ADD CONSTRAINT UQ_Cliente_Usuario UNIQUE (Id_Usuario);
ALTER TABLE Cliente_Particular ADD CONSTRAINT UQ_ClienteParticular_Identificacion UNIQUE (Identificacion);
ALTER TABLE Cliente_Institucional ADD CONSTRAINT UQ_ClienteInstitucional_CedulaJuridica UNIQUE (Cedula_Juridica);
ALTER TABLE Cliente_Condicion_Pago ADD CONSTRAINT UQ_Cliente_CondicionPago UNIQUE (Id_Cliente, Id_Condicion_Pago);
ALTER TABLE Proveedor_Particular ADD CONSTRAINT UQ_ProveedorParticular_Identificacion UNIQUE (Identificacion);
ALTER TABLE Proveedor_Institucional ADD CONSTRAINT UQ_ProveedorInstitucional_CedulaJuridica UNIQUE (Cedula_Juridica);
ALTER TABLE Producto_Proveedor ADD CONSTRAINT UQ_Producto_Proveedor UNIQUE (Id_Producto, Id_Proveedor);
ALTER TABLE Rol_Usuario ADD CONSTRAINT UQ_Rol_Usuario UNIQUE (Id_Rol, Id_Usuario);
ALTER TABLE Rol_Permiso ADD CONSTRAINT UQ_Rol_Permiso UNIQUE (Id_Rol, Id_Permiso);
ALTER TABLE Compra_Producto ADD CONSTRAINT UQ_Compra_Producto UNIQUE (Id_Compra, Id_Producto);
ALTER TABLE Venta_Producto ADD CONSTRAINT UQ_Venta_Producto UNIQUE (Id_Venta, Id_Producto);
ALTER TABLE Venta_Servicio ADD CONSTRAINT UQ_Venta_Servicio UNIQUE (Id_Venta, Id_Servicio);
ALTER TABLE Factura ADD CONSTRAINT UQ_Factura_Venta UNIQUE (Id_Venta);
GO

-- =========================================================================
-- 2. RESTRICCIONES DE INTEGRIDAD REFERENCIAL (FOREIGN KEYS)
-- =========================================================================

-- Seguridad y Auditoría
ALTER TABLE Rol_Usuario ADD CONSTRAINT FK_RolUsuario_Rol FOREIGN KEY (Id_Rol) REFERENCES Rol(Id_Rol);
ALTER TABLE Rol_Usuario ADD CONSTRAINT FK_RolUsuario_Usuario FOREIGN KEY (Id_Usuario) REFERENCES Usuario(Id_Usuario);
ALTER TABLE Rol_Permiso ADD CONSTRAINT FK_RolPermiso_Rol FOREIGN KEY (Id_Rol) REFERENCES Rol(Id_Rol);
ALTER TABLE Rol_Permiso ADD CONSTRAINT FK_RolPermiso_Permiso FOREIGN KEY (Id_Permiso) REFERENCES Permiso(Id_Permiso);
ALTER TABLE Bitacora ADD CONSTRAINT FK_Bitacora_Usuario FOREIGN KEY (Id_Usuario) REFERENCES Usuario(Id_Usuario);

-- Clientes y Subtipos
ALTER TABLE Cliente ADD CONSTRAINT FK_Cliente_TipoCliente FOREIGN KEY (Id_Tipo_Cliente) REFERENCES Tipo_Cliente(Id_Tipo_Cliente);
ALTER TABLE Cliente ADD CONSTRAINT FK_Cliente_Usuario FOREIGN KEY (Id_Usuario) REFERENCES Usuario(Id_Usuario);
ALTER TABLE Cliente_Particular ADD CONSTRAINT FK_ClienteParticular_Cliente FOREIGN KEY (Id_Cliente) REFERENCES Cliente(Id_Cliente);
ALTER TABLE Cliente_Institucional ADD CONSTRAINT FK_ClienteInstitucional_Cliente FOREIGN KEY (Id_Cliente) REFERENCES Cliente(Id_Cliente);
ALTER TABLE Cliente_Condicion_Pago ADD CONSTRAINT FK_ClienteCondicion_Cliente FOREIGN KEY (Id_Cliente) REFERENCES Cliente(Id_Cliente);
ALTER TABLE Cliente_Condicion_Pago ADD CONSTRAINT FK_ClienteCondicion_CondicionPago FOREIGN KEY (Id_Condicion_Pago) REFERENCES Condicion_Pago(Id_Condicion_Pago);

-- Proveedores y Subtipos
ALTER TABLE Proveedor ADD CONSTRAINT FK_Proveedor_TipoProveedor FOREIGN KEY (Id_Tipo_Proveedor) REFERENCES Tipo_Proveedor(Id_Tipo_Proveedor);
ALTER TABLE Proveedor_Particular ADD CONSTRAINT FK_ProveedorParticular_Proveedor FOREIGN KEY (Id_Proveedor) REFERENCES Proveedor(Id_Proveedor);
ALTER TABLE Proveedor_Institucional ADD CONSTRAINT FK_ProveedorInstitucional_Proveedor FOREIGN KEY (Id_Proveedor) REFERENCES Proveedor(Id_Proveedor);

-- Productos, Proveedores e Inventario
ALTER TABLE Producto ADD CONSTRAINT FK_Producto_Categoria FOREIGN KEY (Id_Categoria) REFERENCES Categoria(Id_Categoria);
ALTER TABLE Producto_Proveedor ADD CONSTRAINT FK_ProductoProveedor_Producto FOREIGN KEY (Id_Producto) REFERENCES Producto(Id_Producto);
ALTER TABLE Producto_Proveedor ADD CONSTRAINT FK_ProductoProveedor_Proveedor FOREIGN KEY (Id_Proveedor) REFERENCES Proveedor(Id_Proveedor);
ALTER TABLE Movimiento_Inventario ADD CONSTRAINT FK_Movimiento_Producto FOREIGN KEY (Id_Producto) REFERENCES Producto(Id_Producto);
ALTER TABLE Movimiento_Inventario ADD CONSTRAINT FK_Movimiento_TipoMovimiento FOREIGN KEY (Id_Tipo_Movimiento) REFERENCES Tipo_Movimiento(Id_Tipo_Movimiento);
ALTER TABLE Movimiento_Inventario ADD CONSTRAINT FK_Movimiento_Usuario FOREIGN KEY (Id_Usuario) REFERENCES Usuario(Id_Usuario);

-- Compras
ALTER TABLE Compra ADD CONSTRAINT FK_Compra_Proveedor FOREIGN KEY (Id_Proveedor) REFERENCES Proveedor(Id_Proveedor);
ALTER TABLE Compra ADD CONSTRAINT FK_Compra_Usuario FOREIGN KEY (Id_Usuario) REFERENCES Usuario(Id_Usuario);
ALTER TABLE Compra ADD CONSTRAINT FK_Compra_EstadoCompra FOREIGN KEY (Id_Estado_Compra) REFERENCES Estado_Compra(Id_Estado_Compra);
ALTER TABLE Compra_Producto ADD CONSTRAINT FK_CompraProducto_Compra FOREIGN KEY (Id_Compra) REFERENCES Compra(Id_Compra);
ALTER TABLE Compra_Producto ADD CONSTRAINT FK_CompraProducto_Producto FOREIGN KEY (Id_Producto) REFERENCES Producto(Id_Producto);

-- Ventas y Servicios
ALTER TABLE Venta ADD CONSTRAINT FK_Venta_Cliente FOREIGN KEY (Id_Cliente) REFERENCES Cliente(Id_Cliente);
ALTER TABLE Venta ADD CONSTRAINT FK_Venta_Usuario FOREIGN KEY (Id_Usuario) REFERENCES Usuario(Id_Usuario);
ALTER TABLE Venta ADD CONSTRAINT FK_Venta_EstadoVenta FOREIGN KEY (Id_Estado_Venta) REFERENCES Estado_Venta(Id_Estado_Venta);
ALTER TABLE Venta ADD CONSTRAINT FK_Venta_CondicionPago FOREIGN KEY (Id_Condicion_Pago) REFERENCES Condicion_Pago(Id_Condicion_Pago);
ALTER TABLE Venta_Producto ADD CONSTRAINT FK_VentaProducto_Producto FOREIGN KEY (Id_Producto) REFERENCES Producto(Id_Producto);
ALTER TABLE Venta_Producto ADD CONSTRAINT FK_VentaProducto_Venta FOREIGN KEY (Id_Venta) REFERENCES Venta(Id_Venta);
ALTER TABLE Venta_Servicio ADD CONSTRAINT FK_VentaServicio_Venta FOREIGN KEY (Id_Venta) REFERENCES Venta(Id_Venta);
ALTER TABLE Venta_Servicio ADD CONSTRAINT FK_VentaServicio_Servicio FOREIGN KEY (Id_Servicio) REFERENCES Servicio(Id_Servicio);

-- Facturación y Pagos
ALTER TABLE Factura ADD CONSTRAINT FK_Factura_Venta FOREIGN KEY (Id_Venta) REFERENCES Venta(Id_Venta);
ALTER TABLE Factura ADD CONSTRAINT FK_Factura_EstadoFactura FOREIGN KEY (Id_Estado_Factura) REFERENCES Estado_Factura(Id_Estado_Factura);
ALTER TABLE Pago ADD CONSTRAINT FK_Pago_Factura FOREIGN KEY (Id_Factura) REFERENCES Factura(Id_Factura);
ALTER TABLE Pago ADD CONSTRAINT FK_Pago_MetodoPago FOREIGN KEY (Id_Metodo_Pago) REFERENCES Metodo_Pago(Id_Metodo_Pago);
GO

-- =========================================================================
-- 3. RESTRICCIONES DE VALIDACIÓN (CHECK)
-- =========================================================================
ALTER TABLE Condicion_Pago ADD CONSTRAINT CK_CondicionPago_DiasCredito CHECK (Dias_Credito >= 0);
ALTER TABLE Tipo_Movimiento ADD CONSTRAINT CK_TipoMovimiento_Naturaleza CHECK (Naturaleza IN ('Entrada', 'Salida', 'Ajuste', 'Devolución'));
ALTER TABLE Servicio ADD CONSTRAINT CK_Servicio_PrecioBase CHECK (Precio_Base >= 0);
ALTER TABLE Producto ADD CONSTRAINT CK_Producto_PrecioVenta CHECK (Precio_Venta >= 0);
ALTER TABLE Producto ADD CONSTRAINT CK_Producto_StockActual CHECK (Stock_Actual >= 0);
ALTER TABLE Producto ADD CONSTRAINT CK_Producto_PuntoReorden CHECK (Punto_Reorden >= 0);
ALTER TABLE Producto_Proveedor ADD CONSTRAINT CK_ProductoProveedor_PrecioCompra CHECK (Precio_Compra >= 0);
ALTER TABLE Movimiento_Inventario ADD CONSTRAINT CK_Movimiento_Cantidad CHECK (Cantidad > 0);
ALTER TABLE Compra_Producto ADD CONSTRAINT CK_CompraProducto_Cantidad CHECK (Cantidad > 0);
ALTER TABLE Compra_Producto ADD CONSTRAINT CK_CompraProducto_CostoUnitario CHECK (Costo_Unitario >= 0);
ALTER TABLE Compra_Producto ADD CONSTRAINT CK_CompraProducto_Subtotal CHECK (Subtotal >= 0);
ALTER TABLE Venta ADD CONSTRAINT CK_Venta_Subtotal CHECK (Subtotal >= 0);
ALTER TABLE Venta ADD CONSTRAINT CK_Venta_Impuesto CHECK (Impuesto >= 0);
ALTER TABLE Venta ADD CONSTRAINT CK_Venta_MontoTotal CHECK (Monto_Total >= 0);
ALTER TABLE Venta ADD CONSTRAINT CK_Venta_TotalCalculado CHECK (Monto_Total = Subtotal + Impuesto);
ALTER TABLE Venta_Producto ADD CONSTRAINT CK_VentaProducto_Cantidad CHECK (Cantidad > 0);
ALTER TABLE Venta_Producto ADD CONSTRAINT CK_VentaProducto_PrecioUnitario CHECK (Precio_Unitario >= 0);
ALTER TABLE Venta_Producto ADD CONSTRAINT CK_VentaProducto_Subtotal CHECK (Subtotal >= 0);
ALTER TABLE Venta_Servicio ADD CONSTRAINT CK_VentaServicio_Cantidad CHECK (Cantidad > 0);
ALTER TABLE Venta_Servicio ADD CONSTRAINT CK_VentaServicio_PrecioUnitario CHECK (Precio_Unitario >= 0);
ALTER TABLE Venta_Servicio ADD CONSTRAINT CK_VentaServicio_Subtotal CHECK (Subtotal >= 0);
ALTER TABLE Factura ADD CONSTRAINT CK_Factura_MontoTotal CHECK (Monto_Total >= 0);
ALTER TABLE Factura ADD CONSTRAINT CK_Factura_SaldoPendiente CHECK (Saldo_Pendiente >= 0);
ALTER TABLE Factura ADD CONSTRAINT CK_Factura_SaldoNoMayor CHECK (Saldo_Pendiente <= Monto_Total);
ALTER TABLE Pago ADD CONSTRAINT CK_Pago_MontoPagado CHECK (Monto_Pagado > 0);
GO

-- =========================================================================
-- 4. RESTRICCIONES DE VALORES POR DEFECTO (DEFAULT)
-- =========================================================================
ALTER TABLE Usuario ADD CONSTRAINT DF_Usuario_FechaRegistro DEFAULT GETDATE() FOR Fecha_Registro;
ALTER TABLE Usuario ADD CONSTRAINT DF_Usuario_Estado DEFAULT 1 FOR Estado;
ALTER TABLE Cliente ADD CONSTRAINT DF_Cliente_Estado DEFAULT 1 FOR Estado;
ALTER TABLE Cliente_Condicion_Pago ADD CONSTRAINT DF_ClienteCondicion_Fecha DEFAULT CAST(GETDATE() AS DATE) FOR Fecha_Autorizacion;
ALTER TABLE Cliente_Condicion_Pago ADD CONSTRAINT DF_ClienteCondicion_Estado DEFAULT 1 FOR Estado;
ALTER TABLE Proveedor ADD CONSTRAINT DF_Proveedor_Estado DEFAULT 1 FOR Estado;
ALTER TABLE Producto ADD CONSTRAINT DF_Producto_StockActual DEFAULT 0 FOR Stock_Actual;
ALTER TABLE Producto ADD CONSTRAINT DF_Producto_PuntoReorden DEFAULT 0 FOR Punto_Reorden;
ALTER TABLE Producto ADD CONSTRAINT DF_Producto_Estado DEFAULT 1 FOR Estado;
ALTER TABLE Producto_Proveedor ADD CONSTRAINT DF_ProductoProveedor_EsPrincipal DEFAULT 0 FOR EsPrincipal;
ALTER TABLE Producto_Proveedor ADD CONSTRAINT DF_ProductoProveedor_Estado DEFAULT 1 FOR Estado;
ALTER TABLE Movimiento_Inventario ADD CONSTRAINT DF_Movimiento_Fecha DEFAULT GETDATE() FOR Fecha;
ALTER TABLE Compra ADD CONSTRAINT DF_Compra_FechaCompra DEFAULT GETDATE() FOR Fecha_Compra;
ALTER TABLE Venta ADD CONSTRAINT DF_Venta_Fecha DEFAULT GETDATE() FOR Fecha;
ALTER TABLE Factura ADD CONSTRAINT DF_Factura_FechaEmision DEFAULT GETDATE() FOR Fecha_Emision;
ALTER TABLE Pago ADD CONSTRAINT DF_Pago_FechaPago DEFAULT GETDATE() FOR Fecha_Pago;
ALTER TABLE Pago ADD CONSTRAINT DF_Pago_Estado DEFAULT 1 FOR Estado;
ALTER TABLE Bitacora ADD CONSTRAINT DF_Bitacora_FechaHora DEFAULT GETDATE() FOR Fecha_Hora;
GO
