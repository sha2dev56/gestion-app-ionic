import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

/** Manual de usuario integrado en la aplicación. */
@Component({
  selector: 'app-ayuda',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonContent, PageHeaderComponent],
  template: `
    <app-page-header title="Ayuda" />
    <ion-content class="ion-padding">
      <main>
        <h1 tabindex="-1">Manual de usuario</h1>

        <section class="card" aria-labelledby="h-acceso">
          <h2 id="h-acceso">Acceso y roles</h2>
          <p>
            Inicia sesión con tu correo y contraseña. Existen dos roles: <strong>Administrador</strong>, con acceso a
            productos, usuarios y panel; y <strong>Usuario Estándar</strong>, con acceso a productos y ayuda. Las
            credenciales de prueba se facilitan en el documento de entrega. La sesión caduca a la hora.
          </p>
        </section>

        <section class="card" aria-labelledby="h-prod">
          <h2 id="h-prod">Productos</h2>
          <p>
            Usa el buscador para filtrar, pulsa en una cabecera para ordenar, y los botones inferiores para paginar.
            «Seleccionar» muestra el detalle de un producto. «Exportar CSV/PDF» descarga los datos filtrados.
          </p>
        </section>

        <section class="card" aria-labelledby="h-usr">
          <h2 id="h-usr">Usuarios (Administrador)</h2>
          <p>
            Rellena el formulario de alta. El correo se comprueba automáticamente mientras escribes; si ya existe se
            muestra un aviso y no podrás guardar.
          </p>
        </section>

        <section class="card" aria-labelledby="h-panel">
          <h2 id="h-panel">Panel (Administrador)</h2>
          <p>
            Muestra indicadores y gráficas que combinan datos de la API REST (SQL) y de un flujo en tiempo real
            (NoSQL). Filtra por categoría y exporta el informe en CSV o PDF.
          </p>
        </section>

        <section class="card" aria-labelledby="h-teclado">
          <h2 id="h-teclado">Accesibilidad y teclado</h2>
          <p>
            Pulsa <kbd>Tab</kbd> para avanzar, <kbd>Mayús + Tab</kbd> para retroceder, <kbd>Intro</kbd> o
            <kbd>Espacio</kbd> para activar. El primer elemento enfocable es «Saltar al contenido principal».
          </p>
        </section>
      </main>
    </ion-content>
  `,
})
export class AyudaPage {}
