import { useState } from "react";
import { Link } from "react-router-dom";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Reveal } from "../components/Reveal";
import { toTurkishUpper } from "../lib/text";

const LAYERS = [
  {
    tag: "Emek",
    title: "Kim neyi taşıyor?",
    body: "Ev işi gibi görünen emeğin yanında planlama, hatırlama ve ekran başında yapılan koordinasyon gibi görünmeyen emek.",
  },
  {
    tag: "Güç",
    title: "Kararı kim veriyor?",
    body: "Ortak kararların nasıl alındığı, kimin sesinin daha çok duyulduğu, son sözün kimde kaldığı.",
  },
  {
    tag: "Özerklik",
    title: "Kendine ne kadar alan var?",
    body: "Bireysel sosyal alanın korunması, ailelerin ve dış çevrenin ilişkiye ne kadar girdiği.",
  },
];

const FAQ = [
  {
    q: "Bu bir kişilik ya da uyum testi mi?",
    a: "Hayır. Kimin nasıl biri olduğunu ya da ilişkinin ne kadar \"iyi\" olduğunu ölçmez. İlişkinin içindeki emek, karar ve alan dağılımını, yani yapısını haritalar.",
  },
  {
    q: "Skorum neden \"sağlıklı\" ya da \"sağlıksız\" demiyor?",
    a: "Çünkü teşhis değil. Düşük bir skor bir alanda dengesizlik algıladığını gösterir; ilişkin hakkında bir hüküm değil, konuşmaya değer bir başlangıç noktasıdır.",
  },
  {
    q: "Hesap açmam gerekiyor mu?",
    a: "Webde hayır. Adın ya da e-postan istenmez; sonuçların tarayıcında tutulan rastgele bir oturum kimliğine bağlanır.",
  },
  {
    q: "Partnerim sonucumu görebilir mi?",
    a: "Yalnızca sen bağlantıyı paylaşırsan. Davet bağlantısıyla testi çözen kişi, ikinizin cevaplarını boyut boyut yan yana görür.",
  },
  {
    q: "Yarıda bırakırsam ne olur?",
    a: "İlerlemen bu cihazda saklanır; aynı testi tekrar açtığında kaldığın yerden devam edebilirsin. Bir hafta içinde dönmezsen silinir.",
  },
  {
    q: "Mobil uygulamanın farkı ne?",
    a: "Web tek bir an ölçer. Uygulama bu ölçümü zaman içinde izler: günlük nabız, bütün ilişkilerini yan yana gösteren harita, tahmin modu ve emek defteri.",
  },
  {
    q: "Verilerimi nasıl sildiririm?",
    a: "Elindeki sonuç ya da davet bağlantısıyla struvamap@gmail.com adresine yaz; o cihaza ait sonuçlar, kıyaslamalar ve kullanım kayıtları silinir.",
  },
];

export function MethodPage() {
  useDocumentTitle("Yöntem");
  // Akordiyon: bir soru açılınca diğeri kapanır.
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <main className="wrap privacy-page method-page">
      <Header />

      <Reveal className="page-head">
        <span className="eyebrow">{toTurkishUpper("Yöntem")}</span>
        <h1>Bir test değil, bir harita.</h1>
        <p className="lead">
          İlişkiler sevgiyle kurulur ama yapıyla sürer: kimin hangi emeği taşıdığı, kararların nasıl alındığı, kime ne
          kadar alan kaldığı. Bu yapı çoğu zaman konuşulmaz, çünkü görünmez. StruvaMap onu görünür kılmak için var.
        </p>
      </Reveal>

      <Reveal group className="fact-grid">
        {LAYERS.map((l) => (
          <div className="dim-card" key={l.tag}>
            <span className="dim-tag">{toTurkishUpper(l.tag)}</span>
            <h3>{l.title}</h3>
            <p>{l.body}</p>
          </div>
        ))}
      </Reveal>

      <Reveal className="privacy-section">
        <h2>Nasıl ölçüyoruz</h2>
        <p>
          Her test, ilişkiyi oluşturan birkaç boyuta ayrılmış ifadelerden oluşur. Her ifadeye ne kadar katıldığını
          işaretlersin; her boyutun skoru, o boyuttaki ifadelerin ortalamasıdır ve 0 ile 100 arasında çıkar. Boyutlar
          emek, güç ve özerklik gibi üst endekslerde birleşir. Genel skor bütün boyutların ortalamasıdır.
        </p>
        <p>
          75 ve üzeri bir boyut güçlü, 55'in altı gerilimli alan olarak işaretlenir. Bu eşikler bir tasarım kararıdır; bir
          nüfus ortalamasıyla kıyas değildir. Puanlama sabit ve tekrarlanabilir kurallarla yapılır, yapay zekâ
          kullanılmaz.
        </p>
      </Reveal>

      <Reveal className="privacy-section">
        <h2>İki kişi, aynı ilişki</h2>
        <p>
          Asıl görünürlük kıyaslamada ortaya çıkar. Aynı ilişkiyi iki kişi ayrı ayrı haritaladığında, skorların kendisi
          kadar aralarındaki fark da anlam taşır: biri bir alanı dengeli yaşarken diğeri orada bir yük taşıyor olabilir.
          Kıyaslama sayfası bu farkları ve onları konuşmaya açacak soruları gösterir.
        </p>
      </Reveal>

      <Reveal className="disclaimer">
        <span className="eyebrow">{toTurkishUpper("Neyi ölçmüyoruz")}</span>
        <p>
          Sevginin, mutluluğun ya da uyumun puanını vermiyoruz. Sonuçlar teşhis değildir ve bir uzman görüşünün yerini
          tutmaz. Şiddet ya da ciddi bir sıkıntı yaşıyorsan bir uzmana ya da destek hattına başvurman gerekir.
        </p>
      </Reveal>

      <Reveal className="privacy-section">
        <h2>Sık sorulanlar</h2>
        <div className="faq">
          {FAQ.map((item, i) => (
            <details key={item.q} open={openIndex === i}>
              <summary
                onClick={(e) => {
                  // Tarayıcının kendi aç/kapa davranışı yerine durum yönetir,
                  // böylece aynı anda tek soru açık kalır.
                  e.preventDefault();
                  setOpenIndex((current) => (current === i ? null : i));
                }}
              >
                {item.q}
              </summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </Reveal>

      <Reveal className="method-cta">
        <Link to="/" className="btn">
          Bir ilişki seç, haritalamaya başla →
        </Link>
      </Reveal>

      <Footer />
    </main>
  );
}
