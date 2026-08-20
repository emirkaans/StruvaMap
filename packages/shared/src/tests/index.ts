import type { TestDefinition } from "../types.js";
import { romanticTest } from "./romantic.js";
import { friendshipTest } from "./friendship.js";
import { workTest } from "./work.js";
import { familyTest } from "./family.js";
import { roommateTest } from "./roommate.js";

export const TEST_REGISTRY: Record<string, TestDefinition> = {
  [romanticTest.id]: romanticTest,
  [friendshipTest.id]: friendshipTest,
  [familyTest.id]: familyTest,
  [roommateTest.id]: roommateTest,
  [workTest.id]: workTest,
};

export function getTestById(id: string): TestDefinition | undefined {
  return TEST_REGISTRY[id];
}

export { romanticTest, friendshipTest, workTest, familyTest, roommateTest };
