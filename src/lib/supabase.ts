import { createClient } from '@supabase/supabase-js';

// Configuração via variáveis de ambiente (.env), com fallback para os valores atuais
// para o app continuar funcionando sem configuração extra.
const SUPA_URL =
  import.meta.env.VITE_SUPABASE_URL ?? 'https://exvsnqybuvkabavwyrsu.supabase.co';
const SUPA_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4dnNucXlidXZrYWJhdnd5cnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4OTg0MDEsImV4cCI6MjA4NjQ3NDQwMX0.LQX2wS5XyAj1GAZmDqR4uXtVDu36nMcGGy2RKtpkJ5c';

export const sb = createClient(SUPA_URL, SUPA_KEY);

export const STORAGE_BUCKET = 'projeto-arquivos';
export const STORAGE_URL = `${SUPA_URL}/storage/v1/object/public/${STORAGE_BUCKET}`;
