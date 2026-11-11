
(function(){
  const $ = id => document.getElementById(id);
  let lens = 'acc';
  try { const s = localStorage.getItem('htn-lens'); if (s === 'esc' || s === 'acc') lens = s; } catch(e){}

  function setLens(l){
    lens = l;
    $('lens-acc').setAttribute('aria-pressed', l==='acc');
    $('lens-esc').setAttribute('aria-pressed', l==='esc');
    $('risk-l').textContent = l==='acc' ? '10-year CVD risk % (PREVENT)' : '10-year CVD risk % (SCORE2, or PREVENT below)';
    try { localStorage.setItem('htn-lens', l); } catch(e){}
    render();
  }
  $('lens-acc').onclick = () => setLens('acc');
  $('lens-esc').onclick = () => setLens('esc');

  function read(){
    const n = id => { const v = parseFloat($(id).value); return isNaN(v) ? null : v; };
    const c = id => $(id).checked;
    return { s:n('sbp'), d:n('dbp'), age:n('htn-age'), sex:$('htn-sex').value, meds:+$('meds').value, risk:n('risk'),
      oob:c('oob'), dm:c('dm'), cad:c('cad'), hf:c('hf-htn'), stroke:c('stroke'), af:c('af'), gout:c('gout'),
      asthma:c('asthma'), bph:c('bph'), frail:c('frail-htn'), ortho:c('ortho'), preg:c('preg-htn') && $('htn-sex').value==='f',
      egfr:n('htn-egfr'), uacr:n('htn-uacr'), k:n('k') };
  }

  function classify(p){
    const {s,d} = p;
    if (s>=180 || d>=120) return {label:'Severe hypertension', cls:'p-bad', sev:true};
    if (lens==='acc'){
      if (s>=140 || d>=90) return {label:'Stage 2 hypertension', cls:'p-bad', stage:2};
      if (s>=130 || d>=80) return {label:'Stage 1 hypertension', cls:'p-warn', stage:1};
      if (s>=120) return {label:'Elevated BP', cls:'p-warn', stage:0.5};
      return {label:'Normal BP', cls:'p-ok', stage:0};
    } else {
      if (s>=140 || d>=90) return {label:'Hypertension', cls:'p-bad', stage:2};
      if (s>=120 || d>=70) return {label:'Elevated BP', cls:'p-warn', stage:1};
      return {label:'Non-elevated BP', cls:'p-ok', stage:0};
    }
  }

  // AHA PREVENT base model, 10-year total CVD (Khan SS et al., Circulation 2024)
  const PV = {
    f:{a:0.7939329,n:0.0305239,h:-0.1606857,s1:-0.2394003,s2:0.3600781,d:0.8667604,sm:0.5360739,e1:0.6045917,e2:0.0433769,m:0.3151672,st:-0.1477655,ms:-0.0663612,stn:0.1197879,an:-0.0819715,ah:0.0306769,as:-0.0946348,ad:-0.27057,asm:-0.078715,ae:-0.1637806,c:-3.307728},
    m:{a:0.7688528,n:0.0736174,h:-0.0954431,s1:-0.4347345,s2:0.3362658,d:0.7692857,sm:0.4386871,e1:0.5378979,e2:0.0164827,m:0.288879,st:-0.1337349,ms:-0.0475924,stn:0.150273,an:-0.0517874,ah:0.0191169,as:-0.1049477,ad:-0.2251948,asm:-0.0895067,ae:-0.1543702,c:-3.031168}
  };
  function prevent(q){ // tc, hdl in mg/dL
    const k = PV[q.sex];
    const A=(q.age-55)/10, N=(q.tc-q.hdl)*0.02586-3.5, H=(q.hdl*0.02586-1.3)/0.3,
      S1=(Math.min(q.sbp,110)-110)/20, S2=(Math.max(q.sbp,110)-130)/20,
      E1=(Math.min(q.egfr,60)-60)/-15, E2=(Math.max(q.egfr,60)-90)/-15;
    const x = k.a*A + k.n*N + k.h*H + k.s1*S1 + k.s2*S2 + k.d*q.dm + k.sm*q.smk + k.e1*E1 + k.e2*E2
      + k.m*q.tx + k.st*q.statin + k.ms*q.tx*S2 + k.stn*q.statin*N + k.an*A*N + k.ah*A*H
      + k.as*A*S2 + k.ad*A*q.dm + k.asm*A*q.smk + k.ae*A*E1 + k.c;
    return 100*Math.exp(x)/(1+Math.exp(x));
  }
  let riskManual = false;
  $('risk').addEventListener('input', () => { riskManual = $('risk').value !== ''; });
  ['tc','hdl','lunit','smk','statin'].forEach(id => $(id).addEventListener('input', () => { riskManual = false; }));

  function calcRisk(){
    const box = $('riskbox');
    const v = id => { const x = parseFloat($(id).value); return isNaN(x) ? null : x; };
    const mmol = $('lunit').value === 'mmol';
    let tc = v('tc'), hdl = v('hdl');
    if (mmol){ tc = tc!=null ? tc*38.67 : null; hdl = hdl!=null ? hdl*38.67 : null; }
    const q = { sex:$('htn-sex').value, age:v('htn-age'), sbp:v('sbp'), egfr:v('htn-egfr'), tc, hdl,
      dm:+$('dm').checked, smk:+$('smk').checked, statin:+$('statin').checked, tx:+($('meds').value>0) };
    const known = $('cad').checked || $('stroke').checked || $('hf-htn').checked;
    const setRisk = val => { if (!riskManual) $('risk').value = val; };
    if (known){ box.innerHTML = '<p><span class="pill p-bad">High risk</span> Known CVD: the patient is already high risk, so PREVENT does not apply.</p>'; setRisk(''); return; }
    const miss = ['age','sbp','egfr','tc','hdl'].filter(f => q[f]==null);
    if (miss.length){ box.innerHTML = '<p class="hint">Enter age, SBP, eGFR, total and HDL cholesterol to calculate.</p>'; setRisk(''); return; }
    const warn = [];
    if (q.age<30 || q.age>79) warn.push('age outside 30–79');
    if (q.tc<130 || q.tc>320) warn.push('total cholesterol outside 130–320 mg/dL');
    if (q.hdl<20 || q.hdl>100) warn.push('HDL outside 20–100 mg/dL');
    if (q.sbp<90 || q.sbp>200) warn.push('SBP outside 90–200');
    if (q.egfr<15 || q.egfr>140) warn.push('eGFR outside 15–140');
    if (q.hdl>=q.tc){ box.innerHTML = '<p class="hint">HDL must be lower than total cholesterol. Check units.</p>'; setRisk(''); return; }
    const r = prevent(q);
    const cat = r<5 ? ['Low','p-ok'] : r<7.5 ? ['Borderline','p-warn'] : r<20 ? ['Intermediate','p-warn'] : ['High','p-bad'];
    const pos = Math.min(100, r/25*100);
    box.innerHTML = `<span class="num">${r.toFixed(1)}%</span>
      <div class="riskbar"><span><span class="pill ${cat[1]}">${cat[0]}</span> <span class="hint" style="display:inline">${r>=7.5?'≥7.5%: start drug at stage 1 (ACC/AHA)':'&lt;7.5%: lifestyle first at stage 1'}</span></span>
      <div class="gauge" aria-hidden="true"><i style="left:${pos}%"></i></div>
      <div class="scale"><span>0</span><span>5</span><span>10</span><span>15</span><span>20</span><span>25+</span></div></div>
      ${warn.length?`<p class="hint" style="flex-basis:100%">Outside the validated range (${warn.join(', ')}); interpret with caution.</p>`:''}
      ${lens==='esc'?'<p class="hint" style="flex-basis:100%">ESC uses SCORE2, which is calibrated for European regions only; PREVENT is shown as the nearest available estimate. Enter a SCORE2 value manually if you have one.</p>':''}`;
    setRisk(r.toFixed(1));
  }

  function render(){
    calcRisk();
    const p = read();
    $('preg-c').hidden = p.sex !== 'f';
    if (p.s==null || p.d==null){ $('out').innerHTML = '<div class="sec"><p>Enter systolic and diastolic BP.</p></div>'; return; }

    const ckd = (p.egfr!=null && p.egfr<60) || (p.uacr!=null && p.uacr>=30);
    const alb = p.uacr!=null && p.uacr>=30;
    const ascvd = p.cad || p.stroke || p.hf;
    const riskCut = lens==='acc' ? 7.5 : 10;
    const highRisk = p.dm || ckd || ascvd || (p.risk!=null && p.risk>=riskCut);
    const old = (p.age||0) >= 85 || p.frail || p.ortho;
    const cl = classify(p);
    const sections = [];
    const summary = [];

    // gauge
    const pos = Math.max(0, Math.min(100, (p.s-100)/(200-100)*100));
    sections.push(`<div class="sec"><div class="k">Classification · ${lens==='acc'?'ACC/AHA 2025':'ESC 2024'}</div>
      <div style="display:flex;flex-wrap:wrap;align-items:baseline;gap:10px"><span class="big" style="font-family:var(--f-mono)">${p.s}/${p.d}</span><span class="pill ${cl.cls}">${cl.label}</span></div>
      <div class="gauge" aria-hidden="true"><i style="left:${pos}%"></i></div>
      <div class="scale"><span>100</span><span>120</span><span>140</span><span>160</span><span>180</span><span>200</span></div>
      ${p.oob ? '' : '<p class="hint">Not yet confirmed out of office. Confirm with home BP or ABPM before labelling, unless BP is severe.</p>'}
      ${(p.age!=null && p.age<40 && cl.stage>=1) ? '<p class="hint">Age under 40: screen for secondary hypertension.</p>':''}</div>`);
    summary.push(`BP ${p.s}/${p.d}: ${cl.label} (${lens==='acc'?'ACC/AHA 2025':'ESC 2024'}).`);

    if (cl.sev){
      sections.push(`<div class="sec"><div class="alert"><b>BP ≥180/120.</b> Check for acute target-organ damage (chest pain, dyspnoea, neurological deficit, visual loss, confusion, AKI, pregnancy &gt;20 weeks). If present, this is a hypertensive emergency: refer to the emergency department now. If absent, do not lower BP rapidly; start or intensify oral therapy and review within 1 week.</div></div>`);
      summary.push('Severe range: assess for hypertensive emergency.');
    }

    // Target
    let target, tS, tD;
    if (p.preg){ target='&lt;140/90 mmHg (CHAP approach), with obstetric co-management'; tS=140; tD=90; }
    else if (lens==='acc'){
      if (old){ target='&lt;130/80 if tolerated; individualise in frailty, age ≥85 or orthostatic hypotension'; tS=130; tD=80; }
      else { target='&lt;130/80 mmHg' + (highRisk ? '; SBP &lt;120 is reasonable if tolerated' : ''); tS=130; tD=80; }
    } else {
      if (old){ target='As low as reasonably achievable (ALARA), checking for orthostatic symptoms'; tS=140; tD=90; }
      else { target='SBP 120–129, DBP 70–79 mmHg if tolerated'; tS=130; tD=80; }
    }
    sections.push(`<div class="sec"><div class="k">Target</div><p class="big" style="font-size:20px">${target}</p></div>`);
    summary.push('Target: ' + target.replace(/&lt;/g,'<') + '.');

    // Decision
    let decision, startMode = null, pillCls = 'p-acc';
    const onTx = p.meds > 0;
    const above = p.s>=tS || p.d>=tD;
    if (onTx){
      if (above){ decision = `Above target on ${p.meds===3?'3 or more drugs':p.meds+' drug class'+(p.meds>1?'es':'')}. Check adherence and technique, then step up.`; pillCls='p-warn'; }
      else { decision = 'At target. Continue current regimen, reinforce lifestyle, and review every 3–6 months.'; pillCls='p-ok'; }
    } else if (p.preg){
      if (p.s>=140 || p.d>=90){ decision='Start antihypertensive therapy safe in pregnancy.'; startMode='preg'; pillCls='p-bad'; }
      else { decision='Monitor; treat if BP reaches ≥140/90. Stop ACE inhibitor/ARB if planning pregnancy.'; }
    } else if (lens==='acc'){
      if (cl.stage>=2 || cl.sev){ decision = old ? 'Start drug therapy. In frailty or age ≥85, start with one agent at low dose and titrate slowly.' : 'Start drug therapy now: two first-line classes, preferably as a single-pill combination.'; startMode = old?'mono':'dual'; pillCls='p-bad'; }
      else if (cl.stage===1){
        if (highRisk){ decision='Start one first-line drug plus lifestyle (diabetes, CKD, ASCVD or PREVENT ≥7.5%).'; startMode='mono'; pillCls='p-warn'; }
        else if (p.risk==null){ decision='Calculate the PREVENT 10-year risk. If ≥7.5%, start one drug; if lower, lifestyle for 3–6 months and start a drug if BP stays ≥130/80.'; pillCls='p-warn'; }
        else { decision='Lifestyle for 3–6 months. Start one first-line drug if BP stays ≥130/80.'; pillCls='p-warn'; }
      } else if (cl.stage===0.5){ decision='Lifestyle measures; recheck in 3–6 months.'; }
      else { decision='No treatment. Recheck yearly.'; pillCls='p-ok'; }
    } else {
      if (cl.stage>=2 || cl.sev){ decision = old ? 'Start drug therapy with monotherapy at low dose (age ≥85, frailty or orthostatic hypotension).' : 'Start drug therapy: low-dose two-drug combination, preferably single-pill.'; startMode = old?'mono':'dual'; pillCls='p-bad'; }
      else if (cl.stage===1){
        if ((p.s>=130 || p.d>=80) && highRisk){ decision='Elevated BP with high risk: 3 months of lifestyle, then start drug therapy if BP stays ≥130/80.'; startMode='mono-later'; pillCls='p-warn'; }
        else if (p.risk==null && !highRisk){ decision='Calculate SCORE2. Treat if ≥10% and BP stays ≥130/80 after 3 months of lifestyle.'; pillCls='p-warn'; }
        else { decision='Lifestyle measures; reassess risk and BP yearly.'; pillCls='p-warn'; }
      } else { decision='No treatment. Recheck in 3 years (yearly if risk factors).'; pillCls='p-ok'; }
    }
    sections.push(`<div class="sec"><div class="k">Decision</div><p><span class="pill ${pillCls}" style="margin-right:6px">${onTx?(above?'Step up':'Maintain'):(startMode?'Treat':'Lifestyle')}</span>${decision}</p></div>`);
    summary.push('Decision: ' + decision);

    // Regimen
    const A = (alb||p.dm) ? 'ACE inhibitor or ARB (max tolerated dose)' : 'ACE inhibitor or ARB';
    const D = (p.egfr!=null && p.egfr<30) ? 'Chlorthalidone or loop diuretic' : 'Thiazide-like diuretic';
    const Dex = (p.egfr!=null && p.egfr<30) ? 'Thiazides lose effect at eGFR &lt;30; chlorthalidone still works (CLICK trial), or use furosemide/torsemide.' : 'Indapamide SR 1.5 mg or chlorthalidone 12.5–25 mg preferred over HCTZ.';
    let reg = [];
    const drug = (cls, name, ex) => reg.push({cls,name,ex});
    if (p.preg){
      drug('1st','Labetalol or nifedipine ER','Methyldopa is an alternative. ACE inhibitor, ARB, ARNI, MRA and aliskiren are contraindicated.');
    } else if (p.hf){
      drug('GDMT','ARNI (sacubitril/valsartan), or ACE inhibitor/ARB','Use HFrEF doses.');
      drug('GDMT','Bisoprolol, carvedilol or metoprolol succinate','Evidence-based beta-blocker.');
      drug('GDMT','MRA (spironolactone/eplerenone)','If K⁺ &lt;5.0 and eGFR &gt;30.');
      drug('GDMT','SGLT2 inhibitor','Dapagliflozin or empagliflozin.');
      if (onTx && above && p.meds>=3) drug('add','Amlodipine or hydralazine/nitrate','If BP still above target. Avoid diltiazem/verapamil.');
    } else {
      const step = onTx ? (above ? Math.min(p.meds+1, 4) : p.meds) : (startMode==='dual' ? 2 : (startMode ? 1 : 0));
      const firstC = alb||p.dm||ckd ? 'A' : (p.cad ? 'A' : null);
      if (step>=1){
        if (alb||ckd||p.dm||p.cad||p.stroke||!old) drug('A', A, alb ? 'Albuminuria makes ACE inhibitor/ARB mandatory, not optional.' : 'Perindopril, ramipril, losartan, telmisartan, etc.');
        else drug('C/D','Amlodipine or thiazide-like diuretic','Good single starting agents in older patients.');
      }
      if (step>=2){
        if (p.gout || !p.stroke) drug('C','Amlodipine (DHP CCB)','A + C is the preferred dual combination' + (p.gout?' and avoids diuretic-related gout flares.':'.'));
        else drug('D', D, Dex + ' A + D favoured after stroke.');
        reg.push({cls:'SPC',name:'Combine in one pill where available',ex:'e.g. perindopril/amlodipine, valsartan/amlodipine, telmisartan/amlodipine.'});
      }
      if (step>=3){
        if (p.gout || !p.stroke) drug('D', D, Dex + (p.gout?' Use with caution in gout.':''));
        else drug('C','Amlodipine (DHP CCB)','');
        reg = reg.filter(r=>r.cls!=='SPC');
        reg.push({cls:'SPC',name:'Triple single-pill (A + C + D) if available',ex:'Titrate each to full dose before adding a fourth drug.'});
      }
      if (step>=4){
        reg = reg.filter(r=>r.cls!=='SPC');
        const kOk = p.k==null || p.k<4.5, gOk = p.egfr==null || p.egfr>45;
        drug('MRA','Spironolactone 25–50 mg', kOk&&gOk ? 'Preferred 4th drug (PATHWAY-2). Check K⁺ and creatinine at 1–2 weeks.' : 'Caution: K⁺ ≥4.5 or eGFR ≤45. Consider amiloride, a beta-blocker or doxazosin instead.');
      }
      if (p.cad && step>=1) drug('BB','Beta-blocker (bisoprolol)','Indicated for angina or post-MI.' + (p.asthma?' Cardioselective only (asthma).':''));
      if (p.af && step>=1 && !p.cad) drug('rate','Beta-blocker or diltiazem/verapamil','For rate control in AF.');
    }
    if (reg.length){
      sections.push(`<div class="sec"><div class="k">Regimen</div><div class="regimen">${reg.map(r=>`<div class="drug"><span class="cls">${r.cls}</span><b>${r.name}</b>${r.ex?`<span class="ex">${r.ex}</span>`:''}</div>`).join('')}</div>${(!p.preg && !p.hf)?'<p class="hint">A = ACE inhibitor/ARB · C = dihydropyridine CCB · D = thiazide-like diuretic. Never combine an ACE inhibitor with an ARB.</p>':''}</div>`);
      summary.push('Regimen: ' + reg.map(r=>r.name).join('; ') + '.');
    }

    // Resistant work-up
    if (!p.preg && onTx && p.meds>=3 && above){
      sections.push(`<div class="sec"><div class="k">Resistant hypertension</div><ul class="notes">
        <li><span class="pill p-acc">Check</span><span>Adherence, NSAIDs, decongestants, steroids, alcohol, salt intake. Confirm with ABPM to exclude white-coat effect.</span></li>
        <li><span class="pill p-acc">Screen</span><span>Primary aldosteronism (aldosterone/renin ratio) regardless of K⁺; continue other BP drugs, stop MRA first. Ask about sleep apnoea.</span></li>
        <li><span class="pill p-acc">Refer</span><span>If uncontrolled on 4 drugs, or a secondary cause is suspected.</span></li></ul></div>`);
    }

    // Notes
    const notes = [];
    const n = (t,c,txt)=>notes.push({t,c,txt});
    if ((alb||ckd) && !p.preg){
      if (p.egfr==null || p.egfr>=20) n('Add','p-ok','SGLT2 inhibitor for kidney protection (eGFR ≥20).');
      if (p.dm && alb && (p.k==null||p.k<=5.0)) n('Consider','p-acc','Finerenone in type 2 diabetes with albuminuria if K⁺ ≤5.0.');
    }
    if (p.k!=null && p.k>5.0) n('Caution','p-warn','K⁺ >5.0: correct before ACE inhibitor/ARB or MRA; a diuretic helps lower K⁺.');
    if (p.gout) n('Avoid','p-bad','Thiazides can trigger gout; losartan lowers uric acid modestly.');
    if (p.asthma) n('Avoid','p-bad','Non-selective beta-blockers (propranolol). Use cardioselective if one is needed.');
    if (p.hf) n('Avoid','p-bad','Diltiazem and verapamil in HFrEF.');
    if (p.bph) n('Add-on','p-acc','Alpha-blocker (doxazosin) helps urinary symptoms but is not first-line for BP.');
    if (p.sex==='f' && !p.preg && (p.age==null||p.age<50)) n('Counsel','p-warn','ACE inhibitor/ARB are teratogenic: discuss contraception and pregnancy plans.');
    if (old) n('Caution','p-warn','Check standing BP; titrate slowly and watch for falls.');
    if (notes.length){
      sections.push(`<div class="sec"><div class="k">Patient-specific notes</div><ul class="notes">${notes.map(x=>`<li><span class="pill ${x.c}">${x.t}</span><span>${x.txt}</span></li>`).join('')}</ul></div>`);
      summary.push('Notes: ' + notes.map(x=>x.t+': '+x.txt).join(' '));
    }

    // Follow-up
    sections.push(`<div class="sec"><div class="k">Follow-up</div><ul class="notes">
      <li><span class="pill p-acc">Labs</span><span>Creatinine and K⁺ 2–4 weeks after starting or raising an ACE inhibitor, ARB, diuretic or MRA. A creatinine rise up to 30% is acceptable.</span></li>
      <li><span class="pill p-acc">Visits</span><span>Monthly until at target, then every 3–6 months. Encourage home BP monitoring.</span></li>
      <li><span class="pill p-acc">Lifestyle</span><span>Lower sodium (aim &lt;1500 mg/day or cut 1000 mg/day), DASH-style diet, potassium-enriched salt substitute (not in CKD or with K⁺-raising drugs), ≥5% weight loss if overweight, 150 min/week activity, stop smoking.</span></li></ul></div>`);

    $('out').innerHTML = sections.join('');
    window.__summary = summary.join('\n');
    window.__tgt = [tS, tD];
  }

  $('f').addEventListener('input', render);
  $('f').addEventListener('submit', e=>e.preventDefault());
  $('copy').addEventListener('click', ()=>{
    const t = window.__summary || '';
    const done = ()=>{ $('toast').hidden=false; setTimeout(()=>$('toast').hidden=true, 1600); };
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(t).then(done).catch(()=>fallback(t));
    } else fallback(t);
    function fallback(txt){ const ta=document.createElement('textarea'); ta.value=txt; document.body.appendChild(ta); ta.select(); try{document.execCommand('copy'); done();}catch(e){} ta.remove(); }
  });

  // ---------- Switch & titrate ----------
  // Each dose step: [dose, level]; level 0 = low, 1 = standard, 2 = high (fractional/negative allowed).
  const DR = [
    {id:'perindopril',n:'Perindopril (erbumine)',c:'acei',g:'ras',u:'mg once daily',st:[[2,0],[4,1],[8,2]]},
    {id:'perindoprila',n:'Perindopril (arginine)',c:'acei',g:'ras',u:'mg once daily',st:[[2.5,0],[5,1],[10,2]]},
    {id:'ramipril',n:'Ramipril',c:'acei',g:'ras',u:'mg once daily',st:[[1.25,-0.5],[2.5,0],[5,1],[10,2]]},
    {id:'lisinopril',n:'Lisinopril',c:'acei',g:'ras',u:'mg once daily',st:[[2.5,-0.5],[5,0],[10,1],[20,2],[40,2.5]]},
    {id:'enalapril',n:'Enalapril',c:'acei',g:'ras',u:'mg/day (once or split twice)',st:[[2.5,-0.5],[5,0],[10,1],[20,2],[40,2.5]]},
    {id:'fosinopril',n:'Fosinopril',c:'acei',g:'ras',u:'mg once daily',st:[[10,0],[20,1],[40,2]]},
    {id:'trandolapril',n:'Trandolapril',c:'acei',g:'ras',u:'mg once daily',st:[[0.5,-0.5],[1,0],[2,1],[4,2]]},
    {id:'losartan',n:'Losartan',c:'arb',g:'ras',u:'mg once daily',st:[[25,0],[50,1],[100,2]]},
    {id:'valsartan',n:'Valsartan',c:'arb',g:'ras',u:'mg once daily',st:[[40,0],[80,1],[160,2],[320,2.5]]},
    {id:'irbesartan',n:'Irbesartan',c:'arb',g:'ras',u:'mg once daily',st:[[75,0],[150,1],[300,2]]},
    {id:'candesartan',n:'Candesartan',c:'arb',g:'ras',u:'mg once daily',st:[[4,0],[8,1],[16,2],[32,2.5]]},
    {id:'telmisartan',n:'Telmisartan',c:'arb',g:'ras',u:'mg once daily',st:[[20,0],[40,1],[80,2]]},
    {id:'olmesartan',n:'Olmesartan',c:'arb',g:'ras',u:'mg once daily',st:[[10,0],[20,1],[40,2]]},
    {id:'azilsartan',n:'Azilsartan',c:'arb',g:'ras',u:'mg once daily',st:[[20,0],[40,1],[80,2]]},
    {id:'arni',n:'Sacubitril/valsartan (HFrEF)',c:'arni',g:'ras',u:'mg twice daily',st:[['24/26',0],['49/51',1],['97/103',2]]},
    {id:'amlodipine',n:'Amlodipine',c:'ccb',g:'ccb',u:'mg once daily',st:[[2.5,0],[5,1],[10,2]]},
    {id:'nifedipine',n:'Nifedipine ER (GITS/XL)',c:'ccb',g:'ccb',u:'mg once daily',st:[[30,0],[60,1],[90,2]]},
    {id:'felodipine',n:'Felodipine ER',c:'ccb',g:'ccb',u:'mg once daily',st:[[2.5,0],[5,1],[10,2]]},
    {id:'lercanidipine',n:'Lercanidipine',c:'ccb',g:'ccb',u:'mg once daily',st:[[10,0.5],[20,1.5]]},
    {id:'hctz',n:'Hydrochlorothiazide',c:'thz',g:'thz',u:'mg once daily',st:[[12.5,0],[25,1],[50,2]]},
    {id:'chlorthalidone',n:'Chlorthalidone',c:'thz',g:'thz',u:'mg once daily',st:[[6.25,0],[12.5,1],[25,2]]},
    {id:'indapamide',n:'Indapamide (immediate release)',c:'thz',g:'thz',u:'mg once daily',st:[[1.25,0.5],[2.5,1.5]]},
    {id:'indapamidesr',n:'Indapamide SR',c:'thz',g:'thz',u:'mg once daily',st:[[1.5,1.5]]},
    {id:'bisoprolol',n:'Bisoprolol',c:'bb',g:'bb',u:'mg once daily',st:[[1.25,-0.5],[2.5,0],[5,1],[10,2]]},
    {id:'metoprolols',n:'Metoprolol succinate (ER)',c:'bb',g:'bb',u:'mg once daily',st:[[25,-0.5],[50,0],[100,1],[200,2]]},
    {id:'metoprololt',n:'Metoprolol tartrate',c:'bb',g:'bb',u:'mg twice daily',st:[[25,0],[50,1],[100,2]]},
    {id:'atenolol',n:'Atenolol',c:'bb',g:'bb',u:'mg once daily',st:[[25,0],[50,1],[100,2]]},
    {id:'carvedilol',n:'Carvedilol',c:'bb',g:'bb',u:'mg twice daily (with food)',st:[[3.125,-0.5],[6.25,0],[12.5,1],[25,2]]},
    {id:'nebivolol',n:'Nebivolol',c:'bb',g:'bb',u:'mg once daily',st:[[2.5,0],[5,1],[10,2]]},
    {id:'spironolactone',n:'Spironolactone',c:'mra',g:'mra',u:'mg once daily',st:[[12.5,0],[25,1],[50,2]]},
    {id:'eplerenone',n:'Eplerenone',c:'mra',g:'mra',u:'mg/day',st:[[25,0],[50,1],[100,2]]}
  ];
  const CL = {acei:'ACE inhibitor',arb:'ARB',arni:'ARNI',ccb:'DHP CCB',thz:'Thiazide / thiazide-like',bb:'Beta-blocker',mra:'MRA'};
  const LV = l => l<0 ? 'starting dose' : l<0.75 ? 'low dose' : l<1.75 ? 'standard dose' : l<2.25 ? 'high dose' : 'maximum dose';
  const byId = id => DR.find(d=>d.id===id);
  const fmt = (d,dose) => `${dose} ${d.u}`;

  function fillDrugSelect(sel, list, val){
    const groups = {};
    list.forEach(d => (groups[d.c] = groups[d.c]||[]).push(d));
    sel.innerHTML = Object.keys(groups).map(c=>`<optgroup label="${CL[c]}">${groups[c].map(d=>`<option value="${d.id}">${d.n}</option>`).join('')}</optgroup>`).join('');
    if (val && list.some(d=>d.id===val)) sel.value = val;
  }
  function fillDose(sel, d, idx){
    sel.innerHTML = d.st.map((x,i)=>`<option value="${i}">${x[0]} ${d.u.split(' ')[0]} · ${LV(x[1])}</option>`).join('');
    sel.value = String(Math.min(idx ?? d.st.findIndex(x=>x[1]>=1) , d.st.length-1));
    if (sel.value==='' || sel.value==='-1') sel.value='0';
  }

  const TI = {
    acei:{iv:'2–4 weeks',mon:'Creatinine and K⁺ 1–2 weeks after each increase.',hold:'Hold the increase if K⁺ >5.5 mmol/L, creatinine rises >30% from baseline, or symptomatic hypotension. Stop if angioedema.'},
    arb:{iv:'2–4 weeks',mon:'Creatinine and K⁺ 1–2 weeks after each increase.',hold:'Hold the increase if K⁺ >5.5 mmol/L, creatinine rises >30% from baseline, or symptomatic hypotension.'},
    arni:{iv:'2–4 weeks',mon:'Creatinine, K⁺ and BP 1–2 weeks after each increase.',hold:'Hold if SBP <100 mmHg, K⁺ >5.5 mmol/L or creatinine rises >30%.'},
    ccb:{iv:'2–4 weeks (full effect takes 1–2 weeks)',mon:'BP and ankle oedema.',hold:'Oedema is dose-related: if it appears, adding an ACE inhibitor/ARB is better than pushing the CCB dose.'},
    thz:{iv:'4 weeks',mon:'Na⁺, K⁺, creatinine, uric acid and glucose 2–4 weeks after each change.',hold:'Above the standard dose BP gain is small and metabolic effects rise; add another class instead. Hold if Na⁺ <130 or K⁺ <3.5 mmol/L.'},
    bb:{iv:'2–4 weeks',mon:'Resting heart rate and BP at each visit.',hold:'Do not increase if resting HR <55–60 bpm, symptomatic bradycardia, or heart block. Never stop abruptly.'},
    mra:{iv:'4–8 weeks',mon:'K⁺ and creatinine at 1 week, 4 weeks, then every 3–6 months.',hold:'Halve or stop if K⁺ >5.5 mmol/L; stop if K⁺ >6.0 or eGFR falls below 30.'}
  };

  function switchNotes(a, b){
    const n = [];
    if (a.id===b.id) return ['Same drug selected.'];
    if (a.c==='acei' && b.c==='arni') n.push('Stop the ACE inhibitor and wait at least 36 hours before the first dose of sacubitril/valsartan (angioedema risk).');
    else if (a.c==='arni' && b.c==='acei') n.push('Wait at least 36 hours after the last sacubitril/valsartan dose before starting the ACE inhibitor.');
    else if (a.c==='arb' && b.c==='arni') n.push('Stop the ARB and give sacubitril/valsartan at the time of the next scheduled dose. Do not give both.');
    else if (a.c==='acei' && b.c==='arb') n.push('Stop the ACE inhibitor and start the ARB the next day; no washout needed. If the reason is angioedema, an ARB carries a small risk of recurrence: discuss with a specialist or use another class.');
    else if (a.g===b.g) n.push('Stop the old drug and start the new one at the next scheduled dose; no washout needed.');
    else n.push('Different classes are not dose-equivalent. Start the new drug at the dose shown and stop the old one the same day' + (a.c==='bb' ? ', except beta-blockers: taper over 1–2 weeks instead of stopping abruptly.' : '.'));
    if (a.id==='metoprololt' && b.id==='metoprolols') n.push('Tartrate to succinate: give the same total daily dose once daily.');
    if (b.id==='chlorthalidone' && a.c==='thz') n.push('Chlorthalidone is about 1.5–2 times as potent as HCTZ and longer acting; check K⁺ and Na⁺ in 2–4 weeks.');
    if (b.id==='nifedipine') n.push('Use extended-release nifedipine only; immediate-release capsules are not for chronic hypertension.');
    if (b.c==='bb' && b.id!=='bisoprolol' && b.id!=='nebivolol') n.push('In asthma, prefer bisoprolol or nebivolol.');
    if (b.id==='eplerenone') n.push('Eplerenone is the usual switch when spironolactone causes gynaecomastia.');
    if (b.c==='acei' || b.c==='arb' || b.c==='arni' || b.c==='mra') n.push('Check creatinine and K⁺ 1–2 weeks after the switch.');
    n.push('Recheck BP 2–4 weeks after the switch.');
    return n;
  }

  function renderSwitch(){
    const a = byId($('sw-from').value), b = byId($('sw-to').value);
    const i = +$('sw-dose').value, lvl = a.st[i][1];
    let out, label;
    if (a.g === b.g && a.id !== b.id){
      let best = b.st[0];
      if (b.c==='arni') best = lvl<=0 ? b.st[0] : b.st[1];
      else b.st.forEach(x => { if (Math.abs(x[1]-lvl) < Math.abs(best[1]-lvl)) best = x; });
      out = fmt(b, best[0]); label = b.c==='arni' ? 'Starting dose (titrate up)' : `Approximate equivalent · ${LV(best[1])}`;
    } else if (a.id === b.id){
      out = fmt(b, a.st[i][0]); label = 'No change';
    } else {
      const std = b.st.find(x=>x[1]>=1) || b.st[b.st.length-1];
      out = fmt(b, std[0]); label = 'Not equipotent · usual standard starting dose (use a lower dose in frailty or age ≥85)';
    }
    $('sw-out').innerHTML = `<div class="result"><span class="k">${a.n} ${a.st[i][0]} → ${b.n}</span><span class="num">${out}</span><span class="hint">${label}</span></div>
      <ul class="notes" style="margin-top:12px">${switchNotes(a,b).map(t=>`<li><span class="pill p-acc">Note</span><span>${t}</span></li>`).join('')}</ul>`;
  }

  function renderTitrate(){
    const d = byId($('ti-drug').value), i = +$('ti-dose').value, t = TI[d.c];
    const p = read();
    const tg = window.__tgt;
    const atTarget = tg && p.s!=null && p.d!=null && p.s < tg[0] && p.d < tg[1];
    const rows = [];
    let wk = 0;
    const ivWeeks = d.c==='mra' ? 4 : d.c==='thz' ? 4 : 2;
    d.st.forEach((x,j) => {
      if (j < i) return;
      rows.push(`<li class="${j===i?'now':''}"><span class="wk">${j===i?'Now':'Week '+wk+'+'}</span><span><span class="ds">${fmt(d,x[0])}</span> <span class="hint" style="display:inline">· ${LV(x[1])}</span></span></li>`);
      wk += ivWeeks;
    });
    const atMax = i === d.st.length-1;
    const pastStd = d.st[i][1] >= 1;
    const head = atTarget
      ? `<p><span class="pill p-ok">At target</span> BP ${p.s}/${p.d} is below the target from the main sheet. Keep the current dose.</p>`
      : atMax ? `<p><span class="pill p-warn">Maximum dose</span> Do not increase further. Add a drug from another class instead.</p>`
      : `<p><span class="pill p-warn">Above target</span> Increase one step every ${t.iv} until BP is at target or the maximum dose is reached.</p>`;
    $('ti-out').innerHTML = head + `<ol class="steps">${rows.join('')}</ol>
      <ul class="notes">
        <li><span class="pill p-acc">Monitor</span><span>${t.mon}</span></li>
        <li><span class="pill p-warn">Hold</span><span>${t.hold}</span></li>
        ${(pastStd && !atMax && !['arni','bb'].includes(d.c)) ? '<li><span class="pill p-ok">Tip</span><span>Adding a low dose of a second class lowers BP more than doubling this one (about five times the effect), with fewer side effects. Consider a single-pill combination.</span></li>' : ''}
        ${d.c==='bb' ? '<li><span class="pill p-acc">Note</span><span>Beta-blockers are not first-line for BP alone; titrate to the indication (angina, post-MI, HFrEF, rate control).</span></li>' : ''}
      </ul>`;
  }

  fillDrugSelect($('sw-from'), DR, 'ramipril');
  fillDose($('sw-dose'), byId('ramipril'));
  fillDrugSelect($('sw-to'), DR, 'losartan');
  fillDrugSelect($('ti-drug'), DR, 'amlodipine');
  fillDose($('ti-dose'), byId('amlodipine'), 1);
  $('sw-from').addEventListener('change', ()=>{ fillDose($('sw-dose'), byId($('sw-from').value)); renderSwitch(); });
  $('sw-dose').addEventListener('change', renderSwitch);
  $('sw-to').addEventListener('change', renderSwitch);
  $('ti-drug').addEventListener('change', ()=>{ fillDose($('ti-dose'), byId($('ti-drug').value), 0); renderTitrate(); });
  $('ti-dose').addEventListener('change', renderTitrate);
  $('f').addEventListener('input', renderTitrate);
  renderSwitch();
  setLens(lens);
  renderTitrate();

  window.htnRender = render;
  window.htnRenderTitrate = renderTitrate;

  // Cross-engine clinical safety alerts listener
  var target = (typeof window !== 'undefined') ? window : globalThis;
  if (target && target.addEventListener) {
    target.addEventListener('osrawy:patient-updated', function(ev) {
      var banner = document.getElementById('clinical-guardrail-banner');
      if (!banner) return;
      var guardrails = (ev && ev.detail && ev.detail.guardrails) || [];
      var list = [];
      if (Array.isArray(guardrails)) list = guardrails;
      else if (guardrails && Array.isArray(guardrails.alerts)) list = guardrails.alerts;
      else if (guardrails && typeof guardrails === 'object') list = Object.values(guardrails).filter(Boolean);

      if (list.length === 0) {
        banner.hidden = true;
        banner.style.display = 'none';
        banner.innerHTML = '';
        return;
      }

      banner.hidden = false;
      banner.style.display = 'block';
      banner.innerHTML = list.map(function(item) {
        var text = typeof item === 'string' ? item : (item.text || item.message || item.title || '');
        var type = (typeof item === 'object' && (item.type || item.level)) || 'danger';
        var icon = (typeof item === 'object' && item.icon) || (type === 'danger' ? '🚨' : (type === 'warn' || type === 'warning' ? '⚠️' : 'ℹ️'));
        return '<div class="guardrail-item ' + type + '"><span class="guardrail-icon">' + icon + '</span><div class="guardrail-msg">' + text + '</div></div>';
      }).join('');
    });
  }
})();

// ==============================================================
// Osrawy Hypertension in Pregnancy Protocol & Obstetric Engine
// Guidelines: ACOG / ESC / NICE / SOGC
// ==============================================================

const OsrawyHtnPregnancy = (function() {
  function evaluatePregnancyHtnProtocol(patientInput) {
    const pt = patientInput || (typeof PatientSync !== 'undefined' ? PatientSync.get() : {});
    const sbp = parseFloat(pt.sbp !== undefined ? pt.sbp : (pt.s !== undefined ? pt.s : 148)) || 0;
    const dbp = parseFloat(pt.dbp !== undefined ? pt.dbp : (pt.d !== undefined ? pt.d : 94)) || 0;
    const isPregnant = !!(pt.pregnancy || pt.preg || pt.isPregnant || pt.pregHtn || (pt.comorbidities && pt.comorbidities.pregnancy));
    const isPostpartum = !!(pt.postpartum || (pt.comorbidities && pt.comorbidities.postpartum));
    const weeks = parseFloat(pt.gestationalWeeks !== undefined ? pt.gestationalWeeks : (pt.weeks !== undefined ? pt.weeks : 16)) || 16;
    const hasAsthma = !!(pt.asthma || (pt.comorbidities && pt.comorbidities.asthma));
    const medsRaw = pt.medications || pt.activeMeds || pt.meds || pt.currentMeds || [];
    const meds = Array.isArray(medsRaw) ? medsRaw.map(m => String(m).toLowerCase()) : [];

    const alerts = [];
    const stoppedDrugs = [];

    // 1. Stopped teratogenic drugs alert (ACEi, ARB, MRA, thiazides)
    const teratogenicClasses = ['acei', 'arb', 'mra', 'thz', 'thiazide'];
    const teratogenicNames = [
      'perindopril', 'ramipril', 'lisinopril', 'enalapril', 'captopril', 'coveram',
      'valsartan', 'losartan', 'telmisartan', 'candesartan', 'exforge', 'twynsta',
      'spironolactone', 'eplerenone', 'aldactone',
      'indapamide', 'hydrochlorothiazide', 'hctz', 'natrilix'
    ];

    const detectedTeratogens = meds.filter(m => 
      teratogenicNames.some(t => m.includes(t)) || 
      teratogenicClasses.some(c => m.includes(c)) ||
      m.includes('ace') || m.includes('arb')
    );

    stoppedDrugs.push(
      'ACE inhibitors (e.g. Perindopril, Ramipril)',
      'ARBs (e.g. Valsartan, Losartan)',
      'MRAs (e.g. Spironolactone)',
      'Thiazides / Thiazide-like diuretics (e.g. Indapamide, HCTZ)'
    );

    alerts.push({
      id: 'htn-preg-teratogenic-stop',
      code: 'STOP_TERATOGENIC_HTN_MEDS',
      level: 'critical',
      type: 'critical',
      titleEn: 'Teratogenic Alert: Stop ACEi, ARB, MRA & Thiazides Immediately',
      titleAr: 'تنبيه تشوه الأجنة الحرج: إيقاف أدوية ACEi و ARB والسبيرونولاكتون ومدرات البول فوراً',
      messageEn: 'ACE inhibitors, ARBs, MRAs (Spironolactone), and Thiazide diuretics are contraindicated in pregnancy due to severe fetotoxicity (renal dysgenesis, oligohydramnios, skull hypoplasia, and neonatal death). Immediately discontinue and switch to pregnancy-safe antihypertensives (Labetalol, Nifedipine ER, or Methyldopa).',
      messageAr: 'مثبطات ACE، حاصرات ARB، مضادات MRA (سبيرونولاكتون)، ومدرات البول الثيازيدية محظورة تماماً في الحمل لتسببها بتشوهات جنينية قاتلة في الكلى وعظام الجمجمة. أوقفها فوراً واستبدلها بأدوية ضغط آمنة للحمل.',
      actionEn: 'Discontinue ACEi/ARB/MRA/Thiazides immediately; initiate Labetalol or Nifedipine ER.',
      actionAr: 'أوقف هذه الأدوية فوراً وابدأ لابيتاول أو نيفيديبين ممتد المفعول.'
    });

    // 2. Severe obstetric HTN emergency alert (>= 160/110)
    const isSevereEmergency = (sbp >= 160 || dbp >= 110);
    if (isSevereEmergency) {
      alerts.push({
        id: 'htn-preg-severe-emergency',
        code: 'OBSTETRIC_HYPERTENSIVE_EMERGENCY',
        level: 'critical',
        type: 'critical',
        titleEn: 'OBSTETRIC EMERGENCY: Severe Hypertension (BP ≥ 160/110 mmHg)',
        titleAr: 'طوارئ نسائية وتوليد حرجة: ارتفاع ضغط شديد حاد (≥ 160/110)',
        messageEn: `Blood pressure is ${sbp}/${dbp} mmHg (≥ 160/110 mmHg). Immediate acute blood pressure lowering is required within 30–60 minutes to prevent maternal intracranial hemorrhage, stroke, encephalopathy, and placental abruption. First-line IV therapy: IV Labetalol (20 mg IV push, repeat 40–80 mg q10min up to 300 mg) OR IV Hydralazine (5–10 mg IV push) OR oral rapid Nifedipine ER/capsule 10–20 mg PO. Start Magnesium Sulfate for seizure prophylaxis if preeclampsia with severe features. Transfer urgently to labor & delivery / obstetric HDU.`,
        messageAr: `ضغط الدم ${sbp}/${dbp} ملم زئبق (≥ 160/110). يتطلب تدخلاً علاجياً عاجلاً خلال 30 إلى 60 دقيقة لحماية الأم من النزيف الدماغي والسكتة الدماغية وانفصال المشيمة. العلاج الإسعافي: لابيتاول وريدي (IV Labetalol) أو هيدرالازين وريدي أو نيفيديبين 10-20 مجم فموياً، مع كبريتات المغنيسيوم (Magnesium Sulfate) لحماية الأم من التشنجات (Eclampsia). تحويل عاجل لقسم الولادة.`,
        actionEn: 'Administer IV Labetalol or IV Hydralazine / oral Nifedipine; evaluate for preeclampsia with severe features.',
        actionAr: 'إعطاء لابيتاول وريدي أو هيدرالازين وريدي، وتقييم تسمم الحمل الشديد وإعطاء كبريتات المغنيسيوم.'
      });
    }

    // 3. Postpartum Methyldopa depression warning
    let methyldopaDepressionWarning = null;
    if (isPostpartum) {
      methyldopaDepressionWarning = {
        id: 'htn-postpartum-methyldopa-depression',
        level: 'warning',
        type: 'warning',
        titleEn: 'Postpartum Warning: Avoid Methyldopa (Depression & Sedation Risk)',
        titleAr: 'تحذير فترة النفاس: تجنب ميثيل دوبا (خطر اكتئاب ما بعد الولادة)',
        messageEn: 'Methyldopa is strongly associated with an increased risk of severe postpartum depression (PPD), sedation, and psychomotor impairment. Avoid Methyldopa during the postpartum period, especially in women with personal or family history of mood disorders. Preferred postpartum antihypertensives compatible with breastfeeding: Labetalol, Enalapril, or Nifedipine ER.',
        messageAr: 'يرتبط عقار ميثيل دوبا (Methyldopa) بزيادة خطر الإصابة باكتئاب ما بعد الولادة (Postpartum Depression) والخمول الشديد. تجنب ميثيل دوبا بعد الولادة تماماً، ويفضل استخدام لابيتاول أو إنالابريل أو نيفيديبين ممتد المفعول، وهي آمنة تماماً مع الرضاعة الطبيعية.',
        actionEn: 'Avoid/taper Methyldopa postpartum; use Labetalol, Enalapril, or Nifedipine ER (breastfeeding safe).',
        actionAr: 'تجنب ميثيل دوبا بعد الولادة واستخدم لابيتاول أو إنالابريل أو نيفيديبين ممتد المفعول.'
      };
      alerts.push(methyldopaDepressionWarning);
    }

    // 4. Preeclampsia Aspirin prophylaxis (weeks 12-36)
    const aspirinIndicated = !isPostpartum && (weeks >= 12 && weeks <= 36);
    const aspirinProphylaxis = {
      indicated: aspirinIndicated,
      dose: '81–162 mg once daily at bedtime (recommended: 81–150 mg/day)',
      timing: 'Start between weeks 12 and 16, continue until 36 weeks (or delivery)',
      titleEn: 'Preeclampsia Prevention: Low-Dose Aspirin Prophylaxis (Weeks 12–36)',
      titleAr: 'الوقاية من تسمم الحمل: أسبرين أطفال وقائي (الأسابيع 12–36)',
      messageEn: `Gestational age is ${weeks} weeks (within the critical 12–36 weeks window). Low-dose Aspirin (81–150 mg/day, taken at bedtime) is strongly recommended for women with chronic hypertension, gestational hypertension, prior preeclampsia, diabetes, or multiple gestation to significantly reduce the risk of preeclampsia, preterm birth, and fetal growth restriction.`,
      messageAr: `عمر الحمل ${weeks} أسبوعاً (ضمن الفترة المستهدفة 12–36 أسبوعاً). يُوصى بشدة ببدء أسبرين الأطفال (81-150 مجم يومياً قبل النوم) للوقاية من تسمم الحمل (Preeclampsia) وتأخر نمو الجنين والولادة المبكرة.`
    };
    if (aspirinIndicated) {
      alerts.push({
        id: 'htn-preg-aspirin-prophylaxis',
        level: 'info',
        type: 'info',
        titleEn: aspirinProphylaxis.titleEn,
        titleAr: aspirinProphylaxis.titleAr,
        messageEn: aspirinProphylaxis.messageEn,
        messageAr: aspirinProphylaxis.messageAr,
        actionEn: 'Prescribe Aspirin 81–150 mg PO daily at bedtime until 36 weeks gestation.',
        actionAr: 'وصف أسبرين أطفال 81-150 مجم يومياً قبل النوم حتى الأسبوع 36 من الحمل.'
      });
    }

    // 5. Asthma-aware first-line selection
    // Pivot to Nifedipine ER when maternal asthma is true, Labetalol when asthma is false.
    let firstLineDrug = {};
    if (hasAsthma) {
      firstLineDrug = {
        drugId: 'nifedipine_er',
        drugName: 'Nifedipine Extended-Release (ER)',
        drugNameAr: 'نيفيديبين ممتد المفعول (Nifedipine ER)',
        tradeNames: ['Adalat LA', 'Procardia XL', 'Epilat Retard'],
        doseEn: '30 mg orally once daily (titrate up to 60–90 mg once daily as needed; max 120 mg/day)',
        doseAr: '30 مجم فموياً مرة واحدة يومياً صباحاً (يمكن زيادتها إلى 60-90 مجم عند الحاجة، الجرعة القصوى 120 مجم)',
        reasonEn: 'Maternal asthma present: Beta-blockers (including Labetalol) carry significant bronchospasm risk and are contraindicated/avoided. Nifedipine ER (dihydropyridine CCB) is the preferred asthma-safe first-line antihypertensive in pregnancy.',
        reasonAr: 'المريضة تعاني من الربو الشعبي: تُمنع حاصرات بيتا (بما فيها لابيتاول) لخطر التشنج الشعبي الحاد. نيفيديبين ممتد المفعول (Nifedipine ER) هو الخيار الأول الآمن لمرضى الربو والحمل.',
        asthmaAware: true
      };
    } else {
      firstLineDrug = {
        drugId: 'labetalol',
        drugName: 'Labetalol',
        drugNameAr: 'لابيتاول (Labetalol)',
        tradeNames: ['Trandate', 'Labetalol'],
        doseEn: '100–200 mg orally twice daily (titrate weekly up to 400–800 mg twice daily; max 2400 mg/day)',
        doseAr: '100–200 مجم فموياً مرتين يومياً (تتم المعايرة تدريجياً حتى 400-800 مجم مرتين يومياً؛ الحد الأقصى 2400 مجم/يوم)',
        reasonEn: 'First-line standard oral antihypertensive for chronic/gestational hypertension in pregnancy. Safe in non-asthmatic mothers.',
        reasonAr: 'الخيار العلاجي الأول القياسي لارتفاع ضغط الدم أثناء الحمل للأمهات غير المصابات بالربو الشعبي.',
        asthmaAware: false
      };
    }

    const alternativeDrugs = [
      {
        drugName: 'Methyldopa (Aldomet)',
        drugNameAr: 'ميثيل دوبا (ألدوميت)',
        doseEn: '250 mg orally twice or thrice daily (max 2000–3000 mg/day)',
        doseAr: '250 مجم فموياً مرتين إلى ثلاث مرات يومياً (الحد الأقصى 2000-3000 مجم/يوم)',
        notesEn: 'Established fetal safety record; note sedation side-effect and avoid postpartum due to depression risk.',
        notesAr: 'آمن تاريخياً على الجنين، يسبب الخمول، ويُمنع في فترة النفاس لتجنب اكتئاب ما بعد الولادة.'
      },
      {
        drugName: hasAsthma ? 'Hydralazine' : 'Nifedipine ER',
        drugNameAr: hasAsthma ? 'هيدرالازين' : 'نيفيديبين ممتد المفعول',
        doseEn: hasAsthma ? '10–25 mg orally 3–4 times daily' : '30–60 mg orally once daily',
        doseAr: hasAsthma ? '10–25 مجم 3-4 مرات يومياً' : '30–60 مجم مرة واحدة يومياً'
      }
    ];

    const steps = [];

    // Preeclampsia Aspirin prophylaxis step (weeks 12-36)
    if (isPregnant && (weeks >= 12 && weeks <= 36)) {
      steps.push({
        code: 'PREECLAMPSIA_ASPIRIN_PROPHYLAXIS',
        step: 0,
        titleEn: 'Preeclampsia Prevention: Low-Dose Aspirin Prophylaxis (Weeks 12–36)',
        titleAr: 'الوقاية من تسمم الحمل: أسبرين أطفال وقائي (الأسابيع 12–36)',
        drugEn: 'Aspirin 81–150 mg daily at bedtime',
        drugAr: 'أسبرين أطفال 81-150 مجم يومياً قبل النوم',
        timing: 'Weeks 12 to 36',
        descriptionEn: 'Start between weeks 12 and 16, continue until 36 weeks gestation or delivery.'
      });
    }

    // Step 1: Asthma-aware selection
    if (hasAsthma) {
      steps.push({
        code: 'PREGNANCY_HTN_STEP_1_NIFEDIPINE',
        step: 1,
        drugId: 'nifedipine_er',
        drugEn: 'Nifedipine ER 30 mg PO once daily',
        drugAr: 'نيفيديبين ممتد المفعول 30 مجم فموياً مرة واحدة يومياً',
        titleEn: 'Step 1 (Asthma-Aware): Nifedipine ER',
        titleAr: 'الخطوة الأولى (مع مراعاة الربو): نيفيديبين ممتد المفعول',
        reasonEn: 'Maternal asthma present: Beta-blockers (Labetalol) carry significant bronchospasm risk and are contraindicated/avoided. Nifedipine ER (dihydropyridine CCB) is the preferred asthma-safe first-line antihypertensive in pregnancy.',
        reasonAr: 'المريضة تعاني من الربو: لابيتاول ممنوع لتجنب نوبات الربو والتشنج الشعبي. نيفيديبين ممتد المفعول هو الخيار الأول الآمن.'
      });
    } else {
      steps.push({
        code: 'PREGNANCY_HTN_STEP_1_LABETALOL',
        step: 1,
        drugId: 'labetalol',
        drugEn: 'Labetalol 100–200 mg PO twice daily',
        drugAr: 'لابيتاول 100-200 مجم فموياً مرتين يومياً',
        titleEn: 'Step 1: Labetalol',
        titleAr: 'الخطوة الأولى: لابيتاول',
        reasonEn: 'First-line standard oral antihypertensive for chronic/gestational hypertension in pregnancy.',
        reasonAr: 'الخيار العلاجي الأول القياسي لارتفاع ضغط الدم أثناء الحمل.'
      });
    }

    return {
      isPregnant,
      isPostpartum,
      gestationalWeeks: weeks,
      hasAsthma,
      isSevereEmergency,
      firstLine: firstLineDrug,
      firstLineSelection: firstLineDrug,
      firstLineDrug,
      alternatives: alternativeDrugs,
      aspirinProphylaxis,
      methyldopaDepressionWarning,
      stoppedDrugs,
      alerts,
      steps,
      targetBpEn: 'Systolic 120–135 mmHg and Diastolic 80–85 mmHg (avoid DBP < 80 to preserve placental perfusion)',
      targetBpAr: 'الضغط الانقباضي 120-135 ملم زئبق والانبساطي 80-85 ملم زئبق (تجنب انخفاض الانبساطي عن 80 للحفاظ على تدفق دم المشيمة)'
    };
  }

  return {
    evaluatePregnancyHtnProtocol
  };
})();

if (typeof window !== 'undefined') {
  window.OsrawyHtnPregnancy = OsrawyHtnPregnancy;
  window.HtnEngine = window.HtnEngine || {};
  window.HtnEngine.OsrawyHtnPregnancy = OsrawyHtnPregnancy;
  window.HtnEngine.evaluatePregnancyHtnProtocol = OsrawyHtnPregnancy.evaluatePregnancyHtnProtocol;
}

if (typeof global !== 'undefined') {
  global.OsrawyHtnPregnancy = OsrawyHtnPregnancy;
  global.HtnEngine = global.HtnEngine || {};
  global.HtnEngine.OsrawyHtnPregnancy = OsrawyHtnPregnancy;
  global.HtnEngine.evaluatePregnancyHtnProtocol = OsrawyHtnPregnancy.evaluatePregnancyHtnProtocol;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports.OsrawyHtnPregnancy = OsrawyHtnPregnancy;
  module.exports.evaluatePregnancyHtnProtocol = OsrawyHtnPregnancy.evaluatePregnancyHtnProtocol;
}
