import { Injectable } from '@angular/core';
import { Observable, scan, shareReplay, timer } from 'rxjs';
import { Actividad, TipoActividad } from './models';

const TIPOS: TipoActividad[] = ['venta', 'venta', 'alta', 'incidencia', 'venta'];
const USUARIOS = ['ana.demo', 'luis.demo', 'marta.demo', 'pablo.demo', 'sara.demo'];

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
 * Servicio de documentos en tiempo real (fuente NoSQL, estilo Firestore `onSnapshot`).
 * Emite la colección completa cada vez que "llega" un documento nuevo.
 */
@Injectable({ providedIn: 'root' })
export class RealtimeService {
  /** Flujo compartido de la colección `actividad`; se cancela al no quedar suscriptores. */
  readonly actividad$: Observable<Actividad[]> = timer(0, 4000).pipe(
    scan(
      (coleccion, n) => {
        if (n === 0) {
          const base = Date.now();
          return Array.from({ length: 12 }, (_, i) => crearDocumento(i, base - (12 - i) * 60_000)).reverse();
        }
        return [crearDocumento(n + 11), ...coleccion].slice(0, 60);
      },
      [] as Actividad[],
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
}
