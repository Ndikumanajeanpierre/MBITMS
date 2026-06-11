'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

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
    const diff = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getExpiryColor = (days) => {
    if (days === null) return 'text-gray-500';
    if (days < 0) return 'text-red-600 font-bold';
    if (days <= 7) return 'text-red-500 font-bold';
    if (days <= 30) return 'text-yellow-600 font-semibold';
    return 'text-green-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm">
              ← Dashboard
            </button>
            <span className="text-gray-300">|</span>
            <span className="font-bold text-gray-800">Batch Tracking</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name} — <span className="text-blue-600 font-medium">{user?.role}</span></span>
            <button onClick={logout} className="text-sm bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition">Logout</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Batch & Expiry Tracking</h1>
          <p className="text-gray-500 text-sm mt-1">Monitor stock batches and expiry dates</p>
        </div>

        {/* Alert Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Expired Batches</p>
                <p className="text-2xl font-bold text-red-600">{expired.length}</p>
              </div>
              <span className="text-3xl">🚫</span>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Expiring Soon (30 days)</p>
                <p className="text-2xl font-bold text-yellow-600">{expiring.length}</p>
              </div>
              <span className="text-3xl">⚠️</span>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Total Batches</p>
                <p className="text-2xl font-bold text-green-600">{batches.length}</p>
              </div>
              <span className="text-3xl">📦</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { key: 'all', label: 'All Batches', count: batches.length },
            { key: 'expiring', label: 'Expiring Soon', count: expiring.length },
            { key: 'expired', label: 'Expired', count: expired.length },
          ].map(tab => (
            <button key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border text-gray-600 hover:bg-gray-50'
              }`}>
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Branch</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Batch No.</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Days Left</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {getDisplayData().length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">
                      No batches found
                    </td>
                  </tr>
                ) : (
                  getDisplayData().map((batch, index) => {
                    const days = getDaysUntilExpiry(batch.expiryDate);
                    return (
                      <tr key={batch.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                        <td className="px-6 py-4 font-medium text-gray-800">{batch.item?.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{batch.branch?.name}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">
                            {batch.batchNumber || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-800">{batch.quantity}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {batch.expiryDate || 'No expiry'}
                        </td>
                        <td className="px-6 py-4">
                          {days !== null ? (
                            <span className={`text-sm ${getExpiryColor(days)}`}>
                              {days < 0 ? `Expired ${Math.abs(days)} days ago` :
                               days === 0 ? 'Expires today!' :
                               `${days} days`}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">No expiry</span>
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
      </div>
    </div>
  );
}