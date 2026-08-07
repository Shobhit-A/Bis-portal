import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { LogOut, CheckCircle, Clock, Save, ArrowLeft } from 'lucide-react';
import { SubmissionIdContext } from '../../components/FormField';

export default function PortalLayout({ basePath, TABS, tabComponents }) {
  const { user, logout } = useAuth();
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [submission, setSubmission] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    api.get(`/submissions/${submissionId}`)
      .then(res => {
        setSubmission(res.data);
        setFormData(res.data.formData || {});
      })
      .catch(() => toast.error('Failed to load form data'));
  }, [submissionId]);

  const saveData = useCallback(async (data) => {
    if (submission?.status === 'SUBMITTED') return;
    setSaving(true);
    try {
      await api.put(`/submissions/${submissionId}`, { formData: data });
      setLastSaved(new Date());
    } catch {
      // Silent fail for auto-save
    } finally {
      setSaving(false);
    }
  }, [submission?.status, submissionId]);

  const updateSection = useCallback((sectionKey, sectionData) => {
    setFormData(prev => {
      const updated = { ...prev, [sectionKey]: sectionData };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => saveData(updated), 2000);
      return updated;
    });
  }, [saveData]);

  const handleManualSave = async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await saveData(formData);
    toast.success('Progress saved');
  };

  const handleSubmit = async () => {
    if (!window.confirm('Submit the form? You will not be able to edit after submission unless admin unlocks it.')) return;
    setSubmitting(true);
    try {
      await api.post(`/submissions/${submissionId}/submit`, { formData });
      setSubmission(prev => ({ ...prev, status: 'SUBMITTED' }));
      toast.success('Form submitted successfully!');
      navigate(`${basePath}/${submissionId}/submitted`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  const isSubmitted = submission?.status === 'SUBMITTED';
  const docs = submission?.documents || [];

  const getDocForField = (fieldKey) => docs.find(d => d.fieldKey === fieldKey);
  const onDocUploaded = (doc) => setSubmission(prev => ({ ...prev, documents: [...(prev?.documents || []).filter(d => d.fieldKey !== doc.fieldKey), doc] }));
  const onDocRemoved = (docId) => setSubmission(prev => ({ ...prev, documents: (prev?.documents || []).filter(d => d.id !== docId) }));

  const formBasePath = `${basePath}/${submissionId}`;
  const activeTab = TABS.findIndex(t => {
    const path = location.pathname.replace(formBasePath, '').replace(/^\//, '');
    return t.path === path || (t.path === '' && path === '');
  });

  const currentIndex = Math.max(0, activeTab);
  const sharedProps = { formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted };

  return (
    <SubmissionIdContext.Provider value={submissionId}>
      <div className="min-h-screen bg-surface flex flex-col">
        <div className="sticky top-0 z-20 shrink-0">
          <nav className="bg-primary px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(basePath)} className="text-white/70 hover:text-white" title="Back to My Forms">
                <ArrowLeft size={16} />
              </button>
              <div className="bg-white rounded px-2 py-1.5 flex items-center">
                <img src="/logo.png" alt="Absolute Veritas" className="h-8 w-auto object-contain" />
              </div>
              <div>
                <span className="text-white font-semibold text-sm">{submission?.label || 'Absolute Veritas Form Submission'}</span>
                {isSubmitted && <span className="ml-3 text-xs bg-green-400/20 text-green-200 px-2 py-0.5 rounded">Submitted</span>}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {!isSubmitted && (
                <div className="flex items-center gap-2">
                  {saving ? (
                    <span className="text-white/50 text-xs flex items-center gap-1"><Clock size={11} /> Saving...</span>
                  ) : lastSaved ? (
                    <span className="text-white/50 text-xs flex items-center gap-1"><CheckCircle size={11} /> Saved {lastSaved.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                  ) : null}
                  <button onClick={handleManualSave} className="text-white/70 hover:text-white text-xs flex items-center gap-1 px-2 py-1 rounded border border-white/20 hover:border-white/50">
                    <Save size={12} /> Save
                  </button>
                </div>
              )}
              <span className="text-white/60 text-xs">{user?.username}</span>
              <button onClick={() => { logout(); navigate('/login'); }} className="text-white/70 hover:text-white text-xs flex items-center gap-1.5">
                <LogOut size={13} /> Sign out
              </button>
            </div>
          </nav>

          <div className="bg-white border-b border-border px-6 py-3 overflow-x-auto scrollbar-hide">
            <div className="flex gap-1 min-w-max">
              {TABS.map((tab, idx) => (
                <button key={tab.key}
                  onClick={() => navigate(`${formBasePath}/${tab.path}`)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${idx === currentIndex ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}>
                  <span className="mr-1.5 opacity-60">{idx + 1}.</span>{tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {isSubmitted && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded flex items-center gap-3">
                <CheckCircle size={18} className="text-green-500 shrink-0" />
                <div>
                  <div className="text-sm font-medium text-green-800">Form Submitted</div>
                  <div className="text-xs text-green-600 mt-0.5">Your form has been submitted. You can view your data below. Contact us to make changes.</div>
                </div>
              </div>
            )}

            <Routes>
              {TABS.map((tab, idx) => {
                const Component = tabComponents[tab.key];
                const extraProps = idx === TABS.length - 1 ? { onSubmit: handleSubmit, submitting } : {};
                return tab.path === ''
                  ? <Route key={tab.key} index element={<Component {...sharedProps} {...extraProps} />} />
                  : <Route key={tab.key} path={tab.path} element={<Component {...sharedProps} {...extraProps} />} />;
              })}
              <Route path="submitted" element={
                <div className="text-center py-16">
                  <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Form Submitted Successfully!</h2>
                  <p className="text-gray-500 text-sm mb-6">Our team at Absolute Veritas will review your information and get back to you shortly.</p>
                  <a href="mailto:info@absoluteveritas.com" className="btn-primary inline-block">Contact Us</a>
                </div>
              } />
            </Routes>

            {!location.pathname.includes('submitted') && (
              <div className="flex justify-between mt-8 pt-6 border-t border-border">
                <button onClick={() => { const prev = TABS[currentIndex - 1]; if (prev) navigate(`${formBasePath}/${prev.path}`); }}
                  disabled={currentIndex === 0} className="btn-secondary disabled:opacity-30">← Previous</button>
                {currentIndex < TABS.length - 1 ? (
                  <button onClick={() => { const next = TABS[currentIndex + 1]; navigate(`${formBasePath}/${next.path}`); }} className="btn-primary">
                    Next →
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </SubmissionIdContext.Provider>
  );
}
