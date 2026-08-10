export default function Sidebar({ activePage, onNavigate, backendStatus }) {
  const navItems = [
    { page: 'dashboard', icon: '🏠', label: 'Dashboard',  section: 'OVERVIEW' },
    { page: 'customers', icon: '👥', label: 'Customers',  section: 'MANAGEMENT' },
    { page: 'policies',  icon: '📋', label: 'Policies',   section: null },
    { page: 'claims',    icon: '📁', label: 'Claims',     section: null },
  ];

  let currentSection = null;

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-logo">
          <div className="brand-icon">🛡️</div>
          <div className="brand-text">
            <div className="brand-name">InsuranceMS</div>
            <div className="brand-sub">Claim Management</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {navItems.map(item => {
          const showSection = item.section && item.section !== currentSection;
          if (showSection) currentSection = item.section;

          return (
            <div key={item.page}>
              {showSection && <div className="nav-section-label">{item.section}</div>}
              <div
                className={`nav-item ${activePage === item.page ? 'active' : ''}`}
                onClick={() => onNavigate(item.page)}
              >
                <div className="nav-item-icon">{item.icon}</div>
                <span>{item.label}</span>
              </div>
            </div>
          );
        })}

        <div className="nav-section-label" style={{ marginTop: '0.5rem' }}>AI MODULE</div>
        <div
          className={`nav-item ${activePage === 'claims' ? 'active' : ''}`}
          onClick={() => onNavigate('claims')}
          style={{ opacity: 0.85 }}
        >
          <div className="nav-item-icon">🤖</div>
          <div>
            <div>Risk Assessment</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 1 }}>LOW · MEDIUM · HIGH</div>
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="status-indicator">
          <div className={`status-dot ${backendStatus === 'online' ? '' : 'offline'}`} />
          <div>
            <div style={{ fontWeight: 600, color: backendStatus === 'online' ? 'var(--accent-green-light)' : 'var(--accent-red-light)' }}>
              Backend {backendStatus === 'online' ? 'Online' : 'Offline'}
            </div>
            <div style={{ fontSize: '0.65rem' }}>Spring Boot :8080</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
