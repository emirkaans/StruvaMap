import { Link } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

export function NotFoundPage() {
  return (
    <main className="wrap">
      <Header />
      <div className="card" style={{ textAlign: "center" }}>
        <h1>Sayfa bulunamadı</h1>
        <p className="muted">Aradığın sayfa taşınmış ya da hiç var olmamış olabilir.</p>
        <Link to="/" className="btn" style={{ marginTop: 8 }}>
          Anasayfaya Dön
        </Link>
      </div>
      <Footer />
    </main>
  );
}
