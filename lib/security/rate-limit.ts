type WindowState = {
  count: number;
  windowStart: number;
};

const store = new Map<string, WindowState>();

export function rateLimit({
  key,
  limit,
  windowMs
}: {
  key: string;
  limit: number;
  windowMs: number;
}): { allowed: boolean; remaining: number; resetInMs: number } {
  const now = Date.now();
  const state = store.get(key);
  if (!state || now - state.windowStart > windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1, resetInMs: windowMs };
  }
  if (state.count < limit) {
    state.count += 1;
    return { allowed: true, remaining: limit - state.count, resetInMs: windowMs - (now - state.windowStart) };
  }
  return { allowed: false, remaining: 0, resetInMs: windowMs - (now - state.windowStart) };
}

export function getClientIp(request: Request): string {
  const cf = (request.headers.get('cf-connecting-ip') || '').trim();
  const xff = (request.headers.get('x-forwarded-for') || '').split(',')[0]?.trim();
  const realIp = (request.headers.get('x-real-ip') || '').trim();
  return cf || xff || realIp || 'unknown';
}

