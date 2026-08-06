import React from 'react';
import { Field, Select, FileUpload } from '../../../components/FormField';

export default function UploadDocuments({ formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  const data = formData.uploads || {};
  const set = (key, val) => updateSection('uploads', { ...data, [key]: val });

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">Upload Documents</div>
        <div className="p-6 space-y-4">
          <Field label="Authorization from factory CEO/MD/Head for filling and signing Form-1" required>
            <FileUpload fieldKey="uploads_ceo_auth" fieldLabel="CEO/MD/Head Authorization"
              existingDoc={getDocForField('uploads_ceo_auth')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
          </Field>
          <Field label="Raw Materials/Components" required>
            <FileUpload fieldKey="uploads_raw_materials" fieldLabel="Raw Materials/Components"
              existingDoc={getDocForField('uploads_raw_materials')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
          </Field>
          <Field label="Authorization letter from CEO/top management of AIR firm towards the authorized signatory" required>
            <FileUpload fieldKey="uploads_air_ceo_auth" fieldLabel="AIR CEO Authorization"
              existingDoc={getDocForField('uploads_air_ceo_auth')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
          </Field>
          <Field label="Does the manufacturing unit have complete testing facility installed in-house for ascertaining conformity as per Indian Standard?" required>
            <Select value={data.inHouseTesting} onChange={v => set('inHouseTesting', v)} options={['Yes', 'No']} />
          </Field>
          <Field label="Does the manufacturing unit have complete manufacturing facility for the product and its models/series/type/grade/class/size/rating for which registration is applied?" required>
            <Select value={data.completeManufacturing} onChange={v => set('completeManufacturing', v)} options={['Yes', 'No']} />
          </Field>
          <Field label="ID card of authorized signatory of AIR" required>
            <FileUpload fieldKey="uploads_air_id_card" fieldLabel="AIR Signatory ID Card"
              existingDoc={getDocForField('uploads_air_id_card')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
          </Field>
          <Field label="Other document, if required">
            <FileUpload fieldKey="uploads_other" fieldLabel="Other Document"
              existingDoc={getDocForField('uploads_other')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
          </Field>
          <Field label="Factory Address Proof / Business license" required>
            <FileUpload fieldKey="uploads_factory_proof" fieldLabel="Factory Address Proof / Business License"
              existingDoc={getDocForField('uploads_factory_proof')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
          </Field>
        </div>
      </div>
    </div>
  );
}
