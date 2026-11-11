// ==============================================================
// Osrawy Patient Leaflets & Offline SVG QR Code Generator
// Interactive Educational Leaflets for DM, HTN & DLP
// Dynamic Targets, Rule of 15, SADMANS Rules, Home BP, Statins & Red Flags
// ==============================================================

(function() {
  'use strict';

  // ==============================================================
  // 1. Offline Zero-Dependency SVG QR Code Generator
  // ISO/IEC 18004 Byte Mode Version 6-L (41x41 Matrix, GF(256) RS EC)
  // ==============================================================

  const OsrawyQRCode = (function() {
    const SIZE = 41; // Version 6 matrix dimension = 21 + (6-1)*4 = 41

    // GF(256) field tables with primitive polynomial 0x11D (285)
    const gfExp = new Uint8Array(512);
    const gfLog = new Uint8Array(256);
    let x = 1;
    for (let i = 0; i < 255; i++) {
      gfExp[i] = x;
      gfLog[x] = i;
      x <<= 1;
      if (x & 256) x ^= 0x11d;
    }
    for (let i = 255; i < 512; i++) {
      gfExp[i] = gfExp[i - 255];
    }

    function gfMul(a, b) {
      return (a === 0 || b === 0) ? 0 : gfExp[gfLog[a] + gfLog[b]];
    }

    // Compute Reed-Solomon Generator Polynomial for degree 18
    function rsGenPoly(degree) {
      let g = [1];
      for (let i = 0; i < degree; i++) {
        const next = new Array(g.length + 1).fill(0);
        const root = gfExp[i];
        for (let j = 0; j < g.length; j++) {
          next[j] ^= g[j];
          next[j + 1] ^= gfMul(g[j], root);
        }
        g = next;
      }
      return g;
    }

    const g18 = rsGenPoly(18);

    // Compute 18 Reed-Solomon EC Codewords for a data block
    function calcEC(data, degree) {
      const buf = new Uint8Array(data.length + degree);
      buf.set(data);
      for (let i = 0; i < data.length; i++) {
        const coef = buf[i];
        if (coef !== 0) {
          for (let j = 0; j <= degree; j++) {
            buf[i + j] ^= gfMul(g18[j], coef);
          }
        }
      }
      return Array.from(buf.slice(data.length));
    }

    // Convert string to UTF-8 byte array, safely truncating at whole character boundaries
    function toUtf8Bytes(str, maxBytes) {
      const s = String(str || '');
      const limit = (typeof maxBytes === 'number' && maxBytes > 0) ? maxBytes : 134;
      const bytes = [];
      for (let i = 0; i < s.length; i++) {
        let code = s.charCodeAt(i);
        let charBytes;
        if (code < 0x80) {
          charBytes = [code];
        } else if (code < 0x800) {
          charBytes = [0xc0 | (code >> 6), 0x80 | (code & 0x3f)];
        } else if (code < 0xd800 || code >= 0xe000) {
          charBytes = [0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f)];
        } else {
          i++;
          code = 0x10000 + (((code & 0x3ff) << 10) | (s.charCodeAt(i) & 0x3ff));
          charBytes = [0xf0 | (code >> 18), 0x80 | ((code >> 12) & 0x3f), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f)];
        }
        if (bytes.length + charBytes.length > limit) break;
        for (let k = 0; k < charBytes.length; k++) bytes.push(charBytes[k]);
      }
      return bytes;
    }

    // Bit buffer writer
    class BitBuffer {
      constructor() {
        this.buffer = [];
        this.length = 0;
      }
      put(val, len) {
        for (let i = 0; i < len; i++) {
          this.putBit(((val >>> (len - i - 1)) & 1) === 1);
        }
      }
      putBit(bit) {
        const bufIndex = Math.floor(this.length / 8);
        if (this.buffer.length <= bufIndex) {
          this.buffer.push(0);
        }
        if (bit) {
          this.buffer[bufIndex] |= (0x80 >>> (this.length % 8));
        }
        this.length++;
      }
    }

    // Generate 41x41 binary matrix
    function createMatrix(text) {
      // 1. Prepare data bitstream for Version 6-L
      // Total data codewords = 136 (2 blocks of 68), Total EC codewords = 36 (2 blocks of 18)
      // Max raw data bytes in 8-bit byte mode: (136*8 - 4(mode) - 8(count)) / 8 = 134 bytes
      const dataBytes = toUtf8Bytes(text, 134);

      const bb = new BitBuffer();
      // Mode indicator: 0100 (Byte mode)
      bb.put(0x04, 4);
      // Character count indicator: 8 bits for Version 6 Byte mode
      bb.put(dataBytes.length, 8);
      // Data bytes
      for (let i = 0; i < dataBytes.length; i++) {
        bb.put(dataBytes[i], 8);
      }
      // Terminator (up to 4 bits of 0)
      const maxDataBits = 136 * 8;
      const termLen = Math.min(4, maxDataBits - bb.length);
      bb.put(0, termLen);
      // Pad to whole byte
      while (bb.length % 8 !== 0) {
        bb.putBit(false);
      }
      // Pad with alternate 0xEC and 0x11
      const padBytes = [0xec, 0x11];
      let padIdx = 0;
      while (bb.length < maxDataBits) {
        bb.put(padBytes[padIdx % 2], 8);
        padIdx++;
      }

      // 2. Split into 2 blocks of 68 codewords each and compute 18 EC codewords
      const b1Data = bb.buffer.slice(0, 68);
      const b2Data = bb.buffer.slice(68, 136);
      const b1Ec = calcEC(b1Data, 18);
      const b2Ec = calcEC(b2Data, 18);

      // 3. Interleave data codewords, then EC codewords
      const finalCodewords = [];
      for (let i = 0; i < 68; i++) {
        finalCodewords.push(b1Data[i]);
        finalCodewords.push(b2Data[i]);
      }
      for (let i = 0; i < 18; i++) {
        finalCodewords.push(b1Ec[i]);
        finalCodewords.push(b2Ec[i]);
      }

      // Convert codewords to final bit array + 7 remainder bits for Version 6
      const allBits = [];
      for (let i = 0; i < finalCodewords.length; i++) {
        const byte = finalCodewords[i];
        for (let b = 7; b >= 0; b--) {
          allBits.push(((byte >>> b) & 1) === 1);
        }
      }
      for (let r = 0; r < 7; r++) {
        allBits.push(false); // 7 remainder bits for Version 6
      }

      // 4. Build 41x41 module grid and function patterns
      const matrix = Array.from({ length: SIZE }, () => new Array(SIZE).fill(null));
      const reserved = Array.from({ length: SIZE }, () => new Array(SIZE).fill(false));

      // Finder patterns
      function placeFinder(r, c) {
        for (let y = -1; y <= 7; y++) {
          for (let x = -1; x <= 7; x++) {
            const row = r + y, col = c + x;
            if (row >= 0 && row < SIZE && col >= 0 && col < SIZE) {
              reserved[row][col] = true;
              if (y >= 0 && y <= 6 && x >= 0 && x <= 6) {
                matrix[row][col] = (y === 0 || y === 6 || x === 0 || x === 6 || (y >= 2 && y <= 4 && x >= 2 && x <= 4)) ? 1 : 0;
              } else {
                matrix[row][col] = 0;
              }
            }
          }
        }
      }
      placeFinder(0, 0);
      placeFinder(0, SIZE - 7);
      placeFinder(SIZE - 7, 0);

      // Alignment Pattern at center (34, 34) for Version 6
      function placeAlignment(cr, cc) {
        for (let y = -2; y <= 2; y++) {
          for (let x = -2; x <= 2; x++) {
            reserved[cr + y][cc + x] = true;
            matrix[cr + y][cc + x] = (Math.max(Math.abs(y), Math.abs(x)) === 1) ? 0 : 1;
          }
        }
      }
      placeAlignment(34, 34);

      // Timing Patterns at row 6 and col 6
      for (let i = 8; i < SIZE - 8; i++) {
        if (!reserved[6][i]) {
          reserved[6][i] = true;
          matrix[6][i] = (i % 2 === 0) ? 1 : 0;
        }
        if (!reserved[i][6]) {
          reserved[i][6] = true;
          matrix[i][6] = (i % 2 === 0) ? 1 : 0;
        }
      }

      // Dark module at (33, 8) for Version 6 (4*V + 9, 8)
      reserved[33][8] = true;
      matrix[33][8] = 1;

      // Reserve Format Information areas
      for (let i = 0; i <= 8; i++) {
        reserved[8][i] = true;
        reserved[i][8] = true;
      }
      for (let i = SIZE - 8; i < SIZE; i++) {
        reserved[8][i] = true;
        reserved[i][8] = true;
      }

      // 5. Place data bits in zigzag scan with Mask Pattern 0: ((row + col) % 2 === 0)
      let bitIdx = 0;
      let goingUp = true;
      for (let col = SIZE - 1; col > 0; col -= 2) {
        if (col === 6) col--; // Skip vertical timing column
        const rows = goingUp ? [] : [];
        for (let i = 0; i < SIZE; i++) {
          rows.push(goingUp ? (SIZE - 1 - i) : i);
        }
        for (let r = 0; r < rows.length; r++) {
          const row = rows[r];
          for (let c = col; c >= col - 1; c--) {
            if (!reserved[row][c]) {
              const bit = bitIdx < allBits.length ? allBits[bitIdx] : false;
              bitIdx++;
              // Apply Mask 0: invert if (row + col) is even
              const mask = ((row + c) % 2 === 0);
              matrix[row][c] = (bit ^ mask) ? 1 : 0;
            }
          }
        }
        goingUp = !goingUp;
      }

      // 6. Write Format Information MSB-first (Level L = 01, Mask 0 = 000 -> 15 bits = 0x77c4)
      const fmt = 0x77c4;
      const fmtCoords1 = [[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]];
      const fmtCoords2 = [[SIZE-1,8],[SIZE-2,8],[SIZE-3,8],[SIZE-4,8],[SIZE-5,8],[SIZE-6,8],[SIZE-7,8],[8,SIZE-8],[8,SIZE-7],[8,SIZE-6],[8,SIZE-5],[8,SIZE-4],[8,SIZE-3],[8,SIZE-2],[8,SIZE-1]];
      for (let i = 0; i < 15; i++) {
        const bit = (fmt >> (14 - i)) & 1;
        matrix[fmtCoords1[i][0]][fmtCoords1[i][1]] = bit;
        matrix[fmtCoords2[i][0]][fmtCoords2[i][1]] = bit;
      }

      return matrix;
    }

    // Render 41x41 matrix as pure vector SVG string
    function generateSVG(text, options) {
      const opt = options || {};
      const pxSize = opt.size || 240;
      const margin = (opt.margin !== undefined) ? opt.margin : 4;
      const darkColor = opt.darkColor || '#0A4F4B';
      const lightColor = opt.lightColor || '#FFFFFF';

      const matrix = createMatrix(text);
      const totalSize = SIZE + (margin * 2);

      let pathD = '';
      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          if (matrix[r][c] === 1) {
            const x = c + margin;
            const y = r + margin;
            pathD += `M${x},${y}h1v1h-1z `;
          }
        }
      }

      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${pxSize}" height="${pxSize}" shape-rendering="crispEdges" aria-label="QR Code">
  <rect width="100%" height="100%" fill="${lightColor}"/>
  <path fill="${darkColor}" d="${pathD.trim()}"/>
</svg>`;
    }

    return {
      SIZE,
      createMatrix,
      generateSVG
    };
  })();

  // ==============================================================
  // 2. Bilingual Patient Leaflet Engine
  // ==============================================================

  const PatientLeaflets = (function() {
    let currentCondition = 'all'; // 'all', 'dm', 'htn', 'dlp'
    let currentLang = 'ar';       // 'ar', 'en'
    let fontScale = 1.0;          // 0.85 to 1.35

    function getPatientSync() {
      if (typeof window.OsrawyPatientSync !== 'undefined') return window.OsrawyPatientSync;
      if (typeof window.PatientSync !== 'undefined') return window.PatientSync;
      return null;
    }

    function getPatientData() {
      const sync = getPatientSync();
      if (sync && typeof sync.get === 'function') {
        return sync.get();
      }
      return {
        name: 'Ahmed Mahmoud',
        age: 52,
        sex: 'm',
        wt: 96,
        ht: 170,
        a1c: 8.9,
        fpg: 190,
        egfr: 68,
        uacr: 45,
        sbp: 148,
        dbp: 94,
        k: 4.6,
        tc: 210,
        hdl: 42,
        ascvd: false,
        dur: 4
      };
    }

    // Dynamic targets calculation based on clinical guidelines
    function getDynamicTargets(pt) {
      const p = pt || getPatientData();
      const age = parseFloat(p.age) || 52;
      const isElderlyOrFrail = (age >= 65) || !!p.frail;

      // 1. Diabetes Targets (ADA 2025)
      const a1cTarget = isElderlyOrFrail ? '< 7.5% - 8.0%' : '< 7.0%';
      const a1cTargetDescAr = isElderlyOrFrail ? 'هدف مرن لتجنب الهبوط ومضاعفاته لكبار السن' : 'الهدف المعياري لحماية الشرايين والكلى وشبكية العين';
      const a1cTargetDescEn = isElderlyOrFrail ? 'Relaxed target to prevent hypoglycemia in older adults' : 'Standard target to prevent vascular and microvascular complications';
      const fpgTarget = '80 - 130 mg/dL (4.4 - 7.2 mmol/L)';
      const ppgTarget = '< 180 mg/dL (< 10.0 mmol/L)';

      // 2. Hypertension Targets (ACC/AHA & ESC 2023)
      const bpTarget = isElderlyOrFrail ? '< 135/85 mmHg (130-139 / 70-79)' : '< 130/80 mmHg';
      const homeBpTarget = '< 130/80 mmHg (متوسط القراءات المنزلية)';
      const homeBpTargetEn = '< 130/80 mmHg (average home readings)';

      // 3. Dyslipidemia Targets (ADA 2025 / ESC 2023)
      let ldlTargetMg = 70;
      let ldlRiskTier = 'High Risk';
      let ldlRiskTierAr = 'عالي الخطورة (وجود سكري)';
      if (p.ascvd || (p.egfr && p.egfr < 45)) {
        ldlTargetMg = 55;
        ldlRiskTier = 'Very High Risk (Established ASCVD / CKD)';
        ldlRiskTierAr = 'مرتفع الخطورة جداً (تصلب شرايين أو قصور كلوي)';
      } else if (!p.dm && age < 40 && (!p.sbp || p.sbp < 140)) {
        ldlTargetMg = 100;
        ldlRiskTier = 'Moderate Risk';
        ldlRiskTierAr = 'متوسط الخطورة';
      }

      return {
        patientName: p.name || 'المريض',
        age: p.age,
        dm: {
          currentA1c: p.a1c ? `${p.a1c}%` : '8.9%',
          targetA1c: a1cTarget,
          targetDescAr: a1cTargetDescAr,
          targetDescEn: a1cTargetDescEn,
          currentFpg: p.fpg ? `${p.fpg} mg/dL` : '190 mg/dL',
          targetFpg: fpgTarget,
          targetPpg: ppgTarget,
          currentEgfr: p.egfr ? `${p.egfr} mL/min` : '68 mL/min'
        },
        htn: {
          currentBp: (p.sbp && p.dbp) ? `${p.sbp}/${p.dbp} mmHg` : '148/94 mmHg',
          targetBp: bpTarget,
          targetHomeBp: homeBpTarget,
          targetHomeBpEn: homeBpTargetEn,
          currentK: p.k ? `${p.k} mmol/L` : '4.6 mmol/L'
        },
        dlp: {
          riskTier: ldlRiskTier,
          riskTierAr: ldlRiskTierAr,
          targetLdl: `< ${ldlTargetMg} mg/dL (< ${(ldlTargetMg / 38.67).toFixed(1)} mmol/L)`,
          targetNonHdl: `< ${ldlTargetMg + 30} mg/dL`,
          targetTg: '< 150 mg/dL (< 1.7 mmol/L)',
          currentTc: p.tc ? `${p.tc} mg/dL` : '210 mg/dL',
          currentHdl: p.hdl ? `${p.hdl} mg/dL` : '42 mg/dL'
        }
      };
    }

    // Educational Modules HTML Builders
    function renderRuleOf15(lang) {
      const isAr = (lang === 'ar');
      return `
        <div class="leaflet-section-card">
          <div class="leaflet-card-header">
            <span class="leaflet-header-icon">🍬</span>
            <div>
              <h3>${isAr ? 'قاعدة 15 لعلاج هبوط السكر (Hypoglycemia Rule of 15)' : 'Rule of 15 for Hypoglycemia Treatment'}</h3>
              <p class="leaflet-subtitle">${isAr ? 'تطبق عندما يكون السكر أقل من 70 ملغ/دسل (أو عند ظهور أعراض رجفة، تعرق، خفقان، دوخة)' : 'Apply when blood glucose is below 70 mg/dL (< 3.9 mmol/L) or when experiencing tremors, sweating, or palpitations.'}</p>
            </div>
          </div>
          <div class="rule15-steps-grid">
            <div class="leaflet-step-box">
              <div class="step-number">1</div>
              <div class="step-body">
                <b>${isAr ? 'تناول 15 غرام سكر سريع الامتصاص' : 'Take 15g of fast-acting sugar'}</b>
                <p>${isAr ? 'نصف كوب عصير فواكه أو صودا غير دايت (120 مل)، أو 3-4 أقراص جلوكوز، أو ملعقة كبيرة سكر/عسل مذابة في ماء.' : '1/2 cup (120 mL) fruit juice or regular soda (non-diet), 3-4 glucose tablets, or 1 tablespoon of sugar/honey in water.'}</p>
              </div>
            </div>
            <div class="leaflet-step-box">
              <div class="step-number">2</div>
              <div class="step-body">
                <b>${isAr ? 'انتظر 15 دقيقة في راحة تامة' : 'Wait 15 minutes and rest'}</b>
                <p>${isAr ? 'اجلس بهدوء، تجنب بذل أي مجهود إضافي لإعطاء فرصة للسكر أن يمتص في مجرى الدم.' : 'Sit quietly and rest to allow the sugar to absorb into your bloodstream.'}</p>
              </div>
            </div>
            <div class="leaflet-step-box">
              <div class="step-number">3</div>
              <div class="step-body">
                <b>${isAr ? 'أعد قياس السكر بالجهاز' : 'Recheck blood glucose'}</b>
                <p>${isAr ? 'إذا كان السكر لا يزال أقل من 70 ملغ/دسل: كرر تناول 15 غرام سكر وانتظر 15 دقيقة أخرى.' : 'If still under 70 mg/dL: repeat 15g fast sugar and wait another 15 minutes.'}</p>
              </div>
            </div>
            <div class="leaflet-step-box">
              <div class="step-number">4</div>
              <div class="step-body">
                <b>${isAr ? 'تناول وجبة خفيفة مستقرة' : 'Eat a stabilizing snack or meal'}</b>
                <p>${isAr ? 'بمجرد أن يرتفع السكر فوق 70 ملغ/دسل، تناول وجبتك المعتادة أو شطيرة خبز أسمر مع جبن/حليب لمنع عودة الهبوط.' : 'Once blood glucose is >= 70 mg/dL, eat your regular meal or a complex carbohydrate snack (bread with cheese/milk) to prevent recurrence.'}</p>
              </div>
            </div>
          </div>
          <div class="leaflet-danger-callout">
            <span class="callout-icon">🚨</span>
            <div>
              <b>${isAr ? 'تنبيه طارئ عند فقدان الوعي أو التشنجات:' : 'Emergency Alert: Unconsciousness or Seizures:'}</b>
              <span>${isAr ? 'يُمنع منعاً باتاً وضع أي طعام أو شراب في فم المريض (خطر الاختناق). يتم إعطاء حقنة أو بخاخ الجلوكاجون الأنفي (Baqsimi) واستدعاء الإسعاف فوراً (997 في السعودية / 123 في مصر).' : 'NEVER put fluids or food into an unconscious patient\'s mouth (choking hazard). Administer emergency Glucagon (Baqsimi nasal spray or injection) and call EMS immediately.'}</span>
            </div>
          </div>
        </div>
      `;
    }

    function renderSadmansRules(lang) {
      const isAr = (lang === 'ar');
      const items = [
        { l: 'S', drug: 'SGLT2 inhibitors (Jardiance, Forxiga)', drugAr: 'مثبطات SGLT2 (جارديانس، فورسيجا)', why: 'Hold to prevent euglycemic diabetic ketoacidosis (DKA) and acute kidney injury.', whyAr: 'يوقف فوراً لتفادي الحماض الكيتوني السكري السليم وقصور وظائف الكلى.' },
        { l: 'A', drug: 'ACE Inhibitors (Ramipril, Enalapril, Lisinopril)', drugAr: 'مثبطات ACE (تريتاس، راميبريل، ليسينوبريل)', why: 'Hold temporarily to prevent acute drop in kidney filtration during dehydration.', whyAr: 'يوقف مؤقتاً لتجنب الهبوط الحاد في وظائف وترشيح الكلى أثناء الجفاف.' },
        { l: 'D', drug: 'Diuretics (Lasix, Natrilix, Hydrochlorothiazide)', drugAr: 'مدرات البول (لازيكس، ناتريليكس، هيدروكلوروثيازيد)', why: 'Hold to prevent severe volume depletion, dehydration, and electrolyte shock.', whyAr: 'يوقف لتجنب الجفاف الشديد وفقدان السوائل واضطراب أملاح الدم.' },
        { l: 'M', drug: 'Metformin (Glucophage)', drugAr: 'ميتفورمين (جلوكوفاج)', why: 'Hold immediately to prevent rare but fatal Lactic Acidosis if dehydration occurs.', whyAr: 'يوقف فوراً لتفادي خطر تراكم حمض اللاكتيك القاتل (Lactic Acidosis) عند نقص السوائل.' },
        { l: 'A', drug: 'ARBs (Diovan, Micardis, Cozaar, Atacand)', drugAr: 'مضادات مستقبلات الأنجيوتنسين (ديوفان، ميكارديس، كوزار)', why: 'Hold temporarily during dehydrating illness to protect kidney hemodynamics.', whyAr: 'يوقف مؤقتاً أثناء القيء أو الإسهال لحماية الكلى من القصور الوظيفي.' },
        { l: 'N', drug: 'NSAIDs (Brufen, Voltaren, Cataflam, Naproxen)', drugAr: 'مسكنات الالتهاب اللاستيرويدية (بروفين، فولتارين، كتافلام)', why: 'AVOID COMPLETELY. Severe renal vasoconstriction. Use Paracetamol/Panadol instead.', whyAr: 'تجنبها تماماً! تسبب تضيقاً حاداً في شرايين الكلى. استخدم باراسيتامول/بانادول كبديل آمن.' },
        { l: 'S', drug: 'Sulfonylureas (Diamicron, Amaryl)', drugAr: 'سلفونيل يوريا (دياميكرون، أماريل)', why: 'Hold or halve dose to avoid prolonged severe hypoglycemia when food intake drops.', whyAr: 'يوقف أو تخفض جرعته لتفادي هبوط السكر الشديد والمستمر عند قلة الأكل.' }
      ];

      return `
        <div class="leaflet-section-card">
          <div class="leaflet-card-header">
            <span class="leaflet-header-icon">⚠️</span>
            <div>
              <h3>${isAr ? 'قواعد أيام المرض (SADMANS Sick-Day Rules)' : 'SADMANS Sick-Day Management'}</h3>
              <p class="leaflet-subtitle">${isAr ? 'أدوية يجب إيقافها مؤقتاً عند الإصابة بنزلات معوية، قيء، إسهال شديد، حمى مرتفعة، أو جفاف لحماية الكلى' : 'Medications to hold temporarily during acute vomiting, diarrhea, high fever, or dehydration to protect kidneys.'}</p>
            </div>
          </div>
          <div class="sadmans-list">
            ${items.map(it => `
              <div class="sadmans-item">
                <div class="sadmans-badge">${it.l}</div>
                <div class="sadmans-content">
                  <div class="sadmans-drug">${isAr ? it.drugAr : it.drug}</div>
                  <div class="sadmans-why">${isAr ? it.whyAr : it.why}</div>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="leaflet-tip-box mt-3">
            <b>${isAr ? 'متى تستأنف العلاج؟' : 'When to restart?'}</b>
            <span>${isAr ? 'استأنف تناول هذه الأدوية بعد مرور 24 إلى 48 ساعة من تعافيك التام وقدرتك على شرب وتناول الطعام بصورة طبيعية، أو بعد مراجعة طبيبك.' : 'Restart these medications 24-48 hours after illness resolves and normal eating and fluid intake resume, or upon physician advice.'}</span>
          </div>
        </div>
      `;
    }

    function renderHomeBpTechnique(lang) {
      const isAr = (lang === 'ar');
      return `
        <div class="leaflet-section-card">
          <div class="leaflet-card-header">
            <span class="leaflet-header-icon">🩺</span>
            <div>
              <h3>${isAr ? 'الطريقة المعتمدة لقياس الضغط المنزلي (Home BP Technique)' : 'Validated Home BP Monitoring Protocol'}</h3>
              <p class="leaflet-subtitle">${isAr ? 'إرشادات الجمعية الأوروبية لأمراض القلب ESC ورابطة القلب الأمريكية لحساب متوسط دقيق' : 'ESC and AHA guidelines for accurate home blood pressure readings and diary recording.'}</p>
            </div>
          </div>
          <div class="bp-protocol-grid">
            <div class="bp-card">
              <h4>${isAr ? '1. الاستعداد والتحضير' : '1. Preparation'}</h4>
              <ul>
                <li>${isAr ? 'تجنب التدخين، القهوة، الشاي والرياضة لمدة 30 دقيقة قبل القياس.' : 'No smoking, caffeine, tea, or exercise for 30 minutes prior.'}</li>
                <li>${isAr ? 'أفرغ المثانة تماماً قبل الجلوس.' : 'Empty bladder completely before testing.'}</li>
                <li>${isAr ? 'استرح في هدوء تام جالساً لمدة 5 دقائق دون كلام أو استخدام للهاتف.' : 'Rest quietly for 5 minutes without talking or using smartphone.'}</li>
              </ul>
            </div>
            <div class="bp-card">
              <h4>${isAr ? '2. وضعية الجلوس الصحيحة' : '2. Correct Posture'}</h4>
              <ul>
                <li>${isAr ? 'اجلس على كرسي مع إسناد الظهر بشكل مستقيم.' : 'Sit in a supportive chair with back supported straight.'}</li>
                <li>${isAr ? 'ضع القدمين مستويتين على الأرض (لا تعقد الساقين أو تضع ساقاً فوق أخرى).' : 'Feet flat on floor; do NOT cross legs or ankles.'}</li>
                <li>${isAr ? 'أسند الذراع على طاولة بحيث يكون منتصف حزام الجهاز بمحاذاة مستوى القلب.' : 'Support bare arm on table with cuff at heart level.'}</li>
              </ul>
            </div>
            <div class="bp-card">
              <h4>${isAr ? '3. جهاز القياس والحزام' : '3. Device & Cuff'}</h4>
              <ul>
                <li>${isAr ? 'استخدم جهاز قياس إلكتروني معتمد يقيس من أعلى الذراع (تجنب أجهزة الرسغ والأصابع).' : 'Use a validated upper-arm cuff monitor (avoid wrist/finger devices).'}</li>
                <li>${isAr ? 'ثبت الحزام على الجلد مباشرة 2-3 سم فوق ثنية الكوع بمقاس مناسب لذراعك.' : 'Place cuff on bare arm 2-3 cm above elbow crease with snug fit.'}</li>
              </ul>
            </div>
            <div class="bp-card">
              <h4>${isAr ? '4. بروتوكول القياس الأسبوعي' : '4. Weekly Protocol'}</h4>
              <ul>
                <li>${isAr ? 'خذ قراءتين بينهما دقيقة صباحاً (قبل الإفطار والأدوية).' : 'Take 2 readings 1 minute apart in morning (before breakfast & pills).'}</li>
                <li>${isAr ? 'خذ قراءتين بينهما دقيقة مساءً (قبل العشاء أو النوم).' : 'Take 2 readings 1 minute apart in evening (before dinner/bed).'}</li>
                <li>${isAr ? 'كرر ذلك لمدة 7 أيام متتالية، ودون القراءات في دفتر القياس لعرضه على الطبيب.' : 'Perform for 7 consecutive days; record in a log to average days 2-7.'}</li>
              </ul>
            </div>
          </div>
        </div>
      `;
    }

    function renderStatinAdherence(lang) {
      const isAr = (lang === 'ar');
      return `
        <div class="leaflet-section-card">
          <div class="leaflet-card-header">
            <span class="leaflet-header-icon">🛡️</span>
            <div>
              <h3>${isAr ? 'التثقيف الدوائي للستاتين والالتزام بالعلاج' : 'Statin Adherence & Cardiovascular Protection'}</h3>
              <p class="leaflet-subtitle">${isAr ? 'حقائق علمية وإرشادات لضمان حماية القلب والشرايين بأمان تام' : 'Evidence-based guidance on why statin therapy is vital and safe.'}</p>
            </div>
          </div>
          <div class="statin-points-grid">
            <div class="statin-point">
              <b>${isAr ? 'لماذا الستاتين ضروري لحياتك؟' : 'Why statins are prescribed?'}</b>
              <p>${isAr ? 'الستاتين لا يخفض الكوليسترول فحسب، بل يثبت اللويحات الدهنية في جدران الشرايين ويمنع انفجارها، مما يقلل احتمالية الجلطات القلبية والدماغية بنسبة تفوق 30%.' : 'Statins do more than lower LDL; they stabilize arterial plaques, preventing plaque rupture, heart attacks, and strokes.'}</p>
            </div>
            <div class="statin-point">
              <b>${isAr ? 'طريقة وتوقيت الاستخدام اليومي' : 'Timing and Daily Consistency'}</b>
              <p>${isAr ? 'يؤخذ حبة واحدة يومياً. يمكن أخذ أتورفاستاتين (ليبيتور) أو روزوفاستاتين (كريستور) في أي وقت (صباحاً أو مساءً)، بينما يفضل أخذ سيمفاستاتين (زوكور) مساءً قبل النوم.' : 'Take once daily. Atorvastatin and Rosuvastatin can be taken anytime; Simvastatin is best taken in the evening before bedtime.'}</p>
            </div>
            <div class="statin-point">
              <b>${isAr ? 'ماذا تفعل إذا شعرت بآلام عضلية؟' : 'What about muscle aches?'}</b>
              <p>${isAr ? 'معظم آلام العضلات البسيطة مؤقتة أو غير مرتبطة بالدواء. لا توقف الستاتين من تلقاء نفسك أبداً! تواصل مع طبيبك ليقوم بفحص إنزيمات العضلات، أو تعديل الجرعة، أو تبديل النوع لنوع أكثر ملاءمة.' : 'Mild aches are often transient or coincidental. NEVER stop your statin abruptly without calling your doctor, who can check CK levels, adjust dose, or switch agents.'}</p>
            </div>
            <div class="statin-point">
              <b>${isAr ? 'أمان الكبد والذاكرة' : 'Safety for Liver and Memory'}</b>
              <p>${isAr ? 'أثبتت الدراسات العالمية أمان الستاتين الفائق على المدى الطويل؛ الستاتين لا يسبب الخرف بل يحمي شرايين الدماغ من السكتات، ويتم فحص إنزيمات الكبد دورياً للاطمئنان.' : 'Extensive trials prove long-term safety. Statins do NOT cause memory loss or dementia, and protect cerebral vessels from vascular damage.'}</p>
            </div>
          </div>
        </div>
      `;
    }

    function renderRedFlags(lang) {
      const isAr = (lang === 'ar');
      return `
        <div class="leaflet-redflag-box">
          <div class="redflag-header">
            <span class="redflag-siren">🚨</span>
            <div>
              <h3 style="margin:0;color:#991B1B;">${isAr ? 'علامات الإنذار والخطورة الطارئة (توجه للطوارئ فوراً)' : 'Emergency Red Flags: Seek Immediate Emergency Care'}</h3>
              <p style="margin:2px 0 0;font-size:12px;color:#B91C1C;">${isAr ? 'إذا واجهت أياً من هذه الأعراض، اتصل بالإسعاف (997 في السعودية / 123 في مصر) أو توجه لأقرب مستشفى' : 'If you experience any of these symptoms, call EMS or proceed to the nearest emergency room immediately.'}</p>
            </div>
          </div>
          <div class="redflag-grid">
            <div class="redflag-col">
              <b>${isAr ? '💓 طوارئ ضغط الدم (BP ≥ 180/120)' : '💓 Blood Pressure Emergency (≥ 180/120)'}</b>
              <ul>
                <li>${isAr ? 'صداع حاد ومفاجئ لا يستجيب للمسكنات' : 'Severe, sudden, throbbing headache'}</li>
                <li>${isAr ? 'تشوش مفاجئ في الرؤية أو ازدواجية أو فقدان البصر' : 'Sudden visual changes, blurring, or loss of vision'}</li>
                <li>${isAr ? 'ألم أو ثقل شديد في الصدر أو صعوبة حادة بالتنفس' : 'Acute chest tightness, pain, or shortness of breath'}</li>
                <li>${isAr ? 'تنميل أو ضعف في جانب واحد من الوجه أو الذراع، أو صعوبة بالكلام' : 'Sudden face droop, arm weakness, or slurred speech'}</li>
              </ul>
            </div>
            <div class="redflag-col">
              <b>${isAr ? '🩺 طوارئ السكر (Severe Hypo / DKA)' : '🩺 Diabetes Emergencies'}</b>
              <ul>
                <li>${isAr ? 'فقدان الوعي، عدم القدرة على البلع، أو حدوث تشنجات' : 'Loss of consciousness, inability to swallow, or seizures'}</li>
                <li>${isAr ? 'هبوط سكر لا يستجيب لتناول السكر بعد مرتين متتاليتين' : 'Hypoglycemia not responding after two cycles of Rule of 15'}</li>
                <li>${isAr ? 'ارتفاع مستمر فوق 300 ملغ/دسل مع قيء متكرر ورائحة أسيتون بالفم وتنفس سريع (علامات حموضة الدم الكيتونية DKA)' : 'Glucose > 300 mg/dL with vomiting, fruity breath, and rapid deep breathing (DKA)'}</li>
              </ul>
            </div>
            <div class="redflag-col">
              <b>${isAr ? '🩸 طوارئ القلب والشرايين (Heart & Arteries)' : '🩸 Cardiovascular Red Flags'}</b>
              <ul>
                <li>${isAr ? 'ألم عاصر في منتصف الصدر يمتد للكتف الأيسر أو الفك' : 'Crushing substernal chest pressure radiating to left arm/jaw'}</li>
                <li>${isAr ? 'عرق بارد مصحوب بدوخة وغثيان شديد' : 'Profuse cold sweat with dizziness and severe nausea'}</li>
                <li>${isAr ? 'تورم مفاجئ ومؤلم في ربلة ساق واحدة مع احمرار' : 'Sudden painful swelling in one calf with redness (DVT)'}</li>
              </ul>
            </div>
          </div>
        </div>
      `;
    }

    // Dynamic targets summary card for patient
    function renderTargetsCard(targets, lang) {
      const isAr = (lang === 'ar');
      return `
        <div class="leaflet-targets-card">
          <div class="targets-card-header">
            <div>
              <span class="targets-badge">${isAr ? 'أهدافك العلاجية الفردية' : 'Your Individualized Health Targets'}</span>
              <h2 style="margin:4px 0 0;font-size:18px;">${isAr ? 'خطة التحكم الشخصية' : 'Personal Health Plan'} · ${targets.patientName} (${targets.age} ${isAr ? 'سنة' : 'years'})</h2>
            </div>
            <div class="targets-sync-indicator">
              <span class="sync-dot"></span>
              <span>${isAr ? 'متزامن مع الملف الطبي' : 'Synced with clinical file'}</span>
            </div>
          </div>
          <div class="targets-metrics-row">
            <div class="target-metric-box">
              <span class="metric-lbl">${isAr ? 'السكر التراكمي المستهدف (HbA1c)' : 'Target HbA1c'}</span>
              <div class="metric-val text-teal">${targets.dm.targetA1c}</div>
              <small class="metric-sub">${isAr ? targets.dm.targetDescAr : targets.dm.targetDescEn}</small>
              <div class="metric-curr">${isAr ? 'القراءة الحالية:' : 'Current:'} <b>${targets.dm.currentA1c}</b></div>
            </div>
            <div class="target-metric-box">
              <span class="metric-lbl">${isAr ? 'ضغط الدم المستهدف (Target BP)' : 'Target Blood Pressure'}</span>
              <div class="metric-val text-grape">${targets.htn.targetBp}</div>
              <small class="metric-sub">${isAr ? targets.htn.targetHomeBp : targets.htn.targetHomeBpEn}</small>
              <div class="metric-curr">${isAr ? 'القراءة الحالية:' : 'Current:'} <b>${targets.htn.currentBp}</b></div>
            </div>
            <div class="target-metric-box">
              <span class="metric-lbl">${isAr ? 'الكوليسترول الضار (Target LDL-C)' : 'Target LDL-C'}</span>
              <div class="metric-val text-amber">${targets.dlp.targetLdl}</div>
              <small class="metric-sub">${isAr ? targets.dlp.riskTierAr : targets.dlp.riskTier}</small>
              <div class="metric-curr">${isAr ? 'المستوى المقدر:' : 'Non-HDL Target:'} <b>${targets.dlp.targetNonHdl}</b></div>
            </div>
          </div>
        </div>
      `;
    }

    // Top interactive toolbar for the leaflets view
    function renderToolbar(lang, activeTab) {
      const isAr = (lang === 'ar');
      return `
        <div class="leaflet-toolbar">
          <div class="leaflet-tab-group">
            <button class="leaflet-tab-btn ${activeTab === 'all' ? 'active' : ''}" data-condition="all">
              <span>📋</span> ${isAr ? 'الشامل (الكل)' : 'Comprehensive'}
            </button>
            <button class="leaflet-tab-btn ${activeTab === 'dm' ? 'active' : ''}" data-condition="dm">
              <span>🩺</span> ${isAr ? 'السكري' : 'Diabetes'}
            </button>
            <button class="leaflet-tab-btn ${activeTab === 'htn' ? 'active' : ''}" data-condition="htn">
              <span>💓</span> ${isAr ? 'الضغط' : 'Hypertension'}
            </button>
            <button class="leaflet-tab-btn ${activeTab === 'dlp' ? 'active' : ''}" data-condition="dlp">
              <span>🩸</span> ${isAr ? 'الدهون والستاتين' : 'Lipids & Statins'}
            </button>
          </div>
          <div class="leaflet-actions-group">
            <div class="zoom-controls">
              <button id="leaflet-zoom-out" class="icon-tool-btn" title="${isAr ? 'تصغير الخط' : 'Zoom Out'}">A-</button>
              <button id="leaflet-zoom-in" class="icon-tool-btn" title="${isAr ? 'تكبير الخط' : 'Zoom In'}">A+</button>
            </div>
            <button id="leaflet-lang-toggle" class="lang-tool-btn" title="${isAr ? 'التبديل للإنجليزية' : 'Switch to Arabic'}">
              🌐 ${isAr ? 'English' : 'عربي'}
            </button>
            <button id="leaflet-qr-btn" class="pill-tool-btn qr-pill" title="${isAr ? 'إنشاء رمز QR أوفلاين' : 'Offline QR Code'}">
              📱 <span>${isAr ? 'رمز QR' : 'QR Code'}</span>
            </button>
            <button id="leaflet-share-btn" class="pill-tool-btn share-pill" title="${isAr ? 'مشاركة النشرة مع المريض' : 'Share Leaflet'}">
              📤 <span>${isAr ? 'مشاركة' : 'Share'}</span>
            </button>
          </div>
        </div>
      `;
    }

    // QR Code Modal markup
    function renderQrModal(lang) {
      const isAr = (lang === 'ar');
      return `
        <div class="modal-overlay" id="leaflet-qr-modal">
          <div class="modal-card modal-qr-card">
            <div class="modal-header">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:22px;">📱</span>
                <div>
                  <h3 style="margin:0;font-size:16px;">${isAr ? 'رمز QR للنشرة التثقيفية للمريض' : 'Patient Leaflet Offline QR Code'}</h3>
                  <span style="font-size:11px;color:var(--muted);">${isAr ? 'ISO/IEC 18004 الإصدار 6-L (بدون إنترنت 100%)' : 'ISO/IEC 18004 Version 6-L (100% Offline)'}</span>
                </div>
              </div>
              <button type="button" class="icon-btn" id="close-qr-modal-btn" aria-label="Close">✕</button>
            </div>
            <div class="modal-body text-center" style="padding:20px 10px;">
              <div id="leaflet-qr-svg-container" class="qr-svg-box">
                <!-- Injected SVG QR Code -->
              </div>
              <p class="qr-hint" style="margin-top:12px;font-size:12.5px;color:var(--muted);">
                ${isAr ? 'امسح الرمز بكاميرا هاتف المريض لحفظ خطة العلاج والأهداف والعلامات التحذيرية فوراً بدون إنترنت.' : 'Scan with the patient\'s phone camera to instantly access health targets, Rule of 15, and red flags offline.'}
              </p>
            </div>
            <div class="modal-footer" style="display:flex;gap:8px;justify-content:flex-end;">
              <button type="button" class="btn btn-secondary" id="dismiss-qr-modal-btn">${isAr ? 'إغلاق' : 'Close'}</button>
              <button type="button" class="btn btn-primary" id="copy-qr-text-btn">${isAr ? '📋 نسخ نص النشرة' : '📋 Copy Text'}</button>
            </div>
          </div>
        </div>
      `;
    }

    // Build plain text for sharing
    function buildShareText(targets, lang, condition) {
      const isAr = (lang === 'ar');
      let t = '';
      if (isAr) {
        t += `📋 *النشرة التثقيفية الطبية والخطة العلاجية*\n`;
        t += `👤 المريض: ${targets.patientName} (${targets.age} سنة)\n`;
        t += `👨‍⚕️ عيادة د. حسام يوسف - طب الأسرة\n`;
        t += `──────────────────────\n`;
        if (condition === 'all' || condition === 'dm') {
          t += `🎯 *أهداف السكري (ADA 2025):*\n`;
          t += `• السكر التراكمي المستهدف: ${targets.dm.targetA1c}\n`;
          t += `• السكر الصائم: ${targets.dm.targetFpg}\n`;
          t += `• السكر بعد الأكل بساعتين: ${targets.dm.targetPpg}\n\n`;
          t += `🍬 *قاعدة 15 لعلاج هبوط السكر (< 70 ملغ/دسل):*\n`;
          t += `1. تناول 15 غرام سكر سريع (نصف كوب عصير / 3 أقراص جلوكوز / ملعقة سكر كبيرة).\n`;
          t += `2. استرح 15 دقيقة ثم أعد القياس.\n`;
          t += `3. كرر إذا ما زال أقل من 70، ثم تناول وجبة خفيفة مستقرة.\n\n`;
          t += `⚠️ *قواعد أيام المرض (SADMANS):*\n`;
          t += `أوقف مؤقتاً عند القيء/الجفاف: جارديانس/فورسيجا، تريتاس/مثبطات ACE، مدرات البول، جلوكوفاج، المسكنات (بروفين/فولتارين)، وأماريل/دياميكرون.\n\n`;
        }
        if (condition === 'all' || condition === 'htn') {
          t += `💓 *أهداف وضوابط ضغط الدم:*\n`;
          t += `• الضغط المستهدف: ${targets.htn.targetBp}\n`;
          t += `• القياس المنزلي الصحيح: راحة 5 دقائق، الظهر مسنود، الذراع بمستوى القلب، قراءتان صباحاً ومساءً لمدة 7 أيام.\n\n`;
        }
        if (condition === 'all' || condition === 'dlp') {
          t += `🩸 *أهداف الكوليسترول والستاتين:*\n`;
          t += `• مستوى LDL المستهدف: ${targets.dlp.targetLdl}\n`;
          t += `• التزم بحبة الستاتين يومياً لحماية الشرايين ومنع الجلطات.\n\n`;
        }
        t += `🚨 *علامات الطوارئ القصوى:* صداع مفاجئ شديد، تشوش رؤية، ألم بالصدر، تنميل بالوجه أو اليد، فقدان وعي -> اتصل بالإسعاف (997 في السعودية / 123 في مصر) فوراً.`;
      } else {
        t += `📋 *Patient Health Education & Care Plan*\n`;
        t += `👤 Patient: ${targets.patientName} (${targets.age} y)\n`;
        t += `👨‍⚕️ Dr. Hossam Yousuf · Family Practice\n`;
        t += `──────────────────────\n`;
        if (condition === 'all' || condition === 'dm') {
          t += `🎯 *Diabetes Targets:*\n`;
          t += `• Target HbA1c: ${targets.dm.targetA1c}\n`;
          t += `• Fasting Glucose: ${targets.dm.targetFpg}\n`;
          t += `• 2h Post-prandial: ${targets.dm.targetPpg}\n\n`;
          t += `🍬 *Rule of 15 for Hypoglycemia (< 70 mg/dL):*\n`;
          t += `1. Take 15g fast sugar (1/2 cup juice or 3 glucose tabs).\n`;
          t += `2. Rest 15 mins and retest.\n`;
          t += `3. Repeat if < 70, then eat a complex carb snack.\n\n`;
          t += `⚠️ *SADMANS Sick-Day Rules:*\n`;
          t += `Hold during dehydration/vomiting: SGLT2i, ACEi, Diuretics, Metformin, ARBs, NSAIDs, Sulfonylureas.\n\n`;
        }
        if (condition === 'all' || condition === 'htn') {
          t += `💓 *Hypertension Targets:*\n`;
          t += `• Target BP: ${targets.htn.targetBp}\n`;
          t += `• Home Monitoring: Rest 5 min, arm at heart level, 2 readings AM & PM for 7 days.\n\n`;
        }
        if (condition === 'all' || condition === 'dlp') {
          t += `🩸 *Lipids & Statin Protection:*\n`;
          t += `• Target LDL: ${targets.dlp.targetLdl}\n`;
          t += `• Take statin daily to stabilize plaques and prevent vascular events.\n\n`;
        }
        t += `🚨 *Emergency Red Flags:* Severe sudden headache, chest pressure, vision loss, facial droop, or unconsciousness -> Call EMS immediately.`;
      }
      return t;
    }

    // Master render function into container
    function render(containerId) {
      const cId = containerId || 'patient-leaflet-container';
      const container = (typeof document !== 'undefined') ? document.getElementById(cId) : null;
      if (!container) return;

      const pt = getPatientData();
      const targets = getDynamicTargets(pt);

      let sectionsHtml = '';
      if (currentCondition === 'all') {
        sectionsHtml = `
          ${renderTargetsCard(targets, currentLang)}
          ${renderRuleOf15(currentLang)}
          ${renderSadmansRules(currentLang)}
          ${renderHomeBpTechnique(currentLang)}
          ${renderStatinAdherence(currentLang)}
          ${renderRedFlags(currentLang)}
        `;
      } else if (currentCondition === 'dm') {
        sectionsHtml = `
          ${renderTargetsCard(targets, currentLang)}
          ${renderRuleOf15(currentLang)}
          ${renderSadmansRules(currentLang)}
          ${renderRedFlags(currentLang)}
        `;
      } else if (currentCondition === 'htn') {
        sectionsHtml = `
          ${renderTargetsCard(targets, currentLang)}
          ${renderHomeBpTechnique(currentLang)}
          ${renderRedFlags(currentLang)}
        `;
      } else if (currentCondition === 'dlp') {
        sectionsHtml = `
          ${renderTargetsCard(targets, currentLang)}
          ${renderStatinAdherence(currentLang)}
          ${renderRedFlags(currentLang)}
        `;
      }

      container.innerHTML = `
        <div class="leaflet-wrapper" style="--leaflet-font-scale: ${fontScale};" dir="${currentLang === 'ar' ? 'rtl' : 'ltr'}">
          ${renderToolbar(currentLang, currentCondition)}
          <div class="leaflet-content-body">
            ${sectionsHtml}
          </div>
          ${renderQrModal(currentLang)}
        </div>
      `;

      attachEvents(container, targets);
    }

    // Attach event listeners to toolbar and modal
    function attachEvents(container, targets) {
      if (!container) return;

      // Tab switcher
      container.querySelectorAll('.leaflet-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          currentCondition = btn.getAttribute('data-condition') || 'all';
          render();
        });
      });

      // Language toggle
      const langBtn = container.querySelector('#leaflet-lang-toggle');
      if (langBtn) {
        langBtn.addEventListener('click', (e) => {
          e.preventDefault();
          currentLang = (currentLang === 'ar') ? 'en' : 'ar';
          render();
        });
      }

      // Font zoom
      const zoomInBtn = container.querySelector('#leaflet-zoom-in');
      const zoomOutBtn = container.querySelector('#leaflet-zoom-out');
      if (zoomInBtn) {
        zoomInBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (fontScale < 1.35) {
            fontScale += 0.1;
            render();
          }
        });
      }
      if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (fontScale > 0.85) {
            fontScale -= 0.1;
            render();
          }
        });
      }

      // Share button
      const shareBtn = container.querySelector('#leaflet-share-btn');
      if (shareBtn) {
        shareBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          const shareText = buildShareText(targets, currentLang, currentCondition);
          if (navigator && navigator.share) {
            try {
              await navigator.share({
                title: currentLang === 'ar' ? 'النشرة التثقيفية للمريض' : 'Patient Health Leaflet',
                text: shareText
              });
              return;
            } catch (err) {
              // fallback
            }
          }
          if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
            try {
              await navigator.clipboard.writeText(shareText);
              if (window.RxShare && typeof window.RxShare.showToast === 'function') {
                window.RxShare.showToast(currentLang === 'ar' ? '✅ تم نسخ نص النشرة لمشاركته' : '✅ Leaflet copied to clipboard');
              } else {
                alert(currentLang === 'ar' ? 'تم نسخ نص النشرة بنجاح' : 'Leaflet text copied');
              }
            } catch(e2) {}
          }
        });
      }

      // QR Code Modal Trigger
      const qrBtn = container.querySelector('#leaflet-qr-btn');
      const qrModal = container.querySelector('#leaflet-qr-modal');
      const closeQrBtn = container.querySelector('#close-qr-modal-btn');
      const dismissQrBtn = container.querySelector('#dismiss-qr-modal-btn');
      const copyQrTextBtn = container.querySelector('#copy-qr-text-btn');
      const qrContainer = container.querySelector('#leaflet-qr-svg-container');

      if (qrBtn && qrModal) {
        qrBtn.addEventListener('click', (e) => {
          e.preventDefault();
          const compactQrText = `Osrawy Rx: ${targets.patientName} | A1c:${targets.dm.targetA1c} BP:${targets.htn.targetBp} LDL:${targets.dlp.targetLdl} | Rule15: 15g sugar/15m | SADMANS | EMS 997`;
          if (qrContainer) {
            qrContainer.innerHTML = OsrawyQRCode.generateSVG(compactQrText, { size: 240, margin: 4, darkColor: '#0A4F4B' });
          }
          qrModal.classList.add('open');
        });
      }

      function closeQrModal() {
        if (qrModal) qrModal.classList.remove('open');
      }

      if (closeQrBtn) closeQrBtn.addEventListener('click', closeQrModal);
      if (dismissQrBtn) dismissQrBtn.addEventListener('click', closeQrModal);
      if (copyQrTextBtn) {
        copyQrTextBtn.addEventListener('click', async () => {
          const shareText = buildShareText(targets, currentLang, currentCondition);
          if (navigator && navigator.clipboard) {
            await navigator.clipboard.writeText(shareText);
            if (window.RxShare && typeof window.RxShare.showToast === 'function') {
              window.RxShare.showToast(currentLang === 'ar' ? '✅ تم نسخ نص النشرة بنجاح' : '✅ Leaflet text copied');
            }
          }
          closeQrModal();
        });
      }
    }

    // Initialize module & listen for patient updates
    function init() {
      // Sync language from global I18n if active
      if (typeof window.I18n !== 'undefined' && typeof window.I18n.getLang === 'function') {
        currentLang = window.I18n.getLang() || 'ar';
      }

      // Initial render if container exists
      render();

      // Listen to Osrawy Patient State updates
      const eventTarget = (typeof window !== 'undefined') ? window : globalThis;
      if (eventTarget && eventTarget.addEventListener) {
        eventTarget.addEventListener('osrawy:patient-updated', () => {
          render();
        });
      }
    }

    return {
      init,
      render,
      getDynamicTargets,
      buildShareText,
      setCondition: (c) => { currentCondition = c; render(); },
      setLang: (l) => { currentLang = l; render(); },
      generateQRCode: (text, options) => OsrawyQRCode.generateSVG(text, options)
    };
  })();

  // Global Attachments
  if (typeof window !== 'undefined') {
    window.OsrawyQRCode = OsrawyQRCode;
    window.PatientLeaflets = PatientLeaflets;
    window.OsrawyPatientLeaflets = PatientLeaflets;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OsrawyQRCode, PatientLeaflets };
  }
})();
