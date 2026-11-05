import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
  ArrowRight,
  Edit2,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  ShoppingCart,
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
  // Propuesta 1: Asistente Inteligente de Reabastecimiento (Smart Procurement)
  const [sugerenciasReabastecimiento, setSugerenciasReabastecimiento] = useState([]);
  const [modalSugerenciasAbierto, setModalSugerenciasAbierto] = useState(false);
  const [generandoOrdenes, setGenerandoOrdenes] = useState(false);
  const [cantidadesEditables, setCantidadesEditables] = useState({});

  // Modales
  const [modalNuevaCompraAbierto, setModalNuevaCompraAbierto] = useState(false);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  const [compraSeleccionada, setCompraSeleccionada] = useState(null);

  useEffect(() => {
    if (modalDetalleAbierto) {
      document.body.classList.add('imprimiendo-modal');
      return () => document.body.classList.remove('imprimiendo-modal');
    }
  }, [modalDetalleAbierto]);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const [modalAnulacionAbierto, setModalAnulacionAbierto] = useState(false);
  const [modalRecepcionAbierto, setModalRecepcionAbierto] = useState(false);
  const [compraAAnular, setCompraAAnular] = useState(null);
  const [compraARecepcionar, setCompraARecepcionar] = useState(null);
  const [fechaRecepcionReal, setFechaRecepcionReal] = useState('');
  const [motivoAnulacion, setMotivoAnulacion] = useState('');

  const [modalProveedoresAbierto, setModalProveedoresAbierto] = useState(false);

  // Gestión y Registro de Proveedores (Tablas 13.12, 13.13, 13.14)
  const [filtroProveedor, setFiltroProveedor] = useState('');
  const [modalCrearProveedorAbierto, setModalCrearProveedorAbierto] = useState(false);
  const [tipoNuevoProveedor, setTipoNuevoProveedor] = useState('institucional'); // 'institucional' | 'particular'
  const [consultandoPadron, setConsultandoPadron] = useState(false);

  const [formProveedorParticular, setFormProveedorParticular] = useState({
    identificacion: '',
    nombre: '',
    apellido1: '',
    apellido2: '',
    correo: '',
    telefono: '',
    direccion: '',
  });

  const [formProveedorInstitucional, setFormProveedorInstitucional] = useState({
    cedulaJuridica: '',
    razonSocial: '',
    nombreContacto: '',
    telefonoContacto: '',
    correoContacto: '',
    correo: '',
    telefono: '',
    direccion: '',
  });

  const [modalEditarProveedorAbierto, setModalEditarProveedorAbierto] = useState(false);
  const [proveedorAEditar, setProveedorAEditar] = useState(null);
  const [formEditarProveedor, setFormEditarProveedor] = useState({
    nombre: '',
    apellido1: '',
    apellido2: '',
    razonSocial: '',
    nombreContacto: '',
    telefonoContacto: '',
    correoContacto: '',
    correo: '',
    telefono: '',
    direccion: '',
    estado: true,
  });

  // Consulta automática TSE para Proveedor Particular (9 dígitos)
  const consultarTseProveedor = async (cedulaParam) => {
    const cedula = (cedulaParam || formProveedorParticular.identificacion || '').trim();
    const limpia = cedula.replace(/\D/g, '');
    if (!limpia || limpia.length < 8) {
      showToast('Digita al menos 9 dígitos de la cédula para consultar el padrón del TSE', 'warning');
      return;
    }
    setConsultandoPadron(true);
    try {
      const res = await api.get(`/clientes/tse/${limpia}`);
      if (res.data?.encontrado) {
        setFormProveedorParticular((prev) => ({
          ...prev,
          identificacion: res.data.identificacionFormateada || prev.identificacion,
          nombre: res.data.nombre || prev.nombre,
          apellido1: res.data.apellido1 || prev.apellido1,
          apellido2: res.data.apellido2 || prev.apellido2,
        }));
        showToast(`¡TSE Verificado! ${res.data.nombreCompleto}`, 'success');
      } else {
        showToast(res.data?.mensaje || 'Cédula no localizada en el padrón del TSE', 'warning');
      }
    } catch (err) {
      console.error('Error consultando TSE:', err);
      showToast('Error de comunicación con el servicio TSE', 'error');
    } finally {
      setConsultandoPadron(false);
    }
  };

  // Consulta automática Hacienda para Proveedor Institucional (10 dígitos)
  const consultarHaciendaProveedor = async (cedulaParam) => {
    const cedula = (cedulaParam || formProveedorInstitucional.cedulaJuridica || '').trim();
    const limpia = cedula.replace(/\D/g, '');
    if (!limpia || limpia.length < 9) {
      showToast('Digita los 10 dígitos de la cédula jurídica para consultar Tributación Directa', 'warning');
      return;
    }
    setConsultandoPadron(true);
    try {
      const res = await api.get(`/clientes/tse/${limpia}`);
      if (res.data?.encontrado) {
        setFormProveedorInstitucional((prev) => ({
          ...prev,
          cedulaJuridica: res.data.cedulaJuridica || prev.cedulaJuridica,
          razonSocial: res.data.razonSocial || prev.razonSocial,
        }));
        showToast(`¡Hacienda Verificado! ${res.data.razonSocial}`, 'success');
      } else {
        showToast(res.data?.mensaje || 'Cédula jurídica no localizada en Tributación', 'warning');
      }
    } catch (err) {
      console.error('Error consultando Hacienda:', err);
      showToast('Error de comunicación con el servicio de Hacienda', 'error');
    } finally {
      setConsultandoPadron(false);
    }
  };

  const abrirCrearProveedor = (tipo = 'institucional') => {
    setTipoNuevoProveedor(tipo);
    setFormProveedorParticular({
      identificacion: '',
      nombre: '',
      apellido1: '',
      apellido2: '',
      correo: '',
      telefono: '',
      direccion: '',
    });
    setFormProveedorInstitucional({
      cedulaJuridica: '',
      razonSocial: '',
      nombreContacto: '',
      telefonoContacto: '',
      correoContacto: '',
      correo: '',
      telefono: '',
      direccion: '',
    });
    setModalCrearProveedorAbierto(true);
  };

  const guardarNuevoProveedor = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      if (tipoNuevoProveedor === 'particular') {
        if (!formProveedorParticular.identificacion.trim() || !formProveedorParticular.nombre.trim() || !formProveedorParticular.correo.trim()) {
          showToast('Complete identificación, nombre y correo del proveedor', 'warning');
          setGuardando(false);
          return;
        }
        await api.post('/proveedores/particular', {
          identificacion: formProveedorParticular.identificacion.trim(),
          nombre: formProveedorParticular.nombre.trim(),
          apellido1: formProveedorParticular.apellido1.trim() || 'N/A',
          apellido2: formProveedorParticular.apellido2.trim() || undefined,
          correo: formProveedorParticular.correo.trim(),
          telefono: formProveedorParticular.telefono.trim() || '2666-0000',
          direccion: formProveedorParticular.direccion.trim() || 'Liberia, Guanacaste',
        });
      } else {
        if (!formProveedorInstitucional.cedulaJuridica.trim() || !formProveedorInstitucional.razonSocial.trim() || !formProveedorInstitucional.correo.trim()) {
          showToast('Complete cédula jurídica, razón social y correo del proveedor', 'warning');
          setGuardando(false);
          return;
        }
        await api.post('/proveedores/institucional', {
          cedulaJuridica: formProveedorInstitucional.cedulaJuridica.trim(),
          razonSocial: formProveedorInstitucional.razonSocial.trim(),
          nombreContacto: formProveedorInstitucional.nombreContacto.trim() || 'Encargado de Ventas',
          telefonoContacto: formProveedorInstitucional.telefonoContacto.trim() || '2666-0000',
          correoContacto: formProveedorInstitucional.correoContacto.trim() || formProveedorInstitucional.correo.trim(),
          correo: formProveedorInstitucional.correo.trim(),
          telefono: formProveedorInstitucional.telefono.trim() || '2666-0000',
          direccion: formProveedorInstitucional.direccion.trim() || 'Liberia, Guanacaste',
        });
      }
      showToast('Proveedor registrado exitosamente en 3FN', 'success');
      setModalCrearProveedorAbierto(false);
      cargarDatos();
    } catch (err) {
      console.error('Error registrando proveedor:', err);
      showToast(err.response?.data?.message || err.response?.data?.mensaje || 'Error al registrar proveedor', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const abrirEditarProveedor = (prov) => {
    setProveedorAEditar(prov);
    setFormEditarProveedor({
      nombre: prov.Nombre || '',
      apellido1: prov.Apellido1 || '',
      apellido2: prov.Apellido2 || '',
      razonSocial: prov.Razon_Social || prov.Nombre_O_RazonSocial || '',
      nombreContacto: prov.Nombre_Contacto || '',
      telefonoContacto: prov.Telefono_Contacto || '',
      correoContacto: prov.Correo_Contacto || '',
      correo: prov.Correo || prov.Correo_Contacto || '',
      telefono: prov.Telefono || prov.Telefono_Contacto || '',
      direccion: prov.Direccion || '',
      estado: prov.Estado ?? true,
    });
    setModalEditarProveedorAbierto(true);
  };

  const guardarEdicionProveedor = async (e) => {
    e.preventDefault();
    if (!proveedorAEditar) return;
    setGuardando(true);
    try {
      const payload = {
        correo: formEditarProveedor.correo.trim(),
        telefono: formEditarProveedor.telefono.trim(),
        direccion: formEditarProveedor.direccion.trim(),
        estado: Boolean(formEditarProveedor.estado),
      };
      if (proveedorAEditar.Tipo_Proveedor === 'Particular') {
        payload.nombre = formEditarProveedor.nombre.trim() || undefined;
        payload.apellido1 = formEditarProveedor.apellido1.trim() || undefined;
        payload.apellido2 = formEditarProveedor.apellido2.trim() || undefined;
      } else {
        payload.razonSocial = formEditarProveedor.razonSocial.trim() || undefined;
        payload.nombreContacto = formEditarProveedor.nombreContacto.trim() || undefined;
        payload.telefonoContacto = formEditarProveedor.telefonoContacto.trim() || undefined;
        payload.correoContacto = formEditarProveedor.correoContacto.trim() || undefined;
      }

      await api.put(`/proveedores/${proveedorAEditar.Id_Proveedor}`, payload);
      showToast('Proveedor actualizado con éxito', 'success');
      setModalEditarProveedorAbierto(false);
      cargarDatos();
    } catch (err) {
      console.error('Error actualizando proveedor:', err);
      showToast(err.response?.data?.message || err.response?.data?.mensaje || 'Error al actualizar proveedor', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const proveedoresFiltrados = useMemo(() => {
    if (!filtroProveedor.trim()) return proveedores;
    const q = filtroProveedor.toLowerCase().trim();
    return proveedores.filter(
      (p) =>
        (p.Nombre_O_RazonSocial || '').toLowerCase().includes(q) ||
        (p.Numero_Identificacion || '').toLowerCase().includes(q) ||
        (p.Nombre_Contacto || '').toLowerCase().includes(q) ||
        (p.Correo || '').toLowerCase().includes(q) ||
        (p.Correo_Contacto || '').toLowerCase().includes(q),
    );
  }, [proveedores, filtroProveedor]);


  // Formulario Nueva Orden de Compra
  const [proveedorSeleccionadoId, setProveedorSeleccionadoId] = useState(1);
  const [lineasCompra, setLineasCompra] = useState([]);
  const [prodActualId, setProdActualId] = useState(1);
  const [cantidadActual, setCantidadActual] = useState(10);
  const [costoActual, setCostoActual] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Búsqueda y filtrado de productos en modal de nueva orden
  const [homologaciones, setHomologaciones] = useState([]);
  const [busquedaProdModal, setBusquedaProdModal] = useState('');
  const [filtroSoloHomologados, setFiltroSoloHomologados] = useState(false);
  const [filtroCategoriaModal, setFiltroCategoriaModal] = useState('TODAS');

  const categoriasProductos = useMemo(() => {
    const cats = new Set(productos.map((p) => p.Categoria).filter(Boolean));
    return Array.from(cats);
  }, [productos]);

  const productosFiltradosModal = useMemo(() => {
    return productos.filter((p) => {
      const term = (busquedaProdModal || '').toLowerCase().trim();
      const coincideBusqueda =
        !term ||
        (p.Nombre && p.Nombre.toLowerCase().includes(term)) ||
        (p.Id_Producto && p.Id_Producto.toString().includes(term)) ||
        (p.Categoria && p.Categoria.toLowerCase().includes(term));

      const coincideCategoria =
        filtroCategoriaModal === 'TODAS' || p.Categoria === filtroCategoriaModal;

      const esHomologado = homologaciones.some(
        (h) => h.Id_Producto === p.Id_Producto && h.Id_Proveedor === proveedorSeleccionadoId,
      );
      const coincideProveedor = !filtroSoloHomologados || esHomologado;

      return coincideBusqueda && coincideCategoria && coincideProveedor;
    });
  }, [productos, busquedaProdModal, filtroCategoriaModal, filtroSoloHomologados, homologaciones, proveedorSeleccionadoId]);

  const seleccionarProducto = (id) => {
    const numId = parseInt(id);
    setProdActualId(numId);
    const prod = productos.find((p) => p.Id_Producto === numId);
    if (!prod) return;

    const asoc = homologaciones.find(
      (h) => h.Id_Producto === numId && h.Id_Proveedor === proveedorSeleccionadoId,
    );
    if (asoc && asoc.Precio_Compra) {
      setCostoActual(Number(asoc.Precio_Compra).toString());
    } else {
      setCostoActual(Math.round(prod.Precio_Venta * 0.7).toString());
    }
  };

  const abrirNuevaCompra = () => {
    setLineasCompra([]);
    setBusquedaProdModal('');
    setFiltroCategoriaModal('TODAS');
    setFiltroSoloHomologados(false);
    setModalNuevaCompraAbierto(true);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resCompras, resProvs, resProds, resSugerencias, resHomologaciones] = await Promise.all([
        api.get('/compras'),
        api.get('/proveedores/activos'),
        api.get('/productos/inventario'),
        api.get('/compras/reabastecimiento/sugerencias'),
        api.get('/proveedores/productos-asociados/vista'),
      ]);

      setCompras(resCompras.data || []);
      setProveedores(resProvs.data || []);
      setProductos(resProds.data || []);
      setSugerenciasReabastecimiento(resSugerencias.data || []);
      setHomologaciones(resHomologaciones.data || []);

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

  // Cálculos de Smart Procurement
  const totalInversionSugerida = useMemo(() => {
    return sugerenciasReabastecimiento.reduce((acc, it) => {
      const cant = cantidadesEditables[it.Id_Producto] !== undefined ? cantidadesEditables[it.Id_Producto] : it.Cantidad_Sugerida;
      return acc + (Number(cant || 0) * Number(it.Costo_Unitario || 0));
    }, 0);
  }, [sugerenciasReabastecimiento, cantidadesEditables]);

  const sugerenciasPorProveedor = useMemo(() => {
    const grupos = {};
    for (const it of sugerenciasReabastecimiento) {
      if (!grupos[it.Id_Proveedor]) {
        grupos[it.Id_Proveedor] = {
          idProveedor: it.Id_Proveedor,
          nombreProveedor: it.Nombre_Proveedor,
          tipoProveedor: it.Tipo_Proveedor,
          telefono: it.Telefono_Contacto,
          correo: it.Correo_Contacto,
          items: [],
        };
      }
      grupos[it.Id_Proveedor].items.push(it);
    }
    return Object.values(grupos);
  }, [sugerenciasReabastecimiento]);

  const emitirOrdenesSugeridas = async () => {
    setGenerandoOrdenes(true);
    try {
      const grupos = {};
      for (const s of sugerenciasReabastecimiento) {
        const cant = cantidadesEditables[s.Id_Producto] !== undefined ? cantidadesEditables[s.Id_Producto] : s.Cantidad_Sugerida;
        if (Number(cant) <= 0) continue;
        if (!grupos[s.Id_Proveedor]) {
          grupos[s.Id_Proveedor] = {
            idProveedor: s.Id_Proveedor,
            items: [],
          };
        }
        grupos[s.Id_Proveedor].items.push({
          idProducto: s.Id_Producto,
          cantidad: parseInt(cant, 10),
          costoUnitario: Number(s.Costo_Unitario),
        });
      }
      const ordenes = Object.values(grupos);
      if (!ordenes.length) {
        showToast('No hay cantidades para emitir órdenes', 'warning');
        return;
      }
      const res = await api.post('/compras/reabastecimiento/generar-ordenes', { ordenes });
      showToast(`${res.data.mensaje} (${res.data.totalOrdenes} órdenes generadas)`, 'success');
      setModalSugerenciasAbierto(false);
      setCantidadesEditables({});
      cargarDatos();
    } catch (err) {
      console.error('Error generando órdenes:', err);
      showToast('Error al emitir órdenes de compra automáticas', 'error');
    } finally {
      setGenerandoOrdenes(false);
    }
  };

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
  const abrirRecepcion = (compra) => {
    setCompraARecepcionar(compra);
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const localNow = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setFechaRecepcionReal(localNow);
    setModalRecepcionAbierto(true);
  };

  const recepcionarCompra = (compra) => {
    abrirRecepcion(compra);
  };

  const procesarRecepcion = async () => {
    if (!compraARecepcionar) return;

    setGuardando(true);
    try {
      await api.post(`/compras/${compraARecepcionar.Id_Compra}/confirmar`, {
        fechaRecepcion: fechaRecepcionReal ? fechaRecepcionReal.replace('T', ' ') : undefined,
      });
      showToast(`¡Orden #${compraARecepcionar.Id_Compra} recepcionada y existencias ingresadas a bodega con éxito!`, 'success');
      setModalRecepcionAbierto(false);
      setCompraARecepcionar(null);
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
            onClick={abrirNuevaCompra}
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

      {/* Banner Inteligente de Reabastecimiento Automático (Propuesta 1 - Smart Procurement) */}
      {sugerenciasReabastecimiento.length > 0 ? (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-[#132B20]">
                  Asistente Inteligente de Reabastecimiento Automático (Smart Procurement)
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-300">
                  {sugerenciasReabastecimiento.length} producto(s) en riesgo de quiebre
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Existencias bajo punto de reorden asignadas a proveedores preferentes en dbo.Producto_Proveedor. Inversión estimada: <strong className="text-emerald-700 font-bold">₡{totalInversionSugerida.toLocaleString('es-CR')}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setModalSugerenciasAbierto(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#2D5E46] hover:bg-[#1E4331] text-white text-xs font-bold rounded-xl shadow-md transition whitespace-nowrap active:scale-95"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Ver Sugerencias &bull; Emitir en 1 Clic</span>
          </button>
        </div>
      ) : (
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between text-xs text-emerald-800 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-bold">Inventario en Niveles Óptimos:</span>
            <span>Todos los productos superan el punto de reorden con stock de seguridad adecuado.</span>
          </div>
          <span className="text-[10px] uppercase font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
            Cadena de Suministro OK
          </span>
        </div>
      )}

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
                              onClick={() => abrirRecepcion(compra)}
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-200/60 pb-2">
                  <h4 className="font-bold text-teal-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-teal-700" />
                    <span>Agregar Artículo a la Orden</span>
                  </h4>
                  <div className="text-[11px] text-teal-800 font-semibold bg-teal-100/70 px-2 py-0.5 rounded-md">
                    {productosFiltradosModal.length} de {productos.length} producto(s) disponibles
                  </div>
                </div>

                {/* Barra de Búsqueda y Filtros de Productos */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-white/80 p-2.5 rounded-xl border border-teal-200/80 shadow-xs">
                  {/* Buscador de texto con icono */}
                  <div className="sm:col-span-6 relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={busquedaProdModal}
                      onChange={(e) => setBusquedaProdModal(e.target.value)}
                      placeholder="Buscar producto por nombre o ID..."
                      className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                    />
                    {busquedaProdModal && (
                      <button
                        type="button"
                        onClick={() => setBusquedaProdModal('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                        title="Limpiar búsqueda"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Filtro por Categoría */}
                  <div className="sm:col-span-3">
                    <select
                      value={filtroCategoriaModal}
                      onChange={(e) => setFiltroCategoriaModal(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700 font-medium"
                    >
                      <option value="TODAS">Todas las categorías</option>
                      {categoriasProductos.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Checkbox para filtrar solo por el proveedor seleccionado */}
                  <div className="sm:col-span-3 flex items-center pl-1">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-teal-900 select-none">
                      <input
                        type="checkbox"
                        checked={filtroSoloHomologados}
                        onChange={(e) => setFiltroSoloHomologados(e.target.checked)}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                      />
                      <span>Solo de este proveedor</span>
                    </label>
                  </div>
                </div>

                {/* Fila de Selección de Producto, Cantidad, Costo y Acción */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-6">
                    <label className="block font-medium text-slate-600 mb-1">
                      Producto {productosFiltradosModal.length === 0 && <span className="text-rose-600 font-bold text-[11px]">(Sin coincidencias)</span>}
                    </label>
                    <select
                      value={prodActualId}
                      onChange={(e) => seleccionarProducto(e.target.value)}
                      disabled={productosFiltradosModal.length === 0}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      {productosFiltradosModal.length === 0 ? (
                        <option value="">No hay productos con los filtros aplicados</option>
                      ) : (
                        productosFiltradosModal.map((p) => {
                          const asoc = homologaciones.find(
                            (h) => h.Id_Producto === p.Id_Producto && h.Id_Proveedor === proveedorSeleccionadoId,
                          );
                          const esBajoReorden = p.Stock_Actual <= p.Punto_Reorden;
                          return (
                            <option key={p.Id_Producto} value={p.Id_Producto}>
                              {p.Nombre} (Stock: {p.Stock_Actual}) {esBajoReorden ? '⚠️ Bajo Reorden' : ''} {asoc ? '⭐ Pactado' : ''}
                            </option>
                          );
                        })
                      )}
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
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-medium text-slate-600">Costo Unit. (CRC)</label>
                      {homologaciones.some(
                        (h) => h.Id_Producto === parseInt(prodActualId) && h.Id_Proveedor === proveedorSeleccionadoId,
                      ) ? (
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1 rounded">⭐ Pactado</span>
                      ) : (
                        <span className="text-[10px] text-slate-400">70% PVP</span>
                      )}
                    </div>
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
                      disabled={productosFiltradosModal.length === 0}
                      className="w-full py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg flex items-center justify-center shadow-sm font-bold transition"
                      title="Agregar producto a la orden"
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

      {/* ================= MODAL DETALLE DE COMPRA / COMPROBANTE OFICIAL ================= */}
      {modalDetalleAbierto && compraSeleccionada && createPortal((() => {
        const prov = compraSeleccionada?.proveedorInfo || {};
        const log = compraSeleccionada?.logistica || {};
        const leadTimePactado = prov.Lead_Time_Pactado_Dias || (compraSeleccionada?.Id_Proveedor === 2 ? 7 : 3);

        const fechaDespacho = compraSeleccionada?.Fecha_Compra ? new Date(compraSeleccionada.Fecha_Compra) : null;

        let fechaPrometida = log.Fecha_Prometida ? new Date(log.Fecha_Prometida) : null;
        if (!fechaPrometida && fechaDespacho) {
          fechaPrometida = new Date(fechaDespacho.getTime() + leadTimePactado * 24 * 60 * 60 * 1000);
        }

        const fechaRecepcion = log.Fecha_Recepcion_Real ? new Date(log.Fecha_Recepcion_Real) : null;

        let diasDiferencia = (log.Dias_Tardanza_Entrega !== undefined && log.Dias_Tardanza_Entrega !== null)
          ? log.Dias_Tardanza_Entrega
          : null;
        if (diasDiferencia === null && fechaRecepcion && fechaPrometida) {
          const dProm = new Date(fechaPrometida.getFullYear(), fechaPrometida.getMonth(), fechaPrometida.getDate());
          const dRec = new Date(fechaRecepcion.getFullYear(), fechaRecepcion.getMonth(), fechaRecepcion.getDate());
          diasDiferencia = Math.round((dRec - dProm) / (1000 * 60 * 60 * 24));
        }

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#132B20]/65 backdrop-blur-sm p-4 overflow-y-auto"
            onClick={(e) => { if (e.target === e.currentTarget) setModalDetalleAbierto(false); }}
          >
            <div className="bg-white rounded-2xl max-w-3xl w-full my-auto shadow-2xl border border-[#DFD5C4] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
              {/* Barra superior de control (no imprimible) */}
              <div className="bg-[#132B20] text-white p-4 flex items-center justify-between no-print">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-teal-400" />
                  <span className="font-bold text-sm">
                    Comprobante Oficial • Orden OC-{compraSeleccionada?.Id_Compra?.toString().padStart(8, '0')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir Comprobante</span>
                  </button>
                  <button
                    onClick={() => setModalDetalleAbierto(false)}
                    className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Contenedor del Comprobante (Imprimible y visual) */}
              <div id="comprobante-impresion" className="p-6 md:p-8 space-y-4 bg-white text-slate-800 text-xs">
                {cargandoDetalle ? (
                  <div className="py-12 text-center">
                    <RefreshCw className="w-7 h-7 text-teal-600 animate-spin mx-auto mb-2" />
                    <p className="text-slate-600 font-semibold">Cargando datos completos del comprobante...</p>
                  </div>
                ) : (
                  <>
                    {/* Encabezado Corporativo Oficial */}
                    <div className="border-b-2 border-slate-800 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-[#132B20] text-white rounded-lg font-black text-xs">ME</span>
                          <div>
                            <h2 className="text-sm font-black text-[#132B20] uppercase tracking-wide">
                              Librería & Papelería Mundo Escolar
                            </h2>
                            <p className="text-[10.5px] text-slate-500 font-medium">
                              Cédula Jurídica: 3-101-778899 • Sucursal Central • Alajuela, Costa Rica
                            </p>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Tel: +506 2440-1234 • Email: compras@mundoescolar.cr • Sistema Integral de Abastecimiento
                        </p>
                      </div>

                      <div className="text-left sm:text-right bg-[#FAF7F0] p-2.5 rounded-xl border border-[#DFD5C4] min-w-[210px]">
                        <span className="text-[9.5px] uppercase tracking-wider font-extrabold text-[#5C3622] block">
                          Comprobante Oficial de Compra
                        </span>
                        <span className="font-mono font-black text-base text-[#132B20] block mt-0.5">
                          OC-{compraSeleccionada?.Id_Compra?.toString().padStart(8, '0')}
                        </span>
                        <div className="mt-1">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            compraSeleccionada?.Estado_Compra === 'Recibida'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : compraSeleccionada?.Estado_Compra === 'Anulada'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {compraSeleccionada?.Estado_Compra === 'Recibida' ? '● Recibida en Bodega' : compraSeleccionada?.Estado_Compra === 'Pendiente' ? '⏳ Pendiente de Recepción' : '✕ Anulada'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Fila Informativa: Proveedor y Emisión */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Tarjeta Proveedor */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                        <div className="flex items-center gap-1.5 text-teal-800 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 pb-1">
                          <Building className="w-3.5 h-3.5" />
                          <span>Información del Proveedor</span>
                        </div>
                        <p className="text-xs font-black text-slate-900 pt-0.5">
                          {prov.Nombre_O_RazonSocial || compraSeleccionada?.Proveedor || 'Proveedor Homologado'}
                        </p>
                        <div className="text-[11px] text-slate-600 space-y-0.5">
                          <p><strong className="font-semibold text-slate-700">Identificación:</strong> {prov.Numero_Identificacion || 'N/D'} ({prov.Tipo_Proveedor || compraSeleccionada?.Tipo_Proveedor || 'Comercial'})</p>
                          {prov.Telefono_Contacto && <p><strong className="font-semibold text-slate-700">Teléfono:</strong> {prov.Telefono_Contacto}</p>}
                          {prov.Correo_Contacto && <p><strong className="font-semibold text-slate-700">Correo:</strong> {prov.Correo_Contacto}</p>}
                          {prov.Direccion && <p><strong className="font-semibold text-slate-700">Ubicación:</strong> {prov.Direccion}</p>}
                        </div>
                      </div>

                      {/* Tarjeta Emisión y Responsable */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                        <div className="flex items-center gap-1.5 text-teal-800 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 pb-1">
                          <User className="w-3.5 h-3.5" />
                          <span>Control de Emisión & Bodega</span>
                        </div>
                        <div className="text-[11px] text-slate-600 space-y-1 pt-0.5">
                          <p><strong className="font-semibold text-slate-700">Responsable de Emisión:</strong> {compraSeleccionada?.Responsable || 'admin'} (Administración)</p>
                          <p><strong className="font-semibold text-slate-700">Tipo de Proceso:</strong> Orden de Compra Directa</p>
                          <p><strong className="font-semibold text-slate-700">Almacén Destino:</strong> Bodega Central Mundo Escolar</p>
                          <p><strong className="font-semibold text-slate-700">Asiento Contable:</strong> {compraSeleccionada?.Estado_Compra === 'Recibida' ? 'Registrado en Libro Kárdex (Entrada por Compra)' : 'Pendiente de Ingreso Físico'}</p>
                        </div>
                      </div>
                    </div>

                    {/* BLOQUE DESTACADO: CRONOGRAMA LOGÍSTICO, DURACIÓN ESTIPULADA Y CUMPLIMIENTO */}
                    <div className="bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between border-b border-[#DFD5C4] pb-1.5">
                        <div className="flex items-center gap-1.5 text-[#5C3622] font-black uppercase tracking-wider text-[10.5px]">
                          <Clock className="w-3.5 h-3.5 text-[#5C3622]" />
                          <span>Cronograma Logístico & Duración de Entrega</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-[#DFD5C4]">
                          Lead Time Pactado: {leadTimePactado} días
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                        <div className="bg-white p-2 rounded-lg border border-[#DFD5C4]">
                          <span className="text-[9.5px] font-bold text-slate-400 block uppercase">1. Fecha Despacho / Orden</span>
                          <span className="font-black text-slate-800 text-[11px] mt-0.5 block">
                            {fechaDespacho ? fechaDespacho.toLocaleDateString('es-CR') : 'N/D'}
                          </span>
                          <span className="text-[9px] text-slate-500 block">
                            {fechaDespacho ? fechaDespacho.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>

                        <div className="bg-white p-2 rounded-lg border border-[#DFD5C4]">
                          <span className="text-[9.5px] font-bold text-slate-400 block uppercase">2. Plazo Estipulado</span>
                          <span className="font-black text-teal-800 text-[11px] mt-0.5 block">
                            {leadTimePactado} Días
                          </span>
                          <span className="text-[9px] text-slate-500 block">Duración convenida</span>
                        </div>

                        <div className="bg-white p-2 rounded-lg border border-[#DFD5C4]">
                          <span className="text-[9.5px] font-bold text-slate-400 block uppercase">3. Fecha Prometida</span>
                          <span className="font-black text-slate-800 text-[11px] mt-0.5 block">
                            {fechaPrometida ? fechaPrometida.toLocaleDateString('es-CR') : 'N/D'}
                          </span>
                          <span className="text-[9px] text-slate-500 block">Límite según Lead Time</span>
                        </div>

                        <div className="bg-white p-2 rounded-lg border border-[#DFD5C4]">
                          <span className="text-[9.5px] font-bold text-slate-400 block uppercase">4. Fecha Recepción Real</span>
                          <span className="font-black text-[#132B20] text-[11px] mt-0.5 block">
                            {fechaRecepcion ? fechaRecepcion.toLocaleDateString('es-CR') : (compraSeleccionada?.Estado_Compra === 'Recibida' ? 'Confirmada' : 'Pendiente')}
                          </span>
                          <span className="text-[9px] text-slate-500 block">
                            {fechaRecepcion ? fechaRecepcion.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' }) : 'Arribo a bodega'}
                          </span>
                        </div>
                      </div>

                      {/* Dictamen de Evaluación de Entrega */}
                      {compraSeleccionada?.Estado_Compra === 'Recibida' ? (
                        <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                          diasDiferencia > 0 
                            ? 'bg-rose-50 border-rose-200 text-rose-900' 
                            : diasDiferencia < 0
                            ? 'bg-sky-50 border-sky-200 text-sky-900'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        }`}>
                          {diasDiferencia > 0 ? (
                            <>
                              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                              <div>
                                <span className="font-black text-xs">⚠️ Entrega con Retraso (+{diasDiferencia} día{diasDiferencia > 1 ? 's' : ''}): </span>
                                <span className="text-[11px]">La mercadería arribó {diasDiferencia} día(s) posterior a la fecha prometida. Registrado en auditoría dw.FactCompras.</span>
                              </div>
                            </>
                          ) : diasDiferencia < 0 ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                              <div>
                                <span className="font-black text-xs">⚡ Entrega Anticipada ({Math.abs(diasDiferencia)} día{Math.abs(diasDiferencia) > 1 ? 's' : ''} de adelanto): </span>
                                <span className="text-[11px]">El proveedor entregó antes del plazo estipulado ({leadTimePactado} días). Desempeño óptimo registrado en dw.FactCompras.</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <div>
                                <span className="font-black text-xs">✅ Entrega Justo a Tiempo (0 días de demora): </span>
                                <span className="text-[11px]">Cumplimiento exacto al 100% con los días estipulados de duración de entrega.</span>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>
                            <strong>Orden en tránsito:</strong> Plazo estipulado de <strong>{leadTimePactado} días</strong> para entrega en bodega antes del <strong>{fechaPrometida?.toLocaleDateString('es-CR')}</strong>.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Tabla de Productos Adquiridos */}
                    <div className="space-y-1.5">
                      <h4 className="font-black text-slate-800 uppercase tracking-wider text-[10.5px]">
                        Detalle de Mercancía Adquirida
                      </h4>
                      <div className="border border-slate-300 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#FAF7F0] text-[#5C3622] font-black border-b border-slate-300">
                            <tr>
                              <th className="py-2 px-3 w-8 text-center">#</th>
                              <th className="py-2 px-3">Producto / Descripción</th>
                              <th className="py-2 px-3">Categoría</th>
                              <th className="py-2 px-3 text-center">Cantidad</th>
                              <th className="py-2 px-3 text-right">Costo Unit.</th>
                              <th className="py-2 px-3 text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {(compraSeleccionada?.detalles || compraSeleccionada?.productos || []).map((p, idx) => (
                              <tr key={p.Id_Compra_Producto || idx} className="hover:bg-slate-50">
                                <td className="py-2 px-3 text-center font-mono text-slate-400 font-bold">{idx + 1}</td>
                                <td className="py-2 px-3 font-bold text-slate-900">{p.Producto || p.Nombre_Producto}</td>
                                <td className="py-2 px-3 text-slate-500 text-[11px]">{p.Categoria || 'Escolar'}</td>
                                <td className="py-2 px-3 text-center font-black text-slate-800">{p.Cantidad}</td>
                                <td className="py-2 px-3 text-right font-medium text-slate-700">₡{Number(p.Costo_Unitario || p.Precio_Unitario || 0).toLocaleString('es-CR')}</td>
                                <td className="py-2 px-3 text-right font-black text-slate-900">₡{Number(p.Subtotal || 0).toLocaleString('es-CR')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Resumen de Liquidación y Totales */}
                    <div className="bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl p-3 flex flex-col sm:flex-row justify-between items-center gap-2">
                      <div className="text-[11px] text-[#5C3622] font-medium">
                        <span>Total Artículos: <strong className="font-bold text-slate-800">{compraSeleccionada?.Total_Articulos || (compraSeleccionada?.detalles || compraSeleccionada?.productos || []).reduce((a, c) => a + Number(c.Cantidad || 0), 0)} unidades</strong></span>
                        <span className="mx-2">•</span>
                        <span>Moneda: <strong className="font-bold text-slate-800">Colones Costarricenses (CRC - ₡)</strong></span>
                      </div>

                      <div className="flex items-center gap-3 text-sm">
                        <span className="font-bold text-[#132B20]">Monto Total de Compra:</span>
                        <span className="font-black text-teal-800 text-base">
                          ₡{Number(compraSeleccionada?.Monto_Total || 0).toLocaleString('es-CR')}
                        </span>
                      </div>
                    </div>

                    {/* Sección de Firmas y Certificación de Entrada a Bodega */}
                    <div className="pt-3 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-[10.5px]">
                      <div>
                        <div className="border-b border-slate-400 pb-1 mb-1 h-10 flex items-end justify-center text-slate-600 font-serif italic text-xs">
                          {compraSeleccionada?.Responsable || 'Admin'}
                        </div>
                        <p className="font-bold text-slate-800">Emitido por Compras / Administración</p>
                        <p className="text-slate-400 text-[9.5px]">Librería & Papelería Mundo Escolar</p>
                      </div>

                      <div>
                        <div className="border-b border-slate-400 pb-1 mb-1 h-10 flex items-end justify-center text-slate-600 font-serif italic text-xs">
                          {compraSeleccionada?.Estado_Compra === 'Recibida' ? 'Recibido Conforme en Almacén' : '________________________'}
                        </div>
                        <p className="font-bold text-slate-800">Recibido e Ingresado a Bodega</p>
                        <p className="text-slate-400 text-[9.5px]">Firma & Sello de Bodeguero</p>
                      </div>
                    </div>

                    <p className="text-[9.5px] text-slate-400 text-center italic pt-0.5">
                      Comprobante interno oficial emitido conforme a las políticas de abastecimiento y control de inventarios de Mundo Escolar.
                    </p>
                  </>
                )}
              </div>

              {/* Barra inferior de acciones (no imprimible) */}
              <div className="p-4 bg-[#FAF7F0] border-t border-[#DFD5C4] flex items-center justify-between no-print">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Comprobante Oficial</span>
                </button>

                <button
                  onClick={() => setModalDetalleAbierto(false)}
                  className="px-5 py-2 bg-[#132B20] text-white text-xs font-bold rounded-xl hover:bg-[#1A3D2F] transition shadow-sm"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        );
      })(),
      document.body
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

            {/* ================= MODAL CONFIRMACIÓN DE RECEPCIÓN ================= */}
      {modalRecepcionAbierto && compraARecepcionar && (() => {
        const leadTimePactado = compraARecepcionar.Id_Proveedor === 2 ? 7 : (compraARecepcionar.Id_Proveedor === 1 || compraARecepcionar.Id_Proveedor === 3 ? 3 : 5);
        const fechaOrden = new Date(compraARecepcionar.Fecha_Compra);
        const fechaPrometida = new Date(fechaOrden.getTime() + leadTimePactado * 24 * 60 * 60 * 1000);
        const fechaRecibida = fechaRecepcionReal ? new Date(fechaRecepcionReal) : new Date();

        const dProm = new Date(fechaPrometida.getFullYear(), fechaPrometida.getMonth(), fechaPrometida.getDate());
        const dRec = new Date(fechaRecibida.getFullYear(), fechaRecibida.getMonth(), fechaRecibida.getDate());
        const diasDiferencia = Math.round((dRec - dProm) / (1000 * 60 * 60 * 24));

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132B20]/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#DFD5C4] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="bg-[#132B20] text-white p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    Confirmar Recepción de Compra
                  </h3>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    OC-{compraARecepcionar.Id_Compra.toString().padStart(8, '0')} • {compraARecepcionar.Nombre_Proveedor || compraARecepcionar.Proveedor}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setModalRecepcionAbierto(false);
                    setCompraARecepcionar(null);
                  }}
                  className="p-1 text-emerald-200 hover:text-white rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 leading-relaxed font-medium">
                  ¿Desea confirmar la recepción de la <strong className="font-bold">Orden #{compraARecepcionar.Id_Compra}</strong>?
                  Al confirmar, el sistema incrementará automáticamente el inventario físico en bodega y registrará los movimientos contables en Kárdex.
                </div>

                <div className="bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl p-3.5 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#5C3622] font-semibold">Proveedor:</span>
                    <span className="font-bold text-slate-800">{compraARecepcionar.Nombre_Proveedor || compraARecepcionar.Proveedor}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#5C3622] font-semibold">Artículos a Ingresar:</span>
                    <span className="font-bold text-slate-800">{compraARecepcionar.Total_Articulos || compraARecepcionar.Articulos || 0} unidades</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-[#DFD5C4]">
                    <span className="text-[#5C3622] font-semibold">Total de la Orden:</span>
                    <span className="font-black text-[#132B20] text-sm">
                      ₡{Number(compraARecepcionar.Monto_Total ?? compraARecepcionar.Total ?? 0).toLocaleString('es-CR')}
                    </span>
                  </div>
                </div>

                {/* Control de Fechas, Lead Time y Cumplimiento de Entrega */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-600 font-semibold border-b border-slate-200 pb-2">
                    <span>Emisión: {fechaOrden.toLocaleDateString('es-CR')}</span>
                    <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-bold text-teal-800">
                      Plazo: {leadTimePactado} días
                    </span>
                    <span>Prometida: {fechaPrometida.toLocaleDateString('es-CR')}</span>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Fecha y Hora Real de Recepción en Bodega:
                    </label>
                    <input
                      type="datetime-local"
                      value={fechaRecepcionReal}
                      onChange={(e) => setFechaRecepcionReal(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>

                  {/* Diagnóstico en vivo de retraso / adelanto */}
                  <div className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                    diasDiferencia > 0 
                      ? 'bg-rose-50 border-rose-200 text-rose-800' 
                      : diasDiferencia < 0
                      ? 'bg-sky-50 border-sky-200 text-sky-800'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}>
                    {diasDiferencia > 0 ? (
                      <>
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <div>
                          <strong className="font-bold">⚠️ Entrega con Retraso (+{diasDiferencia} día{diasDiferencia > 1 ? 's' : ''}):</strong>
                          <p className="text-[11px] text-rose-700">Se registrará en el Data Warehouse (dw.FactCompras) y afectará el Scorecard de Proveedores.</p>
                        </div>
                      </>
                    ) : diasDiferencia < 0 ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                        <div>
                          <strong className="font-bold">⚡ Entrega Anticipada ({Math.abs(diasDiferencia)} día{Math.abs(diasDiferencia) > 1 ? 's' : ''} de adelanto):</strong>
                          <p className="text-[11px] text-sky-700">La mercancía llegó antes de la fecha pactada. Desempeño óptimo.</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <strong className="font-bold">✅ Entrega Justo a Tiempo (0 días de retraso):</strong>
                          <p className="text-[11px] text-emerald-700">Cumplimiento del 100% con el Lead Time pactado.</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#FAF7F0] border-t border-[#DFD5C4] flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setModalRecepcionAbierto(false);
                    setCompraARecepcionar(null);
                  }}
                  disabled={guardando}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={procesarRecepcion}
                  disabled={guardando}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {guardando ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Confirmando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar Ingreso a Bodega</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ================= MODAL DIRECTORIO Y GESTIÓN DE PROVEEDORES ================= */}
      {modalProveedoresAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132B20]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] shadow-2xl border border-[#DFD5C4] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#132B20] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Building className="w-5 h-5 text-amber-400" />
                  Directorio y Catálogo de Proveedores Homologados
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Gestión integral de Proveedores Particulares e Institucionales (Tablas 13.12, 13.13, 13.14)
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => abrirCrearProveedor('institucional')}
                  className="px-3.5 py-1.5 bg-[#C05A3E] hover:bg-[#A94E35] text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4" />
                  + Registrar Proveedor
                </button>
                <button
                  onClick={() => setModalProveedoresAbierto(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Barra de Filtro */}
            <div className="p-4 bg-[#FAF7F0] border-b border-[#DFD5C4] flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={filtroProveedor}
                  onChange={(e) => setFiltroProveedor(e.target.value)}
                  placeholder="Buscar por razón social, cédula, contacto o correo..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-[#DFD5C4] rounded-xl text-xs text-[#132B20] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
                />
              </div>
              <span className="text-xs font-semibold text-[#5C3622]">
                Mostrando {proveedoresFiltrados.length} de {proveedores.length} proveedores
              </span>
            </div>

            <div className="p-5 overflow-y-auto flex-1 text-xs">
              <div className="border border-[#DFD5C4] rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-[#FAF7F0] text-[#5C3622] font-bold border-b border-[#DFD5C4] uppercase text-[11px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Proveedor / Razón Social</th>
                      <th className="py-2.5 px-3">Tipo</th>
                      <th className="py-2.5 px-3">Identificación</th>
                      <th className="py-2.5 px-3">Contacto Directo</th>
                      <th className="py-2.5 px-3">Correo Electrónico</th>
                      <th className="py-2.5 px-3">Teléfono</th>
                      <th className="py-2.5 px-3">Dirección</th>
                      <th className="py-2.5 px-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-[#132B20]">
                    {proveedoresFiltrados.map((prov) => {
                      const esInst = prov.Tipo_Proveedor === 'Institucional';
                      return (
                        <tr key={prov.Id_Proveedor} className="hover:bg-[#FAF7F0]/80 transition-colors">
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-[#132B20] block">{prov.Nombre_O_RazonSocial}</span>
                            <span className="text-[10px] text-slate-400">ID #{prov.Id_Proveedor}</span>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                esInst
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {esInst ? <Building className="w-3 h-3" /> : <User className="w-3 h-3" />}
                              {prov.Tipo_Proveedor}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#5C3622] whitespace-nowrap">
                            {prov.Numero_Identificacion}
                          </td>
                          <td className="py-2.5 px-3">
                            {prov.Nombre_Contacto ? (
                              <div>
                                <span className="font-semibold text-slate-800 block">{prov.Nombre_Contacto}</span>
                                {prov.Telefono_Contacto && (
                                  <span className="text-[10px] text-slate-500 block">{prov.Telefono_Contacto}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Contacto directo</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-slate-700 font-medium flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              {prov.Correo || prov.Correo_Contacto || 'N/A'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="text-slate-700 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              {prov.Telefono || prov.Telefono_Contacto || 'N/A'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 max-w-[180px] truncate" title={prov.Direccion}>
                            <span className="text-slate-600 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              {prov.Direccion || 'Sin dirección'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => abrirEditarProveedor(prov)}
                              className="p-1.5 text-slate-500 hover:text-[#132B20] hover:bg-slate-100 rounded-lg transition"
                              title="Editar Proveedor"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 bg-[#FAF7F0] border-t border-[#DFD5C4] flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Padrón Nacional y Tributación Directa vinculados para validación automática.
              </span>
              <button
                onClick={() => setModalProveedoresAbierto(false)}
                className="px-4 py-2 bg-[#132B20] text-white font-bold rounded-xl text-xs hover:bg-[#1A3D2F] transition"
              >
                Cerrar Directorio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL REGISTRAR NUEVO PROVEEDOR (PARTICULAR O INSTITUCIONAL) ================= */}
      {modalCrearProveedorAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132B20]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] shadow-2xl border border-[#DFD5C4] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#132B20] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400 font-bold">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Registrar Proveedor Homologado</h3>
                  <p className="text-xs text-slate-300">
                    {tipoNuevoProveedor === 'institucional'
                      ? 'Persona Jurídica / Empresa Distribuidora (Tabla 13.14)'
                      : 'Persona Física / Proveedor Particular (Tabla 13.13)'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalCrearProveedorAbierto(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selector de Pestañas */}
            <div className="flex border-b border-[#DFD5C4] bg-[#FAF7F0] p-1.5 gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setTipoNuevoProveedor('institucional')}
                className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition ${
                  tipoNuevoProveedor === 'institucional'
                    ? 'bg-white text-[#132B20] shadow-sm border border-[#DFD5C4]'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Building className="w-4 h-4 text-amber-600" />
                Institucional / Empresa
              </button>
              <button
                type="button"
                onClick={() => setTipoNuevoProveedor('particular')}
                className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition ${
                  tipoNuevoProveedor === 'particular'
                    ? 'bg-white text-[#132B20] shadow-sm border border-[#DFD5C4]'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <User className="w-4 h-4 text-emerald-600" />
                Particular / Persona Física
              </button>
            </div>

            <form onSubmit={guardarNuevoProveedor} className="p-6 overflow-y-auto space-y-4 text-xs">
              {tipoNuevoProveedor === 'particular' ? (
                <>
                  <div>
                    <label className="block font-bold text-[#132B20] mb-1">Cédula de Identidad (TSE) *</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formProveedorParticular.identificacion}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormProveedorParticular({ ...formProveedorParticular, identificacion: val });
                          const digits = val.replace(/\D/g, '');
                          if (digits.length === 9) {
                            consultarTseProveedor(digits);
                          }
                        }}
                        onBlur={() => {
                          const digits = formProveedorParticular.identificacion.replace(/\D/g, '');
                          if (digits.length >= 8 && !formProveedorParticular.nombre) {
                            consultarTseProveedor(digits);
                          }
                        }}
                        placeholder="Ej. 1-0899-0432 (9 dígitos)"
                        className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46] font-mono font-bold text-[#132B20]"
                        required
                      />
                      {consultandoPadron && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[#2D5E46]">
                          <div className="w-4 h-4 border-2 border-[#2D5E46]/30 border-t-[#2D5E46] rounded-full animate-spin" />
                          <span className="text-[10px] font-semibold">Consultando TSE...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-[#132B20] mb-1">Nombre *</label>
                      <input
                        type="text"
                        value={formProveedorParticular.nombre}
                        onChange={(e) => setFormProveedorParticular({ ...formProveedorParticular, nombre: e.target.value })}
                        className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46] font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#132B20] mb-1">Primer Apellido *</label>
                      <input
                        type="text"
                        value={formProveedorParticular.apellido1}
                        onChange={(e) => setFormProveedorParticular({ ...formProveedorParticular, apellido1: e.target.value })}
                        className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46] font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#132B20] mb-1">Segundo Apellido</label>
                      <input
                        type="text"
                        value={formProveedorParticular.apellido2}
                        onChange={(e) => setFormProveedorParticular({ ...formProveedorParticular, apellido2: e.target.value })}
                        className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#132B20] mb-1">Correo Electrónico *</label>
                      <input
                        type="email"
                        value={formProveedorParticular.correo}
                        onChange={(e) => setFormProveedorParticular({ ...formProveedorParticular, correo: e.target.value })}
                        placeholder="proveedor@gmail.com"
                        className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#132B20] mb-1">Teléfono</label>
                      <input
                        type="text"
                        value={formProveedorParticular.telefono}
                        onChange={(e) => setFormProveedorParticular({ ...formProveedorParticular, telefono: e.target.value })}
                        placeholder="8888-0000"
                        className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[#132B20] mb-1">Dirección Física</label>
                    <input
                      type="text"
                      value={formProveedorParticular.direccion}
                      onChange={(e) => setFormProveedorParticular({ ...formProveedorParticular, direccion: e.target.value })}
                      placeholder="Liberia, Guanacaste, 100m norte del parque"
                      className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block font-bold text-[#132B20] mb-1">Cédula Jurídica (Tributación) *</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formProveedorInstitucional.cedulaJuridica}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormProveedorInstitucional({ ...formProveedorInstitucional, cedulaJuridica: val });
                          const digits = val.replace(/\D/g, '');
                          if (digits.length === 10) {
                            consultarHaciendaProveedor(digits);
                          }
                        }}
                        onBlur={() => {
                          const digits = formProveedorInstitucional.cedulaJuridica.replace(/\D/g, '');
                          if (digits.length >= 9 && !formProveedorInstitucional.razonSocial) {
                            consultarHaciendaProveedor(digits);
                          }
                        }}
                        placeholder="Ej. 3-101-998877 (10 dígitos)"
                        className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46] font-mono font-bold text-[#132B20]"
                        required
                      />
                      {consultandoPadron && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-amber-700">
                          <div className="w-4 h-4 border-2 border-amber-600/30 border-t-amber-600 rounded-full animate-spin" />
                          <span className="text-[10px] font-semibold">Consultando Hacienda...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[#132B20] mb-1">Razón Social *</label>
                    <input
                      type="text"
                      value={formProveedorInstitucional.razonSocial}
                      onChange={(e) => setFormProveedorInstitucional({ ...formProveedorInstitucional, razonSocial: e.target.value })}
                      placeholder="Ej. Distribuidora Escolar del Valle S.A."
                      className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46] font-bold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-[#132B20] mb-1">Nombre Contacto</label>
                      <input
                        type="text"
                        value={formProveedorInstitucional.nombreContacto}
                        onChange={(e) => setFormProveedorInstitucional({ ...formProveedorInstitucional, nombreContacto: e.target.value })}
                        placeholder="Laura Mora"
                        className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#132B20] mb-1">Tel. Contacto</label>
                      <input
                        type="text"
                        value={formProveedorInstitucional.telefonoContacto}
                        onChange={(e) => setFormProveedorInstitucional({ ...formProveedorInstitucional, telefonoContacto: e.target.value })}
                        placeholder="2222-3333"
                        className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#132B20] mb-1">Correo Contacto</label>
                      <input
                        type="email"
                        value={formProveedorInstitucional.correoContacto}
                        onChange={(e) => setFormProveedorInstitucional({ ...formProveedorInstitucional, correoContacto: e.target.value })}
                        placeholder="contacto@empresa.cr"
                        className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#132B20] mb-1">Correo Empresa *</label>
                      <input
                        type="email"
                        value={formProveedorInstitucional.correo}
                        onChange={(e) => setFormProveedorInstitucional({ ...formProveedorInstitucional, correo: e.target.value })}
                        placeholder="ventas@empresa.cr"
                        className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#132B20] mb-1">Teléfono Empresa</label>
                      <input
                        type="text"
                        value={formProveedorInstitucional.telefono}
                        onChange={(e) => setFormProveedorInstitucional({ ...formProveedorInstitucional, telefono: e.target.value })}
                        placeholder="2222-0000"
                        className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[#132B20] mb-1">Dirección Física</label>
                    <input
                      type="text"
                      value={formProveedorInstitucional.direccion}
                      onChange={(e) => setFormProveedorInstitucional({ ...formProveedorInstitucional, direccion: e.target.value })}
                      placeholder="Parque Industrial Zeta, Heredia"
                      className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
                    />
                  </div>
                </>
              )}

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalCrearProveedorAbierto(false)}
                  disabled={guardando}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2 bg-[#132B20] hover:bg-[#1A3D2F] text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {guardando ? 'Guardando en SQL...' : 'Registrar Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL EDITAR PROVEEDOR ================= */}
      {modalEditarProveedorAbierto && proveedorAEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132B20]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] shadow-2xl border border-[#DFD5C4] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#132B20] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-amber-400" />
                  Editar Proveedor #{proveedorAEditar.Id_Proveedor}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {proveedorAEditar.Numero_Identificacion} &bull; {proveedorAEditar.Tipo_Proveedor}
                </p>
              </div>
              <button
                onClick={() => setModalEditarProveedorAbierto(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={guardarEdicionProveedor} className="p-6 overflow-y-auto space-y-4 text-xs">
              {proveedorAEditar.Tipo_Proveedor === 'Particular' ? (
                <>
                  <div>
                    <label className="block font-bold text-[#132B20] mb-1">Nombre</label>
                    <input
                      type="text"
                      value={formEditarProveedor.nombre}
                      onChange={(e) => setFormEditarProveedor({ ...formEditarProveedor, nombre: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46] font-semibold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#132B20] mb-1">Primer Apellido</label>
                      <input
                        type="text"
                        value={formEditarProveedor.apellido1}
                        onChange={(e) => setFormEditarProveedor({ ...formEditarProveedor, apellido1: e.target.value })}
                        className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46] font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#132B20] mb-1">Segundo Apellido</label>
                      <input
                        type="text"
                        value={formEditarProveedor.apellido2}
                        onChange={(e) => setFormEditarProveedor({ ...formEditarProveedor, apellido2: e.target.value })}
                        className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block font-bold text-[#132B20] mb-1">Razón Social</label>
                    <input
                      type="text"
                      value={formEditarProveedor.razonSocial}
                      onChange={(e) => setFormEditarProveedor({ ...formEditarProveedor, razonSocial: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46] font-bold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-[#132B20] mb-1">Nombre Contacto</label>
                      <input
                        type="text"
                        value={formEditarProveedor.nombreContacto}
                        onChange={(e) => setFormEditarProveedor({ ...formEditarProveedor, nombreContacto: e.target.value })}
                        className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#132B20] mb-1">Tel. Contacto</label>
                      <input
                        type="text"
                        value={formEditarProveedor.telefonoContacto}
                        onChange={(e) => setFormEditarProveedor({ ...formEditarProveedor, telefonoContacto: e.target.value })}
                        className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#132B20] mb-1">Correo Contacto</label>
                      <input
                        type="email"
                        value={formEditarProveedor.correoContacto}
                        onChange={(e) => setFormEditarProveedor({ ...formEditarProveedor, correoContacto: e.target.value })}
                        className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#132B20] mb-1">Correo Electrónico General</label>
                  <input
                    type="email"
                    value={formEditarProveedor.correo}
                    onChange={(e) => setFormEditarProveedor({ ...formEditarProveedor, correo: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#132B20] mb-1">Teléfono Principal</label>
                  <input
                    type="text"
                    value={formEditarProveedor.telefono}
                    onChange={(e) => setFormEditarProveedor({ ...formEditarProveedor, telefono: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#132B20] mb-1">Dirección Física</label>
                <input
                  type="text"
                  value={formEditarProveedor.direccion}
                  onChange={(e) => setFormEditarProveedor({ ...formEditarProveedor, direccion: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#132B20] mb-1">Estado Operativo</label>
                <select
                  value={formEditarProveedor.estado ? '1' : '0'}
                  onChange={(e) => setFormEditarProveedor({ ...formEditarProveedor, estado: e.target.value === '1' })}
                  className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46] font-semibold"
                >
                  <option value="1">Activo (Habilitado para Compras)</option>
                  <option value="0">Inactivo (Suspendido)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalEditarProveedorAbierto(false)}
                  disabled={guardando}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2 bg-[#132B20] hover:bg-[#1A3D2F] text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ================= MODAL SMART PROCUREMENT (REABASTECIMIENTO AUTOMÁTICO) ================= */}
      {modalSugerenciasAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132B20]/65 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] shadow-2xl border border-[#DFD5C4] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="bg-[#132B20] text-white p-5 flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-base">Asistente de Reabastecimiento Automático (Smart Procurement)</h3>
                </div>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Lote económico calculado automáticamente con base en dbo.Producto_Proveedor y punto de reorden.
                </p>
              </div>
              <button
                onClick={() => setModalSugerenciasAbierto(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido Desplazable con Grupos por Proveedor */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-amber-900">
                <div className="space-y-0.5">
                  <p className="font-bold">Algoritmo de Emisión Consolidada:</p>
                  <p className="text-[11px] text-amber-800">
                    El sistema agrupa los productos críticos por su distribuidor preferente (EsPrincipal = 1) para generar órdenes separadas en estado Pendiente.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Inversión Total</span>
                  <span className="text-base font-black text-emerald-800">₡{totalInversionSugerida.toLocaleString('es-CR')}</span>
                </div>
              </div>

              {sugerenciasPorProveedor.map((grupo) => {
                const subtotalGrupo = grupo.items.reduce((acc, it) => {
                  const cant = cantidadesEditables[it.Id_Producto] !== undefined ? cantidadesEditables[it.Id_Producto] : it.Cantidad_Sugerida;
                  return acc + (Number(cant || 0) * Number(it.Costo_Unitario || 0));
                }, 0);

                return (
                  <div key={grupo.idProveedor} className="border border-[#DFD5C4] rounded-xl overflow-hidden bg-white shadow-xs">
                    {/* Header Proveedor */}
                    <div className="bg-[#FAF7F0] p-3 border-b border-[#DFD5C4] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-[#2D5E46]" />
                        <span className="font-bold text-sm text-[#132B20]">{grupo.nombreProveedor}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/80 text-slate-700">
                          {grupo.tipoProveedor}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 mr-1">Subtotal Proveedor:</span>
                        <span className="font-bold text-emerald-700 text-xs">₡{subtotalGrupo.toLocaleString('es-CR')}</span>
                      </div>
                    </div>

                    {/* Tabla de Artículos para este Proveedor */}
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Producto</th>
                          <th className="py-2 px-3 text-center">Stock Actual</th>
                          <th className="py-2 px-3 text-center">Punto Reorden</th>
                          <th className="py-2 px-3 text-center">Cantidad a Pedir</th>
                          <th className="py-2 px-3 text-right">Costo Mayorista</th>
                          <th className="py-2 px-3 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {grupo.items.map((it) => {
                          const cant = cantidadesEditables[it.Id_Producto] !== undefined ? cantidadesEditables[it.Id_Producto] : it.Cantidad_Sugerida;
                          const subtotalLinea = Number(cant || 0) * Number(it.Costo_Unitario || 0);

                          return (
                            <tr key={it.Id_Producto} className="hover:bg-slate-50/60">
                              <td className="py-2.5 px-3">
                                <span className="font-bold text-slate-800 block">{it.Nombre_Producto}</span>
                                <span className="text-[10px] text-slate-400">{it.Categoria}</span>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                  {it.Stock_Actual} uds
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center font-semibold text-slate-600">
                                {it.Punto_Reorden}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <input
                                  type="number"
                                  min="1"
                                  value={cant}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    setCantidadesEditables({
                                      ...cantidadesEditables,
                                      [it.Id_Producto]: isNaN(val) ? 0 : val,
                                    });
                                  }}
                                  className="w-16 px-2 py-1 text-center font-bold text-slate-800 bg-amber-50 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
                                />
                              </td>
                              <td className="py-2.5 px-3 text-right text-slate-600">
                                ₡{Number(it.Costo_Unitario).toLocaleString('es-CR')}
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-emerald-800">
                                ₡{subtotalLinea.toLocaleString('es-CR')}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>

            {/* Footer Modal con Emisión en 1 Clic */}
            <div className="p-4 bg-[#FAF7F0] border-t border-[#DFD5C4] flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setModalSugerenciasAbierto(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={emitirOrdenesSugeridas}
                disabled={generandoOrdenes || totalInversionSugerida <= 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#2D5E46] hover:bg-[#1E4331] text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 active:scale-95"
              >
                {generandoOrdenes ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Generando Órdenes en Borrador...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Emitir Órdenes de Compra Sugeridas (₡{totalInversionSugerida.toLocaleString('es-CR')})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
