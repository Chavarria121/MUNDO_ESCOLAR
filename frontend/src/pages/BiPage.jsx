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
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function BiPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [conciliacion, setConciliacion] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ejecutandoEtl, setEjecutandoEtl] = useState(false);
  const [resultadoEtl, setResultadoEtl] = useState(null);

  // Parámetros ETL
  const [anioInicio, setAnioInicio] = useState(2026);
  const [anioFin, setAnioFin] = useState(2026);

  useEffect(() => {
    cargarConciliacion();
  }, []);

  const cargarConciliacion = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bi/conciliacion');
      setConciliacion(res.data || []);
    } catch (err) {
      console.error('Error cargando conciliación BI:', err);
      showToast('Error consultando conciliación de datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const ejecutarEtlCompleto = async () => {
    setEjecutandoEtl(true);
    setResultadoEtl(null);
    try {
      const res = await api.post('/bi/etl/completo', {
        anioInicio: Number(anioInicio),
        anioFin: Number(anioFin),
      });

      setResultadoEtl(res.data);
      showToast('¡Estadísticas y métricas de negocio actualizadas con éxito!', 'success');
      cargarConciliacion();
    } catch (err) {
      console.error('Error ejecutando actualización:', err);
      const msg = err.response?.data?.mensaje || 'Error al procesar la actualización de datos';
      showToast(msg, 'error');
    } finally {
      setEjecutandoEtl(false);
    }
  };

  const conciliacionCuadrada = useMemo(() => {
    if (!conciliacion.length) return true;
    return conciliacion.every(
      (c) =>
        Number(c.ConteoOperacional) === Number(c.ConteoDW) &&
        Number(c.MontoOperacional) === Number(c.MontoDW)
    );
  }, [conciliacion]);

  return (
    <div className="space-y-6 text-[#132B20]">
      {/* Header BI - Terracota, Madera y Marfil */}
      <div className="bg-white rounded-3xl border border-[#DFD5C4] p-6 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#C05A3E] to-[#5C3622] flex items-center justify-center text-[#FAF7F0] shadow-terracotta">
              <LineChart className="w-5 h-5 text-[#FAF7F0]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#132B20] tracking-tight flex items-center gap-2">
                Métricas Comerciales y Análisis de Rendimiento
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#F3ECE0] text-[#5C3622] border border-[#DFD5C4]">
                  Estadísticas Consolidadas
                </span>
              </h2>
              <p className="text-xs text-[#5C3622]/80 mt-0.5">
                Librería & Papelería Mundo Escolar &bull; Liberia, Guanacaste &bull; Análisis de Tendencias y Cuadre de Ventas
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={cargarConciliacion}
            disabled={loading || ejecutandoEtl}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-[#132B20] bg-[#FAF7F0] hover:bg-[#F3ECE0] border border-[#DFD5C4] rounded-xl transition shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#5C3622] ${loading ? 'animate-spin' : ''}`} />
            <span>Refrescar</span>
          </button>

          <button
            onClick={ejecutarEtlCompleto}
            disabled={ejecutandoEtl}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#C05A3E] to-[#D97448] hover:from-[#AA4C33] hover:to-[#C05A3E] text-[#FAF7F0] text-xs font-black rounded-xl shadow-terracotta transition disabled:opacity-50 active:scale-95 border border-[#FAF7F0]/20"
          >
            {ejecutandoEtl ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-[#FAF7F0]/30 border-t-[#FAF7F0] rounded-full animate-spin" />
                <span>Actualizando estadísticas...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 text-[#FAF7F0]" />
                <span>Actualizar Estadísticas de Negocio</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid de Métricas Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ventas en Mostrador / Tienda */}
        <div className="bg-white p-5 rounded-2xl border border-[#DFD5C4] shadow-subtle hover:border-[#C05A3E] transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5C3622]">Ventas en Tienda</span>
            <div className="w-9 h-9 rounded-xl bg-[#F3ECE0] text-[#C05A3E] border border-[#DFD5C4] flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-[#132B20] block mt-2">
            {loading ? '...' : (conciliacion[0]?.ConteoOperacional || 0)}
          </span>
          <span className="text-xs text-[#2D5E46] font-semibold mt-1 block">
            Registros en mostrador
          </span>
        </div>

        {/* Ventas Totales Consolidadas */}
        <div className="bg-white p-5 rounded-2xl border border-[#DFD5C4] shadow-subtle hover:border-[#C05A3E] transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5C3622]">Ventas Consolidadas</span>
            <div className="w-9 h-9 rounded-xl bg-[#F3ECE0] text-[#2D5E46] border border-[#DFD5C4] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-[#132B20] block mt-2">
            {loading ? '...' : (conciliacion[0]?.ConteoDW || 0)}
          </span>
          <span className="text-xs text-[#2D5E46] font-semibold mt-1 block">
            {conciliacion[0]?.ConteoDW || 0} registros analizados
          </span>
        </div>

        {/* Monto Total Registrado */}
        <div className="bg-white p-5 rounded-2xl border border-[#DFD5C4] shadow-subtle hover:border-[#C05A3E] transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5C3622]">Monto Total Facturado</span>
            <div className="w-9 h-9 rounded-xl bg-[#F3ECE0] text-[#5C3622] border border-[#DFD5C4] flex items-center justify-center">
              <LineChart className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-[#132B20] block mt-2">
            {loading ? '...' : `₡${Number(conciliacion[0]?.MontoOperacional || 0).toLocaleString('es-CR')}`}
          </span>
          <span className="text-xs text-[#5C3622]/80 font-medium mt-1 block">
            Auditoría y conciliación financiera al día
          </span>
        </div>

        {/* Estado de Cuadre */}
        <div className="bg-white p-5 rounded-2xl border border-[#DFD5C4] shadow-subtle hover:border-[#C05A3E] transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5C3622]">Estado del Cuadre</span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                conciliacionCuadrada
                  ? 'bg-[#1A3D2F]/10 text-[#2D5E46] border border-[#2D5E46]/30'
                  : 'bg-rose-50 text-[#C05A3E] border border-rose-200'
              }`}
            >
              {conciliacionCuadrada ? <CheckCircle2 className="w-5 h-5" /> : <RefreshCw className="w-5 h-5 animate-spin" />}
            </div>
          </div>
          <span
            className={`text-xl font-black block mt-2 ${
              conciliacionCuadrada ? 'text-[#2D5E46]' : 'text-[#C05A3E]'
            }`}
          >
            {loading ? '...' : conciliacionCuadrada ? 'Cuadre 100% Exacto' : 'Discrepancia'}
          </span>
          <span className="text-xs text-[#5C3622]/80 font-medium mt-1 block">
            {conciliacionCuadrada ? 'Cero discrepancias en montos' : 'Pendiente de sincronización'}
          </span>
        </div>
      </div>

      {/* Tabla de Conciliación Matemática */}
      <div className="bg-white rounded-3xl border border-[#DFD5C4] overflow-hidden shadow-subtle">
        <div className="p-5 border-b border-[#DFD5C4] bg-[#F3ECE0]/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#FAF7F0] border border-[#DFD5C4] flex items-center justify-center">
              <Database className="w-4 h-4 text-[#2D5E46]" />
            </div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#132B20]">
              Consolidación de Ventas y Comprobantes
            </h3>
          </div>
          <span className="text-xs font-bold text-[#5C3622] bg-[#FAF7F0] px-3 py-1 rounded-full border border-[#DFD5C4]">
            Conciliación Automática
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F0] text-[#5C3622] uppercase tracking-wider font-bold border-b border-[#DFD5C4]">
              <tr>
                <th className="py-3.5 px-4">Métrica Evaluada</th>
                <th className="py-3.5 px-4 text-center">Ventas Tienda</th>
                <th className="py-3.5 px-4 text-center">Ventas Consolidadas</th>
                <th className="py-3.5 px-4 text-right">Monto Tienda</th>
                <th className="py-3.5 px-4 text-right">Monto Consolidado</th>
                <th className="py-3.5 px-4 text-right">Diferencia</th>
                <th className="py-3.5 px-4 text-center">Estado de Cuadre</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DFD5C4]/50 font-medium text-[#132B20]">
              {conciliacion.map((item, idx) => {
                const diffConteo = Number(item.ConteoOperacional) - Number(item.ConteoDW);
                const diffMonto = Number(item.MontoOperacional) - Number(item.MontoDW);
                const esExacto = diffConteo === 0 && diffMonto === 0;

                return (
                  <tr key={idx} className="hover:bg-[#FAF7F0]/80 transition">
                    <td className="py-3.5 px-4 font-bold text-[#132B20]">{item.Metrica}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-[#132B20]">{item.ConteoOperacional}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-[#5C3622]">{item.ConteoDW}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#132B20]">
                      ₡{Number(item.MontoOperacional).toLocaleString('es-CR')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#5C3622]">
                      ₡{Number(item.MontoDW).toLocaleString('es-CR')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black">
                      <span className={esExacto ? 'text-[#2D5E46]' : 'text-[#C05A3E]'}>
                        ₡{Math.abs(diffMonto).toLocaleString('es-CR')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold ${
                          esExacto
                            ? 'bg-[#1A3D2F]/10 text-[#1A3D2F] border border-[#2D5E46]/40'
                            : 'bg-rose-50 text-[#C05A3E] border border-rose-200'
                        }`}
                      >
                        {esExacto && <CheckCircle2 className="w-3 h-3 text-[#2D5E46]" />}
                        {esExacto ? 'CUADRE EXACTO 100%' : 'DISCREPANCIA'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contenedor: Estructura de Análisis Comercial y Dimensiones (Adaptado a Verde Bosque, Terracota y Madera) */}
      <div className="bg-gradient-to-br from-[#0B1A13] via-[#132B20] to-[#1A3D2F] text-[#FAF7F0] rounded-3xl p-6 lg:p-8 shadow-premium border border-[#2D5E46]/50 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2D5E46]/40 pb-5">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2.5 text-[#FAF7F0]">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#C05A3E] to-[#5C3622] flex items-center justify-center text-[#FAF7F0] shadow-terracotta">
                <Layers className="w-4 h-4 text-[#FAF7F0]" />
              </div>
              <span>Estructura de Análisis Comercial y Dimensiones</span>
            </h3>
            <p className="text-xs text-[#DFD5C4]/90 mt-1.5">
              Modelo analítico multidimensional de Mundo Escolar: hechos comerciales y dimensiones de consulta
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#132B20]/90 px-3.5 py-1.5 rounded-full border border-[#2D5E46]/60 text-xs text-[#FAF7F0] shadow-inner">
            <span className="w-2 h-2 rounded-full bg-[#2D5E46] animate-pulse"></span>
            <span className="font-semibold text-[#DFD5C4]">Liberia &bull; Análisis Activo</span>
          </div>
        </div>

        {/* Dimensiones Comerciales */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#C05A3E] block mb-3">
            Dimensiones de Consulta Compartidas
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 text-xs">
            {[
              { name: 'DimFecha', icon: Calendar, desc: 'Día, mes, año y períodos' },
              { name: 'DimCliente', icon: Database, desc: 'Particulares e Instituciones' },
              { name: 'DimProducto', icon: Layers, desc: 'Catálogo de librería' },
              { name: 'DimServicio', icon: Cpu, desc: 'Servicios escolares' },
              { name: 'DimProveedor', icon: Server, desc: 'Distribuidores y Editoriales' },
              { name: 'DimUsuario', icon: Database, desc: 'Cajeros y personal' },
              { name: 'DimCondicionPago', icon: Layers, desc: 'Contado y créditos' },
              { name: 'DimMetodoPago', icon: Zap, desc: 'Efectivo, SINPE y tarjeta' },
            ].map((dim) => (
              <div
                key={dim.name}
                className="bg-[#1A3D2F]/70 border border-[#2D5E46]/50 rounded-2xl p-3 text-center hover:border-[#C05A3E] transition shadow-xs group cursor-default"
              >
                <dim.icon className="w-4 h-4 mx-auto mb-1.5 text-[#DFD5C4] group-hover:text-[#C05A3E] transition" />
                <span className="font-bold text-[11px] text-[#FAF7F0] block leading-tight">{dim.name}</span>
                <span className="text-[9px] text-[#DFD5C4]/70 block mt-1">{dim.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tablas de Hechos Comerciales */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#C8D0B7] block mb-3">
            Áreas de Información y Hechos de Negocio
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {[
              {
                name: 'FactVentas & FactDetalleVentas',
                metric: 'Monto Subtotal, IVA 13%, Monto Total, Unidades Vendidas',
                badge: 'Ventas Comerciales',
                badgeStyle: 'border-[#C05A3E]/60 bg-[#C05A3E]/20 text-[#FAF7F0]',
              },
              {
                name: 'FactPagos',
                metric: 'Monto Pagado, Saldo de Factura, Tiempo de Cobro',
                badge: 'Recaudación & Cartera',
                badgeStyle: 'border-[#5C3622]/60 bg-[#5C3622]/30 text-[#DFD5C4]',
              },
              {
                name: 'FactCompras & FactMovimientosInventario',
                metric: 'Costo de Adquisición, Unidades en Bodega, Kárdex',
                badge: 'Abastecimiento & Bodega',
                badgeStyle: 'border-[#2D5E46]/70 bg-[#2D5E46]/30 text-[#FAF7F0]',
              },
            ].map((fact) => (
              <div
                key={fact.name}
                className="bg-[#1A3D2F]/80 border border-[#2D5E46]/60 rounded-2xl p-4 space-y-2.5 hover:border-[#C05A3E] transition shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[#FAF7F0] text-xs truncate">{fact.name}</span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${fact.badgeStyle}`}>
                    {fact.badge}
                  </span>
                </div>
                <p className="text-[11px] text-[#DFD5C4]/80 leading-relaxed">{fact.metric}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
