'use client';
import Sidebar from './Sidebar';

export default function PageLayout({ children, title, subtitle, actions }) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Topbar */}
        <header style={{
          background: '#fff', borderBottom: '0.5px solid #e2e8f0',
          padding: '12px 24px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 500, color: '#0f172a' }}>{title}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>{subtitle || today}</div>
          </div>
          {actions && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{actions}</div>}
        </header>

        {/* Page content */}
        <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}