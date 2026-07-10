// High-res export in multiple formats, social-media crop presets, a real
// print flow (via a dedicated print window so any layout/size prints
// cleanly instead of fighting the app's own screen CSS), and native share.

export const SOCIAL_PRESETS = [
  { id: 'igPost', name: 'Instagram Post', w: 1080, h: 1080, fit: 'cover' },
  { id: 'igStory', name: 'Instagram / TikTok Story', w: 1080, h: 1920, fit: 'cover' },
  { id: 'fbPost', name: 'Facebook Post', w: 1200, h: 630, fit: 'cover' },
  { id: 'wallpaperDesktop', name: 'Desktop Wallpaper', w: 1920, h: 1080, fit: 'contain' },
  { id: 'wallpaperPhone', name: 'Phone Wallpaper', w: 1080, h: 2340, fit: 'contain' },
];

export function downloadCanvasAs(canvas, filename, type = 'image/png', quality) {
  const a = document.createElement('a');
  a.download = filename;
  a.href = canvas.toDataURL(type, quality);
  document.body.appendChild(a); a.click(); a.remove();
}

export function exportHiRes(sourceCanvas, scaleFactor = 3) {
  const hi = document.createElement('canvas');
  hi.width = sourceCanvas.width * scaleFactor;
  hi.height = sourceCanvas.height * scaleFactor;
  const ctx = hi.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sourceCanvas, 0, 0, hi.width, hi.height);
  return hi;
}

/** Requires window.jspdf (loaded via CDN in index.html). */
export function exportPDF(canvas, filename = 'lumiere-print.pdf') {
  // eslint-disable-next-line no-undef
  const { jsPDF } = window.jspdf;
  const orientation = canvas.width >= canvas.height ? 'landscape' : 'portrait';
  const pdf = new jsPDF({ orientation, unit: 'pt', format: [canvas.width, canvas.height] });
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
  pdf.save(filename);
}

export function resizeForSocial(sourceCanvas, presetId) {
  const preset = SOCIAL_PRESETS.find(p => p.id === presetId) || SOCIAL_PRESETS[0];
  const out = document.createElement('canvas');
  out.width = preset.w; out.height = preset.h;
  const ctx = out.getContext('2d');

  if (preset.fit === 'contain') {
    // blurred cover fill behind a contained (non-cropped) copy — good for wallpapers
    ctx.save();
    ctx.filter = 'blur(24px) brightness(.6)';
    drawCover(ctx, sourceCanvas, preset.w, preset.h);
    ctx.restore();
    const sr = sourceCanvas.width / sourceCanvas.height, dr = preset.w / preset.h;
    let dw, dh;
    if (sr > dr) { dw = preset.w * 0.86; dh = dw / sr; } else { dh = preset.h * 0.86; dw = dh * sr; }
    ctx.drawImage(sourceCanvas, (preset.w - dw) / 2, (preset.h - dh) / 2, dw, dh);
  } else {
    ctx.fillStyle = '#12100e'; ctx.fillRect(0, 0, preset.w, preset.h);
    drawCover(ctx, sourceCanvas, preset.w, preset.h);
  }
  return out;
}

function drawCover(ctx, source, w, h) {
  const sr = source.width / source.height, dr = w / h;
  let dw, dh, dx, dy;
  if (sr > dr) { dh = h; dw = h * sr; dy = 0; dx = (w - dw) / 2; }
  else { dw = w; dh = w / sr; dx = 0; dy = (h - dh) / 2; }
  ctx.drawImage(source, dx, dy, dw, dh);
}

export function printCanvas(canvas) {
  const dataUrl = canvas.toDataURL('image/png');
  const win = window.open('', '_blank', 'width=600,height=800');
  if (!win) { window.print(); return; } // popup blocked — fall back to whole-page print
  win.document.write(`
    <html><head><title>Print</title>
    <style>
      html,body{margin:0;padding:0;background:#fff;display:flex;align-items:center;justify-content:center;height:100%;}
      img{max-width:100%;max-height:100vh;}
      @media print{ @page{ margin:0; } }
    </style></head>
    <body><img src="${dataUrl}" onload="setTimeout(()=>{window.print();},150)"/></body></html>
  `);
  win.document.close();
}

export async function shareCanvas(canvas, title = 'My Lumière Booth photo') {
  try {
    const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
    const file = new File([blob], 'lumiere-photo.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title });
      return true;
    }
  } catch (e) { /* user cancelled or unsupported */ }
  downloadCanvasAs(canvas, 'lumiere-photo.png');
  return false;
}
