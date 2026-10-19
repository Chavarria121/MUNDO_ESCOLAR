import React from 'react';
import {
  BookOpen,
  ShoppingCart,
  Receipt,
  Boxes,
  Truck,
  Users,
  LineChart,
  FileSpreadsheet,
  ShieldCheck,
  Database,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ activeSection, onSelectSection, isCollapsed, onToggleCollapse }) {
  const { user, logout, tieneAlgunPermiso } = useAuth();

  const menuSections = [
    {
      id: 'dashboard',
      label: 'Panel General',
      icon: BookOpen,
      permissions: [],
    },
    {
      id: 'pos',
      label: 'Caja y Punto de Venta',
      icon: ShoppingCart,
      permissions: ['VENTAS_REGISTRAR'],
    },
    {
      id: 'facturacion',
      label: 'Facturación Fiscal',
      icon: Receipt,
      permissions: ['FACTURACION_EMITIR'],
    },
    {
      id: 'inventario',
      label: 'Inventario y Kárdex',
      icon: Boxes,
      permissions: ['INVENTARIO_CONSULTAR'],
    },
    {
      id: 'compras',
      label: 'Compras a Proveedores',
      icon: Truck,
      permissions: ['COMPRAS_REGISTRAR'],
    },
    {
      id: 'clientes',
      label: 'Directorio de Clientes',
      icon: Users,
      permissions: ['CLIENTES_CONSULTAR'],
    },
    {
      id: 'bi',
      label: 'Métricas y Estadísticas del Negocio',
      icon: LineChart,
      permissions: ['REPORTES_VER'],
    },
    {
      id: 'reportes',
      label: 'Reportes Analíticos',
      icon: FileSpreadsheet,
      permissions: ['REPORTES_VER'],
    },
    {
      id: 'auditoria',
      label: 'Historial de Actividad',
      icon: ShieldCheck,
      permissions: ['SEGURIDAD_GESTIONAR'],
    },
    {
      id: 'dba',
      label: 'Centro de Mantenimiento y Respaldos',
      icon: Database,
      permissions: ['DBA_MANTENIMIENTO'],
    },
  ];

  const filteredMenu = menuSections.filter((item) => tieneAlgunPermiso(item.permissions));

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-30 flex flex-col bg-[#132B20] text-[#FAF7F0] transition-all duration-300 border-r border-[#2D5E46]/40 shadow-2xl ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#2D5E46]/40 bg-[#0F2219]">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C05A3E] to-[#5C3622] border border-[#FAF7F0]/20 flex items-center justify-center shadow-terracotta">
              <BookOpen className="w-5 h-5 text-[#FAF7F0]" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-[#FAF7F0] flex items-center gap-1.5">
                Mundo Escolar
                <span className="text-[10px] uppercase font-bold bg-[#C05A3E]/30 text-[#FAF7F0] border border-[#C05A3E]/50 px-1.5 py-0.5 rounded-full">
                  CR
                </span>
              </h1>
              <p className="text-[11px] text-[#DFD5C4]/80">Librería & Papelería</p>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="mx-auto w-10 h-10 rounded-xl bg-gradient-to-br from-[#C05A3E] to-[#5C3622] border border-[#FAF7F0]/20 flex items-center justify-center shadow-terracotta">
            <BookOpen className="w-5 h-5 text-[#FAF7F0]" />
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-[#DFD5C4] hover:text-[#FAF7F0] hover:bg-[#1A3D2F] transition"
          title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
        {filteredMenu.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group relative ${
                isActive
                  ? 'bg-gradient-to-r from-[#2D5E46] to-[#1A3D2F] text-[#FAF7F0] shadow-md border border-[#C05A3E]/70 font-semibold'
                  : 'text-[#DFD5C4] hover:text-[#FAF7F0] hover:bg-[#1A3D2F]/60'
              } ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 ${isActive ? 'scale-105 text-[#FAF7F0]' : 'text-[#DFD5C4]/70 group-hover:scale-105 group-hover:text-[#FAF7F0]'}`} />
              
              {!isCollapsed && (
                <span className="truncate flex-1 text-left">{item.label}</span>
              )}

              {!isCollapsed && item.badge && (
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${item.badgeColor || 'bg-[#0F2219] text-[#DFD5C4] border-[#2D5E46]'}`}>
                  {item.badge}
                </span>
              )}

              {/* Tooltip on collapse */}
              {isCollapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#0F2219] text-[#FAF7F0] border border-[#2D5E46] text-xs rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Profile */}
      <div className="p-3 border-t border-[#2D5E46]/40 bg-[#0F2219]">
        <div className={`flex items-center gap-3 p-2 rounded-xl bg-[#132B20] border border-[#2D5E46]/50 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#C05A3E] to-[#5C3622] border border-[#FAF7F0]/30 flex items-center justify-center font-bold text-[#FAF7F0] text-xs shrink-0 shadow-sm">
            {user?.nombreUsuario?.substring(0, 2).toUpperCase() || 'ME'}
          </div>

          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#FAF7F0] truncate">{user?.nombreUsuario || 'Usuario'}</p>
              <p className="text-[10px] text-[#DFD5C4]/80 truncate">{user?.roles?.join(', ') || 'Operador'}</p>
            </div>
          )}

          {!isCollapsed && (
            <button
              onClick={logout}
              className="p-1.5 text-[#DFD5C4] hover:text-[#C05A3E] hover:bg-[#1A3D2F] rounded-lg transition"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
