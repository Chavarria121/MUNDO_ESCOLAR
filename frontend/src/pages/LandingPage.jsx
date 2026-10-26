import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Printer,
  FileText,
  ShieldCheck,
  Boxes,
  Briefcase,
  Users,
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle2,
  Lock,
  Loader2,
  X,
} from 'lucide-react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';

// Cálculo dinámico del horario comercial oficial de Liberia (UTC-6)
function getStoreStatus() {
  const now = new Date();
  const crDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Costa_Rica' }));
  const day = crDate.getDay(); // 0: Domingo, 1: Lunes, ..., 6: Sábado
  const hour = crDate.getHours();
  const minute = crDate.getMinutes();
  const currentMinutes = hour * 60 + minute;

  // Lunes a Viernes: 7:30 AM (450 min) a 6:00 PM (1080 min)
  // Sábados: 8:00 AM (480 min) a 3:00 PM (900 min)
  // Domingos: Cerrado
  if (day >= 1 && day <= 5) {
    if (currentMinutes >= 450 && currentMinutes < 1080) {
      return {
        isOpen: true,
        badgeText: 'Abierto Ahora',
        detailText: 'Cierra hoy a las 6:00 PM',
      };
    } else if (currentMinutes < 450) {
      return {
        isOpen: false,
        badgeText: 'Cerrado Ahora',
        detailText: 'Abre hoy a las 7:30 AM',
      };
    } else {
      return {
        isOpen: false,
        badgeText: 'Cerrado Ahora',
        detailText: day === 5 ? 'Abre mañana sábado a las 8:00 AM' : 'Abre mañana a las 7:30 AM',
      };
    }
  } else if (day === 6) {
    if (currentMinutes >= 480 && currentMinutes < 900) {
      return {
        isOpen: true,
        badgeText: 'Abierto Ahora',
        detailText: 'Cierra hoy a las 3:00 PM',
      };
    } else if (currentMinutes < 480) {
      return {
        isOpen: false,
        badgeText: 'Cerrado Ahora',
        detailText: 'Abre hoy a las 8:00 AM',
      };
    } else {
      return {
        isOpen: false,
        badgeText: 'Cerrado Ahora',
        detailText: 'Abre el lunes a las 7:30 AM',
      };
    }
  } else {
    return {
      isOpen: false,
      badgeText: 'Cerrado Ahora',
      detailText: 'Abre el lunes a las 7:30 AM',
    };
  }
}

// Ilustración Arquitectónica Minimalista en Trazos Suaves y Curvos - Iglesia de Liberia (Despejada y Visible)
function IglesiaLiberiaLineArt({ className = "w-full h-full text-[#FAF7F0]" }) {
  return (
    <svg
      viewBox="0 0 540 540"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        {/* Degradado luminoso sunset visible y nítido */}
        <linearGradient id="glowLineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FAF7F0" stopOpacity="0.4" />
          <stop offset="35%" stopColor="#FFD6A5" stopOpacity="0.75" />
          <stop offset="80%" stopColor="#FAF7F0" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#E59364" stopOpacity="0.7" />
        </linearGradient>
      </defs>

      {/* TRAZO SUAVE Y ORGÁNICO EN CURVAS BÉZIER: Nave baja despejada y Torre esbelta que asciende */}
      <path
        d="
          M 15, 500
          L 60, 500
          C 85, 500 100, 475 115, 410
          C 122, 375 135, 375 142, 410
          C 155, 475 170, 500 195, 500
          C 215, 500 235, 440 255, 340
          C 265, 290 280, 290 290, 340
          C 310, 440 330, 500 350, 500
          C 370, 500 385, 475 400, 410
          C 408, 375 420, 375 428, 410
          C 440, 475 455, 500 475, 500
          L 485, 500
          C 495, 500 502, 450 508, 140
          C 510, 100 512, 60 515, 40
          L 515, 20
          M 505, 34 C 505, 32 525, 32 525, 34
          M 515, 20
          C 518, 60 520, 100 522, 140
          C 528, 260 532, 420 538, 500
          L 540, 500
        "
        stroke="url(#glowLineGrad)"
        strokeWidth={2.6}
      />

      {/* ENTRADA SUAVE EN ARCO */}
      <path d="M 262, 500 C 262, 470 284, 470 284, 500" stroke="url(#glowLineGrad)" strokeWidth={2} opacity={0.8} />

      {/* RELOJ ICÓNICO DE LA TORRE */}
      <circle cx={518} cy={220} r={8} stroke="url(#glowLineGrad)" strokeWidth={2} opacity={0.85} />
    </svg>
  );
}

export default function LandingPage({ onGoToLogin }) {
  const toast = useToast();

  // Estado para el modal de registro de clientes (Wireframes 16.2 y 16.3)
  const [showRegistroModal, setShowRegistroModal] = useState(false);
  const [tipoRegistro, setTipoRegistro] = useState('particular');
  const [storeStatus, setStoreStatus] = useState(getStoreStatus());

  // Actualización automática cada 10 segundos según hora local de Liberia
  useEffect(() => {
    const timer = setInterval(() => {
      setStoreStatus(getStoreStatus());
    }, 10000);
    return () => clearInterval(timer);
  }, []);
  // Desplazamiento nativo rápido y fluido (igual que el logo del libro)
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const smoothScrollTo = (targetId) => {
    const target = document.getElementById(targetId);
    if (!target) return;
    const headerOffset = 88;
    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
    window.scrollTo({ top: targetPosition, behavior: 'smooth' });
  }; // 'particular' | 'institucional'
  const [loadingRegistro, setLoadingRegistro] = useState(false);

  const [consultandoTse, setConsultandoTse] = useState(false);
  const [consultandoHacienda, setConsultandoHacienda] = useState(false);
  const ultimaCedulaConsultada = useRef('');
  const ultimaJuridicaConsultada = useRef('');

  // Formulario Particular (Wireframe 16.2 con correo y cédula)
  const [formParticular, setFormParticular] = useState({
    identificacion: '',
    nombre: '',
    apellido1: '',
    apellido2: '',
    correo: '',
    telefono: '',
    direccion: 'Liberia, Guanacaste',
  });

  // Formulario Institucional
  const [formInstitucional, setFormInstitucional] = useState({
    razonSocial: '',
    cedulaJuridica: '',
    nombreContacto: '',
    telefonoContacto: '',
    correoContacto: '',
    direccion: 'Liberia, Guanacaste',
  });

  // Consulta inmediata y automática al Padrón Nacional del TSE (Costa Rica)
  const consultarTseLanding = async (cedula) => {
    const limpia = (cedula || '').replace(/\D/g, '');
    if (limpia.length !== 9) return;
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
        toast.success('Padrón Electoral TSE', `Ciudadano verificado: ${res.data.nombreCompleto}`);
      } else {
        toast.info('Padrón TSE', res.data?.mensaje || 'Cédula no localizada en el padrón electoral.');
      }
    } catch (e) {
      console.error('Error al consultar TSE:', e);
    } finally {
      setConsultandoTse(false);
    }
  };

  // Consulta inmediata a Hacienda / Registro Nacional para instituciones
  const consultarHaciendaLanding = async (cedula) => {
    const limpia = (cedula || '').replace(/\D/g, '');
    if (limpia.length !== 10) return;
    setConsultandoHacienda(true);
    try {
      const res = await api.get(`/clientes/tse/${limpia}`);
      if (res.data?.encontrado) {
        setFormInstitucional((prev) => ({
          ...prev,
          cedulaJuridica: res.data.cedulaJuridica || prev.cedulaJuridica,
          razonSocial: res.data.razonSocial || prev.razonSocial,
        }));
        toast.success('Hacienda / Registro Nacional', `Centro educativo verificado: ${res.data.razonSocial}`);
      }
    } catch (e) {
      console.error('Error al consultar Hacienda:', e);
    } finally {
      setConsultandoHacienda(false);
    }
  };

  const handleSubmitParticular = async (e) => {
    e.preventDefault();
    if (!formParticular.identificacion || !formParticular.nombre || !formParticular.apellido1 || !formParticular.correo || !formParticular.telefono) {
      toast.warning('Datos incompletos', 'Por favor complete todos los campos obligatorios, incluyendo su correo electrónico.');
      return;
    }
    setLoadingRegistro(true);
    try {
      await api.post('/clientes/particular', formParticular);
      toast.success('¡Registro Exitoso!', 'Su perfil de cliente ha sido registrado en Librería Mundo Escolar.');
      setShowRegistroModal(false);
      ultimaCedulaConsultada.current = '';
      setFormParticular({
        identificacion: '',
        nombre: '',
        apellido1: '',
        apellido2: '',
        correo: '',
        telefono: '',
        direccion: 'Liberia, Guanacaste',
      });
    } catch (err) {
      toast.error('Error en registro', err.response?.data?.mensaje || 'No fue posible registrar el cliente.');
    } finally {
      setLoadingRegistro(false);
    }
  };

  const handleSubmitInstitucional = async (e) => {
    e.preventDefault();
    if (!formInstitucional.razonSocial || !formInstitucional.cedulaJuridica || !formInstitucional.nombreContacto || !formInstitucional.telefonoContacto) {
      toast.warning('Datos incompletos', 'Por favor complete todos los campos institucionales.');
      return;
    }
    setLoadingRegistro(true);
    try {
      await api.post('/clientes/institucional', formInstitucional);
      toast.success('¡Solicitud Institucional Enviada!', 'El centro educativo ha sido registrado con éxito.');
      setShowRegistroModal(false);
      setFormInstitucional({
        razonSocial: '',
        cedulaJuridica: '',
        nombreContacto: '',
        telefonoContacto: '',
        correoContacto: '',
        direccion: 'Liberia, Guanacaste',
      });
    } catch (err) {
      toast.error('Error en registro', err.response?.data?.mensaje || 'No fue posible registrar la institución.');
    } finally {
      setLoadingRegistro(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FAF7F0] text-[#132B20] font-sans antialiased selection:bg-[#C05A3E] selection:text-white">
      {/* 1. Header / Navbar Público - Limpio y sin botones redundantes */}
      <header className="sticky top-0 z-40 bg-[#FAF7F0]/95 backdrop-blur-md border-b border-[#DFD5C4] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand - Clickeable para volver al inicio del landing */}
          <button
            type="button"
            onClick={scrollToTop}
            title="Volver al principio de la página"
            className="flex items-center gap-3.5 text-left cursor-pointer group focus:outline-none transition-transform active:scale-98"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#C05A3E] to-[#5C3622] border border-[#FAF7F0]/20 flex items-center justify-center text-[#FAF7F0] shadow-terracotta group-hover:scale-105 group-hover:shadow-lg transition-all duration-200">
              <BookOpen className="w-6 h-6 text-[#FAF7F0]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-[#132B20] tracking-tight group-hover:text-[#C05A3E] transition-colors">
                  Mundo Escolar
                </span>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-[#F3ECE0] text-[#5C3622] border border-[#DFD5C4]">
                  Liberia, CR
                </span>
              </div>
              <p className="text-[11px] text-[#5C3622]/80 font-medium">Librería, Papelería & Centro de Copiado</p>
            </div>
          </button>

          {/* Menú de Navegación */}
          <nav className="flex items-center gap-1.5 sm:gap-4 text-xs font-bold text-[#5C3622]">
            <button
              type="button"
              onClick={() => smoothScrollTo('servicios')}
              className="px-3 py-2 rounded-xl hover:bg-[#F3ECE0] hover:text-[#C05A3E] transition cursor-pointer"
            >
              Servicios
            </button>
            <button
              type="button"
              onClick={() => smoothScrollTo('instituciones')}
              className="px-3 py-2 rounded-xl hover:bg-[#F3ECE0] hover:text-[#C05A3E] transition cursor-pointer"
            >
              Convenios Escolares
            </button>
            <button
              type="button"
              onClick={() => smoothScrollTo('contacto')}
              className="px-3 py-2 rounded-xl hover:bg-[#F3ECE0] hover:text-[#C05A3E] transition cursor-pointer"
            >
              Ubicación & Horarios
            </button>
          </nav>
        </div>
      </header>

      {/* 2. Hero Section - Verde Bosque Tropical y Acentos Terracota */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0B1A13] via-[#132B20] to-[#1A3D2F] text-[#FAF7F0] py-20 lg:py-28 px-4 sm:px-6 lg:px-8 border-b border-[#2D5E46]/40">
        {/* Luces de ambiente decorativas */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#2D5E46]/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#C05A3E]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1A3D2F]/80 border border-[#2D5E46] text-[#DFD5C4] text-xs font-semibold shadow-inner">
              <span className="w-2 h-2 rounded-full bg-[#2D5E46] animate-pulse" />
              <span>Tradición y Servicio Educativo en Liberia, Guanacaste</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#FAF7F0] leading-tight">
              Todo lo que necesitas para estudiar, enseñar y crear en{' '}
              <span className="bg-gradient-to-r from-[#FAF7F0] via-[#DFD5C4] to-[#C05A3E] bg-clip-text text-transparent">
                un solo lugar
              </span>
              .
            </h1>

            <p className="text-sm sm:text-base text-[#DFD5C4]/90 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Acompañamos a estudiantes, docentes, escuelas y colegios con suministros escolares de primera calidad, fotocopiado e impresión digital de alta velocidad, y planes de crédito institucional diseñados para centros educativos.
            </p>

            {/* Los 2 botones solicitados por el usuario */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={() => setShowRegistroModal(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#C05A3E] to-[#D97448] hover:from-[#A84930] hover:to-[#C05A3E] text-sm font-black text-[#FAF7F0] shadow-terracotta transition transform hover:-translate-y-0.5"
              >
                <span>Registrar Cliente / Institución</span>
                <ArrowRight className="w-4 h-4 text-[#FAF7F0]" />
              </button>

              <button
                onClick={onGoToLogin}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#FAF7F0]/10 hover:bg-[#FAF7F0]/20 text-sm font-bold text-[#FAF7F0] border border-[#FAF7F0]/20 transition"
              >
                <Lock className="w-4 h-4 text-[#DFD5C4]" />
                <span>Acceso a Colaboradores</span>
              </button>
            </div>

            {/* Micro badges de confianza */}
            <div className="pt-6 border-t border-[#2D5E46]/40 grid grid-cols-3 gap-4 text-center lg:text-left">
              <div>
                <p className="text-xl sm:text-2xl font-black text-[#FAF7F0]">+15 Años</p>
                <p className="text-[11px] text-[#DFD5C4]/80">Al servicio de Liberia</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-[#FAF7F0]">100%</p>
                <p className="text-[11px] text-[#DFD5C4]/80">Factura Electrónica</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-[#FAF7F0]">Convenios</p>
                <p className="text-[11px] text-[#DFD5C4]/80">Centros Educativos</p>
              </div>
            </div>
          </div>

          {/* Tarjeta Visual de Presentación (sin botón redundante) */}
          <div className="lg:col-span-5 flex justify-center">
            {/* Contenedor relativo que ancla la torre de la iglesia exactamente a la par de su borde */}
            <div className="relative w-full max-w-md">
              {/* Resplandor cálido de atardecer detrás de la torre */}
              <div className="hidden lg:block absolute -right-20 top-20 w-52 h-52 bg-gradient-to-br from-[#D97448]/25 via-[#8B4268]/15 to-transparent rounded-full blur-2xl pointer-events-none z-0" />

              {/* Silueta Arquitectónica: Bajada para que la nave sea 100% visible bajo el contenedor, y la torre suba al lateral */}
              <div 
                className="hidden lg:block absolute -right-[90px] top-[105px] w-[530px] h-[530px] pointer-events-none select-none opacity-80 z-0 overflow-visible"
                aria-hidden="true"
              >
                <IglesiaLiberiaLineArt className="w-full h-full text-[#FAF7F0]" />
              </div>

              {/* Contenedor del Servicio de Mostrador */}
              <div className="relative z-10 w-full bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-[#FAF7F0]/20 shadow-2xl space-y-5 text-[#FAF7F0]">
              <div className="flex items-center justify-between border-b border-[#FAF7F0]/15 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#C05A3E] flex items-center justify-center text-white font-bold">
                    ME
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Servicio de Mostrador</h3>
                    <p className="text-xs text-[#DFD5C4]">Liberia Centro • Tel: 2666-0000</p>
                  </div>
                </div>
                {storeStatus.isOpen ? (
                  <div className="flex flex-col items-end shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#2D5E46] text-[#FAF7F0] border border-[#3E7356]/60 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FAF7F0] animate-pulse" />
                      {storeStatus.badgeText}
                    </span>
                    <span className="text-[10px] text-[#DFD5C4] mt-0.5 font-medium">
                      {storeStatus.detailText}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-end shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#C05A3E]/30 text-[#DFD5C4] border border-[#C05A3E]/60 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C05A3E]" />
                      {storeStatus.badgeText}
                    </span>
                    <span className="text-[10px] text-[#DFD5C4]/90 mt-0.5 font-medium">
                      {storeStatus.detailText}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/20 border border-white/5">
                  <Printer className="w-5 h-5 text-[#D97448] shrink-0" />
                  <div>
                    <p className="font-bold text-[#FAF7F0]">Impresiones y Copias</p>
                    <p className="text-[11px] text-[#DFD5C4]">Láser B/N y Color alta resolución</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/20 border border-white/5">
                  <BookOpen className="w-5 h-5 text-[#2D5E46] shrink-0" />
                  <div>
                    <p className="font-bold text-[#FAF7F0]">Encuadernación Espiral</p>
                    <p className="text-[11px] text-[#DFD5C4]">Empastes de documentos y proyectos</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/20 border border-white/5">
                  <Boxes className="w-5 h-5 text-[#FAF7F0] shrink-0" />
                  <div>
                    <p className="font-bold text-[#FAF7F0]">Listas Escolares Completas</p>
                    <p className="text-[11px] text-[#DFD5C4]">Cuadernos, resmas y papelería</p>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Sección de Servicios Especializados */}
      <section id="servicios" className="scroll-mt-24 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#C05A3E] px-3 py-1 rounded-full bg-[#F3ECE0] border border-[#DFD5C4]">
            Soluciones Integrales
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#132B20]">Nuestros Servicios y Suministros</h2>
          <p className="text-xs sm:text-sm text-[#5C3622]">
            Equipamiento de alta tecnología para impresiones y un extenso inventario de útiles de las marcas más confiables.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Tarjeta 1 */}
          <div className="bg-white rounded-3xl border border-[#DFD5C4] p-6 shadow-subtle hover:border-[#C05A3E] hover:shadow-md transition group">
            <div className="w-12 h-12 rounded-2xl bg-[#F3ECE0] text-[#C05A3E] flex items-center justify-center mb-4 group-hover:scale-105 transition">
              <Printer className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#132B20] mb-1.5">Impresión Digital Láser</h3>
            <p className="text-xs text-[#5C3622] leading-relaxed">
              Impresiones en blanco y negro y color de alta nitidez en papel bond 75g y cartulina. Ideal para tesis, informes técnicos, material escolar y guías didácticas.
            </p>
          </div>

          {/* Tarjeta 2 */}
          <div className="bg-white rounded-3xl border border-[#DFD5C4] p-6 shadow-subtle hover:border-[#C05A3E] hover:shadow-md transition group">
            <div className="w-12 h-12 rounded-2xl bg-[#F3ECE0] text-[#2D5E46] flex items-center justify-center mb-4 group-hover:scale-105 transition">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#132B20] mb-1.5">Fotocopiado de Alta Velocidad</h3>
            <p className="text-xs text-[#5C3622] leading-relaxed">
              Copias simples y doble faz en tamaños Carta y Oficio. Capacidad para tirajes grandes con descuentos especiales para instituciones y centros educativos.
            </p>
          </div>

          {/* Tarjeta 3 */}
          <div className="bg-white rounded-3xl border border-[#DFD5C4] p-6 shadow-subtle hover:border-[#C05A3E] hover:shadow-md transition group">
            <div className="w-12 h-12 rounded-2xl bg-[#F3ECE0] text-[#5C3622] flex items-center justify-center mb-4 group-hover:scale-105 transition">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#132B20] mb-1.5">Encuadernación y Anillado</h3>
            <p className="text-xs text-[#5C3622] leading-relaxed">
              Acabado profesional con pastas plásticas térmicas y transparentes. Espirales plásticos para folletos de 1 hasta más de 200 páginas.
            </p>
          </div>

          {/* Tarjeta 4 */}
          <div className="bg-white rounded-3xl border border-[#DFD5C4] p-6 shadow-subtle hover:border-[#C05A3E] hover:shadow-md transition group">
            <div className="w-12 h-12 rounded-2xl bg-[#F3ECE0] text-[#C05A3E] flex items-center justify-center mb-4 group-hover:scale-105 transition">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#132B20] mb-1.5">Plastificado Térmico</h3>
            <p className="text-xs text-[#5C3622] leading-relaxed">
              Termosellado de carnés escolares, diplomas, gafetes y documentos oficiales para máxima durabilidad y resistencia al uso diario.
            </p>
          </div>

          {/* Tarjeta 5 */}
          <div className="bg-white rounded-3xl border border-[#DFD5C4] p-6 shadow-subtle hover:border-[#C05A3E] hover:shadow-md transition group">
            <div className="w-12 h-12 rounded-2xl bg-[#F3ECE0] text-[#2D5E46] flex items-center justify-center mb-4 group-hover:scale-105 transition">
              <Boxes className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#132B20] mb-1.5">Paquetes de Listas Escolares</h3>
            <p className="text-xs text-[#5C3622] leading-relaxed">
              Atención completa de listas para preescolar, primaria y secundaria: cuadernos, lápices de grafito, lápices de color, borradores, reglas y adhesivos escolares seguros.
            </p>
          </div>

          {/* Tarjeta 6 */}
          <div className="bg-white rounded-3xl border border-[#DFD5C4] p-6 shadow-subtle hover:border-[#C05A3E] hover:shadow-md transition group">
            <div className="w-12 h-12 rounded-2xl bg-[#F3ECE0] text-[#5C3622] flex items-center justify-center mb-4 group-hover:scale-105 transition">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#132B20] mb-1.5">Papelería para Docentes y Oficinas</h3>
            <p className="text-xs text-[#5C3622] leading-relaxed">
              Resmas de papel bond carta y oficio, carpetas de manila, marcadores para pizarra blanca, engrapadoras, perforadoras y suministros administrativos.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Sección de Convenios Escolares y Crédito (sin botón redundante) */}
      <section id="instituciones" className="scroll-mt-24 py-16 bg-[#F3ECE0]/60 border-y border-[#DFD5C4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl border border-[#DFD5C4] p-8 lg:p-12 shadow-subtle grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2D5E46] px-3 py-1 rounded-full bg-[#1A3D2F]/10 border border-[#2D5E46]/30">
                Centros Educativos y Docentes
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#132B20]">
                Convenios y Facilidades de Crédito para Escuelas y Colegios
              </h2>
              <p className="text-xs sm:text-sm text-[#5C3622] leading-relaxed">
                Brindamos líneas de crédito autorizadas a 15, 30 y 60 días para escuelas públicas, colegios técnicos, liceos e instituciones de Liberia y Guanacaste.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-semibold text-[#132B20]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2D5E46] shrink-0" />
                  <span>Crédito a 15, 30 y 60 días</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2D5E46] shrink-0" />
                  <span>Factura Electrónica directa a Hacienda</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2D5E46] shrink-0" />
                  <span>Pedidos anticipados por correo o WhatsApp</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2D5E46] shrink-0" />
                  <span>Descuentos por volumen institucional</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-[#FAF7F0] rounded-2xl p-6 border border-[#DFD5C4] space-y-4 text-xs">
              <h4 className="font-bold text-sm text-[#132B20] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#C05A3E]" />
                <span>¿Cómo afiliar a su institución?</span>
              </h4>
              <p className="text-[#5C3622]">
                1. Presione el botón <strong>Registrar Cliente / Institución</strong> en el encabezado principal.
              </p>
              <p className="text-[#5C3622]">
                2. Ingrese la cédula jurídica y datos de contacto de su centro educativo.
              </p>
              <p className="text-[#5C3622]">
                3. La administración valida y autoriza la condición de crédito correspondiente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Ubicación, Contacto y Horarios (Liberia, Guanacaste) */}
      <section id="contacto" className="scroll-mt-24 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl border border-[#DFD5C4] p-6 shadow-subtle space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#F3ECE0] text-[#C05A3E] flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#132B20]">Ubicación Física</h3>
            <p className="text-xs text-[#5C3622] leading-relaxed">
              Liberia Centro, Guanacaste, Costa Rica.<br />
              150 metros Norte del Parque Central de Liberia, frente a la parada de autobuses estudiantiles.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-[#DFD5C4] p-6 shadow-subtle space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#F3ECE0] text-[#2D5E46] flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#132B20]">Horario de Atención</h3>
            <p className="text-xs text-[#5C3622] leading-relaxed">
              <strong>Lunes a Viernes:</strong> 7:30 AM – 6:00 PM<br />
              <strong>Sábados:</strong> 8:00 AM – 3:00 PM<br />
              <span className="text-[11px] text-[#2D5E46] font-semibold mt-1 block">Jornada continua sin cierre al mediodía</span>
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-[#DFD5C4] p-6 shadow-subtle space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#F3ECE0] text-[#5C3622] flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#132B20]">Contacto & Pedidos</h3>
            <p className="text-xs text-[#5C3622] leading-relaxed">
              <strong>Central Telefónica:</strong> 2666-0000<br />
              <strong>WhatsApp Pedidos:</strong> +506 8888-0000<br />
              <strong>Correo:</strong> ventas@mundoescolar.cr
            </p>
          </div>
        </div>
      </section>

      {/* 6. Footer Oficial (Limpio y sin botón redundante) */}
      <footer className="bg-[#0B1A13] text-[#FAF7F0] border-t border-[#2D5E46]/40 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#C05A3E] flex items-center justify-center text-[#FAF7F0] font-black text-sm">
              ME
            </div>
            <div>
              <p className="font-bold text-sm text-[#FAF7F0]">Librería & Papelería Mundo Escolar</p>
              <p className="text-xs text-[#DFD5C4]/70">Liberia, Guanacaste, Costa Rica • Sistema de Gestión Comercial 2026</p>
            </div>
          </div>

          <div className="text-xs text-[#DFD5C4]/70">
            <span>Tradición y Servicio Educativo en Liberia, Guanacaste</span>
          </div>
        </div>
      </footer>

      {/* 7. Modal de Registro de Cliente (Wireframe 16.2 Particular & 16.3 Institucional) */}
      {showRegistroModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#DFD5C4] shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 bg-[#FAF7F0] border-b border-[#DFD5C4] flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg text-[#132B20]">Registro de Cliente</h3>
                <p className="text-xs text-[#5C3622]">Cree su ficha para facturación electrónica y convenios</p>
              </div>
              <button
                onClick={() => setShowRegistroModal(false)}
                className="w-8 h-8 rounded-full bg-white border border-[#DFD5C4] flex items-center justify-center text-[#5C3622] hover:bg-[#F3ECE0] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selector de Tipo (Wireframe 16.2 vs 16.3) */}
            <div className="p-4 bg-white border-b border-[#DFD5C4] flex gap-2">
              <button
                onClick={() => setTipoRegistro('particular')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                  tipoRegistro === 'particular'
                    ? 'bg-[#132B20] text-[#FAF7F0] shadow-sm'
                    : 'bg-[#FAF7F0] text-[#5C3622] hover:bg-[#F3ECE0]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Persona Particular (16.2)</span>
              </button>

              <button
                onClick={() => setTipoRegistro('institucional')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                  tipoRegistro === 'institucional'
                    ? 'bg-[#132B20] text-[#FAF7F0] shadow-sm'
                    : 'bg-[#FAF7F0] text-[#5C3622] hover:bg-[#F3ECE0]'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Centro Educativo (16.3)</span>
              </button>
            </div>

            {/* Formulario Particular (16.2) */}
            {tipoRegistro === 'particular' && (
              <form onSubmit={handleSubmitParticular} className="p-6 space-y-4 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-[#132B20]">
                      Número de Cédula Física *
                    </label>
                    {consultandoTse ? (
                      <span className="text-[11px] text-[#2D5E46] font-bold flex items-center gap-1.5 animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Consultando TSE...
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#2D5E46] font-bold bg-[#2D5E46]/10 px-2 py-0.5 rounded-full border border-[#2D5E46]/20">
                        Autocompleta con TSE (9 dígitos)
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 501230456 o 5-0123-0456"
                    value={formParticular.identificacion}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormParticular((prev) => ({ ...prev, identificacion: val }));
                      const digits = val.replace(/\D/g, '');
                      if (digits.length === 9 && digits !== ultimaCedulaConsultada.current) {
                        ultimaCedulaConsultada.current = digits;
                        consultarTseLanding(digits);
                      }
                    }}
                    onBlur={() => {
                      const digits = formParticular.identificacion.replace(/\D/g, '');
                      if (digits.length === 9 && digits !== ultimaCedulaConsultada.current) {
                        ultimaCedulaConsultada.current = digits;
                        consultarTseLanding(digits);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFD5C4] bg-[#FAF7F0] focus:ring-2 focus:ring-[#C05A3E] focus:outline-none font-medium"
                  />
                </div>

                {/* Correo Electrónico (Atributo oficial del MER para Facturación y Usuarios) */}
                <div>
                  <label className="block font-bold text-[#132B20] mb-1 flex items-center justify-between">
                    <span>Correo Electrónico *</span>
                    <span className="text-[10px] text-[#5C3622] font-normal">Facturación electrónica y notificaciones</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#5C3622]/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      placeholder="ejemplo@correo.com"
                      value={formParticular.correo}
                      onChange={(e) => setFormParticular({ ...formParticular, correo: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#DFD5C4] bg-[#FAF7F0] focus:ring-2 focus:ring-[#C05A3E] focus:outline-none text-xs font-medium text-[#132B20]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-[#132B20] mb-1">Nombre *</label>
                    <input
                      type="text"
                      required
                      value={formParticular.nombre}
                      onChange={(e) => setFormParticular({ ...formParticular, nombre: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#DFD5C4] bg-[#FAF7F0] focus:ring-2 focus:ring-[#C05A3E] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#132B20] mb-1">1er Apellido *</label>
                    <input
                      type="text"
                      required
                      value={formParticular.apellido1}
                      onChange={(e) => setFormParticular({ ...formParticular, apellido1: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#DFD5C4] bg-[#FAF7F0] focus:ring-2 focus:ring-[#C05A3E] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#132B20] mb-1">2do Apellido</label>
                    <input
                      type="text"
                      value={formParticular.apellido2}
                      onChange={(e) => setFormParticular({ ...formParticular, apellido2: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#DFD5C4] bg-[#FAF7F0] focus:ring-2 focus:ring-[#C05A3E] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#132B20] mb-1">Teléfono *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: 8888-0000"
                      value={formParticular.telefono}
                      onChange={(e) => setFormParticular({ ...formParticular, telefono: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#DFD5C4] bg-[#FAF7F0] focus:ring-2 focus:ring-[#C05A3E] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#132B20] mb-1">Dirección</label>
                    <input
                      type="text"
                      value={formParticular.direccion}
                      onChange={(e) => setFormParticular({ ...formParticular, direccion: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#DFD5C4] bg-[#FAF7F0] focus:ring-2 focus:ring-[#C05A3E] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loadingRegistro}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C05A3E] to-[#5C3622] text-white font-bold text-xs shadow-terracotta hover:from-[#A84930] hover:to-[#452718] transition disabled:opacity-50"
                  >
                    {loadingRegistro ? 'Registrando...' : 'Completar Registro Particular'}
                  </button>
                </div>
              </form>
            )}

            {/* Formulario Institucional (16.3) */}
            {tipoRegistro === 'institucional' && (
              <form onSubmit={handleSubmitInstitucional} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-[#132B20] mb-1">Nombre o Razón Social de la Institución *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Liceo de Liberia / Escuela Ascensión Esquivel"
                    value={formInstitucional.razonSocial}
                    onChange={(e) => setFormInstitucional({ ...formInstitucional, razonSocial: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFD5C4] bg-[#FAF7F0] focus:ring-2 focus:ring-[#C05A3E] focus:outline-none font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-[#132B20]">Cédula Jurídica *</label>
                      {consultandoHacienda ? (
                        <span className="text-[10px] text-[#2D5E46] font-bold animate-pulse">Consultando...</span>
                      ) : (
                        <span className="text-[9px] text-[#2D5E46]">Hacienda (10 dígitos)</span>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Ej: 3-008-045612"
                      value={formInstitucional.cedulaJuridica}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormInstitucional((prev) => ({ ...prev, cedulaJuridica: val }));
                        const digits = val.replace(/\D/g, '');
                        if (digits.length === 10 && digits !== ultimaJuridicaConsultada.current) {
                          ultimaJuridicaConsultada.current = digits;
                          consultarHaciendaLanding(digits);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-[#DFD5C4] bg-[#FAF7F0] focus:ring-2 focus:ring-[#C05A3E] focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#132B20] mb-1">Persona de Contacto *</label>
                    <input
                      type="text"
                      required
                      placeholder="Director / Encargado"
                      value={formInstitucional.nombreContacto}
                      onChange={(e) => setFormInstitucional({ ...formInstitucional, nombreContacto: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#DFD5C4] bg-[#FAF7F0] focus:ring-2 focus:ring-[#C05A3E] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#132B20] mb-1">Teléfono Institucional *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: 2666-1234"
                      value={formInstitucional.telefonoContacto}
                      onChange={(e) => setFormInstitucional({ ...formInstitucional, telefonoContacto: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#DFD5C4] bg-[#FAF7F0] focus:ring-2 focus:ring-[#C05A3E] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#132B20] mb-1">Correo Electrónico (Facturas)</label>
                    <input
                      type="email"
                      placeholder="contacto@colegio.ed.cr"
                      value={formInstitucional.correoContacto}
                      onChange={(e) => setFormInstitucional({ ...formInstitucional, correoContacto: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#DFD5C4] bg-[#FAF7F0] focus:ring-2 focus:ring-[#C05A3E] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loadingRegistro}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#2D5E46] to-[#1A3D2F] text-white font-bold text-xs shadow-md hover:from-[#1A3D2F] hover:to-[#0F2219] transition disabled:opacity-50"
                  >
                    {loadingRegistro ? 'Registrando...' : 'Solicitar Afiliación Institucional'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
