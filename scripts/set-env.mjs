// Genera src/environments/supabase.config.ts a partir de variables de entorno o de .env.local.
// Así la URL y la clave pública NO se versionan en el repositorio.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const fromFile = {};
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m) fromFile[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const url = process.env.SUPABASE_URL ?? fromFile.SUPABASE_URL ?? '';
const key = process.env.SUPABASE_ANON_KEY ?? fromFile.SUPABASE_ANON_KEY ?? '';

writeFileSync(
  'src/environments/supabase.config.ts',
  `// Archivo generado por scripts/set-env.mjs (no editar ni versionar).\nexport const supabaseConfig = {\n  url: ${JSON.stringify(url)},\n  anonKey: ${JSON.stringify(key)},\n};\n`,
);
console.log(url && key ? 'Supabase configurado.' : 'Supabase NO configurado: se usará el backend simulado.');
