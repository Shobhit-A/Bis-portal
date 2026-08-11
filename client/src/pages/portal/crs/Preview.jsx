import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { SubmissionIdContext } from '../../../components/FormField';

const MANDATORY_DOCS = ['uploads_ceo_auth', 'uploads_raw_materials', 'uploads_air_ceo_auth', 'uploads_air_id_card', 'uploads_factory_proof'];

const isMissing = v => !v || !String(v).trim();

// Real portal's last tab isn't a Declaration form — it's a validation summary that
// links back to whichever section is still incomplete, then a submit button.
export default function Preview({ formData, getDocForField, isSubmitted, onSubmit, submitting }) {
  const navigate = useNavigate();
  const submissionId = useContext(SubmissionIdContext);
  const base = `/portal/crs/${submissionId}`;

  const product = formData.product || {};
  const management = formData.management || {};
  const air = formData.air || {};
  const contact = formData.contact || {};

  const topFilled = (management.topRows || []).some(r => !isMissing(r.name));
  const techFilled = (management.techRows || []).some(r => !isMissing(r.name));
  const missingDocs = MANDATORY_DOCS.some(key => !getDocForField(key));

  const checks = [
    { ok: !isMissing(product.productName), message: 'Test Report and Model details not added, kindly add the details', path: `${base}/product-testing` },
    { ok: topFilled, message: 'Top Management details has not been saved yet', path: `${base}/management` },
    { ok: techFilled, message: 'Technical Management details has not been saved yet', path: `${base}/management` },
    { ok: !isMissing(air.scenario), message: 'Authorised representative details not available', path: `${base}/air-signatory` },
    { ok: !isMissing(contact.name) && !isMissing(contact.email), message: 'Contact person details not available', path: `${base}/contact-person` },
    { ok: !missingDocs, message: 'Kindly upload the required mandatory document', path: `${base}/upload-documents` },
  ];

  const incomplete = checks.filter(c => !c.ok);
  const allComplete = incomplete.length === 0;

  return (
    <div className="space-y-4">
      {allComplete ? (
        <div className="card p-6 text-center text-green-700 bg-green-50 border border-green-200">
          All sections are complete. You're ready to submit.
        </div>
      ) : (
        incomplete.map((c, i) => (
          <div key={i} className="bg-red-50 border border-red-100 rounded p-4 flex items-center justify-between flex-wrap gap-2">
            <span className="text-red-800 font-medium text-sm">{c.message} !!</span>
            <button onClick={() => navigate(c.path)} className="text-primary text-sm font-medium hover:underline">Click Here</button>
          </div>
        ))
      )}

      {!isSubmitted && (
        <div className="card p-6">
          <button onClick={onSubmit} disabled={submitting || !allComplete}
            className="btn-primary bg-green-600 hover:bg-green-700 w-full py-3 text-base disabled:opacity-50">
            {submitting ? 'Submitting...' : '✓ Submit Application'}
          </button>
          {!allComplete && <p className="text-xs text-gray-400 mt-2 text-center">Complete all sections above before submitting.</p>}
        </div>
      )}
    </div>
  );
}
