import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle, Info, X, XCircle } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message, details = null) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, message, details }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const success = useCallback((msg, det) => addToast('success', msg, det), [addToast]);
  const error = useCallback((msg, det) => addToast('error', msg, det), [addToast]);
  const warning = useCallback((msg, det) => addToast('warning', msg, det), [addToast]);
  const info = useCallback((msg, det) => addToast('info', msg, det), [addToast]);

  // Soporte universal para showToast(mensaje, tipo, detalles)
  const showToast = useCallback((message, type = 'info', details = null) => {
    let finalType = type;
    let finalDetails = details;
    if (typeof type === 'object' && type !== null) {
      finalType = type.type || 'info';
      finalDetails = type.details || null;
    }
    const validTypes = ['success', 'error', 'warning', 'info'];
    if (!validTypes.includes(finalType)) {
      finalType = 'info';
    }
    addToast(finalType, message, finalDetails);
  }, [addToast]);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ success, error, warning, info, showToast, addToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-premium border transition-all duration-300 animate-slide-up ${
              t.type === 'success'
                ? 'bg-white border-emerald-200 text-slate-800'
                : t.type === 'error'
                ? 'bg-white border-rose-200 text-slate-800'
                : t.type === 'warning'
                ? 'bg-white border-amber-200 text-slate-800'
                : 'bg-white border-blue-200 text-slate-800'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
              {t.type === 'error' && <XCircle className="w-5 h-5 text-rose-500" />}
              {t.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-500" />}
              {t.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{t.message}</p>
              {t.details && <p className="text-xs text-slate-500 mt-1 break-words">{t.details}</p>}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast debe ser utilizado dentro de un ToastProvider');
  return context;
}
