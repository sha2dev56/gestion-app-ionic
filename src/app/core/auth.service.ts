import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, from, tap } from 'rxjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { Role, Session } from './models';
import { decodeToken } from './token.util';

const STORAGE_KEY = 'gestion.session';

/**
 * Gestiona la autenticación y el estado de sesión (estado global predecible con signals).
 * El estado sólo se modifica a través de `login` y `logout`.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly supabase = inject(SupabaseService);

  private readonly _session = signal<Session | null>(this.restore());

  /** Sesión actual (solo lectura). */
  readonly session = this._session.asReadonly();
  readonly isLoggedIn = computed(() => this.isValid(this._session()));
  readonly role = computed(() => this._session()?.role ?? null);
  readonly isAdmin = computed(() => this.role() === 'admin');

  constructor() {
    // Mantiene sincronizado el token cuando Supabase lo renueva o la sesión se cierra en otro punto.
    this.supabase.client?.auth.onAuthStateChange((event, s) => {
      const current = this._session();
      if (event === 'SIGNED_OUT' && current) this.clear();
      if (event === 'TOKEN_REFRESHED' && s && current) {
        this.store({ ...current, token: s.access_token, expiresAt: s.expires_at });
      }
    });
  }

  login(email: string, password: string): Observable<Session> {
    const sb = this.supabase.client;
    const request$ = sb
      ? from(this.loginSupabase(sb, email, password))
      : this.http.post<Session>('/api/auth/login', { email, password });
    return request$.pipe(
      tap((session) => this.store(session)),
    );
  }

  logout(): void {
    void this.supabase.client?.auth.signOut();
    this.clear();
  }

  /** Comprueba si el rol actual está entre los permitidos. */
  hasRole(roles: Role[]): boolean {
    const role = this.role();
    return this.isLoggedIn() && role !== null && roles.includes(role);
  }

  private store(session: Session): void {
    this._session.set(session);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  private clear(): void {
    this._session.set(null);
    sessionStorage.removeItem(STORAGE_KEY);
    void this.router.navigateByUrl('/login');
  }

  /** Inicia sesión con Supabase Auth y lee el rol desde la tabla `profiles`. */
  private async loginSupabase(sb: SupabaseClient, email: string, password: string): Promise<Session> {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error || !data.session) throw new HttpErrorResponse({ status: error?.status === 400 ? 401 : (error?.status ?? 401) });

    const { data: perfil, error: perfilError } = await sb
      .from('profiles')
      .select('nombre, role')
      .eq('id', data.user.id)
      .single();
    if (perfilError || !perfil) {
      await sb.auth.signOut();
      throw new HttpErrorResponse({ status: 500 });
    }
    return {
      token: data.session.access_token,
      email: data.user.email ?? email,
      nombre: perfil.nombre as string,
      role: perfil.role as Role,
      expiresAt: data.session.expires_at,
    };
  }

  private isValid(session: Session | null): boolean {
    if (!session) return false;
    const exp = session.expiresAt ?? decodeToken(session.token)?.exp;
    return !!exp && exp * 1000 > Date.now();
  }

  private restore(): Session | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      const session = raw ? (JSON.parse(raw) as Session) : null;
      return session && this.isValid(session) ? session : null;
    } catch {
      return null;
    }
  }
}
