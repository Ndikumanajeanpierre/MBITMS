'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import PageLayout from '@/components/layout/PageLayout';

export default function BranchesPage() {
  const { user } = useAuth();
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

  const canManage = ['ADMIN', 'HEAD_OFFICE_ADMIN'].includes(user?.role);

  const actions = canManage ? (
    <button onClick={() => { setShowForm(true); setEditBranch(null); setFormData({ name: '', location: '', contact: '' }); }}
      style={{ background: '#185FA5', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
      <i className="ti ti-plus" style={{ fontSize: 14 }} /> Add Branch
    </button>
  ) : null;

  return (
    <PageLayout title="Branch Management" subtitle="Manage all company branches" actions={actions}>

      {error && (
        <div style={{ background: '#FCEBEB', border: '0.5px solid #F7C1C1', color: '#A32D2D', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, color: '#A32D2D' }}>×</button>
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: '100%', maxWidth: 440 }}>
            <h2 style={{ fontSize: 16, fontWeight: 500, color: '#0f172a', marginBottom: 20 }}>
              {editBranch ? 'Edit Branch' : 'Add New Branch'}
            </h2>
            <form onSubmit={handleSubmit}>
              {[
                { label: 'Branch Name', key: 'name', placeholder: 'e.g. Kigali North Branch' },
                { label: 'Location',    key: 'location', placeholder: 'e.g. Kigali, Rwanda' },
                { label: 'Contact',     key: 'contact', placeholder: 'e.g. 0788000000' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#334155', marginBottom: 6 }}>{f.label}</label>
                  <input
                    required={f.key !== 'contact'}
                    value={formData[f.key]}
                    onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    style={{ width: '100%', padding: '8px 12px', border: '0.5px solid #cbd5e1', borderRadius: 8, fontSize: 13, color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="submit" style={{ flex: 1, background: '#185FA5', color: '#fff', border: 'none', padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                  {editBranch ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditBranch(null); }}
                  style={{ flex: 1, background: '#f1f5f9', color: '#334155', border: '0.5px solid #e2e8f0', padding: '9px 0', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#185FA5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
        </div>
      ) : (
        <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '0.5px solid #e2e8f0' }}>
                {['#', 'Name', 'Location', 'Contact', 'Status', ...(canManage ? ['Actions'] : [])].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 500, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {branches.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 13 }}>No branches found</td></tr>
              ) : branches.map((branch, i) => (
                <tr key={branch.id} style={{ borderBottom: '0.5px solid #f1f5f9' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#94a3b8' }}>{i + 1}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{branch.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>{branch.location}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>{branch.contact}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: branch.active ? '#EAF3DE' : '#FCEBEB', color: branch.active ? '#3B6D11' : '#A32D2D', fontSize: 11, padding: '3px 10px', borderRadius: 99, fontWeight: 500 }}>
                      {branch.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {canManage && (
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleEdit(branch)}
                          style={{ background: '#E6F1FB', color: '#185FA5', border: 'none', padding: '4px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
                          Edit
                        </button>
                        <button onClick={() => handleDelete(branch.id)}
                          style={{ background: '#FCEBEB', color: '#A32D2D', border: 'none', padding: '4px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
                          Deactivate
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageLayout>
  );
}