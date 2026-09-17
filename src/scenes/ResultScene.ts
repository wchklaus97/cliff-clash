import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config";
import { SFX, fighterTexture, playSfx, playTaunt } from "../audio";
import { FIGHTERS } from "../fighters";
import { renderShareCard, shareOrDownloadPng } from "../share/shareCard";
import { pickTaunt } from "../taunts";
import type { CpuLevel, FighterId } from "../types";

export type ResultSceneData = {
  winnerId: FighterId;
  loserId: FighterId;
  winnerPercent: number;
  loserPercent: number;
  playerId: FighterId;
  cpuId: FighterId;
  cpuLevel: CpuLevel;
};

export class ResultScene extends Phaser.Scene {
  private resultData!: ResultSceneData;
  private taunt = "";

  constructor() {
    super("ResultScene");
  }

  init(data: ResultSceneData): void {
    this.resultData = data;
    this.taunt = pickTaunt(FIGHTERS[data.winnerId].nameZh);
  }

  create(): void {
    const { winnerId, loserId, winnerPercent, loserPercent } = this.resultData;
    const winner = FIGHTERS[winnerId];
    const loser = FIGHTERS[loserId];

    this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "cover")
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setTint(0x665544);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a1424, 0.38);

    this.add
      .image(GAME_WIDTH / 2, 168, fighterTexture(winnerId, "idle"))
      .setDisplaySize(110, 110);

    this.add
      .text(GAME_WIDTH / 2, 36, "崖邊一擊", {
        fontFamily: "sans-serif",
        fontSize: "32px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 88, "KO!", {
        fontFamily: "monospace",
        fontSize: "48px",
        color: "#ff4444",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 248, `${winner.nameZh} 勝！`, {
        fontFamily: "sans-serif",
        fontSize: "28px",
        color: "#ffd700",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    this.add
      .text(
        GAME_WIDTH / 2,
        268,
        `${winner.nameZh} ${Math.round(winnerPercent)}%  ·  ${loser.nameZh} ${Math.round(loserPercent)}%`,
        {
          fontFamily: "monospace",
          fontSize: "16px",
          color: "#cccccc",
        },
      )
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 300, this.taunt, {
        fontFamily: "sans-serif",
        fontSize: "18px",
        color: "#fff8dc",
        wordWrap: { width: GAME_WIDTH - 48 },
        align: "center",
      })
      .setOrigin(0.5, 0);

    const buttonY = GAME_HEIGHT - 180;
    this.makeButton(GAME_WIDTH / 2, buttonY, "再嚟一場", () => this.onReplay());
    this.makeButton(GAME_WIDTH / 2, buttonY + 56, "換角色", () => this.onChange());
    this.makeButton(GAME_WIDTH / 2, buttonY + 112, "分享", () => void this.onShare());

    playSfx(this, SFX.win, { volume: 0.7 });
    this.time.delayedCall(280, () => playTaunt(this, winnerId));
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

  private onReplay(): void {
    const { playerId, cpuId, cpuLevel } = this.resultData;
    this.scene.start("FightScene", { playerId, cpuId, cpuLevel });
  }

  private onChange(): void {
    this.scene.start("SelectScene");
  }

  private async onShare(): Promise<void> {
    const { winnerId, loserId, winnerPercent, loserPercent } = this.resultData;
    const cardData = {
      winnerId,
      loserId,
      winnerPercent,
      loserPercent,
      taunt: this.taunt,
    };
    let blob: Blob | null = null;
    try {
      blob = await renderShareCard(cardData);
      await shareOrDownloadPng(blob);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (!blob) {
        try {
          blob = await renderShareCard(cardData);
        } catch {
          return;
        }
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "cliff-clash-result.png";
      link.click();
      URL.revokeObjectURL(url);
    }
  }
}
