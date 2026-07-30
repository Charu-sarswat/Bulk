import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  return useContext(ToastContext);
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prevToasts) => [...prevToasts, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast Portal/Container */}
      <div className="fixed top-4 right-4 md:top-5 md:right-5 z-[9999] flex flex-col gap-2 max-w-[280px] sm:max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-2 md:gap-3 p-3 md:p-4 rounded-xl shadow-lg border slide-up transition-all duration-300 text-xs md:text-sm ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : toast.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : toast.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            {toast.type === 'success' && <CheckCircle className="w-4 h-4 md:w-5 md:h-5 shrink-0 text-emerald-600 mt-0.5" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 md:w-5 md:h-5 shrink-0 text-rose-600 mt-0.5" />}
            {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 shrink-0 text-amber-600 mt-0.5" />}
            {toast.type === 'info' && <Info className="w-4 h-4 md:w-5 md:h-5 shrink-0 text-blue-600 mt-0.5" />}
            
            <div className="flex-1 font-semibold">{toast.message}</div>
            
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-0.5"
            >
              <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
