# SUITE DE SCRIPTS PARA EXPOSICIÓN FINAL EN VIVO - SSMS 2022
**Librería y Papelería Mundo Escolar - Grupo #1**
**Operador de Consola DBA:** Mauricio Chavarría

Esta carpeta contiene los 4 scripts numerados y optimizados para ser abiertos en pestañas independientes en **SQL Server Management Studio (SSMS 22)** antes de iniciar la exposición.

### Instrucciones para Mauricio:
1. Abrir SSMS 2022 y conectarse a la instancia local `localhost` (Base de datos: `MUNDO_ESCOLAR`).
2. Abrir los 4 archivos en pestañas consecutivas de izquierda a derecha:
   - **Pestaña 1:** `01_DEMO_LIVE_TRANSACCION_KARDEX.sql`
   - **Pestaña 2:** `02_DEMO_SEGURIDAD_MODULE_SIGNING.sql`
   - **Pestaña 3:** `03_DEMO_POLP_RBAC_MATRIZ.sql`
   - **Pestaña 4:** `04_DEMO_ETL_GATILLO_DW.sql`
3. **Regla de oro:** No escribir código en vivo. Simplemente seleccionar la pestaña requerida y presionar `[F5]`.

---

### Mapeo de Pestañas con la Exposición:
- **Pestaña 1 (Live Actions):** Se ejecuta en vivo cuando Melissa completa una venta en el POS o cuando Daniel recibe una compra en almacén. Demuestra el commit ACID inmediato, el Kárdex en caliente y el trigger de auditoría.
- **Pestaña 2 (Module Signing):** Se ejecuta durante el turno de Mauricio para demostrar que `TRUSTWORTHY` está en `OFF` (0) y que los procedimientos de mantenimiento están avalados por certificados criptográficos asimétricos.
- **Pestaña 3 (PoLP & RBAC):** Se ejecuta durante el turno de Mauricio para demostrar cómo un usuario vendedor tiene denegado el acceso a `Usuario` (error 229), pero sí puede consultar vistas optimizadas.
- **Pestaña 4 (ETL DW):** Se ejecuta al finalizar el turno de Mauricio para ejecutar `SP_ETL_CargarFactVentas` y `SP_ETL_CargarFactCompras`, pasando la posta a Samir en Power BI.
