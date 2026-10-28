import { Injectable } from '@angular/core';
import { Observable, defer, delay, of } from 'rxjs';

export interface Empleado {
  id: number;
  nombre: string;
  email: string;
  departamento: string;
  activo: boolean;
}

@Injectable({ providedIn: 'root' })
export class EmpleadosService {
  // Datos sintéticos: no corresponden a personas reales.
  private empleados: Empleado[] = [
    { id: 1, nombre: 'Lucía Ejemplo', email: 'lucia@demo.test', departamento: 'Ventas', activo: true },
    { id: 2, nombre: 'Carlos Muestra', email: 'carlos@demo.test', departamento: 'Tecnología', activo: true },
    { id: 3, nombre: 'Marta Prueba', email: 'marta@demo.test', departamento: 'Marketing', activo: false },
  ];

  listar(): Observable<Empleado[]> {
    return defer(() => of([...this.empleados])).pipe(delay(500));
  }

  emailExiste(email: string): Observable<boolean> {
    const normalizado = email.trim().toLowerCase();
    return defer(() =>
      of(this.empleados.some((e) => e.email === normalizado)),
    ).pipe(delay(600));
  }

  crear(datos: Omit<Empleado, 'id'>): Observable<Empleado> {
    return defer(() => {
      const nuevo: Empleado = {
        ...datos,
        email: datos.email.trim().toLowerCase(),
        id: Math.max(0, ...this.empleados.map((e) => e.id)) + 1,
      };
      this.empleados = [...this.empleados, nuevo];
      return of(nuevo);
    }).pipe(delay(600));
  }
}