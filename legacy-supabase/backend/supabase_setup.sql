-- ============================================================
--  Supabase  ->  SQL Editor  ->  pega y ejecuta TODO esto
-- ============================================================
--  Crea la tabla donde se guardan los "archivos en trabajo".
--  No usa login: la clave anon puede leer/escribir (herramienta
--  interna del equipo). Si quieres, luego se puede endurecer.
-- ============================================================

-- 1) Tabla principal
create table if not exists public.file_locks (
  id          uuid primary key default gen_random_uuid(),
  file_path   text        not null,
  branch      text        not null,
  user_name   text        not null,
  client_id   text        not null,   -- identifica al navegador/persona sin login
  color       text        not null default '#6366f1',
  note        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Una misma persona (client_id) no marca dos veces el mismo
-- archivo en la misma rama.
create unique index if not exists file_locks_unique_claim
  on public.file_locks (file_path, branch, client_id);

create index if not exists file_locks_file_idx on public.file_locks (file_path);

-- 2) Mantener updated_at al día
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_touch_file_locks on public.file_locks;
create trigger trg_touch_file_locks
  before update on public.file_locks
  for each row execute function public.touch_updated_at();

-- 3) Seguridad: RLS activo pero acceso abierto con la clave anon
--    (no hay login; es una herramienta de equipo).
alter table public.file_locks enable row level security;

drop policy if exists "lectura abierta"   on public.file_locks;
drop policy if exists "insertar abierto"  on public.file_locks;
drop policy if exists "actualizar abierto" on public.file_locks;
drop policy if exists "borrar abierto"    on public.file_locks;

create policy "lectura abierta"    on public.file_locks for select using (true);
create policy "insertar abierto"   on public.file_locks for insert with check (true);
create policy "actualizar abierto" on public.file_locks for update using (true) with check (true);
create policy "borrar abierto"     on public.file_locks for delete using (true);

-- 4) Realtime: que todos vean los cambios al instante
alter publication supabase_realtime add table public.file_locks;

-- Listo ✅
