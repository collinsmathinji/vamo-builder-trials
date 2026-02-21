/**
 * In-memory per-user rate limit for OpenAI/content-generation endpoints.
 * Limits are per deployment instance; sufficient for reasonable abuse prevention.
 */

const windowMs = 60 * 1000; // 1 minute
const maxPerWindow = 25; // max requests per user per minute across all content endpoints

const hits = new Map<string, number[]>();

function prune(ts: number[]): number[] {
  const cutoff = Date.now() - windowMs;
  return ts.filter((t) => t > cutoff);
}

export function checkContentRateLimit(userId: string): { ok: boolean; retryAfter?: number } {
  const key = userId;
  let timestamps = hits.get(key) ?? [];
  timestamps = prune(timestamps);
  if (timestamps.length >= maxPerWindow) {
    const oldest = Math.min(...timestamps);
    const retryAfter = Math.ceil((oldest + windowMs - Date.now()) / 1000);
    return { ok: false, retryAfter: Math.max(1, retryAfter) };
  }
  timestamps.push(Date.now());
  hits.set(key, timestamps);
  return { ok: true };
}
