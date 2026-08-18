# StruvaMap

İlişkilerin görünmeyen sosyal-yapısal dengesini ölçen çoklu test platformu.
Deterministik puanlama (`packages/shared`), React arayüz, NestJS + Supabase backend.

## Yapı

```
struva/
  apps/
    web/       React + Vite + TypeScript + Tailwind (frontend)
    api/       NestJS + TypeScript (backend)
  packages/
    shared/    Test-agnostik tipler + deterministik puanlama motoru + test tanımları
  supabase/
    schema.sql Beklenen tablo şeması (results, comparisons)
```

`packages/shared`, hem `apps/web` hem `apps/api` tarafından `workspace:*` bağımlılığı
olarak kullanılır. Puanlama mantığı yalnızca burada yaşar; UI ve backend onu import eder.

Yeni test türü eklemek (iş, aile, arkadaşlık ilişkileri):
1. `packages/shared/src/tests/` altına yeni bir `TestDefinition` dosyası ekle (örnek: `romantic.ts`).
2. `packages/shared/src/tests/index.ts` içindeki `TEST_REGISTRY`'e ekle.
3. Başka hiçbir yerde kod değişikliği gerekmez — API ve web otomatik olarak listeler/sunar.

## Kurulum

```bash
pnpm install                 # kökten, tüm workspace'i kurar; shared'i otomatik derler
cp apps/api/.env.example apps/api/.env   # SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY doldurulmalı
```

## Geliştirme

```bash
pnpm dev:web    # http://localhost:5173
pnpm dev:api    # http://localhost:3000
```

## Durum

- ✅ Monorepo iskeleti, `shared` puanlama motoru MVP'den TS'e taşındı (romantik test).
- ✅ `apps/api`: tests / results / comparisons endpoint'leri, Supabase'e bağlı ve doğrulandı (gerçek yazma/okuma testi yapıldı).
- ✅ `apps/web`: quiz akışı (`TestPage`, roving-tabindex klavye navigasyonu, shuffle) ve sonuç sayfası (`ResultPage` — RSI gauge, endeks halkaları, radar, bar'lar, güçlü/gerilim listeleri, sosyolojik yorum) MVP'den React'e taşındı; uçtan uca tarayıcıda test edildi (30 soru → sonuç sayfası).
- ✅ Yazdır (`window.print()`) ve bağlantı kopyalama (artık gerçek `resultId` URL'i — hash-encode gerekmiyor) çalışıyor.
- ✅ Trend grafiği: `GET /results?sessionId=&testId=` ile geçmiş sonuçlar çekilir, sonuç sayfasında 2+ kayıt varsa "Zamanla Değişim" çizgi grafiği gösterilir. Uçtan uca doğrulandı.
- ✅ Kıyaslama (partner): sonuç sayfasındaki "Partnerini davet et" bağlantısı `?compareWith=resultId` taşır; davet edilen testi bitirince otomatik `POST /comparisons` çağrılır ve `/comparisons/:id` sayfasına yönlendirilir — RSI + boyut bazında yan yana kıyaslama, algı farkı ≥20 puan rozetlenir. Uçtan uca doğrulandı.
- ✅ PNG olarak sonuç indirme: "Sonucu görsel indir" butonu, MVP'deki kütüphanesiz SVG→canvas→PNG mantığının birebir taşınmış hali (`struvamap-sonuc.png`).
- ⏳ İş / aile / arkadaşlık test tanımları henüz eklenmedi.
- ⏳ Auth yok (bilinçli — web anonim session, mobil ileride gerçek auth).
