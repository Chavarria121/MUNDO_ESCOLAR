import React, { useState } from 'react';
import {
  BookOpen,
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  Shield,
  Leaf,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage({ onGoToLanding }) {
  const { login, loading } = useAuth();
  const toast = useToast();

  const [nombreUsuario, setNombreUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombreUsuario || !contrasena) {
      toast.warning('Datos incompletos', 'Por favor ingrese su usuario y contraseña');
      return;
    }

    const res = await login(nombreUsuario, contrasena);
    if (res.success) {
      toast.success('¡Bienvenido a Mundo Escolar!', 'Sesión iniciada correctamente');
    } else {
      toast.error('Acceso denegado', res.mensaje || 'Usuario o contraseña incorrectos');
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#FAF7F0] text-[#132B20] font-sans">
      {/* Left Banner Showcase - Verde Bosque Tropical y Madera de Biblioteca */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-gradient-to-br from-[#0B1A13] via-[#132B20] to-[#1A3D2F] border-r border-[#2D5E46]/40 text-[#FAF7F0] overflow-hidden">
        {/* Background decorative glow con tonos terracota y follaje */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#2D5E46]/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#C05A3E]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 top-1/3 w-64 h-64 bg-[#5C3622]/20 rounded-full blur-2xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#C05A3E] to-[#5C3622] border border-[#FAF7F0]/20 flex items-center justify-center shadow-terracotta">
            <BookOpen className="w-6 h-6 text-[#FAF7F0]" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-[#FAF7F0] flex items-center gap-2">
              Librería y Papelería Mundo Escolar
              <span className="text-[10px] uppercase font-bold bg-[#C05A3E]/30 text-[#FAF7F0] border border-[#C05A3E]/60 px-2 py-0.5 rounded-full">
                CR
              </span>
            </h1>
            <p className="text-xs text-[#C8D0B7] font-medium">
              Liberia, Guanacaste, Costa Rica
            </p>
          </div>
        </div>

        {/* Central Educational Showcase */}
        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A3D2F]/80 border border-[#2D5E46] text-[#DFD5C4] text-xs font-semibold shadow-inner">
            <span className="w-2 h-2 rounded-full bg-[#2D5E46] animate-pulse" />
            <span>Sistema Central de Gestión Comercial</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-[#FAF7F0] tracking-tight leading-tight">
            Plataforma Integral de Punto de Venta, Inventario y Facturación
          </h2>

          <p className="text-sm text-[#DFD5C4]/90 leading-relaxed font-normal">
            Control de caja en mostrador, compras a proveedores, catálogo escolar, cobranza institucional y reportes analíticos para la sucursal de Liberia.
          </p>

          <div className="space-y-3 pt-2 text-xs">
            <div className="flex items-center gap-3 text-[#DFD5C4]">
              <div className="w-5 h-5 rounded-full bg-[#C05A3E]/30 text-[#FAF7F0] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#C05A3E]" />
              </div>
              <span className="font-medium">Punto de Venta (POS) con cálculo fiscal costarricense (IVA 1%, 2%, 13%)</span>
            </div>
            <div className="flex items-center gap-3 text-[#DFD5C4]">
              <div className="w-5 h-5 rounded-full bg-[#C05A3E]/30 text-[#FAF7F0] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#C05A3E]" />
              </div>
              <span className="font-medium">Gestión de Kárdex, movimientos y existencias en tiempo real</span>
            </div>
            <div className="flex items-center gap-3 text-[#DFD5C4]">
              <div className="w-5 h-5 rounded-full bg-[#C05A3E]/30 text-[#FAF7F0] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#C05A3E]" />
              </div>
              <span className="font-medium">Control de créditos a instituciones educativas y empresas</span>
            </div>
          </div>
        </div>

        {/* Footer info del banner */}
        <div className="relative z-10 flex items-center justify-between text-xs text-[#DFD5C4]/70 pt-6 border-t border-[#2D5E46]/30">
          <span>Liberia, Gte, CR</span>
          <span className="flex items-center gap-1.5 text-[#FAF7F0]/80">
            <Leaf className="w-3.5 h-3.5 text-[#C05A3E]" />
            Mundo Escolar
          </span>
        </div>
      </div>

      {/* Right Login Form - Blanco Roto / Marfil Luminoso y Terracota Artesanal */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 lg:p-12 bg-[#FAF7F0]">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl border border-[#DFD5C4] shadow-premium space-y-6">
          <div>
            {onGoToLanding && (
              <button
                type="button"
                onClick={onGoToLanding}
                className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#5C3622] hover:text-[#C05A3E] transition group"
              >
                <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                <span>Volver al portal principal</span>
              </button>
            )}

            <div className="lg:hidden flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#C05A3E] to-[#5C3622] flex items-center justify-center text-white shadow-terracotta">
                <BookOpen className="w-5 h-5 text-[#FAF7F0]" />
              </div>
              <div>
                <h1 className="font-bold text-[#132B20]">Mundo Escolar</h1>
                <p className="text-xs text-[#5C3622]">Librería & Papelería</p>
              </div>
            </div>



            <h2 className="text-2xl font-black text-[#132B20] tracking-tight">Iniciar Sesión</h2>
            <p className="text-sm text-[#5C3622]/80 mt-1">
              Ingrese con su identificación y contraseña para acceder al sistema.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Usuario */}
            <div>
              <label className="block text-xs font-bold text-[#5C3622] mb-1.5 uppercase tracking-wider">
                Identificación
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5C3622]/60">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={nombreUsuario}
                  onChange={(e) => setNombreUsuario(e.target.value)}
                  placeholder="Ej. 3-008-045612 o 1-1122-0334"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F0]/80 border border-[#DFD5C4] rounded-xl text-[#132B20] placeholder-[#5C3622]/40 focus:outline-none focus:ring-2 focus:ring-[#C05A3E] focus:border-transparent text-sm transition"
                  required
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-xs font-bold text-[#5C3622] mb-1.5 uppercase tracking-wider">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5C3622]/60">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-12 py-2.5 bg-[#FAF7F0]/80 border border-[#DFD5C4] rounded-xl text-[#132B20] placeholder-[#5C3622]/40 focus:outline-none focus:ring-2 focus:ring-[#C05A3E] focus:border-transparent text-sm transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#5C3622]/60 hover:text-[#5C3622]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#C05A3E] to-[#5C3622] hover:from-[#A84930] hover:to-[#452718] text-[#FAF7F0] font-bold text-sm shadow-terracotta hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group active:scale-[0.99]"
            >
              <span>{loading ? 'Validando...' : 'Entrar al Sistema'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>

          {/* Seguridad y Privacidad */}
          <div className="pt-2 text-center">
            <p className="text-[11px] text-[#5C3622]/70 flex items-center justify-center gap-1">
              <Shield className="w-3.5 h-3.5 text-[#2D5E46]" />
              Conexión cifrada • SQL Server 2022
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
