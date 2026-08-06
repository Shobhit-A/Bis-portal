import React from 'react';
import { Field, Select, FileUpload } from '../../../components/FormField';
import { RepeatingTable } from '../../../components/RepeatingTable';

const SUBCONTRACT_COLUMNS = [
  { key: 'clauseNo', label: 'Clause No. of IS', type: 'text' },
  { key: 'test', label: 'Test to be Sub-Contracted', type: 'text' },
  { key: 'consent', label: 'Consent Letter', type: 'file', fieldKeySuffix: 'subcontract' },
  { key: 'labName', label: 'Name of Lab (BIS Recognised/Empanelled)', type: 'text' },
];

export default function TestingInspection({ formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  const data = formData.testing || {};
  const set = (key, val) => updateSection('testing', { ...data, [key]: val });

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">1. In-House Testing</div>
        <div className="p-6 space-y-4">
          <Field label="Do you have in-house facility for complete testing of the product as per the Indian Standard?" required>
            <Select value={data.hasInHouse} onChange={v => set('hasInHouse', v)} options={['Yes', 'No']} />
          </Field>
        </div>
      </div>

      {data.hasInHouse === 'No' && (
        <div className="card">
          <div className="section-header">2. Subcontracted Testing</div>
          <div className="p-6">
            <RepeatingTable sectionKey="testing" columns={SUBCONTRACT_COLUMNS} rows={data.subcontractRows}
              onChange={rows => set('subcontractRows', rows)} getDocForField={getDocForField}
              onDocUploaded={onDocUploaded} onDocRemoved={onDocRemoved} isSubmitted={isSubmitted} />
          </div>
        </div>
      )}

      <div className="card">
        <div className="section-header">3. Testing Equipment</div>
        <div className="p-6">
          <Field label="List of Testing Equipment" required hint="Measuring instruments, chemicals, glassware, etc.">
            <FileUpload fieldKey="testing_equipment_list" fieldLabel="Testing Equipment List"
              existingDoc={getDocForField('testing_equipment_list')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
          </Field>
        </div>
      </div>
    </div>
  );
}
