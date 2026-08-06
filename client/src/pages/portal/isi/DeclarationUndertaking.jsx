import React from 'react';
import { Field, Select, FileUpload } from '../../../components/FormField';

export default function DeclarationUndertaking({ formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted, onSubmit, submitting }) {
  const data = formData.declaration || {};
  const set = (key, val) => updateSection('declaration', { ...data, [key]: val });

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">1. Miscellaneous Declaration</div>
        <div className="p-6 space-y-4">
          <div className="form-row">
            <Field label="Any Statutory Permissions required for the product category?" required>
              <Select value={data.statutoryPermissions} onChange={v => set('statutoryPermissions', v)} options={['Yes', 'No', 'NA']} />
            </Field>
            {data.statutoryPermissions === 'Yes' && (
              <Field label="Upload Statutory Permission Documents" hint="PDF copy required">
                <FileUpload fieldKey="declaration_statutory_docs" fieldLabel="Statutory Permission Documents"
                  existingDoc={getDocForField('declaration_statutory_docs')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
              </Field>
            )}
          </div>
          <div className="form-row">
            <Field label="Does the firm intend to provide any other information?" required>
              <Select value={data.otherInfo} onChange={v => set('otherInfo', v)} options={['Yes', 'No']} />
            </Field>
            {data.otherInfo === 'Yes' && (
              <Field label="Upload Supporting Documents">
                <FileUpload fieldKey="declaration_other_info" fieldLabel="Other Information Documents"
                  existingDoc={getDocForField('declaration_other_info')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
              </Field>
            )}
          </div>
          <div className="form-row">
            <Field label="Does the firm intend to submit any other request for consideration?" required>
              <Select value={data.otherRequest} onChange={v => set('otherRequest', v)} options={['Yes', 'No']} />
            </Field>
            {data.otherRequest === 'Yes' && (
              <Field label="Upload Supporting Documents">
                <FileUpload fieldKey="declaration_other_request" fieldLabel="Other Request Documents"
                  existingDoc={getDocForField('declaration_other_request')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
              </Field>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-header">2. Application Submission Details</div>
        <div className="p-6 space-y-4">
          <Field label="Name of the Person Submitting Application" required>
            <input className="input" value={data.submitterName || ''} onChange={e => set('submitterName', e.target.value)} disabled={isSubmitted} />
          </Field>
          <Field label="Designation of the Person Submitting Application" required>
            <input className="input" value={data.submitterDesignation || ''} onChange={e => set('submitterDesignation', e.target.value)} disabled={isSubmitted} />
          </Field>
          <Field label="Authorization Letter of Person Submitting Application" required hint="If applicable">
            <FileUpload fieldKey="declaration_auth_letter" fieldLabel="Authorization Letter"
              existingDoc={getDocForField('declaration_auth_letter')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
          </Field>
        </div>
      </div>

      <div className="card">
        <div className="section-header">3. Working Days & Weekly Off</div>
        <div className="p-6 space-y-4">
          <div className="form-row">
            <Field label="Weekly Off?" required>
              <Select value={data.weeklyOff} onChange={v => set('weeklyOff', v)} options={['Yes', 'No']} />
            </Field>
            {data.weeklyOff === 'Yes' && (
              <Field label="Days (if Yes)" required>
                <input className="input" placeholder="e.g. Sunday, Saturday" value={data.weeklyOffDays || ''} onChange={e => set('weeklyOffDays', e.target.value)} disabled={isSubmitted} />
              </Field>
            )}
          </div>
        </div>
      </div>

      <div className="card border-primary/30">
        <div className="p-6">
          <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm text-blue-800 mb-6">
            I/We hereby declare that the information furnished above is true and correct to the best of my/our knowledge and belief.
          </div>
          <Field label="Authorised Signatory Name" required>
            <input className="input" value={data.signatoryName || ''} onChange={e => set('signatoryName', e.target.value)} disabled={isSubmitted} />
          </Field>
          <Field label="Date" required>
            <input className="input" type="date" value={data.signDate || ''} onChange={e => set('signDate', e.target.value)} disabled={isSubmitted} />
          </Field>

          {!isSubmitted && (
            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-start gap-3 mb-4">
                <input type="checkbox" id="confirm" className="mt-0.5" checked={data.confirmed || false} onChange={e => set('confirmed', e.target.checked)} />
                <label htmlFor="confirm" className="text-sm text-gray-700 cursor-pointer">
                  I confirm that all information provided is accurate and all required documents have been uploaded.
                </label>
              </div>
              <button onClick={onSubmit} disabled={submitting || !data.confirmed} className="btn-primary bg-green-600 hover:bg-green-700 w-full py-3 text-base">
                {submitting ? 'Submitting...' : '✓ Submit Form to Absolute Veritas'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
