@echo off
REM =========================================================================
REM SCRIPT 04: AUTOMATIZACIÓN DE RESPALDOS CON TASK SCHEDULER
REM PROYECTO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR
REM COMPATIBILIDAD: SQL Server Express, Developer, Standard y Enterprise
REM USO: 
REM   04_Automatizacion_Respaldos_TaskScheduler.bat /full
REM   04_Automatizacion_Respaldos_TaskScheduler.bat /diff
REM   04_Automatizacion_Respaldos_TaskScheduler.bat /log
REM =========================================================================

set TIPO=%1
if "%TIPO%"=="" set TIPO=/full

echo =========================================================================
echo    EJECUTANDO RESPALDO AUTOMATIZADO - MUNDO ESCOLAR (%TIPO%)
echo    FECHA Y HORA: %DATE% %TIME%
echo =========================================================================

if /I "%TIPO%"=="/full" (
    echo -> Ejecutando respaldo COMPLETO...
    sqlcmd -E -S localhost -d MUNDO_ESCOLAR -Q "EXEC dbo.SP_DBA_EjecutarBackupCompleto;" -b
    goto FIN
)

if /I "%TIPO%"=="/diff" (
    echo -> Ejecutando respaldo DIFERENCIAL...
    sqlcmd -E -S localhost -d MUNDO_ESCOLAR -Q "EXEC dbo.SP_DBA_EjecutarBackupDiferencial;" -b
    goto FIN
)

if /I "%TIPO%"=="/log" (
    echo -> Ejecutando respaldo de LOG...
    sqlcmd -E -S localhost -d MUNDO_ESCOLAR -Q "EXEC dbo.SP_DBA_EjecutarBackupLog;" -b
    goto FIN
)

echo [ERROR] Parametro no reconocido: %TIPO%. Use /full, /diff o /log.
exit /b 1

:FIN
if %ERRORLEVEL% EQU 0 (
    echo [OK] Tarea de respaldo ejecutada exitosamente.
) else (
    echo [ERROR] La tarea fallo con codigo %ERRORLEVEL%.
)
echo =========================================================================

