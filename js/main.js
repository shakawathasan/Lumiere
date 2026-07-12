import { FILTERS, getFilter } from './filters.js';
import { HandTracker } from './hands.js';
import { audio } from './audio.js';
import { LAYOUT_TEMPLATES, BACKGROUND_STYLES, composeLayout } from './layouts.js';
import { STICKER_CATEGORIES, OverlayManager } from './stickers.js';
import { DEFAULT_ADJUSTMENTS, ADJUSTMENT_DEFS, renderAdjusted } from './editor.js';
import { Gallery, downloadDataUrl, downloadAsZip } from './gallery.js';
import { SOCIAL_PRESETS, downloadCanvasAs, exportHiRes, exportPDF, resizeForSocial, printCanvas, shareCanvas } from './exporter.js';

/* ---------------------------------------------------------------- */
/* DOM refs                                                          */
/* ---------------------------------------------------------------- */
const $ = sel => document.querySelector(sel);

const videoEl = $('#webcam');
const previewCanvas = $('#preview');
const previewCtx = previewCanvas.getContext('2d');
const grainCanvas = $('#grainOverlay');
const grainCtx = grainCanvas.getContext('2d');
const vignetteEl = $('#vignette');
const lightLeaksEl = $('#lightLeaks');
const captureBuffer = $('#captureBuffer');

const idleHint = $('#idleHint');
const resumeBoothBtn = $('#resumeBoothBtn');
const cameraRig = $('#cameraRig');
const filterPanel = $('#filterPanel');
const filterStripEl = $('#filterStrip');
const layoutChoicesEl = $('#layoutChoices');
const timerChoicesEl = $('#timerChoices');
const orientationChoicesEl = $('#orientationChoices');
const startCaptureBtn = $('#startCaptureBtn');
const cancelBtn = $('#cancelBtn');
const frameGuide = $('#frameGuide');

const countdownLayer = $('#countdownLayer');
const countdownNumber = $('#countdownNumber');
const shotProgress = $('#shotProgress');
const flashEl = $('#flash');

const printerDock = $('#printerDock');
const stripWrap = $('#stripWrap');
const stripCanvas = $('#stripCanvas');

const resultActions = $('#resultActions');
const downloadBtn = $('#downloadBtn');
const downloadHiResBtn = $('#downloadHiResBtn');
const printBtn = $('#printBtn');
const shareBtn = $('#shareBtn');
const anotherBtn = $('#anotherBtn');

const permissionNotice = $('#permissionNotice');
const enableCamBtn = $('#enableCamBtn');
const soundToggle = $('#soundToggle');
const statusLamp = $('#statusLamp');

/* ---- Pro: Studio ---- */
const studioPanel = $('#studioPanel');
const studioCanvasWrap = $('#studioCanvasWrap');
const composedCanvas = $('#composedCanvas');
const overlaySurface = $('#overlaySurface');
const studioTabs = [...document.querySelectorAll('.studio-tab')];
const tabPanels = [...document.querySelectorAll('.tab-panel')];
const templateGrid = $('#templateGrid');
const studioOrientationChoicesEl = $('#studioOrientationChoices');
const backgroundGrid = $('#backgroundGrid');
const borderColorInput = $('#borderColorInput');
const paperTextureToggle = $('#paperTextureToggle');
const cornerRadiusInput = $('#cornerRadiusInput');
const spacingInput = $('#spacingInput');
const printSizeSelect = $('#printSizeSelect');
const stickerCategoryTabs = $('#stickerCategoryTabs');
const stickerGrid = $('#stickerGrid');
const addTextBtn = $('#addTextBtn');
const textFontSelect = $('#textFontSelect');
const textColorInput = $('#textColorInput');
const textOutlineToggle = $('#textOutlineToggle');
const textShadowToggle = $('#textShadowToggle');
const studioCaptionInput = $('#studioCaptionInput');
const eventTitleInput = $('#eventTitleInput');
const showTimestampToggle = $('#showTimestampToggle');
const qrTextInput = $('#qrTextInput');
const adjustPhotoSelect = $('#adjustPhotoSelect');
const adjustSliders = $('#adjustSliders');
const resetAdjustBtn = $('#resetAdjustBtn');
const studioBackBtn = $('#studioBackBtn');
const finishPrintBtn = $('#finishPrintBtn');

/* ---- Pro: Gallery / Shortcuts / Utility bar / Export ---- */
const galleryBtn = $('#galleryBtn');
const galleryModal = $('#galleryModal');
const galleryGrid = $('#galleryGrid');
const galleryEmpty = $('#galleryEmpty');
const galleryZipBtn = $('#galleryZipBtn');
const galleryCloseBtn = $('#galleryCloseBtn');
const helpBtn = $('#helpBtn');
const shortcutsModal = $('#shortcutsModal');
const shortcutsCloseBtn = $('#shortcutsCloseBtn');
const downloadJpegBtn = $('#downloadJpegBtn');
const downloadPdfBtn = $('#downloadPdfBtn');
const socialPresetSelect = $('#socialPresetSelect');
const downloadSocialBtn = $('#downloadSocialBtn');

/* ---------------------------------------------------------------- */
/* App state                                                         */
/* ---------------------------------------------------------------- */
const state = {
  phase: 'boot', // boot | idle | active | countdown | developing | studio | result
  filterIndex: 0,
  layout: 4,
  timerSeconds: 7,
  orientation: 'portrait', // 'portrait' | 'landscape'
  shots: [],
  shotIndex: 0,
  pinchZoom: false,
  soundOn: true,
  // pro: studio design state
  templateId: 'classic4',
  backgroundId: 'cream',
  photoAdjustments: [], // one DEFAULT_ADJUSTMENTS-shaped object per shot
  adjustEditingIndex: 0,
};

const gallery = new Gallery();
let overlays = null; // OverlayManager, created once #overlaySurface exists

let tracker = null;
let lastFrameTime = 0;
let grainTick = 0;
let scratchSeeds = [];

/* ---------------------------------------------------------------- */
/* Camera bootstrap                                                  */
/* ---------------------------------------------------------------- */
async function startCamera(){
  try{
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 960 }, facingMode: 'user' },
      audio: false
    });
    videoEl.srcObject = stream;
    await videoEl.play();
    permissionNotice.setAttribute('aria-hidden', 'true');
    setPhase('active');
    resizeCanvases();
    requestAnimationFrame(renderLoop);

    tracker = new HandTracker(videoEl, onHandUpdate);
    await tracker.init();
    tracker.start();
  }catch(err){
    permissionNotice.setAttribute('aria-hidden', 'false');
    console.error('Camera error', err);
  }
}

enableCamBtn.addEventListener('click', startCamera);
resumeBoothBtn?.addEventListener('click', activateBooth);
window.addEventListener('resize', resizeCanvases);

function resizeCanvases(){
  // Cap the internal render resolution independent of screen size/DPR —
  // a live camera feed doesn't need to be redrawn at full 4K/retina pixel
  // counts 60 times a second. The canvas is displayed via CSS
  // object-fit:cover, so ~1920px on the long edge is still full sharp
  // "1080p-class" quality while being dramatically cheaper to redraw.
  const MAX_DIM = 1920;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = window.innerWidth * dpr;
  let h = window.innerHeight * dpr;
  const shrink = Math.min(1, MAX_DIM / Math.max(w, h));
  w = Math.round(w * shrink);
  h = Math.round(h * shrink);
  [previewCanvas, grainCanvas].forEach(c => {
    c.width = w;
    c.height = h;
  });
  updateFrameGuide();
}

/* ---------------------------------------------------------------- */
/* Render loop — draws video + all filter FX onto previewCanvas      */
/* Both the live preview (every frame) and the instant capture path  */
/* (once, at the exact shutter moment) share applyPreviewFX() below, */
/* so the saved photo is guaranteed to look exactly like what was on */
/* screen — just computed fresh from the camera instead of read back */
/* from a canvas that could have fallen behind under load.           */
/* ---------------------------------------------------------------- */
function renderLoop(t){
  requestAnimationFrame(renderLoop);
  if(videoEl.readyState < 2) return;

  const filter = getFilter(FILTERS[state.filterIndex].id);
  const w = previewCanvas.width, h = previewCanvas.height;

  applyPreviewFX(previewCtx, videoEl, w, h, filter, t);

  // ambient DOM overlays reflect current filter strength
  vignetteEl.style.opacity = 0.4 + filter.vignette*0.6;
  lightLeaksEl.style.opacity = filter.leak;

  // grain overlay (redrawn every 3rd frame for perf) + occasional scratch
  grainTick++;
  if(grainTick % 3 === 0){
    drawGrain(filter.grain);
  }
  if(filter.scratches > 0 && Math.random() < filter.scratches*0.06){
    drawScratch();
  }
}

/**
 * Draws the source video through the current filter's full look — base
 * color grade, tint, chromatic aberration, fade, film burn, scanlines,
 * halftone, analog flicker — onto the given context. Used for every live
 * preview frame AND, once, for the instantly-grabbed capture frame, so
 * both are pixel-for-pixel the same treatment.
 */
function applyPreviewFX(ctx, source, w, h, filter, t){
  ctx.save();
  ctx.filter = filter.css;
  drawCover(ctx, source, w, h);
  ctx.restore();

  if(filter.tint){
    ctx.fillStyle = filter.tint;
    ctx.fillRect(0,0,w,h);
  }

  // chromatic aberration: computed on a small fixed-size offscreen canvas
  // and upscaled — same visual result as filtering the full frame twice,
  // for a fraction of the cost.
  if(filter.aberration > 0.15){
    const temp = getAberrationTemp();
    const tctx = temp.getContext('2d');
    const off = filter.aberration * (temp.width/1000);
    tctx.clearRect(0,0,temp.width,temp.height);
    tctx.save();
    tctx.filter = 'brightness(1.4) saturate(2) sepia(1) hue-rotate(-50deg)';
    drawCover(tctx, source, temp.width, temp.height, off, 0);
    tctx.filter = 'brightness(1.4) saturate(2) sepia(1) hue-rotate(150deg)';
    tctx.globalCompositeOperation = 'screen';
    drawCover(tctx, source, temp.width, temp.height, -off, 0);
    tctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.16;
    ctx.drawImage(temp, 0, 0, w, h);
    ctx.restore();
  }

  if(filter.fade > 0){
    ctx.fillStyle = `rgba(255,255,255,${filter.fade})`;
    ctx.fillRect(0,0,w,h);
  }

  if(filter.burn){
    const t2 = (t/4000) % 1;
    const grad = ctx.createRadialGradient(w*(0.1+t2*0.1), h*0.85, 0, w*(0.1+t2*0.1), h*0.85, h*0.9);
    grad.addColorStop(0, 'rgba(255,140,20,0.55)');
    grad.addColorStop(0.4, 'rgba(255,60,0,0.22)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,w,h);
  }

  // VHS scanlines — cached repeating pattern, one fillRect regardless of resolution
  if(filter.scanlines){
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = getScanlinePattern(ctx);
    ctx.fillRect(0,0,w,h);
    ctx.restore();
    if(Math.random() < 0.03){
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      const jy = Math.random()*h;
      ctx.fillRect(0, jy, w, 4);
    }
  }

  // old magazine halftone dots — cached repeating pattern, one fillRect
  if(filter.halftone){
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = getHalftonePattern(ctx, Math.max(4, w/220));
    ctx.fillRect(0,0,w,h);
    ctx.restore();
  }

  // analog flicker
  const flicker = 1 + (Math.random()-0.5) * 0.02;
  ctx.save();
  ctx.globalAlpha = Math.abs(flicker-1);
  ctx.fillStyle = flicker > 1 ? '#fff' : '#000';
  ctx.fillRect(0,0,w,h);
  ctx.restore();
}

let aberrationTemp = null;
function getAberrationTemp(){
  if(!aberrationTemp){
    aberrationTemp = document.createElement('canvas');
    aberrationTemp.width = 320; aberrationTemp.height = 240;
  }
  return aberrationTemp;
}

let scanlinePattern = null;
function getScanlinePattern(ctx){
  if(scanlinePattern) return scanlinePattern;
  const tile = document.createElement('canvas');
  tile.width = 1; tile.height = 4;
  const tctx = tile.getContext('2d');
  tctx.fillStyle = '#000'; tctx.fillRect(0, 0, 1, 1);
  scanlinePattern = ctx.createPattern(tile, 'repeat');
  return scanlinePattern;
}

let halftonePattern = null, halftonePatternStep = 0;
function getHalftonePattern(ctx, step){
  const key = Math.round(step);
  if(halftonePattern && halftonePatternStep === key) return halftonePattern;
  const tile = document.createElement('canvas');
  tile.width = key * 2; tile.height = key * 2;
  const tctx = tile.getContext('2d');
  tctx.fillStyle = '#000';
  tctx.beginPath(); tctx.arc(key*0.5, key*0.5, key*0.28, 0, Math.PI*2); tctx.fill();
  tctx.beginPath(); tctx.arc(key*1.5, key*1.5, key*0.28, 0, Math.PI*2); tctx.fill();
  halftonePattern = ctx.createPattern(tile, 'repeat');
  halftonePatternStep = key;
  return halftonePattern;
}

function drawCover(ctx, source, w, h, offX=0, offY=0){
  const sw = source.videoWidth || source.width;
  const sh = source.videoHeight || source.height;
  if(!sw || !sh) return;
  const sr = sw/sh, dr = w/h;
  let dw, dh, dx, dy;
  if(sr > dr){ dh = h; dw = h*sr; dy = 0; dx = (w-dw)/2; }
  else{ dw = w; dh = w/sr; dx = 0; dy = (h-dh)/2; }
  ctx.drawImage(source, dx+offX, dy+offY, dw, dh);
}

// Small fixed-size noise tile, regenerated periodically and blitted up —
// far cheaper than writing per-pixel noise at full canvas resolution
// every frame.
let grainTile = null;
function drawGrain(intensity){
  if(!grainTile){ grainTile = document.createElement('canvas'); grainTile.width = 320; grainTile.height = 320; }
  const tctx = grainTile.getContext('2d');
  const imgData = tctx.createImageData(grainTile.width, grainTile.height);
  const d = imgData.data;
  const alpha = Math.floor(intensity * 90);
  for(let i=0;i<d.length;i+=4){
    const v = Math.random()*255;
    d[i]=v; d[i+1]=v; d[i+2]=v; d[i+3]=alpha;
  }
  tctx.putImageData(imgData, 0, 0);
  grainCtx.clearRect(0, 0, grainCanvas.width, grainCanvas.height);
  grainCtx.save();
  grainCtx.imageSmoothingEnabled = false;
  grainCtx.drawImage(grainTile, 0, 0, grainCanvas.width, grainCanvas.height);
  grainCtx.restore();
}

function drawScratch(){
  const w = grainCanvas.width, h = grainCanvas.height;
  const x = Math.random()*w;
  grainCtx.save();
  grainCtx.globalAlpha = 0.25 + Math.random()*0.3;
  grainCtx.strokeStyle = Math.random() > 0.5 ? '#fff' : '#111';
  grainCtx.lineWidth = 1 + Math.random();
  grainCtx.beginPath();
  grainCtx.moveTo(x, 0);
  grainCtx.lineTo(x + (Math.random()-0.5)*40, h);
  grainCtx.stroke();
  grainCtx.restore();
}



/* ---------------------------------------------------------------- */
/* Phase / state machine                                             */
/* ---------------------------------------------------------------- */
function setPhase(next){
  state.phase = next;
  idleHint.setAttribute('aria-hidden', String(next !== 'idle'));
  cameraRig.setAttribute('aria-hidden', String(!['active','countdown'].includes(next)));
  filterPanel.setAttribute('aria-hidden', String(next !== 'active'));
  countdownLayer.setAttribute('aria-hidden', String(next !== 'countdown'));
  resultActions.setAttribute('aria-hidden', String(next !== 'result'));
  frameGuide.setAttribute('aria-hidden', String(!['active','countdown'].includes(next)));
  statusLamp.style.background = next === 'idle' ? '#8a5a3a' : '#e0483c';

  if(next === 'idle'){
    state.shots = [];
    state.shotIndex = 0;
    audio.stopAmbience();
  }
  if(next === 'active'){
    audio.startAmbience();
  }
}

/* ---------------------------------------------------------------- */
/* Filter panel UI                                                   */
/* ---------------------------------------------------------------- */
function buildFilterStrip(){
  filterStripEl.innerHTML = '';
  FILTERS.forEach((f, i) => {
    const btn = document.createElement('button');
    btn.className = 'filter-thumb' + (i === state.filterIndex ? ' active' : '');
    btn.dataset.index = i;
    btn.innerHTML = `<span class="swatch" style="background:linear-gradient(135deg,#8a6a42,#3a2a1a); filter:${f.css}"></span><span class="fname">${f.name}</span>`;
    btn.addEventListener('click', () => selectFilter(i));
    filterStripEl.appendChild(btn);
  });
}

function selectFilter(i){
  state.filterIndex = (i + FILTERS.length) % FILTERS.length;
  [...filterStripEl.children].forEach((el, idx) => el.classList.toggle('active', idx === state.filterIndex));
  filterStripEl.children[state.filterIndex]?.scrollIntoView({behavior:'smooth', inline:'center', block:'nearest'});
}

layoutChoicesEl.addEventListener('click', e => {
  const btn = e.target.closest('.chip'); if(!btn) return;
  state.layout = parseInt(btn.dataset.layout, 10);
  [...layoutChoicesEl.children].forEach(c => c.classList.toggle('active', c === btn));
});
timerChoicesEl.addEventListener('click', e => {
  const btn = e.target.closest('.chip'); if(!btn) return;
  state.timerSeconds = parseInt(btn.dataset.timer, 10);
  [...timerChoicesEl.children].forEach(c => c.classList.toggle('active', c === btn));
});
orientationChoicesEl.addEventListener('click', e => {
  const btn = e.target.closest('.chip'); if(!btn) return;
  setOrientation(btn.dataset.orientation);
});
studioOrientationChoicesEl?.addEventListener('click', e => {
  const btn = e.target.closest('.chip'); if(!btn) return;
  setOrientation(btn.dataset.orientation);
});

function setOrientation(orientation){
  state.orientation = orientation;
  [orientationChoicesEl, studioOrientationChoicesEl].forEach(row => {
    if(!row) return;
    [...row.children].forEach(c => c.classList.toggle('active', c.dataset.orientation === orientation));
  });
  updateFrameGuide();
  if(state.phase === 'studio') refreshComposedPreview();
}

function updateFrameGuide(){
  frameGuide.classList.toggle('orientation-landscape', state.orientation === 'landscape');
}

startCaptureBtn.addEventListener('click', beginCaptureSequence);
cancelBtn.addEventListener('click', () => setPhase('idle'));

/* ---------------------------------------------------------------- */
/* Hand gesture wiring                                                */
/* ---------------------------------------------------------------- */
function onHandUpdate(res){
  if(state.phase === 'active'){
    if(res.openPalmStable){
      setPhase('idle');
      return;
    }
    if(res.thumbsUpStable){
      beginCaptureSequence();
      return;
    }
    if(res.swipe){
      selectFilter(state.filterIndex + (res.swipe === 'left' ? 1 : -1));
    }
    setPinchZoom(res.pinch);
  } else {
    setPinchZoom(false);
  }
}

function setPinchZoom(active){
  if(active === state.pinchZoom) return;
  state.pinchZoom = active;
  previewCanvas.style.transform = active ? 'scaleX(-1) scale(1.035)' : 'scaleX(-1) scale(1)';
  previewCanvas.style.transition = 'transform .25s ease-out';
}

function activateBooth(){
  setPhase('active');
  audio.focusClick();
}

/* ---------------------------------------------------------------- */
/* Capture sequence                                                  */
/* ---------------------------------------------------------------- */
async function beginCaptureSequence(){
  if(state.phase === 'countdown' || state.phase === 'developing') return;
  state.shots = [];
  state.shotIndex = 0;
  setPhase('countdown');
  runNextShot();
}

function runNextShot(){
  shotProgress.textContent = `Shot ${state.shotIndex+1} of ${state.layout}`;
  countdownLayer.setAttribute('aria-hidden', 'false');
  audio.beep(660);

  // Wall-clock-synced countdown (requestAnimationFrame against a fixed
  // target time) instead of setInterval, so it can't drift if the main
  // thread is briefly busy — the number hitting zero and the actual
  // capture stay tightly synchronized.
  const target = performance.now() + state.timerSeconds * 1000;
  let lastShown = null;

  function tick(now){
    const remaining = Math.max(0, target - now);
    const secondsLeft = Math.ceil(remaining / 1000);
    if(secondsLeft !== lastShown){
      lastShown = secondsLeft;
      if(secondsLeft > 0){
        countdownNumber.textContent = secondsLeft;
        restartCountAnim();
        audio.beep(secondsLeft <= 2 ? 990 : 660);
        if(secondsLeft <= 3) pulseZoomIn();
      }
    }
    if(remaining <= 0){
      capturePhoto();
      return;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function restartCountAnim(){
  countdownNumber.classList.remove('shotDone-pulse');
  void countdownNumber.offsetWidth; // reflow to restart animation
  countdownNumber.style.animation = 'none';
  void countdownNumber.offsetWidth;
  countdownNumber.style.animation = '';
}

function pulseZoomIn(){
  previewCanvas.style.transition = 'transform .9s ease-out';
  previewCanvas.style.transform = 'scaleX(-1) scale(1.06)';
}

/**
 * Computes a native-resolution, centered crop rectangle from the live
 * camera feed matching the chosen orientation's aspect ratio (3:4 for
 * portrait, 4:3 for landscape) — no upscaling, just a precise crop, so
 * capture quality is never reduced.
 */
function getOrientationCropRect(){
  const vw = videoEl.videoWidth || 1280, vh = videoEl.videoHeight || 960;
  const targetAspect = state.orientation === 'landscape' ? 4/3 : 3/4;
  const videoAspect = vw / vh;
  let sw, sh, sx, sy;
  if(videoAspect > targetAspect){
    sh = vh;
    sw = Math.round(vh * targetAspect);
    sx = Math.round((vw - sw) / 2);
    sy = 0;
  } else {
    sw = vw;
    sh = Math.round(vw / targetAspect);
    sx = 0;
    sy = Math.round((vh - sh) / 2);
  }
  return { sx, sy, sw, sh };
}

function capturePhoto(){
  // 1) Grab the freshest frame right now — a precise, native-resolution
  //    crop straight from the camera (matching the chosen orientation and
  //    exactly what the on-screen frame guide showed), not a frame read
  //    back from any intermediate canvas that could have fallen behind.
  const { sx, sy, sw, sh } = getOrientationCropRect();
  const raw = document.createElement('canvas');
  raw.width = sw; raw.height = sh;
  const rctx = raw.getContext('2d');
  rctx.save();
  rctx.translate(sw, 0);
  rctx.scale(-1, 1); // mirror, matching what the user sees on screen
  rctx.drawImage(videoEl, sx, sy, sw, sh, 0, 0, sw, sh);
  rctx.restore();

  // 2) Fire the shutter feedback immediately — the pixels above are
  //    already safely captured, so nothing after this can delay or
  //    change what was recorded.
  audio.shutter();
  flashEl.classList.remove('flash-fire'); void flashEl.offsetWidth;
  flashEl.classList.add('flash-fire');
  previewCanvas.style.transform = 'scaleX(-1) scale(1)';
  countdownLayer.setAttribute('aria-hidden', 'true');

  // 3) Apply the exact same cosmetic treatment the live preview was
  //    showing (tint/aberration/fade/burn/scanlines/halftone/flicker),
  //    once, at full quality — this can't delay the capture above since
  //    the frame is already saved by this point.
  const filter = getFilter(FILTERS[state.filterIndex].id);
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = sw; finalCanvas.height = sh;
  applyPreviewFX(finalCanvas.getContext('2d'), raw, sw, sh, filter, performance.now());
  state.shots.push(finalCanvas.toDataURL('image/jpeg', 0.92));

  state.shotIndex++;
  if(state.shotIndex < state.layout){
    setTimeout(() => {
      countdownLayer.setAttribute('aria-hidden', 'false');
      runNextShot();
    }, 1200);
  } else {
    setTimeout(openStudio, 700);
  }
}


/* ---------------------------------------------------------------- */
/* STUDIO — layout designer, backgrounds, stickers, text, adjustments*/
/* ---------------------------------------------------------------- */
function openStudio(){
  setPhase('studio');
  state.photoAdjustments = state.shots.map(() => ({ ...DEFAULT_ADJUSTMENTS }));
  state.adjustEditingIndex = 0;
  studioPanel.setAttribute('aria-hidden', 'false');

  if(!overlays) overlays = new OverlayManager(overlaySurface);
  overlays.clear();

  buildTemplateGrid();
  buildBackgroundGrid();
  buildStickerPicker();
  buildAdjustPhotoSelect();
  buildAdjustSliders();
  [orientationChoicesEl, studioOrientationChoicesEl].forEach(row => {
    if(!row) return;
    [...row.children].forEach(c => c.classList.toggle('active', c.dataset.orientation === state.orientation));
  });
  refreshComposedPreview();
}

function buildTemplateGrid(){
  templateGrid.innerHTML = '';
  LAYOUT_TEMPLATES.forEach(t => {
    const btn = document.createElement('button');
    btn.className = 'template-card' + (t.id === state.templateId ? ' active' : '');
    btn.textContent = `${t.name}${t.shots !== state.shots.length ? ` (${t.shots} photo${t.shots>1?'s':''})` : ''}`;
    btn.addEventListener('click', () => {
      state.templateId = t.id;
      [...templateGrid.children].forEach(c => c.classList.toggle('active', c === btn));
      refreshComposedPreview();
    });
    templateGrid.appendChild(btn);
  });
}

function buildBackgroundGrid(){
  backgroundGrid.innerHTML = '';
  BACKGROUND_STYLES.forEach(b => {
    const el = document.createElement('button');
    el.className = 'bg-swatch' + (b.id === state.backgroundId ? ' active' : '');
    el.style.background = `linear-gradient(135deg, ${b.a}, ${b.b})`;
    el.innerHTML = `<span>${b.name}</span>`;
    el.addEventListener('click', () => {
      state.backgroundId = b.id;
      [...backgroundGrid.children].forEach(c => c.classList.toggle('active', c === el));
      refreshComposedPreview();
    });
    backgroundGrid.appendChild(el);
  });
}

function buildStickerPicker(){
  const categories = Object.keys(STICKER_CATEGORIES);
  stickerCategoryTabs.innerHTML = '';
  categories.forEach((cat, i) => {
    const chip = document.createElement('button');
    chip.className = 'chip' + (i === 0 ? ' active' : '');
    chip.textContent = cat;
    chip.addEventListener('click', () => {
      [...stickerCategoryTabs.children].forEach(c => c.classList.toggle('active', c === chip));
      renderStickerGrid(cat);
    });
    stickerCategoryTabs.appendChild(chip);
  });
  renderStickerGrid(categories[0]);
}

function renderStickerGrid(category){
  stickerGrid.innerHTML = '';
  STICKER_CATEGORIES[category].forEach(token => {
    const cell = document.createElement('button');
    cell.className = 'sticker-cell';
    cell.innerHTML = /^[a-z-]+$/.test(token) ? svgPreview(token) : token;
    cell.addEventListener('click', () => overlays.addSticker(token, 40 + Math.random()*20, 40 + Math.random()*20));
    stickerGrid.appendChild(cell);
  });
}

function svgPreview(token){
  // small inline preview reusing the same SVG markup used at bake time
  const map = { 'frame-round':'⭕','frame-square':'⬜','frame-scallop':'🔘','frame-polaroid':'🖼️','frame-heart':'🤍','frame-film':'🎞️','bubble-round':'💬','bubble-cloud':'☁️','bubble-shout':'💥','bubble-heart':'💗' };
  return map[token] || '❔';
}

addTextBtn.addEventListener('click', () => {
  overlays.addText('Your text here', {
    font: textFontSelect.value,
    color: textColorInput.value,
    outline: textOutlineToggle.checked,
    shadow: textShadowToggle.checked,
    x: 50, y: 20,
  });
});
[textFontSelect, textColorInput, textOutlineToggle, textShadowToggle].forEach(el => {
  el.addEventListener('input', () => {
    const active = overlays?.getActive();
    if(!active || active.type !== 'text') return;
    active.contentEl.style.fontFamily = textFontSelect.value;
    active.contentEl.style.color = textColorInput.value;
    active.contentEl.classList.toggle('text-outline', textOutlineToggle.checked);
    active.contentEl.classList.toggle('text-shadow', textShadowToggle.checked);
  });
});

[borderColorInput, paperTextureToggle, cornerRadiusInput, spacingInput, printSizeSelect].forEach(el => {
  el.addEventListener('input', refreshComposedPreview);
});

function buildAdjustPhotoSelect(){
  adjustPhotoSelect.innerHTML = '';
  state.shots.forEach((_, i) => {
    const opt = document.createElement('option');
    opt.value = i; opt.textContent = `Photo ${i+1}`;
    adjustPhotoSelect.appendChild(opt);
  });
  adjustPhotoSelect.value = state.adjustEditingIndex;
  adjustPhotoSelect.addEventListener('change', () => {
    state.adjustEditingIndex = parseInt(adjustPhotoSelect.value, 10);
    buildAdjustSliders();
  });
}

function buildAdjustSliders(){
  adjustSliders.innerHTML = '';
  const adj = state.photoAdjustments[state.adjustEditingIndex] || { ...DEFAULT_ADJUSTMENTS };
  ADJUSTMENT_DEFS.forEach(def => {
    const row = document.createElement('div');
    row.className = 'adjust-row';
    row.innerHTML = `<div class="adjust-row-head"><span>${def.label}</span><span class="val">${adj[def.key]}</span></div>
      <input type="range" min="${def.min}" max="${def.max}" value="${adj[def.key]}" data-key="${def.key}" />`;
    const input = row.querySelector('input');
    const valEl = row.querySelector('.val');
    input.addEventListener('input', () => {
      adj[def.key] = parseFloat(input.value);
      valEl.textContent = input.value;
      state.photoAdjustments[state.adjustEditingIndex] = adj;
      refreshComposedPreview();
    });
    adjustSliders.appendChild(row);
  });
}

resetAdjustBtn.addEventListener('click', () => {
  state.photoAdjustments[state.adjustEditingIndex] = { ...DEFAULT_ADJUSTMENTS };
  buildAdjustSliders();
  refreshComposedPreview();
});

studioTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    studioTabs.forEach(t => t.classList.toggle('active', t === tab));
    tabPanels.forEach(p => p.classList.toggle('active', p.dataset.panel === tab.dataset.tab));
  });
});

let previewDebounce = null;
function refreshComposedPreview(){
  clearTimeout(previewDebounce);
  previewDebounce = setTimeout(async () => {
    const photosToUse = await applyAdjustmentsToShots();
    const opts = {
      borderColor: borderColorInput.value,
      paperTexture: paperTextureToggle.checked,
      cornerRadius: parseInt(cornerRadiusInput.value, 10),
      spacing: parseInt(spacingInput.value, 10),
      printSize: printSizeSelect.value,
      background: state.backgroundId,
      orientation: state.orientation,
    };
    const tpl = LAYOUT_TEMPLATES.find(t => t.id === state.templateId);
    const needed = tpl.shots;
    const slice = photosToUse.length >= needed ? photosToUse.slice(0, needed) : [...photosToUse, ...Array(needed - photosToUse.length).fill(photosToUse[photosToUse.length-1])];
    const canvas = await composeLayout(state.templateId, slice, opts);
    composedCanvas.width = canvas.width; composedCanvas.height = canvas.height;
    composedCanvas.getContext('2d').drawImage(canvas, 0, 0);
    requestAnimationFrame(syncOverlayToCanvas); // wait one frame for layout to settle
  }, 90);
}

function syncOverlayToCanvas(){
  const wrapRect = studioCanvasWrap.getBoundingClientRect();
  const canvasRect = composedCanvas.getBoundingClientRect();
  overlaySurface.style.left = (canvasRect.left - wrapRect.left) + 'px';
  overlaySurface.style.top = (canvasRect.top - wrapRect.top) + 'px';
  overlaySurface.style.width = canvasRect.width + 'px';
  overlaySurface.style.height = canvasRect.height + 'px';
}
window.addEventListener('resize', () => { if(state.phase === 'studio') syncOverlayToCanvas(); });

async function applyAdjustmentsToShots(){
  return Promise.all(state.shots.map((dataUrl, i) => new Promise(resolve => {
    const adj = state.photoAdjustments[i] || { ...DEFAULT_ADJUSTMENTS };
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      renderAdjusted(c.getContext('2d'), img, c.width, c.height, adj);
      resolve(c.toDataURL('image/jpeg', 0.9));
    };
    img.src = dataUrl;
  })));
}

studioBackBtn.addEventListener('click', () => {
  studioPanel.setAttribute('aria-hidden', 'true');
  overlays?.clear();
  setPhase('active');
});

finishPrintBtn.addEventListener('click', finishAndPrint);

async function finishAndPrint(){
  setPhase('developing');
  studioPanel.setAttribute('aria-hidden', 'true');
  audio.filmRoll(1.0);

  // 1. re-compose at final resolution
  const photosToUse = await applyAdjustmentsToShots();
  const opts = {
    borderColor: borderColorInput.value,
    paperTexture: paperTextureToggle.checked,
    cornerRadius: parseInt(cornerRadiusInput.value, 10),
    spacing: parseInt(spacingInput.value, 10),
    printSize: printSizeSelect.value,
    background: state.backgroundId,
    orientation: state.orientation,
  };
  const tpl = LAYOUT_TEMPLATES.find(t => t.id === state.templateId);
  const slice = photosToUse.slice(0, tpl.shots);
  const finalCanvas = await composeLayout(state.templateId, slice, opts);
  const fctx = finalCanvas.getContext('2d');

  // 2. bake stickers & text overlays (mapped from the studio preview's % coordinates)
  if(overlays && !overlays.isEmpty()) await overlays.drawToCanvas(fctx, finalCanvas.width, finalCanvas.height);

  // 3. footer: timestamp / caption / event title / QR / logo
  await stampFooter(fctx, finalCanvas.width, finalCanvas.height, {
    caption: studioCaptionInput.value.trim(),
    eventTitle: eventTitleInput.value.trim(),
    showTimestamp: showTimestampToggle.checked,
    qrText: qrTextInput.value.trim(),
  });

  // 4. hand off to the existing printer animation
  stripCanvas.width = finalCanvas.width; stripCanvas.height = finalCanvas.height;
  stripCanvas.getContext('2d').drawImage(finalCanvas, 0, 0);

  printerDock.setAttribute('aria-hidden', 'false');
  stripWrap.classList.remove('eject');
  void stripWrap.offsetWidth;
  audio.printerHum(1.5);
  setTimeout(() => { stripWrap.classList.add('eject'); audio.polaroidEject(); }, 350);
  setTimeout(() => {
    setPhase('result');
    resultActions.setAttribute('aria-hidden', 'false');
    gallery.add(stripCanvas.toDataURL('image/png'), { template: state.templateId, filter: FILTERS[state.filterIndex].name });
  }, 2100);
}

async function stampFooter(ctx, w, h, { caption, eventTitle, showTimestamp, qrText }){
  const barH = Math.max(50, h * 0.06);
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,.88)';
  ctx.fillRect(0, h - barH, w, barH);
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#3a2c1c';

  let leftText = '';
  if(eventTitle) leftText += eventTitle;
  if(caption) leftText += (leftText ? '  ·  ' : '') + caption;
  if(showTimestamp){
    const now = new Date();
    const pad = n => String(n).padStart(2,'0');
    const stamp = `${pad(now.getMonth()+1)}/${pad(now.getDate())}/${String(now.getFullYear()).slice(2)} ${pad(now.getHours()%12||12)}:${pad(now.getMinutes())} ${now.getHours()>=12?'PM':'AM'}`;
    leftText += (leftText ? '  ·  ' : '') + stamp;
  }
  ctx.font = `${Math.max(11, barH*0.28)}px 'Space Mono', monospace`;
  ctx.fillText(leftText || 'Lumière Booth', 14, h - barH/2, w - 90);

  ctx.textAlign = 'right';
  ctx.font = `700 ${Math.max(10, barH*0.24)}px 'Work Sans', sans-serif`;
  ctx.fillStyle = '#9b7a45';
  ctx.fillText('LUMIÈRE', w - 14, h - barH/2);
  ctx.restore();

  if(qrText){
    try{
      const qrCanvas = document.createElement('canvas');
      // eslint-disable-next-line no-undef
      await QRCode.toCanvas(qrCanvas, qrText, { width: barH*0.9, margin: 0 });
      ctx.drawImage(qrCanvas, w - barH*0.95 - 90, h - barH + barH*0.05, barH*0.9, barH*0.9);
    }catch(e){ /* invalid QR payload — skip silently */ }
  }
}

/* ---------------------------------------------------------------- */
/* Result / Export actions                                           */
/* ---------------------------------------------------------------- */
SOCIAL_PRESETS.forEach(p => {
  const opt = document.createElement('option');
  opt.value = p.id; opt.textContent = p.name;
  socialPresetSelect.appendChild(opt);
});

downloadBtn.addEventListener('click', () => downloadCanvasAs(stripCanvas, `lumiere-${Date.now()}.png`, 'image/png'));
downloadJpegBtn.addEventListener('click', () => downloadCanvasAs(stripCanvas, `lumiere-${Date.now()}.jpg`, 'image/jpeg', 0.92));
downloadHiResBtn.addEventListener('click', () => downloadCanvasAs(exportHiRes(stripCanvas, 3), `lumiere-hires-${Date.now()}.png`, 'image/png'));
downloadPdfBtn.addEventListener('click', () => exportPDF(stripCanvas, `lumiere-${Date.now()}.pdf`));
printBtn.addEventListener('click', () => printCanvas(stripCanvas));
shareBtn.addEventListener('click', () => shareCanvas(stripCanvas));
downloadSocialBtn.addEventListener('click', () => {
  const presetId = socialPresetSelect.value;
  const out = presetId ? resizeForSocial(stripCanvas, presetId) : stripCanvas;
  downloadCanvasAs(out, `lumiere-${presetId || 'original'}-${Date.now()}.png`, 'image/png');
});

anotherBtn.addEventListener('click', () => {
  printerDock.setAttribute('aria-hidden', 'true');
  stripWrap.classList.remove('eject');
  studioCaptionInput.value = '';
  eventTitleInput.value = '';
  qrTextInput.value = '';
  resultActions.setAttribute('aria-hidden', 'true');
  setPhase('active');
});

/* ---------------------------------------------------------------- */
/* Gallery                                                            */
/* ---------------------------------------------------------------- */
function openGallery(){
  renderGallery();
  galleryModal.setAttribute('aria-hidden', 'false');
}
function renderGallery(){
  const entries = gallery.all();
  galleryEmpty.style.display = entries.length ? 'none' : 'block';
  galleryGrid.innerHTML = '';
  entries.forEach(entry => {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.innerHTML = `
      <img src="${entry.dataUrl}" alt="Saved print" />
      <div class="gallery-item-actions">
        <button class="fav-btn ${entry.favorite ? 'fav-on' : ''}" title="Favorite">★</button>
        <button class="dup-btn" title="Duplicate">⧉</button>
        <button class="dl-btn" title="Download">⬇</button>
        <button class="del-btn" title="Delete">✕</button>
      </div>`;
    item.querySelector('.fav-btn').addEventListener('click', () => { gallery.toggleFavorite(entry.id); renderGallery(); });
    item.querySelector('.dup-btn').addEventListener('click', () => { gallery.duplicate(entry.id); renderGallery(); });
    item.querySelector('.dl-btn').addEventListener('click', () => downloadDataUrl(entry.dataUrl, `lumiere-${entry.id}.png`));
    item.querySelector('.del-btn').addEventListener('click', () => { gallery.remove(entry.id); renderGallery(); });
    galleryGrid.appendChild(item);
  });
}
galleryBtn.addEventListener('click', openGallery);
galleryCloseBtn.addEventListener('click', () => galleryModal.setAttribute('aria-hidden', 'true'));
galleryZipBtn.addEventListener('click', () => {
  if(gallery.all().length) downloadAsZip(gallery.all());
});

/* ---------------------------------------------------------------- */
/* Shortcuts help                                                    */
/* ---------------------------------------------------------------- */
helpBtn.addEventListener('click', () => shortcutsModal.setAttribute('aria-hidden', 'false'));
shortcutsCloseBtn.addEventListener('click', () => shortcutsModal.setAttribute('aria-hidden', 'true'));

/* ---------------------------------------------------------------- */
/* Keyboard shortcuts                                                */
/* ---------------------------------------------------------------- */
window.addEventListener('keydown', (e) => {
  const typing = ['INPUT','TEXTAREA'].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable;

  if(e.key === '?'){ shortcutsModal.setAttribute('aria-hidden', shortcutsModal.getAttribute('aria-hidden') === 'false' ? 'true' : 'false'); return; }
  if(e.key === 'Escape'){
    if(shortcutsModal.getAttribute('aria-hidden') === 'false') shortcutsModal.setAttribute('aria-hidden', 'true');
    else if(galleryModal.getAttribute('aria-hidden') === 'false') galleryModal.setAttribute('aria-hidden', 'true');
    else overlays?.deselectAll();
    return;
  }
  if(typing) return;

  if(e.key === ' ' && state.phase === 'active' && !startCaptureBtn.disabled){ e.preventDefault(); beginCaptureSequence(); }
  if(e.key === 'ArrowLeft' && state.phase === 'active'){ selectFilter(state.filterIndex - 1); }
  if(e.key === 'ArrowRight' && state.phase === 'active'){ selectFilter(state.filterIndex + 1); }
  if((e.key === 'g' || e.key === 'G') && state.phase !== 'countdown'){ openGallery(); }
  if((e.key === 'Delete' || e.key === 'Backspace') && overlays?.getActive()){ overlays.remove(overlays.getActive()); }
  if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && overlays?.getActive()){ e.preventDefault(); overlays.duplicate(overlays.getActive()); }
});

/* ---------------------------------------------------------------- */
/* Sound toggle                                                      */
/* ---------------------------------------------------------------- */
soundToggle.addEventListener('click', () => {
  state.soundOn = !state.soundOn;
  audio.setEnabled(state.soundOn);
  soundToggle.textContent = state.soundOn ? '🔊' : '🔇';
});

/* ---------------------------------------------------------------- */
/* Boot                                                               */
/* ---------------------------------------------------------------- */
buildFilterStrip();
updateFrameGuide();
permissionNotice.setAttribute('aria-hidden', 'false');
idleHint.setAttribute('aria-hidden', 'true');

// Autoplay policies require a user gesture before AudioContext / camera
// can start smoothly — the Enable Camera button doubles as that gesture.
