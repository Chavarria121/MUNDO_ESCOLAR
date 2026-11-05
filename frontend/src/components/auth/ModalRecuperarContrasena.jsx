import React, { useState } from 'react';
import { KeyRound, Mail, ArrowRight, CheckCircle2, AlertCircle, X, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

export default function ModalRecuperarContrasena({ isOpen, onClose }) {
  const toast = useToast();

  const [paso, setPaso] = useState(1); // 1: Solicitar OTP, 2: Confirmar OTP y nueva clave
  const [identificador, setIdentificador] = useState('');
  const [codigoOtp, setCodigoOtp] = useState('');
  const [contrasenaNueva, setContrasenaNueva] = useState('');
  const [confirmarClave, setConfirmarClave] = useState('');
  const [showNueva, setShowNueva] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSolicitarOtp = async (e) => {
    e.preventDefault();
    if (!identificador.trim()) {
      setErrorMsg('Por favor ingrese su cédula, correo o usuario.');
      return;
    }

    setCargando(true);
    setErrorMsg('');
    try {
      const res = await api.post('/auth/solicitar-recuperacion', {
        identificador: identificador.trim(),
      });
      setPaso(2);
      toast.success(
        'Código despachado',
        res.data?.mensaje || 'Se ha enviado un código de verificación a su correo.'
      );
    } catch (err) {
      console.error('Error solicitando OTP:', err);
      setErrorMsg(err.response?.data?.message || 'Error al solicitar el código de recuperación.');
    } finally {
      setCargando(false);
    }
  };

  const handleConfirmarRecuperacion = async (e) => {
    e.preventDefault();
    if (!codigoOtp.trim()) {
      setErrorMsg('Ingrese el código de 6 dígitos que recibió por correo.');
      return;
    }
    if (contrasenaNueva.length < 8) {
      setErrorMsg('La nueva contraseña debe poseer al menos 8 caracteres.');
      return;
    }
    if (contrasenaNueva !== confirmarClave) {
      setErrorMsg('Las contraseñas ingresadas no coinciden.');
      return;
    }

    setCargando(true);
    setErrorMsg('');
    try {
      const res = await api.post('/auth/confirmar-recuperacion', {
        identificador: identificador.trim(),
        codigoOtp: codigoOtp.trim(),
        contrasenaNueva,
      });

      toast.success(
        '¡Contraseña actualizada!',
        res.data?.mensaje || 'Ya puede iniciar sesión con su nueva contraseña personal.'
      );
      handleCerrar();
    } catch (err) {
      console.error('Error confirmando OTP:', err);
      setErrorMsg(
        err.response?.data?.message || 'Código de seguridad incorrecto o contraseña inválida.'
      );
    } finally {
      setCargando(false);
    }
  };

  const handleCerrar = () => {
    setPaso(1);
    setIdentificador('');
    setCodigoOtp('');
    setContrasenaNueva('');
    setConfirmarClave('');
    setShowNueva(false);
    setShowConfirmar(false);
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#132B20]/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-[#DFD5C4] shadow-premium p-6 sm:p-8 space-y-6">
        
        {/* Header con botón cerrar */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#C05A3E] to-[#5C3622] text-[#FAF7F0] flex items-center justify-center shadow-terracotta">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#132B20]">Recuperar Contraseña</h2>
              <p className="text-xs text-[#5C3622]">Seguridad y Acceso Oficial</p>
            </div>
          </div>
          <button
            onClick={handleCerrar}
            className="p-1.5 rounded-xl text-[#5C3622]/60 hover:text-[#5C3622] hover:bg-[#FAF7F0] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* PASO 1: Ingreso de Cédula o Correo */}
        {paso === 1 && (
          <form onSubmit={handleSolicitarOtp} className="space-y-4">
            <p className="text-xs text-[#5C3622] leading-relaxed">
              Ingrese su <strong>número de cédula</strong> o <strong>correo electrónico</strong> registrado. Le enviaremos un código de seguridad de 6 dígitos para redefinir su clave.
            </p>

            <div>
              <label className="block text-xs font-bold text-[#5C3622] mb-1.5 uppercase tracking-wider">
                Cédula o Correo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5C3622]/60">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                  placeholder="Ej: 1-1555-0899 o cliente@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F0]/80 border border-[#DFD5C4] rounded-xl text-[#132B20] text-sm focus:outline-none focus:ring-2 focus:ring-[#C05A3E]"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#C05A3E] to-[#5C3622] hover:from-[#A84930] hover:to-[#452718] text-[#FAF7F0] font-bold text-sm shadow-terracotta transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <span>{cargando ? 'Despachando código...' : 'Enviar Código al Correo'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* PASO 2: Confirmar OTP y Nueva Contraseña */}
        {paso === 2 && (
          <form onSubmit={handleConfirmarRecuperacion} className="space-y-4">
            <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#DFD5C4] text-xs text-[#5C3622]">
              📩 Hemos enviado el código de 6 dígitos al correo asociado a <strong>{identificador}</strong>. Expira en 15 minutos.
            </div>

            <div>
              <label className="block text-xs font-bold text-[#5C3622] mb-1 uppercase tracking-wider">
                Código de 6 Dígitos (OTP)
              </label>
              <input
                type="text"
                value={codigoOtp}
                onChange={(e) => setCodigoOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="492018"
                maxLength={6}
                className="w-full text-center py-2.5 tracking-[6px] font-mono font-bold text-lg bg-[#FAF7F0] border border-[#C05A3E] rounded-xl text-[#132B20] focus:outline-none focus:ring-2 focus:ring-[#C05A3E]"
                required
              />
            </div>

            {/* Nueva Contraseña */}
            <div>
              <label className="block text-xs font-bold text-[#5C3622] mb-1 uppercase tracking-wider">
                Nueva Contraseña
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

            {/* Confirmar Contraseña */}
            <div>
              <label className="block text-xs font-bold text-[#5C3622] mb-1 uppercase tracking-wider">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <input
                  type={showConfirmar ? 'text' : 'password'}
                  value={confirmarClave}
                  onChange={(e) => setConfirmarClave(e.target.value)}
                  placeholder="Repita la nueva contraseña"
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

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPaso(1)}
                className="w-1/3 py-2.5 px-3 rounded-xl border border-[#DFD5C4] text-[#5C3622] font-semibold text-xs hover:bg-[#FAF7F0] cursor-pointer"
              >
                Reenviar
              </button>
              <button
                type="submit"
                disabled={cargando}
                className="w-2/3 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#2D5E46] to-[#132B20] text-[#FAF7F0] font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <span>{cargando ? 'Restableciendo...' : 'Restablecer Clave'}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
