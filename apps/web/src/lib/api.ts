import type { Answers, ScoreResult, TestDefinition } from "@struva/shared";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

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
  contextAnswers?: Record<string, string>;
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

/* Admin uçları oturum gerektirir. supabase istemcisi burada dinamik import
   edilir ki genel ziyaretçi akışı VITE_SUPABASE_* değişkenlerine bağımlı
   olmasın — bu istemci yalnızca admin panelinde gerçekten kullanılır. */
async function adminRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const { supabase } = await import("./supabase");
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Oturum bulunamadı.");

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
  if (!res.ok) throw new Error(`API hatası (${res.status}): ${await res.text()}`);
  return res.json() as Promise<T>;
}

function toQuery(params: Record<string, string | number | undefined>): string {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`);
  return parts.length ? `?${parts.join("&")}` : "";
}

export interface AdminEventCount {
  name: string;
  count: number;
}

export interface AdminEventDailyCount {
  date: string;
  count: number;
}

export interface AdminComparisonRow {
  id: string;
  test_id: string;
  result_id_a: string;
  result_id_b: string;
  created_at: string;
}

export interface AdminListParams {
  page?: number;
  pageSize?: number;
  testId?: string;
  from?: string;
  to?: string;
}

export interface AdminPaginated<T> {
  rows: T[];
  total: number;
}

export function fetchAdminEventsSummary(from?: string, to?: string): Promise<AdminEventCount[]> {
  return adminRequest(`/admin/events/summary${toQuery({ from, to })}`);
}

export function fetchAdminEventsTrend(
  name: string,
  from?: string,
  to?: string,
): Promise<AdminEventDailyCount[]> {
  return adminRequest(`/admin/events/trend${toQuery({ name, from, to })}`);
}

export function fetchAdminEventsFunnel(from?: string, to?: string): Promise<AdminEventCount[]> {
  return adminRequest(`/admin/events/funnel${toQuery({ from, to })}`);
}

export function fetchAdminResults(params: AdminListParams): Promise<AdminPaginated<ResultRow>> {
  return adminRequest(`/admin/results${toQuery({ ...params })}`);
}

export function fetchAdminComparisons(
  params: AdminListParams,
): Promise<AdminPaginated<AdminComparisonRow>> {
  return adminRequest(`/admin/comparisons${toQuery({ ...params })}`);
}

export function updateAdminTest(testId: string, definition: TestDefinition): Promise<TestDefinition> {
  return adminRequest(`/admin/tests/${testId}`, {
    method: "PUT",
    body: JSON.stringify({ definition }),
  });
}
