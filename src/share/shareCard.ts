import { FIGHTERS } from "../fighters";
import type { FighterId } from "../types";

export type ShareCardData = {
  winnerId: FighterId;
  loserId: FighterId;
  winnerPercent: number;
  loserPercent: number;
  taunt: string;
};

const CARD_WIDTH = 390;
const CARD_HEIGHT = 694;
const SCALE = 2;

function hexColor(n: number): string {
  return `#${n.toString(16).padStart(6, "0")}`;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const chars = [...text];
  let line = "";
  let currentY = y;

  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line.length > 0) {
      ctx.fillText(line, x, currentY);
      line = ch;
      currentY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = new URL(src, document.baseURI).href;
  });
}

function loadCover(): Promise<HTMLImageElement | null> {
  return loadImage("assets/cover.png");
}

export async function renderShareCard(data: ShareCardData): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH * SCALE;
  canvas.height = CARD_HEIGHT * SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unavailable");

  ctx.scale(SCALE, SCALE);

  const winner = FIGHTERS[data.winnerId];
  const loser = FIGHTERS[data.loserId];

  const cover = await loadCover();
  if (cover) {
    ctx.drawImage(cover, 0, 0, CARD_WIDTH, CARD_HEIGHT);
    ctx.fillStyle = "rgba(20, 12, 24, 0.42)";
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  } else {
    const sky = ctx.createLinearGradient(0, 0, 0, CARD_HEIGHT);
    sky.addColorStop(0, "#87ceeb");
    sky.addColorStop(1, "#5a9fd4");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  }

  const winnerArt = await loadImage(`assets/fighters/${data.winnerId}-idle.png`);
  const loserArt = await loadImage(`assets/fighters/${data.loserId}-idle.png`);
  if (winnerArt) {
    ctx.drawImage(winnerArt, CARD_WIDTH / 2 - 90, 118, 140, 140);
  }
  if (loserArt) {
    ctx.globalAlpha = 0.7;
    ctx.drawImage(loserArt, CARD_WIDTH / 2 + 40, 168, 88, 88);
    ctx.globalAlpha = 1;
  }

  ctx.textAlign = "center";
  ctx.font = "bold 28px sans-serif";
  ctx.fillStyle = hexColor(winner.palette.body);
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 3;
  ctx.strokeText(winner.nameZh, CARD_WIDTH / 2 - 60, 88);
  ctx.fillText(winner.nameZh, CARD_WIDTH / 2 - 60, 88);

  ctx.fillStyle = "#ffffff";
  ctx.font = "20px sans-serif";
  ctx.fillText("VS", CARD_WIDTH / 2, 88);

  ctx.font = "bold 28px sans-serif";
  ctx.fillStyle = hexColor(loser.palette.body);
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 3;
  ctx.strokeText(loser.nameZh, CARD_WIDTH / 2 + 60, 88);
  ctx.fillText(loser.nameZh, CARD_WIDTH / 2 + 60, 88);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 36px sans-serif";
  ctx.fillText("崖邊一擊", CARD_WIDTH / 2, 52);

  ctx.font = "bold 48px sans-serif";
  ctx.fillText("KO", CARD_WIDTH / 2, 300);

  ctx.font = "22px monospace";
  ctx.fillText(
    `${Math.round(data.winnerPercent)}%  ·  ${Math.round(data.loserPercent)}%`,
    CARD_WIDTH / 2,
    340,
  );

  ctx.font = "18px sans-serif";
  ctx.fillStyle = "#fff8dc";
  wrapText(ctx, data.taunt, CARD_WIDTH / 2, 400, 320, 26);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("PNG export failed"))),
      "image/png",
    );
  });
}

export async function shareOrDownloadPng(blob: Blob): Promise<void> {
  const file = new File([blob], "cliff-clash-result.png", { type: "image/png" });

  if (
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  ) {
    await navigator.share({
      files: [file],
      title: "崖邊一擊",
      text: "崖邊一擊 — 分享戰績",
    });
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "cliff-clash-result.png";
  link.click();
  URL.revokeObjectURL(url);
}
