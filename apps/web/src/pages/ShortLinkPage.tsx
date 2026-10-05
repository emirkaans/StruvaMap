import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { fetchResult } from "../lib/api";

/* /r/:id ve /d/:id paylaşım linkleri. Canlıda Netlify bunları API'nin
   önizleme sayfasına vekil olarak iletir ve tarayıcı oradan asıl sayfaya
   yönlenir; bu bileşen yerel geliştirmede ve vekil çalışmazsa yedek olarak
   aynı yönlendirmeyi yapar. */
export function ResultShortLink() {
  const { id = "" } = useParams();
  return <Navigate to={`/result/${id}`} replace />;
}

export function InviteShortLink() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetchResult(id)
      .then((row) => navigate(`/test/${row.test_id}?compareWith=${id}`, { replace: true }))
      .catch(() => setFailed(true));
  }, [id, navigate]);

  if (failed) return <Navigate to="/" replace />;
  return (
    <main className="wrap">
      <div className="card muted">Yönlendiriliyor…</div>
    </main>
  );
}
