import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config";
import { SFX, loopSfx, playSfx } from "../audio";

export class TitleScene extends Phaser.Scene {
  private voiced = false;

  constructor() {
    super("TitleScene");
  }

  create(): void {
    this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "cover")
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(0);

    this.add
      .rectangle(GAME_WIDTH / 2, 500, 280, 70, 0x1a1424, 0.45)
      .setStrokeStyle(2, 0xffd27a)
      .setDepth(1);

    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      this.sound.stopByKey(SFX.theme);
      playSfx(this, SFX.play);
      this.scene.start("SelectScene");
    };

    this.makeButton(GAME_WIDTH / 2, 500, "Play / 開打", start);

    this.add
      .zone(GAME_WIDTH / 2, 500, 280, 90)
      .setInteractive({ useHandCursor: true })
      .setDepth(5)
      .on("pointerdown", start);

    loopSfx(this, SFX.theme, { volume: 0.28 });

    this.input.once("pointerdown", () => {
      if (this.voiced) return;
      this.voiced = true;
      this.sound.unlock();
      playSfx(this, SFX.titleVo, { volume: 0.9 });
    });
  }

  private makeButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
  ): Phaser.GameObjects.Container {
    const bg = this.add
      .rectangle(0, 0, 220, 48, 0xc23b2a, 1)
      .setStrokeStyle(3, 0xfff3d6);
    const text = this.add
      .text(0, 0, label, {
        fontFamily: "sans-serif",
        fontSize: "20px",
        color: "#fff8e7",
        stroke: "#3d120c",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    const container = this.add.container(x, y, [bg, text]).setDepth(6);
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerover", () => bg.setFillStyle(0xe07a5f));
    bg.on("pointerout", () => bg.setFillStyle(0xc23b2a));
    bg.on("pointerdown", () => {
      playSfx(this, SFX.click);
      onClick();
    });
    return container;
  }
}
