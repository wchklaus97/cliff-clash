import type { HitKind } from "./types";

export type PlatformBounds = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

const LIGHT_BASE = 180;
const HEAVY_BASE = 280;
const CHARGE_BONUS = 220;
const UP_RATIO = 0.85;
const PERCENT_SCALE = 0.018;

export function launchVelocity(opts: {
  percent: number;
  weight: number;
  charge01: number;
  dirX: number;
  kind: HitKind;
}): { vx: number; vy: number } {
  const charge = Math.max(0, Math.min(1, opts.charge01));
  const base = opts.kind === "heavy" ? HEAVY_BASE : LIGHT_BASE;
  const power =
    (base + (opts.kind === "heavy" ? CHARGE_BONUS * charge : 0)) *
    (1 + opts.percent * PERCENT_SCALE) /
    Math.max(0.4, opts.weight);
  const dir = opts.dirX === 0 ? 1 : Math.sign(opts.dirX);
  return { vx: dir * power, vy: -power * UP_RATIO };
}

export function hitStunMs(kind: HitKind, percent: number): number {
  const base = kind === "heavy" ? 180 : 90;
  return Math.min(420, base + percent * 1.2);
}

export function isOffCliff(
  x: number,
  y: number,
  platform: PlatformBounds,
  fallY = 640,
): boolean {
  const offSides = x < platform.left - 8 || x > platform.right + 8;
  const below = y > Math.max(platform.bottom, fallY);
  return below || (offSides && y > platform.top + 24);
}

export function damageForHit(kind: HitKind, charge01: number): number {
  if (kind === "light") return 8;
  return 12 + Math.round(18 * Math.max(0, Math.min(1, charge01)));
}
