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

export function fetchTests(all?: boolean): Promise<TestDefinition[]> {
  return request(`/tests${all ? "?all=true" : ""}`);
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

export function fetchComparisonByResultId(resultId: string): Promise<ComparisonRow | null> {
  return request(`/comparisons/by-result/${resultId}`);
}

export function createClaim(resultId: string): Promise<{ token: string; expiresAt: string }> {
  return request("/claims", { method: "POST", body: JSON.stringify({ resultId }) });
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

// Olayın geldiği istemci; boş bırakılırsa hepsi (platform bilgisi olmayan
// eski olaylar dahil).
export type AdminPlatform = "" | "web" | "android";

export interface AdminFunnelStep extends AdminEventCount {
  sessions: number;
}

export function fetchAdminEventsSummary(from?: string, to?: string): Promise<AdminEventCount[]> {
  return adminRequest(`/admin/events/summary${toQuery({ from, to })}`);
}

export function fetchAdminEventsTrend(
  name: string,
  from?: string,
  to?: string,
  platform: AdminPlatform = "",
): Promise<AdminEventDailyCount[]> {
  return adminRequest(`/admin/events/trend${toQuery({ name, from, to, platform })}`);
}

export function fetchAdminEventsFunnel(
  from?: string,
  to?: string,
  platform: AdminPlatform = "",
): Promise<AdminFunnelStep[]> {
  return adminRequest(`/admin/events/funnel${toQuery({ from, to, platform })}`);
}

export interface AdminMobileSummary {
  users: {
    total: number;
    guests: number;
    registered: number;
    newInRange: number;
    newGuestsInRange: number;
  };
  activeSessions: { last7Days: number; last30Days: number };
  pulse: {
    activePairs: number;
    pendingPairs: number;
    endedPairs: number;
    endedInRange: number;
    checkinDays: number;
    anyAnsweredDays: number;
    bothAnsweredDays: number;
    answerSources: Record<string, number>;
  };
  push: {
    usersWithToken: number;
    days: { date: string; morningPairs: number; eveningPeople: number }[];
  };
  features: {
    relationships: { total: number; archived: number; users: number; linkedResults: number };
    predictions: { total: number; evaluated: number; averageAccuracy: number | null };
    labour: { entriesInRange: number; pairsInRange: number };
    claims: { createdInRange: number; redeemedInRange: number };
  };
}

export interface AdminSessionData {
  sessionId: string;
  results: { id: string; testId: string; createdAt: string; linkedToAccount: boolean }[];
  comparisonCount: number;
  eventCount: number;
}

export interface AdminDataLookup {
  matchedAs: "result" | "comparison";
  sessions: AdminSessionData[];
}

export interface AdminDeletionReport {
  comparisons: number;
  results: number;
  events: number;
}

export function lookupAdminData(q: string): Promise<AdminDataLookup> {
  return adminRequest(`/admin/data/lookup${toQuery({ q })}`);
}

export function deleteAdminSessionData(sessionId: string): Promise<AdminDeletionReport> {
  return adminRequest(`/admin/data/sessions/${encodeURIComponent(sessionId)}`, { method: "DELETE" });
}

export function fetchAdminMobile(from?: string, to?: string): Promise<AdminMobileSummary> {
  return adminRequest(`/admin/mobile${toQuery({ from, to })}`);
}

export function fetchAdminEventsDailyTotal(
  from?: string,
  to?: string,
  platform: AdminPlatform = "",
): Promise<AdminEventDailyCount[]> {
  return adminRequest(`/admin/events/daily-total${toQuery({ from, to, platform })}`);
}

export interface AdminTestResultCount {
  testId: string;
  count: number;
}

export function fetchAdminResultsByTest(): Promise<AdminTestResultCount[]> {
  return adminRequest(`/admin/results/by-test`);
}

export function fetchAdminResultsDailyTotal(from?: string, to?: string): Promise<AdminEventDailyCount[]> {
  return adminRequest(`/admin/results/daily-total${toQuery({ from, to })}`);
}

export function fetchAdminComparisonsDailyTotal(from?: string, to?: string): Promise<AdminEventDailyCount[]> {
  return adminRequest(`/admin/comparisons/daily-total${toQuery({ from, to })}`);
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
