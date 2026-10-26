import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AppLayout from './components/layout/AppLayout';
import DashboardOverview from './pages/DashboardOverview';
import PosPage from './pages/PosPage';
import FacturacionPage from './pages/FacturacionPage';
import InventarioPage from './pages/InventarioPage';
import ComprasPage from './pages/ComprasPage';
import ClientesPage from './pages/ClientesPage';
import BiPage from './pages/BiPage';
import ReportesPage from './pages/ReportesPage';
import AuditoriaPage from './pages/AuditoriaPage';
import DbaPage from './pages/DbaPage';
import PortalClientePage from './pages/PortalClientePage';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-lg mx-auto my-12 bg-white rounded-3xl border border-[#DFD5C4] shadow-premium text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F3ECE0] text-[#C05A3E] border border-[#DFD5C4] flex items-center justify-center mx-auto font-bold text-xl">
            ⚠️
          </div>
          <h3 className="text-base font-extrabold text-[#132B20]">Ocurrió un error en la vista</h3>
          <p className="text-xs text-[#5C3622] font-mono bg-[#FAF7F0] p-3 rounded-xl border border-[#DFD5C4] text-left overflow-auto max-h-32">
            {this.state.error?.message || 'Error inesperado'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-gradient-to-r from-[#C05A3E] to-[#5C3622] hover:from-[#A84930] hover:to-[#452718] text-[#FAF7F0] text-xs font-bold rounded-xl shadow-terracotta transition"
          >
            Reintentar y Recargar Módulo
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const { isAuthenticated, user } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [publicView, setPublicView] = useState('landing'); // 'landing' | 'login'

  if (!isAuthenticated) {
    if (publicView === 'login') {
      return (
        <ErrorBoundary key="public-login">
          <LoginPage onGoToLanding={() => setPublicView('landing')} />
        </ErrorBoundary>
      );
    }
    return (
      <ErrorBoundary key="public-landing">
        <LandingPage onGoToLogin={() => setPublicView('login')} />
      </ErrorBoundary>
    );
  }

  // Redirección al Portal de Cliente según el Actor Cliente de la Tesis (RF1.5, RF1.11)
  if (user?.esCliente) {
    return (
      <ErrorBoundary key="portal-cliente">
        <PortalClientePage />
      </ErrorBoundary>
    );
  }

  return (
    <AppLayout activeSection={activeSection} onSelectSection={setActiveSection}>
      <ErrorBoundary key={activeSection}>
        {activeSection === 'dashboard' && (
          <DashboardOverview onNavigate={setActiveSection} />
        )}

        {activeSection === 'pos' && (
          <PosPage onNavigateToFacturacion={() => setActiveSection('facturacion')} />
        )}

        {activeSection === 'facturacion' && (
          <FacturacionPage onNavigateToPos={() => setActiveSection('pos')} />
        )}

        {activeSection === 'inventario' && (
          <InventarioPage />
        )}

        {activeSection === 'compras' && (
          <ComprasPage />
        )}

        {activeSection === 'clientes' && (
          <ClientesPage />
        )}

        {activeSection === 'bi' && (
          <BiPage />
        )}

        {activeSection === 'reportes' && (
          <ReportesPage />
        )}

        {activeSection === 'auditoria' && (
          <AuditoriaPage />
        )}

        {activeSection === 'dba' && (
          <DbaPage />
        )}
      </ErrorBoundary>
    </AppLayout>
  );
}
