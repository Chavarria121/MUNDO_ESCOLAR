import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  CreditCard,
  Smartphone,
  Building,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Printer,
  RefreshCw,
  Sparkles,
  User,
  Layers,
  ArrowRight,
  X,
  Clock,
  ChevronDown
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function PosPage({ onNavigateToFacturacion }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  
  

  
  

  // Estados de datos maestros
  const [productos, setProductos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [condicionesPago, setCondicionesPago] = useState([]);
  const [metodosPago, setMetodosPago] = useState([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);

  // Filtros de catálogo
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('TODOS');
  const [tipoCatalogo, setTipoCatalogo] = useState('TODOS'); // 'TODOS' | 'PRODUCTOS' | 'SERVICIOS'

  // Estado del Carrito / Orden de Venta
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [condicionSeleccionada, setCondicionSeleccionada] = useState(1); // 1 = Contado
  const [itemsCarrito, setItemsCarrito] = useState([]);

  // Modales
  const [modalCobroAbierto, setModalCobroAbierto] = useState(false);
  const [modalReciboAbierto, setModalReciboAbierto] = useState(false);
  const [procesandoVenta, setProcesandoVenta] = useState(false);
  const [resultadoVenta, setResultadoVenta] = useState(null);

  // Formulario de Cobro
  const [metodoPagoId, setMetodoPagoId] = useState(1); // 1 = Efectivo
  const [montoEntregado, setMontoEntregado] = useState('');
  const [referenciaPago, setReferenciaPago] = useState('');

  // Búsqueda y Selección Dinámica de Cliente en POS
  const [modoCambiarCliente, setModoCambiarCliente] = useState(false);
  const [busquedaClientePos, setBusquedaClientePos] = useState('');
  const [sugerenciaTsePos, setSugerenciaTsePos] = useState(null);
  const [mensajeTsePos, setMensajeTsePos] = useState(null);
  const [consultandoTsePos, setConsultandoTsePos] = useState(false);
  const [guardandoClientePos, setGuardandoClientePos] = useState(false);
  const ultimaCedulaPos = useRef('');

  // Filtrado de clientes existentes en base a la búsqueda en POS
  const clientesFiltradosPos = useMemo(() => {
    const term = (busquedaClientePos || '').toLowerCase().trim();
    if (!term) return clientes.slice(0, 8); // Mostrar los primeros 8 por defecto
    return clientes.filter((c) => {
      const nom = (c.Nombre_O_RazonSocial || '').toLowerCase();
      const id = (c.Numero_Identificacion || '').replace(/\D/g, '');
      const rawId = (c.Numero_Identificacion || '').toLowerCase();
      return nom.includes(term) || id.includes(term.replace(/\D/g, '')) || rawId.includes(term);
    }).slice(0, 8);
  }, [clientes, busquedaClientePos]);

  // Manejador al teclear en la búsqueda de cliente del POS
  const handleBusquedaClientePosChange = (val) => {
    setBusquedaClientePos(val);
    setSugerenciaTsePos(null);
    setMensajeTsePos(null);

    const digits = val.replace(/\D/g, '');

    // 1. Si coincide exactamente con un cliente ya registrado en la base de datos
    if (digits.length >= 8) {
      const existe = clientes.find((c) => {
        const cDigits = (c.Numero_Identificacion || '').replace(/\D/g, '');
        return cDigits === digits;
      });
      if (existe) {
        setClienteSeleccionado(existe);
        setBusquedaClientePos('');
        setModoCambiarCliente(false);
        showToast(`Cliente seleccionado: ${existe.Nombre_O_RazonSocial}`, 'info');
        return;
      }
    }

    // 2. Si completó 9 dígitos (Física) o 10 dígitos (Jurídica), autoverificar en TSE / Hacienda
    if (digits.length === 9 || digits.length === 10) {
      consultarTsePosDirecto(digits);
    }
  };

  const consultarTsePosDirecto = async (digits) => {
    setConsultandoTsePos(true);
    setMensajeTsePos(null);
    try {
      const res = await api.get(`/clientes/tse/${digits}`);
      if (res.data?.encontrado) {
        setSugerenciaTsePos(res.data);
      } else {
        setSugerenciaTsePos(null);
        setMensajeTsePos(res.data?.mensaje || 'Cédula no localizada en el padrón del TSE ni en Hacienda.');
      }
    } catch (err) {
      console.error('Error consultando TSE en POS:', err);
      setMensajeTsePos('Error consultando padrón TSE / Hacienda.');
    } finally {
      setConsultandoTsePos(false);
    }
  };

  // Registrar cliente de TSE al vuelo y asignarlo a la venta actual
  const registrarYAsignarSugerenciaPos = async () => {
    if (!sugerenciaTsePos) return;
    setGuardandoClientePos(true);
    try {
      let nuevoId = null;
      let numeroIdFinal = '';
      let nombreFinal = '';

      if (sugerenciaTsePos.tipo === 'FISICA') {
        numeroIdFinal = sugerenciaTsePos.identificacionFormateada;
        nombreFinal = sugerenciaTsePos.nombreCompleto || `${sugerenciaTsePos.nombre} ${sugerenciaTsePos.apellido1}`;
        const res = await api.post('/clientes/particular', {
          identificacion: sugerenciaTsePos.identificacionFormateada,
          nombre: sugerenciaTsePos.nombre,
          apellido1: sugerenciaTsePos.apellido1,
          apellido2: sugerenciaTsePos.apellido2 || undefined,
          direccion: 'Sin asignar',
          telefono: 'Sin registrar',
        });
        nuevoId = res.data?.Id_Cliente || res.data?.id;
      } else {
        numeroIdFinal = sugerenciaTsePos.cedulaJuridica;
        nombreFinal = sugerenciaTsePos.razonSocial;
        const res = await api.post('/clientes/institucional', {
          cedulaJuridica: sugerenciaTsePos.cedulaJuridica,
          razonSocial: sugerenciaTsePos.razonSocial,
          direccion: 'Sin asignar',
          telefono: 'Sin registrar',
        });
        nuevoId = res.data?.Id_Cliente || res.data?.id;
      }

      // 1. Mostrar toast informativo si está disponible
      try {
        if (typeof showToast === 'function') {
          showToast(`¡Cliente ${nombreFinal} registrado y asignado a la venta!`, 'success');
        }
      } catch (e) {
        console.warn('Toast display error:', e);
      }

      // 2. Recargar catálogo de clientes y seleccionar el recién creado
      let list = [];
      try {
        const resCli = await api.get('/clientes/activos');
        list = resCli.data || [];
        setClientes(list);
      } catch (e) {
        console.warn('Error refrescando catálogo de clientes:', e);
      }

      const clienteRecienCreado = list.find((c) => c.Id_Cliente === nuevoId) 
                               || list.find((c) => (c.Numero_Identificacion || '').replace(/\D/g, '') === numeroIdFinal.replace(/\D/g, ''));

      if (clienteRecienCreado) {
        setClienteSeleccionado(clienteRecienCreado);
      } else {
        setClienteSeleccionado({
          Id_Cliente: nuevoId,
          Tipo_Cliente: sugerenciaTsePos.tipo === 'FISICA' ? 'Particular' : 'Institucional',
          Numero_Identificacion: numeroIdFinal,
          Nombre_O_RazonSocial: nombreFinal,
          Tiene_Credito_Activo: false,
        });
      }

      // 3. Limpiar estado de búsqueda y cerrar el modo de edición de cliente
      setSugerenciaTsePos(null);
      setMensajeTsePos(null);
      setBusquedaClientePos('');
      setModoCambiarCliente(false);
    } catch (err) {
      console.error('Error registrando cliente sugerido en POS:', err);
      try {
        if (typeof showToast === 'function') {
          showToast(err.response?.data?.mensaje || 'Error registrando cliente en base de datos', 'error');
        }
      } catch (e) {}
    } finally {
      setGuardandoClientePos(false);
    }
  };

  // Cargar catálogos al iniciar
  useEffect(() => {
    cargarCatalogos();
  }, []);

  const cargarCatalogos = async () => {
    setLoadingCatalogos(true);
    try {
      const [resProds, resServs, resClientes, resCondiciones, resMetodos] = await Promise.all([
        api.get('/productos/inventario'),
        api.get('/servicios'),
        api.get('/clientes/activos'),
        api.get('/catalogos/condiciones-pago'),
        api.get('/catalogos/metodos-pago'),
      ]);

      setProductos(resProds.data || []);
      setServicios(resServs.data || []);
      setClientes(resClientes.data || []);
      setCondicionesPago(resCondiciones.data || []);
      setMetodosPago(resMetodos.data || []);

      if (resClientes.data && resClientes.data.length > 0) {
        setClienteSeleccionado(resClientes.data[0]);
      }
    } catch (err) {
      console.error('Error cargando catálogos POS:', err);
      showToast('Error de conexión con el servidor', 'error');
    } finally {
      setLoadingCatalogos(false);
    }
  };

  // Extraer categorías únicas de productos
  const categorias = useMemo(() => {
    const cats = new Set(productos.map((p) => p.Categoria).filter(Boolean));
    return ['TODOS', ...Array.from(cats), 'Servicios'];
  }, [productos]);

  // Filtrado de items para la cuadrícula
  const itemsFiltrados = useMemo(() => {
    const term = busqueda.toLowerCase().trim();

    const prods = (tipoCatalogo === 'SERVICIOS' ? [] : productos)
      .filter((p) => {
        if (categoriaSeleccionada !== 'TODOS' && categoriaSeleccionada !== 'Servicios') {
          if (p.Categoria !== categoriaSeleccionada) return false;
        }
        if (categoriaSeleccionada === 'Servicios') return false;
        if (!term) return true;
        return (
          p.Nombre.toLowerCase().includes(term) ||
          p.Categoria.toLowerCase().includes(term) ||
          p.Id_Producto.toString() === term
        );
      })
      .map((p) => ({
        tipo: 'Producto',
        id: p.Id_Producto,
        nombre: p.Nombre,
        categoria: p.Categoria,
        precio: Number(p.Precio_Venta),
        stock: p.Stock_Actual,
        reorden: p.Punto_Reorden,
        disponibilidad: p.Estado_Disponibilidad,
      }));

    const servs = (tipoCatalogo === 'PRODUCTOS' ? [] : servicios)
      .filter((s) => {
        if (categoriaSeleccionada !== 'TODOS' && categoriaSeleccionada !== 'Servicios') {
          return false;
        }
        if (!term) return true;
        return (
          s.Nombre.toLowerCase().includes(term) ||
          (s.Descripcion && s.Descripcion.toLowerCase().includes(term))
        );
      })
      .map((s) => ({
        tipo: 'Servicio',
        id: s.Id_Servicio,
        nombre: s.Nombre,
        categoria: 'Servicio Escolar',
        precio: Number(s.Precio_Base),
        stock: 9999,
        reorden: 0,
        disponibilidad: 'Disponible',
      }));

    return [...prods, ...servs];
  }, [productos, servicios, busqueda, categoriaSeleccionada, tipoCatalogo]);

  // Operaciones del Carrito
  const agregarAlCarrito = (item) => {
    if (item.tipo === 'Producto' && item.stock <= 0) {
      showToast(`${item.nombre} no tiene existencias en bodega`, 'warning');
      return;
    }

    setItemsCarrito((prev) => {
      const index = prev.findIndex((i) => i.tipo === item.tipo && i.id === item.id);
      if (index >= 0) {
        const itemActual = prev[index];
        const nuevaCantidad = itemActual.cantidad + 1;
        if (item.tipo === 'Producto' && nuevaCantidad > item.stock) {
          showToast(`Stock máximo disponible: ${item.stock} unidades`, 'warning');
          return prev;
        }
        const updated = [...prev];
        updated[index] = { ...itemActual, cantidad: nuevaCantidad };
        return updated;
      } else {
        return [...prev, { ...item, cantidad: 1 }];
      }
    });
  };

  const modificarCantidad = (index, delta) => {
    setItemsCarrito((prev) => {
      const item = prev[index];
      const nuevaCantidad = item.cantidad + delta;
      if (nuevaCantidad <= 0) {
        return prev.filter((_, i) => i !== index);
      }
      if (item.tipo === 'Producto' && nuevaCantidad > item.stock) {
        showToast(`Stock máximo: ${item.stock}`, 'warning');
        return prev;
      }
      const updated = [...prev];
      updated[index] = { ...item, cantidad: nuevaCantidad };
      return updated;
    });
  };

  const eliminarItem = (index) => {
    setItemsCarrito((prev) => prev.filter((_, i) => i !== index));
  };

  const vaciarCarrito = () => {
    setItemsCarrito([]);
  };

  // Cálculo financiero sincronizado con la lógica de SQL Server (IVA 13%)
  const { subtotal, iva, total } = useMemo(() => {
    const sub = itemsCarrito.reduce((acc, curr) => acc + curr.precio * curr.cantidad, 0);
    const imp = Math.round(sub * 0.13 * 100) / 100;
    const tot = Math.round((sub + imp) * 100) / 100;
    return { subtotal: sub, iva: imp, total: tot };
  }, [itemsCarrito]);

  // Cálculo de vuelto para efectivo
  const vuelto = useMemo(() => {
    const entregado = parseFloat(montoEntregado) || 0;
    return Math.max(0, entregado - total);
  }, [montoEntregado, total]);

  const dineroFaltante = useMemo(() => {
    const entregado = parseFloat(montoEntregado) || 0;
    return Math.max(0, total - entregado);
  }, [montoEntregado, total]);

  // Abrir modal de cobro
  const iniciarCobro = () => {
    if (itemsCarrito.length === 0) {
      showToast('Agregue al menos un producto o servicio al carrito', 'warning');
      return;
    }
    if (!clienteSeleccionado) {
      showToast('Seleccione un cliente para la orden fiscal', 'warning');
      return;
    }
    setMontoEntregado(total.toString());
    setReferenciaPago('');
    setModalCobroAbierto(true);
  };

  // Confirmar y Ejecutar Venta completa contra SQL Server
  const procesarVentaFinal = async () => {
    if (metodoPagoId === 1 && (parseFloat(montoEntregado) || 0) < total) {
      showToast('El monto entregado en efectivo es menor al total a pagar', 'warning');
      return;
    }

    setProcesandoVenta(true);
    try {
      // 1. Crear Venta en SQL Server (SP_Venta_Crear)
      const resVenta = await api.post('/ventas', {
        idCliente: clienteSeleccionado.Id_Cliente,
        idCondicionPago: condicionSeleccionada,
      });

      const idVenta = resVenta.data.idVenta || resVenta.data.Id_Venta;
      if (!idVenta) {
        throw new Error('No se obtuvo el identificador de venta de SQL Server');
      }

      // 2. Insertar líneas de detalle de productos y servicios
      for (const item of itemsCarrito) {
        if (item.tipo === 'Producto') {
          await api.post(`/ventas/${idVenta}/productos`, {
            idProducto: item.id,
            cantidad: item.cantidad,
            precioUnitario: item.precio,
          });
        } else {
          await api.post(`/ventas/${idVenta}/servicios`, {
            idServicio: item.id,
            cantidad: item.cantidad,
            precioUnitario: item.precio,
          });
        }
      }

      // 3. Confirmar Venta (SP_Venta_Confirmar)
      const resConfirmar = await api.post(`/ventas/${idVenta}/confirmar`);
      const idFacturaGenerada =
        resConfirmar.data.idFactura ||
        resConfirmar.data.Id_Factura ||
        resConfirmar.data.factura?.Id_Factura ||
        idVenta;

      // 4. Si la condición es Contado (Id=1), registrar el pago inmediato (SP_Pago_Registrar)
      if (condicionSeleccionada === 1) {
        await api.post('/pagos', {
          idFactura: idFacturaGenerada,
          idMetodoPago: metodoPagoId,
          montoPagado: total,
          numeroReferencia:
            referenciaPago ||
            (metodoPagoId === 1 ? 'EFECTIVO-CAJA' : `POS-${Date.now().toString().slice(-6)}`),
        });
      }

      // Guardar resultado para comprobante fiscal
      setResultadoVenta({
        idVenta,
        idFactura: idFacturaGenerada,
        numeroFactura: `FAC-${idFacturaGenerada.toString().padStart(8, '0')}`,
        cliente: clienteSeleccionado.Nombre_O_RazonSocial,
        tipoCliente: clienteSeleccionado.Tipo_Cliente,
        identificacion: clienteSeleccionado.Numero_Identificacion,
        vendedor: user?.nombreUsuario || 'Cajero',
        fecha: new Date(),
        condicionPago: condicionesPago.find((c) => c.Id_Condicion_Pago === condicionSeleccionada)?.Nombre || 'Contado',
        metodoPago: metodosPago.find((m) => m.Id_Metodo_Pago === metodoPagoId)?.Nombre || 'Efectivo',
        items: [...itemsCarrito],
        subtotal,
        iva,
        total,
        montoEntregado: parseFloat(montoEntregado) || total,
        vuelto: vuelto,
        referencia: referenciaPago,
      });

      showToast(`¡Venta #${idVenta} confirmada y Factura emitida con éxito!`, 'success');
      setModalCobroAbierto(false);
      setModalReciboAbierto(true);
      vaciarCarrito();

      // Recargar existencias de productos desde SQL Server
      api.get('/productos/inventario').then((res) => setProductos(res.data || []));
    } catch (err) {
      console.error('Error procesando venta:', err);
      const msg = err.response?.data?.mensaje || err.message || 'Error al procesar la venta';
      showToast(`Error al cobrar venta: ${msg}`, 'error');
    } finally {
      setProcesandoVenta(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header POS */}
      <div className="bg-white rounded-2xl border border-[#DFD5C4] p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2D5E46] to-[#25221E] flex items-center justify-center text-white shadow-glow-blue">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#132B20] tracking-tight flex items-center gap-2">
                Caja Registradora & Punto de Venta (POS)
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Kárdex & IVA 13% en Línea
                </span>
              </h2>
              <p className="text-xs text-[#5C3622]">
                Librería & Papelería Mundo Escolar • Liberia, Guanacaste • Terminal de Caja
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={cargarCatalogos}
            disabled={loadingCatalogos}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            title="Actualizar catálogo de productos"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingCatalogos ? 'animate-spin' : ''}`} />
            <span>Sincronizar</span>
          </button>

          <button
            onClick={onNavigateToFacturacion}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#2D5E46] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition"
          >
            <Receipt className="w-4 h-4" />
            <span>Ver Facturas Emitidas</span>
          </button>
        </div>
      </div>

      {/* Grid Principal POS: 7 cols Catálogo / 5 cols Carrito */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* PANEL IZQUIERDO: Catálogo de Productos y Servicios */}
        <div className="lg:col-span-7 space-y-4">
          {/* Barra de Búsqueda y Filtro de Tipo */}
          <div className="bg-white rounded-2xl border border-[#DFD5C4] p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar producto, código SKU o servicio escolar..."
                  className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46]/20 focus:border-[#2D5E46] transition"
                />
                {busqueda && (
                  <button
                    onClick={() => setBusqueda('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Botones de Filtro Rápido */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
                <button
                  onClick={() => setTipoCatalogo('TODOS')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    tipoCatalogo === 'TODOS' ? 'bg-white text-[#2D5E46] shadow-sm' : 'hover:text-[#132B20]'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setTipoCatalogo('PRODUCTOS')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    tipoCatalogo === 'PRODUCTOS' ? 'bg-white text-[#2D5E46] shadow-sm' : 'hover:text-[#132B20]'
                  }`}
                >
                  Productos
                </button>
                <button
                  onClick={() => setTipoCatalogo('SERVICIOS')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    tipoCatalogo === 'SERVICIOS' ? 'bg-white text-[#2D5E46] shadow-sm' : 'hover:text-[#132B20]'
                  }`}
                >
                  Servicios
                </button>
              </div>
            </div>

            {/* Categorías en Pastillas Deslizables */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {categorias.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoriaSeleccionada(cat)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition ${
                    categoriaSeleccionada === cat
                      ? 'bg-[#132B20] text-white font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Cuadrícula de Artículos del Catálogo */}
          {loadingCatalogos ? (
            <div className="bg-white rounded-2xl border border-[#DFD5C4] p-12 text-center shadow-sm">
              <RefreshCw className="w-8 h-8 text-[#2D5E46] animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600">Cargando catálogo de productos...</p>
            </div>
          ) : itemsFiltrados.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#DFD5C4] p-12 text-center shadow-sm">
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No se encontraron artículos</p>
              <p className="text-xs text-slate-400 mt-1">
                Intente con otro término de búsqueda o categoría.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 max-h-[640px] overflow-y-auto pr-1">
              {itemsFiltrados.map((item) => {
                const esAgotado = item.tipo === 'Producto' && item.stock <= 0;
                const stockBajo = item.tipo === 'Producto' && item.stock <= item.reorden && item.stock > 0;

                return (
                  <div
                    key={`${item.tipo}-${item.id}`}
                    className={`bg-white rounded-xl border p-3.5 shadow-sm transition-all flex flex-col justify-between group ${
                      esAgotado
                        ? 'border-[#DFD5C4] opacity-60 bg-slate-50/50'
                        : 'border-[#DFD5C4] hover:border-blue-400 hover:shadow-md cursor-pointer'
                    }`}
                    onClick={() => !esAgotado && agregarAlCarrito(item)}
                  >
                    <div>
                      {/* Tags Superiores */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                            item.tipo === 'Servicio'
                              ? 'bg-purple-100 text-purple-700 border border-purple-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.categoria}
                        </span>

                        {item.tipo === 'Producto' ? (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              esAgotado
                                ? 'bg-rose-100 text-rose-700'
                                : stockBajo
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {esAgotado ? 'Agotado' : `Stock: ${item.stock}`}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-[#2D5E46]">
                            Servicio
                          </span>
                        )}
                      </div>

                      {/* Título del Item */}
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-[#2D5E46] transition">
                        {item.nombre}
                      </h4>
                    </div>

                    {/* Precio y Botón de Acción */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Precio</span>
                        <span className="text-sm font-extrabold text-[#132B20]">
                          ₡{item.precio.toLocaleString('es-CR')}
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={esAgotado}
                        className={`p-1.5 rounded-lg transition ${
                          esAgotado
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-blue-50 text-[#2D5E46] group-hover:bg-[#2D5E46] group-hover:text-white'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* PANEL DERECHO: Carrito de Caja y Cobro */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-[#DFD5C4] shadow-sm overflow-hidden flex flex-col h-[760px]">
            {/* Header del Ticket */}
            <div className="p-4 border-b border-[#DFD5C4] bg-[#132B20] text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#DFD5C4]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Ticket de Venta Fiscal
                  </span>
                </div>
                <span className="text-xs bg-blue-500/20 text-[#DFD5C4] border border-[#2D5E46]/30 px-2 py-0.5 rounded-full font-semibold">
                  {itemsCarrito.reduce((acc, i) => acc + i.cantidad, 0)} items
                </span>
              </div>

              {/* Selector Dinámico de Cliente */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1 font-medium">
                    <User className="w-3.5 h-3.5" /> Cliente Fiscal:
                  </span>
                  {clienteSeleccionado && !modoCambiarCliente && (
                    <button
                      type="button"
                      onClick={() => setModoCambiarCliente(true)}
                      className="text-[11px] text-[#DFD5C4] hover:text-[#C05A3E] font-bold transition flex items-center gap-1"
                    >
                      <Search className="w-3 h-3" />
                      <span>Cambiar / Buscar</span>
                    </button>
                  )}
                </div>

                {/* Vista 1: Cliente Seleccionado Actualmente */}
                {clienteSeleccionado && !modoCambiarCliente ? (
                  <div className="p-2.5 rounded-xl bg-[#1A3D2F]/90 border border-[#2D5E46]/80 flex items-center justify-between gap-2 shadow-sm">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-xs truncate block">
                          {clienteSeleccionado.Nombre_O_RazonSocial}
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded shrink-0 ${
                            clienteSeleccionado.Tipo_Cliente === 'Institucional'
                              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                              : 'bg-blue-400/20 text-[#C05A3E] border border-blue-400/30'
                          }`}
                        >
                          {clienteSeleccionado.Tipo_Cliente}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        Cédula: {clienteSeleccionado.Numero_Identificacion}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setModoCambiarCliente(true)}
                      className="p-1 text-slate-400 hover:text-white rounded-lg transition shrink-0"
                      title="Seleccionar o registrar otro cliente"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  /* Vista 2: Buscador y Selector con Autocompletado Inmediato */
                  <div className="space-y-2 bg-[#0F2219] p-2.5 rounded-xl border border-[#2D5E46]/30 bg-[#1A3D2F]/95">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={busquedaClientePos}
                        onChange={(e) => handleBusquedaClientePosChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const digits = busquedaClientePos.replace(/\D/g, '');
                            if (digits.length >= 8) {
                              consultarTsePosDirecto(digits);
                            }
                          }
                        }}
                        placeholder="Digite cédula (9 dígitos) o nombre..."
                        className="w-full pl-8 pr-8 py-1.5 bg-[#132B20] border border-[#2D5E46] rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#2D5E46] font-medium placeholder-slate-500"
                        autoFocus
                      />
                      {consultandoTsePos && (
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                          <div className="w-3.5 h-3.5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                        </div>
                      )}
                    </div>

                    {/* Tarjeta sugerencia cuando el cliente NO está registrado pero se encontró en TSE */}
                    {sugerenciaTsePos && (
                      <div className="p-2.5 rounded-lg bg-[#2D5E46]/80 border border-[#2D5E46]/40 text-left animate-in fade-in duration-150">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-[#C05A3E] font-bold uppercase tracking-wider">
                            ✓ No registrado &bull; Verificado en {sugerenciaTsePos.tipo === 'FISICA' ? 'TSE' : 'Hacienda'}
                          </span>
                        </div>
                        <p className="font-bold text-white text-xs leading-tight mb-0.5">
                          {sugerenciaTsePos.nombreCompleto || sugerenciaTsePos.razonSocial}
                        </p>
                        <p className="text-[10px] text-slate-300 font-mono mb-2">
                          Cédula: {sugerenciaTsePos.identificacionFormateada || sugerenciaTsePos.cedulaJuridica}
                        </p>
                        <button
                          type="button"
                          onClick={registrarYAsignarSugerenciaPos}
                          disabled={guardandoClientePos}
                          className="w-full py-1.5 px-2.5 bg-gradient-to-r from-[#2D5E46] to-[#25221E] hover:from-[#3E7356] hover:to-[#4A3929] text-white rounded-lg text-xs font-bold shadow transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          {guardandoClientePos ? (
                            <span>Registrando cliente...</span>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Registrar y Asignar a la Venta</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Alerta cuando la cédula NO fue encontrada en TSE/Hacienda */}
                    {mensajeTsePos && !sugerenciaTsePos && (
                      <div className="p-2.5 rounded-lg bg-amber-950/70 border border-amber-500/40 text-left text-xs animate-in fade-in duration-150">
                        <div className="flex items-center gap-1.5 text-amber-300 font-bold mb-0.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>No localizado en TSE ni Hacienda</span>
                        </div>
                        <p className="text-[10px] text-amber-200/90 leading-tight">
                          {mensajeTsePos}
                        </p>
                      </div>
                    )}

                    {/* Estado informativo si no hay clientes locales coincidentes */}
                    {!sugerenciaTsePos && !mensajeTsePos && busquedaClientePos.trim() !== '' && clientesFiltradosPos.length === 0 && !consultandoTsePos && (
                      <div className="p-3 text-center bg-[#132B20]/60 rounded-lg border border-[#2D5E46]/50">
                        <p className="text-xs text-slate-300 font-medium">
                          No se encontraron clientes registrados con "{busquedaClientePos}"
                        </p>
                        <p className="text-[10px] text-[#5C3622] mt-1">
                          {busquedaClientePos.replace(/\D/g, '').length >= 1
                            ? 'Complete los 9 dígitos de cédula para consultar automáticamente el TSE'
                            : 'Digite la cédula o seleccione un cliente de la lista'}
                        </p>
                      </div>
                    )}

                    {/* Listado de Clientes Existentes en Catálogo */}
                    {!sugerenciaTsePos && (
                      <div className="max-h-36 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block px-1">
                          Clientes Registrados:
                        </span>
                        {clientesFiltradosPos.map((c) => (
                          <button
                            key={c.Id_Cliente}
                            type="button"
                            onClick={() => {
                              setClienteSeleccionado(c);
                              setModoCambiarCliente(false);
                              setBusquedaClientePos('');
                            }}
                            className="w-full text-left p-1.5 rounded-lg hover:bg-slate-700/80 text-xs text-slate-200 transition flex items-center justify-between group"
                          >
                            <div className="truncate pr-2">
                              <span className="font-semibold block truncate group-hover:text-[#C05A3E]">
                                {c.Nombre_O_RazonSocial}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {c.Numero_Identificacion}
                              </span>
                            </div>
                            <span className="text-[9px] text-slate-400 group-hover:text-[#DFD5C4] font-bold shrink-0">
                              Seleccionar
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {clienteSeleccionado && (
                      <div className="pt-1 border-t border-[#2D5E46]/60 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setModoCambiarCliente(false);
                            setBusquedaClientePos('');
                            setSugerenciaTsePos(null);
                          }}
                          className="text-[10px] text-slate-400 hover:text-slate-200 transition"
                        >
                          Volver sin cambiar
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Condición de Pago */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-slate-400 font-medium">Condición:</span>
                  <select
                    value={condicionSeleccionada}
                    onChange={(e) => setCondicionSeleccionada(parseInt(e.target.value))}
                    className="bg-[#1A3D2F] text-white border border-[#2D5E46] text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-[#2D5E46]"
                  >
                    {condicionesPago.map((cond) => (
                      <option key={cond.Id_Condicion_Pago} value={cond.Id_Condicion_Pago}>
                        {cond.Nombre} ({cond.Dias_Credito === 0 ? 'Inmediato' : `${cond.Dias_Credito} días`})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Listado de Líneas de Venta */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {itemsCarrito.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-2 text-slate-300">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-semibold text-slate-600">Carrito vacío</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                    Seleccione productos o servicios del catálogo a la izquierda para agregarlos al ticket.
                  </p>
                </div>
              ) : (
                itemsCarrito.map((item, index) => {
                  const subtotalLinea = item.precio * item.cantidad;
                  return (
                    <div
                      key={`cart-${item.tipo}-${item.id}`}
                      className="bg-slate-50 border border-[#DFD5C4] rounded-xl p-2.5 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[9px] font-bold uppercase px-1 rounded ${
                              item.tipo === 'Servicio' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {item.tipo === 'Servicio' ? 'Serv' : 'Prod'}
                          </span>
                          <p className="text-xs font-bold text-slate-800 truncate">{item.nombre}</p>
                        </div>
                        <p className="text-[11px] text-[#5C3622] mt-0.5">
                          ₡{item.precio.toLocaleString('es-CR')} c/u
                        </p>
                      </div>

                      {/* Controles de Cantidad */}
                      <div className="flex items-center gap-1.5 bg-white border border-[#DFD5C4] rounded-lg p-0.5">
                        <button
                          onClick={() => modificarCantidad(index, -1)}
                          className="w-6 h-6 flex items-center justify-center text-[#5C3622] hover:bg-slate-100 rounded"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-slate-800">{item.cantidad}</span>
                        <button
                          onClick={() => modificarCantidad(index, 1)}
                          className="w-6 h-6 flex items-center justify-center text-[#5C3622] hover:bg-slate-100 rounded"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Total de Línea */}
                      <div className="text-right min-w-[70px]">
                        <span className="text-xs font-bold text-[#132B20] block">
                          ₡{subtotalLinea.toLocaleString('es-CR')}
                        </span>
                      </div>

                      {/* Botón Eliminar */}
                      <button
                        onClick={() => eliminarItem(index)}
                        className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition"
                        title="Quitar del ticket"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Resumen Financiero y Acciones */}
            <div className="p-4 border-t border-[#DFD5C4] bg-slate-50/70 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-medium">₡{subtotal.toLocaleString('es-CR')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="flex items-center gap-1">
                    IVA (13% Costa Rica):
                    <span className="text-[10px] text-slate-400">(FN_CalcularImpuesto)</span>
                  </span>
                  <span className="font-medium">₡{iva.toLocaleString('es-CR')}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-[#132B20] pt-2 border-t border-[#DFD5C4]">
                  <span>Monto Total:</span>
                  <span className="text-emerald-700 text-lg font-black">
                    ₡{total.toLocaleString('es-CR')}
                  </span>
                </div>
              </div>

              {/* Botones de Finalización */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={vaciarCarrito}
                  disabled={itemsCarrito.length === 0}
                  className="px-3 py-2.5 text-xs font-semibold text-slate-600 bg-white border border-[#DFD5C4] hover:bg-slate-100 rounded-xl transition disabled:opacity-50"
                >
                  Vaciar
                </button>

                <button
                  type="button"
                  onClick={iniciarCobro}
                  disabled={itemsCarrito.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Cobrar & Facturar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE COBRO Y PAGO MULTIMÉTODO */}
      {modalCobroAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132B20]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#DFD5C4] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#132B20] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-400" />
                  Emisión Fiscal & Cobro Multimétodo
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Venta para: {clienteSeleccionado?.Nombre_O_RazonSocial}
                </p>
              </div>
              <button
                onClick={() => setModalCobroAbierto(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Resumen Total */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                <span className="text-xs uppercase font-bold text-emerald-700 tracking-wider block">
                  Total a Cancelar
                </span>
                <span className="text-3xl font-black text-emerald-900 mt-1 block">
                  ₡{total.toLocaleString('es-CR')}
                </span>
                <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
                  Subtotal: ₡{subtotal.toLocaleString('es-CR')} • IVA 13%: ₡{iva.toLocaleString('es-CR')}
                </span>
              </div>

              {/* Selector de Método de Pago */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Método de Pago
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {metodosPago.map((metodo) => {
                    const seleccionado = metodoPagoId === metodo.Id_Metodo_Pago;
                    return (
                      <button
                        key={metodo.Id_Metodo_Pago}
                        type="button"
                        onClick={() => setMetodoPagoId(metodo.Id_Metodo_Pago)}
                        className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                          seleccionado
                            ? 'border-[#C05A3E] bg-[#F3ECE0] text-[#132B20] font-bold shadow-sm'
                            : 'border-[#DFD5C4] bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xs leading-tight">{metodo.Nombre}</span>
                        {seleccionado && <CheckCircle2 className="w-3.5 h-3.5 text-[#2D5E46] mt-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Formularios según el método */}
              {metodoPagoId === 1 && (
                /* Efectivo */
                <div className="bg-slate-50 border border-[#DFD5C4] rounded-xl p-4 space-y-3">
                  <label className="block text-xs font-bold text-slate-700">Monto Entregado por Cliente (CRC)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">₡</span>
                    <input
                      type="number"
                      value={montoEntregado}
                      onChange={(e) => setMontoEntregado(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-lg font-bold text-[#132B20] bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46]/20 focus:border-[#2D5E46]"
                      placeholder="0"
                    />
                  </div>

                  {/* Chips de monto rápido */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[total, 1000, 2000, 5000, 10000, 20000].map((monto) => (
                      <button
                        key={monto}
                        type="button"
                        onClick={() => setMontoEntregado(monto.toString())}
                        className="px-2.5 py-1 text-xs font-semibold bg-white border border-[#DFD5C4] rounded-lg hover:bg-slate-100 text-slate-700 transition"
                      >
                        {monto === total ? 'Monto Exacto' : `₡${monto.toLocaleString('es-CR')}`}
                      </button>
                    ))}
                  </div>

                  {/* Cálculo de Cambio / Vuelto */}
                  <div className="pt-2 border-t border-[#DFD5C4] flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">Cambio / Vuelto:</span>
                    <span
                      className={`text-lg font-black ${
                        dineroFaltante > 0 ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {dineroFaltante > 0
                        ? `Faltan ₡${dineroFaltante.toLocaleString('es-CR')}`
                        : `₡${vuelto.toLocaleString('es-CR')}`}
                    </span>
                  </div>
                </div>
              )}

              {metodoPagoId !== 1 && (
                /* SINPE Móvil, Tarjeta o Transferencia */
                <div className="bg-slate-50 border border-[#DFD5C4] rounded-xl p-4 space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Número de Referencia Bancaria / Comprobante
                  </label>
                  <input
                    type="text"
                    value={referenciaPago}
                    onChange={(e) => setReferenciaPago(e.target.value)}
                    placeholder={
                      metodoPagoId === 5
                        ? 'Ej. Comprobante SINPE #998811'
                        : 'Ej. Código de autorización de terminal POS'
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
                  />
                  <p className="text-[11px] text-[#5C3622]">
                    Quedará registrado en el comprobante fiscal y control de caja.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-[#DFD5C4] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalCobroAbierto(false)}
                disabled={procesandoVenta}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={procesarVentaFinal}
                disabled={procesandoVenta || (metodoPagoId === 1 && dineroFaltante > 0)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#2D5E46] hover:bg-[#3E7356] text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {procesandoVenta ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Procesando venta...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar Venta & Facturar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE RECIBO / COMPROBANTE FISCAL */}
      {modalReciboAbierto && resultadoVenta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132B20]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#DFD5C4] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header Éxito */}
            <div className="bg-emerald-600 text-white p-5 text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 text-white">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-base">¡Venta y Factura Fiscal Confirmada!</h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                El inventario se actualizará automáticamente en bodega y kárdex.
              </p>
            </div>

            {/* Formato Ticket Fiscal */}
            <div className="p-6 space-y-4 font-mono text-xs text-slate-700 bg-slate-50 border-b border-[#DFD5C4]">
              <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-3">
                <p className="font-bold text-sm text-[#132B20]">LIBRERÍA Y PAPELERÍA MUNDO ESCOLAR</p>
                <p className="text-[11px] text-[#5C3622]">Cédula Jurídica: 3-101-998877</p>
                <p className="text-[11px] text-[#5C3622]">Liberia, Guanacaste, CR • Tel: 2666-0000</p>
                <p className="text-[10px] text-blue-700 font-bold mt-1">
                  RESOLUCIÓN DGT-R-48-2016 TRIBUTACIÓN DIRECTA
                </p>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#5C3622]">Factura:</span>
                  <span className="font-bold text-[#132B20]">{resultadoVenta.numeroFactura}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5C3622]">Orden Venta:</span>
                  <span>#{resultadoVenta.idVenta}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5C3622]">Fecha:</span>
                  <span>{resultadoVenta.fecha.toLocaleString('es-CR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5C3622]">Cliente:</span>
                  <span className="font-bold text-[#132B20] truncate max-w-[180px]">
                    {resultadoVenta.cliente}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5C3622]">Identificación:</span>
                  <span>{resultadoVenta.identificacion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5C3622]">Cajero:</span>
                  <span>{resultadoVenta.vendedor}</span>
                </div>
              </div>

              {/* Líneas de detalle */}
              <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1">
                {resultadoVenta.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span className="truncate max-w-[200px]">
                      {it.cantidad}x {it.nombre}
                    </span>
                    <span className="font-bold">₡{(it.precio * it.cantidad).toLocaleString('es-CR')}</span>
                  </div>
                ))}
              </div>

              {/* Totales */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₡{resultadoVenta.subtotal.toLocaleString('es-CR')}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA 13%:</span>
                  <span>₡{resultadoVenta.iva.toLocaleString('es-CR')}</span>
                </div>
                <div className="flex justify-between text-xs font-black text-[#132B20] pt-1 border-t border-slate-300">
                  <span>TOTAL A PAGAR:</span>
                  <span>₡{resultadoVenta.total.toLocaleString('es-CR')}</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-1">
                  <span>Método de Pago:</span>
                  <span className="font-semibold">{resultadoVenta.metodoPago}</span>
                </div>
                {resultadoVenta.metodoPago === 'Efectivo' && (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Entregado:</span>
                      <span>₡{resultadoVenta.montoEntregado.toLocaleString('es-CR')}</span>
                    </div>
                    <div className="flex justify-between font-bold text-emerald-800">
                      <span>Vuelto / Cambio:</span>
                      <span>₡{resultadoVenta.vuelto.toLocaleString('es-CR')}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Acciones de Recibo */}
            <div className="p-4 bg-white flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir</span>
              </button>

              <button
                type="button"
                onClick={() => setModalReciboAbierto(false)}
                className="flex-1 px-4 py-2 bg-[#132B20] hover:bg-[#1A3D2F] text-white text-xs font-bold rounded-xl transition"
              >
                Nueva Venta (Caja Libre)
              </button>
            </div>
          </div>
        </div>
      )}
    
      

    </div>
  );
}
