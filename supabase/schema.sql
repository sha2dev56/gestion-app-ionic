-- =====================================================================
-- Gestión App · esquema de Supabase (ejecutar en SQL Editor, una sola vez)
-- Todos los datos son sintéticos.
-- =====================================================================

-- ---------- Perfiles (1:1 con auth.users) ----------
create table if not exists public.profiles (
  id     uuid primary key references auth.users (id) on delete cascade,
  email  text not null unique,
  nombre text not null,
  role   text not null default 'user' check (role in ('admin', 'user'))
);

-- Crea el perfil automáticamente. El rol SIEMPRE es 'user': nunca se lee de los metadatos
-- del registro (evita que alguien se auto-asigne 'admin' desde el cliente).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, nombre, role)
  values (new.id, new.email,
          coalesce(nullif(new.raw_user_meta_data ->> 'nombre', ''), split_part(new.email, '@', 1)),
          'user');
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- ¿El usuario actual es administrador? (security definer evita recursión en RLS)
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Validación asíncrona de correo duplicado (sólo administradores).
create or replace function public.email_exists(p_email text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin()
     and exists (select 1 from public.profiles where lower(email) = lower(p_email));
$$;
revoke all on function public.email_exists(text) from public, anon;
grant execute on function public.email_exists(text) to authenticated;

-- ---------- Productos (fuente relacional, consumo REST) ----------
create table if not exists public.productos (
  id        bigint generated always as identity primary key,
  nombre    text not null,
  categoria text not null,
  precio    numeric(10, 2) not null check (precio >= 0),
  stock     integer not null check (stock >= 0)
);

insert into public.productos (nombre, categoria, precio, stock)
select * from (values
  ('Portátil 14"', 'Informática', 749.90, 14),
  ('Monitor 27"', 'Informática', 219.00, 31),
  ('Teclado mecánico', 'Informática', 69.50, 58),
  ('Ratón ergonómico', 'Informática', 34.90, 76),
  ('Archivador A4', 'Oficina', 12.50, 120),
  ('Pack folios 500 uds', 'Oficina', 5.20, 340),
  ('Pizarra blanca', 'Oficina', 48.00, 22),
  ('Silla ergonómica', 'Mobiliario', 189.00, 17),
  ('Mesa elevable', 'Mobiliario', 329.00, 9),
  ('Estantería modular', 'Mobiliario', 96.00, 26),
  ('Auriculares con cancelación', 'Audio', 149.00, 40),
  ('Altavoz Bluetooth', 'Audio', 59.90, 63)
) as v (nombre, categoria, precio, stock)
where not exists (select 1 from public.productos);

-- ---------- Actividad (flujo en tiempo real, Supabase Realtime) ----------
create table if not exists public.actividad (
  id      uuid primary key default gen_random_uuid(),
  tipo    text not null check (tipo in ('venta', 'alta', 'incidencia')),
  usuario text not null,
  importe numeric(10, 2) not null default 0,
  fecha   timestamptz not null default now()
);

insert into public.actividad (tipo, usuario, importe, fecha)
select (array['venta', 'venta', 'alta', 'incidencia', 'venta'])[1 + (g % 5)],
       (array['ana.demo', 'luis.demo', 'marta.demo', 'pablo.demo', 'sara.demo'])[1 + (g % 5)],
       case when (g % 5) in (0, 1, 4) then 20 + (g * 37) % 380 else 0 end,
       now() - (g || ' minutes')::interval
from generate_series(1, 12) as g
where not exists (select 1 from public.actividad);

do $$ begin
  alter publication supabase_realtime add table public.actividad;
exception when duplicate_object then null;
end $$;

-- ---------- Row Level Security ----------
alter table public.profiles  enable row level security;
alter table public.productos enable row level security;
alter table public.actividad enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists productos_select on public.productos;
create policy productos_select on public.productos for select to authenticated using (true);

drop policy if exists actividad_select on public.actividad;
create policy actividad_select on public.actividad for select to authenticated using (true);

drop policy if exists actividad_insert_admin on public.actividad;
create policy actividad_insert_admin on public.actividad for insert to authenticated
  with check (public.is_admin());

-- =====================================================================
-- Usuarios de prueba: créalos en Authentication > Users > Add user
-- (marca "Auto Confirm User") con los correos del PDF de entrega:
--   admin@demo.test  y  user@demo.test
-- y después ejecuta:
--   update public.profiles set role = 'admin', nombre = 'Administrador Demo' where email = 'admin@demo.test';
--   update public.profiles set nombre = 'Usuario Demo' where email = 'user@demo.test';
-- =====================================================================
