import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cashOutline, cubeOutline, peopleOutline, pulseOutline } from 'ionicons/icons';

/** Widget estadístico reutilizable: etiqueta, valor destacado y texto de apoyo. */
@Component({
  selector: 'app-stat-widget',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonIcon],
  template: `
    <div class="stat-card" role="group" [attr.aria-label]="label() + ': ' + value()">
      <ion-icon [name]="icon()" aria-hidden="true"></ion-icon>
      <div>
        <p class="stat-label">{{ label() }}</p>
        <p class="stat-value">{{ value() }}</p>
        @if (hint()) {
          <p class="stat-hint">{{ hint() }}</p>
        }
      </div>
    </div>
  `,
})
export class StatWidgetComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly icon = input('pulse-outline');
  readonly hint = input('');

  constructor() {
    addIcons({ cashOutline, cubeOutline, peopleOutline, pulseOutline });
  }
}
