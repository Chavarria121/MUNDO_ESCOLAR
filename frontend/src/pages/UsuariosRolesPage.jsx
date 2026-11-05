import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Shield,
  UserCheck,
  UserX,
  Plus,
  RefreshCw,
  Search,
  Check,
  X,
  Key,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Mail,
  User,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function UsuariosRolesPage() {
  const { user: usuarioSesion } = useAuth();
  const { showToast } = useToast();

  const [tabActiva, setTabActiva] = useState('USUARIOS'); // 'USUARIOS' | 'MATRIZ'
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [asignacionesMatriz, setAsignacionesMatriz] = useState([]); // [{ Id_Rol, Id_Permiso }]
  const [loading, setLoading] = useState(true);
  const [guardandoMatriz, setGuardandoMatriz] = useState(false);

  // Filtros Usuarios
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const [filtroRolUsuario, setFiltroRolUsuario] = useState('TODOS');
  const [filtroEstadoUsuario, setFiltroEstadoUsuario] = useState('TODOS'); // 'TODOS' | 'ACTIVOS' | 'INACTIVOS'

  // Filtro Matriz
  const [busquedaPermiso, setBusquedaPermiso] = useState('');

  // Modales
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [creandoUsuario, setCreandoUsuario] = useState(false);
  const [formCrear, setFormCrear] = useState({
    nombreUsuario: '',
    correo: '',
    contrasena: '',
    idRolInicial: '',
  });

  // Modal Asignar Rol
  const [modalRolesAbierto, setModalRolesAbierto] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [rolAAsignar, setRolAAsignar] = useState('');
  const [actualizandoRol, setActualizandoRol] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resUsuarios, resMatriz] = await Promise.all([
        api.get('/usuarios'),
        api.get('/roles/matriz/permisos'),
      ]);

      setUsuarios(resUsuarios.data || []);
      setRoles(resMatriz.data?.roles || []);
      setPermisos(resMatriz.data?.permisos || []);
      setAsignacionesMatriz(resMatriz.data?.asignaciones || []);
      if (resMatriz.data?.roles?.length && !formCrear.idRolInicial) {
        setFormCrear((prev) => ({ ...prev, idRolInicial: resMatriz.data.roles[0].Id_Rol }));
      }
    } catch (err) {
      console.error('Error cargando usuarios y matriz de roles:', err);
      showToast('Error al cargar la información de seguridad', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filtrado de Usuarios
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const matchBusqueda =
        u.Nombre_Usuario?.toLowerCase().includes(busquedaUsuario.toLowerCase()) ||
        u.Correo?.toLowerCase().includes(busquedaUsuario.toLowerCase());

      const matchRol =
        filtroRolUsuario === 'TODOS' ||
        u.Roles?.toLowerCase().includes(filtroRolUsuario.toLowerCase());

      const matchEstado =
        filtroEstadoUsuario === 'TODOS' ||
        (filtroEstadoUsuario === 'ACTIVOS' && u.Estado) ||
        (filtroEstadoUsuario === 'INACTIVOS' && !u.Estado);

      return matchBusqueda && matchRol && matchEstado;
    });
  }, [usuarios, busquedaUsuario, filtroRolUsuario, filtroEstadoUsuario]);

  // Filtrado de Permisos para la Matriz
  const permisosFiltrados = useMemo(() => {
    return permisos.filter(
      (p) =>
        p.Nombre?.toLowerCase().includes(busquedaPermiso.toLowerCase()) ||
        p.Descripcion?.toLowerCase().includes(busquedaPermiso.toLowerCase())
    );
  }, [permisos, busquedaPermiso]);

  // Manejo de Creación de Usuario
  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    if (!formCrear.nombreUsuario.trim() || !formCrear.correo.trim() || !formCrear.contrasena) {
      showToast('Complete todos los campos requeridos', 'warning');
      return;
    }

    setCreandoUsuario(true);
    try {
      const res = await api.post('/usuarios', {
        nombreUsuario: formCrear.nombreUsuario.trim(),
        correo: formCrear.correo.trim(),
        contrasena: formCrear.contrasena,
      });

      const nuevoIdUsuario = res.data?.Id_Usuario;

      // Si se eligió un rol inicial, asignarlo
      if (nuevoIdUsuario && formCrear.idRolInicial) {
        await api.post(`/usuarios/${nuevoIdUsuario}/roles`, {
          idRol: Number(formCrear.idRolInicial),
        });
      }

      showToast(`Usuario ${formCrear.nombreUsuario} creado exitosamente`, 'success');
      setModalCrearAbierto(false);
      setFormCrear({
        nombreUsuario: '',
        correo: '',
        contrasena: '',
        idRolInicial: roles[0]?.Id_Rol || '',
      });
      cargarDatos();
    } catch (err) {
      console.error('Error creando usuario:', err);
      const msg = err.response?.data?.mensaje || err.response?.data?.message || 'Error al crear usuario';
      showToast(msg, 'error');
    } finally {
      setCreandoUsuario(false);
    }
  };

  // Alternar Estado de Usuario (Desactivar / Activar)
  const handleToggleEstadoUsuario = async (u) => {
    const accion = u.Estado ? 'desactivar' : 'activar';
    if (!window.confirm(`¿Está seguro de que desea ${accion} al usuario "${u.Nombre_Usuario}"?`)) {
      return;
    }

    try {
      if (u.Estado) {
        await api.patch(`/usuarios/${u.Id_Usuario}/desactivar`);
        showToast(`Usuario ${u.Nombre_Usuario} desactivado exitosamente`, 'info');
      } else {
        // En SQL podemos reactivar o asignar estado 1
        showToast('Para reactivar un usuario consulte con el DBA o asigne credencial nueva', 'info');
      }
      cargarDatos();
    } catch (err) {
      console.error(`Error al ${accion} usuario:`, err);
      const msg = err.response?.data?.mensaje || 'Error al procesar el cambio de estado';
      showToast(msg, 'error');
    }
  };

  // Abrir Modal de Roles para un Usuario
  const abrirGestionRolesUsuario = (u) => {
    let parsedRoles = [];
    try {
      parsedRoles = typeof u.RolesJson === 'string' ? JSON.parse(u.RolesJson) : u.RolesJson || [];
    } catch (e) {
      parsedRoles = [];
    }
    setUsuarioSeleccionado({ ...u, parsedRoles });
    setRolAAsignar(roles[0]?.Id_Rol || '');
    setModalRolesAbierto(true);
  };

  // Asignar Rol a Usuario
  const handleAsignarRol = async () => {
    if (!usuarioSeleccionado || !rolAAsignar) return;
    setActualizandoRol(true);
    try {
      await api.post(`/usuarios/${usuarioSeleccionado.Id_Usuario}/roles`, {
        idRol: Number(rolAAsignar),
      });
      showToast('Rol asignado exitosamente al usuario', 'success');
      cargarDatos();
      setModalRolesAbierto(false);
    } catch (err) {
      console.error('Error asignando rol:', err);
      const msg = err.response?.data?.mensaje || 'Error al asignar rol';
      showToast(msg, 'error');
    } finally {
      setActualizandoRol(false);
    }
  };

  // Remover Rol de Usuario
  const handleRemoverRol = async (idRol) => {
    if (!usuarioSeleccionado) return;
    if (!window.confirm('¿Desea remover este rol del usuario seleccionado?')) return;
    setActualizandoRol(true);
    try {
      await api.delete(`/usuarios/${usuarioSeleccionado.Id_Usuario}/roles/${idRol}`);
      showToast('Rol revocado exitosamente', 'info');
      cargarDatos();
      setModalRolesAbierto(false);
    } catch (err) {
      console.error('Error removiendo rol:', err);
      const msg = err.response?.data?.mensaje || 'Error al remover rol';
      showToast(msg, 'error');
    } finally {
      setActualizandoRol(false);
    }
  };

  // Comprobar si un Rol tiene un Permiso
  const tienePermisoRol = (idRol, idPermiso) => {
    return asignacionesMatriz.some((a) => a.Id_Rol === idRol && a.Id_Permiso === idPermiso);
  };

  // Alternar Permiso en la Matriz de Roles
  const handleTogglePermisoMatriz = async (idRol, idPermiso, estadoActual) => {
    setGuardandoMatriz(true);
    try {
      if (estadoActual) {
        // Remover permiso
        await api.delete(`/roles/${idRol}/permisos/${idPermiso}`);
        setAsignacionesMatriz((prev) =>
          prev.filter((a) => !(a.Id_Rol === idRol && a.Id_Permiso === idPermiso))
        );
        showToast('Permiso revocado del rol', 'info');
      } else {
        // Asignar permiso
        await api.post(`/roles/${idRol}/permisos`, { idPermiso });
        setAsignacionesMatriz((prev) => [...prev, { Id_Rol: idRol, Id_Permiso: idPermiso }]);
        showToast('Permiso asignado al rol exitosamente', 'success');
      }
    } catch (err) {
      console.error('Error actualizando permiso en matriz:', err);
      const msg = err.response?.data?.mensaje || 'Error al modificar asignación de permiso';
      showToast(msg, 'error');
      // Recargar datos para asegurar sincronía
      cargarDatos();
    } finally {
      setGuardandoMatriz(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ================= HEADER PRINCIPAL ================= */}
      <div className="bg-white rounded-2xl border border-[#DFD5C4] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
              Seguridad Operativa PoLP
            </span>
            <span className="text-xs text-slate-400 font-mono">Control de Acceso Basado en Roles (RBAC)</span>
          </div>
          <h1 className="text-2xl font-black text-[#132B20] tracking-tight">
            Gestión de Usuarios y Matriz de Roles
          </h1>
          <p className="text-xs text-[#5C3622] mt-0.5">
            Administre cuentas de colaboradores, asignación de roles y la matriz granular de privilegios del sistema.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={cargarDatos}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] hover:bg-[#F3ECE0] text-[#132B20] text-xs font-bold rounded-xl transition shadow-xs disabled:opacity-50"
            title="Refrescar catálogo y permisos"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>

          {tabActiva === 'USUARIOS' && (
            <button
              onClick={() => setModalCrearAbierto(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#C05A3E] hover:bg-[#AA4C33] text-white text-xs font-bold rounded-xl transition shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Usuario</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= TABS SELECTOR ================= */}
      <div className="flex items-center gap-3 border-b border-[#DFD5C4] pb-2">
        <button
          onClick={() => setTabActiva('USUARIOS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            tabActiva === 'USUARIOS'
              ? 'bg-[#132B20] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-[#FAF7F0] border border-[#DFD5C4]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Usuarios del Sistema ({usuarios.length})</span>
        </button>

        <button
          onClick={() => setTabActiva('MATRIZ')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            tabActiva === 'MATRIZ'
              ? 'bg-[#132B20] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-[#FAF7F0] border border-[#DFD5C4]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Matriz de Roles y Permisos ({roles.length} roles)</span>
        </button>
      </div>

      {/* ================= TAB 1: GESTIÓN DE USUARIOS ================= */}
      {tabActiva === 'USUARIOS' && (
        <div className="space-y-4">
          {/* Barra de Filtros */}
          <div className="bg-white rounded-2xl border border-[#DFD5C4] p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-3 w-full">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={busquedaUsuario}
                  onChange={(e) => setBusquedaUsuario(e.target.value)}
                  placeholder="Buscar por nombre de usuario o correo..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
                />
              </div>

              {/* Filtro Rol */}
              <select
                value={filtroRolUsuario}
                onChange={(e) => setFiltroRolUsuario(e.target.value)}
                className="px-3 py-2 text-xs bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl text-[#132B20] font-medium focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
              >
                <option value="TODOS">Todos los Roles</option>
                {roles.map((r) => (
                  <option key={r.Id_Rol} value={r.Nombre}>
                    {r.Nombre}
                  </option>
                ))}
              </select>

              {/* Filtro Estado */}
              <select
                value={filtroEstadoUsuario}
                onChange={(e) => setFiltroEstadoUsuario(e.target.value)}
                className="px-3 py-2 text-xs bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl text-[#132B20] font-medium focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
              >
                <option value="TODOS">Todos los Estados</option>
                <option value="ACTIVOS">Solo Activos</option>
                <option value="INACTIVOS">Solo Inactivos</option>
              </select>
            </div>
          </div>

          {/* Tabla de Usuarios */}
          <div className="bg-white rounded-2xl border border-[#DFD5C4] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F0] border-b border-[#DFD5C4] text-[#5C3622] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Usuario</th>
                    <th className="py-3 px-4">Correo Electrónico</th>
                    <th className="py-3 px-4">Roles Asignados</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-[#132B20]">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#2D5E46]" />
                        <span>Cargando catálogo de usuarios...</span>
                      </td>
                    </tr>
                  ) : usuariosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No se encontraron usuarios coincidentes con el filtro.
                      </td>
                    </tr>
                  ) : (
                    usuariosFiltrados.map((u) => {
                      const rolesList = u.Roles ? u.Roles.split(', ') : [];
                      return (
                        <tr key={u.Id_Usuario} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 font-mono font-bold text-slate-500">#{u.Id_Usuario}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-[#132B20] text-white flex items-center justify-center font-bold text-[10px]">
                                {u.Nombre_Usuario?.slice(0, 2).toUpperCase()}
                              </div>
                              <span className="font-bold text-[#132B20]">{u.Nombre_Usuario}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">{u.Correo}</td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {rolesList.length > 0 && rolesList[0] !== 'Sin Rol' ? (
                                rolesList.map((r, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FAF7F0] border border-[#DFD5C4] text-[#5C3622]"
                                  >
                                    {r}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">Sin rol asignado</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                u.Estado
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-rose-100 text-rose-800 border border-rose-200'
                              }`}
                            >
                              {u.Estado ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              <span>{u.Estado ? 'Activo' : 'Inactivo'}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Asignar Roles */}
                              <button
                                onClick={() => abrirGestionRolesUsuario(u)}
                                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                                title="Gestionar Roles del Usuario"
                              >
                                <Shield className="w-4 h-4" />
                              </button>

                              {/* Desactivar */}
                              {u.Estado ? (
                                <button
                                  onClick={() => handleToggleEstadoUsuario(u)}
                                  className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition"
                                  title="Desactivar Usuario"
                                >
                                  <UserX className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleToggleEstadoUsuario(u)}
                                  className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition"
                                  title="Usuario Inactivo"
                                >
                                  <UserCheck className="w-4 h-4" />
                                </button>
                              )}
                            </div>
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

      {/* ================= TAB 2: MATRIZ DE ROLES Y PERMISOS ================= */}
      {tabActiva === 'MATRIZ' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#DFD5C4] p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busquedaPermiso}
                onChange={(e) => setBusquedaPermiso(e.target.value)}
                placeholder="Filtrar por nombre o descripción de permiso..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
              />
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Marque o desmarque las casillas para asignar o revocar privilegios a cada rol en tiempo real.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#DFD5C4] shadow-sm overflow-hidden">
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAF7F0] border-b border-[#DFD5C4] sticky top-0 z-10 text-[#5C3622] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-4 min-w-[240px] bg-[#FAF7F0]">Permiso Operativo</th>
                    <th className="py-3 px-4 min-w-[300px] bg-[#FAF7F0]">Descripción del Privilegio</th>
                    {roles.map((r) => (
                      <th key={r.Id_Rol} className="py-3 px-3 text-center min-w-[120px] bg-[#FAF7F0]">
                        <span className="block font-black text-[#132B20]">{r.Nombre}</span>
                        <span className="text-[9px] text-slate-400 lowercase font-normal">Rol #{r.Id_Rol}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-[#132B20]">
                  {permisosFiltrados.map((p) => (
                    <tr key={p.Id_Permiso} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-4">
                        <span className="font-mono font-bold text-slate-800 text-[11px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {p.Nombre}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 text-[11px]">{p.Descripcion}</td>
                      {roles.map((r) => {
                        const tiene = tienePermisoRol(r.Id_Rol, p.Id_Permiso);
                        return (
                          <td key={r.Id_Rol} className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={tiene}
                              disabled={guardandoMatriz}
                              onChange={() => handleTogglePermisoMatriz(r.Id_Rol, p.Id_Permiso, tiene)}
                              className="w-4 h-4 rounded text-[#132B20] focus:ring-[#2D5E46] border-slate-300 cursor-pointer transition disabled:opacity-50"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL CREAR USUARIO ================= */}
      {modalCrearAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132B20]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#DFD5C4] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#132B20] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Crear Nuevo Usuario</h3>
                  <p className="text-[10px] text-slate-300">Registrar cuenta en SP_Usuario_Crear</p>
                </div>
              </div>
              <button
                onClick={() => setModalCrearAbierto(false)}
                className="p-1 text-slate-300 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearUsuario} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#132B20] mb-1">Nombre de Usuario *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formCrear.nombreUsuario}
                    onChange={(e) => setFormCrear({ ...formCrear, nombreUsuario: e.target.value })}
                    placeholder="Ej. juan.cajero"
                    className="w-full pl-9 pr-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46] font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#132B20] mb-1">Correo Electrónico *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={formCrear.correo}
                    onChange={(e) => setFormCrear({ ...formCrear, correo: e.target.value })}
                    placeholder="juan.cajero@mundoescolar.cr"
                    className="w-full pl-9 pr-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#132B20] mb-1">Contraseña Inicial *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={formCrear.contrasena}
                    onChange={(e) => setFormCrear({ ...formCrear, contrasena: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#132B20] mb-1">Rol Inicial</label>
                <select
                  value={formCrear.idRolInicial}
                  onChange={(e) => setFormCrear({ ...formCrear, idRolInicial: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46] font-medium"
                >
                  <option value="">Sin Rol Inicial</option>
                  {roles.map((r) => (
                    <option key={r.Id_Rol} value={r.Id_Rol}>
                      {r.Nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalCrearAbierto(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creandoUsuario}
                  className="px-5 py-2 bg-[#C05A3E] hover:bg-[#AA4C33] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {creandoUsuario ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Registrar Usuario</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL ASIGNAR ROLES ================= */}
      {modalRolesAbierto && usuarioSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#132B20]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#DFD5C4] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#132B20] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Gestionar Roles de Usuario</h3>
                <p className="text-[10px] text-slate-300">Usuario: {usuarioSeleccionado.Nombre_Usuario}</p>
              </div>
              <button
                onClick={() => setModalRolesAbierto(false)}
                className="p-1 text-slate-300 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#132B20] mb-1">Roles Actuales</label>
                <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  {usuarioSeleccionado.parsedRoles?.length > 0 ? (
                    usuarioSeleccionado.parsedRoles.map((r) => (
                      <span
                        key={r.Id_Rol}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-white border border-[#DFD5C4] text-[#132B20] shadow-xs"
                      >
                        <span>{r.Nombre}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoverRol(r.Id_Rol)}
                          disabled={actualizandoRol}
                          className="text-rose-500 hover:text-rose-700"
                          title="Remover rol"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic">No tiene roles asignados</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#132B20] mb-1">Agregar Nuevo Rol</label>
                <div className="flex items-center gap-2">
                  <select
                    value={rolAAsignar}
                    onChange={(e) => setRolAAsignar(e.target.value)}
                    className="flex-1 px-3 py-2 bg-[#FAF7F0] border border-[#DFD5C4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D5E46]"
                  >
                    {roles.map((r) => (
                      <option key={r.Id_Rol} value={r.Id_Rol}>
                        {r.Nombre}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAsignarRol}
                    disabled={actualizandoRol}
                    className="px-4 py-2 bg-[#132B20] hover:bg-[#1A3D2F] text-white font-bold rounded-xl shadow-xs disabled:opacity-50"
                  >
                    Asignar
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setModalRolesAbierto(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

