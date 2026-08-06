import React from 'react';
import { Field } from '../../../components/FormField';
import { RepeatingTable } from '../../../components/RepeatingTable';

const TOP_COLUMNS = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'designation', label: 'Designation', type: 'text' },
  { key: 'contact', label: 'Contact No.', type: 'text' },
  { key: 'email', label: 'Email', type: 'text' },
  { key: 'din', label: 'DIN', type: 'text' },
];

const TECH_COLUMNS = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'designation', label: 'Designation', type: 'text' },
  { key: 'qualification', label: 'Qualification', type: 'text' },
  { key: 'qualDoc', label: 'Qualification Document', type: 'file', fieldKeySuffix: 'tech_qual' },
  { key: 'experience', label: 'Experience (Years)', type: 'number' },
  { key: 'photo', label: 'Photo', type: 'file', fieldKeySuffix: 'tech_photo' },
];

export default function ManagementDetails({ formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  const data = formData.management || {};
  const set = (key, val) => updateSection('management', { ...data, [key]: val });
  const d = (key) => ({ value: data[key] || '', onChange: e => set(key, e.target.value), disabled: isSubmitted, className: 'input' });

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">1. Top Management</div>
        <div className="p-6">
          <RepeatingTable sectionKey="management" columns={TOP_COLUMNS} rows={data.topRows}
            onChange={rows => set('topRows', rows)} getDocForField={getDocForField}
            onDocUploaded={onDocUploaded} onDocRemoved={onDocRemoved} isSubmitted={isSubmitted} />
        </div>
      </div>

      <div className="card">
        <div className="section-header">2. Correspondence Details</div>
        <div className="p-6 space-y-4">
          <div className="form-row">
            <Field label="Name of Contact Person" required><input {...d('contactName')} /></Field>
            <Field label="Designation of Contact Person" required><input {...d('contactDesignation')} /></Field>
          </div>
          <div className="form-row">
            <Field label="Contact No." required><input {...d('contactNumber')} /></Field>
            <Field label="Email" required><input type="email" {...d('contactEmail')} /></Field>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-header">3. Technical Management</div>
        <div className="p-6">
          <RepeatingTable sectionKey="management" columns={TECH_COLUMNS} rows={data.techRows}
            onChange={rows => set('techRows', rows)} getDocForField={getDocForField}
            onDocUploaded={onDocUploaded} onDocRemoved={onDocRemoved} isSubmitted={isSubmitted} />
        </div>
      </div>
    </div>
  );
}
