# Propuesta Técnica de Solución: Arquitectura de Respaldos, Seguridad y DRP
**Plan Integral de Mitigación en Respuesta a las Observaciones de Auditoría DBA de Samir**  
*Mundo Escolar S.A. — ERP, POS, Inventario, Facturación & BI*  
*Autor: Mauricio Chavarría Pérez (Liderazgo Técnico) · Octubre 2026*

---

## 1. Resumen de la Solución
El presente documento formaliza las soluciones técnicas a las observaciones comentadas por Samir:
1. **Seguridad y Permisos (PoLP):** Encapsulamiento con `WITH EXECUTE AS OWNER` en los SPs de respaldo para que `login_mundo_app` pueda ejecutarlos sin requerir privilegios de `sa` ni permisos globales desmedidos.
2. **Aprovisionamiento Automatizado del Filesystem:** Script de PowerShell (`Preparar_Carpeta_Respaldos.ps1`) que otorga permisos ACL a la cuenta de servicio del motor SQL Server (`NT SERVICE\MSSQLSERVER`), evitando errores de acceso denegado.
3. **Protocolo DRP Fuera de Banda:** Justificación formal de por qué la restauración no se expone vía web (prevención de DoS y caída de conexiones de NestJS) y provisión del Runbook de restauración y pruebas no destructivas en base clonada (`MUNDO_ESCOLAR_DRP_TEST`).
4. **Automatización Multiplataforma:** Estrategia portable mediante Programador de Tareas de Windows (Task Scheduler) para ediciones Express, y jobs de SQL Server Agent para ediciones Enterprise/Developer.
5. **Regla 3-2-1 y Copia Off-Site:** Script de replicación post-backup hacia almacenamiento externo (NAS/Cloud Storage) delimitando la frontera de infraestructura.

---

## 2. Checklist de Cambios Técnicos
- [ ] Aplicar `WITH EXECUTE AS OWNER` a los procedimientos 69 a 72 en `sql/01_despliegue_secuencial/10_CrearProcedimientos.sql`.
- [ ] Añadir `ALTER ROLE db_backupoperator ADD MEMBER usr_mundo_app;` en `sql/03_administracion_mantenimiento/Seguridad.sql`.
- [ ] Incorporar script PowerShell `Preparar_Carpeta_Respaldos.ps1`.
- [ ] Mantener documentación y PDF locales fuera del repositorio remoto Git.
