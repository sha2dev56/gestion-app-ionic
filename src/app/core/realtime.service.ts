import { Injectable, inject } from '@angular/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Observable, scan, shareReplay, timer } from 'rxjs';
import { Actividad, TipoActividad } from './models';
import { SupabaseService } from './supabase.service';

const TIPOS: TipoActividad[] = ['venta', 'venta', 'alta', 'incidencia', 'venta'];
const USUARIOS = ['ana.demo', 'luis.demo', 'marta.demo', 'pablo.demo', 'sara.demo'];
const MAX_DOCS = 60;

function crearDocumento(n: number, ahora = Date.now()): Actividad {
  const tipo = TIPOS[n % TIPOS.length];
  return {
    id: `act-${ahora}-${n}`,
    tipo,
    usuario: USUARIOS[n % USUARIOS.length],
    importe: tipo === 'venta' ? 20 + ((n * 37) % 380) : 0,
    fecha: new Date(ahora).toISOString(),
  };
}

/**
 * Documentos en tiempo real (`onSnapshot`): Supabase Realtime sobre la tabla `actividad` si está
 * configurado; si no, un flujo simulado. Emite la colección completa en cada cambio.
 */
@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private readonly supabase = inject(SupabaseService);

  /** `true` cuando los eventos provienen de la base de datos real y se pueden insertar manualmente. */
  readonly remoto = this.supabase.enabled;

  /** Flujo compartido de la colección `actividad`; se cancela al no quedar suscriptores. */
  readonly actividad$: Observable<Actividad[]> = this.supabase.client
    ? this.streamSupabase(this.supabase.client)
    : this.streamSimulado();

  /** Inserta un evento (sólo administradores, lo impone RLS). Sin Supabase no hace nada: el flujo ya se simula. */
  async emitir(tipo: TipoActividad, usuario: string, importe: number): Promise<void> {
    const sb = this.supabase.client;
    if (!sb) return;
    const { error } = await sb.from('actividad').insert({ tipo, usuario, importe });
    if (error) throw new Error(error.message);
  }

  private streamSimulado(): Observable<Actividad[]> {
    return timer(0, 4000).pipe(
      scan(
        (coleccion, n) => {
          if (n === 0) {
            const base = Date.now();
            return Array.from({ length: 12 }, (_, i) => crearDocumento(i, base - (12 - i) * 60_000)).reverse();
          }
          return [crearDocumento(n + 11), ...coleccion].slice(0, MAX_DOCS);
        },
        [] as Actividad[],
      ),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  private streamSupabase(sb: SupabaseClient): Observable<Actividad[]> {
    return new Observable<Actividad[]>((subscriber) => {
      let docs: Actividad[] = [];

      const cargar = async (): Promise<void> => {
        const { data, error } = await sb.from('actividad').select('*').order('fecha', { ascending: false }).limit(MAX_DOCS);
        if (error) {
          subscriber.error(error);
          return;
        }
        docs = (data ?? []) as Actividad[];
        subscriber.next(docs);
      };

      const channel = sb
        .channel(`actividad-${Date.now()}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'actividad' }, (payload) => {
          docs = [payload.new as Actividad, ...docs].slice(0, MAX_DOCS);
          subscriber.next(docs);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') void cargar();
        });

      return () => {
        void sb.removeChannel(channel);
      };
    }).pipe(shareReplay({ bufferSize: 1, refCount: true }));
  }
}
