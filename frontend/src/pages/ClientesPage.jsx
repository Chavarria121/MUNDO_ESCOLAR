import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  Building,
  User,
  CreditCard,
  History,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Clock,
  Edit2,
  Trash2,
  X,
  FileText,
  DollarSign,
  ShieldCheck,
  Calendar,
  Layers,
  ChevronRight,
  Printer,
  Sparkles,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ClientesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [clientes, setClientes] = useState([]);
  const [condicionesPagoCatalogo, setCondicionesPagoCatalogo] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('TODOS'); // 'TODOS' | 'Particular' | 'Institucional'

  // Modales
  const [modalParticularAbierto, setModalParticularAbierto] = useState(false);
  const [modalInstitucionalAbierto, setModalInstitucionalAbierto] = useState(false);
  const [modalHistorialAbierto, setModalHistorialAbierto] = useState(false);
  const [modalCreditoAbierto, setModalCreditoAbierto] = useState(false);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);

  // Cliente seleccionado
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [historialOperaciones, setHistorialOperaciones] = useState([]);
  const [condicionesCliente, setCondicionesCliente] = useState([]);
  const [cargandoModal, setCargandoModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [consultandoTse, setConsultandoTse] = useState(false);
  const ultimaCedulaConsultada = useRef('');
  const ultimaJuridicaConsultada = useRef('');

  // Formulario Particular
  const [formParticular, setFormParticular] = useState({
    identificacion: '',
    nombre: '',
    apellido1: '',
    apellido2: '',
    telefono: '',
    direccion: '',
  });

  // Formulario Institucional
  const [formInstitucional, setFormInstitucional] = useState({
    cedulaJuridica: '',
    razonSocial: '',
    nombreContacto: '',
    telefonoContacto: '',
    correoContacto: '',
    telefono: '',
    direccion: '',
  });

  // Formulario Edición
  const [formEditar, setFormEditar] = useState({
    nombre: '',
    apellido1: '',
    apellido2: '',
    razonSocial: '',
    nombreContacto: '',
    telefonoContacto: '',
    correoContacto: '',
    telefono: '',
    direccion: '',
    estado: true,
  });

  // Formulario Nueva Condición de Crédito
  const [nuevaCondicionId, setNuevaCondicionId] = useState(2); // 2 = Crédito 15 días

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resClientes, resCondiciones] = await Promise.all([
        api.get('/clientes/activos'),
        api.get('/catalogos/condiciones-pago'),
      ]);

      setClientes(resClientes.data || []);
      setCondicionesPagoCatalogo(resCondiciones.data || []);
    } catch (err) {
      console.error('Error cargando clientes:', err);
      showToast('Error al consultar catálogo de clientes', 'error');
    } finally {
      setLoading(false);
    }
  };

  // KPIs
  const metricas = useMemo(() => {
    const total = clientes.length;
    const particulares = clientes.filter((c) => c.Tipo_Cliente === 'Particular').length;
    const institucionales = clientes.filter((c) => c.Tipo_Cliente === 'Institucional').length;
    const conCredito = clientes.filter((c) => c.Tiene_Credito_Activo).length;

    return { total, particulares, institucionales, conCredito };
  }, [clientes]);

  // Filtrado de la tabla
  const clientesFiltrados = useMemo(() => {
    const term = busqueda.toLowerCase().trim();

    return clientes.filter((c) => {
      if (filtroTipo !== 'TODOS' && c.Tipo_Cliente !== filtroTipo) return false;

      if (!term) return true;
      const id = c.Id_Cliente.toString();
      const numId = (c.Numero_Identificacion || '').toLowerCase();
      const nom = (c.Nombre_O_RazonSocial || '').toLowerCase();
      const con = (c.Nombre_Contacto || '').toLowerCase();
      const tel = (c.Telefono || c.Telefono_Contacto || '').toLowerCase();
      const dir = (c.Direccion || '').toLowerCase();

      return (
        id.includes(term) ||
        numId.includes(term) ||
        nom.includes(term) ||
        con.includes(term) ||
        tel.includes(term) ||
        dir.includes(term)
      );
    });
  }, [clientes, busqueda, filtroTipo]);

  // ================= CONSULTA AUTOMÁTICA TSE (PERSONA FÍSICA) =================
  const consultarTseParticular = async (cedulaParam) => {
    const cedula = (cedulaParam || formParticular.identificacion || '').trim();
    const limpia = cedula.replace(/\D/g, '');

    if (!limpia || limpia.length < 8) {
      showToast('Digita al menos 9 dígitos de la cédula para consultar el padrón del TSE', 'warning');
      return;
    }

    setConsultandoTse(true);
    try {
      const res = await api.get(`/clientes/tse/${limpia}`);
      if (res.data?.encontrado) {
        setFormParticular((prev) => ({
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
      showToast('Error de comunicación con el servicio de consulta TSE / Hacienda', 'error');
    } finally {
      setConsultandoTse(false);
    }
  };

  // ================= CONSULTA AUTOMÁTICA HACIENDA (PERSONA JURÍDICA) =================
  const consultarHaciendaInstitucional = async (cedulaParam) => {
    const cedula = (cedulaParam || formInstitucional.cedulaJuridica || '').trim();
    const limpia = cedula.replace(/\D/g, '');

    if (!limpia || limpia.length < 9) {
      showToast('Digita los 10 dígitos de la cédula jurídica para consultar Tributación Directa', 'warning');
      return;
    }

    setConsultandoTse(true);
    try {
      const res = await api.get(`/clientes/tse/${limpia}`);
      if (res.data?.encontrado) {
        setFormInstitucional((prev) => ({
          ...prev,
          cedulaJuridica: res.data.cedulaJuridica || prev.cedulaJuridica,
          razonSocial: res.data.razonSocial || prev.razonSocial,
        }));
        showToast(`¡Hacienda Verificado! ${res.data.razonSocial}`, 'success');
      } else {
        showToast(res.data?.mensaje || 'Cédula jurídica no localizada en Tributación Directa', 'warning');
      }
    } catch (err) {
      console.error('Error consultando Hacienda:', err);
      showToast('Error de comunicación con el servicio de Hacienda / Tributación', 'error');
    } finally {
      setConsultandoTse(false);
    }
  };

  // ================= CREAR PARTICULAR =================
  const abrirCrearParticular = (cedulaInicial = '') => {
    ultimaCedulaConsultada.current = '';
    setFormParticular({
      identificacion: cedulaInicial || '',
      nombre: '',
      apellido1: '',
      apellido2: '',
      telefono: '',
      direccion: '',
    });
    setModalParticularAbierto(true);
    if (cedulaInicial && cedulaInicial.replace(/\D/g, '').length >= 8) {
      setTimeout(() => consultarTseParticular(cedulaInicial), 150);
    }
  };

  const guardarParticular = async (e) => {
    e.preventDefault();
    if (!formParticular.identificacion.trim() || !formParticular.nombre.trim() || !formParticular.apellido1.trim()) {
      showToast('Complete los campos obligatorios de identificación y nombre', 'warning');
      return;
    }

    setGuardando(true);
    try {
      await api.post('/clientes/particular', {
        identificacion: formParticular.identificacion.trim(),
        nombre: formParticular.nombre.trim(),
        apellido1: formParticular.apellido1.trim(),
        apellido2: formParticular.apellido2.trim() || undefined,
        telefono: formParticular.telefono.trim() || undefined,
        direccion: formParticular.direccion.trim() || undefined,
      });

      showToast('Cliente particular registrado exitosamente', 'success');
      setModalParticularAbierto(false);
      cargarDatos();
    } catch (err) {
      console.error('Error creando particular:', err);
      const msg = err.response?.data?.mensaje || 'Error en SP_Cliente_CrearPerfil';
      showToast(msg, 'error');
    } finally {
      setGuardando(false);
    }
  };

  // ================= CREAR INSTITUCIONAL =================
  const abrirCrearInstitucional = (cedulaInicial = '') => {
    ultimaJuridicaConsultada.current = '';
    setFormInstitucional({
      cedulaJuridica: cedulaInicial || '',
      razonSocial: '',
      nombreContacto: '',
      telefonoContacto: '',
      correoContacto: '',
      telefono: '',
      direccion: '',
    });
    setModalInstitucionalAbierto(true);
    if (cedulaInicial && cedulaInicial.replace(/\D/g, '').length >= 9) {
      setTimeout(() => consultarHaciendaInstitucional(cedulaInicial), 150);
    }
  };

  const guardarInstitucional = async (e) => {
    e.preventDefault();
    if (!formInstitucional.cedulaJuridica.trim() || !formInstitucional.razonSocial.trim()) {
      showToast('Complete la cédula jurídica y razón social de la institución', 'warning');
      return;
    }

    setGuardando(true);
    try {
      await api.post('/clientes/institucional', {
        cedulaJuridica: formInstitucional.cedulaJuridica.trim(),
        razonSocial: formInstitucional.razonSocial.trim(),
        nombreContacto: formInstitucional.nombreContacto.trim() || undefined,
        telefonoContacto: formInstitucional.telefonoContacto.trim() || undefined,
        correoContacto: formInstitucional.correoContacto.trim() || undefined,
        telefono: formInstitucional.telefono.trim() || undefined,
        direccion: formInstitucional.direccion.trim() || undefined,
      });

      showToast('Cliente institucional registrado exitosamente', 'success');
      setModalInstitucionalAbierto(false);
      cargarDatos();
    } catch (err) {
      console.error('Error creando institucional:', err);
      const msg = err.response?.data?.mensaje || 'Error en SP_Cliente_CrearPerfil';
      showToast(msg, 'error');
    } finally {
      setGuardando(false);
    }
  };

  // ================= EDITAR CLIENTE =================
  const abrirEditar = (cliente) => {
    setClienteSeleccionado(cliente);
    setFormEditar({
      nombre: cliente.Nombre || '',
      apellido1: cliente.Apellido1 || '',
      apellido2: cliente.Apellido2 || '',
      razonSocial: cliente.Razon_Social || '',
      nombreContacto: cliente.Nombre_Contacto || '',
      telefonoContacto: cliente.Telefono_Contacto || '',
      correoContacto: cliente.Correo_Contacto || '',
      telefono: cliente.Telefono || '',
      direccion: cliente.Direccion || '',
      estado: cliente.Estado ?? true,
    });
    setModalEditarAbierto(true);
  };

  const guardarEdicion = async (e) => {
    e.preventDefault();
    if (!clienteSeleccionado) return;

    setGuardando(true);
    try {
      const payload = {
        telefono: formEditar.telefono || undefined,
        direccion: formEditar.direccion || undefined,
        estado: formEditar.estado,
      };

      if (clienteSeleccionado.Tipo_Cliente === 'Particular') {
        payload.nombre = formEditar.nombre;
        payload.apellido1 = formEditar.apellido1;
        payload.apellido2 = formEditar.apellido2 || undefined;
      } else {
        payload.razonSocial = formEditar.razonSocial;
        payload.nombreContacto = formEditar.nombreContacto || undefined;
        payload.telefonoContacto = formEditar.telefonoContacto || undefined;
        payload.correoContacto = formEditar.correoContacto || undefined;
      }

      await api.put(`/clientes/${clienteSeleccionado.Id_Cliente}`, payload);
      showToast('Perfil de cliente actualizado con éxito', 'success');
      setModalEditarAbierto(false);
      cargarDatos();
    } catch (err) {
      console.error('Error actualizando cliente:', err);
      showToast(err.response?.data?.mensaje || 'Error en SP_Cliente_Actualizar', 'error');
    } finally {
      setGuardando(false);
    }
  };

  // ================= VER HISTORIAL / EXPEDIENTE =================
  const abrirHistorial = async (cliente) => {
    setClienteSeleccionado(cliente);
    setModalHistorialAbierto(true);
    setCargandoModal(true);
    try {
      const res = await api.get(`/clientes/${cliente.Id_Cliente}/historial`);
      setHistorialOperaciones(res.data || []);
    } catch (err) {
      console.error('Error cargando historial:', err);
      showToast('Error al consultar el historial del cliente', 'error');
    } finally {
      setCargandoModal(false);
    }
  };

  // ================= CONDICIONES DE PAGO / CRÉDITO =================
  const abrirCondicionesCredito = async (cliente) => {
    setClienteSeleccionado(cliente);
    setModalCreditoAbierto(true);
    setCargandoModal(true);
    try {
      const res = await api.get(`/clientes/${cliente.Id_Cliente}/condiciones-pago`);
      setCondicionesCliente(res.data || []);
    } catch (err) {
      console.error('Error consultando condiciones de pago:', err);
      showToast('Error cargando líneas de crédito del cliente', 'error');
    } finally {
      setCargandoModal(false);
    }
  };

  const autorizarCondicion = async () => {
    if (!clienteSeleccionado) return;
    setGuardando(true);
    try {
      await api.post(`/clientes/${clienteSeleccionado.Id_Cliente}/condiciones-pago`, {
        idCondicionPago: parseInt(nuevaCondicionId),
      });
      showToast('Línea de crédito autorizada con éxito', 'success');
      const res = await api.get(`/clientes/${clienteSeleccionado.Id_Cliente}/condiciones-pago`);
      setCondicionesCliente(res.data || []);
      cargarDatos();
    } catch (err) {
      console.error('Error autorizando crédito:', err);
      showToast(err.response?.data?.mensaje || 'Error autorizando condición de pago', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const deshabilitarCondicion = async (idCondicion) => {
    if (!clienteSeleccionado) return;
    setGuardando(true);
    try {
      await api.delete(`/clientes/${clienteSeleccionado.Id_Cliente}/condiciones-pago/${idCondicion}`);
      showToast('Condición de crédito revocada satisfactoriamente', 'success');
      const res = await api.get(`/clientes/${clienteSeleccionado.Id_Cliente}/condiciones-pago`);
      setCondicionesCliente(res.data || []);
      cargarDatos();
    } catch (err) {
      console.error('Error revocando crédito:', err);
      showToast(err.response?.data?.mensaje || 'Error revocando condición', 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#DFD5C4] shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#DFD5C4]/50 border border-[#5C3622]/60 flex items-center justify-center text-[#2D5E46]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
                Gestión Integral de Clientes y Créditos
              </h1>
              <p className="text-xs text-slate-400">
                Directorio Comercial &bull; Consulta de Cédula TSE / Hacienda &bull; Particulares e Instituciones
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => abrirCrearParticular()}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-[#2D5E46] hover:bg-[#5C3622] text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition"
          >
            <User className="w-4 h-4" />
            <span>+ Cliente Particular</span>
          </button>

          <button
            onClick={() => abrirCrearInstitucional()}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-[#5C3622] hover:bg-[#C05A3E] text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition"
          >
            <Building className="w-4 h-4" />
            <span>+ Cliente Institucional</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#DFD5C4] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
              Total Clientes Activos
            </span>
            <span className="text-2xl font-black text-slate-800">{metricas.total}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#DFD5C4]/50 text-[#2D5E46] flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#DFD5C4] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
              Particulares (Físicos)
            </span>
            <span className="text-2xl font-black text-slate-800">{metricas.particulares}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#DFD5C4] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
              Institucionales / Colegios
            </span>
            <span className="text-2xl font-black text-slate-800">{metricas.institucionales}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Building className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#DFD5C4] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
              Con Línea de Crédito
            </span>
            <span className="text-2xl font-black text-amber-600">{metricas.conCredito}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filtros de Búsqueda */}
      <div className="bg-white rounded-2xl border border-[#DFD5C4] p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por cédula, nombre, contacto, teléfono..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
          />
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
          <button
            onClick={() => setFiltroTipo('TODOS')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filtroTipo === 'TODOS' ? 'bg-white text-[#2D5E46] shadow-sm' : 'hover:text-[#132B20]'
            }`}
          >
            Todos ({clientes.length})
          </button>
          <button
            onClick={() => setFiltroTipo('Particular')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filtroTipo === 'Particular' ? 'bg-white text-[#2D5E46] shadow-sm' : 'hover:text-[#132B20]'
            }`}
          >
            Particulares
          </button>
          <button
            onClick={() => setFiltroTipo('Institucional')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filtroTipo === 'Institucional' ? 'bg-white text-[#2D5E46] shadow-sm' : 'hover:text-[#132B20]'
            }`}
          >
            Institucionales
          </button>
        </div>
      </div>

      {/* Tabla de Clientes */}
      <div className="bg-white rounded-2xl border border-[#DFD5C4] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-[#2D5E46] animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600">Cargando directorio de clientes...</p>
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="p-12 text-center max-w-lg mx-auto">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#132B20]">No se encontraron clientes registrados con "{busqueda}"</p>
            {busqueda.replace(/\D/g, '').length >= 8 ? (
              <div className="mt-4 p-4 bg-[#DFD5C4]/50/80 border border-[#5C3622]/60 rounded-2xl text-left shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-[#2D5E46]" />
                  <p className="text-xs text-[#2D5E46] font-bold">
                    ¿Deseas buscar esta cédula en el padrón del TSE o Hacienda y registrarla?
                  </p>
                </div>
                <p className="text-[11px] text-[#5C3622] mb-3">
                  El sistema consultará automáticamente el nombre legal para autocompletar la ficha del cliente.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => abrirCrearParticular(busqueda)}
                    className="flex-1 py-2 px-3 bg-[#2D5E46] hover:bg-[#5C3622] text-white font-bold rounded-xl text-xs shadow-sm flex items-center justify-center gap-1.5 transition"
                  >
                    <User className="w-3.5 h-3.5" />
                    Registrar Particular (TSE)
                  </button>
                  <button
                    onClick={() => abrirCrearInstitucional(busqueda)}
                    className="flex-1 py-2 px-3 bg-[#5C3622] hover:bg-[#C05A3E] text-white font-bold rounded-xl text-xs shadow-sm flex items-center justify-center gap-1.5 transition"
                  >
                    <Building className="w-3.5 h-3.5" />
                    Registrar Empresa (Hacienda)
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3">
                <p className="text-xs text-slate-400 mb-3">Ajuste los términos de búsqueda o registre un nuevo cliente:</p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => abrirCrearParticular()}
                    className="py-1.5 px-3 bg-[#2D5E46] hover:bg-[#5C3622] text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5 transition"
                  >
                    <User className="w-3.5 h-3.5" />
                    + Registrar Particular
                  </button>
                  <button
                    onClick={() => abrirCrearInstitucional()}
                    className="py-1.5 px-3 bg-[#5C3622] hover:bg-[#C05A3E] text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5 transition"
                  >
                    <Building className="w-3.5 h-3.5" />
                    + Registrar Empresa
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F0] text-[#5C3622] font-semibold uppercase tracking-wider border-b border-[#DFD5C4]">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Identificación</th>
                  <th className="py-3 px-4">Nombre / Razón Social</th>
                  <th className="py-3 px-4">Contacto Directo</th>
                  <th className="py-3 px-4">Teléfono</th>
                  <th className="py-3 px-4">Dirección</th>
                  <th className="py-3 px-4">Crédito</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-[#132B20]">
                {clientesFiltrados.map((cli) => {
                  const esInst = cli.Tipo_Cliente === 'Institucional';

                  return (
                    <tr key={cli.Id_Cliente} className="hover:bg-[#FAF7F0]/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#5C3622]">
                        #{cli.Id_Cliente.toString().padStart(4, '0')}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            esInst
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {esInst ? <Building className="w-3 h-3" /> : <User className="w-3 h-3" />}
                          {cli.Tipo_Cliente}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-[#132B20] whitespace-nowrap">
                        {cli.Numero_Identificacion}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-[#132B20] block">{cli.Nombre_O_RazonSocial}</span>
                      </td>

                      <td className="py-3 px-4">
                        {cli.Nombre_Contacto ? (
                          <div>
                            <span className="font-semibold text-slate-800 block">{cli.Nombre_Contacto}</span>
                            {cli.Correo_Contacto && (
                              <span className="text-[10px] text-slate-400 block">{cli.Correo_Contacto}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Titular particular</span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="flex items-center gap-1 text-slate-600">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {cli.Telefono || cli.Telefono_Contacto || 'N/A'}
                        </span>
                      </td>

                      <td className="py-3 px-4 max-w-[200px] truncate" title={cli.Direccion}>
                        <span className="flex items-center gap-1 text-[#5C3622]">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          {cli.Direccion || 'Sin asignar'}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {cli.Tiene_Credito_Activo ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px]">
                            <CreditCard className="w-3 h-3" />
                            {cli.Condiciones_Autorizadas}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Solo Contado</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Expediente Histórico */}
                          <button
                            onClick={() => abrirHistorial(cli)}
                            className="p-1.5 text-[#2D5E46] hover:bg-[#DFD5C4]/50 rounded-lg transition"
                            title="Ver Historial de Compras y Saldos"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          {/* Condiciones de Pago */}
                          <button
                            onClick={() => abrirCondicionesCredito(cli)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            title="Gestionar Líneas de Crédito"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>

                          {/* Editar */}
                          <button
                            onClick={() => abrirEditar(cli)}
                            className="p-1.5 text-slate-400 hover:text-[#132B20] hover:bg-slate-100 rounded-lg transition"
                            title="Editar Datos"
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

      {/* ================= MODAL NUEVO PARTICULAR (CON AUTOCONSULTA TSE) ================= */}
      {modalParticularAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132B20]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#DFD5C4] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#2D5E46] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <User className="w-5 h-5 text-white" />
                  Registrar Cliente Particular
                </h3>
                <p className="text-xs text-blue-100 mt-0.5">
                  Cliente Particular &bull; Consulta de Cédula TSE
                </p>
              </div>
              <button
                onClick={() => setModalParticularAbierto(false)}
                className="p-1 text-blue-200 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={guardarParticular} className="p-6 space-y-4 text-xs">
              {/* Campo Cédula Física */}
              <div>
                <label className="block font-bold text-[#132B20] mb-1">Cédula Física / DIMEX *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formParticular.identificacion}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormParticular((prev) => ({ ...prev, identificacion: val }));
                      const digits = val.replace(/\D/g, '');
                      if (digits.length === 9) {
                        consultarTseParticular(digits);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        consultarTseParticular();
                      }
                    }}
                    onBlur={() => {
                      if (formParticular.identificacion.replace(/\D/g, '').length >= 8 && !formParticular.nombre) {
                        consultarTseParticular();
                      }
                    }}
                    placeholder="Ej. 1-1723-0489 (9 dígitos)"
                    className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46] font-mono font-bold text-[#132B20]"
                    required
                  />
                  {consultandoTse && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[#2D5E46]">
                      <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                      <span className="text-[10px] font-semibold">Cargando...</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#132B20] mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={formParticular.nombre}
                    onChange={(e) => setFormParticular({ ...formParticular, nombre: e.target.value })}
                    placeholder="Ej. Edwin Steven"
                    className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46] font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#132B20] mb-1">Primer Apellido *</label>
                  <input
                    type="text"
                    value={formParticular.apellido1}
                    onChange={(e) => setFormParticular({ ...formParticular, apellido1: e.target.value })}
                    placeholder="Ej. Barrios"
                    className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46] font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#132B20] mb-1">Segundo Apellido</label>
                  <input
                    type="text"
                    value={formParticular.apellido2}
                    onChange={(e) => setFormParticular({ ...formParticular, apellido2: e.target.value })}
                    placeholder="Ej. Valentin"
                    className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46] font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#132B20] mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={formParticular.telefono}
                    onChange={(e) => setFormParticular({ ...formParticular, telefono: e.target.value })}
                    placeholder="Ej. 8877-6655"
                    className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#132B20] mb-1">Dirección de Domicilio</label>
                <textarea
                  value={formParticular.direccion}
                  onChange={(e) => setFormParticular({ ...formParticular, direccion: e.target.value })}
                  placeholder="Provincia, cantón, señas exactas..."
                  rows={2}
                  className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalParticularAbierto(false)}
                  disabled={guardando}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2 bg-[#2D5E46] hover:bg-[#5C3622] text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {guardando ? 'Guardando en SQL...' : 'Registrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL NUEVO INSTITUCIONAL (CON AUTOCONSULTA HACIENDA) ================= */}
      {modalInstitucionalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132B20]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#DFD5C4] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#5C3622] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Building className="w-5 h-5 text-white" />
                  Registrar Cliente Institucional
                </h3>
                <p className="text-xs text-indigo-100 mt-0.5">
                  Cliente Institucional &bull; Consulta Tributaria
                </p>
              </div>
              <button
                onClick={() => setModalInstitucionalAbierto(false)}
                className="p-1 text-indigo-200 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={guardarInstitucional} className="p-6 space-y-4 text-xs">
              {/* Cédula Jurídica */}
              <div>
                <label className="block font-bold text-[#132B20] mb-1">Cédula Jurídica *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formInstitucional.cedulaJuridica}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormInstitucional((prev) => ({ ...prev, cedulaJuridica: val }));
                      const digits = val.replace(/\D/g, '');
                      if (digits.length === 10 && digits !== ultimaJuridicaConsultada.current) {
                        ultimaJuridicaConsultada.current = digits;
                        consultarHaciendaInstitucional(digits);
                      }
                    }}
                    placeholder="Ej. 3-101-123456 (10 dígitos)"
                    className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46] font-mono font-bold text-[#132B20]"
                    required
                  />
                  {consultandoTse && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-indigo-600">
                      <div className="w-4 h-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                      <span className="text-[10px] font-semibold">Cargando...</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#132B20] mb-1">Teléfono Institucional</label>
                  <input
                    type="text"
                    value={formInstitucional.telefono}
                    onChange={(e) => setFormInstitucional({ ...formInstitucional, telefono: e.target.value })}
                    placeholder="Ej. 2551-0000"
                    className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#132B20] mb-1">Correo Institucional</label>
                  <input
                    type="email"
                    value={formInstitucional.correoContacto}
                    onChange={(e) => setFormInstitucional({ ...formInstitucional, correoContacto: e.target.value })}
                    placeholder="administracion@institucion.cr"
                    className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#132B20] mb-1">Razón Social / Nombre Oficial *</label>
                <input
                  type="text"
                  value={formInstitucional.razonSocial}
                  onChange={(e) => setFormInstitucional({ ...formInstitucional, razonSocial: e.target.value })}
                  placeholder="Ej. Junta de Educación / Sociedad Anónima"
                  className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46] font-bold"
                  required
                />
              </div>

              <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3 space-y-3">
                <span className="font-bold text-amber-900 uppercase tracking-wider text-[10px] block">
                  Persona de Contacto / Encargado de Compras
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Nombre del Contacto</label>
                    <input
                      type="text"
                      value={formInstitucional.nombreContacto}
                      onChange={(e) => setFormInstitucional({ ...formInstitucional, nombreContacto: e.target.value })}
                      placeholder="Ej. Licda. Karen Solano"
                      className="w-full px-3 py-1.5 bg-white border border-[#DFD5C4] rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Teléfono Directo</label>
                    <input
                      type="text"
                      value={formInstitucional.telefonoContacto}
                      onChange={(e) => setFormInstitucional({ ...formInstitucional, telefonoContacto: e.target.value })}
                      placeholder="Ej. 8899-1122"
                      className="w-full px-3 py-1.5 bg-white border border-[#DFD5C4] rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#132B20] mb-1">Dirección Institucional</label>
                <textarea
                  value={formInstitucional.direccion}
                  onChange={(e) => setFormInstitucional({ ...formInstitucional, direccion: e.target.value })}
                  placeholder="Ubicación física del recinto..."
                  rows={2}
                  className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalInstitucionalAbierto(false)}
                  disabled={guardando}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2 bg-[#5C3622] hover:bg-[#C05A3E] text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {guardando ? 'Guardando en SQL...' : 'Registrar Institución'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL EDITAR CLIENTE ================= */}
      {modalEditarAbierto && clienteSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132B20]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#DFD5C4] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#1A3D2F] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-amber-400" />
                  Editar Cliente #{clienteSeleccionado.Id_Cliente}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {clienteSeleccionado.Numero_Identificacion} &bull; {clienteSeleccionado.Tipo_Cliente}
                </p>
              </div>
              <button
                onClick={() => setModalEditarAbierto(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={guardarEdicion} className="p-6 space-y-4 text-xs">
              {clienteSeleccionado.Tipo_Cliente === 'Particular' ? (
                <>
                  <div>
                    <label className="block font-bold text-[#132B20] mb-1">Nombre</label>
                    <input
                      type="text"
                      value={formEditar.nombre}
                      onChange={(e) => setFormEditar({ ...formEditar, nombre: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46] font-semibold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#132B20] mb-1">Primer Apellido</label>
                      <input
                        type="text"
                        value={formEditar.apellido1}
                        onChange={(e) => setFormEditar({ ...formEditar, apellido1: e.target.value })}
                        className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46] font-semibold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#132B20] mb-1">Segundo Apellido</label>
                      <input
                        type="text"
                        value={formEditar.apellido2}
                        onChange={(e) => setFormEditar({ ...formEditar, apellido2: e.target.value })}
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
                      value={formEditar.razonSocial}
                      onChange={(e) => setFormEditar({ ...formEditar, razonSocial: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46] font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#132B20] mb-1">Nombre de Contacto</label>
                    <input
                      type="text"
                      value={formEditar.nombreContacto}
                      onChange={(e) => setFormEditar({ ...formEditar, nombreContacto: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#132B20] mb-1">Teléfono Contacto</label>
                      <input
                        type="text"
                        value={formEditar.telefonoContacto}
                        onChange={(e) => setFormEditar({ ...formEditar, telefonoContacto: e.target.value })}
                        className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#132B20] mb-1">Correo Contacto</label>
                      <input
                        type="email"
                        value={formEditar.correoContacto}
                        onChange={(e) => setFormEditar({ ...formEditar, correoContacto: e.target.value })}
                        className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block font-bold text-[#132B20] mb-1">Teléfono General</label>
                <input
                  type="text"
                  value={formEditar.telefono}
                  onChange={(e) => setFormEditar({ ...formEditar, telefono: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#132B20] mb-1">Dirección</label>
                <textarea
                  value={formEditar.direccion}
                  onChange={(e) => setFormEditar({ ...formEditar, direccion: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="chkEstadoCliente"
                  checked={formEditar.estado}
                  onChange={(e) => setFormEditar({ ...formEditar, estado: e.target.checked })}
                  className="w-4 h-4 rounded text-[#2D5E46] focus:ring-[#2D5E46]"
                />
                <label htmlFor="chkEstadoCliente" className="font-bold text-[#132B20] cursor-pointer">
                  Cliente Activo para Facturación
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalEditarAbierto(false)}
                  disabled={guardando}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2 bg-[#1A3D2F] hover:bg-[#132B20] text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {guardando ? 'Guardando en SQL...' : 'Actualizar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL EXPEDIENTE / HISTORIAL OPERACIONES ================= */}
      {modalHistorialAbierto && clienteSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132B20]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-2xl border border-[#DFD5C4] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#132B20] text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2D5E46]/30 border border-blue-400/40 flex items-center justify-center text-blue-400">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    Expediente Histórico del Cliente: {clienteSeleccionado.Nombre_O_RazonSocial}
                  </h3>
                  <p className="text-xs text-slate-400">
                    ID #{clienteSeleccionado.Id_Cliente} &bull; Cédula: {clienteSeleccionado.Numero_Identificacion} &bull; Historial de Movimientos
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalHistorialAbierto(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              {cargandoModal ? (
                <div className="p-12 text-center">
                  <RefreshCw className="w-6 h-6 text-[#2D5E46] animate-spin mx-auto mb-2" />
                  <p className="text-[#5C3622] font-medium">Cargando historial de compras y pagos...</p>
                </div>
              ) : historialOperaciones.length === 0 ? (
                <div className="p-12 text-center bg-[#FAF7F0] rounded-2xl border border-[#DFD5C4]">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-[#132B20]">Sin historial de operaciones registrado</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Este cliente aún no registra órdenes de venta o facturas en el sistema.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-[#DFD5C4] rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF7F0] text-slate-600 font-semibold border-b border-[#DFD5C4] uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Fecha</th>
                        <th className="py-2.5 px-3">Tipo Operación</th>
                        <th className="py-2.5 px-3">N° Documento</th>
                        <th className="py-2.5 px-3">Condición</th>
                        <th className="py-2.5 px-3 text-right">Monto Total</th>
                        <th className="py-2.5 px-3 text-right">Saldo Pendiente</th>
                        <th className="py-2.5 px-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {historialOperaciones.map((op, idx) => (
                        <tr key={idx} className="hover:bg-[#FAF7F0]/70">
                          <td className="py-2.5 px-3 whitespace-nowrap text-[#5C3622]">
                            {new Date(op.Fecha_Operacion || op.Fecha).toLocaleDateString('es-CR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {op.Tipo_Operacion || 'Factura de Venta'}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#2D5E46]">
                            {op.Numero_Documento || op.Numero_Factura || `FAC-#${op.Id_Factura}`}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {op.Condicion_Pago || 'Contado'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-[#132B20]">
                            ₡{parseFloat(op.Monto_Total || op.Total || 0).toLocaleString('es-CR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                            ₡{parseFloat(op.Saldo_Pendiente || 0).toLocaleString('es-CR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                op.Estado === 'Cancelada' || op.Estado === 'PAGADA'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : op.Estado === 'Anulada'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {op.Estado || 'Emitida'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-4 bg-[#FAF7F0] border-t border-[#DFD5C4] flex justify-end shrink-0">
              <button
                onClick={() => setModalHistorialAbierto(false)}
                className="px-5 py-2 bg-[#1A3D2F] hover:bg-[#132B20] text-white font-bold rounded-xl transition"
              >
                Cerrar Expediente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL LÍNEAS DE CRÉDITO ================= */}
      {modalCreditoAbierto && clienteSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132B20]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#DFD5C4] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-amber-500 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-white" />
                  Líneas de Crédito Autorizadas
                </h3>
                <p className="text-xs text-amber-100 mt-0.5">
                  Cliente: {clienteSeleccionado.Nombre_O_RazonSocial} &bull; Condiciones y Línea de Crédito
                </p>
              </div>
              <button
                onClick={() => setModalCreditoAbierto(false)}
                className="p-1 text-amber-200 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              {/* Autorizar nueva condición */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4">
                <span className="font-bold text-amber-900 block mb-2">
                  Autorizar Nueva Condición de Crédito:
                </span>
                <div className="flex gap-2">
                  <select
                    value={nuevaCondicionId}
                    onChange={(e) => setNuevaCondicionId(e.target.value)}
                    className="flex-1 bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {condicionesPagoCatalogo
                      .filter((c) => c.Dias_Credito > 0)
                      .map((c) => (
                        <option key={c.Id_Condicion_Pago} value={c.Id_Condicion_Pago}>
                          {c.Nombre} ({c.Dias_Credito} días)
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={autorizarCondicion}
                    disabled={guardando}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition shadow-sm disabled:opacity-50"
                  >
                    {guardando ? 'Guardando...' : 'Autorizar'}
                  </button>
                </div>
              </div>

              {/* Lista actual de condiciones */}
              <div>
                <span className="font-bold text-[#132B20] block mb-2">Condiciones Actuales del Cliente:</span>
                {cargandoModal ? (
                  <div className="p-4 text-center">
                    <RefreshCw className="w-5 h-5 text-amber-500 animate-spin mx-auto" />
                  </div>
                ) : condicionesCliente.length === 0 ? (
                  <p className="text-slate-400 italic text-center py-4 bg-[#FAF7F0] rounded-xl border border-[#DFD5C4]">
                    Este cliente no posee condiciones de crédito autorizadas (solo ventas de contado).
                  </p>
                ) : (
                  <div className="space-y-2">
                    {condicionesCliente.map((cond) => (
                      <div
                        key={cond.Id_Condicion_Pago}
                        className="flex items-center justify-between p-3 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl"
                      >
                        <div>
                          <span className="font-bold text-slate-800 block text-xs">{cond.Nombre}</span>
                          <span className="text-[10px] text-slate-400">
                            Plazo: {cond.Dias_Credito} días &bull; Estado: {cond.Estado ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        <button
                          onClick={() => deshabilitarCondicion(cond.Id_Condicion_Pago)}
                          disabled={guardando}
                          className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-[10px] font-bold transition disabled:opacity-50"
                        >
                          Revocar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-[#FAF7F0] border-t border-[#DFD5C4] flex justify-end">
              <button
                onClick={() => setModalCreditoAbierto(false)}
                className="px-4 py-2 bg-[#1A3D2F] hover:bg-[#132B20] text-white font-bold rounded-xl transition"
              >
                Finalizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
