/** Cantonese taunt templates — substitute `{winner}` with display name (包子 / 糯米 / 豆豆). */
export const TAUNT_TEMPLATES = [
  "唔打到你飛落山就唔叫{winner}",
  "{winner}今日要同崖底約會啦！",
  "落山速度咁快，{winner}都追唔上你！",
  "崖邊一擊，{winner}直落九重天！",
  "再嚟一場？{winner}仲未夠膽！",
  "KO！{winner}已經喺山腳等緊你。",
] as const;

export function pickTaunt(winnerNameZh: string): string {
  const template =
    TAUNT_TEMPLATES[Math.floor(Math.random() * TAUNT_TEMPLATES.length)];
  return template.replaceAll("{winner}", winnerNameZh);
}
