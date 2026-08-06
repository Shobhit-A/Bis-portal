import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { Users, FileText, LogOut, Plus, Eye, EyeOff, Download, Trash2, Key, X, Loader2, Check, UserCheck } from 'lucide-react';

function StatusBadge({ status }) {
  if (status === 'SUBMITTED') return <span className="badge-submitted">Submitted</span>;
  if (status === 'IN_PROGRESS') return <span className="badge-progress">In Progress</span>;
  return <span className="badge-notstarted">Not Started</span>;
}

function CreateUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/admin/users', form);
      toast.success(`Account created for ${res.data.username}`);
      onCreated(res.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-gray-900">Create Client Account</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Username <span className="required">*</span></label>
            <input className="input" placeholder="e.g. companyname_2025" value={form.username}
              onChange={e => setForm(p => ({ ...p, username: e.target.value }))} required minLength={3} />
            <p className="text-xs text-gray-400 mt-1">Client will use this to log in</p>
          </div>
          <div>
            <label className="label">Password <span className="required">*</span></label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} className="input pr-10" placeholder="Set a strong password"
                value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required minLength={6} />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'}
            </button>
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResetPasswordModal({ user, onClose }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch(`/admin/users/${user.id}/password`, { password });
      toast.success('Password reset successfully');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-gray-900">Reset Password — {user.username}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">New Password <span className="required">*</span></label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} className="input pr-10" placeholder="Enter new password"
                value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [resetUser, setResetUser] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadingDocsId, setDownloadingDocsId] = useState(null);

  useEffect(() => {
    api.get('/admin/users')
      .then(res => setUsers(res.data))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id, username) => {
    if (!window.confirm(`Delete account "${username}"? This will delete all their form data and documents.`)) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
      toast.success('Account deleted');
    } catch { toast.error('Delete failed'); }
  };

  const [approvingId, setApprovingId] = useState(null);

  const handleApprove = async (id, username) => {
    setApprovingId(id);
    try {
      await api.patch(`/admin/users/${id}/approve`);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, approved: true } : u));
      toast.success(`${username} approved`);
    } catch { toast.error('Approval failed'); }
    finally { setApprovingId(null); }
  };

  const handleReject = async (id, username) => {
    if (!window.confirm(`Reject registration for "${username}"? This deletes their pending account.`)) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
      toast.success('Registration rejected');
    } catch { toast.error('Rejection failed'); }
  };

  const handleDownloadExcel = async (submissionId, username) => {
    setDownloadingId(submissionId);
    try {
      const res = await api.get(`/admin/submissions/${submissionId}/excel`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = `${username}_BIS_Form.xlsx`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Download failed'); }
    finally { setDownloadingId(null); }
  };

  const handleDownloadDocs = async (submissionId, username) => {
    setDownloadingDocsId(submissionId);
    try {
      const res = await api.get(`/admin/submissions/${submissionId}/docs`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = `${username}_documents.zip`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Download failed'); }
    finally { setDownloadingDocsId(null); }
  };

  const pendingUsers = users.filter(u => !u.approved);
  const approvedUsers = users.filter(u => u.approved);

  const allSubmissions = approvedUsers.flatMap(u => u.submissions || []);
  const stats = {
    total: approvedUsers.length,
    submitted: allSubmissions.filter(s => s.status === 'SUBMITTED').length,
    inProgress: allSubmissions.filter(s => s.status === 'IN_PROGRESS').length,
    notStarted: allSubmissions.filter(s => s.status === 'NOT_STARTED').length,
  };

  // One row per form; clients with zero forms still get one row so their
  // account remains visible/manageable (reset password, delete).
  const rows = approvedUsers.flatMap(u =>
    u.submissions && u.submissions.length > 0
      ? u.submissions.map(s => ({ ...s, userId: u.id, username: u.username, accountCreatedAt: u.createdAt }))
      : [{ id: null, label: null, status: null, updatedAt: null, userId: u.id, username: u.username, accountCreatedAt: u.createdAt }]
  );

  return (
    <div className="min-h-screen bg-surface">
      {/* Navbar */}
      <nav className="bg-primary px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white rounded px-1.5 py-1 flex items-center">
            <img src="/logo.png" alt="Absolute Veritas" className="h-5 w-auto object-contain" />
          </div>
          <span className="text-white font-semibold text-sm">Absolute Veritas Form Submission · Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white/70 text-xs">{user?.email || user?.username}</span>
          <button onClick={() => { logout(); navigate('/login'); }} className="text-white/70 hover:text-white flex items-center gap-1.5 text-xs">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Clients', value: stats.total, color: 'text-primary' },
            { label: 'Submitted', value: stats.submitted, color: 'text-green-600' },
            { label: 'In Progress', value: stats.inProgress, color: 'text-yellow-600' },
            { label: 'Not Started', value: stats.notStarted, color: 'text-gray-500' },
          ].map(s => (
            <div key={s.label} className="card p-4">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Pending Approvals */}
        {pendingUsers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <UserCheck size={16} className="text-yellow-600" /> Pending Approvals ({pendingUsers.length})
            </h2>
            <div className="card overflow-hidden border-yellow-200">
              <div className="divide-y divide-border">
                {pendingUsers.map(u => (
                  <div key={u.id} className="flex items-center justify-between px-4 py-3 bg-yellow-50/50">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{u.username}</div>
                      <div className="text-xs text-gray-500">{u.email} · registered {new Date(u.createdAt).toLocaleDateString('en-IN')}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleApprove(u.id, u.username)} disabled={approvingId === u.id}
                        className="btn-primary bg-green-600 hover:bg-green-700 flex items-center gap-1.5 px-3 py-1.5 text-xs disabled:opacity-60">
                        {approvingId === u.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Approve
                      </button>
                      <button onClick={() => handleReject(u.id, u.username)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50" title="Reject">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users size={18} className="text-primary" /> Client Accounts
          </h1>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> New Account
          </button>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Username</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Last Updated</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Created</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400 text-sm">Loading...</td></tr>
              ) : approvedUsers.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400 text-sm">No client accounts yet. Create one to get started.</td></tr>
              ) : rows.map((row, i) => (
                <tr key={row.id || `${row.userId}-empty`} className={`border-b border-border last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {row.username}
                    {row.label && <span className="text-gray-400 font-normal"> — {row.label}</span>}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(row.accountCreatedAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {row.id && (
                        <>
                          <button onClick={() => navigate(`/admin/submissions/${row.id}`)}
                            className="p-1.5 text-gray-400 hover:text-primary rounded hover:bg-blue-50" title="View form">
                            <Eye size={15} />
                          </button>
                          <button onClick={() => handleDownloadExcel(row.id, `${row.username}_${row.label}`)}
                            disabled={downloadingId === row.id}
                            className="p-1.5 text-gray-400 hover:text-green-600 rounded hover:bg-green-50 disabled:opacity-60" title="Download Excel">
                            {downloadingId === row.id
                              ? <Loader2 size={15} className="animate-spin" />
                              : <FileText size={15} />}
                          </button>
                          <button onClick={() => handleDownloadDocs(row.id, `${row.username}_${row.label}`)}
                            disabled={downloadingDocsId === row.id}
                            className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50 disabled:opacity-60" title="Download Documents ZIP">
                            {downloadingDocsId === row.id
                              ? <Loader2 size={15} className="animate-spin" />
                              : <Download size={15} />}
                          </button>
                        </>
                      )}
                      <button onClick={() => setResetUser({ id: row.userId, username: row.username })}
                        className="p-1.5 text-gray-400 hover:text-yellow-600 rounded hover:bg-yellow-50" title="Reset password">
                        <Key size={15} />
                      </button>
                      <button onClick={() => handleDelete(row.userId, row.username)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50" title="Delete account">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onCreated={u => setUsers(prev => [{ ...u, submissions: [] }, ...prev])} />}
      {resetUser && <ResetPasswordModal user={resetUser} onClose={() => setResetUser(null)} />}
    </div>
  );
}
