@echo off
chcp 65001 > nul
cls
echo =========================================================================
echo    LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR - RESTAURACIÓN GOLD MASTER
echo    RESPALDO OFICIAL PARA EXPOSICIÓN FINAL (SSMS 22)
echo =========================================================================
echo.
echo Restaurando base de datos MUNDO_ESCOLAR desde:
echo C:\SQLBackup\MUNDO_ESCOLAR_GOLD_MASTER_2026.bak
echo.

sqlcmd -S localhost -d master -E -Q "ALTER DATABASE MUNDO_ESCOLAR SET SINGLE_USER WITH ROLLBACK IMMEDIATE; RESTORE DATABASE MUNDO_ESCOLAR FROM DISK = 'C:\SQLBackup\MUNDO_ESCOLAR_GOLD_MASTER_2026.bak' WITH REPLACE; ALTER DATABASE MUNDO_ESCOLAR SET MULTI_USER;"

if %errorlevel% equ 0 (
    echo.
    echo =========================================================================
    echo    ¡RESTAURACIÓN EXITOSA EN MENOS DE 1 SEGUNDO!
    echo    Todos los datos, ventas recientes y órdenes están listos.
    echo =========================================================================
) else (
    echo.
    echo [ERROR] No se pudo restaurar la base de datos.
)
echo.
pause

