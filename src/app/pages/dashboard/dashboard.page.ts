import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
  ElementRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IonButton, IonContent, IonSelect, IonSelectOption, IonSpinner } from '@ionic/angular';
import { Chart, registerables } from 'chart.js';
import { first, forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ExportService } from '../../core/export.service';
import { Actividad, Producto, TableColumn, TipoActividad } from '../../core/models';
import { RealtimeService } from '../../core/realtime.service';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { StatWidgetComponent } from '../../shared/stat-widget/stat-widget.component';

Chart.register(...registerables);

const euros = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonContent, IonButton, IonSelect, IonSelectOption, IonSpinner, PageHeaderComponent, StatWidgetComponent],
  template: `
    <app-page-header title="Panel de administración" />
    <ion-content class="ion-padding">
      <main>
        <h1 tabindex="-1">Panel de administración</h1>

        @if (cargando()) {
          <p role="status"><ion-spinner name="dots" aria-hidden="true"></ion-spinner> Cargando datos…</p>
        }

        <ion-select
          label="Filtrar por categoría"
          labelPlacement="stacked"
          fill="outline"
          interface="popover"
          [value]="categoria()"
          (ionChange)="categoria.set($event.detail.value)"
        >
          <ion-select-option value="todas">Todas</ion-select-option>
          @for (c of categorias(); track c) {
            <ion-select-option [value]="c">{{ c }}</ion-select-option>
          }
        </ion-select>

        <div class="stat-grid">
          <app-stat-widget label="Productos" [value]="productosFiltrados().length" icon="cube-outline" hint="Fuente SQL (REST)" />
          <app-stat-widget label="Valor de inventario" [value]="valorInventario()" icon="cash-outline" hint="Precio × stock" />
          <app-stat-widget label="Eventos en vivo" [value]="actividad().length" icon="pulse-outline" hint="Fuente NoSQL (tiempo real)" />
          <app-stat-widget label="Ventas (importe)" [value]="totalVentas()" icon="people-outline" hint="Suma de eventos «venta»" />
        </div>

        <div class="actions" role="group" aria-label="Exportar informes">
          <ion-button fill="outline" (click)="exportCsv()">Exportar CSV</ion-button>
          <ion-button fill="outline" (click)="exportPdf()">Exportar PDF</ion-button>
          @if (realtime.remoto) {
            <ion-button (click)="simularEvento()">Simular evento en tiempo real</ion-button>
          }
        </div>

        <div class="chart-grid">
          <section class="card" aria-labelledby="g1">
            <h2 id="g1">Stock por categoría</h2>
            <div class="chart-box">
              <canvas
                #stockCanvas
                role="img"
                [attr.aria-label]="descripcionStock()"
              ></canvas>
            </div>
          </section>
          <section class="card" aria-labelledby="g2">
            <h2 id="g2">Actividad en tiempo real</h2>
            <div class="chart-box">
              <canvas
                #actividadCanvas
                role="img"
                [attr.aria-label]="descripcionActividad()"
              ></canvas>
            </div>
          </section>
        </div>
      </main>
    </ion-content>
  `,
})
export class DashboardPage {
  private readonly api = inject(ApiService);
  protected readonly realtime = inject(RealtimeService);
  private readonly auth = inject(AuthService);
  private readonly exporter = inject(ExportService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly stockCanvas = viewChild<ElementRef<HTMLCanvasElement>>('stockCanvas');
  private readonly actividadCanvas = viewChild<ElementRef<HTMLCanvasElement>>('actividadCanvas');
  private stockChart?: Chart;
  private actividadChart?: Chart;

  protected readonly productos = signal<Producto[]>([]);
  protected readonly actividad = signal<Actividad[]>([]);
  protected readonly categoria = signal('todas');
  protected readonly cargando = signal(true);

  protected readonly categorias = computed(() => [...new Set(this.productos().map((p) => p.categoria))].sort());
  protected readonly productosFiltrados = computed(() =>
    this.categoria() === 'todas' ? this.productos() : this.productos().filter((p) => p.categoria === this.categoria()),
  );
  protected readonly valorInventario = computed(() =>
    euros.format(this.productosFiltrados().reduce((acc, p) => acc + p.precio * p.stock, 0)),
  );
  protected readonly totalVentas = computed(() =>
    euros.format(this.actividad().filter((a) => a.tipo === 'venta').reduce((acc, a) => acc + a.importe, 0)),
  );

  private readonly stockPorCategoria = computed(() => {
    const mapa = new Map<string, number>();
    for (const p of this.productosFiltrados()) mapa.set(p.categoria, (mapa.get(p.categoria) ?? 0) + p.stock);
    return [...mapa.entries()];
  });
  private readonly actividadPorTipo = computed(() => {
    const mapa = new Map<string, number>([
      ['venta', 0],
      ['alta', 0],
      ['incidencia', 0],
    ]);
    for (const a of this.actividad()) mapa.set(a.tipo, (mapa.get(a.tipo) ?? 0) + 1);
    return [...mapa.entries()];
  });

  protected readonly descripcionStock = computed(
    () => 'Gráfico de barras de stock por categoría: ' + this.stockPorCategoria().map(([c, n]) => `${c} ${n}`).join(', '),
  );
  protected readonly descripcionActividad = computed(
    () => 'Gráfico de actividad por tipo: ' + this.actividadPorTipo().map(([t, n]) => `${t} ${n}`).join(', '),
  );

  constructor() {
    // Carga inicial: la API REST y el primer snapshot del flujo en tiempo real, en paralelo.
    forkJoin({ productos: this.api.productos(), primera: this.realtime.actividad$.pipe(first()) })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ productos, primera }) => {
          this.productos.set(productos);
          this.actividad.set(primera);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });

    // Suscripción continua a los cambios en tiempo real.
    this.realtime.actividad$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((docs) => this.actividad.set(docs));

    effect(() => this.pintarStock(this.stockCanvas()?.nativeElement, this.stockPorCategoria()));
    effect(() => this.pintarActividad(this.actividadCanvas()?.nativeElement, this.actividadPorTipo()));

    this.destroyRef.onDestroy(() => {
      this.stockChart?.destroy();
      this.actividadChart?.destroy();
    });
  }

  private pintarStock(canvas: HTMLCanvasElement | undefined, datos: [string, number][]): void {
    if (!canvas) return;
    const labels = datos.map(([c]) => c);
    const values = datos.map(([, n]) => n);
    if (this.stockChart) {
      this.stockChart.data.labels = labels;
      this.stockChart.data.datasets[0].data = values;
      this.stockChart.update();
      return;
    }
    this.stockChart = new Chart(canvas, {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Unidades en stock', data: values, backgroundColor: '#1e40af' }] },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } },
    });
  }

  private pintarActividad(canvas: HTMLCanvasElement | undefined, datos: [string, number][]): void {
    if (!canvas) return;
    const labels = datos.map(([t]) => t);
    const values = datos.map(([, n]) => n);
    if (this.actividadChart) {
      this.actividadChart.data.labels = labels;
      this.actividadChart.data.datasets[0].data = values;
      this.actividadChart.update();
      return;
    }
    this.actividadChart = new Chart(canvas, {
      type: 'doughnut',
      data: { labels, datasets: [{ data: values, backgroundColor: ['#1e40af', '#0f766e', '#b45309'] }] },
      options: { responsive: true, maintainAspectRatio: false },
    });
  }

  private readonly columnasStock: TableColumn[] = [
    { key: 'categoria', label: 'Categoría' },
    { key: 'stock', label: 'Stock total', numeric: true },
  ];

  /** Inserta un evento en la base de datos; llega de vuelta por Realtime a todos los clientes. */
  protected async simularEvento(): Promise<void> {
    const tipos: TipoActividad[] = ['venta', 'venta', 'alta', 'incidencia'];
    const tipo = tipos[Math.floor(Math.random() * tipos.length)];
    const importe = tipo === 'venta' ? Math.round(20 + Math.random() * 380) : 0;
    try {
      await this.realtime.emitir(tipo, this.auth.session()?.email ?? 'admin', importe);
    } catch {
      /* RLS o red: el panel simplemente no recibe el evento */
    }
  }

  protected exportCsv(): void {
    this.exporter.downloadCsv('panel-stock', this.columnasStock, this.filasStock());
  }

  protected async exportPdf(): Promise<void> {
    await this.exporter.downloadPdf('panel-stock', 'Informe de stock por categoría', this.columnasStock, this.filasStock());
  }

  private filasStock(): Record<string, unknown>[] {
    return this.stockPorCategoria().map(([categoria, stock]) => ({ categoria, stock }));
  }
}
