import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import { sendContactMessage, type ContactTopic } from "../lib/api";
import { toTurkishUpper } from "../lib/text";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Reveal } from "../components/Reveal";

const CONTACT_EMAIL = "struvamap@gmail.com";
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 2000;

const TOPICS: { id: ContactTopic; label: string }[] = [
  { id: "data_request", label: "Verimle ilgili bir talep" },
  { id: "feedback", label: "Geri bildirim" },
  { id: "bug", label: "Hata bildirimi" },
  { id: "other", label: "Diğer" },
];

// ?konu=veri gibi kısa adlarla başka sayfalardan konu seçili gelinebilir.
const TOPIC_ALIASES: Record<string, ContactTopic> = {
  veri: "data_request",
  geribildirim: "feedback",
  hata: "bug",
};

export function ContactPage() {
  useDocumentTitle("İletişim");
  const [searchParams] = useSearchParams();
  const [topic, setTopic] = useState<ContactTopic>(TOPIC_ALIASES[searchParams.get("konu") ?? ""] ?? "feedback");
  const [message, setMessage] = useState("");
  const [replyEmail, setReplyEmail] = useState("");
  const [reference, setReference] = useState(searchParams.get("ref") ?? "");
  const [website, setWebsite] = useState(""); // bot tuzağı, kullanıcı görmez
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [copied, setCopied] = useState(false);

  const trimmed = message.trim();
  const canSend = trimmed.length >= MESSAGE_MIN && status !== "sending";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSend) return;
    setStatus("sending");
    try {
      await sendContactMessage({
        topic,
        message: trimmed,
        // Boş alanlar gönderilmez; API boş e-postayı geçersiz sayar.
        replyEmail: replyEmail.trim() || undefined,
        reference: topic === "data_request" ? reference.trim() || undefined : undefined,
        website: website || undefined,
      });
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <main className="wrap privacy-page contact-page">
      <Header />

      <Reveal className="page-head">
        <span className="eyebrow">{toTurkishUpper("İletişim")}</span>
        <h1>Bize yaz.</h1>
        <p className="lead">
          Bir soru, bir öneri, bir hata ya da verinle ilgili bir talep. Her mesajı okuyoruz; yanıt istersen e-posta
          adresini bırakman yeterli.
        </p>
      </Reveal>

      {status === "sent" ? (
        <Reveal className="card contact-sent">
          <span className="eyebrow">{toTurkishUpper("Mesajın ulaştı")}</span>
          <p>
            Teşekkürler. Yanıt istediysen en kısa sürede döneceğiz. Verinle ilgili talepleri en geç 30 gün içinde
            sonuçlandırıyoruz.
          </p>
        </Reveal>
      ) : (
        <form className="contact-form" onSubmit={onSubmit} noValidate>
          <fieldset className="contact-topics">
            <legend>Konu</legend>
            {TOPICS.map((t) => (
              <label key={t.id} className={`option${topic === t.id ? " selected" : ""}`}>
                <input
                  type="radio"
                  name="topic"
                  value={t.id}
                  checked={topic === t.id}
                  onChange={() => setTopic(t.id)}
                />
                {t.label}
              </label>
            ))}
          </fieldset>

          {topic === "data_request" && (
            <label className="contact-field">
              <span>Sonuç ya da davet bağlantısı</span>
              <input
                className="contact-input"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="https://struvamap.com/result/…"
                maxLength={500}
              />
              <small>
                Web sitesindeki kayıtlarını bulabilmemiz için gerekli. Uygulamadaki hesabını ise profil ekranından
                kendin silebilirsin.
              </small>
            </label>
          )}

          <label className="contact-field">
            <span>Mesajın</span>
            <textarea
              className="contact-input"
              rows={7}
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, MESSAGE_MAX))}
              placeholder="Ne söylemek istersin?"
            />
            <small>
              {trimmed.length < MESSAGE_MIN
                ? `En az ${MESSAGE_MIN} karakter.`
                : `${message.length} / ${MESSAGE_MAX}`}
            </small>
          </label>

          <label className="contact-field">
            <span>E-posta adresin (isteğe bağlı)</span>
            <input
              className="contact-input"
              type="email"
              value={replyEmail}
              onChange={(e) => setReplyEmail(e.target.value)}
              placeholder="ornek@eposta.com"
              maxLength={200}
            />
            <small>Yalnızca sana yanıt vermek için kullanılır.</small>
          </label>

          {/* Bot tuzağı: ekran dışında, ekran okuyuculardan ve sekmeden gizli. */}
          <input
            className="contact-trap"
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />

          {status === "error" && (
            <p className="admin-error">
              Mesaj gönderilemedi. Biraz sonra tekrar dene ya da {CONTACT_EMAIL} adresine doğrudan yaz.
            </p>
          )}

          <button type="submit" className="btn" disabled={!canSend}>
            {status === "sending" ? "Gönderiliyor…" : "Gönder"}
          </button>
        </form>
      )}

      <Reveal className="privacy-contact">
        <p>
          E-postayı tercih edersen: <span className="privacy-contact-email">{CONTACT_EMAIL}</span>
        </p>
        <button
          type="button"
          className="btn secondary"
          onClick={() => {
            navigator.clipboard
              .writeText(CONTACT_EMAIL)
              .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              })
              .catch(() => {});
          }}
        >
          {copied ? "Kopyalandı!" : "Adresi kopyala"}
        </button>
      </Reveal>

      <Footer />
    </main>
  );
}
