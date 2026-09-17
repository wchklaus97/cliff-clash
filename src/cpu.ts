import type { PlatformBounds } from "./combat";
import type { CpuLevel } from "./types";

export type CpuInput = {
  move: -1 | 0 | 1;
  jump: boolean;
  light: boolean;
  heavyHold: boolean;
};

export type CpuSnapshot = {
  selfX: number;
  foeX: number;
  selfY: number;
  foeY: number;
  selfGrounded: boolean;
  foePercent: number;
  level: CpuLevel;
  platform: PlatformBounds;
  attacking: boolean;
};

const EDGE_MARGIN = 22;
const ATTACK_RANGE = 44;
const FOE_ABOVE_THRESHOLD = 28;

export class CpuBrain {
  private readonly level: CpuLevel;
  private readonly rng: () => number;
  private nextDecisionAt = 0;
  private move: -1 | 0 | 1 = 0;
  private heavyHold = false;
  private heavyTargetMs = 0;
  private heavyStartedAt = 0;
  private pendingJump = false;
  private pendingLight = false;

  constructor(level: CpuLevel, rng: () => number = Math.random) {
    this.level = level;
    this.rng = rng;
  }

  tick(now: number, snap: CpuSnapshot): CpuInput {
    if (this.heavyHold && this.heavyStartedAt > 0) {
      const elapsed = now - this.heavyStartedAt;
      if (elapsed >= this.heavyTargetMs) {
        this.heavyHold = false;
        this.heavyStartedAt = 0;
      }
    }

    if (now >= this.nextDecisionAt && !this.isHeavyCharging()) {
      this.decide(snap);
      this.nextDecisionAt = now + this.decisionDelay();
    }

    const jump = this.pendingJump;
    const light = this.pendingLight;
    this.pendingJump = false;
    this.pendingLight = false;

    return {
      move: this.clampMoveToPlatform(snap.selfX, this.move, snap.platform),
      jump,
      light,
      heavyHold: this.heavyHold,
    };
  }

  notifyHeavyStarted(now: number): void {
    this.heavyStartedAt = now;
  }

  private isHeavyCharging(): boolean {
    return this.heavyHold && this.heavyStartedAt > 0;
  }

  private decisionDelay(): number {
    if (this.level === "easy") {
      return 350 + this.rng() * 200;
    }
    return 120 + this.rng() * 100;
  }

  private decide(snap: CpuSnapshot): void {
    if (!this.isHeavyCharging()) {
      this.heavyHold = false;
    }

    const toward = Math.sign(snap.foeX - snap.selfX) as -1 | 0 | 1;
    const dist = Math.abs(snap.foeX - snap.selfX);
    const inRange = dist <= ATTACK_RANGE;

    if (this.level === "easy") {
      this.decideEasy(snap, toward, inRange);
      return;
    }

    this.decideNormal(snap, toward, inRange);
  }

  private decideEasy(
    snap: CpuSnapshot,
    toward: -1 | 0 | 1,
    inRange: boolean,
  ): void {
    if (this.rng() < 0.45) {
      this.move = toward === 0 ? 0 : (-toward as -1 | 1);
    } else if (this.rng() < 0.25) {
      this.move = 0;
    } else {
      this.move = toward;
    }

    if (snap.selfGrounded && this.rng() < 0.08) {
      this.pendingJump = true;
    }

    if (inRange && this.rng() < 0.35) {
      this.pendingLight = true;
    }
  }

  private decideNormal(
    snap: CpuSnapshot,
    toward: -1 | 0 | 1,
    inRange: boolean,
  ): void {
    this.move = toward;

    const foeAbove = snap.foeY < snap.selfY - FOE_ABOVE_THRESHOLD;
    if (snap.selfGrounded && foeAbove && this.rng() < 0.55) {
      this.pendingJump = true;
    }

    if (inRange) {
      if (this.rng() < 0.42) {
        this.pendingLight = true;
      } else if (!snap.attacking && this.rng() < 0.55) {
        this.heavyHold = true;
        this.heavyTargetMs = 400 + this.rng() * 400;
        this.heavyStartedAt = 0;
      }
    } else if (distCloseEnough(snap) && this.rng() < 0.2) {
      this.pendingLight = true;
    }
  }

  private clampMoveToPlatform(
    selfX: number,
    move: -1 | 0 | 1,
    platform: PlatformBounds,
  ): -1 | 0 | 1 {
    if (move === 0) return 0;

    const nearLeft = selfX <= platform.left + EDGE_MARGIN;
    const nearRight = selfX >= platform.right - EDGE_MARGIN;

    if (move < 0 && nearLeft) return 0;
    if (move > 0 && nearRight) return 0;
    return move;
  }
}

function distCloseEnough(snap: CpuSnapshot): boolean {
  return Math.abs(snap.foeX - snap.selfX) <= ATTACK_RANGE + 18;
}
