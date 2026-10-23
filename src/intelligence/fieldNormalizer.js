/**
 * NidhiSetu Document Intelligence — Field Normalization Engine
 * Deterministic normalization for dates, monetary amounts (INR paise),
 * bank identifiers, IFSC codes, and account holder strings.
 */

import { rupeesToPaise } from '../storage/fdrValidation';

const MONTH_NAMES = {
  jan: '01', january: '01',
  feb: '02', february: '02',
  mar: '03', march: '03',
  apr: '04', april: '04',
  may: '05',
  jun: '06', june: '06',
  jul: '07', july: '07',
  aug: '08', august: '08',
  sep: '09', september: '09', sept: '09',
  oct: '10', october: '10',
  nov: '11', november: '11',
  dec: '12', december: '12',
};

const BANK_ALIASES = {
  'sbi': 'STATE BANK OF INDIA',
  'state bank of india': 'STATE BANK OF INDIA',
  'state bank': 'STATE BANK OF INDIA',
  'pnb': 'PUNJAB NATIONAL BANK',
  'punjab national bank': 'PUNJAB NATIONAL BANK',
  'bob': 'BANK OF BARODA',
  'bank of baroda': 'BANK OF BARODA',
  'canara': 'CANARA BANK',
  'canara bank': 'CANARA BANK',
  'union bank': 'UNION BANK OF INDIA',
  'union bank of india': 'UNION BANK OF INDIA',
  'ubi': 'UNION BANK OF INDIA',
  'bank of india': 'BANK OF INDIA',
  'boi': 'BANK OF INDIA',
  'hdfc': 'HDFC BANK',
  'hdfc bank': 'HDFC BANK',
  'icici': 'ICICI BANK',
  'icici bank': 'ICICI BANK',
  'axis': 'AXIS BANK',
  'axis bank': 'AXIS BANK',
  'central bank of india': 'CENTRAL BANK OF INDIA',
  'indian bank': 'INDIAN BANK',
};

/**
 * Normalizes calendar dates into strict ISO format YYYY-MM-DD
 * Supports:
 * - YYYY-MM-DD
 * - DD/MM/YYYY or DD-MM-YYYY
 * - DD Month YYYY (e.g. 15 Aug 2029, 15 August 2029)
 * - Month DD, YYYY (e.g. August 15, 2029)
 */
export function normalizeDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;

  const clean = dateStr.trim().replace(/,/g, ' ');

  // 1. ISO format: YYYY-MM-DD
  const isoMatch = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // 2. Standard Indian format: DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // 3. Textual month format: DD Month YYYY (e.g. 15 Aug 2029)
  const dMonthYMatch = clean.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (dMonthYMatch) {
    const [, d, monStr, y] = dMonthYMatch;
    const m = MONTH_NAMES[monStr.toLowerCase()];
    if (m) {
      return `${y}-${m}-${d.padStart(2, '0')}`;
    }
  }

  // 4. Textual month format: Month DD YYYY (e.g. August 15 2029)
  const monthDYMatch = clean.match(/^([A-Za-z]+)\s+(\d{1,2})\s+(\d{4})$/);
  if (monthDYMatch) {
    const [, monStr, d, y] = monthDYMatch;
    const m = MONTH_NAMES[monStr.toLowerCase()];
    if (m) {
      return `${y}-${m}-${d.padStart(2, '0')}`;
    }
  }

  // Fallback to Date parser if recognizable
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return null;
}

/**
 * Normalizes monetary amounts into authoritative integer paise
 * Handles:
 * - ₹ 35,00,000 / Rs. 35,00,000.00
 * - 35 Lakhs / 35 Lacs / 1.5 Crores
 * - Plain numeric strings
 */
export function normalizeDepositAmount(amountInput) {
  if (amountInput === null || amountInput === undefined) return null;

  if (typeof amountInput === 'number') {
    // If already in paise (large integer) vs rupees
    return amountInput;
  }

  const str = String(amountInput).trim();
  if (!str) return null;

  // Handle words like Lakhs / Lacs / Crores
  const lakhMatch = str.match(/([\d.]+)\s*(?:lakh|lacs|lac|l)/i);
  if (lakhMatch) {
    const num = parseFloat(lakhMatch[1]);
    if (!isNaN(num)) {
      return Math.round(num * 100000 * 100); // in paise
    }
  }

  const croreMatch = str.match(/([\d.]+)\s*(?:crore|crores|cr)/i);
  if (croreMatch) {
    const num = parseFloat(croreMatch[1]);
    if (!isNaN(num)) {
      return Math.round(num * 10000000 * 100); // in paise
    }
  }

  // Clean currency symbols, commas, trailing /-, preserving decimal dot
  const cleaned = str
    .replace(/₹/g, '')
    .replace(/\bRs\.?\s*/gi, '')
    .replace(/\/-\s*$/g, '')
    .replace(/,/g, '')
    .trim();

  const numericVal = parseFloat(cleaned);
  if (isNaN(numericVal) || numericVal <= 0) return null;

  return rupeesToPaise(numericVal);
}

/**
 * Normalizes Indian Financial System Code (IFSC)
 * 11 uppercase alphanumeric characters, exactly 0 at 5th character
 */
export function normalizeIFSC(ifscStr) {
  if (!ifscStr || typeof ifscStr !== 'string') return null;
  const clean = ifscStr.replace(/[\s\-_.]/g, '').toUpperCase();
  if (/^[A-Z]{4}0[A-Z0-9]{6}$/.test(clean)) {
    return clean;
  }
  return clean.length >= 10 ? clean : null;
}

/**
 * Normalizes FDR number
 * Removes punctuation noise, spaces, leading dashes
 */
export function normalizeFdrNumber(fdrStr) {
  if (!fdrStr || typeof fdrStr !== 'string') return null;
  const clean = fdrStr.trim().replace(/^[:#\s-]+/, '').replace(/[\s]/g, '').toUpperCase();
  return clean || null;
}

/**
 * Canonicalizes bank names for resilient matching
 */
export function normalizeBankName(bankStr) {
  if (!bankStr || typeof bankStr !== 'string') return null;
  const clean = bankStr.trim().toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const squashed = clean.replace(/\s+/g, ' ').trim();

  // Check alias dictionary
  if (BANK_ALIASES[squashed]) {
    return BANK_ALIASES[squashed];
  }

  for (const [alias, canonical] of Object.entries(BANK_ALIASES)) {
    if (squashed.includes(alias)) {
      return canonical;
    }
  }

  return bankStr.trim().toUpperCase();
}

/**
 * Normalizes annual interest rate percentage
 */
export function normalizeInterestRate(rateInput) {
  if (rateInput === null || rateInput === undefined) return null;
  const str = String(rateInput)
    .replace(/%/g, '')
    .replace(/\bp\.?a\.?\b/gi, '')
    .replace(/\s+/g, '')
    .trim();
  const val = parseFloat(str);
  if (isNaN(val) || val < 0 || val > 30) return null;
  return Number(val.toFixed(2));
}

/**
 * Normalizes text for general fuzzy proximity matching
 */
export function normalizeGeneralText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
