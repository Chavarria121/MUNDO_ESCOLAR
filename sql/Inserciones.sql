/* =========================================================================
   PROYECTO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR
   ARCHIVO: Inserciones.sql (SCRIPT MAESTRO CONSOLIDADO DE INSERCIÓN DE DATOS)
   ESTILO: TORRENTES (SSMS 22)
   REFERENCIA DOCUMENTACIÓN: Secciones 17.8.5, 17.8.6 y 17.8.13
   DESCRIPCIÓN: 
     Script "Todo-en-Uno" para inicializar completamente la base de datos
     con un solo clic (F5) en SSMS.
     Ejecuta secuencialmente de forma idempotente:
       1. 05_CrearCatalogos.sql            (11 catálogos base + roles + permisos)
       2. 06_InsertarDatosMaestros.sql      (Usuarios, servicios, productos, clientes, proveedores)
       3. 13_InsertarDatosDemostracion.sql  (Compras, ventas, inventario, facturas, pagos, auditoría)
   ========================================================================= */

USE MUNDO_ESCOLAR
GO

-- =========================================================================
-- PARTE 1: CATÁLOGOS BASE DEL SISTEMA (05_CrearCatalogos.sql)
-- =========================================================================
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
IF NOT EXISTS (SELECT 1 FROM Estado_Factura WHERE Nombre_Estado = 'Emitida')
    INSERT INTO Estado_Factura (Nombre_Estado) VALUES ('Emitida');

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

-- =========================================================================
-- PARTE 2: DATOS MAESTROS (06_InsertarDatosMaestros.sql)
-- =========================================================================
SET NOCOUNT ON;
PRINT 'Iniciando carga de datos maestros en MUNDO_ESCOLAR...';
GO

-- 1. Usuarios (Contraseña cifrada con SHA2_256: 'Admin2026!', 'Venta2026!', etc.)
IF NOT EXISTS (SELECT 1 FROM Usuario WHERE Nombre_Usuario = 'admin')
    INSERT INTO Usuario (Nombre_Usuario, Correo, Contrasena, Fecha_Registro, Estado)
    VALUES ('admin', 'admin@mundoescolar.cr', CONVERT(VARCHAR(255), HASHBYTES('SHA2_256', 'Admin2026!'), 2), GETDATE(), 1);

IF NOT EXISTS (SELECT 1 FROM Usuario WHERE Nombre_Usuario = 'carlos.vargas')
    INSERT INTO Usuario (Nombre_Usuario, Correo, Contrasena, Fecha_Registro, Estado)
    VALUES ('carlos.vargas', 'carlos.vargas@mundoescolar.cr', CONVERT(VARCHAR(255), HASHBYTES('SHA2_256', 'Venta2026!'), 2), GETDATE(), 1);

IF NOT EXISTS (SELECT 1 FROM Usuario WHERE Nombre_Usuario = 'mario.bodega')
    INSERT INTO Usuario (Nombre_Usuario, Correo, Contrasena, Fecha_Registro, Estado)
    VALUES ('mario.bodega', 'mario.bodega@mundoescolar.cr', CONVERT(VARCHAR(255), HASHBYTES('SHA2_256', 'Bodega2026!'), 2), GETDATE(), 1);

IF NOT EXISTS (SELECT 1 FROM Usuario WHERE Nombre_Usuario = 'laura.conta')
    INSERT INTO Usuario (Nombre_Usuario, Correo, Contrasena, Fecha_Registro, Estado)
    VALUES ('laura.conta', 'laura.conta@mundoescolar.cr', CONVERT(VARCHAR(255), HASHBYTES('SHA2_256', 'Conta2026!'), 2), GETDATE(), 1);

IF NOT EXISTS (SELECT 1 FROM Usuario WHERE Nombre_Usuario = 'gerente')
    INSERT INTO Usuario (Nombre_Usuario, Correo, Contrasena, Fecha_Registro, Estado)
    VALUES ('gerente', 'gerente@mundoescolar.cr', CONVERT(VARCHAR(255), HASHBYTES('SHA2_256', 'Gerente2026*'), 2), GETDATE(), 1);
GO

-- 2. Rol_Usuario
-- gerente -> Administrador
INSERT INTO Rol_Usuario (Id_Rol, Id_Usuario)
SELECT r.Id_Rol, u.Id_Usuario
FROM Rol r, Usuario u
WHERE r.Nombre = 'Administrador' AND u.Nombre_Usuario = 'gerente'
  AND NOT EXISTS (SELECT 1 FROM Rol_Usuario ru WHERE ru.Id_Rol = r.Id_Rol AND ru.Id_Usuario = u.Id_Usuario);

-- admin -> Administrador
INSERT INTO Rol_Usuario (Id_Rol, Id_Usuario)
SELECT r.Id_Rol, u.Id_Usuario
FROM Rol r, Usuario u
WHERE r.Nombre = 'Administrador' AND u.Nombre_Usuario = 'admin'
  AND NOT EXISTS (SELECT 1 FROM Rol_Usuario ru WHERE ru.Id_Rol = r.Id_Rol AND ru.Id_Usuario = u.Id_Usuario);

-- carlos.vargas -> Vendedor
INSERT INTO Rol_Usuario (Id_Rol, Id_Usuario)
SELECT r.Id_Rol, u.Id_Usuario
FROM Rol r, Usuario u
WHERE r.Nombre = 'Vendedor' AND u.Nombre_Usuario = 'carlos.vargas'
  AND NOT EXISTS (SELECT 1 FROM Rol_Usuario ru WHERE ru.Id_Rol = r.Id_Rol AND ru.Id_Usuario = u.Id_Usuario);

-- mario.bodega -> Bodeguero
INSERT INTO Rol_Usuario (Id_Rol, Id_Usuario)
SELECT r.Id_Rol, u.Id_Usuario
FROM Rol r, Usuario u
WHERE r.Nombre = 'Bodeguero' AND u.Nombre_Usuario = 'mario.bodega'
  AND NOT EXISTS (SELECT 1 FROM Rol_Usuario ru WHERE ru.Id_Rol = r.Id_Rol AND ru.Id_Usuario = u.Id_Usuario);

-- laura.conta -> Contador
INSERT INTO Rol_Usuario (Id_Rol, Id_Usuario)
SELECT r.Id_Rol, u.Id_Usuario
FROM Rol r, Usuario u
WHERE r.Nombre = 'Contador' AND u.Nombre_Usuario = 'laura.conta'
  AND NOT EXISTS (SELECT 1 FROM Rol_Usuario ru WHERE ru.Id_Rol = r.Id_Rol AND ru.Id_Usuario = u.Id_Usuario);
GO

-- 3. Servicios
IF NOT EXISTS (SELECT 1 FROM Servicio WHERE Nombre = 'Fotocopia B/N Carta')
    INSERT INTO Servicio (Nombre, Descripcion, Precio_Base, Estado)
    VALUES ('Fotocopia B/N Carta', 'Fotocopia simple blanco y negro tamaño carta', 25.00, 1);

IF NOT EXISTS (SELECT 1 FROM Servicio WHERE Nombre = 'Fotocopia Color Carta')
    INSERT INTO Servicio (Nombre, Descripcion, Precio_Base, Estado)
    VALUES ('Fotocopia Color Carta', 'Fotocopia color tamaño carta alta resolución', 150.00, 1);

IF NOT EXISTS (SELECT 1 FROM Servicio WHERE Nombre = 'Impresión Digital B/N')
    INSERT INTO Servicio (Nombre, Descripcion, Precio_Base, Estado)
    VALUES ('Impresión Digital B/N', 'Impresión digital blanco y negro desde archivo USB o correo', 50.00, 1);

IF NOT EXISTS (SELECT 1 FROM Servicio WHERE Nombre = 'Impresión Digital Color')
    INSERT INTO Servicio (Nombre, Descripcion, Precio_Base, Estado)
    VALUES ('Impresión Digital Color', 'Impresión digital a todo color en papel bond', 200.00, 1);

IF NOT EXISTS (SELECT 1 FROM Servicio WHERE Nombre = 'Encuadernación Espiral P')
    INSERT INTO Servicio (Nombre, Descripcion, Precio_Base, Estado)
    VALUES ('Encuadernación Espiral P', 'Encuadernación espiral plástico de 1 a 50 hojas con pastas', 1200.00, 1);

IF NOT EXISTS (SELECT 1 FROM Servicio WHERE Nombre = 'Encuadernación Espiral G')
    INSERT INTO Servicio (Nombre, Descripcion, Precio_Base, Estado)
    VALUES ('Encuadernación Espiral G', 'Encuadernación espiral plástico de 51 a 200 hojas con pastas', 2500.00, 1);

IF NOT EXISTS (SELECT 1 FROM Servicio WHERE Nombre = 'Plastificado Carné')
    INSERT INTO Servicio (Nombre, Descripcion, Precio_Base, Estado)
    VALUES ('Plastificado Carné', 'Plastificado térmico para carnés y documentos pequeños', 500.00, 1);

IF NOT EXISTS (SELECT 1 FROM Servicio WHERE Nombre = 'Plastificado Carta')
    INSERT INTO Servicio (Nombre, Descripcion, Precio_Base, Estado)
    VALUES ('Plastificado Carta', 'Plastificado térmico para documentos tamaño carta u oficio', 1000.00, 1);
GO

-- 4. Proveedores
-- Proveedor Institucional 1: Papelera Nacional S.A.
DECLARE @IdTipoProvInst INT = (SELECT Id_Tipo_Proveedor FROM Tipo_Proveedor WHERE Nombre = 'Institucional');
DECLARE @IdTipoProvPart INT = (SELECT Id_Tipo_Proveedor FROM Tipo_Proveedor WHERE Nombre = 'Particular');

IF NOT EXISTS (SELECT 1 FROM Proveedor_Institucional WHERE Cedula_Juridica = '3-101-555888')
BEGIN
    INSERT INTO Proveedor (Id_Tipo_Proveedor, Correo, Telefono, Direccion, Estado)
    VALUES (@IdTipoProvInst, 'ventas@papeleranacional.cr', '2240-5500', 'San José, La Uruca, bodega 14', 1);
    
    DECLARE @IdProv1 INT = SCOPE_IDENTITY();
    INSERT INTO Proveedor_Institucional (Id_Proveedor, Razon_Social, Cedula_Juridica, Nombre_Contacto, Telefono_Contacto, Correo_Contacto)
    VALUES (@IdProv1, 'Papelera Nacional S.A.', '3-101-555888', 'Jorge Cordero Fallas', '8840-1122', 'jcordero@papeleranacional.cr');
END

-- Proveedor Institucional 2: Distribuidora Escolar del Valle S.A.
IF NOT EXISTS (SELECT 1 FROM Proveedor_Institucional WHERE Cedula_Juridica = '3-101-999333')
BEGIN
    INSERT INTO Proveedor (Id_Tipo_Proveedor, Correo, Telefono, Direccion, Estado)
    VALUES (@IdTipoProvInst, 'pedidos@escolardelvalle.cr', '2441-8900', 'Alajuela, Parque Industrial El Coyol', 1);
    
    DECLARE @IdProv2 INT = SCOPE_IDENTITY();
    INSERT INTO Proveedor_Institucional (Id_Proveedor, Razon_Social, Cedula_Juridica, Nombre_Contacto, Telefono_Contacto, Correo_Contacto)
    VALUES (@IdProv2, 'Distribuidora Escolar del Valle S.A.', '3-101-999333', 'Silvia Mata Ramos', '8701-4455', 'smata@escolardelvalle.cr');
END

-- Proveedor Particular: Carlos Mora Solano (Artesanías y Reglas)
IF NOT EXISTS (SELECT 1 FROM Proveedor_Particular WHERE Identificacion = '1-0855-0922')
BEGIN
    INSERT INTO Proveedor (Id_Tipo_Proveedor, Correo, Telefono, Direccion, Estado)
    VALUES (@IdTipoProvPart, 'cmora.artes@gmail.com', '8330-9988', 'Heredia, San Joaquín de Flores', 1);
    
    DECLARE @IdProv3 INT = SCOPE_IDENTITY();
    INSERT INTO Proveedor_Particular (Id_Proveedor, Identificacion, Nombre, Apellido1, Apellido2)
    VALUES (@IdProv3, '1-0855-0922', 'Carlos', 'Mora', 'Solano');
END
GO

-- 5. Clientes
-- Cuentas de usuario individuales para cada cliente (cumpliendo UQ_Cliente_Usuario 1:1)
IF NOT EXISTS (SELECT 1 FROM Usuario WHERE Nombre_Usuario = 'cli.maria')
    INSERT INTO Usuario (Nombre_Usuario, Correo, Contrasena, Fecha_Registro, Estado)
    VALUES ('cli.maria', 'maria.rodriguez@gmail.com', CONVERT(VARCHAR(255), HASHBYTES('SHA2_256', 'Cliente2026!'), 2), GETDATE(), 1);

IF NOT EXISTS (SELECT 1 FROM Usuario WHERE Nombre_Usuario = 'cli.esteban')
    INSERT INTO Usuario (Nombre_Usuario, Correo, Contrasena, Fecha_Registro, Estado)
    VALUES ('cli.esteban', 'esteban.solis@hotmail.com', CONVERT(VARCHAR(255), HASHBYTES('SHA2_256', 'Cliente2026!'), 2), GETDATE(), 1);

IF NOT EXISTS (SELECT 1 FROM Usuario WHERE Nombre_Usuario = 'cli.repcolombia')
    INSERT INTO Usuario (Nombre_Usuario, Correo, Contrasena, Fecha_Registro, Estado)
    VALUES ('cli.repcolombia', 'directoria@repcolombia.mep.go.cr', CONVERT(VARCHAR(255), HASHBYTES('SHA2_256', 'Cliente2026!'), 2), GETDATE(), 1);

IF NOT EXISTS (SELECT 1 FROM Usuario WHERE Nombre_Usuario = 'cli.colegioalajuela')
    INSERT INTO Usuario (Nombre_Usuario, Correo, Contrasena, Fecha_Registro, Estado)
    VALUES ('cli.colegioalajuela', 'administracion@cientificoalajuela.ed.cr', CONVERT(VARCHAR(255), HASHBYTES('SHA2_256', 'Cliente2026!'), 2), GETDATE(), 1);

DECLARE @IdUserMaria INT = (SELECT Id_Usuario FROM Usuario WHERE Nombre_Usuario = 'cli.maria');
DECLARE @IdUserEsteban INT = (SELECT Id_Usuario FROM Usuario WHERE Nombre_Usuario = 'cli.esteban');
DECLARE @IdUserRepCol INT = (SELECT Id_Usuario FROM Usuario WHERE Nombre_Usuario = 'cli.repcolombia');
DECLARE @IdUserColAlaj INT = (SELECT Id_Usuario FROM Usuario WHERE Nombre_Usuario = 'cli.colegioalajuela');

DECLARE @IdTipoCliPart INT = (SELECT Id_Tipo_Cliente FROM Tipo_Cliente WHERE Nombre = 'Particular');
DECLARE @IdTipoCliInst INT = (SELECT Id_Tipo_Cliente FROM Tipo_Cliente WHERE Nombre = 'Institucional');

-- Cliente Particular 1: María Rodríguez Pérez
IF NOT EXISTS (SELECT 1 FROM Cliente_Particular WHERE Identificacion = '1-1122-0334')
BEGIN
    INSERT INTO Cliente (Id_Tipo_Cliente, Id_Usuario, Telefono, Direccion, Estado)
    VALUES (@IdTipoCliPart, @IdUserMaria, '8811-2233', 'San José, Guadalupe, 200m norte de la iglesia', 1);
    
    DECLARE @IdCli1 INT = SCOPE_IDENTITY();
    INSERT INTO Cliente_Particular (Id_Cliente, Identificacion, Nombre, Apellido1, Apellido2)
    VALUES (@IdCli1, '1-1122-0334', 'María', 'Rodríguez', 'Pérez');
END

-- Cliente Particular 2: Esteban Solís Brenes
IF NOT EXISTS (SELECT 1 FROM Cliente_Particular WHERE Identificacion = '2-0544-0789')
BEGIN
    INSERT INTO Cliente (Id_Tipo_Cliente, Id_Usuario, Telefono, Direccion, Estado)
    VALUES (@IdTipoCliPart, @IdUserEsteban, '8344-5566', 'Alajuela centro, frente a Correos', 1);
    
    DECLARE @IdCli2 INT = SCOPE_IDENTITY();
    INSERT INTO Cliente_Particular (Id_Cliente, Identificacion, Nombre, Apellido1, Apellido2)
    VALUES (@IdCli2, '2-0544-0789', 'Esteban', 'Solís', 'Brenes');
END

-- Cliente Institucional 1: Escuela República de Colombia
IF NOT EXISTS (SELECT 1 FROM Cliente_Institucional WHERE Cedula_Juridica = '3-008-045612')
BEGIN
    INSERT INTO Cliente (Id_Tipo_Cliente, Id_Usuario, Telefono, Direccion, Estado)
    VALUES (@IdTipoCliInst, @IdUserRepCol, '2225-7890', 'San José, Barrio México', 1);
    
    DECLARE @IdCliInst1 INT = SCOPE_IDENTITY();
    INSERT INTO Cliente_Institucional (Id_Cliente, Razon_Social, Cedula_Juridica, Nombre_Contacto, Telefono_Contacto, Correo_Contacto)
    VALUES (@IdCliInst1, 'Junta de Educación Escuela República de Colombia', '3-008-045612', 'Marta Gómez Valverde (Directora)', '8890-3412', 'directoria@repcolombia.mep.go.cr');
END

-- Cliente Institucional 2: Colegio Científico de Alajuela
IF NOT EXISTS (SELECT 1 FROM Cliente_Institucional WHERE Cedula_Juridica = '3-008-089944')
BEGIN
    INSERT INTO Cliente (Id_Tipo_Cliente, Id_Usuario, Telefono, Direccion, Estado)
    VALUES (@IdTipoCliInst, @IdUserColAlaj, '2430-1122', 'Alajuela, sede UTN', 1);
    
    DECLARE @IdCliInst2 INT = SCOPE_IDENTITY();
    INSERT INTO Cliente_Institucional (Id_Cliente, Razon_Social, Cedula_Juridica, Nombre_Contacto, Telefono_Contacto, Correo_Contacto)
    VALUES (@IdCliInst2, 'Colegio Científico de Alajuela', '3-008-089944', 'Lic. Randall Castro Vega', '8711-2299', 'rcastro@cientificoalajuela.ed.cr');
END
GO

-- 6. Autorización de Condiciones de Pago (Cliente_Condicion_Pago)
DECLARE @IdContado INT = (SELECT Id_Condicion_Pago FROM Condicion_Pago WHERE Nombre = 'Contado');
DECLARE @IdCred30 INT = (SELECT Id_Condicion_Pago FROM Condicion_Pago WHERE Nombre = 'Crédito 30 días');

-- Clientes particulares tienen Contado por defecto
INSERT INTO Cliente_Condicion_Pago (Id_Cliente, Id_Condicion_Pago, Fecha_Autorizacion, Estado)
SELECT c.Id_Cliente, @IdContado, CAST(GETDATE() AS DATE), 1
FROM Cliente c
WHERE NOT EXISTS (
    SELECT 1 FROM Cliente_Condicion_Pago ccp 
    WHERE ccp.Id_Cliente = c.Id_Cliente AND ccp.Id_Condicion_Pago = @IdContado
);

-- Institucionales tienen crédito a 30 días autorizado
INSERT INTO Cliente_Condicion_Pago (Id_Cliente, Id_Condicion_Pago, Fecha_Autorizacion, Estado)
SELECT c.Id_Cliente, @IdCred30, CAST(GETDATE() AS DATE), 1
FROM Cliente c
JOIN Tipo_Cliente tc ON c.Id_Tipo_Cliente = tc.Id_Tipo_Cliente
WHERE tc.Nombre = 'Institucional'
  AND NOT EXISTS (
      SELECT 1 FROM Cliente_Condicion_Pago ccp 
      WHERE ccp.Id_Cliente = c.Id_Cliente AND ccp.Id_Condicion_Pago = @IdCred30
  );
GO

-- 7. Productos de Papelería y Librería
DECLARE @IdCatCuad INT = (SELECT Id_Categoria FROM Categoria WHERE Nombre = 'Cuadernos');
DECLARE @IdCatEscr INT = (SELECT Id_Categoria FROM Categoria WHERE Nombre = 'Escritura');
DECLARE @IdCatPape INT = (SELECT Id_Categoria FROM Categoria WHERE Nombre = 'Papelería');
DECLARE @IdCatArte INT = (SELECT Id_Categoria FROM Categoria WHERE Nombre = 'Arte');
DECLARE @IdCatOfic INT = (SELECT Id_Categoria FROM Categoria WHERE Nombre = 'Oficina');
DECLARE @IdCatAdhe INT = (SELECT Id_Categoria FROM Categoria WHERE Nombre = 'Adhesivos');
DECLARE @IdCatGeom INT = (SELECT Id_Categoria FROM Categoria WHERE Nombre = 'Geometría');

-- Cuadernos
IF NOT EXISTS (SELECT 1 FROM Producto WHERE Nombre = 'Cuaderno Cosido 100 Hojas')
    INSERT INTO Producto (Id_Categoria, Nombre, Descripcion, Precio_Venta, Stock_Actual, Punto_Reorden, Estado)
    VALUES (@IdCatCuad, 'Cuaderno Cosido 100 Hojas', 'Cuaderno rayado cosido con pasta dura resistente', 1250.00, 150, 30, 1);

IF NOT EXISTS (SELECT 1 FROM Producto WHERE Nombre = 'Cuaderno Espiral 100 Hojas')
    INSERT INTO Producto (Id_Categoria, Nombre, Descripcion, Precio_Venta, Stock_Actual, Punto_Reorden, Estado)
    VALUES (@IdCatCuad, 'Cuaderno Espiral 100 Hojas', 'Cuaderno universitario espiral metálico 100 hojas', 1450.00, 120, 25, 1);

-- Escritura
IF NOT EXISTS (SELECT 1 FROM Producto WHERE Nombre = 'Bolígrafo Azul 0.7mm')
    INSERT INTO Producto (Id_Categoria, Nombre, Descripcion, Precio_Venta, Stock_Actual, Punto_Reorden, Estado)
    VALUES (@IdCatEscr, 'Bolígrafo Azul 0.7mm', 'Bolígrafo tinta suave punta media color azul', 250.00, 300, 50, 1);

IF NOT EXISTS (SELECT 1 FROM Producto WHERE Nombre = 'Bolígrafo Negro 0.7mm')
    INSERT INTO Producto (Id_Categoria, Nombre, Descripcion, Precio_Venta, Stock_Actual, Punto_Reorden, Estado)
    VALUES (@IdCatEscr, 'Bolígrafo Negro 0.7mm', 'Bolígrafo tinta suave punta media color negro', 250.00, 250, 50, 1);

IF NOT EXISTS (SELECT 1 FROM Producto WHERE Nombre = 'Lápiz Grafito HB #2')
    INSERT INTO Producto (Id_Categoria, Nombre, Descripcion, Precio_Venta, Stock_Actual, Punto_Reorden, Estado)
    VALUES (@IdCatEscr, 'Lápiz Grafito HB #2', 'Lápiz de madera hexagonal con borrador incorporado', 200.00, 400, 80, 1);

IF NOT EXISTS (SELECT 1 FROM Producto WHERE Nombre = 'Borrador Blanco de Miga')
    INSERT INTO Producto (Id_Categoria, Nombre, Descripcion, Precio_Venta, Stock_Actual, Punto_Reorden, Estado)
    VALUES (@IdCatEscr, 'Borrador Blanco de Miga', 'Borrador suave sin manchar para lápiz de grafito', 300.00, 200, 40, 1);

-- Papelería
IF NOT EXISTS (SELECT 1 FROM Producto WHERE Nombre = 'Resma Papel Bond Carta 75g')
    INSERT INTO Producto (Id_Categoria, Nombre, Descripcion, Precio_Venta, Stock_Actual, Punto_Reorden, Estado)
    VALUES (@IdCatPape, 'Resma Papel Bond Carta 75g', 'Paquete de 500 hojas bond blanco tamaño carta 75g', 3800.00, 85, 20, 1);

IF NOT EXISTS (SELECT 1 FROM Producto WHERE Nombre = 'Cartulina Blanca Pliego')
    INSERT INTO Producto (Id_Categoria, Nombre, Descripcion, Precio_Venta, Stock_Actual, Punto_Reorden, Estado)
    VALUES (@IdCatPape, 'Cartulina Blanca Pliego', 'Pliego de cartulina bristol blanca para dibujo escolar', 350.00, 110, 30, 1);

-- Arte
IF NOT EXISTS (SELECT 1 FROM Producto WHERE Nombre = 'Caja Lápices Color 12 Uds')
    INSERT INTO Producto (Id_Categoria, Nombre, Descripcion, Precio_Venta, Stock_Actual, Punto_Reorden, Estado)
    VALUES (@IdCatArte, 'Caja Lápices Color 12 Uds', 'Caja de 12 lápices de colores triangulares de madera', 1850.00, 75, 15, 1);

-- Adhesivos y Geometría
IF NOT EXISTS (SELECT 1 FROM Producto WHERE Nombre = 'Goma Líquida Blanca 120ml')
    INSERT INTO Producto (Id_Categoria, Nombre, Descripcion, Precio_Venta, Stock_Actual, Punto_Reorden, Estado)
    VALUES (@IdCatAdhe, 'Goma Líquida Blanca 120ml', 'Pegamento escolar no tóxico lavable con aplicador', 650.00, 95, 20, 1);

IF NOT EXISTS (SELECT 1 FROM Producto WHERE Nombre = 'Juego de Geometría Escolar')
    INSERT INTO Producto (Id_Categoria, Nombre, Descripcion, Precio_Venta, Stock_Actual, Punto_Reorden, Estado)
    VALUES (@IdCatGeom, 'Juego de Geometría Escolar', 'Estuche con regla 30cm, escuadras 45 y 60 y transportador', 1500.00, 60, 15, 1);
GO

-- 8. Producto_Proveedor (Asociación con costo de compra mayorista)
DECLARE @IdProvNacional INT = (
    SELECT p.Id_Proveedor 
    FROM Proveedor p 
    JOIN Proveedor_Institucional pi ON p.Id_Proveedor = pi.Id_Proveedor 
    WHERE pi.Cedula_Juridica = '3-101-555888'
);

DECLARE @IdProvValle INT = (
    SELECT p.Id_Proveedor 
    FROM Proveedor p 
    JOIN Proveedor_Institucional pi ON p.Id_Proveedor = pi.Id_Proveedor 
    WHERE pi.Cedula_Juridica = '3-101-999333'
);

-- Papelera Nacional provee Resmas y Cuadernos
INSERT INTO Producto_Proveedor (Id_Producto, Id_Proveedor, Precio_Compra, EsPrincipal, Estado)
SELECT p.Id_Producto, @IdProvNacional, 
       ROUND(p.Precio_Venta * 0.65, 2), -- 35% margen bruto
       1, 1
FROM Producto p
WHERE p.Nombre IN ('Resma Papel Bond Carta 75g', 'Cartulina Blanca Pliego', 'Cuaderno Cosido 100 Hojas', 'Cuaderno Espiral 100 Hojas')
  AND NOT EXISTS (
      SELECT 1 FROM Producto_Proveedor pp 
      WHERE pp.Id_Producto = p.Id_Producto AND pp.Id_Proveedor = @IdProvNacional
  );

-- Distribuidora Escolar del Valle provee Artículos de Escritura y Arte
INSERT INTO Producto_Proveedor (Id_Producto, Id_Proveedor, Precio_Compra, EsPrincipal, Estado)
SELECT p.Id_Producto, @IdProvValle, 
       ROUND(p.Precio_Venta * 0.60, 2), -- 40% margen bruto
       1, 1
FROM Producto p
WHERE p.Nombre IN ('Bolígrafo Azul 0.7mm', 'Bolígrafo Negro 0.7mm', 'Lápiz Grafito HB #2', 'Borrador Blanco de Miga', 'Caja Lápices Color 12 Uds', 'Goma Líquida Blanca 120ml', 'Juego de Geometría Escolar')
  AND NOT EXISTS (
      SELECT 1 FROM Producto_Proveedor pp 
      WHERE pp.Id_Producto = p.Id_Producto AND pp.Id_Proveedor = @IdProvValle
  );
GO

PRINT 'Datos maestros cargados exitosamente.';
GO

-- =========================================================================
-- PARTE 3: DATOS DE DEMOSTRACIÓN (13_InsertarDatosDemostracion.sql)
-- =========================================================================
SET NOCOUNT ON;
PRINT 'Iniciando carga de transacciones demostrativas en MUNDO_ESCOLAR...';
GO

DECLARE @IdAdmin INT = (SELECT Id_Usuario FROM Usuario WHERE Nombre_Usuario = 'admin');
DECLARE @IdVendedor INT = (SELECT Id_Usuario FROM Usuario WHERE Nombre_Usuario = 'carlos.vargas');
DECLARE @IdBodeguero INT = (SELECT Id_Usuario FROM Usuario WHERE Nombre_Usuario = 'mario.bodega');

DECLARE @IdProvPapelera INT = (
    SELECT p.Id_Proveedor FROM Proveedor p 
    JOIN Proveedor_Institucional pi ON p.Id_Proveedor = pi.Id_Proveedor 
    WHERE pi.Cedula_Juridica = '3-101-555888'
);

DECLARE @IdProvValle INT = (
    SELECT p.Id_Proveedor FROM Proveedor p 
    JOIN Proveedor_Institucional pi ON p.Id_Proveedor = pi.Id_Proveedor 
    WHERE pi.Cedula_Juridica = '3-101-999333'
);

DECLARE @IdCliPart1 INT = (
    SELECT c.Id_Cliente FROM Cliente c 
    JOIN Cliente_Particular cp ON c.Id_Cliente = cp.Id_Cliente 
    WHERE cp.Identificacion = '1-1122-0334'
);

DECLARE @IdCliInst1 INT = (
    SELECT c.Id_Cliente FROM Cliente c 
    JOIN Cliente_Institucional ci ON c.Id_Cliente = ci.Id_Cliente 
    WHERE ci.Cedula_Juridica = '3-008-045612'
);

DECLARE @IdEstadoCompRecibida INT = (SELECT Id_Estado_Compra FROM Estado_Compra WHERE Nombre_Estado = 'Recibida');
DECLARE @IdEstadoVentaConf INT = (SELECT Id_Estado_Venta FROM Estado_Venta WHERE Nombre_Estado = 'Confirmada');
DECLARE @IdEstadoFactPagada INT = (SELECT Id_Estado_Factura FROM Estado_Factura WHERE Nombre_Estado = 'Pagada');
DECLARE @IdEstadoFactEmitida INT = (SELECT Id_Estado_Factura FROM Estado_Factura WHERE Nombre_Estado = 'Emitida');

DECLARE @IdCondContado INT = (SELECT Id_Condicion_Pago FROM Condicion_Pago WHERE Nombre = 'Contado');
DECLARE @IdCondCred30 INT = (SELECT Id_Condicion_Pago FROM Condicion_Pago WHERE Nombre = 'Crédito 30 días');

DECLARE @IdMetodoEfec INT = (SELECT Id_Metodo_Pago FROM Metodo_Pago WHERE Nombre = 'Efectivo');
DECLARE @IdMetodoSinpe INT = (SELECT Id_Metodo_Pago FROM Metodo_Pago WHERE Nombre = 'SINPE Móvil');

DECLARE @IdTipoMovEntrada INT = (SELECT Id_Tipo_Movimiento FROM Tipo_Movimiento WHERE Nombre = 'Entrada por Compra');
DECLARE @IdTipoMovSalida INT = (SELECT Id_Tipo_Movimiento FROM Tipo_Movimiento WHERE Nombre = 'Salida por Venta');

-- 1. Transacción de Compra Demostrativa #1 (Papelera Nacional)
IF NOT EXISTS (SELECT 1 FROM Compra WHERE Id_Proveedor = @IdProvPapelera AND Id_Estado_Compra = @IdEstadoCompRecibida)
BEGIN
    INSERT INTO Compra (Id_Proveedor, Id_Usuario, Id_Estado_Compra, Fecha_Compra)
    VALUES (@IdProvPapelera, @IdBodeguero, @IdEstadoCompRecibida, DATEADD(DAY, -10, GETDATE()));
    
    DECLARE @IdComp1 INT = SCOPE_IDENTITY();
    
    -- Resma Papel Bond: 50 unidades a 2470.00
    DECLARE @IdProdResma INT = (SELECT Id_Producto FROM Producto WHERE Nombre = 'Resma Papel Bond Carta 75g');
    INSERT INTO Compra_Producto (Id_Compra, Id_Producto, Cantidad, Costo_Unitario, Subtotal)
    VALUES (@IdComp1, @IdProdResma, 50, 2470.00, 123500.00);
    
    -- Movimiento de Inventario de Entrada
    INSERT INTO Movimiento_Inventario (Id_Producto, Id_Tipo_Movimiento, Id_Usuario, Cantidad, Fecha, Motivo)
    VALUES (@IdProdResma, @IdTipoMovEntrada, @IdBodeguero, 50, DATEADD(DAY, -10, GETDATE()), 'Entrada por Compra inicial #1');
    
    -- Cuaderno Cosido: 60 unidades a 812.50
    DECLARE @IdProdCuad INT = (SELECT Id_Producto FROM Producto WHERE Nombre = 'Cuaderno Cosido 100 Hojas');
    INSERT INTO Compra_Producto (Id_Compra, Id_Producto, Cantidad, Costo_Unitario, Subtotal)
    VALUES (@IdComp1, @IdProdCuad, 60, 812.50, 48750.00);
    
    INSERT INTO Movimiento_Inventario (Id_Producto, Id_Tipo_Movimiento, Id_Usuario, Cantidad, Fecha, Motivo)
    VALUES (@IdProdCuad, @IdTipoMovEntrada, @IdBodeguero, 60, DATEADD(DAY, -10, GETDATE()), 'Entrada por Compra inicial #1');
END

-- 2. Transacción de Venta Demostrativa #1 (Venta de Contado en Caja a Cliente Particular)
-- Productos + Servicio de Plastificado
IF NOT EXISTS (SELECT 1 FROM Venta WHERE Id_Cliente = @IdCliPart1 AND Id_Condicion_Pago = @IdCondContado)
BEGIN
    -- Subtotal: 2 Cuadernos (2500) + 4 Bolígrafos Azules (1000) + 1 Plastificado Carta (1000) = 4500.00
    -- Impuesto (13%): 585.00
    -- Total: 5085.00
    INSERT INTO Venta (Id_Cliente, Id_Usuario, Id_Estado_Venta, Id_Condicion_Pago, Fecha, Subtotal, Impuesto, Monto_Total)
    VALUES (@IdCliPart1, @IdVendedor, @IdEstadoVentaConf, @IdCondContado, DATEADD(DAY, -2, GETDATE()), 4500.00, 585.00, 5085.00);
    
    DECLARE @IdVenta1 INT = SCOPE_IDENTITY();
    
    DECLARE @IdProdCuad2 INT = (SELECT Id_Producto FROM Producto WHERE Nombre = 'Cuaderno Cosido 100 Hojas');
    DECLARE @IdProdBolig INT = (SELECT Id_Producto FROM Producto WHERE Nombre = 'Bolígrafo Azul 0.7mm');
    DECLARE @IdServPlast INT = (SELECT Id_Servicio FROM Servicio WHERE Nombre = 'Plastificado Carta');
    
    INSERT INTO Venta_Producto (Id_Producto, Id_Venta, Cantidad, Precio_Unitario, Subtotal)
    VALUES (@IdProdCuad2, @IdVenta1, 2, 1250.00, 2500.00);
    
    INSERT INTO Venta_Producto (Id_Producto, Id_Venta, Cantidad, Precio_Unitario, Subtotal)
    VALUES (@IdProdBolig, @IdVenta1, 4, 250.00, 1000.00);
    
    INSERT INTO Venta_Servicio (Id_Venta, Id_Servicio, Cantidad, Precio_Unitario, Subtotal)
    VALUES (@IdVenta1, @IdServPlast, 1, 1000.00, 1000.00);
    
    -- Salida de Inventario
    INSERT INTO Movimiento_Inventario (Id_Producto, Id_Tipo_Movimiento, Id_Usuario, Cantidad, Fecha, Motivo)
    VALUES (@IdProdCuad2, @IdTipoMovSalida, @IdVendedor, 2, DATEADD(DAY, -2, GETDATE()), 'Salida por Venta #1');
    
    INSERT INTO Movimiento_Inventario (Id_Producto, Id_Tipo_Movimiento, Id_Usuario, Cantidad, Fecha, Motivo)
    VALUES (@IdProdBolig, @IdTipoMovSalida, @IdVendedor, 4, DATEADD(DAY, -2, GETDATE()), 'Salida por Venta #1');
    
    -- Factura Generada (Pagada de inmediato por Contado)
    INSERT INTO Factura (Id_Venta, Id_Estado_Factura, Fecha_Emision, Fecha_Vencimiento, Monto_Total, Saldo_Pendiente)
    VALUES (@IdVenta1, @IdEstadoFactPagada, DATEADD(DAY, -2, GETDATE()), DATEADD(DAY, -2, GETDATE()), 5085.00, 0.00);
    
    DECLARE @IdFact1 INT = SCOPE_IDENTITY();
    
    -- Pago Total con Efectivo
    INSERT INTO Pago (Id_Factura, Id_Metodo_Pago, Fecha_Pago, Monto_Pagado, Numero_Referencia, Estado)
    VALUES (@IdFact1, @IdMetodoEfec, DATEADD(DAY, -2, GETDATE()), 5085.00, 'EFECTIVO-REC-001', 1);
END

-- 3. Transacción de Venta Demostrativa #2 (Venta Institucional a Crédito 30 días)
IF NOT EXISTS (SELECT 1 FROM Venta WHERE Id_Cliente = @IdCliInst1 AND Id_Condicion_Pago = @IdCondCred30)
BEGIN
    -- Subtotal: 10 Resmas (38000) + 20 Cajas Colores (37000) = 75000.00
    -- Impuesto (13%): 9750.00
    -- Total: 84750.00
    INSERT INTO Venta (Id_Cliente, Id_Usuario, Id_Estado_Venta, Id_Condicion_Pago, Fecha, Subtotal, Impuesto, Monto_Total)
    VALUES (@IdCliInst1, @IdVendedor, @IdEstadoVentaConf, @IdCondCred30, DATEADD(DAY, -1, GETDATE()), 75000.00, 9750.00, 84750.00);
    
    DECLARE @IdVenta2 INT = SCOPE_IDENTITY();
    
    DECLARE @IdProdResma2 INT = (SELECT Id_Producto FROM Producto WHERE Nombre = 'Resma Papel Bond Carta 75g');
    DECLARE @IdProdColores INT = (SELECT Id_Producto FROM Producto WHERE Nombre = 'Caja Lápices Color 12 Uds');
    
    INSERT INTO Venta_Producto (Id_Producto, Id_Venta, Cantidad, Precio_Unitario, Subtotal)
    VALUES (@IdProdResma2, @IdVenta2, 10, 3800.00, 38000.00);
    
    INSERT INTO Venta_Producto (Id_Producto, Id_Venta, Cantidad, Precio_Unitario, Subtotal)
    VALUES (@IdProdColores, @IdVenta2, 20, 1850.00, 37000.00);
    
    -- Salida de Inventario
    INSERT INTO Movimiento_Inventario (Id_Producto, Id_Tipo_Movimiento, Id_Usuario, Cantidad, Fecha, Motivo)
    VALUES (@IdProdResma2, @IdTipoMovSalida, @IdVendedor, 10, DATEADD(DAY, -1, GETDATE()), 'Salida por Venta a Crédito #2');
    
    INSERT INTO Movimiento_Inventario (Id_Producto, Id_Tipo_Movimiento, Id_Usuario, Cantidad, Fecha, Motivo)
    VALUES (@IdProdColores, @IdTipoMovSalida, @IdVendedor, 20, DATEADD(DAY, -1, GETDATE()), 'Salida por Venta a Crédito #2');
    
    -- Factura a Crédito (Emitida con saldo pendiente y vencimiento a 30 días)
    INSERT INTO Factura (Id_Venta, Id_Estado_Factura, Fecha_Emision, Fecha_Vencimiento, Monto_Total, Saldo_Pendiente)
    VALUES (@IdVenta2, @IdEstadoFactEmitida, DATEADD(DAY, -1, GETDATE()), DATEADD(DAY, 29, GETDATE()), 84750.00, 84750.00);
    
    DECLARE @IdFact2 INT = SCOPE_IDENTITY();
    
    -- Abono parcial de 40000.00 vía SINPE Móvil
    INSERT INTO Pago (Id_Factura, Id_Metodo_Pago, Fecha_Pago, Monto_Pagado, Numero_Referencia, Estado)
    VALUES (@IdFact2, @IdMetodoSinpe, GETDATE(), 40000.00, 'SINPE-TRF-9823412', 1);
    
    -- Actualizar estado de la factura a Parcial y saldo a 44750.00
    DECLARE @IdEstadoFactParcial INT = (SELECT Id_Estado_Factura FROM Estado_Factura WHERE Nombre_Estado = 'Parcial');
    UPDATE Factura
    SET Saldo_Pendiente = 44750.00,
        Id_Estado_Factura = @IdEstadoFactParcial
    WHERE Id_Factura = @IdFact2;
END

-- 4. Registro de Auditoría Inicial (Bitacora)
INSERT INTO Bitacora (Id_Usuario, Accion, Tabla_Afectada, Id_Registro_Afectado, Fecha_Hora, Descripcion)
VALUES 
(@IdAdmin, 'INSTALACION_SISTEMA', 'Sistema', 1, GETDATE(), 'Inicialización y validación exitosa de catálogos y datos maestros'),
(@IdAdmin, 'CARGA_DATOS_DEMO', 'Venta/Factura', 2, GETDATE(), 'Carga de transacciones de prueba para demostración y evaluación');
GO

PRINT 'Transacciones demostrativas cargadas exitosamente.';
GO

-- =========================================================================
-- VERIFICACIÓN FINAL DEL POBLADO
-- =========================================================================
SELECT 'Tipo_Cliente' AS Tabla, COUNT(*) AS TotalRegistros FROM Tipo_Cliente
UNION ALL SELECT 'Condicion_Pago', COUNT(*) FROM Condicion_Pago
UNION ALL SELECT 'Tipo_Proveedor', COUNT(*) FROM Tipo_Proveedor
UNION ALL SELECT 'Categoria', COUNT(*) FROM Categoria
UNION ALL SELECT 'Tipo_Movimiento', COUNT(*) FROM Tipo_Movimiento
UNION ALL SELECT 'Estado_Compra', COUNT(*) FROM Estado_Compra
UNION ALL SELECT 'Estado_Venta', COUNT(*) FROM Estado_Venta
UNION ALL SELECT 'Estado_Factura', COUNT(*) FROM Estado_Factura
UNION ALL SELECT 'Metodo_Pago', COUNT(*) FROM Metodo_Pago
UNION ALL SELECT 'Rol', COUNT(*) FROM Rol
UNION ALL SELECT 'Permiso', COUNT(*) FROM Permiso
UNION ALL SELECT 'Rol_Permiso', COUNT(*) FROM Rol_Permiso
UNION ALL SELECT 'Usuario', COUNT(*) FROM Usuario
UNION ALL SELECT 'Servicio', COUNT(*) FROM Servicio
UNION ALL SELECT 'Producto', COUNT(*) FROM Producto
UNION ALL SELECT 'Proveedor', COUNT(*) FROM Proveedor
UNION ALL SELECT 'Cliente', COUNT(*) FROM Cliente
UNION ALL SELECT 'Compra', COUNT(*) FROM Compra
UNION ALL SELECT 'Venta', COUNT(*) FROM Venta
UNION ALL SELECT 'Factura', COUNT(*) FROM Factura
UNION ALL SELECT 'Pago', COUNT(*) FROM Pago
UNION ALL SELECT 'Bitacora', COUNT(*) FROM Bitacora;
GO
