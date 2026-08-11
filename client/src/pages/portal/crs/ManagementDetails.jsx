import React from 'react';
import { RepeatingTable } from '../../../components/RepeatingTable';

const MGMT_COLUMNS = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'designation', label: 'Designation', type: 'text' },
];

// Default rows use fixed literal ids ('top-1'/'tech-1'), not crypto.randomUUID() —
// this fallback runs on every render when the section has no saved rows yet, and a
// fresh randomUUID() each render would change the row's React key every render,
// breaking focus/input stability. Once the user edits a cell, onChange persists the
// row into formData with this same fixed id, so it only "generates" once in practice.
ManagementDetails.isComplete = (formData) => {
  const d = formData.management || {};
  const missing = [];
  if (!(d.topRows || []).some(r => r.name && r.designation)) missing.push('Top Management Details');
  if (!(d.techRows || []).some(r => r.name && r.designation)) missing.push('Technical Management Details');
  return missing;
};

export default function ManagementDetails({ formData, updateSection, isSubmitted }) {
  const data = formData.management || {};
  const set = (key, val) => updateSection('management', { ...data, [key]: val });
  const topRows = data.topRows && data.topRows.length > 0 ? data.topRows : [{ id: 'top-1' }];
  const techRows = data.techRows && data.techRows.length > 0 ? data.techRows : [{ id: 'tech-1' }];

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">Top Management Details</div>
        <div className="p-6">
          <RepeatingTable sectionKey="management" columns={MGMT_COLUMNS} rows={topRows}
            onChange={rows => set('topRows', rows)} protectFirstRow isSubmitted={isSubmitted} />
        </div>
      </div>

      <div className="card">
        <div className="section-header">Technical Management Details</div>
        <div className="p-6">
          <RepeatingTable sectionKey="management" columns={MGMT_COLUMNS} rows={techRows}
            onChange={rows => set('techRows', rows)} protectFirstRow isSubmitted={isSubmitted} />
        </div>
      </div>
    </div>
  );
}
