import React from 'react';

export default function ModelBrandMapping({ formData }) {
  const account = formData.account || {};
  const address = formData.address || {};
  const officeAddress = address.sameAsManufacturing ? address.mfgAddress : (address.corrAddress || '');

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">Application Detail</div>
        <div className="p-6">
          <div className="text-sm">
            <span className="font-semibold text-gray-800">Draft Application Number: </span>
            <span className="text-gray-500">—</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-header">Manufacturer Detail</div>
        <div className="p-6 space-y-4 text-sm">
          <div>
            <div className="font-semibold text-gray-800">Manufacturer Name:</div>
            <div className="text-gray-700 mt-0.5">{account.unitName || '—'}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-800">Manufacturing Unit Address:</div>
            <div className="text-gray-700 mt-0.5">{address.mfgAddress || '—'}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-800">Office Address:</div>
            <div className="text-gray-700 mt-0.5">{officeAddress || '—'}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-header">Map Brand And Model</div>
        <div className="p-6 space-y-3">
          <p className="text-sm text-gray-600">
            Note: "Test reports issued by lab for the selected Indian Standard appear on this page. Kindly ensure that you
            have reviewed and verified the test report from 'Testing and Sample Submission' tab to populate this page."
          </p>
          <p className="text-sm text-gray-500">
            No Test Report Available — this section fills in once test report data is submitted.
          </p>
        </div>
      </div>
    </div>
  );
}
