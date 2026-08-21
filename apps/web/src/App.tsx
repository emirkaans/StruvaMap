import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { TestPage } from "./pages/TestPage";
import { ResultPage } from "./pages/ResultPage";
import { ComparisonPage } from "./pages/ComparisonPage";

/* Admin panel lazy: @supabase/supabase-js istemcisi burada başlatılır ve
   VITE_SUPABASE_* değişkenlerini gerektirir — genel ziyaretçi bundle'ı bu
   koda hiç dokunmasın diye ayrı chunk'a alındı. AdminRoute de bu yüzden
   lazy: statik import etseydik supabase.ts yine anasayfa bundle'ına girerdi. */
const AdminRoute = lazy(() => import("./components/AdminRoute").then((m) => ({ default: m.AdminRoute })));
const AdminLoginPage = lazy(() => import("./pages/admin/AdminLoginPage").then((m) => ({ default: m.AdminLoginPage })));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage").then((m) => ({ default: m.AdminDashboardPage })));
const AdminEventsPage = lazy(() => import("./pages/admin/AdminEventsPage").then((m) => ({ default: m.AdminEventsPage })));
const AdminResultsPage = lazy(() => import("./pages/admin/AdminResultsPage").then((m) => ({ default: m.AdminResultsPage })));
const AdminComparisonsPage = lazy(() => import("./pages/admin/AdminComparisonsPage").then((m) => ({ default: m.AdminComparisonsPage })));

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/test/:testId" element={<TestPage />} />
      <Route path="/result/:resultId" element={<ResultPage />} />
      <Route path="/comparisons/:comparisonId" element={<ComparisonPage />} />

      <Route
        path="/admin/login"
        element={
          <Suspense fallback={null}>
            <AdminLoginPage />
          </Suspense>
        }
      />
      <Route
        path="/admin"
        element={
          <Suspense fallback={null}>
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          </Suspense>
        }
      />
      <Route
        path="/admin/events"
        element={
          <Suspense fallback={null}>
            <AdminRoute>
              <AdminEventsPage />
            </AdminRoute>
          </Suspense>
        }
      />
      <Route
        path="/admin/results"
        element={
          <Suspense fallback={null}>
            <AdminRoute>
              <AdminResultsPage />
            </AdminRoute>
          </Suspense>
        }
      />
      <Route
        path="/admin/comparisons"
        element={
          <Suspense fallback={null}>
            <AdminRoute>
              <AdminComparisonsPage />
            </AdminRoute>
          </Suspense>
        }
      />
    </Routes>
  );
}
