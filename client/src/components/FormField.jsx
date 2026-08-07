import React, { useCallback, useState, createContext, useContext } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, CheckCircle } from 'lucide-react';
import api from '../lib/axios';
import toast from 'react-hot-toast';

// Provided by PortalLayout, consumed here so none of the 9 tab components
// need to thread submissionId through as a prop.
export const SubmissionIdContext = createContext(null);

export function Field({ label, required, error, children, hint }) {
  return (
    <div>
      <label className="label">
        {label}{required && <span className="required"> *</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export function Select({ value, onChange, options, placeholder = 'Select...', className = '' }) {
  return (
    <select value={value || ''} onChange={e => onChange(e.target.value)} className={`input ${className}`}>
      <option value="">{placeholder}</option>
      {options.map(o => (
        <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
          {typeof o === 'string' ? o : o.label}
        </option>
      ))}
    </select>
  );
}

const DEFAULT_ACCEPT = { 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] };
const DEFAULT_ACCEPT_LABEL = 'PDF, JPG, PNG';

export function FileUpload({ fieldKey, fieldLabel, existingDoc, onUploaded, onRemoved, accept = DEFAULT_ACCEPT, acceptLabel = DEFAULT_ACCEPT_LABEL }) {
  const submissionId = useContext(SubmissionIdContext);
  const [uploading, setUploading] = useState(false);
  const [doc, setDoc] = useState(existingDoc || null);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fieldKey', fieldKey);
    formData.append('fieldLabel', fieldLabel);
    try {
      const res = await api.post(`/submissions/${submissionId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setDoc(res.data);
      onUploaded?.(res.data);
      toast.success(`${file.name} uploaded`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [fieldKey, fieldLabel, submissionId]);

  const handleRemove = async () => {
    if (!doc) return;
    try {
      await api.delete(`/submissions/${submissionId}/documents/${doc.id}`);
      setDoc(null);
      onRemoved?.(doc.id);
      toast.success('Document removed');
    } catch {
      toast.error('Remove failed');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  });

  if (doc) {
    return (
      <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded">
        <CheckCircle size={15} className="text-green-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-gray-800 truncate">{doc.fileName}</div>
          <div className="text-xs text-gray-400">Uploaded</div>
        </div>
        <button onClick={handleRemove} className="text-gray-400 hover:text-red-500 flex-shrink-0">
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div {...getRootProps()} className={`border-2 border-dashed rounded p-4 cursor-pointer text-center transition-colors ${isDragActive ? 'border-primary bg-blue-50' : 'border-border hover:border-primary/50 hover:bg-gray-50'}`}>
      <input {...getInputProps()} />
      {uploading ? (
        <div className="text-xs text-gray-500">Uploading...</div>
      ) : (
        <>
          <Upload size={18} className="text-gray-300 mx-auto mb-1" />
          <div className="text-xs text-gray-500">{isDragActive ? 'Drop file here' : 'Click or drag to upload'}</div>
          <div className="text-xs text-gray-400 mt-0.5">{acceptLabel} · Max 5MB</div>
        </>
      )}
    </div>
  );
}
