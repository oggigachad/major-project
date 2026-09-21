// Edge-safe JWT helpers (jose only — importable from middleware).
// Access tokens are short-lived (15 min) HS256 JWTs carried in an
// httpOnly cookie. Refresh tokens are opaque random strings (never a JWT).

import { SignJWT, jwtVerify } from 'jose';

export const ACCESS_COOKIE = 'evalix_at';
export const REFRESH_COOKIE = 'evalix_rt';

export interface AccessPayload {
  sub: string; // user id
  sid: string; // session id
  email: string;
  name: string;
  role: string;
}

const ISSUER = 'evalixai';
const AUDIENCE = 'evalixai:web';

function accessSecret(): Uint8Array {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_ACCESS_SECRET missing or too short (need >= 32 chars)');
  }
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(
  payload: AccessPayload,
  ttlSeconds = Number(process.env.JWT_ACCESS_TTL ?? 900)
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setJti(crypto.randomUUID())
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(accessSecret());
}

export async function verifyAccessToken(token: string): Promise<AccessPayload | null> {
  try {
    const { payload } = await jwtVerify(token, accessSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (typeof payload.sub !== 'string') return null;
    return {
      sub: payload.sub,
      sid: String(payload.sid ?? ''),
      email: String(payload.email ?? ''),
      name: String(payload.name ?? ''),
      role: String(payload.role ?? 'RECRUITER'),
    };
  } catch {
    return null;
  }
}
