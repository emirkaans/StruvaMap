import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { TestDefinition } from "@struva/shared";
import { fetchTests } from "../lib/api";
import { BRAND, PLAY_STORE_URL } from "../lib/config";

export function LandingPage() {
  const [tests, setTests] = useState<TestDefinition[] | null>(null);

  useEffect(() => {
    fetchTests().then(setTests).catch(() => setTests([]));
  }, []);

  return (
    <div className="wrap">
      <header className="site">
        <Link to="/" className="logo">
          Struva<span>Map</span>
        </Link>
      </header>

      <main>
        <h1>İlişkiniz sadece sevgiden ibaret değil.</h1>
        <p className="muted" style={{ fontSize: "1.1rem" }}>
          Aynı zamanda emek, para, zaman, karar ve güç dengesinden oluşur. {BRAND} bu görünmeyen
          yapıyı haritalar.
        </p>

        {(tests ?? []).map((test) => (
          <div className="card" style={{ marginTop: 24 }} key={test.id}>
            <h3>{test.name}</h3>
            <p className="muted small">
              {test.subtitle} · Ücretsiz
            </p>
            <Link to={`/test/${test.id}`} className="btn">
              Ücretsiz Teste Başla
            </Link>
          </div>
        ))}
        {tests?.length === 0 && <p className="muted">Şu anda kullanılabilir test yok.</p>}

        <div className="note" style={{ margin: "20px 0" }}>
          <strong>Önemli:</strong> Bu skor "ilişkiniz %X sağlıklı" anlamına gelmez. İncelenen
          sosyal-yapısal alanlardaki <em>denge ve uyum düzeyini</em> gösterir. Test bir teşhis aracı
          değildir; tanımlayıcı bir sosyolojik haritadır.
        </div>

        <h2>Ne ölçüyoruz?</h2>
        <div className="card">
          <p><strong>Güç</strong> — Kararların nasıl ve kimin lehine alındığı.</p>
          <p><strong>Emek</strong> — Ev işi, zihinsel yük ve dijital koordinasyon emeğinin dağılımı.</p>
          <p style={{ marginBottom: 0 }}><strong>Özerklik</strong> — Bireysel sosyal alan ve aile sınırları.</p>
        </div>

        <div className="card premium">
          <h2>Daha derin analiz mi istiyorsunuz?</h2>
          <p>
            Ekonomik güç, duygusal emek, yaşam tarzı uyumu, çift karşılaştırması ve "istenen yapı vs
            mevcut yapı" analizi gibi premium testler mobil uygulamamızda.
          </p>
          <a href={PLAY_STORE_URL} className="btn" target="_blank" rel="noopener">
            Google Play'den İndir
          </a>
        </div>

        <p className="small muted" style={{ marginTop: 24 }}>
          Cevaplarınız puanlama için sunucuya gönderilir; hesap oluşturulmaz, kimlik bilgisi
          toplanmaz.
        </p>
      </main>
    </div>
  );
}
