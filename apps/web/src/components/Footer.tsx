import { Link } from "react-router-dom";
import { PLAY_STORE_URL } from "../lib/config";

const FOOTER_TESTS = [
  { id: "romantic", label: "Romantik İlişki" },
  { id: "friendship", label: "Arkadaşlık" },
  { id: "family", label: "Aile" },
  { id: "roommate", label: "Ev Arkadaşlığı" },
  { id: "work", label: "İş" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer no-print">
      <div className="site-footer-cols">
        <div className="site-footer-brand">
          <Link to="/" className="logo-lg">
            Struva<span>Map</span>
          </Link>
          <p>
            İlişkiler yalnızca sevgiden ibaret değil; emek, karar, güç ve özerklik
            dengesinden oluşur. Cevaplarınız puanlama için sunucuya gönderilir; hesap
            oluşturulmaz, kimlik bilgisi toplanmaz.
          </p>
        </div>

        <div className="site-footer-col">
          <span className="site-footer-label">Testler</span>
          {FOOTER_TESTS.map((t) => (
            <Link key={t.id} to={`/test/${t.id}`}>
              {t.label}
            </Link>
          ))}
        </div>

        <div className="site-footer-col">
          <span className="site-footer-label">Bağlantılar</span>
          <Link to="/#ne-olcuyoruz">Nasıl Çalışır</Link>
          <Link to="/gizlilik">Gizlilik Politikası</Link>
          <a href={PLAY_STORE_URL} target="_blank" rel="noopener">
            Mobil Uygulama
          </a>
        </div>
      </div>

      <div className="site-footer-bottom">
        <span>© {year} StruvaMap</span>
        <span>Teşhis değil, sosyolojik harita.</span>
      </div>
    </footer>
  );
}
