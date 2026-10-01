import { RepeatingTable } from '../../../components/RepeatingTable';

const FEE_PAID_COLUMNS = [
  { key: 'transactionNumber', label: 'Transaction Number', type: 'text' },
  { key: 'receipt', label: 'Receipt', type: 'text' },
  { key: 'transactionDate', label: 'Transaction Date', type: 'date' },
  { key: 'duration', label: 'Duration', type: 'text' },
  { key: 'feeType', label: 'Fee Type', type: 'text' },
  { key: 'amount', label: 'Amount', type: 'text' },
  { key: 'amountInDefault', label: 'Amount in Default', type: 'text' },
];

export default function AdvanceFeePaid({ formData, updateSection, isSubmitted }) {
  const data = formData.advanceFeePaid || {};
  const rows = data.rows || [{ id: 'row-1' }];

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">Details of the Advance Marking Fee Paid During the Period</div>
        <div className="p-6">
          <RepeatingTable sectionKey="advanceFeePaid" columns={FEE_PAID_COLUMNS} rows={rows}
            onChange={v => updateSection('advanceFeePaid', { ...data, rows: v })} isSubmitted={isSubmitted} />
        </div>
      </div>
    </div>
  );
}
