import { env } from '@/lib/env';
import { SignJWT, importPKCS8 } from 'jose';

// Generate JWT for Apple App Store Connect API
async function getAppleJWT() {
  const issuerId = env.APPLE_ISSUER_ID;
  const keyId = env.APPLE_KEY_ID;
  const privateKeyRaw = env.APPLE_PRIVATE_KEY;

  if (!issuerId || !keyId || !privateKeyRaw) {
    throw new Error('Apple App Store Connect credentials are not configured');
  }

  // Private key can be provided raw (-----BEGIN PRIVATE KEY-----) or base64-encoded
  const privateKeyPem = privateKeyRaw.includes('BEGIN')
    ? privateKeyRaw
    : Buffer.from(privateKeyRaw, 'base64').toString('utf8');

  const alg = 'ES256';
  const key = await importPKCS8(privateKeyPem, alg);

  const now = Math.floor(Date.now() / 1000);
  const fiveMinutes = 5 * 60; // Apple recommends short-lived tokens (max 20 minutes)

  return new SignJWT({})
    .setProtectedHeader({ alg, kid: keyId, typ: 'JWT' })
    .setIssuedAt(now)
    .setExpirationTime(now + fiveMinutes)
    .setIssuer(issuerId)
    .setAudience('appstoreconnect-v1')
    .sign(key);
}

async function appleFetch(path: string, init?: RequestInit) {
  const token = await getAppleJWT();
  const url = new URL(path, 'https://api.appstoreconnect.apple.com');
  const res = await fetch(url.toString(), {
    ...init,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    }
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Apple API ${res.status}: ${body}`);
  }
  return res.json();
}

export const appStoreClient = {
  async listApps(params?: Record<string, string | number | boolean>) {
    const search = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => search.set(k, String(v)));
    }
    const path = `/v1/apps${search.toString() ? `?${search}` : ''}`;
    return appleFetch(path);
  },

  async listBuilds(params?: Record<string, string | number | boolean>) {
    const search = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => search.set(k, String(v)));
    }
    const path = `/v1/builds${search.toString() ? `?${search}` : ''}`;
    return appleFetch(path);
  },

  async listTestFlightBetaGroups(appId: string) {
    const path = `/v1/apps/${appId}/betaGroups`;
    return appleFetch(path);
  },
};

