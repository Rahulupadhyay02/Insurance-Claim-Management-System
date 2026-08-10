import { useState, useEffect } from 'react';
import { customerApi, policyApi, claimApi } from '../api';
import { formatCurrency, LoadingState, StatusBadge, RiskBadge } from '../components';

export default function Dashboard({ onNavigate }) {
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

        setStats({ customers: customers.length, policies: policies.length, claims: claims.length, pending, approved, highRisk });
        setRecentClaims(claims.slice(-5).reverse());
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
    { icon: '⏳', label: 'Pending Review', value: stats.pending, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', page: 'claims' },
    { icon: '✅', label: 'Approved Claims', value: stats.approved, color: '#22c55e', bg: 'rgba(34,197,94,0.12)', page: 'claims' },
    { icon: '🚨', label: 'High Risk Claims', value: stats.highRisk, color: '#ef4444', bg: 'rgba(239,68,68,0.12)', page: 'claims' },
  ];

  return (
    <div className="page-container page-enter">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Insurance Claim Management — Live Overview
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

      {/* ── Recent Claims ── */}
      <div className="table-container">
        <div className="table-header">
          <span className="table-title">Recent Claims</span>
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
                <th>ID</th><th>Description</th><th>Amount</th><th>Status</th><th>AI Risk</th><th>Date</th>
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
                  <td><RiskBadge level={c.riskLevel} /></td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {new Date(c.createdAt).toLocaleDateString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Architecture Explainer ── */}
      <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>🏗️ System Architecture</h3>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 2, fontFamily: 'monospace' }}>
            <div style={{ color: 'var(--accent-blue-light)' }}>React (Vite) — Port 5173</div>
            <div style={{ paddingLeft: '1rem', color: 'var(--text-muted)' }}>↓ REST API calls</div>
            <div style={{ color: 'var(--accent-purple)' }}>Spring Boot — Port 8080</div>
            <div style={{ paddingLeft: '1rem', color: 'var(--text-muted)' }}>↓ JPA / Hibernate</div>
            <div style={{ color: 'var(--accent-green-light)' }}>MySQL — insurance_db</div>
            <div style={{ paddingLeft: '1rem', color: 'var(--text-muted)' }}>↓ HTTPS POST Request</div>
            <div style={{ color: 'var(--accent-amber-light)' }}>Groq Cloud AI (Llama 3.3 70B)</div>
            <div style={{ paddingLeft: '1rem', color: 'var(--text-muted)' }}>→ Real-Time Risk Output: LOW / MEDIUM / HIGH</div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>🤖 Groq AI Risk Model</h3>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <p style={{ marginBottom: '0.75rem' }}>
              Every submitted claim is evaluated in real-time by <strong>Groq Llama 3 LLM</strong> across multiple context features:
            </p>
            <div style={{ marginBottom: '0.4rem' }}>
              <span style={{ color: 'var(--accent-blue-light)', fontWeight: 600 }}>• Natural Language NLP:</span> Analyzes suspicious wording & incident detail.
            </div>
            <div style={{ marginBottom: '0.4rem' }}>
              <span style={{ color: 'var(--accent-blue-light)', fontWeight: 600 }}>• Financial Anomaly:</span> Claim vs Policy coverage ratio evaluation.
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <span style={{ color: 'var(--accent-blue-light)', fontWeight: 600 }}>• Behavioral Context:</span> Customer's past claim history & frequency.
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span>Output:</span> <RiskBadge level="LOW" /> <RiskBadge level="MEDIUM" /> <RiskBadge level="HIGH" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
