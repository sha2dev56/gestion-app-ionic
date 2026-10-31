import { supabaseConfig } from './supabase.config';

export const environment = {
  production: true,
  /** Latencia simulada (ms) del backend de demostración. */
  mockLatency: 350,
  /** Si url y anonKey están vacías se usa el backend simulado. */
  supabaseUrl: supabaseConfig.url,
  supabaseAnonKey: supabaseConfig.anonKey,
};
