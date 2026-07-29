import React from 'react';
import { Field, Select, FileUpload } from '../../../components/FormField';
import { Plus, Trash2 } from 'lucide-react';

function TableSection({ title, rows, setRows, cols, isSubmitted, fixedRows, note, getDocForField, onDocUploaded, onDocRemoved }) {
  const addRow = () => setRows([...rows, Object.fromEntries(cols.map(c => [c.key, '']))]);
  const removeRow = (i) => setRows(rows.filter((_, idx) => idx !== i));
  const updateRow = (i, key, val) => setRows(rows.map((r, idx) => idx === i ? { ...r, [key]: val } : r));
  const showActions = !isSubmitted && !fixedRows;

  return (
    <div>
      {title && <div className="font-medium text-sm text-gray-700 mb-2">{title}</div>}
      <div className="border border-border rounded overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-primary text-white">
              {cols.map(c => <th key={c.key} className="px-3 py-2 text-left font-medium">{c.label}</th>)}
              {showActions && <th className="px-3 py-2 w-8"></th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {cols.map(c => (
                  <td key={c.key} className="px-2 py-1.5">
                    {c.type === 'select' ? (
                      <fieldset disabled={isSubmitted} className="contents">
                        <Select value={row[c.key]} onChange={v => updateRow(i, c.key, v)} options={c.options} className="text-xs px-1 py-0.5" />
                      </fieldset>
                    ) : c.type === 'file' ? (
                      <div className="min-w-45">
                        <FileUpload fieldKey={fixedRows ? c.fieldKey : `${c.fieldKey}_${i}`} fieldLabel={c.label.replace(' *', '')}
                          existingDoc={getDocForField(fixedRows ? c.fieldKey : `${c.fieldKey}_${i}`)}
                          onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
                      </div>
                    ) : (
                      <input className="w-full border-0 bg-transparent text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 rounded px-1 py-0.5" value={row[c.key] || ''} onChange={e => updateRow(i, c.key, e.target.value)} disabled={isSubmitted} placeholder={c.placeholder || ''} />
                    )}
                  </td>
                ))}
                {showActions && (
                  <td className="px-2 py-1.5">
                    <button onClick={() => removeRow(i)} className="text-gray-300 hover:text-red-500"><Trash2 size={13} /></button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note && <p className="text-xs text-gray-400 mt-1">{note}</p>}
      {showActions && (
        <button onClick={addRow} className="mt-2 text-xs text-primary hover:underline flex items-center gap-1"><Plus size={13} /> Add row</button>
      )}
    </div>
  );
}

export default function ManagementDetails({ formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  const data = formData.management || {};
  const set = (key, val) => updateSection('management', { ...data, [key]: val });

  const topMgmt = data.topManagement || [{ name: '', designation: '', contact: '', email: '', din: '' }];
  const airRow = data.airRow || [{ name: '', designation: '', contact: '', email: '', din: '', nominationLetter: '', residency: '' }];
  const techPersonnel = data.techPersonnel || [
    { name: '', designation: '', qualification: '', qualDoc: '', experience: '', photo: '' },
    { name: '', designation: '', qualification: '', qualDoc: '', experience: '', photo: '' },
  ];

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">1. Top Management Details</div>
        <div className="p-6">
          <p className="text-xs text-gray-500 mb-4">Add all Directors / Partners / Proprietors</p>
          <TableSection title="" rows={topMgmt} setRows={r => set('topManagement', r)} isSubmitted={isSubmitted}
            cols={[
              { key: 'name', label: 'Name *' },
              { key: 'designation', label: 'Designation *' },
              { key: 'contact', label: 'Contact No. *' },
              { key: 'email', label: 'Email ID *' },
              { key: 'din', label: 'DIN (If Applicable)' },
            ]} />
        </div>
      </div>

      <div className="card">
        <div className="section-header">2. AIR Details — Authorized Indian Representative</div>
        <div className="p-6 space-y-4">
          <TableSection title="" rows={airRow} setRows={r => set('airRow', r)} isSubmitted={isSubmitted} fixedRows
            note="AIR Nomination Letter: Duly Signed and Sealed PDF copy Required"
            getDocForField={getDocForField} onDocUploaded={onDocUploaded} onDocRemoved={onDocRemoved}
            cols={[
              { key: 'name', label: 'Name *' },
              { key: 'designation', label: 'Designation *' },
              { key: 'contact', label: 'Contact No. *' },
              { key: 'email', label: 'Email ID *' },
              { key: 'din', label: 'DIN (If Applicable)' },
              { key: 'nominationLetter', label: 'AIR Nomination Letter *', type: 'file', fieldKey: 'management_air_letter' },
              { key: 'residency', label: 'Residency Status *', type: 'select', options: ['Resident Indian', "Resident Indian working in Applicant's Org / Group Company"] },
            ]} />
        </div>
      </div>

      <div className="card">
        <div className="section-header">3. Correspondence Details</div>
        <div className="p-6 space-y-4">
          <Field label="Correspondence Address Communication" required>
            <Select value={data.corrAddress} onChange={v => set('corrAddress', v)} options={['Office Address', 'Factory Address']} />
          </Field>
          <div className="form-row">
            <Field label="Name of Contact Person" required><input className="input" value={data.corrName || ''} onChange={e => set('corrName', e.target.value)} disabled={isSubmitted} /></Field>
            <Field label="Designation of Contact Person" required><input className="input" value={data.corrDesignation || ''} onChange={e => set('corrDesignation', e.target.value)} disabled={isSubmitted} /></Field>
          </div>
          <div className="form-row">
            <Field label="E-Mail ID" required hint="Email of firm / authorized signatory only">
              <input className="input" type="email" value={data.corrEmail || ''} onChange={e => set('corrEmail', e.target.value)} disabled={isSubmitted} />
            </Field>
            <Field label="Contact Number" required><input className="input" value={data.corrContact || ''} onChange={e => set('corrContact', e.target.value)} disabled={isSubmitted} /></Field>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-header">4. Technical Management / Quality Assurance / Control Personnel</div>
        <div className="p-6 space-y-4">
          <TableSection title="" rows={techPersonnel} setRows={r => set('techPersonnel', r)} isSubmitted={isSubmitted}
            note="Qualification Document: PDF copy Required · Photo: JPEG copy Required"
            getDocForField={getDocForField} onDocUploaded={onDocUploaded} onDocRemoved={onDocRemoved}
            cols={[
              { key: 'name', label: 'Name *' },
              { key: 'designation', label: 'Designation *' },
              { key: 'qualification', label: 'Qualification *' },
              { key: 'qualDoc', label: 'Qualification Document *', type: 'file', fieldKey: 'management_qual_doc' },
              { key: 'experience', label: 'Experience (in years) *' },
              { key: 'photo', label: 'Photo *', type: 'file', fieldKey: 'management_photo' },
            ]} />
        </div>
      </div>
    </div>
  );
}
