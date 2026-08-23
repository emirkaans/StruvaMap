# StruvaMap

🔗 **Canlı:** [struvamap.netlify.app](https://struvamap.netlify.app)

İlişkiler yalnızca sevgiden ibaret değildir, aynı zamanda emek, karar, güç ve
özerklik dengesinden oluşur. StruvaMap, bu görünmeyen yapıyı kısa bir testle
haritalayan ve deterministik puanlama kullanan bir çoklu ilişki testi
platformudur.

AI hiçbir zaman skor hesaplamaz. Puanlama tamamen `packages/shared` içindeki
kurallara dayanır; sonuç her zaman tekrarlanabilir ve açıklanabilir.

## Özellikler

- **Dört ilişki testi**: Romantik İlişki, Arkadaşlık, İş İlişkisi ve
  Ebeveyn-Çocuk İlişkisi testleri yayında. Her test 6 boyut, ~30 soru, 3
  üst-endekste gruplanır (ör. romantik testte Güç / Emek / Özerklik).
- **Deterministik puanlama**: boyut, endeks ve RSI (İlişki Yapısı Skoru)
  sabit kurallarla hesaplanır; her boyut için "güçlü" / "gerilim" eşiği ve
  sosyolojik yorum metni test tanımının kendi içinde tutulur. Eşik değerleri
  (55/75) ve eşit ağırlıklandırma (boyut→endeks, endeks→RSI) ampirik
  araştırmaya değil tasarım kararına dayanır. Gerçek psikometrik doğrulama
  (Cronbach's alpha, faktör analizi, pilot çalışma) yapılmamıştır; bu klinik
  ya da tanısal bir araç değildir.
- **Bağlama duyarlı yorum**: iş ve aile testlerinde cevaplayanın rolü
  (yönetici/çalışan, ebeveyn/çocuk) ve gerekiyorsa yaş bağlamı sorulur; bazı
  sorular da bu role göre yeniden yazılır. Yapısal olarak meşru asimetriler
  (hiyerarşi, yaşa bağlı karar payı) otomatik olarak "sorun" sayılmaz.
- **Denge ile memnuniyet ayrımı**: emek dağılımı dengesiz olsa da taraflar bu
  dağılımdan memnunsa bu ayrıca gösterilir; memnuniyet sinyali ana skora
  karışmaz.
- **Anlık görselleştirme**: RSI göstergesi, endeks halkaları, boyut radar
  grafiği ve barlar; hepsi kütüphane kullanılmadan, elle yazılmış SVG.
- **Kıyaslama**: sonucunu bir davet bağlantısıyla paylaş; karşı taraf testi
  bitirince ikinizin cevapları yan yana, boyut boyut ve algı farkı
  yorumlarıyla karşılaştırılır.
- **Zamanla değişim**: aynı testi tekrar çözdükçe RSI'nin nasıl değiştiğini
  gösteren çizgi grafik.
- **Paylaşım**: sonucu PDF olarak yazdır, PNG görsel olarak indir veya
  bağlantıyı kopyala.
- **Kimliksiz**: hesap yok; anonim `session_id` ile çalışır.

## Testler

Yeni bir ilişki türü eklemek yalnızca bir veri tanımı eklemektir, kod
değişikliği gerekmez:

1. `packages/shared/src/tests/` altına yeni bir `TestDefinition` dosyası ekle
   (örnek: `romantic.ts`, `friendship.ts`).
2. `packages/shared/src/tests/index.ts` içindeki `TEST_REGISTRY`'e ekle.
3. `apps/web/src/pages/LandingPage.tsx` içindeki `HERO_CONTENT` kaydına anasayfa
   başlığı, açıklaması ve görseli için bir giriş ekle.

API ve web tarafı, testleri otomatik olarak listeler ve sunar; başka hiçbir
yerde kod değişikliği gerekmez.

**Önemli — kod ile canlı içerik farklı kaynaklar:** `packages/shared/src/tests/*.ts`
dosyaları yalnızca **ilk kurulum (seed)** kaynağıdır (bkz. `scripts/generate-test-seed.mjs`,
`supabase/seed-tests.sql`). Bir test bir kez seed edildikten sonra gerçek/canlı
içerik `/admin/tests` panelinden düzenlenir ve yalnızca Supabase `tests`
tablosunda tutulur — bu `.ts` dosyalarını sonradan düzenlemek DB'yi
**güncellemez**. Yeni bir test eklerken yukarıdaki adımlar geçerli; var olan
bir testin sorularını/metnini değiştirmek için admin paneli kullan.

## Tasarım dili

Koyu tema, Archivo (başlık) + Source Sans 3 (gövde) + IBM Plex Mono (veri/skor)
tipografi sistemi, her ilişki türü için kendine özgü mavi-duotone heykel
görseli. Fontlar Google Fonts'tan indirilip doğrudan projeye gömülmüştür (CDN
bağımlılığı yok).

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
bağımlılığı olarak kullanılır. Puanlama mantığının tek kaynağı burasıdır; hem
arayüz hem backend bu paketten beslenir.

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

- ✅ Dört testin hepsi (Romantik, Arkadaşlık, İş, Aile) uçtan uca (test →
  sonuç → kıyaslama) çalışır durumda, prod'da yayında.
- ✅ Anasayfa: ilişki türü seçici, gerçek test verisinden kurulu istatistik ve
  metodoloji bölümleri.
- ✅ Bağlama duyarlı yorum ve denge/memnuniyet ayrımı (iş ve aile testleri).
- ⏳ Auth yok (bilinçli: web anonim session, mobil ileride gerçek auth).
