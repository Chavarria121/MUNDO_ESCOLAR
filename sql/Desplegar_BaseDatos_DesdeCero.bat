@echo off
chcp 65001 > nul
cls
echo =========================================================================
echo    LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR - DESPLIEGUE DESDE CERO
echo    REQUISITO DE PRUEBA: PROFESOR TORRENTES (SSMS 22)
echo =========================================================================
echo.
echo ADVERTENCIA: Este proceso recreará la base de datos MUNDO_ESCOLAR desde cero.
echo Si desea cancelar, presione Ctrl+C. De lo contrario:
pause

echo.
echo [1/17] Creando Base de Datos y Filegroups...
sqlcmd -S localhost -E -i "01_despliegue_secuencial\01_CrearBaseDatos.sql"
if %errorlevel% neq 0 goto error

echo [2/17] Creando Esquemas (dw)...
sqlcmd -S localhost -E -i "01_despliegue_secuencial\02_CrearEsquemas.sql"
if %errorlevel% neq 0 goto error

echo [3/17] Creando 33 Tablas en 3FN...
sqlcmd -S localhost -E -i "01_despliegue_secuencial\03_CrearTablas.sql"
if %errorlevel% neq 0 goto error

echo [4/17] Creando Constraints (PK, FK, UQ, CK, DF)...
sqlcmd -S localhost -E -i "01_despliegue_secuencial\04_CrearConstraints.sql"
if %errorlevel% neq 0 goto error

echo [5/17] Cargando Catálogos Base...
sqlcmd -S localhost -E -i "01_despliegue_secuencial\05_CrearCatalogos.sql"
if %errorlevel% neq 0 goto error

echo [6/17] Cargando Datos Maestros (Usuarios, Roles, Productos)...
sqlcmd -S localhost -E -i "01_despliegue_secuencial\06_InsertarDatosMaestros.sql"
if %errorlevel% neq 0 goto error

echo [7/17] Creando Índices No Agrupados...
sqlcmd -S localhost -E -i "01_despliegue_secuencial\07_CrearIndices.sql"
if %errorlevel% neq 0 goto error

echo [8/17] Creando Funciones de Negocio...
sqlcmd -S localhost -E -i "01_despliegue_secuencial\08_CrearFunciones.sql"
if %errorlevel% neq 0 goto error

echo [9/17] Creando 19 Vistas de Negocio...
sqlcmd -S localhost -E -i "01_despliegue_secuencial\09_CrearVistas.sql"
if %errorlevel% neq 0 goto error

echo [10/17] Creando Procedimientos Almacenados (SPs 1 al 96)...
sqlcmd -S localhost -E -i "01_despliegue_secuencial\10_CrearProcedimientos.sql"
if %errorlevel% neq 0 goto error

echo [11/17] Creando 16 Triggers de Auditoría Forense...
sqlcmd -S localhost -E -i "01_despliegue_secuencial\11_CrearTriggers.sql"
if %errorlevel% neq 0 goto error

echo [12/17] Validando Instalación y Conteos Oficiales...
sqlcmd -S localhost -E -i "01_despliegue_secuencial\12_ValidarInstalacion.sql"
if %errorlevel% neq 0 goto error

echo [13/17] Sembrando Datos de Demostración (Compras, Kárdex, Ventas)...
sqlcmd -S localhost -E -i "01_despliegue_secuencial\13_InsertarDatosDemostracion.sql"
if %errorlevel% neq 0 goto error

echo [14/17] Instalando Motor de Sensibilidad What-If...
sqlcmd -S localhost -E -i "01_despliegue_secuencial\14_MotorSensibilidadWhatIf.sql"
if %errorlevel% neq 0 goto error

echo [15/17] Consolidando Esquema Data Warehouse (dw)...
sqlcmd -S localhost -E -i "01_despliegue_secuencial\DW_Constelacion.sql"
if %errorlevel% neq 0 goto error

echo [16/17] Aplicando Seguridad Militar, RBAC y Module Signing...
sqlcmd -S localhost -E -i "03_administracion_mantenimiento\Seguridad.sql"
if %errorlevel% neq 0 goto error

echo [17/17] Aplicando Refinamientos 2026 (Smart Procurement, Lead Time)...
sqlcmd -S localhost -E -i "03_administracion_mantenimiento\Refinamientos_Sistema_2026.sql"
if %errorlevel% neq 0 goto error

echo.
echo =========================================================================
echo    ¡DESPLIEGUE DESDE CERO COMPLETADO EXITOSAMENTE CON 0 ERRORES!
echo =========================================================================
echo.
pause
exit /b 0

:error
echo.
echo [ERROR CRÍTICO] El despliegue se detuvo por un error.
pause
exit /b 1

