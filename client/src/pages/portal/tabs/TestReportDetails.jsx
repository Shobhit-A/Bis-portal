import React from 'react';
import { Field, Select, FileUpload } from '../../../components/FormField';

TestReportDetails.isComplete = (formData, getDocForField) => {
  const d = formData.testReport || {};
  const missing = [];
  if (!getDocForField('testReport_inhouse')) missing.push('In House Test Report');
  if (!d.rawMaterialConformity) missing.push('Raw Material Conformity question');
  if (d.rawMaterialConformity === 'Yes' && !getDocForField('testReport_raw_material_conformity')) missing.push('Raw Material Conformity Test Report');
  return missing;
};

export default function TestReportDetails({ formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  const data = formData.testReport || {};
  const set = (key, val) => updateSection('testReport', { ...data, [key]: val });

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">Test Report - Details</div>
        <div className="p-6">
          <div className="text-sm font-medium text-gray-700 mb-4">Test Report</div>
          <div className="space-y-6">
            <Field label="A) In House Test Report For The Product" required hint="In the Format as per Form IV in Scheme I of Regulations">
              <FileUpload fieldKey="testReport_inhouse" fieldLabel="In House Test Report"
                existingDoc={getDocForField('testReport_inhouse')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
            </Field>

            <Field label="B) For Raw Material (Used in Finished Product Sample Lot) — If Indian Standard requires raw material conformity" required>
              <Select value={data.rawMaterialConformity} onChange={v => set('rawMaterialConformity', v)} options={['Yes', 'No']} />
            </Field>
            {data.rawMaterialConformity === 'Yes' && (
              <Field label="Raw Material Conformity Test Report" required>
                <FileUpload fieldKey="testReport_raw_material_conformity" fieldLabel="Raw Material Conformity Test Report"
                  existingDoc={getDocForField('testReport_raw_material_conformity')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
              </Field>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
