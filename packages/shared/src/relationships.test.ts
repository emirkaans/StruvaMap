import { describe, expect, it } from "vitest";
import {
  findRelationshipPatterns,
  summarizeRelationshipHistory,
  type RelationshipResultPoint,
  type RelationshipSnapshot,
} from "./relationships.js";
import { summarizeLabourWeek } from "./labour.js";

const names = { power: "Güç", labour: "Emek", support: "Destek" };
function snap(label: string, indices: Record<string, number>): RelationshipSnapshot {
  return { relationshipId: label, label, indices, indexNames: names };
}

describe("findRelationshipPatterns", () => {
  it("en az iki ilişkide ve yarısında düşük olan endeksi gerilim örüntüsü sayar", () => {
    const patterns = findRelationshipPatterns([
      snap("Ayşe", { power: 70, labour: 40 }),
      snap("Patron", { power: 60, labour: 50 }),
      snap("Annem", { power: 80, labour: 90 }),
    ]);
    expect(patterns).toEqual([
      { indexId: "labour", indexName: "Emek", kind: "tension", labels: ["Ayşe", "Patron"], persistentLabels: [], total: 3 },
    ]);
  });

  it("tek ilişkideki değer ya da azınlık örüntü değildir", () => {
    expect(findRelationshipPatterns([snap("Ayşe", { labour: 10 })])).toEqual([]);
    expect(
      findRelationshipPatterns([
        snap("A", { labour: 10 }),
        snap("B", { labour: 20 }),
        snap("C", { labour: 80 }),
        snap("D", { labour: 70 }),
        snap("E", { labour: 60 }),
      ]),
    ).toEqual([]);
  });

  it("güçlü alanları da bulur, gerilimleri önce sıralar; eşik 55/75", () => {
    const patterns = findRelationshipPatterns([
      snap("A", { power: 75, labour: 54 }),
      snap("B", { power: 90, labour: 20 }),
    ]);
    expect(patterns.map((p) => [p.indexId, p.kind])).toEqual([
      ["labour", "tension"],
      ["power", "strength"],
    ]);
  });

  it("farklı testlerin endeksleri yalnızca kendi taşıyıcılarıyla değerlendirilir", () => {
    const patterns = findRelationshipPatterns([
      snap("Ayşe", { labour: 30 }),
      snap("Can", { support: 40 }),
      snap("Ece", { support: 45 }),
    ]);
    expect(patterns).toEqual([
      { indexId: "support", indexName: "Destek", kind: "tension", labels: ["Can", "Ece"], persistentLabels: [], total: 2 },
    ]);
  });
});

describe("findRelationshipPatterns kalıcılık", () => {
  it("önceki ölçümde de aynı bantta olan ilişkileri kalıcı sayar", () => {
    const patterns = findRelationshipPatterns([
      { ...snap("Ayşe", { labour: 40 }), previousIndices: { labour: 50 } }, // önceden de düşük
      { ...snap("Patron", { labour: 30 }), previousIndices: { labour: 70 } }, // yeni düştü
      snap("Can", { labour: 20 }), // tek ölçüm
    ]);
    expect(patterns[0].persistentLabels).toEqual(["Ayşe"]);
  });
});

describe("summarizeLabourWeek", () => {
  it("kategori ve kişi bazında sayar, payı yüzde olarak verir", () => {
    const summary = summarizeLabourWeek([
      { category: "cooking", mine: true },
      { category: "cooking", mine: true },
      { category: "cooking", mine: false },
      { category: "bills", mine: false },
    ]);
    expect(summary.mine).toBe(2);
    expect(summary.partner).toBe(2);
    expect(summary.myShare).toBe(50);
    expect(summary.categories.find((c) => c.id === "cooking")).toEqual({ id: "cooking", label: "Yemek", mine: 2, partner: 1 });
    expect(summary.categories).toHaveLength(9);
  });

  it("kayıt yoksa pay null", () => {
    expect(summarizeLabourWeek([]).myShare).toBeNull();
  });
});


function point(createdAt: string, rsi: number, dimensions: Record<string, number>): RelationshipResultPoint {
  return { resultId: createdAt, createdAt, rsi, dimensions };
}

describe("summarizeRelationshipHistory", () => {
  it("tek sonuçta karşılaştırma yapmaz", () => {
    expect(summarizeRelationshipHistory([point("2026-01-01", 50, { a: 40 })])).toEqual({
      rsiDelta: null,
      changes: [],
      persistentTensions: [],
      persistentStrengths: [],
      newTensions: [],
      recovered: [],
    });
  });

  it("son iki sonuç arasındaki büyük değişimleri ve bant geçişlerini bulur (sıradan bağımsız)", () => {
    const summary = summarizeRelationshipHistory([
      point("2026-06-01", 60, { domestic: 38, family: 70, decision: 60, mental: 80 }),
      point("2026-01-01", 45, { domestic: 30, family: 72, decision: 58, mental: 90 }),
      point("2026-09-01", 64, { domestic: 61, family: 52, decision: 65, mental: 82 }),
    ]);
    expect(summary.rsiDelta).toBe(19); // 64 - 45 (ilk)
    expect(summary.changes).toEqual([
      { dim: "domestic", from: 38, to: 61, delta: 23 },
      { dim: "family", from: 70, to: 52, delta: -18 },
    ]);
    expect(summary.newTensions).toEqual(["family"]);
    expect(summary.recovered).toEqual(["domestic"]);
    expect(summary.persistentStrengths).toEqual(["mental"]);
  });

  it("kalıcı gerilim için pencerenin tamamında gerilim bandı ister", () => {
    const summary = summarizeRelationshipHistory([
      point("2026-01-01", 40, { a: 80, b: 30 }), // pencere dışında (4. en yeni)
      point("2026-02-01", 40, { a: 50, b: 30 }),
      point("2026-03-01", 40, { a: 40, b: 54 }),
      point("2026-04-01", 40, { a: 45, b: 55 }),
    ]);
    expect(summary.persistentTensions).toEqual(["a"]);
  });
});
