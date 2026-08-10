import { useState, useEffect } from 'react';
import { claimApi, policyApi } from '../api';
import { LoadingState, EmptyState, StatusBadge, RiskBadge, formatCurrency, formatDate, formatDateTime } from '../components';

// ── Submit Claim Modal ────────────────────────────────────────────────────────
function SubmitClaimModal({ onClose, onSaved, toast }) {
  const [policies, setPolicies] = useState([]);
  const [form, setForm] = useState({
    policyId: '', description: '', claimAmount: '', incidentDate: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    policyApi.getAll().then(all => setPolicies(all.filter(p => p.status === 'ACTIVE'))).catch(() => {});
  }, []);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await claimApi.submit({
        policyId:     parseInt(form.policyId),
        description:  form.description,
        claimAmount:  parseFloat(form.claimAmount),
        incidentDate: new Date(form.incidentDate).toISOString(),
      });
      toast.success(`Claim submitted! AI Risk: ${result.riskLevel}`);
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
          <h3 className="modal-title">📁 Submit New Claim</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div style={{ background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.2)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.8rem', color: 'var(--accent-blue-light)' }}>
          🤖 <strong>Groq Cloud AI (Llama 3)</strong> will evaluate this claim's NLP description & financial ratio in real-time to assign a <strong>LOW / MEDIUM / HIGH</strong> risk score.
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Active Policy *</label>
            <select className="form-select" name="policyId" value={form.policyId} onChange={handleChange} required>
              <option value="">— Select active policy —</option>
              {policies.map(p => (
                <option key={p.id} value={p.id}>
                  {p.policyNumber} — {p.policyType} (Coverage: ₹{p.coverageAmount?.toLocaleString()})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Claim Description *</label>
            <textarea className="form-textarea" name="description" value={form.description} onChange={handleChange} required placeholder="Describe the incident and reason for claim…" style={{ minHeight: 90 }} />
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Claim Amount (₹) *</label>
              <input className="form-input" name="claimAmount" type="number" value={form.claimAmount} onChange={handleChange} required placeholder="350000" min="1" />
            </div>
            <div className="form-group">
              <label className="form-label">Incident Date & Time *</label>
              <input className="form-input" name="incidentDate" type="datetime-local" value={form.incidentDate} onChange={handleChange} required />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><span className="spinner" style={{width:14,height:14}} /> Submitting…</> : '🤖 Submit Claim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Review Modal (Approve / Reject) ──────────────────────────────────────────
function ReviewModal({ claim, action, onClose, onSaved, toast }) {
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (action === 'approve') {
        await claimApi.approve(claim.id, notes);
        toast.success('Claim approved successfully');
      } else {
        await claimApi.reject(claim.id, notes);
        toast.success('Claim rejected');
      }
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  const isApprove = action === 'approve';

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h3 className="modal-title">
            {isApprove ? '✅ Approve Claim' : '❌ Reject Claim'} #{claim.id}
          </h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem' }}>
          <div className="detail-row"><span className="detail-key">Amount</span><span className="detail-value" style={{ fontWeight: 700, fontSize: '1.1rem' }}>{formatCurrency(claim.claimAmount)}</span></div>
          <div className="detail-row"><span className="detail-key">Risk Level</span><span className="detail-value"><RiskBadge level={claim.riskLevel} /></span></div>
          <div className="detail-row"><span className="detail-key">Description</span><span className="detail-value" style={{ color: 'var(--text-secondary)' }}>{claim.description}</span></div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Review Notes {isApprove ? '' : '*'}</label>
            <textarea
              className="form-textarea"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              required={!isApprove}
              placeholder={isApprove ? 'Optional notes for approving this claim…' : 'Reason for rejection (required)…'}
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className={`btn ${isApprove ? 'btn-success' : 'btn-danger'}`} disabled={saving}>
              {saving ? <><span className="spinner" style={{width:14,height:14}} /> …</> : (isApprove ? '✅ Approve' : '❌ Reject')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Claims Page ──────────────────────────────────────────────────────────
export default function Claims({ toast }) {
  const [claims, setClaims]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showSubmit, setShowSubmit] = useState(false);
  const [review, setReview]       = useState(null); // { claim, action }
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter]     = useState('ALL');
  const [search, setSearch]       = useState('');

  async function load() {
    setLoading(true);
    try {
      setClaims(await claimApi.getAll());
    } catch (err) {
      toast.error('Failed to load claims: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = claims.filter(c => {
    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchRisk   = riskFilter   === 'ALL' || c.riskLevel === riskFilter;
    const matchSearch = `${c.description} ${c.policy?.policyNumber}`.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchRisk && matchSearch;
  });

  return (
    <div className="page-container page-enter">
      <div className="page-header">
        <div>
          <h1>Claims</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Submit, review, approve and reject insurance claims
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowSubmit(true)}>+ Submit Claim</button>
      </div>

      {/* ── Filters ── */}
      <div className="filter-bar">
        <div className="search-input-wrap" style={{ minWidth: 220 }}>
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="Search by description or policy…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <select className="form-select" style={{ width: 'auto', padding: '0.6rem 1rem' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>

        <select className="form-select" style={{ width: 'auto', padding: '0.6rem 1rem' }} value={riskFilter} onChange={e => setRiskFilter(e.target.value)}>
          <option value="ALL">All Risk Levels</option>
          <option value="LOW">🟢 Low Risk</option>
          <option value="MEDIUM">🟡 Medium Risk</option>
          <option value="HIGH">🔴 High Risk</option>
        </select>

        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
          {filtered.length} claim{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Claims Table ── */}
      <div className="table-container">
        {loading ? <LoadingState /> : filtered.length === 0 ? (
          <EmptyState
            icon="📁"
            title="No claims found"
            desc={claims.length === 0 ? 'Submit your first claim to get started' : 'Try adjusting your filters'}
            action={claims.length === 0 && <button className="btn btn-primary" onClick={() => setShowSubmit(true)}>+ Submit Claim</button>}
          />
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Policy</th>
                <th>Description</th>
                <th>Amount</th>
                <th>AI Risk</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const canReview = c.status === 'PENDING' || c.status === 'UNDER_REVIEW';
                return (
                  <tr key={c.id}>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{c.id}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--accent-blue-light)' }}>
                      {c.policy?.policyNumber || '—'}
                    </td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.description}
                    </td>
                    <td style={{ fontWeight: 700 }}>{formatCurrency(c.claimAmount)}</td>
                    <td><RiskBadge level={c.riskLevel} /></td>
                    <td><StatusBadge status={c.status} /></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                      {formatDate(c.createdAt)}
                    </td>
                    <td>
                      {canReview ? (
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => setReview({ claim: c, action: 'approve' })}
                          >✅ Approve</button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setReview({ claim: c, action: 'reject' })}
                          >❌ Reject</button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {c.reviewedAt ? `Reviewed ${formatDate(c.reviewedAt)}` : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showSubmit && (
        <SubmitClaimModal
          onClose={() => setShowSubmit(false)}
          onSaved={() => { setShowSubmit(false); load(); }}
          toast={toast}
        />
      )}

      {review && (
        <ReviewModal
          claim={review.claim}
          action={review.action}
          onClose={() => setReview(null)}
          onSaved={() => { setReview(null); load(); }}
          toast={toast}
        />
      )}
    </div>
  );
}
