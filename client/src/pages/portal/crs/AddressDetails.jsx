import React from 'react';
import { Field, Select, FileUpload } from '../../../components/FormField';
import { COUNTRIES } from '../tabs/OrganizationProfile';
import { INDIAN_STATES } from './AirSignatory';

const ADDR_PROOF_HINT = 'For proof of name and address of manufacturing unit, kindly upload a valid government issued document in which name and address of the manufacturing unit is clearly reflected along with reflection of manufacturing activity for products related to Registration Scheme. Documents like ISO certificates may be submitted in addition, if scope of manufacturing is not clear from the above document. However, an ISO document alone will not be accepted for address proof.';

const PDF_ONLY = { 'application/pdf': ['.pdf'] };

function WarnHint({ children }) {
  return <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1 mt-1">{children}</p>;
}

AddressDetails.isComplete = (formData, getDocForField) => {
  const d = formData.address || {};
  const missing = [];
  if (!d.mfgEmail) missing.push('Manufacturing Unit Email');
  if (!d.mfgAddress) missing.push('Manufacturing Unit Address');
  if (!d.mfgCountry) missing.push('Manufacturing Unit Country');
  if (!d.mfgState) missing.push('Manufacturing Unit State');
  if (!d.mfgZip) missing.push('Manufacturing Unit Zip Code');
  if (!d.mfgContact) missing.push('Manufacturing Unit Contact No.');
  if (!d.corrEmail) missing.push('Correspondence Email');
  if (!d.corrAddress) missing.push('Correspondence Address');
  if (!d.corrCountry) missing.push('Correspondence Country');
  if (!d.corrState) missing.push('Correspondence State');
  if (!d.corrZip) missing.push('Correspondence Zip Code');
  if (!d.corrContact) missing.push('Correspondence Contact No.');
  if (!getDocForField('address_auth_doc')) missing.push('Address Authentication Document');
  if (!d.addrProofDocType) missing.push('Type of Document');
  return missing;
};

export default function AddressDetails({ formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  const data = formData.address || {};
  const set = (key, val) => updateSection('address', { ...data, [key]: val });
  const d = (key) => ({ value: data[key] || '', onChange: e => set(key, e.target.value), disabled: isSubmitted, className: 'input' });

  const copyFromManufacturing = () => {
    updateSection('address', {
      ...data,
      corrEmail: data.mfgEmail || '',
      corrAddress: data.mfgAddress || '',
      corrCountry: data.mfgCountry || '',
      corrState: data.mfgState || '',
      corrZip: data.mfgZip || '',
      corrFax: data.mfgFax || '',
      corrContact: data.mfgContact || '',
      sameAsManufacturing: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">Address of the Manufacturing Unit</div>
        <div className="p-6 space-y-4">
          <Field label="Email" required><input type="email" {...d('mfgEmail')} /></Field>
          <Field label="Address" required>
            <textarea className="input" value={data.mfgAddress || ''} onChange={e => set('mfgAddress', e.target.value)} disabled={isSubmitted} rows={3} />
          </Field>
          <div className="form-row">
            <Field label="Country" required>
              <Select value={data.mfgCountry || 'India'} onChange={v => set('mfgCountry', v)} options={COUNTRIES} />
            </Field>
            <Field label="State/Province" required>
              <Select value={data.mfgState} onChange={v => set('mfgState', v)} options={INDIAN_STATES} />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Zip Code" required>
              <input {...d('mfgZip')} />
              <WarnHint>Zip Code is Mandatory</WarnHint>
            </Field>
            <Field label="Fax No."><input {...d('mfgFax')} /></Field>
          </div>
          <Field label="Contact No." required>
            <input {...d('mfgContact')} />
            <WarnHint>STD code(s) to be given with contact numbers</WarnHint>
          </Field>
        </div>
      </div>

      <div className="card">
        <div className="section-header">Address for Correspondence</div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="sameAsMfg" checked={data.sameAsManufacturing || false}
              onChange={e => { set('sameAsManufacturing', e.target.checked); if (e.target.checked) copyFromManufacturing(); }}
              disabled={isSubmitted} />
            <label htmlFor="sameAsMfg" className="text-sm text-gray-700 cursor-pointer">Same as Manufacturing Unit Address</label>
          </div>
          <Field label="Email" required><input type="email" {...d('corrEmail')} /></Field>
          <Field label="Address" required>
            <textarea className="input" value={data.corrAddress || ''} onChange={e => set('corrAddress', e.target.value)} disabled={isSubmitted} rows={3} />
          </Field>
          <div className="form-row">
            <Field label="Country" required>
              <Select value={data.corrCountry} onChange={v => set('corrCountry', v)} options={COUNTRIES} />
            </Field>
            <Field label="State/Province" required>
              <Select value={data.corrState} onChange={v => set('corrState', v)} options={INDIAN_STATES} />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Zip Code" required>
              <input {...d('corrZip')} />
              <WarnHint>Zip Code is Mandatory</WarnHint>
            </Field>
            <Field label="Fax No."><input {...d('corrFax')} /></Field>
          </div>
          <Field label="Contact No." required><input {...d('corrContact')} /></Field>
        </div>
      </div>

      <div className="card">
        <div className="section-header">Correspondence Address</div>
        <div className="p-6 space-y-4">
          <Field label="Correspondence Address" required>
            <div className="flex items-center gap-6">
              {['Office', 'Manufacturing Unit'].map(opt => (
                <label key={opt} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="radio" name="correspondenceSelection" checked={(data.correspondenceSelection || 'Office') === opt}
                    onChange={() => set('correspondenceSelection', opt)} disabled={isSubmitted} />
                  {opt}
                </label>
              ))}
            </div>
          </Field>

          <Field label="Address Authentication of Manufacturing Unit" required hint={ADDR_PROOF_HINT}>
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1 mb-2 inline-block">(.pdf file of max 10 MB)</p>
            <FileUpload fieldKey="address_auth_doc" fieldLabel="Address Authentication"
              accept={PDF_ONLY} acceptLabel="PDF" maxSizeMB={10}
              existingDoc={getDocForField('address_auth_doc')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
          </Field>

          <Field label="Type of Document" required>
            <input {...d('addrProofDocType')} />
          </Field>
        </div>
      </div>
    </div>
  );
}
