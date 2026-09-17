import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#1a1a2e");

    this.add
      .text(GAME_WIDTH / 2, 180, "崖邊一擊", {
        fontFamily: "sans-serif",
        fontSize: "48px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 250, "Cliff Clash", {
        fontFamily: "monospace",
        fontSize: "24px",
        color: "#ffd700",
      })
      .setOrigin(0.5);

    this.makeButton(GAME_WIDTH / 2, GAME_HEIGHT - 160, "Play", () => {
      this.scene.start("SelectScene");
    });
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
}
