/* =========================================================================
   PROYECTO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR
   SCRIPT: 05_CrearCatalogos.sql
   REQUERIMIENTOS: RF1.3, RF1.4, RF1.7, RF2.2, RF2.8, RF4.5, RF4.7, RA1.2, RA1.3
   REFERENCIA DOCUMENTACIÓN: Sección 17.8.5 (Páginas 443-444)
   DESCRIPCIÓN: Inserción de catálogos base del sistema:
     1. Tipo_Cliente
     2. Condicion_Pago
     3. Tipo_Proveedor
     4. Categoria
     5. Tipo_Movimiento
     6. Estado_Compra
     7. Estado_Venta
     8. Estado_Factura
     9. Metodo_Pago
     10. Rol
     11. Permiso
     12. Rol_Permiso
   ========================================================================= */

USE MUNDO_ESCOLAR
GO

SET NOCOUNT ON;
PRINT 'Iniciando carga de catálogos base en MUNDO_ESCOLAR...';
GO

-- 1. Tipo_Cliente
IF NOT EXISTS (SELECT 1 FROM Tipo_Cliente WHERE Nombre = 'Particular')
    INSERT INTO Tipo_Cliente (Nombre, Descripcion, Estado) 
    VALUES ('Particular', 'Clientes individuales o personas físicas sin personería jurídica', 1);

IF NOT EXISTS (SELECT 1 FROM Tipo_Cliente WHERE Nombre = 'Institucional')
    INSERT INTO Tipo_Cliente (Nombre, Descripcion, Estado) 
    VALUES ('Institucional', 'Escuelas, colegios, universidades y entidades públicas o privadas', 1);
GO

-- 2. Condicion_Pago
IF NOT EXISTS (SELECT 1 FROM Condicion_Pago WHERE Nombre = 'Contado')
    INSERT INTO Condicion_Pago (Nombre, Dias_Credito, Descripcion, Estado)
    VALUES ('Contado', 0, 'Pago de contado en el momento de la venta', 1);

IF NOT EXISTS (SELECT 1 FROM Condicion_Pago WHERE Nombre = 'Crédito 15 días')
    INSERT INTO Condicion_Pago (Nombre, Dias_Credito, Descripcion, Estado)
    VALUES ('Crédito 15 días', 15, 'Crédito comercial a 15 días plazo', 1);

IF NOT EXISTS (SELECT 1 FROM Condicion_Pago WHERE Nombre = 'Crédito 30 días')
    INSERT INTO Condicion_Pago (Nombre, Dias_Credito, Descripcion, Estado)
    VALUES ('Crédito 30 días', 30, 'Crédito comercial regular a 30 días para instituciones', 1);

IF NOT EXISTS (SELECT 1 FROM Condicion_Pago WHERE Nombre = 'Crédito 45 días')
    INSERT INTO Condicion_Pago (Nombre, Dias_Credito, Descripcion, Estado)
    VALUES ('Crédito 45 días', 45, 'Crédito preferencial a 45 días previa autorización', 1);
GO

-- 3. Tipo_Proveedor
IF NOT EXISTS (SELECT 1 FROM Tipo_Proveedor WHERE Nombre = 'Particular')
    INSERT INTO Tipo_Proveedor (Nombre, Estado) 
    VALUES ('Particular', 1);

IF NOT EXISTS (SELECT 1 FROM Tipo_Proveedor WHERE Nombre = 'Institucional')
    INSERT INTO Tipo_Proveedor (Nombre, Estado) 
    VALUES ('Institucional', 1);
GO

-- 4. Categoria (Nombre VARCHAR(20))
IF NOT EXISTS (SELECT 1 FROM Categoria WHERE Nombre = 'Cuadernos')
    INSERT INTO Categoria (Nombre, Descripcion, Estado)
    VALUES ('Cuadernos', 'Cuadernos cosidos, espiral, libretas de apuntes y blocks de notas', 1);

IF NOT EXISTS (SELECT 1 FROM Categoria WHERE Nombre = 'Escritura')
    INSERT INTO Categoria (Nombre, Descripcion, Estado)
    VALUES ('Escritura', 'Bolígrafos, lápices de grafito, correctores, plumones y marcadores', 1);

IF NOT EXISTS (SELECT 1 FROM Categoria WHERE Nombre = 'Papelería')
    INSERT INTO Categoria (Nombre, Descripcion, Estado)
    VALUES ('Papelería', 'Hojas bond blancas, papel construcción, cartulinas y papel crepé', 1);

IF NOT EXISTS (SELECT 1 FROM Categoria WHERE Nombre = 'Arte')
    INSERT INTO Categoria (Nombre, Descripcion, Estado)
    VALUES ('Arte', 'Pinturas acrílicas, témperas, pinceles, plastilinas y acuarelas', 1);

IF NOT EXISTS (SELECT 1 FROM Categoria WHERE Nombre = 'Oficina')
    INSERT INTO Categoria (Nombre, Descripcion, Estado)
    VALUES ('Oficina', 'Folders, archivadores, engrapadoras, grapas, clips y perforadoras', 1);

IF NOT EXISTS (SELECT 1 FROM Categoria WHERE Nombre = 'Adhesivos')
    INSERT INTO Categoria (Nombre, Descripcion, Estado)
    VALUES ('Adhesivos', 'Gomas líquidas escolares, barras adhesivas, silicón y cintas', 1);

IF NOT EXISTS (SELECT 1 FROM Categoria WHERE Nombre = 'Geometría')
    INSERT INTO Categoria (Nombre, Descripcion, Estado)
    VALUES ('Geometría', 'Juegos de geometría, reglas metálicas, transportadores y compases', 1);

IF NOT EXISTS (SELECT 1 FROM Categoria WHERE Nombre = 'Mochilas')
    INSERT INTO Categoria (Nombre, Descripcion, Estado)
    VALUES ('Mochilas', 'Cartucheras escolares, bolsos para útiles y accesorios de transporte', 1);
GO

-- 5. Tipo_Movimiento (Naturaleza: Entrada, Salida, Ajuste, Devolución)
IF NOT EXISTS (SELECT 1 FROM Tipo_Movimiento WHERE Nombre = 'Entrada por Compra')
    INSERT INTO Tipo_Movimiento (Nombre, Naturaleza, Estado, Descripcion)
    VALUES ('Entrada por Compra', 'Entrada', 1, 'Recepción de mercancía adquirida a proveedores autorizados');

IF NOT EXISTS (SELECT 1 FROM Tipo_Movimiento WHERE Nombre = 'Salida por Venta')
    INSERT INTO Tipo_Movimiento (Nombre, Naturaleza, Estado, Descripcion)
    VALUES ('Salida por Venta', 'Salida', 1, 'Despacho de inventario por venta concretada');

IF NOT EXISTS (SELECT 1 FROM Tipo_Movimiento WHERE Nombre = 'Ajuste Positivo')
    INSERT INTO Tipo_Movimiento (Nombre, Naturaleza, Estado, Descripcion)
    VALUES ('Ajuste Positivo', 'Ajuste', 1, 'Incremento de existencias tras conteo físico o corrección');

IF NOT EXISTS (SELECT 1 FROM Tipo_Movimiento WHERE Nombre = 'Ajuste Negativo')
    INSERT INTO Tipo_Movimiento (Nombre, Naturaleza, Estado, Descripcion)
    VALUES ('Ajuste Negativo', 'Ajuste', 1, 'Disminución de inventario por merma, daño o pérdida');

IF NOT EXISTS (SELECT 1 FROM Tipo_Movimiento WHERE Nombre = 'Devolución de Cliente')
    INSERT INTO Tipo_Movimiento (Nombre, Naturaleza, Estado, Descripcion)
    VALUES ('Devolución de Cliente', 'Devolución', 1, 'Reingreso de producto en óptimas condiciones devuelto por cliente');

IF NOT EXISTS (SELECT 1 FROM Tipo_Movimiento WHERE Nombre = 'Devolución a Proveedor')
    INSERT INTO Tipo_Movimiento (Nombre, Naturaleza, Estado, Descripcion)
    VALUES ('Devolución a Proveedor', 'Devolución', 1, 'Salida por producto defectuoso devuelto al fabricante');
GO

-- 6. Estado_Compra
IF NOT EXISTS (SELECT 1 FROM Estado_Compra WHERE Nombre_Estado = 'Pendiente')
    INSERT INTO Estado_Compra (Nombre_Estado) VALUES ('Pendiente');

IF NOT EXISTS (SELECT 1 FROM Estado_Compra WHERE Nombre_Estado = 'Recibida')
    INSERT INTO Estado_Compra (Nombre_Estado) VALUES ('Recibida');

IF NOT EXISTS (SELECT 1 FROM Estado_Compra WHERE Nombre_Estado = 'Anulada')
    INSERT INTO Estado_Compra (Nombre_Estado) VALUES ('Anulada');
GO

-- 7. Estado_Venta
IF NOT EXISTS (SELECT 1 FROM Estado_Venta WHERE Nombre_Estado = 'Pendiente')
    INSERT INTO Estado_Venta (Nombre_Estado) VALUES ('Pendiente');

IF NOT EXISTS (SELECT 1 FROM Estado_Venta WHERE Nombre_Estado = 'Confirmada')
    INSERT INTO Estado_Venta (Nombre_Estado) VALUES ('Confirmada');

IF NOT EXISTS (SELECT 1 FROM Estado_Venta WHERE Nombre_Estado = 'Anulada')
    INSERT INTO Estado_Venta (Nombre_Estado) VALUES ('Anulada');
GO

-- 8. Estado_Factura
IF NOT EXISTS (SELECT 1 FROM Estado_Factura WHERE Nombre_Estado = 'Pendiente')
    INSERT INTO Estado_Factura (Nombre_Estado) VALUES ('Pendiente');

IF NOT EXISTS (SELECT 1 FROM Estado_Factura WHERE Nombre_Estado = 'Parcial')
    INSERT INTO Estado_Factura (Nombre_Estado) VALUES ('Parcial');

IF NOT EXISTS (SELECT 1 FROM Estado_Factura WHERE Nombre_Estado = 'Pagada')
    INSERT INTO Estado_Factura (Nombre_Estado) VALUES ('Pagada');

IF NOT EXISTS (SELECT 1 FROM Estado_Factura WHERE Nombre_Estado = 'Anulada')
    INSERT INTO Estado_Factura (Nombre_Estado) VALUES ('Anulada');
GO

-- 9. Metodo_Pago
IF NOT EXISTS (SELECT 1 FROM Metodo_Pago WHERE Nombre = 'Efectivo')
    INSERT INTO Metodo_Pago (Nombre, Descripcion, Estado)
    VALUES ('Efectivo', 'Pago en moneda de curso legal en punto de venta', 1);

IF NOT EXISTS (SELECT 1 FROM Metodo_Pago WHERE Nombre = 'Tarjeta de Débito')
    INSERT INTO Metodo_Pago (Nombre, Descripcion, Estado)
    VALUES ('Tarjeta de Débito', 'Cobro mediante terminal POS con tarjeta bancaria de débito', 1);

IF NOT EXISTS (SELECT 1 FROM Metodo_Pago WHERE Nombre = 'Tarjeta de Crédito')
    INSERT INTO Metodo_Pago (Nombre, Descripcion, Estado)
    VALUES ('Tarjeta de Crédito', 'Cobro mediante terminal POS con tarjeta bancaria de crédito', 1);

IF NOT EXISTS (SELECT 1 FROM Metodo_Pago WHERE Nombre = 'Transferencia Bancaria')
    INSERT INTO Metodo_Pago (Nombre, Descripcion, Estado)
    VALUES ('Transferencia Bancaria', 'Transferencia electrónica a cuenta bancaria empresarial', 1);

IF NOT EXISTS (SELECT 1 FROM Metodo_Pago WHERE Nombre = 'SINPE Móvil')
    INSERT INTO Metodo_Pago (Nombre, Descripcion, Estado)
    VALUES ('SINPE Móvil', 'Transferencia instantánea del Banco Central vía número telefónico', 1);
GO

-- 10. Rol
IF NOT EXISTS (SELECT 1 FROM Rol WHERE Nombre = 'Administrador')
    INSERT INTO Rol (Nombre, Descripcion, Estado)
    VALUES ('Administrador', 'Control total y administración técnica y comercial del sistema', 1);

IF NOT EXISTS (SELECT 1 FROM Rol WHERE Nombre = 'Vendedor')
    INSERT INTO Rol (Nombre, Descripcion, Estado)
    VALUES ('Vendedor', 'Atención en caja, facturación de mostrador y registro de ventas', 1);

IF NOT EXISTS (SELECT 1 FROM Rol WHERE Nombre = 'Bodeguero')
    INSERT INTO Rol (Nombre, Descripcion, Estado)
    VALUES ('Bodeguero', 'Recepción de mercancía, control de existencias y despacho físico', 1);

IF NOT EXISTS (SELECT 1 FROM Rol WHERE Nombre = 'Contador')
    INSERT INTO Rol (Nombre, Descripcion, Estado)
    VALUES ('Contador', 'Gestión financiera, liquidación de facturas, cobranza y reportes contables', 1);
GO

-- 11. Permiso
DECLARE @Permisos TABLE (Nombre VARCHAR(100), Descripcion VARCHAR(255));
INSERT INTO @Permisos (Nombre, Descripcion) VALUES
('CLIENTES_CONSULTAR', 'Permite consultar el catálogo y fichas de clientes'),
('CLIENTES_GESTIONAR', 'Permite crear y modificar información de clientes particulares e institucionales'),
('CLIENTES_CONDICIONES_PAGO', 'Permite autorizar o revocar condiciones de crédito a clientes'),
('PROVEEDORES_CONSULTAR', 'Permite consultar proveedores y catálogo de productos asociados'),
('PROVEEDORES_GESTIONAR', 'Permite registrar y actualizar proveedores particulares e institucionales'),
('INVENTARIO_CONSULTAR', 'Permite consultar productos, stock actual, puntos de reorden y categorías'),
('INVENTARIO_GESTIONAR', 'Permite crear productos, modificar precios y registrar movimientos manuales'),
('COMPRAS_REGISTRAR', 'Permite registrar órdenes de compra a proveedores'),
('COMPRAS_RECEPCIONAR', 'Permite recibir mercancía y aplicar entrada automática al inventario'),
('COMPRAS_ANULAR', 'Permite anular órdenes de compra no procesadas'),
('VENTAS_REGISTRAR', 'Permite crear ventas y registrar detalle de productos y servicios'),
('VENTAS_CONFIRMAR', 'Permite confirmar ventas, reservar stock e iniciar facturación'),
('VENTAS_ANULAR', 'Permite anular ventas conforme a las políticas comerciales'),
('FACTURACION_EMITIR', 'Permite generar facturas electrónicas a partir de ventas confirmadas'),
('PAGOS_REGISTRAR', 'Permite registrar abonos y cancelaciones totales de facturas'),
('REPORTES_VER', 'Permite acceder a las vistas operativas y reportes ejecutivos'),
('SEGURIDAD_GESTIONAR', 'Permite administrar usuarios, roles, asignaciones de permisos y bitácora'),
('DBA_MANTENIMIENTO', 'Permite ejecutar respaldos, revisiones de integridad y mantenimiento de índices');

INSERT INTO Permiso (Nombre, Descripcion)
SELECT p.Nombre, p.Descripcion
FROM @Permisos p
WHERE NOT EXISTS (SELECT 1 FROM Permiso WHERE Nombre = p.Nombre);
GO

-- 12. Rol_Permiso (Matriz de permisos)
-- Administrador: Todos los permisos
INSERT INTO Rol_Permiso (Id_Rol, Id_Permiso)
SELECT r.Id_Rol, p.Id_Permiso
FROM Rol r
CROSS JOIN Permiso p
WHERE r.Nombre = 'Administrador'
  AND NOT EXISTS (
      SELECT 1 FROM Rol_Permiso rp 
      WHERE rp.Id_Rol = r.Id_Rol AND rp.Id_Permiso = p.Id_Permiso
  );

-- Vendedor: Consultas, ventas, emitir factura y pagos
INSERT INTO Rol_Permiso (Id_Rol, Id_Permiso)
SELECT r.Id_Rol, p.Id_Permiso
FROM Rol r
JOIN Permiso p ON p.Nombre IN (
    'CLIENTES_CONSULTAR', 'CLIENTES_GESTIONAR',
    'INVENTARIO_CONSULTAR',
    'VENTAS_REGISTRAR', 'VENTAS_CONFIRMAR', 'VENTAS_ANULAR',
    'FACTURACION_EMITIR', 'PAGOS_REGISTRAR', 'REPORTES_VER'
)
WHERE r.Nombre = 'Vendedor'
  AND NOT EXISTS (
      SELECT 1 FROM Rol_Permiso rp 
      WHERE rp.Id_Rol = r.Id_Rol AND rp.Id_Permiso = p.Id_Permiso
  );

-- Bodeguero: Inventario, compras y recepción
INSERT INTO Rol_Permiso (Id_Rol, Id_Permiso)
SELECT r.Id_Rol, p.Id_Permiso
FROM Rol r
JOIN Permiso p ON p.Nombre IN (
    'PROVEEDORES_CONSULTAR',
    'INVENTARIO_CONSULTAR', 'INVENTARIO_GESTIONAR',
    'COMPRAS_REGISTRAR', 'COMPRAS_RECEPCIONAR'
)
WHERE r.Nombre = 'Bodeguero'
  AND NOT EXISTS (
      SELECT 1 FROM Rol_Permiso rp 
      WHERE rp.Id_Rol = r.Id_Rol AND rp.Id_Permiso = p.Id_Permiso
  );

-- Contador: Clientes, compras, facturación, pagos y reportes
INSERT INTO Rol_Permiso (Id_Rol, Id_Permiso)
SELECT r.Id_Rol, p.Id_Permiso
FROM Rol r
JOIN Permiso p ON p.Nombre IN (
    'CLIENTES_CONSULTAR', 'CLIENTES_CONDICIONES_PAGO',
    'PROVEEDORES_CONSULTAR', 'INVENTARIO_CONSULTAR',
    'COMPRAS_REGISTRAR', 'COMPRAS_RECEPCIONAR', 'COMPRAS_ANULAR',
    'FACTURACION_EMITIR', 'PAGOS_REGISTRAR', 'REPORTES_VER'
)
WHERE r.Nombre = 'Contador'
  AND NOT EXISTS (
      SELECT 1 FROM Rol_Permiso rp 
      WHERE rp.Id_Rol = r.Id_Rol AND rp.Id_Permiso = p.Id_Permiso
  );
GO

PRINT 'Catálogos base cargados exitosamente.';
GO
