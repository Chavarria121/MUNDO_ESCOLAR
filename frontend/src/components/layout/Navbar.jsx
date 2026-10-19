import React, { useState, useEffect } from 'react';
import { Server, Database, UserCheck, Shield, Clock, Leaf } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export default function Navbar({ activeSection, isSidebarCollapsed }) {
  const { user } = useAuth();
  const [dbStatus, setDbStatus] = useState({ online: true, version: 'SQL Server 2022', tables: 33 });
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('es-CR'));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('es-CR'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const checkHealth = () => {
      api.get('/health')
        .then((res) => {
          if (res.data?.status === 'ONLINE') {
            setDbStatus({
              online: true,
              version: 'SQL Server 2022',
              tables: (res.data.info?.TablasOLTP || 33),
            });
          } else {
            setDbStatus((s) => ({ ...s, online: false }));
          }
        })
        .catch(() => setDbStatus((s) => ({ ...s, online: false })));
    };

    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const sectionTitles = {
    dashboard: 'Panel General y Métricas',
    pos: 'Caja y Punto de Venta (POS)',
    facturacion: 'Facturación Fiscal y Cobros',
    inventario: 'Inventario, Kárdex y Catálogos',
    compras: 'Compras y Recepción de Mercancía',
    clientes: 'Directorio de Clientes y Créditos',
    bi: 'Métricas y Estadísticas del Negocio',
    reportes: 'Reportes Analíticos Oficiales',
    auditoria: 'Historial de Actividades y Seguridad',
    dba: 'Mantenimiento y Copias del Sistema',
  };

  return (
    <header
      className={`fixed top-0 right-0 h-16 z-20 bg-[#FAF7F0]/95 backdrop-blur-md border-b border-[#DFD5C4] transition-all duration-300 flex items-center justify-between px-6 shadow-subtle ${
        isSidebarCollapsed ? 'left-20' : 'left-64'
      }`}
    >
      {/* Active Section Title */}
      <div>
        <h2 className="text-base font-bold text-[#132B20] tracking-tight">
          {sectionTitles[activeSection] || 'Mundo Escolar'}
        </h2>
        <p className="text-xs text-[#2D5E46]">
          Librería & Papelería Mundo Escolar &bull; Sucursal Central
        </p>
      </div>

      {/* Right Badges */}
      <div className="flex items-center gap-4">
        {/* Reloj local */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-[#5C3622] font-medium bg-[#F3ECE0] px-3 py-1 rounded-full border border-[#DFD5C4]">
          <Clock className="w-3.5 h-3.5 text-[#C05A3E]" />
          <span>{currentTime}</span>
        </div>

        {/* Database Health Badge */}
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border transition ${
            dbStatus.online
              ? 'bg-[#1A3D2F]/10 text-[#1A3D2F] border-[#2D5E46]/40'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
          title={dbStatus.online ? 'Sistema en línea y sincronizado' : 'Sin conexión con el servidor'}
        >
          <span className={`w-2 h-2 rounded-full animate-pulse ${dbStatus.online ? 'bg-[#2D5E46]' : 'bg-rose-500'}`} />
          <Database className="w-3.5 h-3.5 text-[#2D5E46]" />
          <span>{dbStatus.online ? 'Sistema en Línea' : 'Sin Conexión'}</span>
        </div>

        {/* User Role Badge */}
        <div className="flex items-center gap-2 pl-3 border-l border-[#DFD5C4]">
          <div className="text-right">
            <p className="text-xs font-bold text-[#132B20] leading-none">{user?.nombreUsuario}</p>
            <span className="text-[10px] font-bold text-[#C05A3E] uppercase tracking-wider">
              {user?.roles?.[0] || 'Usuario'}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#132B20] text-[#FAF7F0] font-bold flex items-center justify-center text-xs border border-[#2D5E46]">
            {user?.nombreUsuario?.substring(0, 2).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
