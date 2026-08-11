const ExcelJS = require('exceljs');

function tb() {
  const s = { style: 'thin', color: { argb: 'FFCCCCCC' } };
  return { top: s, left: s, bottom: s, right: s };
}

// Fill all cells in a range with a color BEFORE merging (prevents ghost cells)
function fillRange(ws, r1, c1, r2, c2, argb) {
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      const cell = ws.getCell(r, c);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } };
      cell.border = tb();
    }
  }
}

function setCell(ws, row, col, value, { bold = false, fg = 'FF000000', bg = 'FFFFFFFF', align = 'left', size = 10, wrap = false, italic = false } = {}) {
  const cell = ws.getCell(row, col);
  cell.value = value ?? '';
  cell.font = { name: 'Calibri', bold, color: { argb: fg }, size, italic };
  cell.alignment = { horizontal: align, vertical: 'middle', wrapText: wrap };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
  cell.border = tb();
  return cell;
}

function mergeSet(ws, r1, c1, r2, c2, value, opts = {}) {
  const { bold = false, fg = 'FF000000', bg = 'FFFFFFFF', align = 'left', size = 10, wrap = true, italic = false } = opts;
  fillRange(ws, r1, c1, r2, c2, bg);
  try { ws.unMergeCells(r1, c1, r2, c2); } catch (e) {}
  ws.mergeCells(r1, c1, r2, c2);
  const cell = ws.getCell(r1, c1);
  cell.value = value ?? '';
  cell.font = { name: 'Calibri', bold, color: { argb: fg }, size, italic };
  cell.alignment = { horizontal: align, vertical: 'middle', wrapText: wrap };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
  cell.border = tb();
  return cell;
}

function spacer(ws, row, ncol, h = 5) {
  ws.getRow(row).height = h;
  mergeSet(ws, row, 1, row, ncol, '', { bg: 'FFEEF2F7' });
}

function titleRow(ws, row, ncol, text) {
  ws.getRow(row).height = 32;
  mergeSet(ws, row, 1, row, ncol, text, { bold: true, fg: 'FFFFFFFF', bg: 'FF1F5C99', size: 14, align: 'center' });
}

function noteRow(ws, row, ncol, text, h = 18) {
  ws.getRow(row).height = h;
  mergeSet(ws, row, 1, row, ncol, '  ' + text, { bold: false, fg: 'FF8B0000', bg: 'FFFFF3CD', size: 9 });
}

function secHeader(ws, row, ncol, text) {
  ws.getRow(row).height = 20;
  mergeSet(ws, row, 1, row, ncol, '   ' + text, { bold: true, fg: 'FFFFFFFF', bg: 'FF1F5C99', size: 11 });
}

function secHeader2(ws, row, ncol, text) {
  // 2E75B6 sub-section header
  ws.getRow(row).height = 20;
  mergeSet(ws, row, 1, row, ncol, '   ' + text, { bold: true, fg: 'FFFFFFFF', bg: 'FF2E75B6', size: 11 });
}

function subLabel(ws, row, ncol, text) {
  // D6E4F0 sub-label row (used in Management sheet)
  ws.getRow(row).height = 18;
  mergeSet(ws, row, 1, row, ncol, '  ' + text, { bold: true, fg: 'FF1A3C5E', bg: 'FFD6E4F0', size: 10 });
}

function infoRow(ws, row, ncol, text, h = 18) {
  ws.getRow(row).height = h;
  mergeSet(ws, row, 1, row, ncol, '  ' + text, { bold: false, fg: 'FF555555', bg: 'FFEEF2F7', size: 9 });
}

function warnRow(ws, row, col1, col2, text, h = 18) {
  ws.getRow(row).height = h;
  if (col1 === col2) {
    setCell(ws, row, col1, text, { bold: false, fg: 'FFFF0000', bg: 'FFFFFDE7', size: 9 });
  } else {
    mergeSet(ws, row, col1, row, col2, text, { bold: false, fg: 'FFFF0000', bg: 'FFFFFDE7', size: 9 });
  }
}

// label (right-aligned, DCE9F5) + value (white) — 4-col sheet
function lv2(ws, row, lbl1, val1, lbl2, val2, h = 20) {
  ws.getRow(row).height = h;
  setCell(ws, row, 1, lbl1, { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', align: 'right', size: 10, wrap: true });
  setCell(ws, row, 2, val1, { bold: false, fg: 'FF000000', bg: 'FFFFFFFF', align: 'left', size: 10 });
  if (lbl2) {
    setCell(ws, row, 3, lbl2, { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', align: 'right', size: 10, wrap: true });
    setCell(ws, row, 4, val2 ?? '', { bold: false, fg: 'FF000000', bg: 'FFFFFFFF', align: 'left', size: 10 });
  } else {
    fillRange(ws, row, 3, row, 4, 'FFEEF2F7');
    mergeSet(ws, row, 3, row, 4, '', { bg: 'FFEEF2F7' });
  }
}

// label full width, value B-D merged — 4-col sheet
function lv1(ws, row, label, value, ncol = 4, h = 20) {
  ws.getRow(row).height = h;
  setCell(ws, row, 1, label, { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', align: 'right', size: 10, wrap: true });
  mergeSet(ws, row, 2, row, ncol, value ?? '', { bold: false, fg: 'FF000000', bg: 'FFFFFFFF', align: 'left', size: 10 });
}

// label cell only (no value) — for Declaration sheet wide col A
function labelOnly(ws, row, label, h = 28) {
  ws.getRow(row).height = h;
  setCell(ws, row, 1, label, { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', align: 'left', size: 10, wrap: true });
  mergeSet(ws, row, 2, row, 4, '', { bg: 'FFFFFFFF' });
}

// Draw a styled table — headers row + data rows
function drawTable(ws, startRow, headers, dataRows, colCount) {
  // Header row
  ws.getRow(startRow).height = 28;
  headers.forEach((h, i) => {
    if (h.merge) {
      fillRange(ws, startRow, h.col, startRow, h.col + h.merge - 1, 'FF1F5C99');
      mergeSet(ws, startRow, h.col, startRow, h.col + h.merge - 1, h.label,
        { bold: true, fg: 'FFFFFFFF', bg: 'FF1F5C99', size: 9, align: 'center', wrap: true });
    } else {
      setCell(ws, startRow, h.col, h.label,
        { bold: true, fg: 'FFFFFFFF', bg: 'FF1F5C99', size: 9, align: 'center', wrap: true });
    }
  });

  // Fill empty header cells
  for (let c = 1; c <= colCount; c++) {
    const cell = ws.getCell(startRow, c);
    if (!cell.value && (!cell.fill || cell.fill.fgColor?.argb !== 'FF1F5C99')) {
      setCell(ws, startRow, c, '', { bg: 'FF1F5C99' });
    }
  }

  // Data rows — minimum 3 if no data
  const rows = (dataRows && dataRows.length > 0) ? dataRows : [{}, {}, {}];
  rows.forEach((rowData, ri) => {
    const r = startRow + 1 + ri;
    const bg = ri % 2 === 0 ? 'FFFFFFFF' : 'FFF4F6F7';
    ws.getRow(r).height = 20;
    for (let c = 1; c <= colCount; c++) {
      setCell(ws, r, c, '', { bg });
    }
    headers.forEach(h => {
      const val = h.key ? (rowData[h.key] ?? '') : '';
      if (h.merge) {
        mergeSet(ws, r, h.col, r, h.col + h.merge - 1, val, { bg, size: 9 });
      } else {
        setCell(ws, r, h.col, val, { bg, size: 9 });
      }
    });
  });

  return startRow + 1 + rows.length;
}

function getDoc(documents, fieldKey) {
  return documents?.find(d => d.fieldKey === fieldKey)?.fileName || '';
}

// ============================================================
// Shared sheets — identical across FMCS and ISI, which use the same
// tab components (Management, Manufacturing, Packaging, Testing,
// Test Report, Declaration, Document Checklist) for these sections.
// ============================================================

function addManagementSheet(wb, mgmt, docs, clientInfo) {
  const ws = wb.addWorksheet('Management Details');
  ws.columns = [{ width: 20 }, { width: 20 }, { width: 16 }, { width: 22 }, { width: 18 }, { width: 22 }, { width: 38 }];
  const NC = 7;
  let r = 1;
  spacer(ws, r++, NC, 8);
  titleRow(ws, r++, NC, 'MANAGEMENT DETAILS');
  noteRow(ws, r++, NC, "* Mandatory Fields   |   Firm's Management Details for BIS Certification Application");
  spacer(ws, r++, NC, 6);
  secHeader2(ws, r++, NC, "1.  Firm's Management Details");
  spacer(ws, r++, NC, 5);
  subLabel(ws, r++, NC, 'Top Management Details  (Add all Directors / Partners / Proprietors)');
  spacer(ws, r++, NC, 4);

  // Top Management table — cols 1-6 (col 7 note)
  const topMgmt = mgmt.topManagement || [];
  r = drawTable(ws, r, [
    { col: 1, label: 'Name *', key: 'name' },
    { col: 2, label: 'Designation *', key: 'designation' },
    { col: 3, label: 'Contact No. *', key: 'contact' },
    { col: 4, label: 'Email ID *', key: 'email' },
    { col: 5, label: 'DIN (If Applicable)', key: 'din' },
    { col: 6, label: 'Note: Add rows for each Director/Partner', key: '' },
  ], topMgmt, 7);

  spacer(ws, r++, NC, 6);
  subLabel(ws, r++, NC, 'AIR Details (Single) — Authorized Indian Representative');
  spacer(ws, r++, NC, 4);

  // AIR table — single row
  const airLetter = getDoc(docs, 'management_air_letter');
  const airRowData = (mgmt.airRow && mgmt.airRow[0]) || {};
  const airData = [{
    name: airRowData.name || '',
    designation: airRowData.designation || '',
    contact: airRowData.contact || '',
    email: airRowData.email || '',
    din: airRowData.din || '',
    letter: airLetter || '',
    residency: airRowData.residency || ''
  }];
  ws.getRow(r).height = 28;
  ['Name *', 'Designation *', 'Contact No. *', 'Email ID *', 'DIN (If Applicable)', 'AIR Nomination Letter *', 'Residency Status *'].forEach((h, i) => {
    setCell(ws, r, i + 1, h, { bold: true, fg: 'FFFFFFFF', bg: 'FF1F5C99', size: 9, align: 'center', wrap: true });
  });
  r++;
  ws.getRow(r).height = 22;
  ['name', 'designation', 'contact', 'email', 'din', 'letter', 'residency'].forEach((k, i) => {
    setCell(ws, r, i + 1, airData[0][k] || '', { bg: 'FFFFFFFF', size: 9 });
  });
  r++;
  // PDF note for AIR letter
  ws.getRow(r).height = 16;
  for (let c = 1; c <= NC; c++) setCell(ws, r, c, '', { bg: 'FFEEF2F7' });
  setCell(ws, r, 6, 'Duly Signed and Sealed PDF copy Required', { fg: 'FFFF0000', bg: 'FFFFFDE7', size: 8 });
  r++;

  spacer(ws, r++, NC, 6);
  subLabel(ws, r++, NC, 'Correspondence Details');
  spacer(ws, r++, NC, 4);

  // Correspondence
  ws.getRow(r).height = 22;
  mergeSet(ws, r, 1, r, 3, 'Correspondence Address Communication *', { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', align: 'right', size: 10 });
  mergeSet(ws, r, 4, r, NC, mgmt.corrAddress || '', { bg: 'FFFFFFFF', size: 10 });
  r++;
  ws.getRow(r).height = 20;
  mergeSet(ws, r, 1, r, 2, 'Name of Contact Person *', { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', align: 'right', size: 10 });
  mergeSet(ws, r, 3, r, 3, mgmt.corrName || '', { bg: 'FFFFFFFF', size: 10 });
  mergeSet(ws, r, 4, r, 5, 'Designation of Contact Person *', { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', align: 'right', size: 10 });
  mergeSet(ws, r, 6, r, NC, mgmt.corrDesignation || '', { bg: 'FFFFFFFF', size: 10 });
  r++;
  ws.getRow(r).height = 20;
  mergeSet(ws, r, 1, r, 2, 'E-Mail ID *', { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', align: 'right', size: 10 });
  mergeSet(ws, r, 3, r, 3, mgmt.corrEmail || '', { bg: 'FFFFFFFF', size: 10 });
  mergeSet(ws, r, 4, r, 5, 'Contact Number *', { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', align: 'right', size: 10 });
  mergeSet(ws, r, 6, r, NC, mgmt.corrContact || '', { bg: 'FFFFFFFF', size: 10 });
  r++;
  infoRow(ws, r++, NC, 'Note: Email ID of the firm / authorized signatory of the firm only to be filled.');
  spacer(ws, r++, NC, 6);
  subLabel(ws, r++, NC, 'Technical Management / Quality Assurance / Control Personnel Details');
  spacer(ws, r++, NC, 4);

  // Tech table
  const techRows = (mgmt.techPersonnel || []).map((p, i) => ({
    name: p.name || '',
    designation: p.designation || '',
    qualification: p.qualification || '',
    qualDoc: getDoc(docs, `management_qual_doc_${i}`),
    experience: p.experience || '',
    photo: getDoc(docs, `management_photo_${i}`)
  }));
  ws.getRow(r).height = 28;
  ['Name *', 'Designation *', 'Qualification *', 'Qualification Document *\n(write filename)', 'Experience (in years) *', 'Photo *\n(write filename)', ''].forEach((h, i) => {
    setCell(ws, r, i + 1, h, { bold: true, fg: 'FFFFFFFF', bg: 'FF1F5C99', size: 9, align: 'center', wrap: true });
  });
  r++;
  const techData = techRows.length > 0 ? techRows : [{}, {}, {}].map(() => ({ name: '', designation: '', qualification: '', qualDoc: 'PDF copy Required', experience: '', photo: 'JPEG copy Required' }));
  techData.forEach((row, ri) => {
    const bg = ri % 2 === 0 ? 'FFFFFFFF' : 'FFF4F6F7';
    ws.getRow(r).height = 22;
    ['name', 'designation', 'qualification', 'qualDoc', 'experience', 'photo'].forEach((k, i) => {
      const isNote = (k === 'qualDoc' || k === 'photo') && !row[k];
      setCell(ws, r, i + 1, row[k] || (k === 'qualDoc' ? 'PDF copy Required' : k === 'photo' ? 'JPEG copy Required' : ''), {
        bg: isNote ? 'FFFFFDE7' : bg,
        fg: isNote ? 'FFFF0000' : 'FF000000',
        size: 9
      });
    });
    setCell(ws, r, 7, '', { bg });
    r++;
  });

  infoRow(ws, r++, NC, 'Note: Add rows for each technical/QA personnel. Attach qualification documents and passport-size photo.');
  spacer(ws, r++, NC, 5);
  mergeSet(ws, r, 1, r, NC, clientInfo, { fg: 'FF555555', bg: 'FFEEF2F7', size: 8, align: 'center' });
}

function addManufacturingSheet(wb, mfg, docs, clientInfo) {
  const ws = wb.addWorksheet('Manufacturing Process');
  ws.columns = [{ width: 28 }, { width: 22 }, { width: 18 }, { width: 30 }, { width: 30 }, { width: 20 }];
  const NC = 6;
  let r = 1;
  spacer(ws, r++, NC, 8);
  titleRow(ws, r++, NC, 'MANUFACTURING PROCESS');
  noteRow(ws, r++, NC, '* Mandatory Fields');
  spacer(ws, r++, NC, 6);
  secHeader2(ws, r++, NC, '1.  Raw Material Details');
  spacer(ws, r++, NC, 5);

  r = drawTable(ws, r, [
    { col: 1, label: 'Raw Material\n(with grade, if any) *', key: 'material' },
    { col: 2, label: 'Name of Supplier *', key: 'supplier' },
    { col: 3, label: 'Supplier Country *', key: 'supplierCountry' },
    { col: 4, label: 'Conformity of Material', key: 'conformity' },
    { col: 5, label: 'How Received\n(Batches/Lots/Nature of Package) *', key: 'howReceived' },
    { col: 6, label: 'Records Maintained', key: 'records' },
  ], mfg.rawMaterials || [], NC);

  spacer(ws, r++, NC, 6);
  secHeader2(ws, r++, NC, '2.  Outsourcing & Hygiene');
  spacer(ws, r++, NC, 5);

  ws.getRow(r).height = 30;
  mergeSet(ws, r, 1, r, 3, 'Do you outsource any part of manufacturing process? *\n(If Yes, submit: agreement with manufacturing unit + controls on outsourced process/product)',
    { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', size: 10, wrap: true });
  mergeSet(ws, r, 4, r, NC, mfg.outsourcing || '', { bg: 'FFFFFFFF', size: 10 });
  r++;
  if (mfg.outsourcing === 'Yes') {
    const outsourceDoc = getDoc(docs, 'manufacturing_outsource_doc');
    ws.getRow(r).height = 20;
    mergeSet(ws, r, 1, r, 3, 'Outsourcing Agreement Document', { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', size: 10, wrap: true });
    mergeSet(ws, r, 4, r, NC, outsourceDoc || '', { fg: outsourceDoc ? 'FF000000' : 'FFFF0000', bg: 'FFFFFFFF', size: 10 });
    r++;
  }
  ws.getRow(r).height = 28;
  mergeSet(ws, r, 1, r, 3, 'Maintenance of Hygienic Conditions? *\n(If Yes, submit supporting docs)',
    { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', size: 10, wrap: true });
  mergeSet(ws, r, 4, r, NC, mfg.hygiene || '', { bg: 'FFFFFFFF', size: 10 });
  r++;
  if (mfg.hygiene === 'Yes') {
    const hygieneDoc = getDoc(docs, 'manufacturing_hygiene_doc');
    ws.getRow(r).height = 20;
    mergeSet(ws, r, 1, r, 3, 'Hygiene Supporting Document', { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', size: 10, wrap: true });
    mergeSet(ws, r, 4, r, NC, hygieneDoc || '', { fg: hygieneDoc ? 'FF000000' : 'FFFF0000', bg: 'FFFFFFFF', size: 10 });
    r++;
  }
  spacer(ws, r++, NC, 6);
  secHeader2(ws, r++, NC, '3.  Process Flow Chart & Factory Layout');
  spacer(ws, r++, NC, 5);

  const flowDoc = getDoc(docs, 'manufacturing_flowchart');
  ws.getRow(r).height = 36;
  mergeSet(ws, r, 1, r, 3, 'Process Flow Chart covering all processes of manufacture\n(from Raw Material to Finished Product, including In-Process Controls & Outsourced stages) *',
    { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', size: 10, wrap: true });
  mergeSet(ws, r, 4, r, NC, flowDoc || 'Write filename of uploaded document. PDF copy required.',
    { fg: flowDoc ? 'FF000000' : 'FFFF0000', bg: flowDoc ? 'FFFFFFFF' : 'FFFFFDE7', size: 9, wrap: true });
  r++;

  const layoutDoc = getDoc(docs, 'manufacturing_layout');
  ws.getRow(r).height = 28;
  mergeSet(ws, r, 1, r, 3, 'Enclose Layout Plan of Factory *\n(Upload document)',
    { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', size: 10, wrap: true });
  mergeSet(ws, r, 4, r, NC, layoutDoc || '', { bg: 'FFFFFFFF', size: 10 });
  r++;

  const machineryDoc = getDoc(docs, 'manufacturing_machinery');
  ws.getRow(r).height = 28;
  mergeSet(ws, r, 1, r, 3, 'Manufacturing Machinery List *\n(Upload document — template provided)',
    { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', size: 10, wrap: true });
  mergeSet(ws, r, 4, r, NC, machineryDoc || '', { bg: 'FFFFFFFF', size: 10 });
  r++;

  spacer(ws, r++, NC, 6);
  secHeader2(ws, r++, NC, '4.  Production Details');
  spacer(ws, r++, NC, 5);

  ws.getRow(r).height = 28;
  ['Unit of Production\n(as per IS Standard)', 'Production Value\n(Actual approx. value per annum in ₹)', 'Present Installed Capacity'].forEach((h, i) => {
    setCell(ws, r, i + 1, h, { bold: true, fg: 'FFFFFFFF', bg: 'FF1F5C99', size: 9, align: 'center', wrap: true });
  });
  for (let c = 4; c <= NC; c++) setCell(ws, r, c, '', { bg: 'FF1F5C99' });
  r++;
  ws.getRow(r).height = 22;
  setCell(ws, r, 1, mfg.productionUnit || '', { bg: 'FFFFFFFF', size: 9 });
  setCell(ws, r, 2, mfg.productionValue || '', { bg: 'FFFFFFFF', size: 9 });
  setCell(ws, r, 3, mfg.installedCapacity || '', { bg: 'FFFFFFFF', size: 9 });
  for (let c = 4; c <= NC; c++) setCell(ws, r, c, '', { bg: 'FFF4F6F7' });
  r++;
  spacer(ws, r++, NC, 5);
  mergeSet(ws, r, 1, r, NC, clientInfo, { fg: 'FF555555', bg: 'FFEEF2F7', size: 8, align: 'center' });
}

function addPackagingSheet(wb, pkg, docs, clientInfo) {
  const ws = wb.addWorksheet('Packaging & Brand Details');
  ws.columns = [{ width: 28 }, { width: 20 }, { width: 24 }, { width: 18 }, { width: 22 }, { width: 22 }];
  const NC = 6;
  let r = 1;
  spacer(ws, r++, NC, 8);
  titleRow(ws, r++, NC, 'PACKAGING & BRAND DETAILS');
  noteRow(ws, r++, NC, '* Mandatory Fields');
  spacer(ws, r++, NC, 6);
  secHeader2(ws, r++, NC, '1.  Packaging and Marking Details');
  spacer(ws, r++, NC, 5);

  const pkgRows = (pkg.packagingRows || []).map((row, i) => ({
    nature: row.nature || '',
    marking: row.marking || '',
    method: row.method || '',
    qty: row.qty || '',
    labelFile: getDoc(docs, `packaging_label_${i}`),
    batchCode: row.batchCode || '',
  }));

  r = drawTable(ws, r, [
    { col: 1, label: 'Nature of Packaging *', key: 'nature' },
    { col: 2, label: 'Marking on Article *', key: 'marking' },
    { col: 3, label: 'Method of Marking *\n(brand, product description, type, rating etc.)', key: 'method' },
    { col: 4, label: 'Quantity per Package *', key: 'qty' },
    { col: 5, label: 'Form of Label(s) *\n(write filename)', key: 'labelFile' },
    { col: 6, label: 'Batch / Code / Serial No.\nfor Identification *', key: 'batchCode' },
  ], pkgRows, NC);

  spacer(ws, r++, NC, 6);
  secHeader2(ws, r++, NC, '2.  Brand / Trademark Details');
  spacer(ws, r++, NC, 5);

  const brandRows = (pkg.brands || []).map((b, i) => ({
    brandName: b.brandName || '',
    ownedBy: b.ownedBy || '',
    status: b.status || '',
    regDate: b.regDate || '',
    file: getDoc(docs, `packaging_brand_file_${i}`) || ''
  }));

  r = drawTable(ws, r, [
    { col: 1, label: 'Brand Name / Trademark *\n(actual design depiction)', key: 'brandName' },
    { col: 2, label: 'Owned By *', key: 'ownedBy' },
    { col: 3, label: 'Registered / Unregistered *', key: 'status' },
    { col: 4, label: 'Date of Registration /\nIntroduction *', key: 'regDate' },
    { col: 5, label: 'Upload File\n(write filename) *', key: 'file', merge: 2 },
  ], brandRows, NC);

  spacer(ws, r++, NC, 5);
  mergeSet(ws, r, 1, r, NC, clientInfo, { fg: 'FF555555', bg: 'FFEEF2F7', size: 8, align: 'center' });
}

function addTestingSheet(wb, testing, docs, clientInfo) {
  const ws = wb.addWorksheet('Testing & Inspection Details');
  ws.columns = [{ width: 14 }, { width: 24 }, { width: 28 }, { width: 20 }, { width: 24 }];
  const NC = 5;
  let r = 1;
  spacer(ws, r++, NC, 8);
  titleRow(ws, r++, NC, 'TESTING & INSPECTION DETAILS');
  noteRow(ws, r++, NC, '* Mandatory Fields');
  spacer(ws, r++, NC, 6);
  secHeader2(ws, r++, NC, '1.  In-House Testing Facility');
  spacer(ws, r++, NC, 5);
  ws.getRow(r).height = 24;
  mergeSet(ws, r, 1, r, 3, 'Do you have in house facility for complete testing of product as per Indian Standard *',
    { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', size: 10, wrap: true });
  mergeSet(ws, r, 4, r, NC, testing.inHouseTesting || '', { bg: 'FFFFFFFF', size: 10 });
  r++;
  if (testing.inHouseTesting === 'No') {
    const consentDoc = getDoc(docs, 'testing_consent_letter');
    ws.getRow(r).height = 20;
    mergeSet(ws, r, 1, r, 3, 'Upload Consent Letter', { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', size: 10, wrap: true });
    mergeSet(ws, r, 4, r, NC, consentDoc || '', { fg: consentDoc ? 'FF000000' : 'FFFF0000', bg: 'FFFFFFFF', size: 10 });
    r++;
  }
  spacer(ws, r++, NC, 5);
  subLabel(ws, r++, NC, 'Please list the tests you intend to sub-contract');
  spacer(ws, r++, NC, 4);

  const subTestRows = (testing.subContractedTests || []).map(row => ({
    clauseNo: row.clauseNo || '',
    testName: row.testName || '',
    labRelationship: row.labRelationship || '',
    labName: row.labName || '',
    bisRecognized: row.bisRecognized || '',
  }));

  r = drawTable(ws, r, [
    { col: 1, label: 'Clause No.\nof IS', key: 'clauseNo' },
    { col: 2, label: 'Test to be\nSub-Contracted', key: 'testName' },
    { col: 3, label: 'Name of the lab/ group co. / CM/L-no.\nof the licence with whom sharing is intended', key: 'labRelationship' },
    { col: 4, label: 'Name Of LAB', key: 'labName' },
    { col: 5, label: 'BIS Recognised or\nEmpanelled Lab?', key: 'bisRecognized' },
  ], subTestRows, NC);

  spacer(ws, r++, NC, 6);
  secHeader2(ws, r++, NC, '2.  List of Testing Equipment');
  spacer(ws, r++, NC, 5);
  const equipDoc = getDoc(docs, 'testing_equipment_list');
  ws.getRow(r).height = 28;
  mergeSet(ws, r, 1, r, 4, 'List of Testing Equipment (includes measuring instruments, chemicals, glassware etc.) *  — Upload document (template provided)',
    { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', size: 10, wrap: true });
  mergeSet(ws, r, 5, r, NC, equipDoc || '', { bg: 'FFFFFFFF', size: 10 });
  r++;
  ws.getRow(r).height = 16;
  for (let c = 1; c <= NC; c++) setCell(ws, r, c, '', { bg: 'FFFFFFFF' });
  setCell(ws, r, 1, equipDoc ? '' : 'PDF Copy Required', { fg: 'FFFF0000', bg: 'FFFFFFFF', size: 8 });
  r++;
  spacer(ws, r++, NC, 5);
  mergeSet(ws, r, 1, r, NC, clientInfo, { fg: 'FF555555', bg: 'FFEEF2F7', size: 8, align: 'center' });
}

function addTestReportSheet(wb, tr, docs, clientInfo) {
  const ws = wb.addWorksheet('Test Report Details');
  ws.columns = [{ width: 55 }, { width: 40 }, { width: 20 }, { width: 20 }];
  let r = 1;
  spacer(ws, r++, 4, 8);
  titleRow(ws, r++, 4, 'TEST REPORT - DETAILS');
  noteRow(ws, r++, 4, '* Mandatory Fields');
  spacer(ws, r++, 4, 6);
  secHeader(ws, r++, 4, 'Test Report');
  spacer(ws, r++, 4, 4);

  // Fall back to the pre-rebuild field/fieldKey names for submissions filled out before
  // this tab was rebuilt to match the real BIS portal — old data must not just vanish.
  const inHouseDoc = getDoc(docs, 'testReport_inhouse') || getDoc(docs, 'testReport_product_files');
  const rawMatConformity = tr.rawMaterialConformity || tr.rawMatConformityRequired || '';

  lv1(ws, r++, 'A) In House Test Report For The Product (In the Format as per Form IV in Scheme I of Regulations) *', inHouseDoc, 4, 34);
  lv1(ws, r++, 'B) For Raw Material (Used in Finished Product Sample Lot) — If Indian Standard requires raw material conformity *', rawMatConformity, 4, 34);
  if (rawMatConformity === 'Yes') {
    lv1(ws, r++, 'Raw Material Conformity Test Report *', getDoc(docs, 'testReport_raw_material_conformity'));
  }

  spacer(ws, r++, 4, 5);
  mergeSet(ws, r, 1, r, 4, clientInfo, { fg: 'FF555555', bg: 'FFEEF2F7', size: 8, align: 'center' });
}

function addDeclarationSheet(wb, decl, docs, clientInfo) {
  const ws = wb.addWorksheet('Declaration & Undertaking');
  ws.columns = [{ width: 55 }, { width: 40 }, { width: 20 }, { width: 20 }];
  const NC = 4;
  let r = 1;
  spacer(ws, r++, NC, 8);
  titleRow(ws, r++, NC, 'DECLARATION & UNDERTAKING');
  noteRow(ws, r++, NC, '* Mandatory Fields');
  spacer(ws, r++, NC, 6);
  secHeader2(ws, r++, NC, '1.  Miscellaneous Declaration');
  spacer(ws, r++, NC, 5);

  const statutoryDoc = getDoc(docs, 'declaration_statutory_docs');
  ws.getRow(r).height = 30;
  setCell(ws, r, 1, 'Any Statutory Permissions required for the product category? *\n(If Yes, upload docs)', { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', size: 10, wrap: true });
  setCell(ws, r, 2, decl.statutoryPermissions || '', { bg: 'FFFFFFFF', size: 10 });
  setCell(ws, r, 3, statutoryDoc || (decl.statutoryPermissions === 'Yes' ? 'PDF copy required' : ''), { fg: statutoryDoc ? 'FF000000' : 'FFFF0000', bg: 'FFFFFFFF', size: 9 });
  setCell(ws, r, 4, '', { bg: 'FFFFFFFF' });
  r++;

  const otherInfoDoc = getDoc(docs, 'declaration_other_info');
  ws.getRow(r).height = 30;
  setCell(ws, r, 1, 'Does the firm intend to provide any other information? *\n(If Yes, upload docs and enter filename)', { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', size: 10, wrap: true });
  setCell(ws, r, 2, decl.otherInfo || '', { bg: 'FFFFFFFF', size: 10 });
  setCell(ws, r, 3, otherInfoDoc || (decl.otherInfo === 'Yes' ? 'PDF copy required' : ''), { fg: otherInfoDoc ? 'FF000000' : 'FFFF0000', bg: 'FFFFFFFF', size: 9 });
  setCell(ws, r, 4, '', { bg: 'FFFFFFFF' });
  r++;

  const otherReqDoc = getDoc(docs, 'declaration_other_request');
  ws.getRow(r).height = 30;
  setCell(ws, r, 1, 'Does the firm intend to submit any other request for consideration? *\n(If Yes, upload docs and enter filename)', { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', size: 10, wrap: true });
  setCell(ws, r, 2, decl.otherRequest || '', { bg: 'FFFFFFFF', size: 10 });
  setCell(ws, r, 3, otherReqDoc || (decl.otherRequest === 'Yes' ? 'PDF copy required' : ''), { fg: otherReqDoc ? 'FF000000' : 'FFFF0000', bg: 'FFFFFFFF', size: 9 });
  setCell(ws, r, 4, '', { bg: 'FFFFFFFF' });
  r++;

  spacer(ws, r++, NC, 6);
  secHeader2(ws, r++, NC, '2.  Application Submission Details');
  spacer(ws, r++, NC, 5);

  ws.getRow(r).height = 22;
  setCell(ws, r, 1, 'Name of the Person Submitting Application *', { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', size: 10 });
  mergeSet(ws, r, 2, r, NC, decl.submitterName || '', { bg: 'FFFFFFFF', size: 10 });
  r++;
  ws.getRow(r).height = 22;
  setCell(ws, r, 1, 'Designation of the Person Submitting Application *', { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', size: 10 });
  mergeSet(ws, r, 2, r, NC, decl.submitterDesignation || '', { bg: 'FFFFFFFF', size: 10 });
  r++;
  const authDoc = getDoc(docs, 'declaration_auth_letter');
  ws.getRow(r).height = 28;
  setCell(ws, r, 1, 'Authorization Letter of Person Submitting Application *\n(If applicable, write filename)', { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', size: 10, wrap: true });
  mergeSet(ws, r, 2, r, NC, authDoc || '', { bg: 'FFFFFFFF', size: 10 });
  r++;

  spacer(ws, r++, NC, 6);
  secHeader2(ws, r++, NC, '3.  Working Days & Weekly Off');
  spacer(ws, r++, NC, 5);

  ws.getRow(r).height = 22;
  setCell(ws, r, 1, 'Weekly Off? * (If Yes, mention days)', { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', size: 10 });
  setCell(ws, r, 2, decl.weeklyOff || '', { bg: 'FFFFFFFF', size: 10 });
  setCell(ws, r, 3, 'Days (if Yes) *', { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', size: 10 });
  setCell(ws, r, 4, decl.weeklyOffDays || '', { bg: 'FFFFFFFF', size: 10 });
  r++;
  spacer(ws, r++, NC, 5);

  ws.getRow(r).height = 24;
  mergeSet(ws, r, 1, r, NC, '  I/We hereby declare that the information furnished above is true and correct to the best of my/our knowledge and belief.',
    { bold: false, fg: 'FF1A3C5E', bg: 'FFD6E4F0', size: 10 });
  r++;
  spacer(ws, r++, NC, 5);

  ws.getRow(r).height = 22;
  setCell(ws, r, 1, 'Signature of Authorised Signatory:', { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', size: 10 });
  mergeSet(ws, r, 2, r, NC, decl.signatoryName || '', { bg: 'FFFFFFFF', size: 10 });
  r++;
  ws.getRow(r).height = 22;
  setCell(ws, r, 1, 'Date:', { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', size: 10 });
  mergeSet(ws, r, 2, r, NC, decl.signDate || '', { bg: 'FFFFFFFF', size: 10 });
  r++;
  spacer(ws, r++, NC, 5);
  mergeSet(ws, r, 1, r, NC, clientInfo, { fg: 'FF555555', bg: 'FFEEF2F7', size: 8, align: 'center' });
}

function addChecklistSheet(wb, checklist, docs, clientInfo) {
  const ws = wb.addWorksheet('Document Checklist');
  ws.columns = [{ width: 6 }, { width: 52 }, { width: 16 }, { width: 14 }, { width: 28 }];
  const NC = 5;
  let r = 1;
  spacer(ws, r++, NC, 8);
  titleRow(ws, r++, NC, 'DOCUMENT CHECKLIST');
  noteRow(ws, r++, NC, 'Please collect and submit all documents listed below. Mark status once provided.');
  spacer(ws, r++, NC, 6);

  // Header
  ws.getRow(r).height = 28;
  ['S.No.', 'Document', 'Requirement', 'Template\nProvided?', 'Status\n(Provided / Pending)'].forEach((h, i) => {
    setCell(ws, r, i + 1, h, { bold: true, fg: 'FFFFFFFF', bg: 'FF1F5C99', size: 9, align: 'center', wrap: true });
  });
  r++;

  const DOCS = [
    ['Address Proof (Registered Office)', 'Mandatory'],
    ['GST Certificate', 'Mandatory'],
    ['Proof of Establishment of Firm (Business Licence / Incorporation)', 'Mandatory'],
    ['Business Licence (Company Incorporation Certificate)', 'Mandatory'],
    ['Address Proof (Factory / Manufacturing Unit)', 'Mandatory'],
    ['Supporting Docs of Product Variety', 'Optional'],
    ['Qualification Document & Photograph of Technical Manager', 'Mandatory'],
    ['Process Flowchart covering all Manufacturing Processes', 'Mandatory'],
    ['Layout Plan of Factory', 'Mandatory'],
    ['Manufacturing Machinery List', 'Mandatory'],
    ['Trademark Registration Details (Certification & Declaration)', 'Mandatory'],
    ['List of Testing Equipment', 'Mandatory'],
    ['In-House Test Report for the Product', 'Mandatory'],
    ['Agreement with Manufacturing Unit for Outsourcing', 'Mandatory'],
    ['Controls on Outsourced Process & Product on Receipt (IQC docs)', 'Mandatory'],
    ['Test Report / Test Certificate (from BIS / BIS Recognised / Empanelled Lab)', 'Mandatory'],
    ['Statutory Permissions required for the Product Category', 'Optional'],
    ['Authorization Letter of Person Submitting the Application', 'Mandatory'],
    ['Form of Label(s) (Nature of Packaging)', 'Mandatory'],
    ['Payment Receipt', 'Mandatory'],
    ['Scope of License', 'Mandatory'],
    ['List of Models to be covered in BIS Certification', 'Mandatory'],
    ['Quality Assurance System (Quality Manual)', 'Mandatory'],
    ['Drawing of Product', 'Mandatory'],
    ['Calibration Certificates (for testing equipment)', 'Mandatory'],
    ['Location Plan of Factory (Google Coordinates / Map)', 'Mandatory'],
    ['Undertaking (Acceptance of Marking Fee & STI)', 'Mandatory'],
    ['Declaration', 'Mandatory'],
    ['Undertaking for Arrangement of Water / Electricity', 'Mandatory'],
    ['Weekly Off Declaration (Working Days)', 'Mandatory'],
  ];

  DOCS.forEach(([docName, req], idx) => {
    const sno = idx + 1;
    const rowBg = sno % 2 === 0 ? 'FFF4F6F7' : 'FFFFFFFF';
    const status = checklist[String(sno)] || '';
    let statusBg = 'FFFFFFFF', statusFg = 'FF000000';
    if (status === 'Provided') { statusBg = 'FFC3E6CB'; statusFg = 'FF155724'; }
    else if (status === 'Pending') { statusBg = 'FFFFF3CD'; statusFg = 'FF856404'; }
    else if (status === 'Not Applicable') { statusBg = 'FFE2E3E5'; statusFg = 'FF383D41'; }

    ws.getRow(r).height = 22;
    setCell(ws, r, 1, sno, { bold: true, fg: 'FF1A3C5E', bg: rowBg, align: 'center', size: 9 });
    setCell(ws, r, 2, docName, { bg: rowBg, size: 9, wrap: true });
    setCell(ws, r, 3, req, {
      bold: true,
      fg: req === 'Mandatory' ? 'FF8B0000' : 'FF666600',
      bg: req === 'Mandatory' ? 'FFFFE8E8' : 'FFFFFDE7',
      align: 'center', size: 9
    });
    setCell(ws, r, 4, '', { bg: 'FFFFFFFF', size: 9 });
    setCell(ws, r, 5, status, { fg: statusFg, bg: statusBg, align: 'center', size: 9, bold: !!status });
    r++;
  });

  const miscDoc = getDoc(docs, 'checklist_misc');
  ws.getRow(r).height = 22;
  setCell(ws, r, 1, '', { bg: 'FFFFFFFF' });
  setCell(ws, r, 2, 'Miscellaneous Document', { bg: 'FFFFFFFF', size: 9, wrap: true });
  setCell(ws, r, 3, 'Optional', { bold: true, fg: 'FF666600', bg: 'FFFFFDE7', align: 'center', size: 9 });
  setCell(ws, r, 4, '', { bg: 'FFFFFFFF' });
  setCell(ws, r, 5, miscDoc || '', { bg: 'FFFFFFFF', size: 9 });
  r++;

  spacer(ws, r++, NC, 5);
  mergeSet(ws, r, 1, r, NC, clientInfo, { fg: 'FF555555', bg: 'FFEEF2F7', size: 8, align: 'center' });
}

async function generateExcel(submission) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Absolute Veritas Portal';
  wb.created = new Date();

  const fd = submission.formData || {};
  const docs = submission.documents || [];
  const reg = fd.registration || {};
  const org = fd.organization || {};
  const mgmt = fd.management || {};
  const mfg = fd.manufacturing || {};
  const pkg = fd.packaging || {};
  const testing = fd.testing || {};
  const tr = fd.testReport || {};
  const decl = fd.declaration || {};
  const checklist = fd.checklist || {};

  const clientInfo = `Client: ${submission.user?.username || '—'}   |   Status: ${submission.status}   |   Last Updated: ${new Date(submission.updatedAt).toLocaleDateString('en-IN')}`;

  // ============================================================
  // SHEET 1 — REGISTRATION FORM
  // Col widths: A=28, B=42, C=28, D=42
  // ============================================================
  {
    const ws = wb.addWorksheet('Registration Form');
    ws.columns = [{ width: 28 }, { width: 42 }, { width: 28 }, { width: 42 }];
    let r = 1;
    spacer(ws, r++, 4, 8);
    titleRow(ws, r++, 4, 'BIS PORTAL — REGISTRATION FORM');
    noteRow(ws, r++, 4, '* Mandatory Fields   |   Please fill carefully. Email cannot be changed later on the portal.');
    spacer(ws, r++, 4, 6);
    secHeader(ws, r++, 4, 'Registration Details');
    spacer(ws, r++, 4, 6);

    // Email — label A, value B-D merged
    lv1(ws, r++, 'Email *', reg.email);
    // Password
    lv1(ws, r++, 'Password *', reg.password);
    spacer(ws, r++, 4, 4);
    // Name — A=label, B=salutation, C=first, D=last
    ws.getRow(r).height = 20;
    setCell(ws, r, 1, 'Name *', { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', align: 'right', size: 10 });
    setCell(ws, r, 2, reg.salutation || '', { bg: 'FFFFFFFF', size: 10 });
    setCell(ws, r, 3, reg.firstName || '', { bg: 'FFFFFFFF', size: 10 });
    setCell(ws, r, 4, reg.lastName || '', { bg: 'FFFFFFFF', size: 10 });
    r++;
    // Middle Name
    lv1(ws, r++, 'Middle Name', reg.middleName || '');
    spacer(ws, r++, 4, 4);
    lv2(ws, r++, 'Date of Birth *', reg.dob || '', 'Mobile Number *', reg.mobile ? '+91 ' + reg.mobile : '');
    lv2(ws, r++, 'Nationality *', reg.nationality || '', reg.nationality === 'Others' ? 'Specify Nationality' : '', reg.nationalityOther || '');
    lv2(ws, r++, 'ID Card Type *', reg.idCardType || '', 'ID Card Number *', reg.idCardNumber || '');
    lv1(ws, r++, 'Hint Question *', reg.hintQuestion || '');
    lv2(ws, r++, 'Hint Answer *', reg.hintAnswer || '', '', '');
    lv1(ws, r++, 'Government ID Card (Upload) *', getDoc(docs, 'registration_id_card'));
    spacer(ws, r++, 4, 6);
    infoRow(ws, r++, 4, 'NOTE: CAPTCHA is filled directly on the BIS portal — not required here.');

    // Footer
    spacer(ws, r++, 4, 5);
    mergeSet(ws, r, 1, r, 4, clientInfo, { fg: 'FF555555', bg: 'FFEEF2F7', size: 8, align: 'center' });
  }

  // ============================================================
  // SHEET 2 — ORGANIZATION PROFILE
  // Col widths: A=28, B=38, C=28, D=38
  // ============================================================
  {
    const ws = wb.addWorksheet('Organization Profile');
    ws.columns = [{ width: 28 }, { width: 38 }, { width: 28 }, { width: 38 }];
    let r = 1;
    spacer(ws, r++, 4, 8);
    titleRow(ws, r++, 4, 'BIS CERTIFICATION LICENSE — ORGANIZATION PROFILE');
    noteRow(ws, r++, 4, '* Mandatory Fields   |   Incorrect details may lead to application rejection.');
    spacer(ws, r++, 4, 6);
    secHeader(ws, r++, 4, '1.  User Details');
    spacer(ws, r++, 4, 6);
    lv2(ws, r++, 'Registered Email *', org.registeredEmail || '', 'Registered Mobile Number *', org.registeredMobile || '');
    spacer(ws, r++, 4, 8);
    secHeader(ws, r++, 4, '2.  Firm / Office Details');
    spacer(ws, r++, 4, 6);
    lv2(ws, r++, 'Firm Name *', org.firmName || '', 'CEO Name *', org.ceoName || '');
    lv1(ws, r++, 'Office Address *', [org.officeAddressLine1, org.officeAddressLine2].filter(Boolean).join(' / '));
    lv2(ws, r++, 'Country *', org.officeCountry || '', 'Address 1 *', org.officeAddr1 || '');
    lv2(ws, r++, 'Address 2 *', org.officeAddr2 || '', 'City *', org.officeCity || '');
    lv1(ws, r++, 'PIN code', org.officePIN || '');
    // Address proof type + doc filename
    ws.getRow(r).height = 20;
    setCell(ws, r, 1, 'Address Proof Document Type *', { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', align: 'right', size: 10, wrap: true });
    setCell(ws, r, 2, org.officeAddrProofType || '', { bg: 'FFFFFFFF', size: 10 });
    setCell(ws, r, 3, 'Address Proof Document *', { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', align: 'right', size: 10, wrap: true });
    const officeDoc = getDoc(docs, 'organization_office_addr_proof');
    setCell(ws, r, 4, officeDoc || '', { fg: officeDoc ? 'FF000000' : 'FFFF0000', bg: 'FFFFFFFF', size: 10 });
    r++;
    lv2(ws, r++, 'Firm/Office Email *', org.officeEmail || '', 'Firm/Office Mobile Number', org.officeMobile || '');
    lv2(ws, r++, 'Landline STD Code', org.landlineSTD || '', 'Landline Number', org.landlineNumber || '');
    spacer(ws, r++, 4, 8);
    secHeader(ws, r++, 4, '3.  Registration Details');
    spacer(ws, r++, 4, 6);
    lv2(ws, r++, 'Sector *', org.sector || '', 'Scale *', org.scale || '');
    ws.getRow(r).height = 20;
    setCell(ws, r, 1, 'Proof of Establishment of Firm Document Type *', { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', align: 'right', size: 10, wrap: true });
    setCell(ws, r, 2, org.estabProofType || '', { bg: 'FFFFFFFF', size: 10 });
    setCell(ws, r, 3, 'Proof of Establishment of Firm *', { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', align: 'right', size: 10, wrap: true });
    const estabDoc = getDoc(docs, 'organization_estab_proof');
    setCell(ws, r, 4, estabDoc || '', { fg: estabDoc ? 'FF000000' : 'FFFF0000', bg: 'FFFFFFFF', size: 10 });
    r++;
    lv2(ws, r++, 'Registration Number/Business License Number', org.regNumber || '', 'Date Of Registration', org.regDate || '');
    spacer(ws, r++, 4, 8);
    secHeader(ws, r++, 4, '4.  Factory Details');
    spacer(ws, r++, 4, 6);
    lv1(ws, r++, 'Factory Address *', [org.factoryAddressLine1, org.factoryAddressLine2].filter(Boolean).join(' / '));
    lv2(ws, r++, 'Country *', org.factoryCountry || '', 'Address 1 *', org.factoryAddr1 || '');
    lv2(ws, r++, 'Address 2 *', org.factoryAddr2 || '', 'City *', org.factoryCity || '');
    lv1(ws, r++, 'PIN code', org.factoryPIN || '');
    ws.getRow(r).height = 20;
    setCell(ws, r, 1, 'Address Proof Document Type *', { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', align: 'right', size: 10, wrap: true });
    setCell(ws, r, 2, org.factoryAddrProofType || '', { bg: 'FFFFFFFF', size: 10 });
    setCell(ws, r, 3, 'Address Proof Document *', { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', align: 'right', size: 10, wrap: true });
    const factDoc = getDoc(docs, 'organization_factory_addr_proof');
    setCell(ws, r, 4, factDoc || '', { fg: factDoc ? 'FF000000' : 'FFFF0000', bg: 'FFFFFFFF', size: 10 });
    r++;
    lv2(ws, r++, 'Landline STD Code', org.factorySTD || '', 'Landline Number', org.factoryLandline || '');
    lv2(ws, r++, 'Manufacturer Email **', org.manufacturerEmail || '', 'Manufacturer Mobile Number', org.manufacturerMobile || '');
    spacer(ws, r++, 4, 6);
    noteRow(ws, r++, 4, '** Disclaimer: Manufacturer contact details must be accurate. Incorrect details will lead to application rejection.');
    spacer(ws, r++, 4, 5);
    mergeSet(ws, r, 1, r, 4, clientInfo, { fg: 'FF555555', bg: 'FFEEF2F7', size: 8, align: 'center' });
  }

  addManagementSheet(wb, mgmt, docs, clientInfo);
  addManufacturingSheet(wb, mfg, docs, clientInfo);
  addPackagingSheet(wb, pkg, docs, clientInfo);
  addTestingSheet(wb, testing, docs, clientInfo);
  addTestReportSheet(wb, tr, docs, clientInfo);
  addDeclarationSheet(wb, decl, docs, clientInfo);
  addChecklistSheet(wb, checklist, docs, clientInfo);

  return wb;
}

async function generateExcelISI(submission) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Absolute Veritas Portal';
  wb.created = new Date();

  const fd = submission.formData || {};
  const docs = submission.documents || [];
  const office = fd.firmOffice || {};
  const factory = fd.factory || {};
  const standard = fd.standard || {};

  const clientInfo = `Client: ${submission.user?.username || '—'}   |   Status: ${submission.status}   |   Last Updated: ${new Date(submission.updatedAt).toLocaleDateString('en-IN')}`;

  // ============================================================
  // SHEET 1 — APPLICATION FORM (Firm/Office, Registration, Factory, Standard)
  // Col widths: A=30, B=38, C=30, D=38
  // ============================================================
  {
    const ws = wb.addWorksheet('Application Form');
    ws.columns = [{ width: 30 }, { width: 38 }, { width: 30 }, { width: 38 }];
    let r = 1;
    spacer(ws, r++, 4, 8);
    titleRow(ws, r++, 4, 'ISI (BIS STANDARD MARK) — APPLICATION FORM');
    noteRow(ws, r++, 4, '* Mandatory Fields');
    spacer(ws, r++, 4, 6);

    secHeader(ws, r++, 4, '1.  Firm / Office Details');
    spacer(ws, r++, 4, 6);
    lv2(ws, r++, 'Firm Name *', office.firmName || '', 'CEO Name *', office.ceoName || '');
    lv1(ws, r++, 'Office Address *', office.officeAddress || '');
    lv2(ws, r++, 'Country *', office.officeCountry || '', 'State *', office.officeState || '');
    lv2(ws, r++, 'District *', office.officeDistrict || '', 'City *', office.officeCity || '');
    lv2(ws, r++, 'PIN Code', office.officePIN || '', 'Registered Email *', office.registeredEmail || '');
    lv2(ws, r++, 'Office Email *', office.officeEmail || '', 'Registered Mobile No. *', office.officeMobile || '');
    lv2(ws, r++, 'Alternate Mobile No.', office.altMobile || '', 'Landline No.', office.landlineNumber || '');
    ws.getRow(r).height = 20;
    setCell(ws, r, 1, 'Address Proof Document Type *', { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', align: 'right', size: 10, wrap: true });
    setCell(ws, r, 2, office.officeAddrProofType || '', { bg: 'FFFFFFFF', size: 10 });
    setCell(ws, r, 3, 'Address Proof Document *', { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', align: 'right', size: 10, wrap: true });
    const officeDoc = getDoc(docs, 'firmOffice_office_addr_proof');
    setCell(ws, r, 4, officeDoc || '', { fg: officeDoc ? 'FF000000' : 'FFFF0000', bg: 'FFFFFFFF', size: 10 });
    r++;

    spacer(ws, r++, 4, 8);
    secHeader(ws, r++, 4, '2.  Registration Details');
    spacer(ws, r++, 4, 6);
    lv2(ws, r++, 'User ID', office.userId || '', 'Application ID', office.applicationId || '');
    lv2(ws, r++, 'Nature of Firm *', office.natureOfFirm || '', 'Scale *', office.scale || '');
    lv2(ws, r++, 'Sector *', office.sector || '', 'Women Entrepreneur *', office.womenEntrepreneur || '');
    lv2(ws, r++, 'Startup *', office.startup || '', 'Date of Registration', office.regDate || '');
    lv1(ws, r++, 'Registration Number', office.registrationNumber || '');
    ws.getRow(r).height = 20;
    setCell(ws, r, 1, 'GST Number *', { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', align: 'right', size: 10 });
    setCell(ws, r, 2, office.gstNumber || '', { bg: 'FFFFFFFF', size: 10 });
    setCell(ws, r, 3, 'GST Certificate *', { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', align: 'right', size: 10 });
    const gstDoc = getDoc(docs, 'firmOffice_gst_cert');
    setCell(ws, r, 4, gstDoc || '', { fg: gstDoc ? 'FF000000' : 'FFFF0000', bg: 'FFFFFFFF', size: 10 });
    r++;
    lv1(ws, r++, 'PAN Number', office.panNumber || '');
    ws.getRow(r).height = 20;
    setCell(ws, r, 1, 'Proof of Establishment of Firm *', { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', align: 'right', size: 10, wrap: true });
    setCell(ws, r, 2, office.estabProofType || '', { bg: 'FFFFFFFF', size: 10 });
    setCell(ws, r, 3, 'Proof of Establishment Document *', { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', align: 'right', size: 10, wrap: true });
    const estabDoc = getDoc(docs, 'firmOffice_estab_proof');
    setCell(ws, r, 4, estabDoc || '', { fg: estabDoc ? 'FF000000' : 'FFFF0000', bg: 'FFFFFFFF', size: 10 });
    r++;
    lv1(ws, r++, 'Business Licence Number', office.businessLicenceNumber || '');

    spacer(ws, r++, 4, 8);
    secHeader(ws, r++, 4, '3.  Factory Details');
    spacer(ws, r++, 4, 6);
    lv2(ws, r++, 'Same as Office Address? *', factory.sameAsOffice || '', '', '');
    lv1(ws, r++, 'Factory Address *', factory.factoryAddress || '');
    lv2(ws, r++, 'Country *', factory.country || '', 'State *', factory.state || '');
    lv2(ws, r++, 'District *', factory.district || '', 'City *', factory.city || '');
    lv2(ws, r++, 'PIN Code', factory.pin || '', 'Landline Number', factory.landlineNumber || '');
    lv2(ws, r++, 'Factory Email *', factory.email || '', 'Registered Email', factory.registeredEmail || '');
    lv2(ws, r++, 'Registered Mobile No.', factory.mobile || '', 'Alternate Mobile No.', factory.altMobile || '');
    lv2(ws, r++, 'Latitude', factory.latitude || '', 'Longitude', factory.longitude || '');
    lv1(ws, r++, 'SEZ (Special Economic Zone)? *', factory.sez || '');
    ws.getRow(r).height = 20;
    setCell(ws, r, 1, 'Address Proof Document Type *', { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', align: 'right', size: 10, wrap: true });
    setCell(ws, r, 2, factory.addrProofType || '', { bg: 'FFFFFFFF', size: 10 });
    setCell(ws, r, 3, 'Factory Address Proof *', { bold: true, fg: 'FF1A3C5E', bg: 'FFDCE9F5', align: 'right', size: 10, wrap: true });
    const factDoc = getDoc(docs, 'factory_addr_proof');
    setCell(ws, r, 4, factDoc || '', { fg: factDoc ? 'FF000000' : 'FFFF0000', bg: 'FFFFFFFF', size: 10 });
    r++;

    spacer(ws, r++, 4, 8);
    secHeader(ws, r++, 4, '4.  Indian Standard & Scheme of Inspection');
    spacer(ws, r++, 4, 6);
    lv1(ws, r++, 'Knows Applicable Indian Standard? *', standard.knowsStandard || '');
    if (standard.knowsStandard === 'Yes') {
      lv1(ws, r++, 'Indian Standard *', standard.indianStandard || '');
    }
    lv1(ws, r++, 'Accepts Scheme of Inspection & Testing (SIT)? *', standard.acceptsSIT || '');

    spacer(ws, r++, 4, 6);
    secHeader2(ws, r++, 4, '5.  Product Variety');
    spacer(ws, r++, 4, 5);

    const varietyRows = (standard.rows || []).map(row => ({
      variety: row.variety || '',
      doc: getDoc(docs, `standard_variety_${row.id}`),
    }));

    r = drawTable(ws, r, [
      { col: 1, label: 'Variety Applied For *', key: 'variety', merge: 2 },
      { col: 3, label: 'Upload Supporting Documents\n(write filename) *', key: 'doc', merge: 2 },
    ], varietyRows, 4);

    spacer(ws, r++, 4, 5);
    mergeSet(ws, r, 1, r, 4, clientInfo, { fg: 'FF555555', bg: 'FFEEF2F7', size: 8, align: 'center' });
  }

  addManagementSheet(wb, fd.management || {}, docs, clientInfo);
  addManufacturingSheet(wb, fd.manufacturing || {}, docs, clientInfo);
  addPackagingSheet(wb, fd.packaging || {}, docs, clientInfo);
  addTestingSheet(wb, fd.testing || {}, docs, clientInfo);
  addTestReportSheet(wb, fd.testReport || {}, docs, clientInfo);
  addDeclarationSheet(wb, fd.declaration || {}, docs, clientInfo);
  addChecklistSheet(wb, fd.checklist || {}, docs, clientInfo);

  return wb;
}

async function generateExcelCRS(submission) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Absolute Veritas Portal';
  wb.created = new Date();

  const fd = submission.formData || {};
  const docs = submission.documents || [];
  const checklist = fd.checklist || {};
  const account = fd.account || {};
  const address = fd.address || {};
  const product = fd.product || {};
  const brand = fd.brand || {};
  const mgmt = fd.management || {};
  const contact = fd.contact || {};
  const air = fd.air || {};
  const uploads = fd.uploads || {};
  const clientInfo = `Client: ${submission.user?.username || '—'}   |   Status: ${submission.status}   |   Last Updated: ${new Date(submission.updatedAt).toLocaleDateString('en-IN')}`;

  const CHECKLIST_DOCS = [
    { no: 1, doc: 'Brand Registration Certificate(s)' },
    { no: 2, doc: 'Brand Authorization Letter' },
    { no: 3, doc: 'Authorization from Factory CEO/MD/Head for Filling and Signing Form-1' },
    { no: 4, doc: 'Authorization Letter from CEO/Top Management of AIR Firm' },
    { no: 5, doc: 'ID Card of Authorized Signatory of AIR' },
    { no: 6, doc: 'Raw Materials/Components' },
  ];

  // ============================================================
  // SHEET 1 — REGISTRATION & ADDRESS
  // ============================================================
  {
    const ws = wb.addWorksheet('Registration & Address');
    ws.columns = [{ width: 28 }, { width: 42 }, { width: 28 }, { width: 42 }];
    let r = 1;
    spacer(ws, r++, 4, 8);
    titleRow(ws, r++, 4, 'CRS APPLICATION — REGISTRATION & ADDRESS');
    noteRow(ws, r++, 4, '* Mandatory Fields');
    spacer(ws, r++, 4, 6);

    secHeader(ws, r++, 4, 'Document Checklist');
    spacer(ws, r++, 4, 4);
    CHECKLIST_DOCS.forEach(d => {
      const status = checklist[String(d.no)] || '';
      lv2(ws, r++, `${d.no}. ${d.doc}`, status, '', '', 32);
    });
    spacer(ws, r++, 4, 6);

    secHeader(ws, r++, 4, 'Basic Details');
    spacer(ws, r++, 4, 4);
    lv1(ws, r++, 'User Name *', account.userName);
    lv2(ws, r++, 'Company URL', account.companyUrl || '', 'Email *', account.email || '');
    lv2(ws, r++, 'Name *', [account.salutation, account.name].filter(Boolean).join(' ') || '', 'Designation', account.designation || '');
    lv1(ws, r++, 'Mobile No. *', account.mobile);
    spacer(ws, r++, 4, 6);

    secHeader(ws, r++, 4, 'Manufacturer Unit Details');
    spacer(ws, r++, 4, 4);
    lv1(ws, r++, 'Manufacturing Unit Name *', account.unitName);
    spacer(ws, r++, 4, 6);

    secHeader(ws, r++, 4, 'Address of the Manufacturing Unit');
    spacer(ws, r++, 4, 4);
    lv1(ws, r++, 'Email *', address.mfgEmail);
    lv1(ws, r++, 'Address *', address.mfgAddress, 4, 40);
    lv2(ws, r++, 'Country *', address.mfgCountry || '', 'State/Province *', address.mfgState || '');
    lv2(ws, r++, 'Zip Code *', address.mfgZip || '', 'Fax No.', address.mfgFax || '');
    lv1(ws, r++, 'Contact No. *', address.mfgContact);
    spacer(ws, r++, 4, 6);

    secHeader(ws, r++, 4, 'Address for Correspondence');
    spacer(ws, r++, 4, 4);
    lv1(ws, r++, 'Email *', address.corrEmail);
    lv1(ws, r++, 'Address *', address.corrAddress, 4, 40);
    lv2(ws, r++, 'Country *', address.corrCountry || '', 'State/Province *', address.corrState || '');
    lv2(ws, r++, 'Zip Code *', address.corrZip || '', 'Fax No.', address.corrFax || '');
    lv1(ws, r++, 'Contact No. *', address.corrContact);
    lv1(ws, r++, 'Correspondence Address Selection *', address.correspondenceSelection, 4, 28);
    lv1(ws, r++, 'Address Authentication Document', getDoc(docs, 'address_auth_doc'));
    lv1(ws, r++, 'Type of Document *', address.addrProofDocType || '');
    spacer(ws, r++, 4, 6);

    secHeader(ws, r++, 4, 'Product Details');
    spacer(ws, r++, 4, 4);
    lv2(ws, r++, 'Selection Mode *', product.mode === 'standard' ? 'Indian Standard Wise' : 'Product Category Wise', 'Product Category', product.productCategory || '');
    lv2(ws, r++, 'Product Name *', product.productName || '', 'Indian Standard *', product.indianStandard || '');
    lv1(ws, r++, 'Sub Category', product.subCategory || '');

    spacer(ws, r++, 4, 5);
    mergeSet(ws, r, 1, r, 4, clientInfo, { fg: 'FF555555', bg: 'FFEEF2F7', size: 8, align: 'center' });
  }

  // ============================================================
  // SHEET 2 — BRAND & MANAGEMENT
  // ============================================================
  {
    const ws = wb.addWorksheet('Brand & Management');
    ws.columns = [{ width: 6 }, { width: 30 }, { width: 30 }, { width: 20 }, { width: 20 }, { width: 18 }];
    let r = 1;
    spacer(ws, r++, 6, 8);
    titleRow(ws, r++, 6, 'CRS APPLICATION — BRAND & MANAGEMENT DETAILS');
    spacer(ws, r++, 6, 6);

    secHeader(ws, r++, 6, 'Brand Details');
    spacer(ws, r++, 6, 4);
    const brandRows = (brand.rows || []).map((row, i) => ({
      sno: i + 1, brandName: row.brandName || '', cert: getDoc(docs, `brand_cert_${row.id}`),
      ownedBy: row.ownedBy || '', registered: row.registered || '', registrationDate: row.registrationDate || '',
    }));
    r = drawTable(ws, r, [
      { col: 1, label: 'S.No.', key: 'sno' },
      { col: 2, label: 'Brand Name', key: 'brandName' },
      { col: 3, label: 'Registration Certificate', key: 'cert' },
      { col: 4, label: 'Owned By', key: 'ownedBy' },
      { col: 5, label: 'Registered?', key: 'registered' },
      { col: 6, label: 'Registration Date', key: 'registrationDate' },
    ], brandRows, 6);
    spacer(ws, r++, 6, 6);

    secHeader(ws, r++, 6, 'Top Management Details');
    spacer(ws, r++, 6, 4);
    const topRows = (mgmt.topRows || []).map((row, i) => ({ sno: i + 1, name: row.name || '', designation: row.designation || '' }));
    r = drawTable(ws, r, [
      { col: 1, label: 'S.No.', key: 'sno' },
      { col: 2, label: 'Name', key: 'name', merge: 2 },
      { col: 4, label: 'Designation', key: 'designation', merge: 3 },
    ], topRows, 6);
    spacer(ws, r++, 6, 6);

    secHeader(ws, r++, 6, 'Technical Management Details');
    spacer(ws, r++, 6, 4);
    const techRows = (mgmt.techRows || []).map((row, i) => ({ sno: i + 1, name: row.name || '', designation: row.designation || '' }));
    r = drawTable(ws, r, [
      { col: 1, label: 'S.No.', key: 'sno' },
      { col: 2, label: 'Name', key: 'name', merge: 2 },
      { col: 4, label: 'Designation', key: 'designation', merge: 3 },
    ], techRows, 6);

    spacer(ws, r++, 6, 5);
    mergeSet(ws, r, 1, r, 6, clientInfo, { fg: 'FF555555', bg: 'FFEEF2F7', size: 8, align: 'center' });
  }

  // ============================================================
  // SHEET 3 — CONTACT & AIR
  // ============================================================
  {
    const ws = wb.addWorksheet('Contact & AIR');
    ws.columns = [{ width: 28 }, { width: 42 }, { width: 28 }, { width: 42 }];
    let r = 1;
    spacer(ws, r++, 4, 8);
    titleRow(ws, r++, 4, 'CRS APPLICATION — CONTACT PERSON & AIR');
    spacer(ws, r++, 4, 6);

    secHeader(ws, r++, 4, 'Contact Person');
    spacer(ws, r++, 4, 4);
    lv2(ws, r++, 'Name *', contact.name || '', 'Designation *', contact.designation || '');
    lv2(ws, r++, 'Mobile Number *', contact.mobile || '', 'Email *', contact.email || '');
    lv1(ws, r++, 'Fax', contact.fax);
    spacer(ws, r++, 4, 6);

    secHeader(ws, r++, 4, 'Manufacturer Details');
    spacer(ws, r++, 4, 4);
    lv1(ws, r++, 'Firm Name', account.unitName);
    lv1(ws, r++, 'Firm Address', address.mfgAddress, 4, 40);
    spacer(ws, r++, 4, 6);

    secHeader(ws, r++, 4, 'AIR / Authorized Signatory');
    spacer(ws, r++, 4, 4);
    lv1(ws, r++, 'Representative Scenario *', air.scenario, 4, 48);
    lv2(ws, r++, 'Firm Name *', air.repFirmName || '', 'Firm Address *', air.repFirmAddress || '');
    lv2(ws, r++, 'Aadhar Number', air.aadharNumber || '', 'Govt. Issued Document', air.govtDocType || '');
    lv1(ws, r++, 'Document Number', air.govtDocNumber);
    lv2(ws, r++, 'Person Name', air.personName || '', 'Designation', air.personDesignation || '');
    lv2(ws, r++, 'Mobile Number', air.personMobile || '', 'Email', air.personEmail || '');
    lv2(ws, r++, 'State', air.state || '', 'Zip Code/Pin', air.zipCode || '');

    spacer(ws, r++, 4, 5);
    mergeSet(ws, r, 1, r, 4, clientInfo, { fg: 'FF555555', bg: 'FFEEF2F7', size: 8, align: 'center' });
  }

  // ============================================================
  // SHEET 4 — UPLOADS & DECLARATION
  // ============================================================
  {
    const ws = wb.addWorksheet('Upload Documents');
    ws.columns = [{ width: 40 }, { width: 40 }, { width: 28 }, { width: 42 }];
    let r = 1;
    spacer(ws, r++, 4, 8);
    titleRow(ws, r++, 4, 'CRS APPLICATION — UPLOAD DOCUMENTS');
    spacer(ws, r++, 4, 6);

    secHeader(ws, r++, 4, 'Upload Documents');
    spacer(ws, r++, 4, 4);
    lv1(ws, r++, 'Authorization from Factory CEO/MD/Head', getDoc(docs, 'uploads_ceo_auth'));
    lv1(ws, r++, 'Raw Materials/Components', getDoc(docs, 'uploads_raw_materials'));
    lv1(ws, r++, 'Authorization Letter from AIR Firm CEO/Top Mgmt', getDoc(docs, 'uploads_air_ceo_auth'));
    lv1(ws, r++, 'In-house Testing Facility?', uploads.inHouseTesting);
    lv1(ws, r++, 'Complete Manufacturing Facility?', uploads.completeManufacturing);
    lv1(ws, r++, 'ID Card of Authorized Signatory of AIR', getDoc(docs, 'uploads_air_id_card'));
    lv1(ws, r++, 'Other Document', getDoc(docs, 'uploads_other'));
    lv1(ws, r++, 'Factory Address Proof / Business License', getDoc(docs, 'uploads_factory_proof'));

    spacer(ws, r++, 4, 5);
    mergeSet(ws, r, 1, r, 4, clientInfo, { fg: 'FF555555', bg: 'FFEEF2F7', size: 8, align: 'center' });
  }

  return wb;
}

module.exports = { generateExcel, generateExcelCRS, generateExcelISI };
