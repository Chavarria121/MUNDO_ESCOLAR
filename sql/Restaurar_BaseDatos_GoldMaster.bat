@echo off
chcp 65001 > nul
cls
echo =========================================================================
echo    LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR - RESTAURACIÓN INTELIGENTE (DBA)
echo    DISASTER RECOVERY PLAN (DRP) - SSMS 22 / SQL SERVER 2022
echo =========================================================================
echo.

set "LATEST_BAK="
for /f "delims=" %%F in ('dir /b /a:-d /o:-d "C:\SQLBackup\MUNDO_ESCOLAR_FULL_*.bak" 2^>nul') do (
    if not defined LATEST_BAK set "LATEST_BAK=C:\SQLBackup\%%F"
)

if defined LATEST_BAK (
    echo [DETECTADO] Último respaldo generado desde el aplicativo web:
    echo -^> %LATEST_BAK%
    echo.
    echo Opciones de restauración:
    echo   [1] Restaurar la ÚLTIMA copia en vivo (Generada desde el aplicativo)
    echo   [2] Restaurar la Línea Base Certificada (Gold Master 2026)
    echo.
    set /p OPCION="Seleccione una opción (1 o 2) [Enter = 1]: "
) else (
    set "OPCION=2"
)

if "%OPCION%"=="2" (
    set "TARGET_BAK=C:\SQLBackup\MUNDO_ESCOLAR_GOLD_MASTER_2026.bak"
    echo.
    echo [MODO]: Línea Base Certificada (Gold Master).
) else (
    if defined LATEST_BAK (
        set "TARGET_BAK=%LATEST_BAK%"
        echo.
        echo [MODO]: Última copia operativa generada en vivo.
    ) else (
        set "TARGET_BAK=C:\SQLBackup\MUNDO_ESCOLAR_GOLD_MASTER_2026.bak"
        echo.
        echo [MODO]: Línea Base Certificada (Gold Master).
    )
)

echo.
echo Ejecutando protocolo DRP desde:
echo %TARGET_BAK%
echo.

sqlcmd -S localhost -d master -E -Q "ALTER DATABASE MUNDO_ESCOLAR SET SINGLE_USER WITH ROLLBACK IMMEDIATE; RESTORE DATABASE MUNDO_ESCOLAR FROM DISK = '%TARGET_BAK%' WITH REPLACE, RECOVERY, STATS = 25; ALTER DATABASE MUNDO_ESCOLAR SET MULTI_USER;"

if %errorlevel% equ 0 (
    echo.
    echo =========================================================================
    echo    ¡RESTAURACIÓN DRP EXITOSA CON 0 ERRORES!
    echo    Base de datos MUNDO_ESCOLAR restablecida y disponible para multiusuario.
    echo =========================================================================
) else (
    echo.
    echo [ERROR CRÍTICO] No se pudo completar la restauración de la base de datos.
)

echo.
pause
