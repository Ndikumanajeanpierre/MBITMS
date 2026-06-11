'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import PageLayout from '@/components/layout/PageLayout';

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

  const inputStyle = {
    width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0',
    borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box',
    background: '#fff', color: '#0f172a',
  };
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 500, color: '#64748b', marginBottom: 4 };

  const actions = (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
      <button onClick={handleExportCSV} style={{
        background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8,
        padding: '8px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
      }}>Export CSV</button>
      {canManage && (
        <>
          <label style={{
            background: '#ea580c', color: '#fff', border: 'none', borderRadius: 8,
            padding: '8px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}>
            Import CSV
            <input type="file" accept=".csv" onChange={handleImportCSV} style={{ display: 'none' }} />
          </label>
          <button onClick={downloadTemplate} style={{
            background: '#475569', color: '#fff', border: 'none', borderRadius: 8,
            padding: '8px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}>CSV Template</button>
          <button onClick={() => { setShowForm(true); setEditItem(null); setFormData({ name: '', code: '', category: '', unit: '' }); }} style={{
            background: '#378ADD', color: '#fff', border: 'none', borderRadius: 8,
            padding: '8px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}>+ Add Item</button>
        </>
      )}
    </div>
  );

  return (
    <PageLayout title="Inventory Management" subtitle="Manage all inventory items" actions={actions}>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search by name, code or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, maxWidth: 400 }}
        />
      </div>

      {/* Alerts */}
      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
          padding: '10px 14px', borderRadius: 8, marginBottom: 12, fontSize: 13,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          {error}
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontWeight: 700, fontSize: 16 }}>×</button>
        </div>
      )}
      {success && (
        <div style={{
          background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d',
          padding: '10px 14px', borderRadius: 8, marginBottom: 12, fontSize: 13,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          {success}
          <button onClick={() => setSuccess('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#15803d', fontWeight: 700, fontSize: 16 }}>×</button>
        </div>
      )}

      {/* Form Modal */}
      {showForm && canManage && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16,
        }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: '100%', maxWidth: 460 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>
              {editItem ? 'Edit Item' : 'Add New Item'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Item Name</label>
                <input required value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Paracetamol 500mg" style={inputStyle} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Item Code</label>
                <input required value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  disabled={!!editItem}
                  placeholder="e.g. MED-001"
                  style={{ ...inputStyle, background: editItem ? '#f8fafc' : '#fff', color: editItem ? '#94a3b8' : '#0f172a' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Category</label>
                <input value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Medicine" style={inputStyle} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Unit</label>
                <input value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="e.g. Box, Pack, Piece" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" style={{
                  flex: 1, background: '#378ADD', color: '#fff', border: 'none',
                  borderRadius: 8, padding: '10px 0', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                }}>{editItem ? 'Update' : 'Create'}</button>
                <button type="button" onClick={() => { setShowForm(false); setEditItem(null); }} style={{
                  flex: 1, background: '#f1f5f9', color: '#475569', border: 'none',
                  borderRadius: 8, padding: '10px 0', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
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
                {['#', 'Image', 'Name', 'Code', 'Category', 'Unit', 'Status', ...(canManage ? ['Actions'] : [])].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '10px 16px',
                    fontSize: 11, fontWeight: 600, color: '#94a3b8',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 8 : 7} style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8', fontSize: 13 }}>
                    No items found
                  </td>
                </tr>
              ) : (
                filtered.map((item, index) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#94a3b8' }}>{index + 1}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{
                        width: 56, height: 56, borderRadius: 8, overflow: 'hidden',
                        border: '1px solid #e2e8f0', background: '#f8fafc',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {item.imageUrl ? (
                          <img src={BACKEND_URL + item.imageUrl} alt={item.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { e.target.style.display = 'none'; }} />
                        ) : canManage ? (
                          <label style={{ cursor: 'pointer', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                            <span style={{ fontSize: 18, color: '#cbd5e1' }}>+</span>
                            <span style={{ fontSize: 10, color: '#cbd5e1' }}>Photo</span>
                            <input type="file" accept="image/*" style={{ display: 'none' }}
                              onChange={(e) => handleImageUpload(item.id, e.target.files[0])} />
                          </label>
                        ) : (
                          <span style={{ fontSize: 22 }}>📦</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{item.name}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontFamily: 'monospace', color: '#475569' }}>{item.code}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>{item.category}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>{item.unit}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        background: item.active ? '#dcfce7' : '#fef2f2',
                        color: item.active ? '#15803d' : '#dc2626',
                        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      }}>{item.active ? 'Active' : 'Inactive'}</span>
                    </td>
                    {canManage && (
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => handleEdit(item)} style={{
                            background: '#eff6ff', color: '#378ADD', border: 'none',
                            borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                          }}>Edit</button>
                          <label style={{
                            background: '#f5f3ff', color: '#7c3aed', border: 'none',
                            borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                          }}>
                            Photo
                            <input type="file" accept="image/*" style={{ display: 'none' }}
                              onChange={(e) => handleImageUpload(item.id, e.target.files[0])} />
                          </label>
                          {canDelete && (
                            <button onClick={() => handleDelete(item.id)} style={{
                              background: '#fef2f2', color: '#dc2626', border: 'none',
                              borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                            }}>Deactivate</button>
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
    </PageLayout>
  );
}