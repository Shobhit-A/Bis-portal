import React from 'react';
import { Field, Select, FileUpload } from '../../../components/FormField';
import { Plus, Trash2 } from 'lucide-react';

export default function ManufacturingProcess({ formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  const data = formData.manufacturing || {};
  const set = (key, val) => updateSection('manufacturing', { ...data, [key]: val });
  const rawMaterials = data.rawMaterials || [
    { material: '', supplier: '', conformity: '', howReceived: '', records: '', other: '' },
    { material: '', supplier: '', conformity: '', howReceived: '', records: '', other: '' },
    { material: '', supplier: '', conformity: '', howReceived: '', records: '', other: '' },
  ];

  const updateRaw = (i, key, val) => {
    const updated = rawMaterials.map((r, idx) => idx === i ? { ...r, [key]: val } : r);
    set('rawMaterials', updated);
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">1. Raw Material Details</div>
        <div className="p-6 overflow-x-auto">
          <table className="w-full text-xs border border-border rounded">
            <thead>
              <tr className="bg-primary text-white">
                {['Raw Material (with grade) *', 'Name of Supplier *', 'Conformity of Material', 'How Received (Batches/Lots/Package) *', 'Records Maintained', 'Any Other'].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-medium whitespace-nowrap">{h}</th>
                ))}
                {!isSubmitted && <th className="w-8 px-2"></th>}
              </tr>
            </thead>
            <tbody>
              {rawMaterials.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {['material', 'supplier', 'conformity', 'howReceived', 'records', 'other'].map(key => (
                    <td key={key} className="px-2 py-1.5 border-t border-border">
                      <input className="w-full bg-transparent text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 rounded px-1 py-0.5 min-w-24"
                        value={row[key] || ''} onChange={e => updateRaw(i, key, e.target.value)} disabled={isSubmitted} />
                    </td>
                  ))}
                  {!isSubmitted && <td className="px-2 py-1.5 border-t border-border"><button onClick={() => set('rawMaterials', rawMaterials.filter((_, idx) => idx !== i))} className="text-gray-300 hover:text-red-500"><Trash2 size={13} /></button></td>}
                </tr>
              ))}
            </tbody>
          </table>
          {!isSubmitted && <button onClick={() => set('rawMaterials', [...rawMaterials, { material: '', supplier: '', conformity: '', howReceived: '', records: '', other: '' }])} className="mt-2 text-xs text-primary hover:underline flex items-center gap-1"><Plus size={13} /> Add row</button>}
        </div>
      </div>

      <div className="card">
        <div className="section-header">2. Outsourcing & Hygiene</div>
        <div className="p-6 space-y-4">
          <div>
            <Field label="Do you outsource any part of manufacturing process?" required>
              <Select value={data.outsourcing} onChange={v => set('outsourcing', v)} options={['Yes', 'No']} />
            </Field>
            <p className="text-xs text-gray-400 mt-1">If Yes, submit: agreement with manufacturing unit + controls on outsourced process/product</p>
            {data.outsourcing === 'Yes' && (
              <div className="mt-3">
                <FileUpload fieldKey="manufacturing_outsource_doc" fieldLabel="Outsourcing Agreement"
                  existingDoc={getDocForField('manufacturing_outsource_doc')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
              </div>
            )}
          </div>
          <div>
            <Field label="Maintenance of Hygienic Conditions?" required>
              <Select value={data.hygiene} onChange={v => set('hygiene', v)} options={['Yes', 'No']} />
            </Field>
            <p className="text-xs text-gray-400 mt-1">If Yes, submit supporting docs</p>
            {data.hygiene === 'Yes' && (
              <div className="mt-3">
                <FileUpload fieldKey="manufacturing_hygiene_doc" fieldLabel="Hygiene Supporting Document"
                  existingDoc={getDocForField('manufacturing_hygiene_doc')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-header">3. Process Flow Chart & Factory Layout</div>
        <div className="p-6 space-y-4">
          <div>
            <Field label="Process Flow Chart covering all processes of manufacture (from Raw Material to Finished Product, including In-Process Controls & Outsourced stages)" required>
              <FileUpload fieldKey="manufacturing_flowchart" fieldLabel="Process Flow Chart"
                existingDoc={getDocForField('manufacturing_flowchart')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
            </Field>
            <p className="text-xs text-gray-400 mt-1">PDF copy required</p>
          </div>
          <Field label="Enclose Layout Plan of Factory" required>
            <FileUpload fieldKey="manufacturing_layout" fieldLabel="Factory Layout Plan"
              existingDoc={getDocForField('manufacturing_layout')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
          </Field>
          <div>
            <Field label="Manufacturing Machinery List" required>
              <FileUpload fieldKey="manufacturing_machinery" fieldLabel="Manufacturing Machinery List"
                existingDoc={getDocForField('manufacturing_machinery')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
            </Field>
            <p className="text-xs text-gray-400 mt-1">Upload document — template provided by us</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-header">4. Production Details</div>
        <div className="p-6">
          <div className="grid grid-cols-3 gap-4">
            <Field label="Unit of Production (as per IS Standard)">
              <input className="input" value={data.productionUnit || ''} onChange={e => set('productionUnit', e.target.value)} disabled={isSubmitted} />
            </Field>
            <Field label="Production Value (approx. per annum ₹)">
              <input className="input" value={data.productionValue || ''} onChange={e => set('productionValue', e.target.value)} disabled={isSubmitted} />
            </Field>
            <Field label="Present Installed Capacity">
              <input className="input" value={data.installedCapacity || ''} onChange={e => set('installedCapacity', e.target.value)} disabled={isSubmitted} />
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}
