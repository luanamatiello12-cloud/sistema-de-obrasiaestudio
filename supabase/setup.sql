-- ============================================================
-- GP:OBRA — Script de segurança do Supabase
-- Execute no SQL Editor do painel do Supabase para ativar a
-- autenticação real e proteger o banco de dados.
--
-- IMPORTANTE: depois de rodar este script, crie os usuários em
-- Authentication > Users no painel do Supabase e defina o papel
-- de cada um na tabela profiles (ADMIN ou CLIENTE).
-- ============================================================

-- 1) Tabela de perfis vinculada ao Supabase Auth
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null default 'CLIENTE' check (role in ('ADMIN', 'CLIENTE')),
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Cria o perfil automaticamente quando um usuário é registrado
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: verifica se o usuário logado é ADMIN
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'ADMIN'
  );
$$;

-- 2) Ativar RLS em todas as tabelas
alter table public.chat_mensagens    enable row level security;
alter table public.obra_cronograma   enable row level security;
alter table public.obra_financeiro   enable row level security;
alter table public.diario_obra       enable row level security;
alter table public.pedidos_materiais enable row level security;
alter table public.pontos_tecnicos   enable row level security;
alter table public.profiles          enable row level security;

-- 3) Políticas
-- Perfis: cada um vê o próprio; admin vê todos
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

-- Leitura: qualquer usuário AUTENTICADO pode ler os dados da obra
drop policy if exists "chat_select" on public.chat_mensagens;
create policy "chat_select" on public.chat_mensagens for select to authenticated using (true);

drop policy if exists "crono_select" on public.obra_cronograma;
create policy "crono_select" on public.obra_cronograma for select to authenticated using (true);

drop policy if exists "fin_select" on public.obra_financeiro;
create policy "fin_select" on public.obra_financeiro for select to authenticated using (true);

drop policy if exists "diario_select" on public.diario_obra;
create policy "diario_select" on public.diario_obra for select to authenticated using (true);

drop policy if exists "ped_select" on public.pedidos_materiais;
create policy "ped_select" on public.pedidos_materiais for select to authenticated using (true);

drop policy if exists "pontos_select" on public.pontos_tecnicos;
create policy "pontos_select" on public.pontos_tecnicos for select to authenticated using (true);

-- Chat: autenticados podem inserir (apenas com o próprio e-mail como autor)
drop policy if exists "chat_insert" on public.chat_mensagens;
create policy "chat_insert" on public.chat_mensagens
  for insert to authenticated
  with check (autor = (select email from public.profiles where id = auth.uid()));

-- Escritas administrativas: apenas ADMIN
drop policy if exists "crono_write" on public.obra_cronograma;
create policy "crono_write" on public.obra_cronograma
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "fin_write" on public.obra_financeiro;
create policy "fin_write" on public.obra_financeiro
  for insert to authenticated with check (public.is_admin());

drop policy if exists "diario_write" on public.diario_obra;
create policy "diario_write" on public.diario_obra
  for insert to authenticated with check (public.is_admin());

drop policy if exists "ped_write" on public.pedidos_materiais;
create policy "ped_write" on public.pedidos_materiais
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "pontos_write" on public.pontos_tecnicos;
create policy "pontos_write" on public.pontos_tecnicos
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 4) Finalizar compra de forma atômica (aprovar pedido + lançar no financeiro)
create or replace function public.finalizar_compra(
  p_pedido_id bigint,
  p_valor numeric,
  p_cupom_url text
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_material text;
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem finalizar compras';
  end if;

  select material into v_material from public.pedidos_materiais where id = p_pedido_id for update;
  if v_material is null then
    raise exception 'Pedido não encontrado';
  end if;

  update public.pedidos_materiais set status = 'aprovado' where id = p_pedido_id;
  insert into public.obra_financeiro (descricao, valor_pago, cupom_url)
  values ('COMPRA: ' || v_material, p_valor, p_cupom_url);
end;
$$;

-- 5) Storage: permitir upload de imagens por usuários autenticados
-- (chat, cupons, diário e hotspots deixam de usar base64 no banco)
drop policy if exists "storage_upload_authenticated" on storage.objects;
create policy "storage_upload_authenticated" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'projeto-arquivos');

-- ============================================================
-- Depois de rodar:
-- 1. Crie os usuários em Authentication > Users (e-mail + senha)
-- 2. Promova os administradores:
--    update public.profiles set role = 'ADMIN' where email = 'engenheiro@exemplo.com';
-- 3. O app detecta automaticamente e sai do "Modo Demo"
-- ============================================================
