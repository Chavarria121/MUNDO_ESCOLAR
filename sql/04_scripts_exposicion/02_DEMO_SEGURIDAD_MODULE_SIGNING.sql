/* =========================================================================
   PROYECTO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR
   EXPOSICIÓN FINAL 2026 - PESTAÑA 2 EN SSMS (MAURICIO CHAVARRÍA)
   SCRIPT: 02_DEMO_SEGURIDAD_MODULE_SIGNING.sql
   MOMENTO DE EJECUCIÓN: Bloque de Seguridad y Gobernanza DBA de Mauricio.
   INSTRUCCIÓN: Seleccionar todo y presionar [F5] para demostrar la solución
                criptográfica recomendada por Microsoft ante la auditoría.
   ========================================================================= */

USE master;
GO

PRINT '======================================================================='
PRINT '>>> 1. ESTADO DE SEGURIDAD DE LA INSTANCIA: TRUSTWORTHY PERMANECE APAGADO (OFF)'
PRINT '======================================================================='
-- Demostración de que la base NO tiene TRUSTWORTHY ON, cerrando vulnerabilidades
-- de elevación de privilegios hacia el servidor o cuentas sa/sysadmin.
SELECT 
    name AS BaseDeDatos,
    is_trustworthy_on AS Trustworthy_Estado,
    Diagnostico_Seguridad = CASE 
        WHEN is_trustworthy_on = 0 THEN 'SEGURO (TRUSTWORTHY OFF) - Cero riesgo de escalado de privilegios'
        ELSE 'VULNERABLE (TRUSTWORTHY ON) - Violación crítica de seguridad'
    END
FROM sys.databases 
WHERE name = 'MUNDO_ESCOLAR';
GO

USE MUNDO_ESCOLAR;
GO

PRINT '======================================================================='
PRINT '>>> 2. CERTIFICADOS ASIMÉTRICOS CRIPTOGRÁFICOS EN LA BASE DE DATOS'
PRINT '======================================================================='
-- Certificado creado específicamente para firmar módulos de administración
SELECT 
    certificate_id,
    name AS NombreCertificado,
    subject AS Proposito,
    issuer_name AS Emisor,
    start_date AS ValidoDesde,
    expiry_date AS ValidoHasta
FROM sys.certificates
WHERE name = 'Cert_MundoEscolar_DBA';
GO

PRINT '======================================================================='
PRINT '>>> 3. PROCEDIMIENTOS ALMACENADOS FIRMADOS CRIPTOGRÁFICAMENTE'
PRINT '======================================================================='
-- Muestra la firma digital estampada en sys.crypt_properties
SELECT 
    o.name AS ObjetoFirmado,
    o.type_desc AS TipoObjeto,
    c.name AS CertificadoFirmante,
    cp.crypt_type_desc AS AlgoritmoFirma,
    cp.thumbprint AS HuellaDigitalSha1
FROM sys.crypt_properties cp
INNER JOIN sys.objects o ON cp.major_id = o.object_id
INNER JOIN sys.certificates c ON cp.thumbprint = c.thumbprint
WHERE o.name LIKE 'SP_DBA_%';
GO

PRINT '======================================================================='
PRINT '>>> 4. EXPLICACIÓN ARQUITECTÓNICA DE MODULE SIGNING'
PRINT '======================================================================='
/*
   ¿CÓMO FUNCIONA ESTA ARQUITECTURA?
   1. Un usuario del backend (usr_mundo_app) tiene denegados los permisos administrativos.
   2. Sin embargo, puede ejecutar SP_DBA_EjecutarBackupCompleto porque el procedimiento
      está firmado con un certificado digital.
   3. Durante la ejecución del SP, SQL Server adopta temporalmente la identidad del certificado,
      la cual posee el permiso específico de respaldo en master, SIN NECESIDAD de elevar
      al usuario a 'sysadmin' ni encender 'TRUSTWORTHY'.
   4. Si alguien manipula el código del SP (inyección/modificación), la firma se ROMPE
      automáticamente y el procedimiento pierde la autorización de ejecutarse.
*/
SELECT 
    Principio = 'Principio de Menor Privilegio (PoLP) + Module Signing',
    Estandar = 'Cumplimiento Militar / Bancario Microsoft SQL Server 2022',
    Resultado = 'Respaldo seguro sin riesgos en el servidor físico';
GO
