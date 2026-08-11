import React from 'react';
import AccountDetails from './AccountDetails';
import AddressDetails from './AddressDetails';

// Real portal shows Registration & Manufacturing Unit and Manufacturing Unit &
// Correspondence Address as a single combined section — compose the two existing
// tab components rather than duplicating their fields into a new file.
export default function RegistrationDetails(props) {
  return (
    <div className="space-y-6">
      <AccountDetails {...props} />
      <AddressDetails {...props} />
    </div>
  );
}
