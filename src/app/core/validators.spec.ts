import { FormControl } from '@angular/forms';
import { firstValueFrom, of, throwError } from 'rxjs';
import { emailLibreValidator } from './validators';

describe('emailLibreValidator', () => {
  const run = (value: string, exists: () => ReturnType<typeof of<boolean>>) =>
    firstValueFrom(emailLibreValidator(exists)(new FormControl(value)) as ReturnType<typeof of>);

  it('marca emailEnUso cuando el correo existe', async () => {
    expect(await run('a@demo.test', () => of(true))).toEqual({ emailEnUso: true });
  });

  it('es válido cuando el correo está libre', async () => {
    expect(await run('a@demo.test', () => of(false))).toBeNull();
  });

  it('no valida valores vacíos ni bloquea si el servicio falla', async () => {
    expect(await run('', () => of(true))).toBeNull();
    const failing = emailLibreValidator(() => throwError(() => new Error('x')));
    expect(await firstValueFrom(failing(new FormControl('a@b.c')) as ReturnType<typeof of>)).toBeNull();
  });
});
