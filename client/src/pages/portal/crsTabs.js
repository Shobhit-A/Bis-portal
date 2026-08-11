import DocumentChecklist from './crs/DocumentChecklist';
import RegistrationDetails from './crs/RegistrationDetails';
import ProductTesting from './crs/ProductTesting';
import ModelBrandMapping from './crs/ModelBrandMapping';
import BrandDetails from './crs/BrandDetails';
import ManagementDetails from './crs/ManagementDetails';
import ContactPerson from './crs/ContactPerson';
import AirSignatory from './crs/AirSignatory';
import UploadDocuments from './crs/UploadDocuments';
import DeclarationUndertaking from './tabs/DeclarationUndertaking';

export const CRS_TABS = [
  { key: 'registration', label: 'Registration & Manufacturing Unit Address', path: '' },
  { key: 'checklist', label: 'Document Checklist', path: 'checklist' },
  { key: 'product', label: 'Product & Testing', path: 'product-testing' },
  { key: 'modelBrand', label: 'Model & Brand Mapping', path: 'model-brands' },
  { key: 'brand', label: 'Brand Details', path: 'brand-details' },
  { key: 'management', label: 'Management Details', path: 'management' },
  { key: 'contact', label: 'Contact Person', path: 'contact-person' },
  { key: 'air', label: 'AIR / Authorized Signatory', path: 'air-signatory' },
  { key: 'uploads', label: 'Upload Documents', path: 'upload-documents' },
  { key: 'declaration', label: 'Declaration & Undertaking', path: 'declaration' },
];

export const CRS_TAB_COMPONENTS = {
  registration: RegistrationDetails,
  checklist: DocumentChecklist,
  product: ProductTesting,
  modelBrand: ModelBrandMapping,
  brand: BrandDetails,
  management: ManagementDetails,
  contact: ContactPerson,
  air: AirSignatory,
  uploads: UploadDocuments,
  declaration: DeclarationUndertaking,
};
