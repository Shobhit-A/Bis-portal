import { Field } from '../../../components/FormField';

const FEE_ROWS = [
  { key: 'actualMarkingFee', label: 'Actual Marking Fee of the previous period' },
  { key: 'annualLicenceFee', label: 'Annual Licence Fee' },
  { key: 'renewalApplicationFee', label: 'Renewal Application Fee' },
  { key: 'advanceMinMarkingFee', label: 'Advance Minimum Marking Fee for the next period' },
  { key: 'advanceFeePaid', label: 'Advance Marking Fee paid (Subtraction)' },
  { key: 'remainingDues', label: 'Remaining Dues' },
  { key: 'cgst', label: 'CGST (9.0%)' },
  { key: 'sgst', label: 'SGST (9.0%)' },
  { key: 'totalFee', label: 'Total Fee' },
];

const NOTES = [
  'Payments are subject to realisation in BIS Bank account. In case applicable fee(s) is (are) not realised in BIS account within the validity period of licence, late fee as applicable shall be chargeable.',
  'At present concessions are available in the portal for eligible micro scale licensees for one year renewal application only. Concessions for remaining eligible licensees are under development.',
  'Licensees can raise the request for refund for the excessive amount paid to BIS within the 30 days of date of transaction. Kindly contact concerned branch office for refund against the transactions made before 30 days.',
  'In case of payment failure, if money is deducted from your account, the same would be refunded within 7 working days. Please contact your bank in case of further queries. Kindly do not make another attempt for payment unless there is a failure.',
];

FeeDetails.isComplete = (formData) => {
  const d = formData.fee || {};
  const missing = [];
  if (!d.paymentMode) missing.push('Payment Mode');
  return missing;
};

export default function FeeDetails({ formData, updateSection, isSubmitted, onSubmit, submitting }) {
  const data = formData.fee || {};
  const set = (key, val) => updateSection('fee', { ...data, [key]: val });
  const contact = data.contact || {};
  const setContact = (key, val) => set('contact', { ...contact, [key]: val });
  const missing = FeeDetails.isComplete(formData);

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">Application Fee and Contact BIS</div>
        <div className="p-6 space-y-4">
          <div className="text-sm font-medium text-gray-900">Contact BIS</div>
          <Field label="Address"><input className="input" value={contact.address || ''} onChange={e => setContact('address', e.target.value)} disabled={isSubmitted} /></Field>
          <div className="form-row">
            <Field label="Branch Contact No"><input className="input" value={contact.phone || ''} onChange={e => setContact('phone', e.target.value)} disabled={isSubmitted} /></Field>
            <Field label="E-mail"><input className="input" value={contact.email || ''} onChange={e => setContact('email', e.target.value)} disabled={isSubmitted} /></Field>
          </div>
          <p className="text-xs text-gray-400">Note: Your fee will be submitted to this branch.</p>
        </div>
      </div>

      <div className="card">
        <div className="section-header">Fee Details</div>
        <div className="p-6 space-y-4">
          <a href="https://www.manakonline.in/MANAK/static/userManual/PC/Concessions_Minimum_Marking_Fee.pdf"
            target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
            Gazette Notification for Fee Concessions ↗
          </a>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-border rounded">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="px-2 py-1.5 text-left">S.No</th>
                  <th className="px-2 py-1.5 text-left">Fee Description</th>
                  <th className="px-2 py-1.5 text-left">Fee Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {FEE_ROWS.map((row, idx) => (
                  <tr key={row.key} className={`border-t border-border ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-2 py-1.5">{idx + 1}</td>
                    <td className="px-2 py-1.5">{row.label}</td>
                    <td className="px-2 py-1.5">
                      <input type="number" className="text-xs border border-border rounded px-1.5 py-1 w-28"
                        value={data[row.key] || ''} onChange={e => set(row.key, e.target.value)} disabled={isSubmitted} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Field label="Payment Mode" required>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="radio" name="paymentMode" checked={data.paymentMode === 'individual'}
                  onChange={() => set('paymentMode', 'individual')} disabled={isSubmitted} />
                Individual / Retail Banking
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="radio" name="paymentMode" checked={data.paymentMode === 'corporate'}
                  onChange={() => set('paymentMode', 'corporate')} disabled={isSubmitted} />
                Corporate Netbanking
              </label>
            </div>
          </Field>

          <div className="text-xs text-gray-500 space-y-1 pt-2 border-t border-border">
            <div className="font-medium text-gray-700">Note:-</div>
            {NOTES.map((n, i) => <p key={i}>{i + 1}. {n}</p>)}
          </div>
        </div>
      </div>

      {!isSubmitted && (
        <div className="card">
          <div className="p-6">
            <button onClick={onSubmit} disabled={submitting || missing.length > 0}
              className="btn-primary bg-green-600 hover:bg-green-700 w-full py-3 text-base">
              {submitting ? 'Submitting...' : '✓ Submit Renewal Application'}
            </button>
            {missing.length > 0 && (
              <p className="text-xs text-gray-400 mt-2 text-center">Complete all required fields before submitting.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
