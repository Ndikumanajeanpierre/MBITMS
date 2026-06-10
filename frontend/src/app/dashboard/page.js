'use client';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    branches: 0,
    items: 0,
    transfers: 0,
    suppliers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      const [branches, items, transfers] = await Promise.all([
        api.get('/branches'),
        api.get('/items'),
        api.get('/transfers'),
      ]);

      let suppliersCount = 0;
      if (['ADMIN', 'HEAD_OFFICE_ADMIN', 'ACCOUNTANT'].includes(user?.role)) {
        const suppliers = await api.get('/suppliers');
        suppliersCount = suppliers.data.length;
      }

      setStats({
        branches: branches.data.length,
        items: items.data.length,
        transfers: transfers.data.length,
        suppliers: suppliersCount,
      });
    } catch (err) {
      console.error(err);
      setError('Failed to load some dashboard stats.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white rounded-lg p-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="font-bold text-gray-800">MBITMS</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user?.name} — <span className="text-blue-600 font-medium">{user?.role}</span>
            </span>
            <button
              onClick={logout}
              className="text-sm bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Dashboard</h1>
        <p className="text-gray-500 mb-8">Welcome back, {user?.name}!</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm flex justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="font-bold ml-4">×</button>
          </div>
        )}

        {/* Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Branches" value={stats.branches} color="blue"
              icon="🏢" onClick={() => router.push('/branches')} />
            <StatCard title="Inventory Items" value={stats.items} color="green"
              icon="📦" onClick={() => router.push('/inventory')} />
            <StatCard title="Transfers" value={stats.transfers} color="orange"
              icon="🔄" onClick={() => router.push('/transfers')} />
            {['ADMIN', 'HEAD_OFFICE_ADMIN', 'ACCOUNTANT'].includes(user?.role) && (
              <StatCard title="Suppliers" value={stats.suppliers} color="purple"
                icon="🏭" onClick={() => router.push('/suppliers')} />
            )}
          </div>
        )}

        {/* Quick Actions */}
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          <QuickAction label="New Transfer" icon="🔄"
            onClick={() => router.push('/transfers')} />

          {['ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER'].includes(user?.role) && (
            <QuickAction label="Add Item" icon="➕"
              onClick={() => router.push('/inventory')} />
          )}

          {['ADMIN', 'HEAD_OFFICE_ADMIN', 'ACCOUNTANT'].includes(user?.role) && (
            <QuickAction label="Purchase Order" icon="🛒"
              onClick={() => router.push('/purchase-orders')} />
          )}

          {['ADMIN', 'HEAD_OFFICE_ADMIN'].includes(user?.role) && (
            <QuickAction label="Audit Logs" icon="📋"
              onClick={() => router.push('/audit-logs')} />
          )}

          {['ADMIN', 'HEAD_OFFICE_ADMIN', 'ACCOUNTANT'].includes(user?.role) && (
            <QuickAction label="Analytics" icon="📊"
              onClick={() => router.push('/analytics')} />
          )}

          {user?.role === 'ADMIN' && (
            <QuickAction label="Manage Users" icon="👥"
              onClick={() => router.push('/users')} />
          )}

          <QuickAction label="Stock" icon="📦"
            onClick={() => router.push('/stock')} />

        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color, icon, onClick }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
  };
  return (
    <div
      onClick={onClick}
      className={`bg-white border rounded-xl p-6 cursor-pointer hover:shadow-md transition`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}

function QuickAction({ label, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white border rounded-xl p-4 hover:shadow-md transition text-center"
    >
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-sm font-medium text-gray-700">{label}</p>
    </button>
  );
}