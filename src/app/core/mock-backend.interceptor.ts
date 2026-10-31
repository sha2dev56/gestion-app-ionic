import { HttpErrorResponse, HttpEvent, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, from, mergeMap, of, switchMap, throwError, timer } from 'rxjs';
import { environment } from '../../environments/environment';
import { NuevoUsuario, Producto, Session, Usuario } from './models';
import { TokenPayload, decodeToken, encodeToken } from './token.util';

/*
 * Backend simulado de la fuente "SQL / API REST".
 * Todos los datos son sintéticos. Las contraseñas NO se guardan en claro: sólo su hash SHA-256.
 */
type DbUser = Usuario & { passwordHash: string };

const users: DbUser[] = [
  {
    id: 1,
    nombre: 'Administrador Demo',
    email: 'admin@demo.test',
    role: 'admin',
    passwordHash: 'b5af2beb9b7fd5aa4eb21b61925bd3856793e54e0a39052fbcfaf5b477fd07f3',
  },
  {
    id: 2,
    nombre: 'Usuario Demo',
    email: 'user@demo.test',
    role: 'user',
    passwordHash: '9c8d2e707f21036711b5c9a27e10671255c323458507be0742d72d5c3f18fa84',
  },
];
let nextUserId = 3;

const productos: Producto[] = [
  { id: 1, nombre: 'Portátil 14"', categoria: 'Informática', precio: 749.9, stock: 14 },
  { id: 2, nombre: 'Monitor 27"', categoria: 'Informática', precio: 219.0, stock: 31 },
  { id: 3, nombre: 'Teclado mecánico', categoria: 'Informática', precio: 69.5, stock: 58 },
  { id: 4, nombre: 'Ratón ergonómico', categoria: 'Informática', precio: 34.9, stock: 76 },
  { id: 5, nombre: 'Archivador A4', categoria: 'Oficina', precio: 12.5, stock: 120 },
  { id: 6, nombre: 'Pack folios 500 uds', categoria: 'Oficina', precio: 5.2, stock: 340 },
  { id: 7, nombre: 'Pizarra blanca', categoria: 'Oficina', precio: 48.0, stock: 22 },
  { id: 8, nombre: 'Silla ergonómica', categoria: 'Mobiliario', precio: 189.0, stock: 17 },
  { id: 9, nombre: 'Mesa elevable', categoria: 'Mobiliario', precio: 329.0, stock: 9 },
  { id: 10, nombre: 'Estantería modular', categoria: 'Mobiliario', precio: 96.0, stock: 26 },
  { id: 11, nombre: 'Auriculares con cancelación', categoria: 'Audio', precio: 149.0, stock: 40 },
  { id: 12, nombre: 'Altavoz Bluetooth', categoria: 'Audio', precio: 59.9, stock: 63 },
];

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function reply(status: number, body: unknown): Observable<HttpEvent<unknown>> {
  return timer(environment.mockLatency).pipe(
    mergeMap(() =>
      status < 400
        ? of(new HttpResponse({ status, body }))
        : throwError(() => new HttpErrorResponse({ status, error: body })),
    ),
  );
}

function publicUser({ passwordHash: _hash, ...user }: DbUser): Usuario {
  return user;
}

function authorize(req: HttpRequest<unknown>): TokenPayload | null {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  const payload = token ? decodeToken(token) : null;
  return payload && payload.exp * 1000 > Date.now() ? payload : null;
}

function login(body: { email: string; password: string }): Observable<HttpEvent<unknown>> {
  return from(sha256(body.password ?? '')).pipe(
    switchMap((hash) => {
      const user = users.find((u) => u.email === (body.email ?? '').trim().toLowerCase());
      if (!user || user.passwordHash !== hash) return reply(401, { message: 'Credenciales incorrectas' });
      const session: Session = {
        token: encodeToken({ sub: user.email, role: user.role, exp: Math.floor(Date.now() / 1000) + 3600 }),
        email: user.email,
        nombre: user.nombre,
        role: user.role,
      };
      return reply(200, session);
    }),
  );
}

function createUser(body: NuevoUsuario): Observable<HttpEvent<unknown>> {
  const email = body.email.trim().toLowerCase();
  if (users.some((u) => u.email === email)) return reply(409, { message: 'El correo ya existe' });
  return from(sha256(body.password)).pipe(
    switchMap((passwordHash) => {
      const user: DbUser = { id: nextUserId++, nombre: body.nombre.trim(), email, role: body.role, passwordHash };
      users.push(user);
      return reply(201, publicUser(user));
    }),
  );
}

/** Intercepta las peticiones `/api/**` y responde con datos simulados (con latencia y errores HTTP reales). */
export const mockBackendInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api/')) return next(req);

  const url = new URL(req.url, 'http://mock.local');
  const path = url.pathname;

  if (req.method === 'POST' && path === '/api/auth/login') {
    return login(req.body as { email: string; password: string });
  }

  const claims = authorize(req);
  if (!claims) return reply(401, { message: 'No autenticado' });

  if (req.method === 'GET' && path === '/api/productos') return reply(200, productos);

  if (path.startsWith('/api/usuarios')) {
    if (claims.role !== 'admin') return reply(403, { message: 'Permisos insuficientes' });
    if (req.method === 'GET' && path === '/api/usuarios/exists') {
      const email = (url.searchParams.get('email') ?? '').trim().toLowerCase();
      return reply(200, { exists: users.some((u) => u.email === email) });
    }
    if (req.method === 'GET' && path === '/api/usuarios') return reply(200, users.map(publicUser));
    if (req.method === 'POST' && path === '/api/usuarios') return createUser(req.body as NuevoUsuario);
  }

  return reply(404, { message: 'Recurso no encontrado' });
};
