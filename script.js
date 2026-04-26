/* ============================================================
   script.js — CivilCalci Advanced Estimator
   Shared script for all pages — with localStorage persistence
============================================================ */

/* ============================================================
   GLOBAL STATE
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
  length:   { m:1, ft:0.3048, cm:0.01, mm:0.001, inch:0.0254, km:1000, mile:1609.34 },
  area:     { 'm²':1,'ft²':0.0929,'cm²':0.0001,'mm²':0.000001,'acre':4046.86 },
  volume:   { 'm³':1,'ft³':0.0283168,'litre':0.001,'ml':0.000001,'gallon':0.003785 },
  weight:   { kg:1, g:0.001, lb:0.453592, tonne:1000, oz:0.0283495 },
  pressure: { 'N/m²':1, kPa:1000, MPa:1000000,'kN/m²':1000,'kg/cm²':98066.5,'psi':6894.76 }
};

/* ============================================================
   LOCALSTORAGE HELPERS
============================================================ */
const LS_ITEMS = 'civilcalc_estimate_items';
const LS_RATES = 'civilcalc_rates';
const LS_BBS   = 'civilcalc_bbs_lines';

function saveEstimate() {
  try { localStorage.setItem(LS_ITEMS, JSON.stringify(estimateItems)); } catch(e){}
}
function saveRates() {
  const rates = {
    cement: document.getElementById('rate_cement')?.value||'',
    sand:   document.getElementById('rate_sand')?.value||'',
    agg:    document.getElementById('rate_agg')?.value||'',
    steel:  document.getElementById('rate_steel')?.value||''
  };
  try { localStorage.setItem(LS_RATES, JSON.stringify(rates)); } catch(e){}
}
function saveBBS() {
  try { localStorage.setItem(LS_BBS, JSON.stringify(bbsLines)); } catch(e){}
}
function loadEstimate() {
  try { const r=localStorage.getItem(LS_ITEMS); if(r) estimateItems=JSON.parse(r); } catch(e){ estimateItems=[]; }
}
function loadRates() {
  try {
    const r=localStorage.getItem(LS_RATES); if(!r) return;
    const rates=JSON.parse(r);
    const set=(id,val)=>{ const el=document.getElementById(id); if(el&&val!=='') el.value=val; };
    set('rate_cement',rates.cement); set('rate_sand',rates.sand);
    set('rate_agg',rates.agg);       set('rate_steel',rates.steel);
    set('rate_cement2',rates.cement);set('rate_sand2',rates.sand);
    set('rate_agg2',rates.agg);      set('rate_steel2',rates.steel);
  } catch(e){}
}
function loadBBS() {
  try { const r=localStorage.getItem(LS_BBS); if(r) bbsLines=JSON.parse(r); } catch(e){ bbsLines=[]; }
}

/* ============================================================
   HELPERS
============================================================ */
function safeNum(v){ const n=parseFloat(v); return isNaN(n)?0:n; }
function formatRs(x){ return '₹\u00a0'+Number(x).toLocaleString('en-IN',{maximumFractionDigits:2}); }

function materialsForGrade(grade, volume) {
  // support custom grade like "M60"
  let def = MIX_DEFS[grade];
  if (!def) {
    const fck = parseFloat((grade||'').replace('M',''));
    if (!isNaN(fck)) {
      const bags = Math.round(fck/4);
      def = { bagsPerM3: bags, ratio:'Design', wc: Math.max(0.30, 0.70 - fck*0.006) };
    } else {
      def = MIX_DEFS['M20'];
    }
  }
  return {
    volume,
    cementBags: def.bagsPerM3 * volume,
    sand_m3:    0.42 * volume,
    agg_m3:     0.84 * volume,
    cement_kg:  def.bagsPerM3 * volume * 50
  };
}

function getProjectInfo() {
  try {
    const raw = localStorage.getItem('civilcalc_project');
    return raw ? JSON.parse(raw) : {};
  } catch(e){ return {}; }
}

/* ============================================================
   DOM READY
============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  loadEstimate();
  loadBBS();
  loadRates();

  // Active nav
  const currentFile = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
    const href = btn.getAttribute('href')||'';
    const linkFile = href.split('/').pop();
    if (linkFile===currentFile ||
       (currentFile===''&&linkFile==='index.html')||
       (currentFile==='index.html'&&linkFile==='index.html')) {
      btn.classList.add('active');
    }
  });

  refreshEstimateTable();

  if (document.getElementById('bbs_table')) updateBBSTable();
  if (document.getElementById('conv_type')) populateUnits();
  if (document.getElementById('bar_diameter_select')) chooseDia();

  ['rate_cement','rate_sand','rate_agg','rate_steel',
   'rate_cement2','rate_sand2','rate_agg2','rate_steel2'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.addEventListener('input',saveRates);
  });
});

/* ============================================================
   ELEMENT CALCULATOR (base — overridden by index.html)
============================================================ */
function calcElement(type) {
  let vol=0, grade='M20', label='', outEl;
  if(type==='slab'){
    const L=safeNum(document.getElementById('slab_len').value);
    const W=safeNum(document.getElementById('slab_wid').value);
    const T=safeNum(document.getElementById('slab_thk').value);
    vol=L*W*T; grade=document.getElementById('slab_grade').value;
    label='Slab '+L+'×'+W+'×'+T+'m'; outEl=document.getElementById('slab_out');
  } else if(type==='beam'){
    const L=safeNum(document.getElementById('beam_len').value);
    const B=safeNum(document.getElementById('beam_b').value);
    const H=safeNum(document.getElementById('beam_h').value);
    vol=L*B*H; grade=document.getElementById('beam_grade').value;
    label='Beam '+L+'×'+B+'×'+H+'m'; outEl=document.getElementById('beam_out');
  } else if(type==='column'){
    const L=safeNum(document.getElementById('col_len').value);
    const B=safeNum(document.getElementById('col_w').value);
    const H=safeNum(document.getElementById('col_h').value);
    vol=L*B*H; grade=document.getElementById('col_grade').value;
    label='Column '+L+'×'+B+'×'+H+'m'; outEl=document.getElementById('col_out');
  } else if(type==='footing'){
    const L=safeNum(document.getElementById('foot_len').value);
    const W=safeNum(document.getElementById('foot_w').value);
    const D=safeNum(document.getElementById('foot_d').value);
    vol=L*W*D; grade=document.getElementById('foot_grade').value;
    label='Footing '+L+'×'+W+'×'+D+'m'; outEl=document.getElementById('foot_out');
  }
  if(!outEl) return;
  if(vol<=0){ outEl.style.display='block'; outEl.innerHTML='<span style="color:#dc2626;">⚠ Enter valid positive dimensions.</span>'; return; }
  const mat=materialsForGrade(grade,vol);
  const item={label,vol:mat.volume,grade,cementBags:mat.cementBags,sand_m3:mat.sand_m3,agg_m3:mat.agg_m3,cement_kg:mat.cement_kg,steel_kg:0,cost:0,notes:''};
  const encoded=encodeURIComponent(JSON.stringify(item));
  outEl.style.display='block';
  outEl.innerHTML=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px;">
    <div><strong>Volume:</strong> ${item.vol.toFixed(3)} m³</div>
    <div><strong>Grade:</strong> ${grade}</div>
    <div><strong>Cement:</strong> ${item.cementBags.toFixed(2)} bags</div>
    <div><strong>Sand:</strong> ${item.sand_m3.toFixed(3)} m³</div>
    <div><strong>Aggregate:</strong> ${item.agg_m3.toFixed(3)} m³</div>
  </div>
  <button class="btn" onclick="addItemToEstimate(decodeURIComponent('${encoded}'))">+ Add to Estimate</button>`;
}

/* ============================================================
   ESTIMATE TABLE
============================================================ */
function addItemToEstimate(itemStrOrObj) {
  let item;
  try { item=(typeof itemStrOrObj==='string')?JSON.parse(itemStrOrObj):itemStrOrObj; }
  catch(e){ alert('Error parsing item data.'); return; }

  const cementRate=safeNum(document.getElementById('rate_cement')?.value);
  const sandRate  =safeNum(document.getElementById('rate_sand')?.value);
  const aggRate   =safeNum(document.getElementById('rate_agg')?.value);
  const steelRate =safeNum(document.getElementById('rate_steel')?.value);

  item.cost=(item.cementBags||0)*cementRate+(item.sand_m3||0)*sandRate
           +(item.agg_m3||0)*aggRate+(item.steel_kg||0)*steelRate;

  estimateItems.push(item);
  saveEstimate();
  refreshEstimateTable();
  updateMaterialChart();
}

function refreshEstimateTable() {
  const tbody=document.getElementById('estimate_tbody');
  if(!tbody) return;
  tbody.innerHTML='';
  let total=0;

  if(estimateItems.length===0){
    const colspan = document.querySelector('#estimate_table thead tr th:last-child') ?
      document.querySelector('#estimate_table thead tr').children.length : 11;
    tbody.innerHTML=`<tr><td colspan="${colspan}" style="text-align:center;color:#999;padding:16px;font-style:italic;">No items yet. Calculate an element and click "Add to Estimate".</td></tr>`;
    const totEl=document.getElementById('estimate_total');
    if(totEl) totEl.innerText='₹ 0';
    return;
  }

  estimateItems.forEach(function(it,i){
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td>${i+1}</td>
      <td style="white-space:nowrap;max-width:120px;overflow:hidden;text-overflow:ellipsis;" title="${it.label}">${it.label}</td>
      <td>${it.vol        ? it.vol.toFixed(3)       :'-'}</td>
      <td>${it.cementBags ? it.cementBags.toFixed(2) :'-'}</td>
      <td>${it.sand_m3    ? it.sand_m3.toFixed(3)   :'-'}</td>
      <td>${it.agg_m3     ? it.agg_m3.toFixed(3)    :'-'}</td>
      <td>${it.steel_kg   ? it.steel_kg.toFixed(2)  :'-'}</td>
      <td>${it.grade      ||'-'}</td>
      <td style="white-space:nowrap;">${formatRs(it.cost||0)}</td>
      <td style="max-width:80px;font-size:10px;color:#666;">${it.notes||''}</td>
      <td><button class="rm-btn" onclick="removeItem(${i})">✕</button></td>
    `;
    tbody.appendChild(tr);
    total+=(it.cost||0);
  });

  const totEl=document.getElementById('estimate_total');
  if(totEl) totEl.innerText=formatRs(total);
  updateMaterialChart();
}

function removeItem(i) {
  estimateItems.splice(i,1);
  saveEstimate(); refreshEstimateTable(); updateMaterialChart();
}

function recomputeEstimate() {
  const cementRate=safeNum(document.getElementById('rate_cement')?.value);
  const sandRate  =safeNum(document.getElementById('rate_sand')?.value);
  const aggRate   =safeNum(document.getElementById('rate_agg')?.value);
  const steelRate =safeNum(document.getElementById('rate_steel')?.value);
  estimateItems.forEach(it=>{
    it.cost=(it.cementBags||0)*cementRate+(it.sand_m3||0)*sandRate
            +(it.agg_m3||0)*aggRate+(it.steel_kg||0)*steelRate;
  });
  saveEstimate(); saveRates(); refreshEstimateTable();
}

function syncRateInputs(field,val) {
  const map={cement:['rate_cement','rate_cement2'],sand:['rate_sand','rate_sand2'],
             agg:['rate_agg','rate_agg2'],steel:['rate_steel','rate_steel2']};
  if(map[field]) map[field].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=val; });
  saveRates();
}
function syncRatesAndRecompute() {
  ['cement','sand','agg','steel'].forEach(f=>{
    const src=document.getElementById('rate_'+f+'2');
    const dst=document.getElementById('rate_'+f);
    if(src&&dst&&src.value) dst.value=src.value;
  });
  recomputeEstimate();
}
function clearEstimate() {
  if(!confirm('Clear all estimate items? This cannot be undone.')) return;
  estimateItems=[]; saveEstimate(); refreshEstimateTable(); updateMaterialChart();
}

/* ============================================================
   STEEL / BBS CALCULATOR
============================================================ */
function chooseDia() {
  const sel=document.getElementById('bar_diameter_select');
  const inp=document.getElementById('bar_diameter');
  if(!sel||!inp) return;
  if(sel.value==='custom'){ inp.value=''; inp.removeAttribute('readonly'); inp.focus(); }
  else { inp.value=sel.value; inp.setAttribute('readonly',true); }
}
function addBBSLine() {
  const d    =safeNum(document.getElementById('bar_diameter').value);
  const L    =safeNum(document.getElementById('bar_length').value);
  const q    =safeNum(document.getElementById('bar_qty').value);
  const grade=document.getElementById('calc_steel_grade').value;
  if(!d||!L||!q){ alert('Please fill Diameter, Length, and Quantity.'); return; }
  const unitWt=(d*d)/162;
  const w=unitWt*L*q;
  bbsLines.push({grade,dia:d,length:L,qty:q,unitWt,weight:w});
  saveBBS(); updateBBSTable();
}
function updateBBSTable() {
  const tbody=document.querySelector('#bbs_table tbody');
  if(!tbody) return;
  tbody.innerHTML='';
  let total=0;
  bbsLines.forEach((l,i)=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${i+1}</td><td>${l.grade}</td><td>${l.dia}</td>
      <td>${l.length}</td><td>${l.qty}</td>
      <td>${l.unitWt.toFixed(4)}</td><td>${l.weight.toFixed(3)}</td>
      <td><button class="rm-btn" onclick="removeBBSLine(${i})">✕</button></td>`;
    tbody.appendChild(tr);
    total+=l.weight;
  });
  const totalEl=document.getElementById('bbs_total');
  if(totalEl) totalEl.innerText=total.toFixed(3);
  const wrap=document.getElementById('bbs_table_wrap');
  if(wrap) wrap.style.display=bbsLines.length?'block':'none';
}
function removeBBSLine(i){ bbsLines.splice(i,1); saveBBS(); updateBBSTable(); }
function addBBSToEstimate() {
  const steelRate=safeNum(document.getElementById('rate_steel')?.value);
  const totalKg=bbsLines.reduce((s,l)=>s+l.weight,0);
  if(totalKg<=0){ alert('No BBS lines found. Add bars first.'); return; }
  const item={label:'Steel / BBS ('+bbsLines.length+' lines)',vol:0,
    grade:bbsLines[0]?bbsLines[0].grade:'-',cementBags:0,sand_m3:0,
    agg_m3:0,steel_kg:totalKg,cost:totalKg*steelRate,notes:'BBS'};
  estimateItems.push(item); saveEstimate(); refreshEstimateTable(); updateMaterialChart();
}

/* ============================================================
   MIX DESIGN QUICK VIEW
============================================================ */
function calcMixQuick() {
  const grade=document.getElementById('mix_grade').value;
  const vol  =safeNum(document.getElementById('mix_vol').value);
  const outEl=document.getElementById('mix_out');
  if(vol<=0){ outEl.style.display='block'; outEl.innerHTML='<span style="color:#dc2626;">⚠ Enter a valid volume.</span>'; return; }
  const mat=materialsForGrade(grade,vol);
  const def=MIX_DEFS[grade]||MIX_DEFS['M20'];
  outEl.style.display='block';
  outEl.innerHTML=`<div style="font-weight:700;margin-bottom:10px;font-size:14px;">${grade} Mix — ${vol.toFixed(2)} m³</div>
    <div class="ratio-box">
      <div class="ratio-item"><div class="val">${mat.cementBags.toFixed(1)}</div><div class="lbl">Cement Bags<br>(50 kg each)</div></div>
      <div class="ratio-item"><div class="val">${mat.cement_kg.toFixed(0)}</div><div class="lbl">Cement (kg)</div></div>
      <div class="ratio-item"><div class="val">${mat.sand_m3.toFixed(3)}</div><div class="lbl">Sand (m³)</div></div>
      <div class="ratio-item"><div class="val">${mat.agg_m3.toFixed(3)}</div><div class="lbl">Aggregate (m³)</div></div>
    </div>
    <div class="small muted" style="margin-top:10px;">Ratio: ${def.ratio} | w/c: ${def.wc} | Approx — verify with IS 10262 lab design.</div>`;
}

/* ============================================================
   UNIT CONVERTER
============================================================ */
function populateUnits() {
  const typeEl=document.getElementById('conv_type');
  const fromSel=document.getElementById('conv_from');
  const toSel=document.getElementById('conv_to');
  if(!typeEl||!fromSel||!toSel) return;
  const type=typeEl.value;
  fromSel.innerHTML=''; toSel.innerHTML='';
  Object.keys(UNITS[type]).forEach(u=>{ fromSel.appendChild(new Option(u,u)); toSel.appendChild(new Option(u,u)); });
  if(toSel.options.length>1) toSel.selectedIndex=1;
}
function doConvert() {
  const type=document.getElementById('conv_type').value;
  const val =safeNum(document.getElementById('conv_value').value);
  const from=document.getElementById('conv_from').value;
  const to  =document.getElementById('conv_to').value;
  const outEl=document.getElementById('conv_out');
  if(!document.getElementById('conv_value').value){ outEl.style.display='block'; outEl.innerHTML='Enter a value to convert.'; return; }
  const base=val*UNITS[type][from];
  const res =base/UNITS[type][to];
  outEl.style.display='block';
  outEl.innerHTML=`${val} ${from} &nbsp;=&nbsp; <span style="color:var(--primary);font-size:20px;">${res.toFixed(6).replace(/\.?0+$/,'')}</span> ${to}`;
}

/* ============================================================
   MATERIAL CHART
============================================================ */
function updateMaterialChart() {
  const ctx=document.getElementById('materialChart');
  if(!ctx) return;
  let tCement=0,tSand=0,tAgg=0,tSteel=0;
  estimateItems.forEach(it=>{ tCement+=it.cementBags||0; tSand+=it.sand_m3||0; tAgg+=it.agg_m3||0; tSteel+=it.steel_kg||0; });
  if(materialChartInstance) materialChartInstance.destroy();
  materialChartInstance=new Chart(ctx,{
    type:'doughnut',
    data:{labels:['Cement (bags)','Sand (m³)','Aggregate (m³)','Steel (kg)'],
      datasets:[{data:[tCement,tSand,tAgg,tSteel],backgroundColor:['#0b7dda','#ff9800','#4caf50','#9c27b0']}]},
    options:{responsive:true,plugins:{legend:{position:'bottom',labels:{font:{size:11}}}}}
  });
}

/* ============================================================
   PRINT REPORT
============================================================ */
function printReport() {
  const proj=getProjectInfo();
  const total=estimateItems.reduce((s,x)=>s+(x.cost||0),0);
  let html='<html><head><title>CivilCalc Report</title><style>body{font-family:Arial,sans-serif;font-size:13px;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ccc;padding:6px;}th{background:#0b7dda;color:#fff;}</style></head><body>';
  html+='<h2 style="color:#0b7dda;">CivilCalc — Construction Estimate</h2>';
  if(proj.name) html+=`<p><strong>Project:</strong> ${proj.name}</p>`;
  if(proj.engineer) html+=`<p><strong>Engineer:</strong> ${proj.engineer}</p>`;
  if(proj.client) html+=`<p><strong>Client:</strong> ${proj.client}</p>`;
  html+=`<p>Date: ${new Date().toLocaleDateString('en-IN')}</p>`;
  html+='<table><thead><tr><th>#</th><th>Item</th><th>Vol (m³)</th><th>Cement (bags)</th><th>Sand (m³)</th><th>Aggregate (m³)</th><th>Steel (kg)</th><th>Grade</th><th>Cost (₹)</th><th>Notes</th></tr></thead><tbody>';
  estimateItems.forEach((it,i)=>{
    html+=`<tr><td>${i+1}</td><td>${it.label}</td><td>${(it.vol||0).toFixed(3)}</td>
      <td>${(it.cementBags||0).toFixed(2)}</td><td>${(it.sand_m3||0).toFixed(3)}</td>
      <td>${(it.agg_m3||0).toFixed(3)}</td><td>${(it.steel_kg||0).toFixed(2)}</td>
      <td>${it.grade||'-'}</td><td>₹${(it.cost||0).toFixed(2)}</td>
      <td>${it.notes||''}</td></tr>`;
  });
  html+='</tbody></table>';
  html+=`<h3>Total Project Cost: ₹ ${total.toFixed(2)}</h3>`;
  html+='</body></html>';
  const win=window.open('','_blank');
  win.document.write(html); win.document.close(); win.print();
}

/* ============================================================
   EXPORT PDF  (with project info)
============================================================ */
async function exportPDF() {
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF();
  const proj=getProjectInfo();
  let y=18;

  doc.setFillColor(11,125,218);
  doc.rect(0,0,210,28,'F');
  doc.setTextColor(255,255,255);
  doc.setFontSize(16); doc.setFont(undefined,'bold');
  doc.text('CivilCalc — Construction Estimate Report',14,18);

  y=36;
  doc.setTextColor(50,50,50); doc.setFontSize(10); doc.setFont(undefined,'normal');
  if(proj.name)     { doc.text('Project: '+proj.name,14,y); y+=5; }
  if(proj.engineer) { doc.text('Engineer: '+proj.engineer,14,y); y+=5; }
  if(proj.client)   { doc.text('Client: '+proj.client,14,y); y+=5; }
  doc.text('Date: '+new Date().toLocaleDateString('en-IN'),14,y); y+=5;
  doc.text('Generated by: CivilCalc Advanced Estimator',14,y); y+=10;

  const body=[];
  let tCost=0,tCem=0,tSand=0,tAgg=0,tSteel=0;
  estimateItems.forEach((it,i)=>{
    body.push([i+1,it.label,(it.vol||0).toFixed(3),(it.cementBags||0).toFixed(2),
      (it.sand_m3||0).toFixed(3),(it.agg_m3||0).toFixed(3),(it.steel_kg||0).toFixed(2),
      it.grade||'-','₹'+(it.cost||0).toFixed(2),(it.notes||'')]);
    tCost+=(it.cost||0); tCem+=(it.cementBags||0); tSand+=(it.sand_m3||0);
    tAgg+=(it.agg_m3||0); tSteel+=(it.steel_kg||0);
  });

  doc.autoTable({
    startY:y,
    head:[['#','Item','Vol','Cement','Sand','Agg','Steel','Grade','Cost','Notes']],
    body,
    theme:'grid',
    styles:{fontSize:7,cellPadding:2},
    headStyles:{fillColor:[11,125,218],textColor:255,fontStyle:'bold'},
    alternateRowStyles:{fillColor:[245,248,255]}
  });

  let finalY=doc.lastAutoTable.finalY+10;
  doc.setFontSize(12); doc.setFont(undefined,'bold'); doc.setTextColor(11,125,218);
  doc.text('Total Project Cost: \u20b9 '+tCost.toFixed(2),14,finalY); finalY+=10;
  doc.setFontSize(10); doc.setFont(undefined,'bold'); doc.setTextColor(50,50,50);
  doc.text('Material Summary:',14,finalY); finalY+=6;
  doc.setFont(undefined,'normal');
  doc.text('Cement: '+tCem.toFixed(2)+' bags | Sand: '+tSand.toFixed(3)+
    ' m³ | Agg: '+tAgg.toFixed(3)+' m³ | Steel: '+tSteel.toFixed(2)+' kg',14,finalY);
  finalY+=8;
  doc.setFontSize(8); doc.setTextColor(120,120,120);
  doc.text('IS 456 | IS 10262 | IS 383 | IS 875 | IS 1893  —  CivilCalc Estimator',14,finalY);
  doc.save('CivilCalc_Estimate_Report.pdf');
}