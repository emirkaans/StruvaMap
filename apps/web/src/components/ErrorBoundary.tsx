import { Component, type ErrorInfo, type ReactNode } from "react";
import { captureError } from "../lib/monitoring";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/* Bir render hatası tüm uygulamayı unmount edip kullanıcıya boş ekran
   göstermesin diye son savunma hattı. Hata Sentry'ye (yapılandırılmışsa)
   iletilir; kullanıcı çıkmaza girmeden ana sayfaya dönebilir. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    captureError(error, { componentStack: info.componentStack });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="wrap">
        <div className="card">
          <h1>Bir şeyler ters gitti</h1>
          <p className="muted">
            Bu sayfa yüklenirken beklenmedik bir hata oluştu. Sayfayı yenilemeyi
            deneyebilir ya da ana sayfaya dönebilirsin.
          </p>
          <div className="actions-row" style={{ marginTop: 16 }}>
            <button type="button" className="btn" onClick={() => window.location.reload()}>
              Sayfayı yenile
            </button>
            <a href="/" className="btn secondary">
              Anasayfaya Dön
            </a>
          </div>
        </div>
      </main>
    );
  }
}
