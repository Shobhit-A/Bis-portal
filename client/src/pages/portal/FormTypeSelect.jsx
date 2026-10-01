import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { LogOut, FileCheck2, ShieldCheck, ClipboardCheck, Radio, RefreshCw, ExternalLink } from 'lucide-react';

const FORM_CARDS = [
  { key: 'FMCS', path: '/portal/fmcs', icon: FileCheck2, title: 'FMCS', desc: 'Foreign Manufacturers Certification Scheme application.', manualUrl: 'https://www.bis.gov.in/wp-content/uploads/2026/05/FMCS-Application-SubmissionUM-1-1.pdf' },
  { key: 'ISI', path: '/portal/isi', icon: ShieldCheck, title: 'ISI — BIS Standard Mark', desc: 'Indian Standards Institute (ISI) certification mark application.', manualUrl: 'https://www.bis.gov.in/product-certification/product-specific-information-2/?lang=en' },
  { key: 'CRS', path: '/portal/crs', icon: ClipboardCheck, title: 'CRS', desc: 'Compulsory Registration Scheme application.', manualUrl: 'https://www.crsbis.in/BIS/' },
  { key: 'WPC', path: '/portal/wpc', icon: Radio, title: 'WPC', desc: 'Wireless Planning & Coordination equipment approval application.', manualUrl: 'https://eservices.dot.gov.in/sites/default/files/user-mannual/ETA%20Self%20Declaration%20Applicant%20%20Manual.pdf' },
  { key: 'ISI_RENEWAL', path: '/portal/isi-renewal', icon: RefreshCw, title: 'ISI License Renewal', desc: 'Renewal application for an existing ISI (BIS Standard Mark) license.', manualUrl: 'https://www.bis.gov.in/wp-content/uploads/2021/11/How-To-Apply-for-Renewal-auto-renewal-1.pdf' },
];

export default function FormTypeSelect() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const allowed = user?.allowedForms || [];
  const cards = FORM_CARDS.filter(c => allowed.includes(c.key));

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

      <div className="max-w-6xl mx-auto px-6 py-16">
        <h1 className="text-lg font-semibold text-gray-900 mb-1 text-center">Choose Application Type</h1>
        <p className="text-sm text-gray-500 mb-10 text-center">Select the certification scheme you'd like to apply for.</p>
        {cards.length === 0 ? (
          <div className="card p-10 text-center text-gray-500 text-sm">
            No forms have been enabled for your account yet. Contact Absolute Veritas to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {cards.map(c => (
              <div key={c.key} role="button" tabIndex={0} onClick={() => navigate(c.path)}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && navigate(c.path)}
                className="card p-8 text-left hover:border-primary/50 hover:shadow-md transition-all cursor-pointer flex flex-col">
                <c.icon size={28} className="text-primary mb-4" />
                <div className="text-base font-semibold text-gray-900 mb-1">{c.title}</div>
                <p className="text-xs text-gray-500 flex-1">{c.desc}</p>
                <a href={c.manualUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                  className="mt-4 text-xs text-primary hover:underline inline-flex items-center gap-1 w-fit">
                  Product Manual <ExternalLink size={11} />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
