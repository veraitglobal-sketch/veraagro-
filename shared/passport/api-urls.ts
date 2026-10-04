/** Public passport API URL builders — shared by web, mobile, and tests. */

function trimApiBase(apiBase: string): string {
  return apiBase.replace(/\/$/, '');
}

export function buildQrVerifyUrl(
  apiBase: string,
  batchId: string,
  badgeSerial?: string | null,
): string {
  const id = encodeURIComponent(batchId);
  const qs = badgeSerial?.trim() ? `?badge=${encodeURIComponent(badgeSerial.trim())}` : '';
  return `${trimApiBase(apiBase)}/qr/verify/${id}${qs}`;
}

export function buildQrVerifyPdfUrl(
  apiBase: string,
  batchId: string,
  badgeSerial?: string | null,
): string {
  const id = encodeURIComponent(batchId);
  const qs = badgeSerial?.trim() ? `?badge=${encodeURIComponent(badgeSerial.trim())}` : '';
  return `${trimApiBase(apiBase)}/qr/verify/${id}/pdf${qs}`;
}

export function buildQrReportUrl(
  apiBase: string,
  batchId: string,
  badgeSerial?: string | null,
): string {
  const id = encodeURIComponent(batchId);
  const qs = badgeSerial?.trim() ? `?badge=${encodeURIComponent(badgeSerial.trim())}` : '';
  return `${trimApiBase(apiBase)}/qr/verify/${id}/report${qs}`;
}
