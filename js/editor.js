// Post-capture photo editor. Runs as a discrete pass on a single still
// image (not real-time video), so per-pixel operations are affordable here
// even though the live preview pipeline (fx.js) sticks to cheaper tricks.

export const DEFAULT_ADJUSTMENTS = {
  brightness: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0,
  exposure: 0, highlights: 0, shadows: 0,
  vignette: 0, grain: 0, sharpen: 0, blur: 0, noiseReduction: 0, lightLeak: 0,
  rotate: 0, flipH: false, flipV: false,
  cropRect: null, // {x,y,w,h} in 0..1 normalized source coords
};

function clamp(v, lo = 0, hi = 255) { return v < lo ? lo : v > hi ? hi : v; }
function luminance(r, g, b) { return 0.299 * r + 0.587 * g + 0.114 * b; }

function drawCoverCropped(ctx, source, w, h, cropRect) {
  const sw = source.videoWidth || source.naturalWidth || source.width;
  const sh = source.videoHeight || source.naturalHeight || source.height;
  if (!cropRect) {
    // no explicit crop requested — contain-fit so nothing is ever cropped
    const sr = sw / sh, dr = w / h;
    let dw, dh, dx, dy;
    if (sr > dr) { dw = w; dh = w / sr; dx = 0; dy = (h - dh) / 2; }
    else { dh = h; dw = h * sr; dy = 0; dx = (w - dw) / 2; }
    ctx.drawImage(source, dx, dy, dw, dh);
    return;
  }
  // explicit crop tool usage: honor the requested crop rectangle exactly
  const sx = cropRect.x * sw, sy = cropRect.y * sh;
  const srcW = cropRect.w * sw, srcH = cropRect.h * sh;
  const sr = srcW / srcH, dr = w / h;
  let dw, dh, dx, dy;
  if (sr > dr) { dh = h; dw = h * sr; dy = 0; dx = (w - dw) / 2; }
  else { dw = w; dh = w / sr; dx = 0; dy = (h - dh) / 2; }
  ctx.drawImage(source, sx, sy, srcW, srcH, dx, dy, dw, dh);
}

/**
 * @param {CanvasRenderingContext2D} ctx target context (already sized)
 * @param {HTMLVideoElement|HTMLImageElement|HTMLCanvasElement} source
 * @param {number} w
 * @param {number} h
 * @param {typeof DEFAULT_ADJUSTMENTS} adjIn
 */
export function renderAdjusted(ctx, source, w, h, adjIn = {}) {
  const adj = { ...DEFAULT_ADJUSTMENTS, ...adjIn };
  ctx.clearRect(0, 0, w, h);
  ctx.save();

  // rotate / flip around canvas center
  ctx.translate(w / 2, h / 2);
  ctx.rotate((adj.rotate * Math.PI) / 180);
  ctx.scale(adj.flipH ? -1 : 1, adj.flipV ? -1 : 1);
  ctx.translate(-w / 2, -h / 2);

  // fast CSS-filter pass: brightness/contrast/saturation/blur
  const cssBrightness = 1 + adj.brightness / 100;
  const cssContrast = 1 + adj.contrast / 100;
  const cssSaturate = 1 + adj.saturation / 100;
  ctx.filter = `brightness(${cssBrightness}) contrast(${cssContrast}) saturate(${cssSaturate}) blur(${Math.max(0, adj.blur)}px)`;
  drawCoverCropped(ctx, source, w, h, adj.cropRect);
  ctx.filter = 'none';
  ctx.restore();

  // per-pixel pass: exposure, temperature, tint, highlights, shadows
  const needsPixelPass = adj.exposure || adj.temperature || adj.tint || adj.highlights || adj.shadows;
  if (needsPixelPass) {
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    const expFactor = Math.pow(2, adj.exposure / 50);
    const tempShift = adj.temperature * 0.6;
    const tintShift = adj.tint * 0.6;
    for (let i = 0; i < d.length; i += 4) {
      let r = d[i], g = d[i + 1], b = d[i + 2];
      if (expFactor !== 1) { r *= expFactor; g *= expFactor; b *= expFactor; }
      r += tempShift; b -= tempShift; // warm(+) / cool(-)
      g += tintShift; r -= tintShift * 0.5; b -= tintShift * 0.5; // green(+) / magenta(-)

      const lum = luminance(r, g, b) / 255;
      if (adj.highlights && lum > 0.55) {
        const k = (lum - 0.55) / 0.45 * (adj.highlights / 100);
        r += 255 * k * 0.5; g += 255 * k * 0.5; b += 255 * k * 0.5;
      }
      if (adj.shadows && lum < 0.45) {
        const k = (0.45 - lum) / 0.45 * (adj.shadows / 100);
        r += 255 * k * 0.5; g += 255 * k * 0.5; b += 255 * k * 0.5;
      }
      d[i] = clamp(r); d[i + 1] = clamp(g); d[i + 2] = clamp(b);
    }
    ctx.putImageData(img, 0, 0);
  }

  // noise reduction: blend a softly-blurred copy back in (cheap denoise)
  if (adj.noiseReduction > 0) {
    const tmp = document.createElement('canvas');
    tmp.width = w; tmp.height = h;
    const tctx = tmp.getContext('2d');
    tctx.filter = `blur(${1 + adj.noiseReduction / 20}px)`;
    tctx.drawImage(ctx.canvas, 0, 0);
    ctx.save();
    ctx.globalAlpha = Math.min(0.85, adj.noiseReduction / 100);
    ctx.drawImage(tmp, 0, 0);
    ctx.restore();
  }

  // sharpen: unsharp-mask style — blend (original - blurred) back on top
  if (adj.sharpen > 0) {
    const blurred = document.createElement('canvas');
    blurred.width = w; blurred.height = h;
    const bctx = blurred.getContext('2d');
    bctx.filter = 'blur(2px)';
    bctx.drawImage(ctx.canvas, 0, 0);

    const base = ctx.getImageData(0, 0, w, h);
    const soft = bctx.getImageData(0, 0, w, h);
    const amount = adj.sharpen / 100;
    for (let i = 0; i < base.data.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        const diff = base.data[i + c] - soft.data[i + c];
        base.data[i + c] = clamp(base.data[i + c] + diff * amount * 1.5);
      }
    }
    ctx.putImageData(base, 0, 0);
  }

  // vignette
  if (adj.vignette > 0) {
    const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.72);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, `rgba(5,2,1,${adj.vignette / 100 * 0.85})`);
    ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
  }

  // light leak
  if (adj.lightLeak > 0) {
    const grad = ctx.createRadialGradient(w * 0.12, h * 0.15, 0, w * 0.12, h * 0.15, Math.max(w, h) * 0.6);
    grad.addColorStop(0, `rgba(255,150,60,${adj.lightLeak / 100 * 0.5})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // grain
  if (adj.grain > 0) {
    const gW = Math.max(1, Math.floor(w / 2)), gH = Math.max(1, Math.floor(h / 2));
    const noiseData = ctx.createImageData(gW, gH);
    const alpha = Math.floor((adj.grain / 100) * 70);
    for (let i = 0; i < noiseData.data.length; i += 4) {
      const v = Math.random() * 255;
      noiseData.data[i] = v; noiseData.data[i + 1] = v; noiseData.data[i + 2] = v; noiseData.data[i + 3] = alpha;
    }
    const tmp = document.createElement('canvas');
    tmp.width = gW; tmp.height = gH;
    tmp.getContext('2d').putImageData(noiseData, 0, 0);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tmp, 0, 0, w, h);
    ctx.restore();
  }
}

export const ADJUSTMENT_DEFS = [
  { key: 'brightness', label: 'Brightness', min: -50, max: 50 },
  { key: 'contrast', label: 'Contrast', min: -50, max: 50 },
  { key: 'saturation', label: 'Saturation', min: -100, max: 100 },
  { key: 'temperature', label: 'Temperature', min: -50, max: 50 },
  { key: 'tint', label: 'Tint', min: -50, max: 50 },
  { key: 'exposure', label: 'Exposure', min: -50, max: 50 },
  { key: 'highlights', label: 'Highlights', min: -100, max: 100 },
  { key: 'shadows', label: 'Shadows', min: -100, max: 100 },
  { key: 'sharpen', label: 'Sharpen', min: 0, max: 100 },
  { key: 'blur', label: 'Blur', min: 0, max: 8 },
  { key: 'noiseReduction', label: 'Noise Reduction', min: 0, max: 100 },
  { key: 'vignette', label: 'Vignette', min: 0, max: 100 },
  { key: 'grain', label: 'Film Grain', min: 0, max: 100 },
  { key: 'lightLeak', label: 'Light Leak', min: 0, max: 100 },
];
