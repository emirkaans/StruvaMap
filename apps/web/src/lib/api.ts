import type { Answers, ScoreResult, TestDefinition } from "@struva/shared";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface ResultRow {
  id: string;
  test_id: string;
  session_id: string;
  answers: Answers;
  score: ScoreResult;
  created_at: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) throw new Error(`API hatası (${res.status}): ${await res.text()}`);
  return res.json() as Promise<T>;
}

export function fetchTests(): Promise<TestDefinition[]> {
  return request("/tests");
}

export function fetchTest(testId: string): Promise<TestDefinition> {
  return request(`/tests/${testId}`);
}

export function submitResult(payload: {
  testId: string;
  sessionId: string;
  answers: Answers;
}): Promise<ResultRow> {
  return request("/results", { method: "POST", body: JSON.stringify(payload) });
}

export function fetchResult(resultId: string): Promise<ResultRow> {
  return request(`/results/${resultId}`);
}

export function fetchResultHistory(sessionId: string, testId: string): Promise<ResultRow[]> {
  return request(`/results?sessionId=${encodeURIComponent(sessionId)}&testId=${encodeURIComponent(testId)}`);
}

export interface ComparisonRow {
  id: string;
  testId: string;
  a: ResultRow;
  b: ResultRow;
}

export function createComparison(resultIdA: string, resultIdB: string): Promise<{ id: string }> {
  return request("/comparisons", { method: "POST", body: JSON.stringify({ resultIdA, resultIdB }) });
}

export function fetchComparison(comparisonId: string): Promise<ComparisonRow> {
  return request(`/comparisons/${comparisonId}`);
}
