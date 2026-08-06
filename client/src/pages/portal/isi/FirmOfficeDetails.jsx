import React from 'react';
import { Field, Select, FileUpload } from '../../../components/FormField';
import { COUNTRIES } from '../tabs/OrganizationProfile';

export default function FirmOfficeDetails({ formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  const data = formData.firmOffice || {};
  const set = (key, val) => updateSection('firmOffice', { ...data, [key]: val });
  const d = (key) => ({ value: data[key] || '', onChange: e => set(key, e.target.value), disabled: isSubmitted, className: 'input' });

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">1. User / Contact Details</div>
        <div className="p-6">
          <div className="form-row">
            <Field label="Registered Email" required><input type="email" {...d('registeredEmail')} /></Field>
            <Field label="Registered Mobile Number" required><input {...d('registeredMobile')} maxLength={10} /></Field>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-header">2. Firm / Office Details</div>
        <div className="p-6 space-y-4">
          <div className="form-row">
            <Field label="Firm Name" required><input {...d('firmName')} /></Field>
            <Field label="CEO / MD Name" required><input {...d('ceoName')} /></Field>
          </div>
          <Field label="Office Address Line 1" required><input {...d('officeAddr1')} /></Field>
          <Field label="Office Address Line 2"><input {...d('officeAddr2')} /></Field>
          <div className="form-row">
            <Field label="Country" required>
              <Select value={data.officeCountry} onChange={v => set('officeCountry', v)} options={COUNTRIES} />
            </Field>
            <Field label="State" required><input {...d('officeState')} /></Field>
          </div>
          <div className="form-row">
            <Field label="District" required><input {...d('officeDistrict')} /></Field>
            <Field label="City" required><input {...d('officeCity')} /></Field>
          </div>
          <div className="form-row">
            <Field label="PIN Code"><input {...d('officePIN')} maxLength={6} /></Field>
            <Field label="Office Email" required><input type="email" {...d('officeEmail')} /></Field>
          </div>
          <div className="form-row">
            <Field label="Office Mobile"><input {...d('officeMobile')} /></Field>
            <Field label="Alternate Mobile"><input {...d('altMobile')} /></Field>
          </div>
          <div className="form-row">
            <Field label="Landline STD Code"><input {...d('landlineSTD')} /></Field>
            <Field label="Landline Number"><input {...d('landlineNumber')} /></Field>
          </div>
          <div className="form-row">
            <Field label="Address Proof Document Type" required>
              <Select value={data.officeAddrProofType} onChange={v => set('officeAddrProofType', v)}
                options={['GST Registration Certificate', 'Business Licence', 'Any Other']} />
            </Field>
            <Field label="Address Proof Document" required>
              <FileUpload fieldKey="firmOffice_office_addr_proof" fieldLabel="Office Address Proof"
                existingDoc={getDocForField('firmOffice_office_addr_proof')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
            </Field>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-header">3. Registration Details</div>
        <div className="p-6 space-y-4">
          <div className="form-row">
            <Field label="Nature of Firm" required>
              <Select value={data.natureOfFirm} onChange={v => set('natureOfFirm', v)}
                options={['Proprietorship', 'Partnership', 'Pvt Ltd', 'Public Ltd', 'LLP', 'Others']} />
            </Field>
            <Field label="Scale" required>
              <Select value={data.scale} onChange={v => set('scale', v)} options={['Micro', 'Small', 'Medium', 'Large']} />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Sector" required>
              <Select value={data.sector} onChange={v => set('sector', v)} options={['Private', 'Public']} />
            </Field>
            <Field label="Women Entrepreneur" required>
              <Select value={data.womenEntrepreneur} onChange={v => set('womenEntrepreneur', v)} options={['Yes', 'No']} />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Startup" required>
              <Select value={data.startup} onChange={v => set('startup', v)} options={['Yes', 'No']} />
            </Field>
            <Field label="Date of Registration"><input type="date" {...d('regDate')} /></Field>
          </div>
          <div className="form-row">
            <Field label="Registration Number"><input {...d('registrationNumber')} /></Field>
            <Field label="PAN Number"><input {...d('panNumber')} /></Field>
          </div>
          <div className="form-row">
            <Field label="GST Number" required><input {...d('gstNumber')} /></Field>
            <Field label="GST Certificate" required>
              <FileUpload fieldKey="firmOffice_gst_cert" fieldLabel="GST Certificate"
                existingDoc={getDocForField('firmOffice_gst_cert')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Proof of Establishment Type" required>
              <Select value={data.estabProofType} onChange={v => set('estabProofType', v)}
                options={['Certificate of Incorporation', 'Business Licence', 'Partnership Deed', 'Proprietorship Declaration', 'GST Registration Certificate', 'Udyam Registration Certificate', 'Trade Licence', 'Others']} />
            </Field>
            <Field label="Proof of Establishment Document" required>
              <FileUpload fieldKey="firmOffice_estab_proof" fieldLabel="Proof of Establishment"
                existingDoc={getDocForField('firmOffice_estab_proof')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
            </Field>
          </div>
          <Field label="Business Licence Number"><input {...d('businessLicenceNumber')} /></Field>
        </div>
      </div>
    </div>
  );
}
