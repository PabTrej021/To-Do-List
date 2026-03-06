-- =========================================================================
-- COMPLETE SUPABASE SCHEMA & RLS FIX
-- Copia y Pega TODO este bloque en tu Supabase SQL Editor y pulsa "Run"
-- =========================================================================

-- 1. TABLA PERFILES (GAMIFICACIÓN VINCULADA AL USUARIO)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    xp INTEGER NOT NULL DEFAULT 0,
    streak INTEGER NOT NULL DEFAULT 0,
    last_completed_date TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Seguridad RLS para Perfiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuarios ven su propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuarios actualizan su propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuarios insertan su propio perfil" ON public.profiles;

CREATE POLICY "Usuarios ven su propio perfil" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Usuarios actualizan su propio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Usuarios insertan su propio perfil" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);


-- 2. TABLA TAREAS (REPARACIÓN ABSOLUTA + NOTAS DE IA)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'other',
    priority TEXT NOT NULL DEFAULT 'medium',
    progress INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT false,
    due_date TIMESTAMP WITH TIME ZONE,
    ai_notes TEXT, -- <=== INYECCIÓN EXACTA PARA EVITAR ERRORES DE CRASH
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitamos la columna ai_notes en caso de que la tabla ya exista pero le falte
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS ai_notes TEXT;

-- Habilitar Seguridad y Políticas
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Gestión total tareas propias" ON public.tasks;

CREATE POLICY "Gestión total tareas propias" ON public.tasks AS PERMISSIVE FOR ALL TO public USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 3. TABLA SUBTAREAS (EL ORIGEN DEL ERROR DE VERCEL)
CREATE TABLE IF NOT EXISTS public.subtasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Seguridad RLS para Subtareas
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Gestión total subtareas" ON public.subtasks;
DROP POLICY IF EXISTS "Gestión total subtareas propias" ON public.subtasks;

-- Esta política asegura que solo puedas tocar las subtareas de las tareas de las que eres dueño
CREATE POLICY "Gestión total subtareas" ON public.subtasks AS PERMISSIVE FOR ALL USING (
    EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid())
) WITH CHECK (
    EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid())
);


-- 4. HABILITAMOS MAGIA EN TIEMPO REAL A TODAS LAS TABLAS
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;

alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.subtasks; -- <=== CRÍTICO PARA EL DESGLOSE DE GEMINI

-- Limpiar la caché subyacente del sistema para forzar el reinicio de las relaciones
NOTIFY pgrst, 'reload schema';
