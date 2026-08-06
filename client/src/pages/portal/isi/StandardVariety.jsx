import React from 'react';
import { Field, Select } from '../../../components/FormField';
import { RepeatingTable } from '../../../components/RepeatingTable';

const VARIETY_COLUMNS = [
  { key: 'variety', label: 'Variety Applied For', type: 'text' },
  { key: 'doc', label: 'Supporting Document', type: 'file', fieldKeySuffix: 'variety' },
];

export default function StandardVariety({ formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  const data = formData.standard || {};
  const set = (key, val) => updateSection('standard', { ...data, [key]: val });

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">1. Indian Standard</div>
        <div className="p-6 space-y-4">
          <Field label="Do you know the Indian Standard applicable to your product?" required>
            <Select value={data.knowsStandard} onChange={v => set('knowsStandard', v)} options={['Yes', 'No']} />
          </Field>
          {data.knowsStandard === 'Yes' && (
            <Field label="Indian Standard" required hint="e.g. IS 10617:2018">
              <input className="input" value={data.indianStandard || ''} onChange={e => set('indianStandard', e.target.value)} disabled={isSubmitted} />
            </Field>
          )}
          {data.knowsStandard === 'No' && (
            <p className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded p-3">
              Absolute Veritas will help identify the applicable standard.
            </p>
          )}
          <Field label="Do you accept the Scheme of Inspection & Testing (SIT) specified by BIS w.r.t. frequency of testing and inspection?" required>
            <Select value={data.acceptsSIT} onChange={v => set('acceptsSIT', v)} options={['Yes', 'No']} />
          </Field>
        </div>
      </div>

      <div className="card">
        <div className="section-header">2. Product Variety</div>
        <div className="p-6">
          <RepeatingTable sectionKey="standard" columns={VARIETY_COLUMNS} rows={data.rows}
            onChange={rows => set('rows', rows)} getDocForField={getDocForField}
            onDocUploaded={onDocUploaded} onDocRemoved={onDocRemoved} isSubmitted={isSubmitted} />
        </div>
      </div>
    </div>
  );
}
