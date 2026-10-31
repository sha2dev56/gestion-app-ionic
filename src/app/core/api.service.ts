import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { NuevoUsuario, Producto, Usuario } from './models';

/** Cliente de la API REST (fuente relacional SQL). Todas las llamadas son asíncronas (Observables). */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  productos(): Observable<Producto[]> {
    return this.http.get<Producto[]>('/api/productos');
  }

  usuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>('/api/usuarios');
  }

  crearUsuario(usuario: NuevoUsuario): Observable<Usuario> {
    return this.http.post<Usuario>('/api/usuarios', usuario);
  }

  /** Comprueba en base de datos si un correo ya está registrado. */
  emailExiste(email: string): Observable<boolean> {
    const params = new HttpParams().set('email', email);
    return this.http.get<{ exists: boolean }>('/api/usuarios/exists', { params }).pipe(map((r) => r.exists));
  }
}
