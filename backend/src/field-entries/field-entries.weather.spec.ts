import { ConflictException } from '@nestjs/common';
import { FieldEntriesService } from './field-entries.service';
import { weatherEntryRequestIdentity } from '../../../shared/passport/weather-entry';

const weatherPayload = {
  from: '2026-03-20T01:00:00.000Z',
  until: '2026-03-20T05:00:00.000Z',
  minimumC: -2.5,
  maximumC: 3.2,
  frostObserved: true,
  source: 'GROWER_OBSERVATION' as const,
};

function weatherDto(clientReference: string, notes = 'Frost on leaves') {
  return {
    type: 'WEATHER',
    farmId: 'farm-1',
    clientReference,
    data: {
      parcelId: 'parcel-1',
      plantingId: 'planting-1',
      date: weatherPayload.from,
      weather: weatherPayload,
      notes,
    },
  };
}

describe('FieldEntriesService.create (WEATHER)', () => {
  const prisma = {
    estates: { findFirst: jest.fn() },
    harvest_announcements: { findFirst: jest.fn() },
    field_entries: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };
  const service = new FieldEntriesService(
    prisma as never,
    {} as never,
    {} as never,
    {} as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.estates.findFirst.mockResolvedValue({ id: 'farm-1', ownerId: 'user-1' });
    prisma.harvest_announcements.findFirst.mockResolvedValue({ id: 'planting-1' });
  });

  it('replays identical clientReference + content without creating a duplicate', async () => {
    const dto = weatherDto('weather-ref-1');
    const identity = weatherEntryRequestIdentity({
      farmId: dto.farmId,
      parcelId: 'parcel-1',
      plantingId: 'planting-1',
      weather: weatherPayload,
      notes: dto.data.notes,
    });
    const existingRow = {
      id: 'row-1',
      userId: 'user-1',
      farmId: 'farm-1',
      parcelId: 'parcel-1',
      plantingId: 'planting-1',
      type: 'WEATHER',
      occurredAt: new Date(weatherPayload.from),
      notes: dto.data.notes,
      photos: [],
      lat: null,
      lng: null,
      data: { ...dto.data, requestIdentity: identity },
      clientReference: 'weather-ref-1',
      createdAt: new Date(),
      materialName: null,
      materialQuantity: null,
      materialUnit: null,
      areaHa: null,
      seedSerialNumber: null,
      seedId: null,
      fertilizerBarcode: null,
    };
    prisma.field_entries.findUnique.mockResolvedValue(existingRow);

    const result = await service.create('user-1', dto);
    expect(result.id).toBe('row-1');
    expect(prisma.field_entries.create).not.toHaveBeenCalled();
  });

  it('returns conflict when clientReference matches but content differs', async () => {
    const dto = weatherDto('weather-ref-2', 'Changed notes');
    const existingRow = {
      id: 'row-2',
      userId: 'user-1',
      farmId: 'farm-1',
      parcelId: 'parcel-1',
      plantingId: 'planting-1',
      type: 'WEATHER',
      occurredAt: new Date(weatherPayload.from),
      notes: 'Original notes',
      photos: [],
      lat: null,
      lng: null,
      data: {
        ...weatherDto('weather-ref-2', 'Original notes').data,
        requestIdentity: weatherEntryRequestIdentity({
          farmId: 'farm-1',
          parcelId: 'parcel-1',
          plantingId: 'planting-1',
          weather: weatherPayload,
          notes: 'Original notes',
        }),
      },
      clientReference: 'weather-ref-2',
      createdAt: new Date(),
      materialName: null,
      materialQuantity: null,
      materialUnit: null,
      areaHa: null,
      seedSerialNumber: null,
      seedId: null,
      fertilizerBarcode: null,
    };
    prisma.field_entries.findUnique.mockResolvedValue(existingRow);

    await expect(service.create('user-1', dto)).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.field_entries.create).not.toHaveBeenCalled();
  });
});
