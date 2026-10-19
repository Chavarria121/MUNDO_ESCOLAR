# Librería y Papelería Mundo Escolar
## Sistema Integral de Base de Datos Transaccional (OLTP) y Analítica (Data Warehouse)
**Motor:** Microsoft SQL Server 2022 | **Modelo Relacional:** 33 Tablas en 3FN | **Versión:** 2.0 Oficial

---

### Resumen Ejecutivo
Este repositorio contiene la arquitectura completa, normalizada y certificada de la base de datos para la empresa **Librería y Papelería Mundo Escolar**, diseñada en estricto cumplimiento de la documentación de ingeniería de software (tesis de 548 páginas, catálogo de objetos de base de datos y diseño del Data Warehouse).

El sistema sustituye la versión preliminar de 26 tablas por el modelo oficial de **33 tablas en Tercera Forma Normal (3FN)**, garantizando la eliminación de redundancias, la integridad referencial y una separación rigurosa de responsabilidades entre transaccionalidad (OLTP), auditoría forense y análisis gerencial (BI / DW).

---

### Métricas de la Base de Datos

| Componente | Cantidad | Descripción |
| :--- | :---: | :--- |
| **Tablas Relacionales** | **33** | Modeladas en 3FN, organizadas en 9 subsistemas funcionales. |
| **Restricciones (Constraints)** | **108** | 37 Foreign Keys (`FK_`), 28 Unique (`UQ_`), 25 Checks (`CK_`), 18 Defaults (`DF_`). |
| **Índices de Cobertura** | **22** | Non-clustered indexes sobre llaves foráneas, rangos de fechas y estados. |
| **Funciones de Usuario (UDF)** | **15** | 7 escalares (cálculos, IVA, totales) y 8 de tabla (TVF operativas y analíticas). |
| **Vistas del Sistema** | **19** | 8 vistas operativas y 11 vistas analíticas para reportes ejecutivos. |
| **Procedimientos Almacenados** | **91** | Catálogo completo con transaccionalidad ACID (`TRY...CATCH`, `XACT_ABORT ON`). |
| **Disparadores (Triggers)** | **16** | Auditoría pura multi-fila sobre la tabla `Bitacora` vía `SESSION_CONTEXT`. |
| **Roles y Seguridad** | **5 / 7** | 5 Roles (`Rol_Administrador`, `Rol_Gerencia`, etc.) y 7 usuarios con privilegios mínimos. |
| **Scripts de Prueba** | **12** | Suite de validación de integridad, restricciones, concurrencia y auditoría. |
| **Data Warehouse (DW)** | **Constelación** | 4 Tablas de Hechos, 7 Dimensiones compartidas y procedimientos ETL. |

---

### Catálogo de las 33 Tablas Relacionales (3FN)

| # | Tabla | PK | Dominio Funcional | Descripción |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `Empresa` | `Id_Empresa` | Configuración | Datos corporativos, NIT, moneda y configuración global. |
| 2 | `Sucursal` | `Id_Sucursal` | Configuración | Puntos de venta físicos, bodegas y datos de contacto. |
| 3 | `Rol` | `Id_Rol` | Seguridad | Catálogo de roles de seguridad (Administrador, Cajero, etc.). |
| 4 | `Permiso` | `Id_Permiso` | Seguridad | Permisos atómicos sobre módulos y operaciones del sistema. |
| 5 | `Rol_Permiso` | `Id_Rol_Permiso` | Seguridad | Matriz N:M que asocia roles con sus permisos autorizados. |
| 6 | `Usuario` | `Id_Usuario` | Seguridad | Cuentas de usuario con contraseñas encriptadas en SHA2_256. |
| 7 | `Rol_Usuario` | `Id_Rol_Usuario` | Seguridad | Asignación de uno o más roles por cuenta de usuario. |
| 8 | `Persona` | `Id_Persona` | Personas | Entidad generalizada para personas naturales (cédula, nombres). |
| 9 | `Empleado` | `Id_Empleado` | Personas | Datos laborales, cargo, fecha de contratación y sueldo. |
| 10 | `Cliente` | `Id_Cliente` | Clientes | Entidad base de clientes con saldo, límite de crédito y tipo. |
| 11 | `Cliente_Natural` | `Id_Cliente_Natural` | Clientes | Subtipo: Clientes particulares asociados a `Persona`. |
| 12 | `Cliente_Juridico` | `Id_Cliente_Juridico` | Clientes | Subtipo: Empresas, colegios e instituciones con NIT y razón social. |
| 13 | `Categoria` | `Id_Categoria` | Inventario | Familias de artículos (Útiles, Papelería, Libros, etc.). |
| 14 | `Subcategoria` | `Id_Subcategoria` | Inventario | Clasificación detallada dependiente de la categoría. |
| 15 | `Marca` | `Id_Marca` | Inventario | Fabricantes y marcas registradas de los productos. |
| 16 | `Unidad_Medida` | `Id_Unidad_Medida` | Inventario | Unidades de medida (Unidad, Caja, Resma, Docena, etc.). |
| 17 | `Producto` | `Id_Producto` | Inventario | Catálogo maestro de productos, códigos de barras y precios. |
| 18 | `Inventario` | `Id_Inventario` | Inventario | Existencias físicas, stock mínimo/máximo por sucursal. |
| 19 | `Movimiento_Inventario` | `Id_Movimiento` | Inventario | Registro de entradas, salidas, traslados y ajustes de stock. |
| 20 | `Servicio` | `Id_Servicio` | Servicios | Servicios de fotocopiado, impresión, encuadernación, etc. |
| 21 | `Proveedor` | `Id_Proveedor` | Proveedores | Empresas proveedoras de insumos, papelería y mercadería. |
| 22 | `Contacto_Proveedor` | `Id_Contacto` | Proveedores | Personas de contacto comercial y técnico por proveedor. |
| 23 | `Producto_Proveedor` | `Id_Prod_Prov` | Proveedores | Catálogo de precios de compra pactados y tiempos de entrega. |
| 24 | `Orden_Compra` | `Id_Orden` | Compras | Solicitudes y órdenes de compra emitidas a proveedores. |
| 25 | `Detalle_Orden_Compra` | `Id_Detalle_OC` | Compras | Ítems, cantidades solicitadas y precios unitarios de la orden. |
| 26 | `Venta` | `Id_Venta` | Ventas | Cabecera de la transacción de venta (cliente, fecha, total). |
| 27 | `Detalle_Venta_Producto` | `Id_Detalle_VP` | Ventas | Renglones de productos vendidos, cantidades y descuentos. |
| 28 | `Detalle_Venta_Servicio` | `Id_Detalle_VS` | Ventas | Renglones de servicios prestados y tarifas aplicadas. |
| 29 | `Factura` | `Id_Factura` | Facturación | Comprobante fiscal formal vinculado a la venta. |
| 30 | `Metodo_Pago` | `Id_Metodo_Pago` | Facturación | Catálogo de medios de pago (Efectivo, Tarjeta, Transferencia). |
| 31 | `Pago` | `Id_Pago` | Facturación | Transacciones de cobro totales o parciales por factura. |
| 32 | `Devolucion` | `Id_Devolucion` | Posventa | Registro de devoluciones de productos por garantía o cambio. |
| 33 | `Bitacora` | `Id_Bitacora` | Auditoría | Registro forense de operaciones DML con valores previos y nuevos. |

---

### Estructura de Scripts y Opciones de Despliegue

Los scripts se encuentran centralizados en el directorio `C:\MUNDO_ESCOLAR\sql\`. Se ofrecen dos modalidades de instalación completamente equivalentes y sincronizadas:

```
C:\MUNDO_ESCOLAR\
├── docs/                             # Especificaciones de ingeniería y arquitectura
├── sql/                              # Suite completa de scripts SQL Server 2022
│   ├── 01_CrearBaseDatos.sql         # [Modular 01] Creación de BD con parámetros de archivo (MDF 3GB, LDF 1GB)
│   ├── 02_CrearEsquemas.sql          # [Modular 02] Esquema dbo y preparación de namespaces
│   ├── 03_CrearTablas.sql            # [Modular 03] DDL de las 33 tablas en 3FN con PKs
│   ├── 04_CrearConstraints.sql       # [Modular 04] 108 restricciones (FK, UQ, CK, DF)
│   ├── 05_CrearCatalogos.sql         # [Modular 05] Semillas de catálogos y matriz Rol_Permiso
│   ├── 06_InsertarDatosMaestros.sql  # [Modular 06] Cuentas maestras, roles, servicios, clientes y proveedores
│   ├── 07_CrearIndices.sql           # [Modular 07] Índices no agrupados para optimización de consultas
│   ├── 08_CrearFunciones.sql         # [Modular 08] 15 Funciones de negocio (7 escalares + 8 de tabla)
│   ├── 09_CrearVistas.sql            # [Modular 09] 19 Vistas operativas y gerenciales
│   ├── 10_CrearProcedimientos.sql    # [Modular 10] 91 Stored Procedures con transacciones ACID
│   ├── 11_CrearTriggers.sql          # [Modular 11] 16 Triggers de auditoría pura en Bitacora
│   ├── 12_ValidarInstalacion.sql     # [Modular 12] Validación de integridad y conteo de objetos instalados
│   ├── 13_InsertarDatosDemostracion.sql # [Modular 13] Transacciones operativas de prueba (ventas, compras, pagos)
│   │
│   ├── Estructura.sql                # [Consolidado DDL] 01 + 02 + 03 + 04 (Base de datos, esquemas, tablas y constraints)
│   ├── Inserciones.sql               # [Consolidado DML] 05 + 06 + 13 (Catálogos, maestros y datos de demostración)
│   ├── Reportes.sql                  # [Consolidado Logic] 08 + 09 (Todas las funciones y vistas)
│   ├── Procedimientos_Almacenados.sql# [Consolidado SP] Los 91 procedimientos almacenados completos
│   ├── Triggers.sql                  # [Consolidado Triggers] Los 16 disparadores de auditoría
│   ├── Seguridad.sql                 # [Seguridad] Creación de Logins, Usuarios, Roles y asignación de permisos
│   ├── Mantenimiento_Backups.sql     # [DBA] Rutinas de respaldo (Full/Diff/Log), DBCC CHECKDB e index defrag
│   ├── Pruebas_Validacion.sql        # [QA] Suite de 12 pruebas unitarias y de integración transaccional
│   └── DW_Constelacion.sql           # [BI] Modelo Data Warehouse Constelación (4 Hechos, 7 Dim) y ETL
└── README.md                         # Este documento
```

---

### Instrucciones de Ejecución

#### Modalidad A: Instalación Modular por Fases (Recomendado para CI/CD y despliegue paso a paso)
Abra **SQL Server Management Studio (SSMS 20)** o **Azure Data Studio** conectado a una instancia de SQL Server 2022 con privilegios de `sysadmin` (`sa`) y ejecute en el siguiente orden secuencial:

1. **`01_CrearBaseDatos.sql`** — Inicializa la base de datos `MUNDO_ESCOLAR` y el tipo de dato de usuario `BOOL`.
2. **`02_CrearEsquemas.sql`** — Asegura el esquema relacional principal.
3. **`03_CrearTablas.sql`** — Crea las 33 tablas relacionales con sus Primary Keys (`PK_`).
4. **`04_CrearConstraints.sql`** — Aplica las 108 restricciones de integridad referencial, unicidad, validación y defaults.
5. **`05_CrearCatalogos.sql`** — Carga los datos de referencia (empresa, sucursales, roles, métodos de pago, etc.).
6. **`06_InsertarDatosMaestros.sql`** — Registra usuarios iniciales, clientes (naturales y jurídicos), proveedores y catálogo de productos.
7. **`07_CrearIndices.sql`** — Crea los 22 índices no agrupados estratégicos sobre FKs y campos de búsqueda frecuente.
8. **`08_CrearFunciones.sql`** — Compila las 15 funciones de negocio (cálculos de inventario, ventas y saldos).
9. **`09_CrearVistas.sql`** — Compila las 19 vistas operativas y de reportes gerenciales.
10. **`10_CrearProcedimientos.sql`** — Compila los 91 Stored Procedures con manejo de transacciones ACID.
11. **`11_CrearTriggers.sql`** — Activa los 16 triggers de auditoría automática hacia la tabla `Bitacora`.
12. **`Seguridad.sql`** — Configura logins, usuarios de BD y la matriz de seguridad basada en roles (RBAC).
13. **`12_ValidarInstalacion.sql`** — Ejecuta la verificación técnica no destructiva comparando los objetos creados contra la meta.
14. **`13_InsertarDatosDemostracion.sql`** *(Opcional)* — Carga transacciones simuladas de compras, ventas y pagos.
15. **`Pruebas_Validacion.sql`** *(Opcional)* — Ejecuta la batería de pruebas automatizadas y reporta el estado de integridad.
16. **`DW_Constelacion.sql`** *(Opcional)* — Crea el almacén analítico `DW_MundoEscolar` y ejecuta la carga inicial ETL.

---

#### Modalidad B: Instalación Rápida Consolidada ("Todo-en-Uno")
Para un aprovisionamiento ágil de ambientes de desarrollo o pruebas:

```sql
-- 1. Crear estructura completa (Base de datos + 33 Tablas + 108 Constraints)
:r "C:\MUNDO_ESCOLAR\sql\Estructura.sql"

-- 2. Cargar todos los datos maestros, catálogos y transacciones de demostración
:r "C:\MUNDO_ESCOLAR\sql\Inserciones.sql"

-- 3. Crear índices de optimización
:r "C:\MUNDO_ESCOLAR\sql\07_CrearIndices.sql"

-- 4. Crear funciones y vistas de reportería
:r "C:\MUNDO_ESCOLAR\sql\Reportes.sql"

-- 5. Compilar los 91 Procedimientos Almacenados
:r "C:\MUNDO_ESCOLAR\sql\Procedimientos_Almacenados.sql"

-- 6. Compilar los 16 Triggers de auditoría
:r "C:\MUNDO_ESCOLAR\sql\Triggers.sql"

-- 7. Aplicar la política de seguridad y roles
:r "C:\MUNDO_ESCOLAR\sql\Seguridad.sql"

-- 8. Validar la instalación
:r "C:\MUNDO_ESCOLAR\sql\12_ValidarInstalacion.sql"

-- 9. Ejecutar pruebas automatizadas
:r "C:\MUNDO_ESCOLAR\sql\Pruebas_Validacion.sql"

-- 10. Desplegar el Data Warehouse
:r "C:\MUNDO_ESCOLAR\sql\DW_Constelacion.sql"
```

---

### Arquitectura de Negocio y Reglas Técnicas

1. **Gestión de Identidades y Subtipos:**
   - La entidad `Cliente` utiliza generalización/especialización exclusiva mediante `Tipo_Cliente IN ('NATURAL', 'JURIDICO')`.
   - `Cliente_Natural` enlaza a `Persona` (persona física con cédula).
   - `Cliente_Juridico` maneja directamente NIT, Razón Social y Representante Legal.

2. **Seguridad y Cifrado:**
   - Las contraseñas en `Usuario` se almacenan exclusivamente en hashes criptográficos SHA2_256 (`HASHBYTES('SHA2_256', ...)`).
   - El sistema opera bajo el principio de menor privilegio (Least Privilege). Los roles `Rol_Cajero` y `Rol_Bodeguero` tienen permisos exclusivos sobre los procedimientos correspondientes a su función y `DENY` estricto sobre eliminación física de registros.

3. **Auditoría Desacoplada e Inteligente:**
   - De acuerdo a las directrices de arquitectura (Sección 17.4), los triggers se reservan de forma exclusiva para la auditoría en `Bitacora`.
   - Ningún trigger valida existencias ni bloquea transacciones de inventario; dicha lógica reside en los Stored Procedures con manejo transaccional explícito.
   - Los triggers soportan operaciones multi-fila mediante cursores internos sobre las tablas virtuales `inserted` y `deleted`, y obtienen la identidad del operador mediante `SESSION_CONTEXT(N'Id_Usuario')`.

4. **Data Warehouse en Esquema de Constelación:**
   - El modelo analítico implementa un esquema de constelación (`DW_MundoEscolar`) que comparte dimensiones maestras (`DimTiempo`, `DimCliente`, `DimProducto`, `DimServicio`, `DimEmpleado`, `DimMetodoPago`, `DimSucursal`) entre 4 tablas de hechos:
     - `FactVenta` (métrica a nivel de comprobante)
     - `FactVentaProducto` (análisis granular de venta de productos e inventario)
     - `FactVentaServicio` (análisis granular de ingresos por servicios de copias e imprenta)
     - `FactPagos` (análisis de flujo de caja y recaudación por método de pago)
   - Incluye el procedimiento almacenado `sp_DW_Ejecutar_ETL` para extracción, transformación y carga incremental idempotente desde `MUNDO_ESCOLAR`.

---

### Mantenimiento y Operaciones (DBA)
El script `Mantenimiento_Backups.sql` incluye las rutinas requeridas para la operación continua:
- **Estrategia de Copias de Seguridad:** Respaldo completo semanal, diferencial diario y de registro de transacciones cada hora.
- **Verificación de Integridad:** Comando programado `DBCC CHECKDB` con reporte de anomalías.
- **Optimización de Almacenamiento:** Reorganización (`REORGANIZE`) de índices con fragmentación entre 10% y 30%, y reconstrucción (`REBUILD ONLINE`) para fragmentaciones superiores al 30%.
- **Estadísticas:** Actualización con `FULLSCAN` para garantizar planes de ejecución óptimos por parte del optimizador de SQL Server.

---

### Licencia y Créditos
- **Organización:** Librería y Papelería Mundo Escolar
- **Equipo de Desarrollo:** Grupo #01 - Ingeniería de Bases de Datos
- **Compatibilidad:** Microsoft SQL Server 2022 (16.x) o superior, Azure SQL Managed Instance.
