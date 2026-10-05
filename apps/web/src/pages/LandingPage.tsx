import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { TestDefinition } from "@struva/shared";
import { fetchResultsTotal, fetchTests } from "../lib/api";
import { track } from "../lib/analytics";
import { minutesFromSubtitle, toTurkishUpper } from "../lib/text";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { AppCta } from "../components/AppCta";
import { Reveal } from "../components/Reveal";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import heykelRomantic from "../assets/heykel-romantik.webp";
import heykelFriendship from "../assets/heykel-arkadaslik.webp";
import heykelWork from "../assets/heykel-is.webp";
import heykelFamily from "../assets/heykel-aile.webp";
import heykelRoommate from "../assets/heykel-ev-arkadasi.webp";

interface HeroContent {
  pillLabel: string;
  // Test verisi gelmeden de hero çizilebilsin diye davet metni burada da var.
  inviteCta: string;
  headline: string[];
  lead: string;
  image: string;
  dimNote: string;
  indexNote: string;
}

const HERO_CONTENT: Record<string, HeroContent> = {
  romantic: {
    pillLabel: "Romantik İlişki",
    inviteCta: "Partnerini davet et",
    headline: [
      "Görünmeyen Yapı.",
      "Ölçülebilir Denge.",
      "Konuşulabilir Gerçek.",
    ],
    lead: "İlişkiniz sadece sevgiden ibaret değil. Aynı zamanda emek, para, zaman, karar ve güç dengesinden oluşur. StruvaMap bu görünmeyen yapıyı haritalar.",
    image: heykelRomantic,
    dimNote: "ilişkiyi oluşturan alanlar",
    indexNote: "güç, emek, özerklik",
  },
  friendship: {
    pillLabel: "Arkadaşlık",
    inviteCta: "Arkadaşını davet et",
    headline: ["Dostlukta Hesap Tutulmaz.", "Ama Denge Hissedilir."],
    lead: "Arkadaşlığınızda sohbetin ötesinde bir katman vardır: girişim, destek, dürüstlük, özerklik... StruvaMap bunları birlikte görünür kılar.",
    image: heykelFriendship,
    dimNote: "arkadaşlığı oluşturan alanlar",
    indexNote: "karşılıklılık, destek, güven",
  },
  work: {
    pillLabel: "İş",
    inviteCta: "İş arkadaşını davet et",
    headline: ["Roller Yazılıdır.", "Emek Çoğu Zaman Yazılmaz."],
    lead: "Terfi baskısı, mikro yönetim, mesai dışı mesajlar... Yönetici-çalışan ilişkisi de karar payı, emek ve güvenle örülüdür. StruvaMap bu dinamiği ölçülebilir kılar.",
    image: heykelWork,
    dimNote: "iş ilişkisini oluşturan alanlar",
    indexNote: "güç, emek, özerklik",
  },
  family: {
    pillLabel: "Aile",
    inviteCta: "Aile üyeni davet et",
    headline: [
      "Aileyi sevgi birleştirir.",
      "Roller düzenler.",
      "İletişim besler.",
    ],
    lead: "StruvaMap, aile ilişkinizdeki karar payı, dinleme ve güven dengesini haritalar.",
    image: heykelFamily,
    dimNote: "aile ilişkisini oluşturan alanlar",
    indexNote: "güç, emek, özerklik",
  },
  roommate: {
    pillLabel: "Ev Arkadaşlığı",
    inviteCta: "Ev arkadaşını davet et",
    headline: ["Aynı Çatı.", "Paylaşılan Düzen.", "Görünmeyen Emek."],
    lead: "Aynı evi paylaşmak, kirayı bölüşmekten fazlasıdır. Ev işi, masraf, düzen ve mahremiyet birlikte bir yapı kurar. StruvaMap bu yapıyı görünür kılar.",
    image: heykelRoommate,
    dimNote: "ev arkadaşlığını oluşturan alanlar",
    indexNote: "emek, uyum, sınırlar",
  },
};

// İlk ziyarette test listesi gelmeden hero bu sırayla çizilir; sonraki
// ziyaretlerde en son görülen yayındaki liste kullanılır.
const DEFAULT_HERO_IDS = ["romantic", "friendship", "roommate"];
const HERO_IDS_KEY = "struva_hero_ids";

// Tamamlanan test sayısı bu eşiğin altındayken gösterilmez: küçük bir sayı
// güven vermek yerine tersini yapar.
const RESULTS_TOTAL_MIN = 250;

function initialHeroIds(): string[] {
  try {
    const stored = JSON.parse(localStorage.getItem(HERO_IDS_KEY) ?? "null") as unknown;
    if (Array.isArray(stored) && stored.length > 0 && stored.every((id) => typeof id === "string" && HERO_CONTENT[id])) {
      return stored as string[];
    }
  } catch {
    // bozuk ya da erişilemeyen depolama: varsayılana düş
  }
  return DEFAULT_HERO_IDS;
}

export function LandingPage() {
  const [tests, setTests] = useState<TestDefinition[] | null>(null);
  const [resultsTotal, setResultsTotal] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [heroVisible, setHeroVisible] = useState(true);
  const [otherImagesReady, setOtherImagesReady] = useState(false);
  const heroScreenRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  useDocumentTitle(null);

  useEffect(() => {
    track("landing_view");
  }, []);

  useEffect(() => {
    fetchTests()
      .then((list) => {
        setTests(list);
        try {
          localStorage.setItem(HERO_IDS_KEY, JSON.stringify(list.map((t) => t.id).filter((id) => HERO_CONTENT[id])));
        } catch {
          // depolama kapalıysa bir sonraki ziyarette varsayılan sıra kullanılır
        }
      })
      .catch(() => setTests([]));
  }, []);

  useEffect(() => {
    fetchResultsTotal()
      .then(setResultsTotal)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setOtherImagesReady(true), 150);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const el = heroScreenRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry.isIntersecting),
      { threshold: 0.6 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Hero sabit içerikten çizilir, API beklenmez. Test listesi gelince yalnızca
  // yayındaki testler kalır. Alttaki istatistik ve metodoloji test verisine bağlı.
  const [fallbackIds] = useState(initialHeroIds);
  const heroTests: { id: string }[] = tests
    ? tests.filter((t) => HERO_CONTENT[t.id])
    : fallbackIds.map((id) => ({ id }));
  const activeId = selectedId ?? heroTests[0]?.id ?? null;
  const activeIndex = heroTests.findIndex((t) => t.id === activeId);
  const activeTest = tests?.find((t) => t.id === activeId) ?? null;
  const heroIds = heroTests.map((t) => t.id).join(",");

  // Başka sayfadan "/#ne-olcuyoruz" ile gelindiğinde bölüm test verisiyle
  // birlikte çizildiği için tarayıcının kendi kaydırması boşa düşer.
  useEffect(() => {
    if (!location.hash || !activeTest) return;
    document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
  }, [location.hash, activeTest]);

  const touchStartX = useRef<number | null>(null);
  const SWIPE_THRESHOLD = 40;

  function handleHeroTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function stepHero(dir: 1 | -1) {
    if (heroTests.length < 2) return;
    const idx = activeIndex === -1 ? 0 : activeIndex;
    const nextIdx = (idx + dir + heroTests.length) % heroTests.length;
    setSelectedId(heroTests[nextIdx].id);
  }

  function handleHeroTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null || heroTests.length < 2) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    stepHero(dx < 0 ? 1 : -1);
  }

  useEffect(() => {
    if (heroTests.length < 2 || !heroVisible) return;
    const id = setInterval(() => {
      setSelectedId((prev) => {
        const currentId = prev ?? heroTests[0].id;
        const idx = heroTests.findIndex((t) => t.id === currentId);
        return heroTests[(idx + 1) % heroTests.length].id;
      });
    }, 10000);
    return () => clearInterval(id);
  }, [heroIds, activeId, heroVisible]);

  useEffect(() => {
    if (heroTests.length < 2) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight") stepHero(1);
      else if (e.key === "ArrowLeft") stepHero(-1);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [heroIds, activeId]);

  return (
    <div>
      <div className="hero-screen" ref={heroScreenRef}>
        <Header
          cta={
            activeId && (
              <Link
                to={`/test/${activeId}`}
                className="btn"
                style={{
                  borderRadius: 99,
                  padding: "11px 20px",
                  fontSize: ".86rem",
                }}
              >
                Ücretsiz Başla
              </Link>
            )
          }
        />

        <div className="landing-wrap">
          {tests && heroTests.length === 0 && (
            <p className="muted" style={{ textAlign: "center", marginTop: 60 }}>
              Şu anda kullanılabilir test yok.
            </p>
          )}

          {heroTests.length > 0 && (
            <>
              <div className="hero-picker">
                <div
                  className="hero-picker-pills"
                  role="group"
                  aria-label="Hangi ilişkiyi haritalayalım?"
                >
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
                </div>
              </div>

              <div
                className="hero-stage"
                onTouchStart={handleHeroTouchStart}
                onTouchEnd={handleHeroTouchEnd}
              >
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
                    <div
                      className={cls}
                      key={t.id}
                      aria-hidden={hidden}
                      inert={hidden || undefined}
                    >
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
                        <p className="hero-invite-note">
                          {content.inviteCta}. Testi bitirince sonuçlarınız yan
                          yana kıyaslanır.
                        </p>
                      </div>
                      <div className="hero-visual">
                        <div className="hero-frame">
                          {(i === activeIndex || otherImagesReady) && (
                            <img
                              src={content.image}
                              alt={`${content.pillLabel} testini simgeleyen heykel görseli`}
                            />
                          )}
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
          <Reveal group className="stats-row">
            <div className="stat">
              <b>{Object.keys(activeTest.dimensions).length}</b>
              <span>Boyut · {HERO_CONTENT[activeTest.id].dimNote}</span>
            </div>
            <div className="stat">
              <b>{Object.keys(activeTest.indices).length}</b>
              <span>Endeks · {HERO_CONTENT[activeTest.id].indexNote}</span>
            </div>
            <div className="stat">
              <b>~{minutesFromSubtitle(activeTest.subtitle)}dk</b>
              <span>Ortalama tamamlama süresi</span>
            </div>
            {resultsTotal != null && resultsTotal >= RESULTS_TOTAL_MIN && (
              <div className="stat">
                <b>{resultsTotal.toLocaleString("tr-TR")}</b>
                <span>Bugüne kadar haritalanan ilişki</span>
              </div>
            )}
          </Reveal>
        )}

        <Reveal className="disclaimer">
          <span className="eyebrow">{toTurkishUpper("Teşhis değil")}</span>
          <p>
            Bu skor <em>"%X sağlıklı"</em> anlamına gelmez. İncelenen
            sosyal-yapısal alanlardaki denge ve uyum düzeyini gösterir;
            tanımlayıcı bir sosyolojik haritadır.
          </p>
        </Reveal>

        {activeTest && (
          <section className="dims-section" id="ne-olcuyoruz">
            <Reveal className="section-head">
              <span className="eyebrow">{toTurkishUpper("Metodoloji")}</span>
              <h2>
                {Object.keys(activeTest.dimensions).length} boyutu,{" "}
                {Object.keys(activeTest.indices).length} endekste ölçüyoruz.
              </h2>
            </Reveal>
            <Reveal group className="dims-grid">
              {Object.values(activeTest.dimensions).map((dim) => (
                <div className="dim-card" key={dim.id}>
                  <span className="dim-tag">
                    {activeTest.indices[dim.index]?.name ?? dim.index}
                  </span>
                  <h3>{dim.name}</h3>
                  <p>{dim.short}</p>
                </div>
              ))}
            </Reveal>
            <p className="dims-more">
              <Link to="/yontem">Yöntemin tamamı ve sık sorulanlar →</Link>
            </p>
          </section>
        )}

        <AppCta variant="full" />

        <Footer />
      </div>
    </div>
  );
}
