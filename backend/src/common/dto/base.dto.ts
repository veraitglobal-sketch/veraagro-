/**
 * Base DTOs and common validation patterns
 */

export class LocationDto {
  lat: number;
  lng: number;
  address?: string;
}

export class PaginationDto {
  page?: number = 1;
  limit?: number = 20;
  skip?: number;
  take?: number;
}

export class PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
