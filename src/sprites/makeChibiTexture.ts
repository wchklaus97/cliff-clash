type Palette = { body: number; accent: number; outline: number };

function toCss(color: number): string {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return `rgb(${r},${g},${b})`;
}

function silhouetteFromKey(key: string): "bun" | "mochi" | "bean" {
  if (key.includes("mochi")) return "mochi";
  if (key.includes("bean")) return "bean";
  return "bun";
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function makeChibiTexture(
  scene: Phaser.Scene,
  key: string,
  palette: Palette,
): void {
  if (scene.textures.exists(key)) return;

  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.imageSmoothingEnabled = false;
  const silhouette = silhouetteFromKey(key);
  const outline = toCss(palette.outline);
  const body = toCss(palette.body);
  const accent = toCss(palette.accent);

  ctx.fillStyle = outline;

  if (silhouette === "bun") {
    ctx.beginPath();
    ctx.arc(16, 11, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(16, 23, 10, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(10, 6, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(22, 6, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(11, 18, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(21, 18, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (silhouette === "mochi") {
    drawRoundRect(ctx, 7, 4, 18, 14, 3);
    ctx.fill();
    drawRoundRect(ctx, 6, 17, 20, 13, 2);
    ctx.fill();
    ctx.fillStyle = accent;
    drawRoundRect(ctx, 5, 3, 6, 5, 1);
    ctx.fill();
    drawRoundRect(ctx, 21, 3, 6, 5, 1);
    ctx.fill();
    ctx.fillStyle = body;
    ctx.fillRect(8, 8, 16, 8);
    ctx.fillStyle = outline;
    ctx.fillRect(11, 10, 3, 3);
    ctx.fillRect(18, 10, 3, 3);
    ctx.fillStyle = accent;
    ctx.fillRect(9, 20, 4, 3);
    ctx.fillRect(19, 20, 4, 3);
  } else {
    drawRoundRect(ctx, 11, 2, 10, 12, 4);
    ctx.fill();
    drawRoundRect(ctx, 10, 14, 12, 16, 3);
    ctx.fill();
    ctx.fillStyle = accent;
    drawRoundRect(ctx, 9, 1, 4, 5, 1);
    ctx.fill();
    drawRoundRect(ctx, 19, 1, 4, 5, 1);
    ctx.fill();
    ctx.fillStyle = body;
    ctx.fillRect(12, 6, 8, 6);
    ctx.fillStyle = outline;
    ctx.fillRect(13, 8, 2, 3);
    ctx.fillRect(17, 8, 2, 3);
    ctx.fillStyle = accent;
    ctx.fillRect(12, 22, 3, 4);
    ctx.fillRect(17, 22, 3, 4);
  }

  ctx.fillStyle = body;
  if (silhouette === "bun") {
    ctx.beginPath();
    ctx.arc(16, 11, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(16, 23, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = outline;
    ctx.fillRect(12, 10, 3, 3);
    ctx.fillRect(17, 10, 3, 3);
  }

  scene.textures.addCanvas(key, canvas);
}
