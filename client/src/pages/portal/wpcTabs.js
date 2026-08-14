import ServiceRequestForm from './wpc/ServiceRequestForm';
import AuthorizationForm from './wpc/AuthorizationForm';

// Just these 2 sections for now — more will be added as further WPC reference
// documents/screenshots come in.
export const WPC_TABS = [
  { key: 'serviceRequest', label: 'Service Request Form', path: '' },
  { key: 'authorization', label: 'Authorization Format', path: 'authorization' },
];

export const WPC_TAB_COMPONENTS = {
  serviceRequest: ServiceRequestForm,
  authorization: AuthorizationForm,
};
