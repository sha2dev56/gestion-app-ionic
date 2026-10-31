import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonButton,
  IonContent,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonSpinner,
} from '@ionic/angular/standalone';
import { ApiService } from '../../core/api.service';
import { Role, TableColumn, TableRow, Usuario } from '../../core/models';
import { emailLibreValidator } from '../../core/validators';
import { DataTableComponent } from '../../shared/data-table/data-table.component';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

@Component({
  selector: 'app-usuarios',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IonContent,
    IonInput,
    IonButton,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    PageHeaderComponent,
    DataTableComponent,
  ],
  template: `
    <app-page-header title="Usuarios" />
    <ion-content class="ion-padding">
      <main>
        <h1 tabindex="-1">Gestión de usuarios</h1>

        <section class="card" aria-labelledby="alta-titulo">
          <h2 id="alta-titulo">Alta de usuario</h2>
          <form [formGroup]="form" (ngSubmit)="guardar()" novalidate>
            <ion-input
              label="Nombre"
              labelPlacement="stacked"
              fill="outline"
              formControlName="nombre"
              autocomplete="off"
              aria-describedby="nombre-error"
            ></ion-input>
            <p id="nombre-error" class="field-error" role="alert">
              @if (invalido('nombre')) {
                Indica un nombre de al menos 3 caracteres.
              }
            </p>

            <ion-input
              label="Correo electrónico"
              labelPlacement="stacked"
              fill="outline"
              type="email"
              formControlName="email"
              autocomplete="off"
              aria-describedby="email-estado"
            ></ion-input>
            <p id="email-estado" class="field-error" role="alert">
              @if (form.controls.email.pending) {
                <span class="field-ok">Comprobando disponibilidad…</span>
              } @else if (form.controls.email.hasError('emailEnUso')) {
                Este correo ya está registrado.
              } @else if (invalido('email')) {
                Introduce un correo válido.
              }
            </p>

            <ion-input
              label="Contraseña inicial"
              labelPlacement="stacked"
              fill="outline"
              type="password"
              formControlName="password"
              autocomplete="new-password"
              aria-describedby="password-error"
            ></ion-input>
            <p id="password-error" class="field-error" role="alert">
              @if (invalido('password')) {
                Mínimo 8 caracteres.
              }
            </p>

            <ion-select
              label="Rol"
              labelPlacement="stacked"
              fill="outline"
              formControlName="role"
              interface="popover"
            >
              <ion-select-option value="user">Usuario Estándar</ion-select-option>
              <ion-select-option value="admin">Administrador</ion-select-option>
            </ion-select>

            <p class="field-error" role="alert">{{ error() }}</p>
            @if (ok()) {
              <p role="status">{{ ok() }}</p>
            }

            <ion-button type="submit" [disabled]="guardando() || form.controls.email.pending">
              @if (guardando()) {
                <ion-spinner name="crescent" aria-hidden="true"></ion-spinner>
              } @else {
                Crear usuario
              }
            </ion-button>
          </form>
        </section>

        @if (cargando()) {
          <p role="status"><ion-spinner name="dots" aria-hidden="true"></ion-spinner> Cargando usuarios…</p>
        } @else {
          <app-data-table caption="Usuarios" [columns]="columns" [rows]="rows()" [pageSize]="5" />
        }
      </main>
    </ion-content>
  `,
})
export class UsuariosPage {
  private readonly api = inject(ApiService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly columns: TableColumn[] = [
    { key: 'id', label: 'ID', numeric: true },
    { key: 'nombre', label: 'Nombre' },
    { key: 'email', label: 'Correo' },
    { key: 'role', label: 'Rol', format: (v) => (v === 'admin' ? 'Administrador' : 'Usuario Estándar') },
  ];

  protected readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    email: [
      '',
      {
        validators: [Validators.required, Validators.email],
        asyncValidators: [emailLibreValidator((e) => this.api.emailExiste(e))],
      },
    ],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: ['user' as Role],
  });
  /** Hace reactiva la vista ante cambios de estado (OnPush + validación asíncrona). */
  private readonly status = toSignal(this.form.statusChanges, { initialValue: this.form.status });

  private readonly usuarios = signal<Usuario[]>([]);
  protected readonly rows = signal<TableRow[]>([]);
  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly error = signal('');
  protected readonly ok = signal('');

  constructor() {
    this.cargar();
  }

  protected invalido(name: 'nombre' | 'email' | 'password'): boolean {
    this.status();
    const c = this.form.controls[name];
    return c.invalid && !c.hasError('emailEnUso') && (c.touched || c.dirty);
  }

  private cargar(): void {
    this.api
      .usuarios()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.usuarios.set(data);
          this.rows.set([...data]);
          this.cargando.set(false);
        },
        error: () => {
          this.error.set('No se pudo cargar el listado de usuarios.');
          this.cargando.set(false);
        },
      });
  }

  protected guardar(): void {
    this.ok.set('');
    this.error.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.status();
      return;
    }
    this.guardando.set(true);
    this.api
      .crearUsuario(this.form.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (nuevo) => {
          this.usuarios.update((u) => [...u, nuevo]);
          this.rows.set([...this.usuarios()]);
          this.ok.set(`Usuario «${nuevo.nombre}» creado correctamente.`);
          this.form.reset({ nombre: '', email: '', password: '', role: 'user' });
          this.guardando.set(false);
        },
        error: (err: unknown) => {
          this.error.set(
            err instanceof HttpErrorResponse && err.status === 409
              ? 'Ese correo ya está registrado.'
              : 'No se pudo crear el usuario.',
          );
          this.guardando.set(false);
        },
      });
  }
}
