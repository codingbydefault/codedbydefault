export function createRateLimiter(options: { limit: number; windowMs: number; maxKeys?: number }) {
  const hits = new Map<string, number[]>();
  const maxKeys = options.maxKeys ?? 5000;
  return function allow(key: string, now: number) {
    if (hits.size > maxKeys) hits.clear();
    const recent = (hits.get(key) ?? []).filter((time) => now - time < options.windowMs);
    if (recent.length >= options.limit) {
      hits.set(key, recent);
      return false;
    }
    recent.push(now);
    hits.set(key, recent);
    return true;
  };
}
