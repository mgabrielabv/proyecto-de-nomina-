export function normalizeSpaces(value: string): string {
  return value.trim().replace(/\s{2,}/g, ' ');
}

export function trimText(value: string): string {
  return value.replace(/^\s+|\s+$/g, '');
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isBlank(value: string): boolean {
  return /^\s*$/.test(value);
}

export function sanitizeDecimalInput(raw: string, decimals = 2): string {
  let value = raw.replace(/[^\d.,-]/g, '');
  // no negatives by default
  value = value.replace(/-/g, '');
  // keep first separator as decimal point
  const firstSep = value.search(/[.,]/);
  if (firstSep !== -1) {
    const intPart = value.slice(0, firstSep).replace(/[.,]/g, '');
    const decPart = value.slice(firstSep + 1).replace(/[.,]/g, '').slice(0, Math.max(0, decimals));
    value = decimals > 0 ? `${intPart}.${decPart}` : intPart;
  } else {
    value = value.replace(/[.,]/g, '');
  }
  // remove leading zeros except "0" or "0."
  if (value.length > 1 && value.startsWith('0') && !value.startsWith('0.')) {
    value = value.replace(/^0+/, '') || '0';
  }
  return value;
}

export function parseMoneyToCents(raw: string): number {
  const clean = sanitizeDecimalInput(raw, 2);
  if (!clean) return 0;
  const [intPart, decPart = ''] = clean.split('.');
  const cents = (decPart + '00').slice(0, 2);
  const signless = `${intPart || '0'}${cents}`;
  return Number.parseInt(signless, 10) || 0;
}
