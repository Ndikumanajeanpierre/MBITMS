'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import PageLayout from '@/components/layout/PageLayout';

export default function AuditLogsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchLogs();
  }, [user]);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/audit-logs');
      setLogs(res.data);
    } catch (err) {
      setError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const filtered = logs.filter(log =>
    log.action?.toLowerCase().includes(search.toLowerCase()) ||
    log.entity?.toLowerCase().includes(search.toLowerCase()) ||
    log.user?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const getActionStyle = (action) => {
    const map = {
      CREATE:  { background: '#dcfce7', color: '#15803d' },
      UPDATE:  { background: '#dbeafe', color: '#1d4ed8' },
      DELETE:  { background: '#fef2f2', color: '#dc2626' },
      LOGIN:   { background: '#f5f3ff', color: '#7c3aed' },
      APPROVE: { background: '#fefce8', color: '#ca8a04' },
      RECEIVE: { background: '#fff7ed', color: '#c2410c' },
    };
    return map[action] || { background: '#f1f5f9', color: '#475569' };
  };

  return (
    <PageLayout title="Audit Logs" subtitle="Track all system activities">

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search by action, entity or user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%', maxWidth: 400, padding: '8px 12px',
            border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13,
            outline: 'none', background: '#fff', color: '#0f172a', boxSizing: 'border-box',
          }}
        />
      </div>

      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
          padding: '10px 14px', borderRadius: 8, marginBottom: 12, fontSize: 13,
        }}>{error}</div>
      )}

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
                {['#', 'User', 'Action', 'Entity', 'Details', 'Timestamp'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '10px 20px',
                    fontSize: 11, fontWeight: 600, color: '#94a3b8',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8', fontSize: 13 }}>
                    No audit logs found
                  </td>
                </tr>
              ) : (
                filtered.map((log, index) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#94a3b8' }}>{index + 1}</td>
                    <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 500, color: '#0f172a' }}>
                      {log.user?.name || 'System'}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        ...getActionStyle(log.action),
                        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      }}>{log.action}</span>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#475569' }}>{log.entity}</td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#475569', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.details}
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#94a3b8' }}>
                      {new Date(log.timestamp).toLocaleString()}
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