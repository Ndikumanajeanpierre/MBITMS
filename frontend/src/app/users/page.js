'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function UsersPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'BRANCH_STAFF', branchId: ''
  });

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'ADMIN') { router.push('/dashboard'); return; }
    fetchAll();
  }, [user]);

  const fetchAll = async () => {
    try {
      const [u, b] = await Promise.all([
        api.get('/users'),
        api.get('/branches'),
      ]);
      setUsers(u.data);
      setBranches(b.data);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editUser) {
        await api.put(`/users/${editUser.id}`, {
          name: formData.name,
          role: formData.role,
          branch: formData.branchId ? { id: Number(formData.branchId) } : null,
        });
      } else {
        await api.post('/auth/register', {
          ...formData,
          branchId: formData.branchId ? Number(formData.branchId) : null,
        });
      }
      setShowForm(false);
      setEditUser(null);
      setFormData({ name: '', email: '', password: '', role: 'BRANCH_STAFF', branchId: '' });
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save user');
    }
  };

  const handleEdit = (u) => {
    setEditUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      branchId: u.branch?.id || '',
    });
    setShowForm(true);
  };

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchAll();
    } catch (err) {
      setError('Failed to deactivate user');
    }
  };

  const handleReactivate = async (id) => {
    if (!confirm('Reactivate this user?')) return;
    try {
      await api.put(`/users/${id}/reactivate`);
      fetchAll();
    } catch (err) {
      setError('Failed to reactivate user');
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      ADMIN: 'bg-red-100 text-red-700',
      HEAD_OFFICE_ADMIN: 'bg-purple-100 text-purple-700',
      BRANCH_MANAGER: 'bg-blue-100 text-blue-700',
      BRANCH_STAFF: 'bg-green-100 text-green-700',
      ACCOUNTANT: 'bg-yellow-100 text-yellow-700',
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
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
            <span className="font-bold text-gray-800">User Management</span>
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
            <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
            <p className="text-gray-500 text-sm mt-1">Manage system users and roles</p>
          </div>
          <button
            onClick={() => { setEditUser(null); setFormData({ name: '', email: '', password: '', role: 'BRANCH_STAFF', branchId: '' }); setShowForm(true); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
            + Add User
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
            <button onClick={() => setError('')} className="ml-2 font-bold">×</button>
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                {editUser ? 'Edit User' : 'Add New User'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input required value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input required type="email" value={formData.email}
                    disabled={!!editUser}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                    placeholder="e.g. john@example.com" />
                </div>
                {!editUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input required type="password" value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="••••••••" />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="BRANCH_STAFF">Branch Staff</option>
                    <option value="BRANCH_MANAGER">Branch Manager</option>
                    <option value="HEAD_OFFICE_ADMIN">Head Office Admin</option>
                    <option value="ACCOUNTANT">Accountant</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                  <select value={formData.branchId}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Select branch...</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium">
                    {editUser ? 'Update User' : 'Create User'}
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setEditUser(null); }}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition font-medium">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
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
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Branch</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">No users found</td>
                  </tr>
                ) : (
                  users.map((u, index) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                      <td className="px-6 py-4 font-medium text-gray-800">{u.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(u.role)}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{u.branch?.name || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {u.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(u)}
                            className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-100 transition">
                            Edit
                          </button>
                          {u.active && u.id !== user?.id && (
                            <button onClick={() => handleDeactivate(u.id)}
                              className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-lg hover:bg-red-100 transition">
                              Deactivate
                            </button>
                          )}
                          {!u.active && (
                            <button onClick={() => handleReactivate(u.id)}
                              className="text-xs bg-green-50 text-green-600 px-3 py-1 rounded-lg hover:bg-green-100 transition">
                              Reactivate
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