# INFORME TÉCNICO DE EVOLUCIÓN ESTRUCTURAL, MEJORAS Y GOBERNANZA DE BASE DE DATOS (POST-HITO #2)
## Documentación Exhaustiva para Samir: Cambios en las 33 Entidades de Negocio, Adición de Tablas Técnicas (34 y 35), Análisis de la Tabla de Sistema (36) y Lineamientos Metodológicos (MC, MER y Normalización)

**Proyecto:** Sistema de Información Integral — Librería y Papelería Mundo Escolar (Liberia, Guanacaste)  
**Autores / Tesistas:** Mauricio Chavarría & Samir Campos Díaz (Desarrolladores Líderes)  
**Cátedra / Tutor:** Lic. / Prof. Torrentes — Bases de Datos Avanzadas e Inteligencia de Negocios  
**Motor & Ambiente:** Microsoft SQL Server 2022 Developer Edition · Localhost (Instancia CHAVARRIA:1433)  
**Fecha & Versión:** 4 de Noviembre de 2026 · Versión 2.3 Post-Hito #2 (Certificación Local)  
**Archivos PDF Oficiales Generados:**
- [Informe_Tecnico_Evolucion_Tablas_Mundo_Escolar.pdf](file:///C:/MUNDO_ESCOLAR/Informe_Tecnico_Evolucion_Tablas_Mundo_Escolar.pdf)
- [docs/Informe_Tecnico_Evolucion_Tablas_Mundo_Escolar.pdf](file:///C:/MUNDO_ESCOLAR/docs/Informe_Tecnico_Evolucion_Tablas_Mundo_Escolar.pdf)

---

## 1. Aclaración Definitiva del Conteo de Tablas (¿33, 35 o 36?)

| Cifra | Ámbito de Aplicación | Composición Exacta | Uso en la Defensa con Torrentes |
| :---: | :--- | :--- | :--- |
| **33 Tablas** | **Modelo Canónico de Negocio (OLTP - 3FN)** | Las 33 entidades relacionales derivadas de los requerimientos funcionales (RF1 a RF6). Clientes, ventas, inventario, compras, catálogo, seguridad y bitácora. | **Cifra Oficial Académica:** Es la respuesta estricta para la tesis, el Modelo Conceptual y el MER de negocio. |
| **35 Tablas** | **Código DDL Desarrollado por el Equipo (Esquema `dbo`)** | Las 33 tablas canónicas de negocio + **2 tablas técnicas de seguridad DBA** (`TB_Historial_Contrasenas` y `TB_Token_Revocado`). | **Cifra de Ingeniería de Software:** Representa la totalidad de tablas implementadas en el script `03_CrearTablas.sql`. |
| **36 Tablas** | **Inspección Física en SQL Server (Esquema `dbo`)** | Las 35 tablas creadas por el equipo + **1 tabla interna de SSMS** (`dbo.sysdiagrams`) creada automáticamente al guardar diagramas en pantalla. | **Resultado de `sys.tables`:** Explica por qué un `SELECT COUNT(*)` en SSMS devuelve 36 y no 33 ni 35. |
| **+15 Tablas** | **Esquema Data Warehouse (OLAP - Esquema `dw`)** | 8 Tablas de Dimensiones (`DimCliente`, `DimProducto`, etc.), 6 Tablas de Hechos (`FactVentas`, `FactCompras`, etc.) y 1 `Bitacora_ETL`. | **Capa Analítica BI:** Totalmente aisladas en su propio esquema lógico y Filegroup físico `FG_DW`. |

> **Regla de Oro para el Equipo:** Ante cualquier pregunta conceptual o de modelado relacional del Lic. Torrentes, el modelo relacional tiene **33 entidades en Tercera Forma Normal (3FN)**. Si el evaluador ejecuta una consulta física en el motor y observa 36 objetos base en `dbo`, la respuesta fundamentada es:  
> *"Las 33 entidades corresponden a la normalización de negocio; 2 son tablas técnicas de soporte criptográfico DBA (historial y tokens) que garantizan 1FN y seguridad JWT; y la 36 es el metadato nativo `sysdiagrams` de SSMS."*

---

## 2. Matriz Exhaustiva de Cambios en las 33 Entidades Canónicas

| # | Entidad Canónica | Cambio Físico Implementado | Segmentación Filegroup | Justificación Técnica y de Negocio |
| :-: | :--- | :--- | :---: | :--- |
| **13** | **`Usuario`** | Adición de columna:<br>`Requiere_Cambio_Contrasena BIT NOT NULL DEFAULT 0` | `PRIMARY` | Control de primer ingreso. Obliga a cambiar la clave temporal enviada por correo antes de habilitar el token de operación. |
| **16** | **`Bitacora`** | Modificación de nulabilidad:<br>`Id_Usuario INT NULL` *(antes NOT NULL)* | `ON [FG_AUDITORIA]`<br>*(ME_Auditoria.ndf)* | Permite auditar eventos públicos/anónimos (autoregistro en Landing, intentos fallidos) sin violar FK ni saturar el log transaccional del POS. |
| **17** | **`Cliente`** | Adición de 3 columnas comerciales:<br>&bull; `Limite_Credito_Monto DECIMAL(12,2) DEFAULT 300000.00`<br>&bull; `Limite_Credito_Facturas INT DEFAULT 3`<br>&bull; `Permite_Credito BOOL DEFAULT 1` | `PRIMARY` | Control de riesgo y morosidad (RF1.11, RF6). Permite fijar techos financieros configurables y bloquear ventas a crédito si excede el cupo o adeuda facturas. |
| **24** | **`Producto`** | Adición de columna tributaria:<br>`Porcentaje_IVA DECIMAL(5,2) NOT NULL DEFAULT 13.00` | `PRIMARY` | Cumplimiento de la Ley 9635 (Costa Rica). Soporta tarifas diferenciadas: 13% general, 1% canasta básica y 0% exento/educativo. |
| **26** | **`Movimiento_Inventario`** | Reubicación física de almacenamiento a Filegroup secundario. | `ON [FG_TRANSACCIONAL]`<br>*(ME_Transaccional.ndf)* | Desacopla el I/O masivo del kárdex y ajustes de almacén para que no colisione con las consultas administrativas. |
| **28** | **`Compra_Producto`** | Reubicación física de almacenamiento a Filegroup secundario. | `ON [FG_TRANSACCIONAL]`<br>*(ME_Transaccional.ndf)* | Aislamiento de líneas de compra con volúmenes de adquisición mayorista para auditoría de costos de reabastecimiento. |
| **30** | **`Venta_Producto`** | Adición de columna tributaria:<br>`Porcentaje_IVA DECIMAL(5,2) NOT NULL DEFAULT 13.00` | `ON [FG_TRANSACCIONAL]`<br>*(ME_Transaccional.ndf)* | Persistencia histórica del impuesto cobrado por renglón en el instante de venta (inmutabilidad fiscal ante futuros cambios de tarifa). |
| **32** | **`Factura`** | Adición de columna fiscal DGT:<br>`Clave_Numerica_Fiscal VARCHAR(50) NULL` | `PRIMARY` | Resolución DGT-R-033-2019 de Hacienda CR. Aloja la clave de 50 dígitos requerida para el comprobante electrónico y código QR de 80mm. |
| **33** | **`Pago`** | Reubicación física de almacenamiento a Filegroup secundario. | `ON [FG_TRANSACCIONAL]`<br>*(ME_Transaccional.ndf)* | Asegura alta concurrencia en caja mostrador al liquidar facturas a crédito o al contado sin contención en el archivo `.mdf`. |
| **Resto** | **24 Tablas Restantes** | Esquema DDL base preservado intacto al 100%. | `PRIMARY` / `FG_CATALOGOS` | Se mantuvieron intactas las PKs, FKs y restricciones CHECK de catálogos, roles, personas y detalle de servicios. |

---

## 3. Análisis Profundo de las 2 Tablas Técnicas de Seguridad DBA (#34 y #35)

### 3.1. Tabla 34: `TB_Historial_Contrasenas` (Remediación S03)
```sql
CREATE TABLE TB_Historial_Contrasenas (
    Id_Historial INT IDENTITY(1,1) NOT NULL,
    Id_Usuario INT NOT NULL,
    Contrasena_Hash VARCHAR(255) NOT NULL,
    Fecha_Modificacion DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_Historial_Contrasenas PRIMARY KEY (Id_Historial),
    CONSTRAINT FK_Historial_Usuario FOREIGN KEY (Id_Usuario) REFERENCES Usuario(Id_Usuario)
);
```
- **Tipo de Relación:** $1:N$ con la entidad `Usuario` (un usuario posee $0..N$ registros históricos de claves).
- **Regla de Negocio:** Al cambiar contraseña en `SP_Usuario_CambiarContrasena`, el procedimiento compara la nueva clave contra las tuplas históricas y rechaza la operación si coincide con alguna anterior.
- **Normalización (1FN):** Evita la presencia de atributos multivaluados o columnas repetitivas dentro de `Usuario`. Cumple 1FN, 2FN y 3FN de forma estricta.

### 3.2. Tabla 35: `TB_Token_Revocado` (Remediación S08 - Blacklist JWT L2)
```sql
CREATE TABLE TB_Token_Revocado (
    Id_Token INT IDENTITY(1,1) NOT NULL,
    Token_Hash VARCHAR(64) NOT NULL,
    Fecha_Expiracion DATETIME NOT NULL,
    Fecha_Revocacion DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_Token_Revocado PRIMARY KEY (Id_Token),
    CONSTRAINT UQ_Token_Revocado_Hash UNIQUE (Token_Hash)
);
```
- **Arquitectura Dual L1/L2:** En memoria RAM (L1) se mantiene una estructura `Set` ultrarrápida en el backend NestJS; simultáneamente, la base de datos (L2) garantiza que, ante reinicios del servidor, los tokens revocados sigan invalidados permanentemente.
- **Mantenimiento Automatizado:** Un procedimiento purga periódicamente las tuplas cuya `Fecha_Expiracion < GETDATE()`.

### 3.3. Tabla 36: `dbo.sysdiagrams` (Metadato Interno de Microsoft SSMS)
- **Origen:** Creada automáticamente por SQL Server al guardar diagramas gráficos en SSMS.
- **Columnas:** `name`, `principal_id`, `diagram_id`, `version`, `definition`.
- **Dictamen:** No representa una entidad del negocio ni de seguridad. Es únicamente almacenamiento de metadatos gráficos de Microsoft. Debe ignorarse en los conteos de normalización académica.

---

## 4. Lineamientos Metodológicos Definitivos para Samir: MC, MER y Normalización

| Artefacto de Tesis | ¿Se añaden las 2 tablas extra? | Fundamento Metodológico y Redacción Recomendada |
| :--- | :---: | :--- |
| **Modelo Conceptual (MC)** | **NO (Nunca)** | El MC pertenece al espacio del problema. Modela las reglas puras del negocio (*Cliente, Venta, Producto, Factura*). Los tokens o hashes son artefactos de software que contaminarían la abstracción conceptual. |
| **Modelo Entidad-Relación (MER Lógico)** | **33 Entidades** | El MER Lógico de la tesis debe mantener las **33 entidades de negocio** normalizadas en 3FN que satisfacen los requerimientos funcionales (RF1 a RF6). |
| **Diagrama Entidad-Relación (DER Físico)** | **Sí, como Anexo** | En el diagrama físico generado en SSMS se visualizan `TB_Historial_Contrasenas` y `TB_Token_Revocado`. Se documentan en una sección titulada: *"Módulo de Infraestructura Técnica y Seguridad DBA"*. |
| **Documento de Normalización** | **Argumento de 1FN** | **No se rehace la normalización**, sino que se usa como argumento de defensa: *"La creación de `TB_Historial_Contrasenas` constituye la aplicación estricta de la **Primera Forma Normal (1FN)**, al evitar introducir atributos multivaluados de contraseñas dentro de la entidad `Usuario`."* |

---

## 5. Guía de Preguntas y Respuestas para la Defensa ante Torrentes

* **P1: "¿Por qué en la documentación hablan de 33 entidades pero en SQL Server veo 36 tablas?"**  
  *R:* *"Profesor, nuestro diseño relacional normalizado en 3FN consta de 33 entidades que resuelven los requerimientos funcionales del negocio. Las 3 tablas adicionales en `dbo` obedecen a dos motivos técnicos: 2 son tablas de soporte DBA para el subsistema de seguridad (`TB_Historial_Contrasenas` para evitar atributos multivaluados en 1FN y `TB_Token_Revocado` para la persistencia de la lista negra de JWT); y la restante es `dbo.sysdiagrams`, creada de forma automática por SSMS para almacenar los diagramas visuales del motor."*

* **P2: "¿Por qué agregaron columnas nuevas a Cliente, Producto y Factura después del Hito #2?"**  
  *R:* *"Para cerrar la brecha entre un prototipo académico y un sistema de producción costarricense: en `Producto` y `Venta_Producto` incorporamos la tasa de IVA diferenciada según la Ley 9635; en `Factura` añadimos la `Clave_Numerica_Fiscal` de 50 dígitos exigida por la resolución DGT-R-033-2019 de Tributación; y en `Cliente` formalizamos los umbrales de crédito comercial y morosidad parametrizable, permitiendo bloquear compras a crédito de clientes insolventes."*

* **P3: "¿Cómo resolvieron la contención de disco en la tabla Bitacora y las transacciones de caja?"**  
  *R:* *"Eliminamos el esquema monolítico implementando 4 Filegroups físicos en `C:\SQLData\`: `FG_TRANSACCIONAL` aloja las tablas de alto flujo (`Movimiento_Inventario`, `Compra_Producto`, `Venta_Producto` y `Pago`), mientras que `FG_AUDITORIA` aloja de forma exclusiva a `Bitacora`, garantizando que los triggers forenses DML no degraden los tiempos de respuesta del cajero en horas pico."*

