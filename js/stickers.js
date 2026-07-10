// A large, categorized sticker library. Real licensed sticker art isn't
// something this build can source, so stickers are built from curated
// Unicode emoji (crisp at any size, no image licensing issues) plus a
// handful of custom vector "frame" and "speech bubble" stickers drawn
// with inline SVG. Every sticker is fully draggable, resizable, rotatable,
// flippable, duplicable, layerable (bring forward/back) and deletable.

export const STICKER_CATEGORIES = {
  'Vintage': ['📷','📸','🎞️','📼','📻','☎️','🕰️','🧳','🎙️','🖋️','📮','🗝️','🕯️','🪞','🎩','🥃'],
  'Cute': ['🐱','🐶','🐰','🐻','🐼','🦊','🐨','🐹','🦄','🐣','🐥','🐝','🦋','🐢','🐬','🐿️'],
  'Emoji': ['😀','😂','😍','😎','🥳','😜','🤩','😇','🥰','😭','😱','🤔','😏','😴','🤗','🙃'],
  'Love': ['❤️','💕','💖','💗','💘','💝','💞','💓','💜','🧡','💛','💚','💙','😍','💋','💑'],
  'Birthday': ['🎂','🎉','🎈','🎁','🥳','🍰','🕯️','🎊','🪅','🎇','🍾','🥂'],
  'Wedding': ['💍','👰','🤵','💒','🥂','🕊️','💐','👨‍❤️‍👩','💞','⛪','🎊','🤍'],
  'Graduation': ['🎓','📜','🏆','✏️','📚','🥇','🔔','🎊','⭐','📖'],
  'Holiday': ['🎄','🎅','⛄','❄️','🎃','👻','🦃','🐇','🎆','🕎','🧨','🎋'],
  'Travel': ['✈️','🗺️','🧳','🏖️','🗽','🗼','🏔️','🚗','⛵','🚂','🧭','🌍'],
  'Food': ['🍕','🍔','🍟','🍩','🍦','🍫','🍓','🍉','☕','🧋','🍿','🌮'],
  'Pets': ['🐕','🐈','🐹','🐦','🐠','🐢','🐇','🦜','🐴','🐖'],
  'Nature': ['🌸','🌻','🌼','🌺','🌷','🍀','🌈','⭐','☀️','🌙','🔥','🌊'],
  'Frames': ['frame-round','frame-square','frame-scallop','frame-polaroid','frame-heart','frame-film'],
  'Speech Bubbles': ['bubble-round','bubble-cloud','bubble-shout','bubble-heart'],
  'Hats': ['🎩','👒','🧢','👑','🎓','⛑️','🪖','👲'],
  'Glasses': ['🕶️','👓','🥽'],
  'Masks': ['🎭','😷','🥷'],
  'Decorative': ['✨','⭐','🌟','💫','🎀','🔖','🏷️','💠','🔮','🪩','🌟','💎'],
};

const SVG_STICKERS = {
  'frame-round': `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="none" stroke="#D9A857" stroke-width="6"/><circle cx="50" cy="50" r="38" fill="none" stroke="#F1E4C8" stroke-width="1.5"/></svg>`,
  'frame-square': `<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="10" fill="none" stroke="#D9A857" stroke-width="6"/></svg>`,
  'frame-scallop': `<svg viewBox="0 0 100 100"><path d="M50 4 a46 46 0 1 1 -0.1 0 z" fill="none" stroke="#D9A857" stroke-width="5" stroke-dasharray="10 6"/></svg>`,
  'frame-polaroid': `<svg viewBox="0 0 100 120"><rect x="4" y="4" width="92" height="92" fill="none" stroke="#F1E4C8" stroke-width="8"/><rect x="4" y="96" width="92" height="20" fill="#F1E4C8"/></svg>`,
  'frame-heart': `<svg viewBox="0 0 100 100"><path d="M50 88 C10 60 4 30 26 16 C40 8 50 20 50 28 C50 20 60 8 74 16 C96 30 90 60 50 88 Z" fill="none" stroke="#D9576B" stroke-width="5"/></svg>`,
  'frame-film': `<svg viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" fill="none" stroke="#2B1D14" stroke-width="10"/><rect x="12" y="12" width="8" height="8" fill="#2B1D14"/><rect x="80" y="12" width="8" height="8" fill="#2B1D14"/><rect x="12" y="80" width="8" height="8" fill="#2B1D14"/><rect x="80" y="80" width="8" height="8" fill="#2B1D14"/></svg>`,
  'bubble-round': `<svg viewBox="0 0 120 90"><ellipse cx="60" cy="42" rx="56" ry="38" fill="#fff" stroke="#2B1D14" stroke-width="3"/><path d="M40 76 L30 90 L52 78 Z" fill="#fff" stroke="#2B1D14" stroke-width="3"/></svg>`,
  'bubble-cloud': `<svg viewBox="0 0 120 90"><path d="M30 60 a18 18 0 1 1 4-35 a22 22 0 0 1 42-6 a18 18 0 0 1 8 41 Z" fill="#fff" stroke="#2B1D14" stroke-width="3"/><circle cx="26" cy="72" r="6" fill="#fff" stroke="#2B1D14" stroke-width="2"/><circle cx="16" cy="82" r="3" fill="#fff" stroke="#2B1D14" stroke-width="2"/></svg>`,
  'bubble-shout': `<svg viewBox="0 0 120 90"><polygon points="60,4 74,30 100,20 84,42 112,50 82,56 92,82 64,64 50,86 46,60 18,66 36,44 8,32 40,32" fill="#fff" stroke="#2B1D14" stroke-width="3"/></svg>`,
  'bubble-heart': `<svg viewBox="0 0 120 90"><path d="M60 30 C50 14 24 18 24 40 C24 58 46 68 60 80 C74 68 96 58 96 40 C96 18 70 14 60 30 Z" fill="#fff" stroke="#D9576B" stroke-width="3"/></svg>`,
};

export function isSvgSticker(token) { return token in SVG_STICKERS; }
export function svgFor(token) { return SVG_STICKERS[token]; }

/**
 * Manages a layer of draggable/resizable/rotatable sticker + text overlays
 * on top of a design surface (the element that wraps the target photo).
 */
export class OverlayManager {
  /** @param {HTMLElement} surfaceEl the positioned container overlays live in */
  constructor(surfaceEl) {
    this.surface = surfaceEl;
    this.layers = []; // { id, el, type }
    this._nextZ = 10;
    this._activeLayer = null;
    surfaceEl.addEventListener('pointerdown', (e) => {
      if (e.target === surfaceEl) this.deselectAll();
    });
  }

  addSticker(token, x = 50, y = 50) {
    const el = document.createElement('div');
    el.className = 'overlay-item sticker-item';
    if (isSvgSticker(token)) {
      el.innerHTML = svgFor(token);
      el.classList.add('sticker-svg');
    } else {
      el.textContent = token;
      el.classList.add('sticker-emoji');
    }
    return this._mount(el, 'sticker', x, y);
  }

  addText(text = 'Double-click to edit', opts = {}) {
    const el = document.createElement('div');
    el.className = 'overlay-item text-item';
    el.contentEditable = 'false';
    el.spellcheck = false;
    el.textContent = text;
    el.style.fontFamily = opts.font || `'Fraunces', serif`;
    el.style.color = opts.color || '#F1E4C8';
    el.style.fontSize = (opts.size || 32) + 'px';
    if (opts.outline) el.classList.add('text-outline');
    if (opts.shadow) el.classList.add('text-shadow');
    if (opts.curved) el.classList.add('text-curved');
    el.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      el.contentEditable = 'true';
      el.focus();
      document.execCommand('selectAll', false, null);
    });
    el.addEventListener('blur', () => { el.contentEditable = 'false'; });
    return this._mount(el, 'text', opts.x ?? 50, opts.y ?? 50, el);
  }

  _mount(contentEl, type, xPct, yPct) {
    const wrap = document.createElement('div');
    wrap.className = 'overlay-wrap';
    wrap.style.left = xPct + '%';
    wrap.style.top = yPct + '%';
    wrap.style.zIndex = this._nextZ++;
    wrap.appendChild(contentEl);

    const handleRotate = document.createElement('div');
    handleRotate.className = 'handle handle-rotate';
    handleRotate.innerHTML = '↻';
    const handleResize = document.createElement('div');
    handleResize.className = 'handle handle-resize';
    const handleDelete = document.createElement('div');
    handleDelete.className = 'handle handle-delete';
    handleDelete.innerHTML = '✕';
    const handleDup = document.createElement('div');
    handleDup.className = 'handle handle-dup';
    handleDup.innerHTML = '⧉';
    const handleFlip = document.createElement('div');
    handleFlip.className = 'handle handle-flip';
    handleFlip.innerHTML = '⇋';
    wrap.append(handleRotate, handleResize, handleDelete, handleDup, handleFlip);

    this.surface.appendChild(wrap);

    const layer = {
      id: 'ov_' + Math.random().toString(36).slice(2, 9),
      type, el: wrap, contentEl,
      x: xPct, y: yPct, scale: 1, rotation: 0, flipped: false,
    };
    this.layers.push(layer);
    this._applyTransform(layer);
    this._wireInteractions(layer, { handleRotate, handleResize, handleDelete, handleDup, handleFlip });
    this.select(layer);
    return layer;
  }

  _applyTransform(layer) {
    layer.el.style.transform =
      `translate(-50%,-50%) rotate(${layer.rotation}deg) scale(${layer.flipped ? -layer.scale : layer.scale}, ${layer.scale})`;
  }

  _wireInteractions(layer, handles) {
    const wrap = layer.el;

    // drag to move
    wrap.addEventListener('pointerdown', (e) => {
      if (e.target.classList.contains('handle')) return;
      this.select(layer);
      const rect = this.surface.getBoundingClientRect();
      const onMove = (ev) => {
        const xPct = ((ev.clientX - rect.left) / rect.width) * 100;
        const yPct = ((ev.clientY - rect.top) / rect.height) * 100;
        layer.x = Math.min(100, Math.max(0, xPct));
        layer.y = Math.min(100, Math.max(0, yPct));
        wrap.style.left = layer.x + '%';
        wrap.style.top = layer.y + '%';
      };
      const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    });

    // rotate handle
    handles.handleRotate.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      const rect = wrap.getBoundingClientRect();
      const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
      const onMove = (ev) => {
        const angle = Math.atan2(ev.clientY - cy, ev.clientX - cx) * (180 / Math.PI);
        layer.rotation = angle + 90;
        this._applyTransform(layer);
      };
      const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    });

    // resize handle
    handles.handleResize.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      const rect = wrap.getBoundingClientRect();
      const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
      const startDist = Math.hypot(e.clientX - cx, e.clientY - cy) || 1;
      const startScale = layer.scale;
      const onMove = (ev) => {
        const d = Math.hypot(ev.clientX - cx, ev.clientY - cy);
        layer.scale = Math.max(0.25, Math.min(6, startScale * (d / startDist)));
        this._applyTransform(layer);
      };
      const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    });

    handles.handleDelete.addEventListener('click', (e) => { e.stopPropagation(); this.remove(layer); });
    handles.handleDup.addEventListener('click', (e) => { e.stopPropagation(); this.duplicate(layer); });
    handles.handleFlip.addEventListener('click', (e) => { e.stopPropagation(); layer.flipped = !layer.flipped; this._applyTransform(layer); });
  }

  select(layer) {
    this.layers.forEach(l => l.el.classList.toggle('selected', l === layer));
    this._activeLayer = layer;
  }
  deselectAll() {
    this.layers.forEach(l => l.el.classList.remove('selected'));
    this._activeLayer = null;
  }
  getActive() { return this._activeLayer; }

  remove(layer) {
    layer.el.remove();
    this.layers = this.layers.filter(l => l !== layer);
    if (this._activeLayer === layer) this._activeLayer = null;
  }

  duplicate(layer) {
    const clone = layer.type === 'sticker'
      ? this.addSticker(layer.contentEl.textContent || '', Math.min(95, layer.x + 4), Math.min(95, layer.y + 4))
      : this.addText(layer.contentEl.textContent, { x: Math.min(95, layer.x + 4), y: Math.min(95, layer.y + 4) });
    clone.scale = layer.scale; clone.rotation = layer.rotation; clone.flipped = layer.flipped;
    this._applyTransform(clone);
    return clone;
  }

  bringForward(layer) { layer.el.style.zIndex = this._nextZ++; }
  sendBackward(layer) { layer.el.style.zIndex = Math.max(1, parseInt(layer.el.style.zIndex, 10) - 2); }

  clear() {
    this.layers.forEach(l => l.el.remove());
    this.layers = [];
    this._activeLayer = null;
  }

  isEmpty() { return this.layers.length === 0; }

  /**
   * Draws all overlay layers onto a target canvas context, mapping the
   * surface's percentage-based coordinate system onto canvas pixels.
   * Called at export/print time to "bake" overlays into the photo.
   */
  async drawToCanvas(ctx, canvasW, canvasH) {
    for (const layer of this.layers) {
      const px = (layer.x / 100) * canvasW;
      const py = (layer.y / 100) * canvasH;
      const baseSize = Math.min(canvasW, canvasH) * 0.14 * layer.scale;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.scale(layer.flipped ? -1 : 1, 1);

      if (layer.type === 'sticker') {
        const token = layer.contentEl.textContent;
        if (isSvgSticker(token)) {
          const img = await svgToImage(svgFor(token));
          ctx.drawImage(img, -baseSize / 2, -baseSize / 2, baseSize, baseSize);
        } else {
          ctx.font = `${baseSize}px sans-serif`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(token, 0, 0);
        }
      } else {
        const fontSize = parseFloat(layer.contentEl.style.fontSize || '32') * layer.scale;
        ctx.font = `${fontSize}px ${layer.contentEl.style.fontFamily || 'Fraunces, serif'}`;
        ctx.fillStyle = layer.contentEl.style.color || '#F1E4C8';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        if (layer.contentEl.classList.contains('text-shadow')) {
          ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
        }
        if (layer.contentEl.classList.contains('text-outline')) {
          ctx.lineWidth = Math.max(1, fontSize * 0.06);
          ctx.strokeStyle = 'rgba(0,0,0,.8)';
          ctx.strokeText(layer.contentEl.textContent, 0, 0);
        }
        ctx.fillText(layer.contentEl.textContent, 0, 0);
      }
      ctx.restore();
    }
  }
}

function svgToImage(svgMarkup) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgMarkup], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = reject;
    img.src = url;
  });
}
