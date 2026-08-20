import { PLAY_STORE_URL } from "../lib/config";
import { toTurkishUpper } from "../lib/text";
import { Reveal } from "./Reveal";

function GooglePlayGlyph() {
  return (
    <svg
      className="play-glyph"
      viewBox="30 336.7 120.9 129.2"
      role="img"
      aria-hidden="true"
    >
      <path fill="#ffd400" d="M119.2,421.2c15.3-8.4,27-14.8,28-15.3c3.2-1.7,6.5-6.2,0-9.7c-2.1-1.1-13.4-7.3-28-15.3l-20.1,20.2L119.2,421.2z" />
      <path fill="#ff3333" d="M99.1,401.1l-64.2,64.7c1.5,0.2,3.2-0.2,5.2-1.3c4.2-2.3,48.8-26.7,79.1-43.3L99.1,401.1L99.1,401.1z" />
      <path fill="#48ff48" d="M99.1,401.1l20.1-20.2c0,0-74.6-40.7-79.1-43.1c-1.7-1-3.6-1.3-5.3-1L99.1,401.1z" />
      <path fill="#3bccff" d="M99.1,401.1l-64.3-64.3c-2.6,0.6-4.8,2.9-4.8,7.6c0,7.5,0,107.5,0,113.8c0,4.3,1.7,7.4,4.9,7.7L99.1,401.1z" />
    </svg>
  );
}

function AppCtaButton() {
  return (
    <a href={PLAY_STORE_URL} className="btn app-cta-btn" target="_blank" rel="noopener">
      <GooglePlayGlyph />
      Google Play&apos;den İndir
    </a>
  );
}

export function AppCta({ variant }: { variant: "full" | "compact" }) {
  if (variant === "compact") {
    return (
      <Reveal className="app-cta app-cta-compact no-print">
        <div className="app-cta-phone-mini" aria-hidden="true">
          <span />
        </div>
        <div className="app-cta-compact-copy">
          <span className="eyebrow">{toTurkishUpper("Mobil uygulama")}</span>
          <h2>Bu yalnızca başlangıç.</h2>
          <p>
            Ekonomik güç, duygusal emek, yaşam tarzı uyumu ve &quot;istenen yapı vs mevcut yapı&quot; farkı
            gibi derin analizler mobil uygulamada.
          </p>
          <AppCtaButton />
        </div>
      </Reveal>
    );
  }

  return (
    <Reveal className="app-cta">
      <div className="app-cta-grid">
        <div className="app-cta-copy">
          <span className="eyebrow">{toTurkishUpper("Mobil uygulama")}</span>
          <h2>Web Yüzeyi Ölçer. Uygulama Derini.</h2>
          <ul className="app-cta-list">
            <li>Ekonomik güç &amp; duygusal emek</li>
            <li>Yaşam tarzı uyumu</li>
            <li>&quot;İstenen yapı vs mevcut yapı&quot; farkı</li>
          </ul>
          <AppCtaButton />
        </div>
        <div className="app-cta-stage" aria-hidden="true">
          <div className="app-cta-phone">
            <div className="app-cta-screen">
              <div className="app-cta-notch" />
              <div className="app-cta-donut">
                <span>72</span>
              </div>
              <div className="app-cta-bars">
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
              <span className="app-cta-caption">Boyut Radarı</span>
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
