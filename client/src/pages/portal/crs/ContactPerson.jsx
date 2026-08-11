import React from 'react';
import { Field } from '../../../components/FormField';

ContactPerson.isComplete = (formData) => {
  const d = formData.contact || {};
  const missing = [];
  if (!d.name) missing.push('Name');
  if (!d.designation) missing.push('Designation');
  if (!d.mobile) missing.push('Mobile Number');
  if (!d.email) missing.push('Email');
  return missing;
};

export default function ContactPerson({ formData, updateSection, isSubmitted }) {
  const data = formData.contact || {};
  const set = (key, val) => updateSection('contact', { ...data, [key]: val });
  const d = (key) => ({ value: data[key] || '', onChange: e => set(key, e.target.value), disabled: isSubmitted, className: 'input' });

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">Contact Person</div>
        <div className="p-6 space-y-4">
          <div className="form-row">
            <Field label="Name" required><input {...d('name')} /></Field>
            <Field label="Designation" required><input {...d('designation')} /></Field>
          </div>
          <Field label="Mobile Number" required hint="OTP for submission of the application will be sent to this number"><input {...d('mobile')} /></Field>
          <Field label="Email" required hint="OTP for submission of the application will be sent to this E-mail Id"><input type="email" {...d('email')} /></Field>
          <Field label="Fax"><input {...d('fax')} /></Field>
        </div>
      </div>
    </div>
  );
}
