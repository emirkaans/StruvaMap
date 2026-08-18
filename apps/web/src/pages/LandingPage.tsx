import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { TestDefinition } from "@struva/shared";
import { fetchTests } from "../lib/api";
import { PLAY_STORE_URL } from "../lib/config";
import heykelRomantic from "../assets/heykel.png";
import heykelFriendship from "../assets/heykel-arkadaslik.png";

interface HeroContent {
  pillLabel: string;
  headline: string[];
  lead: string;
  image: string;
  dimNote: string;
  indexNote: string;
}

// Test kaydına eklenen her yeni ilişki türü için burada bir giriş gerekir;
// girişi olmayan testler hero'da değil, sadece backend listesinde görünür.
const HERO_CONTENT: Record<string, HeroContent> = {
  romantic: {
    pillLabel: "Romantik İlişki",
    headline: ["Görünmeyen Yapı.", "Ölçülebilir Denge.", "Konuşulabilir Gerçek."],
    lead: "İlişkiniz sadece sevgiden ibaret değil. Aynı zamanda emek, para, zaman, karar ve güç dengesinden oluşur. StruvaMap bu görünmeyen yapıyı haritalar.",
    image: heykelRomantic,
    dimNote: "ilişkiyi oluşturan alanlar",
    indexNote: "güç, emek, özerklik",
  },
  friendship: {
    pillLabel: "Arkadaşlık",
    headline: ["Görünmeyen Emek.", "Ölçülebilir Karşılıklılık.", "Konuşulabilir Bağ."],
    lead: "Arkadaşlığınız sadece sohbetten ibaret değil. Aynı zamanda girişim, destek, dürüstlük ve özerklik dengesinden oluşur. StruvaMap bu görünmeyen yapıyı haritalar.",
    image: heykelFriendship,
    dimNote: "arkadaşlığı oluşturan alanlar",
    indexNote: "karşılıklılık, destek, güven",
  },
};

function parseMinutes(subtitle: string): string {
  const m = subtitle.match(/~?(\d+)\s*dakika/);
  return m ? m[1] : "?";
}

export function LandingPage() {
  const [tests, setTests] = useState<TestDefinition[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetchTests().then(setTests).catch(() => setTests([]));
  }, []);

  const heroTests = (tests ?? []).filter((t) => HERO_CONTENT[t.id]);
  const activeId = selectedId ?? heroTests[0]?.id ?? null;
  const activeIndex = heroTests.findIndex((t) => t.id === activeId);
  const activeTest = heroTests[activeIndex] ?? null;

  return (
    <div>
      <div className="hero-screen">
      <nav className="landing-nav">
        <Link to="/" className="logo-lg">
          Struva<span>Map</span>
        </Link>
        {activeTest && (
          <Link
            to={`/test/${activeTest.id}`}
            className="btn"
            style={{ borderRadius: 99, padding: "11px 20px", fontSize: ".86rem" }}
          >
            Ücretsiz Başla
          </Link>
        )}
      </nav>

      <div className="landing-wrap">
        {!tests && (
          <p className="muted" style={{ textAlign: "center", marginTop: 60 }}>
            Yükleniyor…
          </p>
        )}
        {tests && heroTests.length === 0 && (
          <p className="muted" style={{ textAlign: "center", marginTop: 60 }}>
            Şu anda kullanılabilir test yok.
          </p>
        )}

        {heroTests.length > 0 && (
          <>
            <div className="hero-picker">
              <div className="hero-picker-pills" role="group" aria-label="Hangi ilişkiyi haritalayalım?">
                {heroTests.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={t.id === activeId}
                    onClick={() => setSelectedId(t.id)}
                  >
                    {HERO_CONTENT[t.id].pillLabel}
                  </button>
                ))}
                <span className="soon">İş (yakında)</span>
                <span className="soon">Aile (yakında)</span>
              </div>
            </div>

            <div className="hero-stage">
              {heroTests.map((t, i) => {
                const content = HERO_CONTENT[t.id];
                const cls =
                  i === activeIndex
                    ? "hero-variant is-active"
                    : i < activeIndex
                      ? "hero-variant is-prev"
                      : "hero-variant is-next";
                const hidden = i !== activeIndex;
                return (
                  <div className={cls} key={t.id} aria-hidden={hidden} inert={hidden || undefined}>
                    <div className="hero-copy">
                      <h1>
                        {content.headline.map((line, li) => (
                          <span key={li}>
                            {line}
                            {li < content.headline.length - 1 && <br />}
                          </span>
                        ))}
                      </h1>
                      <p className="lead">{content.lead}</p>
                      <div className="hero-btn-row">
                        <Link to={`/test/${t.id}`} className="btn">
                          Ücretsiz Teste Başla →
                        </Link>
                        <a href="#ne-olcuyoruz" className="btn secondary">
                          Nasıl Çalışır
                        </a>
                      </div>
                    </div>
                    <div className="hero-visual">
                      <div className="hero-frame">
                        <img src={content.image} alt={`${content.pillLabel} testini simgeleyen heykel görseli`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      </div>

      <div className="wrap" style={{ paddingTop: 4 }}>
        {activeTest && (
          <div className="stats-row">
            <div className="stat">
              <b>{Object.keys(activeTest.dimensions).length}</b>
              <span>Boyut · {HERO_CONTENT[activeTest.id].dimNote}</span>
            </div>
            <div className="stat">
              <b>{Object.keys(activeTest.indices).length}</b>
              <span>Endeks · {HERO_CONTENT[activeTest.id].indexNote}</span>
            </div>
            <div className="stat">
              <b>~{parseMinutes(activeTest.subtitle)}dk</b>
              <span>Ortalama tamamlama süresi</span>
            </div>
          </div>
        )}

        <div className="disclaimer">
          <span className="eyebrow">Teşhis değil</span>
          <p>
            Bu skor <em>"%X sağlıklı"</em> anlamına gelmez. İncelenen sosyal-yapısal alanlardaki denge
            ve uyum düzeyini gösterir; tanımlayıcı bir sosyolojik haritadır.
          </p>
        </div>

        {activeTest && (
          <section className="dims-section" id="ne-olcuyoruz">
            <div className="section-head">
              <span className="eyebrow">Metodoloji</span>
              <h2>
                {Object.keys(activeTest.dimensions).length} boyutu, {Object.keys(activeTest.indices).length} endekste
                ölçüyoruz.
              </h2>
            </div>
            <div className="dims-grid">
              {Object.values(activeTest.dimensions).map((dim) => (
                <div className="dim-card" key={dim.id}>
                  <span className="dim-tag">{activeTest.indices[dim.index]?.name ?? dim.index}</span>
                  <h3>{dim.name}</h3>
                  <p>{dim.short}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="app-cta">
          <div className="copy">
            <span className="eyebrow">Mobil uygulama</span>
            <h2>Bu yalnızca başlangıç.</h2>
            <p>
              Ekonomik güç, duygusal emek, yaşam tarzı uyumu, çift karşılaştırması ve "istenen yapı vs
              mevcut yapı" analizi gibi derin testler mobil uygulamada.
            </p>
          </div>
          <a href={PLAY_STORE_URL} className="btn" target="_blank" rel="noopener">
            Google Play'den İndir
          </a>
        </div>

        <footer className="site-footer">
          <Link to="/" className="logo-lg">
            Struva<span>Map</span>
          </Link>
          <p>
            Cevaplarınız puanlama için sunucuya gönderilir; hesap oluşturulmaz, kimlik bilgisi
            toplanmaz.
          </p>
        </footer>
      </div>
    </div>
  );
}
