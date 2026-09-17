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

/** Original-IP 32×32 fallback: scarf / leaf / sprout silhouettes, never licensed lookalikes. */
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
  ctx.beginPath();
  ctx.ellipse(16, 20, 11, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  if (silhouette === "bun") {
    ctx.beginPath();
    ctx.arc(12, 8, 3, 0, Math.PI * 2);
    ctx.arc(20, 8, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (silhouette === "mochi") {
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.ellipse(18, 6, 5, 4, 0.4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = accent;
    ctx.fillRect(15, 2, 2, 6);
    ctx.beginPath();
    ctx.ellipse(13, 4, 3, 2, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(19, 4, 3, 2, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(16, 20, 9, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  if (silhouette === "bun") {
    ctx.beginPath();
    ctx.arc(12, 8, 2, 0, Math.PI * 2);
    ctx.arc(20, 8, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = accent;
    drawRoundRect(ctx, 8, 16, 16, 4, 2);
    ctx.fill();
  } else if (silhouette === "bean") {
    ctx.fillStyle = accent;
    drawRoundRect(ctx, 9, 21, 14, 3, 1);
    ctx.fill();
  }

  ctx.fillStyle = outline;
  ctx.fillRect(12, 16, 2, 3);
  ctx.fillRect(18, 16, 2, 3);
  ctx.fillStyle = "rgb(244,167,185)";
  ctx.fillRect(10, 19, 2, 2);
  ctx.fillRect(20, 19, 2, 2);

  scene.textures.addCanvas(key, canvas);
}
