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
  -- Web'in anonim kayıtlarında hep null; mobilde hesap silinince de null'a
  -- döner (bkz. auth.controller.ts deleteAccount) — sonuç kişisel veri
  -- taşımadan (session_id zaten rastgele bir cihaz kimliği) korunur.
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
  -- E-posta doğrulaması yok; şifremi unuttum akışı bunun yerine opsiyonel bu
  -- soru/cevaba dayanıyor (cevap hash'li, bkz. auth/security-answer.util.ts).
  security_question text,
  security_answer_hash text,
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

-- Kalıcı eş/partner eşleştirmesi. comparisons'tan farkı: tek seferlik değil,
-- iki auth.users kaydını sürekli birbirine bağlar. Mobil-only (auth şart),
-- bu yüzden result_id değil doğrudan user_id kullanılıyor.
create table if not exists pulse_pairs (
  id uuid primary key default gen_random_uuid(),
  test_id text not null,
  user_id_a uuid not null references auth.users (id) on delete cascade,
  user_id_b uuid references auth.users (id) on delete cascade,
  invite_code text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create unique index if not exists pulse_pairs_invite_code_idx on pulse_pairs (invite_code);
create index if not exists pulse_pairs_user_a_idx on pulse_pairs (user_id_a);
create index if not exists pulse_pairs_user_b_idx on pulse_pairs (user_id_b);

-- Bir çift için günde tek satır: o günün sorusu + iki tarafın cevabı.
-- Ayrı bir "answers" tablosu yerine tek satırda a/b kolonları — çift zaten
-- yalnızca iki kişi, join gerekmiyor.
create table if not exists pulse_checkins (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null references pulse_pairs (id) on delete cascade,
  checkin_date date not null,
  question_key text not null,
  answer_a smallint,
  answer_b smallint,
  answered_a_at timestamptz,
  answered_b_at timestamptz,
  morning_push_sent_at timestamptz,
  evening_notified_a_at timestamptz,
  evening_notified_b_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists pulse_checkins_pair_date_idx on pulse_checkins (pair_id, checkin_date);
create index if not exists pulse_checkins_date_idx on pulse_checkins (checkin_date);

-- Kalıcı, kullanıcı bazlı push token deposu. push_tokens (result_id bazlı,
-- tek kullanımlık) tablosu bozulmuyor, bu ayrı bir sorumluluk.
create table if not exists user_push_tokens (
  user_id uuid primary key references auth.users (id) on delete cascade,
  fcm_token text not null,
  updated_at timestamptz not null default now()
);

-- Web'de çözülen bir sonucu mobil app'e (formsuz, anonim ya da gerçek
-- kimliğe) taşımak için kısa ömürlü, tek kullanımlık kod. session_id'nin
-- kendisi değil, ayrı üretilmiş rastgele bir token — session_id zaten
-- localStorage'da taşınabilir bir değer, claim gibi tek seferlik bir yetki
-- için ayrı bir sır olması gerekiyor.
create table if not exists claim_tokens (
  token text primary key,
  result_id uuid not null references results (id) on delete cascade,
  expires_at timestamptz not null,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists claim_tokens_result_id_idx on claim_tokens (result_id);

-- Tahmin modu: davet eden kişi, karşı taraf testi bitirmeden önce onun her
-- boyuttaki skorunu tahmin eder (bkz. packages/shared/src/prediction.ts).
-- Sonuç başına tek tahmin; kıyaslama oluşunca API artık değiştirmeye izin
-- vermez (bkz. apps/api/src/predictions/predictions.service.ts).
create table if not exists predictions (
  result_id uuid primary key references results (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  dimensions jsonb not null, -- { [boyutId]: 0-100 }
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Kişisel ilişki haritası: kullanıcının adlandırdığı ilişkiler ("Ayşe",
-- "Yöneticim"). Her ilişki tek test türüne bağlı; sonuçlar isteğe bağlı
-- olarak bir ilişkiye bağlanır (web anonim akışı etkilenmez, alan boş kalır).
create table if not exists relationships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  test_id text not null,
  label text not null,
  created_at timestamptz not null default now()
);

create index if not exists relationships_user_idx on relationships (user_id);

alter table results add column if not exists relationship_id uuid references relationships (id) on delete set null;

-- İlişkiye bağlı nabız eşleşmesi: ilişki detayında nabız ve emek defteri
-- özetleri test sonuçlarının yanında gösterilir. Her kullanıcı kendi
-- ilişkisini bağlar (eşleşme iki kişi arasında ortak, ilişki kişiye özel).
alter table relationships add column if not exists pulse_pair_id uuid references pulse_pairs (id) on delete set null;

-- Arşivlenen (artık aktif olmayan) ilişkiler Harita'da ve örüntülerde
-- gösterilmez; geçmişleri ve notları korunur.
alter table relationships add column if not exists archived_at timestamptz;

-- İlişkiye dair, yalnızca sahibinin gördüğü kısa notlar (ilişki detayı).
create table if not exists relationship_notes (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references relationships (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists relationship_notes_rel_idx on relationship_notes (relationship_id, created_at);

-- Emek defteri: nabız eşleşmesindeki iki kişinin günlük iş kayıtları
-- (bkz. packages/shared/src/labour.ts LABOUR_CATEGORIES).
create table if not exists labour_entries (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null references pulse_pairs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null,
  entry_date date not null,
  created_at timestamptz not null default now()
);

create index if not exists labour_entries_pair_date_idx on labour_entries (pair_id, entry_date);

alter table results enable row level security;
alter table comparisons enable row level security;
alter table events enable row level security;
alter table tests enable row level security;
alter table profiles enable row level security;
alter table push_tokens enable row level security;
alter table pulse_pairs enable row level security;
alter table pulse_checkins enable row level security;
alter table user_push_tokens enable row level security;
alter table claim_tokens enable row level security;
alter table predictions enable row level security;
alter table relationships enable row level security;
alter table labour_entries enable row level security;
alter table relationship_notes enable row level security;
-- Politika yok: yalnızca service-role key (backend) erişebilir.
