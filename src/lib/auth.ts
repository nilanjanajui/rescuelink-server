import { jwtVerify, createRemoteJWKSet } from 'jose';

// The Next.js app is the identity provider (Better Auth). This must match
// the BASE_URL Better Auth uses there, since it's also the default
// issuer/audience for tokens minted by the JWT plugin.
const AUTH_SERVER_URL = process.env.AUTH_SERVER_URL as string;

if (!AUTH_SERVER_URL) {
  throw new Error(
    'AUTH_SERVER_URL is not set (needed to verify JWTs via JWKS)',
  );
}

// createRemoteJWKSet caches the JWKS response and handles key rotation,
// so we only create this once per process.
const JWKS = createRemoteJWKSet(new URL(`${AUTH_SERVER_URL}/api/auth/jwks`));

export type Role = 'Tenant' | 'user' | 'admin';

export interface AuthTokenPayload {
  id: string;
  email: string;
  role: Role;
  [key: string]: unknown;
}

/**
 * Verifies a Better Auth-issued JWT against the Next.js app's JWKS endpoint.
 * Throws if the token is invalid, expired, or signed by an unknown key.
 */
export const verifyAuthToken = async (
  token: string,
): Promise<AuthTokenPayload> => {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: AUTH_SERVER_URL,
    audience: AUTH_SERVER_URL,
  });

  return payload as unknown as AuthTokenPayload;
};
