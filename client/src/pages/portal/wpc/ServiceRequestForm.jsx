import React from 'react';
import { Field, FileUpload } from '../../../components/FormField';
import { RepeatingTable } from '../../../components/RepeatingTable';

const SAMPLE_COLUMNS = [
  { key: 'sampleDetails', label: 'Sample Details', type: 'text' },
  { key: 'noOfSamples', label: 'No. of Samples', type: 'number' },
  { key: 'qty', label: 'Qty.', type: 'text' },
  { key: 'testsRequired', label: 'Test(s) Required (complete tests)', type: 'text' },
  { key: 'protocolIS', label: 'Protocol to be used/IS', type: 'text' },
];

ServiceRequestForm.isComplete = (formData, getDocForField) => {
  const d = formData.serviceRequest || {};
  const missing = [];
  if (!d.manufacturerName) missing.push('Manufacturer/Factory Name');
  if (!d.reportIssuedTo) missing.push('Report to be Issued in the Name & Address');
  if (!d.billToAddress) missing.push('Bill to be issued in the Name & Address with GST Number');
  if (!d.deliveryOfReports) missing.push('Delivery of Reports');
  const sampleOk = (d.sampleRows || []).some(r => r.sampleDetails && r.noOfSamples && r.qty && r.testsRequired);
  if (!sampleOk) missing.push('Sample Details');
  if (!d.signatoryName) missing.push('Name & Signature');
  if (!d.signDate) missing.push('Date');
  return missing;
};

export default function ServiceRequestForm({ formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  const data = formData.serviceRequest || {};
  const set = (key, val) => updateSection('serviceRequest', { ...data, [key]: val });
  const d = (key) => ({ value: data[key] || '', onChange: e => set(key, e.target.value), disabled: isSubmitted, className: 'input' });
  const sampleRows = data.sampleRows || [{ id: 'row-1' }];

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">Service Request Form</div>
        <div className="p-6 space-y-4">
          <Field label="Manufacturer/Factory Name" required><input {...d('manufacturerName')} /></Field>
          <Field label="Report to be Issued in the Name & Address" required>
            <textarea className="input" rows={2} value={data.reportIssuedTo || ''} onChange={e => set('reportIssuedTo', e.target.value)} disabled={isSubmitted} />
          </Field>
          <Field label="Bill to be issued in the Name & Address with GST Number" required>
            <textarea className="input" rows={2} value={data.billToAddress || ''} onChange={e => set('billToAddress', e.target.value)} disabled={isSubmitted} />
          </Field>
          <Field label="Delivery of Reports" required><input {...d('deliveryOfReports')} /></Field>
        </div>
      </div>

      <div className="card">
        <div className="section-header">Sample Details</div>
        <div className="p-6">
          <RepeatingTable sectionKey="serviceRequest" columns={SAMPLE_COLUMNS} rows={sampleRows}
            onChange={rows => set('sampleRows', rows)} isSubmitted={isSubmitted} />
        </div>
      </div>

      <div className="card">
        <div className="section-header">Product Details</div>
        <div className="p-6 space-y-4">
          <div className="form-row">
            <Field label="Product"><input {...d('product')} /></Field>
            <Field label="Model No."><input {...d('modelNo')} /></Field>
          </div>
          <div className="form-row">
            <Field label="Model Name"><input {...d('modelName')} /></Field>
            <Field label="Brand"><input {...d('brand')} /></Field>
          </div>
          <div className="form-row">
            <Field label="Input Current" hint="in A"><input {...d('inputCurrent')} /></Field>
            <Field label="Output Current"><input {...d('outputCurrent')} /></Field>
          </div>
          <div className="form-row">
            <Field label="Input Voltage" hint="in V"><input {...d('inputVoltage')} /></Field>
            <Field label="Output Voltage"><input {...d('outputVoltage')} /></Field>
          </div>
          <div className="form-row">
            <Field label="Lead Model"><input {...d('leadModel')} /></Field>
            <Field label="Identification if any"><input {...d('identification')} /></Field>
          </div>
          <Field label="Any other Instruction">
            <textarea className="input" rows={2} value={data.otherInstruction || ''} onChange={e => set('otherInstruction', e.target.value)} disabled={isSubmitted} />
          </Field>
        </div>
      </div>

      <div className="card">
        <div className="section-header">Sign-off</div>
        <div className="p-6 space-y-4">
          <div className="form-row">
            <Field label="Name & Signature" required><input {...d('signatoryName')} /></Field>
            <Field label="Date" required><input type="date" {...d('signDate')} /></Field>
          </div>
          <Field label="Stamp (Upload)">
            <FileUpload fieldKey="serviceRequest_stamp" fieldLabel="Stamp"
              existingDoc={getDocForField('serviceRequest_stamp')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
          </Field>
        </div>
      </div>
    </div>
  );
}
