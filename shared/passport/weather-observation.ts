export type WeatherObservation = {
  from: string; until: string; minimumC: number; maximumC: number;
  frostObserved: boolean | null; source: 'GROWER_OBSERVATION';
};

/** Manual field observations never become sensor readings or weather forecasts. */
export function parseWeatherObservation(input: unknown): WeatherObservation {
  if (!input || typeof input !== 'object') throw Error('Invalid weather observation');
  const v = input as Record<string, unknown>;
  const from = typeof v.from === 'string' ? new Date(v.from) : new Date(NaN);
  const until = typeof v.until === 'string' ? new Date(v.until) : new Date(NaN);
  if (!Number.isFinite(from.getTime()) || !Number.isFinite(until.getTime()) || until < from) throw Error('Invalid observation period');
  if (typeof v.minimumC !== 'number' || typeof v.maximumC !== 'number' ||
      !Number.isFinite(v.minimumC) || !Number.isFinite(v.maximumC) ||
      v.minimumC < -90 || v.maximumC > 65 || v.minimumC > v.maximumC) throw Error('Invalid temperature range');
  if (v.frostObserved != null && typeof v.frostObserved !== 'boolean') throw Error('Invalid frost observation');
  return { from: from.toISOString(), until: until.toISOString(), minimumC: v.minimumC,
    maximumC: v.maximumC, frostObserved: typeof v.frostObserved === 'boolean' ? v.frostObserved : null, source: 'GROWER_OBSERVATION' };
}
