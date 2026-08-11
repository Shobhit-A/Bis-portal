import React from 'react';
import { Select, FileUpload } from '../../../components/FormField';

const ROWS = [
  { no: 1, label: 'Authorization from factory CEO/MD/Head for filling and signing Form-1.', required: true, type: 'file', fieldKey: 'uploads_ceo_auth', fieldLabel: 'CEO/MD/Head Authorization' },
  { no: 2, label: 'Raw Materials/Components', required: true, type: 'file', fieldKey: 'uploads_raw_materials', fieldLabel: 'Raw Materials/Components' },
  { no: 3, label: 'Authorization letter from CEO/top management of AIR firm towards the authorized signatory for signing and executing affidavit.', required: true, type: 'file', fieldKey: 'uploads_air_ceo_auth', fieldLabel: 'AIR CEO Authorization' },
  { no: 4, label: 'Does the manufacturing unit have complete testing facility installed in-house for ascertaining the conformity of product as per Indian Standard ?', required: true, type: 'yesno', dataKey: 'inHouseTesting' },
  { no: 5, label: 'Does the manufacturing unit have complete manufacturing facility for the product and its models, series, type, grade, class, size, rating, etc. for which the registration is applied for ?', required: true, type: 'yesno', dataKey: 'completeManufacturing' },
  { no: 6, label: 'ID card of authorized signatory of AIR', required: true, type: 'file', fieldKey: 'uploads_air_id_card', fieldLabel: 'AIR Signatory ID Card' },
  { no: 7, label: 'Other document, if required', required: false, type: 'file', fieldKey: 'uploads_other', fieldLabel: 'Other Document' },
  { no: 8, label: 'Factory Address Proof/ Business license', required: true, type: 'file', fieldKey: 'uploads_factory_proof', fieldLabel: 'Factory Address Proof / Business License' },
];

export default function UploadDocuments({ formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  const data = formData.uploads || {};
  const set = (key, val) => updateSection('uploads', { ...data, [key]: val });

  return (
    <div className="space-y-6">
      <div className="card overflow-hidden">
        <div className="section-header">Upload Document</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-blue-50 text-gray-700">
                <th className="px-4 py-2.5 text-left font-semibold border-b border-border w-16">S. No</th>
                <th className="px-4 py-2.5 text-left font-semibold border-b border-border">Document Name</th>
                <th className="px-4 py-2.5 text-left font-semibold border-b border-border w-40">Document Type</th>
                <th className="px-4 py-2.5 text-left font-semibold border-b border-border w-64">Upload Files</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(row => (
                <tr key={row.no} className="border-t border-border">
                  <td className="px-4 py-3 align-top text-gray-500">{row.no}</td>
                  <td className="px-4 py-3 align-top text-gray-800">
                    {row.label} {row.required && <span className="text-red-500">*</span>}
                  </td>
                  <td className="px-4 py-3 align-top">
                    {row.type === 'yesno' ? (
                      <Select value={data[row.dataKey]} onChange={v => set(row.dataKey, v)} options={['Yes', 'No']} />
                    ) : (
                      <span className="text-gray-500 text-sm">Upload File</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    {row.type === 'yesno' ? (
                      <span className="text-gray-500 text-sm">Details not required</span>
                    ) : (
                      <FileUpload fieldKey={row.fieldKey} fieldLabel={row.fieldLabel}
                        existingDoc={getDocForField(row.fieldKey)} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
