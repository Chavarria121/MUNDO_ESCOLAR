import React, { useState, useEffect, useMemo } from 'react';
import {
  Truck,
  Search,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  Eye,
  Building,
  User,
  Package,
  Calendar,
  X,
  Printer,
  DollarSign,
  Trash2,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ComprasPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [compras, setCompras] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODAS'); // 'TODAS' | 'PENDIENTES' | 'RECIBIDAS' | 'ANULADAS'

  // Modales
  const [modalNuevaCompraAbierto, setModalNuevaCompraAbierto] = useState(false);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  const [compraSeleccionada, setCompraSeleccionada] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const [modalAnulacionAbierto, setModalAnulacionAbierto] = useState(false);
  const [compraAAnular, setCompraAAnular] = useState(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');

  const [modalProveedoresAbierto, setModalProveedoresAbierto] = useState(false);

  // Formulario Nueva Orden de Compra
  const [proveedorSeleccionadoId, setProveedorSeleccionadoId] = useState(1);
  const [lineasCompra, setLineasCompra] = useState([]);
  const [prodActualId, setProdActualId] = useState(1);
  const [cantidadActual, setCantidadActual] = useState(10);
  const [costoActual, setCostoActual] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resCompras, resProvs, resProds] = await Promise.all([
        api.get('/compras'),
        api.get('/proveedores/activos'),
        api.get('/productos/inventario'),
      ]);

      setCompras(resCompras.data || []);
      setProveedores(resProvs.data || []);
      setProductos(resProds.data || []);

      if (resProvs.data?.length > 0) {
        setProveedorSeleccionadoId(resProvs.data[0].Id_Proveedor);
      }
      if (resProds.data?.length > 0) {
        setProdActualId(resProds.data[0].Id_Producto);
        // Costo sugerido (aprox 70% de precio venta si no hay pactado)
        setCostoActual(Math.round(resProds.data[0].Precio_Venta * 0.7).toString());
      }
    } catch (err) {
      console.error('Error cargando compras:', err);
      showToast('Error al consultar compras', 'error');
    } finally {
      setLoading(false);
    }
  };

  // KPIs
  const metricas = useMemo(() => {
    const noAnuladas = compras.filter((c) => c.Estado_Compra !== 'Anulada');
    const totalInversion = noAnuladas.reduce((acc, c) => acc + Number(c.Monto_Total || 0), 0);
    const pendientes = compras.filter((c) => c.Estado_Compra === 'Pendiente').length;
    const recibidas = compras.filter((c) => c.Estado_Compra === 'Recibida').length;

    return {
      totalInversion,
      pendientes,
      recibidas,
      totalProveedores: proveedores.length,
      totalCompras: compras.length,
    };
  }, [compras, proveedores]);

  // Filtrado de la tabla
  const comprasFiltradas = useMemo(() => {
    const term = busqueda.toLowerCase().trim();

    return compras.filter((c) => {
      if (filtroEstado === 'PENDIENTES' && c.Estado_Compra !== 'Pendiente') return false;
      if (filtroEstado === 'RECIBIDAS' && c.Estado_Compra !== 'Recibida') return false;
      if (filtroEstado === 'ANULADAS' && c.Estado_Compra !== 'Anulada') return false;

      if (!term) return true;
      const numOc = `oc-${c.Id_Compra.toString().padStart(8, '0')}`.toLowerCase();
      const prov = (c.Proveedor || '').toLowerCase();
      const resp = (c.Responsable || '').toLowerCase();
      const id = c.Id_Compra.toString();

      return numOc.includes(term) || prov.includes(term) || resp.includes(term) || id.includes(term);
    });
  }, [compras, busqueda, filtroEstado]);

  // Agregar línea a nueva orden
  const agregarLinea = () => {
    const cant = parseInt(cantidadActual);
    const costo = parseFloat(costoActual);
    if (!cant || cant <= 0 || !costo || costo <= 0) {
      showToast('Ingrese una cantidad y costo unitario válidos', 'warning');
      return;
    }

    const prod = productos.find((p) => p.Id_Producto === parseInt(prodActualId));
    if (!prod) return;

    setLineasCompra((prev) => {
      const idx = prev.findIndex((l) => l.idProducto === prod.Id_Producto);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          cantidad: updated[idx].cantidad + cant,
          costoUnitario: costo,
        };
        return updated;
      }
      return [
        ...prev,
        {
          idProducto: prod.Id_Producto,
          nombre: prod.Nombre,
          cantidad: cant,
          costoUnitario: costo,
        },
      ];
    });

    setCantidadActual(10);
  };

  const eliminarLinea = (index) => {
    setLineasCompra((prev) => prev.filter((_, i) => i !== index));
  };

  const totalNuevaOrden = useMemo(() => {
    return lineasCompra.reduce((acc, curr) => acc + curr.cantidad * curr.costoUnitario, 0);
  }, [lineasCompra]);

  // Crear Orden de Compra completa en SQL Server
  const guardarNuevaOrden = async () => {
    if (lineasCompra.length === 0) {
      showToast('Agregue al menos un producto a la orden de compra', 'warning');
      return;
    }

    setGuardando(true);
    try {
      // 1. Crear cabecera (SP_Compra_Crear)
      const resCrear = await api.post('/compras', {
        idProveedor: Number(proveedorSeleccionadoId),
      });

      const idCompra = resCrear.data.idCompra || resCrear.data.Id_Compra;
      if (!idCompra) throw new Error('No se obtuvo el identificador de la orden de compra');

      // 2. Agregar líneas (SP_Compra_AgregarProducto)
      for (const linea of lineasCompra) {
        await api.post(`/compras/${idCompra}/productos`, {
          idProducto: linea.idProducto,
          cantidad: linea.cantidad,
          costoUnitario: linea.costoUnitario,
        });
      }

      showToast(`Orden de compra #${idCompra} generada con éxito`, 'success');
      setModalNuevaCompraAbierto(false);
      setLineasCompra([]);
      cargarDatos();
    } catch (err) {
      console.error('Error creando orden de compra:', err);
      const msg = err.response?.data?.mensaje || 'Error en procedimiento de compra';
      showToast(msg, 'error');
    } finally {
      setGuardando(false);
    }
  };

  // Ver Detalle de Orden
  const verDetalle = async (compra) => {
    setModalDetalleAbierto(true);
    setCargandoDetalle(true);
    try {
      const res = await api.get(`/compras/${compra.Id_Compra}`);
      setCompraSeleccionada(res.data);
    } catch (err) {
      console.error('Error cargando detalle de compra:', err);
      showToast('Error consultando líneas de compra', 'error');
    } finally {
      setCargandoDetalle(false);
    }
  };

  // Confirmar y Recepcionar Mercancía (Ingresa existencias al stock de bodega)
  const recepcionarCompra = async (compra) => {
    if (!window.confirm(`¿Desea confirmar la recepción de la Orden #${compra.Id_Compra}? Esto incrementará el stock en bodega y registrará los ingresos en Kárdex.`)) {
      return;
    }

    setGuardando(true);
    try {
      await api.post(`/compras/${compra.Id_Compra}/confirmar`);
      showToast(`¡Orden #${compra.Id_Compra} recepcionada y existencias ingresadas a bodega con éxito!`, 'success');
      cargarDatos();
    } catch (err) {
      console.error('Error recepcionando compra:', err);
      const msg = err.response?.data?.mensaje || 'Error en SP_Compra_Confirmar';
      showToast(msg, 'error');
    } finally {
      setGuardando(false);
    }
  };

  // Anular Orden de Compra
  const abrirAnulacion = (compra) => {
    setCompraAAnular(compra);
    setMotivoAnulacion('');
    setModalAnulacionAbierto(true);
  };

  const procesarAnulacion = async () => {
    if (!motivoAnulacion.trim()) {
      showToast('Ingrese el motivo de la anulación', 'warning');
      return;
    }

    setGuardando(true);
    try {
      await api.post(`/compras/${compraAAnular.Id_Compra}/anular`, {
        motivo: motivoAnulacion.trim(),
      });
      showToast(`Orden #${compraAAnular.Id_Compra} anulada con éxito`, 'success');
      setModalAnulacionAbierto(false);
      cargarDatos();
    } catch (err) {
      console.error('Error anulando compra:', err);
      const msg = err.response?.data?.mensaje || 'Error en SP_Compra_Anular';
      showToast(msg, 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Compras */}
      <div className="bg-white rounded-2xl border border-[#DFD5C4] p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-600 flex items-center justify-center text-white shadow-glow-emerald">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#132B20] tracking-tight flex items-center gap-2">
                Gestión de Compras a Proveedores
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                  Recepción de Mercadería • Ingreso a Bodega
                </span>
              </h2>
              <p className="text-xs text-[#5C3622]">
                Librería & Papelería Mundo Escolar • Abastecimiento de Bodega, Órdenes de Compra y Proveedores
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={cargarDatos}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refrescar</span>
          </button>

          <button
            onClick={() => setModalProveedoresAbierto(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#132B20] bg-white border border-[#DFD5C4] hover:bg-[#FAF7F0] rounded-xl transition shadow-sm"
          >
            <Building className="w-4 h-4 text-[#C05A3E]" />
            <span>Ver Directorio Proveedores</span>
          </button>

          <button
            onClick={() => {
              setLineasCompra([]);
              setModalNuevaCompraAbierto(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Orden de Compra</span>
          </button>
        </div>
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#DFD5C4] p-4 shadow-sm">
          <span className="text-xs text-[#5C3622] font-medium block">Inversión Total en Compras</span>
          <span className="text-2xl font-black text-[#132B20] mt-1 block">
            ₡{metricas.totalInversion.toLocaleString('es-CR')}
          </span>
          <span className="text-[11px] text-teal-600 font-semibold mt-1 block">
            {metricas.totalCompras} órdenes tramitadas
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#DFD5C4] p-4 shadow-sm">
          <span className="text-xs text-[#5C3622] font-medium block">Órdenes Pendientes de Ingreso</span>
          <span className="text-2xl font-black text-amber-600 mt-1 block">
            {metricas.pendientes}
          </span>
          <span className="text-[11px] text-amber-700 font-semibold mt-1 block">
            En tránsito o pendientes de recepción
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#DFD5C4] p-4 shadow-sm">
          <span className="text-xs text-[#5C3622] font-medium block">Órdenes Recibidas (En Stock)</span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">
            {metricas.recibidas}
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            Mercancía verificada en bodega
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#DFD5C4] p-4 shadow-sm">
          <span className="text-xs text-[#5C3622] font-medium block">Proveedores Homologados</span>
          <span className="text-2xl font-black text-[#C05A3E] mt-1 block">
            {metricas.totalProveedores}
          </span>
          <span className="text-[11px] text-[#5C3622] font-medium mt-1 block">
            Catálogo activo
          </span>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-[#DFD5C4] p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por orden OC, proveedor o responsable..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
          {['TODAS', 'PENDIENTES', 'RECIBIDAS', 'ANULADAS'].map((est) => (
            <button
              key={est}
              onClick={() => setFiltroEstado(est)}
              className={`px-3 py-1.5 rounded-lg transition capitalize ${
                filtroEstado === est ? 'bg-white text-teal-600 shadow-sm' : 'hover:text-[#132B20]'
              }`}
            >
              {est.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Compras */}
      <div className="bg-white rounded-2xl border border-[#DFD5C4] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600">Cargando órdenes de compra...</p>
          </div>
        ) : comprasFiltradas.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#132B20]">No se encontraron órdenes de compra</p>
            <p className="text-xs text-slate-400 mt-1">Intente cambiando los filtros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F0] text-[#5C3622] uppercase tracking-wider font-bold border-b border-[#DFD5C4]">
                <tr>
                  <th className="py-3 px-4">Orden #</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Proveedor</th>
                  <th className="py-3 px-4">Responsable</th>
                  <th className="py-3 px-4 text-center">Artículos</th>
                  <th className="py-3 px-4 text-right">Monto Total</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-[#132B20]">
                {comprasFiltradas.map((compra) => {
                  const esPendiente = compra.Estado_Compra === 'Pendiente';
                  const esRecibida = compra.Estado_Compra === 'Recibida';
                  const esAnulada = compra.Estado_Compra === 'Anulada';

                  return (
                    <tr key={compra.Id_Compra} className="hover:bg-[#FAF7F0]/80 transition-colors">
                      <td className="py-3 px-4">
                        <button
                          onClick={() => verDetalle(compra)}
                          className="font-mono font-bold text-teal-600 hover:text-teal-800 hover:underline"
                        >
                          OC-{compra.Id_Compra.toString().padStart(8, '0')}
                        </button>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        {new Date(compra.Fecha_Compra).toLocaleDateString('es-CR')}
                        <span className="block text-[10px] text-slate-400">
                          {new Date(compra.Fecha_Compra).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#132B20]">{compra.Proveedor}</span>
                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {compra.Tipo_Proveedor}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600">{compra.Responsable}</td>

                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-[#132B20]">
                          {compra.Total_Articulos || 0}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-black text-[#132B20]">
                        ₡{Number(compra.Monto_Total || 0).toLocaleString('es-CR')}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            esRecibida
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : esPendiente
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {esRecibida && <CheckCircle2 className="w-3 h-3" />}
                          {esPendiente && <Clock className="w-3 h-3" />}
                          {esAnulada && <AlertTriangle className="w-3 h-3" />}
                          {compra.Estado_Compra}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => verDetalle(compra)}
                            className="p-1.5 text-[#5C3622] hover:text-teal-600 hover:bg-teal-50 rounded-lg transition"
                            title="Ver Detalle de Compra"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {esPendiente && (
                            <button
                              onClick={() => recepcionarCompra(compra)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition"
                              title="Confirmar Recepción e Ingresar a Bodega"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}

                          {!esAnulada && (
                            <button
                              onClick={() => abrirAnulacion(compra)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Anular Orden de Compra"
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

      {/* ================= MODAL NUEVA ORDEN DE COMPRA ================= */}
      {modalNuevaCompraAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132B20]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-[#DFD5C4] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#132B20] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Truck className="w-5 h-5 text-teal-400" />
                  Nueva Orden de Compra a Proveedor
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Generación de orden en estado Pendiente • Se confirmará al recepcionar
                </p>
              </div>
              <button
                onClick={() => setModalNuevaCompraAbierto(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              {/* Selector Proveedor */}
              <div className="bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl p-4">
                <label className="block font-bold text-[#132B20] mb-1">Proveedor Homologado *</label>
                <select
                  value={proveedorSeleccionadoId}
                  onChange={(e) => setProveedorSeleccionadoId(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {proveedores.map((p) => (
                    <option key={p.Id_Proveedor} value={p.Id_Proveedor}>
                      {p.Nombre_O_RazonSocial} ({p.Numero_Identificacion} - {p.Tipo_Proveedor})
                    </option>
                  ))}
                </select>
              </div>

              {/* Formulario Agregar Producto */}
              <div className="bg-teal-50/50 border border-teal-200 rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-teal-900 uppercase tracking-wider text-[11px]">
                  Agregar Artículo a la Orden
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-6">
                    <label className="block font-medium text-slate-600 mb-1">Producto</label>
                    <select
                      value={prodActualId}
                      onChange={(e) => {
                        const id = parseInt(e.target.value);
                        setProdActualId(id);
                        const prod = productos.find((p) => p.Id_Producto === id);
                        if (prod) setCostoActual(Math.round(prod.Precio_Venta * 0.7).toString());
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    >
                      {productos.map((p) => (
                        <option key={p.Id_Producto} value={p.Id_Producto}>
                          {p.Nombre} (Stock: {p.Stock_Actual})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-medium text-slate-600 mb-1">Cantidad</label>
                    <input
                      type="number"
                      value={cantidadActual}
                      onChange={(e) => setCantidadActual(e.target.value)}
                      min="1"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block font-medium text-slate-600 mb-1">Costo Unitario (CRC)</label>
                    <input
                      type="number"
                      value={costoActual}
                      onChange={(e) => setCostoActual(e.target.value)}
                      min="1"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <button
                      type="button"
                      onClick={agregarLinea}
                      className="w-full py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center justify-center"
                      title="Agregar línea"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Líneas Agregadas */}
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                  Líneas de la Orden ({lineasCompra.length})
                </h4>

                {lineasCompra.length === 0 ? (
                  <p className="text-slate-400 italic text-center py-4">
                    Agregue productos en el formulario superior para construir la orden.
                  </p>
                ) : (
                  <div className="border border-[#DFD5C4] rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAF7F0] font-bold border-b border-[#DFD5C4] text-[#5C3622]">
                        <tr>
                          <th className="py-2 px-3">Producto</th>
                          <th className="py-2 px-3 text-center">Cantidad</th>
                          <th className="py-2 px-3 text-right">Costo Unit.</th>
                          <th className="py-2 px-3 text-right">Subtotal</th>
                          <th className="py-2 px-3 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {lineasCompra.map((linea, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 font-semibold text-slate-800">{linea.nombre}</td>
                            <td className="py-2 px-3 text-center font-bold">{linea.cantidad}</td>
                            <td className="py-2 px-3 text-right">₡{linea.costoUnitario.toLocaleString('es-CR')}</td>
                            <td className="py-2 px-3 text-right font-black">
                              ₡{(linea.cantidad * linea.costoUnitario).toLocaleString('es-CR')}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                onClick={() => eliminarLinea(idx)}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Total Orden */}
              <div className="bg-[#132B20] text-white rounded-xl p-4 flex justify-between items-center">
                <span className="font-bold text-sm text-slate-300">Total Inversión de Compra:</span>
                <span className="font-black text-xl text-teal-300">
                  ₡{totalNuevaOrden.toLocaleString('es-CR')}
                </span>
              </div>
            </div>

            <div className="p-4 bg-[#FAF7F0] border-t border-[#DFD5C4] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalNuevaCompraAbierto(false)}
                disabled={guardando}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl font-semibold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarNuevaOrden}
                disabled={guardando || lineasCompra.length === 0}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
              >
                {guardando ? 'Guardando orden...' : 'Crear Orden de Compra'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DETALLE DE COMPRA ================= */}
      {modalDetalleAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132B20]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] shadow-2xl border border-[#DFD5C4] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#132B20] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Truck className="w-5 h-5 text-teal-400" />
                  Orden de Compra OC-{compraSeleccionada?.Id_Compra?.toString().padStart(8, '0')}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Proveedor: {compraSeleccionada?.Proveedor}
                </p>
              </div>
              <button
                onClick={() => setModalDetalleAbierto(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {cargandoDetalle ? (
                <div className="py-8 text-center">
                  <RefreshCw className="w-6 h-6 text-teal-600 animate-spin mx-auto mb-2" />
                  <p className="text-[#5C3622]">Cargando detalles de orden...</p>
                </div>
              ) : (
                <>
                  <div className="bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl p-3 grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 font-medium block">Fecha:</span>
                      <span className="font-bold text-slate-800">
                        {new Date(compraSeleccionada?.Fecha_Compra).toLocaleString('es-CR')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Estado Actual:</span>
                      <span className="font-bold text-slate-800">{compraSeleccionada?.Estado_Compra}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                      Productos Adquiridos
                    </h4>
                    <div className="border border-[#DFD5C4] rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#FAF7F0] text-[#5C3622] font-bold border-b border-[#DFD5C4]">
                          <tr>
                            <th className="py-2 px-3">Producto</th>
                            <th className="py-2 px-3 text-center">Cantidad</th>
                            <th className="py-2 px-3 text-right">Costo Unit.</th>
                            <th className="py-2 px-3 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {compraSeleccionada?.productos?.map((p) => (
                            <tr key={p.Id_Compra_Producto}>
                              <td className="py-2 px-3 font-semibold text-slate-800">{p.Producto}</td>
                              <td className="py-2 px-3 text-center font-bold">{p.Cantidad}</td>
                              <td className="py-2 px-3 text-right">₡{Number(p.Costo_Unitario).toLocaleString('es-CR')}</td>
                              <td className="py-2 px-3 text-right font-black">
                                ₡{Number(p.Subtotal).toLocaleString('es-CR')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl p-3 flex justify-between items-center text-sm">
                    <span className="font-bold text-[#132B20]">Monto Total de Compra:</span>
                    <span className="font-black text-teal-700 text-base">
                      ₡{Number(compraSeleccionada?.Monto_Total || 0).toLocaleString('es-CR')}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="p-4 bg-[#FAF7F0] border-t border-[#DFD5C4] flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#132B20] bg-white border border-[#DFD5C4] rounded-xl hover:bg-slate-100 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Comprobante</span>
              </button>

              <button
                onClick={() => setModalDetalleAbierto(false)}
                className="px-4 py-2 bg-[#132B20] text-white text-xs font-bold rounded-xl hover:bg-[#1A3D2F] transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL ANULACIÓN DE COMPRA ================= */}
      {modalAnulacionAbierto && compraAAnular && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132B20]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#DFD5C4] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-rose-600 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <RotateCcw className="w-5 h-5" />
                  Anular Orden de Compra
                </h3>
                <p className="text-xs text-rose-100 mt-0.5">
                  OC-{compraAAnular.Id_Compra.toString().padStart(8, '0')}
                </p>
              </div>
              <button
                onClick={() => setModalAnulacionAbierto(false)}
                className="p-1 text-rose-200 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
                Si esta orden ya había sido recibida, el sistema devolverá automáticamente las existencias para mantener el inventario exacto en bodega.
              </div>

              <div>
                <label className="block font-bold text-[#132B20] mb-1">Motivo de Anulación *</label>
                <textarea
                  value={motivoAnulacion}
                  onChange={(e) => setMotivoAnulacion(e.target.value)}
                  placeholder="Ej. Error en cantidad pactada con proveedor..."
                  rows={3}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="p-4 bg-[#FAF7F0] border-t border-[#DFD5C4] flex items-center justify-end gap-2">
              <button
                onClick={() => setModalAnulacionAbierto(false)}
                disabled={guardando}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl font-semibold transition"
              >
                Cancelar
              </button>
              <button
                onClick={procesarAnulacion}
                disabled={guardando || !motivoAnulacion.trim()}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
              >
                {guardando ? 'Anulando...' : 'Confirmar Anulación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DIRECTORIO PROVEEDORES ================= */}
      {modalProveedoresAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132B20]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] shadow-2xl border border-[#DFD5C4] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#132B20] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Building className="w-5 h-5 text-blue-400" />
                  Directorio de Proveedores Homologados
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Proveedores Particulares e Institucionales
                </p>
              </div>
              <button
                onClick={() => setModalProveedoresAbierto(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 text-xs">
              <div className="border border-[#DFD5C4] rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-[#FAF7F0] text-[#5C3622] font-bold border-b border-[#DFD5C4]">
                    <tr>
                      <th className="py-2.5 px-3">Razón Social / Nombre</th>
                      <th className="py-2.5 px-3">Tipo</th>
                      <th className="py-2.5 px-3">Identificación</th>
                      <th className="py-2.5 px-3">Contacto</th>
                      <th className="py-2.5 px-3">Teléfono</th>
                      <th className="py-2.5 px-3">Dirección</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-[#132B20]">
                    {proveedores.map((prov) => (
                      <tr key={prov.Id_Proveedor} className="hover:bg-[#FAF7F0]/80">
                        <td className="py-2.5 px-3 font-bold text-[#132B20]">{prov.Nombre_O_RazonSocial}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              prov.Tipo_Proveedor === 'Institucional'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {prov.Tipo_Proveedor}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono">{prov.Numero_Identificacion}</td>
                        <td className="py-2.5 px-3">{prov.Nombre_Contacto || 'N/A'}</td>
                        <td className="py-2.5 px-3">{prov.Telefono || prov.Telefono_Contacto || 'N/A'}</td>
                        <td className="py-2.5 px-3 max-w-[200px] truncate" title={prov.Direccion}>
                          {prov.Direccion}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 bg-[#FAF7F0] border-t border-[#DFD5C4] flex justify-end">
              <button
                onClick={() => setModalProveedoresAbierto(false)}
                className="px-4 py-2 bg-[#132B20] text-white font-bold rounded-xl text-xs hover:bg-[#1A3D2F] transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
