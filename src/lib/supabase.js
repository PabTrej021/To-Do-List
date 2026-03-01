import { createClient } from '@supabase/supabase-js';

// En un entorno de producción, las variables deberían venir de import.meta.env
// Usamos mock values provisorios o los definitivos si estuvieran en .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'mock-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
