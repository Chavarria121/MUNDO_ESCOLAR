# PLAN DE REMEDIACIÓN INTEGRAL Y RESPUESTA TÉCNICA A LA AUDITORÍA POST-HITO #2
## Sistema de Información Integral — Librería y Papelería Mundo Escolar

**Destinatarios:** Samir, Mauricio Chavarría y Equipo de Desarrollo (Grupo #1)  
**Cátedra:** Lic. / Prof. Torrentes — Bases de Datos Avanzadas e Inteligencia de Negocios  
**Documento Auditado:** *Auditoría Integral de Mundo Escolar (Emitida por Samir | Fecha de corte: 31/10/2026)*  
**Commit de Base:** `development @ 14f56ef59ebba4fcad68dfaf58e4ed615874dc29`  
**Archivos PDF Generados:** 
- [docs/Plan_Remediacion_Tecnica_Respuesta_Auditoria_Post_Hito2.pdf](file:///C:/MUNDO_ESCOLAR/docs/Plan_Remediacion_Tecnica_Respuesta_Auditoria_Post_Hito2.pdf)
- [Plan_Remediacion_Tecnica_Respuesta_Auditoria_Post_Hito2.pdf](file:///C:/MUNDO_ESCOLAR/Plan_Remediacion_Tecnica_Respuesta_Auditoria_Post_Hito2.pdf)

---

### Resumen Ejecutivo y Dictamen de Aceptación
El equipo de desarrollo de *Mundo Escolar* acepta la totalidad de los hallazgos técnicos señalados en la auditoría de Samir. Su análisis fue riguroso, objetivo y constructivo. El informe reveló con precisión que mejoras críticas que funcionaban localmente en SQL Server no habían sido consolidadas en los scripts canónicos de Git.

---

### Síntesis de Soluciones por Hallazgo Crítico (H1 a H5)

1. **H1 (Dos DW y 3 tablas sin DDL):** Unificación definitiva en `MUNDO_ESCOLAR.dw`. Se agregan los DDLs de `dw.DimProveedor`, `dw.FactCompras` y `dw.FactInventario`, y se enriquece `dw.FactVentaProducto` con `Costo_Unitario` y `Utilidad_Bruta`.
2. **H2 (ETL fragmentada):** Creación de procedimiento maestro orquestador con transaccionalidad, tabla `dw.Bitacora_ETL` y corrección de la unión de ventas con la versión histórica de SCD2 de clientes.
3. **H3 (Configuración SQL en NestJS):** Corrección de `sql.service.ts` para que lea `database.server` y `database.name` desde `configuration.ts`. Eliminación de contraseñas de respaldo en texto plano.
4. **H4 (Filegroups y DROP DATABASE):** Inclusión de los 4 Filegroups en `01_CrearBaseDatos.sql` y cláusulas `ON [FG_*]` en `03_CrearTablas.sql`. Protección condicional contra borrado accidental de base con datos.
5. **H5 (Vulnerabilidad en Registro de Clientes):** Eliminación de `idUsuario` en DTOs públicos. Rechazo con `409 Conflict` si el usuario/correo ya existe (evitando reescritura de contraseñas no autenticada).

---

### Síntesis de Soluciones a Hallazgos Funcionales (F1 a F7)
- **F1 (Compras):** No crear tablas redundantes `Orden_Compra`; formalizar estados en `dbo.Compra`.
- **F2 (Lote de compras):** Transacción atómica en `generarOrdenesSugeridas` con rollback completo si falla un ítem.
- **F3 (Proveedor principal):** Creación de índice único filtrado `UQ_ProductoProveedor_PrincipalActivo`.
- **F4 (Demoras en compras):** Enlace directo entre recepción y orden exacta en `dw.FactCompras`.
- **F5 (Snapshot de inventario):** Reconstrucción de stock histórico retroactivo mediante `Movimiento_Inventario`.
- **F6 (Factura electrónica):** Documentación como emulador normado y adición de columna `Clave_Numerica_Fiscal` en `dbo.Factura`.
- **F7 (Pruebas unitarias):** Actualización de contratos de prueba en Jest/E2E (`getInfo` y `getHealth`).

---

### Corrección Financiera: Discrepancia de ₡50 y Armonización DAX
1. **Venta #13 en Datos Demo:** Subtotal de cabecera ajustado de ₡37,450 a **₡37,500.00** (total ₡42,375.00), eliminando la discrepancia de ₡50 frente a los renglones.
2. **Margen DAX vs SQL:** Aislamiento en DAX de `[Ventas_Netas_Mercaderia]` (sin IVA ni servicios), igualando el margen de Power BI con el **36.85%** oficial de SQL Server.

---

### Plan de Trabajo en 7 Fases
- **Fase 1:** Proteger datos y credenciales (P0).
- **Fase 2:** Sincronizar DDL y documentación (P0/P1).
- **Fase 3:** Unificar el Data Warehouse (P0).
- **Fase 4:** ETL de backend fiable (P1).
- **Fase 5:** Cadena de suministro y métricas (P1).
- **Fase 6:** Power BI y pruebas integrales (P1/P2).
- **Fase 7:** Historiales formales de precios (P3 / Evolutivo).
