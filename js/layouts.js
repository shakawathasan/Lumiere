// Layout geometry + background styles for the Photo Strip Layout Designer.
// composeLayout() draws photos + paper/background + border into a canvas;
// the caller bakes stickers/text on top afterward via OverlayManager, then
// adds the footer (timestamp/caption/logo) the same way the solo strip did.

export const LAYOUT_TEMPLATES = [
  { id: 'classic2', name: 'Classic 2-Photo', shots: 2, kind: 'strip' },
  { id: 'classic3', name: 'Classic 3-Photo', shots: 3, kind: 'strip' },
  { id: 'classic4', name: 'Classic 4-Photo', shots: 4, kind: 'strip' },
  { id: 'polaroid', name: 'Polaroid Style', shots: 1, kind: 'polaroid' },
  { id: 'squareGrid4', name: 'Square Grid 2×2', shots: 4, kind: 'grid', cols: 2 },
  { id: 'squareGrid9', name: 'Square Grid 3×3', shots: 9, kind: 'grid', cols: 3 },
  { id: 'postcard', name: 'Postcard', shots: 1, kind: 'postcard' },
  { id: 'postcardCollage', name: 'Postcard Collage', shots: 3, kind: 'postcardCollage' },
  { id: 'scrapbook', name: 'Scrapbook Page', shots: 4, kind: 'scrapbook' },
  { id: 'filmNegative', name: 'Film Negative Strip', shots: 4, kind: 'filmNegative' },
  { id: 'passport', name: 'Passport Photos', shots: 6, kind: 'passport' },
  { id: 'miniPrints', name: 'Mini Prints Sheet', shots: 6, kind: 'miniPrints' },
  { id: 'greetingCard', name: 'Greeting Card', shots: 1, kind: 'greetingCard' },
  // Print-accurate templates (real-inch sizing at 150/300/450 DPI, see PRINT_DPI below)
  { id: 'strip2x6-3', name: 'Classic 2×6 Strip (3 Photos)', shots: 3, kind: 'strip2x6', physical: true },
  { id: 'strip2x6-4', name: 'Classic 2×6 Strip (4 Photos)', shots: 4, kind: 'strip2x6', physical: true },
  { id: 'postcard4x6-1', name: '4×6 Postcard · One Photo', shots: 1, kind: 'postcard4x6', physical: true },
  { id: 'postcard4x6-2', name: '4×6 Postcard · Two Photos', shots: 2, kind: 'postcard4x6', physical: true },
  { id: 'postcard4x6-3', name: '4×6 Postcard · Three-Photo Collage', shots: 3, kind: 'postcard4x6', physical: true },
  { id: 'postcard4x6-4', name: '4×6 Postcard · Four-Photo Collage', shots: 4, kind: 'postcard4x6', physical: true },
  { id: 'postcard4x6-custom', name: '4×6 Postcard · Custom Collage', shots: 5, kind: 'postcard4x6', physical: true },
];

// Real print-resolution DPI per "print size" choice, used only by the
// physically-accurate templates above (strip2x6 / postcard4x6) so a
// selected 2×6 or 4×6 template is always dimensionally correct — "size"
// there means print quality/DPI, not a shrink/stretch of the physical
// paper size the way it does for the legacy templates.
export const PRINT_DPI = { small: 150, medium: 300, large: 450 };

export const BACKGROUND_STYLES = [
  { id: 'cream', name: 'Cream Paper', type: 'solid', a: '#fbf7ee', b: '#f2ead9' },
  { id: 'blush', name: 'Blush', type: 'gradient', a: '#ffe3e3', b: '#ffd0c2' },
  { id: 'sage', name: 'Sage', type: 'gradient', a: '#e7efe1', b: '#cfdec6' },
  { id: 'dusk', name: 'Dusk Gradient', type: 'gradient', a: '#3a2a4a', b: '#1a1128' },
  { id: 'kraft', name: 'Kraft Texture', type: 'texture', a: '#c9a876', b: '#a3835a' },
  { id: 'floral', name: 'Floral Pattern', type: 'floral', a: '#fff3f0', b: '#f6c9d0' },
  { id: 'retroWave', name: 'Retro Wallpaper', type: 'stripes', a: '#2b1d4a', b: '#ff6f91' },
  { id: 'holiday', name: 'Holiday', type: 'floral', a: '#0e3b28', b: '#c23b3b' },
  { id: 'blurred', name: 'Soft Blur', type: 'blur', a: '#d9c7a3', b: '#8c6a45' },
];

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function paintBackground(ctx, w, h, bg) {
  if (!bg || bg.type === 'solid') {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, bg?.a || '#fbf7ee'); g.addColorStop(1, bg?.b || '#f2ead9');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    return;
  }
  if (bg.type === 'gradient') {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, bg.a); g.addColorStop(1, bg.b);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    return;
  }
  if (bg.type === 'texture') {
    ctx.fillStyle = bg.a; ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < w * h / 900; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? bg.b : '#000';
      ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
    }
    ctx.globalAlpha = 1;
    return;
  }
  if (bg.type === 'floral') {
    ctx.fillStyle = bg.a; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = bg.b; ctx.globalAlpha = 0.55;
    const step = Math.max(28, w / 14);
    for (let y = step / 2; y < h; y += step) {
      for (let x = step / 2; x < w; x += step) {
        const jitterX = x + (Math.random() - 0.5) * step * 0.5;
        const jitterY = y + (Math.random() - 0.5) * step * 0.5;
        drawFlower(ctx, jitterX, jitterY, step * 0.22);
      }
    }
    ctx.globalAlpha = 1;
    return;
  }
  if (bg.type === 'stripes') {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, bg.a); g.addColorStop(1, bg.b);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 2;
    for (let y = h * 0.55; y < h; y += 10) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    return;
  }
  if (bg.type === 'blur') {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) / 1.2);
    g.addColorStop(0, bg.a); g.addColorStop(1, bg.b);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    return;
  }
}

function drawFlower(ctx, cx, cy, r) {
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.ellipse(cx + Math.cos(a) * r * 0.6, cy + Math.sin(a) * r * 0.6, r * 0.5, r * 0.28, a, 0, Math.PI * 2);
    ctx.fill();
  }
}

function paperNoise(ctx, w, h, alpha = 0.03) {
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 255 * alpha;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  ctx.putImageData(imgData, 0, 0);
}

async function loadImage(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}

function drawPhotoInCell(ctx, img, x, y, w, h, r, borderColor) {
  roundRectPath(ctx, x, y, w, h, r);
  ctx.save(); ctx.clip();
  // contain-fit: the ENTIRE photo is always visible, at its true aspect
  // ratio — never cropped, zoomed, stretched, or distorted. Any leftover
  // space inside the cell simply shows the page/mat background already
  // painted underneath (drawPhotoInCell always runs after paintBackground).
  const ir = img.width / img.height, cr = w / h;
  let dw, dh, dx, dy;
  if (ir > cr) { dw = w; dh = w / ir; dx = x; dy = y + (h - dh) / 2; }
  else { dh = h; dw = h * ir; dy = y; dx = x + (w - dw) / 2; }
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
  ctx.strokeStyle = borderColor || 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1;
  roundRectPath(ctx, x + 0.5, y + 0.5, w - 1, h - 1, r);
  ctx.stroke();
}

/**
 * @param {string} templateId one of LAYOUT_TEMPLATES ids
 * @param {string[]} photoDataUrls
 * @param {{borderColor?:string, cornerRadius?:number, spacing?:number, background?:string, paperTexture?:boolean, printSize?:'small'|'medium'|'large'}} opts
 */
export async function composeLayout(templateId, photoDataUrls, opts = {}) {
  const tpl = LAYOUT_TEMPLATES.find(t => t.id === templateId) || LAYOUT_TEMPLATES[2];
  const bg = BACKGROUND_STYLES.find(b => b.id === opts.background) || BACKGROUND_STYLES[0];
  const scale = { small: 0.8, medium: 1, large: 1.4 }[opts.printSize || 'medium'];
  const printDpi = PRINT_DPI[opts.printSize || 'medium'];
  const r = (opts.cornerRadius ?? 10) * scale;
  const gap = (opts.spacing ?? 14) * scale;
  const border = (opts.borderColor && opts.borderColor !== 'none') ? opts.borderColor : null;

  const images = await Promise.all(photoDataUrls.map(loadImage));
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const builders = {
    strip: buildStrip, polaroid: buildPolaroid, grid: buildGrid, postcard: buildPostcard,
    postcardCollage: buildPostcardCollage, scrapbook: buildScrapbook, filmNegative: buildFilmNegative,
    passport: buildPassport, miniPrints: buildMiniPrints, greetingCard: buildGreetingCard,
    strip2x6: buildStrip2x6, postcard4x6: buildPostcard4x6,
  };
  await builders[tpl.kind](canvas, ctx, images, tpl, { scale, printDpi, r, gap, border, bg, paperTexture: opts.paperTexture !== false });
  return canvas;
}

function buildStrip(canvas, ctx, images, tpl, o) {
  const photoW = 480 * o.scale, photoH = 320 * o.scale, edge = 26 * o.scale, footerH = 90 * o.scale;
  const n = images.length;
  canvas.width = photoW + edge * 2;
  canvas.height = edge + n * photoH + (n - 1) * o.gap + footerH;
  roundRectPath(ctx, 0, 0, canvas.width, canvas.height, 18 * o.scale); ctx.save(); ctx.clip();
  paintBackground(ctx, canvas.width, canvas.height, o.bg);
  images.forEach((img, i) => {
    const y = edge + i * (photoH + o.gap);
    drawPhotoInCell(ctx, img, edge, y, photoW, photoH, o.r, o.border);
  });
  if (o.paperTexture) paperNoise(ctx, canvas.width, canvas.height);
  ctx.restore();
}

function buildPolaroid(canvas, ctx, images, tpl, o) {
  const photoW = 460 * o.scale, photoH = 400 * o.scale, edge = 22 * o.scale, footerH = 110 * o.scale;
  canvas.width = photoW + edge * 2; canvas.height = edge + photoH + footerH;
  roundRectPath(ctx, 0, 0, canvas.width, canvas.height, 6 * o.scale); ctx.save(); ctx.clip();
  paintBackground(ctx, canvas.width, canvas.height, o.bg);
  drawPhotoInCell(ctx, images[0], edge, edge, photoW, photoH, o.r * 0.4, o.border);
  ctx.restore();
}

function buildGrid(canvas, ctx, images, tpl, o) {
  const cols = tpl.cols, rows = Math.ceil(images.length / cols);
  const cell = 260 * o.scale, edge = 20 * o.scale, footerH = 80 * o.scale;
  canvas.width = edge * 2 + cols * cell + (cols - 1) * o.gap;
  canvas.height = edge + rows * cell + (rows - 1) * o.gap + footerH;
  roundRectPath(ctx, 0, 0, canvas.width, canvas.height, 16 * o.scale); ctx.save(); ctx.clip();
  paintBackground(ctx, canvas.width, canvas.height, o.bg);
  images.forEach((img, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = edge + col * (cell + o.gap), y = edge + row * (cell + o.gap);
    drawPhotoInCell(ctx, img, x, y, cell, cell, o.r, o.border);
  });
  if (o.paperTexture) paperNoise(ctx, canvas.width, canvas.height);
  ctx.restore();
}

function buildPostcard(canvas, ctx, images, tpl, o) {
  canvas.width = 700 * o.scale; canvas.height = 480 * o.scale;
  paintBackground(ctx, canvas.width, canvas.height, o.bg);
  const edge = 20 * o.scale;
  drawPhotoInCell(ctx, images[0], edge, edge, canvas.width - edge * 2, canvas.height * 0.68, o.r, o.border);
  // postcard divider + stamp corner, drawn on the "back" strip below
  const dividerY = canvas.height * 0.72;
  ctx.strokeStyle = 'rgba(0,0,0,.15)'; ctx.setLineDash([6, 4]);
  ctx.beginPath(); ctx.moveTo(canvas.width / 2, dividerY); ctx.lineTo(canvas.width / 2, canvas.height - edge); ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(0,0,0,.25)';
  roundRectPath(ctx, canvas.width - edge - 70 * o.scale, dividerY + 8 * o.scale, 60 * o.scale, 46 * o.scale, 4);
  ctx.stroke();
}

function buildPostcardCollage(canvas, ctx, images, tpl, o) {
  canvas.width = 700 * o.scale; canvas.height = 480 * o.scale;
  paintBackground(ctx, canvas.width, canvas.height, o.bg);
  const edge = 20 * o.scale, big = { x: edge, y: edge, w: canvas.width * 0.55, h: canvas.height - edge * 2 };
  drawPhotoInCell(ctx, images[0], big.x, big.y, big.w, big.h, o.r, o.border);
  const smallW = canvas.width - big.w - edge * 3;
  const smallH = (big.h - o.gap) / 2;
  [images[1], images[2]].forEach((img, i) => {
    if (!img) return;
    drawPhotoInCell(ctx, img, big.x + big.w + edge, edge + i * (smallH + o.gap), smallW, smallH, o.r, o.border);
  });
}

function buildScrapbook(canvas, ctx, images, tpl, o) {
  canvas.width = 720 * o.scale; canvas.height = 620 * o.scale;
  paintBackground(ctx, canvas.width, canvas.height, o.bg);
  const positions = [
    { x: 0.08, y: 0.08, w: 0.4, h: 0.38, rot: -4 },
    { x: 0.52, y: 0.05, w: 0.4, h: 0.34, rot: 5 },
    { x: 0.06, y: 0.5, w: 0.38, h: 0.4, rot: 3 },
    { x: 0.5, y: 0.48, w: 0.42, h: 0.42, rot: -3 },
  ];
  images.slice(0, 4).forEach((img, i) => {
    const p = positions[i]; if (!p) return;
    const x = p.x * canvas.width, y = p.y * canvas.height, w = p.w * canvas.width, h = p.h * canvas.height;
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2); ctx.rotate((p.rot * Math.PI) / 180); ctx.translate(-w / 2, -h / 2);
    // white polaroid-ish backing
    ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 4;
    roundRectPath(ctx, -6, -6, w + 12, h + 26, 4); ctx.fill();
    ctx.shadowColor = 'transparent';
    drawPhotoInCell(ctx, img, 0, 0, w, h, 2, null);
    ctx.restore();
  });
}

function buildFilmNegative(canvas, ctx, images, tpl, o) {
  const cellW = 300 * o.scale, cellH = 200 * o.scale, edge = 16 * o.scale, sprocket = 10 * o.scale;
  canvas.width = edge * 2 + images.length * cellW + (images.length - 1) * o.gap;
  canvas.height = cellH + edge * 2 + sprocket * 2 + 4;
  ctx.fillStyle = '#0d0703'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  // sprocket holes along top & bottom
  for (let x = 8; x < canvas.width - 8; x += 26 * o.scale) {
    ctx.fillStyle = '#241710';
    roundRectPath(ctx, x, 6, 14 * o.scale, sprocket, 3); ctx.fill();
    roundRectPath(ctx, x, canvas.height - sprocket - 6, 14 * o.scale, sprocket, 3); ctx.fill();
  }
  images.forEach((img, i) => {
    const x = edge + i * (cellW + o.gap), y = edge + sprocket;
    ctx.save();
    ctx.filter = 'grayscale(.4) contrast(1.1) brightness(1.1)';
    drawPhotoInCell(ctx, img, x, y, cellW, cellH, 2, 'rgba(255,255,255,.4)');
    ctx.restore();
    // orange negative-tint wash, clipped to the same rounded cell
    ctx.save();
    roundRectPath(ctx, x, y, cellW, cellH, 2); ctx.clip();
    ctx.fillStyle = 'rgba(255,120,40,.18)';
    ctx.fillRect(x, y, cellW, cellH);
    ctx.restore();
  });
}

function buildPassport(canvas, ctx, images, tpl, o) {
  const cell = 140 * o.scale, edge = 20 * o.scale, cols = 3;
  const rows = Math.ceil(images.length / cols);
  canvas.width = edge * 2 + cols * cell + (cols - 1) * o.gap;
  canvas.height = edge * 2 + rows * cell + (rows - 1) * o.gap;
  paintBackground(ctx, canvas.width, canvas.height, o.bg);
  images.forEach((img, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = edge + col * (cell + o.gap), y = edge + row * (cell + o.gap);
    drawPhotoInCell(ctx, img, x, y, cell, cell * 1.15, 2, o.border || '#999');
  });
}

function buildMiniPrints(canvas, ctx, images, tpl, o) {
  const cell = 200 * o.scale, cols = 3, edge = 18 * o.scale;
  const rows = Math.ceil(images.length / cols);
  canvas.width = edge * 2 + cols * cell + (cols - 1) * o.gap;
  canvas.height = edge * 2 + rows * (cell * 0.72) + (rows - 1) * o.gap;
  paintBackground(ctx, canvas.width, canvas.height, o.bg);
  images.forEach((img, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = edge + col * (cell + o.gap), y = edge + row * (cell * 0.72 + o.gap);
    drawPhotoInCell(ctx, img, x, y, cell, cell * 0.72, o.r * 0.5, o.border);
    ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.setLineDash([4, 3]);
    roundRectPath(ctx, x - 4, y - 4, cell + 8, cell * 0.72 + 8, 4); ctx.stroke(); ctx.setLineDash([]);
  });
}

function buildGreetingCard(canvas, ctx, images, tpl, o) {
  canvas.width = 520 * o.scale; canvas.height = 700 * o.scale;
  paintBackground(ctx, canvas.width, canvas.height, o.bg);
  const edge = 30 * o.scale;
  drawPhotoInCell(ctx, images[0], edge, edge, canvas.width - edge * 2, canvas.height * 0.62, o.r, o.border);
  // fold line
  ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.setLineDash([5, 5]);
  ctx.beginPath(); ctx.moveTo(0, canvas.height * 0.7); ctx.lineTo(canvas.width, canvas.height * 0.7); ctx.stroke();
  ctx.setLineDash([]);
}

/* ---------------------------------------------------------------------
   Print-accurate templates: real inches × DPI, so "2×6" and "4×6" are
   dimensionally exact rather than arbitrary pixel sizes. printSize here
   selects DPI (150/300/450) — print quality — not physical paper size.
--------------------------------------------------------------------- */

function buildStrip2x6(canvas, ctx, images, tpl, o) {
  const dpi = o.printDpi;
  const W = Math.round(2 * dpi), H = Math.round(6 * dpi);
  canvas.width = W; canvas.height = H;
  const r = Math.min(o.r, W * 0.06);
  roundRectPath(ctx, 0, 0, W, H, r); ctx.save(); ctx.clip();
  paintBackground(ctx, W, H, o.bg);

  const edge = Math.round(0.12 * dpi);
  const footerH = Math.round(0.42 * dpi);
  const gap = Math.min(o.gap, dpi * 0.045);
  const n = images.length;
  const photoW = W - edge * 2;
  const availH = H - edge * 2 - footerH;
  const photoH = (availH - (n - 1) * gap) / n;

  images.forEach((img, i) => {
    const y = edge + i * (photoH + gap);
    drawPhotoInCell(ctx, img, edge, y, photoW, photoH, Math.min(o.r, photoW * 0.04), o.border);
  });

  if (o.paperTexture) paperNoise(ctx, W, H, 0.025);
  ctx.restore();
}

/** Generic 1..N cell arrangement used by the flexible 4×6 postcard templates. */
function flexCellLayout(n, W, H, gap) {
  const cells = [];
  if (n <= 1) {
    cells.push({ x: 0, y: 0, w: W, h: H });
  } else if (n === 2) {
    const w = (W - gap) / 2;
    cells.push({ x: 0, y: 0, w, h: H }, { x: w + gap, y: 0, w, h: H });
  } else if (n === 3) {
    const topH = (H - gap) * 0.55, botH = H - gap - topH;
    const w = (W - gap) / 2;
    cells.push({ x: 0, y: 0, w: W, h: topH });
    cells.push({ x: 0, y: topH + gap, w, h: botH });
    cells.push({ x: w + gap, y: topH + gap, w, h: botH });
  } else if (n === 4) {
    const w = (W - gap) / 2, h = (H - gap) / 2;
    cells.push({ x: 0, y: 0, w, h }, { x: w + gap, y: 0, w, h }, { x: 0, y: h + gap, w, h }, { x: w + gap, y: h + gap, w, h });
  } else {
    const cols = Math.ceil(Math.sqrt(n)), rows = Math.ceil(n / cols);
    const w = (W - gap * (cols - 1)) / cols, h = (H - gap * (rows - 1)) / rows;
    for (let i = 0; i < n; i++) {
      const col = i % cols, row = Math.floor(i / cols);
      cells.push({ x: col * (w + gap), y: row * (h + gap), w, h });
    }
  }
  return cells;
}

function buildPostcard4x6(canvas, ctx, images, tpl, o) {
  const dpi = o.printDpi;
  const W = Math.round(4 * dpi), H = Math.round(6 * dpi);
  canvas.width = W; canvas.height = H;
  paintBackground(ctx, W, H, o.bg);

  const edge = Math.round(0.16 * dpi);
  const footerH = Math.round(0.4 * dpi);
  const areaW = W - edge * 2, areaH = H - edge * 2 - footerH;
  const gap = Math.min(o.gap, dpi * 0.04);

  const cells = flexCellLayout(images.length, areaW, areaH, gap);
  images.forEach((img, i) => {
    const c = cells[i]; if (!c) return;
    drawPhotoInCell(ctx, img, edge + c.x, edge + c.y, c.w, c.h, Math.min(o.r, dpi * 0.03), o.border);
  });

  if (o.paperTexture) paperNoise(ctx, W, H, 0.02);
}

/**
 * Simulates a professional photo-booth printer: two identical copies of an
 * already-finished 2×6 strip laid out side by side on one 4×6 sheet with a
 * dashed cut line down the middle, ready to be sliced apart after printing.
 * @param {HTMLCanvasElement} stripCanvas a finished, already-decorated 2×6 strip
 * @param {{printDpi?: number}} opts
 */
export function composeDualStripSheet(stripCanvas, opts = {}) {
  const dpi = opts.printDpi || 300;
  const sheetW = Math.round(4 * dpi), sheetH = Math.round(6 * dpi);
  const sheet = document.createElement('canvas');
  sheet.width = sheetW; sheet.height = sheetH;
  const ctx = sheet.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, sheetW, sheetH);

  const margin = Math.round(0.12 * dpi);
  const stripW = (sheetW - margin * 3) / 2;
  const fitScale = stripW / stripCanvas.width;
  const stripH = stripCanvas.height * fitScale;
  const y = Math.max(margin, (sheetH - stripH) / 2);

  ctx.drawImage(stripCanvas, margin, y, stripW, stripH);
  ctx.drawImage(stripCanvas, margin * 2 + stripW, y, stripW, stripH);

  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,.35)';
  ctx.setLineDash([dpi * 0.03, dpi * 0.02]);
  ctx.lineWidth = Math.max(1, dpi * 0.006);
  ctx.beginPath();
  ctx.moveTo(sheetW / 2, margin * 0.4);
  ctx.lineTo(sheetW / 2, sheetH - margin * 0.4);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = 'rgba(0,0,0,.4)';
  ctx.font = `${Math.round(dpi * 0.09)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('✂', sheetW / 2, margin * 0.35);

  return sheet;
}

export function downloadCanvas(canvas, filename, type = 'image/png', quality) {
  const a = document.createElement('a');
  a.download = filename;
  a.href = canvas.toDataURL(type, quality);
  document.body.appendChild(a); a.click(); a.remove();
}
