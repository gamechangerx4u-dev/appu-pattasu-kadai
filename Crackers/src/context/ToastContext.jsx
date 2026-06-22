import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

const ToastContext = createContext(null);

let toastCounter = 0;

const TOAST_META = {
  success: {
    icon: CheckCircle2,
    title: 'Done',
    className: 'toast-success',
  },
  error: {
    icon: XCircle,
    title: 'Something went wrong',
    className: 'toast-error',
  },
  warning: {
    icon: AlertTriangle,
    title: 'Heads up',
    className: 'toast-warning',
  },
  info: {
    icon: Info,
    title: 'Notice',
    className: 'toast-info',
  },
};

function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div className="toast-viewport" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => {
        const meta = TOAST_META[toast.type] || TOAST_META.info;
        const Icon = meta.icon;

        return (
          <div
            key={toast.id}
            className={`toast-item ${meta.className} ${toast.exiting ? 'toast-item-exit' : 'toast-item-enter'}`}
            role="status"
          >
            <div className="toast-icon-wrap">
              <Icon size={22} strokeWidth={2.2} />
            </div>
            <div className="toast-content">
              <div className="toast-title">{toast.title || meta.title}</div>
              <div className="toast-message">{toast.message}</div>
            </div>
            <button
              type="button"
              className="toast-close"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
            <span className="toast-progress" style={{ animationDuration: `${toast.duration}ms` }} />
          </div>
        );
      })}
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.map((item) => (item.id === id ? { ...item, exiting: true } : item)));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 280);
  }, []);

  const show = useCallback((type, message, options = {}) => {
    const duration = options.duration ?? (type === 'error' ? 5200 : 4200);
    const id = ++toastCounter;
    const title = options.title;

    setToasts((prev) => [...prev, { id, type, message, title, duration }]);

    if (duration > 0) {
      window.setTimeout(() => dismiss(id), duration);
    }

    return id;
  }, [dismiss]);

  const toast = useMemo(() => ({
    success: (message, options) => show('success', message, options),
    error: (message, options) => show('error', message, options),
    warning: (message, options) => show('warning', message, options),
    info: (message, options) => show('info', message, options),
    dismiss,
  }), [show, dismiss]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {createPortal(<ToastStack toasts={toasts} onDismiss={dismiss} />, document.body)}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const toast = useContext(ToastContext);
  if (!toast) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return toast;
}
