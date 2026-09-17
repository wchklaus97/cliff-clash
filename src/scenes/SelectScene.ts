import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config";
import { SFX, fighterTexture, playSfx } from "../audio";
import { FIGHTERS } from "../fighters";
import type { CpuLevel, FighterId } from "../types";

const FIGHTER_IDS: FighterId[] = ["bun", "mochi", "bean"];

function otherFighterId(playerId: FighterId, cpuId: FighterId): FighterId {
  if (cpuId !== playerId) {
    return cpuId;
  }
  const index = FIGHTER_IDS.indexOf(playerId);
  return FIGHTER_IDS[(index + 1) % FIGHTER_IDS.length]!;
}

export class SelectScene extends Phaser.Scene {
  private playerId: FighterId = "bun";
  private cpuId: FighterId = "mochi";
  private cpuLevel: CpuLevel = "easy";
  private cardBgs: Phaser.GameObjects.Rectangle[] = [];
  private easyBg!: Phaser.GameObjects.Rectangle;
  private normalBg!: Phaser.GameObjects.Rectangle;

  constructor() {
    super("SelectScene");
  }

  create(): void {
    this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "cover")
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setAlpha(0.28);
    this.cameras.main.setBackgroundColor("#1a1a2e");

    this.add
      .text(GAME_WIDTH / 2, 40, "選角色", {
        fontFamily: "sans-serif",
        fontSize: "28px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 72, "Choose Fighter", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#aaaaaa",
      })
      .setOrigin(0.5);

    this.cardBgs = [];
    const cardWidth = 100;
    const cardGap = 16;
    const totalWidth = FIGHTER_IDS.length * cardWidth + (FIGHTER_IDS.length - 1) * cardGap;
    const startX = (GAME_WIDTH - totalWidth) / 2 + cardWidth / 2;

    FIGHTER_IDS.forEach((id, index) => {
      const x = startX + index * (cardWidth + cardGap);
      const y = 196;
      this.makeFighterCard(id, x, y, cardWidth);
    });

    this.add
      .text(GAME_WIDTH / 2, 360, "CPU 難度", {
        fontFamily: "sans-serif",
        fontSize: "18px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const toggleY = 410;
    const toggleGap = 12;
    this.easyBg = this.makeToggleButton(
      GAME_WIDTH / 2 - 80 - toggleGap / 2,
      toggleY,
      "Easy",
      () => this.setCpuLevel("easy"),
    );
    this.normalBg = this.makeToggleButton(
      GAME_WIDTH / 2 + 80 + toggleGap / 2,
      toggleY,
      "Normal",
      () => this.setCpuLevel("normal"),
    );

    this.updateCpuToggle();

    this.makeButton(GAME_WIDTH / 2, GAME_HEIGHT - 120, "Fight", () => {
      playSfx(this, SFX.play);
      this.scene.start("FightScene", {
        playerId: this.playerId,
        cpuId: this.cpuId,
        cpuLevel: this.cpuLevel,
      });
    });

    this.updateCardHighlights();
    this.time.delayedCall(220, () => playSfx(this, SFX.selectVo, { volume: 0.85 }));
  }

  private makeFighterCard(
    id: FighterId,
    x: number,
    y: number,
    width: number,
  ): void {
    const fighter = FIGHTERS[id];
    const height = 148;

    const bg = this.add
      .rectangle(x, y, width, height, 0x2d3748, 1)
      .setStrokeStyle(2, 0x718096);
    this.cardBgs.push(bg);

    this.add
      .image(x, y - 28, fighterTexture(id, "idle"))
      .setDisplaySize(72, 72);

    this.add
      .text(x, y + 24, fighter.nameZh, {
        fontFamily: "sans-serif",
        fontSize: "18px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.add
      .text(x, y + 48, fighter.roleZh, {
        fontFamily: "sans-serif",
        fontSize: "11px",
        color: "#f4d27a",
      })
      .setOrigin(0.5);

    this.add
      .text(x, y + 64, fighter.nameEn, {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#aaaaaa",
      })
      .setOrigin(0.5);

    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerdown", () => this.selectPlayer(id));
  }

  private selectPlayer(id: FighterId): void {
    this.playerId = id;
    this.cpuId = otherFighterId(this.playerId, this.cpuId);
    this.updateCardHighlights();
  }

  private updateCardHighlights(): void {
    FIGHTER_IDS.forEach((id, index) => {
      const bg = this.cardBgs[index]!;
      const selected = id === this.playerId;
      bg.setFillStyle(selected ? 0x4a5568 : 0x2d3748);
      bg.setStrokeStyle(2, selected ? 0xffd700 : 0x718096);
    });
  }

  private setCpuLevel(level: CpuLevel): void {
    this.cpuLevel = level;
    this.updateCpuToggle();
  }

  private updateCpuToggle(): void {
    const easySelected = this.cpuLevel === "easy";
    this.easyBg.setFillStyle(easySelected ? 0x4a5568 : 0x2d3748);
    this.easyBg.setStrokeStyle(2, easySelected ? 0xffd700 : 0x718096);
    this.normalBg.setFillStyle(easySelected ? 0x2d3748 : 0x4a5568);
    this.normalBg.setStrokeStyle(2, easySelected ? 0x718096 : 0xffd700);
  }

  private makeToggleButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
  ): Phaser.GameObjects.Rectangle {
    const bg = this.add
      .rectangle(x, y, 160, 40, 0x2d3748, 1)
      .setStrokeStyle(2, 0x718096);
    this.add
      .text(x, y, label, {
        fontFamily: "sans-serif",
        fontSize: "16px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerover", () => {
      if (
        (label === "Easy" && this.cpuLevel !== "easy") ||
        (label === "Normal" && this.cpuLevel !== "normal")
      ) {
        bg.setFillStyle(0x374151);
      }
    });
    bg.on("pointerout", () => this.updateCpuToggle());
    bg.on("pointerdown", onClick);
    return bg;
  }

  private makeButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
  ): Phaser.GameObjects.Container {
    const bg = this.add
      .rectangle(0, 0, 200, 44, 0x4a5568, 1)
      .setStrokeStyle(2, 0xffffff);
    const text = this.add
      .text(0, 0, label, {
        fontFamily: "sans-serif",
        fontSize: "18px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const container = this.add.container(x, y, [bg, text]);
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerover", () => bg.setFillStyle(0x718096));
    bg.on("pointerout", () => bg.setFillStyle(0x4a5568));
    bg.on("pointerdown", () => {
      playSfx(this, SFX.click);
      onClick();
    });
    return container;
  }
}
