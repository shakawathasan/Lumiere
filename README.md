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

## Performance, capture-timing, and cropping fixes

**Live preview performance.** The render loop previously recomputed
several effects at full canvas resolution on every single frame — most
expensively, the "old magazine" halftone dots (tens of thousands of
individual `arc()` draws per frame) and film-grain noise (a full
per-pixel `ImageData` regeneration at up to several million pixels on
high-DPI screens). That was consuming most of a video frame's time
budget, which under load could visibly delay the whole page including
the countdown timer. Fixed by:
- Capping the internal render resolution to ~1600px on the long edge
  regardless of screen DPI (CSS `object-fit: cover` handles the upscale
  for free — this is a resolution the eye can't tell apart from native
  on a live camera feed, but is far cheaper to redraw 60x/second).
- Replacing the halftone/scanline per-frame loops with cached
  `CanvasPattern` fills — one `fillRect()` call regardless of resolution,
  instead of thousands of individual shape draws.
- Replacing full-resolution grain regeneration with a small (320×320)
  noise tile, regenerated a few times a second and blitted up — same
  visual grain, a fraction of the pixel-writes.
- Computing chromatic aberration on a small fixed-size offscreen canvas
  and upscaling it, instead of running the (expensive) color-filtered
  redraw twice at full screen resolution.
- Using low-latency canvas context hints (`desynchronized`, `alpha:false`
  on the opaque preview layer).

**The ~2-second capture delay.** This was a direct consequence of the
above: capture read its pixels from the *already-rendered* preview
canvas, so if that canvas's rendering had backed up under load, the
captured photo inherited that staleness — and the countdown itself used
`setInterval`, which can also drift when the main thread is busy. Fixed
by capturing directly from the raw `<video>` element the instant the
countdown hits zero (bypassing the composited preview canvas entirely),
firing the shutter sound/flash immediately after that pixel grab, and
moving the countdown to `requestAnimationFrame` scheduling against a
fixed wall-clock target instead of a plain interval. The heavier cosmetic
pass (grain, aberration, halftone, vignette) now runs once, after the
raw frame is already safely captured, so it can never delay the moment
of capture itself.

**Cropping/zooming in layouts.** Every template previously used a
cover-fit (like CSS `object-fit: cover`) to fill each photo cell, which
crops whatever doesn't fit the cell's exact aspect ratio — the more a
captured photo's aspect differed from a cell's shape, the more visible
the crop/zoom. Combined with the capture fix above (photos are now saved
at the camera's true native aspect ratio, not the screen's), this is
fixed at the root: every template now uses **contain-fit** (matching CSS
`object-fit: contain`) — the complete photo is always visible, at its
true proportions, never cropped, zoomed, or stretched. Any leftover space
inside a cell simply shows the page background already painted underneath
it, which reads as a clean mat rather than a gap.

## New print layouts

**Classic 2×6 Photo Booth Strip** (`js/layouts.js` → `buildStrip2x6`) —
dimensionally accurate 2×6 inch strip (not an arbitrary pixel size),
available in 3-photo and 4-photo versions, with the usual border/corner/
paper-texture/timestamp/caption/logo controls. When this template is
selected, a **"Print two strips per 4×6 sheet"** toggle appears in the
Background tab — turning it on wraps the finished strip into an accurate
4×6 sheet containing two identical copies side by side with a dashed cut
line down the middle, the way a real photo-booth dye-sub printer produces
strips, for every download/print/PDF action.

**4×6 Postcard** (`js/layouts.js` → `buildPostcard4x6`) — a true 4×6 inch
format with one-photo, two-photo, three-photo collage, and four-photo
collage presets, plus a "custom collage" variant that auto-arranges any
number of photos in a grid. Same border/background/texture/caption/
event-title/timestamp/logo controls as every other template.

Both new template families use **print size = DPI** rather than a
physical size multiplier (150/300/450 DPI for small/medium/large) — the
paper size stays exactly 2×6 or 4×6 inches at every setting; what changes
is print resolution/quality. This is different from the legacy templates,
where print size scales the whole layout up or down — that distinction
is intentional, since "2×6 inches" wouldn't mean anything if the size
setting could shrink or stretch it.

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
- **The 2×6/4×6 templates at "Large" (450 DPI)** produce genuinely large
  canvases (up to ~1800×2700px), so the live Studio preview may feel very
  slightly less snappy while dragging sliders on that combination — the
  final output quality is the point of that setting, so this is an
  intentional trade-off rather than a bug.
- **QR codes** encode whatever text/link you type into the QR field —
  there's no backend here to auto-generate a hosted link to the photo
  itself, so it's most useful for something like an event URL or a note.
- Gallery persistence is per-browser (`localStorage`), not synced anywhere
  — clearing site data clears the gallery.
