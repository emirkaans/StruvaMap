import { Link } from "react-router-dom";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import { ContactBlock } from "../components/ContactBlock";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Reveal } from "../components/Reveal";
import { toTurkishUpper } from "../lib/text";

// Uygulamadaki gizlilik ekranı bu sayfanın kısa özetini gösterir ve tam metin
// için buraya bağlanır (bkz. android PrivacyScreen.kt); metin değişirse
// oradaki özet de gözden geçirilmeli.
const CONTROLLER = "Emir Kaan Sarıçam, Çankaya/Ankara";
const CONTACT_EMAIL = "struvamap@gmail.com";
const UPDATED = "6 Ekim 2026";

const FACTS = [
  {
    tag: "Hesap",
    title: "Webde üyelik yok.",
    body: "Sitede kayıt olmazsın. Uygulama seni otomatik bir misafir hesabıyla başlatır; kullanıcı adı ve şifreyle kalıcı hesaba çevirmek senin tercihin. E-posta ya da gerçek ad istenmez.",
  },
  {
    tag: "İzleme",
    title: "Reklam ve izleme aracı yok.",
    body: "Üçüncü taraf analiz ya da reklam aracı kullanmıyoruz. Kullanım ölçümü yalnızca kendi sunucumuza yazılır.",
  },
  {
    tag: "Puanlama",
    title: "Yapay zekâ skor hesaplamaz.",
    body: "Sonucun sabit, tekrarlanabilir kurallarla üretilir. Yanıtların bir modele gönderilmez.",
  },
  {
    tag: "Silme",
    title: "Silme senin elinde.",
    body: "Uygulamada hesabını profil ekranından silersin; bütün kayıtların kalıcı olarak silinir. Webdeki kayıtların için sonuç bağlantısıyla bize yazman yeterli.",
  },
];

export function PrivacyPage() {
  useDocumentTitle("Gizlilik");
  return (
    <main className="wrap privacy-page">
      <Header />

      <Reveal className="page-head">
        <span className="eyebrow">{toTurkishUpper("Gizlilik")}</span>
        <h1>Ne biliyoruz, ne bilmiyoruz.</h1>
        <p className="lead">
          İlişki, aile ve ev dinamiklerine dair yanıtların hassas bir alana değiyor. Web sitesinde ve mobil uygulamada ne
          topladığımızı, kimin neyi gördüğünü ve haklarını burada açık açık yazıyoruz. Hukuk dili değil, gerçek
          davranış.
        </p>
        <span className="page-meta">
          Son güncelleme · {UPDATED} · Veri sorumlusu · {CONTROLLER} ·{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
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
        <h2>Kimler için</h2>
        <p>
          StruvaMap 18 yaş ve üzerindeki kişiler içindir. 18 yaşından küçüksen web sitesini ve uygulamayı kullanmamanı
          rica ediyoruz. Bilmeden 18 yaş altı birine ait veri işlediğimizi fark edersek siliyoruz.
        </p>
      </Reveal>

      <Reveal className="privacy-section">
        <h2>Web sitesinde ne topluyoruz</h2>
        <ul>
          <li>Test yanıtların ve bunlardan hesaplanan skorlar.</li>
          <li>
            Tarayıcında rastgele üretilen bir oturum kimliği (<code>session_id</code>). Aynı tarayıcıdan gelen sonuçları
            ve zaman içindeki değişimi birbirine bağlamak için kullanılır; adına ya da e-postana bağlı değildir.
          </li>
          <li>
            Yarım kalan testin ilerlemesi. Yalnızca senin cihazında saklanır, sunucuya gitmez; testi bitirince ya da bir
            hafta sonra silinir.
          </li>
          <li>
            Kullanım olayları: hangi test başladı, hangi soruda bırakıldı, davet bağlantısı kullanıldı mı ve olayın web
            sitesinden mi uygulamadan mı geldiği.
          </li>
          <li>
            İletişim formundan yazarsan mesajın ve, yanıt istersen bıraktığın e-posta adresi. E-posta adresin
            yalnızca sana yanıt vermek için kullanılır.
          </li>
        </ul>
      </Reveal>

      <Reveal className="privacy-section">
        <h2>Mobil uygulamada ne topluyoruz</h2>
        <p>Web sitesindekilere ek olarak, uygulamanın özellikleri şu verileri gerektirir:</p>
        <ul>
          <li>
            Hesap bilgileri. Misafir hesabında hiçbir kişisel bilgi istenmez. Kalıcı hesapta kullanıcı adın, şifren ve
            isteğe bağlı bir güvenlik sorusu tutulur. Şifren ve güvenlik sorusunun cevabı şifrelenmiş olarak saklanır,
            biz de göremeyiz.
          </li>
          <li>Test sonuçların ve kıyaslamaların.</li>
          <li>Günlük nabız: eşleştiğin kişiyle her gün yanıtladığın soru ve cevabın.</li>
          <li>İlişki haritası: ilişkilerine verdiğin isimler ve onlara eklediğin notlar.</li>
          <li>Tahmin modu: karşı taraf için yaptığın tahminler.</li>
          <li>
            Bildirim kimliği. Sana bildirim gönderebilmek için cihazına ait, Google Firebase tarafından üretilen bir
            kimlik.
          </li>
          <li>
            Pano. Web sitesinde "Google Play'den İndir"e bastıysan, sonucunu uygulamaya taşımak için panoya tek
            kullanımlık bir kod kopyalanır. Uygulama açılışta panoda yalnızca bu koda bakar; panodaki başka içerik
            okunup saklanmaz.
          </li>
        </ul>
      </Reveal>

      <Reveal className="privacy-section">
        <h2>Kim neyi görür</h2>
        <ul>
          <li>Sonuç bağlantını paylaştığın herkes o sonucu görebilir.</li>
          <li>Davet bağlantınla testi çözen kişi, ikinizin yanıtlarını boyut boyut karşılaştırmalı görür.</li>
          <li>Günlük nabızda eşleştiğin kişi senin günlük cevaplarını görür.</li>
          <li>İlişki adları ve notların yalnızca sana görünür.</li>
          <li>
            Biz yönetim panelinde hesap listesini ve kullanım sayılarını görürüz. İlişki adlarını, notlarını ve nabız
            cevaplarının içeriğini görmeyiz.
          </li>
        </ul>
      </Reveal>

      <Reveal className="privacy-section">
        <h2>Neden işliyoruz</h2>
        <ul>
          <li>
            Testleri puanlamak, sonuçları ve kıyaslamaları göstermek, nabız ve harita gibi özellikleri
            çalıştırmak için. Bu, kullandığın hizmetin kendisidir.
          </li>
          <li>
            Ürünün nerede zorlandığını anlamak ve hataları düzeltmek için kullanım olaylarını ve teknik hata kayıtlarını
            inceleriz.
          </li>
          <li>Verilerini satmayız, reklam için kullanmayız ve kimseyle pazarlama amacıyla paylaşmayız.</li>
        </ul>
      </Reveal>

      <Reveal className="privacy-section">
        <h2>Nerede saklanır, kimlerle paylaşılır</h2>
        <p>Hizmeti sunabilmek için şu altyapı sağlayıcılarıyla çalışıyoruz:</p>
        <ul>
          <li>Supabase: veritabanı ve hesap girişi.</li>
          <li>Render: uygulamanın sunucusu.</li>
          <li>Netlify: web sitesinin barındırılması.</li>
          <li>Google Firebase: uygulama bildirimlerinin iletilmesi.</li>
          <li>Sentry: sunucu tarafındaki teknik hata kayıtları; kişisel veri gönderimi kapalıdır.</li>
          <li>Cloudflare: alan adı yönetimi.</li>
        </ul>
        <p>
          Bu sağlayıcıların sunucuları yurt dışında bulunabilir; verilerin bu nedenle yurt dışına aktarılır. Kendi
          kodumuz IP adresi saklamaz, ancak bu sağlayıcılar güvenlik ve işletim amacıyla kendi teknik kayıtlarında IP
          adresi tutabilir.
        </p>
      </Reveal>

      <Reveal className="privacy-section">
        <h2>Ne kadar süre saklanır</h2>
        <ul>
          <li>Uygulamada hesabını sildiğinde, hesabına bağlı bütün kayıtlar hemen ve kalıcı olarak silinir.</li>
          <li>Sonlandırılan nabız eşleşmeleri ve onlara bağlı kayıtlar 30 gün sonra otomatik olarak silinir.</li>
          <li>Yarım kalan testin cihazındaki ilerlemesi bitirince ya da bir hafta sonra silinir.</li>
          <li>Web sitesindeki sonuçlar, sen ya da biz silinmesini talep edene kadar saklanır.</li>
          <li>İletişim mesajları, talebin sonuçlandıktan sonra da kayıt için saklanabilir; silinmesini isteyebilirsin.</li>
        </ul>
      </Reveal>

      <Reveal className="disclaimer">
        <span className="eyebrow">{toTurkishUpper("Hassas veri uyarısı")}</span>
        <p>
          İlişki ve aile dinamiklerine dair yanıtların dolaylı olarak hassas konulara değinebilir.{" "}
          <em>Vermek tamamen gönüllü.</em> Hiçbir soruyu yanıtlamak zorunda değilsin, testi yarıda bırakabilirsin.
        </p>
      </Reveal>

      <Reveal className="privacy-section">
        <h2>Hakların neler</h2>
        <p>
          6698 sayılı Kişisel Verilerin Korunması Kanunu'nun 11. maddesi kapsamında şu haklara sahipsin: kişisel
          verinin işlenip işlenmediğini öğrenmek, işlendiyse bilgi istemek, işlenme amacını ve amaca uygun kullanılıp
          kullanılmadığını öğrenmek, yurt içinde ya da yurt dışında aktarıldığı üçüncü kişileri bilmek, eksik ya da
          yanlış işlendiyse düzeltilmesini istemek, silinmesini ya da yok edilmesini istemek, bu düzeltme ve silme
          işlemlerinin aktarıldığı kişilere bildirilmesini istemek, otomatik sistemlerle analiz edilmesi sonucunda
          aleyhine bir sonuç çıkmasına itiraz etmek ve kanuna aykırı işleme nedeniyle zarara uğradıysan zararın
          giderilmesini istemek.
        </p>
        <p>
          Uygulamada hesabını profil ekranından kendin silebilirsin. Web sitesindeki kayıtların için ya da diğer bütün
          talepler için <Link to="/iletisim?konu=veri">iletişim sayfasından</Link> ya da{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> adresinden, elindeki sonuç ya da davet
          bağlantısıyla birlikte yaz. Talebini en geç 30 gün içinde
          sonuçlandırırız.
        </p>
      </Reveal>

      <Reveal className="disclaimer">
        <span className="eyebrow">{toTurkishUpper("Teşhis değil")}</span>
        <p>
          StruvaMap sosyolojik bir haritalama aracı. Psikometrik doğrulama (Cronbach's alpha, faktör analizi, pilot
          çalışma) yapılmadı. Klinik teşhis, terapi ya da profesyonel danışmanlık yerine geçmez.
        </p>
      </Reveal>

      <ContactBlock email={CONTACT_EMAIL} />

      <Footer />
    </main>
  );
}
