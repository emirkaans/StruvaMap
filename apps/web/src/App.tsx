import { Route, Routes } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { TestPage } from "./pages/TestPage";
import { ResultPage } from "./pages/ResultPage";
import { ComparisonPage } from "./pages/ComparisonPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/test/:testId" element={<TestPage />} />
      <Route path="/result/:resultId" element={<ResultPage />} />
      <Route path="/comparisons/:comparisonId" element={<ComparisonPage />} />
    </Routes>
  );
}
