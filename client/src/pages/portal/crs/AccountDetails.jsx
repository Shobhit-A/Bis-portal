import React from 'react';
import { Field, Select } from '../../../components/FormField';

const SALUTATIONS = ['Mr', 'Mrs', 'Ms', 'Dr', 'M/s'];

function WarnHint({ children }) {
  return <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1 mt-1">{children}</p>;
}

AccountDetails.isComplete = (formData) => {
  const d = formData.account || {};
  const missing = [];
  if (!d.userName) missing.push('User Name');
  if (!d.password) missing.push('Password');
  if (!d.confirmPassword || d.password !== d.confirmPassword) missing.push('Confirm Password');
  if (!d.email) missing.push('Email');
  if (!d.name) missing.push('Name');
  if (!d.mobile) missing.push('Mobile No.');
  if (!d.unitName) missing.push('Manufacturing Unit Name');
  return missing;
};

export default function AccountDetails({ formData, updateSection, isSubmitted }) {
  const data = formData.account || {};
  const set = (key, val) => updateSection('account', { ...data, [key]: val });
  const d = (key) => ({ value: data[key] || '', onChange: e => set(key, e.target.value), disabled: isSubmitted, className: 'input' });

  const passwordMismatch = data.password && data.confirmPassword && data.password !== data.confirmPassword;

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">Basic Details</div>
        <div className="p-6 space-y-4">
          <Field label="User Name" required><input {...d('userName')} /></Field>
          <div className="form-row">
            <Field label="Password" required hint="Should contain uppercase, lowercase, numbers and special characters">
              <input type="password" {...d('password')} />
            </Field>
            <Field label="Confirm Password" required error={passwordMismatch ? 'Passwords do not match' : undefined}>
              <input type="password" {...d('confirmPassword')} />
            </Field>
          </div>
          <Field label="Company URL://"><input {...d('companyUrl')} /></Field>
          <Field label="Email" required>
            <input type="email" {...d('email')} />
            <WarnHint>Email will be send to this Email Id</WarnHint>
          </Field>
          <Field label="Name" required>
            <div className="grid grid-cols-[auto_1fr] gap-2">
              <Select value={data.salutation} onChange={v => set('salutation', v)} options={SALUTATIONS} className="w-24" />
              <input className="input" value={data.name || ''} onChange={e => set('name', e.target.value)} disabled={isSubmitted} />
            </div>
          </Field>
          <Field label="Designation"><input {...d('designation')} /></Field>
          <Field label="Mobile No." required>
            <input {...d('mobile')} />
            <WarnHint>SMS will be send to this No.</WarnHint>
          </Field>
        </div>
      </div>

      <div className="card">
        <div className="section-header">Manufacturer Unit Details</div>
        <div className="p-6">
          <Field label="Manufacturing Unit Name" required><input {...d('unitName')} /></Field>
        </div>
      </div>
    </div>
  );
}
