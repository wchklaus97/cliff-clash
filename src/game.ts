import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, PIXEL_ART } from "./config";

class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create(): void {
    // Temporary empty scene until Task 3
  }
}

export function createGame(): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: "game",
    pixelArt: PIXEL_ART,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
      },
    },
    scene: [BootScene],
  });
}
