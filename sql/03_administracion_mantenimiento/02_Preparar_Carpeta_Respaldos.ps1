# =========================================================================
# SCRIPT 02: APROVISIONAMIENTO SEGURO DE CARPETA DE RESPALDOS
# PROYECTO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR
# OBJETIVO: Crear la carpeta física de respaldos y conceder permisos NTFS (ACL)
#           a la cuenta de servicio de SQL Server para evitar Error 5 (Access is Denied).
# =========================================================================

param(
    [string]$RutaBackup = "C:\SQLBackup"
)

Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host "   APROVISIONAMIENTO DE CARPETA DE RESPALDOS PARA MUNDO ESCOLAR" -ForegroundColor Cyan
Write-Host "=========================================================================" -ForegroundColor Cyan

# 1. Crear directorio físico si no existe
if (-not (Test-Path $RutaBackup)) {
    try {
        New-Item -ItemType Directory -Path $RutaBackup -Force | Out-Null
        Write-Host "[OK] Carpeta creada exitosamente: $RutaBackup" -ForegroundColor Green
    } catch {
        Write-Error "No se pudo crear el directorio $RutaBackup. Ejecute PowerShell como Administrador."
        exit 1
    }
} else {
    Write-Host "[INFO] La carpeta ya existe: $RutaBackup" -ForegroundColor Yellow
}

# 2. Detectar la cuenta de servicio del motor SQL Server en ejecución
$serviceAccount = (Get-WmiObject Win32_Service | Where-Object { $_.Name -match "^MSSQL" -and $_.State -eq "Running" } | Select-Object -First 1).StartName

if (-not $serviceAccount) {
    # Fallback común para instancias por defecto o SQL Express
    $serviceAccount = "NT SERVICE\MSSQLSERVER"
}

Write-Host "[INFO] Cuenta de servicio de SQL Server detectada: $serviceAccount" -ForegroundColor Cyan

# 3. Aplicar permisos FullControl a la cuenta del motor SQL Server
try {
    $acl = Get-Acl $RutaBackup
    $inheritanceFlag = [System.Security.AccessControl.InheritanceFlags]"ContainerInherit, ObjectInherit"
    $propagationFlag = [System.Security.AccessControl.PropagationFlags]"None"
    $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule($serviceAccount, "FullControl", $inheritanceFlag, $propagationFlag, "Allow")

    $acl.SetAccessRule($accessRule)
    Set-Acl $RutaBackup $acl

    Write-Host "[OK] Permisos NTFS 'FullControl' otorgados a '$serviceAccount' sobre '$RutaBackup'." -ForegroundColor Green
    Write-Host "=========================================================================" -ForegroundColor Cyan
    Write-Host "   APROVISIONAMIENTO COMPLETADO EXITOSAMENTE" -ForegroundColor Green
    Write-Host "=========================================================================" -ForegroundColor Cyan
} catch {
    Write-Warning "No se pudieron ajustar las ACL automáticamente. Asegúrese de ejecutar este script con privilegios de Administrador de Windows: $($_.Exception.Message)"
}

