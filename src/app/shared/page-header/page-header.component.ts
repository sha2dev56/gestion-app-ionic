import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IonButtons, IonHeader, IonMenuButton, IonTitle, IonToolbar } from '@ionic/angular/standalone';

/** Cabecera común de las páginas con botón de menú lateral. */
@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button aria-label="Abrir menú de navegación"></ion-menu-button>
        </ion-buttons>
        <ion-title>{{ title() }}</ion-title>
      </ion-toolbar>
    </ion-header>
  `,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
}
