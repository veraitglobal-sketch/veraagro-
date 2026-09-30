/** Product name once; append variety only when not already contained in name. */
export function formatSeedProductName(name: string, variety?: string | null): string {
  const base = name.trim();
  const v = variety?.trim();
  if (!v) return base;
  if (base.toLowerCase().includes(v.toLowerCase())) return base;
  return `${base} — ${v}`;
}
