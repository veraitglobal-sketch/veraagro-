// Frontend compliance check utility
// Integrates with backend compliance service

import api from '../api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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
  } catch (error: any) {
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
  } catch (error: any) {
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
