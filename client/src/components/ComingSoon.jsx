import React from 'react';
import { Clock } from 'lucide-react';

// Placeholder for CRS tabs whose source material is incomplete (see the CRS design spec
// §3) — no fields, nothing stored to formData, doesn't block navigation or submission.
export default function ComingSoon({ title, message }) {
  return (
    <div className="card">
      <div className="section-header">{title}</div>
      <div className="p-10 text-center">
        <Clock size={32} className="text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">{message}</p>
        <p className="text-xs text-gray-400 mt-1">Check back soon, or contact Absolute Veritas if you need to provide this information now.</p>
      </div>
    </div>
  );
}
