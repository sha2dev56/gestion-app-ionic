import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IonButton, IonContent, IonSpinner } from '@ionic/angular';
import { ApiService } from '../../core/api.service';
import { ExportService } from '../../core/export.service';
import { Producto, TableColumn, TableRow } from '../../core/models';
import { DataTableComponent } from '../../shared/data-table/data-table.component';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

const euros = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

@Component({
  selector: 'app-productos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonContent, IonButton, IonSpinner, PageHeaderComponent, DataTableComponent],
  template: `
    <app-page-header title="Productos" />
    <ion-content class="ion-padding">
      <main>
        <h1 tabindex="-1">Catálogo de productos</h1>

        @if (loading()) {
          <p role="status"><ion-spinner name="dots" aria-hidden="true"></ion-spinner> Cargando productos…</p>
        } @else if (error()) {
          <p class="field-error" role="alert">{{ error() }}</p>
          <ion-button (click)="load()">Reintentar</ion-button>
        } @else {
          <div class="actions" role="group" aria-label="Exportar informe">
            <ion-button fill="outline" (click)="exportCsv()">Exportar CSV</ion-button>
            <ion-button fill="outline" (click)="exportPdf()">Exportar PDF</ion-button>
          </div>

          <app-data-table
            caption="Productos"
            [columns]="columns"
            [rows]="rows()"
            [pageSize]="6"
            [selectable]="true"
            (rowSelected)="seleccionado.set($event)"
            (filteredChange)="visibles.set($event)"
          />

          <section class="card" aria-live="polite" aria-labelledby="detalle-titulo">
            <h2 id="detalle-titulo">Detalle seleccionado</h2>
            @if (seleccionado(); as p) {
              <p>
                <strong>{{ p['nombre'] }}</strong> · {{ p['categoria'] }} · {{ money(p['precio']) }} ·
                {{ p['stock'] }} unidades en stock
              </p>
            } @else {
              <p class="muted">Pulsa «Seleccionar» en una fila para ver su detalle.</p>
            }
          </section>
        }
      </main>
    </ion-content>
  `,
})
export class ProductosPage {
  private readonly api = inject(ApiService);
  private readonly exporter = inject(ExportService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly columns: TableColumn[] = [
    { key: 'id', label: 'ID', numeric: true },
    { key: 'nombre', label: 'Nombre' },
    { key: 'categoria', label: 'Categoría' },
    { key: 'precio', label: 'Precio', numeric: true, format: (v) => euros.format(Number(v)) },
    { key: 'stock', label: 'Stock', numeric: true },
  ];

  private readonly productos = signal<Producto[]>([]);
  protected readonly rows = computed<TableRow[]>(() => this.productos());
  protected readonly visibles = signal<TableRow[]>([]);
  protected readonly seleccionado = signal<TableRow | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api
      .productos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.productos.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudieron cargar los productos.');
          this.loading.set(false);
        },
      });
  }

  protected money(value: unknown): string {
    return euros.format(Number(value));
  }

  protected exportCsv(): void {
    this.exporter.downloadCsv('productos', this.columns, this.visibles());
  }

  protected async exportPdf(): Promise<void> {
    await this.exporter.downloadPdf('productos', 'Informe de productos', this.columns, this.visibles());
  }
}
