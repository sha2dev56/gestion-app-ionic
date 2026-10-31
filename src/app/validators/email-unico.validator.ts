import {
  AbstractControl,
  AsyncValidatorFn,
  ValidationErrors,
} from '@angular/forms';
import { Observable, map, of, switchMap, timer } from 'rxjs';
import { EmpleadosService } from '../services/empleados.service';

export function emailUnicoValidator(
  servicio: EmpleadosService,
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const valor = String(control.value ?? '').trim();
    if (!valor) {
      return of(null);
    }
    // El timer actúa como "debounce": si el usuario sigue escribiendo,
    // Angular cancela la suscripción anterior y no se lanza la consulta.
    return timer(400).pipe(
      switchMap(() => servicio.emailExiste(valor)),
      map((existe) => (existe ? { emailDuplicado: true } : null)),
    );
  };
}