import { SignJWT, jwtVerify } from 'jose';
import type { AstroCookies } from 'astro';
import type { Rol } from './supabase';

const COOKIE_NAME = 'ma_session';
const ALGORITHM  = 'HS256';

export interface SessionPayload {
  id:     string;
  nombre: string;
  correo: string;
  rol:    Rol;
  cargo:  string;
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET debe tener al menos 32 caracteres');
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getSecret());
}

export async function getSession(cookies: AstroCookies): Promise<SessionPayload | null> {
  const token = cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function setSessionCookie(cookies: AstroCookies, token: string): void {
  // process.env se lee en RUNTIME (no en build), funciona con Docker.
  // COOKIE_SECURE=true solo si tienes HTTPS. En NAS local usa false.
  const secure = process.env.COOKIE_SECURE === 'true';

  cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path:     '/',
    maxAge:   60 * 60 * 8, // 8 horas
  });
}

export function clearSessionCookie(cookies: AstroCookies): void {
  cookies.delete(COOKIE_NAME, { path: '/' });
}
