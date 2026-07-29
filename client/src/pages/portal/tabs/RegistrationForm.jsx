import React, { useState } from 'react';
import { Field, Select, FileUpload } from '../../../components/FormField';
import { Eye, EyeOff } from 'lucide-react';

export default function RegistrationForm({ formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  const data = formData.registration || {};
  const set = (key, val) => updateSection('registration', { ...data, [key]: val });
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">Registration Form</div>
        <div className="p-6 space-y-5">
          <p className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded p-3">
            These details will be used to create your BIS portal login account. Please ensure accuracy — email cannot be changed later on the portal.
          </p>

          <div className="form-row">
            <Field label="Email" required>
              <input className="input" type="email" value={data.email || ''} onChange={e => set('email', e.target.value)} disabled={isSubmitted} />
            </Field>
            <Field label="Password" required hint="Will be set on the BIS portal">
              <div className="relative">
                <input className="input pr-10" type={showPassword ? 'text' : 'password'} value={data.password || ''} onChange={e => set('password', e.target.value)} disabled={isSubmitted} />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>
          </div>

          <div className="space-y-2">
            <label className="label">Name <span className="required">*</span></label>
            <div className="grid grid-cols-3 gap-3">
              <Select value={data.salutation} onChange={v => set('salutation', v)} options={['Mr', 'Mrs', 'Ms', 'Dr', 'Prof']} placeholder="Title" />
              <input className="input" placeholder="First Name" value={data.firstName || ''} onChange={e => set('firstName', e.target.value)} disabled={isSubmitted} />
              <input className="input" placeholder="Last Name" value={data.lastName || ''} onChange={e => set('lastName', e.target.value)} disabled={isSubmitted} />
            </div>
          </div>

          <Field label="Middle Name">
            <input className="input" value={data.middleName || ''} onChange={e => set('middleName', e.target.value)} disabled={isSubmitted} />
          </Field>

          <div className="form-row">
            <Field label="Date of Birth" required>
              <input className="input" type="date" value={data.dob || ''} onChange={e => set('dob', e.target.value)} disabled={isSubmitted} />
            </Field>
            <Field label="Mobile Number" required>
              <div className="flex gap-2">
                <span className="input w-16 text-center bg-gray-50 text-gray-500">+91</span>
                <input className="input flex-1" placeholder="10-digit number" value={data.mobile || ''} onChange={e => set('mobile', e.target.value)} disabled={isSubmitted} maxLength={10} />
              </div>
            </Field>
          </div>

          <div className="form-row">
            <Field label="Nationality" required>
              <Select value={data.nationality} onChange={v => set('nationality', v)} options={['Indian', 'Others']} />
            </Field>
            {data.nationality === 'Others' && (
              <Field label="Specify Nationality">
                <input className="input" value={data.nationalityOther || ''} onChange={e => set('nationalityOther', e.target.value)} disabled={isSubmitted} />
              </Field>
            )}
          </div>

          <div className="form-row">
            <Field label="ID Card Type" required>
              <Select value={data.idCardType} onChange={v => set('idCardType', v)}
                options={['Passport', 'PAN Card', 'Driving Licence']} placeholder="Select ID type" />
            </Field>
            <Field label="ID Card Number" required>
              <input className="input" value={data.idCardNumber || ''} onChange={e => set('idCardNumber', e.target.value)} disabled={isSubmitted} />
            </Field>
          </div>

          <div className="form-row">
            <Field label="Hint Question" required>
              <Select value={data.hintQuestion} onChange={v => set('hintQuestion', v)}
                options={["What is your mother's maiden name?", "What was the name of your first pet?", "What was the name of your primary school?", "What is your favourite movie?", "What city were you born in?", "What is your eldest sibling's middle name?"]}
                placeholder="Select a question" />
            </Field>
            <Field label="Hint Answer" required>
              <input className="input" value={data.hintAnswer || ''} onChange={e => set('hintAnswer', e.target.value)} disabled={isSubmitted} />
            </Field>
          </div>

          <Field label="Government ID Card (Upload)" required>
            <FileUpload fieldKey="registration_id_card" fieldLabel="Government ID Card"
              existingDoc={getDocForField('registration_id_card')}
              onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
          </Field>

          <p className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded p-3">
            CAPTCHA is filled directly on the BIS portal — not required here.
          </p>
        </div>
      </div>
    </div>
  );
}
