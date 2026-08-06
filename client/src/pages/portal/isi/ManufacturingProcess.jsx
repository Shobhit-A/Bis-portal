import React from 'react';
import { Field, Select, FileUpload } from '../../../components/FormField';
import { RepeatingTable } from '../../../components/RepeatingTable';

const RAW_COLUMNS = [
  { key: 'material', label: 'Raw Material (with grade)', type: 'text' },
  { key: 'supplier', label: 'Name of Supplier', type: 'text' },
  { key: 'conformity', label: 'Conformity of Material', type: 'select', options: ['BIS Certified', 'Test Certificate', 'Any Other'] },
  { key: 'howReceived', label: 'How Received', type: 'text' },
  { key: 'recordsMaintained', label: 'Records Maintained', type: 'select', options: ['Yes', 'No'] },
];

export default function ManufacturingProcess({ formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  const data = formData.manufacturing || {};
  const set = (key, val) => updateSection('manufacturing', { ...data, [key]: val });
  const d = (key) => ({ value: data[key] || '', onChange: e => set(key, e.target.value), disabled: isSubmitted, className: 'input' });

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">1. Raw Material Details</div>
        <div className="p-6">
          <RepeatingTable sectionKey="manufacturing" columns={RAW_COLUMNS} rows={data.rawRows}
            onChange={rows => set('rawRows', rows)} getDocForField={getDocForField}
            onDocUploaded={onDocUploaded} onDocRemoved={onDocRemoved} isSubmitted={isSubmitted} />
        </div>
      </div>

      <div className="card">
        <div className="section-header">2. Outsourcing & Hygiene</div>
        <div className="p-6 space-y-4">
          <Field label="Do you outsource any part of the manufacturing process?" required>
            <Select value={data.outsources} onChange={v => set('outsources', v)} options={['Yes', 'No']} />
          </Field>
          {data.outsources === 'Yes' && (
            <div className="form-row">
              <Field label="Agreement with Manufacturing Unit for Outsourcing" required>
                <FileUpload fieldKey="manufacturing_outsource_agreement" fieldLabel="Outsourcing Agreement"
                  existingDoc={getDocForField('manufacturing_outsource_agreement')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
              </Field>
              <Field label="Controls Exercised on Outsourced Process / Product (IQC docs)" required>
                <FileUpload fieldKey="manufacturing_outsource_iqc" fieldLabel="Outsourcing IQC Docs"
                  existingDoc={getDocForField('manufacturing_outsource_iqc')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
              </Field>
            </div>
          )}
          <Field label="Maintenance of Hygienic Conditions?" required>
            <Select value={data.hygiene} onChange={v => set('hygiene', v)} options={['Yes', 'No']} />
          </Field>
          {data.hygiene === 'Yes' && (
            <Field label="Hygiene Supporting Documents">
              <FileUpload fieldKey="manufacturing_hygiene_docs" fieldLabel="Hygiene Documents"
                existingDoc={getDocForField('manufacturing_hygiene_docs')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
            </Field>
          )}
        </div>
      </div>

      <div className="card">
        <div className="section-header">3. Process Documentation</div>
        <div className="p-6 space-y-4">
          <div className="form-row">
            <Field label="Process Flow-Chart" required>
              <FileUpload fieldKey="manufacturing_process_flowchart" fieldLabel="Process Flow-Chart"
                existingDoc={getDocForField('manufacturing_process_flowchart')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
            </Field>
            <Field label="Layout Plan of Factory" required>
              <FileUpload fieldKey="manufacturing_factory_layout" fieldLabel="Factory Layout Plan"
                existingDoc={getDocForField('manufacturing_factory_layout')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
            </Field>
          </div>
          <Field label="Manufacturing Machinery List" required>
            <FileUpload fieldKey="manufacturing_machinery_list" fieldLabel="Machinery List"
              existingDoc={getDocForField('manufacturing_machinery_list')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
          </Field>
        </div>
      </div>

      <div className="card">
        <div className="section-header">4. Production Details</div>
        <div className="p-6 space-y-4">
          <div className="form-row">
            <Field label="Unit of Production" required hint="e.g. 1 Piece"><input {...d('unitOfProduction')} /></Field>
            <Field label="Production Value — Approx. Value per Annum (₹)"><input type="number" {...d('productionValue')} /></Field>
          </div>
          <Field label="Present Installed Capacity" required><input {...d('installedCapacity')} /></Field>
        </div>
      </div>
    </div>
  );
}
