# Plan Maestro: Modularización de Procedimientos Almacenados y Guía de Verificación en Vivo (SSMS 22)

**Proyecto:** Sistema de Gestión Comercial, Inventario y Analítica — *Librería y Papelería Mundo Escolar*  
**Autores:** Mauricio Chavarría & Samir Campos Díaz  
**Evaluador:** Prof. Torrentes — *Bases de Datos Avanzadas e Inteligencia de Negocios*  
**Objetivo:** Dividir los 110 Procedimientos Almacenados de la base de datos `MUNDO_ESCOLAR` en **6 módulos funcionales independientes**, facilitando su explicación durante la defensa académica y proporcionando las **consultas SELECT de comprobación inmediata en SSMS** para demostrar el impacto físico en las tablas al interactuar con el Frontend.

---

## 1. Estructura de los 6 Módulos Oficiales

| Módulo | Nombre Funcional | Cantidad SPs | Tablas Principales Impactadas | Filegroups Asociados |
| :--- | :--- | :---: | :--- | :--- |
| **Módulo 1** | **Clientes, Proveedores y Compras** | 26 | `Cliente`, `Proveedor`, `Producto_Proveedor`, `Compra`, `Detalle_Compra` | `PRIMARY`, `ME_Catalogos`, `ME_Transaccional` |
| **Módulo 2** | **Productos, Catálogo e Inventario** | 16 | `Producto`, `Categoria`, `Servicio`, `Kardex_Inventario` | `ME_Catalogos`, `ME_Transaccional` |
| **Módulo 3** | **Ventas, Facturación y Pagos** | 16 | `Venta`, `Detalle_Venta`, `Factura`, `Pago`, `Cuenta_Por_Cobrar` | `ME_Transaccional` |
| **Módulo 4** | **Seguridad, Roles y Auditoría Transversal** | 25 | `Usuario`, `Rol`, `Permiso`, `TB_Token_Revocado`, `TB_Historial_Contrasenas`, `Bitacora_Auditoria` | `PRIMARY`, `ME_Auditoria` |
| **Módulo 5** | **Administración de Base de Datos (DBA)** | 11 | `msdb.dbo.backupset`, Vistas Dinámicas (`sys.dm_*`), Filegroups | `PRIMARY` y Almacenamiento Físico |
| **Módulo 6** | **Data Warehouse, ETL y Reportes BI** | 16 | `Dim_Cliente`, `Dim_Producto`, `Fact_Ventas`, `Fact_Inventario`, `Fact_Compras` | `ME_DW` |
| **TOTAL** | **Catálogo Completo del Sistema** | **110** | **42 Tablas Relacionales y Dimensionales** | **5 Filegroups Activos** |

---

## 2. Desglose Detallado por Módulo

---

### MÓDULO 1: Clientes, Proveedores y Compras (26 SPs)

Agrupa el ciclo de abastecimiento, la gestión de socios comerciales y las políticas de crédito comercial.

#### Catálogo de Procedimientos (26)
* **Gestión de Clientes y Crédito (11 SPs):**
  1. `SP_Cliente_CrearPerfil`: Registro de cliente persona física o jurídica con límite crediticio.
  2. `SP_Cliente_Actualizar`: Modificación de datos fiscales y términos comerciales.
  3. `SP_Cliente_Consultar`: Consulta general y filtrado de directorio de clientes.
  4. `SP_Cliente_HistorialOperaciones`: Consulta de ventas y facturas históricas por cliente.
  5. `SP_Cliente_HistorialGeneral`: Resumen consolidado de operaciones y saldo acumulado.
  6. `SP_Cliente_ValidarCapacidadCredito`: Valida límite de crédito y facturas vencidas antes de facturar.
  7. `SP_Cliente_ConsultarEstadoCredito`: Consulta rápida de saldo deudor y disponible sin acceso directo.
  8. `SP_Cliente_ActualizarCorreoUsuario`: Actualiza correo electrónico manteniendo integridad con usuario.
  9. `SP_ClienteCondicionPago_Autorizar`: Otorga plazos de financiamiento (15, 30, 45 días) a instituciones.
  10. `SP_ClienteCondicionPago_Deshabilitar`: Revoca línea de crédito por morosidad o riesgo.
  11. `SP_ClienteCondicionPago_Consultar`: Lista condiciones de pago activas asignadas a un cliente.
* **Proveedores y Órdenes de Compra (15 SPs):**
  12. `SP_Proveedor_Crear`: Registra proveedor institucional (cédula jurídica) o particular.
  13. `SP_Proveedor_Actualizar`: Actualiza información de contacto y términos de entrega.
  14. `SP_Proveedor_Consultar`: Consulta directorio de proveedores homologados.
  15. `SP_ProductoProveedor_Asociar`: Enlaza producto de catálogo con proveedor y precio de compra mayorista.
  16. `SP_ProductoProveedor_Actualizar`: Modifica costo de adquisición y condición de proveedor principal.
  17. `SP_ProductoProveedor_Consultar`: Consulta el catálogo de productos ofrecidos por proveedor.
  18. `SP_ObtenerSugerenciasReabastecimiento`: **Smart Procurement**: Sugiere qué comprar basándose en `Stock_Actual <= Punto_Reorden`.
  19. `SP_Compra_Crear`: Abre una nueva Orden de Compra en estado *Borrador/Pendiente*.
  20. `SP_Compra_AgregarProducto`: Inserta línea de detalle con cantidad y costo unitario pactado.
  21. `SP_Compra_ModificarDetalle`: Modifica cantidades o precios antes de la recepción.
  22. `SP_Compra_EliminarDetalle`: Elimina un ítem de la orden de compra.
  23. `SP_Compra_CalcularTotal`: Recalcula subtotal, impuestos y monto final de la orden.
  24. `SP_Compra_Confirmar`: **Transaccional Crítico**: Confirma recepción física en bodega, crea movimientos de entrada en Kárdex y suma existencias en `dbo.Producto`.
  25. `SP_Compra_Consultar`: Consulta órdenes de compra por proveedor, fecha o estado.
  26. `SP_Compra_Anular`: Anula orden pendiente o genera contra-movimiento auditado.

#### Interacción Frontend vs Consulta en Vivo (SSMS)

> [!NOTE]
> **Acción en Frontend:** En `/compras`, hacer clic en *"Confirmar Ingreso a Bodega"* de una orden pendiente (o emitir una compra desde el Asistente Inteligente).

```sql
-- =========================================================================
-- DEMOSTRACIÓN EN VIVO: MODULO 1 - COMPRAS Y PROVEEDORES
-- =========================================================================
USE MUNDO_ESCOLAR;
GO

-- 1. Verificar la última Orden de Compra recibida y su estado (Estado: 2 = Recibida)
SELECT TOP 1 
    c.Id_Compra,
    c.Numero_Orden,
    prv.Nombre_O_RazonSocial AS Proveedor,
    c.Monto_Total,
    c.Estado,
    c.Fecha_Recepcion,
    u.Nombre_Usuario AS Recibido_Por
FROM dbo.Compra c
INNER JOIN dbo.VW_ProveedoresActivos prv ON c.Id_Proveedor = prv.Id_Proveedor
INNER JOIN dbo.Usuario u ON c.Id_Usuario = u.Id_Usuario
ORDER BY c.Id_Compra DESC;

-- 2. Verificar el ingreso automático en el Kárdex de Inventario (Tipo: Entrada / Compra)
SELECT TOP 3 
    k.Id_Kardex,
    k.Fecha_Movimiento,
    p.Nombre AS Producto,
    k.Tipo_Movimiento,
    k.Cantidad,
    k.Stock_Previo,
    k.Stock_Posterior,
    k.Referencia_Documento
FROM dbo.Kardex_Inventario k
INNER JOIN dbo.Producto p ON k.Id_Producto = p.Id_Producto
ORDER BY k.Id_Kardex DESC;

-- 3. Verificar el registro inmutable en la Bitácora de Auditoría Transversal
SELECT TOP 1 
    Id_Bitacora,
    Fecha_Hora,
    Usuario,
    Accion,
    Tabla_Afectada,
    Registro_Id,
    Descripcion
FROM dbo.Bitacora_Auditoria
WHERE Tabla_Afectada = 'Compra'
ORDER BY Id_Bitacora DESC;
```

---

### MÓDULO 2: Productos, Catálogo e Inventario (16 SPs)

Gestiona la clasificación de artículos, tarifas de servicios escolares, mermas, tomas físicas y la inmutabilidad del Kárdex.

#### Catálogo de Procedimientos (16)
* **Catálogo y Servicios (10 SPs):**
  27. `SP_Categoria_Crear`: Alta de categorías de papelería, cuadernos, arte, etc.
  28. `SP_Categoria_Actualizar`: Mantenimiento y estado de categorías.
  29. `SP_Producto_Crear`: Registra producto, asignando tasa de IVA (2% libros o 13% general) y punto de reorden.
  30. `SP_Producto_Actualizar`: Modifica precio de venta al público (PVP) o umbrales de stock.
  31. `SP_Producto_Consultar`: Consulta catálogo con disponibilidad física y alertas de reorden.
  32. `SP_Producto_CambiarEstado`: Habilitación / inhabilitación lógica de producto.
  33. `SP_Servicio_Crear`: Registra servicios (fotocopiado escolar, anillado, plastificado).
  34. `SP_Servicio_Actualizar`: Ajusta costo y precio de venta del servicio.
  35. `SP_Servicio_Consultar`: Consulta de servicios escolares disponibles.
  36. `SP_Servicio_Desactivar`: Desactiva servicio temporalmente fuera de línea.
* **Movimientos de Inventario y Kárdex (6 SPs):**
  37. `SP_Inventario_Entrada`: Entrada manual de stock por donación, ajuste contable o hallazgo.
  38. `SP_Inventario_Salida`: Salida manual por merma, daño de material o uso interno.
  39. `SP_Inventario_Ajustar`: Ajuste por conciliación de toma física (con registro auditado).
  40. `SP_Inventario_ConsultarMovimientos`: Libro diario de Kárdex para control contable.
  41. `SP_Inventario_ProductosBajoReorden`: Filtra productos que alcanzaron o rompieron el umbral mínimo.
  42. `SP_Inventario_RevertirMovimiento`: Reversa técnica justificada de movimiento erróneo.

#### Interacción Frontend vs Consulta en Vivo (SSMS)

> [!NOTE]
> **Acción en Frontend:** En `/inventario`, ajustar el stock de un producto (ej. reportar merma de 2 cuadernos dañados).

```sql
-- =========================================================================
-- DEMOSTRACIÓN EN VIVO: MODULO 2 - INVENTARIO Y KARDEX
-- =========================================================================
USE MUNDO_ESCOLAR;
GO

-- 1. Comprobar el ajuste en la tabla Producto (Stock Físico)
SELECT 
    Id_Producto,
    Nombre,
    Stock_Actual,
    Punto_Reorden,
    Precio_Venta,
    Estado
FROM dbo.Producto
WHERE Id_Producto = 14; -- Ejemplo: Cuaderno Escolar

-- 2. Inspeccionar el asiento en el Kárdex generado por el SP
SELECT TOP 1 
    Id_Kardex,
    Fecha_Movimiento,
    Tipo_Movimiento,
    Cantidad,
    Stock_Previo,
    Stock_Posterior,
    Motivo,
    Referencia_Documento
FROM dbo.Kardex_Inventario
WHERE Id_Producto = 14
ORDER BY Id_Kardex DESC;

-- 3. Confirmar que el trigger o SP auditó el cambio de stock
SELECT TOP 1 
    Fecha_Hora,
    Usuario,
    Accion,
    Tabla_Afectada,
    Registro_Id,
    Descripcion
FROM dbo.Bitacora_Auditoria
WHERE Tabla_Afectada = 'Producto' AND Registro_Id = 14
ORDER BY Id_Bitacora DESC;
```

---

### MÓDULO 3: Ventas, Facturación y Pagos (16 SPs)

Controla el flujo de caja, la venta en mostrador (POS), la validación de crédito, la facturación electrónica conforme a la DGT y el recaudo de cartera (CxC).

#### Catálogo de Procedimientos (16)
* **Ciclo de Venta en Mostrador (9 SPs):**
  43. `SP_Venta_Crear`: Inicia carrito de venta en estado *Borrador* asignado a un cajero y cliente.
  44. `SP_Venta_AgregarProducto`: Agrega producto verificando existencias físicas en tiempo real.
  45. `SP_Venta_AgregarServicio`: Agrega servicio escolar (no consume stock, pero suma a la venta e IVA).
  46. `SP_Venta_ModificarDetalle`: Modifica cantidades en el carrito antes de facturar.
  47. `SP_Venta_EliminarDetalle`: Quita producto o servicio de la transacción en curso.
  48. `SP_Venta_CalcularTotales`: Aplica discriminación de tarifas de IVA (0%, 2% Ley 9635, 13% estándar).
  49. `SP_Venta_Confirmar`: **Transaccional Central**: Cierra la venta, rebaja unidades de `Producto`, genera salida de Kárdex y habilita la facturación.
  50. `SP_Venta_Consultar`: Consulta ventas realizadas con filtros de fecha, cajero y monto.
  51. `SP_Venta_Anular`: Anulación justificada con reversión automática al Kárdex de inventario.
* **Facturación Electrónica y Cartera (7 SPs):**
  52. `SP_Factura_Generar`: Genera la **Clave Numérica de 50 dígitos** reglamentaria de Hacienda y el consecutivo fiscal oficial.
  53. `SP_Factura_Consultar`: Consulta comprobantes electrónicos generados.
  54. `SP_Pago_Registrar`: Asienta el cobro (Efectivo, Tarjeta, SINPE Móvil o Crédito institucional). Si es crédito, alimenta `Cuenta_Por_Cobrar`.
  55. `SP_Pago_Consultar`: Recibos de caja y conciliación de turno de cajero.
  56. `SP_Pago_ConsultarPorFactura`: Consulta abonos parciales aplicados a una factura a crédito.
  57. `SP_CuentaPorCobrar_Consultar`: Cartera pendiente de cobro por cliente e institución.
  58. `SP_CuentaPorCobrar_Vencidas`: Monitoreo de facturas morosas con cálculo de días de atraso.

#### Interacción Frontend vs Consulta en Vivo (SSMS)

> [!NOTE]
> **Acción en Frontend:** En `/caja` (Punto de Venta), agregar 1 Cuaderno y 1 Lapicero, seleccionar cliente y presionar *"Completar Venta y Emitir Factura"*.

```sql
-- =========================================================================
-- DEMOSTRACIÓN EN VIVO: MODULO 3 - POS, FACTURACIÓN Y PAGOS
-- =========================================================================
USE MUNDO_ESCOLAR;
GO

-- 1. Ver la Venta cerrada y confirmada
SELECT TOP 1 
    v.Id_Venta,
    v.Fecha_Venta,
    c.Nombre_O_RazonSocial AS Cliente,
    v.Subtotal,
    v.Impuesto,
    v.Total,
    v.Estado
FROM dbo.Venta v
INNER JOIN dbo.VW_ClientesActivos c ON v.Id_Cliente = c.Id_Cliente
ORDER BY v.Id_Venta DESC;

-- 2. Ver la Factura Electrónica con su Clave Numérica de 50 dígitos (Ley 9635 DGT)
SELECT TOP 1 
    f.Id_Factura,
    f.Numero_Consecutivo,
    f.Clave_Numerica_Fiscal,
    LEN(f.Clave_Numerica_Fiscal) AS Longitud_Clave, -- Debe ser exactamente 50
    f.Monto_Total,
    f.Saldo_Pendiente,
    f.Estado_Factura
FROM dbo.Factura f
ORDER BY f.Id_Factura DESC;

-- 3. Ver el Pago asentado (Método: 1=Efectivo, 2=Tarjeta, 3=SINPE)
SELECT TOP 1 
    p.Id_Pago,
    p.Fecha_Pago,
    p.Id_Factura,
    p.Monto,
    mp.Nombre AS Metodo_Pago,
    p.Referencia_Transaccion
FROM dbo.Pago p
INNER JOIN dbo.Metodo_Pago mp ON p.Id_Metodo_Pago = mp.Id_Metodo_Pago
ORDER BY p.Id_Pago DESC;

-- 4. Ver la salida correspondiente en Kárdex originada por la Venta
SELECT TOP 2 
    k.Id_Kardex,
    pr.Nombre AS Articulo,
    k.Tipo_Movimiento,
    k.Cantidad,
    k.Stock_Posterior,
    k.Referencia_Documento
FROM dbo.Kardex_Inventario k
INNER JOIN dbo.Producto pr ON k.Id_Producto = pr.Id_Producto
WHERE k.Tipo_Movimiento = 'SALIDA'
ORDER BY k.Id_Kardex DESC;
```

---

### MÓDULO 4: Seguridad, Roles y Auditoría Transversal (25 SPs)

Implementa la arquitectura Zero-Trust, el control de acceso basado en roles (RBAC), el estándar PoLP (*Principle of Least Privilege*), la revocación criptográfica de tokens JWT y la auditoría forense inmutable.

#### Catálogo de Procedimientos (25)
* **Autenticación y Credenciales (9 SPs):**
  59. `SP_Usuario_Crear`: Registro de operadores con hashing y salting criptográfico.
  60. `SP_Usuario_Consultar`: Consulta de estado de cuentas de usuario.
  61. `SP_Usuario_ObtenerPorId`: Obtención de datos de perfil para el frontend.
  62. `SP_Usuario_ObtenerParaAutenticacion`: Proceso de Login: extrae hash y sal para comparación segura.
  63. `SP_Usuario_ObtenerHashParaCambio`: Verificación previa de clave actual.
  64. `SP_Usuario_CambiarContrasena`: Actualiza hash e inserta la clave previa en `TB_Historial_Contrasenas`.
  65. `SP_Usuario_ConsultarHistorialContrasenas`: Impide la reutilización de las últimas contraseñas (norma NIST).
  66. `SP_Usuario_Desactivar`: Baja lógica inmediata de una cuenta por seguridad.
  67. `SP_Usuario_VerificarDisponibilidad`: Validación de nombre de usuario único en tiempo real.
* **Gestión de Sesión y Tokens Revocados (2 SPs):**
  68. `SP_Token_Revocar`: Almacena el `jti` del token JWT revocado en `TB_Token_Revocado` con su fecha de expiración.
  69. `SP_Token_VerificarRevocado`: Middleware SQL que valida si el token entrante ya fue invalidado.
* **Roles, Permisos y Matriz RBAC (12 SPs):**
  70. `SP_Rol_Crear`: Creación de nuevos perfiles funcionales.
  71. `SP_Rol_Actualizar`: Mantenimiento de perfiles.
  72. `SP_Rol_Consultar`: Directorio de roles del sistema.
  73. `SP_Rol_AsignarPermiso`: Vinculación granular rol-privilegio.
  74. `SP_Rol_RemoverPermiso`: Desvinculación de privilegio.
  75. `SP_Rol_ConsultarMatriz`: Devuelve la matriz bidimensional completa de permisos por rol para el frontend.
  76. `SP_Usuario_AsignarRol`: Asignación de rol a un usuario.
  77. `SP_Usuario_RemoverRol`: Revocación de rol.
  78. `SP_Permiso_Crear`: Definición de nuevo privilegio de interfaz o backend.
  79. `SP_Permiso_Actualizar`: Mantenimiento de privilegios.
  80. `SP_Permiso_Consultar`: Catálogo general de permisos del sistema.
  81. `SP_Permiso_ConsultarUsuario`: Resolución en tiempo de ejecución de permisos de la sesión activa.
* **Auditoría Transversal (2 SPs):**
  82. `SP_Auditoria_Registrar`: Inserta eventos forenses en `Bitacora_Auditoria` en el filegroup `ME_Auditoria`.
  83. `SP_Auditoria_Consultar`: Consulta con filtros por usuario, fecha, tabla y rango para `/auditoria`.

#### Interacción Frontend vs Consulta en Vivo (SSMS)

> [!NOTE]
> **Acción en Frontend:** En el menú superior, hacer clic en *"Cerrar Sesión"* (Logout) o cambiar la contraseña del usuario en su perfil.

```sql
-- =========================================================================
-- DEMOSTRACIÓN EN VIVO: MODULO 4 - SEGURIDAD Y AUDITORÍA
-- =========================================================================
USE MUNDO_ESCOLAR;
GO

-- 1. Verificar la revocación del Token JWT en la tabla técnica de seguridad
SELECT TOP 3 
    Id_Revocado,
    Token_Id_JTI,
    Fecha_Revocacion,
    Fecha_Expiracion,
    Motivo
FROM dbo.TB_Token_Revocado
ORDER BY Id_Revocado DESC;

-- 2. Verificar el Historial de Contraseñas (prevención de reuso NIST)
SELECT TOP 3 
    h.Id_Historial,
    u.Nombre_Usuario,
    h.Password_Hash,
    h.Fecha_Creacion
FROM dbo.TB_Historial_Contrasenas h
INNER JOIN dbo.Usuario u ON h.Id_Usuario = u.Id_Usuario
ORDER BY h.Id_Historial DESC;

-- 3. Consultar la Bitácora de Auditoría Transversal (almacenada en Filegroup ME_Auditoria)
SELECT TOP 5 
    Id_Bitacora,
    Fecha_Hora,
    Usuario,
    Accion,
    Tabla_Afectada,
    Registro_Id,
    Descripcion
FROM dbo.Bitacora_Auditoria
ORDER BY Id_Bitacora DESC;
```

---

### MÓDULO 5: Administración DBA, Mantenimiento y Backups (11 SPs)

Cubre la resiliencia operativa, la estrategia de recuperación ante desastres (RPO / RTO), la fragmentación de índices y el monitoreo de recursos físicos.

#### Catálogo de Procedimientos (11)
* **Estrategia de Backups y Recuperación (4 SPs):**
  84. `SP_DBA_EjecutarBackupCompleto`: Realiza backup FULL con compresión nativa y `CHECKSUM`.
  85. `SP_DBA_EjecutarBackupDiferencial`: Captura extents modificados desde el último backup completo.
  86. `SP_DBA_EjecutarBackupLog`: Respalda el log de transacciones y trunca la bitácora activa para evitar llenado de disco.
  87. `SP_DBA_ConsultarHistorialBackups`: Consulta las tablas del sistema `msdb.dbo.backupset` y `backupmediafamily`.
* **Integridad Física y Mantenimiento (3 SPs):**
  88. `SP_DBA_VerificarIntegridadBD`: Ejecuta `DBCC CHECKDB` reportando consistencia de asignación y páginas de datos.
  89. `SP_DBA_VerificarIntegridadBackup`: Ejecuta `RESTORE VERIFYONLY` para garantizar que los `.bak` son restaurables.
  90. `SP_DBA_MantenimientoIndices`: Analiza `avg_fragmentation_in_percent`: si $>30\%$ ejecuta `REBUILD`, si entre $10\%$ y $30\%$ ejecuta `REORGANIZE`.
* **Salud del Servidor y Gobernanza (4 SPs):**
  91. `SP_DBA_ActualizarEstadisticas`: Ejecuta `sp_updatestats` para renovar histogramas del optimizador de consultas.
  92. `SP_DBA_MonitorearEspacioArchivos`: Supervisa el crecimiento y espacio libre de los 5 archivos físicos (`.mdf` y `.ndf`).
  93. `SP_DBA_MonitorearBloqueosYSesiones`: Detecta bloqueos concurrentes (`sys.dm_tran_locks`) y cuellos de botella.
  94. `SP_DBA_AuditoriaPermisosFallidos`: Detecta intentos denegados de acceso o violación de permisos.

#### Interacción Frontend / SSMS vs Consulta en Vivo

> [!NOTE]
> **Acción en Exposición:** Ejecutar el backup completo o consultar la salud de los Filegroups.

```sql
-- =========================================================================
-- DEMOSTRACIÓN EN VIVO: MODULO 5 - ADMINISTRACIÓN DBA Y MONITOREO
-- =========================================================================
USE MUNDO_ESCOLAR;
GO

-- 1. Ejecutar Backup Diferencial en vivo
EXEC dbo.SP_DBA_EjecutarBackupDiferencial;

-- 2. Consultar el Historial de Respaldos registrados en MSDB
EXEC dbo.SP_DBA_ConsultarHistorialBackups;

-- 3. Monitorear el Espacio Físico ocupado por los Filegroups
EXEC dbo.SP_DBA_MonitorearEspacioArchivos;

-- 4. Comprobar la fragmentación de índices del catálogo
EXEC dbo.SP_DBA_MantenimientoIndices;
```

---

### MÓDULO 6: Data Warehouse, ETL y Reportes Analíticos (16 SPs)

Implementa la arquitectura dimensional Kimball, la extracción, transformación y carga (ETL), el versionado histórico de clientes mediante **SCD Tipo 2**, y la orquestación analítica para Power BI.

#### Catálogo de Procedimientos (16)
* **Carga de Dimensiones Analíticas (8 SPs):**
  95. `SP_ETL_CargarDimFecha`: Pobla la dimensión tiempo con calendario comercial y trimestres.
  96. `SP_ETL_CargarDimCliente`: **SCD Tipo 2 Riguroso**: Detecta cambios en límite de crédito, cierra registro previo con `Fecha_Fin` e inserta nueva versión con `Es_Actual = 1`.
  97. `SP_ETL_CargarDimProducto`: Extrae catálogo de productos y categorías hacia `Dim_Producto`.
  98. `SP_ETL_CargarDimServicio`: Carga dimensión de servicios escolares.
  99. `SP_ETL_CargarDimProveedor`: Carga dimensión proveedores institucionales y particulares.
  100. `SP_ETL_CargarDimCondicionPago`: Carga términos comerciales a crédito.
  101. `SP_ETL_CargarDimVendedor`: Carga dimensión colaboradores de caja y mostrador.
  102. `SP_ETL_CargarDimMetodoPago`: Carga dimensión métodos financieros de recaudo.
* **Carga de Tablas de Hechos (Facts) (5 SPs):**
  103. `SP_ETL_CargarFactVentas`: Carga transacciones de ventas aplicando búsqueda *Point-in-Time* en `Dim_Cliente` SCD2.
  104. `SP_ETL_CargarFactVentaProducto`: Hechos granulares a nivel de producto vendido, costo y margen bruto.
  105. `SP_ETL_CargarFactVentaServicio`: Hechos de rentabilidad en servicios escolares.
  106. `SP_ETL_CargarFactPagos`: Hechos de flujo de caja, cobranza y plazos de amortización.
  107. `SP_ETL_CargarFactCompras`: Hechos de compras a proveedores con análisis de cumplimiento de entrega.
  108. `SP_ETL_CargarFactInventario`: Reconstrucción retroactiva de existencias y valorización diaria de bodega.
* **Orquestación y Calidad Analítica (2 SPs):**
  109. `SP_ETL_OrquestarCargaCompleta`: **Pipeline Maestro**: Ejecuta en orden de dependencia las 8 dimensiones y luego las 6 tablas de hechos, calculando tiempos de ejecución y registrando el resultado en la bitácora.
  110. `SP_ETL_ValidarConciliacionCargas`: Control de calidad: Compara el total en colones facturado en el OLTP versus el total cargado en `Fact_Ventas`.

#### Interacción Frontend / SSMS vs Consulta en Vivo

> [!NOTE]
> **Acción en Exposición:** Ejecutar el pipeline de ETL completo y abrir el informe analítico o consultar la conciliación en SSMS.

```sql
-- =========================================================================
-- DEMOSTRACIÓN EN VIVO: MODULO 6 - DATA WAREHOUSE Y RECONCILIACIÓN
-- =========================================================================
USE MUNDO_ESCOLAR;
GO

-- 1. Disparar la Orquestación Completa del Data Warehouse (Pipeline Kimball)
EXEC dbo.SP_ETL_OrquestarCargaCompleta;

-- 2. Validar la Conciliación Matemática (OLTP vs Fact_Ventas en DW)
EXEC dbo.SP_ETL_ValidarConciliacionCargas;

-- 3. Demostrar el SCD Tipo 2 en Dim_Cliente (Versionado Histórico)
SELECT 
    SK_Cliente,
    Id_Cliente_BK,
    Nombre_Cliente,
    Limite_Credito,
    Fecha_Inicio,
    Fecha_Fin,
    Es_Actual
FROM dbo.Dim_Cliente
ORDER BY Id_Cliente_BK, SK_Cliente;

-- 4. Consultar los Hechos Consolidados en Fact_Ventas
SELECT TOP 5 
    SK_Venta,
    Id_Venta_BK,
    SK_Fecha,
    SK_Cliente,
    Monto_Total,
    Monto_Impuesto,
    Margen_Bruto_Total
FROM dbo.Fact_Ventas
ORDER BY SK_Venta DESC;
```

---

## 3. Plan de Creación de Archivos Físicos en el Repositorio

Para que durante la exposición no tengas que buscar entre las 4,400 líneas del archivo consolidado `10_CrearProcedimientos.sql`, se crearán **6 scripts modulares independientes** en la carpeta:

```text
C:\MUNDO_ESCOLAR\sql\05_modulos_procedimientos\
 ├── 01_Modulo_Clientes_Proveedores_Compras.sql   (26 SPs)
 ├── 02_Modulo_Productos_Inventario.sql           (16 SPs)
 ├── 03_Modulo_Ventas_Facturacion_Pagos.sql       (16 SPs)
 ├── 04_Modulo_Seguridad_Auditoria.sql            (25 SPs)
 ├── 05_Modulo_Administracion_DBA.sql             (11 SPs)
 ├── 06_Modulo_DataWarehouse_ETL_Reportes.sql     (16 SPs)
 └── 00_CONSULTAS_VERIFICACION_EN_VIVO.sql        (Script Maestro de SELECTs para SSMS)
```

### Ventajas Estratégicas para la Exposición con Torrentes
1. **Pestañas dedicadas en SSMS 22:** Puedes tener abiertas las 6 pestañas en el editor de SQL Server. Cuando Torrentes pregunte por una funcionalidad específica, pasas a la pestaña correspondiente en 1 segundo.
2. **Independencia Operativa:** Cada script utiliza la sintaxis `CREATE OR ALTER PROCEDURE`, por lo que si necesitas modificar o explicar uno, lo ejecutas de forma instantánea sin tocar el resto del sistema.
3. **Pestaña de Verificación Rápida (`00_CONSULTAS_VERIFICACION_EN_VIVO.sql`):** Tendrás un único archivo con todos los bloques de `SELECT` listos con comentarios claros; al hacer una acción en React, cambias a esa pestaña, presionas `F5` y le enseñas a Torrentes cómo la fila apareció al instante en SQL Server.
4. **Cero Impacto al Despliegue Automatizado:** El script original `10_CrearProcedimientos.sql` permanece intacto para los scripts `.bat` de instalación automática, garantizando que el entorno no sufra ninguna alteración destructiva.
