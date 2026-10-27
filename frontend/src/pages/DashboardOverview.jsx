import React, { useState, useEffect } from 'react';
import {
  LineChart,
  ShoppingCart,
  Receipt,
  Boxes,
  Users,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Database,
  ShieldCheck,
  CheckCircle,
  Leaf,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function DashboardOverview({ onNavigate }) {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalVentas: 0,
    montoVentas: 0,
    articulosBajoReorden: 0,
    facturasPendientes: 0,
    clientesActivos: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [ventasRes, reordenRes, facturasRes, clientesRes] = await Promise.all([
          api.get('/ventas/vista').catch(() => ({ data: [] })),
          api.get('/inventario/bajo-reorden').catch(() => ({ data: [] })),
          api.get('/facturas/vista').catch(() => ({ data: [] })),
          api.get('/clientes/activos').catch(() => ({ data: [] })),
        ]);

        const ventas = Array.isArray(ventasRes.data) ? ventasRes.data : [];
        const monto = ventas.reduce((acc, v) => acc + (Number(v.Monto_Total) || 0), 0);
        const reorden = Array.isArray(reordenRes.data) ? reordenRes.data.length : 0;
        const facturasPend = Array.isArray(facturasRes.data)
          ? facturasRes.data.filter((f) => f.Estado_Factura !== 'Pagada' && f.Estado_Factura !== 'Anulada').length
          : 0;
        const clientes = Array.isArray(clientesRes.data) ? clientesRes.data.length : 0;

        setStats({
          totalVentas: ventas.length,
          montoVentas: monto,
          articulosBajoReorden: reorden,
          facturasPendientes: facturasPend,
          clientesActivos: clientes,
        });
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const formatCRC = (val) =>
    new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      {/* Banner Principal de Bienvenida - Inspiración Verde Bosque, Terracota & Madera */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#132B20] via-[#1A3D2F] to-[#2D5E46] text-white p-8 lg:p-9 shadow-forest border border-[#2D5E46]/60">
        {/* Destellos ambientales orgánicos */}
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-[#C05A3E]/15 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-24 w-72 h-72 rounded-full bg-[#3E7356]/20 blur-2xl pointer-events-none" />
        <div className="absolute left-1/4 -top-20 w-48 h-48 rounded-full bg-[#5C3622]/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          {/* Badge del sistema */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#132B20]/60 border border-[#DFD5C4]/30 text-[#FAF7F0] text-xs font-semibold mb-4 backdrop-blur-md shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C05A3E] animate-pulse" />
            <Leaf className="w-3.5 h-3.5 text-[#C8D0B7]" />
            <span>Sistema Activo &bull; Sucursal Central</span>
          </div>

          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight mb-2.5 text-[#FAF7F0]">
            ¡Hola, {user?.nombreUsuario}!
          </h1>

          <p className="text-sm text-[#F3ECE0]/90 leading-relaxed font-normal">
            Bienvenido al sistema de gestión de <strong className="text-[#FAF7F0] font-bold">Librería y Papelería Mundo Escolar</strong>.
            Gestiona tus ventas en caja, inventario de útiles y libros, facturación y catálogo de clientes de manera ágil, segura y sencilla.
          </p>
        </div>

        {/* Botones de Acción Rápida */}
        <div className="mt-7 flex flex-wrap items-center gap-3.5 relative z-10">
          <button
            onClick={() => onNavigate('pos')}
            className="px-5 py-3 bg-gradient-to-r from-[#C05A3E] to-[#D97448] hover:from-[#AA4C33] hover:to-[#C05A3E] text-[#FAF7F0] text-xs font-black rounded-2xl shadow-terracotta transition-all duration-200 flex items-center gap-2.5 active:scale-95 border border-[#FAF7F0]/20"
          >
            <ShoppingCart className="w-4 h-4 text-[#FAF7F0]" />
            <span>Abrir Caja / Nueva Venta</span>
          </button>

          <button
            onClick={() => onNavigate('inventario')}
            className="px-5 py-3 bg-[#132B20]/80 hover:bg-[#132B20] text-[#FAF7F0] border border-[#DFD5C4]/40 text-xs font-bold rounded-2xl transition-all duration-200 flex items-center gap-2.5 active:scale-95 shadow-sm backdrop-blur-sm"
          >
            <Boxes className="w-4 h-4 text-[#DFD5C4]" />
            <span>Ver Inventario y Kárdex</span>
          </button>
        </div>
      </div>

      {/* Grid de Métricas KPI - Blanco Roto / Marfil con Borde en Fibra Natural */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Facturado */}
        <div className="bg-white p-5 rounded-2xl border border-[#DFD5C4] shadow-subtle hover:border-[#C05A3E] hover:shadow-premium transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5C3622]">Total Facturado</span>
            <div className="w-9 h-9 rounded-xl bg-[#F3ECE0] text-[#C05A3E] border border-[#DFD5C4] flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#132B20] mt-3">
            {loading ? '...' : formatCRC(stats.montoVentas)}
          </p>
          <p className="text-xs text-[#2D5E46] mt-1 flex items-center gap-1 font-semibold">
            <span>{stats.totalVentas}</span> ventas consolidadas
          </p>
        </div>

        {/* Facturas Pendientes */}
        <div className="bg-white p-5 rounded-2xl border border-[#DFD5C4] shadow-subtle hover:border-[#C05A3E] hover:shadow-premium transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5C3622]">Facturas por Cobrar</span>
            <div className="w-9 h-9 rounded-xl bg-[#F3ECE0] text-[#5C3622] border border-[#DFD5C4] flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#132B20] mt-3">
            {loading ? '...' : stats.facturasPendientes}
          </p>
          <p className="text-xs text-[#5C3622]/80 font-medium mt-1">
            Gestión de cartera y créditos
          </p>
        </div>

        {/* Stock Bajo Reorden */}
        <div className="bg-white p-5 rounded-2xl border border-[#DFD5C4] shadow-subtle hover:border-[#C05A3E] hover:shadow-premium transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5C3622]">Stock Bajo Reorden</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#C05A3E] border border-rose-200 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#C05A3E] mt-3">
            {loading ? '...' : stats.articulosBajoReorden}
          </p>
          <p className="text-xs text-[#5C3622]/80 mt-1 font-medium">
            Artículos requieren reposición
          </p>
        </div>

        {/* Clientes Activos en 3FN */}
        <div className="bg-white p-5 rounded-2xl border border-[#DFD5C4] shadow-subtle hover:border-[#C05A3E] hover:shadow-premium transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5C3622]">Clientes Registrados</span>
            <div className="w-9 h-9 rounded-xl bg-[#1A3D2F] text-[#FAF7F0] flex items-center justify-center shadow-sm">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#132B20] mt-3">
            {loading ? '...' : stats.clientesActivos}
          </p>
          <p className="text-xs text-[#2D5E46] font-semibold mt-1">
            Particulares e Institucionales
          </p>
        </div>
      </div>

      {/* Widget Destacado: Data Warehouse & Business Intelligence (Power BI Ready) */}
      <div className="bg-gradient-to-r from-[#132B20] via-[#1A3D2F] to-[#2D5E46] text-[#FAF7F0] rounded-3xl p-6 shadow-forest border border-[#2D5E46]/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-[#D4A373] shadow-md shrink-0">
            <LineChart className="w-6 h-6 text-[#D4A373]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-extrabold text-[#FAF7F0] tracking-tight">
                Data Warehouse & Inteligencia de Negocios (BI)
              </h3>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Esquema dw Activo
              </span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-[#DFD5C4] border border-white/20">
                Sincronización Power BI
              </span>
            </div>
            <p className="text-xs text-[#DFD5C4]/90 mt-1">
              Métricas consolidadas, análisis de categorías, distribución de métodos de pago y sincronización en un clic.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('bi')}
            className="px-4 py-2.5 bg-[#FAF7F0] hover:bg-white text-[#132B20] font-black text-xs rounded-xl shadow-md transition active:scale-95 flex items-center gap-2"
          >
            <span>Ver Tablero BI Completo</span>
            <ArrowUpRight className="w-4 h-4 text-[#C05A3E]" />
          </button>
        </div>
      </div>

      {/* Accesos Rápidos y Resumen Operativo */}
      <div className="bg-white rounded-3xl border border-[#DFD5C4] p-6 lg:p-7 shadow-subtle">
        <h3 className="font-bold text-[#132B20] text-sm mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#2D5E46]" />
          <span>Servicios y Módulos Principales de la Librería</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-[#F3ECE0]/50 border border-[#DFD5C4] hover:border-[#C05A3E] transition cursor-pointer" onClick={() => onNavigate('pos')}>
            <p className="font-bold text-[#5C3622] mb-1 flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4 text-[#C05A3E]" />
              <span>Punto de Venta Ágil (POS)</span>
            </p>
            <p className="text-[#132B20]/80 leading-relaxed">
              Cobro rápido en caja, búsqueda por código de barras, comprobante fiscal e integración directa con clientes.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-[#F3ECE0]/50 border border-[#DFD5C4] hover:border-[#C05A3E] transition cursor-pointer" onClick={() => onNavigate('inventario')}>
            <p className="font-bold text-[#5C3622] mb-1 flex items-center gap-1.5">
              <Boxes className="w-4 h-4 text-[#2D5E46]" />
              <span>Control de Bodega y Kárdex</span>
            </p>
            <p className="text-[#132B20]/80 leading-relaxed">
              Existencias en tiempo real, alertas de stock mínimo para útiles escolares y libros, y registro de entradas y salidas.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-[#F3ECE0]/50 border border-[#DFD5C4] hover:border-[#C05A3E] transition cursor-pointer" onClick={() => onNavigate('clientes')}>
            <p className="font-bold text-[#5C3622] mb-1 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#5C3622]" />
              <span>Directorio de Clientes</span>
            </p>
            <p className="text-[#132B20]/80 leading-relaxed">
              Atención a clientes particulares, convenios con centros educativos e instituciones, y cuentas de crédito al día.
            </p>
          </div>
        </div></div>
    </div>
  );
}
