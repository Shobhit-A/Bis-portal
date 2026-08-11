import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Field } from '../../../components/FormField';

// From BIS's QCO-notified product list — used to power the Indian Standard dropdown
// and the "Complete Product List" reference table. `standards` is an array: most
// products have exactly one, but some offer a choice between an old and a new edition,
// or an IS+IEC crosswalk — each array entry is one full, exact, selectable option, so
// nothing here gets naively split on "/" (a "/" can appear both between alternatives
// AND inside a single combined standard reference, e.g. "IS 616:2017 / IEC 60065:2014").
const PRODUCT_LIST = [
  { product: 'AMPLIFIERS WITH INPUT POWER 2000W AND ABOVE', standards: ['IS/IEC 62368(Part 1):2023', 'IS 616:2017 / IEC 60065:2014'], qcoDate: '03 July 2013' },
  { product: 'AUTOMATIC DATA PROCESSING MACHINE', standards: ['IS/IEC 62368(Part 1):2023', 'IS 13252(Part 1):2010/ IEC 60950-1:2005'], qcoDate: '03 July 2013' },
  { product: 'ELECTRONIC CLOCKS WITH MAINS POWER', standards: ['IS 302-2-26:2014'], qcoDate: '03 July 2013' },
  { product: 'ELECTRONIC GAMES (VIDEO)', standards: ['IS/IEC 62368(Part 1):2023', 'IS 616:2017 / IEC 60065:2014'], qcoDate: '03 July 2013' },
  { product: 'ELECTRONIC MUSICAL SYSTEMS WITH INPUT POWER 200W AND ABOVE', standards: ['IS/IEC 62368(Part 1):2023', 'IS 616:2017 / IEC 60065:2014'], qcoDate: '03 July 2013' },
  { product: 'LAPTOP/NOTEBOOK/TABLET', standards: ['IS/IEC 62368(Part 1):2023', 'IS 13252(Part 1):2010/ IEC 60950-1:2005'], qcoDate: '03 July 2013' },
  { product: 'MICROWAVE OVENS', standards: ['IS 302-2-25:2014'], qcoDate: '03 July 2013' },
  { product: 'OPTICAL DISC PLAYERS WITH BUILT IN AMPLIFIERS OF INPUT POWER 200W AND ABOVE', standards: ['IS/IEC 62368(Part 1):2023', 'IS 616:2017 / IEC 60065:2014'], qcoDate: '03 July 2013' },
  { product: 'PLASMA/LCD/LED TELEVISIONS OF SCREEN SIZE 32" AND ABOVE', standards: ['IS 616:2017', 'IS 616:2017 & IS 18112:2025'], qcoDate: '03 July 2013' },
  { product: 'PRINTERS, PLOTTERS', standards: ['IS/IEC 62368(Part 1):2023', 'IS 13252(Part 1):2010/ IEC 60950-1:2005'], qcoDate: '03 July 2013' },
  { product: 'SCANNERS', standards: ['IS/IEC 62368(Part 1):2023', 'IS 13252(Part 1):2010/ IEC 60950-1:2005'], qcoDate: '03 July 2013' },
  { product: 'SET TOP BOX', standards: ['IS/IEC 62368(Part 1):2023', 'IS 13252(Part 1):2010/ IEC 60950-1:2005'], qcoDate: '03 July 2013' },
  { product: 'TELEPHONE ANSWERING MACHINES', standards: ['IS/IEC 62368(Part 1):2023', 'IS 13252(Part 1):2010/ IEC 60950-1:2005'], qcoDate: '03 July 2013' },
  { product: 'VISUAL DISPLAY UNITS, VIDEOS MONITORS OF SCREEN SIZE 32" AND ABOVE', standards: ['IS/IEC 62368(Part 1):2023', 'IS 13252(Part 1):2010/ IEC 60950-1:2005'], qcoDate: '03 July 2013' },
  { product: 'WIRELESS KEYBOARDS', standards: ['IS/IEC 62368(Part 1):2023', 'IS 13252(Part 1):2010/ IEC 60950-1:2005'], qcoDate: '03 July 2013' },
  { product: 'CASH REGISTERS', standards: ['IS/IEC 62368(Part 1):2023', 'IS 13252(Part 1):2010/ IEC 60950-1:2005'], qcoDate: '13 May 2015' },
  { product: 'COPYING MACHINES/DUPLICATORS', standards: ['IS/IEC 62368(Part 1):2023', 'IS 13252(Part 1):2010/ IEC 60950-1:2005'], qcoDate: '13 May 2015' },
  { product: 'PASSPORT READER', standards: ['IS/IEC 62368(Part 1):2023', 'IS 13252(Part 1):2010/ IEC 60950-1:2005'], qcoDate: '13 May 2015' },
  { product: 'POINT OF SALE TERMINALS', standards: ['IS/IEC 62368(Part 1):2023', 'IS 13252(Part 1):2010/ IEC 60950-1:2005'], qcoDate: '13 May 2015' },
  { product: 'MAIL PROCESSING MACHINES/POSTAGE MACHINES/FRANKING MACHINES', standards: ['IS/IEC 62368(Part 1):2023', 'IS 13252(Part 1):2010/ IEC 60950-1:2005'], qcoDate: '13 May 2015' },
  { product: 'POWER BANKS FOR USE IN PORTABLE APPLICATIONS', standards: ['IS/IEC 62368(Part 1):2023', 'IS 13252(Part 1):2010/ IEC 60950-1:2005'], qcoDate: '13 May 2015' },
  { product: 'SMART CARD READER', standards: ['IS/IEC 62368(Part 1):2023', 'IS 13252(Part 1):2010/ IEC 60950-1:2005'], qcoDate: '13 May 2015' },
  { product: 'MOBILE PHONES', standards: ['IS/IEC 62368(Part 1):2023', 'IS 13252(Part 1):2010/ IEC 60950-1:2005'], qcoDate: '13 September 2015' },
  { product: 'SELF-BALLASTED LED LAMPS FOR GENERAL LIGHTING SERVICES', standards: ['IS 16102(Part 1):2012'], qcoDate: '13 September 2015' },
  { product: 'DC OR AC SUPPLIED ELECTRONIC CONTROLGEAR FOR LED MODULES', standards: ['IS 15885(Part 2/Sec 13):2012'], qcoDate: '01 December 2015' },
  { product: 'POWER ADAPTORS FOR AUDIO, VIDEO & SIMILAR ELECTRONIC APPARATUS', standards: ['IS/IEC 62368(Part 1):2023', 'IS 616:2017 / IEC 60065:2014'], qcoDate: '01 December 2015' },
  { product: 'POWER ADAPTORS FOR IT EQUIPMENTS', standards: ['IS/IEC 62368(Part 1):2023', 'IS 13252(Part 1):2010/ IEC 60950-1:2005'], qcoDate: '01 December 2015' },
  { product: 'FIXED GENERAL PURPOSE LED LUMINAIRES', standards: ['IS 10322(Part 5/Sec 1):2012'], qcoDate: '01 March 2016' },
  { product: 'UPS/INVERTORS OF RATING <= 5KVA', standards: ['IS 16242(Part 1):2014'], qcoDate: '01 March 2016' },
  { product: 'SEALED SECONDARY CELLS/BATTERIES (NICKEL SYSTEMS) FOR PORTABLE APPLICATIONS', standards: ['IS 16046(Part 1):2018'], qcoDate: '01 June 2016' },
  { product: 'SEALED SECONDARY CELLS/BATTERIES (LITHIUM SYSTEMS) FOR PORTABLE APPLICATIONS', standards: ['IS 16046(Part 2):2018'], qcoDate: '01 June 2016' },
  { product: 'INDIAN LANGUAGE SUPPORT FOR MOBILE PHONE HANDSETS', standards: ['IS 16333(Part 3):2022'], qcoDate: '01 May 2018' },
  { product: 'Recessed LED Luminaries', standards: ['IS 10322(Part 5/Section 2):2012'], qcoDate: '23 May 2018' },
  { product: 'LED Luminaires for Road and Street lighting', standards: ['IS 10322(Part 5/Section 3):2012'], qcoDate: '23 May 2018' },
  { product: 'LED Flood Lights', standards: ['IS 10322(Part 5/Section 5):2013'], qcoDate: '23 May 2018' },
  { product: 'LED Hand lamps', standards: ['IS 10322(Part 5/Section 6):2013'], qcoDate: '23 May 2018' },
  { product: 'LED Lighting Chains', standards: ['IS 10322(Part 5/Section 7):2017'], qcoDate: '23 May 2018' },
  { product: 'LED Luminaires for Emergency Lighting', standards: ['IS 10322(Part 5/Section 8):2013'], qcoDate: '23 May 2018' },
  { product: 'UPS/Inverters of rating <= 10kVA', standards: ['IS 16242(Part 1):2014 / IS 16242(Part 1):2025 / IEC 62040-1:2017 +AMD1:2021 +AMD2:2022 CSV'], qcoDate: '23 May 2018' },
  { product: 'Plasma/LCD/LED Television of screen size up-to 32"', standards: ['IS 616:2017', 'IS 616:2017 & IS 18112:2025'], qcoDate: '23 May 2018' },
  { product: 'Visual Display Units', standards: ['IS/IEC 62368(Part 1):2023', 'IS 13252(Part 1):2010/ IEC 60950-1:2005'], qcoDate: '23 May 2018' },
  { product: 'CCTV Cameras/CCTV Recorders', standards: ['IS 13252(Part 1):2010, Essential Requirement(s) for Security of CCTV'], qcoDate: '23 May 2018' },
  { product: 'Adapters for household and similar electrical appliances', standards: ['IS 302(Part 1):2008', 'IS 302(Part 1):2024/IEC 60335-1:2020'], qcoDate: '23 May 2018' },
  { product: 'USB driven Barcode readers, barcode scanners, Iris scanners, Optical fingerprint scanners', standards: ['IS/IEC 62368(Part 1):2023', 'IS 13252(Part 1):2010/ IEC 60950-1:2005'], qcoDate: '23 May 2018' },
  { product: 'Smart watches', standards: ['IS/IEC 62368(Part 1):2023', 'IS 13252(Part 1):2010/ IEC 60950-1:2005'], qcoDate: '23 May 2018' },
  { product: 'Crystalline Silicon Terrestrial Photovoltaic (PV) modules (Si wafer based)', standards: ['IS 14286(Part 1/Sec 1):2023/IEC 61215-1-1:2021, IS/IEC 61730-1:2016, IS/IEC 61730-2:2016 OR ...:2023 variants'], qcoDate: '31 March 2019' },
  { product: 'Thin-Film Terrestrial Photovoltaic (PV) Modules (a-Si, CiGs and CdTe)', standards: ['IS 14286(Part 1/Sec 2-4):2023 & IS/IEC 61730-1/2 (2016 or 2023 variants)'], qcoDate: '31 March 2019' },
  { product: 'Power converters for use in photovoltaic power system', standards: ['IS 16221(Part 2):2015/IEC 62109-2:2011, IS/IEC 61683:1999'], qcoDate: '30 June 2021' },
  { product: 'Utility-Interconnected Photovoltaic inverters', standards: ['IS 16221(Part 2):2015/IEC 62109-2:2011, IS 16169:2019/IEC 62116:2014, IS 17980:2022/IEC 62891:2020'], qcoDate: '30 June 2021' },
  { product: 'Storage battery', standards: ['IS 16270:2023'], qcoDate: '01 January 2019' },
  { product: 'Independent LED Modules for General Lighting', standards: ['IS 16103(Part 1):2012 / IS 16103(Part 1):2025 /IEC 62031:2018'], qcoDate: '01 April 2021' },
  { product: 'Lighting Chain (Rope Lights)', standards: ['IS 10322(Part 5/Sec 9):2017'], qcoDate: '01 April 2021' },
  { product: 'Keyboard', standards: ['IS/IEC 62368(Part 1):2023', 'IS 13252(Part 1):2010/ IEC 60950-1:2005'], qcoDate: '01 April 2021' },
  { product: 'Induction Stove', standards: ['IS 302-2-6:2009'], qcoDate: '01 April 2021' },
  { product: 'Automatic Teller Cash dispensing machines', standards: ['IS/IEC 62368(Part 1):2023', 'IS 13252(Part 1):2010/ IEC 60950-1:2005'], qcoDate: '01 April 2021' },
  { product: 'Standalone Hard Disk Drives', standards: ['IS/IEC 62368(Part 1):2023', 'IS 13252(Part 1):2010/ IEC 60950-1:2005'], qcoDate: '01 April 2021' },
  { product: 'Wireless Headphone and Earphone', standards: ['IS/IEC 62368(Part 1):2023', 'IS 616:2017 / IEC 60065:2014'], qcoDate: '01 April 2021' },
  { product: 'USB Type External Solid-State Storage Devices (above 256 GB capacity)', standards: ['IS/IEC 62368(Part 1):2023', 'IS 13252(Part 1):2010/ IEC 60950-1:2005'], qcoDate: '01 April 2021' },
  { product: 'Electronic Musical System with input power below 200 Watts', standards: ['IS/IEC 62368(Part 1):2023', 'IS 616:2017 / IEC 60065:2014'], qcoDate: '01 April 2021' },
  { product: 'Standalone Switch Mode Power Supplies (SMPS) with output voltage 48V (max)', standards: ['IS/IEC 62368(Part 1):2023', 'IS 13252(Part 1):2010/ IEC 60950-1:2005'], qcoDate: '01 April 2021' },
  { product: 'Television other than Plasma/LCD/LED TVs', standards: ['IS 616:2017', 'IS 616:2017 & IS 18112:2025'], qcoDate: '01 April 2021' },
  { product: 'Rice Cooker', standards: ['IS 302-2-15:2009'], qcoDate: '01 April 2021' },
  { product: 'Wireless Microphone', standards: ['IS/IEC 62368(Part 1):2023', 'IS 616:2017 / IEC 60065:2014'], qcoDate: '01 October 2021' },
  { product: 'Digital Camera', standards: ['IS/IEC 62368(Part 1):2023', 'IS 13252(Part 1):2010/ IEC 60950-1:2005'], qcoDate: '01 October 2021' },
  { product: 'Video Camera', standards: ['IS/IEC 62368(Part 1):2023', 'IS 616:2017 / IEC 60065:2014'], qcoDate: '01 October 2021' },
  { product: 'Webcam (Finished Product)', standards: ['IS/IEC 62368(Part 1):2023', 'IS 616:2017 / IEC 60065:2014'], qcoDate: '01 October 2021' },
  { product: 'Smart Speakers (with and without Display)', standards: ['IS/IEC 62368(Part 1):2023', 'IS 616:2017 / IEC 60065:2014'], qcoDate: '01 October 2021' },
  { product: 'Dimmers for LED products', standards: ['IS 60669-2-1:2008'], qcoDate: '01 October 2021' },
  { product: 'Bluetooth Speakers', standards: ['IS/IEC 62368(Part 1):2023', 'IS 616:2017 / IEC 60065:2014'], qcoDate: '01 October 2021' },
  { product: 'Ortho Phosphoric Acid', standards: ['IS 798:2020'], qcoDate: '10 December 2022' },
  { product: 'Polyphosphoric Acid', standards: ['IS 17439:2020'], qcoDate: '22 December 2022' },
  { product: 'Trimethyl Phosphite Technical Grade', standards: ['IS 17412:2020'], qcoDate: '01 October 2022' },
  { product: 'Television Sets', standards: ['IS 18112:2025'], qcoDate: '26 July 2026' },
  { product: 'Extended Reality Products (Augmented Reality, Virtual Reality, Mixed Reality etc.)', standards: ['IS/IEC 62368: Part 1: 2023'], qcoDate: '05 December 2025' },
];

function ProductListModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[85vh] shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="font-semibold text-gray-900">Complete Product List</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto p-6">
          <table className="w-full text-xs border border-border rounded">
            <thead>
              <tr className="bg-primary text-white">
                <th className="px-3 py-2 text-left font-medium w-12">Sl. No.</th>
                <th className="px-3 py-2 text-left font-medium">Product</th>
                <th className="px-3 py-2 text-left font-medium">Indian Standard Number (IS No.)</th>
                <th className="px-3 py-2 text-left font-medium">Date of Implementation of QCO</th>
              </tr>
            </thead>
            <tbody>
              {PRODUCT_LIST.map((p, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-1.5 border-t border-border align-top">{i + 1}</td>
                  <td className="px-3 py-1.5 border-t border-border align-top">{p.product}</td>
                  <td className="px-3 py-1.5 border-t border-border align-top">{p.standards.join(' / ')}</td>
                  <td className="px-3 py-1.5 border-t border-border align-top whitespace-nowrap">{p.qcoDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function standardOptionsFor(productName) {
  const match = PRODUCT_LIST.find(p => p.product === productName);
  return match ? match.standards : [];
}

const ALL_STANDARDS = [...new Set(PRODUCT_LIST.flatMap(p => p.standards))].sort();

function productsForStandard(standard) {
  return PRODUCT_LIST.filter(p => p.standards.includes(standard)).map(p => p.product);
}

export default function ProductTesting({ formData, updateSection, isSubmitted }) {
  const account = formData.account || {};
  const address = formData.address || {};
  const data = formData.product || {};
  const set = (key, val) => updateSection('product', { ...data, [key]: val });
  const [showList, setShowList] = useState(false);

  const mode = data.mode || 'category';

  // Indian Standard Wise flow: picking a standard scopes the Product Name dropdown to
  // products that list it, but the user still has to pick the product themselves.
  const standardProductOptions = productsForStandard(data.indianStandard);
  const handleStandardChange = (e) => {
    const indianStandard = e.target.value;
    updateSection('product', { ...data, indianStandard, productName: '' });
  };

  // Category-wise flow: picking a category scopes the Indian Standard / Sub Category /
  // Product Name dropdowns to it, but each still requires its own explicit selection —
  // nothing gets auto-filled.
  const categoryStandardOptions = standardOptionsFor(data.productCategory);
  const handleCategoryChange = (e) => {
    const productCategory = e.target.value;
    updateSection('product', { ...data, productCategory, indianStandard: '', subCategory: '', productName: '' });
  };

  return (
    <div className="space-y-6">
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-blue-50 text-gray-700">
              <th className="px-4 py-2.5 text-left font-semibold border-b border-border">Unit Name</th>
              <th className="px-4 py-2.5 text-left font-semibold border-b border-border">Manufacturing Unit Address</th>
              <th className="px-4 py-2.5 text-left font-semibold border-b border-border">Office Address</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-3 align-top text-gray-800">{account.unitName || '—'}</td>
              <td className="px-4 py-3 align-top text-gray-800">{address.mfgAddress || '—'}</td>
              <td className="px-4 py-3 align-top text-gray-800">{address.sameAsManufacturing ? address.mfgAddress : (address.corrAddress || '—')}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="section-header">Product Details</div>
        <div className="p-6 space-y-4">
          <Field label="Enter Product Details" required>
            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="radio" name="productMode" checked={mode === 'category'} onChange={() => set('mode', 'category')} disabled={isSubmitted} />
                Product Category Wise
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="radio" name="productMode" checked={mode === 'standard'} onChange={() => set('mode', 'standard')} disabled={isSubmitted} />
                Indian Standard Wise
              </label>
              <button type="button" onClick={() => setShowList(true)} className="text-sm text-primary hover:underline">
                Complete Product List
              </button>
            </div>
          </Field>
          <p className="text-xs text-gray-500">Note: Kindly make your selection carefully, as once saved you cannot change these details.</p>

          {mode === 'category' ? (
            <>
              <Field label="Product Category" required hint="Pick from the QCO-notified product list">
                <select className="input" value={data.productCategory || ''} onChange={handleCategoryChange} disabled={isSubmitted}>
                  <option value="">---Select---</option>
                  {PRODUCT_LIST.map(p => <option key={p.product} value={p.product}>{p.product}</option>)}
                </select>
              </Field>

              <Field label="Indian Standard" required>
                <select className="input" value={data.indianStandard || ''} onChange={e => set('indianStandard', e.target.value)} disabled={isSubmitted || !data.productCategory}>
                  <option value="">---Select---</option>
                  {categoryStandardOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>

              <Field label="Sub Category" required>
                <select className="input" value={data.subCategory || ''} onChange={e => set('subCategory', e.target.value)} disabled={isSubmitted || !data.productCategory}>
                  <option value="">---Select---</option>
                  {data.productCategory && <option value={data.productCategory}>{data.productCategory}</option>}
                </select>
              </Field>

              <Field label="Product Name" required>
                <select className="input" value={data.productName || ''} onChange={e => set('productName', e.target.value)} disabled={isSubmitted || !data.productCategory}>
                  <option value="">---Select---</option>
                  {data.productCategory && <option value={data.productCategory}>{data.productCategory}</option>}
                </select>
              </Field>
            </>
          ) : (
            <>
              <Field label="Indian Standard" required hint="Pick from the QCO-notified standards list">
                <select className="input" value={data.indianStandard || ''} onChange={handleStandardChange} disabled={isSubmitted}>
                  <option value="">---Select---</option>
                  {ALL_STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>

              <Field label="Product Name" required>
                <select className="input" value={data.productName || ''} onChange={e => set('productName', e.target.value)} disabled={isSubmitted || !data.indianStandard}>
                  <option value="">---Select---</option>
                  {standardProductOptions.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
            </>
          )}
        </div>
      </div>

      {showList && <ProductListModal onClose={() => setShowList(false)} />}
    </div>
  );
}
