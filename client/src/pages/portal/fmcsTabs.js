import DocumentChecklist from './tabs/DocumentChecklist';
import RegistrationForm from './tabs/RegistrationForm';
import OrganizationProfile from './tabs/OrganizationProfile';
import ManagementDetails from './tabs/ManagementDetails';
import ManufacturingProcess from './tabs/ManufacturingProcess';
import PackagingBrandDetails from './tabs/PackagingBrandDetails';
import TestingInspection from './tabs/TestingInspection';
import TestReportDetails from './tabs/TestReportDetails';
import DeclarationUndertaking from './tabs/DeclarationUndertaking';

export const FMCS_TABS = [
  { key: 'checklist', label: 'Document Checklist', path: '' },
  { key: 'registration', label: 'Registration Form', path: 'registration' },
  { key: 'organization', label: 'Organization Profile', path: 'organization' },
  { key: 'management', label: 'Management Details', path: 'management' },
  { key: 'manufacturing', label: 'Manufacturing Process', path: 'manufacturing' },
  { key: 'packaging', label: 'Packaging & Brand Details', path: 'packaging' },
  { key: 'testing', label: 'Testing & Inspection', path: 'testing' },
  { key: 'testReport', label: 'Test Report Details', path: 'test-report' },
  { key: 'declaration', label: 'Declaration & Undertaking', path: 'declaration' },
];

export const FMCS_TAB_COMPONENTS = {
  checklist: DocumentChecklist,
  registration: RegistrationForm,
  organization: OrganizationProfile,
  management: ManagementDetails,
  manufacturing: ManufacturingProcess,
  packaging: PackagingBrandDetails,
  testing: TestingInspection,
  testReport: TestReportDetails,
  declaration: DeclarationUndertaking,
};
