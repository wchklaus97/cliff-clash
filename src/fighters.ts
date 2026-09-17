import type { FighterDef, FighterId } from "./types";

export const FIGHTERS: Record<FighterId, FighterDef> = {
  bun: {
    id: "bun",
    nameEn: "Bun",
    nameZh: "包子",
    speed: 180,
    jump: 380,
    weight: 1.0,
    palette: { body: 0xf4c27a, accent: 0xe07a5f, outline: 0x3d2b1f },
  },
  mochi: {
    id: "mochi",
    nameEn: "Mochi",
    nameZh: "糯米",
    speed: 120,
    jump: 320,
    weight: 1.35,
    palette: { body: 0xf7e4ea, accent: 0xc08497, outline: 0x4a3040 },
  },
  bean: {
    id: "bean",
    nameEn: "Bean",
    nameZh: "豆豆",
    speed: 240,
    jump: 420,
    weight: 0.72,
    palette: { body: 0x8fbc8f, accent: 0x3d5c3d, outline: 0x1f2e1f },
  },
};
