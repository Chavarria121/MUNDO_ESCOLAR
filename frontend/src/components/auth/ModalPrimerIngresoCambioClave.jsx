import React, { useState } from 'react';
import { Lock, ShieldAlert, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function ModalPrimerIngresoCambioClave() {
  const { user, actualizarUsuario, logout } = useAuth();
  const toast = useToast();

  const [completado, setCompletado] = useState(false);
  const [contrasenaActual, setContrasenaActual] = useState('');
  const [contrasenaNueva, setContrasenaNueva] = useState('');
  const [confirmarClave, setConfirmarClave] = useState('');
  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Solo se despliega si el usuario está autenticado y tiene activa la bandera de cambio obligatorio
  if (!user || !user.requiereCambioContrasena || completado) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!contrasenaActual.trim()) {
      setErrorMsg('Debe ingresar la contraseña temporal que recibió en su correo.');
      return;
    }
    if (contrasenaNueva.length < 8) {
      setErrorMsg('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (contrasenaNueva === contrasenaActual) {
      setErrorMsg('La nueva contraseña no puede ser idéntica a la contraseña temporal.');
      return;
    }
    if (contrasenaNueva !== confirmarClave) {
      setErrorMsg('La confirmación de contraseña no coincide.');
      return;
    }

    setCargando(true);
    try {
      const res = await api.post('/auth/cambiar-contrasena', {
        contrasenaActual: contrasenaActual.trim(),
        contrasenaNueva: contrasenaNueva.trim(),
      });

      // Desactivar modal inmediatamente y actualizar estado global
      setCompletado(true);
      if (typeof actualizarUsuario === 'function') {
        actualizarUsuario({ requiereCambioContrasena: false });
      }

      toast.success(
        '¡Bienvenido(a)!',
        res.data?.mensaje || 'Contraseña definitiva establecida correctamente.'
      );
    } catch (err) {
      console.error('Error al cambiar contraseña inicial:', err);
      setErrorMsg(
        err.response?.data?.message ||
        err.response?.data?.mensaje ||
        'Error al actualizar la contraseña. Verifique que la contraseña temporal sea correcta.'
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#132B20]/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#DFD5C4] shadow-premium p-6 sm:p-8 space-y-6">
        
        {/* Encabezado */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-[#C05A3E] to-[#5C3622] text-[#FAF7F0] flex items-center justify-center shadow-terracotta">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-[#132B20]">¡Hola, {user?.primerNombre || 'Bienvenido(a)'}!</h2>
          <p className="text-xs font-bold text-[#C05A3E] uppercase tracking-wider">Primer Inicio de Sesión</p>
          <p className="text-xs text-[#5C3622] leading-relaxed">
            Por su seguridad, debe cambiar la <strong>contraseña temporal</strong> que recibió por correo y definir su <strong>contraseña personal definitiva</strong> para poder operar en el sistema.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Contraseña Temporal Actual */}
          <div>
            <label className="block text-xs font-bold text-[#5C3622] mb-1 uppercase tracking-wider">
              Contraseña Temporal Actual
            </label>
            <div className="relative">
              <input
                type={showActual ? 'text' : 'password'}
                value={contrasenaActual}
                onChange={(e) => setContrasenaActual(e.target.value)}
                placeholder="La clave que recibió por correo"
                className="w-full pl-3.5 pr-11 py-2.5 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl text-sm text-[#132B20] focus:outline-none focus:ring-2 focus:ring-[#C05A3E] transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowActual(!showActual)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#5C3622]/60 hover:text-[#C05A3E] transition cursor-pointer"
                title={showActual ? 'Ocultar contraseña' : 'Ver contraseña'}
                tabIndex={-1}
              >
                {showActual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Nueva Contraseña Personal */}
          <div>
            <label className="block text-xs font-bold text-[#5C3622] mb-1 uppercase tracking-wider">
              Nueva Contraseña Personal
            </label>
            <div className="relative">
              <input
                type={showNueva ? 'text' : 'password'}
                value={contrasenaNueva}
                onChange={(e) => setContrasenaNueva(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="w-full pl-3.5 pr-11 py-2.5 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl text-sm text-[#132B20] focus:outline-none focus:ring-2 focus:ring-[#C05A3E] transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowNueva(!showNueva)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#5C3622]/60 hover:text-[#C05A3E] transition cursor-pointer"
                title={showNueva ? 'Ocultar contraseña' : 'Ver contraseña'}
                tabIndex={-1}
              >
                {showNueva ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirmar Nueva Contraseña */}
          <div>
            <label className="block text-xs font-bold text-[#5C3622] mb-1 uppercase tracking-wider">
              Confirmar Nueva Contraseña
            </label>
            <div className="relative">
              <input
                type={showConfirmar ? 'text' : 'password'}
                value={confirmarClave}
                onChange={(e) => setConfirmarClave(e.target.value)}
                placeholder="Repita su nueva contraseña"
                className="w-full pl-3.5 pr-11 py-2.5 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl text-sm text-[#132B20] focus:outline-none focus:ring-2 focus:ring-[#C05A3E] transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmar(!showConfirmar)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#5C3622]/60 hover:text-[#C05A3E] transition cursor-pointer"
                title={showConfirmar ? 'Ocultar contraseña' : 'Ver contraseña'}
                tabIndex={-1}
              >
                {showConfirmar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={logout}
              className="w-1/3 py-3 px-3 rounded-xl border border-[#DFD5C4] text-[#5C3622] font-semibold text-xs hover:bg-[#FAF7F0] transition cursor-pointer"
            >
              Cerrar Sesión
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="w-2/3 py-3 px-4 rounded-xl bg-gradient-to-r from-[#2D5E46] to-[#132B20] text-[#FAF7F0] font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <span>{cargando ? 'Actualizando...' : 'Definir Mi Contraseña'}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
