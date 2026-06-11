'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import PageLayout from '@/components/layout/PageLayout';

export default function TransfersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [transfers, setTransfers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [formData, setFormData] = useState({ itemId: '', fromBranchId: '', toBranchId: '', quantity: '', reason: '' });
  const [approvalData, setApprovalData] = useState({ decision: 'APPROVED', comment: '' });
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchAll();
  }, [user]);

  const fetchAll = async () => {
    try {
      const [t, b, i] = await Promise.all([
        api.get('/transfers'),
        api.get('/branches'),
        api.get('/items'),
      ]);
      setTransfers(t.data);
      setBranches(b.data);
      setItems(i.data);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/transfers', {
        ...formData,
        itemId: Number(formData.itemId),
        fromBranchId: Number(formData.fromBranchId),
        toBranchId: Number(formData.toBranchId),
        quantity: Number(formData.quantity),
      });
      setShowForm(false);
      setFormData({ itemId: '', fromBranchId: '', toBranchId: '', quantity: '', reason: '' });
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create transfer');
    }
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    try {
      const url = user?.role === 'HEAD_OFFICE_ADMIN'
        ? `/transfers/${selectedTransfer.id}/approve/l2`
        : `/transfers/${selectedTransfer.id}/approve`;
      await api.post(url, approvalData);
      setShowApprovalForm(false);
      setSelectedTransfer(null);
      fetchAll();
    } catch (err) {
      setError('Failed to process approval');
    }
  };

  const handleTransit = async (id) => {
    try { await api.post(`/transfers/${id}/transit`); fetchAll(); }
    catch (err) { setError('Failed to mark as in transit'); }
  };

  const handleReceive = async (id) => {
    try { await api.post(`/transfers/${id}/receive`); fetchAll(); }
    catch (err) { setError('Failed to mark as received'); }
  };

  const statusStyle = {
    PENDING:     { bg: '#FAEEDA', color: '#854F0B', label: 'Pending' },
    L1_APPROVED: { bg: '#E6F1FB', color: '#185FA5', label: 'L1 Approved' },
    APPROVED:    { bg: '#EAF3DE', color: '#3B6D11', label: 'Approved' },
    IN_TRANSIT:  { bg: '#EEEDFE', color: '#534AB7', label: 'In Transit' },
    COMPLETED:   { bg: '#f1f5f9', color: '#475569', label: 'Completed' },
    REJECTED:    { bg: '#FCEBEB', color: '#A32D2D', label: 'Rejected' },
  };

  const filtered = statusFilter ? transfers.filter(t => t.status === statusFilter) : transfers;

  const filterButtons = ['', 'PENDING', 'L1_APPROVED', 'APPROVED', 'IN_TRANSIT', 'COMPLETED', 'REJECTED'];

  const inputStyle = { width: '100%', padding: '8px 12px', border: '0.5px solid #cbd5e1', borderRadius: 8, fontSize: 13, color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#fff' };
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 500, color: '#334155', marginBottom: 6 };

  const actions = (
    <button onClick={() => setShowForm(true)}
      style={{ background: '#185FA5', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
      <i className="ti ti-plus" style={{ fontSize: 14 }} /> New Transfer
    </button>
  );

  return (
    <PageLayout title="Stock Transfers" subtitle="Manage inter-branch stock transfers" actions={actions}>

      {error && (
        <div style={{ background: '#FCEBEB', border: '0.5px solid #F7C1C1', color: '#A32D2D', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, color: '#A32D2D' }}>×</button>
        </div>
      )}

      {/* Status filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {filterButtons.map(s => {
          const active = statusFilter === s;
          const st = statusStyle[s];
          return (
            <button key={s} onClick={() => setStatusFilter(s)}
              style={{
                padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none',
                background: active ? (st?.bg || '#185FA5') : '#fff',
                color: active ? (st?.color || '#fff') : '#64748b',
                border: active ? 'none' : '0.5px solid #e2e8f0',
              }}>
              {s || 'All'}
            </button>
          );
        })}
      </div>

      {/* New Transfer Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: '100%', maxWidth: 440 }}>
            <h2 style={{ fontSize: 16, fontWeight: 500, color: '#0f172a', marginBottom: 20 }}>New Transfer Request</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Item</label>
                <select required value={formData.itemId} onChange={e => setFormData({ ...formData, itemId: e.target.value })} style={inputStyle}>
                  <option value="">Select item...</option>
                  {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.code})</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>From Branch</label>
                <select required value={formData.fromBranchId} onChange={e => setFormData({ ...formData, fromBranchId: e.target.value })} style={inputStyle}>
                  <option value="">Select source branch...</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>To Branch</label>
                <select required value={formData.toBranchId} onChange={e => setFormData({ ...formData, toBranchId: e.target.value })} style={inputStyle}>
                  <option value="">Select destination branch...</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Quantity</label>
                <input required type="number" min="1" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} style={inputStyle} placeholder="Enter quantity" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Reason</label>
                <textarea value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} style={{ ...inputStyle, height: 72, resize: 'vertical' }} placeholder="Reason for transfer..." />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="submit" style={{ flex: 1, background: '#185FA5', color: '#fff', border: 'none', padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Submit Request</button>
                <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, background: '#f1f5f9', color: '#334155', border: '0.5px solid #e2e8f0', padding: '9px 0', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalForm && selectedTransfer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: '100%', maxWidth: 440 }}>
            <h2 style={{ fontSize: 16, fontWeight: 500, color: '#0f172a', marginBottom: 4 }}>Review Transfer</h2>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
              {selectedTransfer.item?.name} — {selectedTransfer.quantity} units
              <span style={{ marginLeft: 8, background: '#E6F1FB', color: '#185FA5', fontSize: 11, padding: '2px 8px', borderRadius: 99 }}>
                {selectedTransfer.fromBranch?.name} → {selectedTransfer.toBranch?.name}
              </span>
            </p>
            <form onSubmit={handleApprove}>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Decision</label>
                <select value={approvalData.decision} onChange={e => setApprovalData({ ...approvalData, decision: e.target.value })} style={inputStyle}>
                  <option value="APPROVED">Approve</option>
                  <option value="REJECTED">Reject</option>
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Comment (optional)</label>
                <textarea value={approvalData.comment} onChange={e => setApprovalData({ ...approvalData, comment: e.target.value })} style={{ ...inputStyle, height: 72, resize: 'vertical' }} placeholder="Add a comment..." />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="submit" style={{ flex: 1, background: '#185FA5', color: '#fff', border: 'none', padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Submit</button>
                <button type="button" onClick={() => { setShowApprovalForm(false); setSelectedTransfer(null); }} style={{ flex: 1, background: '#f1f5f9', color: '#334155', border: '0.5px solid #e2e8f0', padding: '9px 0', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#185FA5', borderRadius: '50%', margin: '0 auto' }} />
        </div>
      ) : (
        <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '0.5px solid #e2e8f0' }}>
                {['#', 'Item', 'From', 'To', 'Qty', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 500, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 13 }}>No transfers found</td></tr>
              ) : filtered.map((t, i) => {
                const s = statusStyle[t.status] || { bg: '#f1f5f9', color: '#475569', label: t.status };
                return (
                  <tr key={t.id} style={{ borderBottom: '0.5px solid #f1f5f9' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#94a3b8' }}>{i + 1}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{t.item?.name}</td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: '#475569' }}>{t.fromBranch?.name}</td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: '#475569' }}>{t.toBranch?.name}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{t.quantity}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ background: s.bg, color: s.color, fontSize: 11, padding: '3px 10px', borderRadius: 99, fontWeight: 500 }}>{s.label}</span>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {t.status === 'PENDING' && ['BRANCH_MANAGER', 'ADMIN'].includes(user?.role) && (
                          <button onClick={() => { setSelectedTransfer(t); setShowApprovalForm(true); }}
                            style={{ background: '#EAF3DE', color: '#3B6D11', border: 'none', padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontWeight: 500 }}>
                            Review
                          </button>
                        )}
                        {t.status === 'L1_APPROVED' && ['HEAD_OFFICE_ADMIN', 'ADMIN'].includes(user?.role) && (
                          <button onClick={() => { setSelectedTransfer(t); setShowApprovalForm(true); }}
                            style={{ background: '#E6F1FB', color: '#185FA5', border: 'none', padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontWeight: 500 }}>
                            L2 Review
                          </button>
                        )}
                        {t.status === 'APPROVED' && (
                          <button onClick={() => handleTransit(t.id)}
                            style={{ background: '#EEEDFE', color: '#534AB7', border: 'none', padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontWeight: 500 }}>
                            Mark Transit
                          </button>
                        )}
                        {t.status === 'IN_TRANSIT' && (
                          <button onClick={() => handleReceive(t.id)}
                            style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontWeight: 500 }}>
                            Mark Received
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PageLayout>
  );
}