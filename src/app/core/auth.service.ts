import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
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

  private readonly _session = signal<Session | null>(this.restore());

  /** Sesión actual (solo lectura). */
  readonly session = this._session.asReadonly();
  readonly isLoggedIn = computed(() => this.isValid(this._session()));
  readonly role = computed(() => this._session()?.role ?? null);
  readonly isAdmin = computed(() => this.role() === 'admin');

  login(email: string, password: string): Observable<Session> {
    return this.http.post<Session>('/api/auth/login', { email, password }).pipe(
      tap((session) => {
        this._session.set(session);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      }),
    );
  }

  logout(): void {
    this._session.set(null);
    sessionStorage.removeItem(STORAGE_KEY);
    void this.router.navigateByUrl('/login');
  }

  /** Comprueba si el rol actual está entre los permitidos. */
  hasRole(roles: Role[]): boolean {
    const role = this.role();
    return this.isLoggedIn() && role !== null && roles.includes(role);
  }

  private isValid(session: Session | null): boolean {
    if (!session) return false;
    const payload = decodeToken(session.token);
    return !!payload && payload.exp * 1000 > Date.now();
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
