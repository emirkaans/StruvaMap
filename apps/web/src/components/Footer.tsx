import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="site-footer no-print">
      <Link to="/" className="logo-lg">
        Struva<span>Map</span>
      </Link>
      <p>
        Cevaplarınız puanlama için sunucuya gönderilir; hesap oluşturulmaz, kimlik bilgisi
        toplanmaz.
      </p>
    </footer>
  );
}
