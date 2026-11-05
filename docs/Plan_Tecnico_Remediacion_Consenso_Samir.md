# Plan Técnico de Acción y Remediación Integral: Consenso y Respuestas a la Revisión de Samir
**Diseño Detallado de Implementación, Migración de Seguridad y Criterios de Aceptación para el Hito #3**  
*Proyecto: Librería y Papelería Mundo Escolar — SQL Server 2022, NestJS 11 y React 19*  
*Fecha: Noviembre de 2026 · Basado en el dictamen previo y la retroalimentación de Samir*

---

## 1. Resumen Ejecutivo y Declaración de Consenso
El equipo de desarrollo adopta en su totalidad las observaciones de Samir. Se asume que reconocer los riesgos con un 10/10 no equivale a haberlos resuelto (0/10 en implementación demostrada). Este documento formaliza los detalles de ingeniería de cada solución antes de tocar el repositorio.

---

## 2. Adopción de la Sintaxis Nativa T-SQL (Aporte de Samir)
Se adopta la recomendación de Samir:
```sql
RESTORE VERIFYONLY FROM DISK = @RutaAbsoluta;
BACKUP DATABASE MUNDO_ESCOLAR TO DISK = @RutaDestino WITH FORMAT, INIT, COMPRESSION;
```
Al no existir concatenación dinámica ni `sp_executesql`, la inyección SQL queda eliminada de raíz en la gramática del motor. Se forzará la ruta canónica `C:\SQLBackup\`, se rechazarán traversals (`..`) y rutas UNC (`\\`), y se desactivará `TRUSTWORTHY ON`.

---

## 3. Plan de Migración de Contraseñas No Disruptivo (Obs. B)
1. **Capacidad de Almacenamiento:** La columna `ContrasenaHash VARCHAR(255)` en `dbo.Usuario` soporta de forma nativa los hashes de Argon2id y bcrypt sin cambios de esquema.
2. **Esquema Dual con Upgrade en Caliente:**
   - Si el hash inicia con `$argon2id$` o `$2b$`, se valida con la función de costo lento.
   - Si el hash es hexadecimal de 64 caracteres (SHA-256 legado), se valida con el algoritmo anterior. Al coincidir la clave, el backend calcula el nuevo hash Argon2id/bcrypt y actualiza la base de datos de inmediato.
   - Cero disrupción para usuarios existentes; nuevos usuarios se registran directamente con el algoritmo moderno.

---

## 4. Matriz de Cierre para los 10 Hallazgos (Obs. A, C, D, E)
- **S01:** Clave obligatoria en registro de clientes; eliminación de fallback fijo.
- **S02:** Rotación local de claves y ofuscación en reportes (`[CONTRASEÑA_OFUSCADA]`).
- **S03:** Migración a Argon2id/bcrypt con upgrade dinámico.
- **S04:** `ALTER DATABASE ... SET TRUSTWORTHY OFF;` y remoción de `EXECUTE AS OWNER` indiscriminado.
- **S05:** Retiro de `db_backupoperator` y `GRANT EXECUTE ON SCHEMA::dbo` de la cuenta de aplicación.
- **S06:** Configuración obligatoria de credenciales sin fallback a `sa`.
- **S07:** Instalación de `@nestjs/throttler` (10 req/min en login/registro).
- **S08:** Reducción de TTL de JWT a 1h, cabeceras CSP vía `helmet`, documentación formal de riesgo residual de `localStorage`.
- **S09:** Sanitización de `SqlExceptionFilter` (códigos de error opacos).
- **S10:** Swagger restringido a desarrollo y sanitización de `/health`.
- **AUD:** Ejecución de `npm audit fix` para mitigar vulnerabilidades de paquetes en producción.
- **E2E (Obs. C):** Soporte a variables dinámicas en `app.e2e-spec.ts` para que pasen en cualquier máquina.

---

## 5. Protocolo de Evidencias y Redacción para el Hito #3
Se adopta íntegramente la redacción propuesta por Samir para la observación del Hito #3, y se fija el protocolo de 6 pruebas en vivo (Full, Diff, Log, Verify stático, DRP con DBCC CHECKDB y prueba negativa de inyección) para generar las evidencias del informe final.
