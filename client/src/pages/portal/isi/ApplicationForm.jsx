import React from 'react';
import { Field, Select, FileUpload } from '../../../components/FormField';
import { RepeatingTable } from '../../../components/RepeatingTable';
import { COUNTRIES } from '../tabs/OrganizationProfile';

ApplicationForm.isComplete = (formData, getDocForField) => {
  const office = formData.firmOffice || {};
  const factory = formData.factory || {};
  const standard = formData.standard || {};
  const missing = [];

  if (!office.firmName) missing.push('Firm Name');
  if (!office.officeAddress) missing.push('Office Address');
  if (!office.officeCountry) missing.push('Office Country');
  if (!office.officeState) missing.push('Office State');
  if (!office.officeDistrict) missing.push('Office District');
  if (!office.officeCity) missing.push('Office City');
  if (!office.ceoName) missing.push('CEO Name');
  if (!office.registeredEmail) missing.push('Registered Email');
  if (!office.officeEmail) missing.push('Office Email');
  if (!office.officeAddrProofType) missing.push('Office Address Proof Type');
  if (!getDocForField('firmOffice_office_addr_proof')) missing.push('Office Address Proof Document');
  if (!office.natureOfFirm) missing.push('Nature of Firm');
  if (!office.scale) missing.push('Scale');
  if (!office.sector) missing.push('Sector');
  if (!office.womenEntrepreneur) missing.push('Women Entrepreneur');
  if (!office.startup) missing.push('Startup');
  if (!office.gstNumber) missing.push('GST Number');
  if (!getDocForField('firmOffice_gst_cert')) missing.push('GST Certificate');
  if (!office.estabProofType) missing.push('Proof of Establishment Type');
  if (!getDocForField('firmOffice_estab_proof')) missing.push('Proof of Establishment Document');

  if (!factory.sameAsOffice) missing.push('Factory Address Same as Office question');
  if (!factory.factoryAddress) missing.push('Factory Address');
  if (!factory.country) missing.push('Factory Country');
  if (!factory.state) missing.push('Factory State');
  if (!factory.district) missing.push('Factory District');
  if (!factory.city) missing.push('Factory City');
  if (!factory.email) missing.push('Factory Email');
  if (!factory.sez) missing.push('SEZ question');
  if (!factory.addrProofType) missing.push('Factory Address Proof Type');
  if (!getDocForField('factory_addr_proof')) missing.push('Factory Address Proof Document');

  if (!standard.knowsStandard) missing.push('Indian Standard question');
  if (standard.knowsStandard === 'Yes' && !standard.indianStandard) missing.push('Indian Standard');
  if (!standard.acceptsSIT) missing.push('Scheme of Inspection & Testing acceptance');
  const varietyOk = (standard.rows || []).some(r => r.variety && getDocForField(`standard_variety_${r.id}`));
  if (!varietyOk) missing.push('Product Variety');

  return missing;
};

export default function ApplicationForm({ formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  const office = formData.firmOffice || {};
  const setOffice = (key, val) => updateSection('firmOffice', { ...office, [key]: val });
  const o = (key) => ({ value: office[key] || '', onChange: e => setOffice(key, e.target.value), disabled: isSubmitted, className: 'input' });

  const factory = formData.factory || {};
  const setFactory = (key, val) => updateSection('factory', { ...factory, [key]: val });
  const f = (key) => ({ value: factory[key] || '', onChange: e => setFactory(key, e.target.value), disabled: isSubmitted, className: 'input' });

  const standard = formData.standard || {};
  const setStandard = (key, val) => updateSection('standard', { ...standard, [key]: val });

  const copyFromOffice = () => {
    updateSection('factory', {
      ...factory,
      factoryAddress: office.officeAddress || '',
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
        <div className="section-header">Firm / Office Details</div>
        <div className="p-6 space-y-4">
          <Field label="Firm Name" required><input {...o('firmName')} /></Field>
          <Field label="Office Address" required><input {...o('officeAddress')} /></Field>
          <div className="form-row">
            <Field label="Country" required>
              <Select value={office.officeCountry} onChange={v => setOffice('officeCountry', v)} options={COUNTRIES} />
            </Field>
            <Field label="State" required><input {...o('officeState')} /></Field>
          </div>
          <div className="form-row">
            <Field label="District" required><input {...o('officeDistrict')} /></Field>
            <Field label="City" required><input {...o('officeCity')} /></Field>
          </div>
          <div className="form-row">
            <Field label="PIN Code"><input {...o('officePIN')} maxLength={6} /></Field>
            <Field label="CEO Name" required><input {...o('ceoName')} /></Field>
          </div>
          <div className="form-row">
            <Field label="Registered Email" required><input type="email" {...o('registeredEmail')} /></Field>
            <Field label="Office Email" required><input type="email" {...o('officeEmail')} /></Field>
          </div>
          <div className="form-row">
            <Field label="Registered Mobile No." required><input {...o('officeMobile')} maxLength={10} /></Field>
            <Field label="Alternate Mobile No."><input {...o('altMobile')} /></Field>
          </div>
          <Field label="Landline No."><input {...o('landlineNumber')} /></Field>
          <div className="form-row">
            <Field label="Address Proof Document Type" required>
              <Select value={office.officeAddrProofType} onChange={v => setOffice('officeAddrProofType', v)}
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
        <div className="section-header">Registration Details</div>
        <div className="p-6 space-y-4">
          <div className="form-row">
            <Field label="User ID" hint="BIS portal user ID, if already known"><input {...o('userId')} /></Field>
            <Field label="Application ID" hint="BIS application ID, if already known"><input {...o('applicationId')} /></Field>
          </div>
          <div className="form-row">
            <Field label="Nature of Firm" required>
              <Select value={office.natureOfFirm} onChange={v => setOffice('natureOfFirm', v)}
                options={['Proprietorship', 'Partnership', 'Pvt Ltd', 'Public Ltd', 'LLP', 'Others']} />
            </Field>
            <Field label="Scale" required>
              <Select value={office.scale} onChange={v => setOffice('scale', v)} options={['Micro', 'Small', 'Medium', 'Large']} />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Sector" required>
              <Select value={office.sector} onChange={v => setOffice('sector', v)} options={['Private', 'Public']} />
            </Field>
            <Field label="Women Entrepreneur" required>
              <Select value={office.womenEntrepreneur} onChange={v => setOffice('womenEntrepreneur', v)} options={['Yes', 'No']} />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Startup" required>
              <Select value={office.startup} onChange={v => setOffice('startup', v)} options={['Yes', 'No']} />
            </Field>
            <Field label="Date of Registration"><input type="date" {...o('regDate')} /></Field>
          </div>
          <Field label="Registration Number"><input {...o('registrationNumber')} /></Field>
          <div className="form-row">
            <Field label="GST Number" required><input {...o('gstNumber')} /></Field>
            <Field label="GST Certificate" required>
              <FileUpload fieldKey="firmOffice_gst_cert" fieldLabel="GST Certificate"
                existingDoc={getDocForField('firmOffice_gst_cert')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
            </Field>
          </div>
          <Field label="PAN Number"><input {...o('panNumber')} /></Field>
          <div className="form-row">
            <Field label="Proof of Establishment of Firm" required>
              <Select value={office.estabProofType} onChange={v => setOffice('estabProofType', v)}
                options={['Certificate of Incorporation', 'Business Licence', 'Partnership Deed', 'Proprietorship Declaration', 'GST Registration Certificate', 'Udyam Registration Certificate', 'Trade Licence', 'Others']} />
            </Field>
            <Field label="Proof of Establishment Document" required>
              <FileUpload fieldKey="firmOffice_estab_proof" fieldLabel="Proof of Establishment"
                existingDoc={getDocForField('firmOffice_estab_proof')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
            </Field>
          </div>
          <Field label="Business Licence Number"><input {...o('businessLicenceNumber')} /></Field>
        </div>
      </div>

      <div className="card">
        <div className="section-header">Factory Details</div>
        <div className="p-6 space-y-4">
          <div className="form-row">
            <Field label="Is Factory Address same as Office Address?" required>
              <Select value={factory.sameAsOffice} onChange={v => setFactory('sameAsOffice', v)} options={['Yes', 'No']} />
            </Field>
            {factory.sameAsOffice === 'Yes' && !isSubmitted && (
              <div className="flex items-end">
                <button type="button" onClick={copyFromOffice} className="btn-secondary text-xs">Copy from Office</button>
              </div>
            )}
          </div>
          <Field label="Factory Address" required><input {...f('factoryAddress')} /></Field>
          <div className="form-row">
            <Field label="Country" required>
              <Select value={factory.country} onChange={v => setFactory('country', v)} options={COUNTRIES} />
            </Field>
            <Field label="State" required><input {...f('state')} /></Field>
          </div>
          <div className="form-row">
            <Field label="District" required><input {...f('district')} /></Field>
            <Field label="City" required><input {...f('city')} /></Field>
          </div>
          <div className="form-row">
            <Field label="PIN Code"><input {...f('pin')} maxLength={6} /></Field>
            <Field label="Landline Number"><input {...f('landlineNumber')} /></Field>
          </div>
          <div className="form-row">
            <Field label="Factory Email" required><input type="email" {...f('email')} /></Field>
            <Field label="Registered Email"><input type="email" {...f('registeredEmail')} /></Field>
          </div>
          <div className="form-row">
            <Field label="Registered Mobile No."><input {...f('mobile')} /></Field>
            <Field label="Alternate Mobile No."><input {...f('altMobile')} /></Field>
          </div>
          <div className="form-row">
            <Field label="Latitude" hint="Check your address proof documents for exact coordinates"><input {...f('latitude')} /></Field>
            <Field label="Longitude"><input {...f('longitude')} /></Field>
          </div>
          <Field label="SEZ (Special Economic Zone)?" required>
            <Select value={factory.sez} onChange={v => setFactory('sez', v)} options={['Yes', 'No']} />
          </Field>
          <div className="form-row">
            <Field label="Address Proof Document Type" required>
              <Select value={factory.addrProofType} onChange={v => setFactory('addrProofType', v)}
                options={['GST Registration Certificate', 'Business Licence', 'Any Other']} />
            </Field>
            <Field label="Factory Address Proof" required>
              <FileUpload fieldKey="factory_addr_proof" fieldLabel="Factory Address Proof"
                existingDoc={getDocForField('factory_addr_proof')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
            </Field>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-header">Indian Standard Details</div>
        <div className="p-6 space-y-4">
          <Field label="Do you know the Indian Standard applicable to your product?" required>
            <Select value={standard.knowsStandard} onChange={v => setStandard('knowsStandard', v)} options={['Yes', 'No']} />
          </Field>
          {standard.knowsStandard === 'Yes' && (
            <Field label="Indian Standard" required hint="e.g. IS 10617:2018">
              <input className="input" value={standard.indianStandard || ''} onChange={e => setStandard('indianStandard', e.target.value)} disabled={isSubmitted} />
            </Field>
          )}
          {standard.knowsStandard === 'No' && (
            <p className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded p-3">
              Absolute Veritas will help identify the applicable standard.
            </p>
          )}
        </div>
      </div>

      <div className="card">
        <div className="section-header">Scheme of Inspection and Testing</div>
        <div className="p-6">
          <Field label="Do you accept the Scheme of Inspection & Testing (SIT) specified by BIS w.r.t. frequency of testing and inspection?" required>
            <Select value={standard.acceptsSIT} onChange={v => setStandard('acceptsSIT', v)} options={['Yes', 'No']} />
          </Field>
        </div>
      </div>

      <div className="card">
        <div className="section-header">Product Variety</div>
        <div className="p-6">
          <RepeatingTable sectionKey="standard" columns={[
            { key: 'variety', label: 'Variety Applied For', type: 'text' },
            { key: 'doc', label: 'Upload Supporting Documents', type: 'file', fieldKeySuffix: 'variety' },
          ]} rows={standard.rows} onChange={rows => setStandard('rows', rows)} getDocForField={getDocForField}
            onDocUploaded={onDocUploaded} onDocRemoved={onDocRemoved} isSubmitted={isSubmitted} />
        </div>
      </div>
    </div>
  );
}
