# Lumière Booth — Pro

A single-user, browser-based AI vintage photo booth. Webcam + MediaPipe
Hands only — no networking, no WebRTC, no accounts, no backend. Everything
runs client-side; vanilla ES6, no build step, no frameworks.

This is the original solo booth (camera, hand-gesture activation, live
filters, countdown, capture) plus a large "studio" layer added on top:
a bigger filter library, a sticker system, text overlays, a print-layout
designer with background customization, a full photo-editing panel, a
session gallery, and multi-format export.

## Run it

```bash
cd vintage-photobooth-pro
python3 -m http.server 8080
```
Open `http://localhost:8080` and allow camera access. (Must be served over
`http://`/`https://` — opening `index.html` directly won't work, because of
ES module imports and camera permissions.) An internet connection is needed
once, to load MediaPipe Hands, JSZip, jsPDF, and the QR code library from
CDN.

## What's new vs. the original solo booth

**Filters** — 36 live-preview presets (was 15), organized loosely across
vintage, cinematic, retro/Y2K, neon, monochrome, pastel, seasonal, and
artistic looks (`js/filters.js`).

**Stickers** (`js/stickers.js`) — 18 categories, 192 stickers total,
fully draggable/resizable/rotatable/flippable/duplicable/deletable. Real
licensed sticker art isn't something this build can source, so these are
built from curated Unicode emoji (crisp at any size, zero licensing risk)
plus six custom vector frames/speech-bubbles drawn as inline SVG. If you
have an actual art pack, dropping PNG/SVG stickers into the category lists
is a small, contained change.

**Text overlays** — same drag/resize/rotate system as stickers, with font,
color, outline, and shadow options, plus dedicated caption / event-title /
timestamp / QR-code fields baked into the print's footer.
*Curved text specifically is not implemented* — canvas text-on-a-path
is real work and didn't make the cut here; flag it if you want it added.

**Layout designer** (`js/layouts.js`) — 13 print templates: classic
2/3/4-photo strips, Polaroid, 2×2 and 3×3 square grids, postcard, postcard
collage, scrapbook page, film-negative strip, passport grid, mini-prints
sheet, and greeting card. Each is customizable: border color, paper
texture toggle, corner radius, spacing, and print size (small/medium/
large). Backgrounds include solid, gradient, kraft texture, floral,
retro-stripe, and soft-blur styles.

**Editing panel** (`js/editor.js`) — per-photo adjustments: brightness,
contrast, saturation, temperature, tint, exposure, highlights, shadows,
vignette, film grain, sharpen, blur, noise reduction, light leak. Applied
via a real per-pixel pass (not just CSS filters) since this runs once per
still image rather than every video frame.

**Gallery** (`js/gallery.js`) — session history of finished prints,
persisted via `localStorage` (this is a standalone site, not a chat
artifact, so that's the right tool here — capped around 40 entries since
localStorage tops out at a few MB). Favorite, duplicate, delete, download
individually, or download everything as a ZIP (via JSZip).

**Export** (`js/exporter.js`) — PNG, JPEG, and print-ready PDF (via
jsPDF); a hi-res 3× upscale option; social-media crop presets (Instagram
post/story, Facebook post, desktop/phone wallpaper); a dedicated print flow
that opens a clean print-only window instead of fighting the app's own
screen layout; and native share where the browser supports it.

**Polish** — keyboard shortcuts (Space to capture, arrow keys to change
filter, Delete/Ctrl+D on selected stickers, G for gallery, ? for help,
Esc to back out), visible focus states, responsive layout down to phone
width, and the same premium animation/sound language as the original.

## Live preview performance & capture-timing fix

The render loop previously recomputed several effects at full canvas
resolution on every single frame — most expensively, the "old magazine"
halftone dots (tens of thousands of individual draws per frame) and
film-grain noise (a full per-pixel regeneration at up to several million
pixels on high-DPI screens). That could visibly back up the main thread,
and since capture used to read its pixels from that same canvas, a
captured photo could end up noticeably behind the pose you were actually
holding. Fixed by:

- Capping internal render resolution to ~1920px on the long edge
  regardless of screen DPI (CSS handles the upscale, so there's no visible
  quality loss on ordinary displays).
- Replacing the halftone/scanline per-frame loops with cached
  `CanvasPattern` fills (one draw call regardless of resolution) and
  shrinking grain generation to a small reusable noise tile.
- Computing chromatic aberration on a small offscreen canvas and
  upscaling it, instead of running the filtered redraw twice at full
  resolution.
- **Capturing directly from the raw camera feed** the instant the
  countdown hits zero — not from the composited preview canvas — so the
  saved photo can never inherit any rendering lag. Shutter sound and
  flash fire immediately after that pixel grab; the cosmetic filter pass
  (identical to what the live preview shows) is applied to the
  already-captured frame afterward, so it can't delay the capture itself.
- The countdown now runs on `requestAnimationFrame` against a fixed
  wall-clock target instead of `setInterval`, which can drift under load.

## Orientation selector

A **Portrait / Landscape** choice is available in two places — the filter
panel before you start a session, and the top of the Studio's Layout tab
— and both stay in sync with each other. Selecting an orientation:

- Adjusts the **live capture frame guide** (a bordered rectangle overlaid
  on the fullscreen camera view, showing exactly what will be captured)
  without changing the immersive fullscreen background itself.
- Crops each captured photo to that orientation's aspect ratio (3:4
  portrait / 4:3 landscape) directly from the native camera resolution —
  no upscaling, so capture quality is unaffected.
- Reflows **every one of the 13 templates** into a dedicated portrait or
  landscape arrangement — for example, a classic strip stacks photos
  vertically in portrait but lays them out left-to-right in landscape; a
  film-negative strip runs horizontally in landscape but becomes a
  vertical filmstrip in portrait; postcard collages transpose their
  big-photo/small-photos arrangement, and so on.
- Automatically applies to borders, backgrounds, paper texture, the
  footer (timestamp/caption/logo), and any stickers or text you've
  placed, since those are already computed relative to the composed
  canvas's current size — no separate orientation-specific logic was
  needed for them.
- The Studio's live preview canvas already re-renders on every relevant
  change, so switching orientation there shows the final print layout
  immediately, before you commit to it.

**One deliberate design choice worth knowing:** orientation changes the
overall *page* shape and how cells are arranged, but it does not change
how an individual photo is fitted into its cell — that remains cover-fit
(fills the cell, cropping any excess), exactly as it was before this
change. An earlier revision of this app briefly switched to "contain-fit"
(never crop, letterbox instead) and was explicitly reverted back to
cover-fit at your request, so this update preserves that reverted
behavior rather than reintroducing it. If you'd actually like individual
photos to never be cropped within their cells (letterboxed instead), that
would be a one-line change to `drawPhotoInCell` in `js/layouts.js` — happy
to make it if that's what you want.

## Things worth knowing before you rely on this

- **Templates that need more photos than you captured** (e.g. the 3×3 grid
  needs 9, but the capture flow only offers 2/3/4 shots) get padded by
  repeating the last photo to fill the remaining slots, rather than
  blocking the template. It's a deliberate trade-off — extending the
  capture-count options to match every template would mean changing the
  original countdown/capture UI, which the brief asked to leave alone.
- **Highlights/shadows/sharpen/noise-reduction** are real per-pixel
  operations, not just presets — good for a single still image, but they'd
  be too slow to run on every live video frame, which is why the *live
  preview* still uses the cheaper CSS-filter pipeline from the original
  booth, and the editing panel only touches already-captured stills.
- **QR codes** encode whatever text/link you type into the QR field —
  there's no backend here to auto-generate a hosted link to the photo
  itself, so it's most useful for something like an event URL or a note.
- Gallery persistence is per-browser (`localStorage`), not synced anywhere
  — clearing site data clears the gallery.
