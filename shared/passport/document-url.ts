/** Relative file paths belong to the API, not the web or native navigation host. */
export function passportDocumentUrl(value: string, apiBase: string): string {
  if (value.startsWith('/documents/')) return `${apiBase.replace(/\/$/, '')}${value}`;
  return /^https?:\/\//i.test(value) ? value : '';
}
