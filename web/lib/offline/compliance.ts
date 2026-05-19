// Frontend compliance check utility
// Integrates with backend compliance service

import api from '../api';
import { WEB_API_BASE } from '../api-base';

const API_URL = WEB_API_BASE;

export interface ComplianceCheckResult {
  compliant: boolean;
  reason?: string;
  blocked: boolean;
  alertSent: boolean;
}

export interface PartnerDiscountResult {
  isPartner: boolean;
  discountPercentage: number;
  discountAmount: number;
  finalPrice: number;
}

export type GrowerMaterialKind = 'SEED' | 'FERTILIZER' | 'PESTICIDE';

export function materialKindForFieldEntry(
  entryType: 'PRSKANJE' | 'SETVA' | 'BERBA',
  field: 'seed' | 'fertilizer',
): GrowerMaterialKind {
  if (field === 'seed') return 'SEED';
  return entryType === 'PRSKANJE' ? 'PESTICIDE' : 'FERTILIZER';
}

/**
 * Unified material validation (whitelist + seeds + supplier units).
 */
export async function validateMaterial(
  code: string,
  kind: GrowerMaterialKind,
  farmId?: string,
): Promise<{ valid: boolean; message?: string }> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Not authenticated');
  }
  const params = new URLSearchParams({ code: code.trim(), kind });
  if (farmId) params.set('farmId', farmId);
  const response = await fetch(`${API_URL}/compliance/validate-material?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || 'Material validation failed');
  }
  return response.json();
}

/**
 * Check compliance for scanned fertilizer barcode
 */
export async function checkCompliance(
  barcode: string,
  farmId?: string,
  entryType?: string
): Promise<ComplianceCheckResult> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_URL}/compliance/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ barcode, farmId, entryType }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Compliance check failed');
    }

    return await response.json();
  } catch (error: unknown) {
    console.error('Compliance check error:', error);
    throw error;
  }
}

/**
 * Calculate partner discount for seed purchase
 */
export async function calculatePartnerDiscount(standardPrice: number): Promise<PartnerDiscountResult> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_URL}/compliance/calculate-discount`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ standardPrice }),
    });

    if (!response.ok) {
      throw new Error('Failed to calculate discount');
    }

    return await response.json();
  } catch (error: unknown) {
    console.error('Discount calculation error:', error);
    throw error;
  }
}

/**
 * Check if current user is Vera Partner
 */
export async function isVeraPartner(): Promise<boolean> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return false;
    }

    const response = await fetch(`${API_URL}/compliance/is-partner`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.isPartner || false;
  } catch (error) {
    console.error('Error checking Vera Partner status:', error);
    return false;
  }
}
