import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  Search,
  Calendar,
  Filter,
  RefreshCw,
  Printer,
  TrendingUp,
  Award,
  Clock,
  AlertTriangle,
  Boxes,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  X,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ReportesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Tipo de reporte activo
  const [reporteActivo, setReporteActivo] = useState('PRODUCTOS_MAS_VENDIDOS');
  const [datosReporte, setDatosReporte] = useState([]);
  const [loading, setLoading] = useState(false);

  // Búsqueda instantánea en vivo
  const [busquedaTexto, setBusquedaTexto] = useState('');
  // Filtros de fecha
  const [fechaInicio, setFechaInicio] = useState('2026-01-01');
  const [fechaFin, setFechaFin] = useState('2026-12-31');

  // Estado de ordenamiento para tablas interactivas
  const [sortConfig, setSortConfig] = useState({ key: 'Monto_Total_Vendido', direction: 'desc' });

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'desc' };
    });
  };

  // Cambiar reporte activo y establecer orden inicial idóneo
  const cambiarReporte = (nuevoReporte) => {
    setReporteActivo(nuevoReporte);
    if (nuevoReporte === 'PRODUCTOS_MAS_VENDIDOS') {
      setSortConfig({ key: 'Monto_Total_Vendido', direction: 'desc' });
    } else if (nuevoReporte === 'VENTAS_PERIODO') {
      setSortConfig({ key: 'Id_Venta', direction: 'desc' });
    } else if (nuevoReporte === 'FACTURAS_PENDIENTES') {
      setSortConfig({ key: 'Saldo_Pendiente', direction: 'desc' });
    } else if (nuevoReporte === 'CUENTAS_VENCIDAS') {
      setSortConfig({ key: 'Dias_Mora', direction: 'desc' });
    } else if (nuevoReporte === 'MOVIMIENTOS_KARDEX') {
      setSortConfig({ key: 'Id_Movimiento_Inventario', direction: 'desc' });
    }
  };

  // 1. Filtrado instantáneo por texto
  const datosReporteFiltrados = useMemo(() => {
    if (!datosReporte || !datosReporte.length) return [];
    if (!busquedaTexto.trim()) return datosReporte;

    const term = busquedaTexto.toLowerCase().trim();
    return datosReporte.filter((item) => {
      return Object.values(item).some((val) => {
        if (val == null) return false;
        return String(val).toLowerCase().includes(term);
      });
    });
  }, [datosReporte, busquedaTexto]);

  // 2. Datos ordenados reactivamente en memoria para los 5 reportes (0 ms latencia)
  const datosReporteOrdenados = useMemo(() => {
    if (!datosReporteFiltrados || !datosReporteFiltrados.length) return [];
    const items = [...datosReporteFiltrados];
    const { key, direction } = sortConfig;
    if (!key) return items;
    const factor = direction === 'asc' ? 1 : -1;

    items.sort((a, b) => {
      // 1. Campos de fecha
      if (['Fecha', 'Fecha_Emision', 'Fecha_Vencimiento'].includes(key)) {
        const timeA = a[key] ? new Date(a[key]).getTime() : 0;
        const timeB = b[key] ? new Date(b[key]).getTime() : 0;
        return (timeA - timeB) * factor;
      }

      // 2. Campos numéricos y de montos
      if ([
        'Id_Producto', 'Id_Venta', 'Id_Factura', 'Id_Movimiento_Inventario',
        'Unidades_Vendidas', 'Monto_Total_Vendido', 'Subtotal', 'Impuesto',
        'Monto_Total', 'Saldo_Pendiente', 'Dias_Mora', 'Cantidad'
      ].includes(key)) {
        const valA = Number(a[key]) || 0;
        const valB = Number(b[key]) || 0;
        return (valA - valB) * factor;
      }

      // 3. Caso especial Precio Promedio
      if (key === 'Precio_Promedio') {
        const uA = Number(a.Unidades_Vendidas || 0);
        const pA = a.Precio_Promedio != null ? Number(a.Precio_Promedio) : (uA > 0 ? Number(a.Monto_Total_Vendido || 0) / uA : 0);
        const uB = Number(b.Unidades_Vendidas || 0);
        const pB = b.Precio_Promedio != null ? Number(b.Precio_Promedio) : (uB > 0 ? Number(b.Monto_Total_Vendido || 0) / uB : 0);
        return (pA - pB) * factor;
      }

      // 4. Campos alfanuméricos / texto
      const strA = String(a[key] || '');
      const strB = String(b[key] || '');
      return strA.localeCompare(strB, 'es-CR') * factor;
    });

    return items;
  }, [datosReporteFiltrados, sortConfig]);

  // Exportar datos activos formateados a CSV/Excel
  const exportarCSV = () => {
    if (!datosReporteOrdenados.length) {
      showToast('No hay datos visibles para exportar', 'warning');
      return;
    }

    let headers = [];
    let rows = [];
    const nomArchivo = `Reporte_${reporteActivo}_${new Date().toISOString().slice(0, 10)}.csv`;

    if (reporteActivo === 'PRODUCTOS_MAS_VENDIDOS') {
      headers = ['Código', 'Producto', 'Categoría', 'Unidades Vendidas', 'Precio Promedio', 'Monto Total Facturado'];
      rows = datosReporteOrdenados.map((p) => {
        const u = Number(p.Unidades_Vendidas || 0);
        const m = Number(p.Monto_Total_Vendido || 0);
        const prom = p.Precio_Promedio != null ? Number(p.Precio_Promedio) : (u > 0 ? m / u : 0);
        return [p.Id_Producto, `"${(p.Nombre_Producto || '').replace(/"/g, '""')}"`, `"${p.Categoria || ''}"`, u, prom.toFixed(2), m.toFixed(2)];
      });
    } else if (reporteActivo === 'VENTAS_PERIODO') {
      headers = ['Venta #', 'Fecha', 'Cliente', 'Vendedor', 'Condición Pago', 'Subtotal', 'Impuesto IVA 13%', 'Monto Total'];
      rows = datosReporteOrdenados.map((v) => [
        v.Id_Venta,
        new Date(v.Fecha).toLocaleDateString('es-CR'),
        `"${(v.Nombre_Cliente || '').replace(/"/g, '""')}"`,
        `"${(v.Vendedor || '').replace(/"/g, '""')}"`,
        `"${v.Condicion_Pago || ''}"`,
        Number(v.Subtotal || 0).toFixed(2),
        Number(v.Impuesto || 0).toFixed(2),
        Number(v.Monto_Total || 0).toFixed(2),
      ]);
    } else if (reporteActivo === 'FACTURAS_PENDIENTES') {
      headers = ['Factura #', 'Cliente', 'Emisión', 'Vencimiento', 'Monto Total', 'Saldo Pendiente'];
      rows = datosReporteOrdenados.map((f) => [
        `FAC-${f.Id_Factura}`,
        `"${(f.Nombre_Cliente || '').replace(/"/g, '""')}"`,
        new Date(f.Fecha_Emision).toLocaleDateString('es-CR'),
        new Date(f.Fecha_Vencimiento).toLocaleDateString('es-CR'),
        Number(f.Monto_Total || 0).toFixed(2),
        Number(f.Saldo_Pendiente || 0).toFixed(2),
      ]);
    } else if (reporteActivo === 'CUENTAS_VENCIDAS') {
      headers = ['Factura #', 'Cliente', 'Días de Mora', 'Saldo en Mora'];
      rows = datosReporteOrdenados.map((c) => [
        `FAC-${c.Id_Factura}`,
        `"${(c.Nombre_Cliente || '').replace(/"/g, '""')}"`,
        c.Dias_Mora,
        Number(c.Saldo_Pendiente || 0).toFixed(2),
      ]);
    } else if (reporteActivo === 'MOVIMIENTOS_KARDEX') {
      headers = ['Movimiento #', 'Fecha', 'Producto', 'Tipo Movimiento', 'Cantidad', 'Motivo'];
      rows = datosReporteOrdenados.map((m) => [
        m.Id_Movimiento_Inventario,
        new Date(m.Fecha).toLocaleDateString('es-CR'),
        `"${(m.Producto || '').replace(/"/g, '""')}"`,
        `"${m.Tipo_Movimiento || ''}"`,
        m.Cantidad,
        `"${(m.Motivo || '').replace(/"/g, '""')}"`,
      ]);
    }

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', nomArchivo);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Reporte exportado a Excel/CSV exitosamente', 'success');
  };

  // Función auxiliar para renderizar encabezados ordenables interactivos
  const renderSortTh = (key, label, align = 'left', title = '') => {
    const isActive = sortConfig.key === key;
    const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
    const justifyClass = align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start';

    return (
      <th
        onClick={() => handleSort(key)}
        className={`py-3.5 px-4 cursor-pointer hover:bg-[#E8DFC8] transition select-none ${alignClass}`}
        title={title || `Clic para ordenar por ${label}`}
      >
        <div className={`flex items-center gap-1.5 ${justifyClass}`}>
          <span>{label}</span>
          {isActive ? (
            sortConfig.direction === 'asc' ? (
              <ArrowUp className="w-3.5 h-3.5 text-[#C05A3E] shrink-0" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5 text-[#C05A3E] shrink-0" />
            )
          ) : (
            <ArrowUpDown className="w-3.5 h-3.5 text-[#5C3622]/40 shrink-0 opacity-60" />
          )}
        </div>
      </th>
    );
  };

  useEffect(() => {
    cargarReporte();
  }, [reporteActivo]);

  const cargarReporte = async () => {
    setLoading(true);
    setDatosReporte([]);
    try {
      let endpoint = '';
      if (reporteActivo === 'PRODUCTOS_MAS_VENDIDOS') {
        endpoint = `/reportes/productos-mas-vendidos?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
      } else if (reporteActivo === 'VENTAS_PERIODO') {
        endpoint = `/reportes/ventas-periodo?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
      } else if (reporteActivo === 'CUENTAS_VENCIDAS') {
        endpoint = '/reportes/cuentas-vencidas';
      } else if (reporteActivo === 'FACTURAS_PENDIENTES') {
        endpoint = '/reportes/facturas-pendientes';
      } else if (reporteActivo === 'MOVIMIENTOS_KARDEX') {
        endpoint = `/reportes/movimientos-inventario?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
      }

      if (endpoint) {
        const res = await api.get(endpoint);
        setDatosReporte(res.data || []);
      }
    } catch (err) {
      console.error('Error cargando reporte:', err);
      showToast('Error al generar el reporte', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Totales dinámicos
  const totales = useMemo(() => {
    if (!datosReporte.length) return null;

    if (reporteActivo === 'PRODUCTOS_MAS_VENDIDOS') {
      const unidades = datosReporte.reduce((a, b) => a + Number(b.Unidades_Vendidas || 0), 0);
      const monto = datosReporte.reduce((a, b) => a + Number(b.Monto_Total_Vendido || 0), 0);
      return { label1: 'Total Unidades:', val1: unidades, label2: 'Total Vendido:', val2: `₡${monto.toLocaleString('es-CR')}` };
    }

    if (reporteActivo === 'VENTAS_PERIODO') {
      const subtotal = datosReporte.reduce((a, b) => a + Number(b.Subtotal || 0), 0);
      const iva = datosReporte.reduce((a, b) => a + Number(b.Impuesto || 0), 0);
      const total = datosReporte.reduce((a, b) => a + Number(b.Monto_Total || 0), 0);
      return {
        label1: `Subtotal: ₡${subtotal.toLocaleString('es-CR')} | IVA 13%: ₡${iva.toLocaleString('es-CR')}`,
        label2: 'Monto Total:',
        val2: `₡${total.toLocaleString('es-CR')}`,
      };
    }

    return null;
  }, [datosReporteOrdenados, reporteActivo]);

  return (
    <div className="space-y-6 text-[#132B20]">
      {/* Header Reportes - Terracota, Madera y Marfil */}
      <div className="bg-white rounded-3xl border border-[#DFD5C4] p-6 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#C05A3E] to-[#5C3622] flex items-center justify-center text-[#FAF7F0] shadow-terracotta">
              <FileSpreadsheet className="w-5 h-5 text-[#FAF7F0]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#132B20] tracking-tight flex items-center gap-2">
                Centro de Reportes Analíticos
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#F3ECE0] text-[#5C3622] border border-[#DFD5C4]">
                  Reportes Oficiales
                </span>
              </h2>
              <p className="text-xs text-[#5C3622]/80 mt-0.5">
                Librería & Papelería Mundo Escolar &bull; Liberia, Guanacaste &bull; Informes de Ventas, Kárdex y Cuentas por Cobrar
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
            <span>Imprimir Reporte</span>
          </button>

          <button
            onClick={cargarReporte}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#C05A3E] to-[#D97448] hover:from-[#AA4C33] hover:to-[#C05A3E] text-[#FAF7F0] text-xs font-black rounded-xl shadow-terracotta transition disabled:opacity-50 active:scale-95 border border-[#FAF7F0]/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Consultar</span>
          </button>
        </div>
      </div>

      {/* Selector de Reportes (Píldoras en Verde Bosque, Terracota y Marfil) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 no-print">
        {[
          { id: 'PRODUCTOS_MAS_VENDIDOS', label: 'Top Productos', icon: Award, desc: 'Ranking de unidades' },
          { id: 'VENTAS_PERIODO', label: 'Ventas por Período', icon: TrendingUp, desc: 'Consolidado con IVA' },
          { id: 'FACTURAS_PENDIENTES', label: 'Facturas Pendientes', icon: Clock, desc: 'Saldos de crédito' },
          { id: 'CUENTAS_VENCIDAS', label: 'Cuentas Vencidas', icon: AlertTriangle, desc: 'Cobro y morosidad' },
          { id: 'MOVIMIENTOS_KARDEX', label: 'Auditoría Kárdex', icon: Boxes, desc: 'Movimientos de stock' },
        ].map((rep) => {
          const activo = reporteActivo === rep.id;
          return (
            <button
              key={rep.id}
              onClick={() => cambiarReporte(rep.id)}
              className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                activo
                  ? 'bg-gradient-to-br from-[#132B20] to-[#1A3D2F] border-[#C05A3E] text-[#FAF7F0] shadow-md font-semibold'
                  : 'bg-white border-[#DFD5C4] text-[#132B20] hover:border-[#C05A3E] hover:bg-[#FAF7F0] shadow-xs'
              }`}
            >
              <rep.icon className={`w-4 h-4 mb-2.5 ${activo ? 'text-[#C05A3E]' : 'text-[#5C3622]/70'}`} />
              <div>
                <span className={`font-bold text-xs block leading-tight ${activo ? 'text-[#FAF7F0]' : 'text-[#132B20]'}`}>
                  {rep.label}
                </span>
                <span className={`text-[10px] block mt-1 ${activo ? 'text-[#DFD5C4]/90' : 'text-[#5C3622]/70'}`}>
                  {rep.desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Barra de Filtros Temporales */}
      {['PRODUCTOS_MAS_VENDIDOS', 'VENTAS_PERIODO', 'MOVIMIENTOS_KARDEX'].includes(reporteActivo) && (
        <div className="bg-white rounded-2xl border border-[#DFD5C4] p-4 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs no-print">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#F3ECE0] border border-[#DFD5C4] flex items-center justify-center">
              <Calendar className="w-4 h-4 text-[#C05A3E]" />
            </div>
            <span className="font-bold text-[#132B20]">Rango de Fechas del Análisis:</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[#5C3622] font-semibold">Desde:</span>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="px-3 py-1.5 bg-[#FAF7F0] border border-[#DFD5C4] rounded-lg text-xs font-semibold text-[#132B20] focus:outline-none focus:ring-1 focus:ring-[#C05A3E]"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[#5C3622] font-semibold">Hasta:</span>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="px-3 py-1.5 bg-[#FAF7F0] border border-[#DFD5C4] rounded-lg text-xs font-semibold text-[#132B20] focus:outline-none focus:ring-1 focus:ring-[#C05A3E]"
              />
            </div>

            <button
              onClick={cargarReporte}
              disabled={loading}
              className="px-4 py-1.5 bg-[#132B20] hover:bg-[#1A3D2F] text-[#FAF7F0] font-bold rounded-lg text-xs transition shadow-xs"
            >
              Aplicar Filtro
            </button>
          </div>
        </div>
      )}

      {/* Encabezado Oficial Exclusivo para Impresión */}
      <div className="hidden print:block mb-4 pb-2 border-b-2 border-[#132B20]">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-xl font-black text-[#132B20]">LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR</h1>
            <p className="text-xs text-[#5C3622]">
              Reporte Oficial: {
                reporteActivo === 'PRODUCTOS_MAS_VENDIDOS' ? 'Top Productos Más Vendidos' :
                reporteActivo === 'VENTAS_PERIODO' ? 'Ventas por Período Consolidado' :
                reporteActivo === 'FACTURAS_PENDIENTES' ? 'Facturas con Saldo Pendiente de Cobro' :
                reporteActivo === 'CUENTAS_VENCIDAS' ? 'Cuentas por Cobrar Vencidas y Morosidad' :
                'Auditoría y Movimientos de Kárdex'
              } • Liberia, Guanacaste
            </p>
          </div>
          <div className="text-right text-xs text-[#5C3622]">
            <p><span className="font-bold">Fecha de Emisión:</span> {new Date().toLocaleString('es-CR')}</p>
            {['PRODUCTOS_MAS_VENDIDOS', 'VENTAS_PERIODO', 'MOVIMIENTOS_KARDEX'].includes(reporteActivo) && (
              <p><span className="font-bold">Período:</span> {fechaInicio} al {fechaFin}</p>
            )}
            <p><span className="font-bold">Registros:</span> {datosReporte.length}</p>
          </div>
        </div>
      </div>

      {/* Contenedor de la Tabla de Reporte */}
      <div className="bg-white rounded-3xl border border-[#DFD5C4] overflow-hidden shadow-subtle print:border-none print:shadow-none print:rounded-none">
        {/* Barra de Búsqueda Rápida y Acciones de Tabla */}
        <div className="p-3.5 sm:p-4 border-b border-[#DFD5C4] bg-[#FAF7F0]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
          {/* Input de Búsqueda Reactivo */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5C3622]/60" />
            <input
              type="text"
              value={busquedaTexto}
              onChange={(e) => setBusquedaTexto(e.target.value)}
              placeholder="Búsqueda instantánea (código, nombre, cliente, motivo)..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-[#DFD5C4] rounded-xl text-[#132B20] placeholder-[#5C3622]/50 focus:outline-none focus:ring-2 focus:ring-[#C05A3E]/30 focus:border-[#C05A3E] transition shadow-xs"
            />
            {busquedaTexto && (
              <button
                onClick={() => setBusquedaTexto('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#C05A3E] p-0.5"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Contador y Exportar CSV */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[#5C3622] px-2.5 py-1.5 bg-white border border-[#DFD5C4] rounded-xl shadow-xs">
              Mostrando <strong className="text-[#132B20]">{datosReporteOrdenados.length}</strong> de {datosReporte.length}
            </span>

            <button
              onClick={exportarCSV}
              disabled={datosReporteOrdenados.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#132B20] bg-white border border-[#DFD5C4] hover:bg-[#F3ECE0] hover:border-[#C05A3E] rounded-xl transition shadow-xs disabled:opacity-50 active:scale-95"
              title="Descargar este reporte formateado para Microsoft Excel"
            >
              <Download className="w-3.5 h-3.5 text-[#2D5E46]" />
              <span>Exportar Excel</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3.5 animate-pulse">
            <div className="h-10 bg-[#E8DFC8]/50 rounded-xl w-full" />
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4 py-3 border-b border-[#DFD5C4]/30">
                <div className="h-4 bg-[#E8DFC8]/60 rounded w-16" />
                <div className="h-4 bg-[#E8DFC8]/60 rounded flex-1" />
                <div className="h-4 bg-[#E8DFC8]/60 rounded w-20" />
                <div className="h-4 bg-[#E8DFC8]/60 rounded w-24" />
                <div className="h-4 bg-[#E8DFC8]/60 rounded w-28" />
              </div>
            ))}
          </div>
        ) : datosReporteOrdenados.length === 0 ? (
          <div className="p-12 text-center text-[#5C3622]/80 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#F3ECE0] flex items-center justify-center text-[#C05A3E] border border-[#DFD5C4]">
              <Search className="w-6 h-6" />
            </div>
            <p className="font-bold text-sm text-[#132B20]">No se encontraron registros</p>
            <p className="text-xs text-[#5C3622]/70">
              {busquedaTexto
                ? `No hay resultados que coincidan con "${busquedaTexto}".`
                : 'No se encontraron registros en el rango de fechas seleccionado.'}
            </p>
            {busquedaTexto && (
              <button
                onClick={() => setBusquedaTexto('')}
                className="px-3.5 py-1.5 text-xs font-bold text-[#C05A3E] bg-[#FAF7F0] border border-[#C05A3E]/30 rounded-xl hover:bg-[#F3ECE0] transition"
              >
                Limpiar filtro de búsqueda
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto print:overflow-visible">
              {/* REPORTE 1: TOP PRODUCTOS */}
              {reporteActivo === 'PRODUCTOS_MAS_VENDIDOS' && (
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F3ECE0]/80 text-[#5C3622] uppercase tracking-wider font-bold border-b border-[#DFD5C4] select-none">
                    <tr>
                      {renderSortTh('Id_Producto', '# Código', 'left')}
                      {renderSortTh('Nombre_Producto', 'Nombre del Producto', 'left')}
                      {renderSortTh('Unidades_Vendidas', 'Unidades Vendidas', 'center')}
                      {renderSortTh('Precio_Promedio', 'Precio Promedio', 'center')}
                      {renderSortTh('Monto_Total_Vendido', 'Monto Total Facturado', 'right')}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DFD5C4]/50 font-medium text-[#132B20]">
                    {datosReporteOrdenados.map((p, idx) => {
                      const unidades = Number(p.Unidades_Vendidas) || 0;
                      const montoTotal = Number(p.Monto_Total_Vendido) || 0;
                      const precioPromedio = p.Precio_Promedio != null
                        ? Number(p.Precio_Promedio)
                        : (p.Precio_Unitario != null
                          ? Number(p.Precio_Unitario)
                          : (unidades > 0 ? montoTotal / unidades : 0));

                      return (
                        <tr key={idx} className="hover:bg-[#FAF7F0] transition print:break-inside-avoid">
                          <td className="py-3.5 px-4 font-mono font-bold text-[#C05A3E]">#{p.Id_Producto}</td>
                          <td className="py-3.5 px-4 font-bold text-[#132B20]">{p.Nombre_Producto}</td>
                          <td className="py-3.5 px-4 text-center font-bold text-[#2D5E46]">{unidades}</td>
                          <td className="py-3.5 px-4 text-center font-semibold text-[#5C3622]">
                            ₡{precioPromedio.toLocaleString('es-CR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-[#132B20]">
                            ₡{montoTotal.toLocaleString('es-CR')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {/* REPORTE 2: VENTAS POR PERÍODO */}
              {reporteActivo === 'VENTAS_PERIODO' && (
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F3ECE0]/80 text-[#5C3622] uppercase tracking-wider font-bold border-b border-[#DFD5C4] select-none">
                    <tr>
                      {renderSortTh('Id_Venta', '# Venta', 'left')}
                      {renderSortTh('Fecha', 'Fecha', 'left')}
                      {renderSortTh('Nombre_Cliente', 'Cliente', 'left')}
                      {renderSortTh('Vendedor', 'Vendedor', 'left')}
                      {renderSortTh('Condicion_Pago', 'Condición', 'center')}
                      {renderSortTh('Subtotal', 'Subtotal', 'right')}
                      {renderSortTh('Impuesto', 'IVA (13%)', 'right')}
                      {renderSortTh('Monto_Total', 'Monto Total', 'right')}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DFD5C4]/50 font-medium text-[#132B20]">
                    {datosReporteOrdenados.map((v, idx) => (
                      <tr key={idx} className="hover:bg-[#FAF7F0] transition print:break-inside-avoid">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#C05A3E]">#{v.Id_Venta}</td>
                        <td className="py-3.5 px-4 text-[#5C3622]">
                          {new Date(v.Fecha).toLocaleDateString('es-CR')}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#132B20]">{v.Nombre_Cliente}</td>
                        <td className="py-3.5 px-4 text-[#5C3622]/80">{v.Vendedor}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="bg-[#F3ECE0] text-[#5C3622] border border-[#DFD5C4] px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            {v.Condicion_Pago}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">₡{Number(v.Subtotal).toLocaleString('es-CR')}</td>
                        <td className="py-3.5 px-4 text-right text-[#5C3622]">₡{Number(v.Impuesto).toLocaleString('es-CR')}</td>
                        <td className="py-3.5 px-4 text-right font-black text-[#132B20]">
                          ₡{Number(v.Monto_Total).toLocaleString('es-CR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* REPORTE 3: FACTURAS PENDIENTES */}
              {reporteActivo === 'FACTURAS_PENDIENTES' && (
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F3ECE0]/80 text-[#5C3622] uppercase tracking-wider font-bold border-b border-[#DFD5C4] select-none">
                    <tr>
                      {renderSortTh('Id_Factura', '# Factura', 'left')}
                      {renderSortTh('Nombre_Cliente', 'Cliente', 'left')}
                      {renderSortTh('Fecha_Emision', 'Emisión', 'left')}
                      {renderSortTh('Fecha_Vencimiento', 'Vencimiento', 'left')}
                      {renderSortTh('Monto_Total', 'Total Factura', 'right')}
                      {renderSortTh('Saldo_Pendiente', 'Saldo Pendiente', 'right')}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DFD5C4]/50 font-medium text-[#132B20]">
                    {datosReporteOrdenados.map((f, idx) => (
                      <tr key={idx} className="hover:bg-[#FAF7F0] transition print:break-inside-avoid">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#C05A3E]">FAC-#{f.Id_Factura}</td>
                        <td className="py-3.5 px-4 font-bold text-[#132B20]">{f.Nombre_Cliente}</td>
                        <td className="py-3.5 px-4 text-[#5C3622]">{new Date(f.Fecha_Emision).toLocaleDateString('es-CR')}</td>
                        <td className="py-3.5 px-4 font-semibold text-[#C05A3E]">{new Date(f.Fecha_Vencimiento).toLocaleDateString('es-CR')}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-[#132B20]">₡{Number(f.Monto_Total).toLocaleString('es-CR')}</td>
                        <td className="py-3.5 px-4 text-right font-black text-[#C05A3E]">
                          ₡{Number(f.Saldo_Pendiente).toLocaleString('es-CR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* REPORTE 4: CUENTAS VENCIDAS */}
              {reporteActivo === 'CUENTAS_VENCIDAS' && (
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F3ECE0]/80 text-[#5C3622] uppercase tracking-wider font-bold border-b border-[#DFD5C4] select-none">
                    <tr>
                      {renderSortTh('Id_Factura', '# Factura', 'left')}
                      {renderSortTh('Nombre_Cliente', 'Cliente', 'left')}
                      {renderSortTh('Dias_Mora', 'Días de Mora', 'center')}
                      {renderSortTh('Saldo_Pendiente', 'Saldo en Mora', 'right')}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DFD5C4]/50 font-medium text-[#132B20]">
                    {datosReporteOrdenados.map((c, idx) => (
                      <tr key={idx} className="hover:bg-[#FAF7F0] transition print:break-inside-avoid">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#C05A3E]">FAC-#{c.Id_Factura}</td>
                        <td className="py-3.5 px-4 font-bold text-[#132B20]">{c.Nombre_Cliente}</td>
                        <td className="py-3.5 px-4 text-center font-black text-[#C05A3E]">{c.Dias_Mora} días</td>
                        <td className="py-3.5 px-4 text-right font-black text-[#C05A3E]">
                          ₡{Number(c.Saldo_Pendiente).toLocaleString('es-CR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* REPORTE 5: MOVIMIENTOS KÁRDEX */}
              {reporteActivo === 'MOVIMIENTOS_KARDEX' && (
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F3ECE0]/80 text-[#5C3622] uppercase tracking-wider font-bold border-b border-[#DFD5C4] select-none">
                    <tr>
                      {renderSortTh('Id_Movimiento_Inventario', '# Movimiento', 'left')}
                      {renderSortTh('Fecha', 'Fecha', 'left')}
                      {renderSortTh('Producto', 'Producto', 'left')}
                      {renderSortTh('Tipo_Movimiento', 'Tipo Movimiento', 'center')}
                      {renderSortTh('Cantidad', 'Cantidad', 'right')}
                      {renderSortTh('Motivo', 'Motivo', 'left')}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DFD5C4]/50 font-medium text-[#132B20]">
                    {datosReporteOrdenados.map((m, idx) => (
                      <tr key={idx} className="hover:bg-[#FAF7F0] transition print:break-inside-avoid">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#5C3622]">#{m.Id_Movimiento_Inventario}</td>
                        <td className="py-3.5 px-4 text-[#5C3622]">{new Date(m.Fecha).toLocaleDateString('es-CR')}</td>
                        <td className="py-3.5 px-4 font-bold text-[#132B20]">{m.Producto}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="bg-[#F3ECE0] text-[#5C3622] border border-[#DFD5C4] px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                            {m.Tipo_Movimiento}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-[#132B20]">{m.Cantidad}</td>
                        <td className="py-3.5 px-4 text-[#5C3622]">{m.Motivo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Totales al pie de tabla */}
            {totales && (
              <div className="bg-[#132B20] text-[#FAF7F0] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-t border-[#2D5E46]/40">
                <span className="text-[#DFD5C4] font-semibold">{totales.label1} {totales.val1}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[#DFD5C4]">{totales.label2}</span>
                  <span className="text-[#FAF7F0] bg-[#C05A3E] px-3.5 py-1 rounded-xl font-black text-sm shadow-xs border border-[#FAF7F0]/20">
                    {totales.val2}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
