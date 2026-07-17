-- ============================================================
-- GP:OBRA — Schema completo das tabelas
-- Use este script ao criar um NOVO projeto Supabase (o projeto
-- original exvsnqybuvkabavwyrsu não existe mais).
-- Rode este arquivo PRIMEIRO, depois o setup.sql (segurança).
-- ============================================================

create table if not exists public.chat_mensagens (
  id bigint generated always as identity primary key,
  autor text not null,
  mensagem text,
  midia_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.obra_cronograma (
  id bigint generated always as identity primary key,
  etapa text not null,
  progresso int not null default 0 check (progresso between 0 and 100),
  ordem int not null default 0
);

create table if not exists public.obra_financeiro (
  id bigint generated always as identity primary key,
  descricao text not null,
  valor_pago numeric(12,2) not null,
  cupom_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.diario_obra (
  id bigint generated always as identity primary key,
  autor text not null,
  descricao text not null,
  midia_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.pedidos_materiais (
  id bigint generated always as identity primary key,
  material text not null,
  quantidade text not null,
  urgencia text not null default 'planeada' check (urgencia in ('critica', 'media', 'planeada')),
  status text not null default 'pendente' check (status in ('pendente', 'aprovado')),
  created_at timestamptz not null default now()
);

create table if not exists public.pontos_tecnicos (
  id bigint generated always as identity primary key,
  nome_comodo text not null,
  url_foto_interna text not null,
  pos_x numeric not null,
  pos_y numeric not null
);

-- Habilitar realtime nas tabelas
alter publication supabase_realtime add table public.chat_mensagens;
alter publication supabase_realtime add table public.obra_cronograma;
alter publication supabase_realtime add table public.obra_financeiro;
alter publication supabase_realtime add table public.diario_obra;
alter publication supabase_realtime add table public.pedidos_materiais;
alter publication supabase_realtime add table public.pontos_tecnicos;

-- Bucket público para imagens (plantas, fotos, cupons)
insert into storage.buckets (id, name, public)
values ('projeto-arquivos', 'projeto-arquivos', true)
on conflict (id) do nothing;

-- Dados iniciais do cronograma (exemplo — ajuste às etapas reais)
insert into public.obra_cronograma (etapa, progresso, ordem) values
  ('Fundação', 0, 1),
  ('Alvenaria', 0, 2),
  ('Cobertura', 0, 3),
  ('Instalações', 0, 4),
  ('Acabamento', 0, 5)
on conflict do nothing;
