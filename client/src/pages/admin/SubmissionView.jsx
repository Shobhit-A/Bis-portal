import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Download, FileText, Unlock, File, Loader2 } from 'lucide-react';

const SECTIONS_BY_TYPE = {
  FMCS: [
    { key: 'registration', label: 'Registration Form' },
    { key: 'organization', label: 'Organization Profile' },
    { key: 'management', label: 'Management Details' },
    { key: 'manufacturing', label: 'Manufacturing Process' },
    { key: 'packaging', label: 'Packaging & Brand Details' },
    { key: 'testing', label: 'Testing & Inspection' },
    { key: 'testReport', label: 'Test Report Details' },
    { key: 'declaration', label: 'Declaration & Undertaking' },
  ],
  ISI: [
    { key: 'checklist', label: 'Document Checklist' },
    { key: 'firmOffice', label: 'Firm, Office & Registration' },
    { key: 'factory', label: 'Factory Details' },
    { key: 'standard', label: 'Indian Standard & Product Variety' },
    { key: 'management', label: 'Management Details' },
    { key: 'manufacturing', label: 'Manufacturing Process' },
    { key: 'packaging', label: 'Packaging & Brand Details' },
    { key: 'testing', label: 'Testing & Inspection' },
    { key: 'testReport', label: 'Test Report Details' },
    { key: 'declaration', label: 'Declaration & Undertaking' },
  ],
  CRS: [
    { key: 'account', label: 'Registration & Manufacturing Unit' },
    { key: 'address', label: 'Manufacturing Unit & Correspondence Address' },
    { key: 'checklist', label: 'Document Checklist' },
    { key: 'product', label: 'Product & Testing' },
    { key: 'modelBrand', label: 'Model & Brand Mapping' },
    { key: 'brand', label: 'Brand Details' },
    { key: 'management', label: 'Management Details' },
    { key: 'contact', label: 'Contact Person' },
    { key: 'air', label: 'AIR / Authorized Signatory' },
    { key: 'uploads', label: 'Upload Documents' },
    { key: 'declaration', label: 'Declaration & Undertaking' },
  ],
};

export default function SubmissionView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [downloadingDocs, setDownloadingDocs] = useState(false);
  const [downloadingDocId, setDownloadingDocId] = useState(null);

  const loadSubmission = () => {
    setLoading(true);
    setError(null);
    api.get(`/admin/submissions/${id}`)
      .then(res => setSubmission(res.data))
      .catch(err => {
        const notFound = err.response?.status === 404;
        setError(notFound ? 'Submission not found' : 'Failed to load submission — check your connection and retry');
        toast.error(notFound ? 'Submission not found' : 'Failed to load submission');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadSubmission(); }, [id]);

  const handleDownloadExcel = async () => {
    setDownloadingExcel(true);
    try {
      const res = await api.get(`/admin/submissions/${id}/excel`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url;
      a.download = `${submission.user.username}_BIS_Form.xlsx`; a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      if (err.response?.status === 501) {
        const text = await err.response.data.text();
        toast.error(JSON.parse(text).error);
      } else {
        toast.error('Failed to download Excel');
      }
    }
    finally { setDownloadingExcel(false); }
  };

  const handleDownloadDocs = async () => {
    setDownloadingDocs(true);
    try {
      const res = await api.get(`/admin/submissions/${id}/docs`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url;
      a.download = `${submission.user.username}_documents.zip`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Failed to download documents'); }
    finally { setDownloadingDocs(false); }
  };

  const handleDownloadDoc = async (doc) => {
    setDownloadingDocId(doc.id);
    try {
      const res = await api.get(`/admin/submissions/${id}/documents/${doc.id}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = doc.fileName; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Failed to download document'); }
    finally { setDownloadingDocId(null); }
  };

  const handleUnlock = async () => {
    if (!window.confirm('Allow client to edit this form again?')) return;
    try {
      await api.patch(`/admin/submissions/${id}/unlock`);
      setSubmission(p => ({ ...p, status: 'IN_PROGRESS' }));
      toast.success('Form unlocked for editing');
    } catch { toast.error('Failed to unlock'); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  if (!submission) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-red-500">
      <span>{error || 'Submission not found'}</span>
      <div className="flex gap-2">
        <button onClick={loadSubmission} className="btn-secondary">Retry</button>
        <button onClick={() => navigate('/admin')} className="btn-secondary">Back to Dashboard</button>
      </div>
    </div>
  );

  const SECTIONS = SECTIONS_BY_TYPE[submission.formType] || SECTIONS_BY_TYPE.FMCS;
  const effectiveTab = activeTab && SECTIONS.some(s => s.key === activeTab) ? activeTab : SECTIONS[0].key;

  const formData = submission.formData || {};
  const activeData = formData[effectiveTab] || {};
  const activeDocs = submission.documents?.filter(d => d.fieldKey.startsWith(effectiveTab)) || [];

  return (
    <div className="min-h-screen bg-surface">
      <nav className="bg-primary px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin')} className="text-white/70 hover:text-white">
            <ArrowLeft size={18} />
          </button>
          <span className="text-white font-semibold text-sm">
            {submission.user.username} · Form Submission
          </span>
        </div>
        <div className="flex items-center gap-2">
          {submission.status === 'SUBMITTED' && (
            <button onClick={handleUnlock} className="text-white/70 hover:text-white text-xs flex items-center gap-1.5 px-3 py-1.5 rounded border border-white/30 hover:border-white/60">
              <Unlock size={13} /> Unlock
            </button>
          )}
          <button onClick={handleDownloadExcel} disabled={downloadingExcel}
            className="text-white/70 hover:text-white text-xs flex items-center gap-1.5 px-3 py-1.5 rounded border border-white/30 hover:border-white/60 disabled:opacity-60">
            {downloadingExcel ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />} Excel
          </button>
          <button onClick={handleDownloadDocs} disabled={downloadingDocs}
            className="text-white/70 hover:text-white text-xs flex items-center gap-1.5 px-3 py-1.5 rounded border border-white/30 hover:border-white/60 disabled:opacity-60">
            {downloadingDocs ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Docs ZIP
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Info bar */}
        <div className="card p-4 mb-6 flex items-center gap-6 text-sm">
          <div><span className="text-gray-500">Status:</span> <span className={`font-medium ${submission.status === 'SUBMITTED' ? 'text-green-600' : submission.status === 'IN_PROGRESS' ? 'text-yellow-600' : 'text-gray-500'}`}>{submission.status.replace('_', ' ')}</span></div>
          <div><span className="text-gray-500">Last updated:</span> <span className="font-medium">{new Date(submission.updatedAt).toLocaleString('en-IN')}</span></div>
          <div><span className="text-gray-500">Documents:</span> <span className="font-medium">{submission.documents?.length || 0} files</span></div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto mb-0 pb-0">
          {SECTIONS.map(s => (
            <button key={s.key} onClick={() => setActiveTab(s.key)}
              className={`px-3 py-2 text-xs font-medium rounded-t whitespace-nowrap border-b-2 transition-colors ${effectiveTab === s.key ? 'bg-white border-primary text-primary' : 'bg-gray-100 border-transparent text-gray-500 hover:text-gray-700'}`}>
              {s.label}
            </button>
          ))}
        </div>

        <div className="card rounded-tl-none">
          <div className="section-header rounded-none">{SECTIONS.find(s => s.key === effectiveTab)?.label}</div>
          <div className="p-6">
            {Object.keys(activeData).length === 0 && activeDocs.length === 0 ? (
              <p className="text-gray-400 text-sm">No data filled for this section.</p>
            ) : (
              <>
                <div className="space-y-2">
                  {Object.entries(activeData).map(([key, value]) => {
                    const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    const isObjectArray = Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null;
                    if (isObjectArray) {
                      const cols = Object.keys(value[0]);
                      return (
                        <div key={key} className="py-2 border-b border-gray-100 last:border-0">
                          <div className="text-sm font-medium text-gray-600 mb-2">{label}</div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs border border-gray-200 rounded">
                              <thead>
                                <tr className="bg-gray-50">
                                  {cols.map(c => <th key={c} className="text-left px-2 py-1.5 font-medium text-gray-500 border-b border-gray-200 whitespace-nowrap">{c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</th>)}
                                </tr>
                              </thead>
                              <tbody>
                                {value.map((row, i) => (
                                  <tr key={i} className={i % 2 ? 'bg-gray-50/50' : ''}>
                                    {cols.map(c => <td key={c} className="px-2 py-1.5 border-b border-gray-100 text-gray-900">{String(row[c] ?? '') || '—'}</td>)}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={key} className="grid grid-cols-2 gap-4 py-2 border-b border-gray-100 last:border-0">
                        <div className="text-sm font-medium text-gray-600">{label}</div>
                        <div className="text-sm text-gray-900">{Array.isArray(value) ? value.join(', ') : String(value || '—')}</div>
                      </div>
                    );
                  })}
                </div>
                {activeDocs.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Uploaded Documents</h3>
                    <div className="space-y-2">
                      {activeDocs.map(doc => (
                        <button key={doc.id} onClick={() => handleDownloadDoc(doc)}
                          disabled={downloadingDocId === doc.id}
                          className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-blue-50 rounded border border-gray-100 hover:border-primary/30 text-left transition-colors disabled:opacity-60">
                          <File size={15} className="text-primary shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-700">{doc.fieldLabel}</div>
                            <div className="text-xs text-gray-500 truncate">{doc.fileName}</div>
                          </div>
                          <div className="text-xs text-gray-400">{new Date(doc.uploadedAt).toLocaleDateString('en-IN')}</div>
                          {downloadingDocId === doc.id
                            ? <Loader2 size={14} className="text-gray-400 shrink-0 animate-spin" />
                            : <Download size={14} className="text-gray-400 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
