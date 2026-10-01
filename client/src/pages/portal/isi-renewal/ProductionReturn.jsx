import { Field } from '../../../components/FormField';
import { RepeatingTable } from '../../../components/RepeatingTable';

const PRODUCTION_COLUMNS = [
  { key: 'brandName', label: 'Brand Name', type: 'text' },
  { key: 'fromDate', label: 'From Date', type: 'date' },
  { key: 'toDate', label: 'To Date', type: 'date' },
  { key: 'productionQuantity', label: 'Production Quantity', type: 'text' },
  { key: 'productionValue', label: 'Production Value', type: 'text' },
  { key: 'productionMarked', label: 'Production Marked', type: 'text' },
  { key: 'productionMarkedPct', label: 'Production Marked %', type: 'text' },
  { key: 'productionValueByCA', label: 'Production Value By CA', type: 'text' },
  { key: 'markingFee', label: 'Marking Fee', type: 'text' },
];

ProductionReturn.isComplete = (formData) => {
  const d = formData.production || {};
  const missing = [];
  if (!d.totalProductionLicensed) missing.push('Total production of the article(s) licensed for certification marking');
  if (!d.totalProductionConforming) missing.push('Total production of the article(s) Confirming to Indian Standard');
  if (!d.coveredQuantity) missing.push('Production covered with BIS Certification Mark — Quantity');
  if (!d.coveredValue) missing.push('Production covered with BIS Certification Mark — Value Rs.');
  if (!d.difficulties) missing.push('Brief information regarding difficulties, if any');
  return missing;
};

export default function ProductionReturn({ formData, updateSection, isSubmitted }) {
  const data = formData.production || {};
  const set = (key, val) => updateSection('production', { ...data, [key]: val });
  const d = (key) => ({ value: data[key] || '', onChange: e => set(key, e.target.value), disabled: isSubmitted, className: 'input' });
  const rows = data.rows || [{ id: 'row-1' }];

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">Production Return Details</div>
        <div className="p-6 space-y-4">
          <div className="form-row">
            <Field label="Advance Marking Fee Period — From"><input type="date" {...d('advanceFeePeriodFrom')} /></Field>
            <Field label="Advance Marking Fee Period — To"><input type="date" {...d('advanceFeePeriodTo')} /></Field>
          </div>
          <RepeatingTable sectionKey="production" columns={PRODUCTION_COLUMNS} rows={rows}
            onChange={v => set('rows', v)} isSubmitted={isSubmitted} />
        </div>
      </div>

      <div className="card">
        <div className="section-header">Unit of Production</div>
        <div className="p-6 space-y-4">
          <Field label="Total production of the article(s) licensed for certification marking" required>
            <input {...d('totalProductionLicensed')} />
          </Field>
          <Field label="Total production of the article(s) Confirming to Indian Standard" required>
            <input {...d('totalProductionConforming')} />
          </Field>
          <div className="form-row">
            <Field label="Production covered with BIS Certification Mark — Quantity (in the terms of Unit Defined)" required>
              <input {...d('coveredQuantity')} />
            </Field>
            <Field label="Production covered with BIS Certification Mark — Value Rs." required>
              <input {...d('coveredValue')} />
            </Field>
          </div>
          <Field label="Quantity not covered with BIS Certification Mark (in the terms of Unit Defined)">
            <input {...d('notCoveredQuantity')} />
          </Field>
          <Field label="Brief information regarding difficulties, if any, experienced in operating of BIS Licence" required>
            <textarea className="input" rows={3} value={data.difficulties || ''} onChange={e => set('difficulties', e.target.value)} disabled={isSubmitted} />
          </Field>
        </div>
      </div>
    </div>
  );
}
