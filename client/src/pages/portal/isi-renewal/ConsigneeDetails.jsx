import { RepeatingTable } from '../../../components/RepeatingTable';
import { COUNTRIES } from '../tabs/OrganizationProfile';
import { INDIAN_STATES } from '../crs/AirSignatory';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const CONSIGNEE_COLUMNS = [
  { key: 'brandName', label: 'Brand Name', type: 'text' },
  { key: 'consigneeName', label: "Consignee's Name", type: 'text' },
  { key: 'address', label: 'Address', type: 'text' },
  { key: 'country', label: 'Country', type: 'select', options: COUNTRIES },
  { key: 'state', label: 'State', type: 'select', options: INDIAN_STATES },
  { key: 'district', label: 'District', type: 'text' },
  { key: 'city', label: 'City', type: 'text' },
  { key: 'pincode', label: 'Pincode', type: 'text' },
  { key: 'telephone', label: 'Telephone', type: 'text' },
  { key: 'mobile', label: 'Mobile', type: 'text' },
  { key: 'email', label: 'Email Id', type: 'text' },
  { key: 'quantity', label: 'Quantity', type: 'number' },
  { key: 'year', label: 'Year', type: 'number' },
  { key: 'month', label: 'Month', type: 'select', options: MONTHS },
  { key: 'latitude', label: 'Latitude', type: 'text' },
  { key: 'longitude', label: 'Longitude', type: 'text' },
];

export default function ConsigneeDetails({ formData, updateSection, isSubmitted }) {
  const data = formData.consignee || {};
  const rows = data.rows || [{ id: 'row-1' }];

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">Consignee Details</div>
        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-500">
            List every consignee the product has been supplied to under this license, matching what is regularly updated on the BIS online portal.
          </p>
          <RepeatingTable sectionKey="consignee" columns={CONSIGNEE_COLUMNS} rows={rows}
            onChange={v => updateSection('consignee', { ...data, rows: v })} isSubmitted={isSubmitted} />
        </div>
      </div>
    </div>
  );
}
