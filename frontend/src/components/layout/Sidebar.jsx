'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  const navItems = [
    { section: 'Main' },
    { label: 'Dashboard',       icon: 'ti-layout-dashboard', path: '/dashboard',       roles: null },
    { label: 'Branches',        icon: 'ti-building-store',   path: '/branches',        roles: null },
    { label: 'Inventory',       icon: 'ti-box',              path: '/inventory',       roles: null },
    { label: 'Transfers',       icon: 'ti-arrows-exchange',  path: '/transfers',       roles: null },
    { label: 'Batch Tracking',  icon: 'ti-clock',            path: '/batches',         roles: null },
    { section: 'Procurement' },
    { label: 'Suppliers',       icon: 'ti-truck',            path: '/suppliers',       roles: ['ADMIN','HEAD_OFFICE_ADMIN','ACCOUNTANT'] },
    { label: 'Purchase Orders', icon: 'ti-shopping-cart',    path: '/purchase-orders', roles: ['ADMIN','HEAD_OFFICE_ADMIN','ACCOUNTANT'] },
    { section: 'Reports' },
    { label: 'Analytics',       icon: 'ti-chart-bar',        path: '/analytics',       roles: ['ADMIN','HEAD_OFFICE_ADMIN','ACCOUNTANT'] },
    { label: 'Audit Logs',      icon: 'ti-clipboard-list',   path: '/audit-logs',      roles: ['ADMIN','HEAD_OFFICE_ADMIN'] },
    { section: 'Admin' },
    { label: 'Manage Users',    icon: 'ti-users',            path: '/users',           roles: ['ADMIN'] },
    { label: 'Stock',           icon: 'ti-packages',         path: '/stock',           roles: null },
  ];

  return (
    <aside style={{
      width: collapsed ? 60 : 230, flexShrink: 0, background: '#0C447C',
      display: 'flex', flexDirection: 'column', transition: 'width 0.2s',
      overflow: 'hidden', position: 'sticky', top: 0, height: '100vh',
    }}>
      {/* Logo */}
      <div style={{ padding: '18px 14px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '0.5px solid rgba(255,255,255,0.1)' }}>
        <div style={{ width: 32, height: 32, background: '#378ADD', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className="ti ti-packages" style={{ color: '#fff', fontSize: 17 }} />
        </div>
        {!collapsed && (
          <div>
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>MBITMS</div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>Inventory System</div>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} style={{
          marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.4)', fontSize: 16, flexShrink: 0, padding: 2,
        }}>
          <i className={`ti ${collapsed ? 'ti-layout-sidebar-left-expand' : 'ti-layout-sidebar-left-collapse'}`} />
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto', overflowX: 'hidden' }}>
        {navItems.map((item, i) => {
          if (item.section) {
            return !collapsed ? (
              <div key={i} style={{ padding: '12px 14px 4px', color: 'rgba(255,255,255,0.35)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                {item.section}
              </div>
            ) : <div key={i} style={{ height: 8 }} />;
          }
          if (item.roles && !item.roles.includes(user?.role)) return null;
          const isActive = pathname === item.path;
          return (
            <div key={i} onClick={() => router.push(item.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 14px', margin: '1px 8px', borderRadius: 8,
                cursor: 'pointer', whiteSpace: 'nowrap',
                background: isActive ? '#378ADD' : 'transparent',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
                fontSize: 13, transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}}
            >
              <i className={`ti ${item.icon}`} style={{ fontSize: 16, flexShrink: 0 }} />
              {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
            </div>
          );
        })}
      </nav>

      {/* User footer */}
      <div style={{ padding: 12, borderTop: '0.5px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderRadius: 8, cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#378ADD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, color: '#fff', flexShrink: 0 }}>
            {initials}
          </div>
          {!collapsed && (
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
  );
}