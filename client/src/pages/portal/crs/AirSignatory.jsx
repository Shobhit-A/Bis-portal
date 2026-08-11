import React from 'react';
import { Field, Select } from '../../../components/FormField';

export const INDIAN_STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry'];

const GOVT_DOCUMENTS = ['PAN Card', 'Aadhaar Card', 'Passport', 'Voter ID', 'Driving License'];

const SCENARIOS = [
  'We have a liaison office / branch office located in India. The details are given below.',
  'We do not have a liaison office / branch office located in India, but Proprietor / Registered User of the Brand/Trademark appearing on the article, located in India. The details are given below.',
  'We do no have a liaison office / branch office located in India and there is no Proprietor / Registered User of the Brand/Trademark appearing on the article, located in India. Therefore, we nominate our authorized Indian representative as per details given below.',
];

AirSignatory.isComplete = (formData) => {
  const d = formData.air || {};
  const missing = [];
  if (!d.scenario) missing.push('Representative Scenario');
  if (!d.repFirmName) missing.push('Indian Representative Firm Name');
  if (!d.repFirmAddress) missing.push('Indian Representative Firm Address');
  return missing;
};

export default function AirSignatory({ formData, updateSection, isSubmitted }) {
  const data = formData.air || {};
  const set = (key, val) => updateSection('air', { ...data, [key]: val });
  const d = (key) => ({ value: data[key] || '', onChange: e => set(key, e.target.value), disabled: isSubmitted, className: 'input' });

  const account = formData.account || {};
  const address = formData.address || {};

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">Manufacturer Details</div>
        <div className="p-6 space-y-2 text-sm">
          <div><span className="text-gray-500">Firm Name:</span> <span className="font-medium">{account.unitName || '—'}</span></div>
          <div><span className="text-gray-500">Firm Address:</span> <span className="font-medium">{address.mfgAddress || '—'}</span></div>
        </div>
      </div>

      <div className="card">
        <div className="section-header">Representative Scenario</div>
        <div className="p-6 space-y-3">
          {SCENARIOS.map((s, i) => (
            <label key={i} className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
              <input type="radio" name="scenario" className="mt-0.5" checked={data.scenario === s}
                onChange={() => set('scenario', s)} disabled={isSubmitted} />
              <span>{String.fromCharCode(97 + i)}) {s}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="section-header">Indian Representative Details</div>
        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-400">Enter "NA" if not applicable to your selected scenario.</p>
          <div className="form-row">
            <Field label="Firm Name" required><input {...d('repFirmName')} /></Field>
            <Field label="Firm Address" required><input {...d('repFirmAddress')} /></Field>
          </div>
          <div className="form-row">
            <Field label="Aadhar Number" hint="Format: xxxx xxxx xxxx"><input {...d('aadharNumber')} /></Field>
            <Field label="Govt. Issued Documents">
              <Select value={data.govtDocType} onChange={v => set('govtDocType', v)} options={GOVT_DOCUMENTS} />
            </Field>
          </div>
          <Field label="Enter Number" hint="The ID number for whichever document type was selected above"><input {...d('govtDocNumber')} /></Field>
          <div className="form-row">
            <Field label="Person Name"><input {...d('personName')} /></Field>
            <Field label="Designation"><input {...d('personDesignation')} /></Field>
          </div>
          <div className="form-row">
            <Field label="Mobile Number"><input {...d('personMobile')} /></Field>
            <Field label="Email"><input type="email" {...d('personEmail')} /></Field>
          </div>
          <div className="form-row">
            <Field label="State">
              <Select value={data.state} onChange={v => set('state', v)} options={INDIAN_STATES} />
            </Field>
            <Field label="Zip Code/Pin"><input {...d('zipCode')} /></Field>
          </div>
        </div>
      </div>
    </div>
  );
}
