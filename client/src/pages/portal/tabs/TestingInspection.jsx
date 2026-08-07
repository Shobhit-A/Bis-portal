import React from 'react';
import { Field, Select, FileUpload } from '../../../components/FormField';
import { Plus, Trash2 } from 'lucide-react';

const LAB_OPTIONS = ['Lab of same group of company', 'BIS lab', 'BIS approved/empaneled lab', 'BIS licensee lab'];

const EXCEL_ACCEPT = { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'] };

export default function TestingInspection({ formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  const data = formData.testing || {};
  const set = (key, val) => updateSection('testing', { ...data, [key]: val });
  const subTests = data.subContractedTests || [{ clauseNo: '', testName: '', consentLetter: '', labName: '' }];

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">1. In-House Testing Facility</div>
        <div className="p-6 space-y-4">
          <Field label="Do you have in-house facility for complete testing of product as per Indian Standard?" required>
            <Select value={data.inHouseTesting} onChange={v => set('inHouseTesting', v)} options={['Yes', 'No']} />
          </Field>

          <div className="border border-yellow-200 bg-yellow-50 rounded p-4 space-y-4">
            <p className="text-xs text-yellow-700 font-medium">If No — Sub-Contracted Tests (Lab must be BIS Recognised or BIS Empanelled)</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-border rounded">
                <thead>
                  <tr className="bg-primary text-white">
                    {['Clause No. of IS *', 'Test to be Sub-Contracted *', 'Upload Consent Letter (filename) *', 'Name of Lab Intended for Sub-Contracting (BIS Recognised/Empanelled) *'].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                    ))}
                    {!isSubmitted && <th className="w-8 px-2"></th>}
                  </tr>
                </thead>
                <tbody>
                  {subTests.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-2 py-1.5 border-t border-border">
                        <input className="w-full bg-transparent text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 rounded px-1 py-0.5"
                          value={row.clauseNo || ''} onChange={e => set('subContractedTests', subTests.map((r, idx) => idx === i ? { ...r, clauseNo: e.target.value } : r))} disabled={isSubmitted} />
                      </td>
                      <td className="px-2 py-1.5 border-t border-border">
                        <input className="w-full bg-transparent text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 rounded px-1 py-0.5"
                          value={row.testName || ''} onChange={e => set('subContractedTests', subTests.map((r, idx) => idx === i ? { ...r, testName: e.target.value } : r))} disabled={isSubmitted} />
                      </td>
                      <td className="px-2 py-1.5 border-t border-border">
                        <div className="min-w-45">
                          <FileUpload fieldKey={`testing_consent_letter_${i}`} fieldLabel="Consent Letter"
                            existingDoc={getDocForField(`testing_consent_letter_${i}`)} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
                        </div>
                      </td>
                      <td className="px-2 py-1.5 border-t border-border">
                        <select className="w-full bg-transparent text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 rounded px-1 py-0.5"
                          value={row.labName || ''} onChange={e => set('subContractedTests', subTests.map((r, idx) => idx === i ? { ...r, labName: e.target.value } : r))} disabled={isSubmitted}>
                          <option value="">Select</option>
                          {LAB_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </td>
                      {!isSubmitted && <td className="px-2 py-1.5 border-t border-border"><button onClick={() => set('subContractedTests', subTests.filter((_, idx) => idx !== i))} className="text-gray-300 hover:text-red-500"><Trash2 size={13} /></button></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!isSubmitted && <button onClick={() => set('subContractedTests', [...subTests, { clauseNo: '', testName: '', consentLetter: '', labName: '' }])} className="text-xs text-primary hover:underline flex items-center gap-1"><Plus size={13} /> Add row</button>}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-header">2. List of Testing Equipment</div>
        <div className="p-6">
          <Field label="List of Testing Equipment (includes measuring instruments, chemicals, glassware etc.)" required hint="Excel file required — template provided by us">
            <FileUpload fieldKey="testing_equipment_list" fieldLabel="Testing Equipment List"
              accept={EXCEL_ACCEPT} acceptLabel="Excel (.xlsx, .xls)"
              existingDoc={getDocForField('testing_equipment_list')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
          </Field>
        </div>
      </div>
    </div>
  );
}
