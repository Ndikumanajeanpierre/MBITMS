'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import PageLayout from '@/components/layout/PageLayout';

export default function SuppliersPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);
  const [formData, setFormData] = useState({ name: '', contact: '', email: '', address: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchSuppliers();
  }, [user]);

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers');
      setSuppliers(res.data);
    } catch (err) {
      setError('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editSupplier) {
        await api.put(`/suppliers/${editSupplier.id}`, formData);
      } else {
        await api.post('/suppliers', formData);
      }
      setShowForm(false);
      setEditSupplier(null);
      setFormData({ name: '', contact: '', email: '', address: '' });
      fetchSuppliers();
    } catch (err) {
      setError('Failed to save supplier');
    }
  };

  const handleEdit = (supplier) => {
    setEditSupplier(supplier);
    setFormData({ name: supplier.name, contact: supplier.contact, email: supplier.email, address: supplier.address });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this supplier?')) return;
    try {
      await api.delete(`/suppliers/${id}`);
      fetchSuppliers();
    } catch (err) {
      setError('Failed to deactivate supplier');
    }
  };

  const inputStyle = {
    width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0',
    borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box',
    background: '#fff', color: '#0f172a',
  };
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 500, color: '#64748b', marginBottom: 4 };

  const actions = (
    <button
      onClick={() => { setShowForm(true); setEditSupplier(null); setFormData({ name: '', contact: '', email: '', address: '' }); }}
      style={{
        background: '#378ADD', color: '#fff', border: 'none', borderRadius: 8,
        padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 6,
      }}
    >
      + Add Supplier
    </button>
  );

  return (
    <PageLayout title="Supplier Management" subtitle="Manage all suppliers" actions={actions}>

      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
          padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          {error}
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontWeight: 700, fontSize: 16 }}>×</button>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16,
        }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: '100%', maxWidth: 460 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>
              {editSupplier ? 'Edit Supplier' : 'Add New Supplier'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Supplier Name</label>
                <input required value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rwanda Medical Supplies" style={inputStyle} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Contact</label>
                <input value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="e.g. 0788000000" style={inputStyle} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Email</label>
                <input type="email" value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. supplier@example.com" style={inputStyle} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Address</label>
                <textarea value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. KG 123 St, Kigali" rows={2}
                  style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" style={{
                  flex: 1, background: '#378ADD', color: '#fff', border: 'none',
                  borderRadius: 8, padding: '10px 0', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                }}>{editSupplier ? 'Update' : 'Create'}</button>
                <button type="button" onClick={() => { setShowForm(false); setEditSupplier(null); }} style={{
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
                {['#', 'Name', 'Contact', 'Email', 'Address', 'Actions'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '10px 20px',
                    fontSize: 11, fontWeight: 600, color: '#94a3b8',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8', fontSize: 13 }}>
                    No suppliers found. Add your first supplier!
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier, index) => (
                  <tr key={supplier.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#94a3b8' }}>{index + 1}</td>
                    <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{supplier.name}</td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#475569' }}>{supplier.contact}</td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#475569' }}>{supplier.email}</td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#475569' }}>{supplier.address}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => handleEdit(supplier)} style={{
                          background: '#eff6ff', color: '#378ADD', border: 'none',
                          borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                        }}>Edit</button>
                        <button onClick={() => handleDelete(supplier.id)} style={{
                          background: '#fef2f2', color: '#dc2626', border: 'none',
                          borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                        }}>Deactivate</button>
                      </div>
                    </td>
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