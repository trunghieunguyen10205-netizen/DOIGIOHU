import { useState, useCallback, useRef } from 'react';

// ── Toast Component ────────────────────────────────────────────
const TOAST_ICONS = {
  success: '✅',
  error:   '❌',
  info:    'ℹ️',
  warning: '⚠️',
};
const TOAST_COLORS = {
  success: { bg: 'rgba(52,199,89,0.15)',  border: 'rgba(52,199,89,0.3)',  text: '#1a5c2a' },
  error:   { bg: 'rgba(255,59,48,0.12)',  border: 'rgba(255,59,48,0.3)',  text: '#7a1a1a' },
  info:    { bg: 'rgba(0,113,227,0.12)',  border: 'rgba(0,113,227,0.3)',  text: '#003d7a' },
  warning: { bg: 'rgba(255,149,0,0.12)', border: 'rgba(255,149,0,0.3)',  text: '#7a4500' },
};

function ToastItem({ toast, onRemove }) {
  const c = TOAST_COLORS[toast.type] || TOAST_COLORS.info;
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '16px 20px',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: `1px solid ${c.border}`,
        borderRadius: '20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        minWidth: '280px', maxWidth: '360px',
        animation: 'slideInRight 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        cursor: 'pointer',
      }}
      onClick={() => onRemove(toast.id)}
    >
      <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{TOAST_ICONS[toast.type]}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1d1d1f' }}>{toast.title}</div>
        {toast.message && (
          <div style={{ fontSize: '0.82rem', color: '#555', marginTop: '2px', fontWeight: 500 }}>{toast.message}</div>
        )}
      </div>
      <span style={{ color: '#aaa', fontSize: '1rem', flexShrink: 0 }}>✕</span>
    </div>
  );
}

// ── Confirm Modal Component ────────────────────────────────────
function ConfirmModal({ modal, onConfirm, onCancel }) {
  if (!modal) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(0,0,0,0.35)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
      animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        borderRadius: '28px',
        padding: '32px 28px',
        maxWidth: '340px', width: '100%',
        boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
        border: '1px solid rgba(255,255,255,0.6)',
        animation: 'scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>{modal.icon || '❓'}</div>
        <div style={{ fontWeight: 900, fontSize: '1.2rem', color: '#1d1d1f', marginBottom: '10px' }}>
          {modal.title || 'Xác nhận'}
        </div>
        <div style={{ fontSize: '0.95rem', color: '#555', fontWeight: 500, lineHeight: 1.5, marginBottom: '28px' }}>
          {modal.message}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '14px', borderRadius: '16px',
              border: '1.5px solid rgba(0,0,0,0.1)',
              background: 'rgba(0,0,0,0.04)',
              fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer',
              color: '#555',
            }}
          >
            {modal.cancelText || 'Huỷ'}
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: '14px', borderRadius: '16px',
              border: 'none',
              background: modal.danger ? '#ff3b30' : '#0071e3',
              color: '#fff',
              fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer',
              boxShadow: modal.danger
                ? '0 6px 20px rgba(255,59,48,0.35)'
                : '0 6px 20px rgba(0,113,227,0.35)',
            }}
          >
            {modal.confirmText || 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Toast Container ────────────────────────────────────────────
function ToastContainer({ toasts, onRemove }) {
  return (
    <div style={{
      position: 'fixed', top: '24px', right: '16px',
      zIndex: 99998,
      display: 'flex', flexDirection: 'column', gap: '10px',
      pointerEvents: 'none',
    }}>
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px) scale(0.9); }
          to   { opacity: 1; transform: translateX(0)    scale(1);   }
        }
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1);    }
        }
      `}</style>
      {toasts.map(t => (
        <div key={t.id} style={{ pointerEvents: 'all' }}>
          <ToastItem toast={t} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
}

// ── Main Hook ──────────────────────────────────────────────────
export function useNotification() {
  const [toasts, setToasts]       = useState([]);
  const [confirmModal, setConfirm] = useState(null);
  const resolverRef               = useRef(null);
  let idCounter                   = useRef(0);

  const showToast = useCallback((title, message = '', type = 'info', duration = 3000) => {
    const id = ++idCounter.current;
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Trả về Promise giống window.confirm()
  const showConfirm = useCallback(({ title, message, icon, confirmText, cancelText, danger } = {}) => {
    return new Promise(resolve => {
      resolverRef.current = resolve;
      setConfirm({ title, message, icon, confirmText, cancelText, danger });
    });
  }, []);

  const handleConfirm = () => { setConfirm(null); resolverRef.current?.(true); };
  const handleCancel  = () => { setConfirm(null); resolverRef.current?.(false); };

  const NotificationUI = (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmModal modal={confirmModal} onConfirm={handleConfirm} onCancel={handleCancel} />
    </>
  );

  return { showToast, showConfirm, NotificationUI };
}
