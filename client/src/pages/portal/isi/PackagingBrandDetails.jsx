import React from 'react';
import { RepeatingTable } from '../../../components/RepeatingTable';

const PACKAGING_COLUMNS = [
  { key: 'nature', label: 'Nature of Packaging', type: 'text' },
  { key: 'marking', label: 'Marking on Article', type: 'text' },
  { key: 'method', label: 'Method of Marking', type: 'text' },
  { key: 'qtyPerPackage', label: 'Quantity per Package', type: 'number' },
  { key: 'label', label: 'Form of Label(s)', type: 'file', fieldKeySuffix: 'label' },
  { key: 'batchNumbering', label: 'Batch/Code/Serial Numbering', type: 'text' },
];

const BRAND_COLUMNS = [
  { key: 'brandName', label: 'Brand Name / Trademark', type: 'text' },
  { key: 'ownedBy', label: 'Owned By', type: 'select', options: ['Self', 'Others'] },
  { key: 'regStatus', label: 'Registered/Unregistered', type: 'select', options: ['Registered', 'Unregistered'] },
  { key: 'regDate', label: 'Date of Registration/Introduction', type: 'date' },
  { key: 'cert', label: 'Trademark Certificate', type: 'file', fieldKeySuffix: 'brand' },
];

export default function PackagingBrandDetails({ formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  const data = formData.packagingBrand || {};
  const set = (key, val) => updateSection('packagingBrand', { ...data, [key]: val });

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">1. Packaging & Marking Details</div>
        <div className="p-6">
          <RepeatingTable sectionKey="packagingBrand" columns={PACKAGING_COLUMNS} rows={data.packagingRows}
            onChange={rows => set('packagingRows', rows)} getDocForField={getDocForField}
            onDocUploaded={onDocUploaded} onDocRemoved={onDocRemoved} isSubmitted={isSubmitted} />
        </div>
      </div>

      <div className="card">
        <div className="section-header">2. Brand Details</div>
        <div className="p-6">
          <RepeatingTable sectionKey="packagingBrand" columns={BRAND_COLUMNS} rows={data.brandRows}
            onChange={rows => set('brandRows', rows)} getDocForField={getDocForField}
            onDocUploaded={onDocUploaded} onDocRemoved={onDocRemoved} isSubmitted={isSubmitted} />
        </div>
      </div>
    </div>
  );
}
