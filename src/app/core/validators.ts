import { AsyncValidatorFn } from '@angular/forms';
import { Observable, catchError, map, of, switchMap, timer } from 'rxjs';

/**
 * Validador asíncrono: marca `emailEnUso` si el correo ya existe en la base de datos.
 * Incluye un debounce de 400 ms; al cambiar el valor Angular cancela la suscripción anterior.
 */
export function emailLibreValidator(emailExiste: (email: string) => Observable<boolean>): AsyncValidatorFn {
  return (control) => {
    const value = String(control.value ?? '').trim();
    if (!value) return of(null);
    return timer(400).pipe(
      switchMap(() => emailExiste(value)),
      map((existe) => (existe ? { emailEnUso: true } : null)),
      // Si el servicio falla no bloqueamos el formulario; el backend revalidará al guardar.
      catchError(() => of(null)),
    );
  };
}
