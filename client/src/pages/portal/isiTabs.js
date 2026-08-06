import DocumentChecklist from './isi/DocumentChecklist';
import FirmOfficeDetails from './isi/FirmOfficeDetails';
import FactoryDetails from './isi/FactoryDetails';
import StandardVariety from './isi/StandardVariety';
import ManagementDetails from './isi/ManagementDetails';
import ManufacturingProcess from './isi/ManufacturingProcess';
import PackagingBrandDetails from './isi/PackagingBrandDetails';
import TestingInspection from './isi/TestingInspection';
import TestReportDetails from './isi/TestReportDetails';
import DeclarationUndertaking from './isi/DeclarationUndertaking';

export const ISI_TABS = [
  { key: 'checklist', label: 'Document Checklist', path: '' },
  { key: 'firmOffice', label: 'Firm, Office & Registration', path: 'firm-office' },
  { key: 'factory', label: 'Factory Details', path: 'factory' },
  { key: 'standard', label: 'Indian Standard & Product Variety', path: 'standard-variety' },
  { key: 'management', label: 'Management Details', path: 'management' },
  { key: 'manufacturing', label: 'Manufacturing Process', path: 'manufacturing' },
  { key: 'packagingBrand', label: 'Packaging & Brand Details', path: 'packaging-brand' },
  { key: 'testing', label: 'Testing & Inspection', path: 'testing' },
  { key: 'testReport', label: 'Test Report Details', path: 'test-report' },
  { key: 'declaration', label: 'Declaration & Undertaking', path: 'declaration' },
];

export const ISI_TAB_COMPONENTS = {
  checklist: DocumentChecklist,
  firmOffice: FirmOfficeDetails,
  factory: FactoryDetails,
  standard: StandardVariety,
  management: ManagementDetails,
  manufacturing: ManufacturingProcess,
  packagingBrand: PackagingBrandDetails,
  testing: TestingInspection,
  testReport: TestReportDetails,
  declaration: DeclarationUndertaking,
};
