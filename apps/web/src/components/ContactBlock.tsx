import { Link } from "react-router-dom";
import { Reveal } from "./Reveal";

/* Sayfa sonundaki iletişim çağrısı: iletişim sayfasına yönlendirir, veri
   talebi için konu seçili gelir. Adres de görünür kalır. */
export function ContactBlock({ email }: { email: string }) {
  return (
    <Reveal className="privacy-contact">
      <p>
        Verinle ilgili bir talebin mi var, yoksa bir şey mi anlamadın? İletişim sayfasından yazabilir ya da{" "}
        <span className="privacy-contact-email">{email}</span> adresine e-posta gönderebilirsin.
      </p>
      <Link to="/iletisim?konu=veri" className="btn secondary">
        Bize yaz
      </Link>
    </Reveal>
  );
}
