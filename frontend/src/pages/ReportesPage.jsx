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

  // Filtros de fecha
  const [fechaInicio, setFechaInicio] = useState('2026-01-01');
  const [fechaFin, setFechaFin] = useState('2026-12-31');

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
  }, [datosReporte, reporteActivo]);

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

        <div className="flex items-center gap-2.5">
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
              onClick={() => setReporteActivo(rep.id)}
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
        <div className="bg-white rounded-2xl border border-[#DFD5C4] p-4 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
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

      {/* Contenedor de la Tabla de Reporte */}
      <div className="bg-white rounded-3xl border border-[#DFD5C4] overflow-hidden shadow-subtle">
        {loading ? (
          <div className="p-12 text-center text-[#5C3622] space-y-3">
            <div className="w-8 h-8 border-3 border-[#DFD5C4] border-t-[#C05A3E] rounded-full animate-spin mx-auto" />
            <p className="font-bold text-xs">Generando reporte comercial...</p>
          </div>
        ) : datosReporte.length === 0 ? (
          <div className="p-12 text-center text-[#5C3622]/70 space-y-2">
            <p className="font-bold text-sm">No se encontraron registros para el criterio seleccionado</p>
            <p className="text-xs">Pruebe ajustando el rango de fechas o seleccionando otro reporte.</p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              {/* REPORTE 1: TOP PRODUCTOS */}
              {reporteActivo === 'PRODUCTOS_MAS_VENDIDOS' && (
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F3ECE0]/80 text-[#5C3622] uppercase tracking-wider font-bold border-b border-[#DFD5C4]">
                    <tr>
                      <th className="py-3.5 px-4"># Código</th>
                      <th className="py-3.5 px-4">Nombre del Producto</th>
                      <th className="py-3.5 px-4 text-center">Unidades Vendidas</th>
                      <th className="py-3.5 px-4 text-right">Precio Promedio</th>
                      <th className="py-3.5 px-4 text-right">Monto Total Facturado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DFD5C4]/50 font-medium text-[#132B20]">
                    {datosReporte.map((p, idx) => (
                      <tr key={idx} className="hover:bg-[#FAF7F0] transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#C05A3E]">#{p.Id_Producto}</td>
                        <td className="py-3.5 px-4 font-bold text-[#132B20]">{p.Nombre_Producto}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-[#2D5E46]">{p.Unidades_Vendidas}</td>
                        <td className="py-3.5 px-4 text-right text-[#5C3622]">₡{Number(p.Precio_Unitario).toLocaleString('es-CR')}</td>
                        <td className="py-3.5 px-4 text-right font-black text-[#132B20]">
                          ₡{Number(p.Monto_Total_Vendido).toLocaleString('es-CR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* REPORTE 2: VENTAS POR PERÍODO */}
              {reporteActivo === 'VENTAS_PERIODO' && (
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F3ECE0]/80 text-[#5C3622] uppercase tracking-wider font-bold border-b border-[#DFD5C4]">
                    <tr>
                      <th className="py-3.5 px-4"># Venta</th>
                      <th className="py-3.5 px-4">Fecha</th>
                      <th className="py-3.5 px-4">Cliente</th>
                      <th className="py-3.5 px-4">Vendedor</th>
                      <th className="py-3.5 px-4">Condición</th>
                      <th className="py-3.5 px-4 text-right">Subtotal</th>
                      <th className="py-3.5 px-4 text-right">IVA (13%)</th>
                      <th className="py-3.5 px-4 text-right">Monto Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DFD5C4]/50 font-medium text-[#132B20]">
                    {datosReporte.map((v, idx) => (
                      <tr key={idx} className="hover:bg-[#FAF7F0] transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#C05A3E]">#{v.Id_Venta}</td>
                        <td className="py-3.5 px-4 text-[#5C3622]">
                          {new Date(v.Fecha).toLocaleDateString('es-CR')}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#132B20]">{v.Nombre_Cliente}</td>
                        <td className="py-3.5 px-4 text-[#5C3622]/80">{v.Vendedor}</td>
                        <td className="py-3.5 px-4">
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
                  <thead className="bg-[#F3ECE0]/80 text-[#5C3622] uppercase tracking-wider font-bold border-b border-[#DFD5C4]">
                    <tr>
                      <th className="py-3.5 px-4"># Factura</th>
                      <th className="py-3.5 px-4">Cliente</th>
                      <th className="py-3.5 px-4">Emisión</th>
                      <th className="py-3.5 px-4">Vencimiento</th>
                      <th className="py-3.5 px-4 text-right">Total Factura</th>
                      <th className="py-3.5 px-4 text-right">Saldo Pendiente</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DFD5C4]/50 font-medium text-[#132B20]">
                    {datosReporte.map((f, idx) => (
                      <tr key={idx} className="hover:bg-[#FAF7F0] transition">
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
                  <thead className="bg-[#F3ECE0]/80 text-[#5C3622] uppercase tracking-wider font-bold border-b border-[#DFD5C4]">
                    <tr>
                      <th className="py-3.5 px-4"># Factura</th>
                      <th className="py-3.5 px-4">Cliente</th>
                      <th className="py-3.5 px-4">Días de Mora</th>
                      <th className="py-3.5 px-4 text-right">Saldo en Mora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DFD5C4]/50 font-medium text-[#132B20]">
                    {datosReporte.map((c, idx) => (
                      <tr key={idx} className="hover:bg-[#FAF7F0] transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#C05A3E]">FAC-#{c.Id_Factura}</td>
                        <td className="py-3.5 px-4 font-bold text-[#132B20]">{c.Nombre_Cliente}</td>
                        <td className="py-3.5 px-4 font-black text-[#C05A3E]">{c.Dias_Mora} días</td>
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
                  <thead className="bg-[#F3ECE0]/80 text-[#5C3622] uppercase tracking-wider font-bold border-b border-[#DFD5C4]">
                    <tr>
                      <th className="py-3.5 px-4"># Movimiento</th>
                      <th className="py-3.5 px-4">Fecha</th>
                      <th className="py-3.5 px-4">Producto</th>
                      <th className="py-3.5 px-4">Tipo Movimiento</th>
                      <th className="py-3.5 px-4 text-right">Cantidad</th>
                      <th className="py-3.5 px-4">Motivo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DFD5C4]/50 font-medium text-[#132B20]">
                    {datosReporte.map((m, idx) => (
                      <tr key={idx} className="hover:bg-[#FAF7F0] transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#5C3622]">#{m.Id_Movimiento_Inventario}</td>
                        <td className="py-3.5 px-4 text-[#5C3622]">{new Date(m.Fecha).toLocaleDateString('es-CR')}</td>
                        <td className="py-3.5 px-4 font-bold text-[#132B20]">{m.Producto}</td>
                        <td className="py-3.5 px-4">
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
