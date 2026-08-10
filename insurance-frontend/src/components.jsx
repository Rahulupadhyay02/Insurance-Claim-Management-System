import { useState, useCallback } from 'react';

// ── Toast context / hook ──────────────────────────────────────────────────────
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error:   (msg) => addToast(msg, 'error'),
    info:    (msg) => addToast(msg, 'info'),
  };

  return { toasts, toast };
}

// ── Toast Display Component ───────────────────────────────────────────────────
export function ToastContainer({ toasts }) {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>{icons[t.type]}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

// ── Badge helper ──────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    ACTIVE:       { cls: 'badge-green',  label: 'Active' },
    EXPIRED:      { cls: 'badge-gray',   label: 'Expired' },
    CANCELLED:    { cls: 'badge-red',    label: 'Cancelled' },
    SUSPENDED:    { cls: 'badge-amber',  label: 'Suspended' },
    PENDING:      { cls: 'badge-amber',  label: 'Pending' },
    UNDER_REVIEW: { cls: 'badge-blue',   label: 'Under Review' },
    APPROVED:     { cls: 'badge-green',  label: 'Approved' },
    REJECTED:     { cls: 'badge-red',    label: 'Rejected' },
  };
  const { cls, label } = map[status] || { cls: 'badge-gray', label: status };
  return <span className={`badge ${cls}`}>{label}</span>;
}

export function RiskBadge({ level }) {
  if (!level) return <span className="badge badge-gray">N/A</span>;
  const map = {
    LOW:    { cls: 'badge-green', icon: '🟢' },
    MEDIUM: { cls: 'badge-amber', icon: '🟡' },
    HIGH:   { cls: 'badge-red',   icon: '🔴' },
  };
  const { cls, icon } = map[level] || { cls: 'badge-gray', icon: '⚪' };
  return <span className={`badge ${cls}`}>{icon} {level}</span>;
}

// ── Loading spinner ───────────────────────────────────────────────────────────
export function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="loading-overlay">
      <div className="spinner" />
      <span>{message}</span>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📭', title, desc, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
      {action && <div style={{ marginTop: '1.5rem' }}>{action}</div>}
    </div>
  );
}

// ── Format helpers ────────────────────────────────────────────────────────────
export function formatCurrency(amount) {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
