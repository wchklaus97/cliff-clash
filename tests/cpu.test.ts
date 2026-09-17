import { describe, expect, it } from "vitest";
import { CpuBrain, type CpuSnapshot } from "../src/cpu";

const PLATFORM = { left: 55, right: 335, top: 448, bottom: 472 };

function baseSnap(overrides: Partial<CpuSnapshot> = {}): CpuSnapshot {
  return {
    selfX: 250,
    foeX: 220,
    selfY: 430,
    foeY: 430,
    selfGrounded: true,
    foePercent: 0,
    level: "normal",
    platform: PLATFORM,
    attacking: false,
    ...overrides,
  };
}

describe("CpuBrain pending heavy", () => {
  it("does not stall decisions while heavy is pending", () => {
    // skip light (0.5), pick heavy (0.1), delay 0, pick light (0.1)
    const rngValues = [0.5, 0.1, 0, 0.1];
    let i = 0;
    const rng = () => rngValues[i++] ?? 0;

    const brain = new CpuBrain("normal", rng);
    const pending = brain.tick(0, baseSnap());
    expect(pending.heavyHold).toBe(true);

    const afterDelay = brain.tick(150, baseSnap());
    expect(afterDelay.heavyHold).toBe(false);
    expect(afterDelay.light).toBe(true);
  });

  it("keeps heavyHold through charge until target duration", () => {
    const rngValues = [0.5, 0.1, 0, 500];
    let i = 0;
    const rng = () => rngValues[i++] ?? 0;

    const brain = new CpuBrain("normal", rng);
    const pending = brain.tick(0, baseSnap());
    expect(pending.heavyHold).toBe(true);

    brain.notifyHeavyStarted(100);

    const midCharge = brain.tick(200, baseSnap());
    expect(midCharge.heavyHold).toBe(true);

    const released = brain.tick(700, baseSnap());
    expect(released.heavyHold).toBe(false);
  });

  it("does not queue heavy while already attacking", () => {
    const rngValues = [0.5, 0.1];
    let i = 0;
    const rng = () => rngValues[i++] ?? 0;

    const brain = new CpuBrain("normal", rng);
    const intent = brain.tick(0, baseSnap({ attacking: true }));

    expect(intent.heavyHold).toBe(false);
  });
});
