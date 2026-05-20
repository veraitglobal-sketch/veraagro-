/** Dedupe noisy production logs (health checks, repeated Prisma errors). */
const lastLogged = new Map<string, number>();

export function shouldLogThrottled(key: string, intervalMs = 60_000): boolean {
  const now = Date.now();
  const last = lastLogged.get(key) ?? 0;
  if (now - last < intervalMs) return false;
  lastLogged.set(key, now);
  if (lastLogged.size > 200) {
    const cutoff = now - intervalMs * 2;
    for (const [k, t] of lastLogged) {
      if (t < cutoff) lastLogged.delete(k);
    }
  }
  return true;
}
