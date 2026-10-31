import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, defer, from, map } from 'rxjs';
import { NuevoUsuario, Producto, Role, Usuario } from './models';
import { SupabaseService } from './supabase.service';

type DbResult<T> = { data: T | null; error: { message: string } | null };

/**
 * Cliente de datos relacionales (SQL). Usa Supabase (PostgREST) cuando está configurado
 * y, en caso contrario, la API REST simulada (`/api/*`). Todas las llamadas son Observables.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly supabase = inject(SupabaseService);

  productos(): Observable<Producto[]> {
    const sb = this.supabase.client;
    if (!sb) return this.http.get<Producto[]>('/api/productos');
    return this.run<Producto[]>(() => sb.from('productos').select('id, nombre, categoria, precio, stock').order('id'));
  }

  usuarios(): Observable<Usuario[]> {
    const sb = this.supabase.client;
    if (!sb) return this.http.get<Usuario[]>('/api/usuarios');
    return this.run<Usuario[]>(() => sb.from('profiles').select('id, nombre, email, role').order('nombre'));
  }

  crearUsuario(usuario: NuevoUsuario): Observable<Usuario> {
    const sb = this.supabase.client;
    if (!sb) return this.http.post<Usuario>('/api/usuarios', usuario);
    return defer(() => from(this.crearUsuarioSupabase(usuario)));
  }

  /** Comprueba en base de datos si un correo ya está registrado. */
  emailExiste(email: string): Observable<boolean> {
    const sb = this.supabase.client;
    if (!sb) {
      const params = new HttpParams().set('email', email);
      return this.http.get<{ exists: boolean }>('/api/usuarios/exists', { params }).pipe(map((r) => r.exists));
    }
    return this.run<boolean>(() => sb.rpc('email_exists', { p_email: email }));
  }

  private run<T>(query: () => PromiseLike<DbResult<T>>): Observable<T> {
    return defer(() =>
      from(
        Promise.resolve(query()).then(({ data, error }) => {
          if (error || data === null) throw new HttpErrorResponse({ status: 500, error: error?.message });
          return data;
        }),
      ),
    );
  }

  /**
   * Alta con Supabase Auth usando un cliente aislado. El trigger de base de datos crea el perfil con
   * rol «user»; si se pidió «admin», lo eleva el administrador autenticado (permitido por RLS).
   */
  private async crearUsuarioSupabase(u: NuevoUsuario): Promise<Usuario> {
    const sb = this.supabase.client!;
    const aislado = this.supabase.isolatedClient()!;
    const { data, error } = await aislado.auth.signUp({
      email: u.email,
      password: u.password,
      options: { data: { nombre: u.nombre } },
    });
    if (error || !data.user) {
      throw new HttpErrorResponse({ status: /already|registered/i.test(error?.message ?? '') ? 409 : 400 });
    }
    if (u.role === 'admin') {
      const { error: roleError } = await sb.from('profiles').update({ role: 'admin' }).eq('id', data.user.id);
      if (roleError) throw new HttpErrorResponse({ status: 500 });
    }
    return { id: data.user.id, nombre: u.nombre, email: u.email, role: u.role satisfies Role };
  }
}
