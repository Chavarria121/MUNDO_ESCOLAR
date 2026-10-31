/* =========================================================================
   PROYECTO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR
   SCRIPT: 06_InsertarDatosMaestros.sql
   REQUERIMIENTOS: RF1–RF4, RA1
   REFERENCIA DOCUMENTACIÓN: Sección 17.8.6 (Página 444)
   DESCRIPCIÓN: Inserción de entidades maestras iniciales requeridas:
     1. Usuarios técnicos y operativos
     2. Asignación de Roles de Usuario (Rol_Usuario)
     3. Servicios de fotocopiado y encuadernación
     4. Proveedores (Particular e Institucional)
     5. Clientes (Particular e Institucional)
     6. Condiciones de crédito autorizadas (Cliente_Condicion_Pago)
     7. Productos de papelería y librería
     8. Catálogo de compra por proveedor (Producto_Proveedor)
   ========================================================================= */

USE MUNDO_ESCOLAR
GO

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
