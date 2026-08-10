import { useState, useEffect } from 'react';
import { customerApi } from '../api';
import { LoadingState, EmptyState, formatDate } from '../components';

function CustomerModal({ customer, onClose, onSaved, toast }) {
  const editing = !!customer?.id;
  const [form, setForm] = useState({
    firstName: customer?.firstName || '',
    lastName:  customer?.lastName  || '',
    email:     customer?.email     || '',
    phone:     customer?.phone     || '',
    address:   customer?.address   || '',
  });
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await customerApi.update(customer.id, form);
        toast.success('Customer updated successfully');
      } else {
        await customerApi.create(form);
        toast.success('Customer created successfully');
      }
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
          <h3 className="modal-title">{editing ? '✏️ Edit Customer' : '➕ Add Customer'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input className="form-input" name="firstName" value={form.firstName} onChange={handleChange} required placeholder="e.g. Rahul" />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input className="form-input" name="lastName" value={form.lastName} onChange={handleChange} required placeholder="e.g. Upadhyay" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input className="form-input" name="email" type="email" value={form.email} onChange={handleChange} required placeholder="rahul@example.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Phone (10 digits) *</label>
            <input className="form-input" name="phone" value={form.phone} onChange={handleChange} required placeholder="9876543210" maxLength={10} />
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea className="form-textarea" name="address" value={form.address} onChange={handleChange} placeholder="Full address..." />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><span className="spinner" style={{width:14,height:14}} /> Saving…</> : (editing ? 'Update Customer' : 'Create Customer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Customers({ toast }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null); // null | 'add' | customer object
  const [search, setSearch]       = useState('');
  const [deleting, setDeleting]   = useState(null);

  async function load() {
    setLoading(true);
    try {
      const data = await customerApi.getAll();
      setCustomers(data);
    } catch (err) {
      toast.error('Failed to load customers: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(customer) {
    if (!window.confirm(`Delete ${customer.firstName} ${customer.lastName}? This will also delete their policies and claims.`)) return;
    setDeleting(customer.id);
    try {
      await customerApi.delete(customer.id);
      toast.success('Customer deleted');
      setCustomers(prev => prev.filter(c => c.id !== customer.id));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(null);
    }
  }

  const filtered = customers.filter(c =>
    `${c.firstName} ${c.lastName} ${c.email} ${c.phone}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container page-enter">
      <div className="page-header">
        <div>
          <h1>Customers</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Manage insured customer profiles
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>
          + Add Customer
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Search by name, email or phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
          {filtered.length} of {customers.length} customers
        </span>
      </div>

      <div className="table-container">
        {loading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="👥"
            title="No customers found"
            desc={search ? 'Try a different search term' : 'Add your first customer to get started'}
            action={!search && <button className="btn btn-primary" onClick={() => setModal('add')}>+ Add Customer</button>}
          />
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Joined</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{c.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                        {c.firstName[0]}{c.lastName[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{c.firstName} {c.lastName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.address || 'No address'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--accent-blue-light)' }}>{c.email}</td>
                  <td style={{ fontFamily: 'monospace' }}>{c.phone}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{formatDate(c.createdAt)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setModal(c)}>✏️ Edit</button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(c)}
                        disabled={deleting === c.id}
                      >
                        {deleting === c.id ? '…' : '🗑️ Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <CustomerModal
          customer={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
          toast={toast}
        />
      )}
    </div>
  );
}
