import { ExportService } from './export.service';

describe('ExportService.toCsv', () => {
  const service = new ExportService();
  const columns = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'precio', label: 'Precio' },
  ];

  it('genera cabecera y filas separadas por punto y coma', () => {
    expect(service.toCsv(columns, [{ nombre: 'Café', precio: 3 }])).toBe('Nombre;Precio\r\nCafé;3');
  });

  it('escapa comillas, separadores y saltos de línea', () => {
    const csv = service.toCsv(columns, [{ nombre: 'A;"B"', precio: null }]);
    expect(csv).toBe('Nombre;Precio\r\n"A;""B""";');
  });
});
