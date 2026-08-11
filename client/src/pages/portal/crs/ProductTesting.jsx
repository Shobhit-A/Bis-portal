import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Field } from '../../../components/FormField';

// From BIS's QCO-notified product list — used to auto-fill Indian Standard when a
// product is picked, and to power the "Complete Product List" reference table.
const PRODUCT_LIST = [
  { product: 'AMPLIFIERS WITH INPUT POWER 2000W AND ABOVE', isNo: 'IS 616:2017', qcoDate: '03 July 2013' },
  { product: 'AUTOMATIC DATA PROCESSING MACHINE', isNo: 'IS 13252(Part 1):2010', qcoDate: '03 July 2013' },
  { product: 'ELECTRONIC CLOCKS WITH MAINS POWER', isNo: 'IS 302-2-26:2014', qcoDate: '03 July 2013' },
  { product: 'ELECTRONIC GAMES (VIDEO)', isNo: 'IS 616:2017', qcoDate: '03 July 2013' },
  { product: 'ELECTRONIC MUSICAL SYSTEMS WITH INPUT POWER 200W AND ABOVE', isNo: 'IS 616:2017', qcoDate: '03 July 2013' },
  { product: 'LAPTOP/NOTEBOOK/TABLET', isNo: 'IS 13252(Part 1):2010', qcoDate: '03 July 2013' },
  { product: 'MICROWAVE OVENS', isNo: 'IS 302-2-25:2014', qcoDate: '03 July 2013' },
  { product: 'OPTICAL DISC PLAYERS WITH BUILT IN AMPLIFIERS OF INPUT POWER 200W AND ABOVE', isNo: 'IS 616:2017', qcoDate: '03 July 2013' },
  { product: 'PLASMA/LCD/LED TELEVISIONS OF SCREEN SIZE 32" AND ABOVE', isNo: 'IS 616:2017 OR IS 616:2017 & IS 18112:2025', qcoDate: '03 July 2013' },
  { product: 'PRINTERS, PLOTTERS', isNo: 'IS 13252(Part 1):2010', qcoDate: '03 July 2013' },
  { product: 'SCANNERS', isNo: 'IS 13252(Part 1):2010', qcoDate: '03 July 2013' },
  { product: 'SET TOP BOX', isNo: 'IS 13252(Part 1):2010', qcoDate: '03 July 2013' },
  { product: 'TELEPHONE ANSWERING MACHINES', isNo: 'IS 13252(Part 1):2010', qcoDate: '03 July 2013' },
  { product: 'VISUAL DISPLAY UNITS, VIDEOS MONITORS OF SCREEN SIZE 32" AND ABOVE', isNo: 'IS 13252(Part 1):2010', qcoDate: '03 July 2013' },
  { product: 'WIRELESS KEYBOARDS', isNo: 'IS 13252(Part 1):2010', qcoDate: '03 July 2013' },
  { product: 'CASH REGISTERS', isNo: 'IS 13252(Part 1):2010', qcoDate: '13 May 2015' },
  { product: 'COPYING MACHINES/DUPLICATORS', isNo: 'IS 13252(Part 1):2010', qcoDate: '13 May 2015' },
  { product: 'PASSPORT READER', isNo: 'IS 13252(Part 1):2010', qcoDate: '13 May 2015' },
  { product: 'POINT OF SALE TERMINALS', isNo: 'IS 13252(Part 1):2010', qcoDate: '13 May 2015' },
  { product: 'MAIL PROCESSING MACHINES/POSTAGE MACHINES/FRANKING MACHINES', isNo: 'IS 13252(Part 1):2010', qcoDate: '13 May 2015' },
  { product: 'POWER BANKS FOR USE IN PORTABLE APPLICATIONS', isNo: 'IS 13252(Part 1):2010', qcoDate: '13 May 2015' },
  { product: 'SMART CARD READER', isNo: 'IS 13252(Part 1):2010', qcoDate: '13 May 2015' },
  { product: 'MOBILE PHONES', isNo: 'IS 13252(Part 1):2010', qcoDate: '13 September 2015' },
  { product: 'SELF-BALLASTED LED LAMPS FOR GENERAL LIGHTING SERVICES', isNo: 'IS 16102(Part 1):2012', qcoDate: '13 September 2015' },
  { product: 'DC OR AC SUPPLIED ELECTRONIC CONTROLGEAR FOR LED MODULES', isNo: 'IS 15885(Part 2/Sec 13):2012', qcoDate: '01 December 2015' },
  { product: 'POWER ADAPTORS FOR AUDIO, VIDEO & SIMILAR ELECTRONIC APPARATUS', isNo: 'IS 616:2010', qcoDate: '01 December 2015' },
  { product: 'POWER ADAPTORS FOR IT EQUIPMENTS', isNo: 'IS 13252(Part 1):2010', qcoDate: '01 December 2015' },
  { product: 'FIXED GENERAL PURPOSE LED LUMINAIRES', isNo: 'IS 10322(Part 5/Sec 1):2012', qcoDate: '01 March 2016' },
  { product: 'UPS/INVERTORS OF RATING <= 5KVA', isNo: 'IS 16242(Part 1):2014', qcoDate: '01 March 2016' },
  { product: 'SEALED SECONDARY CELLS/BATTERIES (NICKEL SYSTEMS) FOR PORTABLE APPLICATIONS', isNo: 'IS 16046(Part 1):2018', qcoDate: '01 June 2016' },
  { product: 'SEALED SECONDARY CELLS/BATTERIES (LITHIUM SYSTEMS) FOR PORTABLE APPLICATIONS', isNo: 'IS 16046(Part 2):2018', qcoDate: '01 June 2016' },
  { product: 'INDIAN LANGUAGE SUPPORT FOR MOBILE PHONE HANDSETS', isNo: 'IS 16333(Part 3):2022', qcoDate: '01 May 2018' },
  { product: 'Recessed LED Luminaries', isNo: 'IS 10322(Part 5/Section 2):2012', qcoDate: '23 May 2018' },
  { product: 'LED Luminaires for Road and Street lighting', isNo: 'IS 10322(Part 5/Section 3):2012', qcoDate: '23 May 2018' },
  { product: 'LED Flood Lights', isNo: 'IS 10322(Part 5/Section 5):2013', qcoDate: '23 May 2018' },
  { product: 'LED Hand lamps', isNo: 'IS 10322(Part 5/Section 6):2013', qcoDate: '23 May 2018' },
  { product: 'LED Lighting Chains', isNo: 'IS 10322(Part 5/Section 7):2017', qcoDate: '23 May 2018' },
  { product: 'LED Luminaires for Emergency Lighting', isNo: 'IS 10322(Part 5/Section 8):2013', qcoDate: '23 May 2018' },
  { product: 'UPS/Inverters of rating <= 10kVA', isNo: 'IS 16242(Part 1):2014 / IS 16242(Part 1):2025 / IEC 62040-1:2017 +AMD1:2021 +AMD2:2022 CSV', qcoDate: '23 May 2018' },
  { product: 'Plasma/LCD/LED Television of screen size up-to 32"', isNo: 'IS 616:2017 OR IS 616:2017 & IS 18112:2025', qcoDate: '23 May 2018' },
  { product: 'Visual Display Units', isNo: 'IS 13252(Part 1):2010', qcoDate: '23 May 2018' },
  { product: 'CCTV Cameras/CCTV Recorders', isNo: 'IS 13252(Part 1):2010, Essential Requirement(s) for Security of CCTV', qcoDate: '23 May 2018' },
  { product: 'Adapters for household and similar electrical appliances', isNo: 'IS 302(Part 1):2008 / IS 302(Part 1):2024/IEC 60335-1:2020', qcoDate: '23 May 2018' },
  { product: 'USB driven Barcode readers, barcode scanners, Iris scanners, Optical fingerprint scanners', isNo: 'IS 13252(Part 1):2010', qcoDate: '23 May 2018' },
  { product: 'Smart watches', isNo: 'IS 13252(Part 1):2010', qcoDate: '23 May 2018' },
  { product: 'Crystalline Silicon Terrestrial Photovoltaic (PV) modules (Si wafer based)', isNo: 'IS 14286(Part 1/Sec 1):2023/IEC 61215-1-1:2021, IS/IEC 61730-1:2016, IS/IEC 61730-2:2016 OR ...:2023 variants', qcoDate: '31 March 2019' },
  { product: 'Thin-Film Terrestrial Photovoltaic (PV) Modules (a-Si, CiGs and CdTe)', isNo: 'IS 14286(Part 1/Sec 2-4):2023 & IS/IEC 61730-1/2 (2016 or 2023 variants)', qcoDate: '31 March 2019' },
  { product: 'Power converters for use in photovoltaic power system', isNo: 'IS 16221(Part 2):2015/IEC 62109-2:2011, IS/IEC 61683:1999', qcoDate: '30 June 2021' },
  { product: 'Utility-Interconnected Photovoltaic inverters', isNo: 'IS 16221(Part 2):2015/IEC 62109-2:2011, IS 16169:2019/IEC 62116:2014, IS 17980:2022/IEC 62891:2020', qcoDate: '30 June 2021' },
  { product: 'Storage battery', isNo: 'IS 16270:2023', qcoDate: '01 January 2019' },
  { product: 'Independent LED Modules for General Lighting', isNo: 'IS 16103(Part 1):2012 / IS 16103(Part 1):2025 /IEC 62031:2018', qcoDate: '01 April 2021' },
  { product: 'Lighting Chain (Rope Lights)', isNo: 'IS 10322(Part 5/Sec 9):2017', qcoDate: '01 April 2021' },
  { product: 'Keyboard', isNo: 'IS 13252(Part 1):2010', qcoDate: '01 April 2021' },
  { product: 'Induction Stove', isNo: 'IS 302-2-6:2009', qcoDate: '01 April 2021' },
  { product: 'Automatic Teller Cash dispensing machines', isNo: 'IS 13252(Part 1):2010', qcoDate: '01 April 2021' },
  { product: 'Standalone Hard Disk Drives', isNo: 'IS 13252(Part 1):2010', qcoDate: '01 April 2021' },
  { product: 'Wireless Headphone and Earphone', isNo: 'IS 616:2017', qcoDate: '01 April 2021' },
  { product: 'USB Type External Solid-State Storage Devices (above 256 GB capacity)', isNo: 'IS 13252(Part 1):2010', qcoDate: '01 April 2021' },
  { product: 'Electronic Musical System with input power below 200 Watts', isNo: 'IS 616:2017', qcoDate: '01 April 2021' },
  { product: 'Standalone Switch Mode Power Supplies (SMPS) with output voltage 48V (max)', isNo: 'IS 13252(Part 1):2010', qcoDate: '01 April 2021' },
  { product: 'Television other than Plasma/LCD/LED TVs', isNo: 'IS 616:2017 OR IS 616:2017 & IS 18112:2025', qcoDate: '01 April 2021' },
  { product: 'Rice Cooker', isNo: 'IS 302-2-15:2009', qcoDate: '01 April 2021' },
  { product: 'Wireless Microphone', isNo: 'IS 616:2017', qcoDate: '01 October 2021' },
  { product: 'Digital Camera', isNo: 'IS 13252(Part 1):2010', qcoDate: '01 October 2021' },
  { product: 'Video Camera', isNo: 'IS 616:2017', qcoDate: '01 October 2021' },
  { product: 'Webcam (Finished Product)', isNo: 'IS 616:2017', qcoDate: '01 October 2021' },
  { product: 'Smart Speakers (with and without Display)', isNo: 'IS 616:2017', qcoDate: '01 October 2021' },
  { product: 'Dimmers for LED products', isNo: 'IS 60669-2-1:2008', qcoDate: '01 October 2021' },
  { product: 'Bluetooth Speakers', isNo: 'IS 616:2017', qcoDate: '01 October 2021' },
  { product: 'Ortho Phosphoric Acid', isNo: 'IS 798:2020', qcoDate: '10 December 2022' },
  { product: 'Polyphosphoric Acid', isNo: 'IS 17439:2020', qcoDate: '22 December 2022' },
  { product: 'Trimethyl Phosphite Technical Grade', isNo: 'IS 17412:2020', qcoDate: '01 October 2022' },
  { product: 'Television Sets', isNo: 'IS 18112:2025', qcoDate: '26 July 2026' },
  { product: 'Extended Reality Products (Augmented Reality, Virtual Reality, Mixed Reality etc.)', isNo: 'IS/IEC 62368: Part 1: 2023', qcoDate: '05 December 2025' },
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
                  <td className="px-3 py-1.5 border-t border-border align-top">{p.isNo}</td>
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

// A product's isNo string may list multiple valid standards (old vs. new edition,
// or an IS+IEC crosswalk) separated by " / " or " OR " — each becomes its own
// selectable Indian Standard option instead of one combined free-text value.
function standardOptionsFor(productName) {
  const match = PRODUCT_LIST.find(p => p.product === productName);
  if (!match) return [];
  return match.isNo.split(/\s+OR\s+|\s+\/\s+/i).map(s => s.trim()).filter(Boolean);
}

export default function ProductTesting({ formData, updateSection, isSubmitted }) {
  const account = formData.account || {};
  const address = formData.address || {};
  const data = formData.product || {};
  const set = (key, val) => updateSection('product', { ...data, [key]: val });
  const [showList, setShowList] = useState(false);

  const mode = data.mode || 'category';

  const handleProductNameChange = (e) => {
    const productName = e.target.value;
    const match = PRODUCT_LIST.find(p => p.product === productName);
    updateSection('product', { ...data, productName, indianStandard: match?.isNo || '' });
  };

  // Category-wise flow: picking a category resolves the exact product match, then
  // Indian Standard / Sub Category / Product Name all become dropdowns scoped to it.
  const categoryStandardOptions = standardOptionsFor(data.productCategory);
  const handleCategoryChange = (e) => {
    const productCategory = e.target.value;
    const options = standardOptionsFor(productCategory);
    updateSection('product', {
      ...data,
      productCategory,
      indianStandard: options.length === 1 ? options[0] : '',
      subCategory: productCategory,
      productName: productCategory,
    });
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
              <Field label="Product Name" required hint="Pick from the QCO-notified product list">
                <select className="input" value={data.productName || ''} onChange={handleProductNameChange} disabled={isSubmitted}>
                  <option value="">---Select---</option>
                  {PRODUCT_LIST.map(p => <option key={p.product} value={p.product}>{p.product}</option>)}
                </select>
              </Field>

              <Field label="Indian Standard" required hint="Auto-filled from the selected product">
                <input className="input bg-gray-50" value={data.indianStandard || ''} readOnly />
              </Field>
            </>
          )}
        </div>
      </div>

      {showList && <ProductListModal onClose={() => setShowList(false)} />}
    </div>
  );
}
