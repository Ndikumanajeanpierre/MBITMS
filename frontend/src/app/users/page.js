'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import PageLayout from '@/components/layout/PageLayout';

export default function UsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
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
      const [u, b] = await Promise.all([api.get('/users'), api.get('/branches')]);
      setUsers(u.data);
      setBranches(b.data);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleEmailChange = (value) => {
    setFormData({ ...formData, email: value });
    if (value && !validateEmail(value)) {
      setEmailError('Please enter a valid email address (e.g. john@example.com)');
    } else {
      setEmailError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmail(formData.email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    try {
      if (editUser) {
        await api.put(`/users/${editUser.id}`, {
          name: formData.name,
          email: formData.email,
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
      setEmailError('');
      setFormData({ name: '', email: '', password: '', role: 'BRANCH_STAFF', branchId: '' });
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save user');
    }
  };

  const handleEdit = (u) => {
    setEditUser(u);
    setEmailError('');
    setFormData({ name: u.name, email: u.email, password: '', role: u.role, branchId: u.branch?.id || '' });
    setShowForm(true);
  };

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this user?')) return;
    try { await api.delete(`/users/${id}`); fetchAll(); }
    catch (err) { setError('Failed to deactivate user'); }
  };

  const handleReactivate = async (id) => {
    if (!confirm('Reactivate this user?')) return;
    try { await api.put(`/users/${id}/reactivate`); fetchAll(); }
    catch (err) { setError('Failed to reactivate user'); }
  };

  const getRoleStyle = (role) => {
    const map = {
      ADMIN:             { background: '#FCEBEB', color: '#A32D2D' },
      HEAD_OFFICE_ADMIN: { background: '#EEEDFE', color: '#534AB7' },
      BRANCH_MANAGER:    { background: '#E6F1FB', color: '#185FA5' },
      BRANCH_STAFF:      { background: '#EAF3DE', color: '#3B6D11' },
      ACCOUNTANT:        { background: '#FAEEDA', color: '#854F0B' },
    };
    return map[role] || { background: '#f1f5f9', color: '#475569' };
  };

  const inputStyle = {
    width: '100%', padding: '8px 12px', border: '0.5px solid #e2e8f0',
    borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box',
    background: '#fff', color: '#0f172a',
  };
  const inputErrorStyle = { ...inputStyle, border: '0.5px solid #F7C1C1', background: '#FCEBEB' };
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 500, color: '#64748b', marginBottom: 4 };

  const actions = (
    <button
      onClick={() => { setEditUser(null); setEmailError(''); setFormData({ name: '', email: '', password: '', role: 'BRANCH_STAFF', branchId: '' }); setShowForm(true); }}
      style={{ background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
    >
      <i className="ti ti-plus" style={{ fontSize: 14 }} /> Add User
    </button>
  );

  return (
    <PageLayout title="User Management" subtitle="Manage system users and roles" actions={actions}>

      {error && (
        <div style={{ background: '#FCEBEB', border: '0.5px solid #F7C1C1', color: '#A32D2D', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {error}
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A32D2D', fontWeight: 700, fontSize: 16 }}>×</button>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: '100%', maxWidth: 460 }}>
            <h2 style={{ fontSize: 16, fontWeight: 500, color: '#0f172a', marginBottom: 16 }}>
              {editUser ? 'Edit User' : 'Add New User'}
            </h2>
            <form onSubmit={handleSubmit}>
              {/* Full Name */}
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Full Name</label>
                <input required value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. John Doe" style={inputStyle} />
              </div>

              {/* Email — editable in both create and edit */}
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Email</label>
                <input
                  required
                  type="text"
                  value={formData.email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="e.g. john@example.com"
                  style={emailError ? inputErrorStyle : inputStyle}
                />
                {emailError && (
                  <div style={{ fontSize: 11, color: '#A32D2D', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <i className="ti ti-alert-circle" style={{ fontSize: 12 }} />
                    {emailError}
                  </div>
                )}
              </div>

              {/* Password — only for new users */}
              {!editUser && (
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>Password</label>
                  <input required type="password" value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••" style={inputStyle} />
                </div>
              )}

              {/* Role */}
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Role</label>
                <select value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  style={inputStyle}>
                  <option value="BRANCH_STAFF">Branch Staff</option>
                  <option value="BRANCH_MANAGER">Branch Manager</option>
                  <option value="HEAD_OFFICE_ADMIN">Head Office Admin</option>
                  <option value="ACCOUNTANT">Accountant</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              {/* Branch */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Branch</label>
                <select value={formData.branchId}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  style={inputStyle}>
                  <option value="">Select branch…</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit"
                  disabled={!!emailError}
                  style={{ flex: 1, background: emailError ? '#94a3b8' : '#185FA5', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontSize: 13, fontWeight: 500, cursor: emailError ? 'not-allowed' : 'pointer' }}>
                  {editUser ? 'Update User' : 'Create User'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditUser(null); setEmailError(''); }}
                  style={{ flex: 1, background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, padding: '10px 0', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#185FA5', borderRadius: '50%' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '0.5px solid #e2e8f0' }}>
                {['#', 'Name', 'Email', 'Role', 'Branch', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 500, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8', fontSize: 13 }}>No users found</td></tr>
              ) : users.map((u, index) => (
                <tr key={u.id} style={{ borderBottom: '0.5px solid #f1f5f9' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#94a3b8' }}>{index + 1}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{u.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>{u.email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ ...getRoleStyle(u.role), padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 500 }}>{u.role}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>{u.branch?.name || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: u.active ? '#EAF3DE' : '#FCEBEB', color: u.active ? '#3B6D11' : '#A32D2D', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 500 }}>
                      {u.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleEdit(u)}
                        style={{ background: '#E6F1FB', color: '#185FA5', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                        Edit
                      </button>
                      {u.active && u.id !== user?.id && (
                        <button onClick={() => handleDeactivate(u.id)}
                          style={{ background: '#FCEBEB', color: '#A32D2D', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                          Deactivate
                        </button>
                      )}
                      {!u.active && (
                        <button onClick={() => handleReactivate(u.id)}
                          style={{ background: '#EAF3DE', color: '#3B6D11', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                          Reactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageLayout>
  );
}