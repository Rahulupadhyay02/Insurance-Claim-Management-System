import { useState, useEffect } from 'react';
import { customerApi, policyApi, claimApi } from '../api';
import { formatCurrency, LoadingState, StatusBadge, RiskBadge, ActionBadge } from '../components';

export default function Dashboard({ onNavigate, theme, setTheme }) {
  const [stats, setStats] = useState(null);
  const [recentClaims, setRecentClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [customers, policies, claims] = await Promise.all([
          customerApi.getAll(),
          policyApi.getAll(),
          claimApi.getAll(),
        ]);

        const pending  = claims.filter(c => c.status === 'PENDING').length;
        const approved = claims.filter(c => c.status === 'APPROVED').length;
        const highRisk = claims.filter(c => c.riskLevel === 'HIGH').length;

        const normalCount = claims.filter(c => (c.recommendedAction === 'NORMAL' || (!c.recommendedAction && c.riskLevel === 'LOW'))).length;
        const reviewCount = claims.filter(c => (c.recommendedAction === 'REVIEW' || (!c.recommendedAction && c.riskLevel === 'MEDIUM'))).length;
        const investCount = claims.filter(c => (c.recommendedAction === 'INVESTIGATION' || (!c.recommendedAction && c.riskLevel === 'HIGH'))).length;

        setStats({
          customers: customers.length,
          policies: policies.length,
          claims: claims.length,
          pending,
          approved,
          highRisk,
          normalCount,
          reviewCount,
          investCount,
        });
        setRecentClaims(claims.slice(-6).reverse());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <LoadingState message="Loading dashboard..." />;

  const statCards = [
    { icon: '👥', label: 'Total Customers', value: stats.customers, color: '#4f8ef7', bg: 'rgba(79,142,247,0.12)', page: 'customers' },
    { icon: '📋', label: 'Active Policies', value: stats.policies, color: '#a855f7', bg: 'rgba(168,85,247,0.12)', page: 'policies' },
    { icon: '📁', label: 'Total Claims', value: stats.claims, color: '#22c55e', bg: 'rgba(34,197,94,0.12)', page: 'claims' },
    { icon: '⚡', label: 'STP Normal (Low)', value: stats.normalCount, color: '#22c55e', bg: 'rgba(34,197,94,0.12)', page: 'claims' },
    { icon: '🔍', label: 'Adjuster Review', value: stats.reviewCount, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', page: 'claims' },
    { icon: '🚨', label: 'SIU Investigation', value: stats.investCount, color: '#ef4444', bg: 'rgba(239,68,68,0.12)', page: 'claims' },
  ];

  const themeOptions = [
    { id: 'dark', title: 'Dark Navy', icon: '🌌', desc: 'Deep Cobalt & Glassmorphism', previewBg: '#0a0f1e', previewAccent: '#4f8ef7' },
    { id: 'oled', title: 'Midnight OLED', icon: '🖤', desc: 'Pure Pitch Black & High Contrast', previewBg: '#000000', previewAccent: '#3b82f6' },
    { id: 'emerald', title: 'Emerald Cyber', icon: '🌿', desc: 'Bio-Green & Cybernetic Teal', previewBg: '#041410', previewAccent: '#10b981' },
    { id: 'light', title: 'Corporate Light', icon: '☀️', desc: 'Clean Modern White & Slate', previewBg: '#f8fafc', previewAccent: '#2563eb' },
  ];

  return (
    <div className="page-container page-enter">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Insurance Claim Management — Live Dual-Branch Risk Engine Overview
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-primary" onClick={() => onNavigate('claims')}>
            + New Claim
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="stat-grid">
        {statCards.map(s => (
          <div key={s.label} className="stat-card" onClick={() => onNavigate(s.page)} style={{ cursor: 'pointer' }}>
            <div className="stat-icon" style={{ background: s.bg }}>
              <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
            </div>
            <div className="stat-content">
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Theme Customizer Section ── */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🎨 UI Theme Customizer
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
              Choose a color theme for your workspace layout
            </p>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-blue-light)', fontWeight: 600 }}>
            Active: {themeOptions.find(t => t.id === theme)?.title || 'Dark Navy'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {themeOptions.map(t => {
            const isActive = theme === t.id;
            return (
              <div
                key={t.id}
                onClick={() => setTheme(t.id)}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)',
                  border: isActive ? `2px solid ${t.previewAccent}` : '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>{t.icon}</span>
                  {isActive && (
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: '#fff',
                      background: t.previewAccent,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '99px'
                    }}>Active</span>
                  )}
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {t.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {t.desc}
                </div>
                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: t.previewBg, border: '1px solid var(--border)' }} />
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: t.previewAccent }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Recent Claims ── */}
      <div className="table-container">
        <div className="table-header">
          <span className="table-title">Recent Claims & Risk Engine Decisions</span>
          <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('claims')}>View All →</button>
        </div>
        {recentClaims.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No claims yet — submit your first claim to see it here.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Risk Engine Score</th>
                <th>Action</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentClaims.map(c => (
                <tr key={c.id}>
                  <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{c.id}</td>
                  <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.description}
                  </td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(c.claimAmount)}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td><RiskBadge level={c.riskLevel} score={c.riskScore} /></td>
                  <td><ActionBadge action={c.recommendedAction || (c.riskLevel === 'LOW' ? 'NORMAL' : (c.riskLevel === 'MEDIUM' ? 'REVIEW' : 'INVESTIGATION'))} /></td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {new Date(c.createdAt).toLocaleDateString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Dual-Branch Architecture Pipeline Explainer ── */}
      <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.25rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🧠 Dual-Branch Risk Pipeline
          </h3>
          <div style={{
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            fontFamily: 'monospace',
            lineHeight: 1.6,
            background: 'var(--bg-tertiary)',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid var(--border)'
          }}>
            <div style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>CLAIM SUBMISSION</div>
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>↓</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-blue-light)' }}>
              <span>[Branch 1: Customer History]</span>
              <span>[Branch 2: Description LLM]</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span>• Frequency Analysis</span>
              <span>• Narrative Consistency</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span>• Amount Patterns</span>
              <span>• Semantic Ambiguity</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span>• Time Patterns</span>
              <span>• Severity Realism</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span>• Treatment Patterns</span>
              <span>• Fraud Cues Extraction</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '0.4rem' }}>
              <span style={{ color: '#4f8ef7' }}>➔ Anomaly Score</span>
              <span style={{ color: '#a855f7' }}>➔ LLM Evidence</span>
            </div>
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>↘          ↙</div>
            <div style={{ color: '#f59e0b', textAlign: 'center', fontWeight: 'bold' }}>SYNTHESIZED RISK ENGINE (0-100)</div>
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>↓</div>
            <div style={{ display: 'flex', justifyContent: 'space-around', fontWeight: 'bold', fontSize: '0.72rem' }}>
              <span style={{ color: '#22c55e' }}>LOW ➔ Normal</span>
              <span style={{ color: '#f59e0b' }}>MED ➔ Review</span>
              <span style={{ color: '#ef4444' }}>HIGH ➔ Investigate</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🎯 Decisioning Tiers & Actions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.82rem' }}>
            <div style={{ padding: '0.65rem 0.85rem', borderRadius: '8px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: '#22c55e' }}>
                <span>🟢 Score 0 – 34: LOW RISK ➔ NORMAL</span>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                Eligible for Straight-Through Processing (STP). Genuine claim profile, regular historical intervals, realistic incident text.
              </div>
            </div>

            <div style={{ padding: '0.65rem 0.85rem', borderRadius: '8px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: '#f59e0b' }}>
                <span>🟡 Score 35 – 69: MEDIUM RISK ➔ REVIEW</span>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                Routed to Claims Adjuster queue. Moderate coverage ratio or brief description. Requires itemized invoice & provider checks.
              </div>
            </div>

            <div style={{ padding: '0.65rem 0.85rem', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: '#ef4444' }}>
                <span>🔴 Score 70 – 100: HIGH RISK ➔ INVESTIGATION</span>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                Flagged for Special Investigation Unit (SIU) fraud audit. Elevated claim frequency, early inception window, or suspicious LLM cues.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
