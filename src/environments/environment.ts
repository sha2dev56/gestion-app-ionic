import { supabaseConfig } from './supabase.config';

export const environment = {
  production: false,
  /** Latencia simulada (ms) del backend de demostración. */
  mockLatency: 350,
  /** Si url y anonKey están vacías se usa el backend simulado. */
  supabaseUrl: supabaseConfig.url,
  supabaseAnonKey: supabaseConfig.anonKey,
};
