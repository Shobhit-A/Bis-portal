import React from 'react';
import { Field } from '../../../components/FormField';

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
          <Field label="User Name" required hint="Proposed BIS portal login username"><input {...d('userName')} /></Field>
          <div className="form-row">
            <Field label="Password" required><input type="password" {...d('password')} /></Field>
            <Field label="Confirm Password" required error={passwordMismatch ? 'Passwords do not match' : undefined}>
              <input type="password" {...d('confirmPassword')} />
            </Field>
          </div>
          <Field label="Company URL"><input {...d('companyUrl')} /></Field>
          <Field label="Email" required hint="Email will be sent to this Email Id"><input type="email" {...d('email')} /></Field>
          <div className="form-row">
            <Field label="Name" required><input {...d('name')} /></Field>
            <Field label="Designation"><input {...d('designation')} /></Field>
          </div>
          <Field label="Mobile No." required hint="SMS will be sent to this No."><input {...d('mobile')} /></Field>
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
