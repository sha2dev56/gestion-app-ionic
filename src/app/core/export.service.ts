import { Injectable } from '@angular/core';
import { TableColumn, TableRow } from './models';

/** Genera y descarga informes tabulados en CSV y PDF. */
@Injectable({ providedIn: 'root' })
export class ExportService {
  /** Convierte filas a CSV (separador `;`, compatible con Excel en configuración regional española). */
  toCsv(columns: TableColumn[], rows: TableRow[]): string {
    const escape = (value: unknown): string => {
      const text = value === null || value === undefined ? '' : String(value);
      return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    const header = columns.map((c) => escape(c.label)).join(';');
    const body = rows.map((row) => columns.map((c) => escape(row[c.key])).join(';'));
    return [header, ...body].join('\r\n');
  }

  downloadCsv(filename: string, columns: TableColumn[], rows: TableRow[]): void {
    const blob = new Blob(['﻿', this.toCsv(columns, rows)], { type: 'text/csv;charset=utf-8' });
    this.download(blob, `${filename}.csv`);
  }

  /** Genera un PDF con cabecera, título, fecha y tabla con diseño. La librería se carga bajo demanda. */
  async downloadPdf(filename: string, title: string, columns: TableColumn[], rows: TableRow[]): Promise<void> {
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    doc.setFontSize(18);
    doc.text(title, 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(90);
    doc.text(`Generado el ${new Date().toLocaleString('es-ES')} · ${rows.length} registros`, 14, 25);

    autoTable(doc, {
      startY: 30,
      head: [columns.map((c) => c.label)],
      body: rows.map((row) => columns.map((c) => String(row[c.key] ?? ''))),
      headStyles: { fillColor: [30, 64, 175], textColor: 255 },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      styles: { fontSize: 9 },
      columnStyles: Object.fromEntries(
        columns.map((c, i) => [i, { halign: c.numeric ? 'right' : 'left' } as const]),
      ),
      didDrawPage: () => {
        doc.setFontSize(8);
        doc.text(`Página ${doc.getNumberOfPages()}`, 196, 290, { align: 'right' });
      },
    });

    doc.save(`${filename}.pdf`);
  }

  private download(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
