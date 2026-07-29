import React from 'react';
import { Field, Select, FileUpload } from '../../../components/FormField';

const COUNTRIES = ['India','Afghanistan','Australia','Bahrain','Bangladesh','Brazil','Canada','China','Egypt','France','Germany','Indonesia','Iran','Iraq','Italy','Japan','Kenya','Kuwait','Malaysia','Mexico','Myanmar','Nepal','Netherlands','New Zealand','Nigeria','Oman','Pakistan','Philippines','Qatar','Russia','Saudi Arabia','Singapore','South Africa','South Korea','Sri Lanka','Thailand','UAE','United Kingdom','USA','Vietnam'];

export default function OrganizationProfile({ formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  const data = formData.organization || {};
  const set = (key, val) => updateSection('organization', { ...data, [key]: val });
  const d = (key) => ({ value: data[key] || '', onChange: e => set(key, e.target.value), disabled: isSubmitted, className: 'input' });

  return (
    <div className="space-y-6">
      {/* User Details */}
      <div className="card">
        <div className="section-header">1. User Details</div>
        <div className="p-6">
          <div className="form-row">
            <Field label="Registered Email" required><input type="email" {...d('registeredEmail')} /></Field>
            <Field label="Registered Mobile Number" required><input {...d('registeredMobile')} maxLength={10} /></Field>
          </div>
        </div>
      </div>

      {/* Firm / Office Details */}
      <div className="card">
        <div className="section-header">2. Firm / Office Details</div>
        <div className="p-6 space-y-4">
          <div className="form-row">
            <Field label="Firm Name" required><input {...d('firmName')} /></Field>
            <Field label="CEO / MD Name" required><input {...d('ceoName')} /></Field>
          </div>
          <Field label="Address Line 1" required><input {...d('officeAddr1')} /></Field>
          <Field label="Address Line 2"><input {...d('officeAddr2')} /></Field>
          <div className="form-row">
            <Field label="Country" required>
              <Select value={data.officeCountry} onChange={v => set('officeCountry', v)} options={COUNTRIES} />
            </Field>
            <Field label="District" required><input {...d('officeDistrict')} /></Field>
          </div>
          <div className="form-row">
            <Field label="City" required><input {...d('officeCity')} /></Field>
            <Field label="PIN Code"><input {...d('officePIN')} maxLength={6} /></Field>
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
            <Field label="Firm / Office Email" required><input type="email" {...d('officeEmail')} /></Field>
            <Field label="Firm / Office Mobile"><input {...d('officeMobile')} /></Field>
          </div>
          <div className="form-row">
            <Field label="Landline STD Code"><input {...d('landlineSTD')} /></Field>
            <Field label="Landline Number"><input {...d('landlineNumber')} /></Field>
          </div>
        </div>
      </div>

      {/* Registration Details */}
      <div className="card">
        <div className="section-header">3. Registration Details</div>
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
            <Field label="Proof of Establishment Type" required>
              <Select value={data.estabProofType} onChange={v => set('estabProofType', v)}
                options={['Certificate of Incorporation', 'Business Licence', 'Partnership Deed', 'Proprietorship Declaration', 'GST Registration Certificate', 'Udyam Registration Certificate', 'Trade Licence']} />
            </Field>
            <Field label="Proof of Establishment Document" required>
              <FileUpload fieldKey="organization_estab_proof" fieldLabel="Proof of Establishment"
                existingDoc={getDocForField('organization_estab_proof')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Registration / Business License Number"><input {...d('regNumber')} /></Field>
            <Field label="Date of Registration"><input type="date" {...d('regDate')} /></Field>
          </div>
        </div>
      </div>

      {/* Factory Details */}
      <div className="card">
        <div className="section-header">4. Factory Details</div>
        <div className="p-6 space-y-4">
          <Field label="Address Line 1" required><input {...d('factoryAddr1')} /></Field>
          <Field label="Address Line 2"><input {...d('factoryAddr2')} /></Field>
          <div className="form-row">
            <Field label="Country" required>
              <Select value={data.factoryCountry} onChange={v => set('factoryCountry', v)} options={COUNTRIES} />
            </Field>
            <Field label="District" required><input {...d('factoryDistrict')} /></Field>
          </div>
          <div className="form-row">
            <Field label="City" required><input {...d('factoryCity')} /></Field>
            <Field label="PIN Code"><input {...d('factoryPIN')} maxLength={6} /></Field>
          </div>
          <div className="form-row">
            <Field label="Factory Address Proof Type" required>
              <Select value={data.factoryAddrProofType} onChange={v => set('factoryAddrProofType', v)} options={['Business Licence', 'Any Other']} />
            </Field>
            <Field label="Factory Address Proof Document" required>
              <FileUpload fieldKey="organization_factory_addr_proof" fieldLabel="Factory Address Proof"
                existingDoc={getDocForField('organization_factory_addr_proof')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Factory Landline STD Code"><input {...d('factorySTD')} /></Field>
            <Field label="Factory Landline Number"><input {...d('factoryLandline')} /></Field>
          </div>
          <div className="form-row">
            <Field label="Manufacturer Email **" required>
              <input type="email" {...d('manufacturerEmail')} />
            </Field>
            <Field label="Manufacturer Mobile Number"><input {...d('manufacturerMobile')} /></Field>
          </div>
          <p className="text-xs text-red-600 mt-2">** Disclaimer: Please ensure the manufacturer contact details are accurate. During the processing of the application, if these details are found to be incorrect, the application is liable for rejection.</p>
        </div>
      </div>
    </div>
  );
}
