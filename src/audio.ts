import Phaser from "phaser";

export const POSES = ["idle", "light", "heavy", "ko"] as const;
export type FighterPose = (typeof POSES)[number];

export function fighterTexture(id: string, pose: FighterPose = "idle"): string {
  return `fighter-${id}-${pose}`;
}

export const SFX = {
  click: "sfx-ui-click",
  play: "sfx-ui-play",
  jump: "sfx-jump",
  land: "sfx-land",
  light: "sfx-light",
  heavyCharge: "sfx-heavy-charge",
  heavyHit: "sfx-heavy-hit",
  ko: "sfx-ko",
  win: "sfx-win",
  wind: "sfx-wind",
  theme: "sfx-theme",
  whoosh: "sfx-whoosh",
  titleVo: "vo-title",
  selectVo: "vo-select",
  koVo: "vo-ko",
} as const;

export function tauntVoiceKey(id: string): string {
  return `taunt-${id}`;
}

export function playSfx(
  scene: Phaser.Scene,
  key: string,
  config?: Phaser.Types.Sound.SoundConfig,
): void {
  if (!scene.cache.audio.exists(key)) return;
  scene.sound.play(key, config);
}

export function playTaunt(scene: Phaser.Scene, fighterId: string): void {
  playSfx(scene, tauntVoiceKey(fighterId), { volume: 1 });
}

export function loopSfx(
  scene: Phaser.Scene,
  key: string,
  config?: Phaser.Types.Sound.SoundConfig,
): void {
  if (!scene.cache.audio.exists(key)) return;
  if (scene.sound.get(key)?.isPlaying) return;
  scene.sound.play(key, { loop: true, ...config });
}
