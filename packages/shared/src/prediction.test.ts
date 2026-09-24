import { describe, expect, it } from "vitest";
import { classifyPrediction, evaluatePrediction, PERCEPTION_GAP_THRESHOLD, PREDICTION_TOLERANCE } from "./prediction.js";

describe("classifyPrediction", () => {
  it("dört kategoriyi eşik sınırlarında ayırır", () => {
    // benzer (fark eşiğin altında), tahmin tolerans içinde
    expect(classifyPrediction(60, 60 + PREDICTION_TOLERANCE, 60)).toBe("aligned_known");
    // benzer ama tahmin toleransın dışında
    expect(classifyPrediction(60, 60 + PREDICTION_TOLERANCE + 1, 60)).toBe("aligned_missed");
    // farklı (tam eşikte), tahmin isabetli
    expect(classifyPrediction(80, 60, 80 - PERCEPTION_GAP_THRESHOLD)).toBe("different_known");
    // farklı, karşı tarafı kendin gibi sanmışsın
    expect(classifyPrediction(80, 80, 40)).toBe("different_missed");
  });
});

describe("evaluatePrediction", () => {
  it("isabeti 100 - ortalama mutlak hata olarak hesaplar ve sırayı korur", () => {
    const summary = evaluatePrediction(
      { decision: 70, domestic: 40 },
      { decision: 60, domestic: 40 },
      { decision: 70, domestic: 20 },
    );
    expect(summary?.accuracy).toBe(85); // hatalar 10 ve 20 → ort. 15
    expect(summary?.insights.map((i) => [i.dim, i.kind])).toEqual([
      ["decision", "aligned_known"],
      ["domestic", "different_missed"],
    ]);
  });

  it("eksik boyutları atlar, ortak boyut yoksa null döner", () => {
    expect(evaluatePrediction({ a: 50, b: 50 }, { a: 50 }, { a: 50, b: 10 })?.insights).toHaveLength(1);
    expect(evaluatePrediction({ a: 50 }, {}, { a: 50 })).toBeNull();
  });

  it("isabet 0'ın altına düşmez", () => {
    expect(evaluatePrediction({ a: 0 }, { a: 100 }, { a: 0 })?.accuracy).toBe(0);
  });
});

describe("CONVERSATION_PROMPTS", () => {
  it("kayıttaki her testin her boyutu için en az 3 soru içerir", async () => {
    const { TEST_REGISTRY } = await import("./tests/index.js");
    const { CONVERSATION_PROMPTS } = await import("./conversation-prompts.js");
    for (const test of Object.values(TEST_REGISTRY)) {
      for (const dim of Object.keys(test.dimensions)) {
        expect(CONVERSATION_PROMPTS[test.id]?.[dim]?.length ?? 0, `${test.id}.${dim}`).toBeGreaterThanOrEqual(3);
      }
    }
  });
});
