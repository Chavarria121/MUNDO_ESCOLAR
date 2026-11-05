# Informe Técnico Consolidado: Implementación de Refinamientos del Sistema 2026

**Librería & Papelería Mundo Escolar S.A.**  
**Documento Técnico Oficial &bull; Versión 2.4**  
**Autores:** Mauricio Chavarría & Samir  
**Fecha:** Noviembre de 2026  
**Entorno:** SQL Server 2022 Enterprise, NestJS 10.3, React 18, Vite 8, Tailscale Mesh (`100.122.128.35`)

---

## Resumen Ejecutivo

Este informe técnico documenta en exhaustivo detalle la ejecución, integración y pruebas de aceptación del plan aprobado de refinamientos para la plataforma Mundo Escolar. Abarca la corrección crítica en el módulo de facturación electrónica, el desacoplamiento del módulo de seguridad y matriz interactiva de roles/permisos, la auditoría del historial general de clientes, la trazabilidad estricta de salidas de inventario, el ciclo de vida de productos/servicios y el cumplimiento riguroso del estándar **RF1.5 (Actualización de Información del Cliente)** sin alterar ventas ni facturas históricas.

---

## 1. Diagnóstico Inicial y Matriz de Requerimientos

### 1.1 Matriz de Trazabilidad: Brecha Original vs. Solución Implementada

| Requerimiento | Actor Principal | Brecha Técnica Anterior | Solución Implementada & Verificada |
| :--- | :--- | :--- | :--- |
| **Fix Facturación** | Cajero / Admin | Excepción JavaScript `claveCopiadaFactura is not defined` al hacer clic en ver detalle de factura en `FacturacionPage.jsx`. | **Resuelto:** Estado `claveCopiadaFactura` y función `copiarClaveFactura` con portapapeles y reset en 2.5s. |
| **Usuarios y Matriz Roles** | Administrador | Gestión dispersa de usuarios y falta de visibilidad bidimensional de los 18 permisos del sistema frente a los 4 roles (RBAC). | **Implementado:** Sección propia en menú lateral (`/usuarios-roles`), creación de usuarios, asignación modal de roles y matriz interactiva reactiva. |
| **Historial General Clientes** | Administrador / Ventas | Imposibilidad de consultar un consolidado transversal de ventas y facturación con filtros cruzados entre clientes, fechas y estados. | **Implementado:** Pestaña dedicada en Directorio de Clientes conectada a `SP_Cliente_HistorialGeneral` con 4 filtros multicriterio. |
| **Naturaleza de Salidas** | Bodeguero / Admin | Las salidas manuales de inventario registraban únicamente tipo genérico sin especificar si se trataba de merma, daño o devolución. | **Implementado:** Selector obligatorio de naturaleza en modal de salida (Ajuste Negativo, Devolución a Proveedor, Daño, Vencimiento) en `SP_Inventario_Salida`. |
| **Ciclo de Vida Prod / Serv** | Bodeguero / Admin | No era factible inactivar productos o servicios en desuso; productos inactivos podían seguir vendiéndose en el POS. | **Implementado:** Switch toggle en Inventario (`SP_Producto_CambiarEstado`) y filtro estricto en POS (`p.Estado !== false`) que impide venta de inactivos. |
| **Kárdex Movimientos** | Bodeguero / Admin | Falta de filtro por usuario responsable; orden ascendente antiguo; ausencia de validación de intervalo válido ($FechaInicio \le FechaFin$). | **Implementado:** Kárdex con orden cronológico descendente por defecto, validación estricta de intervalo (error 50148) y filtrado exacto por fechas/usuario. |
| **RF1.5 Actualizar Cliente** | Cliente / Admin / Cajero | Edición inconsistente entre particulares e institucionales; campo de correo bloqueado en particular; ausencia de retorno de datos antes/después. | **Implementado:** Procedimiento `SP_Cliente_Actualizar` con retorno de datos previos/actuales, edición de correo habilitada y modal de confirmación RF1.5. |

---

## 2. Implementación en Base de Datos (SQL Server 2022)

Archivo de origen: `sql/03_administracion_mantenimiento/Refinamientos_Sistema_2026.sql`.

### 2.1 Procedimientos Almacenados Creados y Modificados

1. **`SP_Usuario_Consultar`:**
   - Consulta usuarios combinando con `Rol_Usuario` y `Rol`.
   - Utiliza `STRING_AGG(r.Nombre, ', ')` para proveer roles en texto legible y `FOR JSON PATH` para proveer la estructura completa en formato JSON.

2. **`SP_Rol_ConsultarMatriz`:**
   - Retorna directamente las tuplas `Id_Rol, Id_Permiso` de la tabla `Rol_Permiso` para mapear la cuadrícula RBAC en tiempo de renderizado.

3. **`SP_Cliente_HistorialGeneral`:**
   - Parámetros: `@Id_Cliente INT`, `@Tipo_Cliente VARCHAR(20)`, `@FechaInicio DATETIME`, `@FechaFin DATETIME`, `@Estado_Venta VARCHAR(30)`.
   - Une `Venta`, `Cliente`, `Tipo_Cliente`, `Cliente_Particular`, `Cliente_Institucional`, `Estado_Venta`, `Factura` y `Estado_Factura`.

4. **`SP_Inventario_Salida`:**
   - Acepta `@Id_Tipo_Movimiento INT = NULL` para registrar la naturaleza específica del movimiento (ej. ID 4: Ajuste Negativo / Merma, ID 6: Devolución a Proveedor).

5. **`SP_Inventario_ConsultarMovimientos`:**
   - Parámetros: `@Id_Producto INT`, `@FechaInicio DATETIME`, `@FechaFin DATETIME`, `@Id_Tipo_Movimiento INT`, `@Id_Usuario INT`, `@OrdenAscendente BIT`.
   - Valida `@FechaInicio <= @FechaFin`, arrojando error con código `50148` si el intervalo es inválido.
   - Ordena por `m.Fecha DESC` (más recientes primero) por defecto.

6. **`SP_Producto_CambiarEstado`:**
   - Actualiza atómicamente el campo `Estado` en la tabla `Producto` con mensaje de confirmación y registro en bitácora.

7. **`SP_Cliente_Actualizar` (Estándar RF1.5):**
   - Captura en variables locales `@PrevTelefono`, `@PrevDireccion`, `@PrevEstado`, `@PrevNombre`, `@PrevApellido1`, `@PrevApellido2`, `@PrevRazonSocial`, `@PrevNombreContacto`, `@PrevTelContacto`, `@PrevCorreoContacto`, `@PrevCorreoUsuario`.
   - Ejecuta `UPDATE` condicional mediante `ISNULL` únicamente sobre los campos modificados.
   - Retorna en un solo resultset las columnas `*_Anterior` y `*_Actual`, garantizando que ventas, facturas y pagos históricos no sufren modificaciones.

---

## 3. Capa de Servicios y API REST (NestJS 10)

### 3.1 Endpoints Implementados

- `GET /api/usuarios`: Protegido con `SEGURIDAD_GESTIONAR`.
- `GET /api/roles/matriz/permisos`: Protegido con `SEGURIDAD_GESTIONAR`.
- `GET /api/clientes/historial-general`: Protegido con `CLIENTES_CONSULTAR` (declarado antes de `:id` para evitar conflicto de rutas).
- `PATCH /api/productos/:id/estado`: Protegido con `INVENTARIO_GESTIONAR`.
- `PATCH /api/productos/servicios/:id/estado`: Protegido con `INVENTARIO_GESTIONAR`.
- `GET /api/inventario/movimientos`: Protegido con `INVENTARIO_CONSULTAR` (con validación de intervalo en servicio).
- `PUT /api/clientes/portal/mi-perfil`: Para clientes autenticados (RF1.5 con retorno enriquecido).

---

## 4. Interfaz de Usuario y Experiencia en Frontend (React)

- **Facturación Fiscal (`FacturacionPage.jsx`):** Modal de detalle corregido con copiado seguro de clave de 50 dígitos.
- **Usuarios y Roles (`UsuariosRolesPage.jsx`):** Pestaña de usuarios (creación, roles, activar/desactivar) y pestaña de matriz interactiva (18 permisos vs 4 roles).
- **Directorio de Clientes (`ClientesPage.jsx`):** Selector de pestañas para Directorio e Historial General con filtros multicriterio.
- **Inventario y Kárdex (`InventarioPage.jsx`):** Selector de naturaleza en salidas, switches de activación/desactivación en catálogo y toolbar avanzada en Kárdex.
- **Punto de Venta (`PosPage.jsx`):** Catálogo blindado excluyendo artículos inactivos (`p.Estado !== false`, `s.Estado !== false`).
- **Portal de Autoservicio (`PortalClientePage.jsx`):** Modal de confirmación RF1.5 con tabla comparativa de valores anteriores vs actualizados.

---

## 5. Protocolo de Pruebas y Aceptación

| ID | Caso de Prueba | Condición / Entrada | Resultado Observado | Dictamen |
| :--- | :--- | :--- | :--- | :--- |
| **CP-01** | Detalle Factura Fiscal | Clic en comprobante de factura #1 | Modal abre inmediatamente sin error; clave copiada con éxito. | **APROBADO** |
| **CP-02** | Matriz de Roles (RBAC) | `GET /api/roles/matriz/permisos` | 4 roles, 18 permisos y 42 asignaciones activas. Toggle reactivo. | **APROBADO** |
| **CP-03** | Historial General Clientes | `GET /api/clientes/historial-general` | 25 registros consolidados con desglose de montos. | **APROBADO** |
| **CP-04** | Naturaleza en Salida | `idTipoMovimiento: 6` (Devolución) | Movimiento registrado con naturaleza exacta en BD. | **APROBADO** |
| **CP-05** | Inactivar Producto en POS | Desactivar ID 1 y recargar POS | Producto desaparece del POS; al reactivar reaparece de inmediato. | **APROBADO** |
| **CP-06** | Validación Intervalo Fechas | FechaInicio posterior a FechaFin | Servidor rechaza con HTTP 400 y Error 50148. | **APROBADO** |
| **CP-07** | Kárdex Conteo Exacto | Filtro de producto con fechas en intervalo | Retorna exactamente los registros del intervalo en orden cronológico descendente. | **APROBADO** |
| **CP-08** | RF1.5 Retorno Antes/Después | Actualizar teléfono y dirección | Procedimiento devuelve valores previos y nuevos; ventas intactas. | **APROBADO** |

---

## 6. Archivos del Entregable PDF

El documento impreso de alta resolución se encuentra disponible en las siguientes rutas del sistema:
- `C:\MUNDO_ESCOLAR\Informe_Tecnico_Refinamientos_Sistema_Mundo_Escolar_2026.pdf`
- `C:\MUNDO_ESCOLAR\docs\Informe_Tecnico_Refinamientos_Sistema_Mundo_Escolar_2026.pdf`
- `C:\Users\mauri\.gemini\antigravity\brain\753ad0b7-fd93-4fbb-b817-8f67dfa23c40\Informe_Tecnico_Refinamientos_Sistema_Mundo_Escolar_2026.pdf`

