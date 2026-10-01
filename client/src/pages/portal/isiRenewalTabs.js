import DocumentChecklist from './isi-renewal/DocumentChecklist';
import CertificateDetails from './isi-renewal/CertificateDetails';
import ProductionReturn from './isi-renewal/ProductionReturn';
import AdvanceFeePaid from './isi-renewal/AdvanceFeePaid';
import RenewalDetails from './isi-renewal/RenewalDetails';
import Authentication from './isi-renewal/Authentication';
import SelfComplianceReport from './isi-renewal/SelfComplianceReport';
import FeeDetails from './isi-renewal/FeeDetails';

export const ISI_RENEWAL_TABS = [
  { key: 'checklist', label: 'Document Checklist', path: '' },
  { key: 'certificate', label: 'Certificate Details', path: 'certificate-details' },
  { key: 'production', label: 'Production Return Details', path: 'production-return' },
  { key: 'advanceFeePaid', label: 'Advance Marking Fee Paid', path: 'advance-fee-paid' },
  { key: 'renewal', label: 'Renewal Details', path: 'renewal-details' },
  { key: 'authentication', label: 'Authentication & Declaration', path: 'authentication' },
  { key: 'selfCompliance', label: 'Self Compliance Report', path: 'self-compliance-report' },
  { key: 'fee', label: 'Fee Details & Payment', path: 'fee-details' },
];

export const ISI_RENEWAL_TAB_COMPONENTS = {
  checklist: DocumentChecklist,
  certificate: CertificateDetails,
  production: ProductionReturn,
  advanceFeePaid: AdvanceFeePaid,
  renewal: RenewalDetails,
  authentication: Authentication,
  selfCompliance: SelfComplianceReport,
  fee: FeeDetails,
};
