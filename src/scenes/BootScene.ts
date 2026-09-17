import Phaser from "phaser";
import { FIGHTERS } from "../fighters";
import type { FighterId } from "../types";
import { makeChibiTexture } from "../sprites/makeChibiTexture";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create(): void {
    for (const id of Object.keys(FIGHTERS) as FighterId[]) {
      const fighter = FIGHTERS[id];
      makeChibiTexture(this, `fighter-${id}`, fighter.palette);
    }
    this.scene.start("FightScene");
  }
}
