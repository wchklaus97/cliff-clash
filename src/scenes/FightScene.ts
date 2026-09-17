import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";
import {
  damageForHit,
  hitStunMs,
  isOffCliff,
  launchVelocity,
  type PlatformBounds,
} from "../combat";
import { CpuBrain, type CpuInput } from "../cpu";
import { FIGHTERS } from "../fighters";
import { VirtualPad } from "../input/VirtualPad";
import type { CpuLevel, FighterId, HitKind } from "../types";
import { SFX, fighterTexture, playSfx } from "../audio";
import {
  HEAVY_CHARGE_MAX_MS,
  shouldEndHeavyStrike,
  tickPlayerHeavyAttack,
} from "./playerHeavyInput";

const PLATFORM_WIDTH = 300;
const PLATFORM_HEIGHT = 28;
const PLATFORM_Y = 508;
const BODY_SIZE = 32;
const SPRITE_DISPLAY = 78;
const KO_PAUSE_MS = 520;

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
  attackReleasedAt: number;
  attackHitbox: Phaser.GameObjects.Rectangle | null;
  attackHitApplied: boolean;
  percentText: Phaser.GameObjects.Text;
  prevGrounded: boolean;
};

export class FightScene extends Phaser.Scene {
  private platformBounds!: PlatformBounds;
  private platform!: Phaser.Physics.Arcade.StaticGroup;
  private fighters: FighterSlot[] = [];
  private roundOver = false;
  private playerId: FighterId = "bun";
  private cpuId: FighterId = "mochi";
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
  private virtualPad!: VirtualPad;

  constructor() {
    super("FightScene");
  }

  init(data?: {
    playerId?: FighterId;
    cpuId?: FighterId;
    cpuLevel?: CpuLevel;
  }): void {
    this.playerId = data?.playerId ?? "bun";
    this.cpuId = data?.cpuId ?? "mochi";
    this.cpuLevel = data?.cpuLevel ?? "easy";
  }

  create(): void {
    this.fighters = [];
    this.roundOver = false;
    this.physics.world.gravity.y = 1200;
    this.cameras.main.setBackgroundColor("#1a1424");
    this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "stage")
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(-20);

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
      0x3d2b1f,
      0,
    );
    this.physics.add.existing(platformSprite, true);
    this.platform = this.physics.add.staticGroup(platformSprite);
    playSfx(this, SFX.wind, { loop: true, volume: 0.22 });

    this.spawnFighter(this.playerId, left + 60, top - BODY_SIZE / 2, true);
    this.spawnFighter(
      this.cpuId,
      left + PLATFORM_WIDTH - 60,
      top - BODY_SIZE / 2,
      false,
    );

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
    this.virtualPad = new VirtualPad(this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.virtualPad.destroy();
      this.sound.stopByKey(SFX.wind);
      this.sound.stopByKey(SFX.theme);
    });
  }

  private spawnFighter(
    id: FighterId,
    x: number,
    y: number,
    isPlayer: boolean,
  ): void {
    const sprite = this.physics.add.sprite(x, y, fighterTexture(id, "idle"));
    sprite.setDisplaySize(SPRITE_DISPLAY, SPRITE_DISPLAY);
    sprite.setOrigin(0.5, 0.82);
    sprite.setCollideWorldBounds(false);
    sprite.setBounce(0);
    sprite.setDrag(800, 0);
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(BODY_SIZE, BODY_SIZE);
    body.setOffset(
      (sprite.width - BODY_SIZE) / 2,
      sprite.height * 0.82 - BODY_SIZE,
    );
    this.tweens.add({
      targets: sprite,
      scaleY: sprite.scaleY * 1.06,
      yoyo: true,
      duration: 420,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const percentText = this.add
      .text(isPlayer ? 16 : GAME_WIDTH - 16, 16, "0%", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(isPlayer ? 0 : 1, 0);

    const def = FIGHTERS[id];
    this.add
      .text(isPlayer ? 16 : GAME_WIDTH - 16, 40, `${def.nameZh} ${def.roleZh}`, {
        fontFamily: "sans-serif",
        fontSize: "13px",
        color: "#fff4d6",
        stroke: "#1a120c",
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
      attackReleasedAt: 0,
      attackHitbox: null,
      attackHitApplied: false,
      percentText,
      prevGrounded: true,
    });
  }

  update(_time: number, delta: number): void {
    if (this.roundOver) return;

    const now = this.time.now;
    this.virtualPad.frameTick();
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

    if (!fighter.prevGrounded && grounded) {
      playSfx(this, SFX.land, { volume: 0.45 });
    }
    fighter.prevGrounded = grounded;

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
    if (
      this.cursors.left?.isDown ||
      this.keys.A.isDown ||
      this.virtualPad.isLeftDown()
    ) {
      x -= 1;
    }
    if (
      this.cursors.right?.isDown ||
      this.keys.D.isDown ||
      this.virtualPad.isRightDown()
    ) {
      x += 1;
    }
    return x;
  }

  private handlePlayerInput(
    fighter: FighterSlot,
    now: number,
    grounded: boolean,
  ): void {
    const heavyHeld = this.keys.K.isDown || this.virtualPad.isHeavyDown();

    if (fighter.attacking) {
      if (fighter.attackKind === "heavy") {
        const tick = tickPlayerHeavyAttack({
          attackStartedAt: fighter.attackStartedAt,
          now,
          heavyHeld,
          hasHitbox: !!fighter.attackHitbox,
        });
        if (tick) {
          fighter.attackCharge = tick.charge;
          if (tick.spawnHitbox) {
            this.spawnAttackHitbox(fighter, now);
          }
        }
      }
      return;
    }

    const def = FIGHTERS[fighter.id];
    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.keys.SPACE) ||
      Phaser.Input.Keyboard.JustDown(this.keys.W) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.up!) ||
      this.virtualPad.consumeJump();

    if (jumpPressed && grounded) {
      fighter.sprite.setVelocityY(-def.jump);
      playSfx(this, SFX.jump, { volume: 0.7 });
    }

    if (
      Phaser.Input.Keyboard.JustDown(this.keys.J) ||
      this.virtualPad.consumeLight()
    ) {
      this.startAttack(fighter, "light", 0, now);
      return;
    }

    if (heavyHeld) {
      this.startAttack(fighter, "heavy", 0, now);
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
        this.spawnAttackHitbox(fighter, now);
      }
      return;
    }

    const def = FIGHTERS[fighter.id];

    if (intent.jump && grounded) {
      fighter.sprite.setVelocityY(-def.jump);
      playSfx(this, SFX.jump, { volume: 0.55 });
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
    fighter.attackReleasedAt = 0;
    fighter.attackHitApplied = false;
    fighter.sprite.setVelocityX(0);

    if (kind === "light") {
      playSfx(this, SFX.light);
      this.setPose(fighter, "light");
      this.spawnAttackHitbox(fighter, now);
    } else {
      playSfx(this, SFX.heavyCharge, { volume: 0.55 });
      this.setPose(fighter, "heavy");
    }
  }

  private setPose(fighter: FighterSlot, pose: "idle" | "light" | "heavy" | "ko"): void {
    const key = fighterTexture(fighter.id, pose);
    if (this.textures.exists(key)) {
      fighter.sprite.setTexture(key);
      fighter.sprite.setDisplaySize(SPRITE_DISPLAY, SPRITE_DISPLAY);
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

    if (
      fighter.isPlayer &&
      (this.keys.K.isDown || this.virtualPad.isHeavyDown())
    ) {
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

    if (fighter.attackHitbox) {
      if (
        shouldEndHeavyStrike({
          attackReleasedAt: fighter.attackReleasedAt,
          now,
        })
      ) {
        this.endAttack(fighter);
      } else {
        fighter.attackHitbox.x =
          fighter.sprite.x + fighter.facing * (BODY_SIZE * 0.75);
        fighter.attackHitbox.y = fighter.sprite.y;
      }
    }

    void delta;
  }

  private spawnAttackHitbox(fighter: FighterSlot, now: number): void {
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
      .rectangle(x, y, w, h, 0xffee88, 0)
      .setOrigin(0.5);

    if (fighter.attackKind === "heavy") {
      fighter.attackReleasedAt = now;
    }
  }

  private endAttack(fighter: FighterSlot): void {
    fighter.attacking = false;
    fighter.attackKind = null;
    fighter.attackCharge = 0;
    fighter.attackReleasedAt = 0;
    fighter.attackHitApplied = false;
    fighter.attackHitbox?.destroy();
    fighter.attackHitbox = null;
    this.setPose(fighter, "idle");
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
    victim.sprite.setTint(0xffffff);
    this.time.delayedCall(70, () => victim.sprite.clearTint());
    this.cameras.main.shake(kind === "heavy" ? 140 : 60, kind === "heavy" ? 0.01 : 0.004);
    playSfx(this, kind === "heavy" ? SFX.heavyHit : SFX.light, { volume: 0.85 });
    playSfx(this, SFX.whoosh, { volume: 0.4 });
    this.burstVfx(victim.sprite.x, victim.sprite.y - 10, "vfx-hit", kind === "heavy" ? 72 : 48);
    this.floatDamage(victim.sprite.x, victim.sprite.y - 36, damage);
    this.hitStop();
    this.setPose(victim, "ko");
    this.time.delayedCall(220, () => {
      if (!this.roundOver) this.setPose(victim, "idle");
    });

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
      this.setPose(fighter, "ko");
      playSfx(this, SFX.ko, { volume: 0.95 });
      playSfx(this, SFX.koVo, { volume: 0.9 });
      this.burstVfx(fighter.sprite.x, fighter.sprite.y, "vfx-ko", 96);
      this.cameras.main.shake(220, 0.014);

      this.time.delayedCall(KO_PAUSE_MS, () => {
        this.scene.start("ResultScene", {
          winnerId: winner.id,
          loserId: fighter.id,
          winnerPercent: winner.percent,
          loserPercent: fighter.percent,
          playerId: this.playerId,
          cpuId: this.cpuId,
          cpuLevel: this.cpuLevel,
        });
      });

      void now;
      return;
    }
  }

  private burstVfx(x: number, y: number, key: string, size: number): void {
    if (!this.textures.exists(key)) return;
    const img = this.add.image(x, y, key).setDisplaySize(size, size).setDepth(12);
    this.tweens.add({
      targets: img,
      alpha: 0,
      scale: img.scale * 1.4,
      duration: 260,
      onComplete: () => img.destroy(),
    });
  }

  private floatDamage(x: number, y: number, damage: number): void {
    const pop = this.add
      .text(x, y, `+${Math.round(damage)}`, {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#ffe566",
        stroke: "#1a120c",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(14);
    this.tweens.add({
      targets: pop,
      y: y - 44,
      alpha: 0,
      duration: 520,
      onComplete: () => pop.destroy(),
    });
  }

  private hitStop(): void {
    if (this.roundOver) return;
    this.physics.world.pause();
    this.time.delayedCall(42, () => {
      if (!this.roundOver) this.physics.world.resume();
    });
  }
}
