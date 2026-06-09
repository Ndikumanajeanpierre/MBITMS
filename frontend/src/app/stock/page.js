'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

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
    if (qty === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700' };
    if (qty <= reorder) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-700' };
    return { label: 'In Stock', color: 'bg-green-100 text-green-700' };
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
            <span className="font-bold text-gray-800">Stock Levels</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name} — <span className="text-blue-600 font-medium">{user?.role}</span></span>
            <button onClick={logout} className="text-sm bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition">Logout</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Stock Levels</h1>
          <p className="text-gray-500 text-sm mt-1">View stock levels per branch</p>
        </div>

        {/* Branch Selector */}
        <div className="bg-white rounded-xl border p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Branch</label>
          <select value={selectedBranch} onChange={handleBranchChange}
            className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">Select a branch...</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Stock Summary Cards */}
        {stockLevels.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm text-gray-500">In Stock</p>
              <p className="text-2xl font-bold text-green-700">
                {stockLevels.filter(s => s.quantity > s.reorderLevel).length}
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-sm text-gray-500">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-700">
                {stockLevels.filter(s => s.quantity > 0 && s.quantity <= s.reorderLevel).length}
              </p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-gray-500">Out of Stock</p>
              <p className="text-2xl font-bold text-red-700">
                {stockLevels.filter(s => s.quantity === 0).length}
              </p>
            </div>
          </div>
        )}

        {/* Stock Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : selectedBranch ? (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Reorder Level</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stockLevels.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">
                      No stock records found for this branch
                    </td>
                  </tr>
                ) : (
                  stockLevels.map((stock, index) => {
                    const status = getStockStatus(stock.quantity, stock.reorderLevel);
                    return (
                      <tr key={stock.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                        <td className="px-6 py-4 font-medium text-gray-800">{stock.item?.name}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">{stock.item?.code}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{stock.item?.category}</td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-800">{stock.quantity}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{stock.reorderLevel}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">📦</div>
            <p>Select a branch to view stock levels</p>
          </div>
        )}
      </div>
    </div>
  );
}