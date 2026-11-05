import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  RefreshCw,
  HardDrive,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  SlidersHorizontal,
  Server,
  Layers,
  Clock,
  Activity,
  X,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function DbaPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [historialBackups, setHistorialBackups] = useState([]);
  const [indices, setIndices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ejecutandoAccion, setEjecutandoAccion] = useState(false);
  const [accionEnCurso, setAccionEnCurso] = useState('');
  const [resultadoVerificacion, setResultadoVerificacion] = useState(null);

  // Pestaña activa: 'BACKUPS' | 'INDICES'
  const [tabActiva, setTabActiva] = useState('BACKUPS');

  // Modal de Confirmación Elegante
  const [modalConfirmacion, setModalConfirmacion] = useState({
    abierto: false,
    titulo: '',
    subtitulo: '',
    mensaje: '',
    accionTipo: null, // 'BACKUP' | 'INDICES'
    payload: null,
    botonTexto: 'Confirmar',
    tipoColor: 'terracota',
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resBackups, resIndices] = await Promise.all([
        api.get('/dba/backups/historial'),
        api.post('/dba/indices/mantenimiento', { modo: 'SoloAnalizar' }),
      ]);

      setHistorialBackups(resBackups.data || []);
      setIndices(resIndices.data || []);
    } catch (err) {
      console.error('Error cargando datos de mantenimiento:', err);
      showToast('Error consultando catálogo de mantenimiento', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Abrir Modal de Confirmación para Backups
  const abrirConfirmacionBackup = (tipo) => {
    setModalConfirmacion({
      abierto: true,
      titulo: `Generar Copia de Seguridad ${tipo}`,
      subtitulo: 'Procedimiento DBA • Mundo Escolar',
      mensaje: `¿Desea generar una copia de seguridad ${tipo.toLowerCase()} del sistema Mundo Escolar? Se comprimirá con algoritmo nativo en C:\\SQLBackup y se comprobará su integridad física de inmediato.`,
      accionTipo: 'BACKUP',
      payload: tipo,
      botonTexto: `Generar Copia ${tipo}`,
      tipoColor: tipo === 'Completo' ? 'terracota' : 'verde',
    });
  };

  // Abrir Modal de Confirmación para Optimización de Índices
  const abrirConfirmacionIndices = () => {
    setModalConfirmacion({
      abierto: true,
      titulo: 'Optimización de Búsquedas y Catálogos',
      subtitulo: 'Procedimiento DBA • Mantenimiento de Índices',
      mensaje: '¿Desea optimizar el sistema para agilizar las búsquedas y consultas del catálogo? Se reorganizarán y desfragmentarán los índices en segundo plano.',
      accionTipo: 'INDICES',
      payload: null,
      botonTexto: 'Iniciar Optimización',
      tipoColor: 'terracota',
    });
  };

  // Confirmar acción desde el modal
  const confirmarAccionModal = () => {
    const { accionTipo, payload } = modalConfirmacion;
    setModalConfirmacion((prev) => ({ ...prev, abierto: false }));

    if (accionTipo === 'BACKUP') {
      ejecutarBackup(payload);
    } else if (accionTipo === 'INDICES') {
      ejecutarMantenimientoIndices();
    }
  };

  // Ejecutar Backup
  const ejecutarBackup = async (tipo) => {
    setEjecutandoAccion(true);
    setAccionEnCurso(`Generando copia de seguridad ${tipo}...`);
    try {
      let endpoint = '/dba/backups/completo';
      if (tipo === 'Diferencial') endpoint = '/dba/backups/diferencial';
      if (tipo === 'Log de Transacciones') endpoint = '/dba/backups/log';

      await api.post(endpoint, {});
      showToast(`¡Copia de seguridad ${tipo.toLowerCase()} generada con éxito!`, 'success');
      cargarDatos();
    } catch (err) {
      console.error('Error en backup:', err);
      const msg = err.response?.data?.mensaje || 'Error ejecutando procedimiento de respaldo';
      showToast(msg, 'error');
    } finally {
      setEjecutandoAccion(false);
      setAccionEnCurso('');
    }
  };

  // Verificar Integridad
  const verificarIntegridad = async (rutaArchivo) => {
    setEjecutandoAccion(true);
    setAccionEnCurso('Comprobando copia de seguridad...');
    setResultadoVerificacion(null);
    try {
      const res = await api.post('/dba/backups/verificar', {
        rutaArchivoBak: rutaArchivo,
      });

      setResultadoVerificacion(res.data);
      showToast('¡Copia de seguridad comprobada y en perfecto estado!', 'success');
    } catch (err) {
      console.error('Error verificando backup:', err);
      const msg = err.response?.data?.mensaje || 'Error verificando integridad física';
      showToast(msg, 'error');
    } finally {
      setEjecutandoAccion(false);
      setAccionEnCurso('');
    }
  };

  // Ejecutar Mantenimiento de Índices
  const ejecutarMantenimientoIndices = async () => {
    setEjecutandoAccion(true);
    setAccionEnCurso('Optimizando búsquedas y rendimiento...');
    try {
      const res = await api.post('/dba/indices/mantenimiento', { modo: 'Ejecutar' });
      setIndices(res.data || []);
      showToast('Optimización del sistema ejecutada con éxito', 'success');
    } catch (err) {
      console.error('Error en mantenimiento de índices:', err);
      const msg = err.response?.data?.mensaje || 'Error al ejecutar la optimización';
      showToast(msg, 'error');
    } finally {
      setEjecutandoAccion(false);
      setAccionEnCurso('');
    }
  };

  // Métricas
  const ultimoBackup = historialBackups[0];
  const ratioCompresion = useMemo(() => {
    if (!ultimoBackup) return 'N/A';
    const orig = Number(ultimoBackup.TamanoMB || 0);
    const comp = Number(ultimoBackup.TamanoComprimidoMB || 0);
    if (!orig || !comp) return 'N/A';
    return `${Math.round((1 - comp / orig) * 100)}% ahorro`;
  }, [ultimoBackup]);

  return (
    <div className="space-y-6 text-[#132B20]">
      {/* Header - Terracota, Madera y Marfil */}
      <div className="bg-white rounded-3xl border border-[#DFD5C4] p-6 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#C05A3E] to-[#5C3622] flex items-center justify-center text-[#FAF7F0] shadow-terracotta">
              <Database className="w-5 h-5 text-[#FAF7F0]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#132B20] tracking-tight flex items-center gap-2">
                Centro de Mantenimiento y Respaldos
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#F3ECE0] text-[#5C3622] border border-[#DFD5C4]">
                  Respaldo del Sistema &bull; Mundo Escolar
                </span>
              </h2>
              <p className="text-xs text-[#5C3622]/80 mt-0.5">
                Librería & Papelería Mundo Escolar &bull; Liberia, Guanacaste &bull; Copias de Seguridad y Optimización de Catálogos
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={cargarDatos}
            disabled={loading || ejecutandoAccion}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-[#132B20] bg-[#FAF7F0] hover:bg-[#F3ECE0] border border-[#DFD5C4] rounded-xl transition shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#5C3622] ${loading ? 'animate-spin' : ''}`} />
            <span>Refrescar</span>
          </button>

          <button
            onClick={() => abrirConfirmacionBackup('Completo')}
            disabled={ejecutandoAccion}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#C05A3E] to-[#D97448] hover:from-[#AA4C33] hover:to-[#C05A3E] text-[#FAF7F0] text-xs font-black rounded-xl shadow-terracotta transition disabled:opacity-50 active:scale-95 border border-[#FAF7F0]/20"
          >
            <HardDrive className="w-4 h-4 text-[#FAF7F0]" />
            <span>Copia Completa</span>
          </button>

          <button
            onClick={() => abrirConfirmacionBackup('Diferencial')}
            disabled={ejecutandoAccion}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#132B20] hover:bg-[#1A3D2F] text-[#FAF7F0] text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50 border border-[#2D5E46]/40"
          >
            <Clock className="w-4 h-4 text-[#DFD5C4]" />
            <span>Copia Rápida</span>
          </button>
        </div>
      </div>

      {/* Alerta de Ejecución en Curso */}
      {ejecutandoAccion && (
        <div className="bg-[#F3ECE0] border border-[#C05A3E]/40 rounded-2xl p-4 flex items-center gap-3.5 text-xs text-[#132B20] shadow-sm animate-pulse">
          <div className="w-4 h-4 border-2 border-[#5C3622] border-t-[#C05A3E] rounded-full animate-spin shrink-0" />
          <div className="flex-1">
            <span className="font-bold text-[#5C3622] block">{accionEnCurso}</span>
            <span className="text-[#5C3622]/80">
              Operación de mantenimiento en curso. Por favor espere unos momentos...
            </span>
          </div>
        </div>
      )}

      {/* Grid de Métricas de Mantenimiento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Estado del Servidor */}
        <div className="bg-white rounded-2xl border border-[#DFD5C4] p-5 shadow-subtle hover:border-[#C05A3E] transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5C3622]">Estado del Servidor</span>
            <div className="w-9 h-9 rounded-xl bg-[#F3ECE0] text-[#2D5E46] border border-[#DFD5C4] flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <span className="text-xl font-black text-[#132B20] mt-2 block">
            Sistema en Línea
          </span>
          <span className="text-xs text-[#2D5E46] font-semibold mt-1 block">
            Sucursal Central &bull; Conexión Activa
          </span>
        </div>

        {/* Carpeta de Almacenamiento */}
        <div className="bg-white rounded-2xl border border-[#DFD5C4] p-5 shadow-subtle hover:border-[#C05A3E] transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5C3622]">Destino de Copias</span>
            <div className="w-9 h-9 rounded-xl bg-[#F3ECE0] text-[#5C3622] border border-[#DFD5C4] flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <span className="text-xl font-mono font-bold text-[#132B20] mt-2 block">
            C:\SQLBackup
          </span>
          <span className="text-xs text-[#5C3622]/80 font-medium mt-1 block">
            Almacenamiento local seguro
          </span>
        </div>

        {/* Última Copia Realizada */}
        <div className="bg-white rounded-2xl border border-[#DFD5C4] p-5 shadow-subtle hover:border-[#C05A3E] transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5C3622]">Última Copia</span>
            <div className="w-9 h-9 rounded-xl bg-[#F3ECE0] text-[#C05A3E] border border-[#DFD5C4] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <span className="text-xl font-black text-[#132B20] mt-2 block truncate">
            {ultimoBackup ? new Date(ultimoBackup.Inicio).toLocaleDateString('es-CR') : 'Sin registros'}
          </span>
          <span className="text-xs text-[#2D5E46] font-semibold mt-1 block">
            {ratioCompresion}
          </span>
        </div>

        {/* Rendimiento de Búsquedas */}
        <div className="bg-white rounded-2xl border border-[#DFD5C4] p-5 shadow-subtle hover:border-[#C05A3E] transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5C3622]">Rendimiento Búsquedas</span>
            <div className="w-9 h-9 rounded-xl bg-[#F3ECE0] text-[#2D5E46] border border-[#DFD5C4] flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <span className="text-xl font-black text-[#132B20] mt-2 block">
            {indices.length} índices activos
          </span>
          <span className="text-xs text-[#2D5E46] font-semibold mt-1 block">
            Catálogos y consultas al día
          </span>
        </div>
      </div>

      {/* Selector de Pestañas (Píldoras) */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setTabActiva('BACKUPS')}
          className={`px-5 py-3 rounded-2xl border text-xs font-bold transition flex items-center gap-2.5 ${
            tabActiva === 'BACKUPS'
              ? 'bg-gradient-to-br from-[#132B20] to-[#1A3D2F] border-[#C05A3E] text-[#FAF7F0] shadow-md'
              : 'bg-white border-[#DFD5C4] text-[#132B20] hover:border-[#C05A3E] hover:bg-[#FAF7F0] shadow-xs'
          }`}
        >
          <HardDrive className={`w-4 h-4 ${tabActiva === 'BACKUPS' ? 'text-[#C05A3E]' : 'text-[#5C3622]'}`} />
          <span>Historial de Copias de Seguridad ({historialBackups.length})</span>
        </button>

        <button
          onClick={() => setTabActiva('INDICES')}
          className={`px-5 py-3 rounded-2xl border text-xs font-bold transition flex items-center gap-2.5 ${
            tabActiva === 'INDICES'
              ? 'bg-gradient-to-br from-[#132B20] to-[#1A3D2F] border-[#C05A3E] text-[#FAF7F0] shadow-md'
              : 'bg-white border-[#DFD5C4] text-[#132B20] hover:border-[#C05A3E] hover:bg-[#FAF7F0] shadow-xs'
          }`}
        >
          <SlidersHorizontal className={`w-4 h-4 ${tabActiva === 'INDICES' ? 'text-[#C05A3E]' : 'text-[#5C3622]'}`} />
          <span>Optimización de Búsquedas ({indices.length})</span>
        </button>
      </div>

      {/* ================= TAB 1: COPIAS DE SEGURIDAD ================= */}
      {tabActiva === 'BACKUPS' && (
        <div className="space-y-4">
          {/* Banner de Verificación */}
          {resultadoVerificacion && (
            <div className="bg-[#1A3D2F]/10 border border-[#2D5E46]/40 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs shadow-xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#2D5E46] shrink-0" />
                <div>
                  <span className="font-bold text-[#132B20] block">{resultadoVerificacion.Resultado}</span>
                  <span className="font-mono text-[11px] text-[#5C3622] block truncate max-w-lg">
                    {resultadoVerificacion.Archivo}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setResultadoVerificacion(null)}
                className="text-[#5C3622] hover:text-[#C05A3E] text-xs font-bold px-2 py-1"
              >
                Cerrar
              </button>
            </div>
          )}

          <div className="bg-white rounded-3xl border border-[#DFD5C4] shadow-subtle overflow-hidden">
            <div className="p-5 border-b border-[#DFD5C4] bg-[#F3ECE0]/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#FAF7F0] border border-[#DFD5C4] flex items-center justify-center">
                  <Clock className="w-4 h-4 text-[#C05A3E]" />
                </div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#132B20]">
                  Registro de Copias de Seguridad Realizadas
                </h3>
              </div>
              <span className="text-xs font-semibold text-[#5C3622] bg-[#FAF7F0] px-3 py-1 rounded-full border border-[#DFD5C4]">
                Almacenados en disco C:\SQLBackup
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F0] text-[#5C3622] uppercase tracking-wider font-bold border-b border-[#DFD5C4]">
                  <tr>
                    <th className="py-3.5 px-4">Base de Datos</th>
                    <th className="py-3.5 px-4">Tipo de Copia</th>
                    <th className="py-3.5 px-4">Fecha y Hora</th>
                    <th className="py-3.5 px-4 text-right">Tamaño Real</th>
                    <th className="py-3.5 px-4 text-right">Tamaño Comprimido</th>
                    <th className="py-3.5 px-4">Archivo .BAK Destino</th>
                    <th className="py-3.5 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DFD5C4]/50 font-medium text-[#132B20]">
                  {historialBackups.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-[#5C3622]/70 font-semibold">
                        No hay copias de seguridad registradas aún. Puedes generar una con el botón "Copia Completa".
                      </td>
                    </tr>
                  ) : (
                    historialBackups.map((b, idx) => (
                      <tr key={idx} className="hover:bg-[#FAF7F0] transition">
                        <td className="py-3.5 px-4 font-bold text-[#132B20]">{b.BaseDatos}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-[#F3ECE0] text-[#5C3622] border border-[#DFD5C4]">
                            {b.TipoRespaldo}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-[#5C3622]">
                          {new Date(b.Inicio).toLocaleString('es-CR')}
                        </td>
                        <td className="py-3.5 px-4 text-right text-[#5C3622]/80">{b.TamanoMB} MB</td>
                        <td className="py-3.5 px-4 text-right font-black text-[#2D5E46]">
                          {b.TamanoComprimidoMB} MB
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-[#5C3622] max-w-xs truncate" title={b.ArchivoDestino}>
                          {b.ArchivoDestino}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => verificarIntegridad(b.ArchivoDestino)}
                            disabled={ejecutandoAccion}
                            className="px-3 py-1.5 text-xs font-bold text-[#FAF7F0] bg-[#132B20] hover:bg-[#1A3D2F] border border-[#2D5E46]/50 rounded-xl transition shadow-xs disabled:opacity-50"
                            title="Comprobar que la copia de seguridad esté íntegra y legible"
                          >
                            Comprobar Copia
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: OPTIMIZACIÓN DE RENDIMIENTO ================= */}
      {tabActiva === 'INDICES' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-[#DFD5C4] p-5 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-[#132B20] text-sm block">Optimización de Rendimiento y Búsquedas</span>
              <span className="text-[#5C3622]/80 text-[11px] mt-0.5 block">
                Reorganización y reconstrucción periódica de catálogos para máxima fluidez en consultas
              </span>
            </div>

            <button
              onClick={abrirConfirmacionIndices}
              disabled={ejecutandoAccion}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#C05A3E] to-[#D97448] hover:from-[#AA4C33] hover:to-[#C05A3E] text-[#FAF7F0] font-black rounded-xl shadow-terracotta transition disabled:opacity-50 active:scale-95 border border-[#FAF7F0]/20"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#FAF7F0]" />
              <span>Optimizar Búsquedas del Sistema</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-[#DFD5C4] shadow-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F3ECE0]/80 text-[#5C3622] uppercase tracking-wider font-bold border-b border-[#DFD5C4]">
                  <tr>
                    <th className="py-3.5 px-4">Tabla</th>
                    <th className="py-3.5 px-4">Nombre del Índice</th>
                    <th className="py-3.5 px-4 text-right">Fragmentación (%)</th>
                    <th className="py-3.5 px-4">Estado / Acción Recomendada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DFD5C4]/50 font-medium text-[#132B20]">
                  {indices.map((ind, idx) => {
                    const frag = Number(ind.Fragmentacion || 0);
                    const alta = frag >= 30;
                    const media = frag >= 10 && frag < 30;

                    return (
                      <tr key={idx} className="hover:bg-[#FAF7F0] transition">
                        <td className="py-3.5 px-4 font-bold text-[#132B20]">{ind.Tabla}</td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-[#5C3622]">{ind.Indice}</td>
                        <td className="py-3.5 px-4 text-right">
                          <span
                            className={`font-black ${
                              alta ? 'text-[#C05A3E]' : media ? 'text-[#D97448]' : 'text-[#2D5E46]'
                            }`}
                          >
                            {frag.toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                              alta
                                ? 'bg-rose-50 text-[#C05A3E] border border-rose-200'
                                : media
                                ? 'bg-[#F3ECE0] text-[#D97448] border border-[#DFD5C4]'
                                : 'bg-[#1A3D2F]/10 text-[#2D5E46] border border-[#2D5E46]/30'
                            }`}
                          >
                            {ind.AccionRecomendada}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DE CONFIRMACIÓN PERSONALIZADO ================= */}
      {modalConfirmacion.abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132B20]/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-[#DFD5C4] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header del modal */}
            <div
              className={`p-5 flex items-center justify-between text-[#FAF7F0] ${
                modalConfirmacion.tipoColor === 'terracota'
                  ? 'bg-gradient-to-r from-[#C05A3E] to-[#D97448]'
                  : 'bg-[#132B20]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-xs">
                  {modalConfirmacion.accionTipo === 'BACKUP' ? (
                    <Database className="w-5 h-5 text-[#FAF7F0]" />
                  ) : (
                    <SlidersHorizontal className="w-5 h-5 text-[#FAF7F0]" />
                  )}
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-wide text-[#FAF7F0]">
                    {modalConfirmacion.titulo}
                  </h3>
                  <p className="text-[11px] text-[#FAF7F0]/80">
                    {modalConfirmacion.subtitulo}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalConfirmacion((prev) => ({ ...prev, abierto: false }))}
                className="p-1.5 text-[#FAF7F0]/70 hover:text-white hover:bg-white/10 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cuerpo del modal */}
            <div className="p-6 space-y-4 text-xs text-[#132B20]">
              <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#DFD5C4] flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[#C05A3E] shrink-0 mt-0.5" />
                <p className="leading-relaxed font-medium text-[#5C3622]">
                  {modalConfirmacion.mensaje}
                </p>
              </div>

              {modalConfirmacion.accionTipo === 'BACKUP' && (
                <div className="bg-[#1A3D2F]/5 border border-[#2D5E46]/20 rounded-2xl p-3 text-[11px] text-[#2D5E46] space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#2D5E46]" />
                    <span>Integridad de Seguridad Integrada:</span>
                  </div>
                  <p className="text-[#5C3622]/80">
                    El archivo .BAK se generará con compresión de hardware y comprobación física de integridad inmediata.
                  </p>
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="p-4 bg-[#FAF7F0] border-t border-[#DFD5C4] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setModalConfirmacion((prev) => ({ ...prev, abierto: false }))}
                disabled={ejecutandoAccion}
                className="px-4 py-2.5 text-xs font-bold text-[#5C3622] hover:bg-[#DFD5C4]/40 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarAccionModal}
                disabled={ejecutandoAccion}
                className={`px-5 py-2.5 text-xs font-black text-[#FAF7F0] rounded-xl shadow-md transition active:scale-95 border border-white/20 flex items-center gap-2 ${
                  modalConfirmacion.tipoColor === 'terracota'
                    ? 'bg-gradient-to-r from-[#C05A3E] to-[#D97448] hover:from-[#AA4C33] hover:to-[#C05A3E] shadow-terracotta'
                    : 'bg-[#132B20] hover:bg-[#1A3D2F]'
                }`}
              >
                {modalConfirmacion.botonTexto}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
