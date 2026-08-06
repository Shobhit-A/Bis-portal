import DocumentChecklist from './tabs/DocumentChecklist';
import ApplicationForm from './isi/ApplicationForm';
import ManagementDetails from './tabs/ManagementDetails';
import ManufacturingProcess from './tabs/ManufacturingProcess';
import PackagingBrandDetails from './tabs/PackagingBrandDetails';
import TestingInspection from './tabs/TestingInspection';
import TestReportDetails from './tabs/TestReportDetails';
import DeclarationUndertaking from './tabs/DeclarationUndertaking';

export const ISI_TABS = [
  { key: 'checklist', label: 'Document Checklist', path: '' },
  { key: 'applicationForm', label: 'Application Form', path: 'application-form' },
  { key: 'management', label: 'Management Details', path: 'management' },
  { key: 'manufacturing', label: 'Manufacturing Process', path: 'manufacturing' },
  { key: 'packaging', label: 'Packaging & Brand Details', path: 'packaging' },
  { key: 'testing', label: 'Testing & Inspection', path: 'testing' },
  { key: 'testReport', label: 'Test Report Details', path: 'test-report' },
  { key: 'declaration', label: 'Declaration & Undertaking', path: 'declaration' },
];

export const ISI_TAB_COMPONENTS = {
  checklist: DocumentChecklist,
  applicationForm: ApplicationForm,
  management: ManagementDetails,
  manufacturing: ManufacturingProcess,
  packaging: PackagingBrandDetails,
  testing: TestingInspection,
  testReport: TestReportDetails,
  declaration: DeclarationUndertaking,
};
