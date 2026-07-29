import React from 'react';
import { Field, Select, FileUpload } from '../../../components/FormField';
import { Plus, Trash2 } from 'lucide-react';

export default function TestReportDetails({ formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  const data = formData.testReport || {};
  const set = (key, val) => updateSection('testReport', { ...data, [key]: val });
  const reports = data.productReports || [{ variety: '', qrCode: '', isNo: '', sampleCode: '', issueDate: '', delayReason: '', reportFile: '', complete: '', conformity: '' }];
  const rawReports = data.rawMaterialReports || [{ material: '', reportFile: '', complete: '', conformity: '' }];
  const longDurationRows = data.longDurationRows || [{ clauseNo: '', testSpecified: '', labName: '', likelyDate: '', inHouseReport: '', labReport: '' }];

  const updateReport = (arr, i, key, val, setter) => setter(arr.map((r, idx) => idx === i ? { ...r, [key]: val } : r));

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">1. Product Test Reports</div>
        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded p-3">
            A) For Product: Decision of acceptance of Test Reports beyond 90/180 days as applicable per Guidelines for grant of License rests with BIS.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-border rounded">
              <thead>
                <tr className="bg-primary text-white">
                  {['Product Variety Description *', 'QR Code', 'IS No. *', 'Sample Code *', 'Test Report Issue Date *', 'Reasons for Delay (if >90/180 days)', 'Test Report (write filename) *', 'Test Report Complete? *', 'Conformity of Sample as per IS *'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-medium whitespace-nowrap">{h}</th>
                  ))}
                  {!isSubmitted && <th className="w-8"></th>}
                </tr>
              </thead>
              <tbody>
                {reports.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {['variety', 'qrCode', 'isNo', 'sampleCode', 'issueDate', 'delayReason', 'reportFile', '', ''].map((key, ki) => (
                      <td key={ki} className="px-2 py-1.5 border-t border-border">
                        {key === '' && ki === 7 ? (
                          <select className="text-xs border border-border rounded px-1 py-0.5 bg-white" value={row.complete || ''} onChange={e => updateReport(reports, i, 'complete', e.target.value, r => set('productReports', r))} disabled={isSubmitted}>
                            <option value="">Select</option><option>Yes</option><option>No</option>
                          </select>
                        ) : key === '' && ki === 8 ? (
                          <select className="text-xs border border-border rounded px-1 py-0.5 bg-white" value={row.conformity || ''} onChange={e => updateReport(reports, i, 'conformity', e.target.value, r => set('productReports', r))} disabled={isSubmitted}>
                            <option value="">Select</option><option>Yes</option><option>No</option>
                          </select>
                        ) : (
                          <input className="w-full bg-transparent text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 rounded px-1 py-0.5 min-w-20"
                            type={key === 'issueDate' ? 'date' : 'text'} value={row[key] || ''} onChange={e => updateReport(reports, i, key, e.target.value, r => set('productReports', r))} disabled={isSubmitted} />
                        )}
                      </td>
                    ))}
                    {!isSubmitted && <td className="px-2 border-t border-border"><button onClick={() => set('productReports', reports.filter((_, idx) => idx !== i))} className="text-gray-300 hover:text-red-500"><Trash2 size={13} /></button></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!isSubmitted && <button onClick={() => set('productReports', [...reports, { variety: '', qrCode: '', isNo: '', sampleCode: '', issueDate: '', delayReason: '', reportFile: '', complete: '', conformity: '' }])} className="text-xs text-primary hover:underline flex items-center gap-1"><Plus size={13} /> Add report</button>}
          <Field label="Upload Test Reports" required hint="PDF Copy Required">
            <FileUpload fieldKey="testReport_product_files" fieldLabel="Product Test Reports"
              existingDoc={getDocForField('testReport_product_files')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
          </Field>
        </div>
      </div>

      <div className="card">
        <div className="section-header">2. Long Duration Tests</div>
        <div className="p-6 space-y-4">
          <div className="form-row">
            <Field label="A1) Is Long Duration Test applicable for this product?" required>
              <Select value={data.longDurationApplicable} onChange={v => set('longDurationApplicable', v)} options={['Yes', 'No']} />
            </Field>
            {data.longDurationApplicable === 'Yes' && (
              <Field label="If Yes — opting for relaxation as per Guidelines for Grant of License?">
                <Select value={data.longDurationRelaxation} onChange={v => set('longDurationRelaxation', v)} options={['Yes', 'No']} />
              </Field>
            )}
          </div>
          {data.longDurationApplicable === 'Yes' && (
            <Field label="If Yes — Undertaking for Long Duration Test (as per Guidelines for GOL – Annex III)" required>
              <input className="input" value={data.longDurationUndertakingFile || ''} onChange={e => set('longDurationUndertakingFile', e.target.value)} disabled={isSubmitted} />
            </Field>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-border rounded">
              <thead>
                <tr className="bg-primary text-white">
                  {['Clause No. of IS', 'Long Duration Test Specified', 'Name of Lab Where Test in Progress', 'Date Test Report Likely to be Available', 'Upload In-House Test Report (filename)', 'Test Report on Receipt from Lab (filename)'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-medium whitespace-nowrap">{h}</th>
                  ))}
                  {!isSubmitted && <th className="w-8"></th>}
                </tr>
              </thead>
              <tbody>
                {longDurationRows.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {['clauseNo', 'testSpecified', 'labName', 'likelyDate', 'inHouseReport', 'labReport'].map(key => (
                      <td key={key} className="px-2 py-1.5 border-t border-border">
                        <input className="w-full bg-transparent text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 rounded px-1 py-0.5 min-w-20"
                          type={key === 'likelyDate' ? 'date' : 'text'} value={row[key] || ''} onChange={e => updateReport(longDurationRows, i, key, e.target.value, r => set('longDurationRows', r))} disabled={isSubmitted} />
                      </td>
                    ))}
                    {!isSubmitted && <td className="px-2 border-t border-border"><button onClick={() => set('longDurationRows', longDurationRows.filter((_, idx) => idx !== i))} className="text-gray-300 hover:text-red-500"><Trash2 size={13} /></button></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!isSubmitted && <button onClick={() => set('longDurationRows', [...longDurationRows, { clauseNo: '', testSpecified: '', labName: '', likelyDate: '', inHouseReport: '', labReport: '' }])} className="text-xs text-primary hover:underline flex items-center gap-1"><Plus size={13} /> Add row</button>}
        </div>
      </div>

      <div className="card">
        <div className="section-header">3. Raw Material Test Reports</div>
        <div className="p-6 space-y-4">
          <Field label="For Raw Material used in finished product sample lot — Does Indian Standard require raw material conformity?" required>
            <Select value={data.rawMatConformityRequired} onChange={v => set('rawMatConformityRequired', v)} options={['Yes', 'No']} />
          </Field>
          {data.rawMatConformityRequired === 'Yes' && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-border rounded">
                  <thead>
                    <tr className="bg-primary text-white">
                      {['Raw Material Description *', 'Test Report / Certificate (filename) *', 'Complete? *', 'Conformity as per IS *'].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                      ))}
                      {!isSubmitted && <th className="w-8"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {rawReports.map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {['material', 'reportFile'].map(key => (
                          <td key={key} className="px-2 py-1.5 border-t border-border">
                            <input className="w-full bg-transparent text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 rounded px-1 py-0.5" value={row[key] || ''} onChange={e => updateReport(rawReports, i, key, e.target.value, r => set('rawMaterialReports', r))} disabled={isSubmitted} />
                          </td>
                        ))}
                        {['complete', 'conformity'].map(key => (
                          <td key={key} className="px-2 py-1.5 border-t border-border">
                            <select className="text-xs border border-border rounded px-1 py-0.5 bg-white" value={row[key] || ''} onChange={e => updateReport(rawReports, i, key, e.target.value, r => set('rawMaterialReports', r))} disabled={isSubmitted}>
                              <option value="">Select</option><option>Yes</option><option>No</option>
                            </select>
                          </td>
                        ))}
                        {!isSubmitted && <td className="px-2 border-t border-border"><button onClick={() => set('rawMaterialReports', rawReports.filter((_, idx) => idx !== i))} className="text-gray-300 hover:text-red-500"><Trash2 size={13} /></button></td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!isSubmitted && <button onClick={() => set('rawMaterialReports', [...rawReports, { material: '', reportFile: '', complete: '', conformity: '' }])} className="text-xs text-primary hover:underline flex items-center gap-1"><Plus size={13} /> Add row</button>}
              <Field label="Upload Raw Material Test Reports">
                <FileUpload fieldKey="testReport_raw_material_files" fieldLabel="Raw Material Test Reports"
                  existingDoc={getDocForField('testReport_raw_material_files')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
              </Field>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
