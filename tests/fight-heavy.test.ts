import { describe, expect, it } from "vitest";
import { tickPlayerHeavyAttack } from "../src/scenes/playerHeavyInput";

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
