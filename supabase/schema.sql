-- StruvaMap — Supabase şema taslağı
-- Not: web'de auth yok (anonim session_id). session_id, mobil uygulama gerçek
-- auth ile gelince user_id'ye kolayca genişleyebilsin diye ayrı tutuluyor.
-- Backend (NestJS) service-role key ile yazar; RLS anonim client'tan doğrudan
-- yazmayı engeller.

create table if not exists results (
  id uuid primary key default gen_random_uuid(),
  test_id text not null,
  session_id text not null,
  answers jsonb not null,
  score jsonb not null,       -- ScoreResult (rsi, dimensions, indices, ...)
  created_at timestamptz not null default now()
);

create index if not exists results_session_id_idx on results (session_id);
create index if not exists results_test_id_idx on results (test_id);

create table if not exists comparisons (
  id uuid primary key default gen_random_uuid(),
  test_id text not null,
  result_id_a uuid not null references results (id),
  result_id_b uuid not null references results (id),
  created_at timestamptz not null default now()
);

alter table results enable row level security;
alter table comparisons enable row level security;
-- Politika yok: yalnızca service-role key (backend) erişebilir.
