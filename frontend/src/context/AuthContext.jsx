import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (nombreUsuario, contrasena) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { nombreUsuario, contrasena });
      const data = res.data;
      const accessToken = data.accessToken;
      const permisos = data.permisos || [];

      // Verificar si el usuario autenticado corresponde a un Cliente (Actor Cliente de la Tesis)
      let esCliente = false;
      let clienteData = null;
      try {
        const portalRes = await api.get('/clientes/portal/mi-perfil', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (portalRes.data?.esCliente) {
          esCliente = true;
          clienteData = portalRes.data.perfil;
        }
      } catch (e) {}

      const userData = {
        ...data.usuario,
        permisos,
        roles: esCliente
          ? ['Cliente']
          : data.usuario.roles || (permisos.includes('SEGURIDAD_GESTIONAR') ? ['Administrador'] : ['Cajero']),
        esCliente,
        clienteData,
      };

      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(userData));

      setToken(accessToken);
      setUser(userData);
      return { success: true };
    } catch (err) {
      const mensaje = err.response?.data?.mensaje || 'Error al iniciar sesión';
      return { success: false, mensaje };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  // Verificación dinámica de permisos RBAC obtenidos de SQL Server
  const tienePermiso = (permiso) => {
    if (!user || !user.permisos) return false;
    // Administrador con permiso de seguridad tiene pase total
    if (user.roles?.includes('Administrador') || user.permisos.includes('SEGURIDAD_GESTIONAR')) return true;
    return user.permisos.includes(permiso);
  };

  const tieneAlgunPermiso = (listaPermisos) => {
    if (!listaPermisos || !listaPermisos.length) return true;
    return listaPermisos.some((p) => tienePermiso(p));
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        logout,
        tienePermiso,
        tieneAlgunPermiso,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  return context;
}
