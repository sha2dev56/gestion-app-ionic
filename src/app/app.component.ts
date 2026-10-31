import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonApp,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuToggle,
  IonRouterOutlet,
  IonSplitPane,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  barChartOutline,
  cubeOutline,
  helpCircleOutline,
  logInOutline,
  logOutOutline,
  peopleOutline,
} from 'ionicons/icons';
import { AuthService } from './core/auth.service';

type MenuItem = { title: string; url: string; icon: string; admin?: boolean };

const MENU: MenuItem[] = [
  { title: 'Productos', url: '/productos', icon: 'cube-outline' },
  { title: 'Usuarios', url: '/usuarios', icon: 'people-outline', admin: true },
  { title: 'Panel', url: '/dashboard', icon: 'bar-chart-outline', admin: true },
  { title: 'Ayuda', url: '/ayuda', icon: 'help-circle-outline' },
];

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    RouterLinkActive,
    IonApp,
    IonSplitPane,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonMenuToggle,
    IonButton,
    IonRouterOutlet,
  ],
  template: `
    <a class="skip-link" href="#main" (click)="skipToContent($event)">Saltar al contenido principal</a>
    <ion-app>
      <ion-split-pane contentId="main">
        <ion-menu contentId="main" type="overlay" [disabled]="!auth.isLoggedIn()">
          <ion-header>
            <ion-toolbar color="primary">
              <ion-title>Gestión App</ion-title>
            </ion-toolbar>
          </ion-header>
          <ion-content>
            <nav aria-label="Navegación principal">
              <ion-list lines="none">
                @for (item of items(); track item.url) {
                  <ion-menu-toggle [autoHide]="false">
                    <ion-item
                      button
                      detail="false"
                      [routerLink]="item.url"
                      routerLinkActive="menu-active"
                      #rla="routerLinkActive"
                      [attr.aria-current]="rla.isActive ? 'page' : null"
                    >
                      <ion-icon slot="start" [name]="item.icon" aria-hidden="true"></ion-icon>
                      <ion-label>{{ item.title }}</ion-label>
                    </ion-item>
                  </ion-menu-toggle>
                }
              </ion-list>
            </nav>
            @if (auth.session(); as s) {
              <div class="menu-user">
                <p class="muted">
                  {{ s.nombre }}<br />
                  <span>{{ s.role === 'admin' ? 'Administrador' : 'Usuario Estándar' }}</span>
                </p>
                <ion-button expand="block" fill="outline" (click)="auth.logout()">
                  <ion-icon slot="start" name="log-out-outline" aria-hidden="true"></ion-icon>
                  Cerrar sesión
                </ion-button>
              </div>
            }
          </ion-content>
        </ion-menu>
        <ion-router-outlet id="main"></ion-router-outlet>
      </ion-split-pane>
    </ion-app>
  `,
})
export class AppComponent {
  protected readonly auth = inject(AuthService);

  protected readonly items = computed(() => MENU.filter((i) => !i.admin || this.auth.isAdmin()));

  constructor() {
    addIcons({ barChartOutline, cubeOutline, helpCircleOutline, logInOutline, logOutOutline, peopleOutline });
  }

  /** Enlace de salto: mueve el foco al encabezado principal de la página activa. */
  protected skipToContent(event: Event): void {
    event.preventDefault();
    const h1 = document.querySelector<HTMLElement>('ion-router-outlet .ion-page:not(.ion-page-hidden) h1');
    h1?.focus();
  }
}
