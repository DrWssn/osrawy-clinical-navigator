
/* ================= Drug knowledge base ================= */
/* br: brands cheapest-first; orig: index of originator brand; tier 1 low · 2 moderate · 3 high */
const D={
  met:{cls:"Biguanide",name:"Metformin",br:["Cidophage","Glucophage / Glucophage XR"],orig:1,tier:1,
    dose:"500 mg once–twice daily with meals; +500 mg weekly → 2000 mg/day (XR max 2000 mg)",
    renal:e=>e<30?"Contraindicated (eGFR <30)":e<45?"eGFR 30–44: max 1000 mg/day; do not start new":"No adjustment",
    caut:"GI upset (use XR), B12 deficiency; hold for contrast if eGFR <60 or acute illness",
    rx:(p,b)=>p.egfr<45?{b:`${b} 500 mg tab`,s:"1 tab twice daily after meals (max 1000 mg/day)",a:"قرص بعد الفطار وقرص بعد العشا"}
      :{b:`${b} 500 mg tab`,s:"1 tab twice daily after meals; after 2 weeks 1000 mg twice daily",a:"قرص بعد الفطار وقرص بعد العشا، وبعد أسبوعين الجرعة تزيد حسب تعليمات الطبيب"}},
  gliclazide:{cls:"Sulfonylurea",name:"Gliclazide MR",br:["Diamicron MR 30 / 60"],orig:0,tier:1,
    dose:"30 mg with breakfast → max 120 mg/day",renal:e=>e<30?"Avoid (eGFR <30)":"Lowest dose; watch hypoglycemia",
    caut:"Hypoglycemia, weight gain. Lowest hypo risk among SUs. Reduce/stop when adding insulin",
    rx:(p,b)=>({b:"Diamicron MR 30 mg tab",s:"1 tab once daily with breakfast",a:"قرص مع الفطار — ما تفوّتش الوجبة"})},
  glimepiride:{cls:"Sulfonylurea",name:"Glimepiride",br:["Dolcyl","Glimaryl","Amaryl"],orig:2,tier:1,
    dose:"1 mg with breakfast → 4 mg (max 8 mg)",renal:e=>e<30?"Avoid (eGFR <30)":"Start 1 mg",
    caut:"Hypoglycemia (more in elderly), weight gain",
    rx:(p,b)=>({b:`${b} 1 mg tab`,s:"1 tab once daily before breakfast",a:"قرص قبل الفطار — ما تفوّتش الوجبة"})},
  pio:{cls:"Thiazolidinedione",name:"Pioglitazone",br:["Pioglitazone local generics"],orig:0,tier:1,
    dose:"15 mg daily → 30 mg (max 45 mg)",renal:()=>"No adjustment",
    caut:"Contraindicated in heart failure. Edema, weight gain, fractures. Helps MASLD",
    rx:()=>({b:"Pioglitazone 15 mg tab (local generic)",s:"1 tab once daily",a:"قرص مرة يوميًا"})},
  vilda:{cls:"DPP-4 inhibitor",name:"Vildagliptin",br:["Gliptus","Veldaglose","Galvus"],orig:2,tier:2,
    dose:"50 mg twice daily (once daily with SU)",renal:e=>e<50?"50 mg once daily (eGFR <50)":"50 mg twice daily",
    caut:"Check LFTs; avoid in hepatic impairment. Do not combine with GLP-1 RA",
    rx:(p,b)=>p.egfr<50?{b:`${b} 50 mg tab`,s:"1 tab once daily",a:"قرص مرة يوميًا"}:{b:`${b} 50 mg tab`,s:"1 tab twice daily",a:"قرص الصبح وقرص بالليل"}},
  sita:{cls:"DPP-4 inhibitor",name:"Sitagliptin",br:["Sitagliptin local generics","Januvia"],orig:1,tier:2,
    dose:"100 mg once daily",renal:e=>e<30?"25 mg daily (eGFR <30)":e<45?"50 mg daily (eGFR 30–44)":"100 mg",
    caut:"Do not combine with GLP-1 RA. Rare pancreatitis, bullous pemphigoid",
    rx:(p,b)=>({b:`${b==="Januvia"?"Januvia":"Sitagliptin"} ${p.egfr<30?25:p.egfr<45?50:100} mg tab`,s:"1 tab once daily",a:"قرص مرة يوميًا"})},
  lina:{cls:"DPP-4 inhibitor",name:"Linagliptin",br:["Trajenta"],orig:0,tier:2,
    dose:"5 mg once daily",renal:()=>"No adjustment at any eGFR",caut:"Best DPP-4i choice in advanced CKD",
    rx:()=>({b:"Trajenta 5 mg tab",s:"1 tab once daily",a:"قرص مرة يوميًا"})},
  dapa:{cls:"SGLT2 inhibitor",name:"Dapagliflozin",br:["Dapagloznal","Dapaglif","Dapagliflozin-EVA","Forflozin","Forxiga"],orig:4,tier:2,
    dose:"10 mg once daily",renal:e=>e<25?"Do not start (eGFR <25); continue until dialysis":e<45?"Start for heart/kidney protection; weak glucose effect":"No adjustment",
    caut:"Genital infection, volume depletion, euglycemic DKA (hold 3 days before surgery, acute illness or prolonged fasting)",
    rx:(p,b)=>({b:`${b} 10 mg tab`,s:"1 tab once daily in the morning",a:"قرص الصبح — اشرب مية كفاية واهتم بالنظافة الشخصية"})},
  empa:{cls:"SGLT2 inhibitor",name:"Empagliflozin",br:["Jardiance"],orig:0,tier:2,
    dose:"10 mg once daily → 25 mg for glycemia",renal:e=>e<20?"Do not start (eGFR <20)":e<45?"10 mg for heart/kidney protection":"No adjustment",
    caut:"As dapagliflozin",rx:()=>({b:"Jardiance 10 mg tab",s:"1 tab once daily in the morning",a:"قرص الصبح — اشرب مية كفاية واهتم بالنظافة الشخصية"})},
  sema:{cls:"GLP-1 RA",name:"Semaglutide weekly",br:["Ozempic"],orig:0,tier:3,
    dose:"0.25 mg weekly × 4 wk → 0.5 → 1 → 2 mg (step ≥4 wk)",renal:()=>"No adjustment; avoid dehydration",
    caut:"Nausea, gallstones, retinopathy worsening with rapid A1c fall. Avoid in MTC/MEN2, pancreatitis, gastroparesis",
    rx:()=>({b:"Ozempic 0.25 mg pen",s:"0.25 mg SC once weekly × 4 weeks, then 0.5 mg weekly",a:"حقنة تحت الجلد مرة في الأسبوع في نفس اليوم"})},
  osema:{cls:"GLP-1 RA",name:"Semaglutide oral",br:["Rybelsus"],orig:0,tier:3,
    dose:"3 mg daily × 30 d → 7 mg → 14 mg; empty stomach",renal:()=>"No adjustment",caut:"As semaglutide",
    rx:()=>({b:"Rybelsus 3 mg tab",s:"1 tab daily on empty stomach × 30 days, then 7 mg",a:"قرص على الريق بنص كوباية مية، وما تاكلش لمدة نص ساعة"})},
  dula:{cls:"GLP-1 RA",name:"Dulaglutide",br:["Trulicity"],orig:0,tier:3,
    dose:"0.75 mg weekly → 1.5 → 3 → 4.5 mg",renal:()=>"No adjustment",caut:"GLP-1 RA class; CV benefit (REWIND)",
    rx:()=>({b:"Trulicity 0.75 mg pen",s:"0.75 mg SC once weekly",a:"حقنة تحت الجلد مرة في الأسبوع"})},
  lira:{cls:"GLP-1 RA",name:"Liraglutide",br:["Victoza"],orig:0,tier:3,
    dose:"0.6 mg daily × 1 wk → 1.2 → 1.8 mg",renal:()=>"No adjustment",caut:"GLP-1 RA class; CV benefit (LEADER)",
    rx:()=>({b:"Victoza pen",s:"0.6 mg SC daily × 1 week, then 1.2 mg daily",a:"حقنة تحت الجلد مرة يوميًا"})},
  tirz:{cls:"GIP/GLP-1 RA",name:"Tirzepatide",br:["Mounjaro"],orig:0,tier:3,
    dose:"2.5 mg weekly × 4 wk → +2.5 mg every 4 wk → 5–15 mg",renal:()=>"No adjustment",caut:"Largest A1c and weight reduction. GLP-1 RA contraindications",
    rx:()=>({b:"Mounjaro 2.5 mg",s:"2.5 mg SC once weekly × 4 weeks, then 5 mg weekly",a:"حقنة تحت الجلد مرة في الأسبوع في نفس اليوم"})},
  nph:{cls:"Insulin",name:"NPH human insulin",br:["Insulatard","Humulin N"],orig:0,tier:1,
    dose:"10 U or 0.1–0.2 U/kg at bedtime; see Insulin calculator",renal:e=>e<30?"Start 0.1 U/kg":"Standard",
    caut:"Nocturnal hypoglycemia more than analogues; inject at bedtime",
    rx:(p,b)=>p.curIns?{b:"Basal insulin (current product)",s:"Continue current dose; adjust 2 IU every 3 days to fasting 80–130 mg/dL",a:"استمر على نفس الجرعة وعدّلها حسب سكر الصايم"}
      :{b:`${b} 100 IU/mL pen`,s:`${p.basalDose} IU SC at bedtime; +2 IU every 3 days until fasting 80–130 mg/dL; −4 IU if <70`,a:`${p.basalDose} وحدة تحت الجلد قبل النوم، وزوّد وحدتين كل 3 أيام لحد ما الصايم يبقى بين 80 و130`}},
  glarg:{cls:"Insulin",name:"Basal analogue",br:["Lantus","Toujeo","Tresiba"],orig:0,tier:3,
    dose:"10 U or 0.1–0.2 U/kg once daily; see Insulin calculator",renal:e=>e<30?"Start 0.1 U/kg":"Standard",
    caut:"Less nocturnal hypoglycemia than NPH; higher cost",
    rx:(p,b)=>p.curIns?{b:"Basal insulin (current product)",s:"Continue current dose; adjust 2 IU every 3 days to fasting 80–130 mg/dL",a:"استمر على نفس الجرعة وعدّلها حسب سكر الصايم"}
      :{b:`${b} SoloStar 100 IU/mL`,s:`${p.basalDose} IU SC once daily at the same time; +2 IU every 3 days until fasting 80–130 mg/dL; −4 IU if <70`,a:`${p.basalDose} وحدة تحت الجلد مرة يوميًا في نفس الميعاد، وزوّد وحدتين كل 3 أيام لحد ما الصايم يبقى بين 80 و130`}},
  atorva:{cls:"Statin",name:"Atorvastatin",br:["Ator","Lipitor"],orig:1,tier:1,
    dose:"20 mg (moderate) or 40–80 mg (high intensity) at night",renal:()=>"No adjustment",caut:"ALT at baseline; myalgia",
    rx:(p,b)=>({b:`${b} ${p.ascvd?40:20} mg tab`,s:"1 tab once daily at night",a:"قرص بالليل"})}
};
const CC={"Biguanide":"leaf","Sulfonylurea":"sun","Thiazolidinedione":"sun","DPP-4 inhibitor":"sky","SGLT2 inhibitor":"teal","GLP-1 RA":"grape","GIP/GLP-1 RA":"grape","Insulin":"coral","Statin":"sky"};
const cv=c=>`--c:var(--${c});--cs:var(--${c}-soft)`;
const TIER={1:["t1","● Low cost"],2:["t2","●● Moderate"],3:["t3","●●● High cost"]};
const costChip=t=>`<span class="cost ${TIER[t][0]}">${TIER[t][1]}</span>`;
const clsChip=k=>`<span class="chip" style="${cv(CC[D[k].cls])}">${D[k].cls}</span>`;
const grp=k=>D[k].cls.includes("GLP")?"GLP":D[k].cls;

/* ================= Helpers ================= */
const $=id=>document.getElementById(id);
const num=id=>parseFloat($(id).value);
const on=id=>$(id).checked;
let SHOWN=new Set(), CM=true;
function brandsHTML(k){const b=D[k].br;return CM?`<span class="first">${b[0]}</span>${b.length>1?" · "+b.slice(1).join(" · "):""}`:b.join(" · ");}
function drugBlock(keys,egfr){
  return keys.map(k=>{const d=D[k];
    const box=SHOWN.has(k)?`<span class="rx-same">listed above</span>`:`<label class="rx-pick"><input type="checkbox" class="rxck" data-k="${k}">Prescribe</label>`;
    SHOWN.add(k);
    return `<div class="drug"><div class="drug-h"><span class="nm"><b>${d.name}</b>${costChip(d.tier)}</span>${box}</div>
    <div class="brands">${brandsHTML(k)}</div>
    <span class="dose">${d.dose}</span><span class="renal">eGFR ${isNaN(egfr)?"?":egfr}: ${d.renal(egfr)}</span></div>`;}).join("");
}
const PC={1:"coral",2:"teal",3:"sun"};
function step(pri,kicker,title,why,keys){return {pri,kicker,title,why,keys:keys||[]};}
function stepHTML(s,egfr){
  return `<div class="step" style="${cv(PC[s.pri])}"><div class="k">${s.kicker}</div><h4>${s.title}</h4><p>${s.why}</p>${s.keys.length?drugBlock(s.keys,egfr):""}</div>`;
}

/* ================= Personalised screening ================= */
function screening(p){
  const G=[];
  const A=(g,c,items)=>{const it=items.filter(Boolean);if(it.length)G.push({g,c,items:it});};
  const I=(t,w,y,now)=>({t,w,y,now});
  let kidF="Yearly";
  if(p.egfr<30) kidF="Every 3 months"; else if(p.egfr<45||p.uacr>300) kidF="Every 3–4 months"; else if(p.egfr<60||p.uacr>=30) kidF="Every 6 months";
  A("Diabetes control","teal",[
    I("HbA1c",p.a1c>p.target?"Every 3 months (above target)":"Every 6 months (at target)","Adjust therapy until at goal",true),
    I("Home glucose log",p.ins?"Daily fasting ± pre-meal":"2–3 times per week","Review at each visit"),
    I("Hypoglycemia review","Every visit",p.hypo||p.ins?"High risk: insulin, SU or age":"Ask about symptoms"),
  ]);
  A("Complications","coral",[
    I("Dilated eye exam / retinal photo",p.dur<1?"Now (at diagnosis), then yearly":"Yearly (every 1–2 y if no retinopathy)","Diabetic retinopathy",p.dur<1),
    I("UACR + creatinine/eGFR",kidF,p.ckd?`CKD: eGFR ${p.egfr}, UACR ${p.uacr}`:"Diabetic kidney disease",true),
    p.egfr<30||p.uacr>300?I("Nephrology referral","Now",p.egfr<30?"eGFR <30":"UACR >300 mg/g",true):null,
    I("Comprehensive foot exam",p.ascvd||p.dur>=10?"Every visit (high risk) + yearly full exam":"Yearly; inspect feet every visit","10-g monofilament, vibration, pulses, deformity"),
    I("Neuropathy symptoms","Yearly","Including autonomic: postural dizziness, gastroparesis, ED"),
    p.age>=65||p.dur>=10||p.ascvd?I("Ankle-brachial index (ABI)","Now, repeat if symptoms",p.age>=65?"Age ≥65":p.dur>=10?"Diabetes ≥10 years":"ASCVD",true):null,
  ]);
  A("Heart & lipids","sky",[
    I("Blood pressure","Every visit","Target <130/80"),
    I("Lipid profile","Yearly",p.ascvd?"LDL goal <55 mg/dL":"LDL goal <70 mg/dL",true),
    p.age>=40||p.ascvd?I("ECG","Baseline, then if symptoms","Silent ischemia, LVH",true):null,
    I("NT-proBNP","Consider yearly","Detect asymptomatic heart failure"),
    p.hf!=="none"?I("Echocardiography","If not done in 1 year","Heart failure follow-up"):null,
  ]);
  A("Liver & drug safety","sun",[
    I("ALT, AST, platelets → FIB-4",p.masld?"Now; FIB-4 ≥1.3 → FibroScan":"At diagnosis, then every 1–3 y","MASLD fibrosis risk",true),
    p.met?I("Vitamin B12","Yearly on metformin","Especially with neuropathy or anemia",p.dur>=4):null,
    p.sglt&&p.egfr<60?I("Creatinine & potassium","2–4 weeks after starting SGLT2i","Expected small eGFR dip"):null,
    p.ins?I("Injection sites","Every visit","Lipohypertrophy causes erratic glucose"):null,
  ]);
  const cancer=[];
  if(p.age>=45&&p.age<=75) cancer.push(I("Colorectal cancer screening","FIT yearly or colonoscopy every 10 y","Age 45–75; risk higher in diabetes"));
  if(p.sex==="f"&&p.age>=40&&p.age<=74) cancer.push(I("Mammography","Every 2 years","Women 40–74"));
  if(p.sex==="f"&&p.age>=21&&p.age<=65) cancer.push(I("Cervical screening",p.age>=30?"HPV test every 5 y (or Pap every 3 y)":"Pap every 3 y","Women 21–65"));
  if(p.smoker&&p.age>=50&&p.age<=80) cancer.push(I("Low-dose chest CT","Yearly","Smoker 50–80 with ≥20 pack-years"));
  if(p.sex==="m"&&p.age>=55&&p.age<=69) cancer.push(I("PSA","Shared decision","Men 55–69"));
  if(p.sex==="m"&&p.smoker&&p.age>=65&&p.age<=75) cancer.push(I("Abdominal aortic aneurysm US","Once","Men 65–75 who ever smoked"));
  if((p.sex==="f"&&p.age>=65)||(p.sex==="m"&&p.age>=70)||(p.pio&&p.sex==="f"&&p.age>=50)) cancer.push(I("Bone density (DXA)","Every 2 years",p.pio?"On pioglitazone + age":"Osteoporosis risk"));
  A("Age & sex-based","grape",cancer);
  A("Vaccines","leaf",[
    I("Influenza","Every year","All with diabetes"),
    I("Pneumococcal (PCV20 or PCV21)","Once if not given","All adults with diabetes"),
    p.age<60?I("Hepatitis B","3 doses if unvaccinated","Age 19–59"):I("Hepatitis B","Consider","Age ≥60"),
    p.age>=50?I("Herpes zoster (Shingrix)","2 doses, 2–6 months apart","Age ≥50"):null,
    p.age>=50?I("RSV","Single dose","Age ≥50 with diabetes"):null,
    I("COVID-19, Td/Tdap","Per national schedule; Td every 10 y",""),
  ]);
  A("Mental health & lifestyle","teal",[
    I("Depression (PHQ-2 → PHQ-9) & diabetes distress","At diagnosis, then yearly",""),
    p.age>=65?I("Cognitive screening, falls & frailty","Yearly","Age ≥65; simplify regimen if impaired"):null,
    p.bmi>=30?I("Sleep apnea (STOP-BANG)","Once, then if symptoms",`BMI ${p.bmi.toFixed(1)}`):null,
    p.smoker?I("Smoking cessation","Every visit","Offer counselling ± pharmacotherapy"):null,
    p.sex==="f"&&p.age<50?I("Contraception / pre-pregnancy counselling","Every visit","Stop SGLT2i, GLP-1 RA, statin before conception"):null,
    p.sex==="m"?I("Erectile dysfunction","Ask yearly",""):null,
    I("Dental exam","Yearly","Periodontitis worsens glycemia"),
    I("Ramadan risk assessment","6–8 weeks before Ramadan","If the patient plans to fast"),
  ]);
  return G;
}
function screeningHTML(G){
  return `<div class="scr-groups">${G.map(g=>`<div class="sg" style="${cv(g.c)}"><div class="sg-h">${g.g}<span>${g.items.length}</span></div>
    ${g.items.map(i=>`<div class="si"><div class="t">${i.t}${i.now?'<span class="now">NOW</span>':""}</div><div class="w">${i.w}</div>${i.y?`<div class="y">${i.y}</div>`:""}</div>`).join("")}</div>`).join("")}</div>`;
}

/* ================= Recommendation engine ================= */
let RXP={}, RXDEF=new Set(), RXUSER={}, SCRG=[];
function plan(){
  CM=on("cheap");
  const age=num("age"),sex=$("sex").value,wt=num("wt"),ht=num("ht"),dur=num("dur")||0,a1c=num("a1c"),fpg=num("fpg"),egfr=num("egfr"),uacr=num("uacr")||0,hf=$("hf").value;
  const bmi=wt&&ht?wt/((ht/100)**2):NaN;
  const ascvd=on("ascvd"),hrisk=on("hrisk"),masld=on("masld"),smoker=on("smoker"),hypo=on("hypo"),frail=on("frail"),catab=on("catab"),
        pancr=on("pancr"),geni=on("geni"),preg=on("preg");
  const cur={met:on("c-met"),su:on("c-su"),dpp:on("c-dpp"),sglt:on("c-sglt"),glp:on("c-glp"),pio:on("c-pio"),ins:on("c-ins")};
  const ckd=egfr<60||uacr>=30;
  const obese=bmi>=30||(bmi>=27&&(masld||ascvd||hrisk));

  let target=7.0,tnote="Most non-pregnant adults";
  if(frail){target=8.0;tnote="Frail / limited life expectancy";}
  else if(age>=75||hypo){target=7.5;tnote="Older or high hypoglycemia risk";}
  else if(age<50&&!ascvd&&!ckd&&!hypo){tnote="Consider <6.5% if reachable without hypoglycemia";}
  const gap=a1c-target;

  let h=`<div class="ph"><span class="ic">2</span><h2>Treatment plan</h2></div>`;
  const chips=[`<span class="chip">BMI ${isNaN(bmi)?"–":bmi.toFixed(1)}</span>`];
  if(CM) chips.push(`<span class="chip" style="${cv("leaf")}">Cheapest-first mode</span>`);
  if(ckd) chips.push(`<span class="chip" style="${cv("sun")}">CKD${egfr<60?` · eGFR ${egfr}`:""}${uacr>=30?` · UACR ${uacr}`:""}</span>`);
  if(hf!=="none") chips.push(`<span class="chip" style="${cv("coral")}">Heart failure</span>`);
  if(ascvd) chips.push(`<span class="chip" style="${cv("coral")}">ASCVD</span>`);
  if(obese) chips.push(`<span class="chip" style="${cv("grape")}">Weight priority</span>`);
  if(masld) chips.push(`<span class="chip" style="${cv("sun")}">MASLD</span>`);
  if(hypo||frail) chips.push(`<span class="chip" style="${cv("sky")}">Avoid hypoglycemia</span>`);
  h+=`<div class="summary">${chips.join("")}</div>`;
  const pos=v=>Math.min(100,Math.max(0,(v-5)/8*100));
  h+=`<div class="gauge-box"><div class="g-top">
      <div><div class="lbl">Current HbA1c</div><div class="big" style="color:var(--${gap>0?"coral":"leaf"})">${isNaN(a1c)?"–":a1c.toFixed(1)}%</div></div>
      <div><div class="lbl">Target</div><div class="big">&lt;${target.toFixed(1)}%</div></div>
      <div class="txt">${tnote}. Fasting 80–130 mg/dL, post-meal &lt;180.<br>${gap>0?`<b style="color:var(--coral)">${gap.toFixed(1)}% above target</b>`:`<b style="color:var(--leaf)">At target</b>`}</div></div>
      <div class="gauge"><span class="tg" style="left:${pos(target)}%"></span>${isNaN(a1c)?"":`<span class="mk" style="left:${pos(a1c)}%"></span>`}</div>
      <div class="g-scale"><span>5%</span><span>7%</span><span>9%</span><span>11%</span><span>13%</span></div></div>`;

  const P={age,sex,wt,bmi,dur,a1c,target,egfr,uacr,ckd,ascvd,hf,masld,smoker,hypo:hypo||frail,obese,met:cur.met,ins:cur.ins,pio:cur.pio,sglt:cur.sglt};

  if(preg){
    h+=`<div class="callout" style="${cv("coral")}"><b>Pregnancy / planning pregnancy:</b> insulin is the treatment of choice (NPH and regular insulin are low cost). Stop SGLT2i, GLP-1 RA, DPP-4i, SU, pioglitazone and statin; metformin only with specialist advice. Start folic acid and refer to a diabetes-in-pregnancy clinic. Targets: fasting &lt;95, 1-h &lt;140, 2-h &lt;120 mg/dL.</div>`;
    $("result").innerHTML=h; renderScreening(P); return;
  }

  const S=[],used=new Set(),avoid=[];
  const glpOK=!pancr, sgltOK=egfr>=20;
  const insKeys=CM?["nph","glarg"]:["glarg","nph"];
  const sev=catab||a1c>10||fpg>=300;

  if(sev){
    S.push(step(1,"Start now","Insulin is indicated",
      catab?"Catabolic features: start basal (or basal-bolus) insulin now. Check ketones; exclude DKA/HHS and type 1 diabetes (GAD antibodies if lean or young)."
           :`HbA1c ${a1c}% / FPG ${fpg} mg/dL: start basal insulin with oral agents. Many patients can step down once glucose toxicity resolves.${CM?" NPH at bedtime is the lowest-cost option.":""}`,insKeys));
    used.add("basal");
  }
  if(hf!=="none"){
    const activeMkt = (window.DrugDirectory && window.DrugDirectory.getMarket) ? window.DrugDirectory.getMarket() : 'saudi';
    if(sgltOK){S.push(step(1,"Heart protection · regardless of HbA1c","SGLT2 inhibitor for heart failure",
      `Reduces HF hospitalization and CV death in HFrEF and HFpEF.${CM?(activeMkt==='saudi'?" Proven cardiorenal benefit in heart failure.":" Local dapagliflozin generics keep the cost moderate."):""}`,["dapa","empa"]));used.add("sglt");}
    avoid.push("Pioglitazone (fluid retention, worsens HF)","Saxagliptin (HF hospitalization signal)");
  }
  if(ckd){
    if(sgltOK&&!used.has("sglt")){S.push(step(1,"Kidney protection · regardless of HbA1c","SGLT2 inhibitor for CKD",
      `${egfr<60?`eGFR ${egfr}`:""}${egfr<60&&uacr>=30?" with ":""}${uacr>=30?`albuminuria ${uacr} mg/g`:""}: slows kidney decline and lowers CV events. Continue until dialysis. Add ACEi/ARB at max tolerated dose if albuminuric.`,["dapa","empa"]));used.add("sglt");}
    if(!sgltOK) S.push(step(3,"Kidney","eGFR <20: SGLT2i not started","Use linagliptin, GLP-1 RA or insulin for glucose control. Refer to nephrology."));
    if(glpOK){
      if(CM) S.push(step(3,"If affordable","GLP-1 RA with kidney benefit","Semaglutide slows CKD progression (FLOW trial). Add when budget allows or targets are not met.",["sema"]));
      else {S.push(step(1,"Kidney + CV protection","GLP-1 RA with kidney benefit","Semaglutide reduces kidney progression and CV events in T2D with CKD.",["sema"]));used.add("glp");}
    }
  }
  if(ascvd||hrisk){
    if(CM){
      if(sgltOK&&!used.has("sglt")){S.push(step(1,"CV protection · lowest-cost proven option","SGLT2 inhibitor",
        "Reduces CV death and HF hospitalization; local generics cost far less than injectables.",["dapa","empa"]));used.add("sglt");}
      if(glpOK&&!used.has("glp")&&!ckd) S.push(step(3,"If affordable","GLP-1 RA with proven CV benefit","Reduces MI, stroke and CV death. Add when budget allows.",["sema","dula","lira"]));
    } else {
      if(glpOK&&!used.has("glp")){S.push(step(1,"CV protection · regardless of HbA1c","GLP-1 RA with proven CV benefit",
        ascvd?"Established ASCVD: reduces MI, stroke and CV death.":"High CV risk: GLP-1 RA or SGLT2i with proven benefit.",["sema","dula","lira"]));used.add("glp");}
      if(sgltOK&&!used.has("sglt")){S.push(step(3,"CV protection","Consider adding SGLT2 inhibitor","Additive cardiorenal benefit with GLP-1 RA.",["empa","dapa"]));used.add("sglt");}
    }
  }
  if((obese||masld)&&glpOK){
    if(!used.has("glp")){
      S.push(step(CM?3:2,CM?"If affordable":"Weight & metabolic",`${CM?"For weight: ":""}tirzepatide or semaglutide`,
        `${obese?`BMI ${bmi.toFixed(1)}: aim for 5–15% weight loss. `:""}${masld?"Improves fatty liver. ":""}Largest weight and HbA1c effect, but high cost.`,["tirz","sema"]));
      if(!CM) used.add("glp");
    } else S.push(step(3,"Weight","Escalate dose or switch to tirzepatide","For more weight loss once at full dose.",["tirz"]));
  }
  if(masld&&hf==="none"&&!CM) S.push(step(3,"Liver","Pioglitazone in MASLD","Improves steatohepatitis. Watch weight and edema.",["pio"]));

  if(egfr>=30) S.push(step(2,cur.met?"Continue":"Foundation · lowest cost",cur.met?"Continue metformin":"Metformin",
    cur.met?"Keep at maximum tolerated dose unless eGFR falls below 30.":"Cheapest drug, weight-neutral, no hypoglycemia. Start low with meals; XR if GI upset.",["met"]));
  else avoid.push("Metformin (eGFR <30)");

  if(gap>0&&!sev){
    if(gap>=1.5) S.push(step(2,"Intensity","HbA1c ≥1.5% above target: start two agents together","Combination from the start reaches target faster. Reassess every 3 months."));
    const C=[];
    const su={k:["gliclazide","glimepiride"],t:"Sulfonylurea",w:"Lowest-cost add-on with strong effect. Take with breakfast and do not skip meals. Gliclazide MR has the lowest hypoglycemia risk."};
    const pio={k:["pio"],t:"Pioglitazone",w:"Low cost, no hypoglycemia, durable effect; helps fatty liver. Watch weight gain and edema."};
    const activeMkt = (window.DrugDirectory && window.DrugDirectory.getMarket) ? window.DrugDirectory.getMarket() : 'saudi';
    const dppCost = activeMkt === 'saudi' ? 'Moderate cost (≈110–130 SAR/month). ' : 'Moderate cost with local generics (≈300 EGP/month). ';
    const sgltCost = activeMkt === 'saudi' ? 'Moderate cost (≈155–185 SAR/month). ' : 'Moderate cost with local generics (≈300 EGP/month). ';
    const dpp={k:egfr<30?["lina","vilda"]:["vilda",egfr<45?"lina":"sita"],t:"DPP-4 inhibitor",w:`${CM?dppCost:""}Weight-neutral, low hypoglycemia, safe in the elderly.`};
    const sg={k:["dapa","empa"],t:"SGLT2 inhibitor",w:`${CM?sgltCost:""}Modest weight loss, heart and kidney protection.`};
    const ins={k:insKeys,t:"Basal insulin",w:"For HbA1c far above target. NPH at bedtime is the lowest-cost insulin."};
    const glp={k:["sema","tirz","dula"],t:"GLP-1 RA or tirzepatide",w:"Most effective non-insulin option with weight loss and no hypoglycemia, but the highest cost."};
    const suOK=!(hypo||frail)&&!cur.su, pioOK=hf==="none"&&!cur.pio, dppOK=!used.has("glp")&&!cur.dpp&&!cur.glp, sgOK=!used.has("sglt")&&egfr>=45&&!geni&&!cur.sglt, glpOK2=glpOK&&!used.has("glp")&&!cur.glp;
    if(CM){ if(suOK)C.push(su); if(pioOK)C.push(pio); if(dppOK)C.push(dpp); if(sgOK)C.push(sg); if(gap>=2&&!cur.ins)C.push(ins); if(glpOK2)C.push(glp); }
    else  { if(glpOK2)C.push(glp); if(sgOK)C.push(sg); if(dppOK)C.push(dpp); if(suOK)C.push(su); if(pioOK)C.push(pio); if(gap>=2&&!cur.ins)C.push(ins); }
    const nAdd=gap>=1.5?2:1; let picked=0, pickedGLP=false;
    C.forEach((c,i)=>{
      const conflict=(c===dpp&&pickedGLP);
      const pri=(picked<nAdd&&!conflict)?2:3;
      if(pri===2){picked++; if(c===glp)pickedGLP=true;}
      S.push(step(pri,pri===2?`Glucose lowering · add-on ${picked}`:"Alternative",c.t,c.w,c.k));
    });
    if(cur.glp&&gap>=1&&!cur.ins) S.push(step(2,"Next step","Add basal insulin","Already on GLP-1 RA: add basal insulin.",insKeys));
  }
  if(cur.ins) S.push(step(3,"Insulin review","Check for overbasalization",
    `If basal dose >0.5 U/kg (${wt?Math.round(wt*0.5):"–"} U here), bedtime-to-morning drop ≥50 mg/dL, or hypoglycemia: stop increasing basal and add prandial cover or GLP-1 RA.`));
  if(age>=40||ascvd||ckd) S.push(step(2,"CV risk · low cost","Statin",
    ascvd?"Established ASCVD: high-intensity statin, LDL <55 mg/dL.":"Diabetes age 40–75: at least moderate intensity, LDL <70 mg/dL.",["atorva"]));

  if(hypo||frail) avoid.push("Glibenclamide; avoid sulfonylureas where possible","De-intensify if HbA1c <6.5% on insulin or SU");
  if(cur.dpp&&(used.has("glp"))) avoid.push("Stop the DPP-4 inhibitor when starting a GLP-1 RA");
  if(pancr) avoid.push("GLP-1 RA, tirzepatide, DPP-4i (pancreatitis, MTC or MEN2 history)");
  if(geni) avoid.push("SGLT2i: use with caution; counsel on genital hygiene");
  if(cur.su&&(sev||cur.ins)) avoid.push("Reduce or stop sulfonylurea when insulin is intensified");

  S.sort((a,b)=>a.pri-b.pri);
  SHOWN=new Set();
  const PL={1:["Start first","urgent, heart or kidney protection"],2:["Core treatment",CM?"lowest cost first":"glucose control & foundation"],3:["Options","alternatives & add-ons"]};
  let lastP=0,body="";
  S.forEach(s=>{if(s.pri!==lastP){body+=`<div class="pri-h" style="${cv(PC[s.pri])}"><span class="n">${s.pri}</span><span>${PL[s.pri][0]} <small>· ${PL[s.pri][1]}</small></span></div>`;lastP=s.pri;}body+=stepHTML(s,egfr);});
  h+=`<div class="steps">${body}</div>`;

  // default prescription
  RXDEF=new Set(); const taken=new Set();
  S.filter(s=>s.pri<=2).forEach(s=>{
    const k=s.keys.find(x=>!taken.has(grp(x))&&!(grp(x)==="DPP-4 inhibitor"&&taken.has("GLP"))&&!(grp(x)==="GLP"&&taken.has("DPP-4 inhibitor")));
    if(k){RXDEF.add(k);taken.add(grp(k));}
  });
  RXP={egfr,ascvd,curIns:cur.ins,basalDose:Math.max(10,Math.round((wt||70)*(a1c>10||catab?0.2:0.15))),age,wt,ckd,hf,obese,masld,a1c,P};

  if(avoid.length) h+=`<div class="callout" style="${cv("coral")}"><b>Avoid / adjust</b><ul>${[...new Set(avoid)].map(a=>`<li>${a}</li>`).join("")}</ul></div>`;
  h+=`<div class="pri-h" style="${cv("sky")};margin-top:22px"><span class="n">S</span><span>Screening for this patient <small>· by condition, age and sex</small></span></div><div id="scrInline" style="margin-top:10px"></div>`;
  h+=`<div id="rxwrap"></div>`;
  $("result").innerHTML=h;
  document.querySelectorAll(".rxck").forEach(c=>{const k=c.dataset.k;c.checked=k in RXUSER?RXUSER[k]:RXDEF.has(k);});
  renderScreening(P);
  renderRx();
  $("iwt").value=$("wt").value; $("ifpg").value=$("fpg").value; icalc();
}
function renderScreening(P){
  const sel=[...document.querySelectorAll(".rxck")].filter(c=>c.checked).map(c=>c.dataset.k);
  P.sglt=P.sglt||sel.some(k=>grp(k)==="SGLT2 inhibitor");
  P.met=P.met||sel.includes("met"); P.ins=P.ins||sel.some(k=>grp(k)==="Insulin"); P.pio=P.pio||sel.includes("pio");
  SCRG=screening(P);
  const html=screeningHTML(SCRG);
  if($("scrInline")) $("scrInline").innerHTML=html;
  $("scrPersonal").innerHTML=html;
  $("scrwho").textContent=`${$("pname").value||"Current patient"} · ${P.sex==="f"?"female":"male"}, ${isNaN(P.age)?"?":P.age} y · diabetes ${P.dur} y. Updates from the Treatment tab.`;
}

/* ================= Prescription ================= */
function renderRx(){
  const w=$("rxwrap"); if(!w) return;
  const sel=[...new Set([...document.querySelectorAll(".rxck")].filter(c=>c.checked).map(c=>c.dataset.k))];
  const p=RXP; const name=$("pname").value;
  const warn=[],by={};
  sel.forEach(k=>{(by[grp(k)]=by[grp(k)]||[]).push(D[k].name);});
  Object.values(by).forEach(a=>{if(a.length>1)warn.push(`Same class twice: ${a.join(" + ")}. Keep one.`);});
  if(by["DPP-4 inhibitor"]&&by["GLP"]) warn.push("DPP-4 inhibitor + GLP-1 RA: no added benefit. Remove the DPP-4 inhibitor.");
  if(sel.includes("pio")&&p.hf!=="none") warn.push("Pioglitazone is contraindicated in heart failure.");
  if(sel.includes("met")&&p.egfr<30) warn.push("Metformin is contraindicated at eGFR <30.");
  const dx=["Type 2 diabetes mellitus"]; if(p.ckd)dx.push("CKD"); if(p.hf!=="none")dx.push("Heart failure"); if(p.obese)dx.push("Obesity"); if(p.masld)dx.push("MASLD");
  const today=new Date(),date=today.toLocaleDateString("en-GB"),fu=new Date(today.getTime()+90*864e5).toLocaleDateString("en-GB");
  const items=sel.map(k=>{const d=D[k];return d.rx(p,CM?d.br[0]:d.br[d.orig]);});
  const totalTier=sel.reduce((m,k)=>Math.max(m,D[k].tier),0);
  const inj=sel.some(k=>["sema","lira","dula","tirz","nph","glarg"].includes(k));
  const inv=SCRG.flatMap(g=>g.items.filter(i=>i.now).map(i=>i.t));
  const fuList=["review home glucose log and HbA1c"];
  if(sel.some(k=>["sema","lira","dula","tirz"].includes(k))) fuList.push("GI tolerance and dose step-up after 4 weeks");
  if(sel.some(k=>grp(k)==="Insulin")) fuList.push("phone review of fasting readings after 1 week");
  if(sel.some(k=>grp(k)==="SGLT2 inhibitor")) fuList.push("hold SGLT2i during acute illness, vomiting, surgery or prolonged fasting");
  const genAr=["نظام غذائي: قلّل السكريات والنشويات والعيش الأبيض، وزوّد الخضار","مشي 30 دقيقة 5 أيام في الأسبوع",
    "قياس السكر صايم"+(inj?" يوميًا":" مرتين في الأسبوع")+" وتسجيله",
    "لو حسيت برعشة أو عرق أو دوخة: قيس السكر، ولو أقل من 70 خد 3 معالق سكر في مية وكرر القياس بعد ربع ساعة"];
  const drSettings = (window.RxShare && window.RxShare.loadSettings) ? window.RxShare.loadSettings() : {
    doctorName: 'Dr Hossam Yousuf',
    doctorTitle: 'Consultant Family Medicine',
    clinicName: '',
    clinicPhone: '',
    clinicAddress: ''
  };
  let h=`<div class="rx-sec"><div class="rx-bar"><div class="pri-h" style="${cv("teal")};margin:0"><span class="n">℞</span><span>Prescription <small>· tick “Prescribe” on any drug above</small></span></div>
    <span>${totalTier?costChip(totalTier):""}</span>
    <div class="rx-action-toolbar" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
      <button type="button" class="btn btn-whatsapp" id="btn-share-whatsapp" onclick="RxShare.shareToWhatsApp()">📲 واتساب</button>
      <button type="button" class="btn btn-print" id="btn-print-rx" onclick="RxShare.printPrescription()">🖨️ طباعة / PDF</button>
      <button type="button" id="rxcopy" class="btn">📋 نسخ</button>
    </div>
  </div>`;
  if(warn.length) h+=`<div class="callout" style="${cv("coral")}">${warn.map(x=>`<div><b>Check:</b> ${x}</div>`).join("")}</div>`;
  h+=`<div class="rx" id="rxcard">
    <div class="rx-head">
      <div>
        <div class="rx-dr">${drSettings.doctorName || "Dr Hossam Yousuf"}</div>
        <div class="rx-ti">${drSettings.doctorTitle || "Consultant Family Medicine"}</div>
        ${drSettings.clinicName ? `<div class="rx-clinic" style="font-size:12px;opacity:.9;margin-top:2px">${drSettings.clinicName}</div>` : ""}
        ${drSettings.clinicPhone ? `<div class="rx-phone" style="font-size:11.5px;opacity:.8">${drSettings.clinicPhone}</div>` : ""}
      </div>
      <div class="rx-sym">℞</div>
    </div>
    <div class="rx-body">
    <div class="rx-pt"><span><i>Name</i>${name||"…………………"}</span><span><i>Age</i>${isNaN(p.age)?"—":p.age} y</span><span><i>Wt</i>${isNaN(p.wt)?"—":p.wt} kg</span><span><i>Date</i>${date}</span></div>
    <div class="rx-dx"><i>Dx</i>${dx.join(" · ")}</div>
    ${items.length?`<ol class="rx-list">${items.map(r=>`<li><b>${r.b}</b><div>${r.s}</div><div class="ar" dir="rtl" lang="ar">${r.a}</div></li>`).join("")}</ol>`:`<p class="sub" style="margin-top:10px">No drug selected.</p>`}
    ${inv.length?`<div class="rx-inv"><b>Investigations requested:</b> ${inv.join(" · ")}</div>`:""}
    <div class="rx-gen" dir="rtl" lang="ar"><b>تعليمات عامة</b><ul>${genAr.map(x=>`<li>${x}</li>`).join("")}</ul></div>
    <div class="rx-fu"><i>Follow-up</i>${fu} — ${fuList.join("; ")}.</div>
    <div class="rx-sig">Signature ____________________</div></div></div></div>`;
  w.innerHTML=h;
  const txt=[`${drSettings.doctorName || "Dr Hossam Yousuf"} — ${drSettings.doctorTitle || "Consultant Family Medicine"}`,
    drSettings.clinicName || "",
    `Name: ${name}   Age: ${p.age||""} y   Wt: ${p.wt||""} kg   Date: ${date}`,`Dx: ${dx.join(", ")}`,"",
    ...items.map((r,i)=>`${i+1}. ${r.b}\n   ${r.s}\n   ${r.a}`),"",inv.length?`Investigations: ${inv.join(", ")}`:"","تعليمات عامة:",...genAr.map(x=>"- "+x),"",`Follow-up: ${fu} — ${fuList.join("; ")}.`].filter(Boolean).join("\n");
  $("rxcopy").addEventListener("click",()=>{
    const b=$("rxcopy");const done=()=>{b.textContent="Copied";setTimeout(()=>b.textContent="📋 نسخ",1500);};
    try{navigator.clipboard.writeText(txt).then(done,selectCard);}catch(e){selectCard();}
  });
}
function selectCard(){const r=document.createRange();r.selectNodeContents($("rxcard"));const s=getSelection();s.removeAllRanges();s.addRange(r);$("rxcopy").textContent="Selected — copy manually";}
document.addEventListener("change",e=>{
  if(e.target.classList&&e.target.classList.contains("rxck")){RXUSER[e.target.dataset.k]=e.target.checked;renderScreening(RXP.P);renderRx();}
});

/* ================= Insulin calculator ================= */
let reg="basal";
function icalc(){
  const wt=num("iwt"),fpg=num("ifpg"),curB=num("icur")||0,tdd0=num("itdd")||0,s=$("isens") ? $("isens").value : 'mid';
  if ($("iswitch")) $("iswitch").hidden=reg!=="switch";
  const f=({low:[0.1,0.3],mid:[0.15,0.4],high:[0.2,0.5]}[s]) || [0.15, 0.4];
  const R=(v,u,l)=>`<div class="res"><div class="v">${v}<small> ${u}</small></div><div class="l">${l}</div></div>`;
  if(!wt){$("iresult").innerHTML="<p>Enter weight.</p>";return;}
  let h="";
  if(reg==="basal"){
    const d=Math.max(10,Math.round(wt*f[0]));
    h=`<h2>Start basal insulin</h2><div class="res-box">${R(d,"U","Once daily: bedtime NPH, or glargine/degludec at a fixed time")}${R(Math.round(wt*0.5),"U","Overbasalization limit (0.5 U/kg)")}</div>
    <h3>Titration (patient self-adjusts)</h3><ul><li>Increase <b>2 U every 3 days</b> until fasting glucose is 80–130 mg/dL.</li>
    <li>Degludec or U300: 2–4 U twice weekly.</li><li>Fasting &lt;80 mg/dL or any hypo: <b>reduce 4 U or 10–20%</b>.</li></ul>
    <div class="callout" style="${cv("leaf")}"><b>Lowest cost:</b> Insulatard or Humulin N at bedtime. Analogues (Lantus, Toujeo, Tresiba) cause less nocturnal hypoglycemia at higher cost. Continue metformin; reduce or stop sulfonylurea.</div>`;
  }
  if(reg==="titrate"){
    let adj,msg;
    if(isNaN(fpg)){adj=0;msg="Enter fasting glucose.";}
    else if(fpg<70){adj=-Math.max(4,Math.round(curB*0.2));msg="Hypoglycemia: reduce by 20% (at least 4 U).";}
    else if(fpg<80){adj=-Math.max(2,Math.round(curB*0.1));msg="Below target: reduce by 10%.";}
    else if(fpg<=130){adj=0;msg="At target: keep dose. If HbA1c is still high, add prandial cover.";}
    else if(fpg<=180){adj=2;msg="Above target: +2 U.";}
    else{adj=4;msg="Well above target: +4 U (or +10%).";}
    const nd=Math.max(0,curB+adj);
    h=`<h2>Titrate basal insulin</h2><div class="res-box">${R(curB,"U","Current basal")}${R((adj>0?"+":"")+adj,"U","Change")}${R(nd,"U","New dose")}</div><p>${msg}</p>`;
    if(nd>wt*0.5) h+=`<div class="callout" style="${cv("coral")}"><b>Overbasalization:</b> ${nd} U exceeds 0.5 U/kg (${Math.round(wt*0.5)} U). Stop increasing basal. Add a GLP-1 RA, or prandial insulin at the largest meal (4 U or 10% of basal).</div>`;
    if(!curB) h+=`<p class="note">Enter the current basal dose.</p>`;
  }
  if(reg==="bb"){
    const tdd=Math.round(wt*f[1]),b=Math.round(tdd/2),m=Math.round(tdd/6),icr=Math.round(450/tdd),isf=Math.round(1700/tdd);
    h=`<h2>Basal-bolus regimen</h2><p class="sub">For HbA1c &gt;10%, catabolic patients, or failure of basal + GLP-1 RA. TDD = ${f[1]} U/kg.</p>
    <div class="res-box">${R(tdd,"U","Total daily dose")}${R(b,"U","Basal (50%) once daily")}${R(m,"U","Rapid-acting per meal ×3")}</div>
    <div class="res-box">${R("1:"+icr,"g","Insulin:carb ratio (450 rule)")}${R(isf,"mg/dL","Drop per 1 U (1700 rule)")}</div>
    <h3>Stepwise alternative (basal-plus)</h3><ul><li>Add <b>${Math.max(4,Math.round(b*0.1))} U</b> rapid-acting before the largest meal.</li>
    <li>Titrate 1–2 U every 3 days until 2-h post-meal &lt;180 mg/dL; add 2nd and 3rd meal doses if needed.</li></ul>
    <h3>Correction scale with each meal</h3><div class="tbl"><table style="min-width:300px"><thead><tr><th>Pre-meal glucose</th><th>Extra rapid-acting</th></tr></thead><tbody>
    <tr><td class="mono">150–199</td><td class="mono">+1 U</td></tr><tr><td class="mono">200–249</td><td class="mono">+2 U</td></tr>
    <tr><td class="mono">250–299</td><td class="mono">+3 U</td></tr><tr><td class="mono">300–349</td><td class="mono">+4 U</td></tr>
    <tr><td class="mono">≥350</td><td class="mono">+5 U, check ketones</td></tr></tbody></table></div>
    <p class="note">Lowest cost: Insulatard + Actrapid 30 min before meals. Analogues: NovoRapid, Humalog, Apidra.</p>`;
  }
  if(reg==="premix"){
    const k=f[1]-0.1,tdd=Math.round(wt*k),am=Math.round(tdd*2/3),pm=tdd-am;
    h=`<h2>Premixed insulin twice daily</h2><p class="sub">For fixed meal routines and patients who cannot manage multiple injections. TDD = ${k.toFixed(2)} U/kg.</p>
    <div class="res-box">${R(tdd,"U","Total daily dose")}${R(am,"U","Before breakfast (⅔)")}${R(pm,"U","Before dinner (⅓)")}</div>
    <ul><li>Morning dose: titrate on pre-dinner glucose. Evening dose: titrate on fasting glucose.</li>
    <li>Adjust 2 U (10%) every 3 days to 80–130 mg/dL; reduce 10–20% for hypoglycemia.</li>
    <li>Mixtard 30 / Humulin 70/30 (low cost): 30 min before meals. NovoMix 30 / Humalog Mix: just before meals.</li><li>Stop sulfonylurea; continue metformin.</li></ul>
    <div class="callout"><b>Ramadan or irregular meals:</b> premixed carries higher hypoglycemia risk; consider basal + oral agents.</div>`;
  }
  if(reg==="switch"){
    const fr=$("ifrom").value;let out=0,txt="";
    if(fr==="nph2"){out=Math.round(curB*0.8);txt="Total NPH × 0.8, given once daily.";}
    if(fr==="nph1"){out=curB;txt="Unit-for-unit.";}
    if(fr==="g100g300"){out=curB;txt="1:1. Expect 10–18% higher U300 needs; titrate every 3–4 days.";}
    if(fr==="g300g100"){out=Math.round(curB*0.8);txt="Reduce by about 20%.";}
    if(fr==="gdeg"){out=curB;txt="1:1. Titrate no more than twice weekly.";}
    if(fr==="premixbb"){const t=tdd0||curB;out=Math.round(t*0.8);txt=`TDD ${t} U × 0.8 = ${out} U: basal ${Math.round(out/2)} U once daily + rapid-acting ${Math.round(out/6)} U before each meal.`;}
    h=`<h2>Switch insulin</h2><div class="res-box">${R(fr==="premixbb"?(tdd0||curB):curB,"U","Current dose")}${R(out,"U","New starting dose")}</div><p>${txt}</p>
    ${(!curB&&!(fr==="premixbb"&&tdd0))?'<p class="note">Enter the current basal dose (or TDD for premixed).</p>':""}`;
  }
  h+=`<div class="callout" style="${cv("coral")}"><b>Hypoglycemia (&lt;70 mg/dL):</b> 15 g fast sugar (3 tsp sugar in water or 150 mL juice), recheck in 15 min, repeat, then a snack. Severe: glucagon or IV dextrose. Review the dose after any episode.</div>`;
  $("iresult").innerHTML=h;
}

/* ================= Tables ================= */
function buildRef(){
  const m = (window.DrugDirectory && window.DrugDirectory.getMarket) ? window.DrugDirectory.getMarket() : 'saudi';
  const headerBrand = (m === 'saudi') ? "Saudi SFDA Brand(s)" : "Egypt Brand(s)";
  const thRef = document.getElementById("th-ref-brand");
  if (thRef) thRef.textContent = headerBrand;
  const thIns = document.getElementById("th-ins-brand");
  if (thIns) thIns.textContent = headerBrand;
  const refSub = document.getElementById("ref-sec-sub");
  if (refSub) {
    refSub.textContent = (m === 'saudi') 
      ? "Brands listed lowest cost first (Saudi SFDA market in SAR). Example prices: Metformin (Dialon) ≈ 15 SAR; Forxiga ≈ 165 SAR; Januvia ≈ 125 SAR. Prices change; confirm locally."
      : "Brands listed lowest cost first (Egyptian market in EGP). Example prices: Cidophage ≈ 35 EGP; Dapagloznal ≈ 300 EGP; Gliptus ≈ 220 EGP. Prices change; confirm locally.";
  }

  const order=["met","gliclazide","glimepiride","pio","vilda","sita","lina","dapa","empa","sema","osema","dula","lira","tirz","atorva"];
  let last="",rows="";
  order.forEach(k=>{const d=D[k];
    if(d.cls!==last){rows+=`<tr><td class="cls" colspan="6" style="${cv(CC[d.cls])}">${d.cls}</td></tr>`;last=d.cls;}
    const vals=[90,44,29,15].map(e=>d.renal(e));
    const ren=new Set(vals).size===1?vals[0]:["≥45","30–44","20–29","&lt;20"].map((l,i)=>`<span class="mono">${l}:</span> ${vals[i]}`).join("<br>");
    rows+=`<tr><td><b>${d.name}</b></td><td class="mono"><span style="color:var(--leaf);font-weight:600">${d.br[0]}</span>${d.br.length>1?"<br>"+d.br.slice(1).join("<br>"):""}</td><td>${costChip(d.tier)}</td><td>${d.dose}</td><td style="font-size:12.5px">${ren}</td><td style="font-size:12.5px">${d.caut}</td></tr>`;
  });
  rows+=`<tr><td class="cls" colspan="6" style="${cv("teal")}">Fixed-dose combinations</td></tr>
  <tr><td><b>One-tablet combos</b></td><td class="mono">${m==='saudi'?'Janumet, Synjardy, Xigduo XR, Galvumet, Jentadueto':'Gliptus Plus, Galvus Met, Janumet, Trajenta Duo, Xigduo XR, Synjardy'}</td><td>${costChip(2)}</td><td colspan="3">Fewer tablets improve adherence. Dose by the metformin component and eGFR.</td></tr>`;
  const tbody = document.querySelector("#reftbl tbody");
  if (tbody) tbody.innerHTML=rows;
}
function buildIns(){
  const row=(t,g,b,c,o,p,d,ti)=>`<tr><td>${t}</td><td>${g}</td><td class="mono">${b}</td><td>${costChip(c)}</td><td class="mono">${o}</td><td class="mono">${p}</td><td class="mono">${d}</td><td>${ti}</td></tr>`;
  const sec=(t,c)=>`<tr><td class="cls" colspan="8" style="${cv(c)}">${t}</td></tr>`;
  $("instbl").innerHTML=
    sec("Basal","grape")+
    row("Human","NPH (isophane)","Insulatard, Humulin N",1,"1–2 h","4–10 h","12–16 h","Bedtime or twice daily")+
    row("Analogue","Glargine U100","Lantus SoloStar",3,"1–2 h","none","~24 h","Once daily, same time")+
    row("Analogue","Glargine U300","Toujeo SoloStar",3,"6 h","none","&gt;24 h","Once daily")+
    row("Analogue","Degludec","Tresiba FlexTouch",3,"1 h","none","&gt;42 h","Once daily, flexible")+
    sec("Prandial","coral")+
    row("Human","Regular insulin","Actrapid, Humulin R",1,"30 min","2–4 h","6–8 h","30 min before meal")+
    row("Analogue","Aspart","NovoRapid, Fiasp",3,"10–15 min","1–2 h","3–5 h","0–15 min before meal")+
    row("Analogue","Lispro","Humalog KwikPen",3,"10–15 min","1–2 h","3–5 h","0–15 min before meal")+
    row("Analogue","Glulisine","Apidra SoloStar",3,"10–15 min","1–2 h","3–5 h","0–15 min before meal")+
    sec("Premixed & co-formulations","sun")+
    row("Human","NPH/Regular 70/30","Mixtard 30, Humulin 70/30",1,"30 min","dual","12–16 h","30 min before breakfast &amp; dinner")+
    row("Analogue","Aspart mix 70/30","NovoMix 30",3,"10–20 min","dual","≤24 h","Just before meals")+
    row("Analogue","Lispro mix 25 / 50","Humalog Mix 25, Mix 50",3,"15 min","dual","≤24 h","Just before meals")+
    row("Co-formulation","Degludec/aspart 70/30","Ryzodeg 70/30",3,"10–20 min","prandial","&gt;24 h","With main meal(s)");
}
const CK=[["HbA1c","Every 3–6 months"],["Blood pressure, weight, BMI","Every visit"],["Glucose log / CGM review","Every visit"],["Hypoglycemia assessment","Every visit"],
 ["UACR + eGFR","Yearly or more often in CKD"],["Lipid profile","Yearly"],["Eye exam","Yearly"],["Foot exam","Yearly; inspect every visit"],["FIB-4","Every 1–3 years"],
 ["Vitamin B12 (on metformin)","Yearly"],["Depression screen","Yearly"],["Vaccines up to date","Influenza yearly"],["Dental referral","Yearly"],["Smoking status","Every visit"],["Diabetes education","At diagnosis and yearly"]];
function buildCK(){
  $("cklist").innerHTML=CK.map((c,i)=>`<label class="ck"><input type="checkbox" id="ck${i}"><span>${c[0]}<small>${c[1]}</small></span></label>`).join("");
  const upd=()=>{const n=CK.filter((_,i)=>$("ck"+i).checked).length;$("ckprog").textContent=`${n}/${CK.length} done`;};
  $("cklist").addEventListener("change",upd);upd();
}

/* ================= Market Adaptor ================= */
function applyMarketToD(market) {
  const m = market || (window.DrugDirectory && window.DrugDirectory.getMarket ? window.DrugDirectory.getMarket() : 'saudi');
  for (const k in D) {
    if (window.DRUG_DATABASE && window.DRUG_DATABASE[k]) {
      const entry = window.DRUG_DATABASE[k];
      const mkt = entry[m] || entry.saudi;
      if (mkt) {
        D[k].br = mkt.brands;
        D[k].orig = mkt.orig;
        D[k].tier = mkt.tier;
        if (entry.rx) D[k].rx = entry.rx;
      }
    }
  }
  buildRef();
  plan();
}
window.applyMarketToD = applyMarketToD;
window.plan = plan;

/* ================= Wiring ================= */
document.querySelectorAll("nav.tabs button").forEach(b=>b.addEventListener("click",()=>{
  document.querySelectorAll("nav.tabs button").forEach(x=>x.setAttribute("aria-selected",x===b));
  document.querySelectorAll(".tab").forEach(s=>s.hidden=s.id!==b.dataset.tab);
  window.scrollTo({top:0});
}));
document.querySelectorAll("#iseg button").forEach(b=>b.addEventListener("click",()=>{
  reg=b.dataset.r;document.querySelectorAll("#iseg button").forEach(x=>x.setAttribute("aria-pressed",x===b));icalc();
}));
$("pform").addEventListener("input",plan);
$("pform").addEventListener("change",plan);
["iwt","ifpg","icur","itdd","isens","ifrom"].forEach(id=>$(id).addEventListener("input",icalc));

// Apply Saudi market formulary as default
if (window.DRUG_DATABASE) {
  applyMarketToD('saudi');
} else {
  buildRef();
  buildIns();
  buildCK();
  plan();
}
buildIns();
buildCK();

// Cross-engine clinical safety alerts listener
(function() {
  const target = (typeof window !== 'undefined') ? window : globalThis;
  if (target && target.addEventListener) {
    target.addEventListener('osrawy:patient-updated', function(ev) {
      const banner = document.getElementById('clinical-guardrail-banner');
      if (!banner) return;
      const guardrails = (ev && ev.detail && ev.detail.guardrails) || [];
      let list = [];
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
// Osrawy Diabetes in Pregnancy & Obstetric Glycemia Protocol
// Guidelines: ADA Standards of Care 2024-2025 / ACOG / NICE
// ==============================================================

const OsrawyDmPregnancy = (function() {
  function evaluatePregnancyDmProtocol(patientInput) {
    const pt = patientInput || (typeof PatientSync !== 'undefined' ? PatientSync.get() : {});
    const wt = parseFloat(pt.wt !== undefined ? pt.wt : (pt.weightKg !== undefined ? pt.weightKg : pt.weight)) || 70;
    const isPregnant = !!(pt.pregnancy || pt.preg || pt.isPregnant || pt.pregHtn);
    const isPostpartum = !!(pt.postpartum || (pt.comorbidities && pt.comorbidities.postpartum));
    let trimester = parseInt(pt.trimester, 10);
    const weeks = parseFloat(pt.gestationalWeeks !== undefined ? pt.gestationalWeeks : (pt.weeks !== undefined ? pt.weeks : 16)) || 16;

    // Deduce trimester if not specified or invalid
    if (!trimester || isNaN(trimester) || trimester < 1 || trimester > 3) {
      if (weeks <= 13) trimester = 1;
      else if (weeks <= 26) trimester = 2;
      else trimester = 3;
    }

    const alerts = [];

    // 1. Stop oral/injectable non-insulin DM agents
    const stoppedAgents = [
      { classEn: 'Biguanides', name: 'Metformin', reasonEn: 'Crosses placenta; insulin is preferred first-line', reasonAr: 'يعبر المشيمة والإنسولين هو الخيار الأول' },
      { classEn: 'SGLT2 inhibitors', name: 'Dapagliflozin, Empagliflozin', reasonEn: 'Contraindicated; fetal renal abnormalities in animal studies', reasonAr: 'ممنوع تماماً؛ تشوهات كلوية جنينية' },
      { classEn: 'GLP-1 RA / Dual GIP/GLP-1', name: 'Semaglutide, Tirzepatide, Dulaglutide, Liraglutide', reasonEn: 'Contraindicated; embryonic toxicity in animal studies', reasonAr: 'ممنوع تماماً؛ سمية جنينية في الدراسات' },
      { classEn: 'Sulfonylureas', name: 'Glimepiride, Gliclazide, Glibenclamide', reasonEn: 'Risk of fetal hyperinsulinemia, macrosomia, and severe neonatal hypoglycemia', reasonAr: 'خطر هبوط سكر وليدي حاد وتضخم الجنين' },
      { classEn: 'DPP-4 inhibitors', name: 'Sitagliptin, Vildagliptin, Linagliptin', reasonEn: 'Insufficient pregnancy safety data; discontinue', reasonAr: 'عدم كفاية بيانات الأمان في الحمل' },
      { classEn: 'TZDs', name: 'Pioglitazone', reasonEn: 'Contraindicated; fluid retention, fetal harm', reasonAr: 'ممنوع تماماً في الحمل' }
    ];

    alerts.push({
      id: 'dm-preg-stop-non-insulin',
      code: 'STOP_NON_INSULIN_PREGNANCY_DRUGS',
      level: 'critical',
      type: 'critical',
      titleEn: 'Stop All Non-Insulin DM Agents: Switch to Multi-Dose Insulin',
      titleAr: 'إيقاف جميع خافضات السكر الفموية وغير الإنسولينية: التحويل للإنسولين',
      messageEn: 'All oral and injectable non-insulin antidiabetic agents (Metformin, SGLT2i, GLP-1 RA, Tirzepatide, Sulfonylureas, DPP-4i, TZDs) must be stopped. Insulin is the gold standard and sole recommended pharmacotherapy for diabetes in pregnancy (ADA Standards of Care 2024/2025).',
      messageAr: 'يجب إيقاف جميع حبوب وحقن السكر غير الإنسولينية فوراً (ميتفورمين، مثبطات SGLT2، منشطات GLP-1، مونجارو، سلفونيل يوريا). الإنسولين هو العلاج الذهبي والوحيد المعتمد والآمن في الحمل.',
      actionEn: 'Discontinue oral/GLP-1 agents immediately; initiate intensive basal-bolus insulin therapy.',
      actionAr: 'أوقف الأدوية الفموية فوراً وابدأ نظام الإنسولين المكثف (قاعدي وسريع).'
    });

    // 2. Trimester-specific weight-based insulin dosing
    // TDD: 0.7 for T1, 0.8 for T2, 0.9 for T3 U/kg/day; 50% basal, 50% prandial across 3 meals
    let tddMultiplier = 0.8;
    let trimesterNameEn = '2nd Trimester (Weeks 14–26)';
    let trimesterNameAr = 'الثلث الثاني (الأسابيع 14–26)';
    if (trimester === 1) {
      tddMultiplier = 0.7;
      trimesterNameEn = '1st Trimester (Weeks 1–13)';
      trimesterNameAr = 'الثلث الأول (الأسابيع 1–13)';
    } else if (trimester === 3) {
      tddMultiplier = 0.9;
      trimesterNameEn = '3rd Trimester (Weeks 27–40)';
      trimesterNameAr = 'الثلث الثالث (الأسابيع 27–40)';
    }

    const tdd = Math.round(wt * tddMultiplier * 10) / 10;
    const basalTotal = Math.round(tdd * 0.5 * 10) / 10;
    const prandialTotal = Math.round(tdd * 0.5 * 10) / 10;
    const prandialPerMeal = Math.round((prandialTotal / 3) * 10) / 10;

    const basalUnits = Math.round(tdd * 0.5);
    const prandialTotalUnits = Math.round(tdd * 0.5);
    const mealBolusUnits = Math.round(prandialTotalUnits / 3);

    const insulinDosing = {
      weightKg: wt,
      trimester,
      trimesterNameEn,
      trimesterNameAr,
      multiplier: tddMultiplier,
      tdd,
      tddUnits: Math.round(tdd),
      basalTotal,
      basalUnits,
      prandialTotal,
      prandialTotalUnits,
      prandialPerMeal,
      prandialPerMealUnits: mealBolusUnits,
      mealBolusUnits,
      mealBolus: mealBolusUnits,
      split: '50% Basal / 50% Prandial across 3 meals',
      basalRegimenEn: `Basal Insulin: ${basalUnits} units/day (e.g. NPH insulin divided twice daily [2/3 morning, 1/3 bedtime] OR Insulin Detemir/Glargine once/twice daily)`,
      basalRegimenAr: `الإنسولين القاعدي: ${basalUnits} وحدة/يوم (إنسولين NPH مقسم مرتين يومياً [ثلثين صباحاً وثلث قبل النوم] أو ديتيمير/لانتوس)`,
      prandialRegimenEn: `Prandial Insulin: ${prandialTotalUnits} units/day divided into ~${mealBolusUnits} units before each of 3 main meals (Breakfast: ${mealBolusUnits} U, Lunch: ${mealBolusUnits} U, Dinner: ${mealBolusUnits} U) using rapid analogue (Aspart or Lispro)`,
      prandialRegimenAr: `إنسولين الوجبات السريع: ${prandialTotalUnits} وحدة/يوم مقسمة ~${mealBolusUnits} وحدات قبل كل وجبة من الوجبات الـ 3 الرئيسية (فطور، غداء، عشاء) باستخدام إنسولين سريع المفعول (نوفورابيد أو هيومالوج)`
    };

    // 3. High-dose Folic Acid 5 mg/day (weeks 1-12)
    const isFirstTrimesterFolic = !isPostpartum && (weeks <= 12 || trimester === 1);
    const folicAcid = {
      indicated: isFirstTrimesterFolic,
      dose: '5 mg/day orally',
      timing: 'Preconception up to 12 weeks of gestation',
      titleEn: 'High-Dose Folic Acid (5 mg/day) - Early Pregnancy (Weeks 1–12)',
      titleAr: 'حمض الفوليك بجرعة عالية (5 مجم/يوم) - الحمل المبكر (الأسابيع 1–12)',
      messageEn: 'High-dose Folic Acid 5 mg once daily is strongly indicated from preconception through the first 12 weeks of gestation for women with pre-existing diabetes to prevent neural tube defects and major congenital anomalies.',
      messageAr: 'يُوصى بحمض الفوليك بجرعة عالية (5 مجم يومياً) من قبل الحمل وحتى نهاية الأسبوع الـ 12 من الحمل لمرضى السكري للوقاية من تشوهات الأنبوب العصبي والتشوهات الخلقية الكبرى للجنين.'
    };
    if (isFirstTrimesterFolic) {
      alerts.push({
        id: 'dm-preg-folic-acid-high-dose',
        level: 'info',
        type: 'info',
        titleEn: folicAcid.titleEn,
        titleAr: folicAcid.titleAr,
        messageEn: folicAcid.messageEn,
        messageAr: folicAcid.messageAr,
        actionEn: 'Prescribe Folic Acid 5 mg PO once daily through week 12 of pregnancy.',
        actionAr: 'وصف حمض الفوليك 5 مجم يومياً فموياً حتى الأسبوع الـ 12 من الحمل.'
      });
    }

    // 4. Postpartum insulin reduction (-50%) and GDM screening
    const postpartumInsulinReductionPercent = 50;
    const postpartumTdd = Math.round(tdd * 0.5 * 10) / 10;
    const postpartumManagement = {
      isPostpartum,
      insulinReductionPercent: postpartumInsulinReductionPercent,
      postpartumTdd,
      insulinReductionEn: `Immediately upon delivery of the placenta, insulin resistance drops precipitously. Reduce insulin doses by ~50% (estimated postpartum TDD: ${postpartumTdd} U/day) or revert to pre-pregnancy regimen to prevent severe maternal hypoglycemia.`,
      insulinReductionAr: `فور خروج المشيمة، تهبط مقاومة الإنسولين هبوطاً حاداً ومفاجئاً. يجب تخفيض جرعة الإنسولين بنسبة 50% فوراً (جرعة النفاس المقدرة: ${postpartumTdd} وحدة/يوم) لتجنب هبوط السكر الحاد المميت.`,
      gdmScreeningEn: 'Postpartum GDM Screening: For women with Gestational Diabetes Mellitus (GDM), perform a 75-g 2-hour Oral Glucose Tolerance Test (OGTT) at 4–12 weeks postpartum to screen for persistent diabetes or prediabetes.',
      gdmScreeningAr: 'فحص سكر النفاس: للسيدات المصابات بسكر الحمل (GDM)، يجب إجراء اختبار تحمل الجلوكوز (75g OGTT) بعد 4 إلى 12 أسبوعاً من الولادة للتأكد من زوال سكر الحمل والكشف عن السكري أو مرحلة ما قبل السكري.'
    };

    if (isPostpartum) {
      alerts.push({
        id: 'dm-postpartum-insulin-cut',
        level: 'warning',
        type: 'warning',
        titleEn: 'Postpartum Insulin Dose Reduction (-50%) & Hypoglycemia Warning',
        titleAr: 'تخفيض جرعة الإنسولين بنسبة 50% بعد الولادة فوراً والتحذير من هبوط السكر',
        messageEn: postpartumManagement.insulinReductionEn,
        messageAr: postpartumManagement.insulinReductionAr,
        actionEn: 'Halve the pre-delivery insulin dose immediately postpartum and monitor blood glucose closely.',
        actionAr: 'قلص جرعة الإنسولين للنصف فوراً وراقب السكر باستمرار.'
      });
      alerts.push({
        id: 'dm-postpartum-gdm-ogtt-screen',
        level: 'info',
        type: 'info',
        titleEn: 'Postpartum GDM 75g OGTT Screening (Weeks 4–12)',
        titleAr: 'فحص سكر الحمل بعد الولادة (اختبار OGTT 75g في الأسبوع 4–12)',
        messageEn: postpartumManagement.gdmScreeningEn,
        messageAr: postpartumManagement.gdmScreeningAr,
        actionEn: 'Order 75g 2-hr OGTT at 4–12 weeks postpartum.',
        actionAr: 'طلب فحص 75g OGTT بعد 4-12 أسبوعاً من الولادة.'
      });
    }

    // 5. Obstetric glycemic targets: Fasting <95, 1-hr PP <140, 2-hr PP <120 mg/dL
    const obstetricTargets = {
      fasting: 95,
      pp1hr: 140,
      pp2hr: 120,
      fastingMgDl: '<95 mg/dL (<5.3 mmol/L)',
      pp1hrMgDl: '<140 mg/dL (<7.8 mmol/L)',
      pp2hrMgDl: '<120 mg/dL (<6.7 mmol/L)',
      fastingMmol: 5.3,
      pp1hrMmol: 7.8,
      pp2hrMmol: 6.7,
      a1cPercent: 6.0,
      fastingLabel: '< 95 mg/dL',
      pp1hrLabel: '< 140 mg/dL',
      pp2hrLabel: '< 120 mg/dL',
      fastingLabelEn: 'Fasting: < 95 mg/dL (< 5.3 mmol/L)',
      fastingLabelAr: 'سكر الصائم: أقل من 95 مجم/ديسيلتر (< 5.3 مليمول/لتر)',
      pp1hrLabelEn: '1-Hour Postprandial: < 140 mg/dL (< 7.8 mmol/L)',
      pp1hrLabelAr: 'بعد الأكل بساعة: أقل من 140 مجم/ديسيلتر (< 7.8 مليمول/لتر)',
      pp2hrLabelEn: '2-Hour Postprandial: < 120 mg/dL (< 6.7 mmol/L)',
      pp2hrLabelAr: 'بعد الأكل بساعتين: أقل من 120 مجم/ديسيلتر (< 6.7 مليمول/لتر)',
      a1cLabelEn: 'HbA1c Target in Pregnancy: < 6.0% (without significant hypoglycemia)',
      a1cLabelAr: 'السكر التراكمي المستهدف: أقل من 6.0% (دون حدوث هبوط سكر متكرر)'
    };

    return {
      isPregnant,
      isPostpartum,
      trimester,
      gestationalWeeks: weeks,
      dosing: insulinDosing,
      insulinDosing,
      folicAcid,
      postpartumManagement,
      obstetricTargets,
      targets: obstetricTargets,
      stoppedAgents,
      alerts
    };
  }

  return {
    evaluatePregnancyDmProtocol
  };
})();

if (typeof window !== 'undefined') {
  window.OsrawyDmPregnancy = OsrawyDmPregnancy;
  window.DiabetesEngine = window.DiabetesEngine || {};
  window.DiabetesEngine.OsrawyDmPregnancy = OsrawyDmPregnancy;
  window.DiabetesEngine.evaluatePregnancyDmProtocol = OsrawyDmPregnancy.evaluatePregnancyDmProtocol;
}

if (typeof global !== 'undefined') {
  global.OsrawyDmPregnancy = OsrawyDmPregnancy;
  global.DiabetesEngine = global.DiabetesEngine || {};
  global.DiabetesEngine.OsrawyDmPregnancy = OsrawyDmPregnancy;
  global.DiabetesEngine.evaluatePregnancyDmProtocol = OsrawyDmPregnancy.evaluatePregnancyDmProtocol;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports.OsrawyDmPregnancy = OsrawyDmPregnancy;
  module.exports.evaluatePregnancyDmProtocol = OsrawyDmPregnancy.evaluatePregnancyDmProtocol;
}
