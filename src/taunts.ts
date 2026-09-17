/** Cantonese taunt templates — substitute `{winner}` with display name (包子 / 糯米 / 豆豆). */
const MANDATORY_FRAGMENT = "唔打到你飛落山就唔叫";
const MANDATORY_TEMPLATE = `${MANDATORY_FRAGMENT}{winner}`;

export const TAUNT_TEMPLATES = [
  MANDATORY_TEMPLATE,
  "{winner}今日要同崖底約會啦！",
  "落山速度咁快，{winner}都追唔上你！",
  "崖邊一擊，{winner}直落九重天！",
  "再嚟一場？{winner}仲未夠膽！",
  "KO！{winner}已經喺山腳等緊你。",
] as const;

export function pickTaunt(winnerNameZh: string): string {
  const mandatory = MANDATORY_TEMPLATE.replaceAll("{winner}", winnerNameZh);
  const extras = TAUNT_TEMPLATES.filter((t) => t !== MANDATORY_TEMPLATE);
  const extraTemplate = extras[Math.floor(Math.random() * extras.length)];
  const extra = extraTemplate.replaceAll("{winner}", winnerNameZh);
  return `${mandatory}\n${extra}`;
}
