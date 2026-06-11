'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import PageLayout from '@/components/layout/PageLayout';

export default function BatchesPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [batches, setBatches] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [expired, setExpired] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchAll();
  }, [user]);

  const fetchAll = async () => {
    try {
      const [all, exp, expd] = await Promise.all([
        api.get('/batches'),
        api.get('/batches/expiring'),
        api.get('/batches/expired'),
      ]);
      setBatches(all.data);
      setExpiring(exp.data);
      setExpired(expd.data);
    } catch (err) {
      setError('Failed to load batch data');
    } finally {
      setLoading(false);
    }
  };

  const getDisplayData = () => {
    if (activeTab === 'expiring') return expiring;
    if (activeTab === 'expired') return expired;
    return batches;
  };

  const getDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  };

  const getExpiryStyle = (days) => {
    if (days === null) return { color: '#94a3b8' };
    if (days < 0)  return { color: '#dc2626', fontWeight: 700 };
    if (days <= 7) return { color: '#ef4444', fontWeight: 700 };
    if (days <= 30) return { color: '#ca8a04', fontWeight: 600 };
    return { color: '#16a34a' };
  };

  return (
    <PageLayout title="Batch & Expiry Tracking" subtitle="Monitor stock batches and expiry dates">

      {/* Alert Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Expired Batches', count: expired.length, icon: '🚫', bg: '#fef2f2', border: '#fecaca', color: '#dc2626' },
          { label: 'Expiring Soon (30 days)', count: expiring.length, icon: '⚠️', bg: '#fefce8', border: '#fde68a', color: '#ca8a04' },
          { label: 'Total Batches', count: batches.length, icon: '📦', bg: '#f0fdf4', border: '#bbf7d0', color: '#16a34a' },
        ].map(card => (
          <div key={card.label} style={{
            background: card.bg, border: `1px solid ${card.border}`,
            borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{card.label}</p>
              <p style={{ fontSize: 24, fontWeight: 700, color: card.color }}>{card.count}</p>
            </div>
            <span style={{ fontSize: 28 }}>{card.icon}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { key: 'all',      label: 'All Batches',   count: batches.length },
          { key: 'expiring', label: 'Expiring Soon', count: expiring.length },
          { key: 'expired',  label: 'Expired',       count: expired.length },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none',
            background: activeTab === tab.key ? '#378ADD' : '#fff',
            color: activeTab === tab.key ? '#fff' : '#475569',
            boxShadow: activeTab === tab.key ? 'none' : 'inset 0 0 0 1px #e2e8f0',
          }}>
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
          padding: '10px 14px', borderRadius: 8, marginBottom: 12, fontSize: 13,
        }}>{error}</div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <div style={{
            width: 36, height: 36, border: '3px solid #e2e8f0',
            borderTopColor: '#378ADD', borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['#', 'Item', 'Branch', 'Batch No.', 'Quantity', 'Expiry Date', 'Days Left'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '10px 20px',
                    fontSize: 11, fontWeight: 600, color: '#94a3b8',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {getDisplayData().length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8', fontSize: 13 }}>
                    No batches found
                  </td>
                </tr>
              ) : (
                getDisplayData().map((batch, index) => {
                  const days = getDaysUntilExpiry(batch.expiryDate);
                  return (
                    <tr key={batch.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px 20px', fontSize: 13, color: '#94a3b8' }}>{index + 1}</td>
                      <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{batch.item?.name}</td>
                      <td style={{ padding: '14px 20px', fontSize: 13, color: '#475569' }}>{batch.branch?.name}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontFamily: 'monospace', color: '#475569' }}>
                          {batch.batchNumber || 'N/A'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{batch.quantity}</td>
                      <td style={{ padding: '14px 20px', fontSize: 13, color: '#475569' }}>{batch.expiryDate || 'No expiry'}</td>
                      <td style={{ padding: '14px 20px' }}>
                        {days !== null ? (
                          <span style={{ fontSize: 13, ...getExpiryStyle(days) }}>
                            {days < 0 ? `Expired ${Math.abs(days)} days ago` :
                             days === 0 ? 'Expires today!' :
                             `${days} days`}
                          </span>
                        ) : (
                          <span style={{ fontSize: 13, color: '#94a3b8' }}>No expiry</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </PageLayout>
  );
}