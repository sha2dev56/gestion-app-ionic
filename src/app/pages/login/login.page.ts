import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonButton, IonContent, IonInput, IonSpinner } from '@ionic/angular';
import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, IonContent, IonInput, IonButton, IonSpinner],
  template: `
    <ion-content class="ion-padding">
      <main class="auth-card">
        <h1 tabindex="-1">Iniciar sesión</h1>
        <p class="muted">Accede con tu cuenta de Administrador o de Usuario Estándar.</p>

        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <ion-input
            label="Correo electrónico"
            labelPlacement="stacked"
            fill="outline"
            type="email"
            autocomplete="username"
            formControlName="email"
            [attr.aria-invalid]="showError('email')"
            aria-describedby="email-error"
          ></ion-input>
          <p id="email-error" class="field-error" role="alert">
            @if (showError('email')) {
              {{ form.controls.email.hasError('required') ? 'El correo es obligatorio.' : 'Introduce un correo válido.' }}
            }
          </p>

          <ion-input
            label="Contraseña"
            labelPlacement="stacked"
            fill="outline"
            type="password"
            autocomplete="current-password"
            formControlName="password"
            [attr.aria-invalid]="showError('password')"
            aria-describedby="password-error"
          ></ion-input>
          <p id="password-error" class="field-error" role="alert">
            @if (showError('password')) {
              {{ form.controls.password.hasError('required') ? 'La contraseña es obligatoria.' : 'Mínimo 8 caracteres.' }}
            }
          </p>

          <p class="field-error" role="alert">{{ error() }}</p>

          <ion-button type="submit" expand="block" [disabled]="loading()">
            @if (loading()) {
              <ion-spinner name="crescent" aria-hidden="true"></ion-spinner>
              <span class="ion-padding-start">Comprobando…</span>
            } @else {
              Entrar
            }
          </ion-button>
        </form>
      </main>
    </ion-content>
  `,
})
export class LoginPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });
  /** Señal que fuerza la actualización de la vista cuando cambia el estado del formulario. */
  private readonly status = toSignal(this.form.statusChanges, { initialValue: this.form.status });

  protected readonly loading = signal(false);
  protected readonly error = signal('');

  protected showError(name: 'email' | 'password'): boolean {
    this.status();
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  private mensajeError(err: unknown): string {
    if (!(err instanceof HttpErrorResponse)) return 'No se pudo iniciar sesión. Inténtalo de nuevo.';
    const code = (err.error as { code?: string } | null)?.code;
    if (code === 'email_not_confirmed') return 'Debes confirmar tu correo antes de entrar.';
    if (err.status === 401) return 'Correo o contraseña incorrectos.';
    if (err.status === 500) return 'Tu usuario no tiene perfil en la base de datos (tabla profiles).';
    return 'No se pudo conectar con el servidor. Inténtalo de nuevo.';
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.status();
      return;
    }
    this.error.set('');
    this.loading.set(true);
    const { email, password } = this.form.getRawValue();

    this.auth
      .login(email, password)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
          void this.router.navigateByUrl(returnUrl?.startsWith('/') ? returnUrl : '/productos');
        },
        error: (err: unknown) => this.error.set(this.mensajeError(err)),
      });
  }
}