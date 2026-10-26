import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  BookOpen,
  Receipt,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  User,
  Building,
  Phone,
  MapPin,
  Mail,
  Printer,
  Edit3,
  Save,
  LogOut,
  RefreshCw,
  AlertCircle,
  FileText,
  ShieldCheck,
  CreditCard,
  ChevronRight,
  X
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function PortalClientePage() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [tabActiva, setTabActiva] = useState('historial'); // 'historial' | 'perfil'

  // Formulario de edición de datos (RF1.5)
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [formPerfil, setFormPerfil] = useState({
    telefono: '',
    direccion: '',
    nombreContacto: '',
    telefonoContacto: '',
    correoContacto: '',
  });

  // Modal de Detalle de Factura
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);

  useEffect(() => {
    if (facturaSeleccionada) {
      document.body.classList.add('imprimiendo-modal');
      return () => document.body.classList.remove('imprimiendo-modal');
    }
  }, [facturaSeleccionada]);

  useEffect(() => {
    cargarDatosPortal();
  }, []);

  const cargarDatosPortal = async () => {
    setLoading(true);
    try {
      const res = await api.get('/clientes/portal/mi-perfil');
      if (res.data?.esCliente) {
        setPerfil(res.data.perfil);
        setHistorial(res.data.historial || []);
        setFormPerfil({
          telefono: res.data.perfil.Telefono || '',
          direccion: res.data.perfil.Direccion || '',
          nombreContacto: res.data.perfil.Nombre_Contacto || '',
          telefonoContacto: res.data.perfil.Telefono_Contacto || '',
          correoContacto: res.data.perfil.Correo_Contacto || '',
        });
      } else {
        showToast('No se encontró perfil de cliente vinculado a esta cuenta', 'warning');
      }
    } catch (err) {
      console.error('Error cargando portal de cliente:', err);
      showToast('Error al sincronizar datos del cliente', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarPerfil = async (e) => {
    e.preventDefault();
    setGuardandoPerfil(true);
    try {
      await api.put('/clientes/portal/mi-perfil', {
        telefono: formPerfil.telefono,
        direccion: formPerfil.direccion,
        nombreContacto: formPerfil.nombreContacto,
        telefonoContacto: formPerfil.telefonoContacto,
        correoContacto: formPerfil.correoContacto,
      });
      showToast('¡Información de contacto actualizada con éxito! (RF1.5)', 'success');
      setEditandoPerfil(false);
      cargarDatosPortal();
    } catch (err) {
      console.error('Error actualizando perfil:', err);
      showToast('Error al actualizar datos de contacto', 'error');
    } finally {
      setGuardandoPerfil(false);
    }
  };

  // Cálculos estadísticos en tiempo real
  const totalFacturado = historial.reduce((acc, h) => acc + (Number(h.Monto_Total) || 0), 0);
  const totalSaldoPendiente = historial.reduce((acc, h) => acc + (Number(h.Saldo_Pendiente) || 0), 0);
  const facturasPendientesCount = historial.filter(
    (h) => h.Estado_Factura !== 'Pagada' && h.Estado_Factura !== 'Anulada' && Number(h.Saldo_Pendiente) > 0
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F0] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#2D5E46] to-[#132B20] flex items-center justify-center text-white mb-4 shadow-lg animate-pulse">
          <BookOpen className="w-8 h-8 text-[#FAF7F0]" />
        </div>
        <h2 className="text-xl font-bold text-[#132B20]">Cargando Portal de Cliente...</h2>
        <p className="text-xs text-[#5C3622] mt-1 font-mono">Conectando con SQL Server 2022 • Librería Mundo Escolar</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#132B20] flex flex-col">
      {/* NAVBAR SUPERIOR DEL PORTAL DE CLIENTE */}
      <header className="sticky top-0 z-30 bg-[#FAF7F0]/95 backdrop-blur-md border-b border-[#DFD5C4] px-6 py-3.5 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C05A3E] to-[#5C3622] flex items-center justify-center text-white shadow-terracotta">
              <BookOpen className="w-5 h-5 text-[#FAF7F0]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-[#132B20]">
                  Mundo Escolar
                </span>
                <span className="text-[10px] uppercase font-bold bg-[#2D5E46]/15 text-[#2D5E46] border border-[#2D5E46]/30 px-2 py-0.5 rounded-full">
                  Portal de Cliente
                </span>
              </div>
              <p className="text-[11px] text-[#5C3622]">
                Librería & Papelería • Liberia, Guanacaste
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="font-bold text-xs text-[#132B20] block">
                {perfil?.Nombre_O_RazonSocial}
              </span>
              <span className="text-[10px] text-[#5C3622] font-mono block">
                {perfil?.Tipo_Cliente} • ID: {perfil?.Numero_Identificacion}
              </span>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-[#DFD5C4] text-[#5C3622] hover:text-[#C05A3E] text-xs font-bold rounded-xl shadow-sm transition"
              title="Cerrar sesión segura"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* CUERPO PRINCIPAL DEL PORTAL */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* BANNER DE BIENVENIDA */}
        <div className="bg-gradient-to-r from-[#132B20] via-[#1A3D2F] to-[#2D5E46] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#2D5E46]/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#C05A3E] text-white">
                Cuenta de Cliente Activa
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/10 text-[#DFD5C4] border border-white/20">
                {perfil?.Tipo_Cliente === 'Institucional' ? 'Centro Educativo / Institución' : 'Cliente Particular'}
              </span>
              {perfil?.Tiene_Credito_Activo && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-400 text-slate-900 border border-amber-300">
                  Crédito Comercial Activo
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#FAF7F0] tracking-tight">
              ¡Bienvenido(a), {perfil?.Nombre_O_RazonSocial}!
            </h1>
            <p className="text-xs sm:text-sm text-[#DFD5C4]/90 max-w-2xl leading-relaxed">
              Consulte su historial oficial de facturación, compras registradas y actualice sus datos de contacto en tiempo real según la documentación del sistema.
            </p>
          </div>

          <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-left shrink-0 min-w-[220px]">
            <span className="text-[10px] uppercase font-bold text-[#DFD5C4] tracking-wider block">
              Condición Autorizada:
            </span>
            <span className="text-sm font-extrabold text-white mt-0.5 block flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              {perfil?.Condiciones_Autorizadas || 'Contado'}
            </span>
            <span className="text-[10px] text-[#DFD5C4]/70 mt-1 block">
              Cédula: {perfil?.Numero_Identificacion}
            </span>
          </div>
        </div>

        {/* 3 TARJETAS DE RESUMEN FINANCIERO */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-[#DFD5C4] p-5 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Total Comprado</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2D5E46] flex items-center justify-center font-bold">
                ₡
              </div>
            </div>
            <p className="text-2xl font-black text-[#132B20]">
              ₡{totalFacturado.toLocaleString('es-CR')}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              Historial de operaciones acumuladas
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#DFD5C4] p-5 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Facturas Emitidas</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-[#132B20]">
              {historial.length} {historial.length === 1 ? 'Factura' : 'Facturas'}
            </p>
            <p className="text-[11px] text-emerald-700 font-medium">
              Comprobantes tributarios generados
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#DFD5C4] p-5 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Saldo por Pagar</span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                totalSaldoPendiente > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className={`text-2xl font-black ${
              totalSaldoPendiente > 0 ? 'text-amber-800' : 'text-emerald-700'
            }`}>
              ₡{totalSaldoPendiente.toLocaleString('es-CR')}
            </p>
            <p className="text-[11px] font-medium text-slate-500">
              {totalSaldoPendiente > 0 ? `${facturasPendientesCount} factura(s) a crédito pendiente` : 'Al día • ₡0 pendientes'}
            </p>
          </div>
        </div>

        {/* NAVEGACIÓN POR PESTAÑAS */}
        <div className="flex items-center gap-2 border-b border-[#DFD5C4] pb-1">
          <button
            onClick={() => setTabActiva('historial')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
              tabActiva === 'historial'
                ? 'bg-[#132B20] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-[#DFD5C4]'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Mis Compras y Facturas ({historial.length})</span>
          </button>

          <button
            onClick={() => setTabActiva('perfil')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
              tabActiva === 'perfil'
                ? 'bg-[#132B20] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-[#DFD5C4]'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Mis Datos de Contacto (RF1.5)</span>
          </button>
        </div>

        {/* CONTENIDO TAB 1: HISTORIAL DE COMPRAS (RF1.11) */}
        {tabActiva === 'historial' && (
          <div className="bg-white rounded-2xl border border-[#DFD5C4] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#DFD5C4] bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-[#132B20] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#2D5E46]" />
                  Historial de Operaciones y Facturas Fiscales
                </h3>
                <p className="text-[11px] text-[#5C3622]">
                  Consultado directamente desde el procedimiento oficial <span className="font-mono text-emerald-700">SP_Cliente_HistorialOperaciones</span>
                </p>
              </div>

              <button
                onClick={cargarDatosPortal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-[#DFD5C4] hover:bg-slate-50 rounded-xl transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Actualizar Historial</span>
              </button>
            </div>

            {historial.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Receipt className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-600 text-sm">Aún no registra compras en Mundo Escolar</p>
                <p className="text-xs text-slate-400">Sus facturas emitidas en caja aparecerán aquí automáticamente.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-[#DFD5C4]">
                    <tr>
                      <th className="p-3.5">Factura</th>
                      <th className="p-3.5">Fecha</th>
                      <th className="p-3.5">Condición</th>
                      <th className="p-3.5">Monto Total</th>
                      <th className="p-3.5">Estado Factura</th>
                      <th className="p-3.5">Saldo Pendiente</th>
                      <th className="p-3.5 text-right">Comprobante</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DFD5C4]">
                    {historial.map((h, idx) => {
                      const fechaStr = new Date(h.Fecha).toLocaleString('es-CR');
                      const esPagada = h.Estado_Factura === 'Pagada';
                      const esPendiente = h.Estado_Factura === 'Pendiente';
                      const saldo = Number(h.Saldo_Pendiente) || 0;

                      return (
                        <tr key={idx} className="hover:bg-slate-50/80 transition">
                          <td className="p-3.5 font-bold text-[#132B20]">
                            {h.Id_Factura ? `FAC-${h.Id_Factura.toString().padStart(8, '0')}` : `Venta #${h.Id_Venta}`}
                          </td>
                          <td className="p-3.5 text-slate-600">
                            {fechaStr}
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              h.Condicion_Pago?.includes('Crédito')
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-blue-50 text-blue-800 border-blue-200'
                            }`}>
                              {h.Condicion_Pago}
                            </span>
                          </td>
                          <td className="p-3.5 font-black text-[#132B20] text-sm">
                            ₡{Number(h.Monto_Total).toLocaleString('es-CR')}
                          </td>
                          <td className="p-3.5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                              esPagada
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : esPendiente
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}>
                              {esPagada && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                              {esPendiente && <Clock className="w-3 h-3 text-amber-600" />}
                              <span>{h.Estado_Factura || 'Completada'}</span>
                            </span>
                          </td>
                          <td className="p-3.5">
                            {saldo > 0 ? (
                              <span className="font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                                ₡{saldo.toLocaleString('es-CR')}
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-semibold">
                                ₡0 (Cancelado)
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => setFacturaSeleccionada(h)}
                              className="px-2.5 py-1 text-[11px] font-bold text-[#2D5E46] hover:text-white bg-blue-50 hover:bg-[#2D5E46] border border-blue-200 rounded-lg transition"
                            >
                              Ver Detalle
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* CONTENIDO TAB 2: MIS DATOS DE CONTACTO (RF1.5) */}
        {tabActiva === 'perfil' && (
          <div className="bg-white rounded-2xl border border-[#DFD5C4] shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#DFD5C4] pb-4">
              <div>
                <h3 className="font-bold text-base text-[#132B20]">
                  Información Registrada del Cliente
                </h3>
                <p className="text-xs text-[#5C3622]">
                  Actualice su teléfono, dirección y datos de contacto según el requerimiento <span className="font-mono text-emerald-700">RF1.5</span>
                </p>
              </div>

              {!editandoPerfil ? (
                <button
                  type="button"
                  onClick={() => setEditandoPerfil(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[#132B20] hover:bg-[#1A3D2F] text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar Datos de Contacto</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditandoPerfil(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancelar Edición
                </button>
              )}
            </div>

            <form onSubmit={handleGuardarPerfil} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre / Razón Social (Solo lectura) */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Nombre o Razón Social (TSE / Registro)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={perfil?.Nombre_O_RazonSocial || ''}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-[#DFD5C4] rounded-xl text-slate-600 font-bold"
                  />
                </div>

                {/* Identificación (Solo lectura) */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Identificación / Cédula
                  </label>
                  <input
                    type="text"
                    disabled
                    value={perfil?.Numero_Identificacion || ''}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-[#DFD5C4] rounded-xl text-slate-600 font-mono"
                  />
                </div>

                {/* Teléfono */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#5C3622] uppercase tracking-wider block">
                    Teléfono de Contacto
                  </label>
                  <input
                    type="text"
                    disabled={!editandoPerfil}
                    value={formPerfil.telefono}
                    onChange={(e) => setFormPerfil({ ...formPerfil, telefono: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46] disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>

                {/* Correo Electrónico */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#5C3622] uppercase tracking-wider block">
                    Correo Electrónico
                  </label>
                  <input
                    type="text"
                    disabled
                    value={perfil?.Correo || perfil?.Correo_Usuario || ''}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-[#DFD5C4] rounded-xl text-slate-600 font-mono"
                  />
                </div>
              </div>

              {/* Dirección */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#5C3622] uppercase tracking-wider block">
                  Dirección Física de Entrega / Domicilio
                </label>
                <textarea
                  rows={2}
                  disabled={!editandoPerfil}
                  value={formPerfil.direccion}
                  onChange={(e) => setFormPerfil({ ...formPerfil, direccion: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46] disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              {/* Datos de contacto adicional si es institucional */}
              {perfil?.Tipo_Cliente === 'Institucional' && (
                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-3">
                  <span className="text-xs font-bold text-amber-900 block">
                    Encargado Institucional de Compras
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-600 font-bold block mb-1">Nombre Encargado</label>
                      <input
                        type="text"
                        disabled={!editandoPerfil}
                        value={formPerfil.nombreContacto}
                        onChange={(e) => setFormPerfil({ ...formPerfil, nombreContacto: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg disabled:bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-600 font-bold block mb-1">Teléfono Encargado</label>
                      <input
                        type="text"
                        disabled={!editandoPerfil}
                        value={formPerfil.telefonoContacto}
                        onChange={(e) => setFormPerfil({ ...formPerfil, telefonoContacto: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg disabled:bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-600 font-bold block mb-1">Correo Encargado</label>
                      <input
                        type="email"
                        disabled={!editandoPerfil}
                        value={formPerfil.correoContacto}
                        onChange={(e) => setFormPerfil({ ...formPerfil, correoContacto: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg disabled:bg-slate-50"
                      />
                    </div>
                  </div>
                </div>
              )}

              {editandoPerfil && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={guardandoPerfil}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{guardandoPerfil ? 'Guardando en BD...' : 'Guardar Cambios (SP_Cliente_Actualizar)'}</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        )}
      </main>

      {/* MODAL PARA VER COMPROBANTE FISCAL */}
      {facturaSeleccionada && createPortal(
        <div className="modal-impresion-activa ticket-pos-wrapper fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setFacturaSeleccionada(null); }}>
          <div className="ticket-pos-card bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-[#DFD5C4] overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-dashed border-slate-300 pb-3">
              <div>
                <p className="font-bold text-sm text-[#132B20]">LIBRERÍA MUNDO ESCOLAR</p>
                <p className="text-[11px] text-[#5C3622]">Comprobante de Operación</p>
              </div>
              <button
                onClick={() => setFacturaSeleccionada(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 no-print"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Factura:</span>
                <span className="font-bold">FAC-{facturaSeleccionada.Id_Factura ? facturaSeleccionada.Id_Factura.toString().padStart(8, '0') : facturaSeleccionada.Id_Venta}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Orden de Venta:</span>
                <span>#{facturaSeleccionada.Id_Venta}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fecha:</span>
                <span>{new Date(facturaSeleccionada.Fecha).toLocaleString('es-CR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Condición:</span>
                <span>{facturaSeleccionada.Condicion_Pago}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estado:</span>
                <span className="font-bold">{facturaSeleccionada.Estado_Factura || facturaSeleccionada.Estado_Venta}</span>
              </div>
              <div className="border-t border-slate-300 pt-2 flex justify-between font-bold text-sm text-[#132B20]">
                <span>Total:</span>
                <span>₡{Number(facturaSeleccionada.Monto_Total).toLocaleString('es-CR')}</span>
              </div>
              {Number(facturaSeleccionada.Saldo_Pendiente) > 0 && (
                <div className="flex justify-between text-amber-800 font-bold">
                  <span>Saldo Pendiente:</span>
                  <span>₡{Number(facturaSeleccionada.Saldo_Pendiente).toLocaleString('es-CR')}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir</span>
              </button>
              <button
                type="button"
                onClick={() => setFacturaSeleccionada(null)}
                className="px-4 py-1.5 bg-[#132B20] text-white text-xs font-bold rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}