# Dictamen Técnico de Respuesta Integral: Auditoría de Seguridad y Respaldos DBA
**Evaluación Crítica, Contraste de Evidencias y Plan de Remediación Definitivo (P0/P1)**  
*Proyecto: Librería y Papelería Mundo Escolar — SQL Server 2022, NestJS 11 y React 19*  
*Fecha: Noviembre de 2026 · Referencia commits `4b920ec` y `6c7e03d`*

---

## 1. Resumen Ejecutivo y Declaración de Postura Técnica
Tras una inspección exhaustiva línea por línea del código fuente y de la base de datos real, **este dictamen ratifica que las observaciones técnicas formuladas por Samir en ambos informes son plenamente acertadas y fundadas**. Se desestima cualquier pretensión de sostener una "certificación de seguridad plena" previa sobre los respaldos.

La presencia de SQL dinámico concatenado en procedimientos `WITH EXECUTE AS OWNER` combinada con `TRUSTWORTHY ON` y el usuario `sa` constituía un vector crítico de elevación de privilegios hacia `sysadmin` que no admitía defensa técnica ante el profesor Torrentes.

---

## 2. Desmontaje Técnico del Vector Crítico de Inyección (Hallazgo P0)
Samir identificó con precisión quirúrgica la siguiente cadena de ataque:
`Ruta libre en API` -> `Concatenación T-SQL` -> `EXECUTE AS OWNER` -> `Dueño sa` -> `TRUSTWORTHY ON` = **RCE / sysadmin**

1. **Ruta no saneada:** `VerificarIntegridadBackupDto` aceptaba cualquier string sin validar rutas UNC ni caracteres de escape.
2. **Concatenación vulnerable:** `SP_DBA_VerificarIntegridadBackup` concatenaba directamente `@RutaArchivoBak` en `RESTORE VERIFYONLY`.
3. **Escalamiento por TRUSTWORTHY ON:** Al pertenecer la base a `sa` y tener habilitado `TRUSTWORTHY ON`, la suplantación de identidad permitía ejecutar código con privilegios globales de `sysadmin` en toda la instancia de SQL Server.
4. **Exposición SMB:** Rutas UNC forzaban intentos de autenticación SMB saliente para captura de hashes NetNTLMv2.

---

## 3. Matriz de Respuesta a Hallazgos S01 a S10 (Informe General)
- **S01 (Crítica - Contraseña predeterminada 'Cliente2026!'):** Aceptado al 100%. Se exigirá contraseña obligatoria en registro.
- **S02 (Crítica - Contraseñas en scripts SQL):** Aceptado al 100%. Se parametrizarán mediante variables de entorno.
- **S03 (Alta - Hash SHA-256 sin sal):** Aceptado al 100%. Se diseñará plan de migración hacia Argon2id / bcrypt.
- **S04 (Alta - TRUSTWORTHY ON y sa):** Aceptado al 100%. Se desactivará `TRUSTWORTHY` y se retirará `EXECUTE AS OWNER` irrestricto.
- **S05 (Alta - Privilegios excesivos en login de app):** Aceptado al 100%. Se revocará `db_backupoperator` de `usr_mundo_app` y `GRANT EXECUTE ON SCHEMA::dbo`.
- **S06 (Media-Alta - Conexión sin cifrado y fallback sa):** Aceptado al 100%. Configuración segura en `configuration.ts`.
- **S07 (Media - Falta de Rate Limiting):** Aceptado al 100%. Se añadirá `@nestjs/throttler`.
- **S08 (Media - JWT en localStorage):** Parcialmente procedente. Práctica común en SPAs pero mejorable con cookies o CSP.
- **S09 (Media - Fuga de errores SQL internos):** Aceptado al 100%. Sanitización de `SqlExceptionFilter`.
- **S10 (Baja-Media - Swagger y diagnóstico públicos):** Aceptado al 100%. Restricción en entornos expuestos.

---

## 4. Respuesta a las Pruebas E2E y Dependencias (Informe DBA)
- **Fallo de E2E en entorno de Samir:** Se confirmó que `app.e2e-spec.ts` tenía quemada la contraseña `MundoEscolar2026*` de `sa` local. Al clonarse en otra máquina, fallaba con error de login. Samir demostró que las pruebas no eran reproducibles.
- **Dependencias vulnerables (npm audit):** Se confirmaron las 7 vulnerabilidades de producción (`multer`, `body-parser`, `msal-node`, `js-yaml`) y se programó su actualización controlada.
- **Logros operativos reconocidos:** Se valora el reconocimiento de Samir a los 6 componentes correctamente implementados (Error 515 en Bitácora, DRP con DBCC CHECKDB, Jobs SQL Agent, Task Scheduler, historial de respaldos e interfaz web sin popups nativos).

---

## 5. Plan de Remediación Definitivo (P0/P1)
1. **P0:** Cerrar inyección en SPs DBA, restringir rutas canónicas a `C:\SQLBackup\`, desactivar `TRUSTWORTHY`.
2. **P0:** Eliminar clave predeterminada de clientes en `clientes.service.ts` y DTOs.
3. **P0:** Desacoplar credenciales hardcoded en `app.e2e-spec.ts`.
4. **P1:** Segregar privilegios de `usr_mundo_app` (retirar `db_backupoperator`).
5. **P1:** Ocultar detalles SQL en `SqlExceptionFilter` y `/health`.
6. **P1:** Instalar `@nestjs/throttler` y aplicar `npm audit fix` controlado.
