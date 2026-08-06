import React from 'react';
import { Field, Select, FileUpload } from '../../../components/FormField';
import { COUNTRIES } from '../tabs/OrganizationProfile';

export default function FactoryDetails({ formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  const data = formData.factory || {};
  const office = formData.firmOffice || {};
  const set = (key, val) => updateSection('factory', { ...data, [key]: val });
  const d = (key) => ({ value: data[key] || '', onChange: e => set(key, e.target.value), disabled: isSubmitted, className: 'input' });

  const copyFromOffice = () => {
    updateSection('factory', {
      ...data,
      addr1: office.officeAddr1 || '',
      addr2: office.officeAddr2 || '',
      country: office.officeCountry || '',
      state: office.officeState || '',
      district: office.officeDistrict || '',
      city: office.officeCity || '',
      pin: office.officePIN || '',
      email: office.officeEmail || '',
      mobile: office.officeMobile || '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">Factory Details</div>
        <div className="p-6 space-y-4">
          <div className="form-row">
            <Field label="Is Factory Address same as Office Address?" required>
              <Select value={data.sameAsOffice} onChange={v => set('sameAsOffice', v)} options={['Yes', 'No']} />
            </Field>
            {data.sameAsOffice === 'Yes' && !isSubmitted && (
              <div className="flex items-end">
                <button type="button" onClick={copyFromOffice} className="btn-secondary text-xs">Copy from Office</button>
              </div>
            )}
          </div>
          <Field label="Factory Address Line 1" required><input {...d('addr1')} /></Field>
          <Field label="Factory Address Line 2"><input {...d('addr2')} /></Field>
          <div className="form-row">
            <Field label="Country" required>
              <Select value={data.country} onChange={v => set('country', v)} options={COUNTRIES} />
            </Field>
            <Field label="State" required><input {...d('state')} /></Field>
          </div>
          <div className="form-row">
            <Field label="District" required><input {...d('district')} /></Field>
            <Field label="City" required><input {...d('city')} /></Field>
          </div>
          <div className="form-row">
            <Field label="PIN Code"><input {...d('pin')} maxLength={6} /></Field>
            <Field label="Factory Email" required><input type="email" {...d('email')} /></Field>
          </div>
          <div className="form-row">
            <Field label="Factory Mobile"><input {...d('mobile')} /></Field>
            <Field label="Alternate Mobile"><input {...d('altMobile')} /></Field>
          </div>
          <div className="form-row">
            <Field label="Landline STD Code"><input {...d('landlineSTD')} /></Field>
            <Field label="Landline Number"><input {...d('landlineNumber')} /></Field>
          </div>
          <div className="form-row">
            <Field label="Latitude"><input {...d('latitude')} /></Field>
            <Field label="Longitude"><input {...d('longitude')} /></Field>
          </div>
          <Field label="SEZ (Special Economic Zone)?" required>
            <Select value={data.sez} onChange={v => set('sez', v)} options={['Yes', 'No']} />
          </Field>
          <div className="form-row">
            <Field label="Factory Address Proof Type" required>
              <Select value={data.addrProofType} onChange={v => set('addrProofType', v)}
                options={['GST Registration Certificate', 'Business Licence', 'Any Other']} />
            </Field>
            <Field label="Factory Address Proof" required>
              <FileUpload fieldKey="factory_addr_proof" fieldLabel="Factory Address Proof"
                existingDoc={getDocForField('factory_addr_proof')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}
