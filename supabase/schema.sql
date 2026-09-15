-- StruvaMap — Supabase şema taslağı
-- Not: web'de auth yok (anonim session_id). Mobil (Android) gerçek auth
-- kullanıyor (bkz. profiles); results.user_id auth'lu kayıtlarda dolu,
-- web'in anonim kayıtlarında null kalır — iki akış aynı tabloyu paylaşır.
-- Backend (NestJS) service-role key ile yazar; RLS anonim client'tan doğrudan
-- yazmayı engeller.

create table if not exists results (
  id uuid primary key default gen_random_uuid(),
  test_id text not null,
  session_id text not null,
  user_id uuid references auth.users (id),
  answers jsonb not null,
  score jsonb not null,       -- ScoreResult (rsi, dimensions, indices, ...)
  created_at timestamptz not null default now()
);

create index if not exists results_user_id_idx on results (user_id);

create index if not exists results_session_id_idx on results (session_id);
create index if not exists results_test_id_idx on results (test_id);

create table if not exists comparisons (
  id uuid primary key default gen_random_uuid(),
  test_id text not null,
  result_id_a uuid not null references results (id),
  result_id_b uuid not null references results (id),
  created_at timestamptz not null default now()
);

-- Ürün ölçümü: huninin nerede koptuğunu görmek için olay kaydı.
-- Kişisel veri tutulmaz (IP, user-agent, kimlik yok); yalnızca anonim
-- session_id ve olay adı. Sonuçlarla aynı gizlilik çizgisinde.
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  session_id text not null,
  test_id text,
  props jsonb,
  created_at timestamptz not null default now()
);

create index if not exists events_name_idx on events (name);
create index if not exists events_created_at_idx on events (created_at);
create index if not exists events_session_id_idx on events (session_id);

-- Quiz içeriği: eskiden @struva/shared içinde koda gömülüydü, artık admin
-- panelinden düzenlenebilsin diye DB'de. definition = TestDefinition (bkz.
-- packages/shared/src/types.ts) birebir JSON'u.
create table if not exists tests (
  id text primary key,
  definition jsonb not null,
  updated_at timestamptz not null default now()
);

-- Mobil kullanıcı adı+şifre girişi: Supabase Auth e-posta ister, bu yüzden
-- backend username'den sentetik bir e-posta üretir (bkz. auth/username.util.ts)
-- ve gerçek kullanıcı adını burada tutar. auth.users silinirse profil de gider.
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists profiles_username_lower_idx on profiles (lower(username));

-- Mobil push bildirimi: davet edenin cihaz FCM token'ı, kendi sonucuna
-- (result_id) bağlı tutulur. Karşı taraf testi bitirip kıyaslama oluşunca
-- backend bu token'a push atar (bkz. comparisons.service.ts). Sonuç silinirse
-- token da gitsin diye cascade.
create table if not exists push_tokens (
  result_id uuid primary key references results (id) on delete cascade,
  fcm_token text not null,
  created_at timestamptz not null default now()
);

alter table results enable row level security;
alter table comparisons enable row level security;
alter table events enable row level security;
alter table tests enable row level security;
alter table profiles enable row level security;
alter table push_tokens enable row level security;
-- Politika yok: yalnızca service-role key (backend) erişebilir.
