import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent } from '@ionic/angular';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

@Component({
  selector: 'app-sin-permisos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IonContent, IonButton, PageHeaderComponent],
  template: `
    <app-page-header title="Acceso denegado" />
    <ion-content class="ion-padding">
      <main>
        <h1 tabindex="-1">No tienes permisos para ver esta página</h1>
        <p>Esta sección está reservada para el rol Administrador.</p>
        <ion-button routerLink="/productos">Volver a productos</ion-button>
      </main>
    </ion-content>
  `,
})
export class SinPermisosPage {}
