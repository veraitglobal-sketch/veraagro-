/** Shared buyer delivery address validation — used by web, mobile, and mirrored in backend DTOs. */

export type BuyerDeliveryAddress = {
  street: string;
  city: string;
  postalCode: string;
  country: string;
};

export function normalizeBuyerAddress(input: Partial<BuyerDeliveryAddress>): BuyerDeliveryAddress {
  return {
    street: input.street?.trim() ?? '',
    city: input.city?.trim() ?? '',
    postalCode: input.postalCode?.trim() ?? '',
    country: input.country?.trim() ?? '',
  };
}

export function validateBuyerDeliveryAddress(input: Partial<BuyerDeliveryAddress>): string[] {
  const a = normalizeBuyerAddress(input);
  const missing: string[] = [];
  if (!a.street) missing.push('street');
  if (!a.city) missing.push('city');
  if (!a.postalCode) missing.push('postalCode');
  if (!a.country) missing.push('country');
  return missing;
}

export function isBuyerDeliveryAddressComplete(input: Partial<BuyerDeliveryAddress>): boolean {
  return validateBuyerDeliveryAddress(input).length === 0;
}
