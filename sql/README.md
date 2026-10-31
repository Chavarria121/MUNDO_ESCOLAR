# Suite de Base de Datos y Analítica — Mundo Escolar

Este directorio contiene todos los artefactos de base de datos relacional (OLTP), Data Warehouse (OLAP), analítica avanzada y mantenimiento para Microsoft SQL Server 2022 y Microsoft Power BI Desktop.

---

## 📂 Organización del Directorio

Para evitar redundancia y garantizar la trazabilidad operacional, los scripts se organizan en 4 subdirectorios especializados:

```
sql/
├── 01_despliegue_secuencial/         # 🚀 Secuencia oficial de aprovisionamiento (01 a 14 + DW)
│   ├── 01_CrearBaseDatos.sql
│   ├── 02_CrearEsquemas.sql
│   ├── 03_CrearTablas.sql
│   ├── 04_CrearConstraints.sql
│   ├── 05_CrearCatalogos.sql
│   ├── 06_InsertarDatosMaestros.sql
│   ├── 07_CrearIndices.sql
│   ├── 08_CrearFunciones.sql
│   ├── 09_CrearVistas.sql
│   ├── 10_CrearProcedimientos.sql
│   ├── 11_CrearTriggers.sql
│   ├── 12_ValidarInstalacion.sql
│   ├── 13_InsertarDatosDemostracion.sql
│   ├── 14_MotorSensibilidadWhatIf.sql
│   └── DW_Constelacion.sql
├── 02_consolidados_referencia/       # 📚 Scripts consolidados monolíticos (Auditoría y Consulta)
│   ├── Estructura.sql
│   ├── Inserciones.sql
│   ├── Procedimientos_Almacenados.sql
│   ├── Reportes.sql
│   └── Triggers.sql
├── 03_administracion_mantenimiento/  # 🛠️ Operación DBA, Seguridad y Respaldo
│   ├── Mantenimiento_Backups.sql
│   ├── Pruebas_Validacion.sql
│   └── Seguridad.sql
└── 04_analitica_powerbi/             # 📊 Medidas DAX y Modelado Power BI Desktop
    └── Medidas_DAX_PowerBI.dax
```

---

## 🚀 1. Despliegue Secuencial Oficial (`01_despliegue_secuencial/`)

Para desplegar la base de datos `MUNDO_ESCOLAR` en una instancia de SQL Server 2022 desde cero, ejecute los archivos en el siguiente orden estricto:

| Paso | Archivo | Propósito / Objeto Creado |
| :--- | :--- | :--- |
| **01** | `01_CrearBaseDatos.sql` | Inicializa la base de datos con collation `Modern_Spanish_CI_AS` y filegroups en `C:\SQLData\`. |
| **02** | `02_CrearEsquemas.sql` | Crea los esquemas lógicos `dbo` (operacional) y `dw` (dimensional). |
| **03** | `03_CrearTablas.sql` | DDL de las 33 tablas operativas en Tercera Forma Normal (3FN). |
| **04** | `04_CrearConstraints.sql` | 108 restricciones de integridad referencial (Primary Keys, Foreign Keys, Checks y Defaults). |
| **05** | `05_CrearCatalogos.sql` | Catálogos del sistema, permisos y matriz de asignación `Rol_Permiso`. |
| **06** | `06_InsertarDatosMaestros.sql` | Roles, usuarios administrativos, catálogo de servicios, proveedores y clientes base. |
| **07** | `07_CrearIndices.sql` | Índices no agrupados (*Non-Clustered Indexes*) para optimización de consultas de alta concurrencia. |
| **08** | `08_CrearFunciones.sql` | Funciones escalares y tabulares de lógica de negocio (TVF y SVF). |
| **09** | `09_CrearVistas.sql` | Vistas operativas y gerenciales para consultas rápidas. |
| **10** | `10_CrearProcedimientos.sql` | 102 Stored Procedures con transacciones ACID, control de concurrencia y ETLs orquestados. |
| **11** | `11_CrearTriggers.sql` | 16 Triggers de auditoría pura que alimentan la tabla inmutable `Bitacora`. |
| **12** | `12_ValidarInstalacion.sql` | Script de diagnóstico e integridad para validar el recuento de objetos instalados. |
| **13** | `13_InsertarDatosDemostracion.sql` | Siembra de demostración realista: reseteo seguro, compras con demoras (+9 días) y 15 ventas reales. |
| **14** | `14_MotorSensibilidadWhatIf.sql` | Motor analítico What-If en SQL: función determinística `dw.FN_SimularImpactoFinanciero` y vista `dw.VW_Analisis_Sensibilidad_WhatIf`. |
| **DW** | `DW_Constelacion.sql` | Esquema de Constelación (5 dimensiones conformadas, 4 tablas de hechos) y procedimientos ETL. |

---

## 📚 2. Consolidados de Referencia (`02_consolidados_referencia/`)

Estos archivos agrupan bloques de código completos para fines de auditoría, búsqueda rápida o consulta directa en herramientas DBA sin necesidad de navegar archivo por archivo:

- **`Estructura.sql`:** Reúne la base de datos, esquemas, DDL de tablas y constraints (equivalente a scripts 01 al 04).
- **`Inserciones.sql`:** Reúne catálogos y datos maestros (equivalente a scripts 05 y 06).
- **`Procedimientos_Almacenados.sql`:** Colección monolítica de los 102 Stored Procedures.
- **`Triggers.sql`:** Colección monolítica de los 16 Triggers de auditoría.
- **`Reportes.sql`:** Colección de funciones y consultas analíticas para reportería gerencial.

> **Nota de Despliegue:** Para evitar errores de objetos duplicados o colisiones de compilación, **no ejecute** esta carpeta si ya desplegó la carpeta `01_despliegue_secuencial/`.

---

## 🛠️ 3. Administración y Mantenimiento (`03_administracion_mantenimiento/`)

Herramientas para administración rutinaria de base de datos:

- **`Seguridad.sql`:** Configuración de usuarios de base de datos, logins a nivel de instancia, permisos mínimos requeridos y roles de SQL Server.
- **`Mantenimiento_Backups.sql`:** Rutinas de respaldo (Full, Diferencial, Log de Transacciones), verificación de integridad (`DBCC CHECKDB`) y reorganización de índices.
- **`Pruebas_Validacion.sql`:** Banco de pruebas unitarias y de estrés en T-SQL para verificar restricciones y comportamiento de transacciones.

---

## 📊 4. Analítica y Power BI (`04_analitica_powerbi/`)

- **`Medidas_DAX_PowerBI.dax`:** Catálogo completo de expresiones DAX para Microsoft Power BI Desktop. Incluye tablas de parámetros desconectadas (`GENERATESERIES`), medidas dinámicas con `SELECTEDVALUE`, cálculo de deltas absolutos (₡) y relativos (%), y KPIs de sensibilidad financiera What-If.
