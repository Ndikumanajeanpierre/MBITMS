'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function TransfersPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [transfers, setTransfers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [formData, setFormData] = useState({
    itemId: '', fromBranchId: '', toBranchId: '', quantity: '', reason: ''
  });
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
      const level = user?.role === 'HEAD_OFFICE_ADMIN' ? 'l2' : '';
      const url = level === 'l2'
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
    try {
      await api.post(`/transfers/${id}/transit`);
      fetchAll();
    } catch (err) {
      setError('Failed to mark as in transit');
    }
  };

  const handleReceive = async (id) => {
    try {
      await api.post(`/transfers/${id}/receive`);
      fetchAll();
    } catch (err) {
      setError('Failed to mark as received');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      L1_APPROVED: 'bg-blue-100 text-blue-700',
      APPROVED: 'bg-green-100 text-green-700',
      IN_TRANSIT: 'bg-purple-100 text-purple-700',
      COMPLETED: 'bg-gray-100 text-gray-700',
      REJECTED: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const filtered = statusFilter
    ? transfers.filter(t => t.status === statusFilter)
    : transfers;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm">
              ← Dashboard
            </button>
            <span className="text-gray-300">|</span>
            <span className="font-bold text-gray-800">Transfers</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name} — <span className="text-blue-600 font-medium">{user?.role}</span></span>
            <button onClick={logout} className="text-sm bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition">Logout</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Stock Transfers</h1>
            <p className="text-gray-500 text-sm mt-1">Manage inter-branch stock transfers</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            + New Transfer
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {['', 'PENDING', 'L1_APPROVED', 'APPROVED', 'IN_TRANSIT', 'COMPLETED', 'REJECTED'].map(s => (
            <button key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
            <button onClick={() => setError('')} className="ml-2 font-bold">×</button>
          </div>
        )}

        {/* New Transfer Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-lg font-bold text-gray-800 mb-4">New Transfer Request</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
                  <select required value={formData.itemId}
                    onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Select item...</option>
                    {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.code})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Branch</label>
                  <select required value={formData.fromBranchId}
                    onChange={(e) => setFormData({ ...formData, fromBranchId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Select source branch...</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Branch</label>
                  <select required value={formData.toBranchId}
                    onChange={(e) => setFormData({ ...formData, toBranchId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Select destination branch...</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input required type="number" min="1" value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Enter quantity" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <textarea value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    rows={2} placeholder="Reason for transfer..." />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium">
                    Submit Request
                  </button>
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition font-medium">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Approval Modal */}
        {showApprovalForm && selectedTransfer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-lg font-bold text-gray-800 mb-1">Review Transfer</h2>
              <p className="text-sm text-gray-500 mb-4">
                {selectedTransfer.item?.name} — {selectedTransfer.quantity} units
              </p>
              <form onSubmit={handleApprove} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Decision</label>
                  <select value={approvalData.decision}
                    onChange={(e) => setApprovalData({ ...approvalData, decision: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="APPROVED">Approve</option>
                    <option value="REJECTED">Reject</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                  <textarea value={approvalData.comment}
                    onChange={(e) => setApprovalData({ ...approvalData, comment: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    rows={2} placeholder="Optional comment..." />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium">
                    Submit
                  </button>
                  <button type="button"
                    onClick={() => { setShowApprovalForm(false); setSelectedTransfer(null); }}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition font-medium">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Transfers Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">From</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">To</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">No transfers found</td>
                  </tr>
                ) : (
                  filtered.map((t, index) => (
                    <tr key={t.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-4 text-sm text-gray-500">{index + 1}</td>
                      <td className="px-4 py-4 font-medium text-gray-800 text-sm">{t.item?.name}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{t.fromBranch?.name}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{t.toBranch?.name}</td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-800">{t.quantity}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(t.status)}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-1 flex-wrap">
                          {t.status === 'PENDING' && (user?.role === 'BRANCH_MANAGER' || user?.role === 'ADMIN') && (
                            <button onClick={() => { setSelectedTransfer(t); setShowApprovalForm(true); }}
                              className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-lg hover:bg-green-100 transition">
                              Review
                            </button>
                          )}
                          {t.status === 'L1_APPROVED' && (user?.role === 'HEAD_OFFICE_ADMIN' || user?.role === 'ADMIN') && (
                            <button onClick={() => { setSelectedTransfer(t); setShowApprovalForm(true); }}
                              className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg hover:bg-blue-100 transition">
                              L2 Review
                            </button>
                          )}
                          {t.status === 'APPROVED' && (
                            <button onClick={() => handleTransit(t.id)}
                              className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded-lg hover:bg-purple-100 transition">
                              Mark Transit
                            </button>
                          )}
                          {t.status === 'IN_TRANSIT' && (
                            <button onClick={() => handleReceive(t.id)}
                              className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100 transition">
                              Mark Received
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}