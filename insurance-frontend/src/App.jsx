import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Policies from './pages/Policies';
import Claims from './pages/Claims';
import { useToast, ToastContainer } from './components';

const PAGE_TITLES = {
  dashboard: { title: 'Dashboard',  breadcrumb: 'Overview' },
  customers: { title: 'Customers',  breadcrumb: 'Management / Customers' },
  policies:  { title: 'Policies',   breadcrumb: 'Management / Policies' },
  claims:    { title: 'Claims',     breadcrumb: 'Management / Claims & AI Risk' },
};

export default function App() {
  const [page, setPage]             = useState('dashboard');
  const [backendStatus, setBackend] = useState('checking');
  const { toasts, toast }           = useToast();

  // ── Backend health check ─────────────────────────────────────────────────
  useEffect(() => {
    async function checkBackend() {
      try {
        const res = await fetch('http://localhost:8080/api/customers', { signal: AbortSignal.timeout(3000) });
        setBackend(res.ok || res.status === 403 ? 'online' : 'offline');
      } catch {
        setBackend('offline');
      }
    }
    checkBackend();
    const interval = setInterval(checkBackend, 15000);
    return () => clearInterval(interval);
  }, []);

  const meta = PAGE_TITLES[page] || PAGE_TITLES.dashboard;

  function navigate(p) {
    setPage(p);
    window.scrollTo(0, 0);
  }

  const pages = {
    dashboard: <Dashboard onNavigate={navigate} toast={toast} />,
    customers: <Customers toast={toast} />,
    policies:  <Policies  toast={toast} />,
    claims:    <Claims    toast={toast} />,
  };

  return (
    <>
      {/* Update page title */}
      <title>{meta.title} — InsuranceMS</title>

      <div className="app-layout">
        <Sidebar activePage={page} onNavigate={navigate} backendStatus={backendStatus} />

        <main className="main-content">
          {/* Topbar */}
          <div className="topbar">
            <div className="topbar-left">
              <div className="topbar-page">{meta.title}</div>
              <div className="topbar-breadcrumb">{meta.breadcrumb}</div>
            </div>
            <div className="topbar-right">
              {backendStatus === 'offline' && (
                <span style={{
                  fontSize: '0.75rem', color: 'var(--accent-red-light)',
                  background: 'rgba(239,68,68,0.1)', padding: '0.3rem 0.75rem',
                  borderRadius: '99px', border: '1px solid rgba(239,68,68,0.25)'
                }}>
                  ⚠️ Backend offline — start Spring Boot
                </span>
              )}
              <div className="avatar">RU</div>
            </div>
          </div>

          {/* Page content */}
          {pages[page] || pages.dashboard}
        </main>
      </div>

      <ToastContainer toasts={toasts} />
    </>
  );
}
