import { useState, useEffect } from 'react';
import { policyApi, customerApi } from '../api';
import { LoadingState, EmptyState, StatusBadge, formatCurrency, formatDate } from '../components';

function PolicyModal({ onClose, onSaved, toast }) {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({
    customerId: '', policyNumber: '', policyType: 'HEALTH',
    coverageAmount: '', premiumAmount: '', startDate: '', endDate: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    customerApi.getAll().then(setCustomers).catch(() => {});
  }, []);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await policyApi.create({
        ...form,
        customerId:     parseInt(form.customerId),
        coverageAmount: parseFloat(form.coverageAmount),
        premiumAmount:  parseFloat(form.premiumAmount),
      });
      toast.success('Policy created successfully');
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">📋 Create Policy</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Customer *</label>
            <select className="form-select" name="customerId" value={form.customerId} onChange={handleChange} required>
              <option value="">— Select customer —</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.email})</option>
              ))}
            </select>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Policy Number *</label>
              <input className="form-input" name="policyNumber" value={form.policyNumber} onChange={handleChange} required placeholder="e.g. POL-2025-001" />
            </div>
            <div className="form-group">
              <label className="form-label">Policy Type *</label>
              <select className="form-select" name="policyType" value={form.policyType} onChange={handleChange}>
                {['HEALTH', 'LIFE', 'AUTO', 'HOME', 'TRAVEL'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Coverage Amount (₹) *</label>
              <input className="form-input" name="coverageAmount" type="number" value={form.coverageAmount} onChange={handleChange} required placeholder="500000" min="1" />
            </div>
            <div className="form-group">
              <label className="form-label">Premium / Month (₹) *</label>
              <input className="form-input" name="premiumAmount" type="number" value={form.premiumAmount} onChange={handleChange} required placeholder="12000" min="1" />
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input className="form-input" name="startDate" type="date" value={form.startDate} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">End Date *</label>
              <input className="form-input" name="endDate" type="date" value={form.endDate} onChange={handleChange} required />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><span className="spinner" style={{width:14,height:14}} /> Creating…</> : 'Create Policy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const POLICY_TYPE_ICONS = { HEALTH: '🏥', LIFE: '❤️', AUTO: '🚗', HOME: '🏠', TRAVEL: '✈️' };

export default function Policies({ toast }) {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch]     = useState('');

  async function load() {
    setLoading(true);
    try {
      setPolicies(await policyApi.getAll());
    } catch (err) {
      toast.error('Failed to load policies: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = policies.filter(p =>
    `${p.policyNumber} ${p.policyType} ${p.customer?.firstName} ${p.customer?.lastName}`.toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="page-container page-enter">
      <div className="page-header">
        <div>
          <h1>Policies</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Insurance policies linked to customers
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Create Policy</button>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="Search by policy number, type or customer…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="table-container">
        {loading ? <LoadingState /> : filtered.length === 0 ? (
          <EmptyState icon="📋" title="No policies found" desc="Create a policy for an existing customer"
            action={<button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Create Policy</button>} />
        ) : (
          <table>
            <thead>
              <tr><th>ID</th><th>Policy #</th><th>Type</th><th>Customer</th><th>Coverage</th><th>Premium/mo</th><th>Valid Until</th><th>Status</th></tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{p.id}</td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-blue-light)' }}>{p.policyNumber}</td>
                  <td>
                    <span>{POLICY_TYPE_ICONS[p.policyType] || '📄'} {p.policyType}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="avatar" style={{ width: 28, height: 28, fontSize: '0.65rem' }}>
                        {p.customer?.firstName?.[0]}{p.customer?.lastName?.[0]}
                      </div>
                      {p.customer?.firstName} {p.customer?.lastName}
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(p.coverageAmount)}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{formatCurrency(p.premiumAmount)}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{formatDate(p.endDate)}</td>
                  <td><StatusBadge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <PolicyModal
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load(); }}
          toast={toast}
        />
      )}
    </div>
  );
}
