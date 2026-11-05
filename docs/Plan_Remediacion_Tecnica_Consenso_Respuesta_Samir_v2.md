# Dictamen Técnico de Consenso y Plan de Remediación Definitivo (Versión 2.0)
## Respuesta Oficial y Adopción Integral de las 11 Inconsistencias y 4 Recomendaciones de Samir

**Proyecto:** Librería y Papelería Mundo Escolar — Grupo #1  
**Cátedra:** Administración de Bases de Datos — Lic. / Prof. Torrentes  
**Documento Respondido:** *Informe de Inconsistencias del Plan de Remediación (12 páginas, por Samir)*  
**Commit de Base:** `development @ 14f56ef59ebba4fcad68dfaf58e4ed615874dc29`  
**Fecha de Consenso:** 31 de octubre de 2026  

---

### Resumen Ejecutivo y Dictamen de Equipo
El equipo técnico **adopta en su totalidad (100%)** las once (11) inconsistencias (I-01 a I-11) y las cuatro (4) observaciones complementarias (A-01 a A-04) planteadas por Samir en su informe de revisión técnica.

Se acoge el principio metodológico: *"Aceptar una solución no equivale a declararla resuelta"*. Por tanto, el presente plan establece una matriz formal de estados (`[Planificado]`, `[En Desarrollo]`, `[Integrado]`, `[Probado QA]`, `[Cerrado]`), conteos técnicos certificados y una suite de 22 pruebas de aseguramiento (QA01 a QA22).

---

### 1. Estado y Diagnóstico del Archivo .env
1. **Seguridad Git:** `backend/.env` está formalmente ignorado en `.gitignore` (`git check-ignore` código 0).
2. **Sanitización:** Se reemplaza la contraseña real de desarrollo en `backend/.env.example` por un marcador genérico.
3. **Desacoplamiento:** Se sincronizan las claves en `sql.service.ts` para leer dinámicamente `database.server`, `database.name`, `database.encrypt` y `database.trustServerCertificate` desde `configuration.ts`, eliminando credenciales por defecto en el código fuente.

---

### 2. Síntesis de Adopción de las 11 Inconsistencias
- **I-01 (Estado Documental):** Sustitución de declaraciones de "resuelto" por una matriz de ciclo de vida verificable.
- **I-02 (Conteo de SPs):** Meta unificada en **96 SPs** (95 de negocio + 1 orquestador maestro `dbo.SP_ETL_OrquestarCargaCompleta`).
- **I-03 (Conteo de Funciones):** Meta canónica fijada en **16 funciones** (15 en `dbo` + 1 What-If en `dw`).
- **I-04 (Conteo Tablas DW):** **14 tablas analíticas de negocio (8 dimensiones + 6 hechos) + 1 tabla técnica de control (`dw.Bitacora_ETL`) = 15 tablas físicas**.
- **I-05 (Actor Anónimo en Bitácora):** Asignación de actor técnico reservado (`Id_Usuario = 2`, SYS_PUBLICO) en registros públicos, preservando la restricción `dbo.Bitacora.Id_Usuario INT NOT NULL` sin provocar error 515.
- **I-06 (Nomenclatura ETL):** Adopción exclusiva de `dbo.SP_ETL_OrquestarCargaCompleta`.
- **I-07 (Diccionario DW):** Homologación estricta con el DDL real (`Id_Venta`, `Precio_Base`, etc.).
- **I-08 (Despliegue Seguro):** Creación de script de migración incremental con `ALTER DATABASE ADD FILEGROUP` protegiendo bases existentes de comandos destructivos como `DROP DATABASE`.
- **I-09 (Tareas F4 y F5):** Formalización de tareas ejecutables **P5.4** (recepción vinculada a orden de compra) y **P5.5** (snapshot de inventario retroactivo por movimientos).
- **I-10 (Persistencia Fiscal F6):** Formalización de tarea **P5.6** para `Clave_Numerica_Fiscal VARCHAR(50)` en `dbo.Factura` y documentación de su carácter pedagógico/simulado.
- **I-11 (Política de Costeo):** Valoración de costo de mercadería basada en el costo pactado con el proveedor principal activo al momento de la venta, garantizando la conciliación al céntimo del margen comercial (36.85%).

---

### 3. Matriz de Pruebas Ampliada (QA01 a QA22)
Se integran los 8 escenarios negativos de Samir (QA15 a QA22): recepciones en orden cronológico inverso, corte de inventario histórico en el pasado, modificaciones SCD2, anulación post-ETL, excepciones con rollback y serialización concurrente.
