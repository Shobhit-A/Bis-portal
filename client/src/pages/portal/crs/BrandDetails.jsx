import React from 'react';
import { RepeatingTable } from '../../../components/RepeatingTable';

const BRAND_COLUMNS = [
  { key: 'brandName', label: 'Brand Name', type: 'text' },
  { key: 'cert', label: 'Brand Registration Certificate', type: 'file', fieldKeySuffix: 'cert' },
  { key: 'ownedBy', label: 'Owned By', type: 'select', options: ['Self', 'Others'] },
  { key: 'registered', label: 'Is Brand Name/Trade Mark Registered?', type: 'select', options: ['Registered', 'Unregistered', 'Applied For'] },
  { key: 'registrationDate', label: 'Registration Date', type: 'date' },
];

BrandDetails.isComplete = (formData, getDocForField) => {
  const d = formData.brand || {};
  const rowOk = (d.rows || []).some(r =>
    r.brandName && r.ownedBy && r.registered && r.registrationDate && getDocForField(`brand_cert_${r.id}`));
  return rowOk ? [] : ['Brand Details'];
};

export default function BrandDetails({ formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  const data = formData.brand || {};
  const set = (key, val) => updateSection('brand', { ...data, [key]: val });

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">Brand Details</div>
        <div className="p-6">
          <RepeatingTable sectionKey="brand" columns={BRAND_COLUMNS} rows={data.rows}
            onChange={rows => set('rows', rows)} getDocForField={getDocForField}
            onDocUploaded={onDocUploaded} onDocRemoved={onDocRemoved} isSubmitted={isSubmitted} />
        </div>
      </div>
    </div>
  );
}
