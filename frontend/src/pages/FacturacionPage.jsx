import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Receipt,
  Search,
  Filter,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  Printer,
  RefreshCw,
  Eye,
  RotateCcw,
  PlusCircle,
  FileText,
  CreditCard,
  Building,
  User,
  ArrowRight,
  X,
  Calendar,
  AlertTriangle,
  ChevronRight,
  Smartphone,
  Copy,
  Check,
} from 'lucide-react';
import QrFiscal from '../components/QrFiscal';
import { generarClaveHacienda50, formatearClaveHacienda, generarQrFiscalUrl } from '../utils/haciendaUtils';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function FacturacionPage({ onNavigateToPos }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [facturas, setFacturas] = useState([]);
  const [metodosPago, setMetodosPago] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODAS'); // 'TODAS' | 'PAGADAS' | 'PENDIENTES' | 'ANULADAS'
  const [filtroTipoCliente, setFiltroTipoCliente] = useState('TODOS');

  // Modales
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);

  useEffect(() => {
    if (modalDetalleAbierto) {
      document.body.classList.add('imprimiendo-modal');
      return () => document.body.classList.remove('imprimiendo-modal');
    }
  }, [modalDetalleAbierto]);
  const [detalleVenta, setDetalleVenta] = useState(null);
  const [pagosFactura, setPagosFactura] = useState([]);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  // Modal de Abono / Pago
  const [modalPagoAbierto, setModalPagoAbierto] = useState(false);
  const [facturaAPagar, setFacturaAPagar] = useState(null);
  const [montoAbono, setMontoAbono] = useState('');
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState(1);
  const [referenciaAbono, setReferenciaAbono] = useState('');
  const [procesandoPago, setProcesandoPago] = useState(false);

  // Modal de Anulación de Pago Individual (SP_Pago_Anular)
  const [pagoAAnular, setPagoAAnular] = useState(null);
  const [motivoAnulacionPago, setMotivoAnulacionPago] = useState('');
  const [procesandoAnulacionPago, setProcesandoAnulacionPago] = useState(false);

  // Modal de Anulación de Factura
  const [modalAnulacionAbierto, setModalAnulacionAbierto] = useState(false);
  const [facturaAAnular, setFacturaAAnular] = useState(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [procesandoAnulacion, setProcesandoAnulacion] = useState(false);

  useEffect(() => {
    cargarFacturas();
    cargarMetodosPago();
  }, []);

  const cargarFacturas = async () => {
    setLoading(true);
    try {
      const res = await api.get('/facturas/vista');
      setFacturas(res.data || []);
    } catch (err) {
      console.error('Error al cargar facturas:', err);
      showToast('Error al consultar facturación', 'error');
    } finally {
      setLoading(false);
    }
  };

  const cargarMetodosPago = async () => {
    try {
      const res = await api.get('/catalogos/metodos-pago');
      setMetodosPago(res.data || []);
    } catch (err) {
      console.error('Error cargando métodos de pago:', err);
    }
  };

  // KPIs de facturación
  const metricas = useMemo(() => {
    const noAnuladas = facturas.filter((f) => f.Estado_Factura !== 'Anulada');
    const totalFacturado = noAnuladas.reduce((acc, f) => acc + Number(f.Monto_Total), 0);
    const totalRecaudado = noAnuladas.reduce((acc, f) => acc + Number(f.Total_Pagado || 0), 0);
    const saldoPendiente = noAnuladas.reduce((acc, f) => acc + Number(f.Saldo_Pendiente || 0), 0);
    const cantidadAnuladas = facturas.filter((f) => f.Estado_Factura === 'Anulada').length;

    return {
      totalFacturado,
      totalRecaudado,
      saldoPendiente,
      cantidadTotal: facturas.length,
      cantidadAnuladas,
    };
  }, [facturas]);

  // Filtrado de la tabla
  const facturasFiltradas = useMemo(() => {
    const term = busqueda.toLowerCase().trim();

    return facturas.filter((f) => {
      // Filtro por Estado
      if (filtroEstado === 'PAGADAS' && f.Estado_Factura !== 'Pagada') return false;
      if (filtroEstado === 'PENDIENTES' && (f.Saldo_Pendiente <= 0 || f.Estado_Factura === 'Anulada')) return false;
      if (filtroEstado === 'ANULADAS' && f.Estado_Factura !== 'Anulada') return false;

      // Filtro por Tipo de Cliente
      if (filtroTipoCliente !== 'TODOS' && f.Tipo_Cliente !== filtroTipoCliente) return false;

      // Filtro por texto
      if (!term) return true;
      const numFac = `fac-${f.Id_Factura.toString().padStart(8, '0')}`.toLowerCase();
      const cli = (f.Nombre_Cliente || '').toLowerCase();
      const vend = (f.Vendedor || '').toLowerCase();
      const idFac = f.Id_Factura.toString();
      const idVenta = f.Id_Venta ? f.Id_Venta.toString() : '';

      return (
        numFac.includes(term) ||
        cli.includes(term) ||
        vend.includes(term) ||
        idFac.includes(term) ||
        idVenta.includes(term)
      );
    });
  }, [facturas, busqueda, filtroEstado, filtroTipoCliente]);

  // Abrir Detalle de Factura
  const abrirDetalle = async (factura) => {
    setFacturaSeleccionada(factura);
    setModalDetalleAbierto(true);
    setCargandoDetalle(true);
    try {
      const [resVenta, resPagos] = await Promise.all([
        api.get(`/ventas/${factura.Id_Venta}`),
        api.get(`/pagos/factura/${factura.Id_Factura}`),
      ]);
      setDetalleVenta(resVenta.data);
      setPagosFactura(resPagos.data || []);
    } catch (err) {
      console.error('Error cargando detalle de venta:', err);
      showToast('Error al cargar el detalle de la factura', 'error');
    } finally {
      setCargandoDetalle(false);
    }
  };

  // Abrir Modal de Abono
  const abrirAbono = (factura) => {
    setFacturaAPagar(factura);
    setMontoAbono(factura.Saldo_Pendiente.toString());
    setReferenciaAbono('');
    setMetodoPagoSeleccionado(1);
    setModalPagoAbierto(true);
  };

  // Procesar Abono en SQL Server
  const procesarAbono = async () => {
    const monto = parseFloat(montoAbono);
    if (!monto || monto <= 0) {
      showToast('Ingrese un monto válido para el abono', 'warning');
      return;
    }
    if (monto > facturaAPagar.Saldo_Pendiente) {
      showToast(`El monto no puede superar el saldo pendiente de ₡${facturaAPagar.Saldo_Pendiente.toLocaleString('es-CR')}`, 'warning');
      return;
    }

    setProcesandoPago(true);
    try {
      await api.post('/pagos', {
        idFactura: facturaAPagar.Id_Factura,
        idMetodoPago: metodoPagoSeleccionado,
        montoPagado: monto,
        numeroReferencia: referenciaAbono || (metodoPagoSeleccionado === 1 ? 'EFECTIVO-CAJA' : 'REF-ABONO'),
      });

      showToast(`Abono de ₡${monto.toLocaleString('es-CR')} registrado correctamente`, 'success');
      setModalPagoAbierto(false);
      cargarFacturas();
    } catch (err) {
      console.error('Error registrando abono:', err);
      const msg = err.response?.data?.mensaje || 'Error en procedimiento SP_Pago_Registrar';
      showToast(msg, 'error');
    } finally {
      setProcesandoPago(false);
    }
  };

  // Abrir Modal de Anulación
  const abrirAnulacion = (factura) => {
    setFacturaAAnular(factura);
    setMotivoAnulacion('');
    setModalAnulacionAbierto(true);
  };

  // Procesar Anulación y Devolución a Bodega en SQL Server
  const procesarAnulacion = async () => {
    if (!motivoAnulacion.trim()) {
      showToast('Debe ingresar el motivo de la devolución/anulación', 'warning');
      return;
    }

    setProcesandoAnulacion(true);
    try {
      // Llama a SP_Venta_Anular que reingresa el inventario con motivo Devolución y anula la factura
      await api.post(`/ventas/${facturaAAnular.Id_Venta}/anular`, {
        motivo: motivoAnulacion.trim(),
      });

      showToast(`Factura #${facturaAAnular.Id_Factura} anulada e inventario restituido a bodega`, 'success');
      setModalAnulacionAbierto(false);
      cargarFacturas();
    } catch (err) {
      console.error('Error anulando venta:', err);
      const msg = err.response?.data?.mensaje || 'Error en SP_Venta_Anular';
      showToast(msg, 'error');
    } finally {
      setProcesandoAnulacion(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Facturación */}
      <div className="bg-white rounded-2xl border border-[#DFD5C4] p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#C05A3E] to-[#5C3622] flex items-center justify-center text-white shadow-glow-blue">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#132B20] tracking-tight flex items-center gap-2">
                Facturación Fiscal & Control de Cobros
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#F3ECE0] text-blue-700 border border-blue-200">
                  VW_Facturas • Tributación DGT
                </span>
              </h2>
              <p className="text-xs text-[#5C3622]">
                Librería & Papelería Mundo Escolar • Cuentas por Cobrar, Abonos y Devoluciones
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={cargarFacturas}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>

          <button
            onClick={onNavigateToPos}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nueva Venta en POS</span>
          </button>
        </div>
      </div>

      {/* Tarjetas KPI de Facturación */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#DFD5C4] p-4 shadow-sm">
          <span className="text-xs text-[#5C3622] font-medium block">Total Facturado</span>
          <span className="text-2xl font-black text-[#132B20] mt-1 block">
            ₡{metricas.totalFacturado.toLocaleString('es-CR')}
          </span>
          <span className="text-[11px] text-[#C05A3E] font-semibold mt-1 block">
            {metricas.cantidadTotal} facturas emitidas
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#DFD5C4] p-4 shadow-sm">
          <span className="text-xs text-[#5C3622] font-medium block">Total Recaudado (Cobrado)</span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">
            ₡{metricas.totalRecaudado.toLocaleString('es-CR')}
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            Abonos y pagos de contado
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#DFD5C4] p-4 shadow-sm">
          <span className="text-xs text-[#5C3622] font-medium block">Cartera Pendiente de Cobro</span>
          <span className="text-2xl font-black text-amber-600 mt-1 block">
            ₡{metricas.saldoPendiente.toLocaleString('es-CR')}
          </span>
          <span className="text-[11px] text-amber-700 font-semibold mt-1 block">
            Crédito a clientes e instituciones
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#DFD5C4] p-4 shadow-sm">
          <span className="text-xs text-[#5C3622] font-medium block">Facturas Anuladas</span>
          <span className="text-2xl font-black text-rose-600 mt-1 block">
            {metricas.cantidadAnuladas}
          </span>
          <span className="text-[11px] text-[#5C3622] font-medium mt-1 block">
            Devoluciones reintegradas a kárdex
          </span>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white rounded-2xl border border-[#DFD5C4] p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Input de Búsqueda */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por # factura, cliente, vendedor..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>

        {/* Filtros de Estado */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            {['TODAS', 'PAGADAS', 'PENDIENTES', 'ANULADAS'].map((est) => (
              <button
                key={est}
                onClick={() => setFiltroEstado(est)}
                className={`px-3 py-1.5 rounded-lg transition capitalize ${
                  filtroEstado === est ? 'bg-white text-[#C05A3E] shadow-sm' : 'hover:text-[#132B20]'
                }`}
              >
                {est.toLowerCase()}
              </button>
            ))}
          </div>

          {/* Filtro Tipo Cliente */}
          <select
            value={filtroTipoCliente}
            onChange={(e) => setFiltroTipoCliente(e.target.value)}
            className="text-xs bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl px-3 py-2 text-[#132B20] focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="TODOS">Todos los Clientes</option>
            <option value="Particular">Particulares</option>
            <option value="Institucional">Institucionales</option>
          </select>
        </div>
      </div>

      {/* Tabla de Facturas */}
      <div className="bg-white rounded-2xl border border-[#DFD5C4] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-[#C05A3E] animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600">Cargando registros de facturas y cobros...</p>
          </div>
        ) : facturasFiltradas.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#132B20]">No se encontraron facturas fiscales</p>
            <p className="text-xs text-slate-400 mt-1">Pruebe ajustando los filtros de búsqueda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F0] text-[#5C3622] uppercase tracking-wider font-bold border-b border-[#DFD5C4]">
                <tr>
                  <th className="py-3 px-4">Factura #</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Vendedor</th>
                  <th className="py-3 px-4">Condición</th>
                  <th className="py-3 px-4 text-right">Total Facturado</th>
                  <th className="py-3 px-4 text-right">Saldo Pendiente</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-[#132B20]">
                {facturasFiltradas.map((fac) => {
                  const tieneSaldo = Number(fac.Saldo_Pendiente) > 0;
                  const esAnulada = fac.Estado_Factura === 'Anulada';

                  return (
                    <tr key={fac.Id_Factura} className="hover:bg-[#FAF7F0]/80 transition-colors">
                      <td className="py-3 px-4">
                        <button
                          onClick={() => abrirDetalle(fac)}
                          className="font-mono font-bold text-[#C05A3E] hover:text-[#AA4C33] hover:underline"
                        >
                          FAC-{fac.Id_Factura.toString().padStart(8, '0')}
                        </button>
                        <span className="block text-[10px] text-slate-400 font-mono">
                          Venta #{fac.Id_Venta}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        {new Date(fac.Fecha_Emision).toLocaleDateString('es-CR')}
                        <span className="block text-[10px] text-slate-400">
                          {new Date(fac.Fecha_Emision).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-[#132B20]">{fac.Nombre_Cliente}</span>
                          <span
                            className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                              fac.Tipo_Cliente === 'Institucional'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {fac.Tipo_Cliente}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600">{fac.Vendedor}</td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[#132B20] text-[11px] font-semibold">
                          {fac.Condicion_Pago}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-[#132B20]">
                        ₡{Number(fac.Monto_Total).toLocaleString('es-CR')}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-bold ${
                            tieneSaldo && !esAnulada ? 'text-amber-600 font-black' : 'text-slate-400'
                          }`}
                        >
                          ₡{Number(fac.Saldo_Pendiente).toLocaleString('es-CR')}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            fac.Estado_Factura === 'Pagada'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : fac.Estado_Factura === 'Parcial'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : fac.Estado_Factura === 'Anulada'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {fac.Estado_Factura === 'Pagada' && <CheckCircle2 className="w-3 h-3" />}
                          {fac.Estado_Factura === 'Parcial' && <Clock className="w-3 h-3" />}
                          {fac.Estado_Factura === 'Anulada' && <AlertTriangle className="w-3 h-3" />}
                          {fac.Estado_Factura}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Ver Detalle */}
                          <button
                            onClick={() => abrirDetalle(fac)}
                            className="p-1.5 text-[#5C3622] hover:text-[#C05A3E] hover:bg-[#F3ECE0] rounded-lg transition"
                            title="Ver Factura Fiscal & Pagos"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Abonar si tiene saldo */}
                          {tieneSaldo && !esAnulada && (
                            <button
                              onClick={() => abrirAbono(fac)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition"
                              title="Registrar Abono o Pago"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                          )}

                          {/* Anular Venta */}
                          {!esAnulada && (
                            <button
                              onClick={() => abrirAnulacion(fac)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Anular Venta y Restituir Stock"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DETALLE DE FACTURA FISCAL & HISTORIAL DE PAGOS */}
      {modalDetalleAbierto && facturaSeleccionada && createPortal(
        <div className="modal-impresion-activa fixed inset-0 z-50 flex items-center justify-center bg-[#132B20]/60 backdrop-blur-sm p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setModalDetalleAbierto(false); }}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-[#DFD5C4] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="bg-[#132B20] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-blue-400" />
                  Factura Fiscal FAC-{facturaSeleccionada.Id_Factura.toString().padStart(8, '0')}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Emitida el {new Date(facturaSeleccionada.Fecha_Emision).toLocaleString('es-CR')} • Vendedor: {facturaSeleccionada.Vendedor}
                </p>
              </div>
              <button
                onClick={() => setModalDetalleAbierto(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition no-print"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido Desplazable */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {cargandoDetalle ? (
                <div className="py-12 text-center">
                  <RefreshCw className="w-6 h-6 text-[#C05A3E] animate-spin mx-auto mb-2" />
                  <p className="text-[#5C3622]">Consultando líneas de venta y kárdex...</p>
                </div>
              ) : (
                <>
                  {/* Ficha Cliente & Condición */}
                  <div className="bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl p-4 grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-400 block font-medium">Cliente:</span>
                      <span className="font-bold text-[#132B20] text-sm">{facturaSeleccionada.Nombre_Cliente}</span>
                      <span className="text-[11px] text-[#5C3622] block">
                        Tipo: {facturaSeleccionada.Tipo_Cliente}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-medium">Condición de Pago:</span>
                      <span className="font-bold text-[#132B20] text-sm">{facturaSeleccionada.Condicion_Pago}</span>
                      <span className="text-[11px] text-[#5C3622] block">
                        Estado Fiscal: {facturaSeleccionada.Estado_Factura}
                      </span>
                    </div>
                  </div>

                  {/* Clave Oficial DGT Hacienda Costa Rica (50 Dígitos) & QR Fiscal */}
                  <div className="bg-white border border-[#DFD5C4] rounded-xl p-3.5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Comprobante Electrónico DGT Costa Rica (Res. DGT-R-033-2019)
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">Tipo Doc: 01 (Factura)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold text-slate-700">CLAVE NUMÉRICA TRIBUTARIA (50 DÍGITOS):</p>
                        <button
                          type="button"
                          onClick={() => {
                            const c = generarClaveHacienda50({
                              idFactura: facturaSeleccionada.Id_Factura,
                              fecha: facturaSeleccionada.Fecha_Emision,
                              tipoComprobante: '01',
                            });
                            copiarClaveFactura(c);
                          }}
                          className="inline-flex items-center gap-1 text-[9.5px] font-bold text-[#C05A3E] hover:text-[#AA4C33] bg-[#FAF7F0] border border-[#DFD5C4] px-2 py-0.5 rounded-lg transition shadow-xs cursor-pointer active:scale-95 no-print"
                          title="Copiar clave numérica completa de 50 dígitos"
                        >
                          {claveCopiadaFactura ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{claveCopiadaFactura ? '¡Copiada!' : 'Copiar clave'}</span>
                        </button>
                      </div>
                      <p className="font-mono text-[10px] text-slate-900 bg-slate-50 p-2 rounded-lg border border-slate-200 select-all font-semibold break-all">
                        {formatearClaveHacienda(
                          generarClaveHacienda50({
                            idFactura: facturaSeleccionada.Id_Factura,
                            fecha: facturaSeleccionada.Fecha_Emision,
                            tipoComprobante: '01',
                          })
                        )}
                      </p>
                    </div>
                    <QrFiscal
                      value={generarQrFiscalUrl(
                        generarClaveHacienda50({
                          idFactura: facturaSeleccionada.Id_Factura,
                          fecha: facturaSeleccionada.Fecha_Emision,
                          tipoComprobante: '01',
                        })
                      )}
                      size={85}
                    />
                  </div>

                  {/* Tabla de Líneas de Productos y Servicios */}
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">
                      Artículos y Servicios Facturados
                    </h4>
                    <div className="border border-[#DFD5C4] rounded-xl overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-[#FAF7F0] text-[#5C3622] font-bold border-b border-[#DFD5C4]">
                          <tr>
                            <th className="py-2 px-3">Tipo</th>
                            <th className="py-2 px-3">Descripción</th>
                            <th className="py-2 px-3 text-center">Cant.</th>
                            <th className="py-2 px-3 text-right">Precio Unitario</th>
                            <th className="py-2 px-3 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {detalleVenta?.productos?.map((p) => (
                            <tr key={`p-${p.Id_Venta_Producto}`}>
                              <td className="py-2 px-3">
                                <span className="bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded text-[10px]">
                                  Producto
                                </span>
                              </td>
                              <td className="py-2 px-3 font-semibold text-slate-800">{p.Producto}</td>
                              <td className="py-2 px-3 text-center">{p.Cantidad}</td>
                              <td className="py-2 px-3 text-right">₡{Number(p.Precio_Unitario).toLocaleString('es-CR')}</td>
                              <td className="py-2 px-3 text-right font-bold">₡{Number(p.Subtotal).toLocaleString('es-CR')}</td>
                            </tr>
                          ))}

                          {detalleVenta?.servicios?.map((s) => (
                            <tr key={`s-${s.Id_Venta_Servicio}`}>
                              <td className="py-2 px-3">
                                <span className="bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded text-[10px]">
                                  Servicio
                                </span>
                              </td>
                              <td className="py-2 px-3 font-semibold text-slate-800">{s.Servicio}</td>
                              <td className="py-2 px-3 text-center">{s.Cantidad}</td>
                              <td className="py-2 px-3 text-right">₡{Number(s.Precio_Unitario).toLocaleString('es-CR')}</td>
                              <td className="py-2 px-3 text-right font-bold">₡{Number(s.Subtotal).toLocaleString('es-CR')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Resumen Totales */}
                  <div className="bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl p-4 space-y-1.5 text-right">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span className="font-medium">₡{Number(detalleVenta?.Subtotal || 0).toLocaleString('es-CR')}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>IVA (13% Costa Rica - FN_CalcularImpuesto):</span>
                      <span className="font-medium">₡{Number(detalleVenta?.Impuesto || 0).toLocaleString('es-CR')}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-[#132B20] pt-1 border-t border-[#DFD5C4]">
                      <span>MONTO TOTAL:</span>
                      <span className="text-emerald-700 text-base">
                        ₡{Number(facturaSeleccionada.Monto_Total).toLocaleString('es-CR')}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-amber-700 font-bold pt-1">
                      <span>Saldo Pendiente:</span>
                      <span>₡{Number(facturaSeleccionada.Saldo_Pendiente).toLocaleString('es-CR')}</span>
                    </div>
                  </div>

                  {/* Historial de Pagos / Abonos Registrados */}
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">
                      Historial de Pagos y Abonos
                    </h4>
                    {pagosFactura.length === 0 ? (
                      <p className="text-slate-400 italic">No se han registrado pagos para esta factura.</p>
                    ) : (
                      <div className="border border-[#DFD5C4] rounded-xl overflow-hidden">
                        <table className="w-full text-left">
                          <thead className="bg-[#FAF7F0] text-[#5C3622] font-bold border-b border-[#DFD5C4]">
                            <tr>
                              <th className="py-2 px-3">Fecha</th>
                              <th className="py-2 px-3">Método de Pago</th>
                              <th className="py-2 px-3">Referencia</th>
                              <th className="py-2 px-3">Estado</th>
                              <th className="py-2 px-3 text-right">Monto Pagado</th>
                              <th className="py-2 px-3 text-center">Acción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {pagosFactura.map((pago) => {
                              const esActivo = pago.Estado === true || pago.Estado === 1;
                              return (
                                <tr key={pago.Id_Pago} className={!esActivo ? 'opacity-60 bg-slate-50' : ''}>
                                  <td className="py-2 px-3">
                                    {new Date(pago.Fecha_Pago).toLocaleDateString('es-CR')}
                                  </td>
                                  <td className="py-2 px-3 font-semibold text-slate-800">{pago.Metodo_Pago}</td>
                                  <td className="py-2 px-3 font-mono text-[11px] text-[#5C3622]">
                                    {pago.Numero_Referencia || 'N/A'}
                                  </td>
                                  <td className="py-2 px-3">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        esActivo
                                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                                      }`}
                                    >
                                      {esActivo ? 'Activo' : 'Anulado'}
                                    </span>
                                  </td>
                                  <td className={`py-2 px-3 text-right font-bold ${esActivo ? 'text-emerald-700' : 'text-slate-400 line-through'}`}>
                                    ₡{Number(pago.Monto_Pagado).toLocaleString('es-CR')}
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    {esActivo && (
                                      <button
                                        onClick={() => abrirAnularPago(pago)}
                                        title="Anular abono (SP_Pago_Anular)"
                                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition no-print"
                                      >
                                        <RotateCcw className="w-3 h-3" />
                                        <span>Anular</span>
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-4 bg-[#FAF7F0] border-t border-[#DFD5C4] flex items-center justify-between no-print">
              <button
                type="button"
                onClick={() => {
                  const clave = generarClaveHacienda50({
                    idFactura: facturaSeleccionada.Id_Factura,
                    fecha: facturaSeleccionada.Fecha_Emision,
                    tipoComprobante: '01',
                  });
                  const msj = encodeURIComponent(
                    `*LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR*\n` +
                    `📄 Factura Electrónica: FAC-${facturaSeleccionada.Id_Factura.toString().padStart(8, '0')}\n` +
                    `🔑 Clave Hacienda (50 dígitos): ${clave}\n` +
                    `👤 Cliente: ${facturaSeleccionada.Nombre_Cliente}\n` +
                    `💰 Total: ₡${Number(facturaSeleccionada.Total).toLocaleString('es-CR')}\n` +
                    `Consulta oficial ATV: https://atv.hacienda.go.cr/ATV/Login.aspx?clave=${clave}`
                  );
                  window.open(`https://wa.me/?text=${msj}`, '_blank');
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#25D366] hover:bg-[#20ba5a] rounded-xl shadow-sm transition active:scale-95"
                title="Enviar comprobante electrónico al WhatsApp del cliente"
              >
                <Smartphone className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#132B20] bg-white border border-[#DFD5C4] rounded-xl hover:bg-slate-100 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Factura Fiscal</span>
              </button>

              <button
                onClick={() => setModalDetalleAbierto(false)}
                className="px-4 py-2 bg-[#132B20] text-white text-xs font-bold rounded-xl hover:bg-[#1A3D2F] transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL PARA REGISTRAR ABONO / PAGO */}
      {modalPagoAbierto && facturaAPagar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132B20]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#DFD5C4] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#132B20] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  Registrar Abono a Factura
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  FAC-{facturaAPagar.Id_Factura.toString().padStart(8, '0')} • {facturaAPagar.Nombre_Cliente}
                </p>
              </div>
              <button
                onClick={() => setModalPagoAbierto(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Resumen Saldo */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Saldo Pendiente</span>
                <span className="text-2xl font-black text-amber-900 block mt-0.5">
                  ₡{Number(facturaAPagar.Saldo_Pendiente).toLocaleString('es-CR')}
                </span>
              </div>

              {/* Monto a Abonar */}
              <div>
                <label className="block text-xs font-bold text-[#132B20] mb-1">Monto a Abonar (CRC)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">₡</span>
                  <input
                    type="number"
                    value={montoAbono}
                    onChange={(e) => setMontoAbono(e.target.value)}
                    max={facturaAPagar.Saldo_Pendiente}
                    className="w-full pl-8 pr-3 py-2 text-base font-bold bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Selector de Método */}
              <div>
                <label className="block text-xs font-bold text-[#132B20] mb-1">Método de Pago</label>
                <select
                  value={metodoPagoSeleccionado}
                  onChange={(e) => setMetodoPagoSeleccionado(parseInt(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {metodosPago.map((m) => (
                    <option key={m.Id_Metodo_Pago} value={m.Id_Metodo_Pago}>
                      {m.Nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Referencia */}
              <div>
                <label className="block text-xs font-bold text-[#132B20] mb-1">Número de Referencia / Comprobante</label>
                <input
                  type="text"
                  value={referenciaAbono}
                  onChange={(e) => setReferenciaAbono(e.target.value)}
                  placeholder="Ej. Recibo #4499 / SINPE #09928"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="p-4 bg-[#FAF7F0] border-t border-[#DFD5C4] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalPagoAbierto(false)}
                disabled={procesandoPago}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={procesarAbono}
                disabled={procesandoPago}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50"
              >
                {procesandoPago ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Aplicando Abono...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar Abono</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA ANULAR FACTURA Y DEVOLUCIÓN DE INVENTARIO */}
      {modalAnulacionAbierto && facturaAAnular && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132B20]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#DFD5C4] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-rose-600 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-white" />
                  Anular Factura & Devolución de Stock
                </h3>
                <p className="text-xs text-rose-100 mt-0.5">
                  FAC-{facturaAAnular.Id_Factura.toString().padStart(8, '0')} • Venta #{facturaAAnular.Id_Venta}
                </p>
              </div>
              <button
                onClick={() => setModalAnulacionAbierto(false)}
                className="p-1 text-rose-200 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800">
                <p className="font-bold flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  Operación Transaccional Irreversible:
                </p>
                <p>
                  Al confirmar la anulación, las existencias se reingresarán a bodega con motivo 'Devolución' en el Kárdex y la factura quedará anulada.
                </p>
              </div>

              {Number(facturaAAnular.Total_Pagado) > 0 && (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 text-xs text-amber-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-amber-800">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                    Restricción Contable (Doc. Cap. 17.3, Pág. 381):
                  </p>
                  <p>
                    Esta factura registra un total de <strong>₡{Number(facturaAAnular.Total_Pagado).toLocaleString('es-CR')}</strong> en pagos activos. De acuerdo con la normativa contable, debe anular primero individualmente sus pagos en el Historial de Abonos antes de poder anular la factura.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#132B20] mb-1">
                  Motivo de la Anulación / Devolución *
                </label>
                <textarea
                  value={motivoAnulacion}
                  onChange={(e) => setMotivoAnulacion(e.target.value)}
                  placeholder="Ej. Devolución por solicitud del cliente, producto con empaque dañado, etc."
                  rows={3}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="p-4 bg-[#FAF7F0] border-t border-[#DFD5C4] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalAnulacionAbierto(false)}
                disabled={procesandoAnulacion}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={procesarAnulacion}
                disabled={procesandoAnulacion || !motivoAnulacion.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50"
              >
                {procesandoAnulacion ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Anulando factura...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Ejecutar Anulación</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA ANULAR PAGO INDIVIDUAL (SP_Pago_Anular) */}
      {pagoAAnular && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#132B20]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#DFD5C4] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-rose-600 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-white" />
                  Anular Abono / Pago #{pagoAAnular.Id_Pago}
                </h3>
                <p className="text-xs text-rose-100 mt-0.5">
                  Monto: ₡{Number(pagoAAnular.Monto_Pagado).toLocaleString('es-CR')} • {pagoAAnular.Metodo_Pago}
                </p>
              </div>
              <button
                onClick={() => setPagoAAnular(null)}
                className="p-1 text-rose-200 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800">
                <p className="font-bold flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  Reversión Contable (SP_Pago_Anular):
                </p>
                <p>
                  El pago quedará marcado como anulado y el importe se restituirá al saldo pendiente de la factura. Conforme a la normativa, el motivo es obligatorio y quedará auditado en la Bitácora.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#132B20] mb-1">
                  Motivo de Anulación del Abono *
                </label>
                <textarea
                  value={motivoAnulacionPago}
                  onChange={(e) => setMotivoAnulacionPago(e.target.value)}
                  placeholder="Ej. Error en el monto registrado, duplicidad reportada por el cliente, etc."
                  rows={3}
                  className="w-full text-xs p-3 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>
            </div>

            <div className="p-4 bg-[#FAF7F0] border-t border-[#DFD5C4] flex items-center justify-end gap-2">
              <button
                onClick={() => setPagoAAnular(null)}
                disabled={procesandoAnulacionPago}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                onClick={procesarAnulacionPago}
                disabled={procesandoAnulacionPago}
                className="flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
              >
                {procesandoAnulacionPago ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                <span>Confirmar Anulación de Pago</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
