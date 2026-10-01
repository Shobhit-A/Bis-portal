import { Field, FileUpload } from '../../../components/FormField';

function YesNo({ value, onChange, isSubmitted }) {
  return (
    <div className="flex gap-6 shrink-0">
      <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer whitespace-nowrap">
        <input type="radio" checked={value === 'no'} onChange={() => onChange('no')} disabled={isSubmitted} />
        No (there is no change)
      </label>
      <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer whitespace-nowrap">
        <input type="radio" checked={value === 'yes'} onChange={() => onChange('yes')} disabled={isSubmitted} />
        Yes (there is change)
      </label>
    </div>
  );
}

function ChangeRow({ label, value, onChange, isSubmitted }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-border last:border-0">
      <span className="text-sm text-gray-700">{label}</span>
      <YesNo value={value} onChange={onChange} isSubmitted={isSubmitted} />
    </div>
  );
}

const SECTION_B_ROWS = [
  { key: 'managementChange', label: 'Management Details *' },
  { key: 'technicalPersonnelChange', label: 'Technical Personnel Details *' },
  { key: 'manufacturingMachineryChange', label: 'Manufacturing Machinery Details *' },
  { key: 'manufacturingProcessChange', label: 'Manufacturing Process Details *' },
  { key: 'factoryLayoutChange', label: 'Factory Layout Plan *' },
  { key: 'testEquipmentChange', label: 'Test Equipment Details *' },
  { key: 'labelChange', label: 'Form Of Label *' },
  { key: 'weeklyOffChange', label: 'Update Weekly Off *' },
  { key: 'installedCapacityChange', label: 'Is there any change in installed capacity? *' },
];

SelfComplianceReport.isComplete = (formData) => {
  const d = formData.selfCompliance || {};
  const missing = [];
  if (!d.orgChange) missing.push('Organization Details (Section A)');
  if (!d.contactChange) missing.push('Contact Details (Section A)');
  if (!d.brandChange) missing.push('Brand Detail (Section A)');
  SECTION_B_ROWS.forEach(row => { if (!d[row.key]) missing.push(row.label.replace(' *', '') + ' (Section B)'); });
  if (!d.rawMaterialChange) missing.push('Change in Raw Material Details (Section C)');
  if (!d.sitChange) missing.push('Change in Scheme of Inspection and Testing (Section C)');
  if (!d.testEquipmentCalibrationChange) missing.push('Change in Test Equipment Calibration (Section C)');
  return missing;
};

export default function SelfComplianceReport({ formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  const cert = formData.certificate || {};
  const data = formData.selfCompliance || {};
  const set = (key, val) => updateSection('selfCompliance', { ...data, [key]: val });
  const d = (key) => ({ value: data[key] || '', onChange: e => set(key, e.target.value), disabled: isSubmitted, className: 'input' });

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">Self Compliance Report — Self Evaluation Verification Report</div>
        <div className="p-6 space-y-2 text-sm">
          <div className="text-xs text-gray-400 mb-2">License Details (from Certificate Details tab)</div>
          <div className="form-row">
            <Field label="Licence/Registration No"><div className="input bg-gray-50">{cert.cmlNumber || '—'}</div></Field>
            <Field label="Firm Name"><div className="input bg-gray-50">{cert.firmName || '—'}</div></Field>
          </div>
          <div className="form-row">
            <Field label="Product"><div className="input bg-gray-50">{cert.product || '—'}</div></Field>
            <Field label="IS No"><div className="input bg-gray-50">{cert.isNumber || '—'}</div></Field>
          </div>
          <div className="form-row">
            <Field label="Validity"><div className="input bg-gray-50">{cert.validity || '—'}</div></Field>
            <Field label="Status"><div className="input bg-gray-50">{cert.status || 'Operative'}</div></Field>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-header">Section A: Changes in Organization Profile</div>
        <div className="p-6 space-y-3">
          <p className="text-xs text-gray-500 leading-relaxed">
            Please tick "No" below if there are no changes to the user/organization profile i.e. Name of firm, Sector (Private/Public),
            Registration, Office details, Factory Address, Contact Details. (In case you have changed the location of the factory to a
            different premises/address, you are required to suspend the further use of BIS Standard Mark and inform BIS and await further
            instructions before resumption of marking.) Please tick "Yes" if there is any change — if so, attach relevant documents
            describing in brief the nature of changes.
          </p>
          <ChangeRow label="Organization Details *" value={data.orgChange} onChange={v => set('orgChange', v)} isSubmitted={isSubmitted} />
          <ChangeRow label="Contact Details (Mobile No. / email ID) *" value={data.contactChange} onChange={v => set('contactChange', v)} isSubmitted={isSubmitted} />
          <ChangeRow label="Brand Detail * — brand/trade names used with products manufactured, as informed to BIS"
            value={data.brandChange} onChange={v => set('brandChange', v)} isSubmitted={isSubmitted} />
          {(data.orgChange === 'yes' || data.contactChange === 'yes' || data.brandChange === 'yes') && (
            <Field label="Supporting Document(s) describing the nature of changes" hint="Required since you indicated a change above">
              <FileUpload fieldKey="selfCompliance_sectionA_docs" fieldLabel="Section A Change Documents"
                existingDoc={getDocForField('selfCompliance_sectionA_docs')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
            </Field>
          )}
        </div>
      </div>

      <div className="card">
        <div className="section-header">Section B: Confirmation Regarding Manpower, Manufacturing and Testing Infrastructure</div>
        <div className="p-6 space-y-3">
          <p className="text-xs text-gray-500 leading-relaxed">
            Please tick "No" below if there are no changes to the top management, technical personnel, manufacturing machinery,
            manufacturing process, factory layout plan, testing equipment, form of label, weekly off. Please tick "Yes" if there are any changes.
          </p>
          {SECTION_B_ROWS.map(row => (
            <ChangeRow key={row.key} label={row.label} value={data[row.key]} onChange={v => set(row.key, v)} isSubmitted={isSubmitted} />
          ))}
        </div>
      </div>

      <div className="card">
        <div className="section-header">Section C: Compliance Information</div>
        <div className="p-6 space-y-5">
          <p className="text-sm font-medium text-gray-900">We declare that:</p>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-700">1. Implementation of the Indian Standard</p>
            <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="radio" name="standardImpl" className="mt-0.5" checked={data.standardImplementation === 'implemented'}
                onChange={() => set('standardImplementation', 'implemented')} disabled={isSubmitted} />
              We have implemented the current version of the Indian Standard with all amendments
            </label>
            <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="radio" name="standardImpl" className="mt-0.5" checked={data.standardImplementation === 'inProcess'}
                onChange={() => set('standardImplementation', 'inProcess')} disabled={isSubmitted} />
              We are in the process of implementation of the latest version and shall complete and confirm the same to BIS before the last date of implementation
            </label>
          </div>

          <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" className="mt-0.5" checked={data.instructionsCompliance || false}
              onChange={e => set('instructionsCompliance', e.target.checked)} disabled={isSubmitted} />
            2. We have completed action and reported compliance on all instructions of BIS, including instructions on non-conformity, previous inspections, and payment of outstanding dues (if applicable)
          </label>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-700">3. Hygienic conditions (applicable for food/medical products)</p>
            <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="radio" name="hygienic" className="mt-0.5" checked={data.hygienicConditions === 'maintained'}
                onChange={() => set('hygienicConditions', 'maintained')} disabled={isSubmitted} />
              Hygienic conditions are being maintained in the factory as per the product manual / Indian Standard
            </label>
            {data.hygienicConditions === 'maintained' && (
              <div className="pl-6">
                <Field label="Hygienic Conditions Checklist" hint="Duly filled checklist signed by the Quality Control Incharge">
                  <FileUpload fieldKey="selfCompliance_hygienic_checklist" fieldLabel="Hygienic Conditions Checklist"
                    existingDoc={getDocForField('selfCompliance_hygienic_checklist')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
                </Field>
              </div>
            )}
            <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="radio" name="hygienic" className="mt-0.5" checked={data.hygienicConditions === 'notApplicable'}
                onChange={() => set('hygienicConditions', 'notApplicable')} disabled={isSubmitted} />
              Hygienic conditions are not applicable for our product
            </label>
          </div>

          <div>
            <p className="text-xs text-gray-600 mb-2">
              4. We declare the raw material details as follows and declare that the raw materials conform to the requirements of the Indian
              Standard / Product Manual (if applicable), and evidence of conformity is available.
            </p>
            <ChangeRow label="Is there any change in Raw Material Details? *" value={data.rawMaterialChange} onChange={v => set('rawMaterialChange', v)} isSubmitted={isSubmitted} />
          </div>

          <div>
            <p className="text-xs text-gray-600 mb-2">
              5. Scheme of Inspection and Testing is being followed and records are being maintained, including for tests subcontracted to
              outside labs (if complete in-house testing facilities are not available).
            </p>
            <ChangeRow label="Is there any change in Scheme of Inspection and Testing? *" value={data.sitChange} onChange={v => set('sitChange', v)} isSubmitted={isSubmitted} />
            {data.sitChange === 'yes' && (
              <Field label="Test Reports from Subcontracted Labs" hint="As per the Scheme of Inspection and Testing during the current operative year">
                <FileUpload fieldKey="selfCompliance_sit_reports" fieldLabel="Subcontracted Lab Test Reports"
                  existingDoc={getDocForField('selfCompliance_sit_reports')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
              </Field>
            )}
          </div>

          <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" className="mt-0.5" checked={data.storagePackingCompliance || false}
              onChange={e => set('storagePackingCompliance', e.target.checked)} disabled={isSubmitted} />
            6. Storage, packing and marking/labelling of the product is being done as per the Scheme of Inspection and Testing and Indian Standard
          </label>

          <div>
            <p className="text-xs text-gray-600 mb-2">
              7. Test equipment installed in-house are duly calibrated and in proper working order (including subcontracted test facilities).
              Calibration from outside labs is done in accredited labs (if applicable).
            </p>
            <ChangeRow label="Is there any change in test equipment calibration status? *" value={data.testEquipmentCalibrationChange} onChange={v => set('testEquipmentCalibrationChange', v)} isSubmitted={isSubmitted} />
          </div>

          <div className="space-y-2">
            <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" className="mt-0.5" checked={data.consigneeUpdates || false}
                onChange={e => set('consigneeUpdates', e.target.checked)} disabled={isSubmitted} />
              8. We are regularly updating consignee details on the online portal, with complete address and contact details
            </label>
            <Field label="Last updation of production details was done on"><input type="date" {...d('lastProductionUpdateDate')} /></Field>
          </div>

          <div className="space-y-2">
            <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" className="mt-0.5" checked={data.productionUpdates || false}
                onChange={e => set('productionUpdates', e.target.checked)} disabled={isSubmitted} />
              9. We are regularly updating production details on the online portal and submitting production details to BIS
            </label>
            <Field label="Production details for the current operative year">
              <textarea className="input" rows={2} value={data.productionDetailsNote || ''} onChange={e => set('productionDetailsNote', e.target.value)} disabled={isSubmitted} />
            </Field>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-header">Section D: Declaration</div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-700">
            1. We declare that we <span className="font-semibold">{cert.firmName || '[Firm Name]'}</span> have been manufacturing{' '}
            <span className="font-semibold">{cert.product || '[Product Name]'}</span> on a continual basis in compliance with{' '}
            <span className="font-semibold">{cert.isNumber || '[IS No.]'}</span>. The finished product is subjected to tests at the
            frequency specified in the Scheme of Inspection and Testing, compliance is ensured as per the Indian Standard, and relevant
            records are maintained on a continual basis.
          </p>
          <p className="text-sm text-gray-700">2. We declare that details of consignees have been updated in the portal and reflect the latest consignees.</p>
          <p className="text-sm text-gray-700">3. We declare that the above information provided in this self compliance report is true and correct.</p>
          <Field label="4. Any other information / declaration to be provided">
            <textarea className="input" rows={3} value={data.otherDeclaration || ''} onChange={e => set('otherDeclaration', e.target.value)} disabled={isSubmitted} />
          </Field>
        </div>
      </div>
    </div>
  );
}
