import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  RefreshCw,
  AlertTriangle,
  FileText,
  Printer,
  Clock,
  Layers,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// Sanitizador preventivo para corregir cualquier texto con doble codificación
function cleanText(str) {
  if (!str || typeof str !== 'string') return str;
  if (/[\u00C2\u00C3]/.test(str)) {
    try {
      const fixed = decodeURIComponent(escape(str));
      return fixed;
    } catch (e) {
      return str
        .replace(/Ã¡/g, 'á')
        .replace(/Ã©/g, 'é')
        .replace(/Ã­/g, 'í')
        .replace(/Ã³/g, 'ó')
        .replace(/Ãº/g, 'ú')
        .replace(/Ã±/g, 'ñ')
        .replace(/Ã /g, 'Á')
        .replace(/Ã‰/g, 'É')
        .replace(/Ã /g, 'Í')
        .replace(/Ã“/g, 'Ó')
        .replace(/Ãš/g, 'Ú')
        .replace(/Ã‘/g, 'Ñ');
    }
  }
  return str;
}

export default function AuditoriaPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [registros, setRegistros] = useState([]);
  const [permisosFallidos, setPermisosFallidos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroAccion, setFiltroAccion] = useState('TODAS'); // 'TODAS' | 'INSERT' | 'UPDATE' | 'DELETE'
  const [filtroTabla, setFiltroTabla] = useState('TODAS');

  useEffect(() => {
    cargarAuditoria();
  }, []);

  const cargarAuditoria = async () => {
    setLoading(true);
    try {
      const [resAudit, resFallidos] = await Promise.all([
        api.get('/auditoria/vista'),
        api.get('/auditoria/permisos-fallidos'),
      ]);

      const rawRegistros = resAudit.data || [];
      const cleaned = rawRegistros.map((r) => ({
        ...r,
        Descripcion: cleanText(r.Descripcion),
        Tabla_Afectada: cleanText(r.Tabla_Afectada),
      }));

      setRegistros(cleaned);
      setPermisosFallidos(resFallidos.data || []);
    } catch (err) {
      console.error('Error cargando historial de actividades:', err);
      showToast('Error al consultar el historial de actividades', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Tablas únicas para el filtro
  const tablasUnicas = useMemo(() => {
    const set = new Set(registros.map((r) => r.Tabla_Afectada).filter(Boolean));
    return ['TODAS', ...Array.from(set)];
  }, [registros]);

  // KPIs
  const metricas = useMemo(() => {
    const total = registros.length;
    const inserts = registros.filter((r) => r.Accion === 'INSERT').length;
    const updates = registros.filter((r) => r.Accion === 'UPDATE').length;
    const deletes = registros.filter((r) => r.Accion === 'DELETE').length;

    return {
      total,
      inserts,
      updates,
      deletes,
      fallidos: permisosFallidos.length,
    };
  }, [registros, permisosFallidos]);

  // Filtrado reactivo
  const registrosFiltrados = useMemo(() => {
    const term = busqueda.toLowerCase().trim();

    return registros.filter((r) => {
      if (filtroAccion !== 'TODAS' && r.Accion !== filtroAccion) return false;
      if (filtroTabla !== 'TODAS' && r.Tabla_Afectada !== filtroTabla) return false;

      if (!term) return true;
      const id = r.Id_Bitacora?.toString() || '';
      const u = (r.Nombre_Usuario || '').toLowerCase();
      const tab = (r.Tabla_Afectada || '').toLowerCase();
      const desc = (r.Descripcion || '').toLowerCase();

      return id.includes(term) || u.includes(term) || tab.includes(term) || desc.includes(term);
    });
  }, [registros, busqueda, filtroAccion, filtroTabla]);

  return (
    <div className="space-y-6 text-[#132B20]">
      {/* Header - Terracota, Madera y Marfil */}
      <div className="bg-white rounded-3xl border border-[#DFD5C4] p-6 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#C05A3E] to-[#5C3622] flex items-center justify-center text-[#FAF7F0] shadow-terracotta">
              <ShieldCheck className="w-5 h-5 text-[#FAF7F0]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#132B20] tracking-tight flex items-center gap-2">
                Historial de Actividades y Seguridad
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#F3ECE0] text-[#5C3622] border border-[#DFD5C4]">
                  Registro de Operaciones
                </span>
              </h2>
              <p className="text-xs text-[#5C3622]/80 mt-0.5">
                Librería & Papelería Mundo Escolar &bull; Liberia, Guanacaste &bull; Trazabilidad de Ventas, Inventario y Usuarios
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 no-print">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-[#132B20] bg-white border border-[#DFD5C4] hover:bg-[#F3ECE0] rounded-xl transition shadow-xs"
          >
            <Printer className="w-4 h-4 text-[#5C3622]" />
            <span>Imprimir Historial</span>
          </button>
          <button
            onClick={cargarAuditoria}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-[#FAF7F0] bg-gradient-to-r from-[#C05A3E] to-[#5C3622] hover:from-[#A84930] hover:to-[#452718] rounded-xl transition shadow-terracotta disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-[#FAF7F0] ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Grid de Métricas de Auditoría */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        {/* Total Eventos */}
        <div className="bg-white rounded-2xl border border-[#DFD5C4] p-5 shadow-subtle hover:border-[#C05A3E] transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5C3622]">Total de Eventos</span>
            <div className="w-9 h-9 rounded-xl bg-[#F3ECE0] text-[#5C3622] border border-[#DFD5C4] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-[#132B20] mt-2 block">
            {metricas.total}
          </span>
          <span className="text-xs text-[#2D5E46] font-semibold mt-1 block">
            Operaciones registradas al día
          </span>
        </div>

        {/* Inserciones */}
        <div className="bg-white rounded-2xl border border-[#DFD5C4] p-5 shadow-subtle hover:border-[#C05A3E] transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5C3622]">Nuevos Registros (INSERT)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#2D5E46] animate-pulse"></span>
          </div>
          <span className="text-2xl font-black text-[#2D5E46] mt-2 block">
            {metricas.inserts}
          </span>
          <span className="text-xs text-[#2D5E46] font-semibold mt-1 block">
            Entidades y documentos creados
          </span>
        </div>

        {/* Modificaciones */}
        <div className="bg-white rounded-2xl border border-[#DFD5C4] p-5 shadow-subtle hover:border-[#C05A3E] transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5C3622]">Modificaciones (UPDATE)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#C05A3E]"></span>
          </div>
          <span className="text-2xl font-black text-[#C05A3E] mt-2 block">
            {metricas.updates}
          </span>
          <span className="text-xs text-[#5C3622] font-semibold mt-1 block">
            Ajustes de estado y existencias
          </span>
        </div>

        {/* Eliminaciones y Seguridad */}
        <div className="bg-white rounded-2xl border border-[#DFD5C4] p-5 shadow-subtle hover:border-[#C05A3E] transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5C3622]">Eliminaciones / Seguridad</span>
            <AlertTriangle className="w-4 h-4 text-[#C05A3E]" />
          </div>
          <span className="text-2xl font-black text-[#132B20] mt-2 block">
            {metricas.deletes + metricas.fallidos}
          </span>
          <span className="text-xs text-[#5C3622] font-semibold mt-1 block">
            {metricas.deletes} DELETE &bull; {metricas.fallidos} advertencias
          </span>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-white rounded-2xl border border-[#DFD5C4] p-4 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs no-print">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#5C3622]/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por usuario, módulo o descripción del cambio..."
            className="w-full pl-9 pr-4 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl text-[#132B20] placeholder-[#5C3622]/50 focus:outline-none focus:ring-2 focus:ring-[#C05A3E] text-xs font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Píldoras de Acción */}
          <div className="flex items-center bg-[#FAF7F0] p-1 rounded-xl border border-[#DFD5C4] font-semibold">
            {['TODAS', 'INSERT', 'UPDATE', 'DELETE'].map((acc) => (
              <button
                key={acc}
                onClick={() => setFiltroAccion(acc)}
                className={`px-3 py-1.5 rounded-lg text-xs transition ${
                  filtroAccion === acc
                    ? 'bg-gradient-to-r from-[#132B20] to-[#1A3D2F] text-[#FAF7F0] shadow-xs font-bold'
                    : 'text-[#5C3622] hover:text-[#132B20]'
                }`}
              >
                {acc}
              </button>
            ))}
          </div>

          {/* Selector de Módulo */}
          <select
            value={filtroTabla}
            onChange={(e) => setFiltroTabla(e.target.value)}
            className="bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl px-3 py-2 font-semibold text-[#132B20] focus:outline-none focus:ring-2 focus:ring-[#C05A3E] text-xs cursor-pointer"
          >
            {tablasUnicas.map((t) => (
              <option key={t} value={t}>
                {t === 'TODAS' ? 'Todos los Módulos' : `Módulo: ${cleanText(t)}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Encabezado Oficial Exclusivo para Impresión */}
      <div className="hidden print:block mb-4 pb-2 border-b-2 border-[#132B20]">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-xl font-black text-[#132B20]">LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR</h1>
            <p className="text-xs text-[#5C3622]">Historial de Auditoría, Seguridad y Trazabilidad del Sistema • Liberia, Guanacaste</p>
          </div>
          <div className="text-right text-xs text-[#5C3622]">
            <p><span className="font-bold">Fecha de Emisión:</span> {new Date().toLocaleString('es-CR')}</p>
            <p><span className="font-bold">Total Registros:</span> {registrosFiltrados.length}</p>
          </div>
        </div>
      </div>

      {/* Tabla del Historial de Actividades */}
      <div className="bg-white rounded-3xl border border-[#DFD5C4] shadow-subtle overflow-hidden print:border-none print:shadow-none print:rounded-none">
        {loading ? (
          <div className="p-16 text-center text-[#5C3622] space-y-3">
            <div className="w-8 h-8 border-3 border-[#DFD5C4] border-t-[#C05A3E] rounded-full animate-spin mx-auto" />
            <p className="font-bold text-xs">Cargando historial de actividades...</p>
          </div>
        ) : registrosFiltrados.length === 0 ? (
          <div className="p-16 text-center text-[#5C3622]/70 space-y-2">
            <FileText className="w-10 h-10 text-[#DFD5C4] mx-auto mb-2" />
            <p className="font-bold text-sm">Sin eventos para el filtro seleccionado</p>
            <p className="text-xs">Intenta modificando el término de búsqueda o el tipo de acción.</p>
          </div>
        ) : (
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F3ECE0]/80 text-[#5C3622] uppercase tracking-wider font-bold border-b border-[#DFD5C4]">
                <tr>
                  <th className="py-3.5 px-4"># Registro</th>
                  <th className="py-3.5 px-4">Fecha y Hora</th>
                  <th className="py-3.5 px-4">Usuario</th>
                  <th className="py-3.5 px-4 text-center">Acción</th>
                  <th className="py-3.5 px-4">Módulo / Registro</th>
                  <th className="py-3.5 px-4 text-center">ID Afectado</th>
                  <th className="py-3.5 px-4">Descripción del Cambio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DFD5C4]/50 font-medium text-[#132B20]">
                {registrosFiltrados.map((r) => {
                  const esInsert = r.Accion === 'INSERT';
                  const esUpdate = r.Accion === 'UPDATE';
                  const esDelete = r.Accion === 'DELETE';

                  return (
                    <tr key={r.Id_Bitacora} className="hover:bg-[#FAF7F0] transition print:break-inside-avoid">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#C05A3E]">
                        #{r.Id_Bitacora?.toString().padStart(6, '0')}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-[#5C3622]">
                        {new Date(r.Fecha_Hora).toLocaleDateString('es-CR')}
                        <span className="block text-[10px] text-[#5C3622]/70">
                          {new Date(r.Fecha_Hora).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-[#132B20]">
                        {r.Nombre_Usuario}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            esInsert
                              ? 'bg-[#1A3D2F]/10 text-[#2D5E46] border border-[#2D5E46]/40'
                              : esUpdate
                              ? 'bg-[#F3ECE0] text-[#5C3622] border border-[#DFD5C4]'
                              : 'bg-[#C05A3E]/10 text-[#C05A3E] border border-[#C05A3E]/30'
                          }`}
                        >
                          {r.Accion}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-[#132B20]">
                        {cleanText(r.Tabla_Afectada)}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-[#5C3622]">
                        {r.Id_Registro_Afectado ? `#${r.Id_Registro_Afectado}` : 'N/A'}
                      </td>

                      <td className="py-3.5 px-4 text-[#5C3622] max-w-md" title={r.Descripcion}>
                        <p className="line-clamp-2 leading-relaxed">{cleanText(r.Descripcion)}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
