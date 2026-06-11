'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import PageLayout from '@/components/layout/PageLayout';

export default function PurchaseOrdersPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showReceiveForm, setShowReceiveForm] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    supplierId: '', branchId: '',
    items: [{ itemId: '', quantity: '', unitCost: '' }]
  });
  const [receiveData, setReceiveData] = useState({ items: [] });

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchAll();
  }, [user]);

  const fetchAll = async () => {
    try {
      const [o, s, b, i] = await Promise.all([
        api.get('/purchase-orders'),
        api.get('/suppliers'),
        api.get('/branches'),
        api.get('/items'),
      ]);
      setOrders(o.data);
      setSuppliers(s.data);
      setBranches(b.data);
      setItems(i.data);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const addItemRow = () => {
    setFormData({ ...formData, items: [...formData.items, { itemId: '', quantity: '', unitCost: '' }] });
  };

  const removeItemRow = (index) => {
    setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
  };

  const updateItemRow = (index, field, value) => {
    const updated = [...formData.items];
    updated[index][field] = value;
    setFormData({ ...formData, items: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/purchase-orders', {
        supplierId: Number(formData.supplierId),
        branchId: Number(formData.branchId),
        items: formData.items.map(i => ({
          itemId: Number(i.itemId),
          quantity: Number(i.quantity),
          unitCost: Number(i.unitCost),
        }))
      });
      setShowForm(false);
      setFormData({ supplierId: '', branchId: '', items: [{ itemId: '', quantity: '', unitCost: '' }] });
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create purchase order');
    }
  };

  const openReceiveForm = (po) => {
    setSelectedPO(po);
    setReceiveData({
      items: po.items?.map(item => ({
        poItemId: item.id,
        receivedQuantity: item.quantity,
        batchNumber: '',
        expiryDate: '',
        itemName: item.item?.name,
      })) || []
    });
    setShowReceiveForm(true);
  };

  const handleReceive = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/purchase-orders/${selectedPO.id}/receive`, {
        items: receiveData.items.map(i => ({
          poItemId: i.poItemId,
          receivedQuantity: Number(i.receivedQuantity),
          batchNumber: i.batchNumber,
          expiryDate: i.expiryDate || null,
        }))
      });
      setShowReceiveForm(false);
      setSelectedPO(null);
      fetchAll();
    } catch (err) {
      setError('Failed to receive purchase order');
    }
  };

  const statusStyle = (status) => {
    const map = {
      DRAFT:              { background: '#f1f5f9', color: '#475569' },
      ORDERED:            { background: '#dbeafe', color: '#1d4ed8' },
      PARTIALLY_RECEIVED: { background: '#fef9c3', color: '#a16207' },
      RECEIVED:           { background: '#dcfce7', color: '#15803d' },
    };
    return map[status] || { background: '#f1f5f9', color: '#475569' };
  };

  const inputStyle = {
    width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0',
    borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box',
    background: '#fff', color: '#0f172a',
  };
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 500, color: '#64748b', marginBottom: 4 };

  const actions = (
    <button
      onClick={() => setShowForm(true)}
      style={{
        background: '#378ADD', color: '#fff', border: 'none', borderRadius: 8,
        padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 6,
      }}
    >
      + New Purchase Order
    </button>
  );

  return (
    <PageLayout title="Purchase Orders" subtitle="Manage procurement and stock receiving" actions={actions}>

      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
          padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          {error}
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontWeight: 700, fontSize: 16 }}>×</button>
        </div>
      )}

      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16,
        }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>New Purchase Order</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Supplier</label>
                  <select required value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    style={inputStyle}>
                    <option value="">Select supplier…</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Receiving Branch</label>
                  <select required value={formData.branchId}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                    style={inputStyle}>
                    <option value="">Select branch…</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Items</label>
                  <button type="button" onClick={addItemRow} style={{
                    background: '#eff6ff', color: '#378ADD', border: 'none', borderRadius: 6,
                    padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 500,
                  }}>+ Add Item</button>
                </div>
                {formData.items.map((item, index) => (
                  <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px 32px', gap: 8, marginBottom: 8 }}>
                    <select required value={item.itemId}
                      onChange={(e) => updateItemRow(index, 'itemId', e.target.value)}
                      style={inputStyle}>
                      <option value="">Select item…</option>
                      {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                    <input required type="number" min="1" placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItemRow(index, 'quantity', e.target.value)}
                      style={inputStyle} />
                    <input required type="number" min="0" placeholder="Unit Cost"
                      value={item.unitCost}
                      onChange={(e) => updateItemRow(index, 'unitCost', e.target.value)}
                      style={inputStyle} />
                    {index > 0 ? (
                      <button type="button" onClick={() => removeItemRow(index)} style={{
                        background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 18, padding: 0,
                      }}>×</button>
                    ) : <div />}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" style={{
                  flex: 1, background: '#378ADD', color: '#fff', border: 'none',
                  borderRadius: 8, padding: '10px 0', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                }}>Create PO</button>
                <button type="button" onClick={() => setShowForm(false)} style={{
                  flex: 1, background: '#f1f5f9', color: '#475569', border: 'none',
                  borderRadius: 8, padding: '10px 0', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReceiveForm && selectedPO && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16,
        }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>Receive Purchase Order</h2>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>PO #{selectedPO.id} — {selectedPO.supplier?.name}</p>
            <form onSubmit={handleReceive}>
              {receiveData.items.map((item, index) => (
                <div key={index} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, marginBottom: 10 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', marginBottom: 8 }}>{item.itemName}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <label style={labelStyle}>Received Qty</label>
                      <input type="number" value={item.receivedQuantity}
                        onChange={(e) => { const u = [...receiveData.items]; u[index].receivedQuantity = e.target.value; setReceiveData({ items: u }); }}
                        style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Batch Number</label>
                      <input type="text" value={item.batchNumber} placeholder="e.g. BATCH-001"
                        onChange={(e) => { const u = [...receiveData.items]; u[index].batchNumber = e.target.value; setReceiveData({ items: u }); }}
                        style={inputStyle} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={labelStyle}>Expiry Date</label>
                      <input type="date" value={item.expiryDate}
                        onChange={(e) => { const u = [...receiveData.items]; u[index].expiryDate = e.target.value; setReceiveData({ items: u }); }}
                        style={inputStyle} />
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="submit" style={{
                  flex: 1, background: '#16a34a', color: '#fff', border: 'none',
                  borderRadius: 8, padding: '10px 0', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                }}>Confirm Receipt</button>
                <button type="button" onClick={() => { setShowReceiveForm(false); setSelectedPO(null); }} style={{
                  flex: 1, background: '#f1f5f9', color: '#475569', border: 'none',
                  borderRadius: 8, padding: '10px 0', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
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
                {['#', 'Supplier', 'Branch', 'Total Value', 'Status', 'Date', 'Actions'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '10px 20px',
                    fontSize: 11, fontWeight: 600, color: '#94a3b8',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8', fontSize: 13 }}>
                    No purchase orders found
                  </td>
                </tr>
              ) : (
                orders.map((order, index) => (
                  <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#94a3b8' }}>{index + 1}</td>
                    <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{order.supplier?.name}</td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#475569' }}>{order.branch?.name}</td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#475569' }}>{order.totalValue?.toLocaleString()} RWF</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        ...statusStyle(order.status),
                        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      }}>{order.status}</span>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#475569' }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {order.status !== 'RECEIVED' && (
                        <button onClick={() => openReceiveForm(order)} style={{
                          background: '#f0fdf4', color: '#16a34a', border: 'none',
                          borderRadius: 6, padding: '4px 12px', fontSize: 12,
                          fontWeight: 500, cursor: 'pointer',
                        }}>Receive</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </PageLayout>
  );
}