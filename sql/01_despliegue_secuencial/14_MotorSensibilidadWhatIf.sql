USE MUNDO_ESCOLAR;
GO

-- ============================================================================
-- PROYECTO: LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR
-- FASE 6: MOTOR DE SENSIBILIDAD FINANCIERA (WHAT-IF) EN SQL SERVER & DW
-- ============================================================================

IF OBJECT_ID('dw.FN_SimularImpactoFinanciero', 'IF') IS NOT NULL
    DROP FUNCTION dw.FN_SimularImpactoFinanciero;
GO

CREATE FUNCTION dw.FN_SimularImpactoFinanciero
(
    @PctDescuento DECIMAL(5,4), -- Ej: 0.05 para 5% de descuento del proveedor
    @PctInflacion DECIMAL(5,4)  -- Ej: 0.10 para 10% de inflación de costos
)
RETURNS TABLE
AS
RETURN
(
    WITH ResumenVentas AS (
        SELECT 
            dp.Id_Producto,
            dp.Nombre_Producto AS Producto,
            dp.Categoria,
            dprov.Id_Proveedor,
            ISNULL(dprov.Nombre_Empresa, 'Sin Proveedor Asignado') AS Proveedor,
            SUM(fvp.Cantidad) AS Unidades_Vendidas,
            SUM(fvp.Subtotal) AS Venta_Bruta,
            SUM(CAST(fvp.Cantidad AS DECIMAL(18,2)) * fvp.Costo_Unitario) AS Costo_Historico,
            SUM(fvp.Utilidad_Bruta) AS Utilidad_Historica
        FROM dw.FactVentaProducto fvp
        INNER JOIN dw.DimProducto dp ON fvp.Sk_Producto = dp.Sk_Producto
        LEFT JOIN dbo.Producto_Proveedor pp ON dp.Id_Producto = pp.Id_Producto AND pp.EsPrincipal = 1
        LEFT JOIN dw.DimProveedor dprov ON pp.Id_Proveedor = dprov.Id_Proveedor
        GROUP BY dp.Id_Producto, dp.Nombre_Producto, dp.Categoria, dprov.Id_Proveedor, dprov.Nombre_Empresa
    )
    SELECT 
        Producto,
        Categoria,
        Proveedor,
        Unidades_Vendidas,
        Venta_Bruta,
        Costo_Historico,
        Utilidad_Historica,
        ROUND((Utilidad_Historica / NULLIF(Venta_Bruta, 0)) * 100.0, 2) AS Margen_Historico_Pct,
        -- Escenario simulado
        ROUND(Costo_Historico * (1.0 - @PctDescuento) * (1.0 + @PctInflacion), 2) AS Costo_Simulado,
        ROUND(Venta_Bruta - (Costo_Historico * (1.0 - @PctDescuento) * (1.0 + @PctInflacion)), 2) AS Utilidad_Simulada,
        ROUND(((Venta_Bruta - (Costo_Historico * (1.0 - @PctDescuento) * (1.0 + @PctInflacion))) / NULLIF(Venta_Bruta, 0)) * 100.0, 2) AS Margen_Simulado_Pct,
        -- Variaciones (Deltas)
        ROUND((Venta_Bruta - (Costo_Historico * (1.0 - @PctDescuento) * (1.0 + @PctInflacion))) - Utilidad_Historica, 2) AS Variacion_Utilidad_Colones,
        ROUND((((Venta_Bruta - (Costo_Historico * (1.0 - @PctDescuento) * (1.0 + @PctInflacion))) / NULLIF(Venta_Bruta, 0)) * 100.0) - ((Utilidad_Historica / NULLIF(Venta_Bruta, 0)) * 100.0), 2) AS Variacion_Margen_Puntos
    FROM ResumenVentas
);
GO

IF OBJECT_ID('dw.VW_Analisis_Sensibilidad_WhatIf', 'V') IS NOT NULL
    DROP VIEW dw.VW_Analisis_Sensibilidad_WhatIf;
GO

CREATE VIEW dw.VW_Analisis_Sensibilidad_WhatIf
AS
SELECT 
    'Escenario Real Actual (Base)' AS Escenario,
    0.0 AS Pct_Descuento_Proveedor,
    0.0 AS Pct_Inflacion_Costo,
    SUM(Venta_Bruta) AS Ventas_Totales,
    SUM(Costo_Historico) AS Costo_Total,
    SUM(Utilidad_Historica) AS Utilidad_Bruta,
    ROUND((SUM(Utilidad_Historica) / NULLIF(SUM(Venta_Bruta), 0)) * 100.0, 2) AS Margen_Bruto_Pct,
    0.0 AS Variacion_Utilidad_Colones
FROM dw.FN_SimularImpactoFinanciero(0.0, 0.0)

UNION ALL

SELECT 
    'Negociación Volumen (+5% Desc. Proveedor)' AS Escenario,
    5.0 AS Pct_Descuento_Proveedor,
    0.0 AS Pct_Inflacion_Costo,
    SUM(Venta_Bruta) AS Ventas_Totales,
    SUM(Costo_Simulado) AS Costo_Total,
    SUM(Utilidad_Simulada) AS Utilidad_Bruta,
    ROUND((SUM(Utilidad_Simulada) / NULLIF(SUM(Venta_Bruta), 0)) * 100.0, 2) AS Margen_Bruto_Pct,
    SUM(Variacion_Utilidad_Colones) AS Variacion_Utilidad_Colones
FROM dw.FN_SimularImpactoFinanciero(0.05, 0.0)

UNION ALL

SELECT 
    'Presión Inflacionaria (+8% Inflación Costos)' AS Escenario,
    0.0 AS Pct_Descuento_Proveedor,
    8.0 AS Pct_Inflacion_Costo,
    SUM(Venta_Bruta) AS Ventas_Totales,
    SUM(Costo_Simulado) AS Costo_Total,
    SUM(Utilidad_Simulada) AS Utilidad_Bruta,
    ROUND((SUM(Utilidad_Simulada) / NULLIF(SUM(Venta_Bruta), 0)) * 100.0, 2) AS Margen_Bruto_Pct,
    SUM(Variacion_Utilidad_Colones) AS Variacion_Utilidad_Colones
FROM dw.FN_SimularImpactoFinanciero(0.0, 0.08)

UNION ALL

SELECT 
    'Escenario Mixto (+7% Desc., +5% Inflación)' AS Escenario,
    7.0 AS Pct_Descuento_Proveedor,
    5.0 AS Pct_Inflacion_Costo,
    SUM(Venta_Bruta) AS Ventas_Totales,
    SUM(Costo_Simulado) AS Costo_Total,
    SUM(Utilidad_Simulada) AS Utilidad_Bruta,
    ROUND((SUM(Utilidad_Simulada) / NULLIF(SUM(Venta_Bruta), 0)) * 100.0, 2) AS Margen_Bruto_Pct,
    SUM(Variacion_Utilidad_Colones) AS Variacion_Utilidad_Colones
FROM dw.FN_SimularImpactoFinanciero(0.07, 0.05);
GO
