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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
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

// Humanizador inteligente de descripciones de bitácora
export function humanizarDescripcion(desc, tabla) {
  if (!desc || typeof desc !== 'string') return desc;
  let text = cleanText(desc);

  // Catálogos oficiales de Mundo Escolar
  const proveedores = {
    '1': 'Papelera Nacional S.A.',
    '2': 'Distribuidora Escolar del Valle S.A.',
    '3': 'Carlos Mora Solano',
  };

  const clientes = {
    '1': 'María Rodríguez Pérez',
    '2': 'Corp. Educativa del Norte S.A.',
    '3': 'Esteban Solís Brenes',
    '4': 'Escuela San Antonio',
    '5': 'Colegio Bilingüe de Liberia',
  };

  const metodosPago = {
    '1': 'Efectivo',
    '2': 'Tarjeta de Débito',
    '3': 'Tarjeta de Crédito',
    '4': 'Transferencia Bancaria',
    '5': 'SINPE Móvil',
  };

  const estadosCompra = {
    '1': 'Pendiente',
    '2': 'Recibida',
    '3': 'Anulada',
  };

  const estadosVenta = {
    '1': 'Pendiente',
    '2': 'Confirmada',
    '3': 'Anulada',
  };

  const estadosFactura = {
    '1': 'Pendiente',
    '2': 'Pagada Parcial',
    '3': 'Pagada Total',
    '4': 'Anulada',
  };

  const tabLower = (tabla || '').toLowerCase();

  // 1. Reemplazo de Proveedor
  text = text.replace(/Proveedor:\s*(\d+)/gi, (match, id) => {
    const nombre = proveedores[id];
    return nombre ? `Proveedor: #${id} (${nombre})` : `Proveedor: #${id}`;
  });

  // 2. Reemplazo de Cliente
  text = text.replace(/Cliente:\s*(\d+)/gi, (match, id) => {
    const nombre = clientes[id];
    return nombre ? `Cliente: #${id} (${nombre})` : `Cliente: #${id}`;
  });

  // 3. Reemplazo de Método de Pago
  text = text.replace(/M[eé]todo:\s*(\d+)/gi, (match, id) => {
    const nombre = metodosPago[id];
    return nombre ? `Método: #${id} (${nombre})` : `Método: #${id}`;
  });

  // 4. Reemplazo de transiciones de Estado (Ej: Estado: 1 -> 2)
  text = text.replace(/Estado:\s*(\d+)\s*->\s*(\d+)/gi, (match, id1, id2) => {
    const dic = tabLower.includes('factura') ? estadosFactura : tabLower.includes('compra') ? estadosCompra : estadosVenta;
    const n1 = dic[id1] ? `${dic[id1]} (#${id1})` : `#${id1}`;
    const n2 = dic[id2] ? `${dic[id2]} (#${id2})` : `#${id2}`;
    return `Estado: ${n1} ➔ ${n2}`;
  });

  // 5. Reemplazo de Estado simple
  text = text.replace(/Estado:\s*(\d+)/gi, (match, id) => {
    const dic = tabLower.includes('factura') ? estadosFactura : tabLower.includes('compra') ? estadosCompra : estadosVenta;
    const nombre = dic[id];
    return nombre ? `Estado: #${id} (${nombre})` : `Estado: #${id}`;
  });

  // 6. Formateo de montos numéricos a moneda nacional ₡
  text = text.replace(/(Monto|Saldo):\s*([0-9]+(\.[0-9]+)?)/gi, (match, label, valor) => {
    const num = parseFloat(valor);
    if (!isNaN(num)) {
      return `${label}: ₡${num.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return match;
  });

  return text;
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

  // Ordenamiento
  const [ordenCampo, setOrdenCampo] = useState('Id_Bitacora'); // 'Id_Bitacora' | 'Fecha_Hora' | 'Nombre_Usuario' | 'Accion' | 'Tabla_Afectada' | 'Id_Registro_Afectado' | 'Descripcion'
  const [ordenDireccion, setOrdenDireccion] = useState('desc'); // 'asc' | 'desc'

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [filasPorPagina, setFilasPorPagina] = useState(25);

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
        DescripcionHumanizada: humanizarDescripcion(r.Descripcion, r.Tabla_Afectada),
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

  // Manejador de ordenamiento al hacer clic en columnas
  const alternarOrden = (campo) => {
    if (ordenCampo === campo) {
      setOrdenDireccion((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setOrdenCampo(campo);
      // Por defecto descendente para IDs y fechas, ascendente para texto
      if (campo === 'Id_Bitacora' || campo === 'Fecha_Hora' || campo === 'Id_Registro_Afectado') {
        setOrdenDireccion('desc');
      } else {
        setOrdenDireccion('asc');
      }
    }
    setPaginaActual(1); // Reiniciar a primera página al ordenar
  };

  // Filtrado reactivo
  const registrosFiltrados = useMemo(() => {
    const term = busqueda.toLowerCase().trim();

    return registros.filter((r) => {
      if (filtroAccion !== 'TODAS' && r.Accion !== filtroAccion) return false;
      if (filtroTabla !== 'TODAS' && r.Tabla_Afectada !== filtroTabla) return false;

      if (!term) return true;
      const id = r.Id_Bitacora?.toString() || '';
      const regId = r.Id_Registro_Afectado?.toString() || '';
      const u = (r.Nombre_Usuario || '').toLowerCase();
      const tab = (r.Tabla_Afectada || '').toLowerCase();
      const desc = (r.Descripcion || '').toLowerCase();
      const descH = (r.DescripcionHumanizada || '').toLowerCase();

      return (
        id.includes(term) ||
        regId.includes(term) ||
        u.includes(term) ||
        tab.includes(term) ||
        desc.includes(term) ||
        descH.includes(term)
      );
    });
  }, [registros, busqueda, filtroAccion, filtroTabla]);

  // Ordenamiento de los registros filtrados
  const registrosOrdenados = useMemo(() => {
    return [...registrosFiltrados].sort((a, b) => {
      let valA = a[ordenCampo];
      let valB = b[ordenCampo];

      // Manejo especial según el tipo de campo
      if (ordenCampo === 'Fecha_Hora') {
        valA = new Date(valA).getTime() || 0;
        valB = new Date(valB).getTime() || 0;
      } else if (ordenCampo === 'Id_Bitacora' || ordenCampo === 'Id_Registro_Afectado') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else if (typeof valA === 'string' || typeof valB === 'string') {
        valA = (valA || '').toString().toLowerCase();
        valB = (valB || '').toString().toLowerCase();
      }

      if (valA < valB) return ordenDireccion === 'asc' ? -1 : 1;
      if (valA > valB) return ordenDireccion === 'asc' ? 1 : -1;
      return 0;
    });
  }, [registrosFiltrados, ordenCampo, ordenDireccion]);

  // Paginación
  const totalPaginas = Math.ceil(registrosOrdenados.length / filasPorPagina) || 1;
  const paginaValida = Math.min(Math.max(paginaActual, 1), totalPaginas);

  const registrosPaginados = useMemo(() => {
    const inicio = (paginaValida - 1) * filasPorPagina;
    return registrosOrdenados.slice(inicio, inicio + filasPorPagina);
  }, [registrosOrdenados, paginaValida, filasPorPagina]);

  // Reset de página al cambiar filtros
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroAccion, filtroTabla, filasPorPagina]);

  // Render del icono de orden en cabecera
  const renderIconoOrden = (campo) => {
    if (ordenCampo !== campo) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-[#5C3622]/40 opacity-0 group-hover:opacity-100 transition" />;
    }
    return ordenDireccion === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-[#C05A3E] font-bold" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-[#C05A3E] font-bold" />
    );
  };

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
                Historial de Actividades y Auditoría Forense
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#F3ECE0] text-[#5C3622] border border-[#DFD5C4]">
                  Trazabilidad Total
                </span>
              </h2>
              <p className="text-xs text-[#5C3622]/80 mt-0.5">
                Librería & Papelería Mundo Escolar &bull; Liberia, Guanacaste &bull; Registro Inmutable de Transacciones y Seguridad
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
            <span>Imprimir Bitácora</span>
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
            Operaciones auditadas en FG_AUDITORIA
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
            Ventas, compras y pagos creados
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

      {/* Barra de Búsqueda, Filtros y Paginación */}
      <div className="bg-white rounded-2xl border border-[#DFD5C4] p-4 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs no-print">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#5C3622]/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por usuario, módulo, descripción o ID..."
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

          {/* Selector de filas por página */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-[#DFD5C4]">
            <span className="text-[#5C3622] font-semibold">Ver:</span>
            <select
              value={filasPorPagina}
              onChange={(e) => setFilasPorPagina(Number(e.target.value))}
              className="bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl px-2 py-1.5 font-bold text-[#132B20] text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C05A3E]"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
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

      {/* Tabla del Historial de Actividades con Cabeceras Ordenables */}
      <div className="bg-white rounded-3xl border border-[#DFD5C4] shadow-subtle overflow-hidden print:border-none print:shadow-none print:rounded-none">
        {loading ? (
          <div className="p-16 text-center text-[#5C3622] space-y-3">
            <div className="w-8 h-8 border-3 border-[#DFD5C4] border-t-[#C05A3E] rounded-full animate-spin mx-auto" />
            <p className="font-bold text-xs">Cargando bitácora de actividades...</p>
          </div>
        ) : registrosOrdenados.length === 0 ? (
          <div className="p-16 text-center text-[#5C3622]/70 space-y-2">
            <FileText className="w-10 h-10 text-[#DFD5C4] mx-auto mb-2" />
            <p className="font-bold text-sm">Sin eventos para el filtro seleccionado</p>
            <p className="text-xs">Intenta modificando el término de búsqueda o el tipo de acción.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F3ECE0]/80 text-[#5C3622] uppercase tracking-wider font-bold border-b border-[#DFD5C4] select-none">
                  <tr>
                    {/* # Registro */}
                    <th
                      onClick={() => alternarOrden('Id_Bitacora')}
                      className="py-3.5 px-4 cursor-pointer hover:bg-[#EAE0D0] transition group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span># Registro</span>
                        {renderIconoOrden('Id_Bitacora')}
                      </div>
                    </th>

                    {/* Fecha y Hora */}
                    <th
                      onClick={() => alternarOrden('Fecha_Hora')}
                      className="py-3.5 px-4 cursor-pointer hover:bg-[#EAE0D0] transition group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Fecha y Hora</span>
                        {renderIconoOrden('Fecha_Hora')}
                      </div>
                    </th>

                    {/* Usuario */}
                    <th
                      onClick={() => alternarOrden('Nombre_Usuario')}
                      className="py-3.5 px-4 cursor-pointer hover:bg-[#EAE0D0] transition group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Usuario</span>
                        {renderIconoOrden('Nombre_Usuario')}
                      </div>
                    </th>

                    {/* Acción */}
                    <th
                      onClick={() => alternarOrden('Accion')}
                      className="py-3.5 px-4 text-center cursor-pointer hover:bg-[#EAE0D0] transition group"
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>Acción</span>
                        {renderIconoOrden('Accion')}
                      </div>
                    </th>

                    {/* Módulo / Registro */}
                    <th
                      onClick={() => alternarOrden('Tabla_Afectada')}
                      className="py-3.5 px-4 cursor-pointer hover:bg-[#EAE0D0] transition group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Módulo / Registro</span>
                        {renderIconoOrden('Tabla_Afectada')}
                      </div>
                    </th>

                    {/* ID Afectado */}
                    <th
                      onClick={() => alternarOrden('Id_Registro_Afectado')}
                      className="py-3.5 px-4 text-center cursor-pointer hover:bg-[#EAE0D0] transition group"
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>ID Afectado</span>
                        {renderIconoOrden('Id_Registro_Afectado')}
                      </div>
                    </th>

                    {/* Descripción del Cambio */}
                    <th
                      onClick={() => alternarOrden('Descripcion')}
                      className="py-3.5 px-4 cursor-pointer hover:bg-[#EAE0D0] transition group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Descripción del Cambio (Datos Auditados)</span>
                        {renderIconoOrden('Descripcion')}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DFD5C4]/50 font-medium text-[#132B20]">
                  {registrosPaginados.map((r) => {
                    const esInsert = r.Accion === 'INSERT';
                    const esUpdate = r.Accion === 'UPDATE';
                    const esDelete = r.Accion === 'DELETE';

                    return (
                      <tr key={r.Id_Bitacora} className="hover:bg-[#FAF7F0] transition print:break-inside-avoid">
                        {/* # Registro */}
                        <td className="py-3.5 px-4 font-mono font-bold text-[#C05A3E]">
                          #{r.Id_Bitacora?.toString().padStart(6, '0')}
                        </td>

                        {/* Fecha y Hora */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-[#5C3622]">
                          {new Date(r.Fecha_Hora).toLocaleDateString('es-CR')}
                          <span className="block text-[10px] text-[#5C3622]/70 font-mono">
                            {new Date(r.Fecha_Hora).toLocaleTimeString('es-CR', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </td>

                        {/* Usuario */}
                        <td className="py-3.5 px-4 font-mono font-bold text-[#132B20]">
                          <span className="px-2 py-0.5 rounded-md bg-[#FAF7F0] border border-[#DFD5C4]/60">
                            {r.Nombre_Usuario}
                          </span>
                        </td>

                        {/* Acción */}
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

                        {/* Módulo / Registro */}
                        <td className="py-3.5 px-4 font-bold text-[#132B20]">
                          {cleanText(r.Tabla_Afectada)}
                        </td>

                        {/* ID Afectado */}
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-[#5C3622]">
                          {r.Id_Registro_Afectado ? (
                            <span className="px-2 py-0.5 rounded-md bg-[#F3ECE0]/60">
                              #{r.Id_Registro_Afectado}
                            </span>
                          ) : (
                            <span className="text-[#5C3622]/40">N/A</span>
                          )}
                        </td>

                        {/* Descripción Humanizada y Clara */}
                        <td className="py-3.5 px-4 text-[#5C3622] max-w-lg" title={r.Descripcion}>
                          <p className="leading-relaxed font-normal text-xs text-[#132B20]">
                            {r.DescripcionHumanizada || cleanText(r.Descripcion)}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Barra de Paginación y Resumen */}
            <div className="p-4 bg-[#FAF7F0] border-t border-[#DFD5C4] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#5C3622] font-semibold no-print">
              <div>
                Mostrando del{' '}
                <span className="font-bold text-[#132B20]">
                  {(paginaValida - 1) * filasPorPagina + 1}
                </span>{' '}
                al{' '}
                <span className="font-bold text-[#132B20]">
                  {Math.min(paginaValida * filasPorPagina, registrosOrdenados.length)}
                </span>{' '}
                de <span className="font-bold text-[#132B20]">{registrosOrdenados.length}</span> eventos
                {registrosFiltrados.length !== registros.length && (
                  <span className="text-[11px] text-[#C05A3E] ml-1">
                    (filtrados de {registros.length} totales)
                  </span>
                )}
              </div>

              {/* Botones de Navegación */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPaginaActual(1)}
                  disabled={paginaValida === 1}
                  title="Primera página"
                  className="p-1.5 rounded-lg border border-[#DFD5C4] bg-white hover:bg-[#F3ECE0] text-[#132B20] disabled:opacity-30 disabled:pointer-events-none transition"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
                  disabled={paginaValida === 1}
                  title="Página anterior"
                  className="p-1.5 rounded-lg border border-[#DFD5C4] bg-white hover:bg-[#F3ECE0] text-[#132B20] disabled:opacity-30 disabled:pointer-events-none transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="px-3 py-1 font-bold bg-white border border-[#DFD5C4] rounded-lg text-[#132B20]">
                  Página {paginaValida} de {totalPaginas}
                </div>

                <button
                  onClick={() => setPaginaActual((p) => Math.min(p + 1, totalPaginas))}
                  disabled={paginaValida === totalPaginas}
                  title="Página siguiente"
                  className="p-1.5 rounded-lg border border-[#DFD5C4] bg-white hover:bg-[#F3ECE0] text-[#132B20] disabled:opacity-30 disabled:pointer-events-none transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPaginaActual(totalPaginas)}
                  disabled={paginaValida === totalPaginas}
                  title="Última página"
                  className="p-1.5 rounded-lg border border-[#DFD5C4] bg-white hover:bg-[#F3ECE0] text-[#132B20] disabled:opacity-30 disabled:pointer-events-none transition"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
