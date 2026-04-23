/* ============================================================
   mix-design.js — CivilCalc Mix Design Calculator
   IS 10262:2019 | ACI 211.1 | Maximum Density | Fineness Modulus
============================================================ */

/* ============================================================
   CEMENT PRODUCT DATABASE
============================================================ */
const CEMENT_PRODUCTS = {
  'UltraTech Cement': [
    { name: 'UltraTech PPC', type: 'PPC', grade: 53, sg: 3.10, note: 'Best for general RCC, durability' },
    { name: 'UltraTech OPC 53', type: 'OPC53', grade: 53, sg: 3.15, note: 'High early strength' },
    { name: 'UltraTech OPC 43', type: 'OPC43', grade: 43, sg: 3.15, note: 'General construction' },
    { name: 'UltraTech Supercement', type: 'PPC', grade: 53, sg: 3.10, note: 'Premium PPC for structures' },
    { name: 'UltraTech Concrete+', type: 'OPC53', grade: 53, sg: 3.15, note: 'High performance OPC' },
  ],
  'ACC Cement': [
    { name: 'ACC Gold Water Shield', type: 'PPC', grade: 53, sg: 3.10, note: 'Waterproofing properties' },
    { name: 'ACC Gold PPC', type: 'PPC', grade: 53, sg: 3.10, note: 'General purpose PPC' },
    { name: 'ACC OPC 53', type: 'OPC53', grade: 53, sg: 3.15, note: 'High strength OPC' },
    { name: 'ACC OPC 43', type: 'OPC43', grade: 43, sg: 3.15, note: 'General construction' },
    { name: 'ACC Suraksha', type: 'PPC', grade: 43, sg: 3.10, note: 'Economy PPC grade' },
  ],
  'Ambuja Cement': [
    { name: 'Ambuja Plus', type: 'PPC', grade: 53, sg: 3.10, note: 'Superior quality PPC' },
    { name: 'Ambuja OPC 53', type: 'OPC53', grade: 53, sg: 3.15, note: 'Standard OPC 53' },
    { name: 'Ambuja Kawach', type: 'PPC', grade: 53, sg: 3.10, note: 'Waterproof PPC' },
    { name: 'Ambuja Compocem', type: 'PSC', grade: 43, sg: 3.05, note: 'Slag-based, durable' },
  ],
  'Shree Cement': [
    { name: 'Shree Jung Rodhak', type: 'PPC', grade: 53, sg: 3.10, note: 'Corrosion-resistant PPC' },
    { name: 'Shree OPC 53', type: 'OPC53', grade: 53, sg: 3.15, note: 'OPC 53 grade' },
    { name: 'Shree PPC', type: 'PPC', grade: 43, sg: 3.10, note: 'General PPC' },
    { name: 'Bangur Cement PPC', type: 'PPC', grade: 53, sg: 3.10, note: 'Premium PPC (Shree brand)' },
    { name: 'Bangur Super', type: 'OPC53', grade: 53, sg: 3.15, note: 'High strength' },
  ],
  'Dalmia Bharat Cement': [
    { name: 'Dalmia DSP', type: 'OPC53', grade: 53, sg: 3.15, note: 'Dalmia Super Plus OPC' },
    { name: 'Dalmia PPC', type: 'PPC', grade: 53, sg: 3.10, note: 'General PPC' },
    { name: 'Dalmia Infracem', type: 'PSC', grade: 43, sg: 3.05, note: 'Infrastructure grade' },
    { name: 'Konark Cement', type: 'OPC43', grade: 43, sg: 3.15, note: 'OPC 43 (Dalmia brand)' },
  ],
  'India Cements': [
    { name: 'Coromandel King OPC 53', type: 'OPC53', grade: 53, sg: 3.15, note: 'Premium OPC' },
    { name: 'Coromandel PPC', type: 'PPC', grade: 53, sg: 3.10, note: 'General purpose' },
    { name: 'Raasi Gold PPC', type: 'PPC', grade: 43, sg: 3.10, note: 'Raasi brand PPC' },
    { name: 'Sankar Super Power OPC', type: 'OPC53', grade: 53, sg: 3.15, note: 'High early strength' },
  ],
  'JK Cement': [
    { name: 'JK Super OPC 53', type: 'OPC53', grade: 53, sg: 3.15, note: 'Superior OPC 53' },
    { name: 'JK PPC', type: 'PPC', grade: 53, sg: 3.10, note: 'General PPC' },
    { name: 'JK Lakshmi OPC 53', type: 'OPC53', grade: 53, sg: 3.15, note: 'JK Lakshmi brand' },
    { name: 'JK Lakshmi PPC', type: 'PPC', grade: 53, sg: 3.10, note: 'JK Lakshmi PPC' },
    { name: 'JK White Cement', type: 'custom', grade: 43, sg: 3.05, note: 'White cement for finish work' },
  ],
  'Birla Corporation': [
    { name: 'Birla A1 PPC', type: 'PPC', grade: 53, sg: 3.10, note: 'Premium PPC' },
    { name: 'Birla Perfect Plus OPC 53', type: 'OPC53', grade: 53, sg: 3.15, note: 'OPC 53 grade' },
    { name: 'Samrat Cement OPC 43', type: 'OPC43', grade: 43, sg: 3.15, note: 'Economy grade' },
    { name: 'Chandrika Cement PPC', type: 'PPC', grade: 43, sg: 3.10, note: 'Regional brand' },
  ],
  'Ramco Cements': [
    { name: 'Ramco Super Grade OPC 53', type: 'OPC53', grade: 53, sg: 3.15, note: 'High strength' },
    { name: 'Ramco PPC', type: 'PPC', grade: 53, sg: 3.10, note: 'Standard PPC' },
    { name: 'Ramco Supercrete', type: 'OPC53', grade: 53, sg: 3.15, note: 'Superior performance' },
  ],
  'HeidelbergCement India': [
    { name: 'mycem Power OPC 53', type: 'OPC53', grade: 53, sg: 3.15, note: 'mycem brand' },
    { name: 'mycem Premium PPC', type: 'PPC', grade: 53, sg: 3.10, note: 'Premium PPC' },
    { name: 'Zuari OPC 53', type: 'OPC53', grade: 53, sg: 3.15, note: 'Zuari brand OPC' },
    { name: 'Zuari PPC', type: 'PPC', grade: 43, sg: 3.10, note: 'General purpose' },
  ],
  'Nuvoco Vistas (Lafarge)': [
    { name: 'Duraguard OPC 53', type: 'OPC53', grade: 53, sg: 3.15, note: 'Durability focused OPC' },
    { name: 'Duraguard Microfibre', type: 'OPC53', grade: 53, sg: 3.15, note: 'Microfibre reinforced' },
    { name: 'Concreto OPC 53', type: 'OPC53', grade: 53, sg: 3.15, note: 'Concreto brand' },
    { name: 'Concreto Uno PPC', type: 'PPC', grade: 53, sg: 3.10, note: 'Blend for durability' },
  ],
  'Orient Cement': [
    { name: 'Orient Gold OPC 53', type: 'OPC53', grade: 53, sg: 3.15, note: 'High strength OPC' },
    { name: 'Orient PPC', type: 'PPC', grade: 53, sg: 3.10, note: 'Standard PPC' },
  ],
  'Prism Cement': [
    { name: 'Prism Champion OPC 53', type: 'OPC53', grade: 53, sg: 3.15, note: 'High performance' },
    { name: 'Prism PPC', type: 'PPC', grade: 53, sg: 3.10, note: 'Standard PPC' },
  ],
  'Sanghi Cement': [
    { name: 'Sanghi OPC 53', type: 'OPC53', grade: 53, sg: 3.15, note: 'Standard OPC 53' },
    { name: 'Sanghi PPC', type: 'PPC', grade: 43, sg: 3.10, note: 'General PPC' },
  ],
  'My Home Industries': [
    { name: 'Maha OPC 53', type: 'OPC53', grade: 53, sg: 3.15, note: 'AP/Telangana market' },
    { name: 'Maha PPC', type: 'PPC', grade: 53, sg: 3.10, note: 'Standard PPC' },
  ],
};

/* ============================================================
   ADMIXTURE PRODUCT DATABASE
============================================================ */
const ADMIX_PRODUCTS = {
  'BASF MasterGlenium': [
    { name: 'MasterGlenium 8233', type: 'SP', wr: 25, note: 'High performance PCE superplasticiser' },
    { name: 'MasterGlenium SKY 8100', type: 'SP', wr: 28, note: 'SCC/Pump grade SP' },
    { name: 'MasterGlenium 7920', type: 'SP', wr: 22, note: 'Standard workability SP' },
    { name: 'MasterPolyheed 1094', type: 'WRA', wr: 15, note: 'Mid-range water reducer' },
    { name: 'MasterSet RT 760', type: 'RET', wr: 5, note: 'Concrete retarder' },
    { name: 'MasterPozzolith 322N', type: 'WRA', wr: 12, note: 'Normal plasticiser' },
  ],
  'Sika ViscoCrete': [
    { name: 'SikaViscoCrete-20HE', type: 'SP', wr: 20, note: 'High early strength SP' },
    { name: 'SikaViscoCrete-3000', type: 'SP', wr: 25, note: 'Standard PCE SP' },
    { name: 'SikaViscoCrete-5000', type: 'SP', wr: 30, note: 'High reduction SCC' },
    { name: 'Sikament FM', type: 'WRA', wr: 12, note: 'Standard water reducer' },
    { name: 'Sika Plastiment', type: 'RET', wr: 8, note: 'Plasticiser + retarder' },
    { name: 'SikaFume', type: 'VMA', wr: 0, note: 'Viscosity modifier/silica fume' },
  ],
  'Fosroc Conplast': [
    { name: 'Conplast SP430', type: 'SP', wr: 20, note: 'PCE based SP, general use' },
    { name: 'Conplast SP337', type: 'SP', wr: 15, note: 'Lignosulphonate SP' },
    { name: 'Conplast WL', type: 'WRA', wr: 10, note: 'Water reducing plasticiser' },
    { name: 'Conplast RP264', type: 'RET', wr: 5, note: 'Retarding plasticiser' },
    { name: 'Forseal WB', type: 'AEA', wr: 5, note: 'Air entraining agent' },
  ],
  'CICO Technologies': [
    { name: 'Cico No.1', type: 'ACC', wr: 0, note: 'Accelerating waterproofer' },
    { name: 'Cico Permacoat', type: 'WRA', wr: 12, note: 'Waterproof plasticiser' },
    { name: 'Cico Superplast', type: 'SP', wr: 20, note: 'Superplasticiser' },
  ],
  'Pidilite Dr. Fixit': [
    { name: 'Dr. Fixit Pidifin 2K', type: 'WRA', wr: 10, note: 'Waterproofing admixture' },
    { name: 'Dr. Fixit Pidiproof LW+', type: 'WRA', wr: 8, note: 'Integral waterproofer' },
    { name: 'Dr. Fixit Krystalline', type: 'WRA', wr: 5, note: 'Crystalline waterproofing' },
  ],
  'Chryso India': [
    { name: 'Chryso Fluid Optima 260', type: 'SP', wr: 25, note: 'PCE SP for high performance' },
    { name: 'Chryso Fluid Premia 390', type: 'SP', wr: 20, note: 'Standard performance SP' },
    { name: 'ChrysoCom 3H', type: 'ACC', wr: 5, note: 'Accelerator for early strength' },
  ],
  'GCP Applied Technologies': [
    { name: 'WRDA 35', type: 'WRA', wr: 12, note: 'Standard water reducer' },
    { name: 'ADVA Cast 600', type: 'SP', wr: 25, note: 'High range water reducer' },
    { name: 'Daravair 1000', type: 'AEA', wr: 3, note: 'Air entraining admixture' },
  ],
  'UltraTech Admixtures': [
    { name: 'UltraTech MasterEase', type: 'SP', wr: 22, note: 'Viscosity modifier SP' },
    { name: 'UltraTech FlowCon', type: 'SP', wr: 20, note: 'Standard SP' },
  ],
  'Sobha Chemicals': [
    { name: 'Sobha Plastiment', type: 'WRA', wr: 10, note: 'General water reducer' },
    { name: 'Sobha Superfluid', type: 'SP', wr: 18, note: 'Superplasticiser' },
  ],
  'W. R. Grace': [
    { name: 'GRACE WRDA 82', type: 'WRA', wr: 12, note: 'Water reducing agent' },
    { name: 'ADVA 150', type: 'SP', wr: 20, note: 'High range WR' },
  ],
};

/* ============================================================
   IS 10262:2019 — LOOKUP TABLES
============================================================ */
// Standard Deviation by grade (IS 10262 Table 1)
function mdGetSD(fck) {
  if (fck <= 15) return 3.5;
  if (fck <= 30) return 4.0;
  if (fck <= 50) return 5.0;
  return 6.0;
}

// Max w/c ratio by exposure (IS 456 Table 5)
const EXPOSURE_WC = {
  mild: 0.60, moderate: 0.50, severe: 0.45, very_severe: 0.45, extreme: 0.40
};
// Min cement content by exposure (IS 456 Table 5)
const EXPOSURE_MIN_CEMENT = {
  mild: 300, moderate: 300, severe: 320, very_severe: 340, extreme: 360
};
// Min grade by exposure
const EXPOSURE_MIN_GRADE = {
  mild: 20, moderate: 25, severe: 30, very_severe: 35, extreme: 40
};

// Free water content (IS 10262 Table 2) — litres/m³
// [Agg size mm][Slump range][Agg type]
function mdWaterContent(aggSizeMm, slumpMm, aggType) {
  // Base water for angular aggregate, 20mm size, 75mm slump = 186
  // Adjustments per IS 10262
  let base;
  if (aggSizeMm <= 10) base = 208;
  else if (aggSizeMm <= 20) base = 186;
  else base = 165; // 40mm

  // Slump correction: +3 litres per 25mm slump above 75mm (approx)
  const slumpCorr = ((slumpMm - 75) / 25) * 3;

  // Aggregate type correction
  let typeCorr = 0;
  if (aggType === 'subangular') typeCorr = -10;
  if (aggType === 'rounded')    typeCorr = -15;

  return Math.round(base + slumpCorr + typeCorr);
}

// Volume of coarse aggregate per unit volume of total aggregate (IS 10262 Table 3)
// Returns fraction for given zone and agg size
function mdCAVolFraction(aggSizeMm, sandZone) {
  // Table 3 values (volume of CA per m³ of total agg)
  const tbl = {
    10: { 1: 0.50, 2: 0.48, 3: 0.46, 4: 0.44 },
    20: { 1: 0.66, 2: 0.64, 3: 0.62, 4: 0.60 },
    40: { 1: 0.75, 2: 0.73, 3: 0.71, 4: 0.69 },
  };
  const key = aggSizeMm <= 10 ? 10 : aggSizeMm <= 20 ? 20 : 40;
  return tbl[key][sandZone] || 0.62;
}

// IS w/c vs strength table (IS 10262 Table 5 — OPC 53)
function mdWCFromStrength(fckTarget, cementGrade) {
  // Curve: w/c = A - B*ln(fckTarget)  (regression from IS table)
  // For OPC 53:
  const factor = cementGrade >= 53 ? 1.0 : cementGrade >= 43 ? 0.95 : 0.90;
  // IS 10262 Table 5 reference points (OPC 53):
  // 20 MPa → 0.57, 25 → 0.50, 30 → 0.44, 35 → 0.40, 40 → 0.37, 50 → 0.33
  const wc = (0.57 - 0.09 * Math.log(fckTarget / 20)) * factor;
  return Math.round(wc * 100) / 100;
}

/* ============================================================
   ACI 211.1 TABLES
============================================================ */
// ACI Recommended mix proportioning
function aciWaterContent(aggSizeMm, slumpMm, airEntrained) {
  // ACI Table 6.3.3
  const aggKey = aggSizeMm <= 10 ? 9.5 : aggSizeMm <= 20 ? 19 : 37.5;
  const tbl = {
    9.5:  { low: 207, medium: 228, high: 243 },
    19:   { low: 181, medium: 202, high: 216 },
    37.5: { low: 160, medium: 176, high: 190 },
  };
  const cat = slumpMm <= 50 ? 'low' : slumpMm <= 100 ? 'medium' : 'high';
  let w = tbl[aggKey][cat];
  if (airEntrained) w = Math.round(w * 0.88);
  return w;
}

function aciWCRatio(fckTarget) {
  // ACI 211 Table 6.3.4 — non-air entrained
  if (fckTarget <= 17) return 0.67;
  if (fckTarget <= 21) return 0.58;
  if (fckTarget <= 25) return 0.51;
  if (fckTarget <= 30) return 0.44;
  if (fckTarget <= 35) return 0.38;
  if (fckTarget <= 40) return 0.33;
  return 0.31;
}

function aciCAContent(aggSizeMm, fmSand, bulkDensityCA) {
  // ACI Table 6.3.6 — vol fraction CA per unit vol concrete
  const tbl = { 9.5: 0.50, 19: 0.66, 37.5: 0.76 };
  const baseKey = aggSizeMm <= 10 ? 9.5 : aggSizeMm <= 20 ? 19 : 37.5;
  let vol = tbl[baseKey];
  // Correction for FM of FA
  vol += (fmSand - 2.6) * 0.03;
  return vol * bulkDensityCA; // kg
}

/* ============================================================
   CURRENT SELECTED METHOD
============================================================ */
let currentMethod = 'IS';

function mdSelectMethod(m) {
  currentMethod = m;
  document.querySelectorAll('.method-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('mth-' + m).classList.add('active');
  const desc = {
    IS:  '<strong>IS 10262 : 2019</strong> — Indian Standard. Uses target strength (fck + 1.65σ), w/c from IS tables, water content from IS 10262 Table 2, and CA volume from IS Table 3. Recommended for Indian construction.',
    ACI: '<strong>ACI 211.1</strong> — American Concrete Institute method. Uses ACI water tables, w/c from ACI strength curves, and CA volume from ACI Table 6.3.6. Good reference method.',
    MDD: '<strong>Maximum Density Method</strong> — Aggregates are proportioned to achieve maximum packing density using Füller\'s curve (d/D = (size/max)^0.45). Minimises voids, good for high-strength mixes.',
    FM:  '<strong>Fineness Modulus Method</strong> — Uses fineness modulus of sand to determine FA:CA split. Simple, effective when FM of sand is known. Based on Abrams and Talbot work.',
  };
  document.getElementById('md_method_desc').innerHTML = desc[m];
}

/* ============================================================
   CEMENT COMPANY/PRODUCT HANDLERS
============================================================ */
function mdOnCementCompany() {
  const company = document.getElementById('md_cement_company').value;
  const prodSel = document.getElementById('md_cement_product');
  const custRow = document.getElementById('md_cement_custom_row');
  const note    = document.getElementById('md_cement_note');

  prodSel.innerHTML = '<option value="">-- Select Product --</option>';
  custRow.style.display = 'none';
  note.style.display = 'none';

  if (company === 'custom') {
    custRow.style.display = 'grid';
    return;
  }
  const products = CEMENT_PRODUCTS[company] || [];
  products.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.name;
    opt.textContent = p.name + ' (' + p.type + ')';
    prodSel.appendChild(opt);
  });
}

function mdOnCementProduct() {
  const company = document.getElementById('md_cement_company').value;
  const prodName = document.getElementById('md_cement_product').value;
  const note = document.getElementById('md_cement_note');
  if (!prodName || !CEMENT_PRODUCTS[company]) { note.style.display = 'none'; return; }
  const prod = CEMENT_PRODUCTS[company].find(p => p.name === prodName);
  if (!prod) { note.style.display = 'none'; return; }

  // Auto-fill fields
  document.getElementById('md_cement_type').value = prod.type || 'OPC53';
  if (prod.grade) {
    const gradeStr = String(prod.grade);
    const gradeSel = document.getElementById('md_cement_grade_mpa');
    if ([...gradeSel.options].some(o => o.value === gradeStr)) gradeSel.value = gradeStr;
    // Update SG
    if (prod.sg) document.getElementById('md_sg_cement').value = prod.sg;
  }
  document.getElementById('md_cement_note').style.display = 'inline-flex';
  document.getElementById('md_cement_note_txt').textContent = prod.note;
}

// Auto-select product when dropdown changes
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('md_cement_product').addEventListener('change', mdOnCementProduct);
});

function mdOnCementType() {
  // Could expand to show specific notes
}

function mdOnCementGrade() {
  const v = document.getElementById('md_cement_grade_mpa').value;
  const row = document.getElementById('md_cement_extras_row');
  const wrap = document.getElementById('md_grade_custom_wrap');
  if (v === 'custom') { row.style.display = 'grid'; wrap.style.display = 'flex'; }
  else { wrap.style.display = 'none'; if (!document.getElementById('md_bag_custom_wrap').style.display.includes('flex')) row.style.display = 'none'; }
}

function mdOnBagWt() {
  const v = document.getElementById('md_bag_wt').value;
  const row = document.getElementById('md_cement_extras_row');
  const wrap = document.getElementById('md_bag_custom_wrap');
  if (v === 'custom') { row.style.display = 'grid'; wrap.style.display = 'flex'; }
  else { wrap.style.display = 'none'; if (!document.getElementById('md_grade_custom_wrap').style.display.includes('flex')) row.style.display = 'none'; }
}

function mdOnGrade() {
  const v = document.getElementById('md_grade').value;
  document.getElementById('md_custom_grade_row').style.display = v === 'custom' ? 'flex' : 'none';
}

function mdOnSlumpPreset() {
  const v = document.getElementById('md_slump_preset').value;
  if (v !== 'custom') document.getElementById('md_slump').value = v;
}

function mdOnAggSize() {
  const v = document.getElementById('md_agg_size').value;
  document.getElementById('md_agg_custom_row').style.display = v === 'custom' ? 'flex' : 'none';
}

function mdOnSDType() {
  const v = document.getElementById('md_sd_type').value;
  document.getElementById('md_sd_manual_row').style.display = v === 'manual' ? 'flex' : 'none';
}

function mdToggleAdmixture() {
  const on = document.getElementById('md_admix_used').checked;
  document.getElementById('md_admix_block').style.display = on ? 'block' : 'none';
}

function mdOnAdmixCompany() {
  const company = document.getElementById('md_admix_company').value;
  const prodSel = document.getElementById('md_admix_product');
  const custRow = document.getElementById('md_admix_custom_row');

  prodSel.innerHTML = '<option value="">-- Select Product --</option>';
  custRow.style.display = 'none';

  if (company === 'custom') { custRow.style.display = 'grid'; return; }
  const products = ADMIX_PRODUCTS[company] || [];
  products.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.name;
    opt.textContent = p.name + ' (' + p.type + ')';
    // Auto-fill type and WR on select
    opt.dataset.type = p.type;
    opt.dataset.wr = p.wr;
    opt.dataset.note = p.note;
    prodSel.appendChild(opt);
  });

  prodSel.addEventListener('change', function() {
    const sel = prodSel.options[prodSel.selectedIndex];
    if (sel.dataset.type) document.getElementById('md_admix_type').value = sel.dataset.type;
    if (sel.dataset.wr) document.getElementById('md_admix_water_red').value = sel.dataset.wr;
  });
}

function mdToggleAdvanced() {
  const toggle = document.getElementById('md_adv_toggle');
  const body   = document.getElementById('md_adv_body');
  toggle.classList.toggle('open');
  body.classList.toggle('open');
}

function mdReset() {
  if (!confirm('Reset all mix design inputs?')) return;
  document.getElementById('md_output').style.display = 'none';
  document.getElementById('md_grade').value = 'M25';
  document.getElementById('md_exposure').value = 'moderate';
  document.getElementById('md_slump').value = '75';
  document.getElementById('md_slump_preset').value = '75';
  document.getElementById('md_agg_size').value = '20';
  document.getElementById('md_agg_type').value = 'angular';
  document.getElementById('md_sand_zone').value = '2';
  document.getElementById('md_admix_used').checked = false;
  document.getElementById('md_admix_block').style.display = 'none';
}

/* ============================================================
   HELPERS
============================================================ */
function mdSafeNum(id, def) {
  const el = document.getElementById(id);
  if (!el) return def;
  const v = parseFloat(el.value);
  return isNaN(v) ? def : v;
}
function mdVal(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}
function mdFmtRs(x) {
  if (!x || x === 0) return '—';
  return '₹\u00a0' + Number(x).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

/* ============================================================
   MAIN CALCULATION ENGINE
============================================================ */
function calcMixDesign() {
  // === Read Inputs ===
  const method = currentMethod;

  // Grade / fck
  const gradeVal = mdVal('md_grade');
  let fck;
  if (gradeVal === 'custom') {
    fck = mdSafeNum('md_custom_fck', 30);
  } else {
    fck = parseInt(gradeVal.replace('M', '')) || 25;
  }

  // Cement
  const cementType   = mdVal('md_cement_type');
  const cementGradeV = mdVal('md_cement_grade_mpa');
  const cementGrade  = cementGradeV === 'custom' ? mdSafeNum('md_cement_grade_custom', 53) : parseFloat(cementGradeV) || 53;
  const bagWtV       = mdVal('md_bag_wt');
  const bagWt        = bagWtV === 'custom' ? mdSafeNum('md_bag_wt_custom', 50) : parseFloat(bagWtV) || 50;
  const cementCo     = mdVal('md_cement_company') === 'custom' ? mdVal('md_cement_company_txt') : mdVal('md_cement_company');
  const cementProd   = mdVal('md_cement_product') || mdVal('md_cement_product_txt') || '—';

  // Exposure
  const exposure = mdVal('md_exposure');
  const maxWC    = EXPOSURE_WC[exposure] || 0.50;
  const minCem   = EXPOSURE_MIN_CEMENT[exposure] || 300;
  const minGrade = EXPOSURE_MIN_GRADE[exposure] || 25;

  if (fck < minGrade) {
    showMDWarning(`⚠ Grade M${fck} is below minimum M${minGrade} required for ${exposure} exposure. Upgrade grade.`);
    return;
  }

  // Workability
  const slump   = mdSafeNum('md_slump', 75);

  // Aggregate
  const aggSizeV = mdVal('md_agg_size');
  const aggSize  = aggSizeV === 'custom' ? mdSafeNum('md_agg_size_custom', 20) : parseFloat(aggSizeV) || 20;
  const aggType  = mdVal('md_agg_type');
  const sandZone = parseInt(mdVal('md_sand_zone')) || 2;

  // Admixture
  const admixUsed  = document.getElementById('md_admix_used').checked;
  const admixWR    = admixUsed ? mdSafeNum('md_admix_water_red', 20) : 0;
  const admixDose  = admixUsed ? mdSafeNum('md_admix_dosage', 0.8) : 0;
  const admixType  = admixUsed ? mdVal('md_admix_type') : '';
  const admixProd  = admixUsed ? (mdVal('md_admix_product') || mdVal('md_admix_custom_name') || '—') : '—';

  // Advanced
  const sgC    = mdSafeNum('md_sg_cement', 3.15);
  const sgFA   = mdSafeNum('md_sg_fa', 2.65);
  const sgCA   = mdSafeNum('md_sg_ca', 2.70);
  const waFA   = mdSafeNum('md_wa_fa', 1.0) / 100;
  const waCA   = mdSafeNum('md_wa_ca', 0.5) / 100;
  const mcFA   = mdSafeNum('md_mc_fa', 2.0) / 100;
  const mcCA   = mdSafeNum('md_mc_ca', 0.5) / 100;
  const sdAuto = mdVal('md_sd_type') === 'auto';
  const sd     = sdAuto ? mdGetSD(fck) : mdSafeNum('md_sd_val', 4.0);
  const fmSand = mdSafeNum('md_fm_sand', 2.60);
  const bulkCA = mdSafeNum('md_bulk_ca', 1600);

  // Rates
  const rateCem   = mdSafeNum('md_rate_cement', 0);
  const rateFA    = mdSafeNum('md_rate_fa', 0);
  const rateCA    = mdSafeNum('md_rate_ca', 0);
  const rateWater = mdSafeNum('md_rate_water', 0);
  const rateAdmix = mdSafeNum('md_rate_admix', 0);

  // === STEP 1: Target Strength ===
  const fckTarget = fck + 1.65 * sd;  // IS 10262 Eq.1

  // === STEP 2: Water-Cement Ratio ===
  let wcStrength, wcDurability, wcFinal;
  if (method === 'IS') {
    wcStrength    = mdWCFromStrength(fckTarget, cementGrade);
    wcDurability  = maxWC;
    wcFinal       = Math.min(wcStrength, wcDurability);
  } else if (method === 'ACI') {
    wcStrength    = aciWCRatio(fckTarget);
    wcDurability  = maxWC;
    wcFinal       = Math.min(wcStrength, wcDurability);
  } else if (method === 'MDD' || method === 'FM') {
    // Use IS strength table as base
    wcStrength    = mdWCFromStrength(fckTarget, cementGrade);
    wcDurability  = maxWC;
    wcFinal       = Math.min(wcStrength, wcDurability);
  }
  wcFinal = Math.round(wcFinal * 100) / 100;

  // === STEP 3: Free Water Content ===
  let waterContent;
  if (method === 'ACI') {
    waterContent = aciWaterContent(aggSize, slump, admixType === 'AEA');
  } else {
    waterContent = mdWaterContent(aggSize, slump, aggType);
  }
  // Apply admixture water reduction
  if (admixUsed && admixWR > 0) {
    waterContent = Math.round(waterContent * (1 - admixWR / 100));
  }

  // === STEP 4: Cement Content ===
  let cementContent = waterContent / wcFinal;
  cementContent = Math.max(cementContent, minCem); // durability minimum
  cementContent = Math.round(cementContent);

  // Recalculate actual w/c with rounded cement
  const wcActual = Math.round((waterContent / cementContent) * 100) / 100;

  // Admixture mass
  const admixMass = admixUsed ? (cementContent * admixDose / 100) : 0;

  // === STEP 5: Aggregate Proportioning ===
  // Volume method (IS 10262 Cl.10)
  // Total volume = 1 m³
  // Vol_cement + Vol_water + Vol_FA + Vol_CA + Air = 1
  const airVoid = 0.02; // 2% assumed

  const volCement = cementContent / (sgC * 1000);
  const volWater  = waterContent / 1000;
  const volAir    = airVoid;
  const volAdmix  = admixUsed ? (admixMass / (1.15 * 1000)) : 0; // assume SG 1.15

  const volAgg = 1 - volCement - volWater - volAir - volAdmix;

  let volCA, volFA;

  if (method === 'IS' || method === 'MDD') {
    const caFrac = mdCAVolFraction(aggSize, sandZone);
    volCA = volAgg * caFrac;
    volFA = volAgg * (1 - caFrac);
  } else if (method === 'ACI') {
    const caKg = aciCAContent(aggSize, fmSand, bulkCA);
    volCA = caKg / (sgCA * 1000);
    volFA = volAgg - volCA;
  } else if (method === 'FM') {
    // FM method — FA fraction based on FM of sand
    // Based on Abrams: FA/(FA+CA) = (FM_CA - FM_mix) / (FM_CA - FM_FA)
    // Assume FM_CA ≈ 6.5, target FM_mix ≈ 4.0 + 0.1*(fck/10)
    const fmCA  = 6.5;
    const fmMix = 4.0 + 0.1 * (fck / 10);
    let faFrac  = (fmCA - fmMix) / (fmCA - fmSand);
    faFrac = Math.min(0.55, Math.max(0.30, faFrac));
    volFA = volAgg * faFrac;
    volCA = volAgg * (1 - faFrac);
  }

  const massFA = Math.round(volFA * sgFA * 1000);
  const massCA = Math.round(volCA * sgCA * 1000);

  // === STEP 6: Surface-Dry Corrections ===
  // Absorbed water by aggregates
  const absorbedByFA = massFA * waFA;
  const absorbedByCA = massCA * waCA;
  // Surface moisture in aggregates
  const freeMoistFA  = massFA * mcFA;
  const freeMoistCA  = massCA * mcCA;
  // Corrected water
  const waterAdj     = waterContent + absorbedByFA + absorbedByCA - freeMoistFA - freeMoistCA;
  const faAdj        = massFA - freeMoistFA + absorbedByFA;
  const caAdj        = massCA - freeMoistCA + absorbedByCA;

  // === STEP 7: Mix Ratio ===
  const ratioBase = cementContent;
  const ratioFA   = Math.round((massFA / ratioBase) * 100) / 100;
  const ratioCA   = Math.round((massCA / ratioBase) * 100) / 100;
  const ratioStr  = '1 : ' + ratioFA + ' : ' + ratioCA;

  // === STEP 8: Cement Bags ===
  const bagsPerM3 = Math.ceil(cementContent / bagWt);

  // === STEP 9: Cost ===
  let costCement = 0, costFA = 0, costCA = 0, costWater = 0, costAdmix = 0, totalCost = 0;
  if (rateCem) costCement = bagsPerM3 * rateCem;
  if (rateFA)  costFA  = (volFA) * rateFA;
  if (rateCA)  costCA  = (volCA) * rateCA;
  if (rateWater) costWater = (waterContent / 1000) * rateWater;
  if (rateAdmix && admixUsed) costAdmix = admixMass * rateAdmix;
  totalCost = costCement + costFA + costCA + costWater + costAdmix;

  // === WARNINGS ===
  const warnings = [];
  if (wcActual > maxWC) warnings.push('⚠ Actual w/c (' + wcActual + ') exceeds max allowed (' + maxWC + ') for ' + exposure + ' exposure.');
  if (cementContent > 450) warnings.push('⚠ Cement content > 450 kg/m³. Risk of thermal cracking. Consider SCM replacement.');
  if (cementContent < minCem) warnings.push('⚠ Cement content below minimum ' + minCem + ' kg/m³ for ' + exposure + ' exposure.');
  if (slump > 150) warnings.push('⚠ Very high slump (>150 mm). SCC design recommended. Verify with VMA.');
  if (fck < 25) warnings.push('ℹ M' + fck + ' is a Nominal Mix. Design mix calculator is for M25+. Results shown for reference only.');

  // === RENDER OUTPUT ===
  const outEl = document.getElementById('md_output');
  outEl.style.display = 'block';

  const coCertNote = (cementCo && cementCo !== '-- Select Company --' && cementCo !== '')
    ? (cementCo + (cementProd !== '—' ? ' / ' + cementProd : '')) : 'Custom Cement';

  let warningsHTML = warnings.map(w =>
    `<div class="${w.startsWith('⚠') ? 'md-warning' : 'md-info'}">${w}</div>`
  ).join('');

  let costHTML = '';
  if (totalCost > 0) {
    costHTML = `
    <div style="margin-top:14px; padding-top:12px; border-top:1px dashed #bfdbfe;">
      <div style="font-weight:700; font-size:13px; color:#1e40af; margin-bottom:8px;">💰 Cost Estimate (per m³)</div>
      ${costCement ? `<div class="md-cost-row"><span>Cement (${bagsPerM3} bags × ₹${rateCem})</span><span>${mdFmtRs(costCement)}</span></div>` : ''}
      ${costFA     ? `<div class="md-cost-row"><span>Fine Aggregate (${volFA.toFixed(3)} m³)</span><span>${mdFmtRs(costFA)}</span></div>` : ''}
      ${costCA     ? `<div class="md-cost-row"><span>Coarse Aggregate (${volCA.toFixed(3)} m³)</span><span>${mdFmtRs(costCA)}</span></div>` : ''}
      ${costWater  ? `<div class="md-cost-row"><span>Water (${waterContent} L)</span><span>${mdFmtRs(costWater)}</span></div>` : ''}
      ${costAdmix && admixUsed ? `<div class="md-cost-row"><span>Admixture (${admixMass.toFixed(2)} kg)</span><span>${mdFmtRs(costAdmix)}</span></div>` : ''}
      <div class="md-cost-row" style="font-weight:800; font-size:14px; border-bottom:none; padding-top:6px; border-top:2px solid #bfdbfe;">
        <span>Total Material Cost / m³</span><span style="color:#1e40af;">${mdFmtRs(totalCost)}</span>
      </div>
    </div>`;
  }

  let correctionHTML = '';
  if (Math.abs(waterAdj - waterContent) > 1) {
    correctionHTML = `
    <div style="margin-top:12px; padding-top:10px; border-top:1px dashed #bfdbfe;">
      <div style="font-weight:700; font-size:12px; color:#374151; margin-bottom:6px;">🔧 Site-Adjusted Quantities (Surface-Dry Correction)</div>
      <div class="md-result-grid">
        <div class="md-result-item"><div class="rv">${Math.round(waterAdj)}</div><div class="rl">Adjusted Water (L)</div></div>
        <div class="md-result-item"><div class="rv">${Math.round(faAdj)}</div><div class="rl">Adjusted FA (kg)</div></div>
        <div class="md-result-item"><div class="rv">${Math.round(caAdj)}</div><div class="rl">Adjusted CA (kg)</div></div>
        <div class="md-result-item"><div class="rv">${wcActual}</div><div class="rl">Actual w/c Ratio</div></div>
      </div>
    </div>`;
  }

  outEl.innerHTML = `
    <div class="md-result-card">
      <div class="md-result-title">
        📊 Mix Design Result — ${gradeVal === 'custom' ? 'M' + fck + ' (Custom)' : gradeVal} | ${method} Method
      </div>
      <div style="font-size:11px; color:#6b7280; margin-bottom:10px;">
        Cement: ${coCertNote} | Type: ${cementType} | Grade: ${cementGrade} MPa | Bag: ${bagWt} kg
        ${admixUsed ? ' | Admixture: ' + admixProd + ' (' + admixWR + '% WR)' : ''}
      </div>

      <div style="font-weight:700; font-size:13px; color:#374151; margin-bottom:6px;">Step-by-Step Design</div>
      <div style="font-size:12px; color:#374151; background:#fff; border:1px solid #dbeafe; border-radius:8px; padding:10px; margin-bottom:10px; line-height:1.8;">
        <b>1. Target Strength:</b> f'ck = fck + 1.65σ = ${fck} + 1.65×${sd.toFixed(1)} = <b>${fckTarget.toFixed(1)} MPa</b><br>
        <b>2. w/c from strength:</b> ${wcStrength.toFixed(2)} (IS table) | w/c from durability: ${wcDurability} → <b>Use: ${wcFinal}</b><br>
        <b>3. Water content:</b> Base for ${aggSize}mm ${aggType} agg, ${slump}mm slump ${admixUsed ? '→ reduced by ' + admixWR + '% (admixture)' : ''} = <b>${waterContent} L/m³</b><br>
        <b>4. Cement:</b> Water ÷ w/c = ${waterContent}/${wcFinal} = ${Math.round(waterContent/wcFinal)} → Min durability: ${minCem} → <b>${cementContent} kg/m³</b><br>
        <b>5. Total agg vol:</b> 1 − ${volCement.toFixed(3)} − ${volWater.toFixed(3)} − ${airVoid} = <b>${volAgg.toFixed(3)} m³</b><br>
        <b>6. CA:FA split:</b> ${method === 'FM' ? 'FM method' : method === 'ACI' ? 'ACI Table 6.3.6' : 'IS 10262 Table 3 (Zone ' + sandZone + ')'} → CA = ${volCA.toFixed(3)} m³, FA = ${volFA.toFixed(3)} m³
      </div>

      <div class="md-ratio-badge">Mix Ratio — ${ratioStr}</div>

      <div class="md-result-grid">
        <div class="md-result-item"><div class="rv">${cementContent}</div><div class="rl">Cement (kg/m³)</div></div>
        <div class="md-result-item"><div class="rv">${waterContent}</div><div class="rl">Water (litres/m³)</div></div>
        <div class="md-result-item"><div class="rv">${massFA}</div><div class="rl">Fine Aggregate (kg/m³)</div></div>
        <div class="md-result-item"><div class="rv">${massCA}</div><div class="rl">Coarse Aggregate (kg/m³)</div></div>
        <div class="md-result-item"><div class="rv">${wcFinal}</div><div class="rl">w/c Ratio</div></div>
        <div class="md-result-item"><div class="rv">${bagsPerM3}</div><div class="rl">Cement Bags (${bagWt}kg each)</div></div>
        ${admixUsed ? `<div class="md-result-item"><div class="rv">${admixMass.toFixed(2)}</div><div class="rl">Admixture (kg/m³)</div></div>` : ''}
        <div class="md-result-item"><div class="rv">${fckTarget.toFixed(1)}</div><div class="rl">Target f'ck (MPa)</div></div>
      </div>

      ${correctionHTML}
      ${costHTML}
      ${warningsHTML}

      <div style="margin-top:14px; display:flex; gap:10px;">
        <button class="btn" style="flex:2;" onclick="mdAddToEstimate(${cementContent},${massFA},${massCA},${bagWt},'${gradeVal === 'custom' ? 'M' + fck : gradeVal}')">➕ Add to Estimate</button>
        <button class="btn btn-orange" style="flex:1;" onclick="mdPrintResult()">🖨 Print</button>
      </div>
      <div class="tiny" style="margin-top:8px; color:#6b7280;">
        Results based on IS 10262 : 2019 theoretical approach. Always verify with trial mixes in laboratory before production.
      </div>
    </div>
  `;

  // Store last result for print
  window._mdLastResult = {
    method, grade: gradeVal === 'custom' ? 'M' + fck : gradeVal, fck, fckTarget,
    cementContent, waterContent, massFA, massCA, wcFinal, bagsPerM3,
    admixUsed, admixMass, admixProd, volFA, volCA, ratioStr,
    coCertNote, cementType, cementGrade, bagWt, exposure, slump, aggSize, aggType, sandZone
  };
}

function showMDWarning(msg) {
  const outEl = document.getElementById('md_output');
  outEl.style.display = 'block';
  outEl.innerHTML = `<div class="md-warning" style="font-size:13px;">${msg}</div>`;
}

/* ============================================================
   ADD MIX DESIGN TO ESTIMATE
============================================================ */
function mdAddToEstimate(cementKg, faKg, caKg, bagWt, grade) {
  const sandRate = parseFloat(document.getElementById('rate_sand').value) || 0;
  const aggRate  = parseFloat(document.getElementById('rate_agg').value)  || 0;
  const cemRate  = parseFloat(document.getElementById('rate_cement').value) || 0;

  // Convert kg to m³ using approximate densities
  const faM3 = faKg / 1650;
  const caM3 = caKg / 1650;
  const bags  = Math.ceil(cementKg / bagWt);

  const item = {
    label:      'Mix Design ' + grade + ' (1 m³)',
    vol:        1,
    grade:      grade,
    cementBags: bags,
    sand_m3:    parseFloat(faM3.toFixed(3)),
    agg_m3:     parseFloat(caM3.toFixed(3)),
    cement_kg:  cementKg,
    steel_kg:   0,
    cost:       bags * cemRate + faM3 * sandRate + caM3 * aggRate
  };

  estimateItems.push(item);
  saveEstimate();
  refreshEstimateTable();
  alert('Mix Design added to Estimate Summary!');
}

/* ============================================================
   PRINT MIX DESIGN RESULT
============================================================ */
function mdPrintResult() {
  const r = window._mdLastResult;
  if (!r) { alert('Run calculation first.'); return; }
  let html = `<html><head><title>CivilCalc Mix Design</title></head><body>
    <h2 style="color:#0b7dda;">CivilCalc — Concrete Mix Design Report</h2>
    <p>Date: ${new Date().toLocaleDateString('en-IN')} | Method: ${r.method} | Grade: ${r.grade}</p>
    <table border="1" style="border-collapse:collapse;width:100%;font-size:13px;">
      <tr style="background:#0b7dda;color:white;"><th>Parameter</th><th>Value</th></tr>
      <tr><td>Grade</td><td>${r.grade}</td></tr>
      <tr><td>Method</td><td>${r.method}</td></tr>
      <tr><td>Cement</td><td>${r.coCertNote} / ${r.cementType} ${r.cementGrade}MPa</td></tr>
      <tr><td>Exposure</td><td>${r.exposure}</td></tr>
      <tr><td>Slump</td><td>${r.slump} mm</td></tr>
      <tr><td>Max Agg Size</td><td>${r.aggSize} mm (${r.aggType})</td></tr>
      <tr><td>Target f'ck</td><td>${r.fckTarget.toFixed(1)} MPa</td></tr>
      <tr><td>w/c Ratio</td><td>${r.wcFinal}</td></tr>
      <tr><td>Cement</td><td>${r.cementContent} kg/m³ (${r.bagsPerM3} bags × ${r.bagWt}kg)</td></tr>
      <tr><td>Water</td><td>${r.waterContent} litres/m³</td></tr>
      <tr><td>Fine Aggregate</td><td>${r.massFA} kg/m³ (${r.volFA.toFixed(3)} m³)</td></tr>
      <tr><td>Coarse Aggregate</td><td>${r.massCA} kg/m³ (${r.volCA.toFixed(3)} m³)</td></tr>
      <tr><td>Mix Ratio (C:FA:CA)</td><td>${r.ratioStr}</td></tr>
      ${r.admixUsed ? `<tr><td>Admixture</td><td>${r.admixProd} — ${r.admixMass.toFixed(2)} kg/m³</td></tr>` : ''}
    </table>
    <p><em>Results are theoretical. Always verify with trial mixes. IS 10262 : 2019.</em></p>
    </body></html>`;
  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  w.print();
}