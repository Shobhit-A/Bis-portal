import { Field, Select } from '../../../components/FormField';

const PERIOD_OPTIONS = ['1 Year', '2 Years', '3 Years', '4 Years', '5 Years'];

RenewalDetails.isComplete = (formData) => {
  const d = formData.renewal || {};
  const missing = [];
  if (!d.renewalPeriod) missing.push('Select Renewal Period');
  if (!d.actualMarkingFee) missing.push('(A) Actual Marking Fee of the previous period');
  if (!d.remainingDues) missing.push('(B) Remaining Dues');
  if (!d.advanceMinMarkingFee) missing.push('(C) Advance Minimum Marking Fee for the next period');
  return missing;
};

function numOf(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

export default function RenewalDetails({ formData, updateSection, isSubmitted }) {
  const data = formData.renewal || {};
  const set = (key, val) => updateSection('renewal', { ...data, [key]: val });
  const d = (key) => ({ value: data[key] || '', onChange: e => set(key, e.target.value), disabled: isSubmitted, className: 'input' });

  const a = numOf(data.actualMarkingFee);
  const b = numOf(data.remainingDues);
  const c = numOf(data.advanceMinMarkingFee);
  const e = numOf(data.advanceFeePaidAmount);
  const applicable = a + b;
  const totalPayable = a + b + c - e;

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">Renewal Details</div>
        <div className="p-6 space-y-4">
          <Field label="Select Renewal Period" required hint="You can select up to 5 years">
            <Select value={data.renewalPeriod || ''} onChange={v => set('renewalPeriod', v)} options={PERIOD_OPTIONS} placeholder="Select period" />
          </Field>
          <Field label="(A) Actual Marking Fee of the previous period" required>
            <input type="number" {...d('actualMarkingFee')} />
          </Field>
          <Field label="(B) Remaining Dues" required>
            <input type="number" {...d('remainingDues')} />
          </Field>
          <Field label="(C) Advance Minimum Marking Fee for the next period" required>
            <input type="number" {...d('advanceMinMarkingFee')} />
          </Field>
          <Field label="(D) Marking Fee applicable (A + B)">
            <input className="input bg-gray-50" value={applicable} disabled readOnly />
          </Field>
        </div>
      </div>

      <div className="card">
        <div className="section-header">Calculation of Applicable Marking Fees</div>
        <div className="p-6 space-y-4">
          <Field label="(E) Advance Marking Fee paid">
            <input type="number" {...d('advanceFeePaidAmount')} />
          </Field>
          <Field label="Total Marking Fee payable (A + B + C - E)">
            <input className="input bg-gray-50" value={totalPayable} disabled readOnly />
          </Field>
        </div>
      </div>
    </div>
  );
}
