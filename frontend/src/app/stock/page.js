'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import PageLayout from '@/components/layout/PageLayout';

export default function StockPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [branches, setBranches] = useState([]);
  const [stockLevels, setStockLevels] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchBranches();
  }, [user]);

  const fetchBranches = async () => {
    try {
      const res = await api.get('/branches');
      setBranches(res.data);
    } catch (err) {
      setError('Failed to load branches');
    }
  };

  const fetchStock = async (branchId) => {
    setLoading(true);
    try {
      const res = await api.get(`/items/stock/branch/${branchId}`);
      setStockLevels(res.data);
    } catch (err) {
      setError('Failed to load stock levels');
    } finally {
      setLoading(false);
    }
  };

  const handleBranchChange = (e) => {
    setSelectedBranch(e.target.value);
    if (e.target.value) fetchStock(e.target.value);
    else setStockLevels([]);
  };

  const getStockStatus = (qty, reorder) => {
    if (qty === 0) return { label: 'Out of Stock', bg: '#fef2f2', color: '#dc2626' };
    if (qty <= reorder) return { label: 'Low Stock', bg: '#fefce8', color: '#ca8a04' };
    return { label: 'In Stock', bg: '#f0fdf4', color: '#16a34a' };
  };

  return (
    <PageLayout title="Stock Levels" subtitle="View stock levels per branch">

      {/* Branch Selector */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16, marginBottom: 24 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#64748b', marginBottom: 6 }}>Select Branch</label>
        <select value={selectedBranch} onChange={handleBranchChange} style={{
          width: '100%', maxWidth: 360, padding: '8px 12px', border: '1px solid #e2e8f0',
          borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff', color: '#0f172a',
        }}>
          <option value="">Select a branch…</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
          padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13,
        }}>{error}</div>
      )}

      {/* Summary Cards */}
      {stockLevels.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'In Stock',      count: stockLevels.filter(s => s.quantity > s.reorderLevel).length,                    bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d' },
            { label: 'Low Stock',     count: stockLevels.filter(s => s.quantity > 0 && s.quantity <= s.reorderLevel).length,  bg: '#fefce8', border: '#fde68a', color: '#ca8a04' },
            { label: 'Out of Stock',  count: stockLevels.filter(s => s.quantity === 0).length,                                bg: '#fef2f2', border: '#fecaca', color: '#dc2626' },
          ].map(card => (
            <div key={card.label} style={{
              background: card.bg, border: `1px solid ${card.border}`,
              borderRadius: 12, padding: 16,
            }}>
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{card.label}</p>
              <p style={{ fontSize: 24, fontWeight: 700, color: card.color }}>{card.count}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <div style={{
            width: 36, height: 36, border: '3px solid #e2e8f0',
            borderTopColor: '#378ADD', borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : selectedBranch ? (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['#', 'Item', 'Code', 'Category', 'Quantity', 'Reorder Level', 'Status'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '10px 20px',
                    fontSize: 11, fontWeight: 600, color: '#94a3b8',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stockLevels.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8', fontSize: 13 }}>
                    No stock records found for this branch
                  </td>
                </tr>
              ) : (
                stockLevels.map((stock, index) => {
                  const status = getStockStatus(stock.quantity, stock.reorderLevel);
                  return (
                    <tr key={stock.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px 20px', fontSize: 13, color: '#94a3b8' }}>{index + 1}</td>
                      <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{stock.item?.name}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontFamily: 'monospace', color: '#475569' }}>{stock.item?.code}</span>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: 13, color: '#475569' }}>{stock.item?.category}</td>
                      <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{stock.quantity}</td>
                      <td style={{ padding: '14px 20px', fontSize: 13, color: '#475569' }}>{stock.reorderLevel}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          background: status.bg, color: status.color,
                          padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                        }}>{status.label}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#94a3b8' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <p style={{ fontSize: 14 }}>Select a branch to view stock levels</p>
        </div>
      )}
    </PageLayout>
  );
}