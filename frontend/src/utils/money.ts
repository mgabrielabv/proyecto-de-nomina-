/** Convierte un string/number decimal (DECIMAL del backend) a céntimos enteros. */
export function aCentavos(valor: string | number | null | undefined): number {
  if (valor === null || valor === undefined || valor === '') return 0;
  if (typeof valor === 'number') return Math.round(valor * 100);
  const normalized = String(valor).trim().replace(',', '.');
  if (!/^[-+]?\d+(?:\.\d+)?$/.test(normalized)) return 0;
  const negative = normalized.startsWith('-');
  const unsigned = normalized.replace(/^[-+]/, '');
  const [intPart = '0', decPart = ''] = unsigned.split('.');
  const centsPart = (decPart + '00').slice(0, 2);
  const total = (Number.parseInt(intPart || '0', 10) || 0) * 100 + (Number.parseInt(centsPart, 10) || 0);
  return negative ? -total : total;
}

/** Convierte céntimos enteros a unidades decimales para mostrar/cálculo de UI legado. */
export function deCentavos(centavos: number): number {
  return centavos / 100;
}

export function centsToMoneyString(centavos: number): string {
  const abs = Math.abs(centavos);
  const intPart = Math.floor(abs / 100);
  const decPart = String(abs % 100).padStart(2, '0');
  return `${centavos < 0 ? '-' : ''}${intPart}.${decPart}`;
}
