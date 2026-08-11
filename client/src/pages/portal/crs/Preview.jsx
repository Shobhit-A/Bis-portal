import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { SubmissionIdContext } from '../../../components/FormField';

const MANDATORY_DOCS = ['uploads_ceo_auth', 'uploads_raw_materials', 'uploads_air_ceo_auth', 'uploads_air_id_card', 'uploads_factory_proof'];

const isMissing = v => !v || !String(v).trim();

function Row({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-3 py-1.5 border-b border-border last:border-0">
      <span className="text-xs text-gray-500 sm:w-56 shrink-0">{label}</span>
      {isMissing(value) ? (
        <span className="text-sm text-red-500 italic">Not provided</span>
      ) : (
        <span className="text-sm text-gray-800 wrap-break-word">{value}</span>
      )}
    </div>
  );
}

function SummaryCard({ title, children }) {
  return (
    <div className="card">
      <div className="section-header">{title}</div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// Real portal's last tab isn't a Declaration form — it's a Preview page: missing-section
// alerts up top, then a full read-only recap of everything filled in so far, then submit.
export default function Preview({ formData, getDocForField, isSubmitted, onSubmit, submitting }) {
  const navigate = useNavigate();
  const submissionId = useContext(SubmissionIdContext);
  const base = `/portal/crs/${submissionId}`;

  const account = formData.account || {};
  const address = formData.address || {};
  const product = formData.product || {};
  const brand = formData.brand || {};
  const management = formData.management || {};
  const air = formData.air || {};
  const contact = formData.contact || {};
  const uploads = formData.uploads || {};

  const topRows = (management.topRows || []).filter(r => !isMissing(r.name));
  const techRows = (management.techRows || []).filter(r => !isMissing(r.name));
  const brandRows = (brand.rows || []).filter(r => !isMissing(r.brandName));

  const topFilled = topRows.length > 0;
  const techFilled = techRows.length > 0;
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
  const officeAddress = address.sameAsManufacturing ? address.mfgAddress : address.corrAddress;

  const officeDoc = getDocForField('address_auth_doc');
  const uploadDocRows = [
    ['uploads_ceo_auth', 'CEO/MD/Head Authorization'],
    ['uploads_raw_materials', 'Raw Materials/Components'],
    ['uploads_air_ceo_auth', 'AIR CEO Authorization'],
    ['uploads_air_id_card', 'AIR Signatory ID Card'],
    ['uploads_other', 'Other Document'],
    ['uploads_factory_proof', 'Factory Address Proof / Business License'],
  ];

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

      <SummaryCard title="Registration & Manufacturing Unit Address">
        <Row label="Manufacturing Unit Name" value={account.unitName} />
        <Row label="User Name" value={account.userName} />
        <Row label="Email" value={account.email} />
        <Row label="Mobile No." value={account.mobile} />
        <Row label="Manufacturing Unit Address" value={address.mfgAddress} />
        <Row label="Office / Correspondence Address" value={officeAddress} />
        <Row label="Address Authentication Document" value={officeDoc?.fileName} />
      </SummaryCard>

      <SummaryCard title="Product & Testing">
        <Row label="Product Category" value={product.productCategory} />
        <Row label="Indian Standard" value={product.indianStandard} />
        <Row label="Product Name" value={product.productName} />
      </SummaryCard>

      <SummaryCard title="Brand Details">
        {brandRows.length === 0 ? (
          <p className="text-sm text-red-500 italic">No brands added</p>
        ) : (
          <div className="space-y-3">
            {brandRows.map((r, i) => (
              <div key={r.id || i} className="text-sm">
                <span className="font-medium text-gray-800">{r.brandName}</span>
                <span className="text-gray-400"> — {r.ownedBy || 'Owner not set'} · {r.registered || 'Status not set'}</span>
              </div>
            ))}
          </div>
        )}
      </SummaryCard>

      <SummaryCard title="Management Details">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Top Management</p>
        {topRows.length === 0 ? (
          <p className="text-sm text-red-500 italic mb-3">Not provided</p>
        ) : topRows.map((r, i) => <Row key={r.id || i} label={r.designation || 'Director/Partner'} value={r.name} />)}
        <p className="text-xs font-semibold text-gray-500 uppercase mb-1 mt-4">Technical Management</p>
        {techRows.length === 0 ? (
          <p className="text-sm text-red-500 italic">Not provided</p>
        ) : techRows.map((r, i) => <Row key={r.id || i} label={r.designation || 'Technical Personnel'} value={r.name} />)}
      </SummaryCard>

      <SummaryCard title="Contact Person">
        <Row label="Name" value={contact.name} />
        <Row label="Designation" value={contact.designation} />
        <Row label="Mobile Number" value={contact.mobile} />
        <Row label="Email" value={contact.email} />
      </SummaryCard>

      <SummaryCard title="AIR / Authorized Signatory">
        <Row label="Representative Scenario" value={air.scenario} />
        <Row label="Representative Firm Name" value={air.repFirmName} />
        <Row label="Person Name" value={air.personName} />
        <Row label="Person Mobile" value={air.personMobile} />
        <Row label="Person Email" value={air.personEmail} />
      </SummaryCard>

      <SummaryCard title="Upload Documents">
        <Row label="In-house testing facility?" value={uploads.inHouseTesting} />
        <Row label="Complete manufacturing facility?" value={uploads.completeManufacturing} />
        {uploadDocRows.map(([key, label]) => (
          <Row key={key} label={label} value={getDocForField(key)?.fileName} />
        ))}
      </SummaryCard>

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
