import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { LogOut, Plus, X } from 'lucide-react';

function StatusBadge({ status }) {
  if (status === 'SUBMITTED') return <span className="badge-submitted">Submitted</span>;
  if (status === 'IN_PROGRESS') return <span className="badge-progress">In Progress</span>;
  return <span className="badge-notstarted">Not Started</span>;
}

function NewFormModal({ forms, onClose, onCreated }) {
  const [label, setLabel] = useState('');
  const [cloneFromId, setCloneFromId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/submissions', { label, cloneFromId: cloneFromId || undefined });
      toast.success(`"${res.data.label}" created`);
      onCreated(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-gray-900">Start New Form</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Form Name <span className="required">*</span></label>
            <input className="input" placeholder="e.g. Product A" value={label}
              onChange={e => setLabel(e.target.value)} required minLength={1} autoFocus />
          </div>
          {forms.length > 0 && (
            <div>
              <label className="label">Clone answers from</label>
              <select className="input" value={cloneFromId} onChange={e => setCloneFromId(e.target.value)}>
                <option value="">None (start blank)</option>
                {forms.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>
              <p className="text-xs text-gray-400 mt-1">Copies typed answers only — you'll need to re-upload documents.</p>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? 'Creating...' : 'Create Form'}
            </button>
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MyForms() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    api.get('/submissions')
      .then(res => setForms(res.data))
      .catch(() => toast.error('Failed to load forms'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-surface">
      <nav className="bg-white border-b border-border shadow-sm px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Absolute Veritas" className="h-9 w-auto object-contain" />
          <span className="text-gray-900 font-semibold text-sm">Absolute Veritas Form Submission</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-xs">{user?.username}</span>
          <button onClick={() => { logout(); navigate('/login'); }} className="text-gray-500 hover:text-primary text-xs flex items-center gap-1.5">
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-gray-900">My Forms</h1>
          <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> Start New Form
          </button>
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
          ) : forms.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No forms yet. Start one to get going.</div>
          ) : (
            <div className="divide-y divide-border">
              {forms.map(f => (
                <button key={f.id} onClick={() => navigate(`/portal/${f.id}`)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{f.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Last updated {new Date(f.updatedAt).toLocaleDateString('en-IN')}</div>
                  </div>
                  <StatusBadge status={f.status} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {showNew && <NewFormModal forms={forms} onClose={() => setShowNew(false)} onCreated={f => { setForms(prev => [f, ...prev]); setShowNew(false); navigate(`/portal/${f.id}`); }} />}
    </div>
  );
}
