import React from 'react';
import { Field, FileUpload } from '../../../components/FormField';

const DOCUMENTS = [
  { no: 1, doc: 'Address Proof (Registered Office)', requirement: 'Mandatory' },
  { no: 2, doc: 'GST Certificate', requirement: 'Mandatory' },
  { no: 3, doc: 'Proof of Establishment of Firm (Business Licence / Incorporation)', requirement: 'Mandatory' },
  { no: 4, doc: 'Business Licence (Company Incorporation Certificate)', requirement: 'Mandatory' },
  { no: 5, doc: 'Address Proof (Factory / Manufacturing Unit)', requirement: 'Mandatory' },
  { no: 6, doc: 'Supporting Docs of Product Variety', requirement: 'Optional' },
  { no: 7, doc: 'Qualification Document & Photograph of Technical Manager', requirement: 'Mandatory' },
  { no: 8, doc: 'Process Flowchart covering all Manufacturing Processes', requirement: 'Mandatory' },
  { no: 9, doc: 'Layout Plan of Factory', requirement: 'Mandatory' },
  { no: 10, doc: 'Manufacturing Machinery List', requirement: 'Mandatory' },
  { no: 11, doc: 'Trademark Registration Details (Certification & Declaration)', requirement: 'Mandatory' },
  { no: 12, doc: 'List of Testing Equipment', requirement: 'Mandatory' },
  { no: 13, doc: 'In-House Test Report for the Product', requirement: 'Mandatory' },
  { no: 14, doc: 'Agreement with Manufacturing Unit for Outsourcing', requirement: 'Mandatory' },
  { no: 15, doc: 'Controls on Outsourced Process & Product on Receipt (IQC docs)', requirement: 'Mandatory' },
  { no: 16, doc: 'Test Report / Test Certificate (from BIS / BIS Recognised / Empanelled Lab)', requirement: 'Mandatory' },
  { no: 17, doc: 'Statutory Permissions required for the Product Category', requirement: 'Optional' },
  { no: 18, doc: 'Authorization Letter of Person Submitting the Application', requirement: 'Mandatory' },
  { no: 19, doc: 'Form of Label(s) (Nature of Packaging)', requirement: 'Mandatory' },
  { no: 20, doc: 'Payment Receipt', requirement: 'Mandatory' },
  { no: 21, doc: 'Scope of License', requirement: 'Mandatory' },
  { no: 22, doc: 'List of Models to be covered in BIS Certification', requirement: 'Mandatory' },
  { no: 23, doc: 'Quality Assurance System (Quality Manual)', requirement: 'Mandatory' },
  { no: 24, doc: 'Drawing of Product', requirement: 'Mandatory' },
  { no: 25, doc: 'Calibration Certificates (for testing equipment)', requirement: 'Mandatory' },
  { no: 26, doc: 'Location Plan of Factory (Google Coordinates / Map)', requirement: 'Mandatory' },
  { no: 27, doc: 'Undertaking (Acceptance of Marking Fee & STI)', requirement: 'Mandatory' },
  { no: 28, doc: 'Declaration', requirement: 'Mandatory' },
  { no: 29, doc: 'Undertaking for Arrangement of Water / Electricity', requirement: 'Mandatory' },
  { no: 30, doc: 'Weekly Off Declaration (Working Days)', requirement: 'Mandatory' },
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
                      <td className={`px-2 py-1.5 ${d.requirement === 'Mandatory' ? 'text-red-600' : 'text-gray-500'}`}>
                        {d.requirement}
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          className="text-xs border border-border rounded px-1 py-0.5 bg-white"
                          value={status || ''}
                          onChange={e => setStatus(d.no, e.target.value)}
                          disabled={isSubmitted}
                        >
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
