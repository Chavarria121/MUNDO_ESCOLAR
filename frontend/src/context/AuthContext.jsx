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

      // El backend determina autoritativamente si el usuario es un Cliente
      const esCliente = Boolean(data.usuario?.esCliente);
      const roles = data.usuario?.roles?.length
        ? data.usuario.roles
        : (esCliente ? ['Cliente'] : (permisos.includes('SEGURIDAD_GESTIONAR') ? ['Administrador'] : ['Usuario']));

      const userData = {
        ...data.usuario,
        permisos,
        roles,
        esCliente,
        clienteData: data.usuario?.clienteData || null,
        primerNombre: data.usuario?.primerNombre || (esCliente ? 'Cliente' : data.usuario?.nombreUsuario),
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

  const actualizarUsuario = (cambios) => {
    setUser((prev) => {
      if (!prev) return null;
      const actualizado = { ...prev, ...cambios };
      localStorage.setItem('user', JSON.stringify(actualizado));
      return actualizado;
    });
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
        setUser,
        actualizarUsuario,
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
