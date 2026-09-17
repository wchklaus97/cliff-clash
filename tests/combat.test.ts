import { describe, expect, it } from "vitest";
import { isOffCliff, launchVelocity } from "../src/combat";

const PLATFORM = { left: 40, right: 350, top: 420, bottom: 460 };

describe("launchVelocity", () => {
  it("heavier fighter launches slower at same percent", () => {
    const light = launchVelocity({
      percent: 80,
      weight: 0.72,
      charge01: 1,
      dirX: 1,
      kind: "heavy",
    });
    const heavy = launchVelocity({
      percent: 80,
      weight: 1.35,
      charge01: 1,
      dirX: 1,
      kind: "heavy",
    });
    expect(Math.abs(light.vx)).toBeGreaterThan(Math.abs(heavy.vx));
    expect(Math.abs(light.vy)).toBeGreaterThan(Math.abs(heavy.vy));
  });

  it("charged heavy is stronger than light", () => {
    const light = launchVelocity({
      percent: 50,
      weight: 1,
      charge01: 0,
      dirX: 1,
      kind: "light",
    });
    const charged = launchVelocity({
      percent: 50,
      weight: 1,
      charge01: 1,
      dirX: 1,
      kind: "heavy",
    });
    expect(Math.hypot(charged.vx, charged.vy)).toBeGreaterThan(
      Math.hypot(light.vx, light.vy),
    );
  });

  it("respects hit direction", () => {
    const left = launchVelocity({
      percent: 40,
      weight: 1,
      charge01: 0.5,
      dirX: -1,
      kind: "light",
    });
    expect(left.vx).toBeLessThan(0);
  });
});

describe("isOffCliff", () => {
  it("on platform is not KO", () => {
    expect(isOffCliff(195, 430, PLATFORM)).toBe(false);
  });

  it("below and beside platform is KO", () => {
    expect(isOffCliff(10, 620, PLATFORM)).toBe(true);
    expect(isOffCliff(380, 620, PLATFORM)).toBe(true);
  });
});
