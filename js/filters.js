// Each preset defines a CSS filter chain for the base image, plus
// parameters consumed by renderer.js to draw grain/vignette/tint/scratches/
// light-leak/chromatic-aberration overlays on top.

export const FILTERS = [
  {
    id: 'vintage1970',
    name: 'Vintage Film 1970',
    css: 'contrast(1.08) saturate(1.25) sepia(.18) brightness(1.02)',
    tint: 'rgba(196,140,60,0.12)',
    grain: .28, vignette: .55, scratches: .15, leak: .3, aberration: 1.1, fade: .06
  },
  {
    id: 'kodakGold',
    name: 'Kodak Gold',
    css: 'contrast(1.12) saturate(1.35) brightness(1.05) hue-rotate(-4deg)',
    tint: 'rgba(255,176,64,0.10)',
    grain: .18, vignette: .35, scratches: .05, leak: .4, aberration: .6, fade: .02
  },
  {
    id: 'polaroidClassic',
    name: 'Polaroid Classic',
    css: 'contrast(.95) saturate(.9) brightness(1.08) sepia(.08)',
    tint: 'rgba(255,244,214,0.14)',
    grain: .22, vignette: .5, scratches: .08, leak: .2, aberration: .4, fade: .12
  },
  {
    id: 'sepia',
    name: 'Sepia',
    css: 'sepia(.85) contrast(1.05) brightness(1.02)',
    tint: 'rgba(112,66,20,0.08)',
    grain: .25, vignette: .5, scratches: .1, leak: .1, aberration: .2, fade: .05
  },
  {
    id: 'bwFilm',
    name: 'Black & White Film',
    css: 'grayscale(1) contrast(1.22) brightness(1.02)',
    tint: 'rgba(0,0,0,0)',
    grain: .35, vignette: .55, scratches: .22, leak: .05, aberration: .1, fade: .0
  },
  {
    id: 'warmSunset',
    name: 'Warm Sunset',
    css: 'saturate(1.4) contrast(1.05) brightness(1.06) hue-rotate(-8deg)',
    tint: 'rgba(255,120,60,0.16)',
    grain: .12, vignette: .4, scratches: .02, leak: .55, aberration: .5, fade: .02
  },
  {
    id: 'dreamyFade',
    name: 'Dreamy Fade',
    css: 'contrast(.85) brightness(1.15) saturate(1.05) blur(.3px)',
    tint: 'rgba(255,255,255,0.10)',
    grain: .1, vignette: .25, scratches: .0, leak: .35, aberration: .3, fade: .22
  },
  {
    id: 'dustScratches',
    name: 'Dust & Scratches',
    css: 'contrast(1.1) grayscale(.3) brightness(.98)',
    tint: 'rgba(60,50,30,0.08)',
    grain: .4, vignette: .45, scratches: .5, leak: .05, aberration: .2, fade: .04
  },
  {
    id: 'cinematicMatte',
    name: 'Cinematic Matte',
    css: 'contrast(1.15) saturate(.85) brightness(.96)',
    tint: 'rgba(20,40,50,0.14)',
    grain: .14, vignette: .6, scratches: .0, leak: .15, aberration: .8, fade: .1
  },
  {
    id: 'softPastel',
    name: 'Soft Pastel',
    css: 'saturate(.75) brightness(1.12) contrast(.92)',
    tint: 'rgba(255,214,235,0.12)',
    grain: .08, vignette: .2, scratches: .0, leak: .25, aberration: .2, fade: .15
  },
  {
    id: 'disposable',
    name: 'Disposable Camera',
    css: 'contrast(1.2) saturate(1.2) brightness(1.1)',
    tint: 'rgba(255,255,255,0.06)',
    grain: .45, vignette: .3, scratches: .1, leak: .6, aberration: .3, fade: .0
  },
  {
    id: 'vhsRetro',
    name: 'VHS Retro',
    css: 'contrast(1.1) saturate(1.5) brightness(1.0) hue-rotate(2deg)',
    tint: 'rgba(0,200,255,0.06)',
    grain: .3, vignette: .35, scratches: .0, leak: .1, aberration: 2.4, fade: .0, scanlines:true
  },
  {
    id: 'oldMagazine',
    name: 'Old Magazine Print',
    css: 'contrast(1.3) saturate(.9) brightness(1.0)',
    tint: 'rgba(255,240,200,0.1)',
    grain: .2, vignette: .3, scratches: .12, leak: .05, aberration: .3, fade: .0, halftone:true
  },
  {
    id: 'filmBurn',
    name: 'Film Burn',
    css: 'contrast(1.15) saturate(1.3) brightness(1.05)',
    tint: 'rgba(255,80,0,0.10)',
    grain: .22, vignette: .4, scratches: .05, leak: .8, aberration: .6, fade: .0, burn:true
  },
  {
    id: 'japaneseCafe',
    name: 'Japanese Cafe',
    css: 'contrast(.98) saturate(.88) brightness(1.06) sepia(.06)',
    tint: 'rgba(220,210,190,0.14)',
    grain: .15, vignette: .3, scratches: .0, leak: .2, aberration: .3, fade: .1
  },

  // ---- Cinematic ----
  {
    id: 'tealOrange',
    name: 'Blockbuster Teal',
    css: 'contrast(1.2) saturate(1.15) brightness(1.0) hue-rotate(4deg)',
    tint: 'rgba(0,90,110,0.14)',
    grain: .08, vignette: .5, scratches: 0, leak: .1, aberration: .5, fade: 0
  },
  {
    id: 'noirFilm',
    name: 'Film Noir',
    css: 'grayscale(1) contrast(1.4) brightness(.92)',
    tint: 'rgba(0,0,0,0)',
    grain: .3, vignette: .7, scratches: .1, leak: 0, aberration: 0, fade: 0
  },
  {
    id: 'goldenHour',
    name: 'Golden Hour',
    css: 'saturate(1.25) contrast(1.05) brightness(1.1) hue-rotate(-6deg)',
    tint: 'rgba(255,170,60,0.14)',
    grain: .06, vignette: .3, scratches: 0, leak: .5, aberration: .3, fade: .05
  },
  {
    id: 'moodyBlue',
    name: 'Moody Blue Hour',
    css: 'contrast(1.15) saturate(.9) brightness(.92) hue-rotate(-14deg)',
    tint: 'rgba(20,40,80,0.2)',
    grain: .1, vignette: .55, scratches: 0, leak: .1, aberration: .4, fade: 0
  },

  // ---- Retro / Y2K ----
  {
    id: 'y2kFlash',
    name: 'Y2K Digicam Flash',
    css: 'contrast(1.25) saturate(1.4) brightness(1.15)',
    tint: 'rgba(255,255,255,0.08)',
    grain: .32, vignette: .2, scratches: 0, leak: .3, aberration: .4, fade: 0
  },
  {
    id: 'lomoRetro',
    name: 'Lomo Retro',
    css: 'contrast(1.3) saturate(1.5) brightness(.98)',
    tint: 'rgba(255,60,120,0.08)',
    grain: .22, vignette: .75, scratches: .05, leak: .35, aberration: .7, fade: 0
  },
  {
    id: 'disco70s',
    name: 'Studio 54',
    css: 'saturate(1.5) contrast(1.15) brightness(1.05) sepia(.1)',
    tint: 'rgba(200,80,180,0.12)',
    grain: .18, vignette: .5, scratches: .1, leak: .4, aberration: .5, fade: 0
  },

  // ---- Neon / Y2K digital ----
  {
    id: 'neonNights',
    name: 'Neon Nights',
    css: 'contrast(1.25) saturate(1.6) brightness(1.0) hue-rotate(-10deg)',
    tint: 'rgba(160,0,255,0.14)',
    grain: .05, vignette: .55, scratches: 0, leak: .5, aberration: 1.6, fade: 0, scanlines: true
  },
  {
    id: 'cyberpunkGlow',
    name: 'Cyberpunk Glow',
    css: 'contrast(1.3) saturate(1.5) brightness(.98) hue-rotate(160deg)',
    tint: 'rgba(0,200,255,0.14)',
    grain: .05, vignette: .5, scratches: 0, leak: .45, aberration: 2.0, fade: 0
  },

  // ---- Monochrome variants ----
  {
    id: 'silverGelatin',
    name: 'Silver Gelatin',
    css: 'grayscale(1) contrast(1.1) brightness(1.05)',
    tint: 'rgba(0,0,0,0)',
    grain: .18, vignette: .35, scratches: .05, leak: 0, aberration: 0, fade: .04
  },
  {
    id: 'highContrastMono',
    name: 'High-Contrast Mono',
    css: 'grayscale(1) contrast(1.55) brightness(1.0)',
    tint: 'rgba(0,0,0,0)',
    grain: .12, vignette: .4, scratches: 0, leak: 0, aberration: 0, fade: 0
  },

  // ---- Pastel / dreamy ----
  {
    id: 'cottonCandy',
    name: 'Cotton Candy',
    css: 'saturate(.7) brightness(1.15) contrast(.88) hue-rotate(6deg)',
    tint: 'rgba(255,190,230,0.14)',
    grain: .05, vignette: .15, scratches: 0, leak: .3, aberration: .2, fade: .18
  },
  {
    id: 'mintFresh',
    name: 'Mint Fresh',
    css: 'saturate(.8) brightness(1.1) contrast(.95) hue-rotate(60deg)',
    tint: 'rgba(180,255,220,0.1)',
    grain: .06, vignette: .2, scratches: 0, leak: .2, aberration: .2, fade: .1
  },

  // ---- Seasonal ----
  {
    id: 'autumnHarvest',
    name: 'Autumn Harvest',
    css: 'saturate(1.3) contrast(1.08) brightness(1.0) hue-rotate(-10deg) sepia(.1)',
    tint: 'rgba(200,100,30,0.14)',
    grain: .14, vignette: .5, scratches: .04, leak: .3, aberration: .4, fade: 0
  },
  {
    id: 'wintersFrost',
    name: "Winter's Frost",
    css: 'saturate(.7) contrast(1.05) brightness(1.12) hue-rotate(-18deg)',
    tint: 'rgba(200,220,255,0.16)',
    grain: .1, vignette: .4, scratches: 0, leak: .15, aberration: .2, fade: .12
  },
  {
    id: 'springBloom',
    name: 'Spring Bloom',
    css: 'saturate(1.2) contrast(1.02) brightness(1.08) hue-rotate(4deg)',
    tint: 'rgba(255,220,230,0.1)',
    grain: .06, vignette: .2, scratches: 0, leak: .35, aberration: .2, fade: .08
  },
  {
    id: 'summerHaze',
    name: 'Summer Haze',
    css: 'saturate(1.15) contrast(1.0) brightness(1.14)',
    tint: 'rgba(255,240,180,0.14)',
    grain: .08, vignette: .15, scratches: 0, leak: .5, aberration: .3, fade: .16
  },

  // ---- Artistic ----
  {
    id: 'duotoneCrimson',
    name: 'Duotone Crimson',
    css: 'grayscale(1) contrast(1.3) brightness(1.0) sepia(1) hue-rotate(-50deg) saturate(3)',
    tint: 'rgba(0,0,0,0)',
    grain: .1, vignette: .45, scratches: 0, leak: 0, aberration: 0, fade: 0
  },
  {
    id: 'duotoneCyan',
    name: 'Duotone Cyan',
    css: 'grayscale(1) contrast(1.3) brightness(1.05) sepia(1) hue-rotate(150deg) saturate(2.6)',
    tint: 'rgba(0,0,0,0)',
    grain: .1, vignette: .45, scratches: 0, leak: 0, aberration: 0, fade: 0
  },
  {
    id: 'infraredDream',
    name: 'Infrared Dream',
    css: 'saturate(1.6) contrast(1.2) brightness(1.05) hue-rotate(120deg)',
    tint: 'rgba(255,0,120,0.08)',
    grain: .1, vignette: .4, scratches: 0, leak: .3, aberration: .8, fade: 0
  },
  {
    id: 'sketchFade',
    name: 'Faded Sketch',
    css: 'grayscale(.6) contrast(1.35) brightness(1.15) saturate(.6)',
    tint: 'rgba(255,255,255,0.06)',
    grain: .28, vignette: .25, scratches: .2, leak: .05, aberration: .1, fade: .1
  },
];

export function getFilter(id){
  return FILTERS.find(f => f.id === id) || FILTERS[0];
}
