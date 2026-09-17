import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config";
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

    this.cameras.main.setBackgroundColor("#1a1a2e");

    this.add
      .text(GAME_WIDTH / 2, 56, "崖邊一擊", {
        fontFamily: "sans-serif",
        fontSize: "32px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 120, "KO!", {
        fontFamily: "monospace",
        fontSize: "48px",
        color: "#ff4444",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 200, `${winner.nameZh} 勝！`, {
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
        250,
        `${winner.nameZh} ${Math.round(winnerPercent)}%  ·  ${loser.nameZh} ${Math.round(loserPercent)}%`,
        {
          fontFamily: "monospace",
          fontSize: "16px",
          color: "#cccccc",
        },
      )
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 320, this.taunt, {
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
    bg.on("pointerdown", onClick);
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
    const blob = await renderShareCard({
      winnerId,
      loserId,
      winnerPercent,
      loserPercent,
      taunt: this.taunt,
    });
    await shareOrDownloadPng(blob);
  }
}
