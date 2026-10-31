import React, { useState, useEffect, useMemo } from 'react';
import {
  Boxes,
  Search,
  Plus,
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  SlidersHorizontal,
  History,
  Tag,
  DollarSign,
  PackageCheck,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  FileSpreadsheet,
  AlertCircle,
  TrendingDown,
  Layers,
  Wrench,
  Sparkles,
  RotateCcw,
  Building2,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function InventarioPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Pestaña activa: 'PRODUCTOS' | 'SERVICIOS' | 'KARDEX'
  const [tabActiva, setTabActiva] = useState('PRODUCTOS');
  // Pestaña 4: Asociaciones Producto - Proveedor (dbo.Producto_Proveedor)
  const [asociacionesProveedor, setAsociacionesProveedor] = useState([]);
  const [proveedoresActivos, setProveedoresActivos] = useState([]);
  const [busquedaProveedor, setBusquedaProveedor] = useState('');
  const [filtroProveedorSelect, setFiltroProveedorSelect] = useState('TODOS');
  const [modalAsociarAbierto, setModalAsociarAbierto] = useState(false);
  const [formAsociacion, setFormAsociacion] = useState({ idProducto: '', idProveedor: '', precioCompra: '', esPrincipal: true });
  const [guardandoAsociacion, setGuardandoAsociacion] = useState(false);

  // Estados de datos
  const [productos, setProductos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [bajoReorden, setBajoReorden] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros Productos
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('TODAS');
  const [estadoStockFiltro, setEstadoStockFiltro] = useState('TODOS'); // 'TODOS' | 'NORMAL' | 'REORDEN' | 'AGOTADO'

  // Filtros Kárdex
  const [busquedaKardex, setBusquedaKardex] = useState('');
  const [filtroTipoMovimiento, setFiltroTipoMovimiento] = useState('TODOS');

  // Modales
  const [modalProductoAbierto, setModalProductoAbierto] = useState(false);
  const [productoEnEdicion, setProductoEnEdicion] = useState(null);
  const [formDataProducto, setFormDataProducto] = useState({
    idCategoria: 1,
    nombre: '',
    descripcion: '',
    precioVenta: '',
    stockInicial: 0,
    puntoReorden: 10,
    estado: true,
  });

  const [modalServicioAbierto, setModalServicioAbierto] = useState(false);
  const [servicioEnEdicion, setServicioEnEdicion] = useState(null);
  const [formDataServicio, setFormDataServicio] = useState({
    nombre: '',
    descripcion: '',
    precioBase: '',
    estado: true,
  });

  const [modalAjusteAbierto, setModalAjusteAbierto] = useState(false);
  const [productoAjuste, setProductoAjuste] = useState(null);
  const [stockFisicoReal, setStockFisicoReal] = useState('');
  const [motivoAjuste, setMotivoAjuste] = useState('');

  const [modalMovimientoManualAbierto, setModalMovimientoManualAbierto] = useState(false);
  const [tipoMovimientoManual, setTipoMovimientoManual] = useState('ENTRADA'); // 'ENTRADA' | 'SALIDA'
  const [formDataManual, setFormDataManual] = useState({
    idProducto: 1,
    cantidad: '',
    motivo: '',
  });

  const [guardando, setGuardando] = useState(false);

  // Gestión de Categorías (Tabla 13.10 Categoria)
  const [modalCategoriasAbierto, setModalCategoriasAbierto] = useState(false);
  const [categoriaEnEdicion, setCategoriaEnEdicion] = useState(null);
  const [formCategoria, setFormCategoria] = useState({
    nombre: '',
    descripcion: '',
    estado: true,
  });
  const [guardandoCategoria, setGuardandoCategoria] = useState(false);

  const abrirNuevaCategoria = () => {
    setCategoriaEnEdicion(null);
    setFormCategoria({
      nombre: '',
      descripcion: '',
      estado: true,
    });
  };

  const abrirEditarCategoria = (cat) => {
    setCategoriaEnEdicion(cat);
    setFormCategoria({
      nombre: cat.Nombre || '',
      descripcion: cat.Descripcion || '',
      estado: cat.Estado ?? true,
    });
  };

  const guardarCategoria = async (e) => {
    e.preventDefault();
    if (!formCategoria.nombre.trim()) {
      showToast('El nombre de la categoría es obligatorio', 'warning');
      return;
    }
    setGuardandoCategoria(true);
    try {
      if (categoriaEnEdicion) {
        await api.put(`/catalogos/categorias/${categoriaEnEdicion.Id_Categoria}`, {
          nombre: formCategoria.nombre.trim(),
          descripcion: formCategoria.descripcion.trim() || undefined,
          estado: Boolean(formCategoria.estado),
        });
        showToast('Categoría actualizada con éxito', 'success');
      } else {
        await api.post('/catalogos/categorias', {
          nombre: formCategoria.nombre.trim(),
          descripcion: formCategoria.descripcion.trim() || undefined,
        });
        showToast('Categoría creada con éxito', 'success');
      }
      abrirNuevaCategoria();
      cargarDatos();
    } catch (err) {
      console.error('Error guardando categoría:', err);
      showToast(err.response?.data?.message || err.response?.data?.mensaje || 'Error al procesar categoría', 'error');
    } finally {
      setGuardandoCategoria(false);
    }
  };


  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resProds, resServs, resMovs, resCats, resReorden, resAsoc, resPrvs] = await Promise.all([
        api.get('/productos/inventario'),
        api.get('/servicios'),
        api.get('/inventario/movimientos/vista'),
        api.get('/catalogos/categorias'),
        api.get('/inventario/bajo-reorden'),
        api.get('/proveedores/productos-asociados/vista'),
        api.get('/proveedores/activos'),
      ]);

      setProductos(resProds.data || []);
      setServicios(resServs.data || []);
      setMovimientos(resMovs.data || []);
      setCategorias(resCats.data || []);
      setBajoReorden(resReorden.data || []);
      setAsociacionesProveedor(resAsoc.data || []);
      setProveedoresActivos(resPrvs.data || []);
    } catch (err) {
      console.error('Error cargando datos de inventario:', err);
      showToast('Error al consultar inventario', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filtrado de Asociaciones Producto - Proveedor
  const asociacionesFiltradas = useMemo(() => {
    const term = busquedaProveedor.toLowerCase().trim();
    return asociacionesProveedor.filter((a) => {
      const coincideBusqueda =
        !term ||
        (a.Nombre_Producto && a.Nombre_Producto.toLowerCase().includes(term)) ||
        (a.Nombre_Proveedor && a.Nombre_Proveedor.toLowerCase().includes(term)) ||
        (a.Categoria && a.Categoria.toLowerCase().includes(term));
      const coincideProveedor =
        filtroProveedorSelect === 'TODOS' || String(a.Id_Proveedor) === String(filtroProveedorSelect);
      return coincideBusqueda && coincideProveedor;
    });
  }, [asociacionesProveedor, busquedaProveedor, filtroProveedorSelect]);

  const guardarAsociacion = async (e) => {
    e.preventDefault();
    if (!formAsociacion.idProducto || !formAsociacion.idProveedor || !formAsociacion.precioCompra) {
      showToast('Seleccione producto, proveedor y precio de compra', 'warning');
      return;
    }
    setGuardandoAsociacion(true);
    try {
      await api.post('/proveedores/productos-asociados', {
        idProducto: parseInt(formAsociacion.idProducto, 10),
        idProveedor: parseInt(formAsociacion.idProveedor, 10),
        precioCompra: parseFloat(formAsociacion.precioCompra),
        esPrincipal: formAsociacion.esPrincipal,
      });
      showToast('Asociación producto-proveedor guardada con éxito', 'success');
      setModalAsociarAbierto(false);
      setFormAsociacion({ idProducto: '', idProveedor: '', precioCompra: '', esPrincipal: true });
      const res = await api.get('/proveedores/productos-asociados/vista');
      setAsociacionesProveedor(res.data || []);
    } catch (err) {
      console.error('Error asociando producto:', err);
      const msg = err.response?.data?.mensaje || err.message || 'Error al guardar'; 
      showToast(`Error: ${msg}`, 'error');
    } finally {
      setGuardandoAsociacion(false);
    }
  };

  // KPIs Financieros y de Existencias
  const metricas = useMemo(() => {
    const totalProductos = productos.length;
    const totalServicios = servicios.length;
    const valorInventario = productos.reduce(
      (acc, p) => acc + Number(p.Stock_Actual || 0) * Number(p.Precio_Venta || 0),
      0
    );
    const cantBajoReorden = bajoReorden.length;
    const totalMovimientos = movimientos.length;

    return {
      totalArticulos: totalProductos + totalServicios,
      totalProductos,
      totalServicios,
      valorInventario,
      cantBajoReorden,
      totalMovimientos,
    };
  }, [productos, servicios, bajoReorden, movimientos]);

  // Filtrado de Productos
  const productosFiltrados = useMemo(() => {
    const term = busquedaProducto.toLowerCase().trim();

    return productos.filter((p) => {
      if (categoriaFiltro !== 'TODAS' && p.Categoria !== categoriaFiltro) return false;

      if (estadoStockFiltro === 'NORMAL' && (p.Stock_Actual <= p.Punto_Reorden || p.Stock_Actual === 0)) return false;
      if (estadoStockFiltro === 'REORDEN' && (p.Stock_Actual > p.Punto_Reorden || p.Stock_Actual === 0)) return false;
      if (estadoStockFiltro === 'AGOTADO' && p.Stock_Actual > 0) return false;

      if (!term) return true;
      return (
        p.Nombre.toLowerCase().includes(term) ||
        p.Categoria.toLowerCase().includes(term) ||
        p.Id_Producto.toString() === term
      );
    });
  }, [productos, busquedaProducto, categoriaFiltro, estadoStockFiltro]);

  // Filtrado de Servicios
  const serviciosFiltrados = useMemo(() => {
    const term = busquedaProducto.toLowerCase().trim();
    if (!term) return servicios;
    return servicios.filter(
      (s) =>
        s.Nombre.toLowerCase().includes(term) ||
        (s.Descripcion && s.Descripcion.toLowerCase().includes(term)) ||
        s.Id_Servicio.toString() === term
    );
  }, [servicios, busquedaProducto]);

  // Filtrado de Kárdex
  const movimientosFiltrados = useMemo(() => {
    const term = busquedaKardex.toLowerCase().trim();

    return movimientos.filter((m) => {
      if (filtroTipoMovimiento !== 'TODOS' && m.Tipo_Movimiento !== filtroTipoMovimiento) return false;

      if (!term) return true;
      return (
        m.Producto.toLowerCase().includes(term) ||
        m.Tipo_Movimiento.toLowerCase().includes(term) ||
        (m.Motivo && m.Motivo.toLowerCase().includes(term)) ||
        m.Responsable.toLowerCase().includes(term) ||
        m.Id_Movimiento_Inventario.toString() === term
      );
    });
  }, [movimientos, busquedaKardex, filtroTipoMovimiento]);

  // ================= ACCIONES PRODUCTO =================
  const abrirCrearProducto = () => {
    setProductoEnEdicion(null);
    setFormDataProducto({
      idCategoria: categorias[0]?.Id_Categoria || 1,
      nombre: '',
      descripcion: '',
      precioVenta: '',
      stockInicial: 0,
      puntoReorden: 10,
      estado: true,
    });
    setModalProductoAbierto(true);
  };

  const abrirEditarProducto = (prod) => {
    setProductoEnEdicion(prod);
    const cat = categorias.find((c) => c.Nombre === prod.Categoria);
    setFormDataProducto({
      idCategoria: cat ? cat.Id_Categoria : 1,
      nombre: prod.Nombre,
      descripcion: '',
      precioVenta: prod.Precio_Venta,
      stockInicial: prod.Stock_Actual,
      puntoReorden: prod.Punto_Reorden,
      estado: prod.Estado ?? true,
    });
    setModalProductoAbierto(true);
  };

  const guardarProducto = async (e) => {
    e.preventDefault();
    if (!formDataProducto.nombre.trim() || !formDataProducto.precioVenta) {
      showToast('Complete los campos obligatorios del producto', 'warning');
      return;
    }

    setGuardando(true);
    try {
      if (productoEnEdicion) {
        // Actualizar
        await api.put(`/productos/${productoEnEdicion.Id_Producto}`, {
          idCategoria: Number(formDataProducto.idCategoria),
          nombre: formDataProducto.nombre.trim(),
          descripcion: formDataProducto.descripcion.trim() || undefined,
          precioVenta: Number(formDataProducto.precioVenta),
          puntoReorden: Number(formDataProducto.puntoReorden),
          estado: Boolean(formDataProducto.estado),
        });
        showToast('Producto actualizado con éxito', 'success');
      } else {
        // Crear
        await api.post('/productos', {
          idCategoria: Number(formDataProducto.idCategoria),
          nombre: formDataProducto.nombre.trim(),
          descripcion: formDataProducto.descripcion.trim() || undefined,
          precioVenta: Number(formDataProducto.precioVenta),
          stockInicial: Number(formDataProducto.stockInicial || 0),
          puntoReorden: Number(formDataProducto.puntoReorden || 10),
        });
        showToast('Producto registrado exitosamente', 'success');
      }
      setModalProductoAbierto(false);
      cargarDatos();
    } catch (err) {
      console.error('Error guardando producto:', err);
      const msg = err.response?.data?.mensaje || 'Error en procedimiento de producto';
      showToast(msg, 'error');
    } finally {
      setGuardando(false);
    }
  };

  // ================= ACCIONES SERVICIO =================
  const abrirCrearServicio = () => {
    setServicioEnEdicion(null);
    setFormDataServicio({
      nombre: '',
      descripcion: '',
      precioBase: '',
      estado: true,
    });
    setModalServicioAbierto(true);
  };

  const abrirEditarServicio = (serv) => {
    setServicioEnEdicion(serv);
    setFormDataServicio({
      nombre: serv.Nombre,
      descripcion: serv.Descripcion || '',
      precioBase: serv.Precio_Base,
      estado: serv.Estado ?? true,
    });
    setModalServicioAbierto(true);
  };

  const guardarServicio = async (e) => {
    e.preventDefault();
    if (!formDataServicio.nombre.trim() || !formDataServicio.precioBase) {
      showToast('Complete el nombre y precio base del servicio', 'warning');
      return;
    }

    setGuardando(true);
    try {
      if (servicioEnEdicion) {
        await api.put(`/servicios/${servicioEnEdicion.Id_Servicio}`, {
          nombre: formDataServicio.nombre.trim(),
          descripcion: formDataServicio.descripcion.trim() || undefined,
          precioBase: Number(formDataServicio.precioBase),
          estado: Boolean(formDataServicio.estado),
        });
        showToast('Servicio actualizado con éxito', 'success');
      } else {
        await api.post('/servicios', {
          nombre: formDataServicio.nombre.trim(),
          descripcion: formDataServicio.descripcion.trim() || undefined,
          precioBase: Number(formDataServicio.precioBase),
        });
        showToast('Servicio registrado con éxito', 'success');
      }
      setModalServicioAbierto(false);
      cargarDatos();
    } catch (err) {
      console.error('Error guardando servicio:', err);
      const msg = err.response?.data?.mensaje || 'Error en SP de servicio';
      showToast(msg, 'error');
    } finally {
      setGuardando(false);
    }
  };

  // ================= AJUSTE DE STOCK (CONTEO FÍSICO) =================
  const abrirAjuste = (prod) => {
    setProductoAjuste(prod);
    setStockFisicoReal(prod.Stock_Actual.toString());
    setMotivoAjuste('Ajuste por conteo físico en bodega');
    setModalAjusteAbierto(true);
  };

  const procesarAjuste = async () => {
    const conteo = parseInt(stockFisicoReal);
    if (isNaN(conteo) || conteo < 0) {
      showToast('Ingrese un valor de stock físico real válido', 'warning');
      return;
    }
    if (!motivoAjuste.trim()) {
      showToast('Debe ingresar el motivo del ajuste', 'warning');
      return;
    }

    setGuardando(true);
    try {
      await api.post('/inventario/ajuste', {
        idProducto: productoAjuste.Id_Producto,
        stockFisicoReal: conteo,
        motivo: motivoAjuste.trim(),
      });
      showToast(`Ajuste de inventario registrado (Nuevo stock: ${conteo})`, 'success');
      setModalAjusteAbierto(false);
      cargarDatos();
    } catch (err) {
      console.error('Error en ajuste:', err);
      const msg = err.response?.data?.mensaje || 'Error en SP_Inventario_Ajustar';
      showToast(msg, 'error');
    } finally {
      setGuardando(false);
    }
  };

  // ================= ENTRADA / SALIDA MANUAL =================
  const abrirMovimientoManual = (tipo) => {
    setTipoMovimientoManual(tipo);
    setFormDataManual({
      idProducto: productos[0]?.Id_Producto || 1,
      cantidad: '',
      motivo: tipo === 'ENTRADA' ? 'Ingreso extraordinario a bodega' : 'Merma por producto dañado',
    });
    setModalMovimientoManualAbierto(true);
  };

  const procesarMovimientoManual = async () => {
    const cant = parseInt(formDataManual.cantidad);
    if (!cant || cant <= 0) {
      showToast('Ingrese una cantidad válida mayor a cero', 'warning');
      return;
    }
    if (!formDataManual.motivo.trim()) {
      showToast('Ingrese el motivo del movimiento', 'warning');
      return;
    }

    setGuardando(true);
    try {
      if (tipoMovimientoManual === 'ENTRADA') {
        await api.post('/inventario/entrada', {
          idProducto: Number(formDataManual.idProducto),
          cantidad: cant,
          motivo: formDataManual.motivo.trim(),
        });
        showToast(`Entrada de ${cant} unidades registrada con éxito`, 'success');
      } else {
        await api.post('/inventario/salida', {
          idProducto: Number(formDataManual.idProducto),
          cantidad: cant,
          motivo: formDataManual.motivo.trim(),
        });
        showToast(`Salida de ${cant} unidades registrada con éxito`, 'success');
      }
      setModalMovimientoManualAbierto(false);
      cargarDatos();
    } catch (err) {
      console.error('Error en movimiento manual:', err);
      const msg = err.response?.data?.mensaje || 'Error registrando movimiento en Kárdex';
      showToast(msg, 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Inventario */}
      <div className="bg-white rounded-2xl border border-[#DFD5C4] p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-glow-amber">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#132B20] tracking-tight flex items-center gap-2">
                Control de Inventario & Kárdex en Tiempo Real
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                  Kárdex Valorizado • Control de Existencias
                </span>
              </h2>
              <p className="text-xs text-[#5C3622]">
                Librería & Papelería Mundo Escolar • Bodega Central, Catálogo de Productos y Servicios Escolares
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
            onClick={() => abrirMovimientoManual('ENTRADA')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Entrada Stock</span>
          </button>

          <button
            onClick={() => abrirMovimientoManual('SALIDA')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Salida / Merma</span>
          </button>

          <button
            type="button"
            onClick={() => {
              abrirNuevaCategoria();
              setModalCategoriasAbierto(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#DFD5C4] hover:bg-[#FAF7F0] text-[#132B20] text-xs font-bold rounded-xl shadow-sm transition"
          >
            <Layers className="w-4 h-4 text-[#5C3622]" />
            <span>Gestionar Categorías ({categorias.length})</span>
          </button>
          <button
            onClick={abrirCrearProducto}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-[#C05A3E] to-[#D97448] hover:from-[#AA4C33] hover:to-[#C05A3E] shadow-terracotta text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Tarjetas KPI de Inventario */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#DFD5C4] p-4 shadow-sm">
          <span className="text-xs text-[#5C3622] font-medium block">Total Artículos Catálogo</span>
          <span className="text-2xl font-black text-[#132B20] mt-1 block">
            {metricas.totalArticulos}
          </span>
          <span className="text-[11px] text-[#C05A3E] font-semibold mt-1 block">
            {metricas.totalProductos} productos • {metricas.totalServicios} servicios
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#DFD5C4] p-4 shadow-sm">
          <span className="text-xs text-[#5C3622] font-medium block">Valorización en Bodega (PVP)</span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">
            ₡{metricas.valorInventario.toLocaleString('es-CR')}
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            Existencias físicas valoradas
          </span>
        </div>

        <div className={`bg-white rounded-2xl border p-4 shadow-sm ${
          metricas.cantBajoReorden > 0 ? 'border-amber-300 bg-amber-50/20' : 'border-[#DFD5C4]'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5C3622] font-medium">Bajo Punto de Reorden</span>
            {metricas.cantBajoReorden > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            )}
          </div>
          <span className={`text-2xl font-black mt-1 block ${
            metricas.cantBajoReorden > 0 ? 'text-amber-600' : 'text-[#132B20]'
          }`}>
            {metricas.cantBajoReorden} productos
          </span>
          <span className="text-[11px] text-amber-700 font-semibold mt-1 block">
            Requieren orden de compra urgente
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#DFD5C4] p-4 shadow-sm">
          <span className="text-xs text-[#5C3622] font-medium block">Movimientos Kárdex</span>
          <span className="text-2xl font-black text-indigo-700 mt-1 block">
            {metricas.totalMovimientos}
          </span>
          <span className="text-[11px] text-[#5C3622] font-medium mt-1 block">
            Trazabilidad total e inmutable
          </span>
        </div>
      </div>

      {/* Pestañas de Vista */}
      <div className="flex items-center gap-2 border-b border-[#DFD5C4] pb-2">
        <button
          onClick={() => setTabActiva('PRODUCTOS')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
            tabActiva === 'PRODUCTOS'
              ? 'bg-[#132B20] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Productos en Bodega ({productos.length})</span>
        </button>

        <button
          onClick={() => setTabActiva('SERVICIOS')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
            tabActiva === 'SERVICIOS'
              ? 'bg-[#132B20] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Servicios Escolares ({servicios.length})</span>
        </button>

        <button
          onClick={() => setTabActiva('KARDEX')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
            tabActiva === 'KARDEX'
              ? 'bg-[#132B20] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Libro Kárdex de Movimientos ({movimientos.length})</span>
        </button>
        <button
          onClick={() => setTabActiva('PROVEEDORES')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
            tabActiva === 'PROVEEDORES'
              ? 'bg-[#132B20] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Proveedores por Producto ({asociacionesProveedor.length})</span>
        </button>
      </div>

      {/* ================= TAB 1: PRODUCTOS ================= */}
      {tabActiva === 'PRODUCTOS' && (
        <div className="space-y-4">
          {/* Filtros Productos */}
          <div className="bg-white rounded-2xl border border-[#DFD5C4] p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busquedaProducto}
                onChange={(e) => setBusquedaProducto(e.target.value)}
                placeholder="Buscar por nombre de producto o ID..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Categoría */}
              <select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                className="text-xs bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl px-3 py-2 text-[#132B20] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="TODAS">Todas las Categorías</option>
                {categorias.map((c) => (
                  <option key={c.Id_Categoria} value={c.Nombre}>
                    {c.Nombre}
                  </option>
                ))}
              </select>

              {/* Estado Stock */}
              <select
                value={estadoStockFiltro}
                onChange={(e) => setEstadoStockFiltro(e.target.value)}
                className="text-xs bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl px-3 py-2 text-[#132B20] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="TODOS">Todos los Estados</option>
                <option value="NORMAL">Stock Normal</option>
                <option value="REORDEN">En / Bajo Reorden</option>
                <option value="AGOTADO">Agotados (0)</option>
              </select>
            </div>
          </div>

          {/* Tabla de Productos */}
          <div className="bg-white rounded-2xl border border-[#DFD5C4] shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <RefreshCw className="w-8 h-8 text-[#C05A3E] animate-spin mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-600">Cargando existencias de bodega...</p>
              </div>
            ) : productosFiltrados.length === 0 ? (
              <div className="p-12 text-center">
                <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#132B20]">No se encontraron productos</p>
                <p className="text-xs text-slate-400 mt-1">Intente cambiando los filtros.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F0] text-[#5C3622] uppercase tracking-wider font-bold border-b border-[#DFD5C4]">
                    <tr>
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">Producto</th>
                      <th className="py-3 px-4">Categoría</th>
                      <th className="py-3 px-4 text-right">Precio Venta</th>
                      <th className="py-3 px-4 text-center">Stock Físico</th>
                      <th className="py-3 px-4 text-center">Punto Reorden</th>
                      <th className="py-3 px-4 text-center">Disponibilidad</th>
                      <th className="py-3 px-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-[#132B20]">
                    {productosFiltrados.map((prod) => {
                      const esAgotado = prod.Stock_Actual <= 0;
                      const stockBajo = prod.Stock_Actual <= prod.Punto_Reorden && !esAgotado;

                      return (
                        <tr key={prod.Id_Producto} className="hover:bg-[#FAF7F0]/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[#5C3622]">#{prod.Id_Producto}</td>

                          <td className="py-3 px-4">
                            <span className="font-bold text-[#132B20] block">{prod.Nombre}</span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="bg-slate-100 text-[#132B20] px-2 py-0.5 rounded-md font-semibold text-[11px]">
                              {prod.Categoria}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right font-bold text-[#132B20]">
                            ₡{Number(prod.Precio_Venta).toLocaleString('es-CR')}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-black text-xs ${
                                esAgotado
                                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                  : stockBajo
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {(stockBajo || esAgotado) && (
                                <span className="relative flex h-2 w-2">
                                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${esAgotado ? 'bg-rose-400' : 'bg-amber-400'}`}></span>
                                  <span className={`relative inline-flex rounded-full h-2 w-2 ${esAgotado ? 'bg-rose-600' : 'bg-amber-600'}`}></span>
                                </span>
                              )}
                              {prod.Stock_Actual} uds
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center text-[#5C3622] font-semibold">
                            {prod.Punto_Reorden}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span
                              className={`text-[11px] font-bold ${
                                esAgotado
                                  ? 'text-rose-600'
                                  : stockBajo
                                  ? 'text-amber-600'
                                  : 'text-emerald-600'
                              }`}
                            >
                              {prod.Estado_Disponibilidad}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Ajuste de Stock */}
                              <button
                                onClick={() => abrirAjuste(prod)}
                                className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition"
                                title="Ajuste de Stock por Conteo Físico"
                              >
                                <SlidersHorizontal className="w-4 h-4" />
                              </button>

                              {/* Editar Producto */}
                              <button
                                onClick={() => abrirEditarProducto(prod)}
                                className="p-1.5 text-[#5C3622] hover:text-[#C05A3E] hover:bg-[#F3ECE0] rounded-lg transition"
                                title="Editar Producto"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
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
        </div>
      )}

      {/* ================= TAB 2: SERVICIOS ================= */}
      {tabActiva === 'SERVICIOS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#DFD5C4] p-4 shadow-sm flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busquedaProducto}
                onChange={(e) => setBusquedaProducto(e.target.value)}
                placeholder="Buscar servicio escolar por nombre..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={abrirCrearServicio}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#5C3622] hover:bg-[#4A2B1B] text-white text-xs font-bold rounded-xl shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Servicio Escolar</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {serviciosFiltrados.map((serv) => (
              <div
                key={serv.Id_Servicio}
                className="bg-white rounded-2xl border border-[#DFD5C4] p-4 shadow-sm hover:border-purple-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 border border-purple-200">
                      Servicio Escolar
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">#{serv.Id_Servicio}</span>
                  </div>

                  <h4 className="font-bold text-sm text-[#132B20]">{serv.Nombre}</h4>
                  <p className="text-xs text-[#5C3622] mt-1 line-clamp-2">
                    {serv.Descripcion || 'Sin descripción detallada.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Precio Base</span>
                    <span className="text-base font-black text-purple-900">
                      ₡{Number(serv.Precio_Base).toLocaleString('es-CR')}
                    </span>
                  </div>

                  <button
                    onClick={() => abrirEditarServicio(serv)}
                    className="p-1.5 text-[#5C3622] hover:text-[#5C3622] hover:bg-[#F3ECE0] rounded-lg transition"
                    title="Editar Servicio"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 3: LIBRO KÁRDEX ================= */}
      {tabActiva === 'KARDEX' && (
        <div className="space-y-4">
          {/* Filtros Kárdex */}
          <div className="bg-white rounded-2xl border border-[#DFD5C4] p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busquedaKardex}
                onChange={(e) => setBusquedaKardex(e.target.value)}
                placeholder="Buscar movimiento por producto, motivo o usuario..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filtroTipoMovimiento}
                onChange={(e) => setFiltroTipoMovimiento(e.target.value)}
                className="text-xs bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl px-3 py-2 text-[#132B20] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="TODOS">Todos los Movimientos</option>
                <option value="Venta">Venta (Salida)</option>
                <option value="Compra">Compra (Entrada)</option>
                <option value="Ajuste Positivo">Ajuste Positivo</option>
                <option value="Ajuste Negativo">Ajuste Negativo</option>
                <option value="Devolución">Devolución</option>
              </select>
            </div>
          </div>

          {/* Tabla Kárdex */}
          <div className="bg-white rounded-2xl border border-[#DFD5C4] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F0] text-[#5C3622] uppercase tracking-wider font-bold border-b border-[#DFD5C4]">
                  <tr>
                    <th className="py-3 px-4"># Movimiento</th>
                    <th className="py-3 px-4">Fecha y Hora</th>
                    <th className="py-3 px-4">Producto</th>
                    <th className="py-3 px-4">Tipo Movimiento</th>
                    <th className="py-3 px-4 text-center">Naturaleza</th>
                    <th className="py-3 px-4 text-right">Cantidad</th>
                    <th className="py-3 px-4">Motivo / Justificación</th>
                    <th className="py-3 px-4">Responsable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-[#132B20]">
                  {movimientosFiltrados.map((mov) => {
                    const esIngreso =
                      mov.Tipo_Movimiento === 'Compra' ||
                      mov.Tipo_Movimiento === 'Ajuste Positivo' ||
                      mov.Tipo_Movimiento === 'Devolución';

                    return (
                      <tr key={mov.Id_Movimiento_Inventario} className="hover:bg-[#FAF7F0]/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#5C3622]">
                          #{mov.Id_Movimiento_Inventario}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                          {new Date(mov.Fecha).toLocaleDateString('es-CR')}
                          <span className="block text-[10px] text-slate-400">
                            {new Date(mov.Fecha).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-bold text-[#132B20]">{mov.Producto}</td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                              mov.Tipo_Movimiento === 'Venta'
                                ? 'bg-blue-100 text-blue-800'
                                : mov.Tipo_Movimiento === 'Compra'
                                ? 'bg-emerald-100 text-emerald-800'
                                : mov.Tipo_Movimiento === 'Devolución'
                                ? 'bg-purple-100 text-purple-800'
                                : mov.Tipo_Movimiento === 'Ajuste Positivo'
                                ? 'bg-teal-100 text-teal-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {mov.Tipo_Movimiento}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center text-[#5C3622]">{mov.Naturaleza}</td>

                        <td className="py-3 px-4 text-right">
                          <span
                            className={`font-black text-sm ${
                              esIngreso ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            {esIngreso ? `+${mov.Cantidad}` : `-${mov.Cantidad}`}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={mov.Motivo}>
                          {mov.Motivo}
                        </td>

                        <td className="py-3 px-4 text-[#5C3622] font-mono text-[11px]">{mov.Responsable}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: PROVEEDORES HOMOLOGADOS (dbo.Producto_Proveedor) ================= */}
      {tabActiva === 'PROVEEDORES' && (
        <div className="space-y-4">
          {/* Barra de Filtros y Acción de Homologación */}
          <div className="bg-white rounded-2xl border border-[#DFD5C4] p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-2 w-full">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={busquedaProveedor}
                  onChange={(e) => setBusquedaProveedor(e.target.value)}
                  placeholder="Buscar por producto, categoría o proveedor homologado..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
                />
              </div>

              <select
                value={filtroProveedorSelect}
                onChange={(e) => setFiltroProveedorSelect(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46] text-slate-700"
              >
                <option value="TODOS">Todos los Proveedores</option>
                {proveedoresActivos.map((prv) => (
                  <option key={prv.Id_Proveedor} value={prv.Id_Proveedor}>
                    {prv.Nombre_Proveedor}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setModalAsociarAbierto(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#2D5E46] hover:bg-[#1E4331] text-white text-xs font-bold rounded-xl shadow-sm transition whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Homologar Producto con Proveedor</span>
            </button>
          </div>

          {/* Tabla de Asociaciones */}
          <div className="bg-white rounded-2xl border border-[#DFD5C4] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F0] text-[#5C3622] uppercase tracking-wider font-bold border-b border-[#DFD5C4]">
                  <tr>
                    <th className="py-3 px-4">Producto en Catálogo</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4">Proveedor Homologado</th>
                    <th className="py-3 px-4">Tipo Proveedor</th>
                    <th className="py-3 px-4 text-right">Costo Compra (Mayorista)</th>
                    <th className="py-3 px-4 text-right">Precio Venta (PVP)</th>
                    <th className="py-3 px-4 text-right">Margen Bruto</th>
                    <th className="py-3 px-4 text-center">Rol Proveedor</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {asociacionesFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-10 text-center text-slate-400">
                        No se encontraron homologaciones de producto-proveedor registradas.
                      </td>
                    </tr>
                  ) : (
                    asociacionesFiltradas.map((asoc) => {
                      const costo = Number(asoc.Precio_Compra || 0);
                      const venta = Number(asoc.Precio_Venta || 0);
                      const margenColones = venta - costo;
                      const margenPct = venta > 0 ? ((margenColones / venta) * 100).toFixed(1) : 0;
                      const esPrincipal = asoc.EsPrincipal === 1 || asoc.EsPrincipal === true;

                      return (
                        <tr key={asoc.Id_Producto_Proveedor} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4 font-bold text-slate-800">
                            {asoc.Nombre_Producto}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
                              {asoc.Categoria}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-[#132B20]">
                            {asoc.Nombre_Proveedor}
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-[11px]">
                            {asoc.Tipo_Proveedor}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-amber-900">
                            ₡{costo.toLocaleString('es-CR')}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-800">
                            ₡{venta.toLocaleString('es-CR')}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-bold text-emerald-700">₡{margenColones.toLocaleString('es-CR')}</span>
                            <span className="text-[10px] text-emerald-600 block">({margenPct}%)</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              esPrincipal
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {esPrincipal ? 'Principal (Prioritario)' : 'Secundario'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                              Activo
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL PRODUCTO (CREAR / EDITAR) ================= */}
      {modalProductoAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132B20]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#DFD5C4] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#132B20] text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Boxes className="w-5 h-5 text-blue-400" />
                {productoEnEdicion ? 'Editar Producto' : 'Nuevo Producto en Catálogo'}
              </h3>
              <button
                onClick={() => setModalProductoAbierto(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={guardarProducto} className="p-6 space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-[#132B20]">Categoría *</label>
                  <button
                    type="button"
                    onClick={() => {
                      abrirNuevaCategoria();
                      setModalCategoriasAbierto(true);
                    }}
                    className="text-[11px] font-bold text-[#C05A3E] hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    + Nueva Categoría
                  </button>
                </div>
                <select
                  value={formDataProducto.idCategoria}
                  onChange={(e) => setFormDataProducto({ ...formDataProducto, idCategoria: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {categorias.map((c) => (
                    <option key={c.Id_Categoria} value={c.Id_Categoria}>
                      {c.Nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#132B20] mb-1">Nombre del Producto *</label>
                <input
                  type="text"
                  value={formDataProducto.nombre}
                  onChange={(e) => setFormDataProducto({ ...formDataProducto, nombre: e.target.value })}
                  placeholder="Ej. Cuaderno Cosido 100 Hojas"
                  className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#132B20] mb-1">Descripción</label>
                <textarea
                  value={formDataProducto.descripcion}
                  onChange={(e) => setFormDataProducto({ ...formDataProducto, descripcion: e.target.value })}
                  placeholder="Especificaciones o características..."
                  rows={2}
                  className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#132B20] mb-1">Precio Venta (CRC) *</label>
                  <input
                    type="number"
                    value={formDataProducto.precioVenta}
                    onChange={(e) => setFormDataProducto({ ...formDataProducto, precioVenta: e.target.value })}
                    placeholder="Ej. 1250"
                    className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#132B20] mb-1">Punto de Reorden</label>
                  <input
                    type="number"
                    value={formDataProducto.puntoReorden}
                    onChange={(e) => setFormDataProducto({ ...formDataProducto, puntoReorden: e.target.value })}
                    placeholder="10"
                    className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
              </div>

              {!productoEnEdicion && (
                <div>
                  <label className="block font-bold text-[#132B20] mb-1">Stock Inicial en Bodega</label>
                  <input
                    type="number"
                    value={formDataProducto.stockInicial}
                    onChange={(e) => setFormDataProducto({ ...formDataProducto, stockInicial: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Se registrará automáticamente en el Kárdex como inventario inicial.
                  </p>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalProductoAbierto(false)}
                  disabled={guardando}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2 bg-gradient-to-r from-[#C05A3E] to-[#D97448] hover:from-[#AA4C33] hover:to-[#C05A3E] shadow-terracotta text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {guardando ? 'Guardando en SQL...' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL SERVICIO (CREAR / EDITAR) ================= */}
      {modalServicioAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132B20]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#DFD5C4] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-purple-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Wrench className="w-5 h-5 text-purple-300" />
                {servicioEnEdicion ? 'Editar Servicio' : 'Nuevo Servicio Escolar'}
              </h3>
              <button
                onClick={() => setModalServicioAbierto(false)}
                className="p-1 text-purple-300 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={guardarServicio} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#132B20] mb-1">Nombre del Servicio *</label>
                <input
                  type="text"
                  value={formDataServicio.nombre}
                  onChange={(e) => setFormDataServicio({ ...formDataServicio, nombre: e.target.value })}
                  placeholder="Ej. Fotocopia Carta B/N"
                  className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#132B20] mb-1">Descripción</label>
                <textarea
                  value={formDataServicio.descripcion}
                  onChange={(e) => setFormDataServicio({ ...formDataServicio, descripcion: e.target.value })}
                  placeholder="Detalles del servicio..."
                  rows={2}
                  className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-bold text-[#132B20] mb-1">Precio Base (CRC) *</label>
                <input
                  type="number"
                  value={formDataServicio.precioBase}
                  onChange={(e) => setFormDataServicio({ ...formDataServicio, precioBase: e.target.value })}
                  placeholder="Ej. 25"
                  className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalServicioAbierto(false)}
                  disabled={guardando}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2 bg-[#5C3622] hover:bg-[#4A2B1B] text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {guardando ? 'Guardando en SQL...' : 'Guardar Servicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL AJUSTE DE STOCK ================= */}
      {modalAjusteAbierto && productoAjuste && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132B20]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#DFD5C4] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-amber-600 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-white" />
                  Ajuste de Stock por Conteo Físico
                </h3>
                <p className="text-xs text-amber-100 mt-0.5">{productoAjuste.Nombre}</p>
              </div>
              <button
                onClick={() => setModalAjusteAbierto(false)}
                className="p-1 text-amber-200 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl p-3 flex justify-between items-center">
                <span className="text-slate-600 font-medium">Stock en Sistema:</span>
                <span className="font-black text-[#132B20] text-base">{productoAjuste.Stock_Actual} unidades</span>
              </div>

              <div>
                <label className="block font-bold text-[#132B20] mb-1">
                  Stock Físico Real Contado en Bodega *
                </label>
                <input
                  type="number"
                  value={stockFisicoReal}
                  onChange={(e) => setStockFisicoReal(e.target.value)}
                  min="0"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-base"
                />
              </div>

              <div>
                <label className="block font-bold text-[#132B20] mb-1">Motivo / Justificación *</label>
                <textarea
                  value={motivoAjuste}
                  onChange={(e) => setMotivoAjuste(e.target.value)}
                  placeholder="Ej. Conteo físico trimestral pasillo 2..."
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                El sistema recalculará la diferencia física e insertará automáticamente el movimiento correspondiente en el Kárdex de bodega.
              </div>
            </div>

            <div className="p-4 bg-[#FAF7F0] border-t border-[#DFD5C4] flex items-center justify-end gap-2">
              <button
                onClick={() => setModalAjusteAbierto(false)}
                disabled={guardando}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl font-semibold transition"
              >
                Cancelar
              </button>
              <button
                onClick={procesarAjuste}
                disabled={guardando}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
              >
                {guardando ? 'Ajustando en SQL...' : 'Confirmar Ajuste'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL ENTRADA / SALIDA MANUAL ================= */}
      {modalMovimientoManualAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132B20]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#DFD5C4] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div
              className={`p-5 text-white flex items-center justify-between ${
                tipoMovimientoManual === 'ENTRADA' ? 'bg-emerald-600' : 'bg-rose-600'
              }`}
            >
              <h3 className="font-bold text-base flex items-center gap-2">
                {tipoMovimientoManual === 'ENTRADA' ? (
                  <ArrowDownLeft className="w-5 h-5" />
                ) : (
                  <ArrowUpRight className="w-5 h-5" />
                )}
                {tipoMovimientoManual === 'ENTRADA'
                  ? 'Registrar Entrada Extraordinaria de Stock'
                  : 'Registrar Salida / Merma de Inventario'}
              </h3>
              <button
                onClick={() => setModalMovimientoManualAbierto(false)}
                className="p-1 text-white/80 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#132B20] mb-1">Producto *</label>
                <select
                  value={formDataManual.idProducto}
                  onChange={(e) => setFormDataManual({ ...formDataManual, idProducto: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {productos.map((p) => (
                    <option key={p.Id_Producto} value={p.Id_Producto}>
                      {p.Nombre} (Stock actual: {p.Stock_Actual})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#132B20] mb-1">Cantidad a Mover *</label>
                <input
                  type="number"
                  value={formDataManual.cantidad}
                  onChange={(e) => setFormDataManual({ ...formDataManual, cantidad: e.target.value })}
                  min="1"
                  placeholder="Ej. 10"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-[#132B20] mb-1">Motivo / Justificación *</label>
                <input
                  type="text"
                  value={formDataManual.motivo}
                  onChange={(e) => setFormDataManual({ ...formDataManual, motivo: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="p-4 bg-[#FAF7F0] border-t border-[#DFD5C4] flex items-center justify-end gap-2">
              <button
                onClick={() => setModalMovimientoManualAbierto(false)}
                disabled={guardando}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl font-semibold transition"
              >
                Cancelar
              </button>
              <button
                onClick={procesarMovimientoManual}
                disabled={guardando}
                className={`px-5 py-2 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 ${
                  tipoMovimientoManual === 'ENTRADA'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {guardando ? 'Registrando en Kárdex...' : 'Confirmar Movimiento'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ================= MODAL GESTIÓN DE CATEGORÍAS (TABLA 13.10) ================= */}
      {modalCategoriasAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132B20]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-[#DFD5C4] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#132B20] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Gestión de Categorías de Inventario</h3>
                  <p className="text-xs text-slate-300">
                    Catálogo oficial de clasificación de productos y suministros (Tabla 13.10 Categoria)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalCategoriasAbierto(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Formulario de Alta / Edición de Categoría */}
              <div className="bg-[#FAF7F0] border border-[#DFD5C4] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-sm text-[#132B20] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    {categoriaEnEdicion ? `Editar Categoría #${categoriaEnEdicion.Id_Categoria}` : 'Crear Nueva Categoría'}
                  </h4>
                  {categoriaEnEdicion && (
                    <button
                      type="button"
                      onClick={abrirNuevaCategoria}
                      className="text-xs text-[#C05A3E] font-semibold hover:underline"
                    >
                      Cancelar Edición (Crear Nueva)
                    </button>
                  )}
                </div>

                <form onSubmit={guardarCategoria} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <label className="block font-bold text-[#132B20] mb-1">
                        Nombre (max 20 car.) *
                      </label>
                      <input
                        type="text"
                        maxLength={20}
                        value={formCategoria.nombre}
                        onChange={(e) => setFormCategoria({ ...formCategoria, nombre: e.target.value })}
                        placeholder="Ej. Cuadernos"
                        className="w-full px-3 py-2 bg-white border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46] font-bold"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-bold text-[#132B20] mb-1">
                        Descripción (max 150 car.)
                      </label>
                      <input
                        type="text"
                        maxLength={150}
                        value={formCategoria.descripcion}
                        onChange={(e) => setFormCategoria({ ...formCategoria, descripcion: e.target.value })}
                        placeholder="Ej. Cuadernos cosidos, espiral, universitarios y de dibujo"
                        className="w-full px-3 py-2 bg-white border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
                      />
                    </div>
                  </div>

                  {categoriaEnEdicion && (
                    <div className="w-48">
                      <label className="block font-bold text-[#132B20] mb-1">Estado</label>
                      <select
                        value={formCategoria.estado ? '1' : '0'}
                        onChange={(e) => setFormCategoria({ ...formCategoria, estado: e.target.value === '1' })}
                        className="w-full px-3 py-1.5 bg-white border border-[#DFD5C4] rounded-xl font-semibold"
                      >
                        <option value="1">Activa (Visible)</option>
                        <option value="0">Inactiva (Oculta)</option>
                      </select>
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={guardandoCategoria}
                      className="px-4 py-2 bg-[#132B20] hover:bg-[#1A3D2F] text-white font-bold rounded-xl shadow-sm transition disabled:opacity-50"
                    >
                      {guardandoCategoria
                        ? 'Guardando...'
                        : categoriaEnEdicion
                        ? 'Actualizar Categoría'
                        : 'Guardar Categoría'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Listado de Categorías Existentes */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#5C3622] mb-2">
                  Categorías en Base de Datos ({categorias.length})
                </h4>
                <div className="border border-[#DFD5C4] rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-[#FAF7F0] text-[#5C3622] font-bold border-b border-[#DFD5C4] text-[11px] uppercase">
                      <tr>
                        <th className="py-2.5 px-3">ID</th>
                        <th className="py-2.5 px-3">Nombre</th>
                        <th className="py-2.5 px-3">Descripción</th>
                        <th className="py-2.5 px-3">Estado</th>
                        <th className="py-2.5 px-3 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-[#132B20]">
                      {categorias.map((cat) => (
                        <tr key={cat.Id_Categoria} className="hover:bg-[#FAF7F0]/80 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-[#5C3622]">
                            #{cat.Id_Categoria}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-[#132B20] whitespace-nowrap">
                            {cat.Nombre}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={cat.Descripcion}>
                            {cat.Descripcion || <span className="italic text-slate-400">Sin descripción</span>}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                cat.Estado !== false
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-800 border border-rose-200'
                              }`}
                            >
                              {cat.Estado !== false ? 'Activa' : 'Inactiva'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => abrirEditarCategoria(cat)}
                              className="p-1.5 text-slate-500 hover:text-[#132B20] hover:bg-slate-100 rounded-lg transition"
                              title="Editar Categoría"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#FAF7F0] border-t border-[#DFD5C4] flex justify-end">
              <button
                onClick={() => setModalCategoriasAbierto(false)}
                className="px-4 py-2 bg-[#132B20] text-white font-bold rounded-xl text-xs hover:bg-[#1A3D2F] transition"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ================= MODAL ASOCIAR PRODUCTO CON PROVEEDOR ================= */}
      {modalAsociarAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132B20]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#DFD5C4] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#132B20] text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <span>Homologar Producto con Proveedor</span>
              </h3>
              <button
                onClick={() => setModalAsociarAbierto(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={guardarAsociacion} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Producto en Catálogo *</label>
                <select
                  value={formAsociacion.idProducto}
                  onChange={(e) => setFormAsociacion({ ...formAsociacion, idProducto: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
                >
                  <option value="">Seleccione un producto...</option>
                  {productos.map((prod) => (
                    <option key={prod.Id_Producto} value={prod.Id_Producto}>
                      {prod.Nombre} ({prod.Categoria})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Proveedor Distribuidor *</label>
                <select
                  value={formAsociacion.idProveedor}
                  onChange={(e) => setFormAsociacion({ ...formAsociacion, idProveedor: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
                >
                  <option value="">Seleccione un proveedor...</option>
                  {proveedoresActivos.map((prv) => (
                    <option key={prv.Id_Proveedor} value={prv.Id_Proveedor}>
                      {prv.Nombre_Proveedor} ({prv.Tipo_Proveedor})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Precio de Compra Mayorista (₡) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formAsociacion.precioCompra}
                  onChange={(e) => setFormAsociacion({ ...formAsociacion, precioCompra: e.target.value })}
                  placeholder="Ej. 850.00"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Costo de adquisición que se utilizará para órdenes de compra y cálculo de rentabilidad.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="checkEsPrincipal"
                  checked={formAsociacion.esPrincipal}
                  onChange={(e) => setFormAsociacion({ ...formAsociacion, esPrincipal: e.target.checked })}
                  className="w-4 h-4 text-[#2D5E46] rounded focus:ring-[#2D5E46]"
                />
                <label htmlFor="checkEsPrincipal" className="font-semibold text-slate-700 select-none">
                  Designar como Proveedor Principal (Prioritario para Reabastecimiento)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalAsociarAbierto(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoAsociacion}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#2D5E46] hover:bg-[#1E4331] text-white font-bold rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {guardandoAsociacion ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Guardar Homologación</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

