'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import PageLayout from '@/components/layout/PageLayout';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie,
  Cell,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function AnalyticsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ branches: [], items: [], transfers: [], suppliers: [] });

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [branches, items, transfers, suppliers] = await Promise.all([
        api.get('/branches'),
        api.get('/items'),
        api.get('/transfers'),
        api.get('/suppliers'),
      ]);
      setStats({ branches: branches.data, items: items.data, transfers: transfers.data, suppliers: suppliers.data });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const transferStatusData = () => {
    const statusCount = {};
    stats.transfers.forEach(t => { statusCount[t.status] = (statusCount[t.status] || 0) + 1; });
    return Object.entries(statusCount).map(([name, value]) => ({ name, value }));
  };

  const itemsByCategoryData = () => {
    const catCount = {};
    stats.items.forEach(i => { const cat = i.category || 'Uncategorized'; catCount[cat] = (catCount[cat] || 0) + 1; });
    return Object.entries(catCount).map(([name, value]) => ({ name, value }));
  };

  const transfersByBranchData = () => {
    const branchCount = {};
    stats.transfers.forEach(t => { const branch = t.fromBranch?.name || 'Unknown'; branchCount[branch] = (branchCount[branch] || 0) + 1; });
    return Object.entries(branchCount).map(([name, transfers]) => ({ name, transfers }));
  };

  const cardStyle = (bg, border) => ({
    background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: 16,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  });

  const chartBoxStyle = {
    background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24,
  };

  const chartTitleStyle = {
    fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 16,
  };

  if (loading) return (
    <PageLayout title="Analytics Dashboard" subtitle="System overview and insights">
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#378ADD', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </PageLayout>
  );

  return (
    <PageLayout title="Analytics Dashboard" subtitle="System overview and insights">

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { title: 'Total Branches',   value: stats.branches.length,  icon: '🏢', bg: '#eff6ff', border: '#bfdbfe' },
          { title: 'Inventory Items',  value: stats.items.length,     icon: '📦', bg: '#f0fdf4', border: '#bbf7d0' },
          { title: 'Total Transfers',  value: stats.transfers.length, icon: '🔄', bg: '#fff7ed', border: '#fed7aa' },
          { title: 'Suppliers',        value: stats.suppliers.length, icon: '🏭', bg: '#f5f3ff', border: '#ddd6fe' },
        ].map(card => (
          <div key={card.title} style={cardStyle(card.bg, card.border)}>
            <div>
              <p style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{card.title}</p>
              <p style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>{card.value}</p>
            </div>
            <span style={{ fontSize: 28 }}>{card.icon}</span>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={chartBoxStyle}>
          <p style={chartTitleStyle}>Transfer Status Distribution</p>
          {transferStatusData().length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: 13 }}>No transfer data</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={transferStatusData()} cx="50%" cy="50%" outerRadius={100} dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}>
                  {transferStatusData().map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={chartBoxStyle}>
          <p style={chartTitleStyle}>Items by Category</p>
          {itemsByCategoryData().length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: 13 }}>No items data</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={itemsByCategoryData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={chartBoxStyle}>
          <p style={chartTitleStyle}>Transfers by Branch</p>
          {transfersByBranchData().length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: 13 }}>No transfer data</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={transfersByBranchData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="transfers" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={chartBoxStyle}>
          <p style={chartTitleStyle}>System Summary</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Active Branches',      value: stats.branches.filter(b => b.active).length,               total: stats.branches.length,  color: '#3b82f6' },
              { label: 'Active Items',         value: stats.items.filter(i => i.active).length,                  total: stats.items.length,     color: '#10b981' },
              { label: 'Pending Transfers',    value: stats.transfers.filter(t => t.status === 'PENDING').length, total: stats.transfers.length, color: '#f59e0b' },
              { label: 'Completed Transfers',  value: stats.transfers.filter(t => t.status === 'COMPLETED').length, total: stats.transfers.length, color: '#8b5cf6' },
              { label: 'Active Suppliers',     value: stats.suppliers.filter(s => s.active).length,              total: stats.suppliers.length, color: '#f97316' },
            ].map(row => {
              const percent = row.total > 0 ? Math.round((row.value / row.total) * 100) : 0;
              return (
                <div key={row.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: '#475569' }}>{row.label}</span>
                    <span style={{ fontWeight: 500, color: '#0f172a' }}>{row.value} / {row.total}</span>
                  </div>
                  <div style={{ width: '100%', background: '#f1f5f9', borderRadius: 99, height: 6 }}>
                    <div style={{ width: `${percent}%`, background: row.color, borderRadius: 99, height: 6, transition: 'width 0.4s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Transfers Table */}
      <div style={chartBoxStyle}>
        <p style={chartTitleStyle}>Recent Transfers</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Item', 'From', 'To', 'Qty', 'Status'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '10px 16px',
                    fontSize: 11, fontWeight: 600, color: '#94a3b8',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.transfers.slice(0, 5).map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{t.item?.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>{t.fromBranch?.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>{t.toBranch?.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#0f172a' }}>{t.quantity}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageLayout>
  );
}