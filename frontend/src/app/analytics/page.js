'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie,
  Cell, LineChart, Line, Legend
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function AnalyticsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    branches: [],
    items: [],
    transfers: [],
    suppliers: [],
    stockLevels: [],
  });

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
      setStats({
        branches: branches.data,
        items: items.data,
        transfers: transfers.data,
        suppliers: suppliers.data,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Transfer status distribution
  const transferStatusData = () => {
    const statusCount = {};
    stats.transfers.forEach(t => {
      statusCount[t.status] = (statusCount[t.status] || 0) + 1;
    });
    return Object.entries(statusCount).map(([name, value]) => ({ name, value }));
  };

  // Items by category
  const itemsByCategoryData = () => {
    const catCount = {};
    stats.items.forEach(i => {
      const cat = i.category || 'Uncategorized';
      catCount[cat] = (catCount[cat] || 0) + 1;
    });
    return Object.entries(catCount).map(([name, value]) => ({ name, value }));
  };

  // Transfers by branch
  const transfersByBranchData = () => {
    const branchCount = {};
    stats.transfers.forEach(t => {
      const branch = t.fromBranch?.name || 'Unknown';
      branchCount[branch] = (branchCount[branch] || 0) + 1;
    });
    return Object.entries(branchCount).map(([name, transfers]) => ({ name, transfers }));
  };

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
            <span className="font-bold text-gray-800">Analytics</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name} — <span className="text-blue-600 font-medium">{user?.role}</span></span>
            <button onClick={logout} className="text-sm bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition">Logout</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">System overview and insights</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <SummaryCard title="Total Branches" value={stats.branches.length} icon="🏢" color="blue" />
              <SummaryCard title="Inventory Items" value={stats.items.length} icon="📦" color="green" />
              <SummaryCard title="Total Transfers" value={stats.transfers.length} icon="🔄" color="orange" />
              <SummaryCard title="Suppliers" value={stats.suppliers.length} icon="🏭" color="purple" />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Transfer Status Pie Chart */}
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Transfer Status Distribution</h2>
                {transferStatusData().length === 0 ? (
                  <div className="text-center py-8 text-gray-400">No transfer data</div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={transferStatusData()}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {transferStatusData().map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Items by Category */}
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Items by Category</h2>
                {itemsByCategoryData().length === 0 ? (
                  <div className="text-center py-8 text-gray-400">No items data</div>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Transfers by Branch */}
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Transfers by Branch</h2>
                {transfersByBranchData().length === 0 ? (
                  <div className="text-center py-8 text-gray-400">No transfer data</div>
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

              {/* System Summary */}
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">System Summary</h2>
                <div className="space-y-4">
                  <SummaryRow label="Active Branches" value={stats.branches.filter(b => b.active).length} total={stats.branches.length} color="blue" />
                  <SummaryRow label="Active Items" value={stats.items.filter(i => i.active).length} total={stats.items.length} color="green" />
                  <SummaryRow label="Pending Transfers" value={stats.transfers.filter(t => t.status === 'PENDING').length} total={stats.transfers.length} color="yellow" />
                  <SummaryRow label="Completed Transfers" value={stats.transfers.filter(t => t.status === 'COMPLETED').length} total={stats.transfers.length} color="purple" />
                  <SummaryRow label="Active Suppliers" value={stats.suppliers.filter(s => s.active).length} total={stats.suppliers.length} color="orange" />
                </div>
              </div>
            </div>

            {/* Recent Transfers Table */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Transfers</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">From</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">To</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stats.transfers.slice(0, 5).map(t => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{t.item?.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{t.fromBranch?.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{t.toBranch?.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-800">{t.quantity}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon, color }) {
  const colors = {
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
    orange: 'border-orange-200 bg-orange-50',
    purple: 'border-purple-200 bg-purple-50',
  };
  return (
    <div className={`border rounded-xl p-4 ${colors[color]}`}>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, total, color }) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
  };
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-800">{value} / {total}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${colors[color]}`} style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  );
}