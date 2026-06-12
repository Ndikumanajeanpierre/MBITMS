'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import PageLayout from '@/components/layout/PageLayout';

export default function FinancePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [transfers, setTransfers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('transfers');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!['ADMIN', 'HEAD_OFFICE_ADMIN', 'ACCOUNTANT'].includes(user.role)) {
      router.push('/dashboard'); return;
    }
    fetchAll();
  }, [user]);

  const fetchAll = async () => {
    try {
      const [t, o, s] = await Promise.all([
        api.get('/transfers'),
        api.get('/purchase-orders'),
        api.get('/suppliers'),
      ]);
      setTransfers(t.data);
      setOrders(o.data);
      setSuppliers(s.data);
    } catch (err) {
      setError('Failed to load finance data');
    } finally {
      setLoading(false);
    }
  };

  const approvedTransfers = transfers.filter(t =>
    ['APPROVED', 'IN_TRANSIT', 'COMPLETED'].includes(t.status));
  const totalTransferValue = approvedTransfers.reduce((sum, t) => sum + (t.totalValue || 0), 0);
  const totalPOValue = orders.reduce((sum, o) => sum + (o.totalValue || 0), 0);
  const receivedPOs = orders.filter(o => o.status === 'RECEIVED');
  const spendBySupplier = suppliers.map(s => {
    const supplierOrders = orders.filter(o => o.supplier?.id === s.id);
    const total = supplierOrders.reduce((sum, o) => sum + (o.totalValue || 0), 0);
    return { ...s, totalSpend: total, orderCount: supplierOrders.length };
  }).filter(s => s.totalSpend > 0);

  const handleExport = async (url, filename) => {
    try {
      const res = await api.get(url, { responseType: 'blob' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(new Blob([res.data]));
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Export failed');
    }
  };

  const statusStyle = {
    APPROVED:    { bg: '#EAF3DE', color: '#3B6D11' },
    IN_TRANSIT:  { bg: '#EEEDFE', color: '#534AB7' },
    COMPLETED:   { bg: '#f1f5f9', color: '#475569' },
    RECEIVED:    { bg: '#EAF3DE', color: '#3B6D11' },
    ORDERED:     { bg: '#E6F1FB', color: '#185FA5' },
    DRAFT:       { bg: '#f1f5f9', color: '#475569' },
  };

  const thStyle = { textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 500, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' };
  const tdStyle = { padding: '11px 16px', fontSize: 13, color: '#475569', borderBottom: '0.5px solid #f1f5f9' };
  const tdBold = { ...tdStyle, fontWeight: 500, color: '#0f172a' };

  const summaryCards = [
    { label: 'Total transfers',   value: transfers.length,               sub: `${approvedTransfers.length} approved`, bg: '#E6F1FB', ic: '#185FA5', icon: 'ti-arrows-exchange' },
    { label: 'Transfer value',    value: `${totalTransferValue.toLocaleString()} RWF`, sub: 'approved only',  bg: '#EAF3DE', ic: '#3B6D11', icon: 'ti-coin' },
    { label: 'Purchase orders',   value: orders.length,                  sub: `${receivedPOs.length} received`, bg: '#FAEEDA', ic: '#854F0B', icon: 'ti-shopping-cart' },
    { label: 'Total PO spend',    value: `${totalPOValue.toLocaleString()} RWF`, sub: 'all orders',     bg: '#EEEDFE', ic: '#534AB7', icon: 'ti-chart-bar' },
  ];

  const tabs = [
    { key: 'transfers', label: 'Transfer costs' },
    { key: 'orders',    label: 'Purchase orders' },
    { key: 'suppliers', label: 'Supplier spend' },
  ];

  return (
    <PageLayout title="Finance Dashboard" subtitle="View transfer costs and procurement spend">

      {error && (
        <div style={{ background: '#FCEBEB', border: '0.5px solid #F7C1C1', color: '#A32D2D', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, color: '#A32D2D' }}>×</button>
        </div>
      )}

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        {summaryCards.map(card => (
          <div key={card.label} style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, background: card.bg, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className={`ti ${card.icon}`} style={{ color: card.ic, fontSize: 16 }} />
              </div>
              <span style={{ fontSize: 12, color: '#64748b' }}>{card.label}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 500, color: '#0f172a', lineHeight: 1, marginBottom: 4 }}>{card.value}</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none',
              background: activeTab === tab.key ? '#185FA5' : '#fff',
              color: activeTab === tab.key ? '#fff' : '#64748b',
              border: activeTab === tab.key ? 'none' : '0.5px solid #e2e8f0',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#185FA5', borderRadius: '50%', margin: '0 auto' }} />
        </div>
      ) : (
        <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>

          {/* Transfer costs tab */}
          {activeTab === 'transfers' && (
            <>
              <div style={{ padding: '14px 16px', borderBottom: '0.5px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>Approved transfer costs</span>
                <button onClick={() => handleExport('/csv/export/transfers', 'transfers.csv')}
                  style={{ background: '#EAF3DE', color: '#3B6D11', border: 'none', padding: '5px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <i className="ti ti-download" style={{ fontSize: 13 }} /> Export CSV
                </button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['#', 'Item', 'From', 'To', 'Qty', 'Value (RWF)', 'Status'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {approvedTransfers.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 13 }}>No approved transfers</td></tr>
                  ) : approvedTransfers.map((t, i) => {
                    const s = statusStyle[t.status] || { bg: '#f1f5f9', color: '#475569' };
                    return (
                      <tr key={t.id} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={tdStyle}>{i + 1}</td>
                        <td style={tdBold}>{t.item?.name}</td>
                        <td style={tdStyle}>{t.fromBranch?.name}</td>
                        <td style={tdStyle}>{t.toBranch?.name}</td>
                        <td style={tdBold}>{t.quantity}</td>
                        <td style={tdBold}>{(t.totalValue || 0).toLocaleString()}</td>
                        <td style={tdStyle}>
                          <span style={{ background: s.bg, color: s.color, fontSize: 11, padding: '3px 10px', borderRadius: 99, fontWeight: 500 }}>{t.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}

          {/* Purchase orders tab */}
          {activeTab === 'orders' && (
            <>
              <div style={{ padding: '14px 16px', borderBottom: '0.5px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>Purchase order costs</span>
                <button onClick={() => handleExport('/csv/export/purchase-orders', 'purchase_orders.csv')}
                  style={{ background: '#EAF3DE', color: '#3B6D11', border: 'none', padding: '5px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <i className="ti ti-download" style={{ fontSize: 13 }} /> Export CSV
                </button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['#', 'Supplier', 'Branch', 'Total value', 'Status', 'Date'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 13 }}>No purchase orders</td></tr>
                  ) : orders.map((o, i) => {
                    const s = statusStyle[o.status] || { bg: '#f1f5f9', color: '#475569' };
                    return (
                      <tr key={o.id} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={tdStyle}>{i + 1}</td>
                        <td style={tdBold}>{o.supplier?.name}</td>
                        <td style={tdStyle}>{o.branch?.name}</td>
                        <td style={tdBold}>{(o.totalValue || 0).toLocaleString()} RWF</td>
                        <td style={tdStyle}>
                          <span style={{ background: s.bg, color: s.color, fontSize: 11, padding: '3px 10px', borderRadius: 99, fontWeight: 500 }}>{o.status}</span>
                        </td>
                        <td style={tdStyle}>{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'N/A'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}

          {/* Supplier spend tab */}
          {activeTab === 'suppliers' && (
            <>
              <div style={{ padding: '14px 16px', borderBottom: '0.5px solid #e2e8f0' }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>Supplier spend summary</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['#', 'Supplier', 'Contact', 'Orders', 'Total spend'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {spendBySupplier.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 13 }}>No supplier spend data yet</td></tr>
                  ) : spendBySupplier.map((s, i) => (
                    <tr key={s.id} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={tdStyle}>{i + 1}</td>
                      <td style={tdBold}>{s.name}</td>
                      <td style={tdStyle}>{s.contact}</td>
                      <td style={tdBold}>{s.orderCount}</td>
                      <td style={{ ...tdBold, color: '#534AB7' }}>{s.totalSpend.toLocaleString()} RWF</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

        </div>
      )}
    </PageLayout>
  );
}