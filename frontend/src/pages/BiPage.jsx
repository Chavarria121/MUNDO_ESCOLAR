import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  RefreshCw,
  Database,
  Layers,
  CheckCircle2,
  Calendar,
  Cpu,
  Server,
  Zap,
  TrendingUp,
  CreditCard,
  ShoppingBag,
  Users,
  Award,
  Filter,
  Check,
  Building2,
  User,
  Sparkles,
  ExternalLink,
  DollarSign,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function BiPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Estados de datos
  const [dashboardData, setDashboardData] = useState(null);
  const [conciliacion, setConciliacion] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ejecutandoEtl, setEjecutandoEtl] = useState(false);
  const [filtroTipoCliente, setFiltroTipoCliente] = useState('Todos'); // 'Todos' | 'Particular' | 'Institucional'
  const [mostrarTablaConciliacion, setMostrarTablaConciliacion] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [filtroTipoCliente]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const paramFiltro = filtroTipoCliente === 'Todos' ? '' : `?tipoCliente=${encodeURIComponent(filtroTipoCliente)}`;
      const [dashRes, concRes] = await Promise.all([
        api.get(`/bi/dashboard${paramFiltro}`),
        api.get('/bi/conciliacion'),
      ]);
      setDashboardData(dashRes.data || null);
      setConciliacion(concRes.data || []);
    } catch (err) {
      console.error('Error cargando datos de BI:', err);
      showToast('Error al consultar datos del Data Warehouse', 'error');
    } finally {
      setLoading(false);
    }
  };

  const ejecutarSincronizacionETL = async () => {
    setEjecutandoEtl(true);
    try {
      const res = await api.post('/bi/etl/completo', {
        anioInicio: 2026,
        anioFin: 2026,
      });

      showToast('¡Data Warehouse sincronizado con éxito! Listo para ver en web y Power BI.', 'success');
      await cargarDatos();
    } catch (err) {
      console.error('Error en sincronización ETL:', err);
      const msg = err.response?.data?.mensaje || 'Error al procesar la sincronización del Data Warehouse';
      showToast(msg, 'error');
    } finally {
      setEjecutandoEtl(false);
    }
  };

  const formatCRC = (val) =>
    new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);

  const formatCRCCompact = (val) => {
    const n = Number(val) || 0;
    if (n >= 1000000) return `₡${(n / 1000000).toFixed(2)}M`;
    if (n >= 1000) return `₡${(n / 1000).toFixed(1)}k`;
    return `₡${n.toLocaleString('es-CR')}`;
  };

  const conciliacionCuadrada = useMemo(() => {
    if (!conciliacion.length) return true;
    return conciliacion.every(
      (c) =>
        Number(c.ConteoOperacional) === Number(c.ConteoDW) &&
        Number(c.MontoOperacional) === Number(c.MontoDW)
    );
  }, [conciliacion]);

  // Colores para gráficos
  const coloresMetodos = {
    'Tarjeta de Crédito': '#2D5E46',
    'SINPE Móvil': '#C05A3E',
    'Efectivo': '#D4A373',
    'Transferencia Bancaria': '#132B20',
  };

  const kpis = dashboardData?.kpis || {
    totalVentas: 0,
    totalPagos: 0,
    totalUnidades: 0,
    ticketPromedio: 0,
    totalFacturas: 0,
  };

  const categorias = dashboardData?.ventasPorCategoria || [];
  const maxSubtotalCat = Math.max(...categorias.map((c) => Number(c.subtotal) || 0), 1);

  const meses = dashboardData?.ventasPorMes || [];
  const maxTotalMes = Math.max(...meses.map((m) => Number(m.total) || 0), 1);

  const metodos = dashboardData?.metodosPago || [];
  const vendedores = dashboardData?.ventasPorVendedor || [];

  return (
    <div className="space-y-6 text-[#132B20]">
      {/* =========================================================================
          1. HEADER PRINCIPAL Y CONTROLES ETL
         ========================================================================= */}
      <div className="bg-white rounded-3xl border border-[#DFD5C4] p-6 shadow-subtle flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#132B20] via-[#2D5E46] to-[#C05A3E] flex items-center justify-center text-[#FAF7F0] shadow-md">
              <LineChart className="w-6 h-6 text-[#FAF7F0]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-[#132B20] tracking-tight">
                  Inteligencia de Negocios & Data Warehouse (BI)
                </h2>
                <span className="text-[11px] font-extrabold px-3 py-0.5 rounded-full bg-[#132B20]/10 text-[#132B20] border border-[#2D5E46]/30">
                  Esquema Constelación
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Power BI Conectado
                </span>
              </div>
              <p className="text-xs text-[#5C3622]/80 mt-1">
                Librería & Papelería Mundo Escolar • Liberia Centro, Guanacaste • Análisis Multidimensional en Tiempo Real
              </p>
            </div>
          </div>
        </div>

        {/* Botones de Acción: Refrescar y Sincronizar ETL */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={cargarDatos}
            disabled={loading || ejecutandoEtl}
            title="Recargar vista desde el Data Warehouse"
            className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-[#132B20] bg-[#FAF7F0] hover:bg-[#F3ECE0] border border-[#DFD5C4] rounded-xl transition shadow-xs active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#5C3622] ${loading ? 'animate-spin' : ''}`} />
            <span>Refrescar</span>
          </button>

          <button
            onClick={ejecutarSincronizacionETL}
            disabled={ejecutandoEtl}
            title="Dispara los Stored Procedures 80 al 91 para actualizar la constelación y Power BI"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#132B20] via-[#2D5E46] to-[#C05A3E] hover:from-[#0d1e16] hover:to-[#a94a30] text-[#FAF7F0] text-xs font-black rounded-xl shadow-md transition disabled:opacity-50 active:scale-95 border border-[#FAF7F0]/20"
          >
            {ejecutandoEtl ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Sincronizando Data Warehouse...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#D4A373] animate-pulse" />
                <span>Sincronizar Data Warehouse (ETL)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. FILTRO INTERACTIVO (SEGMENTADOR POR TIPO DE CLIENTE - POWER BI REPLICA)
         ========================================================================= */}
      <div className="bg-[#FAF7F0] border border-[#DFD5C4] rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#C05A3E]" />
          <span className="text-xs font-bold text-[#132B20] uppercase tracking-wider">
            Segmentador Interactivo (Filtro):
          </span>
          <span className="text-xs text-[#5C3622]/80 font-medium">
            Selecciona el segmento de clientes para recalcular todos los gráficos en vivo:
          </span>
        </div>

        <div className="inline-flex rounded-xl bg-white p-1 border border-[#DFD5C4] shadow-xs">
          {[
            { id: 'Todos', label: 'Todos los Clientes', icon: Users, count: 7 },
            { id: 'Particular', label: 'Particulares', icon: User, count: 4 },
            { id: 'Institucional', label: 'Institucionales', icon: Building2, count: 3 },
          ].map((tab) => {
            const Icon = tab.icon;
            const activo = filtroTipoCliente === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFiltroTipoCliente(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activo
                    ? 'bg-[#132B20] text-[#FAF7F0] shadow-sm'
                    : 'text-[#5C3622] hover:bg-[#F3ECE0] hover:text-[#132B20]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${activo ? 'text-[#C05A3E]' : 'text-[#5C3622]'}`} />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activo ? 'bg-[#2D5E46] text-white' : 'bg-[#FAF7F0] text-[#5C3622] border border-[#DFD5C4]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          3. TARJETAS KPI PRINCIPALES (IDÉNTICAS AL POWER BI)
         ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Ventas */}
        <div className="bg-white p-5 rounded-3xl border border-[#DFD5C4] shadow-subtle hover:border-[#2D5E46] transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5C3622]">Total Ventas (DW)</span>
            <div className="w-10 h-10 rounded-2xl bg-[#F3ECE0] text-[#2D5E46] border border-[#DFD5C4] flex items-center justify-center group-hover:scale-105 transition">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl lg:text-3xl font-black text-[#132B20] block mt-2">
            {loading ? '...' : formatCRC(kpis.totalVentas)}
          </span>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#DFD5C4]/40 text-xs">
            <span className="text-[#2D5E46] font-semibold">{kpis.totalFacturas} comprobantes emitidos</span>
            <span className="text-xs font-mono font-bold text-[#C05A3E]">{formatCRCCompact(kpis.totalVentas)}</span>
          </div>
        </div>

        {/* KPI 2: Total Pagos Recaudados */}
        <div className="bg-white p-5 rounded-3xl border border-[#DFD5C4] shadow-subtle hover:border-[#2D5E46] transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5C3622]">Total Recaudado (Caja)</span>
            <div className="w-10 h-10 rounded-2xl bg-[#F3ECE0] text-[#C05A3E] border border-[#DFD5C4] flex items-center justify-center group-hover:scale-105 transition">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl lg:text-3xl font-black text-[#132B20] block mt-2">
            {loading ? '...' : formatCRC(kpis.totalPagos)}
          </span>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#DFD5C4]/40 text-xs">
            <span className="text-[#5C3622]/80 font-medium">Liquidado en FactPagos</span>
            <span className="text-xs font-mono font-bold text-[#2D5E46]">{formatCRCCompact(kpis.totalPagos)}</span>
          </div>
        </div>

        {/* KPI 3: Total Unidades Vendidas */}
        <div className="bg-white p-5 rounded-3xl border border-[#DFD5C4] shadow-subtle hover:border-[#2D5E46] transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5C3622]">Unidades Vendidas</span>
            <div className="w-10 h-10 rounded-2xl bg-[#F3ECE0] text-[#5C3622] border border-[#DFD5C4] flex items-center justify-center group-hover:scale-105 transition">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl lg:text-3xl font-black text-[#132B20] block mt-2">
            {loading ? '...' : `${kpis.totalUnidades} und`}
          </span>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#DFD5C4]/40 text-xs">
            <span className="text-[#5C3622]/80 font-medium">Líneas de útiles y artículos</span>
            <span className="text-xs font-bold text-[#132B20]">FactVentaProducto</span>
          </div>
        </div>

        {/* KPI 4: Ticket Promedio */}
        <div className="bg-white p-5 rounded-3xl border border-[#DFD5C4] shadow-subtle hover:border-[#2D5E46] transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5C3622]">Ticket Promedio</span>
            <div className="w-10 h-10 rounded-2xl bg-[#F3ECE0] text-[#132B20] border border-[#DFD5C4] flex items-center justify-center group-hover:scale-105 transition">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl lg:text-3xl font-black text-[#132B20] block mt-2">
            {loading ? '...' : formatCRC(kpis.ticketPromedio)}
          </span>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#DFD5C4]/40 text-xs">
            <span className="text-[#5C3622]/80 font-medium">Por compra en mostrador</span>
            <span className="text-xs font-bold text-[#C05A3E]">Promedio</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. GRÁFICOS ANALÍTICOS PRINCIPALES (RÉPLICA DE POWER BI)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GRÁFICO 1: Ventas por Categoría (Barras Horizontales) */}
        <div className="bg-white rounded-3xl border border-[#DFD5C4] p-6 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#DFD5C4] pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#F3ECE0] text-[#C05A3E] border border-[#DFD5C4] flex items-center justify-center font-bold">
                  📊
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#132B20]">Ventas por Categoría de Producto</h3>
                  <p className="text-[11px] text-[#5C3622]/70">Ingresos netos por categoría de útiles escolares</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-[#5C3622] bg-[#FAF7F0] px-2.5 py-1 rounded-full border border-[#DFD5C4]">
                dw.DimProducto
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-[#5C3622]">Cargando categorías...</div>
            ) : categorias.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#5C3622]/60">No hay ventas registradas para este filtro.</div>
            ) : (
              <div className="space-y-3.5">
                {categorias.map((cat, idx) => {
                  const pct = Math.round((Number(cat.subtotal) / maxSubtotalCat) * 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-[#132B20] flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#C05A3E]" />
                          {cat.categoria}
                          <span className="text-[10px] font-normal text-[#5C3622]">({cat.cantidad} und)</span>
                        </span>
                        <span className="text-[#132B20] font-mono">{formatCRC(cat.subtotal)}</span>
                      </div>
                      <div className="w-full bg-[#FAF7F0] h-3.5 rounded-full overflow-hidden border border-[#DFD5C4]/60">
                        <div
                          className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-[#2D5E46] to-[#C05A3E]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#DFD5C4]/50 flex items-center justify-between text-[11px] text-[#5C3622]">
            <span>Categoría líder: <strong className="text-[#132B20]">{categorias[0]?.categoria || 'N/A'}</strong></span>
            <span>Total: <strong className="text-[#132B20]">{formatCRC(categorias.reduce((a, b) => a + Number(b.subtotal), 0))}</strong></span>
          </div>
        </div>

        {/* GRÁFICO 2: Ventas por Mes (Evolución Temporal en Columnas) */}
        <div className="bg-white rounded-3xl border border-[#DFD5C4] p-6 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#DFD5C4] pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#F3ECE0] text-[#2D5E46] border border-[#DFD5C4] flex items-center justify-center font-bold">
                  📅
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#132B20]">Evolución Temporal de Ventas</h3>
                  <p className="text-[11px] text-[#5C3622]/70">Histórico de facturación mensual consolidada</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-[#5C3622] bg-[#FAF7F0] px-2.5 py-1 rounded-full border border-[#DFD5C4]">
                dw.DimFecha
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-[#5C3622]">Cargando histórico mensual...</div>
            ) : meses.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#5C3622]/60">No hay datos para este período.</div>
            ) : (
              <div className="h-48 flex items-end justify-around gap-4 pt-4 pb-2 border-b border-[#DFD5C4]">
                {meses.map((m, idx) => {
                  const pct = Math.max(Math.round((Number(m.total) / maxTotalMes) * 100), 12);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <span className="text-[10px] font-bold font-mono text-[#132B20] opacity-0 group-hover:opacity-100 transition">
                        {formatCRCCompact(m.total)}
                      </span>
                      <div className="w-full max-w-[50px] bg-[#FAF7F0] h-full rounded-2xl p-1 flex items-end border border-[#DFD5C4]/70">
                        <div
                          className="w-full rounded-xl bg-gradient-to-t from-[#132B20] via-[#2D5E46] to-[#38BDF8] transition-all duration-700 shadow-sm"
                          style={{ height: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-[#132B20]">{m.nombreMes}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 flex items-center justify-between text-[11px] text-[#5C3622]">
            <span>Mes evaluado: <strong className="text-[#132B20]">{meses[0]?.nombreMes || 'N/A'} 2026</strong></span>
            <span>Facturado: <strong className="text-[#2D5E46]">{formatCRC(kpis.totalVentas)}</strong></span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          5. DESGLOSE SECUNDARIO: MÉTODOS DE PAGO Y VENDEDORES (POWER BI REPLICA)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GRÁFICO 3: Distribución por Método de Pago (Donut / Anillo SVG) */}
        <div className="bg-white rounded-3xl border border-[#DFD5C4] p-6 shadow-subtle">
          <div className="flex items-center justify-between border-b border-[#DFD5C4] pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#F3ECE0] text-[#5C3622] border border-[#DFD5C4] flex items-center justify-center font-bold">
                💳
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#132B20]">Ventas por Método de Pago</h3>
                <p className="text-[11px] text-[#5C3622]/70">Distribución de liquidación en caja</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#5C3622] bg-[#FAF7F0] px-2.5 py-1 rounded-full border border-[#DFD5C4]">
              dw.DimMetodoPago
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Donut SVG con Centro Informativo */}
            <div className="relative w-40 h-40 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                {/* Fondo */}
                <circle cx="18" cy="18" r="14" fill="none" stroke="#F3ECE0" strokeWidth="4" />
                {/* Segmentos de métodos de pago */}
                {(() => {
                  let acumulado = 0;
                  return metodos.map((m, idx) => {
                    const strokeDash = `${m.porcentaje} ${100 - m.porcentaje}`;
                    const strokeOffset = 100 - acumulado + 25;
                    acumulado += m.porcentaje;
                    const color = coloresMetodos[m.metodo] || '#5C3622';
                    return (
                      <circle
                        key={idx}
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        stroke={color}
                        strokeWidth="4"
                        strokeDasharray={strokeDash}
                        strokeDashoffset={strokeOffset}
                        className="transition-all duration-700"
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase font-bold text-[#5C3622]">Caja Total</span>
                <span className="text-xs font-black text-[#132B20] font-mono">{formatCRCCompact(kpis.totalPagos)}</span>
              </div>
            </div>

            {/* Leyenda Detallada */}
            <div className="flex-1 w-full space-y-2">
              {metodos.map((m, idx) => {
                const color = coloresMetodos[m.metodo] || '#5C3622';
                return (
                  <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-[#FAF7F0] border border-[#DFD5C4]/50">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="font-bold text-[#132B20]">{m.metodo}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-[#132B20] block">{formatCRC(m.total)}</span>
                      <span className="text-[10px] font-bold text-[#5C3622]">{m.porcentaje}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* GRÁFICO 4: Rendimiento por Vendedor / Colaborador */}
        <div className="bg-white rounded-3xl border border-[#DFD5C4] p-6 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#DFD5C4] pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#F3ECE0] text-[#132B20] border border-[#DFD5C4] flex items-center justify-center font-bold">
                  👤
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#132B20]">Facturación por Colaborador</h3>
                  <p className="text-[11px] text-[#5C3622]/70">Productividad de ventas en caja y mostrador</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-[#5C3622] bg-[#FAF7F0] px-2.5 py-1 rounded-full border border-[#DFD5C4]">
                dw.DimVendedor
              </span>
            </div>

            <div className="space-y-3">
              {vendedores.map((v, idx) => {
                const pct = kpis.totalVentas > 0 ? Math.round((Number(v.total) / kpis.totalVentas) * 100) : 0;
                return (
                  <div key={idx} className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#DFD5C4] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#132B20] to-[#2D5E46] text-white flex items-center justify-center text-xs font-bold uppercase">
                          {v.vendedor.slice(0, 2)}
                        </div>
                        <div>
                          <span className="font-black text-xs text-[#132B20] block">{v.vendedor}</span>
                          <span className="text-[10px] text-[#5C3622] font-semibold">{v.rol || 'Personal de Caja'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-black text-xs text-[#132B20] block">{formatCRC(v.total)}</span>
                        <span className="text-[10px] font-bold text-[#2D5E46]">{pct}% del total</span>
                      </div>
                    </div>

                    <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-[#DFD5C4]/50">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#2D5E46] to-[#C05A3E]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#DFD5C4]/50 flex items-center justify-between text-[11px] text-[#5C3622]">
            <span>Personal activo en caja: <strong>{vendedores.length} colaboradores</strong></span>
            <span>Auditoría: <strong>Trazabilidad 100%</strong></span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          6. SECCIÓN DE AUDITORÍA: CUADRE Y CONCILIACIÓN MATEMÁTICA
         ========================================================================= */}
      <div className="bg-white rounded-3xl border border-[#DFD5C4] overflow-hidden shadow-subtle">
        <div className="p-5 border-b border-[#DFD5C4] bg-[#F3ECE0]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#FAF7F0] border border-[#DFD5C4] flex items-center justify-center">
              <Database className="w-4 h-4 text-[#2D5E46]" />
            </div>
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#132B20]">
                Auditoría Contable: Conciliación OLTP (Caja) vs Data Warehouse
              </h3>
              <p className="text-[11px] text-[#5C3622]/80">
                Verificación matemática de que ningún céntimo se extravía en el proceso ETL (SP 91)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                conciliacionCuadrada
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-50 text-rose-800 border border-rose-300'
              }`}
            >
              {conciliacionCuadrada ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <RefreshCw className="w-4 h-4 animate-spin" />}
              {conciliacionCuadrada ? 'Cuadre 100% Exacto (Cero Discrepancias)' : 'Discrepancia Detectada'}
            </span>

            <button
              onClick={() => setMostrarTablaConciliacion(!mostrarTablaConciliacion)}
              className="text-xs font-bold text-[#5C3622] hover:text-[#132B20] px-3 py-1 bg-[#FAF7F0] rounded-xl border border-[#DFD5C4] transition"
            >
              {mostrarTablaConciliacion ? 'Ocultar Detalles' : 'Ver Tabla Detallada'}
            </button>
          </div>
        </div>

        {mostrarTablaConciliacion && (
          <div className="overflow-x-auto p-4">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F0] text-[#5C3622] uppercase tracking-wider font-bold border-b border-[#DFD5C4]">
                <tr>
                  <th className="py-3 px-4">Métrica Evaluada</th>
                  <th className="py-3 px-4 text-center">Conteo Caja</th>
                  <th className="py-3 px-4 text-center">Conteo DW</th>
                  <th className="py-3 px-4 text-right">Monto Caja (OLTP)</th>
                  <th className="py-3 px-4 text-right">Monto Consolidado (DW)</th>
                  <th className="py-3 px-4 text-right">Diferencia</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DFD5C4]/50 font-medium text-[#132B20]">
                {conciliacion.map((item, idx) => {
                  const diffConteo = Number(item.ConteoOperacional) - Number(item.ConteoDW);
                  const diffMonto = Number(item.MontoOperacional) - Number(item.MontoDW);
                  const esExacto = diffConteo === 0 && diffMonto === 0;

                  return (
                    <tr key={idx} className="hover:bg-[#FAF7F0]/80 transition">
                      <td className="py-3 px-4 font-bold text-[#132B20]">{item.Metrica}</td>
                      <td className="py-3 px-4 text-center font-bold">{item.ConteoOperacional}</td>
                      <td className="py-3 px-4 text-center font-bold text-[#5C3622]">{item.ConteoDW}</td>
                      <td className="py-3 px-4 text-right font-bold">{formatCRC(item.MontoOperacional)}</td>
                      <td className="py-3 px-4 text-right font-bold text-[#5C3622]">{formatCRC(item.MontoDW)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span className={esExacto ? 'text-[#2D5E46]' : 'text-[#C05A3E]'}>
                          {formatCRC(Math.abs(diffMonto))}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            esExacto
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-50 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {esExacto ? 'Exacto' : 'Discrepancia'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =========================================================================
          7. MODELO DE CONSTELACIÓN (7 DIMENSIONES Y 4 HECHOS)
         ========================================================================= */}
      <div className="bg-gradient-to-br from-[#0B1A13] via-[#132B20] to-[#1A3D2F] text-[#FAF7F0] rounded-3xl p-6 lg:p-7 shadow-premium border border-[#2D5E46]/50 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2D5E46]/40 pb-4">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2 text-[#FAF7F0]">
              <Layers className="w-5 h-5 text-[#C05A3E]" />
              <span>Modelo Dimensional de Constelación (Esquema dw)</span>
            </h3>
            <p className="text-xs text-[#DFD5C4]/90 mt-1">
              Arquitectura compartida consultada tanto por este dashboard web como por Microsoft Power BI
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#132B20]/90 px-3 py-1.5 rounded-full border border-[#2D5E46]/60 text-xs text-[#FAF7F0]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-[#DFD5C4]">7 Dimensiones • 4 Hechos</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-xs">
          {[
            { name: 'dw.DimFecha', icon: Calendar, desc: '365 días analíticos' },
            { name: 'dw.DimCliente', icon: Users, desc: 'Particulares e Instituciones' },
            { name: 'dw.DimProducto', icon: Layers, desc: 'Catálogo de útiles' },
            { name: 'dw.DimServicio', icon: Cpu, desc: 'Copias y anillado' },
            { name: 'dw.DimVendedor', icon: User, desc: 'Colaboradores de caja' },
            { name: 'dw.DimCondicionPago', icon: Layers, desc: 'Contado y créditos' },
            { name: 'dw.DimMetodoPago', icon: Zap, desc: 'Efectivo, SINPE, tarjeta' },
          ].map((dim) => (
            <div
              key={dim.name}
              className="bg-[#1A3D2F]/70 border border-[#2D5E46]/50 rounded-2xl p-3 text-center shadow-xs"
            >
              <dim.icon className="w-4 h-4 mx-auto mb-1.5 text-[#DFD5C4]" />
              <span className="font-bold text-[11px] text-[#FAF7F0] block leading-tight">{dim.name}</span>
              <span className="text-[9px] text-[#DFD5C4]/70 block mt-1">{dim.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
