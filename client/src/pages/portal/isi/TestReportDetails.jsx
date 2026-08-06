import React from 'react';
import { Field, Select, FileUpload } from '../../../components/FormField';
import { RepeatingTable } from '../../../components/RepeatingTable';

const VARIETY_COLUMNS = [
  { key: 'description', label: 'Product Variety Description', type: 'text' },
  { key: 'isNo', label: 'IS No.', type: 'text' },
  { key: 'sampleCode', label: 'Sample Code', type: 'text' },
  { key: 'issueDate', label: 'Test Report Issue Date', type: 'date' },
  { key: 'delayReason', label: 'Reason for Delay (if older than 90/180 days)', type: 'text' },
  { key: 'report', label: 'Test Report', type: 'file', fieldKeySuffix: 'variety' },
  { key: 'complete', label: 'Test Report Complete?', type: 'select', options: ['Yes', 'No'] },
  { key: 'conformity', label: 'Conformity of Sample as per IS?', type: 'select', options: ['Yes', 'No'] },
];

const RAWMAT_COLUMNS = [
  { key: 'description', label: 'Raw Material Description', type: 'text' },
  { key: 'report', label: 'Test Report/Certificate', type: 'file', fieldKeySuffix: 'rawmat' },
  { key: 'complete', label: 'Complete?', type: 'select', options: ['Yes', 'No'] },
  { key: 'conformity', label: 'Conformity of Sample as per IS?', type: 'select', options: ['Yes', 'No'] },
];

export default function TestReportDetails({ formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  const data = formData.testReport || {};
  const set = (key, val) => updateSection('testReport', { ...data, [key]: val });
  const d = (key) => ({ value: data[key] || '', onChange: e => set(key, e.target.value), disabled: isSubmitted, className: 'input' });

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">A. Product Test Reports</div>
        <div className="p-6">
          <RepeatingTable sectionKey="testReport" columns={VARIETY_COLUMNS} rows={data.varietyRows}
            onChange={rows => set('varietyRows', rows)} getDocForField={getDocForField}
            onDocUploaded={onDocUploaded} onDocRemoved={onDocRemoved} isSubmitted={isSubmitted} />
        </div>
      </div>

      <div className="card">
        <div className="section-header">A1. Long Duration Tests</div>
        <div className="p-6 space-y-4">
          <Field label="Is a long duration test applicable for the product?" required>
            <Select value={data.ldtApplicable} onChange={v => set('ldtApplicable', v)} options={['Yes', 'No']} />
          </Field>
          {data.ldtApplicable === 'Yes' && (
            <>
              <Field label="Has the firm NOT uploaded the Long Duration Test Report and is opting for relaxation per the Guidelines for Grant of Licence?" required>
                <Select value={data.ldtRelaxation} onChange={v => set('ldtRelaxation', v)} options={['Yes', 'No']} />
              </Field>
              {data.ldtRelaxation === 'Yes' && (
                <Field label="Undertaking (per Guidelines Annex III)" required>
                  <FileUpload fieldKey="testReport_ldt_undertaking" fieldLabel="LDT Relaxation Undertaking"
                    existingDoc={getDocForField('testReport_ldt_undertaking')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
                </Field>
              )}
              <div className="form-row">
                <Field label="Clause No. of IS"><input {...d('ldtClauseNo')} /></Field>
                <Field label="Long Duration Test Specified"><input {...d('ldtSpecified')} /></Field>
              </div>
              <div className="form-row">
                <Field label="Name of Lab where Test is in Progress"><input {...d('ldtLabName')} /></Field>
                <Field label="Date Test Report Likely to be Available"><input type="date" {...d('ldtExpectedDate')} /></Field>
              </div>
              <div className="form-row">
                <Field label="In-House Test Report">
                  <FileUpload fieldKey="testReport_ldt_inhouse" fieldLabel="LDT In-House Test Report"
                    existingDoc={getDocForField('testReport_ldt_inhouse')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
                </Field>
                <Field label="Test Report on Receipt from Lab">
                  <FileUpload fieldKey="testReport_ldt_lab_report" fieldLabel="LDT Lab Test Report"
                    existingDoc={getDocForField('testReport_ldt_lab_report')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
                </Field>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <div className="section-header">B. Raw Material Conformity</div>
        <div className="p-6 space-y-4">
          <Field label="Does the applicable Indian Standard require raw material conformity?" required>
            <Select value={data.rawMatRequired} onChange={v => set('rawMatRequired', v)} options={['Yes', 'No']} />
          </Field>
          {data.rawMatRequired === 'Yes' && (
            <RepeatingTable sectionKey="testReport" columns={RAWMAT_COLUMNS} rows={data.rawMatRows}
              onChange={rows => set('rawMatRows', rows)} getDocForField={getDocForField}
              onDocUploaded={onDocUploaded} onDocRemoved={onDocRemoved} isSubmitted={isSubmitted} />
          )}
        </div>
      </div>
    </div>
  );
}
