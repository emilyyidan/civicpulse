import { OpenStatesBill, OpenStatesBillsResponse, OpenStatesPerson } from '@/types/openstates';
import { UserPreference } from '@/types';
import { BillAnalysis } from '@/lib/claude';

const API_BASE = '/api';

interface BillsQueryParams {
  page?: number;
  per_page?: number;
  q?: string;
  session?: string;
  subject?: string[];
  updated_since?: string;
  action_since?: string;
}

interface RepresentativesResponse {
  results: OpenStatesPerson[];
  coordinates: { lat: number; lng: number };
  zipCode: string;
}

/**
 * Fetch California bills from our API
 */
export async function fetchBills(
  params: BillsQueryParams = {}
): Promise<OpenStatesBillsResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.per_page) searchParams.set('per_page', String(params.per_page));
  if (params.q) searchParams.set('q', params.q);
  if (params.session) searchParams.set('session', params.session);
  if (params.updated_since) searchParams.set('updated_since', params.updated_since);
  if (params.action_since) searchParams.set('action_since', params.action_since);
  if (params.subject) {
    params.subject.forEach((s) => searchParams.append('subject', s));
  }

  const response = await fetch(`${API_BASE}/bills?${searchParams.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch bills');
  }

  return response.json();
}

/**
 * Fetch a specific bill by ID
 */
export async function fetchBill(billId: string): Promise<OpenStatesBill> {
  const response = await fetch(`${API_BASE}/bills/${encodeURIComponent(billId)}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch bill');
  }

  return response.json();
}

/**
 * Fetch representatives for a zip code
 */
export async function fetchRepresentatives(
  zipCode: string
): Promise<RepresentativesResponse> {
  const response = await fetch(
    `${API_BASE}/representatives?zip=${encodeURIComponent(zipCode)}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch representatives');
  }

  return response.json();
}

/**
 * Get recent California bills (updated in last 30 days)
 */
export async function fetchRecentBills(
  perPage: number = 20
): Promise<OpenStatesBillsResponse> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return fetchBills({
    per_page: perPage,
    action_since: thirtyDaysAgo.toISOString().split('T')[0],
  });
}

/**
 * Search bills by keyword
 */
export async function searchBills(
  query: string,
  perPage: number = 20
): Promise<OpenStatesBillsResponse> {
  return fetchBills({
    q: query,
    per_page: perPage,
  });
}

/**
 * Analyze bills against user preferences using Claude
 */
export async function analyzeBillsWithAI(
  bills: OpenStatesBill[],
  preferences: UserPreference[]
): Promise<{ analyses: BillAnalysis[] }> {
  const response = await fetch(`${API_BASE}/analyze-bills`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ bills, preferences }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to analyze bills');
  }

  return response.json();
}

/**
 * Generate a call script for a specific bill
 */
export async function generateScript(
  bill: OpenStatesBill,
  preferences: UserPreference[],
  recommendation: 'support' | 'oppose',
  billStatus?: string
): Promise<{ script: string }> {
  const response = await fetch(`${API_BASE}/generate-script`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ bill, preferences, recommendation, billStatus }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate script');
  }

  return response.json();
}
