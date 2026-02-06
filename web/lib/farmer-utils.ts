/**
 * Utility functions for formatting farmer information for Buyer view
 * Privacy protection: Only first name and region, no last names, phones, or exact addresses
 */

/**
 * Extract region from address or location
 * Examples: "Arilje, Serbia" -> "Arilje Region"
 *           "Pelagonija District" -> "Pelagonija District"
 */
export function extractRegion(address?: string, location?: string): string {
  if (!address && !location) {
    return 'Unknown Region';
  }

  const source = address || location || '';
  
  // Try to extract city/region from address
  // Common patterns: "City, Country", "City", "Region District"
  const cityMatch = source.match(/^([^,]+)/);
  if (cityMatch) {
    const city = cityMatch[1].trim();
    
    // If it already contains "Region" or "District", return as is
    if (city.toLowerCase().includes('region') || city.toLowerCase().includes('district')) {
      return city;
    }
    
    // Otherwise add "Region" suffix
    return `${city} Region`;
  }
  
  return 'Unknown Region';
}

/**
 * Format farmer identity for Buyer view
 * Format: [First Name], [Region] Region
 * Example: "Marko, Arilje Region" or "Jovan, Pelagonija District"
 */
export function formatFarmerIdentity(
  firstName: string,
  lastName?: string,
  address?: string,
  location?: string
): string {
  // Only use first name (privacy protection)
  const name = firstName || 'Farmer';
  
  // Extract region (no exact address)
  const region = extractRegion(address, location);
  
  return `${name}, ${region}`;
}

/**
 * Get only first name from full name (privacy protection)
 */
export function getFirstName(fullName?: string): string {
  if (!fullName) return 'Farmer';
  
  // Split by space and take first part
  const parts = fullName.trim().split(/\s+/);
  return parts[0] || 'Farmer';
}

/**
 * Sanitize farmer data for Buyer view
 * Removes: lastName, phone, exact address
 */
export function sanitizeFarmerDataForBuyer(data: any) {
  if (!data) return null;
  
  return {
    firstName: getFirstName(data.firstName || data.name),
    region: extractRegion(data.address, data.location),
    farmName: data.farmName || 'Farm',
    // Explicitly exclude sensitive data
    lastName: undefined,
    phone: undefined,
    exactAddress: undefined,
    email: undefined,
  };
}
