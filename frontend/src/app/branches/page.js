'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function BranchesPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editBranch, setEditBranch] = useState(null);
  const [formData, setFormData] = useState({ name: '', location: '', contact: '' });
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
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editBranch) {
        await api.put(`/branches/${editBranch.id}`, formData);
      } else {
        await api.post('/branches', formData);
      }
      setShowForm(false);
      setEditBranch(null);
      setFormData({ name: '', location: '', contact: '' });
      fetchBranches();
    } catch (err) {
      setError('Failed to save branch');
    }
  };

  const handleEdit = (branch) => {
    setEditBranch(branch);
    setFormData({ name: branch.name, location: branch.location, contact: branch.contact });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this branch?')) return;
    try {
      await api.delete(`/branches/${id}`);
      fetchBranches();
    } catch (err) {
      setError('Failed to deactivate branch');
    }
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
            <span className="font-bold text-gray-800">Branches</span>
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
            <h1 className="text-2xl font-bold text-gray-800">Branch Management</h1>
            <p className="text-gray-500 text-sm mt-1">Manage all company branches</p>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditBranch(null); setFormData({ name: '', location: '', contact: '' }); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            + Add Branch
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                {editBranch ? 'Edit Branch' : 'Add New Branch'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                  <input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. Kigali North Branch"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. Kigali, Rwanda"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                  <input
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. 0788000000"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium">
                    {editBranch ? 'Update' : 'Create'}
                  </button>
                  <button type="button"
                    onClick={() => { setShowForm(false); setEditBranch(null); }}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition font-medium">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Branches Table */}
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
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {branches.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">No branches found</td>
                  </tr>
                ) : (
                  branches.map((branch, index) => (
                    <tr key={branch.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                      <td className="px-6 py-4 font-medium text-gray-800">{branch.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{branch.location}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{branch.contact}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${branch.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {branch.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(branch)}
                            className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-100 transition">
                            Edit
                          </button>
                          <button onClick={() => handleDelete(branch.id)}
                            className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-lg hover:bg-red-100 transition">
                            Deactivate
                          </button>
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