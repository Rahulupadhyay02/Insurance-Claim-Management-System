import { useState, useEffect } from 'react';
import { claimApi, policyApi } from '../api';
import { LoadingState, EmptyState, StatusBadge, RiskBadge, ActionBadge, formatCurrency, formatDate, formatDateTime } from '../components';

// ── Risk Engine Analysis Modal ───────────────────────────────────────────────
function RiskAnalysisModal({ claim, onClose, onRecalculate, toast }) {
  if (!claim) return null;

  const [calculating, setCalculating] = useState(false);

  let anomalyData = null;
  try {
    if (claim.anomalyBreakdown) {
      anomalyData = typeof claim.anomalyBreakdown === 'string'
        ? JSON.parse(claim.anomalyBreakdown)
        : claim.anomalyBreakdown;
    }
  } catch (e) {
    console.error("Failed to parse anomalyBreakdown", e);
  }

  const finalScore = claim.riskScore ?? 0;
  const level = claim.riskLevel || 'LOW';
  const action = claim.recommendedAction || (level === 'LOW' ? 'NORMAL' : (level === 'MEDIUM' ? 'REVIEW' : 'INVESTIGATION'));

  const actionMeta = {
    NORMAL:        { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', label: 'Normal — Straight-Through Processing (STP)' },
    REVIEW:        { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Review — Adjuster Manual Verification' },
    INVESTIGATION: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'Investigation — Special Investigation Unit (SIU)' },
  }[action] || { color: '#4f8ef7', bg: 'rgba(79,142,247,0.12)', label: action };

  async function handleRecalc() {
    setCalculating(true);
    try {
      const updated = await claimApi.recalculateRisk(claim.id);
      if (toast) toast.success(`Recalculated risk: ${updated.riskLevel} (${updated.riskScore}/100)`);
      if (onRecalculate) onRecalculate(updated);
    } catch (err) {
      if (toast) toast.error("Recalculation error: " + err.message);
    } finally {
      setCalculating(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 780, width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🧠 Dual-Branch Risk Engine Analysis
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Claim #{claim.id} • Policy: {claim.policy?.policyNumber || 'N/A'} • Amount: {formatCurrency(claim.claimAmount)}
            </span>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* ── Synthesis Banner ── */}
        <div style={{
          background: actionMeta.bg,
          border: `1px solid ${actionMeta.color}40`,
          borderRadius: '12px',
          padding: '1.1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: actionMeta.color, fontWeight: 700 }}>
              Risk Engine Decision
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
              {actionMeta.label}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Final Risk Score</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: actionMeta.color }}>
                {claim.riskScore != null ? finalScore : '—'}<span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/100</span>
              </div>
            </div>
            <RiskBadge level={level} />
          </div>
        </div>

        {/* ── Two Branches Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
          
          {/* Branch 1: Customer History Anomaly Analysis */}
          <div className="card" style={{ background: 'var(--bg-secondary)', padding: '1.2rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-blue-light)' }}>
                📊 Branch 1: Customer History
              </h4>
              <span style={{
                background: 'rgba(79,142,247,0.15)',
                color: '#4f8ef7',
                padding: '0.2rem 0.6rem',
                borderRadius: '99px',
                fontSize: '0.75rem',
                fontWeight: 700
              }}>
                Anomaly: {claim.anomalyScore != null ? `${claim.anomalyScore}/100` : 'N/A'}
              </span>
            </div>

            {anomalyData ? (
              <div>
                <div style={{ marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
                    <span>Frequency Analysis</span>
                    <strong>{anomalyData.frequencyScore ?? 0}/100</strong>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, anomalyData.frequencyScore || 0)}%`, height: '100%', background: '#4f8ef7', borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Prior claims: {anomalyData.priorClaimsCount ?? 0} • Velocity 90d: {anomalyData.recentClaims90d ?? 0}
                  </div>
                </div>

                <div style={{ marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
                    <span>Amount Patterns</span>
                    <strong>{anomalyData.amountPatternScore ?? 0}/100</strong>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, anomalyData.amountPatternScore || 0)}%`, height: '100%', background: '#a855f7', borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Coverage ratio: {anomalyData.coverageRatio ?? 0}% {anomalyData.historicalAverageAmount ? `• Hist. Avg: ₹${anomalyData.historicalAverageAmount.toLocaleString()}` : ''}
                  </div>
                </div>

                <div style={{ marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
                    <span>Time Patterns</span>
                    <strong>{anomalyData.timePatternScore ?? 0}/100</strong>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, anomalyData.timePatternScore || 0)}%`, height: '100%', background: '#f59e0b', borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Days since policy start: {anomalyData.daysSincePolicyStart ?? 'N/A'} • Reporting lag: {anomalyData.reportingLagDays ?? 0}d
                  </div>
                </div>

                <div style={{ marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
                    <span>Treatment / Category Patterns</span>
                    <strong>{anomalyData.treatmentPatternScore ?? 0}/100</strong>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, anomalyData.treatmentPatternScore || 0)}%`, height: '100%', background: '#22c55e', borderRadius: 3 }} />
                  </div>
                </div>

                {anomalyData.flags && anomalyData.flags.length > 0 && (
                  <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.35rem' }}>
                      🚩 Anomaly Flags Triggered ({anomalyData.flags.length}):
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      {anomalyData.flags.map((f, idx) => (
                        <div key={idx} style={{
                          fontSize: '0.72rem',
                          background: 'rgba(239,68,68,0.08)',
                          color: '#f87171',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '6px',
                          border: '1px solid rgba(239,68,68,0.2)'
                        }}>
                          ⚠️ {f}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '1rem', textAlign: 'center', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  This claim was submitted prior to the Dual-Branch Risk Engine deployment.
                </p>
                <button className="btn btn-primary btn-sm" onClick={handleRecalc} disabled={calculating}>
                  {calculating ? 'Analyzing…' : '⚡ Run Dual-Branch Evaluation'}
                </button>
              </div>
            )}
          </div>

          {/* Branch 2: Claim Description LLM Semantic Evidence */}
          <div className="card" style={{ background: 'var(--bg-secondary)', padding: '1.2rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#a855f7' }}>
                🤖 Branch 2: LLM Text & Context
              </h4>
              <span style={{
                background: 'rgba(168,85,247,0.15)',
                color: '#a855f7',
                padding: '0.2rem 0.6rem',
                borderRadius: '99px',
                fontSize: '0.75rem',
                fontWeight: 700
              }}>
                LLM Score: {claim.llmScore != null ? `${claim.llmScore}/100` : 'N/A'}
              </span>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.25rem' }}>
                Incident Description Evaluated:
              </div>
              <div style={{
                fontSize: '0.8rem',
                color: 'var(--text-primary)',
                background: 'var(--bg-tertiary)',
                padding: '0.6rem 0.75rem',
                borderRadius: '8px',
                fontStyle: 'italic',
                border: '1px solid var(--border)'
              }}>
                "{claim.description}"
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.25rem' }}>
                🔍 Extracted LLM Reasoning & Evidence:
              </div>
              <div style={{
                fontSize: '0.8rem',
                color: 'var(--text-primary)',
                lineHeight: 1.5,
                background: 'rgba(168,85,247,0.06)',
                border: '1px solid rgba(168,85,247,0.2)',
                borderRadius: '8px',
                padding: '0.75rem'
              }}>
                {claim.llmEvidence || 'Semantic natural language evaluation performed across clinical, logical, and financial dimensions.'}
              </div>
            </div>
          </div>
        </div>

        {/* ── Architecture Synthesis Pipeline ── */}
        <div style={{
          background: 'var(--bg-tertiary)',
          borderRadius: '10px',
          padding: '0.75rem 1rem',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          border: '1px solid var(--border)'
        }}>
          <div>
            ⚖️ <strong>Synthesis Formula:</strong> (Anomaly Score × 45%) + (LLM Text Score × 55%) ➔ Final Score: <strong>{claim.riskScore != null ? `${finalScore}/100` : 'Pending'}</strong>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-ghost btn-sm" onClick={handleRecalc} disabled={calculating}>
              {calculating ? 'Analyzing…' : '🔄 Recalculate'}
            </button>
            <button className="btn btn-primary btn-sm" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
      toast.success(`Claim submitted! Risk: ${result.riskLevel} (${result.riskScore || 0}/100) — Action: ${result.recommendedAction || 'NORMAL'}`);
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
        <div style={{ background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.2)', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1.25rem', fontSize: '0.8rem', color: 'var(--accent-blue-light)', lineHeight: 1.4 }}>
          🧠 <strong>Dual-Branch Risk Engine:</strong> Evaluates <strong>Customer History</strong> (Frequency, Amount, Time & Treatment patterns) alongside <strong>Groq LLM Semantic Text Analysis</strong> to calculate a calibrated <strong>Final Risk Score</strong> and recommended action (Normal / Review / Investigation).
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
            <textarea className="form-textarea" name="description" value={form.description} onChange={handleChange} required placeholder="Describe the incident, medical facility/repairs, and reason for claim…" style={{ minHeight: 90 }} />
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
              {saving ? <><span className="spinner" style={{width:14,height:14}} /> Submitting…</> : '🧠 Submit & Assess Risk'}
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
          <div className="detail-row">
            <span className="detail-key">Risk Evaluation</span>
            <span className="detail-value" style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <RiskBadge level={claim.riskLevel} score={claim.riskScore} />
              <ActionBadge action={claim.recommendedAction} />
            </span>
          </div>
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
  const [selectedRiskClaim, setSelectedRiskClaim] = useState(null); // for RiskAnalysisModal
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter]     = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [search, setSearch]       = useState('');
  const [expandedDescIds, setExpandedDescIds] = useState(new Set());
  const [recalculatingAll, setRecalculatingAll] = useState(false);

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

  function toggleDesc(id) {
    setExpandedDescIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleRecalculateAll() {
    setRecalculatingAll(true);
    try {
      const updated = await claimApi.recalculateAll();
      toast.success(`Evaluated all claims with Dual-Branch Risk Engine!`);
      setClaims(updated);
    } catch (err) {
      toast.error('Recalculation error: ' + err.message);
    } finally {
      setRecalculatingAll(false);
    }
  }

  const filtered = claims.filter(c => {
    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchRisk   = riskFilter   === 'ALL' || c.riskLevel === riskFilter;
    const matchAction = actionFilter === 'ALL' || (c.recommendedAction && c.recommendedAction.toUpperCase() === actionFilter);
    const polNum = c.policy?.policyNumber || '';
    const matchSearch = `${c.description} ${polNum}`.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchRisk && matchAction && matchSearch;
  });

  return (
    <div className="page-container page-enter">
      <div className="page-header">
        <div>
          <h1>Claims Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Dual-Branch Risk Engine: Customer History Anomaly + LLM Semantic Reasoning
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-ghost"
            onClick={handleRecalculateAll}
            disabled={recalculatingAll}
            title="Recalculate risk for any legacy claims"
          >
            {recalculatingAll ? 'Evaluating…' : '🔄 Evaluate Legacy Claims'}
          </button>
          <button className="btn btn-primary" onClick={() => setShowSubmit(true)}>+ Submit Claim</button>
        </div>
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

        <select className="form-select" style={{ width: 'auto', padding: '0.6rem 1rem' }} value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
          <option value="ALL">All Recommended Actions</option>
          <option value="NORMAL">⚡ Normal (STP)</option>
          <option value="REVIEW">🔍 Review Required</option>
          <option value="INVESTIGATION">🚨 Investigation (SIU)</option>
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
                <th style={{ width: '55px' }}>ID</th>
                <th style={{ minWidth: '100px' }}>Policy</th>
                <th style={{ minWidth: '220px', maxWidth: '320px' }}>Description</th>
                <th style={{ minWidth: '105px' }}>Amount</th>
                <th style={{ minWidth: '155px' }}>Risk Engine Score</th>
                <th style={{ minWidth: '155px' }}>Recommended Action</th>
                <th style={{ minWidth: '95px' }}>Status</th>
                <th style={{ minWidth: '100px' }}>Submitted</th>
                <th style={{ minWidth: '175px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const canReview = c.status === 'PENDING' || c.status === 'UNDER_REVIEW';
                const isExpanded = expandedDescIds.has(c.id);
                return (
                  <tr key={c.id}>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{c.id}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-blue-light)' }}>
                      {c.policy?.policyNumber || 'POL-' + c.id}
                    </td>
                    <td style={{ maxWidth: '320px' }}>
                      <div
                        onClick={() => toggleDesc(c.id)}
                        title="Click to expand/collapse full description"
                        style={{
                          cursor: 'pointer',
                          lineHeight: 1.4,
                          fontSize: '0.82rem',
                          wordBreak: 'break-word',
                          whiteSpace: isExpanded ? 'normal' : 'nowrap',
                          overflow: isExpanded ? 'visible' : 'hidden',
                          textOverflow: isExpanded ? 'clip' : 'ellipsis'
                        }}
                      >
                        {c.description}
                        {c.description && c.description.length > 32 && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--accent-blue-light)', marginLeft: '0.35rem', fontWeight: 600 }}>
                            {isExpanded ? '▴ collapse' : '▾ more'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{formatCurrency(c.claimAmount)}</td>
                    <td>
                      <div
                        onClick={() => setSelectedRiskClaim(c)}
                        title="Click to view detailed Dual-Branch Risk Engine breakdown"
                        style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
                      >
                        <RiskBadge level={c.riskLevel} score={c.riskScore} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-blue-light)', textDecoration: 'underline' }}>
                          📊 Details
                        </span>
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <ActionBadge action={c.recommendedAction || (c.riskLevel === 'LOW' ? 'NORMAL' : (c.riskLevel === 'MEDIUM' ? 'REVIEW' : 'INVESTIGATION'))} />
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <StatusBadge status={c.status} />
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      {formatDate(c.createdAt)}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {canReview ? (
                        <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
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

      {selectedRiskClaim && (
        <RiskAnalysisModal
          claim={selectedRiskClaim}
          onClose={() => setSelectedRiskClaim(null)}
          onRecalculate={(updatedClaim) => {
            setSelectedRiskClaim(updatedClaim);
            load();
          }}
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
