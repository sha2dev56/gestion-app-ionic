import { Injectable } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

/**
 * Acceso al cliente de Supabase (Postgres vía REST + Realtime + Auth).
 * Si no hay URL/clave configuradas, `client` es `null` y la app usa el backend simulado.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly enabled = !!environment.supabaseUrl && !!environment.supabaseAnonKey;

  /** Cliente principal: la sesión vive en sessionStorage, igual que la sesión de la app. */
  readonly client: SupabaseClient | null = this.enabled
    ? createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
        auth: { storage: sessionStorage, persistSession: true, autoRefreshToken: true },
      })
    : null;

  /** Cliente sin persistencia: permite registrar a otro usuario sin cerrar la sesión del administrador. */
  isolatedClient(): SupabaseClient | null {
    return this.enabled
      ? createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
          auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        })
      : null;
  }
}
