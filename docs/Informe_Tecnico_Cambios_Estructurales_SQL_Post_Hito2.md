# INFORME TÉCNICO DE EVOLUCIÓN Y CAMBIOS ESTRUCTURALES EN BASE DE DATOS SQL SERVER (POST-HITO #2)

**Destinatario:** Lic. / Prof. Torrentes — Cátedra de Bases de Datos Avanzadas e Inteligencia de Negocios  
**Proyecto:** Sistema de Información Integral — Librería y Papelería Mundo Escolar  
**Motor:** Microsoft SQL Server 2022 Enterprise / Developer Edition (`localhost:1433/MUNDO_ESCOLAR`)  
**Almacenamiento:** Segmentación Física en `C:\SQLData\` (4 Filegroups Secundarios `.ndf`)  
**Archivos PDF Generados:** 
- [docs/Informe_Tecnico_Cambios_Estructurales_SQL_Post_Hito2.pdf](file:///C:/MUNDO_ESCOLAR/docs/Informe_Tecnico_Cambios_Estructurales_SQL_Post_Hito2.pdf)
- [Informe_Tecnico_Cambios_Estructurales_SQL_Post_Hito2.pdf](file:///C:/MUNDO_ESCOLAR/Informe_Tecnico_Cambios_Estructurales_SQL_Post_Hito2.pdf)

---

## 1. Resumen Ejecutivo y Matriz Comparativa (Hito #2 vs. Estado Actual)

| Componente Estructural | Línea Base: Entrega Hito #2 | Estado Actual: Post-Hito #2 | Impacto Arquitectónico y Justificación |
| :--- | :--- | :--- | :--- |
| **Segmentación Física (Filegroups)** | 1 Filegroup monolítico (`PRIMARY` en archivo `.mdf`). | **5 Filegroups:** `PRIMARY` + 4 secundarios en `C:\SQLData\` (`.ndf`). | Elimina la contención de disco. Separa el tráfico del POS, Data Warehouse, auditoría y catálogos. |
| **Esquema Relacional OLTP** | 33 tablas relacionales en 3FN. | **33 tablas relacionales (3FN)** intactas. (`sys.tables` registra 34 por la tabla técnica interna `dbo.sysdiagrams` de SSMS). | Se preservó la meta oficial de 33 tablas en 3FN. Se operacionalizó `dbo.Producto_Proveedor` en la interfaz. |
| **Esquema Data Warehouse (OLAP)** | 11 tablas (Estrella básico de Ventas). | **14 tablas** (Constelación: 5 dimensiones, 4 hechos). | Incorporación de `dw.DimProveedor`, `dw.FactCompras` y `dw.FactInventario`. Valuación de activos y SLA. |
| **Márgenes y Saneamiento Contable** | Margen bruto ficticio del 100% (ventas sin costo de compra). | **Margen Bruto Real: 36.85%** (Costo: ₡326,225.00 vs Ventas: ₡516,550.00). | Sincronización de costos reales en Kardex y columnas en `dw.FactVentaProducto`. Reseed seguro a 0. |
| **Catálogo de Stored Procedures** | 90 Stored Procedures operacionales. | **96 Stored Procedures de negocio** (102 en motor, 6 nativos SSMS). | Adición de SP 92 (Reabastecimiento), SPs 93-95 (ETLs compras e inventario) y refactorización de SPs 84 y 88. |
| **Vistas de Base de Datos** | 19 Vistas operacionales en esquema `dbo`. | **20 Vistas** (19 en `dbo` + `dw.VW_Analisis_Sensibilidad_WhatIf`). | Permite evaluar simulaciones de inflación y descuentos en Power BI Desktop o mediante Transact-SQL. |
| **Funciones de Negocio** | 16 funciones operativas. | **17 funciones** (inclusión de `dw.FN_SimularImpactoFinanciero`). | Motor determinístico What-If en T-SQL. Ajuste de `dbo.TF_ProductosMasVendidos` para precio promedio. |
| **Auditoría Forense (Triggers)** | 16 Triggers escribiendo en `Bitacora` en `PRIMARY`. | 16 Triggers aislando la escritura en **`FG_AUDITORIA`**. | La auditoría DML inmutable no degrada la latencia del POS en horas pico de facturación. |
| **Estructura de Scripts** | Directorio plano de 24 scripts desorganizados. | **4 subdirectorios especializados** con guía canónica `README.md`. | Eliminación de colisiones de compilación; desacoplamiento de secuencia canónica y respaldos. |

---

## 2. Las 33 Tablas Relacionales (3FN) vs. sysdiagrams de SSMS

El modelo OLTP está compuesto canónicamente por **33 tablas relacionales en Tercera Forma Normal (3FN)**:
1. `Tipo_Cliente`, 2. `Condicion_Pago`, 3. `Tipo_Proveedor`, 4. `Categoria`, 5. `Tipo_Movimiento`, 6. `Estado_Compra`, 7. `Estado_Venta`, 8. `Estado_Factura`, 9. `Metodo_Pago`, 10. `Rol`, 11. `Permiso`, 12. `Servicio`, 13. `Usuario`, 14. `Rol_Usuario`, 15. `Rol_Permiso`, 16. `Bitacora`, 17. `Cliente`, 18. `Cliente_Particular`, 19. `Cliente_Institucional`, 20. `Cliente_Condicion_Pago`, 21. `Proveedor`, 22. `Proveedor_Particular`, 23. `Proveedor_Institucional`, 24. `Producto`, 25. `Producto_Proveedor`, 26. `Movimiento_Inventario`, 27. `Compra`, 28. `Compra_Producto`, 29. `Venta`, 30. `Venta_Producto`, 31. `Venta_Servicio`, 32. `Factura`, 33. `Pago`.

> **Nota:** La tabla número 34 que aparece al ejecutar `SELECT COUNT(*) FROM sys.tables WHERE schema_name = 'dbo'` es **`dbo.sysdiagrams`**, generada automáticamente por Microsoft SQL Server Management Studio para persistir los diagramas visuales en pantalla.
