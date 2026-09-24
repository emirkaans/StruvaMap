import { DEFAULT_THRESHOLDS } from "./scoring.js";

// Kişisel ilişki haritası: kullanıcının farklı ilişkilerindeki (romantik,
// arkadaşlık, iş...) son sonuçlarını yan yana koyup ilişkiler arası
// örüntüleri bulur — "bu ilişkiye değil sana ait olabilecek" tekrarlar.
// Tamamen deterministik, AI yok.

export interface RelationshipSnapshot {
  relationshipId: string;
  label: string;
  // İlişkinin en son sonucundaki üst-endeks skorları (ör. power/labour/autonomy).
  indices: Record<string, number>;
  // Endeks id → görünen ad (testin kendi tanımından, ör. "Emek").
  indexNames: Record<string, string>;
}

export type RelationshipPatternKind = "tension" | "strength";

export interface RelationshipPattern {
  indexId: string;
  indexName: string;
  kind: RelationshipPatternKind;
  labels: string[]; // örüntüye giren ilişkilerin adları
  total: number; // bu endeksi taşıyan ilişki sayısı
}

// Tek bir ilişkide görülen şey örüntü değildir: en az iki ilişki ve bu
// endeksi taşıyan ilişkilerin en az yarısı. Tasarım kararı, ampirik değil.
export const PATTERN_MIN_RELATIONSHIPS = 2;

export function findRelationshipPatterns(snapshots: RelationshipSnapshot[]): RelationshipPattern[] {
  const indexIds = [...new Set(snapshots.flatMap((s) => Object.keys(s.indices)))];
  const patterns: RelationshipPattern[] = [];

  for (const indexId of indexIds) {
    const carrying = snapshots.filter((s) => s.indices[indexId] != null);
    const indexName = carrying.map((s) => s.indexNames[indexId]).find((n) => n) ?? indexId;
    const groups: Array<[RelationshipPatternKind, RelationshipSnapshot[]]> = [
      ["tension", carrying.filter((s) => s.indices[indexId] < DEFAULT_THRESHOLDS.tensionThreshold)],
      ["strength", carrying.filter((s) => s.indices[indexId] >= DEFAULT_THRESHOLDS.strengthThreshold)],
    ];
    for (const [kind, matching] of groups) {
      if (matching.length >= PATTERN_MIN_RELATIONSHIPS && matching.length * 2 >= carrying.length) {
        patterns.push({ indexId, indexName, kind, labels: matching.map((s) => s.label), total: carrying.length });
      }
    }
  }

  // Önce gerilimler, sonra daha çok ilişkiyi kapsayanlar.
  return patterns.sort(
    (a, b) => (a.kind === b.kind ? 0 : a.kind === "tension" ? -1 : 1) || b.labels.length - a.labels.length,
  );
}

// ---- Tek ilişkinin zaman içindeki seyri (ilişki detay sayfası) ----

export interface RelationshipResultPoint {
  resultId: string;
  createdAt: string; // ISO
  rsi: number;
  dimensions: Record<string, number>;
}

export interface DimensionChange {
  dim: string;
  from: number;
  to: number;
  delta: number;
}

export interface RelationshipHistorySummary {
  // Son sonuç − ilk sonuç (en az 2 sonuç varsa).
  rsiDelta: number | null;
  // Son iki sonuç arasında en az CHANGE_THRESHOLD değişen boyutlar,
  // mutlak değişime göre büyükten küçüğe, en fazla MAX_CHANGES.
  changes: DimensionChange[];
  // Son PERSISTENCE_WINDOW sonucun (en az 2) hepsinde gerilim/güçlü bandında.
  persistentTensions: string[];
  persistentStrengths: string[];
  // Önceki sonuçta gerilim değilken son sonuçta gerilime düşenler, ve tersi.
  newTensions: string[];
  recovered: string[];
}

// Tasarım kararları (ampirik değil): 10 puan, 0-100 ölçeğinde bir bant
// geçişinin yarısı; "kalıcı" için en fazla son 3 ölçüme bakılır ki çok eski
// bir sonuç bugünkü tabloyu belirlemesin.
export const CHANGE_THRESHOLD = 10;
export const MAX_CHANGES = 3;
export const PERSISTENCE_WINDOW = 3;

export function summarizeRelationshipHistory(points: RelationshipResultPoint[]): RelationshipHistorySummary {
  const sorted = [...points].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const empty: RelationshipHistorySummary = {
    rsiDelta: null,
    changes: [],
    persistentTensions: [],
    persistentStrengths: [],
    newTensions: [],
    recovered: [],
  };
  if (sorted.length < 2) return empty;

  const last = sorted[sorted.length - 1];
  const previous = sorted[sorted.length - 2];
  const window = sorted.slice(-PERSISTENCE_WINDOW);
  const dims = Object.keys(last.dimensions).filter((dim) => previous.dimensions[dim] != null);
  const isTension = (score: number) => score < DEFAULT_THRESHOLDS.tensionThreshold;
  const isStrength = (score: number) => score >= DEFAULT_THRESHOLDS.strengthThreshold;
  const inAll = (dim: string, test: (score: number) => boolean) =>
    window.every((p) => p.dimensions[dim] != null && test(p.dimensions[dim]));

  return {
    rsiDelta: last.rsi - sorted[0].rsi,
    changes: dims
      .map((dim) => ({ dim, from: previous.dimensions[dim], to: last.dimensions[dim], delta: last.dimensions[dim] - previous.dimensions[dim] }))
      .filter((c) => Math.abs(c.delta) >= CHANGE_THRESHOLD)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, MAX_CHANGES),
    persistentTensions: dims.filter((dim) => inAll(dim, isTension)),
    persistentStrengths: dims.filter((dim) => inAll(dim, isStrength)),
    newTensions: dims.filter((dim) => isTension(last.dimensions[dim]) && !isTension(previous.dimensions[dim])),
    recovered: dims.filter((dim) => !isTension(last.dimensions[dim]) && isTension(previous.dimensions[dim])),
  };
}
