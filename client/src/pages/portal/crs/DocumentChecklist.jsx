import React from 'react';
import { Field, FileUpload } from '../../../components/FormField';

const DOCUMENTS = [
  { no: 1, doc: 'Brand Registration Certificate(s)', requirement: 'Mandatory' },
  { no: 2, doc: 'Brand Authorization Letter (only when the brand is declared as owned by Others)', requirement: 'Optional' },
  { no: 3, doc: 'Authorization from Factory CEO/MD/Head for Filling and Signing Form-1', requirement: 'Mandatory' },
  { no: 4, doc: 'Authorization Letter from CEO/Top Management of AIR Firm', requirement: 'Mandatory' },
  { no: 5, doc: 'ID Card of Authorized Signatory of AIR', requirement: 'Mandatory' },
  { no: 6, doc: 'Raw Materials/Components', requirement: 'Mandatory' },
];

export default function DocumentChecklist({ formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  const statuses = formData.checklist || {};
  const setStatus = (docNo, status) => updateSection('checklist', { ...statuses, [String(docNo)]: status });
  const providedCount = DOCUMENTS.filter(d => statuses[String(d.no)] === 'Provided').length;

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">Document Checklist</div>
        <div className="p-6">
          <div className="text-sm font-medium text-gray-700 mb-4">
            {providedCount} of {DOCUMENTS.length} documents marked as Provided
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-border rounded">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="px-2 py-1.5 text-left">S.No.</th>
                  <th className="px-2 py-1.5 text-left">Document</th>
                  <th className="px-2 py-1.5 text-left">Requirement</th>
                  <th className="px-2 py-1.5 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {DOCUMENTS.map((d, idx) => {
                  const status = statuses[String(d.no)];
                  let rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50';
                  if (status === 'Provided') rowBg = 'bg-green-50';
                  else if (status === 'Pending') rowBg = 'bg-yellow-50';
                  return (
                    <tr key={d.no} className={`${rowBg} border-t border-border`}>
                      <td className="px-2 py-1.5">{d.no}</td>
                      <td className="px-2 py-1.5">{d.doc}</td>
                      <td className={`px-2 py-1.5 ${d.requirement === 'Mandatory' ? 'text-red-600' : 'text-gray-500'}`}>{d.requirement}</td>
                      <td className="px-2 py-1.5">
                        <select className="text-xs border border-border rounded px-1 py-0.5 bg-white" value={status || ''}
                          onChange={e => setStatus(d.no, e.target.value)} disabled={isSubmitted}>
                          <option value="">Select</option>
                          <option value="Provided">Provided</option>
                          <option value="Pending">Pending</option>
                          <option value="Not Applicable">Not Applicable</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-3">Other documents may be required.</p>
          <div className="mt-6">
            <Field label="Miscellaneous Document" hint="Any other supporting document not covered above — included with the rest when documents are downloaded.">
              <FileUpload fieldKey="checklist_misc" fieldLabel="Miscellaneous Document"
                existingDoc={getDocForField('checklist_misc')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}
