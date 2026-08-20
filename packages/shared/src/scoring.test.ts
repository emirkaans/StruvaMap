import { describe, expect, it } from "vitest";
import { bandOf, computeScores, DEFAULT_THRESHOLDS } from "./scoring.js";
import type { Answers, Dimension, IndexDef, Option, Question, TestDefinition } from "./types.js";

const SCALE: Option[] = [0, 25, 50, 75, 100].map((score, i) => ({ label: `opt${i}`, score }));

function q(id: number, dim: string, extra: Partial<Question> = {}): Question {
  return { id, dim, type: "likert", text: `q${id}`, options: SCALE, ...extra };
}

const dimensions: Record<string, Dimension> = {
  power: {
    id: "power",
    name: "Power",
    short: "short",
    index: "control",
    interpretation: { yüksek: "hi", orta: "mid", düşük: "lo" },
    conditionalNotes: [
      { contextQuestionId: "role", whenValue: "child", band: "düşük", note: "EXTRA_NOTE" },
    ],
  },
  labour: {
    id: "labour",
    name: "Labour",
    short: "short",
    index: "control",
    interpretation: { yüksek: "hi", orta: "mid", düşük: "lo" },
  },
  trust: {
    id: "trust",
    name: "Trust",
    short: "short",
    index: "safety",
    interpretation: { yüksek: "hi", orta: "mid", düşük: "lo" },
  },
};

const indices: Record<string, IndexDef> = {
  control: { id: "control", name: "Control", desc: "d" },
  safety: { id: "safety", name: "Safety", desc: "d" },
};

// power: q0, q1 | labour: q2 | trust: q3, q4 (q4 satisfactionQuestion)
const questions: Question[] = [
  q(0, "power"),
  q(1, "power"),
  q(2, "labour"),
  q(3, "trust"),
  q(4, "trust", { satisfactionQuestion: true }),
];

const test: TestDefinition = {
  id: "fixture",
  slug: "fixture",
  name: "Fixture Test",
  subtitle: "5 soru",
  inviteCta: "Davet et",
  dimensions,
  indices,
  questions,
};

describe("bandOf", () => {
  it("eşik sınırlarını doğru bantlıyor", () => {
    expect(bandOf(74)).toBe("orta");
    expect(bandOf(75)).toBe("yüksek");
    expect(bandOf(54)).toBe("düşük");
    expect(bandOf(55)).toBe("orta");
  });
});

describe("computeScores", () => {
  it("hiç cevap yoksa her şey 0 döner", () => {
    const r = computeScores(test, {});
    expect(r.dimensions).toEqual({ power: 0, labour: 0, trust: 0 });
    expect(r.indices).toEqual({ control: 0, safety: 0 });
    expect(r.rsi).toBe(0);
    expect(r.satisfaction).toBeUndefined();
  });

  it("cevaplanmamış soruyu boyut ortalamasına katmıyor", () => {
    // power: sadece q0 cevaplı (index 4 -> score 100), q1 boş bırakıldı
    const answers: Answers = { 0: 4 };
    const r = computeScores(test, answers);
    expect(r.dimensions.power).toBe(100);
  });

  it("boyut ortalamasını doğru hesaplıyor", () => {
    // power: q0=index4(100), q1=index0(0) -> mean 50
    const answers: Answers = { 0: 4, 1: 0 };
    const r = computeScores(test, answers);
    expect(r.dimensions.power).toBe(50);
  });

  it("endeksleri kendi boyutlarının ortalaması olarak hesaplıyor", () => {
    // control = mean(power, labour); safety = mean(trust)
    const answers: Answers = { 0: 4, 1: 4, 2: 2, 3: 0 }; // power=100, labour=50, trust=0
    const r = computeScores(test, answers);
    expect(r.indices.control).toBe(75); // mean(100,50)
    expect(r.indices.safety).toBe(0);
  });

  it("RSI tüm boyutların ortalaması", () => {
    const answers: Answers = { 0: 4, 1: 4, 2: 4, 3: 4 }; // power=100, labour=100, trust=100
    const r = computeScores(test, answers);
    expect(r.rsi).toBe(100);
  });

  it("satisfactionQuestion hem kendi ortalamasına hem ana boyuta katkı yapar", () => {
    // trust: q3=index2(50), q4=index4(100, satisfaction) -> trust mean=75, satisfaction mean=100
    const answers: Answers = { 3: 2, 4: 4 };
    const r = computeScores(test, answers);
    expect(r.dimensions.trust).toBe(75);
    expect(r.satisfaction).toEqual({ trust: 100 });
  });

  it("strengths eşik üstü boyutları en fazla 3 tane, yüksekten düşüğe sıralı döner", () => {
    // power=100, labour=80, trust=60 (eşik 75 altı) -> sadece power, labour strength
    const answers: Answers = { 0: 4, 1: 4, 2: 3, 3: 2, 4: 3 }; // power=100 labour=75 trust=(50+75)/2=62.5->63
    const r = computeScores(test, answers);
    expect(r.strengths).toEqual(["power", "labour"]);
  });

  it("tensions eşik altı boyutları en düşükten yükseğe sıralı döner", () => {
    // power=0, labour=25, trust=100
    const answers: Answers = { 0: 0, 1: 0, 2: 1, 3: 4, 4: 4 };
    const r = computeScores(test, answers);
    expect(r.tensions).toEqual(["power", "labour"]);
  });

  it("conditionalNotes: context cevabı eşleşince yorum metnine eklenir", () => {
    const answers: Answers = { 0: 0, 1: 0 }; // power=0 -> band "düşük"
    const r = computeScores(test, answers, DEFAULT_THRESHOLDS, { role: "child" });
    const powerInterp = r.interpretation.find((i) => i.dim === "power")!;
    expect(powerInterp.band).toBe("düşük");
    expect(powerInterp.text).toContain("EXTRA_NOTE");
  });

  it("conditionalNotes: context cevabı eşleşmeyince eklenmez", () => {
    const answers: Answers = { 0: 0, 1: 0 };
    const r = computeScores(test, answers, DEFAULT_THRESHOLDS, { role: "parent" });
    const powerInterp = r.interpretation.find((i) => i.dim === "power")!;
    expect(powerInterp.text).not.toContain("EXTRA_NOTE");
  });

  it("geçersiz seçenek indexini (options dışı) sessizce atlar", () => {
    const answers: Answers = { 0: 99 }; // options[99] tanımsız
    const r = computeScores(test, answers);
    expect(r.dimensions.power).toBe(0);
  });
});
