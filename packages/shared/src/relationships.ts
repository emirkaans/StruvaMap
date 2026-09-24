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
