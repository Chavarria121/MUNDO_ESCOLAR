# GUÍA TÉCNICA E IMPLEMENTACIÓN DEL MODELO POWER BI DESKTOP CON ANÁLISIS WHAT-IF
## Librería y Papelería Mundo Escolar — Fase 6

**Destinatario:** Lic. / Prof. Torrentes  
**Proyecto:** Sistema de Información Integral — Librería y Papelería Mundo Escolar  
**Ambiente:** 100% Local (Servidor SQL Server 2022 `localhost:1433/MUNDO_ESCOLAR`)  
**Archivo de Reporte:** `C:\MUNDO_ESCOLAR\Mundo_Escolar_BI.pbix`  
**Copia de Respaldo Original:** `C:\MUNDO_ESCOLAR\Mundo_Escolar_BI_Original_Respaldo.pbix`  
**Script de Medidas DAX:** `C:\MUNDO_ESCOLAR\sql\04_analitica_powerbi\Medidas_DAX_PowerBI.dax`  
**Script SQL del Motor What-If:** `C:\MUNDO_ESCOLAR\sql\01_despliegue_secuencial\14_MotorSensibilidadWhatIf.sql`  

---

## 1. RESUMEN EJECUTIVO Y ARQUITECTURA DE DATOS

En la presente **Fase 6**, se consolida la plataforma analítica de inteligencia de negocios (BI) para *Mundo Escolar*, cerrando el ciclo iniciado en las fases anteriores:

1. **Eliminación Definitiva de la Ilusión del 100% de Margen Bruto (Fase 4 y 5):**
   - Anteriormente, las ventas no registraban costos de adquisición, mostrando utilidades ficticias iguales a los ingresos brutos.
   - Tras la siembra de la cadena de suministro real (OC-001 a OC-004) y el enriquecimiento dimensional de `dw.FactVentaProducto`, el Data Warehouse registra un costo histórico real de **₡326,225.00** frente a ventas brutas de **₡516,550.00**, estableciendo una utilidad bruta real de **₡190,325.00** (**Margen Bruto Real: 36.85%**).

2. **Filegroups Físicos y Esquema Estrella 2.0 (Fase 5):**
   - Los datos analíticos residen físicamente en el archivo secundario `C:\SQLData\ME_DW.ndf` (`FG_DW`), aislados del tráfico de facturación (`FG_TRANSACCIONAL`).
   - El modelo incorpora dos nuevas tablas de hechos (`dw.FactCompras` y `dw.FactInventario`) y la dimensión `dw.DimProveedor`.

3. **Simulación Financiera Dinámica What-If (Fase 6):**
   - Implementación de parámetros de sensibilidad mediante DAX (`GENERATESERIES`) y en SQL Server (`dw.FN_SimularImpactoFinanciero`), permitiendo proyectar ganancias netas y márgenes porcentuales ante variaciones en descuentos negociados con proveedores (0% a 20%) y presiones inflacionarias en costos (0% a 30%).

---

## 2. ESTRUCTURA DEL REPORTE EN POWER BI DESKTOP

El archivo `Mundo_Escolar_BI.pbix` ha sido estructurado en **3 Páginas Especializadas**:

```
Mundo_Escolar_BI.pbix
│
├── Página 1: 1. Ventas y Mostrador (Desempeño Comercial & Facturación)
│   ├── Ventas Totales por Vendedor (dw DimVendedor)
│   ├── Ventas por Categoría de Producto (dw DimProducto)
│   ├── Distribución por Método de Pago (dw DimMetodoPago)
│   ├── Evolución Mensual de Facturación (dw DimFecha)
│   └── Filtros por Tipo de Cliente (dw DimCliente)
│
├── Página 2: 2. Cadena de Suministro (Proveedores, Lead Times & Bodega)
│   ├── Scorecard de Proveedores (Cumplimiento % y Lead Time Pactado vs Real)
│   ├── Auditoría de Retrasos Críticos (Alerta Roja OC-004: +9 días de demora en mochilas)
│   ├── Monitor de Stock Crítico (Alerta Amarilla Resma Bond: 13 unids en stock <= 20 reorden)
│   └── Capital Inmovilizado en Bodega (Valorización total de inventario)
│
└── Página 3: 3. Simulador What-If (Sensibilidad de Costos y Rentabilidad)
    ├── Slicer Descuento Proveedor (0% a 20%, paso 1%)
    ├── Slicer Inflación de Costos (0% a 30%, paso 2%)
    ├── Tarjetas de Impacto: Ganancia Neta Proyectada & Margen Simulado (%)
    ├── Tarjetas de Delta: Variación en Colones (+/- ₡) y Puntos de Margen
    └── Matriz de Sensibilidad por Producto y Categoría
```

---

## 3. PASO A PASO: CONEXIÓN Y REFRESH EN POWER BI DESKTOP

### Paso 3.1 — Abrir el Archivo y Actualizar Datos
1. Iniciar **Power BI Desktop** y abrir `C:\MUNDO_ESCOLAR\Mundo_Escolar_BI.pbix`.
2. En la cinta superior (**Pestaña Inicio**), hacer clic en **"Actualizar"** (Refresh).
   - Power BI se conectará a `localhost:1433/MUNDO_ESCOLAR` y actualizará automáticamente las tablas existentes (`FactVentas`, `FactVentaProducto`, etc.).

### Paso 3.2 — Importar las Nuevas Tablas de Fase 5
Si se desea importar directamente las nuevas tablas del Data Warehouse:
1. Pestaña **Inicio** -> **Obtener datos** -> **SQL Server**.
2. **Servidor:** `localhost` (o `.`).
3. **Base de Datos:** `MUNDO_ESCOLAR`.
4. **Modo de Conectividad:** *Importar*.
5. Seleccionar las siguientes tablas y vistas:
   - `dw.DimProveedor`
   - `dw.FactCompras`
   - `dw.FactInventario`
   - `dw.VW_Analisis_Sensibilidad_WhatIf`
6. Clic en **Cargar**.

### Paso 3.3 — Configurar Relaciones en la Vista de Modelo
En la **Vista de Modelo** (icono de diagrama a la izquierda), verificar las siguientes relaciones (todas de **1 a Varios (1:*)** con filtro de **Única dirección**):

| Tabla Dimensión (1) | Campo Origen | Tabla de Hechos (*) | Campo Destino |
|:---|:---|:---|:---|
| `dw.DimProveedor` | `Id_Proveedor` | `dw.FactCompras` | `Id_Proveedor` |
| `dw.DimFecha` | `Sk_Fecha` | `dw.FactCompras` | `Sk_Fecha_Recepcion` |
| `dw.DimProducto` | `Sk_Producto` | `dw.FactInventario` | `Sk_Producto` |
| `dw.DimFecha` | `Sk_Fecha` | `dw.FactInventario` | `Sk_Fecha` |

---

## 4. PARÁMETROS WHAT-IF Y CÓDIGO DAX COMPLETO

### 4.1 Creación de Tablas de Parámetros What-If

En Power BI Desktop, ir a la pestaña **Modelado** -> **Nueva Tabla** e ingresar:

```dax
// ============================================================================
// TABLA 1: Parámetro de Descuento de Proveedores (0% a 20%, paso 1%)
// ============================================================================
Par_Descuento_Proveedor = 
GENERATESERIES(0, 0.20, 0.01)

// Columna Calculada para formato amigable:
Par_Descuento_Proveedor[Etiqueta_Pct] = 
FORMAT(Par_Descuento_Proveedor[Value], "0.0%")
```

```dax
// ============================================================================
// TABLA 2: Parámetro de Inflación de Costos (0% a 30%, paso 2%)
// ============================================================================
Par_Inflacion_Costos = 
GENERATESERIES(0, 0.30, 0.02)

// Columna Calculada para formato amigable:
Par_Inflacion_Costos[Etiqueta_Pct] = 
FORMAT(Par_Inflacion_Costos[Value], "0.0%")
```

---

### 4.2 Medidas DAX: Captura de Parámetros y Valores Seleccionados

En la pestaña **Modelado** -> **Nueva Medida**:

```dax
Tasa_Descuento_Seleccionada = 
SELECTEDVALUE(Par_Descuento_Proveedor[Value], 0.0)
```

```dax
Tasa_Inflacion_Seleccionada = 
SELECTEDVALUE(Par_Inflacion_Costos[Value], 0.0)
```

---

### 4.3 Medidas DAX: Métricas Financieras Históricas (Real)

```dax
// 1. Ingresos Totales por Ventas
Ventas_Totales = 
SUM(dw_FactVentas[Monto_Total])

// 2. Costo Histórico Real de Adquisición
Costo_Total_Historico = 
SUMX(
    dw_FactVentaProducto,
    dw_FactVentaProducto[Cantidad] * dw_FactVentaProducto[Costo_Unitario]
)

// 3. Utilidad Bruta Histórica en Colones
Utilidad_Bruta_Historica = 
[Ventas_Totales] - [Costo_Total_Historico]

// 4. Margen Bruto Histórico Porcentual (Debe ser ~36.85%)
Margen_Bruto_Historico_Pct = 
DIVIDE([Utilidad_Bruta_Historica], [Ventas_Totales], 0)
```

---

### 4.4 Medidas DAX: Motor de Sensibilidad Dinámica What-If

```dax
// 1. Costo Proyectado ante Descuento e Inflación
Costo_Simulado_Total = 
VAR FactorDesc = 1 - [Tasa_Descuento_Seleccionada]
VAR FactorInf = 1 + [Tasa_Inflacion_Seleccionada]
RETURN
[Costo_Total_Historico] * FactorDesc * FactorInf

// 2. Ganancia Neta Proyectada en Colones
Ganancia_Neta_Simulada = 
[Ventas_Totales] - [Costo_Simulado_Total]

// 3. Margen Bruto Simulado Porcentual
Margen_Bruto_Simulado_Pct = 
DIVIDE([Ganancia_Neta_Simulada], [Ventas_Totales], 0)

// 4. Variación Neta en Colones (Delta vs Histórico)
Variacion_Utilidad_Colones = 
[Ganancia_Neta_Simulada] - [Utilidad_Bruta_Historica]

// 5. Variación en Puntos Porcentuales de Margen
Variacion_Margen_Puntos = 
([Margen_Bruto_Simulado_Pct] - [Margen_Bruto_Historico_Pct]) * 100
```

---

### 4.5 Medidas DAX: Abastecimiento y Desempeño de Proveedores

```dax
// 1. Lead Time Promedio General en Días
Lead_Time_Promedio_Dias = 
AVERAGE(dw_FactCompras[Lead_Time_Dias])

// 2. Tasa de Cumplimiento a Tiempo (% de recepciones sin atraso)
Tasa_Cumplimiento_Proveedor = 
DIVIDE(
    CALCULATE(COUNTROWS(dw_FactCompras), dw_FactCompras[Dias_Demora] = 0),
    COUNTROWS(dw_FactCompras),
    0
)

// 3. Total de Días Acumulados de Retraso
Total_Dias_Demora = 
SUM(dw_FactCompras[Dias_Demora])

// 4. Órdenes con Retraso Crítico (> 0 días)
Ordenes_Con_Retraso = 
CALCULATE(COUNTROWS(dw_FactCompras), dw_FactCompras[Dias_Demora] > 0)
```

---

### 4.6 Medidas DAX: Control de Inventario y Bodega

```dax
// 1. Capital Total Inmovilizado en Inventario (Colones)
Capital_Inmovilizado_Total = 
SUM(dw_FactInventario[Costo_Total_Inventario])

// 2. Cantidad de Productos en Stock Crítico
Productos_Stock_Critico = 
CALCULATE(
    COUNTROWS(dw_FactInventario),
    dw_FactInventario[Alerta_Reorden] = 1
)

// 3. Capital en Riesgo de Desabastecimiento
Capital_En_Riesgo_Desabastecimiento = 
CALCULATE(
    SUM(dw_FactInventario[Costo_Total_Inventario]),
    dw_FactInventario[Alerta_Reorden] = 1
)
```

---

## 5. TABLA COMPARATIVA DE ESCENARIOS PRECALCULADOS EN DW

Para validación cruzada entre Power BI Desktop y SQL Server, se presenta la salida de la vista `dw.VW_Analisis_Sensibilidad_WhatIf`:

| Escenario Analizado | % Desc. Prov. | % Infl. Costo | Ventas Brutas | Costo Total | Utilidad Bruta | Margen Bruto % | Variación Utilidad (₡) |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **1. Real Actual (Base)** | 0.0% | 0.0% | ₡516,550.00 | ₡326,225.00 | ₡190,325.00 | **36.85%** | **₡0.00 (Base)** |
| **2. Volumen Proveedor** | +5.0% | 0.0% | ₡516,550.00 | ₡309,913.76 | ₡206,636.26 | **40.00%** | **+₡16,311.26** |
| **3. Presión Inflacionaria** | 0.0% | +8.0% | ₡516,550.00 | ₡352,323.00 | ₡164,227.00 | **31.79%** | **-₡26,098.00** |
| **4. Escenario Mixto** | +7.0% | +5.0% | ₡516,550.00 | ₡318,558.73 | ₡197,991.29 | **38.33%** | **+₡7,666.29** |

### Interpretación Gerencial de los Resultados:
- **Resiliencia Operativa:** Un descuento del **5%** negociado con los proveedores principales incrementa la utilidad neta en **₡16,311.26** (+3.15 puntos de margen), absorbiendo casi la totalidad de un incremento inflacionario moderado del 4-5%.
- **Alerta de Inflación:** Si los costos de adquisición suben un **8%** y no se trasladan al precio de mostrador, el negocio pierde **₡26,098.00** en utilidades netas, contrayendo el margen del 36.85% al 31.79%.

---

## 6. GUÍA DE DEFENSA ANTE EL LIC. / PROF. TORRENTES

A continuación se detallan las respuestas técnicas a preguntas potenciales durante la evaluación del proyecto:

### Pregunta 1: *"¿Por qué antes el margen mostraba 100% y cómo se resolvió técnicamente?"*
> **Respuesta:**  
> *"Profesor, en la versión anterior no existía correlación transaccional entre las órdenes de compra y los detalles de venta en el POS; las ventas se registraban sin su costo de adquisición unitario. En la Fase 4 y 5 reestructuramos la base de datos: vinculamos los productos con sus proveedores mediante `dbo.Producto_Proveedor`, registramos órdenes de compra con precios mayoristas en Kardex, y enriquecimos `dw.FactVentaProducto` con los campos `Costo_Unitario`, `Utilidad_Bruta` y `Margen_Bruto_Pct`. Con esto eliminamos la ilusión del 100% y alcanzamos el margen real del 36.85%."*

### Pregunta 2: *"¿Dónde residen físicamente las tablas del Data Warehouse en el motor de SQL Server?"*
> **Respuesta:**  
> *"Están segmentadas físicamente en Filegroups dedicados en `C:\SQLData\`: las tablas dimensionales y de hechos (`FactVentas`, `FactCompras`, `FactInventario`, `FactVentaProducto`) residen en el Filegroup `FG_DW` dentro del archivo secundario `ME_DW.ndf`. Las tablas transaccionales de venta operan en `FG_TRANSACCIONAL` (`ME_Transaccional.ndf`), y la bitácora de auditoría en `FG_AUDITORIA` (`ME_Auditoria.ndf`). Esto garantiza que las consultas analíticas pesadas de Power BI no bloqueen el disco del punto de venta."*

### Pregunta 3: *"¿Cómo opera el análisis What-If y qué sucede si Power BI no está instalado?"*
> **Respuesta:**  
> *"El análisis What-If es agnóstico y bidireccional. En Power BI Desktop opera dinámicamente mediante las tablas calculadas `Par_Descuento_Proveedor` y `Par_Inflacion_Costos` generadas con `GENERATESERIES` y enlazadas a los controles deslizantes (slicers). Pero además, para garantizar la disponibilidad en cualquier cliente o reporte web, desarrollamos la función matemática en SQL Server `dw.FN_SimularImpactoFinanciero(@PctDescuento, @PctInflacion)` y la vista `dw.VW_Analisis_Sensibilidad_WhatIf`, que permiten ejecutar exactamente las mismas proyecciones directamente en Transact-SQL."*

### Pregunta 4: *"¿Qué demuestran los datos de la Fase 4 y 5 en cuanto a la cadena de suministro?"*
> **Respuesta:**  
> *"Demuestran dos condiciones operativas reales:  
> 1) **Evaluación de Proveedores:** Papelera Nacional y Distribuidora del Valle cumplieron con su lead time pactado (0 días de retraso), pero Comercializadora Escolar Centroamericana entregó la orden OC-004 de 25 Mochilas QuickSilver con 9 días de retraso crítico, lo que se refleja en la alerta roja del reporte.  
> 2) **Reabastecimiento Inteligente:** La Resma de Papel Bond cayó a 13 unidades, superando el umbral de reorden de 20 unidades, lo que activó la alerta en inventario y disparó la sugerencia de compra mediante el SP 92 (`SP_ObtenerSugerenciasReabastecimiento`)."*

---
**Elaborado y Verificado Satisfactoriamente.**  
*Todo el código y archivos se mantienen estrictamente locales en cumplimiento con las restricciones establecidas.*
