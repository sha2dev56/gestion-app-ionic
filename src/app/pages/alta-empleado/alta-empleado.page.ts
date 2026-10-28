import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToggle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { EmpleadosService } from '../../services/empleados.service';
import { emailUnicoValidator } from '../../validators/email-unico.validator';

@Component({
  selector: 'app-alta-empleado',
  templateUrl: './alta-empleado.page.html',
  styleUrls: ['./alta-empleado.page.scss'],
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonToggle,
    IonButton,
    IonSpinner,
  ],
})
export class AltaEmpleadoPage {
  private readonly fb = inject(FormBuilder);
  private readonly empleados = inject(EmpleadosService);
  private readonly toast = inject(ToastController);

  protected readonly departamentos = [
    'Ventas',
    'Marketing',
    'Tecnología',
    'Recursos Humanos',
  ];
  protected readonly guardando = signal(false);
  protected readonly errorGuardado = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    email: [
      '',
      [Validators.required, Validators.email],
      [emailUnicoValidator(this.empleados)],
    ],
    departamento: ['', Validators.required],
    activo: [true],
  });

  protected mensajeEmail(): string {
    const errores = this.form.controls.email.errors;
    if (errores?.['required']) return 'El correo es obligatorio';
    if (errores?.['email']) return 'Introduce un correo electrónico válido';
    if (errores?.['emailDuplicado']) return 'Este correo ya está registrado';
    return '';
  }

  protected guardar(): void {
    if (this.form.invalid || this.form.pending) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.errorGuardado.set(null);

    this.empleados.crear(this.form.getRawValue()).subscribe({
      next: async (nuevo) => {
        this.guardando.set(false);
        this.form.reset({
          nombre: '',
          email: '',
          departamento: '',
          activo: true,
        });
        const aviso = await this.toast.create({
          message: `Empleado ${nuevo.nombre} dado de alta`,
          duration: 2500,
          color: 'success',
          position: 'top',
        });
        await aviso.present();
      },
      error: () => {
        this.guardando.set(false);
        this.errorGuardado.set('No se pudo guardar el registro. Inténtalo de nuevo.');
      },
    });
  }
}