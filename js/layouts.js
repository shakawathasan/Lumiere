// Layout geometry + background styles for the Photo Strip Layout Designer.
// composeLayout() draws photos + paper/background + border into a canvas;
// the caller bakes stickers/text on top afterward via OverlayManager, then
// adds the footer (timestamp/caption/logo) the same way the solo strip did.
//
// Every template has a portrait and a landscape arrangement (opts.orientation,
// default 'portrait'). Orientation reshapes the overall page/canvas and how
// cells are arranged — it does NOT change how an individual photo is fitted
// into its cell, which stays exactly as it always has (cover-fit, i.e. the
// photo fills its cell and any excess is cropped, matching prior behavior).

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
];

export const ORIENTATIONS = ['portrait', 'landscape'];

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

// Unchanged from before: photos fill their cell (cover-fit), cropping any
// excess — this is the existing, preserved behavior for individual photos.
function drawPhotoInCell(ctx, img, x, y, w, h, r, borderColor) {
  roundRectPath(ctx, x, y, w, h, r);
  ctx.save(); ctx.clip();
  const ir = img.width / img.height, cr = w / h;
  let sw, sh, sx, sy;
  if (ir > cr) { sh = img.height; sw = sh * cr; sy = 0; sx = (img.width - sw) / 2; }
  else { sw = img.width; sh = sw / cr; sx = 0; sy = (img.height - sh) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();
  ctx.strokeStyle = borderColor || 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1;
  roundRectPath(ctx, x + 0.5, y + 0.5, w - 1, h - 1, r);
  ctx.stroke();
}

/**
 * @param {string} templateId one of LAYOUT_TEMPLATES ids
 * @param {string[]} photoDataUrls
 * @param {{borderColor?:string, cornerRadius?:number, spacing?:number, background?:string, paperTexture?:boolean, printSize?:'small'|'medium'|'large', orientation?:'portrait'|'landscape'}} opts
 */
export async function composeLayout(templateId, photoDataUrls, opts = {}) {
  const tpl = LAYOUT_TEMPLATES.find(t => t.id === templateId) || LAYOUT_TEMPLATES[2];
  const bg = BACKGROUND_STYLES.find(b => b.id === opts.background) || BACKGROUND_STYLES[0];
  const scale = { small: 0.8, medium: 1, large: 1.4 }[opts.printSize || 'medium'];
  const r = (opts.cornerRadius ?? 10) * scale;
  const gap = (opts.spacing ?? 14) * scale;
  const border = (opts.borderColor && opts.borderColor !== 'none') ? opts.borderColor : null;
  const orientation = opts.orientation === 'landscape' ? 'landscape' : 'portrait';

  const images = await Promise.all(photoDataUrls.map(loadImage));
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const builders = {
    strip: buildStrip, polaroid: buildPolaroid, grid: buildGrid, postcard: buildPostcard,
    postcardCollage: buildPostcardCollage, scrapbook: buildScrapbook, filmNegative: buildFilmNegative,
    passport: buildPassport, miniPrints: buildMiniPrints, greetingCard: buildGreetingCard,
  };
  await builders[tpl.kind](canvas, ctx, images, tpl, { scale, r, gap, border, bg, orientation, paperTexture: opts.paperTexture !== false });
  return canvas;
}

/* ---------------------------------------------------------------------
   Each builder below takes o.orientation ('portrait' | 'landscape') and
   arranges its cells accordingly. Portrait is each template's traditional/
   default arrangement; landscape reflows the same photo count into a
   wider, shorter composition (transposing stacks into rows, adjusting
   grid columns, etc.) rather than just stretching the portrait version.
--------------------------------------------------------------------- */

function buildStrip(canvas, ctx, images, tpl, o) {
  const n = images.length;
  const footer = 90 * o.scale;
  const edge = 26 * o.scale;

  if (o.orientation === 'landscape') {
    // photos arranged left-to-right in a row instead of stacked vertically
    const photoW = 320 * o.scale, photoH = 300 * o.scale;
    canvas.width = edge + n * photoW + (n - 1) * o.gap + edge;
    canvas.height = edge + photoH + footer;
    roundRectPath(ctx, 0, 0, canvas.width, canvas.height, 18 * o.scale); ctx.save(); ctx.clip();
    paintBackground(ctx, canvas.width, canvas.height, o.bg);
    images.forEach((img, i) => {
      const x = edge + i * (photoW + o.gap);
      drawPhotoInCell(ctx, img, x, edge, photoW, photoH, o.r, o.border);
    });
    if (o.paperTexture) paperNoise(ctx, canvas.width, canvas.height);
    ctx.restore();
    return;
  }

  // portrait (default): classic stacked strip
  const photoW = 480 * o.scale, photoH = 320 * o.scale;
  canvas.width = photoW + edge * 2;
  canvas.height = edge + n * photoH + (n - 1) * o.gap + footer;
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
  const edge = 22 * o.scale, footerH = 110 * o.scale;
  const photoW = o.orientation === 'landscape' ? 460 * o.scale : 400 * o.scale;
  const photoH = o.orientation === 'landscape' ? 340 * o.scale : 460 * o.scale;
  canvas.width = photoW + edge * 2; canvas.height = edge + photoH + footerH;
  roundRectPath(ctx, 0, 0, canvas.width, canvas.height, 6 * o.scale); ctx.save(); ctx.clip();
  paintBackground(ctx, canvas.width, canvas.height, o.bg);
  drawPhotoInCell(ctx, images[0], edge, edge, photoW, photoH, o.r * 0.4, o.border);
  ctx.restore();
}

function buildGrid(canvas, ctx, images, tpl, o) {
  const cols = tpl.cols, rows = Math.ceil(images.length / cols);
  const cell = 260 * o.scale;
  const footerH = 80 * o.scale;
  // portrait: extra vertical breathing room above the grid; landscape:
  // extra horizontal margin either side — the grid itself (inherently
  // square-celled) stays the same arrangement, matching how real square
  // photo grids are typically printed regardless of paper orientation.
  const edgeV = (o.orientation === 'landscape' ? 20 : 34) * o.scale;
  const edgeH = (o.orientation === 'landscape' ? 34 : 20) * o.scale;
  canvas.width = edgeH * 2 + cols * cell + (cols - 1) * o.gap;
  canvas.height = edgeV + rows * cell + (rows - 1) * o.gap + footerH;
  roundRectPath(ctx, 0, 0, canvas.width, canvas.height, 16 * o.scale); ctx.save(); ctx.clip();
  paintBackground(ctx, canvas.width, canvas.height, o.bg);
  images.forEach((img, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = edgeH + col * (cell + o.gap), y = edgeV + row * (cell + o.gap);
    drawPhotoInCell(ctx, img, x, y, cell, cell, o.r, o.border);
  });
  if (o.paperTexture) paperNoise(ctx, canvas.width, canvas.height);
  ctx.restore();
}

function buildPostcard(canvas, ctx, images, tpl, o) {
  const edge = 20 * o.scale;
  if (o.orientation === 'portrait') {
    canvas.width = 480 * o.scale; canvas.height = 700 * o.scale;
    paintBackground(ctx, canvas.width, canvas.height, o.bg);
    drawPhotoInCell(ctx, images[0], edge, edge, canvas.width - edge * 2, canvas.height * 0.72, o.r, o.border);
    const dividerY = canvas.height * 0.76;
    ctx.strokeStyle = 'rgba(0,0,0,.15)'; ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(edge, dividerY); ctx.lineTo(canvas.width - edge, dividerY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(0,0,0,.25)';
    roundRectPath(ctx, canvas.width - edge - 70 * o.scale, dividerY + 10 * o.scale, 60 * o.scale, 46 * o.scale, 4);
    ctx.stroke();
    return;
  }
  // landscape (default/classic postcard shape)
  canvas.width = 700 * o.scale; canvas.height = 480 * o.scale;
  paintBackground(ctx, canvas.width, canvas.height, o.bg);
  drawPhotoInCell(ctx, images[0], edge, edge, canvas.width - edge * 2, canvas.height * 0.68, o.r, o.border);
  const dividerY = canvas.height * 0.72;
  ctx.strokeStyle = 'rgba(0,0,0,.15)'; ctx.setLineDash([6, 4]);
  ctx.beginPath(); ctx.moveTo(canvas.width / 2, dividerY); ctx.lineTo(canvas.width / 2, canvas.height - edge); ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(0,0,0,.25)';
  roundRectPath(ctx, canvas.width - edge - 70 * o.scale, dividerY + 8 * o.scale, 60 * o.scale, 46 * o.scale, 4);
  ctx.stroke();
}

function buildPostcardCollage(canvas, ctx, images, tpl, o) {
  const edge = 20 * o.scale;
  if (o.orientation === 'portrait') {
    // big photo on top, two small photos side by side below
    canvas.width = 480 * o.scale; canvas.height = 700 * o.scale;
    paintBackground(ctx, canvas.width, canvas.height, o.bg);
    const big = { x: edge, y: edge, w: canvas.width - edge * 2, h: canvas.height * 0.58 };
    drawPhotoInCell(ctx, images[0], big.x, big.y, big.w, big.h, o.r, o.border);
    const smallH = canvas.height - big.h - edge * 3;
    const smallW = (big.w - o.gap) / 2;
    [images[1], images[2]].forEach((img, i) => {
      if (!img) return;
      drawPhotoInCell(ctx, img, edge + i * (smallW + o.gap), big.y + big.h + edge, smallW, smallH, o.r, o.border);
    });
    return;
  }
  // landscape (default): big photo left, two small photos stacked right
  canvas.width = 700 * o.scale; canvas.height = 480 * o.scale;
  paintBackground(ctx, canvas.width, canvas.height, o.bg);
  const big = { x: edge, y: edge, w: canvas.width * 0.55, h: canvas.height - edge * 2 };
  drawPhotoInCell(ctx, images[0], big.x, big.y, big.w, big.h, o.r, o.border);
  const smallW = canvas.width - big.w - edge * 3;
  const smallH = (big.h - o.gap) / 2;
  [images[1], images[2]].forEach((img, i) => {
    if (!img) return;
    drawPhotoInCell(ctx, img, big.x + big.w + edge, edge + i * (smallH + o.gap), smallW, smallH, o.r, o.border);
  });
}

function buildScrapbook(canvas, ctx, images, tpl, o) {
  const landscape = o.orientation === 'landscape';
  canvas.width = (landscape ? 720 : 620) * o.scale;
  canvas.height = (landscape ? 620 : 720) * o.scale;
  paintBackground(ctx, canvas.width, canvas.height, o.bg);
  const positions = [
    { x: 0.08, y: 0.06, w: 0.4, h: 0.36, rot: -4 },
    { x: 0.52, y: 0.04, w: 0.4, h: 0.32, rot: 5 },
    { x: 0.06, y: 0.48, w: 0.38, h: 0.4, rot: 3 },
    { x: 0.5, y: 0.46, w: 0.42, h: 0.42, rot: -3 },
  ];
  images.slice(0, 4).forEach((img, i) => {
    const p = positions[i]; if (!p) return;
    const x = p.x * canvas.width, y = p.y * canvas.height, w = p.w * canvas.width, h = p.h * canvas.height;
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2); ctx.rotate((p.rot * Math.PI) / 180); ctx.translate(-w / 2, -h / 2);
    ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 4;
    roundRectPath(ctx, -6, -6, w + 12, h + 26, 4); ctx.fill();
    ctx.shadowColor = 'transparent';
    drawPhotoInCell(ctx, img, 0, 0, w, h, 2, null);
    ctx.restore();
  });
}

function buildFilmNegative(canvas, ctx, images, tpl, o) {
  const edge = 16 * o.scale, sprocket = 10 * o.scale;

  if (o.orientation === 'portrait') {
    // vertical filmstrip: frames stacked top-to-bottom, sprockets on the sides
    const cellW = 220 * o.scale, cellH = 160 * o.scale;
    canvas.width = cellW + edge * 2 + sprocket * 2 + 4;
    canvas.height = edge * 2 + images.length * cellH + (images.length - 1) * o.gap;
    ctx.fillStyle = '#0d0703'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 8; y < canvas.height - 8; y += 26 * o.scale) {
      ctx.fillStyle = '#241710';
      roundRectPath(ctx, 6, y, sprocket, 14 * o.scale, 3); ctx.fill();
      roundRectPath(ctx, canvas.width - sprocket - 6, y, sprocket, 14 * o.scale, 3); ctx.fill();
    }
    images.forEach((img, i) => {
      const x = edge + sprocket, y = edge + i * (cellH + o.gap);
      ctx.save();
      ctx.filter = 'grayscale(.4) contrast(1.1) brightness(1.1)';
      drawPhotoInCell(ctx, img, x, y, cellW, cellH, 2, 'rgba(255,255,255,.4)');
      ctx.restore();
      ctx.save();
      roundRectPath(ctx, x, y, cellW, cellH, 2); ctx.clip();
      ctx.fillStyle = 'rgba(255,120,40,.18)';
      ctx.fillRect(x, y, cellW, cellH);
      ctx.restore();
    });
    return;
  }

  // landscape (default): classic horizontal filmstrip
  const cellW = 300 * o.scale, cellH = 200 * o.scale;
  canvas.width = edge * 2 + images.length * cellW + (images.length - 1) * o.gap;
  canvas.height = cellH + edge * 2 + sprocket * 2 + 4;
  ctx.fillStyle = '#0d0703'; ctx.fillRect(0, 0, canvas.width, canvas.height);
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
    ctx.save();
    roundRectPath(ctx, x, y, cellW, cellH, 2); ctx.clip();
    ctx.fillStyle = 'rgba(255,120,40,.18)';
    ctx.fillRect(x, y, cellW, cellH);
    ctx.restore();
  });
}

function buildPassport(canvas, ctx, images, tpl, o) {
  const cell = 140 * o.scale, edge = 20 * o.scale;
  const cols = o.orientation === 'landscape' ? 3 : 2;
  const rows = Math.ceil(images.length / cols);
  canvas.width = edge * 2 + cols * cell + (cols - 1) * o.gap;
  canvas.height = edge * 2 + rows * cell * 1.15 + (rows - 1) * o.gap;
  paintBackground(ctx, canvas.width, canvas.height, o.bg);
  images.forEach((img, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = edge + col * (cell + o.gap), y = edge + row * (cell * 1.15 + o.gap);
    drawPhotoInCell(ctx, img, x, y, cell, cell * 1.15, 2, o.border || '#999');
  });
}

function buildMiniPrints(canvas, ctx, images, tpl, o) {
  const cell = 200 * o.scale, edge = 18 * o.scale;
  const cols = o.orientation === 'landscape' ? 3 : 2;
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
  const edge = 30 * o.scale;
  if (o.orientation === 'landscape') {
    canvas.width = 700 * o.scale; canvas.height = 520 * o.scale;
    paintBackground(ctx, canvas.width, canvas.height, o.bg);
    drawPhotoInCell(ctx, images[0], edge, edge, canvas.width * 0.6 - edge, canvas.height - edge * 2, o.r, o.border);
    ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(canvas.width * 0.62, 0); ctx.lineTo(canvas.width * 0.62, canvas.height); ctx.stroke();
    ctx.setLineDash([]);
    return;
  }
  // portrait (default)
  canvas.width = 520 * o.scale; canvas.height = 700 * o.scale;
  paintBackground(ctx, canvas.width, canvas.height, o.bg);
  drawPhotoInCell(ctx, images[0], edge, edge, canvas.width - edge * 2, canvas.height * 0.62, o.r, o.border);
  ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.setLineDash([5, 5]);
  ctx.beginPath(); ctx.moveTo(0, canvas.height * 0.7); ctx.lineTo(canvas.width, canvas.height * 0.7); ctx.stroke();
  ctx.setLineDash([]);
}

export function downloadCanvas(canvas, filename, type = 'image/png', quality) {
  const a = document.createElement('a');
  a.download = filename;
  a.href = canvas.toDataURL(type, quality);
  document.body.appendChild(a); a.click(); a.remove();
}
