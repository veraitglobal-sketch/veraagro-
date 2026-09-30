/** True when scanned text looks like a Bio Vera seed bag serial (BV-YY-LOT-NNNNNN-CHK). */
export function looksLikeBioVeraSeedSerial(raw: string): boolean {
  return /^BV-\d{2}-[A-Z0-9]+-\d{6}-[A-Z0-9]{4}$/i.test(raw.trim());
}
