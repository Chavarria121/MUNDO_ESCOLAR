# PLAN MAESTRO DE EXPOSICIÓN FINAL (28 MINUTOS)
## PROYECTO: SISTEMA INTEGRAL LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR
**Equipo:** Grupo #1 (Apertura de la Sesión de Defensa)  
**Fecha de Presentación:** Jueves 5 de Noviembre de 2026  
**Duración Objetivo:** 25 - 30 minutos (28 min presentación + 2 min amortiguador / cierre)  
**Objetivo Estratégico:** Establecer un estándar de ingeniería de software, arquitectura de datos y seguridad que resulte insuperable para los grupos subsiguientes.

---

## 1. PRINCIPIOS DE EJECUCIÓN DEL GRUPO #1

1. **Cero Diapositivas con Texto Denso:**
   - La única pieza documental estática proyectada será el **Modelo Entidad-Relación (MER)** durante los primeros 4.5 minutos.
   - A partir de ahí, **todo es software vivo**, datos reales y consolas de ingeniería.
2. **La Trinidad Sincronizada (3 Máquinas Conectadas en Vivo):**
   - **Máquina 1 (Melissa / Daniel):** Aplicativo Comercial React + Vite conectado vía red privada segura Tailscale al backend de Mauricio. Demuestra la operación humana (POS, Ventas Ley 9635, Clientes, Smart Procurement y Recepción de Compras).
   - **Máquina 2 (Mauricio):** Motor SQL Server 2022 + SSMS 22 + Servidor Backend NestJS. Demuestra la persistencia ACID en caliente, Kárdex, Triggers de auditoría, PoLP RBAC y Module Signing criptográfico.
   - **Máquina 3 (Samir):** Data Warehouse (Esquema `dw`) + Power BI Desktop. Demuestra la inteligencia analítica, transformaciones ETL, esquemas estrella/constelación y tableros directivos.
3. **Efecto Domino / Orquestación Cruzada:**
   - No se expone en silos. Cuando Melissa hace un clic en el POS, Mauricio presiona `[F5]` en SSMS proyectando el commit en milisegundos, y luego Samir actualiza Power BI reflejando el incremento del margen financiero.

---

## 2. ESTRUCTURA Y CRONOGRAMA MINUTO A MINUTO (28 MINUTOS)

```mermaid
gantt
    title Cronograma de Exposición Final - Grupo #1 (28 Minutos)
    dateFormat  mm
    axisFormat  %M:%S
    section Arquitectura
    José (Apertura y MER 3FN)         :00, 4m30s
    Daury (Motor T-SQL y SPs)         :04m30s, 4m30s
    section Operación
    Melissa (POS y Venta Fiscal)      :09m00s, 5m00s
    Daniel (Cadena Suministro)        :14m00s, 4m30s
    section Ingeniería
    Mauricio (Seguridad y SSMS)       :18m30s, 5m00s
    Samir (Data Warehouse y BI)       :23m30s, 4m30s
    section Cierre
    Equipo Completo (Defensa Q&A)     :28m00s, 2m00s
```

| Minuto | Integrante | Rol Técnico | Entorno Visual | Enfoque Principal |
| :--- | :--- | :--- | :--- | :--- |
| **00:00 - 04:30** (4.5 min) | **José** | Arquitecto de Datos | Diapositiva MER | Modelo Entidad-Relación, 3FN, subtipado de entidades y restricciones de integridad. |
| **04:30 - 09:00** (4.5 min) | **Daury (Dau)** | Especialista T-SQL | Diapositiva Código / SSMS | Lógica programable: Transaccionalidad ACID, Stored Procedures, Triggers y Vistas. |
| **09:00 - 14:00** (5.0 min) | **Melissa** | Líder Comercial App | Frontend Web (POS) | Venta POS de mostrador, cálculo de IVA Ley 9635, crédito institucional y morosidad. |
| **14:00 - 18:30** (4.5 min) | **Daniel** | Cadena de Suministro | Frontend Web (Compras) | Smart Procurement, cálculo de margen bruto, recepción y auditoría de SLA / Lead Time. |
| **18:30 - 23:30** (5.0 min) | **Mauricio** | Administrador DBA | SSMS 22 (4 Pestañas) | Commit en vivo, Module Signing (TRUSTWORTHY OFF), PoLP RBAC y disparo de ETL. |
| **23:30 - 28:00** (4.5 min) | **Samir** | Arquitecto BI & DW | Power BI Desktop | Esquema en estrella `dw`, ETL dimensional, KPIs directivos y modelo predictivo What-If. |
| **28:00 - 30:00** (2.0 min) | **Todo el Equipo** | Panel de Consultores | Pantalla General | Conclusión de impacto empresarial y respuesta a preguntas del tribunal. |

---

## 3. FICHAS TÉCNICAS Y GUIONES DE ORADOR

### 3.1. José (00:00 - 04:30 | 4.5 minutos)
- **Tema:** *El Cimiento Conceptual: Arquitectura del Modelo Entidad-Relación y Normalización 3FN.*
- **Lo que debe proyectar:** Exclusivamente el diagrama del **Modelo Entidad-Relación (MER)** oficial.
- **Puntos Críticos a Explicar:**
  1. *Subtipado e Integridad Jerárquica:* Explicar cómo se modelaron `Persona` -> `Persona_Fisica` / `Persona_Juridica`, permitiendo que tanto `Cliente` como `Proveedor` reutilicen datos canónicos sin redundancia.
  2. *Tercera Forma Normal (3FN):* Destacar que ninguna tabla almacena datos transitivos. Los importes, impuestos y saldos se gobiernan mediante claves primarias compuestas y foráneas indexadas.
  3. *Restricciones Declarativas (`CHECK` y `DEFAULT`):* Mostrar cómo la integridad de negocio (precios mayores a cero, identificaciones válidas, estados permitidos) está blindada a nivel de esquema DDL antes de tocar cualquier línea de código.
- **Frase de Impacto:** *"Nuestra base de datos no tolera inconsistencias conceptuales; cada relación refleja fielmente la legislación costarricense y la operación real de una librería de alto volumen."*
- **Frase de Pase:** *"Ahora, mi compañero Daury explicará cómo convertimos este modelo conceptual en un motor programable de alta concurrencia."*

---

### 3.2. Daury (04:30 - 09:00 | 4.5 minutos)
- **Tema:** *El Motor Inteligente: Lógica Programable T-SQL de Alto Desempeño.*
- **Lo que debe proyectar:** Diagrama de arquitectura de procedimientos o fragmentos selectos de T-SQL (SPs y Triggers).
- **Puntos Críticos a Explicar:**
  1. *Transaccionalidad ACID y Atomicidad Estricta:* Explicar el estándar de programación con `SET XACT_ABORT ON`, bloques `BEGIN TRANSACTION ... TRY ... CATCH` y manejo de Savepoints para garantizar que una venta o compra nunca quede a medio guardar.
  2. *Procedimientos Almacenados de Negocio:* Justificar por qué la lógica financiera (cálculo de impuestos, afectación de kárdex, validación de cupo de crédito) reside en la base de datos y no se delegó al cliente ni al backend, asegurando consistencia agnóstica de la plataforma.
  3. *Triggers DML Forenses e Inmutabilidad:* Detallar cómo las tablas `Bitacora` y `Movimiento_Inventario` se alimentan mediante triggers que capturan quién, cuándo y qué se alteró, impidiendo borrados físicos (`DELETE`).
  4. *Capa de Vistas de Desacoplamiento:* Mostrar cómo las vistas operativas (`VW_Ventas`, `VW_ProductosCatalogo`) abstraen las tablas físicas para aislar al frontend de la complejidad del esquema.
- **Frase de Impacto:** *"En Mundo Escolar, la base de datos no es un repositorio pasivo de registros; es un cerebro transaccional que impone las reglas de negocio de manera atómica y determinista."*
- **Frase de Pase:** *"Para comprobar la ejecución de esta lógica en caliente, Melissa nos demostrará el flujo comercial en el aplicativo en vivo."*

---

### 3.3. Melissa (09:00 - 14:00 | 5.0 minutos)
- **Tema:** *La Operación Comercial: Punto de Venta (POS), Facturación Fiscal Ley 9635 y Crédito.*
- **Lo que debe proyectar:** Frontend React conectado por Tailscale a la base de datos de Mauricio.
- **Puntos Críticos a Demostrar en Vivo:**
  1. *Punto de Venta Intuitivo:* Registrar una venta seleccionando artículos de alta rotación (ej. Cuadernos, Bolígrafos, Juegos de Geometría).
  2. *Cumplimiento Fiscal Ley 9635:* Resaltar cómo el sistema desglosa automáticamente la tarifa general del 13% y artículos exentos o reducidos en tiempo real sin cálculos quemados.
  3. *Validación de Clientes y Capacidad de Crédito:* Seleccionar un cliente institucional, mostrar cómo el sistema calcula su límite de crédito, saldo adeudado y morosidad acumulada, bloqueando la transacción si existiera mora vencida.
  4. *Cierre de Transacción y Factura Electrónica:* Presionar "Confirmar Venta y Cobro", emitir el comprobante y generar la señal visual a Mauricio.
- **Frase de Impacto:** *"El aplicativo no realiza matemática por su cuenta; invoca los Stored Procedures del motor SQL, garantizando que lo que el cajero ve en pantalla sea exactamente lo que la ley exige."*
- **Frase de Pase:** *"En este momento acabo de confirmar la venta en el POS. Mauricio, ¿puedes verificar en el motor SQL cómo se reflejó la transacción y el descuento de inventario?"* (Transición interactiva).

---

### 3.4. Daniel (14:00 - 18:30 | 4.5 minutos)
- **Tema:** *Cadena de Suministro: Asistente Smart Procurement, Homologación de Proveedores y Kárdex.*
- **Lo que debe proyectar:** Módulo de Compras y Proveedores en el aplicativo frontend.
- **Puntos Críticos a Demostrar en Vivo:**
  1. *Asistente Inteligente de Reabastecimiento (Smart Procurement):* Mostrar la barra inteligente superior que alerta productos bajo punto de reorden considerando stock en tránsito (`StockActual + Transito <= Reorden`). Demostrar el botón "Emitir en 1 Clic".
  2. *Homologación de Proveedores y Margen Bruto Dinámico:* Mostrar el catálogo de proveedores homologados y cómo el sistema calcula la rentabilidad real: $((PVP - Costo) / PVP) \times 100$, desmintiendo cualquier valor quemado.
  3. *Emisión y Recepción de Mercancía con Auditoría de SLA:* Abrir una orden de compra pendiente, confirmar la recepción de mercancía indicando la fecha de recepción real y proyectar el comprobante detallado con la auditoría de Lead Time (días estipulados vs días reales y veredicto de cumplimiento de entrega).
- **Frase de Impacto:** *"Optimizamos el capital de trabajo de la librería: nunca compramos a ciegas y auditamos la puntualidad de cada proveedor en cada entrega recibida."*
- **Frase de Pase:** *"Ahora Mauricio tomará el control en SQL Server Management Studio para demostrar la seguridad perimetral, la gobernanza DBA y la persistencia física de estas operaciones."*

---

### 3.5. Mauricio (18:30 - 23:30 | 5.0 minutos)
- **Tema:** *Seguridad Profunda, Module Signing Criptográfico, PoLP y Gobierno DBA en SSMS 2022.*
- **Lo que debe proyectar:** SQL Server Management Studio 2022 con las 4 pestañas preparadas.
- **Puntos Críticos a Demostrar en Vivo (Paso a Paso en SSMS):**
  1. *Pestaña 1 - Commit y Kárdex en Vivo (`F5`):*
     - Ejecutar `01_DEMO_LIVE_TRANSACCION_KARDEX.sql`.
     - Mostrar en pantalla la venta recién emitida por Melissa con su desglose de IVA, las líneas de producto, la salida de inventario generada por el trigger y el registro inmutable en `dbo.Bitacora`.
  2. *Pestaña 2 - Module Signing Criptográfico (`F5`):*
     - Ejecutar `02_DEMO_SEGURIDAD_MODULE_SIGNING.sql`.
     - Proyectar que `is_trustworthy_on = 0` (OFF), cerrando de raíz la vulnerabilidad de escalado de privilegios a nivel de instancia.
     - Mostrar los certificados asimétricos y la firma criptográfica estampada en `sys.crypt_properties` para los procedimientos `SP_DBA_*`.
     - Explicar la ventaja: la aplicación ejecuta respaldos sin necesidad de pertenecer a `sysadmin` ni a `db_backupoperator`.
  3. *Pestaña 3 - PoLP y Matriz RBAC (`F5`):*
     - Ejecutar `03_DEMO_POLP_RBAC_MATRIZ.sql`.
     - Cambiar contexto con `EXECUTE AS USER = 'usr_mundo_vendedor'`.
     - Demostrar el intento de ataque a `dbo.Usuario`, capturando en vivo el error SQL 229 (Acceso denegado).
     - Demostrar cómo el usuario sí puede consultar vistas comerciales de catálogo, restaurando el contexto con `REVERT`.
  4. *Pestaña 4 - Disparo de Carga ETL (`F5`):*
     - Ejecutar `04_DEMO_ETL_GATILLO_DW.sql`.
     - Mostrar el conteo previo de hechos en `dw.FactVentas` y `dw.FactCompras`.
     - Ejecutar `EXEC SP_ETL_CargarFactVentas` y `EXEC SP_ETL_CargarFactCompras`.
     - Mostrar los hechos sincronizados con claves subrogadas (`Sk_*`).
- **Frase de Impacto:** *"Implementamos seguridad con estándares de banca central: TRUSTWORTHY apagado, firmas criptográficas por certificado y principio de menor privilegio absoluto. Los datos transaccionales han sido validados y están listos en el Data Warehouse."*
- **Frase de Pase:** *"Samir, la carga ETL está completada en el esquema analítico. Procede a actualizar el cuadro de mando directivo en Power BI."*

---

### 3.6. Samir (23:30 - 28:00 | 4.5 minutos)
- **Tema:** *Inteligencia de Negocio: Data Warehouse en Esquema Estrella/Constelación y Power BI.*
- **Lo que debe proyectar:** Power BI Desktop (`Mundo_Escolar_BI.pbix`) conectado al esquema `dw`.
- **Puntos Críticos a Demostrar en Vivo:**
  1. *Arquitectura Dimensional Constelación:* Explicar brevemente cómo las tablas de hechos (`FactVentas`, `FactCompras`, `FactInventario`) comparten dimensiones conformadas (`DimFecha`, `DimProducto`, `DimCliente`, `DimProveedor`), eliminando la redundancia y optimizando consultas analíticas masivas.
  2. *Refresco en Caliente:* Presionar el botón "Actualizar" en Power BI y mostrar cómo las cifras de ventas y compras absorben instantáneamente los registros generados en la demostración en vivo de Melissa y Daniel.
  3. *Métricas DAX y Visualizaciones Directivas:*
     - Ingresos brutos, recaudación fiscal de IVA para el Ministerio de Hacienda.
     - Rotación de inventario y margen de contribución por categoría.
     - Índice de puntualidad y tardanza de entrega por proveedor.
  4. *Simulador Predictivo What-If:* Mover los parámetros de sensibilidad (ej. aumento del 5% en costos de proveedores o reducción del 10% en margen de papelería) y mostrar cómo el modelo reacciona en tiempo real para apoyar la toma de decisiones gerenciales.
- **Frase de Impacto:** *"Cerramos el círculo de valor de los datos: desde que un cliente compra un cuaderno en el mostrador hasta que la junta directiva visualiza el impacto en la rentabilidad neta a través de nuestro Data Warehouse."*
- **Frase de Pase:** *"Con esto completamos la demostración funcional integral del sistema Mundo Escolar. Pasamos a las conclusiones y quedamos a disposición del distinguido jurado."*

---

### 3.7. Cierre y Defensa en Equipo (28:00 - 30:00 | 2.0 minutos)
- **Postura:** Todo el equipo visible, con micrófonos activos y cámaras enfocadas.
- **Mensaje de Cierre:** Resumir en 30 segundos:
  - Robustez relacional 3FN.
  - Integridad transaccional ACID y automatización de kárdex.
  - Seguridad blindada con Module Signing y PoLP.
  - Arquitectura analítica OLAP desacoplada de la base operativa.

---

## 4. BANCO DE PREGUNTAS TRAMPA DEL PROFESOR Y RESPUESTAS BLINDADAS

### P1: ¿Por qué no programaron la lógica de negocio en el Backend de NestJS en lugar de llenar la base de datos de Stored Procedures?
> **Respuesta de Daury / Mauricio:**  
> *"La delegación de reglas críticas a la base de datos obedece al principio de persistencia agnóstica e integridad atómica. Si mañana la empresa decide habilitar una app móvil nativa, una integración B2B por API externa o una carga por lotes, las reglas financieras de IVA, cupo de crédito y kárdex se mantienen inalterables porque residen en el motor. Además, minimizamos la latencia de red al evitar múltiples viajes de ida y vuelta (round-trips) entre el backend y SQL Server, aprovechando los planes de ejecución precompilados del motor."*

### P2: ¿Por qué se tomaron la molestia de implementar Module Signing con certificados si con `ALTER DATABASE SET TRUSTWORTHY ON` se resolvían los permisos de respaldo?
> **Respuesta de Mauricio:**  
> *"Porque encender `TRUSTWORTHY ON` es una vulnerabilidad crítica documentada por Microsoft y calificada con alta severidad en auditorías de seguridad. Si una base tiene TRUSTWORTHY encendido, cualquier usuario con rol `db_owner` puede elevar privilegios a nivel de instancia (`sysadmin`) mediante código arbitrario. Con Module Signing logramos la segregación estricta: firmamos criptográficamente solo los 4 procedimientos de mantenimiento con un certificado asimétrico; el procedimiento hereda temporalmente la capacidad de respaldo sin que el usuario de la aplicación ni la base tengan privilegios desmedidos sobre el servidor."*

### P3: ¿Cómo evitan que dos cajeros vendan simultáneamente el último producto en inventario y causen stock negativo?
> **Respuesta de Daury / Melissa:**  
> *"Mediante la transaccionalidad ACID en `SP_Venta_Confirmar` con nivel de aislamiento controlado y bloqueos de fila (`ROWLOCK` / `UPDLOCK`). Cuando se procesa una línea de venta, el procedimiento evalúa `Stock_Actual >= Cantidad`. Si dos procesos intentan debitar el mismo producto al mismo instante, el motor serializa la transacción; el primer cajero consumirá el saldo y el segundo recibirá de inmediato una excepción controlada generada por nuestro bloque `TRY...CATCH` que cancela la venta con `ROLLBACK` antes de comprometer el kárdex."*

### P4: ¿Por qué separaron `Cliente_Particular` y `Cliente_Institucional` en tablas hijas en lugar de dejar una sola tabla `Cliente` con campos nulos?
> **Respuesta de José:**  
> *"Obedece al patrón de diseño relacional de Subtipado / Herencia y a la estricta aplicación de la Tercera Forma Normal (3FN). Un cliente institucional tiene Razón Social, Cédula Jurídica, cupo de crédito y plazo comercial, mientras que un particular tiene Nombre, Apellidos y Cédula de Identidad física. Unificarlos generaría una tabla ancha con dispersión masiva de campos `NULL`, rompiendo la coherencia de las restricciones de dominio (`NOT NULL`) y dificultando la indexación."*

### P5: ¿Qué impacto tuvo la Ley 9635 (Fortalecimiento de las Finanzas Públicas) en la arquitectura de la base de datos?
> **Respuesta de Melissa / Mauricio:**  
> *"Obligó a erradicar cualquier tasa de IVA fija o quemada al 13%. En nuestra base de datos, cada producto y servicio posee una columna de alícuota tributaria individual (`Porcentaje_IVA`) que admite la canasta básica (1%), insumos agropecuarios (2%), servicios de salud (4%), bienes diferenciados (8%), tarifa general (13%) y exentos. En la tabla `Venta_Producto` se almacena históricamente la tasa y el monto recaudado al momento exacto de la emisión para cumplir con la trazabilidad tributaria exigida por la Dirección General de Tributación."*

### P6: ¿Por qué crearon un esquema `dw` dentro de la base de datos en vez de conectar Power BI directamente a las tablas transaccionales `dbo`?
> **Respuesta de Samir:**  
> *"Conectar herramientas de reportería pesada directamente a las tablas transaccionales de ventas e inventario genera contención de bloqueos (locks) que degradan el tiempo de respuesta de los cajeros en el mostrador. Diseñamos un esquema dimensional en estrella (`dw`) con tablas de hechos y dimensiones que almacenan claves subrogadas numéricas (`Sk_*`). Esto permite a Power BI realizar agregaciones columnares ultrarrápidas sin tocar las tablas de producción."*

### P7: ¿Qué sucede si la energía eléctrica falla o la red se desconecta justo cuando se está confirmando una venta o compra?
> **Respuesta de Mauricio / Daury:**  
> *"SQL Server opera bajo el mecanismo WAL (Write-Ahead Logging). Toda transacción se registra primero en el Transaction Log (`.ldf`) en el filegroup transaccional. Gracias a `SET XACT_ABORT ON` y nuestras cláusulas `ROLLBACK TRANSACTION`, si el proceso se interrumpe abruptamente, el motor ejecuta un proceso de 'Undo' al reiniciarse, deshaciendo cualquier inserción parcial. La base de datos siempre regresa al último estado consistente conocido, sin facturas huérfanas ni inventarios desalineados."*

### P8: ¿Por qué dividieron la base de datos en múltiples Filegroups (`FG_TRANSACCIONAL`, `FG_AUDITORIA`, `PRIMARY`)?
> **Respuesta de Mauricio:**  
> *"Por optimización de I/O y estrategia DRP (Disaster Recovery Plan). Las tablas transaccionales de alto movimiento de escritura (`Movimiento_Inventario`) y las de auditoría inmutable (`Bitacora`) residen en contenedores lógicos independientes. Esto permite balancear las lecturas/escrituras en diferentes discos y nos da la capacidad técnica de realizar respaldos y restauraciones selectivas por grupos de archivos (*Piecemeal Restore*) en caso de una catástrofe en disco."*

### P9: ¿Cómo auditan el cumplimiento de entrega (SLA) y la tardanza de los proveedores?
> **Respuesta de Daniel:**  
> *"La relación entre producto y proveedor establece contractualmente los `Dias_Demora_Entrega` esperados. Al emitir la orden de compra, el sistema calcula automáticamente la `Fecha_Prometida`. Cuando el bodeguero recibe la mercancía física en la aplicación, el procedimiento almacena la `Fecha_Recepcion_Real` y computa `DATEDIFF(day, Fecha_Prometida, Fecha_Recepcion_Real)`. Esta métrica se traslada directamente al Data Warehouse (`dw.FactCompras.Dias_Tardanza_Entrega`), permitiendo calificar objetivamente la confiabilidad de cada proveedor."*

### P10: ¿Qué le impide a un cajero vender a crédito a un cliente que sobrepasó su límite o que está en mora?
> **Respuesta de Melissa / Daury:**  
> *"Una validación atómica en el motor SQL mediante `SP_Cliente_ValidarCapacidadCredito`. Antes de generar la venta a crédito, el procedimiento consulta la vista `VW_CuentasPorCobrar` y suma los saldos de facturas vencidas no pagadas. Si el saldo actual más el monto de la nueva venta excede el `Limite_Credito` autorizado, o si el cliente presenta morosidad mayor a cero días, el procedimiento lanza un error `RAISERROR` con código específico, impidiendo la emisión y notificando al cajero en la pantalla."*

---

## 5. LISTA DE VERIFICACIÓN (CHECKLIST) PREVIA A LA EXPOSICIÓN

### 30 Minutos Antes:
- [ ] **Mauricio:** Verificar que SQL Server esté corriendo (`localhost`).
- [ ] **Mauricio:** Iniciar el backend daemon NestJS (`npm run start:dev --prefix backend`) y asegurar respuesta en `http://localhost:3001/api/health`.
- [ ] **Mauricio:** Abrir SSMS 2022 y cargar las 4 pestañas de `sql/04_scripts_exposicion/` en orden (01, 02, 03, 04).
- [ ] **Melissa:** Abrir frontend en su equipo (`http://<ip-tailscale>:5174`) y probar navegación fluida a POS y Clientes.
- [ ] **Daniel:** Verificar acceso fluido a Compras, Proveedores y Recepción de Mercancía.
- [ ] **Samir:** Abrir Power BI Desktop con `Mundo_Escolar_BI.pbix`, probar conexión al SQL Server de Mauricio y verificar que el botón "Actualizar" funcione en menos de 5 segundos.
- [ ] **José y Daury:** Tener lista la diapositiva con el MER en alta resolución (formato vectorial o imagen 4K nítida).

### Protocolo de Contingencia (Plan B):
- *Si la red de Tailscale presenta latencia:* Melissa y Daniel pueden operar desde el navegador local de Mauricio o una pestaña de incógnito sin perder el guion.
- *Si Power BI demora en refrescar:* Samir explica la estructura de medidas DAX mientras el motor en segundo plano finaliza la importación.
- *Si alguien comete un error de oratoria:* El siguiente orador retoma con la frase de impacto sin disculparse ni dudar, manteniendo el ritmo profesional.
