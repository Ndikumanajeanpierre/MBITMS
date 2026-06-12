'use client';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ branches: 0, items: 0, transfers: 0, suppliers: 0 });
  const [recentTransfers, setRecentTransfers] = useState([]);
  const [stockLevels, setStockLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      const [branches, items, transfers] = await Promise.all([
        api.get('/branches'),
        api.get('/items'),
        api.get('/transfers'),
      ]);

      let suppliersCount = 0;
      if (['ADMIN', 'HEAD_OFFICE_ADMIN', 'ACCOUNTANT'].includes(user?.role)) {
        const suppliers = await api.get('/suppliers');
        suppliersCount = suppliers.data.length;
      }

      setStats({
        branches: branches.data.length,
        items: items.data.length,
        transfers: transfers.data.length,
        suppliers: suppliersCount,
      });

      const sorted = [...transfers.data].sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setRecentTransfers(sorted.slice(0, 4));
      setStockLevels(branches.data.slice(0, 5));

    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const statusStyle = {
    PENDING:     { bg: '#FAEEDA', color: '#854F0B', label: 'Pending' },
    L1_APPROVED: { bg: '#E6F1FB', color: '#185FA5', label: 'L1 Approved' },
    APPROVED:    { bg: '#EAF3DE', color: '#3B6D11', label: 'Approved' },
    IN_TRANSIT:  { bg: '#E6F1FB', color: '#185FA5', label: 'In Transit' },
    COMPLETED:   { bg: '#EAF3DE', color: '#3B6D11', label: 'Completed' },
    REJECTED:    { bg: '#FCEBEB', color: '#A32D2D', label: 'Rejected' },
  };

  const navItems = [
    { section: 'Main' },
    { label: 'Dashboard',       icon: 'ti-layout-dashboard', path: '/dashboard',       roles: null },
    { label: 'Branches',        icon: 'ti-building-store',   path: '/branches',        roles: null },
    { label: 'Inventory',       icon: 'ti-box',              path: '/inventory',       roles: null },
    { label: 'Transfers',       icon: 'ti-arrows-exchange',  path: '/transfers',       roles: null, badge: stats.transfers },
    { label: 'Batch Tracking',  icon: 'ti-clock',            path: '/batches',         roles: null },
    { section: 'Procurement' },
    { label: 'Suppliers',       icon: 'ti-truck',            path: '/suppliers',       roles: ['ADMIN','HEAD_OFFICE_ADMIN','ACCOUNTANT'] },
    { label: 'Purchase Orders', icon: 'ti-shopping-cart',    path: '/purchase-orders', roles: ['ADMIN','HEAD_OFFICE_ADMIN','ACCOUNTANT'] },
    { section: 'Finance' },
    { label: 'Finance',         icon: 'ti-coin',             path: '/finance',         roles: ['ADMIN','HEAD_OFFICE_ADMIN','ACCOUNTANT'] },
    { section: 'Reports' },
    { label: 'Analytics',       icon: 'ti-chart-bar',        path: '/analytics',       roles: ['ADMIN','HEAD_OFFICE_ADMIN','ACCOUNTANT'] },
    { label: 'Audit Logs',      icon: 'ti-clipboard-list',   path: '/audit-logs',      roles: ['ADMIN','HEAD_OFFICE_ADMIN'] },
    { section: 'Admin' },
    { label: 'Manage Users',    icon: 'ti-users',            path: '/users',           roles: ['ADMIN'] },
    { label: 'Stock',           icon: 'ti-packages',         path: '/stock',           roles: null },
  ];

  const quickActions = [
    { label: 'New transfer',   icon: 'ti-arrows-exchange', bg: '#E6F1FB', ic: '#185FA5', path: '/transfers',       roles: null },
    { label: 'Add item',       icon: 'ti-plus',            bg: '#EAF3DE', ic: '#3B6D11', path: '/inventory',       roles: ['ADMIN','HEAD_OFFICE_ADMIN','BRANCH_MANAGER'] },
    { label: 'Purchase order', icon: 'ti-shopping-cart',   bg: '#FAEEDA', ic: '#854F0B', path: '/purchase-orders', roles: ['ADMIN','HEAD_OFFICE_ADMIN','ACCOUNTANT'] },
    { label: 'Finance',        icon: 'ti-coin',            bg: '#E1F5EE', ic: '#0F6E56', path: '/finance',         roles: ['ADMIN','HEAD_OFFICE_ADMIN','ACCOUNTANT'] },
    { label: 'Analytics',      icon: 'ti-chart-bar',       bg: '#EEEDFE', ic: '#534AB7', path: '/analytics',       roles: ['ADMIN','HEAD_OFFICE_ADMIN','ACCOUNTANT'] },
    { label: 'Audit logs',     icon: 'ti-clipboard-list',  bg: '#E1F5EE', ic: '#0F6E56', path: '/audit-logs',      roles: ['ADMIN','HEAD_OFFICE_ADMIN'] },
    { label: 'Manage users',   icon: 'ti-users',           bg: '#FCEBEB', ic: '#A32D2D', path: '/users',           roles: ['ADMIN'] },
    { label: 'Batch tracking', icon: 'ti-clock',           bg: '#FAEEDA', ic: '#854F0B', path: '/batches',         roles: null },
    { label: 'Stock',          icon: 'ti-packages',        bg: '#f1f5f9', ic: '#475569', path: '/stock',           roles: null },
  ];

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: 'Arial, Helvetica, sans-serif' }}>

      {/* Sidebar */}
      <aside style={{ width: sidebarOpen ? 230 : 60, flexShrink: 0, background: '#0C447C', display: 'flex', flexDirection: 'column', transition: 'width 0.2s', overflow: 'hidden', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '18px 14px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '0.5px solid rgba(255,255,255,0.1)' }}>
          <div style={{ width: 32, height: 32, background: '#378ADD', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="ti ti-packages" style={{ color: '#fff', fontSize: 17 }} />
          </div>
          {sidebarOpen && (
            <div>
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>MBITMS</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>Inventory System</div>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 16, flexShrink: 0, padding: 2 }}>
            <i className={`ti ${sidebarOpen ? 'ti-layout-sidebar-left-collapse' : 'ti-layout-sidebar-left-expand'}`} />
          </button>
        </div>

        <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto', overflowX: 'hidden' }}>
          {navItems.map((item, i) => {
            if (item.section) {
              return sidebarOpen ? (
                <div key={i} style={{ padding: '12px 14px 4px', color: 'rgba(255,255,255,0.35)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                  {item.section}
                </div>
              ) : <div key={i} style={{ height: 8 }} />;
            }
            if (item.roles && !item.roles.includes(user?.role)) return null;
            const isActive = typeof window !== 'undefined' && window.location.pathname === item.path;
            return (
              <div key={i} onClick={() => router.push(item.path)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', margin: '1px 8px', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap', background: isActive ? '#378ADD' : 'transparent', color: isActive ? '#fff' : 'rgba(255,255,255,0.65)', fontSize: 13, transition: 'all 0.15s' }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}}
              >
                <i className={`ti ${item.icon}`} style={{ fontSize: 16, flexShrink: 0 }} />
                {sidebarOpen && <span style={{ flex: 1 }}>{item.label}</span>}
                {sidebarOpen && item.badge > 0 && (
                  <span style={{ background: '#E24B4A', color: '#fff', fontSize: 10, padding: '1px 6px', borderRadius: 99 }}>{item.badge}</span>
                )}
              </div>
            );
          })}
        </nav>

        <div style={{ padding: 12, borderTop: '0.5px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderRadius: 8, cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#378ADD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, color: '#fff', flexShrink: 0 }}>
              {initials}
            </div>
            {sidebarOpen && (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#fff', fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                  <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>{user?.role?.replace(/_/g, ' ')}</div>
                </div>
                <i className="ti ti-logout" onClick={logout} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, cursor: 'pointer', flexShrink: 0 }} />
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ background: '#fff', borderBottom: '0.5px solid #e2e8f0', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 500, color: '#0f172a' }}>Dashboard</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>{today}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => router.push('/transfers')}
              style={{ background: '#185FA5', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="ti ti-plus" style={{ fontSize: 14 }} /> New Transfer
            </button>
            <button onClick={logout}
              style={{ background: '#fff0f0', color: '#A32D2D', border: '0.5px solid #F7C1C1', padding: '7px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
              Logout
            </button>
          </div>
        </header>

        <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>

          {error && (
            <div style={{ background: '#FCEBEB', border: '0.5px solid #F7C1C1', color: '#A32D2D', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
              <span>{error}</span>
              <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, color: '#A32D2D' }}>×</button>
            </div>
          )}

          {/* Stat cards */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', height: 90 }}>
                  <div style={{ background: '#f1f5f9', borderRadius: 4, height: 12, width: '50%', marginBottom: 12 }} />
                  <div style={{ background: '#f1f5f9', borderRadius: 4, height: 28, width: '30%' }} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Branches',        value: stats.branches,  bg: '#E6F1FB', ic: '#185FA5', icon: 'ti-building-store', path: '/branches' },
                { label: 'Inventory items', value: stats.items,     bg: '#EAF3DE', ic: '#3B6D11', icon: 'ti-box',            path: '/inventory' },
                { label: 'Transfers',       value: stats.transfers, bg: '#FAEEDA', ic: '#854F0B', icon: 'ti-arrows-exchange', path: '/transfers' },
                ...((['ADMIN','HEAD_OFFICE_ADMIN','ACCOUNTANT'].includes(user?.role))
                  ? [{ label: 'Suppliers', value: stats.suppliers, bg: '#EEEDFE', ic: '#534AB7', icon: 'ti-truck', path: '/suppliers' }]
                  : []),
              ].map(card => (
                <div key={card.label} onClick={() => router.push(card.path)}
                  style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#94a3b8'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                >
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ width: 34, height: 34, background: card.bg, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className={`ti ${card.icon}`} style={{ color: card.ic, fontSize: 17 }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 3 }}>{card.label}</div>
                  <div style={{ fontSize: 26, fontWeight: 500, color: '#0f172a', lineHeight: 1 }}>{card.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Two column panels */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 12 }}>
              <div style={{ padding: '14px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>Recent transfers</span>
                <span onClick={() => router.push('/transfers')} style={{ fontSize: 11, color: '#185FA5', cursor: 'pointer' }}>View all →</span>
              </div>
              <div style={{ padding: '12px 16px 14px' }}>
                {recentTransfers.length === 0 ? (
                  <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>No transfers yet</div>
                ) : recentTransfers.map((t, i) => {
                  const s = statusStyle[t.status] || { bg: '#f1f5f9', color: '#64748b', label: t.status };
                  return (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < recentTransfers.length - 1 ? '0.5px solid #f1f5f9' : 'none' }}>
                      <div style={{ width: 28, height: 28, background: s.bg, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className="ti ti-arrows-exchange" style={{ color: s.color, fontSize: 13 }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.item?.name || 'Item'}</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{t.fromBranch?.name || '—'} → {t.toBranch?.name || '—'}</div>
                      </div>
                      <span style={{ background: s.bg, color: s.color, fontSize: 10, padding: '2px 8px', borderRadius: 99, fontWeight: 500, flexShrink: 0 }}>{s.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 12 }}>
              <div style={{ padding: '14px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>Branches overview</span>
                <span onClick={() => router.push('/branches')} style={{ fontSize: 11, color: '#185FA5', cursor: 'pointer' }}>View all →</span>
              </div>
              <div style={{ padding: '12px 16px 14px' }}>
                {stockLevels.length === 0 ? (
                  <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>No branches yet</div>
                ) : stockLevels.map((b, i) => {
                  const pct = Math.max(15, Math.min(100, Math.floor(Math.random() * 80 + 20)));
                  const barColor = pct > 60 ? '#185FA5' : pct > 30 ? '#EF9F27' : '#E24B4A';
                  return (
                    <div key={b.id} style={{ marginBottom: i < stockLevels.length - 1 ? 10 : 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: '#334155' }}>{b.name}</span>
                        <span style={{ fontSize: 11, color: '#64748b' }}>{b.location}</span>
                      </div>
                      <div style={{ height: 5, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 99 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 12 }}>
            <div style={{ padding: '14px 16px 0' }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>Quick actions</span>
            </div>
            <div style={{ padding: '12px 16px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
              {quickActions.filter(a => !a.roles || a.roles.includes(user?.role)).map(a => (
                <div key={a.label} onClick={() => router.push(a.path)}
                  style={{ background: '#fafafa', border: '0.5px solid #e2e8f0', borderRadius: 10, padding: '14px 10px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = a.bg; e.currentTarget.style.borderColor = 'transparent'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fafafa'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                >
                  <div style={{ width: 36, height: 36, background: a.bg, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                    <i className={`ti ${a.icon}`} style={{ color: a.ic, fontSize: 18 }} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#334155' }}>{a.label}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}