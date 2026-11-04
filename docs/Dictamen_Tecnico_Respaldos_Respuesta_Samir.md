# Dictamen Técnico y Respuesta Rigurosa sobre el Módulo de Respaldos
**Evaluación Crítica de las Observaciones de Samir sobre Mantenimiento DBA**  
*Mundo Escolar S.A. — ERP, POS, Inventario, Facturación & BI*  
*Autor: Mauricio Chavarría Pérez (Liderazgo Técnico) · Octubre 2026*

---

## 1. Resumen Ejecutivo y Veredicto
El análisis enviado por Samir contiene **un hallazgo técnico de altísimo valor**, pero al mismo tiempo incurre en **tres errores conceptuales graves** al calificar como "limitaciones" lo que en realidad son principios fundamentales de seguridad, restricciones de compatibilidad con ediciones Express y delimitaciones entre desarrollo de software e infraestructura:
1. **Acierto Crítico (100% Correcto):** El usuario `usr_mundo_app` no tiene permisos nativos para ejecutar `BACKUP DATABASE` vía SQL dinámico (`sp_executesql`), provocando error si el backend no corre con `sa`.
2. **Acierto Operativo (100% Correcto):** La cuenta del servicio de SQL Server en Windows debe tener permisos explícitos de escritura en el filesystem.
3. **Falsa Limitación (Refutado):** No restaurar desde la interfaz web es una **salvaguarda de seguridad obligatoria**. Un restore vía HTTP desconectaría el pool del backend e introduciría vulnerabilidades severas de DoS y destrucción de datos.
4. **Imprecisión de Compatibilidad (Aclarado):** No se incluyeron jobs de SQL Server Agent para garantizar que el sistema pueda desplegarse sin errores en máquinas con **SQL Server Express** (que no incluye Agent).
5. **Frontera de Software vs Infraestructura (Aclarado):** La replicación a un NAS o almacenamiento en la nube (regla 3-2-1) corresponde a la capa de operaciones (SysAdmin/DevOps), no al código del motor transaccional.

---

## 2. Solución Profesional Recomendada
En lugar de elevar privilegios al usuario general de la aplicación, se debe encapsular la ejecución con `WITH EXECUTE AS OWNER` en los procedimientos de respaldo de `10_CrearProcedimientos.sql`, preservando el Principio de Menor Privilegio (PoLP).
