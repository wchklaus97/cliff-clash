import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, PIXEL_ART } from "./config";
import { BootScene } from "./scenes/BootScene";
import { FightScene } from "./scenes/FightScene";
import { ResultScene } from "./scenes/ResultScene";
import { SelectScene } from "./scenes/SelectScene";
import { TitleScene } from "./scenes/TitleScene";

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
    scene: [BootScene, TitleScene, SelectScene, FightScene, ResultScene],
  });
}
