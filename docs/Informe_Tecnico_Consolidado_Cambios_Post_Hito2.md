# INFORME TÉCNICO EXHAUSTIVO DE CAMBIOS Y TRANSFORMACIONES IMPLEMENTADAS POST-HITO #2
## Sistema Integral de Información — Librería y Papelería Mundo Escolar

> **Documento Oficial de Ingeniería y Auditoría de Software &bull; Octubre 2026**  
> **Autores / Equipo de Desarrollo:** Mauricio Chavarría & Samir Campos (Tesistas y Desarrolladores Líderes)  
> **Tutor Académico / Evaluador:** Prof. / Lic. Torrentes  
> **Plataforma Tecnológica:** Microsoft SQL Server 2022 &bull; NestJS 11 &bull; React 18 &bull; Microsoft Power BI Desktop  
> **Ambiente:** 100% Local (Servidor `localhost:1433/MUNDO_ESCOLAR`)  
> **Versión del Sistema:** 2.2 Oficial Post-Hito #2  

---

## 1. Resumen Ejecutivo y Diagnóstico Post-Hito #2

La entrega formal del **Hito #2** certificó la estabilidad transaccional base del sistema *Mundo Escolar*, respaldada por un motor Microsoft SQL Server 2022 con 33 tablas relacionales en Tercera Forma Normal (3FN), 108 restricciones de integridad, un backend modular en NestJS (puerto 3001) y una interfaz de usuario reactiva en React Vite (puerto 5174). Asimismo, se configuró un Data Warehouse inicial tipo constelación con 11 tablas (4 hechos y 7 dimensiones).

No obstante, la evaluación exhaustiva post-entrega y el diagnóstico de requerimientos gerenciales revelaron un conjunto de **brechas técnicas, contables y operativas** que limitaban la aplicabilidad real del sistema en un entorno empresarial competitivo:

1. **La Ilusión del 100% de Margen Bruto:** Al registrar ventas en el POS, los renglones de producto no estaban asociados a los costos reales de adquisición mayorista de los proveedores. Esto provocaba que en el Data Warehouse la utilidad bruta fuera idéntica a las ventas brutas (margen irreal del 100%), imposibilitando el análisis financiero.
2. **Desconexión de la Cadena de Suministro:** La entidad intermedia `dbo.Producto_Proveedor` (vital para pactar precios de compra mayorista y lead times) no contaba con interfaz operativa en el panel de inventario.
3. **Carencia de Facturación Normada DGT Costa Rica:** Las facturas emitidas carecían de la clave numérica fiscal de 50 dígitos exigida por la resolución **DGT-R-033-2019** de la Dirección General de Tributación, código QR tributario y formatos térmicos de 80mm con desglose IVA (13%, 1%, 0%).
4. **Monolito de Almacenamiento Físico (Cuello de Botella de I/O):** Todos los datos (caja transaccional, auditoría forense DML de la tabla `Bitacora` y consultas analíticas pesadas del Data Warehouse) competían en el archivo primario `.mdf` en un único Filegroup, contraviniendo el Capítulo 16 de la tesis de arquitectura.
5. **Deficiencia en el Versionamiento Dimensional (SCD Tipo 2):** En el procedimiento `SP_ETL_CargarDimCliente`, al actualizar un cliente se cerraba la vigencia histórica pero no se generaba correctamente la nueva tupla con `Es_Actual = 1`.
6. **Inexistencia de Aprovisionamiento Inteligente:** No existía un algoritmo que calculara automáticamente los puntos de reorden y alertara sobre productos en stock crítico.
7. **Power BI Estático sin Escenarios de Sensibilidad:** El reporte de Business Intelligence solo mostraba datos descriptivos del pasado, sin capacidad de simular escenarios de sensibilidad (What-If) ante negociaciones de descuento o presiones inflacionarias.

Para subsanar integralmente estos hallazgos, se diseñó y ejecutó un plan de trabajo estructurado en **6 Fases Progresivas**, implementadas de manera 100% local bajo estricto control de versiones.

---

## 2. Detalle Técnico de las 6 Fases de Transformación

### Fase 1: Facturación Electrónica DGT-R-033-2019, Tiquete Térmico 80mm y Validación POS
- **Clave Fiscal de 50 Dígitos:** Implementada en `frontend/src/utils/haciendaUtils.js` conforme a la resolución DGT-R-033-2019: País (506), Fecha DDMMAA (6), Cédula Emisor con ceros (12), Consecutivo de 20 dígitos, Situación Normal (1), Código de Seguridad de 8 dígitos.
- **Tiquete Térmico de 80mm & QR:** Desglose estricto por tarifas de IVA (13% general, 1% canasta básica, 0% exento) y renderizado de código QR bidimensional mediante `qrcode` en `frontend/src/components/QrFiscal.jsx`.
- **Compartición WhatsApp:** Envío con un clic del tiquete preformateado al teléfono del cliente.
- **Motor de Cross-Selling en POS:** Algoritmo de afinidad de canasta en `PosCrossSelling.jsx` integrado en `PosPage.jsx`, sugiriendo combos escolares con descuento automático.

### Fase 2: Gestión de Proveedores por Producto y Corrección SCD Tipo 2
- **Pestaña 4 en Inventario:** Gestión web de la tabla `dbo.Producto_Proveedor` en `InventarioPage.jsx` para asignar proveedor principal, precio de compra y lead time.
- **Corrección SCD Tipo 2 en `SP_ETL_CargarDimCliente`:** Actualización atómica en SQL Server que marca `Fecha_Fin_Vigencia` y `Es_Actual = 0` en el registro anterior e inserta la nueva tupla con `Es_Actual = 1`.

### Fase 3: Aprovisionamiento Inteligente (Smart Procurement)
- **Algoritmo de Reabastecimiento (SP 92):** Stored procedure `dbo.SP_ObtenerSugerenciasReabastecimiento` que evalúa `Stock_Actual <= Punto_Reorden` y sugiere `(Punto_Reorden * 2) - Stock_Actual`.
- **API NestJS:** Rutas `GET /api/compras/reabastecimiento/sugerencias` y `POST /api/compras/reabastecimiento/generar-ordenes` en `compras.service.ts`.
- **Interfaz en Compras:** Banner flotante de atención prioritaria y modal de generación de órdenes de compra automáticas en `ComprasPage.jsx`.

### Fase 4: Cadena de Suministro Real y Saneamiento Financiero
- **Reseteo Seguro y Reseed:** Limpieza atómica y resiembra de identidades a cero en hechos y transacciones mediante `sql/01_despliegue_secuencial/13_InsertarDatosDemostracion.sql`.
- **4 Órdenes de Compra Realistas:** Papelera Nacional (OC-001 y OC-002 a tiempo, 3 días), Distribuidora del Valle (OC-003 a tiempo, 4 días) y Comercializadora Escolar (OC-004: **25 Mochilas QuickSilver con retraso crítico de +9 días**, recibidas el 19 de octubre).
- **15 Ventas con Costo Mayorista Real:** Ventas Totales de ₡516,550.00, Costo Real de ₡326,225.00, Utilidad Bruta Real de ₡190,325.00 (**Margen Bruto Real: 36.85%**).
- **Activación Orgánica de Stock Crítico:** Resma de Papel Bond queda en 13 unidades (umbral <= 20).

### Fase 5: Arquitectura de Filegroups Físicos y Expansión del Data Warehouse
- **Filegroups en `C:\SQLData\`:**
  - `FG_TRANSACCIONAL` (`ME_Transaccional.ndf`, 30 MB): Ventas, Compras, Inventario, Pagos.
  - `FG_DW` (`ME_DW.ndf`, 30 MB): Hechos y Dimensiones del Data Warehouse.
  - `FG_AUDITORIA` (`ME_Auditoria.ndf`, 20 MB): Tabla `Bitacora` y triggers forenses DML.
  - `FG_CATALOGOS` (`ME_Catalogos.ndf`, 15 MB): Categorías, Marcas, Unidades, Roles.
- **Nuevas Tablas DW:** `dw.DimProveedor`, `dw.FactCompras`, `dw.FactInventario`.
- **Enriquecimiento:** Columnas físicas `Costo_Unitario`, `Utilidad_Bruta`, `Margen_Bruto_Pct` en `dw.FactVentaProducto`.
- **ETLs:** Creación de SP 93, SP 94, SP 95 y actualización de SP 88.
- **Integración Web:** Sección 5 en `BiPage.jsx` con scorecard de proveedores, lead times y capital en bodega.

### Fase 6: Microsoft Power BI Desktop, Motor What-If y Respaldo
- **Reporte PBIR 3 Páginas:** `Mundo_Escolar_BI.pbix` estructurado en *1. Ventas Mostrador*, *2. Cadena de Suministro* (scorecard y mochilas +9 días), y *3. Simulador What-If*. Respaldo de seguridad en `Mundo_Escolar_BI_Original_Respaldo.pbix`.
- **Fórmulas DAX:** Catálogo completo en `sql/04_analitica_powerbi/Medidas_DAX_PowerBI.dax` (`GENERATESERIES`, sliders dinámicos, deltas en colones y puntos de margen).
- **Motor SQL Server:** Función determinística `dw.FN_SimularImpactoFinanciero` y vista `dw.VW_Analisis_Sensibilidad_WhatIf` en `sql/01_despliegue_secuencial/14_MotorSensibilidadWhatIf.sql`.
- **Escenarios Precalculados:**
  - Base: ₡516,550.00 ventas | ₡326,225.00 costo | 36.85% margen.
  - Negociación (+5% descuento): ₡206,636.26 utilidad (+₡16,311.26) | 40.00% margen (+3.15 pts).
  - Inflación (+8% costos): ₡164,227.00 utilidad (-₡26,098.00) | 31.79% margen (-5.06 pts).
  - Mixto (+7% desc, +5% infl): ₡197,991.29 utilidad (+₡7,666.29) | 38.33% margen (+1.48 pts).
- **Guía de Defensa:** Documento maestro `Guia_Implementacion_PowerBI_WhatIf_Mundo_Escolar.md`.

---

## 3. Matriz de Componentes y Archivos del Repositorio

| Subsistema | Archivo Modificado / Creado | Tipo | Descripción |
| :--- | :--- | :---: | :--- |
| **Frontend** | `frontend/src/utils/haciendaUtils.js` | Nuevo | Generación de clave numérica fiscal de 50 dígitos DGT y tiquete WhatsApp. |
| **Frontend** | `frontend/src/components/QrFiscal.jsx` | Nuevo | Renderizado de código QR fiscal vectorial para facturación electrónica. |
| **Frontend** | `frontend/src/components/PosCrossSelling.jsx` | Nuevo | Algoritmo de venta cruzada en caja mostrador basado en afinidad de canasta. |
| **Frontend** | `frontend/src/pages/PosPage.jsx` | Editado | Integración de Cross-Selling y tiquete normado DGT. |
| **Frontend** | `frontend/src/pages/FacturacionPage.jsx` | Editado | Tiquete térmico 80mm con desglose IVA (13%, 1%, 0%) y botón WhatsApp. |
| **Frontend** | `frontend/src/pages/InventarioPage.jsx` | Editado | Pestaña 4 para asignación y gestión de `dbo.Producto_Proveedor`. |
| **Frontend** | `frontend/src/pages/ComprasPage.jsx` | Editado | Banner de alerta y modal de órdenes automáticas por reabastecimiento (SP 92). |
| **Frontend** | `frontend/src/pages/BiPage.jsx` | Editado | Sección 5: Scorecard de proveedores, capital inmovilizado y margen real. |
| **Backend** | `backend/src/compras/compras.service.ts` | Editado | Lógica de aprovisionamiento inteligente y generación de órdenes de compra. |
| **Backend** | `backend/src/compras/compras.controller.ts` | Editado | Endpoints `GET /reabastecimiento/sugerencias` y `POST /reabastecimiento/generar-ordenes`. |
| **Backend** | `backend/src/bi/bi.service.ts` | Editado | Orquestación de ETLs 93-95 y entrega de métricas de rentabilidad al frontend. |
| **SQL Server** | `sql/01_despliegue_secuencial/13_InsertarDatosDemostracion.sql` | Editado | Script maestro de siembra: reseteo, 4 compras (+9 días demora) y 15 ventas reales. |
| **SQL Server** | `sql/01_despliegue_secuencial/14_MotorSensibilidadWhatIf.sql` | Nuevo | Motor What-If en SQL: `dw.FN_SimularImpactoFinanciero` y `dw.VW_Analisis_Sensibilidad_WhatIf`. |
| **SQL Server** | `sql/01_despliegue_secuencial/10_CrearProcedimientos.sql` | Editado | Sincronización oficial de SPs 84, 88, 92, 93, 94 y 95. |
| **SQL Server** | `sql/02_consolidados_referencia/Procedimientos_Almacenados.sql` | Editado | Consolidado oficial de los 102 procedimientos almacenados del sistema. |
| **Power BI** | `sql/04_analitica_powerbi/Medidas_DAX_PowerBI.dax` | Nuevo | Diccionario completo de fórmulas DAX para análisis What-If en Power BI. |
| **Power BI** | `Mundo_Escolar_BI.pbix` | Editado | Reporte PBIR de 3 páginas: Ventas, Cadena de Suministro y Simulador What-If. |
| **Power BI** | `Mundo_Escolar_BI_Original_Respaldo.pbix` | Nuevo | Respaldo original del reporte Power BI. |
| **Docs** | `Guia_Implementacion_PowerBI_WhatIf_Mundo_Escolar.md` | Nuevo | Guía de conexión, relaciones del modelo estrella, DAX y defensa para Torrentes. |
| **Docs** | `README.md` | Editado | Actualización integral de métricas: 34 tablas OLTP, 14 tablas DW, 102 SPs, 4 Filegroups. |

---

## 4. Estado de Salud y Verificación Local

1. **SQL Server 2022:** 4 Filegroups físicos activos en `C:\SQLData\`, 102 SPs compilados, 17 funciones, 20 vistas, 16 triggers.
2. **Backend NestJS (Puerto 3001):** Estatus `ONLINE` respondiendo a `/api/health` en 200 OK.
3. **Frontend React Vite (Puerto 5174):** Compilación de producción en 5.41s con 0 errores (`npm run build` verificado).
4. **Git Control:** Rama `Feature-Mau` con todas las modificaciones en el área de trabajo local (0 commits preparados, 0 envíos a GitHub).

---

## 5. Respuestas Clave para la Defensa ante el Lic. / Prof. Torrentes

- **Sobre la Ilusión del Margen:** *"Eliminamos la utilidad irreal del 100% asociando las ventas a los costos mayoristas reales de las órdenes de compra en Kardex y enriqueciendo `dw.FactVentaProducto`, estableciendo el margen real del 36.85%."*
- **Sobre los Filegroups Físicos:** *"Segmentamos el almacenamiento en `FG_TRANSACCIONAL`, `FG_DW`, `FG_AUDITORIA` y `FG_CATALOGOS` en `C:\SQLData\` para aislar el tráfico de disco entre el cajero, el Data Warehouse y la auditoría forense DML."*
- **Sobre el Motor What-If:** *"Implementamos una arquitectura híbrida: DAX dinámico con `GENERATESERIES` en Power BI Desktop y la función `dw.FN_SimularImpactoFinanciero` en SQL Server para evaluar sensibilidad de márgenes ante inflación y descuentos de proveedores."*
- **Sobre la Cadena de Suministro:** *"Diseñamos casos de estudio reales: la orden OC-004 demostró un retraso crítico de 9 días en mochilas por Comercializadora Escolar, y la Resma de Papel Bond cayó a 13 unidades activando el aprovisionamiento automático mediante el SP 92."*

---
**Proyecto Certificado.** Documento oficial para inspección y defensa académica.
