import { describe, expect, it } from "vitest";
import { pickTaunt } from "../src/taunts";

const WINNER_NAMES = ["包子", "糯米", "豆豆"] as const;
const REQUIRED_FRAGMENT = "唔打到你飛落山就唔叫";

describe("pickTaunt", () => {
  it("always includes the mandatory KO line and winner name", () => {
    for (const name of WINNER_NAMES) {
      for (let i = 0; i < 50; i++) {
        const taunt = pickTaunt(name);
        expect(taunt).toContain(REQUIRED_FRAGMENT);
        expect(taunt).toContain(name);
      }
    }
  });
});
