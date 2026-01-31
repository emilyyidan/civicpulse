// LocalStorage caching utilities for AI-generated content

const CACHE_PREFIX = 'civicpulse_';
const CACHE_VERSION = 'v1_';

// Create a simple hash from preferences to use as cache key
export function hashPreferences(preferences: { issueId: string; position: number }[]): string {
  const sorted = [...preferences].sort((a, b) => a.issueId.localeCompare(b.issueId));
  const str = sorted.map(p => `${p.issueId}:${p.position}`).join('|');
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// Cache keys
export function getAnalysisCacheKey(billId: string, preferencesHash: string): string {
  return `${CACHE_PREFIX}${CACHE_VERSION}analysis_${billId}_${preferencesHash}`;
}

export function getScriptCacheKey(billId: string, recommendation: string): string {
  return `${CACHE_PREFIX}${CACHE_VERSION}script_${billId}_${recommendation}`;
}

// Generic cache operations
export function getCached<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const item = localStorage.getItem(key);
    if (!item) return null;

    const parsed = JSON.parse(item);

    // Check if expired (7 days TTL)
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }

    return parsed.data as T;
  } catch {
    return null;
  }
}

export function setCache<T>(key: string, data: T, ttlDays: number = 7): void {
  if (typeof window === 'undefined') return;

  try {
    const item = {
      data,
      expiresAt: Date.now() + (ttlDays * 24 * 60 * 60 * 1000),
      cachedAt: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(item));
  } catch (e) {
    // localStorage might be full or disabled
    console.warn('Failed to cache:', e);
  }
}

// Specific cache functions for analyses
export interface CachedAnalysis {
  billId: string;
  recommendation: 'support' | 'oppose' | 'engage';
  confidence: number;
  summary: string;
  relevantIssues: string[];
  reasoning: string;
}

export function getCachedAnalysis(billId: string, preferencesHash: string): CachedAnalysis | null {
  const key = getAnalysisCacheKey(billId, preferencesHash);
  return getCached<CachedAnalysis>(key);
}

export function setCachedAnalysis(billId: string, preferencesHash: string, analysis: CachedAnalysis): void {
  const key = getAnalysisCacheKey(billId, preferencesHash);
  setCache(key, analysis);
}

// Specific cache functions for scripts
export function getCachedScript(billId: string, recommendation: string): string | null {
  const key = getScriptCacheKey(billId, recommendation);
  return getCached<string>(key);
}

export function setCachedScript(billId: string, recommendation: string, script: string): void {
  const key = getScriptCacheKey(billId, recommendation);
  setCache(key, script);
}

// Clear all cached data (useful for debugging or user preference)
export function clearAllCache(): void {
  if (typeof window === 'undefined') return;

  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

// Get cache stats (for debugging)
export function getCacheStats(): { analysisCount: number; scriptCount: number; totalSize: number } {
  if (typeof window === 'undefined') return { analysisCount: 0, scriptCount: 0, totalSize: 0 };

  let analysisCount = 0;
  let scriptCount = 0;
  let totalSize = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) {
      const value = localStorage.getItem(key);
      if (value) totalSize += value.length;

      if (key.includes('analysis_')) analysisCount++;
      if (key.includes('script_')) scriptCount++;
    }
  }

  return { analysisCount, scriptCount, totalSize };
}
