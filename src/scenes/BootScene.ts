import Phaser from "phaser";
import { FIGHTERS } from "../fighters";
import type { FighterId } from "../types";
import {
  POSES,
  SFX,
  fighterTexture,
  tauntVoiceKey,
} from "../audio";
import { makeChibiTexture } from "../sprites/makeChibiTexture";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload(): void {
    const { width, height } = this.scale;
    const bar = this.add.rectangle(width / 2, height / 2, 200, 12, 0x4a5568);
    this.load.on("progress", (value: number) => {
      bar.width = 40 + 200 * value;
    });

    this.load.image("cover", "assets/cover.png");
    this.load.image("stage", "assets/stage.png");
    this.load.image("vfx-hit", "assets/vfx/vfx-hit.png");
    this.load.image("vfx-ko", "assets/vfx/vfx-ko.png");

    for (const id of Object.keys(FIGHTERS) as FighterId[]) {
      for (const pose of POSES) {
        this.load.image(fighterTexture(id, pose), `assets/fighters/${id}-${pose}.png`);
      }
    }

    this.load.audio(SFX.click, "assets/sfx/ui-click.wav");
    this.load.audio(SFX.play, "assets/sfx/ui-play.wav");
    this.load.audio(SFX.jump, "assets/sfx/jump.wav");
    this.load.audio(SFX.land, "assets/sfx/land.wav");
    this.load.audio(SFX.light, "assets/sfx/light.wav");
    this.load.audio(SFX.heavyCharge, "assets/sfx/heavy-charge.wav");
    this.load.audio(SFX.heavyHit, "assets/sfx/heavy-hit.wav");
    this.load.audio(SFX.ko, "assets/sfx/ko.wav");
    this.load.audio(SFX.win, "assets/sfx/win.wav");
    this.load.audio(SFX.wind, "assets/sfx/wind.wav");
    this.load.audio(SFX.theme, "assets/sfx/theme.wav");
    this.load.audio(SFX.whoosh, "assets/sfx/whoosh.wav");
    this.load.audio(SFX.titleVo, "assets/sfx/vo-title.mp3");
    this.load.audio(SFX.selectVo, "assets/sfx/vo-select.mp3");
    this.load.audio(SFX.koVo, "assets/sfx/vo-ko.mp3");
    this.load.audio(tauntVoiceKey("bun"), "assets/sfx/taunt-bun.mp3");
    this.load.audio(tauntVoiceKey("mochi"), "assets/sfx/taunt-mochi.mp3");
    this.load.audio(tauntVoiceKey("bean"), "assets/sfx/taunt-bean.mp3");
  }

  create(): void {
    for (const id of Object.keys(FIGHTERS) as FighterId[]) {
      if (!this.textures.exists(fighterTexture(id, "idle"))) {
        makeChibiTexture(this, fighterTexture(id, "idle"), FIGHTERS[id].palette);
      }
    }
    this.scene.start("TitleScene");
  }
}
