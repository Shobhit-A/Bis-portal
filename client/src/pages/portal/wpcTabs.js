import DocumentChecklist from './wpc/DocumentChecklist';
import ServiceRequestForm from './wpc/ServiceRequestForm';
import AuthorizationForm from './wpc/AuthorizationForm';

// Just these sections for now — more will be added as further WPC reference
// documents/screenshots come in.
export const WPC_TABS = [
  { key: 'checklist', label: 'Document Checklist', path: '' },
  { key: 'serviceRequest', label: 'Service Request Form', path: 'service-request' },
  { key: 'authorization', label: 'Authorization Format', path: 'authorization' },
];

export const WPC_TAB_COMPONENTS = {
  checklist: DocumentChecklist,
  serviceRequest: ServiceRequestForm,
  authorization: AuthorizationForm,
};
