/**
 * Application-wide constants
 */

export const API_VERSION = 'v1';
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Cache TTLs (in seconds)
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
};

// Rate limiting
export const RATE_LIMIT = {
  DEFAULT: { limit: 100, ttl: 60000 }, // 100 requests per minute
  STRICT: { limit: 10, ttl: 60000 }, // 10 requests per minute
  AUTH: { limit: 5, ttl: 60000 }, // 5 requests per minute
};

// File upload limits
export const FILE_LIMITS = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_IMAGE_WIDTH: 1920,
};

// GPS validation
export const GPS_CONFIG = {
  MIN_ACCURACY: 50, // meters
  MAX_DISTANCE_FROM_FARM: 1000, // meters
};

// Password requirements
export const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 6,
  REQUIRE_UPPERCASE: false,
  REQUIRE_LOWERCASE: false,
  REQUIRE_NUMBERS: false,
  REQUIRE_SPECIAL: false,
};
