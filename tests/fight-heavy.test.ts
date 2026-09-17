import { describe, expect, it } from "vitest";
import {
  HEAVY_CHARGE_MAX_MS,
  HEAVY_STRIKE_MS,
  shouldEndHeavyStrike,
  tickPlayerHeavyAttack,
} from "../src/scenes/playerHeavyInput";

describe("player heavy charge release", () => {
  it("updates charge while K/HV is held", () => {
    const tick = tickPlayerHeavyAttack({
      attackStartedAt: 0,
      now: 400,
      heavyHeld: true,
      hasHitbox: false,
    });
    expect(tick).toEqual({ spawnHitbox: false, charge: 0.5 });
  });

  it("spawns hitbox when K/HV is released before hitbox exists", () => {
    const tick = tickPlayerHeavyAttack({
      attackStartedAt: 0,
      now: 400,
      heavyHeld: false,
      hasHitbox: false,
    });
    expect(tick).toEqual({ spawnHitbox: true, charge: 0.5 });
  });

  it("does nothing once hitbox already spawned", () => {
    expect(
      tickPlayerHeavyAttack({
        attackStartedAt: 0,
        now: 400,
        heavyHeld: false,
        hasHitbox: true,
      }),
    ).toBeNull();
  });
});

describe("heavy whiff recovery from release", () => {
  it("ends ~160ms after hitbox spawn, not charge start", () => {
    const tapReleaseAt = 50;
    expect(
      shouldEndHeavyStrike({ attackReleasedAt: tapReleaseAt, now: tapReleaseAt + HEAVY_STRIKE_MS - 1 }),
    ).toBe(false);
    expect(
      shouldEndHeavyStrike({ attackReleasedAt: tapReleaseAt, now: tapReleaseAt + HEAVY_STRIKE_MS }),
    ).toBe(true);
    expect(tapReleaseAt + HEAVY_STRIKE_MS).toBeLessThan(
      HEAVY_CHARGE_MAX_MS + HEAVY_STRIKE_MS,
    );
  });

  it("fully charged heavy also recovers 160ms after release", () => {
    const fullChargeReleaseAt = HEAVY_CHARGE_MAX_MS;
    expect(
      shouldEndHeavyStrike({
        attackReleasedAt: fullChargeReleaseAt,
        now: fullChargeReleaseAt + HEAVY_STRIKE_MS - 1,
      }),
    ).toBe(false);
    expect(
      shouldEndHeavyStrike({
        attackReleasedAt: fullChargeReleaseAt,
        now: fullChargeReleaseAt + HEAVY_STRIKE_MS,
      }),
    ).toBe(true);
  });
});
