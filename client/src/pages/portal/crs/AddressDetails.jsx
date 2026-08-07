import React from 'react';
import { Field, Select, FileUpload } from '../../../components/FormField';
import { COUNTRIES } from '../tabs/OrganizationProfile';

const ADDR_PROOF_HINT = 'For proof of name and address of manufacturing unit, kindly upload a valid government issued document in which name and address of the manufacturing unit is clearly reflected along with reflection of manufacturing activity for products related to Registration Scheme. Documents like ISO certificates may be submitted in addition, if scope of manufacturing is not clear from the above document. However, an ISO document alone will not be accepted for address proof.';

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
            <Field label="State/Province" required><input {...d('mfgState')} /></Field>
          </div>
          <div className="form-row">
            <Field label="Zip Code" required hint="Zip Code is Mandatory"><input {...d('mfgZip')} /></Field>
            <Field label="Fax No."><input {...d('mfgFax')} /></Field>
          </div>
          <Field label="Contact No." required hint="STD code(s) to be given with contact numbers"><input {...d('mfgContact')} /></Field>
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
            <Field label="State/Province" required><input {...d('corrState')} /></Field>
          </div>
          <div className="form-row">
            <Field label="Zip Code" required><input {...d('corrZip')} /></Field>
            <Field label="Fax No."><input {...d('corrFax')} /></Field>
          </div>
          <Field label="Contact No." required><input {...d('corrContact')} /></Field>
        </div>
      </div>

      <div className="card">
        <div className="section-header">Correspondence Address Selection</div>
        <div className="p-6">
          <Field label="Correspondence Address" required>
            <Select value={data.correspondenceSelection || 'Office'} onChange={v => set('correspondenceSelection', v)} options={['Office', 'Manufacturing Unit']} />
          </Field>
        </div>
      </div>

      <div className="card">
        <div className="section-header">Document Upload</div>
        <div className="p-6">
          <Field label="Address Authentication of Manufacturing Unit" required hint={ADDR_PROOF_HINT}>
            <FileUpload fieldKey="address_auth_doc" fieldLabel="Address Authentication"
              existingDoc={getDocForField('address_auth_doc')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
          </Field>
        </div>
      </div>
    </div>
  );
}
