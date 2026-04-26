/* ============================================================
   visuals.js — CivilCalci Canvas Drawing Engine  v3
   Large, canvas-filling 3D isometric visuals
   Same quality as the load diagram visuals
============================================================ */

/* ─── Colour palette ─────────────────────────────────────── */
const VIS = {
  bg:       '#0d1117',
  grid:     'rgba(255,255,255,0.05)',
  face:     '#1e88e5',
  faceDark: '#1255a0',
  faceTop:  '#42a5f5',
  faceR:    '#1565c0',
  edge:     'rgba(144,202,249,0.8)',
  dimCol:   '#80cbc4',
  textCol:  '#e3f2fd',
  accent:   '#ff9800',
};

/* ─── Get canvas ─────────────────────────────────────────── */
function getCV(id) {
  const c = document.getElementById(id);
  if (!c) return null;
  // Make canvas fill its container width
  const wrap = c.parentElement;
  if (wrap) {
    const W = Math.max(wrap.clientWidth - 20, 200);
    c.width  = W;
    c.height = Math.round(W * 0.48);  // nice wide-ish ratio
  }
  return { c, ctx: c.getContext('2d'), W: c.width, H: c.height };
}

/* ─── Background + grid ──────────────────────────────────── */
function clearBG(ctx, W, H) {
  ctx.fillStyle = VIS.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = VIS.grid;
  ctx.lineWidth = 0.5;
  for (let x = 0; x < W; x += 28) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for (let y = 0; y < H; y += 28) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
}

/* ─── Isometric projection ───────────────────────────────── */
function iso(wx, wy, wz, ox, oy, sc) {
  return {
    x: ox + (wx - wy) * sc * 0.70,
    y: oy + (wx + wy) * sc * 0.32 - wz * sc * 0.82,
  };
}

/* ─── Draw one isometric box ─────────────────────────────── */
function isoBox(ctx, ox, oy, sc, rx, ry, rz, bx, by, bz, cols) {
  const p = (x, y, z) => iso(rx+x, ry+y, rz+z, ox, oy, sc);
  const v = [
    p(0,0,0), p(bx,0,0), p(bx,by,0), p(0,by,0),
    p(0,0,bz),p(bx,0,bz),p(bx,by,bz),p(0,by,bz),
  ];
  const face = (idx, fill) => {
    ctx.beginPath();
    idx.forEach((i,k) => k===0 ? ctx.moveTo(v[i].x,v[i].y) : ctx.lineTo(v[i].x,v[i].y));
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = VIS.edge; ctx.lineWidth = 1.0; ctx.stroke();
  };
  face([1,2,6,5], cols.right || VIS.faceR);
  face([0,1,5,4], cols.front || VIS.face);
  face([4,5,6,7], cols.top   || VIS.faceTop);
}

/* ─── Dimension label ────────────────────────────────────── */
function dimLabel(ctx, p1, p2, label, color) {
  ctx.save();
  ctx.strokeStyle = color || VIS.dimCol; ctx.lineWidth = 0.8;
  ctx.setLineDash([4,3]);
  ctx.beginPath(); ctx.moveTo(p1.x,p1.y); ctx.lineTo(p2.x,p2.y); ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = 'bold 10px monospace';
  ctx.fillStyle = color || VIS.dimCol;
  ctx.fillText(label, p2.x+3, p2.y+3);
  ctx.restore();
}

/* ─── Badge (title label top-left) ──────────────────────── */
function badge(ctx, text) {
  ctx.font = 'bold 11px monospace';
  ctx.fillStyle = VIS.accent;
  ctx.fillText(text, 10, 16);
}

/* ─── Rebar lines on a face ─────────────────────────────── */
function rebarLines(ctx, pts, n, color) {
  // pts = [p0,p1,p2,p3] forming a quad; draw n lines across it
  ctx.strokeStyle = color || 'rgba(255,152,0,0.45)';
  ctx.lineWidth = 0.8;
  for (let i = 1; i < n; i++) {
    const f = i / n;
    const a = lerp2(pts[0], pts[1], f);
    const b = lerp2(pts[3], pts[2], f);
    ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
  }
}

function lerp2(a, b, t) { return { x: a.x+(b.x-a.x)*t, y: a.y+(b.y-a.y)*t }; }

/* ─── Auto scale: fills ~80% of canvas for given world size ─ */
function autoScale(W, H, worldW, worldH, worldZ) {
  // World bounding box in iso coords
  // Width direction: (wx-wy)*sc*0.70  => span = (worldW+worldH)*sc*0.70
  // Height direction: (wx+wy)*sc*0.32 + wz*sc*0.82 => span = (worldW+worldH)*sc*0.32 + worldZ*sc*0.82
  const isoW = (worldW + worldH) * 0.70;
  const isoH = (worldW + worldH) * 0.32 + worldZ * 0.82;
  const scX = (W * 0.82) / isoW;
  const scY = (H * 0.78) / isoH;
  return Math.min(scX, scY, 500); // cap to avoid overflow
}

/* ═══════════════════════════════════════════════════════════
   SLAB
═══════════════════════════════════════════════════════════ */
function drawSlab(shape) {
  const cv = getCV('slab_canvas'); if (!cv) return;
  const { ctx, W, H } = cv;
  clearBG(ctx, W, H);

  const L    = parseFloat(document.getElementById('slab_len')?.value)  || 4;
  const Wd   = parseFloat(document.getElementById('slab_wid')?.value)  || 3;
  const T    = parseFloat(document.getElementById('slab_thk')?.value)  || 0.15;
  const rise = parseFloat(document.getElementById('slab_rise')?.value) || 1.5;

  const sc = autoScale(W, H, L, Wd, shape==='slope' ? rise : T*6);
  // origin: position so slab is centred & sits in lower-centre
  const ox = W * 0.52;
  const oy = H * 0.75;

  const col = { front:VIS.face, right:VIS.faceR, top:VIS.faceTop };

  if (shape === 'slope') {
    /* ── wedge / slope slab ── */
    const p = (x,y,z) => iso(x,y,z,ox,oy,sc);
    const faces = [
      // bottom face
      { idx:[p(0,0,0),p(L,0,0),p(L,Wd,0),p(0,Wd,0)], fill:'#0d47a1' },
      // back face
      { idx:[p(0,0,0),p(0,Wd,0),p(0,Wd,T),p(0,0,T)],  fill:VIS.faceR },
      // front sloped face
      { idx:[p(L,0,0),p(L,Wd,0),p(L,Wd,rise),p(L,0,rise)], fill:VIS.faceDark },
      // left side
      { idx:[p(0,0,0),p(L,0,0),p(L,0,rise),p(0,0,T)],  fill:VIS.face },
      // right side
      { idx:[p(0,Wd,0),p(L,Wd,0),p(L,Wd,rise),p(0,Wd,T)], fill:VIS.faceR },
      // top sloped surface
      { idx:[p(0,0,T),p(L,0,rise),p(L,Wd,rise),p(0,Wd,T)], fill:VIS.faceTop },
    ];
    faces.forEach(f => {
      ctx.beginPath();
      f.idx.forEach((pt,i) => i===0?ctx.moveTo(pt.x,pt.y):ctx.lineTo(pt.x,pt.y));
      ctx.closePath();
      ctx.fillStyle=f.fill; ctx.fill();
      ctx.strokeStyle=VIS.edge; ctx.lineWidth=1; ctx.stroke();
    });
    // reinforcement on top
    const top=[p(0,0,T),p(L,0,rise),p(L,Wd,rise),p(0,Wd,T)];
    rebarLines(ctx,top,4,'rgba(255,152,0,0.4)');

    const mid=p(L/2,0,rise/2);
    dimLabel(ctx,{x:mid.x,y:mid.y+14},{x:mid.x+55,y:mid.y+14},`L=${L}m`);
    const rp=p(L,Wd/2,rise/2);
    dimLabel(ctx,rp,{x:rp.x+42,y:rp.y},`Rise=${rise}m`);

  } else {
    /* ── simple flat slab ── */
    isoBox(ctx,ox,oy,sc, 0,0,0, L,Wd,T, col);

    // rebar grid on top face
    const tl=iso(0,0,T,ox,oy,sc), tr=iso(L,0,T,ox,oy,sc);
    const br=iso(L,Wd,T,ox,oy,sc), bl=iso(0,Wd,T,ox,oy,sc);
    rebarLines(ctx,[tl,tr,br,bl],5,'rgba(255,152,0,0.35)');
    rebarLines(ctx,[tl,bl,br,tr],5,'rgba(255,152,0,0.25)');

    // dimension lines
    const a=iso(L/2,0,0,ox,oy,sc);
    dimLabel(ctx,{x:a.x,y:a.y+12},{x:a.x+55,y:a.y+12},`L=${L}m`);
    const b=iso(L,Wd/2,0,ox,oy,sc);
    dimLabel(ctx,b,{x:b.x+42,y:b.y},`W=${Wd}m`);
    const c=iso(0,0,T/2,ox,oy,sc);
    dimLabel(ctx,c,{x:c.x-60,y:c.y},`T=${T}m`);
  }

  badge(ctx, shape==='slope' ? 'SLOPE SLAB' : 'SIMPLE SLAB');
}

/* ═══════════════════════════════════════════════════════════
   BEAM
═══════════════════════════════════════════════════════════ */
function drawBeam(shape) {
  const cv = getCV('beam_canvas'); if (!cv) return;
  const { ctx, W, H } = cv;
  clearBG(ctx, W, H);

  const L  = parseFloat(document.getElementById('beam_len')?.value)  || 5;
  const B  = parseFloat(document.getElementById('beam_b')?.value)    || 0.3;
  const D  = parseFloat(document.getElementById('beam_h')?.value)    || 0.45;
  const B2 = parseFloat(document.getElementById('beam_b2')?.value)   || 0.45;
  const H2 = parseFloat(document.getElementById('beam_h2')?.value)   || 0.15;

  // Beam is long — give it a landscape scale
  const sc  = autoScale(W, H, L, B*4, D*4);
  const ox  = W * 0.40;
  const oy  = H * 0.72;

  const col  = { front:VIS.face,    right:VIS.faceR,   top:VIS.faceTop };
  const col2 = { front:'#0d47a1', right:'#083070', top:'#64b5f6' };

  if (shape === 'slope') {
    /* ── wedge beam ── */
    const p = (x,y,z) => iso(x,y,z,ox,oy,sc);
    const v = [
      p(0,0,0),p(L,0,0),p(L,0,D),p(0,0,D*0.06),
      p(0,B,0),p(L,B,0),p(L,B,D),p(0,B,D*0.06),
    ];
    const face=(idx,fill)=>{
      ctx.beginPath();idx.forEach((i,k)=>k===0?ctx.moveTo(v[i].x,v[i].y):ctx.lineTo(v[i].x,v[i].y));
      ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=VIS.edge;ctx.lineWidth=1;ctx.stroke();
    };
    face([0,1,2,3],VIS.face);    face([4,5,6,7],VIS.faceR);
    face([0,1,5,4],'#0d47a1');   face([3,2,6,7],VIS.faceTop);
    face([0,3,7,4],'#1255a0');   face([1,2,6,5],VIS.faceDark);
    // stirrups
    ctx.strokeStyle='rgba(255,152,0,0.5)'; ctx.lineWidth=1;
    [0.25,0.5,0.75].forEach(f=>{
      const x=L*f, dz=D*0.06+(D-D*0.06)*f;
      const p0=p(x,0,0),p1=p(x,B,0),p2=p(x,B,dz),p3=p(x,0,dz);
      ctx.beginPath();ctx.moveTo(p0.x,p0.y);ctx.lineTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);ctx.lineTo(p3.x,p3.y);ctx.closePath();ctx.stroke();
    });
    const mid=p(L/2,0,0);
    dimLabel(ctx,{x:mid.x,y:mid.y+12},{x:mid.x+55,y:mid.y+12},`L=${L}m`);
    const ep=p(L,B/2,D/2);
    dimLabel(ctx,ep,{x:ep.x+40,y:ep.y},`D=${D}m`);

  } else if (shape === 'stepped' || shape === 'stepped2') {
    /* ── stepped beam ── */
    isoBox(ctx,ox,oy,sc, 0,0,0, L,B,D, col);
    const sB = shape==='stepped2' ? B2 : B*0.55;
    const sH = H2 > 0 ? H2 : D*0.3;
    const offB = (B-sB)/2;
    isoBox(ctx,ox,oy,sc, 0,offB,D, L,sB,sH, col2);
    // stirrups on main
    ctx.strokeStyle='rgba(255,152,0,0.45)'; ctx.lineWidth=0.9;
    [0.2,0.4,0.6,0.8].forEach(f=>{
      const x=L*f;
      const p0=iso(x,0,0,ox,oy,sc),p1=iso(x,B,0,ox,oy,sc),p2=iso(x,B,D,ox,oy,sc),p3=iso(x,0,D,ox,oy,sc);
      ctx.beginPath();ctx.moveTo(p0.x,p0.y);ctx.lineTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);ctx.lineTo(p3.x,p3.y);ctx.closePath();ctx.stroke();
    });
    const a=iso(L/2,0,0,ox,oy,sc);
    dimLabel(ctx,{x:a.x,y:a.y+12},{x:a.x+55,y:a.y+12},`L=${L}m`);
    const b=iso(L,B/2,0,ox,oy,sc);
    dimLabel(ctx,b,{x:b.x+40,y:b.y},`B=${B}m`);
    const d=iso(0,0,D/2,ox,oy,sc);
    dimLabel(ctx,d,{x:d.x-58,y:d.y},`D=${D}m`);

  } else {
    /* ── simple beam ── */
    isoBox(ctx,ox,oy,sc, 0,0,0, L,B,D, col);
    // stirrups
    ctx.strokeStyle='rgba(255,152,0,0.45)'; ctx.lineWidth=0.9;
    [0.17,0.33,0.50,0.67,0.83].forEach(f=>{
      const x=L*f;
      const p0=iso(x,0,0,ox,oy,sc),p1=iso(x,B,0,ox,oy,sc),p2=iso(x,B,D,ox,oy,sc),p3=iso(x,0,D,ox,oy,sc);
      ctx.beginPath();ctx.moveTo(p0.x,p0.y);ctx.lineTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);ctx.lineTo(p3.x,p3.y);ctx.closePath();ctx.stroke();
    });
    // rebar lines on front face
    const p0=iso(0,0,D*0.08,ox,oy,sc),p1=iso(L,0,D*0.08,ox,oy,sc),p2=iso(L,0,D*0.92,ox,oy,sc),p3=iso(0,0,D*0.92,ox,oy,sc);
    ctx.strokeStyle='rgba(255,152,0,0.6)'; ctx.lineWidth=1.2;
    [p0,p1].forEach((pt,i)=>{ if(i===0){ctx.beginPath();ctx.moveTo(p0.x,p0.y);ctx.lineTo(p1.x,p1.y);ctx.stroke();}});
    [p3,p2].forEach((pt,i)=>{ if(i===0){ctx.beginPath();ctx.moveTo(p3.x,p3.y);ctx.lineTo(p2.x,p2.y);ctx.stroke();}});

    const a=iso(L/2,0,0,ox,oy,sc);
    dimLabel(ctx,{x:a.x,y:a.y+12},{x:a.x+55,y:a.y+12},`L=${L}m`);
    const b=iso(L,B/2,0,ox,oy,sc);
    dimLabel(ctx,b,{x:b.x+40,y:b.y},`B=${B}m`);
    const d=iso(0,0,D/2,ox,oy,sc);
    dimLabel(ctx,d,{x:d.x-58,y:d.y},`D=${D}m`);
  }

  const titles={simple:'SIMPLE BEAM',slope:'SLOPE BEAM',stepped:'STEPPED BEAM',stepped2:'STEPPED BEAM 2'};
  badge(ctx, titles[shape]||'BEAM');
}

/* ═══════════════════════════════════════════════════════════
   COLUMN
═══════════════════════════════════════════════════════════ */
function drawColumn(shape) {
  const cv = getCV('col_canvas'); if (!cv) return;
  const { ctx, W, H } = cv;
  clearBG(ctx, W, H);

  const L  = parseFloat(document.getElementById('col_len')?.value) || 0.4;
  const Wd = parseFloat(document.getElementById('col_w')?.value)   || 0.4;
  const Ht = parseFloat(document.getElementById('col_h')?.value)   || 3;
  const FW = parseFloat(document.getElementById('col_fw')?.value)  || 0.25;
  const FT = parseFloat(document.getElementById('col_ft')?.value)  || 0.1;

  // Column: tall and thin — prioritise height
  const sc  = Math.min(
    (H * 0.78) / (Ht * 0.82),
    (W * 0.35) / ((L + Wd) * 0.70)
  );
  const ox  = W * 0.50;
  const oy  = H * 0.90;

  const col  = { front:VIS.face, right:VIS.faceR, top:VIS.faceTop };
  const col2 = { front:'#0d47a1', right:'#083070', top:'#64b5f6' };
  const colC = { front:'#7986cb', right:'#5c6bc0', top:'#9fa8da' };

  // ground slab hint
  isoBox(ctx,ox,oy,sc, -0.3,-0.3,-0.18, L+0.6,Wd+0.6,0.18,
    {front:'#37474f',right:'#263238',top:'#546e7a'});

  if (shape === 'round') {
    const R   = (L/2) * sc;
    const cy0 = oy;
    const cy1 = oy - Ht * sc * 0.82;
    const ew  = R * 0.60;
    const eh  = R * 0.24;
    // body sides
    const grad=ctx.createLinearGradient(ox-R,0,ox+R,0);
    grad.addColorStop(0,VIS.face); grad.addColorStop(1,VIS.faceDark);
    ctx.fillStyle=grad;
    ctx.beginPath();
    ctx.moveTo(ox-ew,cy1); ctx.lineTo(ox-ew,cy0);
    ctx.ellipse(ox,cy0,ew,eh,0,Math.PI,Math.PI*2); // bottom half
    ctx.lineTo(ox+ew,cy1);
    ctx.ellipse(ox,cy1,ew,eh,0,0,Math.PI,true); // top half back
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle=VIS.edge; ctx.lineWidth=1; ctx.stroke();
    // bottom ellipse
    ctx.beginPath(); ctx.ellipse(ox,cy0,ew,eh,0,0,Math.PI*2);
    ctx.fillStyle=VIS.faceDark; ctx.fill(); ctx.stroke();
    // top ellipse
    ctx.beginPath(); ctx.ellipse(ox,cy1,ew,eh,0,0,Math.PI*2);
    ctx.fillStyle=VIS.faceTop; ctx.fill(); ctx.stroke();
    // hoops
    ctx.strokeStyle='rgba(255,152,0,0.55)'; ctx.lineWidth=1;
    [0.25,0.5,0.75].forEach(f=>{
      const hy=cy0-(cy0-cy1)*f;
      ctx.beginPath(); ctx.ellipse(ox,hy,ew,eh,0,0,Math.PI*2); ctx.stroke();
    });
    dimLabel(ctx,{x:ox+ew,y:(cy0+cy1)/2},{x:ox+ew+45,y:(cy0+cy1)/2},`H=${Ht}m`);
    dimLabel(ctx,{x:ox,y:cy0+eh+4},{x:ox+ew+40,y:cy0+eh+4},`D=${L}m`);

  } else if (shape === 'lshape') {
    isoBox(ctx,ox,oy,sc, 0,0,0, L,Wd,Ht, col);
    isoBox(ctx,ox,oy,sc, L,0,0, FW,Wd,Ht, col2);
    drawTies(ctx,ox,oy,sc,L+FW,Wd,Ht);
    addColDims(ctx,ox,oy,sc,L,Wd,Ht);

  } else if (shape === 'tshape') {
    isoBox(ctx,ox,oy,sc, 0,0,0, L,Wd,Ht, col);
    const fw=FW>0?FW:L*0.7, off=(L-fw)/2;
    isoBox(ctx,ox,oy,sc, off,-FT,0, fw,FT,Ht, col2);
    addColDims(ctx,ox,oy,sc,L,Wd,Ht);

  } else if (shape === 'plus') {
    const fw=FW>0?FW:L*0.4, ft=FT>0?FT:0.08;
    isoBox(ctx,ox,oy,sc, 0,-ft,0, L,ft,Ht, col);
    isoBox(ctx,ox,oy,sc, (L-fw)/2,-Wd/2,0, fw,Wd,Ht, col2);
    addColDims(ctx,ox,oy,sc,L,Wd,Ht);

  } else if (shape === 'cshape') {
    isoBox(ctx,ox,oy,sc, 0,0,0, L,Wd,Ht, col);
    const iL=L-FT*2, iW=FW>0?FW:Wd*0.5;
    isoBox(ctx,ox,oy,sc, FT,0,0, iL,iW,Ht, {front:VIS.bg,right:'#0d1117',top:'#141a23'});
    addColDims(ctx,ox,oy,sc,L,Wd,Ht);

  } else if (shape === 'hollowrect') {
    isoBox(ctx,ox,oy,sc, 0,0,0, L,Wd,Ht, col);
    const iL=FW>0?FW:L*0.55, iW=FT>0?FT:Wd*0.55;
    isoBox(ctx,ox,oy,sc, (L-iL)/2,(Wd-iW)/2,0, iL,iW,Ht,
      {front:VIS.bg,right:'#0d1117',top:'#141a23'});
    addColDims(ctx,ox,oy,sc,L,Wd,Ht);

  } else {
    /* square / rectangle */
    isoBox(ctx,ox,oy,sc, 0,0,0, L,Wd,Ht, col);
    drawTies(ctx,ox,oy,sc,L,Wd,Ht);
    addColDims(ctx,ox,oy,sc,L,Wd,Ht);
  }

  badge(ctx,'COLUMN – '+shape.toUpperCase());
}

function drawTies(ctx,ox,oy,sc,L,Wd,Ht) {
  ctx.strokeStyle='rgba(255,152,0,0.5)'; ctx.lineWidth=0.9;
  [0.25,0.50,0.75].forEach(f=>{
    const z=Ht*f;
    const p0=iso(0,0,z,ox,oy,sc),p1=iso(L,0,z,ox,oy,sc),p2=iso(L,Wd,z,ox,oy,sc),p3=iso(0,Wd,z,ox,oy,sc);
    ctx.beginPath();ctx.moveTo(p0.x,p0.y);ctx.lineTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);ctx.lineTo(p3.x,p3.y);ctx.closePath();ctx.stroke();
  });
}

function addColDims(ctx,ox,oy,sc,L,Wd,Ht) {
  const dp=iso(0,0,Ht/2,ox,oy,sc);
  dimLabel(ctx,dp,{x:dp.x-60,y:dp.y},`H=${Ht}m`);
  const tp=iso(L/2,Wd,0,ox,oy,sc);
  dimLabel(ctx,tp,{x:tp.x+35,y:tp.y},`${L}×${Wd}m`);
}

/* ═══════════════════════════════════════════════════════════
   FOOTING
═══════════════════════════════════════════════════════════ */
function drawFooting(shape) {
  const cv = getCV('foot_canvas'); if (!cv) return;
  const { ctx, W, H } = cv;
  clearBG(ctx, W, H);

  const L  = parseFloat(document.getElementById('foot_len')?.value) || 1.5;
  const Wd = parseFloat(document.getElementById('foot_w')?.value)   || 1.5;
  const D  = parseFloat(document.getElementById('foot_d')?.value)   || 0.5;
  const L2 = parseFloat(document.getElementById('foot_l2')?.value)  || 1.0;
  const W2 = parseFloat(document.getElementById('foot_w2')?.value)  || 1.0;
  const D2 = parseFloat(document.getElementById('foot_d2')?.value)  || 0.3;

  const sc  = autoScale(W, H, L, Wd, D*5);
  const ox  = W * 0.50;
  const oy  = H * 0.80;

  const col  = { front:'#1255a0', right:'#0a3d82', top:'#1e88e5' };
  const col2 = { front:VIS.face,  right:VIS.faceR,  top:VIS.faceTop };
  const colC = { front:'#7986cb', right:'#5c6bc0',  top:'#9fa8da' };

  // rebar grid on bottom face hint
  ctx.strokeStyle='rgba(255,152,0,0.3)'; ctx.lineWidth=0.8;
  for(let i=1;i<=3;i++){
    const p0=iso(L*i/4,0,0,ox,oy,sc),p1=iso(L*i/4,Wd,0,ox,oy,sc);
    ctx.beginPath();ctx.moveTo(p0.x,p0.y);ctx.lineTo(p1.x,p1.y);ctx.stroke();
    const q0=iso(0,Wd*i/4,0,ox,oy,sc),q1=iso(L,Wd*i/4,0,ox,oy,sc);
    ctx.beginPath();ctx.moveTo(q0.x,q0.y);ctx.lineTo(q1.x,q1.y);ctx.stroke();
  }

  if (shape === 'trapezoidal') {
    const TL=parseFloat(document.getElementById('foot_tl')?.value)||L*0.45;
    const TW=parseFloat(document.getElementById('foot_tw')?.value)||Wd*0.45;
    isoBox(ctx,ox,oy,sc, 0,0,0, L,Wd,D*0.55, col);
    const oL=(L-TL)/2, oW=(Wd-TW)/2;
    isoBox(ctx,ox,oy,sc, oL,oW,D*0.55, TL,TW,D*0.45, col2);
    isoBox(ctx,ox,oy,sc, oL+TL*0.3,oW+TW*0.3,D, TL*0.4,TW*0.4,D*0.7, colC);
    addFootDims(ctx,ox,oy,sc,L,Wd,D);

  } else if (shape === 'combined') {
    const cs=parseFloat(document.getElementById('foot_cs')?.value)||3;
    isoBox(ctx,ox,oy,sc, 0,0,0, L,Wd,D, col);
    isoBox(ctx,ox,oy,sc, 0,Wd+cs,0, L,Wd,D, col);
    isoBox(ctx,ox,oy,sc, L*0.3,Wd,0, L*0.4,cs,D*0.45, col2);
    isoBox(ctx,ox,oy,sc, L*0.35,Wd*0.35,D, L*0.3,Wd*0.3,D*0.7, colC);
    isoBox(ctx,ox,oy,sc, L*0.35,Wd+cs+Wd*0.35,D, L*0.3,Wd*0.3,D*0.7, colC);
    const sp=iso(L/2,Wd+cs/2,0,ox,oy,sc);
    dimLabel(ctx,sp,{x:sp.x+38,y:sp.y},`sp=${cs}m`);

  } else if (shape === 'circular') {
    const R=L/2;
    const scc=Math.min((W*0.6)/L,(H*0.6)/(D+L*0.4));
    const cx=W*0.50, cy=H*0.66;
    const ew=R*scc*0.72, eh=R*scc*0.30;
    // bottom
    ctx.beginPath();ctx.ellipse(cx,cy+D*scc*1.5,ew,eh,0,0,Math.PI*2);
    ctx.fillStyle=col.right;ctx.fill();ctx.strokeStyle=VIS.edge;ctx.lineWidth=1;ctx.stroke();
    // body
    const grad=ctx.createLinearGradient(cx-ew,0,cx+ew,0);
    grad.addColorStop(0,col.front); grad.addColorStop(1,col.right);
    ctx.fillStyle=grad;
    ctx.beginPath();
    ctx.moveTo(cx-ew,cy); ctx.lineTo(cx-ew,cy+D*scc*1.5);
    ctx.ellipse(cx,cy+D*scc*1.5,ew,eh,0,Math.PI,Math.PI*2,false);
    ctx.lineTo(cx+ew,cy); ctx.closePath(); ctx.fill(); ctx.stroke();
    // top
    ctx.beginPath();ctx.ellipse(cx,cy,ew,eh,0,0,Math.PI*2);
    ctx.fillStyle=col2.top;ctx.fill();ctx.stroke();
    // column stub
    ctx.beginPath();ctx.ellipse(cx,cy-D*scc*0.9,ew*0.32,eh*0.32,0,0,Math.PI*2);
    ctx.fillStyle=colC.top;ctx.fill();ctx.stroke();
    ctx.fillStyle=colC.front;
    ctx.beginPath();
    ctx.moveTo(cx-ew*0.32,cy-D*scc*0.9);ctx.lineTo(cx-ew*0.32,cy);
    ctx.ellipse(cx,cy,ew*0.32,eh*0.32,0,Math.PI,Math.PI*2,false);
    ctx.lineTo(cx+ew*0.32,cy-D*scc*0.9);ctx.closePath();ctx.fill();ctx.stroke();
    dimLabel(ctx,{x:cx+ew+4,y:cy+D*scc*0.75},{x:cx+ew+44,y:cy+D*scc*0.75},`Dia=${L}m`);
    dimLabel(ctx,{x:cx,y:cy+D*scc*1.5+eh+6},{x:cx+ew+44,y:cy+D*scc*1.5+eh+6},`D=${D}m`);

  } else if (shape === 'stepped' || shape === 'twostepped') {
    isoBox(ctx,ox,oy,sc, 0,0,0, L,Wd,D, col);
    const oL=(L-L2)/2, oW=(Wd-W2)/2;
    isoBox(ctx,ox,oy,sc, oL,oW,D, L2,W2,D2, col2);
    isoBox(ctx,ox,oy,sc, oL+L2*0.3,oW+W2*0.3,D+D2, L2*0.4,W2*0.4,D*0.7, colC);
    addFootDims(ctx,ox,oy,sc,L,Wd,D);

  } else {
    /* box default */
    isoBox(ctx,ox,oy,sc, 0,0,0, L,Wd,D, col);
    isoBox(ctx,ox,oy,sc, L*0.35,Wd*0.35,D, L*0.3,Wd*0.3,D*0.75, colC);
    addFootDims(ctx,ox,oy,sc,L,Wd,D);
  }

  badge(ctx,'FOOTING – '+shape.toUpperCase());
}

function addFootDims(ctx,ox,oy,sc,L,Wd,D) {
  const a=iso(L/2,Wd,0,ox,oy,sc);
  dimLabel(ctx,a,{x:a.x+36,y:a.y},`${L}×${Wd}m`);
  const d=iso(0,0,D/2,ox,oy,sc);
  dimLabel(ctx,d,{x:d.x-56,y:d.y},`D=${D}m`);
}

/* ═══════════════════════════════════════════════════════════
   STAIRCASE  (staircase.html)
═══════════════════════════════════════════════════════════ */
function drawStaircase(canvasId, stairType, params) {
  const cv = getCV(canvasId); if (!cv) return;
  const { ctx, W, H } = cv;
  clearBG(ctx, W, H);

  const N  = Math.min(params.steps || 10, 20);
  const R  = params.rise  || 0.15;
  const T  = params.tread || 0.25;
  const Sw = params.width || 1.2;

  /* auto-scale so stair flight fills canvas */
  const sc = autoScale(W, H*0.9, N*T, Sw, N*R);
  const ox = W * 0.12;
  const oy = H * 0.88;

  const stepColor = (i, total) => {
    const br = 0.45 + (i/total)*0.55;
    return {
      front: `rgba(30,136,229,${br})`,
      right: `rgba(18,85,160,${br})`,
      top:   `rgba(66,165,245,${br})`,
    };
  };

  if (stairType === 'spiral') {
    drawSpiralFull(ctx, W, H, N, R);
  } else if (stairType === 'doglegged') {
    const half = Math.ceil(N/2);
    // first flight
    for(let i=0;i<half;i++) {
      isoBox(ctx,ox,oy,sc, i*T,0,i*R, T,Sw,R, stepColor(i,N));
    }
    // landing
    isoBox(ctx,ox,oy,sc, half*T,0,half*R, T*1.8,Sw,R*0.15,
      {front:'#1565c0',right:'#0d47a1',top:'#64b5f6'});
    // second flight (going back in y)
    for(let i=0;i<N-half;i++){
      isoBox(ctx,ox,oy,sc, (half+1.8)*T, (i+1)*Sw*0.12,(half+i)*R, T,Sw,R, stepColor(half+i,N));
    }
    badge(ctx,'DOG-LEGGED STAIR');

  } else if (stairType === 'l_shaped') {
    const half = Math.ceil(N/2);
    for(let i=0;i<half;i++) isoBox(ctx,ox,oy,sc, i*T,0,i*R, T,Sw,R, stepColor(i,N));
    // 90° turn — goes in Y direction
    for(let i=0;i<N-half;i++) isoBox(ctx,ox,oy,sc, half*T,i*T,half*R+i*R, Sw,T,R, stepColor(half+i,N));
    badge(ctx,'L-SHAPED STAIR');

  } else if (stairType === 'u_shaped') {
    const third = Math.ceil(N/3);
    // first flight
    for(let i=0;i<third;i++) isoBox(ctx,ox,oy,sc, i*T,0,i*R, T,Sw,R, stepColor(i,N));
    // landing 1
    isoBox(ctx,ox,oy,sc, third*T,0,third*R, T,Sw,R*0.12,
      {front:'#1565c0',right:'#0d47a1',top:'#64b5f6'});
    // second flight going in Y
    for(let i=0;i<third;i++) isoBox(ctx,ox,oy,sc, third*T,i*T+T,third*R+i*R, Sw*0.8,T,R, stepColor(third+i,N));
    // landing 2
    isoBox(ctx,ox,oy,sc, third*T,third*T+T,third*R*2, Sw*0.8,T,R*0.12,
      {front:'#1565c0',right:'#0d47a1',top:'#64b5f6'});
    // third flight going back in X
    for(let i=0;i<N-third*2;i++) isoBox(ctx,ox,oy,sc, (third-i)*T-T,third*T+T,third*R*2+i*R, T,Sw*0.8,R, stepColor(third*2+i,N));
    badge(ctx,'U-SHAPED STAIR');

  } else if (stairType === 'open') {
    const half = Math.ceil(N/2);
    for(let i=0;i<half;i++) isoBox(ctx,ox,oy,sc, i*T,0,i*R, T,Sw,R, stepColor(i,N));
    // second flight with gap (open well)
    for(let i=0;i<N-half;i++) isoBox(ctx,ox,oy,sc, i*T,(Sw+0.5),(half+i)*R, T,Sw,R, stepColor(half+i,N));
    badge(ctx,'OPEN NEWEL STAIR');

  } else {
    /* straight */
    for(let i=0;i<N;i++) isoBox(ctx,ox,oy,sc, i*T,0,i*R, T,Sw,R, stepColor(i,N));
    badge(ctx,'STRAIGHT STAIR');
  }

  // Dimension labels at bottom
  ctx.font='bold 10px monospace'; ctx.fillStyle=VIS.dimCol;
  ctx.fillText(`N=${N} steps  |  R=${(R*1000).toFixed(0)}mm  |  T=${(T*1000).toFixed(0)}mm  |  W=${Sw}m`, 10, H-8);
}

function drawSpiralFull(ctx, W, H, N, R) {
  const cx=W*0.50, cy=H*0.55;
  const baseR=Math.min(W,H)*0.35;
  const stepH=Math.min(H*0.03, baseR*0.18);
  for(let i=0;i<N;i++){
    const a0=(i/N)*Math.PI*3.5, a1=((i+1)/N)*Math.PI*3.5;
    const yOff=-i*stepH;
    const bright=0.4+(i/N)*0.6;
    ctx.beginPath();
    ctx.moveTo(cx,cy+yOff);
    ctx.lineTo(cx+Math.cos(a0)*baseR, cy+yOff+Math.sin(a0)*baseR*0.38);
    ctx.lineTo(cx+Math.cos(a1)*baseR, cy+yOff-stepH+Math.sin(a1)*baseR*0.38);
    ctx.lineTo(cx,cy+yOff-stepH);
    ctx.closePath();
    ctx.fillStyle=`rgba(30,136,229,${bright})`; ctx.fill();
    ctx.strokeStyle=VIS.edge; ctx.lineWidth=0.8; ctx.stroke();
  }
  badge(ctx,'SPIRAL STAIR');
}

/* ═══════════════════════════════════════════════════════════
   PUBLIC ENTRY POINT
═══════════════════════════════════════════════════════════ */
function updateVisual(type) {
  const shapeMap = window.elementShapes || {};
  const shape    = shapeMap[type] || 'simple';
  if      (type==='slab')    drawSlab(shape);
  else if (type==='beam')    drawBeam(shape);
  else if (type==='column')  drawColumn(shape);
  else if (type==='footing') drawFooting(shape);
}