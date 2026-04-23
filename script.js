/* ============================================================
   script.js — CivilCalci Advanced Estimator
   Shared script for all pages — with localStorage persistence
============================================================ */

/* ============================================================
   GLOBAL STATE — loaded from localStorage on every page
============================================================ */
let estimateItems = [];
let bbsLines      = [];
let materialChartInstance = null;

/* ============================================================
   MIX DEFINITIONS
============================================================ */
const MIX_DEFS = {
  M10: { bagsPerM3: 6,  ratio: '1:3:6',   wc: 0.60 },
  M15: { bagsPerM3: 7,  ratio: '1:2:4',   wc: 0.55 },
  M20: { bagsPerM3: 8,  ratio: '1:1.5:3', wc: 0.50 },
  M25: { bagsPerM3: 9,  ratio: '1:1:2',   wc: 0.45 },
  M30: { bagsPerM3: 10, ratio: 'Design',  wc: 0.42 },
  M35: { bagsPerM3: 11, ratio: 'Design',  wc: 0.40 },
  M40: { bagsPerM3: 12, ratio: 'Design',  wc: 0.38 },
  M45: { bagsPerM3: 13, ratio: 'Design',  wc: 0.36 },
  M50: { bagsPerM3: 14, ratio: 'Design',  wc: 0.35 },
  M55: { bagsPerM3: 15, ratio: 'Design',  wc: 0.34 }
};

/* ============================================================
   UNIT CONVERTER DEFINITIONS
============================================================ */
const UNITS = {
  length:   { m: 1, ft: 0.3048, cm: 0.01, mm: 0.001, inch: 0.0254, km: 1000, mile: 1609.34 },
  area:     { 'm²': 1, 'ft²': 0.0929, 'cm²': 0.0001, 'mm²': 0.000001, 'acre': 4046.86 },
  volume:   { 'm³': 1, 'ft³': 0.0283168, 'litre': 0.001, 'ml': 0.000001, 'gallon': 0.003785 },
  weight:   { kg: 1, g: 0.001, lb: 0.453592, tonne: 1000, oz: 0.0283495 },
  pressure: { 'N/m²': 1, kPa: 1000, MPa: 1000000, 'kN/m²': 1000, 'kg/cm²': 98066.5, 'psi': 6894.76 }
};

/* ============================================================
   LOCALSTORAGE HELPERS
============================================================ */
const LS_ITEMS  = 'civilcalc_estimate_items';
const LS_RATES  = 'civilcalc_rates';
const LS_BBS    = 'civilcalc_bbs_lines';

function saveEstimate() {
  try {
    localStorage.setItem(LS_ITEMS, JSON.stringify(estimateItems));
  } catch (e) { /* quota exceeded — ignore */ }
}

function saveRates() {
  const rates = {
    cement: document.getElementById('rate_cement') ? document.getElementById('rate_cement').value : '',
    sand:   document.getElementById('rate_sand')   ? document.getElementById('rate_sand').value   : '',
    agg:    document.getElementById('rate_agg')    ? document.getElementById('rate_agg').value    : '',
    steel:  document.getElementById('rate_steel')  ? document.getElementById('rate_steel').value  : ''
  };
  try { localStorage.setItem(LS_RATES, JSON.stringify(rates)); } catch (e) {}
}

function saveBBS() {
  try { localStorage.setItem(LS_BBS, JSON.stringify(bbsLines)); } catch (e) {}
}

function loadEstimate() {
  try {
    const raw = localStorage.getItem(LS_ITEMS);
    if (raw) estimateItems = JSON.parse(raw);
  } catch (e) { estimateItems = []; }
}

function loadRates() {
  try {
    const raw = localStorage.getItem(LS_RATES);
    if (!raw) return;
    const rates = JSON.parse(raw);
    const set = (id, val) => { const el = document.getElementById(id); if (el && val !== '') el.value = val; };
    set('rate_cement',  rates.cement);
    set('rate_sand',    rates.sand);
    set('rate_agg',     rates.agg);
    set('rate_steel',   rates.steel);
    /* Also sync into Cost-tab duplicate inputs if present */
    set('rate_cement2', rates.cement);
    set('rate_sand2',   rates.sand);
    set('rate_agg2',    rates.agg);
    set('rate_steel2',  rates.steel);
  } catch (e) {}
}

function loadBBS() {
  try {
    const raw = localStorage.getItem(LS_BBS);
    if (raw) bbsLines = JSON.parse(raw);
  } catch (e) { bbsLines = []; }
}

/* ============================================================
   HELPERS
============================================================ */
function safeNum(v) {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

function formatRs(x) {
  return '₹\u00a0' + Number(x).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function materialsForGrade(grade, volume) {
  const def = MIX_DEFS[grade] || MIX_DEFS['M20'];
  return {
    volume,
    cementBags: def.bagsPerM3 * volume,
    sand_m3:    0.42 * volume,
    agg_m3:     0.84 * volume,
    cement_kg:  def.bagsPerM3 * volume * 50
  };
}

/* ============================================================
   DOM READY — runs on every page load
============================================================ */
document.addEventListener('DOMContentLoaded', function () {

  /* 1. Restore persisted data */
  loadEstimate();
  loadBBS();

  /* 2. Restore rates into inputs */
  loadRates();

  /* 3. Highlight the active nav link based on current filename */
  const currentFile = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.classList.remove('active');
    const href = btn.getAttribute('href') || '';
    const linkFile = href.split('/').pop();
    if (linkFile === currentFile ||
        (currentFile === '' && linkFile === 'index.html') ||
        (currentFile === 'index.html' && linkFile === 'index.html')) {
      btn.classList.add('active');
    }
  });

  /* 4. Render restored estimate table */
  refreshEstimateTable();

  /* 5. Render restored BBS table (steel page only) */
  if (document.getElementById('bbs_table')) {
    updateBBSTable();
  }

  /* 6. Init unit converter dropdowns if present */
  if (document.getElementById('conv_type')) populateUnits();

  /* 7. Init bar diameter input if present */
  if (document.getElementById('bar_diameter_select')) chooseDia();

  /* 8. Save rates whenever any rate input changes */
  ['rate_cement','rate_sand','rate_agg','rate_steel',
   'rate_cement2','rate_sand2','rate_agg2','rate_steel2'].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', saveRates);
  });
});

/* ============================================================
   ELEMENT CALCULATOR
============================================================ */
function calcElement(type) {
  let vol = 0, grade = 'M20', label = '', outEl;

  if (type === 'slab') {
    const L = safeNum(document.getElementById('slab_len').value);
    const W = safeNum(document.getElementById('slab_wid').value);
    const T = safeNum(document.getElementById('slab_thk').value);
    vol   = L * W * T;
    grade = document.getElementById('slab_grade').value;
    label = 'Slab ' + L + '×' + W + '×' + T + ' m';
    outEl = document.getElementById('slab_out');

  } else if (type === 'beam') {
    const L = safeNum(document.getElementById('beam_len').value);
    const B = safeNum(document.getElementById('beam_b').value);
    const H = safeNum(document.getElementById('beam_h').value);
    vol   = L * B * H;
    grade = document.getElementById('beam_grade').value;
    label = 'Beam ' + L + '×' + B + '×' + H + ' m';
    outEl = document.getElementById('beam_out');

  } else if (type === 'column') {
    const L = safeNum(document.getElementById('col_len').value);
    const B = safeNum(document.getElementById('col_w').value);
    const H = safeNum(document.getElementById('col_h').value);
    vol   = L * B * H;
    grade = document.getElementById('col_grade').value;
    label = 'Column ' + L + '×' + B + '×' + H + ' m';
    outEl = document.getElementById('col_out');

  } else if (type === 'footing') {
    const L = safeNum(document.getElementById('foot_len').value);
    const W = safeNum(document.getElementById('foot_w').value);
    const D = safeNum(document.getElementById('foot_d').value);
    vol   = L * W * D;
    grade = document.getElementById('foot_grade').value;
    label = 'Footing ' + L + '×' + W + '×' + D + ' m';
    outEl = document.getElementById('foot_out');
  }

  if (!outEl) return;

  if (vol <= 0) {
    outEl.style.display = 'block';
    outEl.innerHTML = '<span style="color:#dc2626;">⚠ Enter valid positive dimensions.</span>';
    return;
  }

  const mat  = materialsForGrade(grade, vol);
  const item = {
    label,
    vol:        mat.volume,
    grade,
    cementBags: mat.cementBags,
    sand_m3:    mat.sand_m3,
    agg_m3:     mat.agg_m3,
    cement_kg:  mat.cement_kg,
    steel_kg:   0,
    cost:       0
  };

  const encoded = encodeURIComponent(JSON.stringify(item));

  outEl.style.display = 'block';
  outEl.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px;">
      <div><strong>Volume:</strong> ${item.vol.toFixed(3)} m³</div>
      <div><strong>Grade:</strong> ${grade}</div>
      <div><strong>Cement:</strong> ${item.cementBags.toFixed(2)} bags</div>
      <div><strong>Sand:</strong> ${item.sand_m3.toFixed(3)} m³</div>
      <div><strong>Aggregate:</strong> ${item.agg_m3.toFixed(3)} m³</div>
    </div>
    <button class="btn" onclick="addItemToEstimate(decodeURIComponent('${encoded}'))">+ Add to Estimate</button>
  `;
}

/* ============================================================
   ESTIMATE TABLE
============================================================ */
function addItemToEstimate(itemStrOrObj) {
  let item;
  try {
    item = (typeof itemStrOrObj === 'string') ? JSON.parse(itemStrOrObj) : itemStrOrObj;
  } catch (e) {
    alert('Error parsing item data.');
    return;
  }

  const cementRate = safeNum(document.getElementById('rate_cement').value);
  const sandRate   = safeNum(document.getElementById('rate_sand').value);
  const aggRate    = safeNum(document.getElementById('rate_agg').value);
  const steelRate  = safeNum(document.getElementById('rate_steel').value);

  item.cost = (item.cementBags || 0) * cementRate
            + (item.sand_m3   || 0) * sandRate
            + (item.agg_m3    || 0) * aggRate
            + (item.steel_kg  || 0) * steelRate;

  estimateItems.push(item);
  saveEstimate();
  refreshEstimateTable();
  updateMaterialChart();
}

function refreshEstimateTable() {
  const tbody = document.getElementById('estimate_tbody');
  if (!tbody) return;

  tbody.innerHTML = '';
  let total = 0;

  if (estimateItems.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:#999;padding:16px;font-style:italic;">No items yet. Calculate an element and click "Add to Estimate".</td></tr>';
    const totEl = document.getElementById('estimate_total');
    if (totEl) totEl.innerText = '₹ 0';
    return;
  }

  estimateItems.forEach(function (it, i) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td style="white-space:nowrap;">${it.label}</td>
      <td>${it.vol       ? it.vol.toFixed(3)       : '-'}</td>
      <td>${it.cementBags ? it.cementBags.toFixed(2) : '-'}</td>
      <td>${it.sand_m3   ? it.sand_m3.toFixed(3)   : '-'}</td>
      <td>${it.agg_m3    ? it.agg_m3.toFixed(3)    : '-'}</td>
      <td>${it.steel_kg  ? it.steel_kg.toFixed(2)  : '-'}</td>
      <td>${it.grade     || '-'}</td>
      <td style="white-space:nowrap;">${formatRs(it.cost || 0)}</td>
      <td><button class="rm-btn" onclick="removeItem(${i})">✕</button></td>
    `;
    tbody.appendChild(tr);
    total += (it.cost || 0);
  });

  const totEl = document.getElementById('estimate_total');
  if (totEl) totEl.innerText = formatRs(total);

  /* Update chart if on cost page */
  updateMaterialChart();
}

function removeItem(i) {
  estimateItems.splice(i, 1);
  saveEstimate();
  refreshEstimateTable();
  updateMaterialChart();
}

function recomputeEstimate() {
  const cementRate = safeNum(document.getElementById('rate_cement').value);
  const sandRate   = safeNum(document.getElementById('rate_sand').value);
  const aggRate    = safeNum(document.getElementById('rate_agg').value);
  const steelRate  = safeNum(document.getElementById('rate_steel').value);

  estimateItems.forEach(function (it) {
    it.cost = (it.cementBags || 0) * cementRate
            + (it.sand_m3   || 0) * sandRate
            + (it.agg_m3    || 0) * aggRate
            + (it.steel_kg  || 0) * steelRate;
  });

  saveEstimate();
  saveRates();
  refreshEstimateTable();
}

/* Sync rate inputs between right panel (rate_X) and Cost tab (rate_X2) */
function syncRateInputs(field, val) {
  const map = {
    cement: ['rate_cement', 'rate_cement2'],
    sand:   ['rate_sand',   'rate_sand2'],
    agg:    ['rate_agg',    'rate_agg2'],
    steel:  ['rate_steel',  'rate_steel2']
  };
  if (map[field]) {
    map[field].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.value = val;
    });
  }
  saveRates();
}

function syncRatesAndRecompute() {
  ['cement', 'sand', 'agg', 'steel'].forEach(function (f) {
    const src = document.getElementById('rate_' + f + '2');
    const dst = document.getElementById('rate_' + f);
    if (src && dst && src.value) dst.value = src.value;
  });
  recomputeEstimate();
}

/* ============================================================
   CLEAR ESTIMATE (optional utility)
============================================================ */
function clearEstimate() {
  if (!confirm('Clear all estimate items? This cannot be undone.')) return;
  estimateItems = [];
  saveEstimate();
  refreshEstimateTable();
  updateMaterialChart();
}

/* ============================================================
   STEEL / BBS CALCULATOR
============================================================ */
function chooseDia() {
  const sel = document.getElementById('bar_diameter_select');
  const inp = document.getElementById('bar_diameter');
  if (!sel || !inp) return;
  if (sel.value === 'custom') {
    inp.value = '';
    inp.removeAttribute('readonly');
    inp.focus();
  } else {
    inp.value = sel.value;
    inp.setAttribute('readonly', true);
  }
}

function addBBSLine() {
  const d     = safeNum(document.getElementById('bar_diameter').value);
  const L     = safeNum(document.getElementById('bar_length').value);
  const q     = safeNum(document.getElementById('bar_qty').value);
  const grade = document.getElementById('calc_steel_grade').value;

  if (!d || !L || !q) {
    alert('Please fill Diameter, Length, and Quantity.');
    return;
  }

  const unitWt = (d * d) / 162;
  const w = unitWt * L * q;
  bbsLines.push({ grade, dia: d, length: L, qty: q, unitWt, weight: w });
  saveBBS();
  updateBBSTable();
}

function updateBBSTable() {
  const tbody = document.querySelector('#bbs_table tbody');
  if (!tbody) return;

  tbody.innerHTML = '';
  let total = 0;

  bbsLines.forEach(function (l, i) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${l.grade}</td>
      <td>${l.dia}</td>
      <td>${l.length}</td>
      <td>${l.qty}</td>
      <td>${l.unitWt.toFixed(4)}</td>
      <td>${l.weight.toFixed(3)}</td>
      <td><button class="rm-btn" onclick="removeBBSLine(${i})">✕</button></td>
    `;
    tbody.appendChild(tr);
    total += l.weight;
  });

  const totalEl = document.getElementById('bbs_total');
  if (totalEl) totalEl.innerText = total.toFixed(3);

  const wrap = document.getElementById('bbs_table_wrap');
  if (wrap) wrap.style.display = bbsLines.length ? 'block' : 'none';
}

function removeBBSLine(i) {
  bbsLines.splice(i, 1);
  saveBBS();
  updateBBSTable();
}

function addBBSToEstimate() {
  const steelRate = safeNum(document.getElementById('rate_steel').value);
  const totalKg   = bbsLines.reduce(function (s, l) { return s + l.weight; }, 0);

  if (totalKg <= 0) {
    alert('No BBS lines found. Add bars first.');
    return;
  }

  const item = {
    label:      'Steel / BBS (' + bbsLines.length + ' lines)',
    vol:        0,
    grade:      bbsLines[0] ? bbsLines[0].grade : '-',
    cementBags: 0,
    sand_m3:    0,
    agg_m3:     0,
    steel_kg:   totalKg,
    cost:       totalKg * steelRate
  };

  estimateItems.push(item);
  saveEstimate();
  refreshEstimateTable();
  updateMaterialChart();
}

/* ============================================================
   MIX DESIGN QUICK VIEW
============================================================ */
function calcMixQuick() {
  const grade = document.getElementById('mix_grade').value;
  const vol   = safeNum(document.getElementById('mix_vol').value);
  const outEl = document.getElementById('mix_out');

  if (vol <= 0) {
    outEl.style.display = 'block';
    outEl.innerHTML = '<span style="color:#dc2626;">⚠ Enter a valid volume.</span>';
    return;
  }

  const mat = materialsForGrade(grade, vol);
  const def = MIX_DEFS[grade] || MIX_DEFS['M20'];

  outEl.style.display = 'block';
  outEl.innerHTML = `
    <div style="font-weight:700;margin-bottom:10px;font-size:14px;">${grade} Mix — ${vol.toFixed(2)} m³</div>
    <div class="ratio-box">
      <div class="ratio-item"><div class="val">${mat.cementBags.toFixed(1)}</div><div class="lbl">Cement Bags<br>(50 kg each)</div></div>
      <div class="ratio-item"><div class="val">${mat.cement_kg.toFixed(0)}</div><div class="lbl">Cement (kg)</div></div>
      <div class="ratio-item"><div class="val">${mat.sand_m3.toFixed(3)}</div><div class="lbl">Sand (m³)</div></div>
      <div class="ratio-item"><div class="val">${mat.agg_m3.toFixed(3)}</div><div class="lbl">Aggregate (m³)</div></div>
    </div>
    <div class="small muted" style="margin-top:10px;">
      Ratio: ${def.ratio} &nbsp;|&nbsp; w/c: ${def.wc} &nbsp;|&nbsp; Approx values — verify with IS 10262 lab design.
    </div>
  `;
}

/* ============================================================
   UNIT CONVERTER
============================================================ */
function populateUnits() {
  const typeEl  = document.getElementById('conv_type');
  const fromSel = document.getElementById('conv_from');
  const toSel   = document.getElementById('conv_to');
  if (!typeEl || !fromSel || !toSel) return;

  const type = typeEl.value;
  fromSel.innerHTML = '';
  toSel.innerHTML   = '';

  Object.keys(UNITS[type]).forEach(function (u) {
    fromSel.appendChild(new Option(u, u));
    toSel.appendChild(new Option(u, u));
  });

  if (toSel.options.length > 1) toSel.selectedIndex = 1;
}

function doConvert() {
  const type  = document.getElementById('conv_type').value;
  const val   = safeNum(document.getElementById('conv_value').value);
  const from  = document.getElementById('conv_from').value;
  const to    = document.getElementById('conv_to').value;
  const outEl = document.getElementById('conv_out');

  if (!document.getElementById('conv_value').value) {
    outEl.style.display = 'block';
    outEl.innerHTML = 'Enter a value to convert.';
    return;
  }

  const base = val * UNITS[type][from];
  const res  = base / UNITS[type][to];

  outEl.style.display = 'block';
  outEl.innerHTML = `${val} ${from} &nbsp;=&nbsp; <span style="color:var(--primary);font-size:20px;">${res.toFixed(6).replace(/\.?0+$/, '')}</span> ${to}`;
}

/* ============================================================
   MATERIAL CHART (Chart.js doughnut)
============================================================ */
function updateMaterialChart() {
  const ctx = document.getElementById('materialChart');
  if (!ctx) return;

  let totalCement = 0, totalSand = 0, totalAgg = 0, totalSteel = 0;
  estimateItems.forEach(function (it) {
    totalCement += it.cementBags || 0;
    totalSand   += it.sand_m3   || 0;
    totalAgg    += it.agg_m3    || 0;
    totalSteel  += it.steel_kg  || 0;
  });

  if (materialChartInstance) materialChartInstance.destroy();

  materialChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Cement (bags)', 'Sand (m³)', 'Aggregate (m³)', 'Steel (kg)'],
      datasets: [{
        data: [totalCement, totalSand, totalAgg, totalSteel],
        backgroundColor: ['#0b7dda', '#ff9800', '#4caf50', '#9c27b0']
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } }
    }
  });
}

/* ============================================================
   PRINT REPORT
============================================================ */
function printReport() {
  const total = estimateItems.reduce(function (s, x) { return s + (x.cost || 0); }, 0);

  let html = '<html><head><title>CivilCalc Report</title></head><body>';
  html += '<h2 style="color:#0b7dda;">CivilCalc — Construction Estimate</h2>';
  html += '<p>Date: ' + new Date().toLocaleDateString('en-IN') + '</p>';
  html += '<table border="1" style="border-collapse:collapse;width:100%;font-size:13px;">';
  html += '<tr style="background:#0b7dda;color:white;">'
       + '<th>#</th><th>Item</th><th>Volume (m³)</th><th>Cement (bags)</th>'
       + '<th>Sand (m³)</th><th>Aggregate (m³)</th><th>Steel (kg)</th>'
       + '<th>Grade</th><th>Cost (₹)</th></tr>';

  estimateItems.forEach(function (it, i) {
    html += '<tr>'
          + '<td>' + (i + 1)                        + '</td>'
          + '<td>' + it.label                        + '</td>'
          + '<td>' + (it.vol        || 0).toFixed(3) + '</td>'
          + '<td>' + (it.cementBags || 0).toFixed(2) + '</td>'
          + '<td>' + (it.sand_m3   || 0).toFixed(3) + '</td>'
          + '<td>' + (it.agg_m3    || 0).toFixed(3) + '</td>'
          + '<td>' + (it.steel_kg  || 0).toFixed(2) + '</td>'
          + '<td>' + (it.grade     || '-')           + '</td>'
          + '<td>₹ ' + (it.cost   || 0).toFixed(2)  + '</td>'
          + '</tr>';
  });

  html += '</table>';
  html += '<h3>Total Project Cost: ₹ ' + total.toFixed(2) + '</h3>';
  html += '</body></html>';

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.print();
}

/* ============================================================
   EXPORT PDF
============================================================ */
async function exportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 18;

  doc.setFillColor(11, 125, 218);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('CivilCalc — Construction Estimate Report', 14, 18);

  y = 36;
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text('Date: ' + new Date().toLocaleDateString('en-IN'), 14, y); y += 5;
  doc.text('Generated by: CivilCalc Advanced Estimator', 14, y); y += 10;

  const body = [];
  let totalCost = 0, totalCem = 0, totalSand = 0, totalAgg = 0, totalSteel = 0;

  estimateItems.forEach(function (it, i) {
    body.push([
      i + 1,
      it.label,
      (it.vol        || 0).toFixed(3),
      (it.cementBags || 0).toFixed(2),
      (it.sand_m3    || 0).toFixed(3),
      (it.agg_m3     || 0).toFixed(3),
      (it.steel_kg   || 0).toFixed(2),
      it.grade || '-',
      '\u20b9 ' + (it.cost || 0).toFixed(2)
    ]);
    totalCost  += (it.cost        || 0);
    totalCem   += (it.cementBags  || 0);
    totalSand  += (it.sand_m3     || 0);
    totalAgg   += (it.agg_m3      || 0);
    totalSteel += (it.steel_kg    || 0);
  });

  doc.autoTable({
    startY: y,
    head: [['#', 'Item', 'Vol (m³)', 'Cement (bags)', 'Sand (m³)', 'Agg (m³)', 'Steel (kg)', 'Grade', 'Cost (₹)']],
    body: body,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [11, 125, 218], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 248, 255] }
  });

  let finalY = doc.lastAutoTable.finalY + 10;

  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(11, 125, 218);
  doc.text('Total Project Cost: \u20b9 ' + totalCost.toFixed(2), 14, finalY);
  finalY += 10;

  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(50, 50, 50);
  doc.text('Material Summary:', 14, finalY); finalY += 6;
  doc.setFont(undefined, 'normal');
  doc.text(
    'Cement: '    + totalCem.toFixed(2)   + ' bags  |  ' +
    'Sand: '      + totalSand.toFixed(3)  + ' m\u00b3  |  ' +
    'Aggregate: ' + totalAgg.toFixed(3)   + ' m\u00b3  |  ' +
    'Steel: '     + totalSteel.toFixed(2) + ' kg',
    14, finalY
  );
  finalY += 8;

  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('IS Codes: IS 456, IS 10262, IS 383, IS 875, IS 1893  |  CivilCalc Estimator', 14, finalY);

  doc.save('CivilCalc_Estimate_Report.pdf');
}