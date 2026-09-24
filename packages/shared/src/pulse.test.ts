import { describe, expect, it } from "vitest";
import { PULSE_GAP_THRESHOLD, summarizePulseWeek, type PulseHistoryEntry } from "./pulse.js";

function entry(date: string, myAnswer: number | null, partnerAnswer: number | null, questionKey = "romantic-1"): PulseHistoryEntry {
  return { date, questionKey, myAnswer, partnerAnswer };
}

describe("summarizePulseWeek", () => {
  it("boş hafta için sıfır/null özet döner", () => {
    expect(summarizePulseWeek("romantic", [])).toEqual({
      answeredDays: 0,
      bothAnsweredDays: 0,
      myAverage: null,
      partnerAverage: null,
      gapDays: 0,
      lowest: null,
    });
  });

  it("ortalamaları tek taraflı günleri de sayarak, 1 ondalıkla hesaplar", () => {
    const summary = summarizePulseWeek("romantic", [
      entry("2026-09-20", 4, null),
      entry("2026-09-21", 3, 5),
      entry("2026-09-22", null, 2),
      entry("2026-09-23", 4, 4),
    ]);
    expect(summary.answeredDays).toBe(3);
    expect(summary.bothAnsweredDays).toBe(2);
    expect(summary.myAverage).toBe(3.7);
    expect(summary.partnerAverage).toBe(3.7);
  });

  it("eşik ve üstü farkı olan günleri algı farkı sayar", () => {
    const summary = summarizePulseWeek("romantic", [
      entry("2026-09-20", 1, 1 + PULSE_GAP_THRESHOLD),
      entry("2026-09-21", 3, 3 + PULSE_GAP_THRESHOLD - 1),
      entry("2026-09-22", 5, 1),
      entry("2026-09-23", 5, null),
    ]);
    expect(summary.gapDays).toBe(2);
  });

  it("en düşük ortak günü soru metniyle döner, eşitlikte en yeni günü seçer", () => {
    const summary = summarizePulseWeek("romantic", [
      entry("2026-09-20", 2, 2, "romantic-1"),
      entry("2026-09-22", 1, 3, "romantic-4"),
      entry("2026-09-23", 1, 1, "romantic-6"),
      entry("2026-09-24", 1, null, "romantic-2"),
    ]);
    expect(summary.lowest).toEqual({ date: "2026-09-23", questionText: "Bugün bir konuda gerginlik oldu mu?", average: 1 });

    const tie = summarizePulseWeek("romantic", [
      entry("2026-09-20", 2, 2, "romantic-1"),
      entry("2026-09-22", 1, 3, "romantic-4"),
    ]);
    expect(tie.lowest?.date).toBe("2026-09-22");
    expect(tie.lowest?.questionText).toBe("Bugün duyulduğunu hissettin mi?");
  });

  it("bilinmeyen soru anahtarında varsayılan metne düşer", () => {
    const summary = summarizePulseWeek("romantic", [entry("2026-09-20", 2, 2, "default")]);
    expect(summary.lowest?.questionText).toBe("Bugün nasıl geçti?");
  });
});
