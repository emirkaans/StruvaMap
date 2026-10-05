import { useState } from "react";
import { Reveal } from "./Reveal";

/* "Bize yaz" yalnızca mailto linki olunca, bilgisayarda tanımlı bir e-posta
   uygulaması yoksa tıklamak hiçbir şey yapmıyordu. Adres açıkça yazılır ve
   kopyalanabilir; e-posta uygulaması olan için mailto da durur. */
export function ContactBlock({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Reveal className="privacy-contact">
      <p>
        Verinle ilgili bir talebin mi var, yoksa bir şey mi anlamadın? Bize{" "}
        <span className="privacy-contact-email">{email}</span> adresinden ulaşabilirsin.
      </p>
      <div className="privacy-contact-actions">
        <button
          type="button"
          className="btn secondary"
          onClick={() => {
            navigator.clipboard
              .writeText(email)
              .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              })
              .catch(() => {});
          }}
        >
          {copied ? "Kopyalandı!" : "Adresi kopyala"}
        </button>
        <a href={`mailto:${email}`} className="btn secondary">
          E-posta uygulamasında aç
        </a>
      </div>
    </Reveal>
  );
}
