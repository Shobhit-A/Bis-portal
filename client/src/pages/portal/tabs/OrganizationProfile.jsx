import React from 'react';
import { Field, Select, FileUpload } from '../../../components/FormField';

export const COUNTRIES = ['India','Afghanistan','Australia','Bahrain','Bangladesh','Brazil','Canada','China','Egypt','France','Germany','Indonesia','Iran','Iraq','Italy','Japan','Kenya','Kuwait','Malaysia','Mexico','Myanmar','Nepal','Netherlands','New Zealand','Nigeria','Oman','Pakistan','Philippines','Qatar','Russia','Saudi Arabia','Singapore','South Africa','South Korea','Sri Lanka','Thailand','UAE','United Kingdom','USA','Vietnam'];

OrganizationProfile.isComplete = (formData, getDocForField) => {
  const d = formData.organization || {};
  const missing = [];
  if (!d.registeredEmail) missing.push('Registered Email');
  if (!d.registeredMobile) missing.push('Registered Mobile Number');
  if (!d.firmName) missing.push('Firm Name');
  if (!d.ceoName) missing.push('CEO Name');
  if (!d.officeAddressLine1) missing.push('Office Address');
  if (!d.officeCountry) missing.push('Office Country');
  if (!d.officeAddr1) missing.push('Office Address 1');
  if (!d.officeAddr2) missing.push('Office Address 2');
  if (!d.officeCity) missing.push('Office City');
  if (!d.officeAddrProofType) missing.push('Address Proof Document Type');
  if (!getDocForField('organization_office_addr_proof')) missing.push('Office Address Proof');
  if (!d.officeEmail) missing.push('Firm/Office Email');
  if (!d.sector) missing.push('Sector');
  if (!d.scale) missing.push('Scale');
  if (!d.estabProofType) missing.push('Proof of Establishment Document Type');
  if (!getDocForField('organization_estab_proof')) missing.push('Proof of Establishment');
  if (!d.factoryAddressLine1) missing.push('Factory Address');
  if (!d.factoryCountry) missing.push('Factory Country');
  if (!d.factoryAddr1) missing.push('Factory Address 1');
  if (!d.factoryAddr2) missing.push('Factory Address 2');
  if (!d.factoryCity) missing.push('Factory City');
  if (!d.factoryAddrProofType) missing.push('Factory Address Proof Document Type');
  if (!getDocForField('organization_factory_addr_proof')) missing.push('Factory Address Proof');
  if (!d.manufacturerEmail) missing.push('Manufacturer Email');
  return missing;
};

export default function OrganizationProfile({ formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  const data = formData.organization || {};
  const set = (key, val) => updateSection('organization', { ...data, [key]: val });
  const d = (key) => ({ value: data[key] || '', onChange: e => set(key, e.target.value), disabled: isSubmitted, className: 'input' });

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded p-3">
        Following Details are crucial while appling for BIS Certification License. Please fill correct details and upload corresponding documents. Incorrect details or/and documents may lead to rejection of your application.
      </p>

      {/* User Details */}
      <div className="card">
        <div className="section-header">Organization Profile</div>
        <div className="p-6">
          <div className="text-sm font-medium text-gray-700 mb-3">User Details</div>
          <div className="form-row">
            <Field label="Registered Email" required><input type="email" {...d('registeredEmail')} /></Field>
            <Field label="Registered Mobile Number" required><input {...d('registeredMobile')} maxLength={10} /></Field>
          </div>
        </div>
      </div>

      {/* Firm / Office Details */}
      <div className="card">
        <div className="section-header">Firm/Office Details</div>
        <div className="p-6 space-y-4">
          <div className="form-row">
            <Field label="Firm Name" required><input {...d('firmName')} placeholder="Enter Firm Name" /></Field>
            <Field label="CEO Name" required><input {...d('ceoName')} placeholder="Enter Firm CEO Name" /></Field>
          </div>
          <div className="form-row">
            <Field label="Office Address" required>
              <div className="space-y-2">
                <input {...d('officeAddressLine1')} placeholder="Enter Office Address" />
                <input {...d('officeAddressLine2')} placeholder="Enter Office Address" />
              </div>
            </Field>
            <Field label="Country" required>
              <Select value={data.officeCountry} onChange={v => set('officeCountry', v)} options={COUNTRIES} />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Address 1" required><input {...d('officeAddr1')} placeholder="Enter firm Address" /></Field>
            <Field label="Address 2" required><input {...d('officeAddr2')} placeholder="Enter Firm District Name" /></Field>
          </div>
          <div className="form-row">
            <Field label="City" required><input {...d('officeCity')} placeholder="Enter Firm City Name" /></Field>
            <Field label="PIN code"><input {...d('officePIN')} maxLength={6} placeholder="Enter PIN Code" /></Field>
          </div>
          <div className="form-row">
            <Field label="Address Proof Document Type" required>
              <Select value={data.officeAddrProofType} onChange={v => set('officeAddrProofType', v)} options={['Business Licence', 'Any Other']} />
            </Field>
            <Field label="Address Proof Document" required>
              <FileUpload fieldKey="organization_office_addr_proof" fieldLabel="Office Address Proof"
                existingDoc={getDocForField('organization_office_addr_proof')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Firm/Office Email" required><input type="email" {...d('officeEmail')} placeholder="Enter Office E-Mail" /></Field>
            <Field label="Firm/Office Mobile Number"><input {...d('officeMobile')} placeholder="Enter Office Contact Number" /></Field>
          </div>
          <Field label="Landline Number">
            <div className="grid grid-cols-2 gap-3">
              <input {...d('landlineSTD')} placeholder="Enter Office STD Code" />
              <input {...d('landlineNumber')} placeholder="Enter Office Landline" />
            </div>
          </Field>
        </div>
      </div>

      {/* Registration Details */}
      <div className="card">
        <div className="section-header">Registration Details</div>
        <div className="p-6 space-y-4">
          <div className="form-row">
            <Field label="Sector" required>
              <Select value={data.sector} onChange={v => set('sector', v)} options={['Private', 'Public']} />
            </Field>
            <Field label="Scale" required>
              <Select value={data.scale} onChange={v => set('scale', v)} options={['Large', 'Medium', 'Small', 'Micro']} />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Proof of Establishment of Firm Document Type" required>
              <Select value={data.estabProofType} onChange={v => set('estabProofType', v)}
                options={['Certificate of Incorporation', 'Business Licence', 'Partnership Deed', 'Proprietorship Declaration', 'GST Registration Certificate', 'Udyam Registration Certificate', 'Trade Licence']} />
            </Field>
            <Field label="Proof of Establishment of Firm" required>
              <FileUpload fieldKey="organization_estab_proof" fieldLabel="Proof of Establishment"
                existingDoc={getDocForField('organization_estab_proof')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Registration Number/Business License Number"><input {...d('regNumber')} placeholder="Enter Registration/License Number" /></Field>
            <Field label="Date Of Registration"><input type="date" {...d('regDate')} /></Field>
          </div>
        </div>
      </div>

      {/* Factory Details */}
      <div className="card">
        <div className="section-header">Factory Details</div>
        <div className="p-6 space-y-4">
          <div className="form-row">
            <Field label="Factory Address" required>
              <div className="space-y-2">
                <input {...d('factoryAddressLine1')} placeholder="Enter Factory Address" />
                <input {...d('factoryAddressLine2')} placeholder="Enter Factory Address" />
              </div>
            </Field>
            <Field label="Country" required>
              <Select value={data.factoryCountry} onChange={v => set('factoryCountry', v)} options={COUNTRIES} />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Address 1" required><input {...d('factoryAddr1')} placeholder="Enter Factory Address 1" /></Field>
            <Field label="Address 2" required><input {...d('factoryAddr2')} placeholder="Enter Factory Address 2" /></Field>
          </div>
          <div className="form-row">
            <Field label="City" required><input {...d('factoryCity')} placeholder="Enter Factory City Name" /></Field>
            <Field label="PIN code"><input {...d('factoryPIN')} maxLength={6} placeholder="Enter PIN Code" /></Field>
          </div>
          <div className="form-row">
            <Field label="Address Proof Document Type" required>
              <Select value={data.factoryAddrProofType} onChange={v => set('factoryAddrProofType', v)} options={['Business Licence', 'Any Other']} />
            </Field>
            <Field label="Address Proof Document" required>
              <FileUpload fieldKey="organization_factory_addr_proof" fieldLabel="Factory Address Proof"
                existingDoc={getDocForField('organization_factory_addr_proof')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
            </Field>
          </div>
          <Field label="Landline Number">
            <div className="grid grid-cols-2 gap-3">
              <input {...d('factorySTD')} placeholder="Enter Factory STD Code" />
              <input {...d('factoryLandline')} placeholder="Enter Factory Landline" />
            </div>
          </Field>
          <div className="form-row">
            <Field label="Manufacturer Email **" required>
              <input type="email" {...d('manufacturerEmail')} placeholder="Enter Factory E-Mail" />
            </Field>
            <Field label="Manufacturer Mobile Number"><input {...d('manufacturerMobile')} placeholder="Enter Factory Contact Number" /></Field>
          </div>
          <p className="text-xs text-red-600 mt-2">** Disclaimer: Please ensure to provide the accurate contact details of the manufacturer. During the processing of the application, if these details are found to be incorrect, the application is liable for rejection.</p>
        </div>
      </div>
    </div>
  );
}
