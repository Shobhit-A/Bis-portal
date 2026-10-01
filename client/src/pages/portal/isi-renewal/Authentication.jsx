import { Field, FileUpload } from '../../../components/FormField';

const DECLARATION_TEXT = "If any additional amount is found to be payable by the undersigned due to change in unit rates or revision of Minimum Marking Fee during the validity period of license, I hereby undertake to deposit the required amount as conveyed by the Bureau, within seven days of receipt of communication by the Bureau. In case of failure to deposit the required amount within the stipulated time-frame, the license shall be liable to be suspended unless the Bureau has extended the deadline for submission of the dues.";

Authentication.isComplete = (formData, getDocForField) => {
  const d = formData.authentication || {};
  const missing = [];
  if (!getDocForField('authentication_ca_affidavit')) missing.push('Authentication by Chartered Accountant / Affidavit-Undertaking');
  if (!d.agreed) missing.push('I Agree to the Declaration & Notice');
  return missing;
};

export default function Authentication({ formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  const data = formData.authentication || {};
  const set = (key, val) => updateSection('authentication', { ...data, [key]: val });

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">Disclaimer</div>
        <div className="p-6 space-y-4">
          <Field label="Authentication by Chartered Accountant or by the manufacturer by giving an affidavit / undertaking" required>
            <FileUpload fieldKey="authentication_ca_affidavit" fieldLabel="CA Authentication / Affidavit-Undertaking"
              existingDoc={getDocForField('authentication_ca_affidavit')} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
          </Field>
          <p className="text-xs text-gray-500">Monthly production details uploaded must be on the CA's letterhead in the Renewal application.</p>
        </div>
      </div>

      <div className="card">
        <div className="section-header">Declaration & Notice</div>
        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-600 leading-relaxed">• {DECLARATION_TEXT}</p>
          <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" className="mt-0.5" checked={data.agreed || false}
              onChange={e => set('agreed', e.target.checked)} disabled={isSubmitted} />
            I Agree
          </label>
        </div>
      </div>
    </div>
  );
}
