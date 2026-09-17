import Phaser from "phaser";
import { GAME_WIDTH } from "../config";
import {
  damageForHit,
  hitStunMs,
  isOffCliff,
  launchVelocity,
  type PlatformBounds,
} from "../combat";
import { CpuBrain, type CpuInput } from "../cpu";
import { FIGHTERS } from "../fighters";
import type { CpuLevel, FighterId, HitKind } from "../types";

const PLATFORM_WIDTH = 280;
const PLATFORM_HEIGHT = 24;
const PLATFORM_Y = 460;
const BODY_SIZE = 28;
const HEAVY_CHARGE_MAX_MS = 800;
const KO_PAUSE_MS = 400;

type FighterSlot = {
  id: FighterId;
  sprite: Phaser.Physics.Arcade.Sprite;
  percent: number;
  facing: 1 | -1;
  isPlayer: boolean;
  hitStunUntil: number;
  attacking: boolean;
  attackKind: HitKind | null;
  attackCharge: number;
  attackStartedAt: number;
  attackHitbox: Phaser.GameObjects.Rectangle | null;
  attackHitApplied: boolean;
  percentText: Phaser.GameObjects.Text;
};

export class FightScene extends Phaser.Scene {
  private platformBounds!: PlatformBounds;
  private platform!: Phaser.Physics.Arcade.StaticGroup;
  private fighters: FighterSlot[] = [];
  private roundOver = false;
  private cpuLevel: CpuLevel = "easy";
  private cpuBrain!: CpuBrain;
  private cpuIntent: CpuInput = {
    move: 0,
    jump: false,
    light: false,
    heavyHold: false,
  };
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: {
    A: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    W: Phaser.Input.Keyboard.Key;
    J: Phaser.Input.Keyboard.Key;
    K: Phaser.Input.Keyboard.Key;
    SPACE: Phaser.Input.Keyboard.Key;
  };

  constructor() {
    super("FightScene");
  }

  init(data?: { cpuLevel?: CpuLevel }): void {
    this.cpuLevel = data?.cpuLevel ?? "easy";
  }

  create(): void {
    this.physics.world.gravity.y = 1200;
    this.cameras.main.setBackgroundColor("#87ceeb");

    const left = (GAME_WIDTH - PLATFORM_WIDTH) / 2;
    const top = PLATFORM_Y - PLATFORM_HEIGHT / 2;
    this.platformBounds = {
      left,
      right: left + PLATFORM_WIDTH,
      top,
      bottom: top + PLATFORM_HEIGHT,
    };

    const platformSprite = this.add.rectangle(
      left + PLATFORM_WIDTH / 2,
      PLATFORM_Y,
      PLATFORM_WIDTH,
      PLATFORM_HEIGHT,
      0x6b5344,
    );
    this.physics.add.existing(platformSprite, true);
    this.platform = this.physics.add.staticGroup(platformSprite);

    this.spawnFighter("bun", left + 60, top - BODY_SIZE / 2, true);
    this.spawnFighter("mochi", left + PLATFORM_WIDTH - 60, top - BODY_SIZE / 2, false);

    for (const fighter of this.fighters) {
      this.physics.add.collider(fighter.sprite, this.platform);
    }

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys({
      A: Phaser.Input.Keyboard.KeyCodes.A,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      W: Phaser.Input.Keyboard.KeyCodes.W,
      J: Phaser.Input.Keyboard.KeyCodes.J,
      K: Phaser.Input.Keyboard.KeyCodes.K,
      SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
    }) as FightScene["keys"];

    this.cpuBrain = new CpuBrain(this.cpuLevel);
  }

  private spawnFighter(
    id: FighterId,
    x: number,
    y: number,
    isPlayer: boolean,
  ): void {
    const sprite = this.physics.add.sprite(x, y, `fighter-${id}`);
    sprite.setDisplaySize(BODY_SIZE, BODY_SIZE);
    sprite.setCollideWorldBounds(false);
    sprite.setBounce(0);
    sprite.setDrag(800, 0);

    const percentText = this.add
      .text(isPlayer ? 16 : GAME_WIDTH - 16, 16, "0%", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(isPlayer ? 0 : 1, 0);

    this.fighters.push({
      id,
      sprite,
      percent: 0,
      facing: isPlayer ? 1 : -1,
      isPlayer,
      hitStunUntil: 0,
      attacking: false,
      attackKind: null,
      attackCharge: 0,
      attackStartedAt: 0,
      attackHitbox: null,
      attackHitApplied: false,
      percentText,
    });
  }

  update(_time: number, delta: number): void {
    if (this.roundOver) return;

    const now = this.time.now;
    this.tickCpuIntent(now);

    for (const fighter of this.fighters) {
      this.updateFighter(fighter, now, delta);
    }

    this.checkAttackHits(now);
    this.checkKo(now);
  }

  private tickCpuIntent(now: number): void {
    const cpu = this.fighters.find((f) => !f.isPlayer);
    const player = this.fighters.find((f) => f.isPlayer);
    if (!cpu || !player) return;

    const body = cpu.sprite.body as Phaser.Physics.Arcade.Body;
    const grounded =
      body.blocked.down || body.touching.down || body.onFloor();

    this.cpuIntent = this.cpuBrain.tick(now, {
      selfX: cpu.sprite.x,
      foeX: player.sprite.x,
      selfY: cpu.sprite.y,
      foeY: player.sprite.y,
      selfGrounded: grounded,
      foePercent: player.percent,
      level: this.cpuLevel,
      platform: this.platformBounds,
      attacking: cpu.attacking,
    });
  }

  private updateFighter(fighter: FighterSlot, now: number, delta: number): void {
    const def = FIGHTERS[fighter.id];
    const body = fighter.sprite.body as Phaser.Physics.Arcade.Body;
    const grounded =
      body.blocked.down || body.touching.down || body.onFloor();

    if (now < fighter.hitStunUntil) {
      this.updateAttackState(fighter, now, delta, grounded);
      return;
    }

    if (fighter.isPlayer) {
      this.handlePlayerInput(fighter, now, grounded);
    } else {
      this.handleCpuInput(fighter, now, grounded);
    }

    this.updateAttackState(fighter, now, delta, grounded);
    fighter.sprite.setFlipX(fighter.facing < 0);

    if (!fighter.attacking) {
      const moveX = fighter.isPlayer ? this.readMoveX() : this.cpuIntent.move;
      if (moveX !== 0) {
        fighter.facing = moveX > 0 ? 1 : -1;
        fighter.sprite.setVelocityX(moveX * def.speed);
      } else if (now >= fighter.hitStunUntil) {
        fighter.sprite.setVelocityX(0);
      }
    }
  }

  private readMoveX(): number {
    let x = 0;
    if (this.cursors.left?.isDown || this.keys.A.isDown) x -= 1;
    if (this.cursors.right?.isDown || this.keys.D.isDown) x += 1;
    return x;
  }

  private handlePlayerInput(
    fighter: FighterSlot,
    now: number,
    grounded: boolean,
  ): void {
    if (fighter.attacking) return;

    const def = FIGHTERS[fighter.id];
    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.keys.SPACE) ||
      Phaser.Input.Keyboard.JustDown(this.keys.W) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.up!);

    if (jumpPressed && grounded) {
      fighter.sprite.setVelocityY(-def.jump);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.J)) {
      this.startAttack(fighter, "light", 0, now);
      return;
    }

    if (this.keys.K.isDown) {
      if (!fighter.attacking || fighter.attackKind !== "heavy") {
        this.startAttack(fighter, "heavy", 0, now);
      } else {
        const elapsed = now - fighter.attackStartedAt;
        fighter.attackCharge = Math.min(1, elapsed / HEAVY_CHARGE_MAX_MS);
      }
      return;
    }

    if (
      fighter.attacking &&
      fighter.attackKind === "heavy" &&
      Phaser.Input.Keyboard.JustUp(this.keys.K)
    ) {
      fighter.attackCharge = Math.min(
        1,
        (now - fighter.attackStartedAt) / HEAVY_CHARGE_MAX_MS,
      );
      this.spawnAttackHitbox(fighter);
    }
  }

  private handleCpuInput(
    fighter: FighterSlot,
    now: number,
    grounded: boolean,
  ): void {
    const intent = this.cpuIntent;

    if (fighter.attacking) {
      if (
        fighter.attackKind === "heavy" &&
        !intent.heavyHold &&
        !fighter.attackHitbox
      ) {
        fighter.attackCharge = Math.min(
          1,
          (now - fighter.attackStartedAt) / HEAVY_CHARGE_MAX_MS,
        );
        this.spawnAttackHitbox(fighter);
      }
      return;
    }

    const def = FIGHTERS[fighter.id];

    if (intent.jump && grounded) {
      fighter.sprite.setVelocityY(-def.jump);
    }

    if (intent.light) {
      this.startAttack(fighter, "light", 0, now);
      return;
    }

    if (intent.heavyHold) {
      this.startAttack(fighter, "heavy", 0, now);
      this.cpuBrain.notifyHeavyStarted(now);
    }
  }

  private startAttack(
    fighter: FighterSlot,
    kind: HitKind,
    charge: number,
    now: number,
  ): void {
    fighter.attacking = true;
    fighter.attackKind = kind;
    fighter.attackCharge = charge;
    fighter.attackStartedAt = now;
    fighter.attackHitApplied = false;
    fighter.sprite.setVelocityX(0);

    if (kind === "light") {
      this.spawnAttackHitbox(fighter);
    }
  }

  private updateAttackState(
    fighter: FighterSlot,
    now: number,
    delta: number,
    _grounded: boolean,
  ): void {
    if (!fighter.attacking || !fighter.attackKind) return;

    if (fighter.attackKind === "light") {
      const elapsed = now - fighter.attackStartedAt;
      if (elapsed >= 120) {
        this.endAttack(fighter);
      }
      return;
    }

    if (fighter.isPlayer && this.keys.K.isDown) {
      fighter.attackCharge = Math.min(
        1,
        (now - fighter.attackStartedAt) / HEAVY_CHARGE_MAX_MS,
      );
      return;
    }

    if (!fighter.isPlayer && this.cpuIntent.heavyHold) {
      fighter.attackCharge = Math.min(
        1,
        (now - fighter.attackStartedAt) / HEAVY_CHARGE_MAX_MS,
      );
      return;
    }

    if (fighter.attackHitbox && !fighter.attackHitApplied) {
      this.spawnAttackHitbox(fighter);
    }

    const elapsed = now - fighter.attackStartedAt;
    if (elapsed >= HEAVY_CHARGE_MAX_MS + 160) {
      this.endAttack(fighter);
    } else if (fighter.attackHitbox) {
      fighter.attackHitbox.x =
        fighter.sprite.x + fighter.facing * (BODY_SIZE * 0.75);
      fighter.attackHitbox.y = fighter.sprite.y;
    }

    void delta;
  }

  private spawnAttackHitbox(fighter: FighterSlot): void {
    if (!fighter.attackKind) return;

    const w = fighter.attackKind === "light" ? 22 : 28;
    const h = 24;
    const x = fighter.sprite.x + fighter.facing * (BODY_SIZE * 0.75);
    const y = fighter.sprite.y;

    if (fighter.attackHitbox) {
      fighter.attackHitbox.setPosition(x, y);
      fighter.attackHitbox.setSize(w, h);
      fighter.attackHitbox.setVisible(true);
      return;
    }

    fighter.attackHitbox = this.add
      .rectangle(x, y, w, h, 0xff0000, 0.25)
      .setOrigin(0.5);
  }

  private endAttack(fighter: FighterSlot): void {
    fighter.attacking = false;
    fighter.attackKind = null;
    fighter.attackCharge = 0;
    fighter.attackHitApplied = false;
    fighter.attackHitbox?.destroy();
    fighter.attackHitbox = null;
  }

  private checkAttackHits(now: number): void {
    for (const attacker of this.fighters) {
      if (!attacker.attacking || !attacker.attackHitbox || attacker.attackHitApplied) {
        continue;
      }

      for (const victim of this.fighters) {
        if (victim === attacker) continue;
        if (now < victim.hitStunUntil) continue;

        const hb = attacker.attackHitbox.getBounds();
        const vb = victim.sprite.getBounds();
        if (!Phaser.Geom.Rectangle.Overlaps(hb, vb)) continue;

        this.applyHit(attacker, victim, now);
        attacker.attackHitApplied = true;
        break;
      }
    }
  }

  private applyHit(attacker: FighterSlot, victim: FighterSlot, now: number): void {
    const kind = attacker.attackKind ?? "light";
    const charge = kind === "heavy" ? attacker.attackCharge : 0;
    const damage = damageForHit(kind, charge);
    victim.percent += damage;
    victim.percentText.setText(`${Math.round(victim.percent)}%`);

    const def = FIGHTERS[victim.id];
    const dirX = Math.sign(victim.sprite.x - attacker.sprite.x) || attacker.facing;
    const launch = launchVelocity({
      percent: victim.percent,
      weight: def.weight,
      charge01: charge,
      dirX,
      kind,
    });

    victim.sprite.setVelocity(launch.vx, launch.vy);
    victim.hitStunUntil = now + hitStunMs(kind, victim.percent);
    victim.facing = dirX > 0 ? 1 : -1;

    if (kind === "light") {
      this.time.delayedCall(120, () => this.endAttack(attacker));
    } else {
      this.time.delayedCall(160, () => this.endAttack(attacker));
    }
  }

  private checkKo(now: number): void {
    for (const fighter of this.fighters) {
      const { x, y } = fighter.sprite;
      if (!isOffCliff(x, y, this.platformBounds)) continue;

      const winner = this.fighters.find((f) => f !== fighter);
      if (!winner) return;

      this.roundOver = true;
      this.physics.pause();

      console.log(`${FIGHTERS[winner.id].nameEn} wins!`);

      this.time.delayedCall(KO_PAUSE_MS, () => {
        this.add
          .text(GAME_WIDTH / 2, PLATFORM_Y - 80, `${FIGHTERS[winner.id].nameEn} wins!`, {
            fontFamily: "monospace",
            fontSize: "28px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 4,
          })
          .setOrigin(0.5);
      });

      void now;
      return;
    }
  }
}
