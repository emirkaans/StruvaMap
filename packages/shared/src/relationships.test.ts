import { describe, expect, it } from "vitest";
import { findRelationshipPatterns, type RelationshipSnapshot } from "./relationships.js";
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
      { indexId: "labour", indexName: "Emek", kind: "tension", labels: ["Ayşe", "Patron"], total: 3 },
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
      { indexId: "support", indexName: "Destek", kind: "tension", labels: ["Can", "Ece"], total: 2 },
    ]);
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
