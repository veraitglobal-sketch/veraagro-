import { parseWeatherObservation, type WeatherObservation } from './weather-observation';

export function weatherEntryRequestIdentity(input: {
  farmId: string;
  parcelId: string;
  plantingId: string;
  weather: WeatherObservation;
  notes?: string | null;
}): string {
  const notes = (input.notes ?? '').trim();
  return JSON.stringify({
    farmId: input.farmId,
    parcelId: input.parcelId,
    plantingId: input.plantingId,
    weather: input.weather,
    notes,
  });
}

export function formatWeatherObservationPreview(weather: WeatherObservation, notes?: string): string {
  const frost =
    weather.frostObserved === null ? 'unknown' : weather.frostObserved ? 'yes' : 'no';
  const base = `Field weather · ${weather.minimumC} – ${weather.maximumC} °C · frost: ${frost}`;
  const trimmed = notes?.trim();
  return trimmed ? `${base} · ${trimmed.slice(0, 120)}` : base;
}

export type WeatherFieldEntryBody = {
  type: 'WEATHER';
  farmId: string;
  clientReference: string;
  data: {
    parcelId: string;
    plantingId: string;
    date: string;
    weather: WeatherObservation;
    notes?: string;
    requestIdentity: string;
  };
};

export function buildWeatherFieldEntryBody(params: {
  farmId: string;
  parcelId: string;
  plantingId: string;
  clientReference: string;
  from: string;
  until: string;
  minimumC: string | number;
  maximumC: string | number;
  frostObserved: boolean | null;
  notes?: string;
}): WeatherFieldEntryBody {
  const normalizeDate = (value: string) => value.trim().replace(' ', 'T');
  const parseNum = (value: string | number) => {
    if (typeof value === 'string' && !value.trim()) {
      throw new Error('Temperature is required');
    }
    return typeof value === 'number' ? value : Number(value.trim().replace(',', '.'));
  };
  const weather = parseWeatherObservation({
    from: normalizeDate(params.from),
    until: normalizeDate(params.until || params.from),
    minimumC: parseNum(params.minimumC),
    maximumC: parseNum(params.maximumC),
    frostObserved: params.frostObserved,
  });
  const notes = params.notes?.trim() || undefined;
  const requestIdentity = weatherEntryRequestIdentity({
    farmId: params.farmId,
    parcelId: params.parcelId,
    plantingId: params.plantingId,
    weather,
    notes,
  });
  return {
    type: 'WEATHER',
    farmId: params.farmId,
    clientReference: params.clientReference,
    data: {
      parcelId: params.parcelId,
      plantingId: params.plantingId,
      date: weather.from,
      weather,
      notes,
      requestIdentity,
    },
  };
}

/** Read stored request identity from a persisted field entry row. */
export function storedWeatherRequestIdentity(row: {
  farmId: string;
  parcelId?: string | null;
  plantingId?: string | null;
  notes?: string | null;
  data?: unknown;
}): string | null {
  const data = row.data && typeof row.data === 'object' ? (row.data as Record<string, unknown>) : null;
  if (typeof data?.requestIdentity === 'string' && data.requestIdentity.trim()) {
    return data.requestIdentity.trim();
  }
  if (!data?.weather) return null;
  try {
    const weather = parseWeatherObservation(data.weather);
    return weatherEntryRequestIdentity({
      farmId: row.farmId,
      parcelId: row.parcelId ?? (typeof data.parcelId === 'string' ? data.parcelId : ''),
      plantingId: row.plantingId ?? (typeof data.plantingId === 'string' ? data.plantingId : ''),
      weather,
      notes: row.notes ?? (typeof data.notes === 'string' ? data.notes : null),
    });
  } catch {
    return null;
  }
}
