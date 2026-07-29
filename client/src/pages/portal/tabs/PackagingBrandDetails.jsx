import React from 'react';
import { FileUpload } from '../../../components/FormField';
import { Plus, Trash2 } from 'lucide-react';

export default function PackagingBrandDetails({ formData, updateSection, getDocForField, onDocUploaded, onDocRemoved, isSubmitted }) {
  const data = formData.packaging || {};
  const set = (key, val) => updateSection('packaging', { ...data, [key]: val });

  const packagingRows = data.packagingRows || [{ nature: '', marking: '', method: '', qty: '', labelFile: '', batchCode: '' }];
  const setPackagingRow = (i, key, val) => set('packagingRows', packagingRows.map((r, idx) => idx === i ? { ...r, [key]: val } : r));
  const addPackagingRow = () => set('packagingRows', [...packagingRows, { nature: '', marking: '', method: '', qty: '', labelFile: '', batchCode: '' }]);
  const removePackagingRow = (i) => set('packagingRows', packagingRows.filter((_, idx) => idx !== i));

  const brands = data.brands || [{ brandName: '', ownedBy: '', status: '', regDate: '', uploadFile: '' }];
  const setBrandRow = (i, key, val) => set('brands', brands.map((b, idx) => idx === i ? { ...b, [key]: val } : b));
  const addBrand = () => set('brands', [...brands, { brandName: '', ownedBy: '', status: '', regDate: '', uploadFile: '' }]);
  const removeBrand = (i) => set('brands', brands.filter((_, idx) => idx !== i));

  const inputCls = 'w-full bg-transparent text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 rounded px-1 py-0.5';

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="section-header">1. Packaging and Marking Details</div>
        <div className="p-6 space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-border rounded">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="px-2 py-1.5 text-left">Nature of Packaging *</th>
                  <th className="px-2 py-1.5 text-left">Marking on Article *</th>
                  <th className="px-2 py-1.5 text-left" title="Brand, product description, type, rating etc.">Method of Marking *</th>
                  <th className="px-2 py-1.5 text-left">Quantity per Package *</th>
                  <th className="px-2 py-1.5 text-left">Form of Label(s) *</th>
                  <th className="px-2 py-1.5 text-left">Batch / Code / Serial No. for Identification *</th>
                  {!isSubmitted && <th className="px-2 py-1.5 w-8"></th>}
                </tr>
              </thead>
              <tbody>
                {packagingRows.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-2 py-1.5 border-t border-border">
                      <input className={inputCls} value={row.nature || ''} onChange={e => setPackagingRow(i, 'nature', e.target.value)} disabled={isSubmitted} />
                    </td>
                    <td className="px-2 py-1.5 border-t border-border">
                      <input className={inputCls} value={row.marking || ''} onChange={e => setPackagingRow(i, 'marking', e.target.value)} disabled={isSubmitted} />
                    </td>
                    <td className="px-2 py-1.5 border-t border-border">
                      <input className={inputCls} value={row.method || ''} onChange={e => setPackagingRow(i, 'method', e.target.value)} disabled={isSubmitted} />
                    </td>
                    <td className="px-2 py-1.5 border-t border-border">
                      <input className={inputCls} value={row.qty || ''} onChange={e => setPackagingRow(i, 'qty', e.target.value)} disabled={isSubmitted} />
                    </td>
                    <td className="px-2 py-1.5 border-t border-border">
                      <div className="min-w-45">
                        <FileUpload fieldKey={`packaging_label_${i}`} fieldLabel="Form of Label(s)"
                          existingDoc={getDocForField(`packaging_label_${i}`)} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
                      </div>
                    </td>
                    <td className="px-2 py-1.5 border-t border-border">
                      <input className={inputCls} value={row.batchCode || ''} onChange={e => setPackagingRow(i, 'batchCode', e.target.value)} disabled={isSubmitted} />
                    </td>
                    {!isSubmitted && (
                      <td className="px-2 py-1.5 border-t border-border text-center">
                        <button onClick={() => removePackagingRow(i)} className="text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-gray-400">Method of Marking: brand, product description, type, rating etc.</p>
          {!isSubmitted && (
            <button onClick={addPackagingRow} className="text-xs text-primary hover:underline flex items-center gap-1"><Plus size={13} /> Add row</button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="section-header">2. Brand / Trademark Details</div>
        <div className="p-6 space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-border rounded">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="px-2 py-1.5 text-left" title="Actual design depiction">Brand Name / Trademark *</th>
                  <th className="px-2 py-1.5 text-left">Owned By *</th>
                  <th className="px-2 py-1.5 text-left">Registered / Unregistered *</th>
                  <th className="px-2 py-1.5 text-left">Date of Registration / Introduction *</th>
                  <th className="px-2 py-1.5 text-left">Upload File *</th>
                  {!isSubmitted && <th className="px-2 py-1.5 w-8"></th>}
                </tr>
              </thead>
              <tbody>
                {brands.map((brand, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-2 py-1.5 border-t border-border">
                      <input className={inputCls} value={brand.brandName || ''} onChange={e => setBrandRow(i, 'brandName', e.target.value)} disabled={isSubmitted} />
                    </td>
                    <td className="px-2 py-1.5 border-t border-border">
                      <input className={inputCls} value={brand.ownedBy || ''} onChange={e => setBrandRow(i, 'ownedBy', e.target.value)} disabled={isSubmitted} />
                    </td>
                    <td className="px-2 py-1.5 border-t border-border">
                      <select className="text-xs border border-border rounded px-1 py-0.5 bg-white" value={brand.status || ''} onChange={e => setBrandRow(i, 'status', e.target.value)} disabled={isSubmitted}>
                        <option value="">Select</option>
                        <option value="Registered">Registered</option>
                        <option value="Unregistered">Unregistered</option>
                      </select>
                    </td>
                    <td className="px-2 py-1.5 border-t border-border">
                      <input type="date" className={inputCls} value={brand.regDate || ''} onChange={e => setBrandRow(i, 'regDate', e.target.value)} disabled={isSubmitted} />
                    </td>
                    <td className="px-2 py-1.5 border-t border-border">
                      <div className="min-w-45">
                        <FileUpload fieldKey={`packaging_brand_file_${i}`} fieldLabel="Brand/Trademark Upload"
                          existingDoc={getDocForField(`packaging_brand_file_${i}`)} onUploaded={onDocUploaded} onRemoved={onDocRemoved} />
                      </div>
                    </td>
                    {!isSubmitted && (
                      <td className="px-2 py-1.5 border-t border-border text-center">
                        <button onClick={() => removeBrand(i)} className="text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!isSubmitted && (
            <button onClick={addBrand} className="text-xs text-primary hover:underline flex items-center gap-1"><Plus size={13} /> Add row</button>
          )}
        </div>
      </div>
    </div>
  );
}
