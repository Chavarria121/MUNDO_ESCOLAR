import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
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
        <div className="p-8 max-w-lg mx-auto my-12 bg-white rounded-2xl border border-rose-200 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto font-bold text-xl">
            ⚠️
          </div>
          <h3 className="text-base font-extrabold text-slate-800">Ocurrió un error en la vista</h3>
          <p className="text-xs text-slate-500 font-mono bg-slate-50 p-3 rounded-xl border border-slate-200 text-left overflow-auto max-h-32">
            {this.state.error?.message || 'Error inesperado'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition"
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
  const { isAuthenticated } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');

  if (!isAuthenticated) {
    return <LoginPage />;
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
