import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Reveal } from "../components/Reveal";
import { toTurkishUpper } from "../lib/text";

const FACTS = [
  {
    tag: "Hesap",
    title: "Üyelik yok.",
    body: "Kayıt olmazsın. Tarayıcında rastgele üretilmiş bir oturum kimliği tutulur; adına, e-postana bağlı değildir.",
  },
  {
    tag: "İzleme",
    title: "Çerez yok.",
    body: "Üçüncü taraf analiz aracı, IP kaydı veya cihaz parmak izi kullanmıyoruz. Tek iz: localStorage'daki oturum kimliği.",
  },
  {
    tag: "Puanlama",
    title: "Yapay zekâ skor hesaplamaz.",
    body: "Sonucun sabit, tekrarlanabilir kurallarla üretilir. Yanıtların bir modele gönderilmez.",
  },
  {
    tag: "Silme",
    title: "Silme senin elinde.",
    body: "Tarayıcı verini temizlemen yeter. Sunucudaki kaydın için elindeki sonuç bağlantısıyla bize yaz.",
  },
];

export function PrivacyPage() {
  return (
    <main className="wrap privacy-page">
      <Header />

      <Reveal className="page-head">
        <span className="eyebrow">{toTurkishUpper("Gizlilik & KVKK")}</span>
        <h1>Ne biliyoruz, ne bilmiyoruz.</h1>
        <p className="lead">
          İlişki, aile ve iş dinamiklerine dair yanıtların hassas bir alana
          değiyor. Ne topladığımızı, ne yapmadığımızı ve haklarını burada
          açık açık yazıyoruz. Hukuk dili değil, gerçek davranış.
        </p>
        <span className="page-meta">
          Son güncelleme · 30 Ağustos 2026 · Veri sorumlusu ·{" "}
          <a href="mailto:emirkaansaricam@gmail.com">emirkaansaricam@gmail.com</a>
        </span>
      </Reveal>

      <Reveal group className="fact-grid">
        {FACTS.map((f) => (
          <div className="dim-card" key={f.tag}>
            <span className="dim-tag">{toTurkishUpper(f.tag)}</span>
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </div>
        ))}
      </Reveal>

      <Reveal className="privacy-section">
        <h2>Ne topluyoruz</h2>
        <ul>
          <li>
            <strong>Test yanıtların.</strong> Verdiğin cevaplar ve bunlardan
            hesaplanan skorlar.
          </li>
          <li>
            <strong>Oturum kimliğin.</strong> <code>session_id</code>, aynı
            tarayıcıdan gelen sonuçları ve zaman içindeki değişimi birbirine
            bağlamak için tutulur.
          </li>
          <li>
            <strong>Kullanım olayları.</strong> Hangi test başladı, hangi
            soruda bırakıldı, davet bağlantısı kullanıldı mı. Kendi
            sunucumuza yazılır, üçüncü tarafa gitmez.
          </li>
          <li>
            <strong>Hata raporları.</strong> Uygulama hata verirse teknik
            detay Sentry'ye gider. Kişisel veri gönderimi kapalı, oturum
            kaydı tutulmaz.
          </li>
        </ul>
      </Reveal>

      <Reveal className="privacy-section">
        <h2>Nerede saklanır</h2>
        <p>
          Veriler barındırma sağlayıcımız Supabase'de tutulur. Şu an otomatik
          bir silme süresi yok. Sen ya da biz talep edip sildirene kadar
          kayıt kalır. Kıyaslama özelliğini kullanırsan, davet bağlantısını
          paylaştığın kişi yanıtlarını boyut boyut karşılaştırmalı görür.
        </p>
      </Reveal>

      <Reveal className="disclaimer">
        <span className="eyebrow">{toTurkishUpper("Hassas veri uyarısı")}</span>
        <p>
          İlişki ve aile dinamiklerine dair yanıtların dolaylı olarak hassas
          konulara değinebilir. <em>Vermek tamamen gönüllü.</em> Hiçbir
          soruyu yanıtlamak zorunda değilsin, testi yarıda bırakabilirsin.
        </p>
      </Reveal>

      <Reveal className="privacy-section">
        <h2>Hakların neler</h2>
        <ul>
          <li>
            <strong>Öğrenme.</strong> Verinin işlenip işlenmediğini bize
            sorabilirsin.
          </li>
          <li>
            <strong>Bilgi isteme.</strong> İşlenmişse, ne amaçla işlendiğini
            öğrenebilirsin.
          </li>
          <li>
            <strong>Düzeltme.</strong> Eksik ya da yanlış işlenmişse
            düzeltilmesini isteyebilirsin.
          </li>
          <li>
            <strong>Silme.</strong> İşlenme sebebi ortadan kalktıysa
            silinmesini isteyebilirsin.
          </li>
        </ul>
        <p>
          Bu haklar, 6698 sayılı Kişisel Verilerin Korunması Kanunu'nun 11.
          maddesinden geliyor. Oturum kimliğin hesapsız yapı gereği bize
          kayıtlı değil. Tarayıcı verini temizlemen sunucudaki bağı zaten
          koparır. Sunucu tarafındaki kaydın da silinmesini istiyorsan,
          elindeki sonuç ya da davet bağlantısıyla aşağıdan bize ulaş.
        </p>
      </Reveal>

      <Reveal className="disclaimer">
        <span className="eyebrow">{toTurkishUpper("Teşhis değil")}</span>
        <p>
          StruvaMap sosyolojik bir haritalama aracı. Psikometrik doğrulama
          (Cronbach's alpha, faktör analizi, pilot çalışma) yapılmadı. Klinik
          teşhis, terapi ya da profesyonel danışmanlık yerine geçmez.
        </p>
      </Reveal>

      <Reveal className="privacy-contact">
        <p>Verinle ilgili bir talebin mi var, yoksa bir şey mi anlamadın?</p>
        <a href="mailto:emirkaansaricam@gmail.com" className="btn secondary">
          Bize yaz
        </a>
      </Reveal>

      <Footer />
    </main>
  );
}
