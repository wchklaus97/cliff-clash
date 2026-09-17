import type { FighterDef, FighterId } from "./types";

export const FIGHTERS: Record<FighterId, FighterDef> = {
  bun: {
    id: "bun",
    nameEn: "Bun",
    nameZh: "包子",
    roleEn: "Short-ear dumpling · mallet",
    roleZh: "短耳槌擊",
    speed: 180,
    jump: 380,
    weight: 1.0,
    palette: { body: 0xf6e2b3, accent: 0xc23b2a, outline: 0x1a120c },
  },
  mochi: {
    id: "mochi",
    nameEn: "Mochi",
    nameZh: "糯米",
    roleEn: "Rice golem · belly slam",
    roleZh: "糯米重砸",
    speed: 120,
    jump: 320,
    weight: 1.35,
    palette: { body: 0xfff8f2, accent: 0x3d8b4a, outline: 0x2b2b2b },
  },
  bean: {
    id: "bean",
    nameEn: "Bean",
    nameZh: "豆豆",
    roleEn: "Azuki spirit · kick rush",
    roleZh: "小豆踢擊",
    speed: 240,
    jump: 420,
    weight: 0.72,
    palette: { body: 0xc44536, accent: 0xf2c94c, outline: 0x2b2b2b },
  },
};
