import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronBackOutline, chevronForwardOutline, swapVerticalOutline } from 'ionicons/icons';
import { TableColumn, TableRow } from '../../core/models';

let nextTableId = 0;

/**
 * Tabla de datos reutilizable con búsqueda, ordenación y paginación.
 * Es agnóstica respecto a la vista: recibe datos por `input()` y notifica por `output()`.
 */
@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton, IonIcon],
})
export class DataTableComponent {
  readonly caption = input.required<string>();
  readonly columns = input.required<TableColumn[]>();
  readonly rows = input.required<TableRow[]>();
  readonly pageSize = input(5);
  readonly selectable = input(false);

  /** Se emite al pulsar el botón de selección de una fila. */
  readonly rowSelected = output<TableRow>();
  /** Se emite cada vez que cambia el conjunto de filas filtradas (búsqueda). */
  readonly filteredChange = output<TableRow[]>();

  protected readonly searchId = `table-search-${nextTableId++}`;
  protected readonly term = signal('');
  protected readonly sortKey = signal<string | null>(null);
  protected readonly sortDir = signal<'asc' | 'desc'>('asc');
  protected readonly page = signal(0);

  protected readonly filtered = computed(() => {
    const term = this.term().trim().toLowerCase();
    const cols = this.columns();
    const rows = this.rows();
    if (!term) return rows;
    return rows.filter((row) => cols.some((c) => String(row[c.key] ?? '').toLowerCase().includes(term)));
  });

  protected readonly sorted = computed(() => {
    const key = this.sortKey();
    const rows = [...this.filtered()];
    if (!key) return rows;
    const numeric = this.columns().find((c) => c.key === key)?.numeric ?? false;
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    return rows.sort((a, b) =>
      numeric
        ? (Number(a[key]) - Number(b[key])) * dir
        : String(a[key] ?? '').localeCompare(String(b[key] ?? ''), 'es') * dir,
    );
  });

  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.sorted().length / this.pageSize())));
  protected readonly visible = computed(() => {
    const start = this.page() * this.pageSize();
    return this.sorted().slice(start, start + this.pageSize());
  });

  constructor() {
    addIcons({ chevronBackOutline, chevronForwardOutline, swapVerticalOutline });
    // Notifica al padre el conjunto filtrado y vuelve a la primera página al cambiar los datos.
    effect(() => {
      this.filteredChange.emit(this.filtered());
      this.page.set(0);
    });
  }

  protected onSearch(event: Event): void {
    this.term.set((event.target as HTMLInputElement).value);
  }

  protected sortBy(key: string): void {
    if (this.sortKey() === key) {
      this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
  }

  protected ariaSort(key: string): 'ascending' | 'descending' | 'none' {
    if (this.sortKey() !== key) return 'none';
    return this.sortDir() === 'asc' ? 'ascending' : 'descending';
  }

  protected prev(): void {
    this.page.update((p) => Math.max(0, p - 1));
  }

  protected next(): void {
    this.page.update((p) => Math.min(this.totalPages() - 1, p + 1));
  }
}
