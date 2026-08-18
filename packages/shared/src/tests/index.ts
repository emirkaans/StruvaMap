// Test kayıt defteri. Yeni test türü eklerken (iş, aile, arkadaşlık ilişkileri):
// 1) bu klasöre yeni bir dosya ekle (work.ts, family.ts, friendship.ts ...)
// 2) TestDefinition örneğini burada TEST_REGISTRY'e ekle.
// scoring.ts ve tüm apps katmanı otomatik olarak destekler; kod değişikliği gerekmez.

import type { TestDefinition } from "../types.js";
import { romanticTest } from "./romantic.js";
import { friendshipTest } from "./friendship.js";

export const TEST_REGISTRY: Record<string, TestDefinition> = {
  [romanticTest.id]: romanticTest,
  [friendshipTest.id]: friendshipTest,
};

export function getTestById(id: string): TestDefinition | undefined {
  return TEST_REGISTRY[id];
}

export { romanticTest, friendshipTest };
