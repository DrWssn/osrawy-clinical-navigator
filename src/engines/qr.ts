import { getDynamicTargets } from './leaflets';

const SIZE = 41; // Version 6 matrix dimension = 21 + (6-1)*4 = 41
export const QR_MAX_UTF8_BYTES = 134;

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

function gfMul(a: number, b: number): number {
  return (a === 0 || b === 0) ? 0 : gfExp[gfLog[a] + gfLog[b]];
}

function rsGenPoly(degree: number): number[] {
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

function calcEC(data: number[], degree: number): number[] {
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

function toUtf8Bytes(str: string, maxBytes: number = 134): number[] {
  const s = String(str || '');
  const limit = (typeof maxBytes === 'number' && maxBytes > 0) ? maxBytes : 134;
  const bytes: number[] = [];
  for (let i = 0; i < s.length; i++) {
    let code = s.charCodeAt(i);
    let charBytes: number[];
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

class BitBuffer {
  buffer: number[] = [];
  length: number = 0;

  put(val: number, len: number) {
    for (let i = 0; i < len; i++) {
      this.putBit(((val >>> (len - i - 1)) & 1) === 1);
    }
  }

  putBit(bit: boolean) {
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

export function createQrMatrix(text: string): (number | null)[][] {
  const dataBytes = toUtf8Bytes(text, 134);
  const bb = new BitBuffer();
  bb.put(0x04, 4);
  bb.put(dataBytes.length, 8);
  for (let i = 0; i < dataBytes.length; i++) {
    bb.put(dataBytes[i], 8);
  }
  const maxDataBits = 136 * 8;
  const termLen = Math.min(4, maxDataBits - bb.length);
  bb.put(0, termLen);
  while (bb.length % 8 !== 0) {
    bb.putBit(false);
  }
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bb.length < maxDataBits) {
    bb.put(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  const b1Data = bb.buffer.slice(0, 68);
  const b2Data = bb.buffer.slice(68, 136);
  const b1Ec = calcEC(b1Data, 18);
  const b2Ec = calcEC(b2Data, 18);

  const finalCodewords: number[] = [];
  for (let i = 0; i < 68; i++) {
    finalCodewords.push(b1Data[i]);
    finalCodewords.push(b2Data[i]);
  }
  for (let i = 0; i < 18; i++) {
    finalCodewords.push(b1Ec[i]);
    finalCodewords.push(b2Ec[i]);
  }

  const allBits: boolean[] = [];
  for (let i = 0; i < finalCodewords.length; i++) {
    const byte = finalCodewords[i];
    for (let b = 7; b >= 0; b--) {
      allBits.push(((byte >> b) & 1) === 1);
    }
  }
  for (let r = 0; r < 7; r++) {
    allBits.push(false);
  }

  const matrix: (number | null)[][] = Array.from({ length: SIZE }, () => new Array(SIZE).fill(null));
  const reserved: boolean[][] = Array.from({ length: SIZE }, () => new Array(SIZE).fill(false));

  function placeFinder(r: number, c: number) {
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

  function placeAlignment(cr: number, cc: number) {
    for (let y = -2; y <= 2; y++) {
      for (let x = -2; x <= 2; x++) {
        reserved[cr + y][cc + x] = true;
        matrix[cr + y][cc + x] = (Math.max(Math.abs(y), Math.abs(x)) === 1) ? 0 : 1;
      }
    }
  }
  placeAlignment(34, 34);

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

  reserved[33][8] = true;
  matrix[33][8] = 1;

  for (let i = 0; i <= 8; i++) {
    reserved[8][i] = true;
    reserved[i][8] = true;
  }
  for (let i = SIZE - 8; i < SIZE; i++) {
    reserved[8][i] = true;
    reserved[i][8] = true;
  }

  let bitIdx = 0;
  let goingUp = true;
  for (let col = SIZE - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    const rows: number[] = [];
    for (let i = 0; i < SIZE; i++) {
      rows.push(goingUp ? (SIZE - 1 - i) : i);
    }
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      for (let c = col; c >= col - 1; c--) {
        if (!reserved[row][c]) {
          const bit = bitIdx < allBits.length ? allBits[bitIdx] : false;
          bitIdx++;
          const mask = ((row + c) % 2 === 0);
          matrix[row][c] = ((bit ? 1 : 0) ^ (mask ? 1 : 0)) ? 1 : 0;
        }
      }
    }
    goingUp = !goingUp;
  }

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

export function generateSVG(text: string, options?: { size?: number; margin?: number; darkColor?: string; lightColor?: string }): string {
  const opt = options || {};
  const pxSize = opt.size || 240;
  const margin = (opt.margin !== undefined) ? opt.margin : 4;
  const darkColor = opt.darkColor || '#0A4F4B';
  const lightColor = opt.lightColor || '#FFFFFF';

  const matrix = createQrMatrix(text);
  const totalSize = SIZE + (margin * 2);

  let pathD = '';
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (matrix[r][c] === 1) {
        const cx = c + margin;
        const cy = r + margin;
        pathD += `M${cx},${cy}h1v1h-1z `;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${pxSize}" height="${pxSize}" shape-rendering="crispEdges" aria-label="QR Code">
  <rect width="100%" height="100%" fill="${lightColor}"/>
  <path fill="${darkColor}" d="${pathD.trim()}"/>
</svg>`;
}

export function getUtf8ByteLength(str: string): number {
  const s = String(str || '');
  let len = 0;
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code < 0x80) len += 1;
    else if (code < 0x800) len += 2;
    else if (code < 0xd800 || code >= 0xe000) len += 3;
    else {
      i++;
      len += 4;
    }
  }
  return len;
}

const MED_SHORT_CODES: Record<string, string> = {
  metformin: 'MET',
  empagliflozin: 'EMPA',
  dapagliflozin: 'DAPA',
  semaglutide: 'SEMA',
  tirzepatide: 'TIRZ',
  sitagliptin: 'SITA',
  gliclazide: 'GLIC',
  glimepiride: 'GLIM',
  insulin_glargine: 'GLAR',
  insulin: 'INS',
  perindopril: 'PER',
  ramipril: 'RAM',
  lisinopril: 'LIS',
  enalapril: 'ENA',
  valsartan: 'VAL',
  losartan: 'LOS',
  telmisartan: 'TEL',
  sacubitril_valsartan: 'ARNI',
  amlodipine: 'AML',
  indapamide: 'IND',
  bisoprolol: 'BIS',
  spironolactone: 'SPIR',
  labetalol: 'LAB',
  nifedipine_er: 'NIF',
  methyldopa: 'MDOPA',
  atorvastatin: 'ATOR',
  rosuvastatin: 'ROSU',
  simvastatin: 'SIMV',
  ezetimibe: 'EZE',
  fenofibrate: 'FENO',
  evolocumab: 'EVOL',
  budesonide_formoterol: 'BUD/F',
  salbutamol: 'SALB',
  tiotropium: 'TIO',
  levothyroxine: 'LT4',
  carbimazole: 'CARB',
  propranolol: 'PROP',
  apixaban: 'APIX',
  rivaroxaban: 'RIVA'
};

function sanitizeAsciiTag(name: string): string {
  const cleaned = String(name || '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/[|:,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return 'PT';
  const parts = cleaned.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0].slice(0, 8)} ${parts[1][0].toUpperCase()}.`.slice(0, 14);
  }
  return parts[0].slice(0, 12);
}

export function buildOfflinePatientQrPayload(pt?: any, targetsInput?: any): string {
  const p = pt || {};
  const targets = targetsInput || getDynamicTargets(p);

  const sbp = p.sbp ?? 148;
  const dbp = p.dbp ?? 94;
  const a1c = p.a1c ?? '-';
  const egfr = p.egfr ?? '-';
  const k = p.k ?? '-';

  const bpGoal = targets?.isElderlyOrFrail ? '<140/90' : '<130/80';
  const a1cGoal = targets?.isElderlyOrFrail ? '<7.5%' : '<7.0%';
  const ldlGoalNum = targets?.dlp?.ldlTargetMg ?? 70;

  const flagsList: string[] = [];
  if (p.pregnancy) flagsList.push('PREG');
  if (p.frail) flagsList.push('FRAIL');
  if (p.asthma) flagsList.push('ASTH');
  if (p.copd) flagsList.push('COPD');
  if (p.ascvd) flagsList.push('ASCVD');
  const flagsStr = flagsList.length > 0 ? `|F:${flagsList.join(',')}` : '';

  const rawMeds: string[] = Array.isArray(p.activeMeds)
    ? p.activeMeds
    : Array.isArray(p.meds)
      ? p.meds
      : Array.isArray(p.medications)
        ? p.medications
        : [];
  const medCodes = rawMeds.map(m => {
    const clean = String(m || '').trim().toLowerCase();
    return MED_SHORT_CODES[clean] || clean.replace(/[^a-z0-9]/gi, '').slice(0, 5).toUpperCase();
  }).filter(Boolean);

  let ptTag = sanitizeAsciiTag(p.name || 'Pt');
  const buildCore = (tag: string, rx: string) =>
    `OSRAWY|${tag}|BP:${sbp}/${dbp}(${bpGoal})|A1c:${a1c}%(${a1cGoal})|LDL<${ldlGoalNum}|eGFR:${egfr}|K:${k}${flagsStr}|Rx:${rx}`;

  // Try fitting all med codes, progressively trimming trailing codes if needed
  for (let count = medCodes.length; count >= 0; count--) {
    const remaining = medCodes.length - count;
    const rxStr = medCodes.length === 0
      ? 'NONE'
      : count === medCodes.length
        ? medCodes.join(',')
        : count === 0
          ? `+${remaining}`
          : `${medCodes.slice(0, count).join(',')}+${remaining}`;
    const candidate = buildCore(ptTag, rxStr);
    if (getUtf8ByteLength(candidate) <= QR_MAX_UTF8_BYTES) {
      return candidate;
    }
  }

  // Fallback: shorten patient tag & flags if still over 134 bytes
  ptTag = 'PT';
  const compact = `OSRAWY|${ptTag}|BP:${sbp}/${dbp}|A1c:${a1c}%|LDL<${ldlGoalNum}|eGFR:${egfr}|K:${k}|Rx:${medCodes.slice(0, 3).join(',') || 'NONE'}`;
  if (getUtf8ByteLength(compact) <= QR_MAX_UTF8_BYTES) return compact;

  return compact.slice(0, QR_MAX_UTF8_BYTES);
}

export const OsrawyQRCode = {
  SIZE,
  MAX_BYTES: QR_MAX_UTF8_BYTES,
  createMatrix: createQrMatrix,
  generateSVG,
  buildOfflinePatientQrPayload
};
