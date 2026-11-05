# Librería y Papelería Mundo Escolar
## Sistema Integral de Base de Datos Transaccional (OLTP) y Analítica (Data Warehouse)
**Motor:** Microsoft SQL Server 2022 | **Modelo Relacional:** 33 Tablas en 3FN | **Versión:** 2.2 Oficial Post-Hito #2

---

### Resumen Ejecutivo
Este repositorio contiene la arquitectura completa, normalizada y certificada de la base de datos y plataforma analítica para la empresa **Librería y Papelería Mundo Escolar**, diseñada en estricto cumplimiento de la documentación de ingeniería de software (tesis de 548 páginas, catálogo de objetos de base de datos y diseño del Data Warehouse).

El sistema sustituye la versión preliminar de 26 tablas por el modelo oficial de **33 tablas en Tercera Forma Normal (3FN)**, garantizando la eliminación de redundancias, la integridad referencial y una separación rigurosa de responsabilidades entre transaccionalidad (OLTP), auditoría forense y análisis gerencial (BI / DW).

Tras la culminación del **Hito #2**, el sistema fue sometido a una profunda transformación de ingeniería que incorporó:
1. **Facturación Electrónica DGT Costa Rica (Resolución DGT-R-033-2019):** Clave numérica fiscal de 50 dígitos, código QR tributario, tiquete térmico de 80mm con desglose IVA (13%, 1%, 0%) y envío directo a WhatsApp.
2. **Punto de Venta Oficial (POS) y Verificación Tributaria TSE:** Integración directa con el padrón del Tribunal Supremo de Elecciones (TSE) para resolución en vivo de cédulas físicas y jurídicas, cálculo automatizado de cambio en efectivo y trazabilidad de comprobantes SINPE Móvil.
3. **Gestión de Proveedores por Producto y Corrección SCD Tipo 2:** Módulo web para la tabla `dbo.Producto_Proveedor` y corrección estricta de vigencias en `dw.DimCliente`.
4. **Aprovisionamiento Inteligente (Smart Procurement):** Algoritmo automatizado (SP 92) para detección de desabastecimiento y generación de órdenes de compra en un clic.
5. **Cadena de Suministro Real y Costeo Mayorista:** Eliminación de la ilusión del 100% de utilidad, estableciendo un costo histórico real de ₡326,225.00 frente a ventas de ₡516,550.00 (**Margen Bruto Real: 36.85%**) y auditoría de retraso crítico en entregas (+9 días en Mochilas QuickSilver).
6. **Arquitectura de Filegroups Físicos:** Segmentación de I/O en disco mediante archivos secundarios `.ndf` en `C:\SQLData\` (`FG_TRANSACCIONAL`, `FG_DW`, `FG_AUDITORIA`, `FG_CATALOGOS`).
7. **Expansión del Data Warehouse:** Nuevas entidades `dw.DimProveedor`, `dw.FactCompras`, `dw.FactInventario` y procedimientos ETL 93 al 95.
8. **Simulación Financiera What-If en Power BI & SQL Server:** Parámetros dinámicos en DAX (`GENERATESERIES`), función analítica `dw.FN_SimularImpactoFinanciero` y vista `dw.VW_Analisis_Sensibilidad_WhatIf`.

---

### Métricas de la Base de Datos

| Componente | Cantidad | Descripción |
| :--- | :---: | :--- |
| **Tablas Relacionales (OLTP)** | **34** | Modeladas en 3FN, organizadas en 9 subsistemas funcionales. |
| **Tablas Analíticas (Data Warehouse)** | **14** | 6 Tablas de Hechos, 8 Dimensiones compartidas en esquema `dw`. |
| **Filegroups Físicos** | **4 + PRIMARY** | `FG_TRANSACCIONAL` (30MB), `FG_DW` (30MB), `FG_AUDITORIA` (20MB), `FG_CATALOGOS` (15MB). |
| **Restricciones (Constraints)** | **108** | 37 Foreign Keys (`FK_`), 28 Unique (`UQ_`), 25 Checks (`CK_`), 18 Defaults (`DF_`). |
| **Índices de Cobertura** | **22** | Non-clustered indexes sobre llaves foráneas, rangos de fechas y estados. |
| **Funciones de Usuario (UDF)** | **17** | 7 escalares, 8 de tabla operativas y 2 analíticas (simulador What-If). |
| **Vistas del Sistema** | **20** | 8 vistas operativas, 11 analíticas y 1 vista What-If de escenarios. |
| **Procedimientos Almacenados** | **102** | Catálogo completo con transaccionalidad ACID y orquestación ETL (SPs 1 al 102). |
| **Disparadores (Triggers)** | **16** | Auditoría pura multi-fila sobre la tabla `Bitacora` vía `SESSION_CONTEXT`. |
| **Roles y Seguridad** | **5 / 7** | 5 Roles (`Rol_Administrador`, `Rol_Gerencia`, etc.) y 7 usuarios con privilegios mínimos. |
| **Reportes y BI** | **Multi-canal** | Panel web React (Vite) + Modelo Microsoft Power BI Desktop 3 páginas con DAX What-If. |

---

### Catálogo de las 33 Tablas Relacionales (3FN)

| # | Tabla | PK | Dominio Funcional | Descripción | Filegroup Físico |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 1 | `Empresa` | `Id_Empresa` | Configuración | Datos corporativos, NIT, moneda y configuración global. | `FG_CATALOGOS` |
| 2 | `Sucursal` | `Id_Sucursal` | Configuración | Puntos de venta físicos, bodegas y datos de contacto. | `FG_CATALOGOS` |
| 3 | `Rol` | `Id_Rol` | Seguridad | Catálogo de roles de seguridad (Administrador, Cajero, etc.). | `FG_CATALOGOS` |
| 4 | `Permiso` | `Id_Permiso` | Seguridad | Permisos atómicos sobre módulos y operaciones del sistema. | `FG_CATALOGOS` |
| 5 | `Rol_Permiso` | `Id_Rol_Permiso` | Seguridad | Matriz N:M que asocia roles con sus permisos autorizados. | `FG_CATALOGOS` |
| 6 | `Usuario` | `Id_Usuario` | Seguridad | Cuentas de usuario con contraseñas encriptadas en SHA2_256. | `FG_CATALOGOS` |
| 7 | `Rol_Usuario` | `Id_Rol_Usuario` | Seguridad | Asignación de uno o más roles por cuenta de usuario. | `FG_CATALOGOS` |
| 8 | `Persona` | `Id_Persona` | Personas | Entidad generalizada para personas naturales (cédula, nombres). | `PRIMARY` |
| 9 | `Empleado` | `Id_Empleado` | Personas | Datos laborales, cargo, fecha de contratación y sueldo. | `PRIMARY` |
| 10 | `Cliente` | `Id_Cliente` | Clientes | Entidad base de clientes con saldo, límite de crédito y tipo. | `PRIMARY` |
| 11 | `Cliente_Natural` | `Id_Cliente_Natural` | Clientes | Subtipo: Clientes particulares asociados a `Persona`. | `PRIMARY` |
| 12 | `Cliente_Juridico` | `Id_Cliente_Juridico` | Clientes | Subtipo: Empresas, colegios e instituciones con NIT y razón social. | `PRIMARY` |
| 13 | `Categoria` | `Id_Categoria` | Inventario | Familias de artículos (Útiles, Papelería, Libros, etc.). | `FG_CATALOGOS` |
| 14 | `Subcategoria` | `Id_Subcategoria` | Inventario | Clasificación detallada dependiente de la categoría. | `FG_CATALOGOS` |
| 15 | `Marca` | `Id_Marca` | Inventario | Fabricantes y marcas registradas de los productos. | `FG_CATALOGOS` |
| 16 | `Unidad_Medida` | `Id_Unidad_Medida` | Inventario | Unidades de medida (Unidad, Caja, Resma, Docena, etc.). | `FG_CATALOGOS` |
| 17 | `Producto` | `Id_Producto` | Inventario | Catálogo maestro de productos, códigos de barras y precios. | `PRIMARY` |
| 18 | `Inventario` | `Id_Inventario` | Inventario | Existencias físicas, stock mínimo/máximo por sucursal. | `FG_TRANSACCIONAL` |
| 19 | `Movimiento_Inventario` | `Id_Movimiento` | Inventario | Registro de entradas, salidas, traslados y ajustes de stock. | `FG_TRANSACCIONAL` |
| 20 | `Servicio` | `Id_Servicio` | Servicios | Servicios de fotocopiado, impresión, encuadernación, etc. | `FG_CATALOGOS` |
| 21 | `Proveedor` | `Id_Proveedor` | Proveedores | Empresas proveedoras de insumos, papelería y mercadería. | `PRIMARY` |
| 22 | `Contacto_Proveedor` | `Id_Contacto` | Proveedores | Personas de contacto comercial y técnico por proveedor. | `PRIMARY` |
| 23 | `Producto_Proveedor` | `Id_Prod_Prov` | Proveedores | Catálogo de precios de compra pactados y tiempos de entrega. | `PRIMARY` |
| 24 | `Orden_Compra` | `Id_Orden` | Compras | Solicitudes y órdenes de compra emitidas a proveedores. | `FG_TRANSACCIONAL` |
| 25 | `Detalle_Orden_Compra` | `Id_Detalle_OC` | Compras | Ítems, cantidades solicitadas y precios unitarios de la orden. | `FG_TRANSACCIONAL` |
| 26 | `Venta` | `Id_Venta` | Ventas | Cabecera de la transacción de venta (cliente, fecha, total). | `FG_TRANSACCIONAL` |
| 27 | `Detalle_Venta_Producto` | `Id_Detalle_VP` | Ventas | Renglones de productos vendidos, cantidades y costos. | `FG_TRANSACCIONAL` |
| 28 | `Detalle_Venta_Servicio` | `Id_Detalle_VS` | Ventas | Renglones de servicios prestados y tarifas aplicadas. | `FG_TRANSACCIONAL` |
| 29 | `Factura` | `Id_Factura` | Facturación | Comprobante fiscal formal con clave de 50 dígitos DGT. | `FG_TRANSACCIONAL` |
| 30 | `Metodo_Pago` | `Id_Metodo_Pago` | Facturación | Catálogo de medios de pago (Efectivo, Tarjeta, Transferencia). | `FG_CATALOGOS` |
| 31 | `Pago` | `Id_Pago` | Facturación | Transacciones de cobro totales o parciales por factura. | `FG_TRANSACCIONAL` |
| 32 | `Devolucion` | `Id_Devolucion` | Posventa | Registro de devoluciones de productos por garantía o cambio. | `FG_TRANSACCIONAL` |
| 33 | `Bitacora` | `Id_Bitacora` | Auditoría | Registro forense de operaciones DML con valores previos y nuevos. | `FG_AUDITORIA` |

---

### Estructura del Data Warehouse (`dw`) en `FG_DW`

| Tipo | Objeto DW | Descripción Analítica |
| :---: | :--- | :--- |
| **Dimensión** | `dw.DimCliente` | Historial de clientes con versionamiento SCD Tipo 2. |
| **Dimensión** | `dw.DimProducto` | Catálogo maestro de productos con categorías y marcas. |
| **Dimensión** | `dw.DimVendedor` | Usuarios y cajeros con métricas de desempeño comercial. |
| **Dimensión** | `dw.DimMetodoPago` | Formas de pago utilizadas en mostrador. |
| **Dimensión** | `dw.DimFecha` | Calendario analítico con granularidad diaria, mensual y trimestral. |
| **Dimensión** | `dw.DimServicio` | Servicios de fotocopiado y encuadernación. |
| **Dimensión** | `dw.DimSucursal` | Sucursales y puntos de venta físicos. |
| **Dimensión** | `dw.DimProveedor` | *(Nueva Fase 5)* Directorio de proveedores, lead time pactado y contacto. |
| **Hechos** | `dw.FactVentas` | Cabeceras de transacciones de venta consolidadas. |
| **Hechos** | `dw.FactVentaProducto` | Detalle de líneas vendidas con costo unitario, utilidad bruta y margen real (36.85%). |
| **Hechos** | `dw.FactVentaServicio` | Detalle de servicios de imprenta y mostrador prestados. |
| **Hechos** | `dw.FactPagos` | Conciliación de recaudaciones por método de pago. |
| **Hechos** | `dw.FactCompras` | *(Nueva Fase 5)* Órdenes recibidas, días de retraso real y cumplimiento de proveedores. |
| **Hechos** | `dw.FactInventario` | *(Nueva Fase 5)* Snapshot diario de existencias, capital inmovilizado y alertas de stock crítico. |

---

### Estructura de Scripts en `C:\MUNDO_ESCOLAR\sql\`

```
C:\MUNDO_ESCOLAR\
├── docs/                                  # Especificaciones, propuestas y guías en PDF y Markdown
└── sql/                                   # Suite completa de scripts SQL Server 2022 y Power BI
    ├── README.md                          # Guía de aprovisionamiento, orden de ejecución y arquitectura
    ├── 01_despliegue_secuencial/          # Secuencia oficial de aprovisionamiento inicial (01 a 14 + DW)
    │   ├── 01_CrearBaseDatos.sql          # Creación de BD con parámetros de archivo inicial
    │   ├── 02_CrearEsquemas.sql           # Esquemas dbo y dw
    │   ├── 03_CrearTablas.sql             # DDL de las 33 tablas relacionales en 3FN
    │   ├── 04_CrearConstraints.sql        # 108 restricciones de integridad referencial
    │   ├── 05_CrearCatalogos.sql          # Semillas de catálogos y matriz Rol_Permiso
    │   ├── 06_InsertarDatosMaestros.sql   # Cuentas maestras, roles, servicios, clientes y proveedores
    │   ├── 07_CrearIndices.sql            # Índices no agrupados para optimización de consultas
    │   ├── 08_CrearFunciones.sql          # Funciones operativas de negocio
    │   ├── 09_CrearVistas.sql             # Vistas operativas y gerenciales
    │   ├── 10_CrearProcedimientos.sql     # 102 Stored Procedures con transacciones ACID y ETLs
    │   ├── 11_CrearTriggers.sql           # 16 Triggers de auditoría pura en Bitacora
    │   ├── 12_ValidarInstalacion.sql      # Validación de integridad y conteo de objetos instalados
    │   ├── 13_InsertarDatosDemostracion.sql # Siembra realista de compras, demoras (+9 días) y 15 ventas
    │   ├── 14_MotorSensibilidadWhatIf.sql # Motor de simulación analítica de sensibilidad (TVF y Vista)
    │   └── DW_Constelacion.sql            # DDL del Data Warehouse y orquestadores ETL
    ├── 02_consolidados_referencia/        # Scripts consolidados monolíticos para consulta y auditoría
    │   ├── Estructura.sql                 # Consolidado de BD, esquemas, tablas y constraints (01-04)
    │   ├── Inserciones.sql                # Consolidado de catálogos y datos maestros (05-06)
    │   ├── Procedimientos_Almacenados.sql # Consolidado oficial de SPs 1 al 102
    │   ├── Reportes.sql                   # Colección de funciones y consultas para reportes
    │   └── Triggers.sql                   # Consolidado de los 16 triggers de auditoría
    ├── 03_administracion_mantenimiento/   # Operación DBA, Mantenimiento, Seguridad y Pruebas
    │   ├── Mantenimiento_Backups.sql      # Rutinas de respaldo, DBCC CHECKDB y reorganización
    │   ├── Pruebas_Validacion.sql         # Banco de pruebas unitarias y de estrés
    │   └── Seguridad.sql                  # Creación de logins, usuarios y roles SQL
    └── 04_analitica_powerbi/              # Modelado analítico y medidas DAX
        └── Medidas_DAX_PowerBI.dax        # Catálogo de fórmulas DAX para Microsoft Power BI Desktop
```

---

### Instrucciones de Ejecución y Arranque Local

1. **Base de Datos SQL Server 2022:**
   - Instancia activa en `localhost:1433/MUNDO_ESCOLAR`.
   - Filegroups activos con almacenamiento en `C:\SQLData\`.
2. **Backend NestJS (Puerto 3001):**
   ```bash
   cd C:\MUNDO_ESCOLAR\backend
   npm run start:dev
   ```
3. **Frontend React + Vite (Puerto 5174):**
   ```bash
   cd C:\MUNDO_ESCOLAR\frontend
   npm run dev
   ```
4. **Microsoft Power BI Desktop:**
   - Abrir `C:\MUNDO_ESCOLAR\Mundo_Escolar_BI.pbix` y hacer clic en **"Actualizar"** (Refresh).

---
**Proyecto Certificado.**  
*Todos los componentes operan 100% de manera local en estricto cumplimiento con las normas de confidencialidad y control de versiones.*
