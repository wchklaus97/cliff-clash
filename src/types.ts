export type FighterId = "bun" | "mochi" | "bean";
export type CpuLevel = "easy" | "normal";

export type FighterDef = {
  id: FighterId;
  nameEn: string;
  nameZh: string;
  speed: number;
  jump: number;
  weight: number;
  palette: { body: number; accent: number; outline: number };
};

export type HitKind = "light" | "heavy";
