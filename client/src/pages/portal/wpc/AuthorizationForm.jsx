import React from 'react';
import { Field, FileUpload } from '../../../components/FormField';

AuthorizationForm.isComplete = (formData, getDocForField) => {
  const d = formData.authorization || {};
  const missing = [];
  if (!d.manufacturerName) missing.push('Manufacturer Name');
  if (!d.manufacturerAddress) missing.push('Manufacturer Address');
  if (!d.repCompanyName) missing.push('Indian Representative Company Name');
  if (!d.repAddress) missing.push('Indian Representative Address');
  if (!d.model) missing.push('Model');
  if (!d.productName) missing.push('Product Name');
  if (!getDocForField('authorization_rf_test_reports')) missing.push('RF Test Reports');
  if (!getDocForField('authorization_lab_accreditation')) missing.push('Lab Accreditation Certificate');
  if (!d.mfgSignatoryName) missing.push('Manufacturer Authorized Representative Name');
  if (!d.mfgSignatoryDesignation) missing.push('Manufacturer Authorized Representative Designation');
  if (!d.mfgPlace) missing.push('Manufacturer Sign-off Place');
  if (!d.repSignatoryName) missing.push('Indian Representative Name');
  if (!d.repSignatoryDesignation) missing.push('Indian Representative Designation');
  if (!d.repPlace) missing.push('Indian Representative Sign-off Place');
  return missing;
};

export default function AuthorizationForm({ formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  const data = formData.authorization || {};
  const set = (key, val) => updateSection('authorization', { ...data, [key]: val });
  const d = (key) => ({ value: data[key] || '', onChange: e => set(key, e.target.value), disabled: isSubmitted, className: 'input' });

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded p-3">
        Authorization cum Agreement between the Manufacturer and the Indian Representative, appointing the
        representative to file an equipment type approval application with NRLO (WPC Wing) on the manufacturer's behalf.
      </p>

      <div className="card">
        <div className="section-header">Manufacturer</div>
        <div className="p-6 space-y-4">
          <Field label="Manufacturer's Name" required><input {...d('manufacturerName')} /></Field>
          <Field label="Address" required>
            <textarea className="input" rows={2} value={data.manufacturerAddress || ''} onChange={e => set('manufacturerAddress', e.target.value)} disabled={isSubmitted} />
          </Field>
        </div>
      </div>

      <div className="card">
        <div className="section-header">Indian Representative</div>
        <div className="p-6 space-y-4">
          <Field label="Indian Representative Company Name" required><input {...d('repCompanyName')} /></Field>
          <Field label="Address" required>
            <textarea className="input" rows={2} value={data.repAddress || ''} onChange={e => set('repAddress', e.target.value)} disabled={isSubmitted} />
          </Field>
        </div>
      </div>

      <div className="card">
        <div className="section-header">Equipment Details</div>
        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-500">
            The manufacturer wishes to obtain equipment type approval from the Northern Regional Licensing Office
            (NRLO), Wireless Planning &amp; Coordination (WPC) Wing, for the purpose of exporting the following item to India,
            and appoints the above Indian Representative to file the application on its behalf.
          </p>
          <div className="form-row">
            <Field label="Model" required><input {...d('model')} /></Field>
            <Field label="Product Name" required><input {...d('productName')} /></Field>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-header">Supporting Documents</div>
        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-500">
            The manufacturer declares and undertakes that the above equipment meets the attached specifications,
            and assumes sole responsibility for any misrepresentation or deviation in the RF technical parameters stated.
          </p>
          <Field label="RF Test Reports" required>
            <FileUpload fieldKey="authorization_rf_test_reports" fieldLabel="RF Test Reports"
              existingDoc={getDocForField('authorization_rf_test_reports')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
          </Field>
          <Field label="Lab Accreditation Certificate" required>
            <FileUpload fieldKey="authorization_lab_accreditation" fieldLabel="Lab Accreditation Certificate"
              existingDoc={getDocForField('authorization_lab_accreditation')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
          </Field>
        </div>
      </div>

      <div className="card">
        <div className="section-header">On behalf of Manufacturer</div>
        <div className="p-6 space-y-4">
          <div className="form-row">
            <Field label="Authorized Representative Name" required><input {...d('mfgSignatoryName')} /></Field>
            <Field label="Designation" required><input {...d('mfgSignatoryDesignation')} /></Field>
          </div>
          <Field label="Place" required><input {...d('mfgPlace')} /></Field>
          <Field label="Sign and Stamp (Upload)">
            <FileUpload fieldKey="authorization_mfg_sign_stamp" fieldLabel="Manufacturer Sign & Stamp"
              existingDoc={getDocForField('authorization_mfg_sign_stamp')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
          </Field>
        </div>
      </div>

      <div className="card">
        <div className="section-header">On behalf of Indian Representative</div>
        <div className="p-6 space-y-4">
          <div className="form-row">
            <Field label="Authorized Representative Name" required><input {...d('repSignatoryName')} /></Field>
            <Field label="Designation" required><input {...d('repSignatoryDesignation')} /></Field>
          </div>
          <Field label="Place" required><input {...d('repPlace')} /></Field>
          <Field label="Sign and Stamp (Upload)">
            <FileUpload fieldKey="authorization_rep_sign_stamp" fieldLabel="Indian Representative Sign & Stamp"
              existingDoc={getDocForField('authorization_rep_sign_stamp')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
          </Field>
        </div>
      </div>
    </div>
  );
}
