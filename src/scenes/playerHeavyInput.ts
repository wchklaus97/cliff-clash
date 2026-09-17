export const HEAVY_CHARGE_MAX_MS = 800;
export const HEAVY_STRIKE_MS = 160;

/** Whiff recovery ends this many ms after heavy hitbox spawn / release. */
export function shouldEndHeavyStrike(opts: {
  attackReleasedAt: number;
  now: number;
}): boolean {
  return (
    opts.attackReleasedAt > 0 &&
    opts.now - opts.attackReleasedAt >= HEAVY_STRIKE_MS
  );
}

export type PlayerHeavyAttackTick = {
  spawnHitbox: boolean;
  charge: number;
};

/** Player heavy while `attacking`: charge while held, spawn hitbox on release. */
export function tickPlayerHeavyAttack(opts: {
  attackStartedAt: number;
  now: number;
  heavyHeld: boolean;
  hasHitbox: boolean;
}): PlayerHeavyAttackTick | null {
  const charge = Math.min(
    1,
    (opts.now - opts.attackStartedAt) / HEAVY_CHARGE_MAX_MS,
  );

  if (opts.heavyHeld) {
    return { spawnHitbox: false, charge };
  }

  if (!opts.hasHitbox) {
    return { spawnHitbox: true, charge };
  }

  return null;
}
