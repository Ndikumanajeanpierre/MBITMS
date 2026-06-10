'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const BACKEND_URL = 'http://localhost:8080';
const CAN_MANAGE = ['ADMIN', 'HEAD_OFFICE_ADMIN', 'BRANCH_MANAGER'];
const CAN_DELETE  = ['ADMIN', 'HEAD_OFFICE_ADMIN'];

export default function InventoryPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', category: '', unit: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');

  const canManage = user?.role && CAN_MANAGE.includes(user.role);
  const canDelete  = user?.role && CAN_DELETE.includes(user.role);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchItems();
  }, [user]);

  const fetchItems = async () => {
    try {
      const res = await api.get('/items');
      setItems(res.data);
    } catch (err) {
      setError('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await api.put(`/items/${editItem.id}`, formData);
      } else {
        await api.post('/items', formData);
      }
      setShowForm(false);
      setEditItem(null);
      setFormData({ name: '', code: '', category: '', unit: '' });
      fetchItems();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save item');
    }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setFormData({ name: item.name, code: item.code, category: item.category, unit: item.unit });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this item?')) return;
    try {
      await api.delete(`/items/${id}`);
      fetchItems();
    } catch (err) {
      setError('Failed to deactivate item');
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await api.get('/csv/export/items', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'items.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSuccess('Items exported successfully!');
    } catch (err) {
      setError('Export failed');
    }
  };

  const handleImportCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const data = new FormData();
    data.append('file', file);
    try {
      const res = await api.post('/csv/import/items', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(res.data);
      fetchItems();
    } catch (err) {
      setError('Import failed');
    }
  };

  const handleImageUpload = async (itemId, file) => {
    if (!file) return;
    const data = new FormData();
    data.append('file', file);
    try {
      await api.post(`/items/${itemId}/image`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess('Image uploaded successfully!');
      fetchItems();
    } catch (err) {
      setError('Image upload failed');
    }
  };

  const downloadTemplate = () => {
    const csv = 'code,name,category,unit\nMED-001,Paracetamol 500mg,Medicine,Box\nMED-002,Surgical Gloves,Medical Supplies,Pack';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'items_template.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.code.toLowerCase().includes(search.toLowerCase()) ||
    i.category?.toLowerCase().includes(search.toLowerCase())
  );

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
            <span className="font-bold text-gray-800">Inventory</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user?.name} — <span className="text-blue-600 font-medium">{user?.role}</span>
            </span>
            <button onClick={logout}
              className="text-sm bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
            <p className="text-gray-500 text-sm mt-1">Manage all inventory items</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            {/* Export/Import visible to all */}
            <button onClick={handleExportCSV}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium">
              Export CSV
            </button>

            {/* Import and template only for managers+ */}
            {canManage && (
              <>
                <label className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition text-sm font-medium cursor-pointer">
                  Import CSV
                  <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
                </label>
                <button onClick={downloadTemplate}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition text-sm font-medium">
                  CSV Template
                </button>
                <button
                  onClick={() => { setShowForm(true); setEditItem(null); setFormData({ name: '', code: '', category: '', unit: '' }); }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
                  + Add Item
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by name, code or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm flex justify-between">
            {error}
            <button onClick={() => setError('')} className="font-bold">x</button>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm flex justify-between">
            {success}
            <button onClick={() => setSuccess('')} className="font-bold">x</button>
          </div>
        )}

        {/* Form Modal */}
        {showForm && canManage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                {editItem ? 'Edit Item' : 'Add New Item'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                  <input required value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. Paracetamol 500mg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Code</label>
                  <input required value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    disabled={!!editItem}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                    placeholder="e.g. MED-001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. Medicine" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <input value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. Box, Pack, Piece" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium">
                    {editItem ? 'Update' : 'Create'}
                  </button>
                  <button type="button"
                    onClick={() => { setShowForm(false); setEditItem(null); }}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition font-medium">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Table */}
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
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Image</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Unit</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  {canManage && (
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={canManage ? 8 : 7} className="text-center py-8 text-gray-400">
                      No items found
                    </td>
                  </tr>
                ) : (
                  filtered.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>

                      {/* ✅ Fixed image cell — larger, proper fit, full URL */}
                      <td className="px-4 py-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                          {item.imageUrl ? (
                            <img
                              src={BACKEND_URL + item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : canManage ? (
                            <label className="cursor-pointer w-full h-full flex items-center justify-center">
                              <div className="flex flex-col items-center text-gray-400 hover:text-blue-500 transition">
                                <span className="text-xl">+</span>
                                <span className="text-xs">Photo</span>
                              </div>
                              <input type="file" accept="image/*" className="hidden"
                                onChange={(e) => handleImageUpload(item.id, e.target.files[0])} />
                            </label>
                          ) : (
                            <span className="text-gray-300 text-2xl">📦</span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <span className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">{item.code}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.category}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.unit}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {item.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions — only for managers+ */}
                      {canManage && (
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => handleEdit(item)}
                              className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-100 transition">
                              Edit
                            </button>
                            <label className="text-xs bg-purple-50 text-purple-600 px-3 py-1 rounded-lg hover:bg-purple-100 transition cursor-pointer">
                              Photo
                              <input type="file" accept="image/*" className="hidden"
                                onChange={(e) => handleImageUpload(item.id, e.target.files[0])} />
                            </label>
                            {canDelete && (
                              <button onClick={() => handleDelete(item.id)}
                                className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-lg hover:bg-red-100 transition">
                                Deactivate
                              </button>
                            )}
                          </div>
                        </td>
                      )}
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