import { Field, Select } from '../../../components/FormField';

const STATUS_OPTIONS = ['Active', 'Due for Renewal', 'Expired', 'Suspended'];

CertificateDetails.isComplete = (formData) => {
  const d = formData.certificate || {};
  const missing = [];
  if (!d.cmlNumber) missing.push('CM/L Number');
  if (!d.firmName) missing.push('Firm Name');
  if (!d.product) missing.push('Product');
  if (!d.isNumber) missing.push('IS No');
  if (!d.validity) missing.push('Validity');
  return missing;
};

export default function CertificateDetails({ formData, updateSection, isSubmitted }) {
  const data = formData.certificate || {};
  const set = (key, val) => updateSection('certificate', { ...data, [key]: val });
  const d = (key) => ({ value: data[key] || '', onChange: e => set(key, e.target.value), disabled: isSubmitted, className: 'input' });

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">Certificate Details</div>
        <div className="p-6 space-y-4">
          <div className="form-row">
            <Field label="CM/L Number" required><input {...d('cmlNumber')} /></Field>
            <Field label="Firm Name" required><input {...d('firmName')} /></Field>
          </div>
          <div className="form-row">
            <Field label="Product" required><input {...d('product')} /></Field>
            <Field label="Brand"><input {...d('brand')} /></Field>
          </div>
          <div className="form-row">
            <Field label="IS No" required><input {...d('isNumber')} /></Field>
            <Field label="Validity" required><input type="date" {...d('validity')} /></Field>
          </div>
          <Field label="Status">
            <Select value={data.status || ''} onChange={v => set('status', v)} options={STATUS_OPTIONS} placeholder="Select status" />
          </Field>
        </div>
      </div>
    </div>
  );
}
