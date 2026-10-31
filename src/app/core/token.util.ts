import { Role } from './models';

export type TokenPayload = { sub: string; role: Role; exp: number };

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

/** Construye un token con forma de JWT (el backend real firmaría; aquí es sólo una simulación). */
export function encodeToken(payload: TokenPayload): string {
  return `${toBase64Url('{"alg":"none","typ":"JWT"}')}.${toBase64Url(JSON.stringify(payload))}.simulated`;
}

/** Decodifica el payload de un token tipo JWT sin verificar firma; devuelve `null` si es inválido. */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const payload = token.split('.')[1];
    return payload ? (JSON.parse(fromBase64Url(payload)) as TokenPayload) : null;
  } catch {
    return null;
  }
}
