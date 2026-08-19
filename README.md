# StruvaMap

İlişkiler yalnızca sevgiden ibaret değildir — aynı zamanda emek, karar, güç ve
özerklik dengesinden oluşur. StruvaMap, bu görünmeyen yapıyı kısa bir testle
haritalayan, deterministik puanlama kullanan çoklu ilişki testi platformudur.

AI hiçbir zaman skor hesaplamaz. Puanlama tamamen `packages/shared` içindeki
kurallara dayanır; sonuç her zaman tekrarlanabilir ve açıklanabilir.

## Özellikler

- **Çoklu ilişki testi** — Romantik İlişki ve Arkadaşlık testleri yayında;
  İş ve Aile ilişkileri yol haritada. Her test 6 boyut × 5 soru, 3 üst-endekste
  gruplanır (ör. romantik testte Güç / Emek / Özerklik).
- **Deterministik puanlama** — boyut, endeks ve RSI (İlişki Yapısı Skoru)
  sabit kurallarla hesaplanır; her boyut için "güçlü" / "gerilim" eşiği ve
  sosyolojik yorum metni test tanımının kendi içinde tutulur. Eşik değerleri
  (55/75) ve eşit ağırlıklandırma (boyut→endeks, endeks→RSI) ampirik
  araştırmaya değil tasarım kararına dayanır — gerçek psikometrik doğrulama
  (Cronbach's alpha, faktör analizi, pilot çalışma) yapılmamıştır; bu klinik
  ya da tanısal bir araç değildir.
- **Anlık görselleştirme** — RSI göstergesi, endeks halkaları, boyut radar
  grafiği ve barlar; hepsi kütüphanesiz, elle yazılmış SVG.
- **Kıyaslama** — sonucunu bir davet bağlantısıyla paylaş; karşı taraf testi
  bitirince ikinizin cevapları yan yana, boyut boyut ve algı farkı
  yorumlarıyla karşılaştırılır.
- **Zaman içinde trend** — aynı testi tekrar çözdükçe RSI'nin nasıl değiştiğini
  gösteren çizgi grafik.
- **Paylaşım** — sonucu PDF olarak yazdır, PNG görsel olarak indir veya
  bağlantıyı kopyala.
- **Kimliksiz** — hesap yok; anonim `session_id` ile çalışır.

## Testler

Yeni bir ilişki türü eklemek yalnızca bir veri tanımı eklemektir, kod
değişikliği gerekmez:

1. `packages/shared/src/tests/` altına yeni bir `TestDefinition` dosyası ekle
   (örnek: `romantic.ts`, `friendship.ts`).
2. `packages/shared/src/tests/index.ts` içindeki `TEST_REGISTRY`'e ekle.
3. `apps/web/src/pages/LandingPage.tsx` içindeki `HERO_CONTENT` kaydına anasayfa
   başlığı, açıklaması ve görseli için bir giriş ekle.

API ve web tarafı testleri otomatik listeler/sunar; başka hiçbir yerde kod
değişikliği gerekmez.

## Tasarım dili

Koyu tema, Archivo (başlık) + Source Sans 3 (gövde) + IBM Plex Mono (veri/skor)
tipografi sistemi, her ilişki türü için kendine özgü mavi-duotone heykel
görseli. Fontlar Google Fonts'tan self-host edilmiştir (CDN bağımlılığı yok).

## Teknoloji

```
apps/
  web/       React + Vite + TypeScript (frontend)
  api/       NestJS + TypeScript (backend)
packages/
  shared/    Test-agnostik tipler + deterministik puanlama motoru + test tanımları
supabase/
  schema.sql Beklenen tablo şeması (results, comparisons)
```

`packages/shared`, hem `apps/web` hem `apps/api` tarafından `workspace:*`
bağımlılığı olarak kullanılır. Puanlama mantığı yalnızca burada yaşar; UI ve
backend onu import eder.

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

## Yol haritası

- ✅ Romantik İlişki ve Arkadaşlık testleri, uçtan uca (test → sonuç →
  kıyaslama) çalışır durumda.
- ✅ Anasayfa: ilişki türü seçici, gerçek test verisinden kurulu istatistik ve
  metodoloji bölümleri.
- ⏳ İş ve Aile ilişkileri test tanımları.
- ⏳ Auth yok (bilinçli — web anonim session, mobil ileride gerçek auth).
