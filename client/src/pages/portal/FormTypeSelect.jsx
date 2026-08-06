import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { LogOut, FileCheck2, ShieldCheck } from 'lucide-react';

export default function FormTypeSelect() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface">
      <nav className="bg-primary px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white rounded px-1.5 py-1 flex items-center">
            <img src="/logo.png" alt="Absolute Veritas" className="h-5 w-auto object-contain" />
          </div>
          <span className="text-white font-semibold text-sm">Absolute Veritas Form Submission</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white/60 text-xs">{user?.username}</span>
          <button onClick={() => { logout(); navigate('/login'); }} className="text-white/70 hover:text-white text-xs flex items-center gap-1.5">
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-lg font-semibold text-gray-900 mb-1 text-center">Choose Application Type</h1>
        <p className="text-sm text-gray-500 mb-10 text-center">Select the certification scheme you'd like to apply for.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <button onClick={() => navigate('/portal/fmcs')} className="card p-8 text-left hover:border-primary/50 hover:shadow-md transition-all">
            <FileCheck2 size={28} className="text-primary mb-4" />
            <div className="text-base font-semibold text-gray-900 mb-1">FMCS</div>
            <p className="text-xs text-gray-500">Foreign Manufacturers Certification Scheme application.</p>
          </button>
          <button onClick={() => navigate('/portal/isi')} className="card p-8 text-left hover:border-primary/50 hover:shadow-md transition-all">
            <ShieldCheck size={28} className="text-primary mb-4" />
            <div className="text-base font-semibold text-gray-900 mb-1">ISI — BIS Standard Mark</div>
            <p className="text-xs text-gray-500">Indian Standards Institute (ISI) certification mark application.</p>
          </button>
        </div>
      </div>
    </div>
  );
}
