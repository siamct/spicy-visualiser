// NAME: Spicy Visualiser
// VERSION: 0.9.0
// DESCRIPTION: Add-on for Spicy Lyrics (needs the Spicy Lyrics extension). Music visualiser inside the Spicy Lyrics view (page, fullscreen, cinema and popout). Styles inspired by Monstercat, NCS and more. Reacts to the real music through the Spicy Visualiser helper.
//
// The NCS dot sphere is adapted from Konsl's spicetify-visualizer
// (https://github.com/Konsl/spicetify-visualizer), MIT License, Copyright (c) 2026 Konsl.

(function SpicyVisualiser() {
  "use strict";

  if (!window.Spicetify || !Spicetify.Player || !Spicetify.Player.addEventListener || !Spicetify.Player.data) {
    setTimeout(SpicyVisualiser, 300);
    return;
  }
  if (window.__spicyVisualiserLoaded) return;
  window.__spicyVisualiserLoaded = true;

  // ===========================================================================
  // Styles and settings
  // ===========================================================================
  const HELPER_URL = "ws://127.0.0.1:47823";
  const STORE_KEY = "spicy-visualiser:v1";

  const STYLES = [
    ["particles", "Particles"],
    ["monstercat", "Monstercat"],
    ["ncs", "NCS Sphere"],
    ["radial", "Radial Bars"],
    ["mirror", "Mirror Bars"],
    ["retro", "Retro Bars"],
    ["plasma", "Plasma"],
    ["ink", "Ink in Water"],
    ["warp", "Warp"],
    ["motion", "Beat Motion"],
    ["dnb", "Liquid"],
    ["neuro", "Neuro Mesh"],
    ["ascii", "ASCII"],
    ["geometric", "Geometric"],
    ["bauhaus", "Bauhaus Tiles"],
    ["trap", "Trap Circle"],
    ["sub", "Subwoofer"],
    ["led", "LED Wall"],
    ["ledplasma", "LED Plasma"],
    ["off", "Off"],
  ];
  const HINT = {
    particles: "A living field of light: drifts in a gentle flow, links up into constellations, bursts outwards on kicks and twinkles with the hi-hats.",
    monstercat: "Monstercat-style bars: snap up on hits, fall with gravity.",
    ncs: "NCS-style sphere of glowing dots that ripples with the music.",
    radial: "Spectrum bars in a ring around the album art.",
    mirror: "Bars mirrored up and down, bass in the middle.",
    plasma: "The LED Plasma fluid drawn smooth: flows faster, swirls harder and glows brighter with the music, surges on kicks, colours sweep round on every beat (Look tab: change every beat, 2, 4 or 8).",
    warp: "Hyperspace stars, faster on the bass.",
    dnb: "Liquid: a flowing three-strand bass wave that pumps on kicks, streaks racing past, and a flash on every snare.",
    ascii: "Terminal-style spectrum made of characters, with falling peak markers.",
    led: "A panel of glowing LED dots (unlit ones faintly visible) showing spectrum bars with falling peak dots.",
    motion: "Smooth movement locked to the song's beat. Sweep: a band of light glides across on every beat, back and forth, colour changing each bar. Radar: an arm goes round once a bar past four beat marks, kicks leave blips. Rings: a ring ripples out on every beat, a bigger one on each bar.",
    ledplasma: "A fluid on the LED panel: it flows faster, swirls harder and glows brighter with the music, surges on kicks, and its colours sweep round on every beat (Look tab: change every beat, 2, 4 or 8).",
    trap: "The classic trap-channel circle with nothing in the middle: the spectrum round a circle, mirrored, bass at the bottom; a white layer in front with seven colour layers bursting out behind it on every hit, a bass bounce, shake, and white dust flying towards you.",
    retro: "The classic old media-player spectrum: segmented bars coloured by height (blue and green at the bottom, yellow, then orange and red at the top) with peak caps that hang, then drop.",
    neuro: "Drum & bass: a wireframe landscape rolling towards you, fed by the spectrum. It twists with the bass like a wobbling reese, glitches on every snare and lights up on drops.",
    ink: "Ink in water: a real fluid. Kicks drop ink in from the top and it sinks and billows, the bass stirs it, snares flick a splash, drops burst ink out of the middle. Colours step on the beat.",
    sub: "A big subwoofer drawn in light: kicks punch the cone out and it springs back, the surround wobbles with the bass, the light ring changes colour on the beat, and a drop gives one huge push with a shockwave. Sits round the album art when it's on screen.",
    bauhaus: "A poster grid of flat circles, half circles, quarter circles and triangles: shapes grow with their part of the spectrum, tiles turn a quarter on the beat and the colours step round, drops reshuffle the grid. Look tab: change every beat, 2, 4 or 8.",
    geometric: "Bold flat shapes like a modern poster: slanted bands slide in from the edges with the spectrum, colours step round on the beat, drops shuffle the layout. Look tab: Poster or Brutalist, and change every beat, 2, 4 or 8.",
    off: "Visualiser hidden.",
  };
  // Little pictures for the style picker.
  const STYLE_ICON = {
    particles: '<g stroke="currentColor" stroke-width="1" opacity=".55"><path d="M5 7l6 4 7-5M11 11l-4 7M11 11l7 5"/></g><circle cx="5" cy="7" r="2"/><circle cx="11" cy="11" r="2.4"/><circle cx="18" cy="6" r="1.6"/><circle cx="7" cy="18" r="1.7"/><circle cx="18" cy="16" r="2"/>',
    monstercat: '<rect x="3" y="11" width="2.5" height="9" rx=".6"/><rect x="7" y="6" width="2.5" height="14" rx=".6"/><rect x="11" y="9" width="2.5" height="11" rx=".6"/><rect x="15" y="4" width="2.5" height="16" rx=".6"/><rect x="19" y="13" width="2.5" height="7" rx=".6"/>',
    ncs: '<g opacity=".9"><circle cx="12" cy="12" r="1"/><circle cx="8" cy="9" r=".9"/><circle cx="16" cy="9" r=".9"/><circle cx="8" cy="15" r=".9"/><circle cx="16" cy="15" r=".9"/><circle cx="12" cy="6" r=".8"/><circle cx="12" cy="18" r=".8"/><circle cx="5.5" cy="12" r=".7"/><circle cx="18.5" cy="12" r=".7"/><circle cx="7" cy="5.5" r=".5"/><circle cx="17" cy="5.5" r=".5"/><circle cx="7" cy="18.5" r=".5"/><circle cx="17" cy="18.5" r=".5"/></g>',
    radial: '<circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="1.5"/><g stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 6V2.5M12 18v3.5M6 12H3M18 12h3.5M7.8 7.8 5.5 5.5M16.2 16.2l2 2M16.2 7.8l2.6-2.6M7.8 16.2 6 18"/></g>',
    mirror: '<g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 10v4M8 7v10M12 5v14M16 8v8M20 10v4"/></g>',
    plasma: '<path d="M3 7c4-4 8 4 12 0s6 2 6 2v10c-4 3-6-3-10 0s-8-2-8-2z" opacity=".75"/>',
    warp: '<g stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 12 4 4M12 12l8-8M12 12l-8 8M12 12l8 8M12 12V2M12 12v10M12 12H2M12 12h10" opacity=".8"/></g>',
    dnb: '<path d="M2 15c2-4 3 4 5 0s3-5 5-1 3 5 5 0 3-3 5-1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><g stroke="currentColor" stroke-width="1.4" stroke-linecap="round" opacity=".6"><path d="M4 6h7M13 9h8M7 4h4"/></g>',
    ascii: '<text x="2" y="10" font-size="8" font-family="monospace" font-weight="700">&gt;_</text><g opacity=".85"><rect x="3" y="15" width="2.5" height="6"/><rect x="7" y="12" width="2.5" height="9"/><rect x="11" y="16" width="2.5" height="5"/><rect x="15" y="13" width="2.5" height="8"/><rect x="19" y="17" width="2.5" height="4"/></g>',
    motion: '<g fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="6.5" opacity=".65"/><circle cx="12" cy="12" r="10" opacity=".35"/><path d="M12 12 19 5" stroke-width="1.8"/></g>',
    ledplasma: '<g>'+[4,8,12,16,20].map((x,i)=>[4,8,12,16,20].map((y,j)=>`<circle cx="${x}" cy="${y}" r="1.4" opacity="${(0.25+0.75*Math.abs(Math.sin(i*0.9+j*0.6))).toFixed(2)}"/>`).join('')).join('')+'</g>',
    led: '<g>'+[4,8,12,16,20].map((x,i)=>[20,16,12,8,4].map((y,j)=>`<circle cx="${x}" cy="${y}" r="1.4" opacity="${j<=[2,4,3,1,2][i]?1:.25}"/>`).join('')).join('')+'</g>',
    trap: '<path d="M12 3.5c2 2.5 3.5 1 5.5 3s.5 3.5 2.5 5.5-1 3.5-2.5 5.5-3.5.5-5.5 3c-2-2.5-3.5-1-5.5-3s.5-3.5-2.5-5.5 1-3.5 2.5-5.5 3.5-.5 5.5-3z" opacity=".55"/><circle cx="12" cy="12" r="4.6" fill="none" stroke="currentColor" stroke-width="1.6"/>',
    retro: '<g>'+[[3,3],[7,5],[11,2],[15,4],[19,1]].map(([x,n])=>[0,1,2,3,4,5].slice(0,6-n+1).map((s)=>`<rect x="${x}" y="${19-s*3}" width="3" height="2" opacity="${(0.5+s*0.1).toFixed(2)}"/>`).join('')).join('')+'</g>',
    neuro: '<g fill="none" stroke="currentColor" stroke-width="1.2"><path d="M2 18c4-3 6 1 10-2s6 1 10-2"/><path d="M4 13c3-2 5 1 8-1.5s5 1 8-1.5" opacity=".7"/><path d="M6 9c2-1.5 4 .5 6-1s4 .5 6-1" opacity=".45"/><path d="M7 18 9 9M12 16l.5-7.5M17 16.5 15 8.5" opacity=".5"/></g>',
    ink: '<path d="M12 2c0 3-1 4-1 6 0 1.5 1 2 1 3.5 0 2-3 2.5-4.5 5S8 21 10 21.5c1.5.4 2-1 3.5-1.2 2-.3 3.5 1.2 4.5-.8 1-2.2-2-3-3-5.5-.8-2 .5-3 0-5S12 5 12 2z" opacity=".85"/>',
    sub: '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".7"/><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="1" opacity=".45"/><circle cx="12" cy="12" r="2.8"/>',
    bauhaus: '<path d="M3 3h8A8 8 0 0 1 3 11z"/><path d="M13 11a4 4 0 0 1 8 0z" opacity=".6"/><circle cx="7" cy="17" r="3.6" opacity=".8"/><path d="M13 21h8L13 13z"/>',
    geometric: '<path d="M2 4h11l-3 4H2z"/><path d="M22 10H9l3-4h10z" opacity=".55"/><path d="M2 12h15l-3 4H2z"/><path d="M22 18h-9l3-4h6z" opacity=".55"/><path d="M2 20h7l-2 2H2z" opacity=".8"/>',
    off: '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M6.5 17.5 17.5 6.5" stroke="currentColor" stroke-width="1.8"/>',
  };
  // The style picker shows the styles in groups, A-Z inside each group.
  const STYLE_GROUPS = [
    ["Bars", ["monstercat", "mirror", "radial", "retro", "ascii", "led"]],
    ["Circles", ["ncs", "trap", "sub"]],
    ["On the beat", ["motion", "geometric", "bauhaus"]],
    ["Flowing", ["particles", "plasma", "ledplasma", "ink", "warp", "dnb", "neuro"]],
    ["", ["off"]],
  ];
  // Which bands each style reads: "punch" snaps up and falls with gravity.
  const MODEL = {};
  const USES = {
    barCount: ["monstercat", "mirror", "radial", "retro"],
    particles: ["particles", "monstercat", "warp", "dnb", "trap"],
    position: ["monstercat", "mirror", "ascii"],
    variant: ["geometric"],
    beatEvery: ["geometric", "bauhaus", "plasma", "ledplasma", "sub", "trap", "neuro", "ink"],
    neuroLook: ["neuro"],
    neuroLine: ["neuro"],
    mcColor: ["monstercat"],
    motionLook: ["motion"],
    neuroTwist: ["neuro"],
    neuroMirror: ["neuro"],
    circleAt: ["trap", "radial", "ncs", "sub", "motion"],
    speed: ["trap", "retro", "neuro", "ink", "particles", "monstercat", "ncs", "radial", "plasma", "warp", "dnb", "ascii", "led", "ledplasma"],
    bassBoost: ["particles", "monstercat", "radial", "mirror", "ncs", "warp", "plasma", "dnb", "ascii", "geometric", "bauhaus", "led", "ledplasma", "sub", "trap", "retro", "neuro", "ink", "motion"],
    smoothing: ["particles", "monstercat", "radial", "mirror", "ncs", "warp", "plasma", "dnb", "ascii", "geometric", "bauhaus", "led", "ledplasma", "sub", "trap", "retro", "neuro", "ink"],
  };

  const STYLE_BASE = {
    size: 1,
    opacity: 1,
    blur: 0,
    brightness: 1,
    sensitivity: 1,
    smoothing: 0.5,
    bassBoost: 0.5,
    speed: 1,
    shake: 0.5,
    barCount: 64,
    particles: 1,
    position: "bottom",
    variant: "poster",
    neuroLook: "mesh",
    mcColor: "flow", // Monstercat bar colour: flow | frequency | height (area) | bar | solid
    neuroLine: "rough", // Ridges look: rough (a little jagged) or smooth
    motionLook: "rings",
    neuroTwist: 0, // Neuro Mesh: how much it rolls along its length (0 = still)
    neuroMirror: "off",
    circleAt: "middle", // circle styles: middle of the view, or round the album art
    autoRange: 0.6, // 0 = raw levels, 1 = each band fully auto-ranged
    beatEvery: "1", // beat-stepping styles change every 1, 2, 4 or 8 beats
    colorMove: "move", // move = colours shift on the beat and drift; still = they stay put
    colorMode: "album",
    color1: "#ff4fa0",
    color2: "#5b8cff",
  };
  const STYLE_DEFAULTS = {
    mirror: { barCount: 56, bassBoost: 0.6 },
    plasma: { shake: 0 },
    ascii: { colorMode: "classic" },
    geometric: { shake: 0, opacity: 0.85 },
    bauhaus: { shake: 0, opacity: 0.85, beatEvery: "4" },
    sub: { shake: 0.6 },
    trap: { shake: 0.5, bassBoost: 0.7, colorMode: "classic" },
    neuro: { shake: 0.3, colorMode: "classic" },
    ink: { shake: 0 }, // turns once a bar (most songs count in 4s and 8s)
    led: { colorMode: "classic", shake: 0 },
    ledplasma: { shake: 0 },
    motion: { shake: 0 },
    monstercat: { barCount: 63, bassBoost: 0.8, smoothing: 0.45, beatEvery: "4" },
    retro: { shake: 0, colorMode: "classic", beatEvery: "4" },
  };
  const GLOBAL_DEFAULTS = {
    style: "particles",
    syncDelay: 0, // ms: hold the visuals back (for Bluetooth headphones)
    lyricGlow: "word", // off | word | line
    glowStyle: "soft", // soft | fade | sweep | underline
    glowStrength: 1,
    kickPulse: true,
    dimPaused: true,
    beatSens: 1, // Sound tab: how easily a hit counts as a beat (lower = only clear kicks)
    noLyricsBoost: true, // brighter, fuller visuals on songs with no (or static) lyrics
    kickFlash: false,
    quality: "medium",
    fps: "60", // 30 | 60 | max
    ecoUnfocused: true,
    useHelper: true, // off: never connect to / start the helper, use Spotify's song data
    tab: "style",
    shakeScale: 2, // settings version for the shake slider
    per: {},
  };
  // "Classic" colours: a bright rainbow run, white to green.
  const CLASSIC = ["#ffffff", "#ffff00", "#ff0000", "#ff66ff", "#333399", "#0000ff", "#33ccff", "#00ff00"].map((h) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ]);
  const QUALITY_SCALE = { low: 0.35, medium: 0.5, high: 0.75 };
  const validStyle = (s) => STYLES.some((x) => x[0] === s);

  let S = JSON.parse(JSON.stringify(GLOBAL_DEFAULTS));
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
    for (const k of Object.keys(GLOBAL_DEFAULTS)) if (k in saved && typeof saved[k] === typeof GLOBAL_DEFAULTS[k]) S[k] = saved[k];
  } catch (_) {}
  if (!["soft", "fade", "sweep", "underline"].includes(S.glowStyle)) S.glowStyle = "soft";
  if (!validStyle(S.style)) S.style = GLOBAL_DEFAULTS.style;
  if (!S.per || typeof S.per !== "object") S.per = {};
  // Neuro Mesh Twist was Off / Low / High; it's a slider now.
  if (S.per.neuro && typeof S.per.neuro.neuroTwist === "string") S.per.neuro.neuroTwist = { low: 0.3, high: 1 }[S.per.neuro.neuroTwist] || 0;
  // Shake used to go to 300% (and 40% was already a lot): convert old values so
  // they look the same on the new 0-100% scale.
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
    if (raw.per && raw.shakeScale !== 2) {
      for (const k of Object.keys(S.per)) if (typeof S.per[k].shake === "number") S.per[k].shake = Math.min(1, S.per[k].shake / 0.4);
    }
  } catch (_) {}

  const pCache = new Map();
  function P(style) {
    let p = pCache.get(style);
    if (!p) {
      p = { ...STYLE_BASE, ...(STYLE_DEFAULTS[style] || {}), ...(S.per[style] || {}), _style: style };
      pCache.set(style, p);
    }
    return p;
  }
  let saveTimer = 0;
  function save() {
    pCache.clear();
    // The disk write waits until changes stop for a moment (dragging a
    // slider fires dozens of times a second); the visual updates at once.
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(S));
      } catch (_) {}
    }, 300);
    for (const inst of instances) inst.sync();
  }
  function setStyleValue(style, key, value) {
    S.per[style] = { ...(S.per[style] || {}), [key]: value };
    save();
  }

  // ===========================================================================
  // Colour helpers
  // ===========================================================================
  function hexToRgb(hex) {
    if (typeof hex !== "string") return null;
    const m = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null;
  }
  function hsl(h, s, l) {
    h = ((h % 360) + 360) % 360;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
  }
  const mix = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  const WHITE = [255, 255, 255];
  function liven([r, g, b]) {
    const max = Math.max(r, g, b, 1);
    const mid = (max + Math.min(r, g, b)) / 2;
    const boost = 235 / max;
    return [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round((mid + (v - mid) * 1.25) * boost))));
  }

  // ===========================================================================
  // Shared state: colours, audio, beats
  // ===========================================================================
  const NB = 64;
  const HIST = 16;
  const FALLBACK = [
    [120, 140, 255],
    [255, 120, 200],
    [120, 230, 255],
  ];
  const shared = {
    target: FALLBACK.map((c) => c.slice()),
    album: FALLBACK.map((c) => c.slice()),
    uri: null,
    seed: 1,
    energy: 0,
    kick: 0, // decays fast after each kick
    snare: 0, // decays fast after each snare / clap / hat
    bass: 0,
    treble: 0,
    beatSerial: 0,
    snareSerial: 0,
    dropSerial: 0,
    tickSerial: 0, // beats from the beat clock (tempo-locked, see beatClock)
    barSerial: 0, // first beats of bars (only from the song's own beat grid)
    beatInBar: 0, // 0-3: which beat of the bar the last beat was
    fill: 0, // how full the spectrum is on average (headroom)
    head: 1,
    noLyr: 0, // 0 = synced lyrics on screen, 1 = no lyrics (0.5 = static lyrics); eased
    bFloor: new Float32Array(64), // per-band quiet level (auto range)
    bCeil: new Float32Array(64).fill(0.3), // per-band recent top (auto range)
    eS: 0, // short loudness average (drop detector)
    quietT: 0, // seconds of quiet so far
    raw: new Float32Array(NB), // latest input
    punch: new Float32Array(NB), // snaps up, falls with gravity
    pvel: new Float32Array(NB),
    smooth: new Float32Array(NB), // glides
    hist: Array.from({ length: HIST }, () => new Float32Array(NB)),
    histPos: 0,
    lastFrame: 0,
    time: 0,
    live: { bands: new Float32Array(NB), lo: new Float32Array(40), hasLo: false, ld: new Float32Array(40), hasLd: false, abs: 0, level: 0, at: 0 },
    helper: "connecting",
    queue: [],
    applyFrame: null,
  };
  const helperFeeding = () => S.useHelper !== false && shared.helper === "live" && !shared.helperQuiet;
  const isLive = () => performance.now() - shared.live.at < 700;

  let CP = P("particles"); // settings of the style being drawn right now
  function colorAt(p) {
    p = Math.max(0, Math.min(1, p));
    if (CP.colorMode === "rainbow") return hsl(p * 300 + (CP.colorMove === "still" ? 0 : shared.time * 40), 0.9, 0.62);
    if (CP.colorMode === "classic" && (CP._style === "ascii" || CP._style === "led" || CP._style === "ledplasma")) return mix([0, 150, 45], [170, 255, 180], p);
    if (CP.colorMode === "classic" && CP._style === "retro") {
      // blue, green, yellow, orange, red from bottom to top
      const st = [[40, 110, 255], [20, 220, 120], [250, 225, 40], [255, 140, 30], [255, 40, 40]];
      const pos = p * 4, lo = Math.min(3, Math.floor(pos));
      return mix(st[lo], st[lo + 1], pos - lo);
    }
    if (CP.colorMode === "classic" && CP._style === "neuro") return p < 0.5 ? mix([120, 255, 80], [30, 220, 255], p * 2) : mix([30, 220, 255], [170, 80, 255], (p - 0.5) * 2); // acid green, cyan, violet
    if (CP.colorMode === "classic" && CP._style === "trap") return p < 0.5 ? mix([255, 60, 60], [255, 200, 40], p * 2) : mix([255, 200, 40], [60, 140, 255], (p - 0.5) * 2);
    if (CP.colorMode === "classic" && CP._style === "bauhaus") return p < 0.5 ? mix([230, 50, 40], [250, 195, 35], p * 2) : mix([250, 195, 35], [40, 110, 230], (p - 0.5) * 2);
    if (CP.colorMode === "classic" && CP._style === "geometric") return p < 0.5 ? mix([235, 55, 45], [255, 140, 40], p * 2) : mix([255, 140, 40], [255, 80, 150], (p - 0.5) * 2);
    if (CP.colorMode === "classic") {
      const pos = p * (CLASSIC.length - 1);
      const lo = Math.floor(pos);
      return mix(CLASSIC[lo], CLASSIC[Math.min(CLASSIC.length - 1, lo + 1)], pos - lo);
    }
    if (CP.colorMode === "custom") return mix(hexToRgb(CP.color1) || FALLBACK[0], hexToRgb(CP.color2) || FALLBACK[1], p);
    const c = shared.album;
    return p < 0.5 ? mix(c[0], c[1], p * 2) : mix(c[1], c[2], (p - 0.5) * 2);
  }

  // Album colours. Spicetify's colorExtractor is tried first, but it breaks on
  // some Spotify versions (everything then stayed the default purple), so the
  // cover itself is also sampled: a tiny 40x40 copy, pixels grouped by hue,
  // weighted by how colourful they are, and the three strongest groups win.
  shared.colorSource = "default";
  function paletteFromImage(img) {
    const N = 40;
    const cv = document.createElement("canvas");
    cv.width = cv.height = N;
    const cx = cv.getContext("2d", { willReadFrequently: true });
    cx.drawImage(img, 0, 0, N, N);
    const d = cx.getImageData(0, 0, N, N).data; // throws if the image isn't CORS-clean
    const bins = Array.from({ length: 12 }, () => ({ w: 0, r: 0, g: 0, b: 0 }));
    let ar = 0, ag = 0, ab = 0, an = 0;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      const l = (mx + mn) / 510;
      ar += r; ag += g; ab += b; an++;
      if (l < 0.1 || l > 0.94 || mx - mn < 18) continue; // near black, white or grey
      const sat = (mx - mn) / 255;
      let hue;
      if (mx === r) hue = ((g - b) / (mx - mn) + 6) % 6;
      else if (mx === g) hue = (b - r) / (mx - mn) + 2;
      else hue = (r - g) / (mx - mn) + 4;
      const bin = bins[Math.floor(hue * 2) % 12];
      const wgt = sat * sat;
      bin.w += wgt; bin.r += r * wgt; bin.g += g * wgt; bin.b += b * wgt;
    }
    const ranked = bins.filter((x) => x.w > 0.5).sort((a, b) => b.w - a.w).map((x) => [x.r / x.w, x.g / x.w, x.b / x.w]);
    const avg = an ? [ar / an, ag / an, ab / an] : FALLBACK[0];
    const picks = ranked.slice(0, 3);
    if (!picks.length) picks.push(avg); // black-and-white cover: use its overall tone
    while (picks.length < 3) picks.push(mix(picks[picks.length - 1], [255, 255, 255], 0.35));
    return picks;
  }
  function colorsFromCover(uri, url) {
    if (!url) return;
    const im = new Image();
    im.decoding = "async";
    im.crossOrigin = "anonymous";
    im.onload = () => {
      if (uri !== shared.uri) return;
      try {
        shared.target = paletteFromImage(im).map(liven);
        shared.colorSource = "cover";
      } catch (_) {}
    };
    im.src = url;
  }
  async function loadColors(uri) {
    try {
      const c = await Spicetify.colorExtractor(uri);
      const picks = [c.VIBRANT, c.LIGHT_VIBRANT, c.PROMINENT, c.VIBRANT_NON_ALARMING, c.DESATURATED].map(hexToRgb).filter(Boolean);
      // only trust it if it found real colours and the cover sampler hasn't already
      if (picks.length && uri === shared.uri && shared.colorSource !== "cover") {
        while (picks.length < 3) picks.push(picks[picks.length - 1]);
        shared.target = picks.slice(0, 3).map(liven);
        shared.colorSource = "spicetify";
      }
    } catch (_) {}
  }
  // The song's own beat grid. Spotify has an analysis of every track (beat
  // and bar start times, tempo); it's what the old dancing-cat extension
  // used. Spotify closed it to new apps in 2024, but the desktop client can
  // sometimes still read it with its own login, so it's tried on every song.
  // If it comes back, beats come straight from it, in time with the playback
  // position (exact, never early or late, and the bar lines are known). If
  // not, the kick-detected beat clock below is used, like before.
  const ana = { uri: null, beats: null, bars: null, tempo: 0, idx: 0, barIdx: 0, lastPos: -1, src: "kicks", segs: null, segStarts: null, segTop: -8, segIdx: 0, segLast: -1, wave: null, diag: {} };
  async function loadAnalysis(uri) {
    ana.uri = uri;
    ana.beats = ana.bars = null;
    ana.segs = ana.segStarts = null;
    ana.wave = null;
    ana.diag = {};
    ana.tempo = 0;
    ana.src = "kicks";
    if (!uri.startsWith("spotify:track:")) return;
    const id = uri.slice(14);
    let data = null;
    const wavesP = loadWaves(uri); // Spotify's waveform + beats, alongside
    try {
      if (typeof Spicetify.getAudioData === "function") data = await Spicetify.getAudioData(uri);
      ana.diag.audioData = data && Array.isArray(data.segments) ? "ok" : "empty";
    } catch (e) {
      ana.diag.audioData = "error: " + ((e && e.message) || e);
    }
    if (!data || !Array.isArray(data.beats)) {
      try {
        if (Spicetify.CosmosAsync) data = await Spicetify.CosmosAsync.get(`https://spclient.wg.spotify.com/audio-attributes/v1/audio-analysis/${id}?format=json`);
        ana.diag.analysis = data && Array.isArray(data.segments) ? "ok" : "empty: " + JSON.stringify(data || null).slice(0, 80);
      } catch (e) {
        ana.diag.analysis = "error: " + ((e && e.message) || e);
      }
    }
    await wavesP;
    if (uri !== shared.uri || !data || !Array.isArray(data.beats) || data.beats.length < 8) return;
    ana.beats = Float64Array.from(data.beats.map((b) => +b.start || 0));
    ana.bars = Array.isArray(data.bars) && data.bars.length ? Float64Array.from(data.bars.map((b) => +b.start || 0)) : null;
    ana.tempo = (data.track && +data.track.tempo) || 0;
    ana.lastPos = -1;
    ana.src = "song";
    // Spotify's per-song sound data (a few "segments" a second: loudness,
    // brightness, pitch). Used for the bars when the helper isn't running.
    if (Array.isArray(data.segments) && data.segments.length > 20) {
      ana.segs = data.segments.map((g) => ({ s: +g.start || 0, d: +g.duration || 0.1, l0: +g.loudness_start || -60, lm: +g.loudness_max || -60, lt: +g.loudness_max_time || 0, p: g.pitches || [], tb: g.timbre || [] }));
      ana.segStarts = Float64Array.from(ana.segs.map((g) => g.s));
      const loud = ana.segs.map((g) => g.lm).sort((a, b) => a - b);
      ana.segTop = loud[Math.floor(loud.length * 0.92)] ?? -8;
      ana.segIdx = 0;
      ana.segLast = -1;
    }
  }
  // ---------------------------------------------------------------------------
  // Spotify's own per-song data from its metadata service (the route Konsl's
  // visualiser uses): a three-band waveform (lows / mids / highs over time)
  // and the beat grid. No helper needed. Found once in Spotify's own modules.
  // ---------------------------------------------------------------------------
  let metaSvc;
  function metaService() {
    if (metaSvc !== undefined) return metaSvc;
    metaSvc = null;
    try {
      const wp = window.rspackChunk || window.rspackChunkclient_web || window.webpackChunkclient_web || window.webpackChunkopen;
      const req = wp.push([[Symbol()], {}, (re) => re]);
      let Svc = null, Tr = null;
      // Only the two modules that mention what's needed are loaded (found by
      // reading their source), so nothing else in Spotify or other mods runs.
      for (const id of Object.keys(req.m)) {
        let code = "";
        try { code = Function.prototype.toString.call(req.m[id]); } catch (_) { continue; }
        if (!code.includes("MetadataService") && !code.includes("executeEsperantoCall")) continue;
        let mod;
        try { mod = req(id); } catch (_) { continue; }
        if (!mod || typeof mod !== "object") continue;
        let vals;
        try { vals = Object.values(mod); } catch (_) { continue; }
        for (const v of vals) {
          if (typeof v !== "function") continue;
          if (!Svc && v.SERVICE_ID === "spotify.mdata_esperanto.proto.MetadataService") Svc = v;
          else if (!Tr) {
            let src = "";
            try { src = Function.prototype.toString.call(v); } catch (_) {}
            if (src.includes("executeEsperantoCall") && src.includes("cancelEsperantoCall")) Tr = v;
          }
        }
        if (Svc && Tr) break;
      }
      if (Svc && Tr) metaSvc = { Svc, svc: new Svc(Tr()) };
      else ana.diag.meta = "service not found";
    } catch (e) {
      ana.diag.meta = "error: " + (e && e.message);
    }
    return metaSvc;
  }
  function fetchExt(uri, kinds) {
    return new Promise((resolve) => {
      const m = metaService();
      if (!m) return resolve(null);
      let done = false, cancel = null;
      const finish = (v) => {
        if (done) return;
        done = true;
        try { if (cancel) cancel.cancel(); } catch (_) {}
        resolve(v);
      };
      setTimeout(() => finish(null), 8000);
      try {
        cancel = m.svc.observe(m.Svc.METHODS.observe.requestType.fromPartial({ extensionQuery: kinds.map((k) => ({ entityUri: uri, extensionKind: k })) }), (res) => {
          if (res.pendingResponse) return;
          finish(res.extensionResult || null);
        });
      } catch (e) {
        ana.diag.meta = "error: " + (e && e.message);
        finish(null);
      }
    });
  }
  // Minimal protobuf reading: field number -> list of raw values.
  function pbFields(buf) {
    const out = {};
    let o = 0;
    const vint = () => {
      let v = 0, mul = 1, b;
      do { b = buf[o++]; v += (b & 127) * mul; mul *= 128; } while (b & 128 && o < buf.length);
      return v;
    };
    while (o < buf.length) {
      const tag = vint(), f = Math.floor(tag / 8), wt = tag & 7;
      let val;
      if (wt === 0) val = vint();
      else if (wt === 2) { const n = vint(); val = buf.subarray(o, o + n); o += n; }
      else if (wt === 5) { val = new DataView(buf.buffer, buf.byteOffset + o, 4).getFloat32(0, true); o += 4; }
      else if (wt === 1) { val = new DataView(buf.buffer, buf.byteOffset + o, 8).getFloat64(0, true); o += 8; }
      else break;
      (out[f] || (out[f] = [])).push(val);
    }
    return out;
  }
  function pbPacked(bytes) {
    const a = [];
    let o = 0;
    while (o < bytes.length) {
      let v = 0, mul = 1, b;
      do { b = bytes[o++]; v += (b & 127) * mul; mul *= 128; } while (b & 128 && o < bytes.length);
      if (v > 2147483647) v -= 18446744073709551616;
      a.push(v);
    }
    return a;
  }
  async function loadWaves(uri) {
    const res = await fetchExt(uri, [237, 217]);
    if (uri !== shared.uri) return;
    if (!res) {
      ana.diag.wave = ana.diag.wave || "no reply";
      return;
    }
    for (const r of res) {
      const ok = r.status === 1 && r.extensionData && r.extensionData.value;
      if (r.extensionKind === 237) {
        if (!ok) {
          ana.diag.wave = "not available (" + ((r.details && r.details.cacheStatus) ?? "?") + ")";
          continue;
        }
        const f = pbFields(r.extensionData.value);
        const ch = [3, 4, 5].map((k) => (f[k] ? f[k].reduce((a, b) => a.concat(pbPacked(b)), []) : []));
        const n = Math.min(ch[0].length, ch[1].length, ch[2].length);
        if (n < 50) {
          ana.diag.wave = "empty";
          continue;
        }
        const top = ch.map((c) => {
          const s = c.slice(0, n).sort((a, b) => a - b);
          return Math.max(1, s[Math.floor(n * 0.995)]);
        });
        let dur = 0;
        try { dur = (Spicetify.Player.getDuration() || 0) / 1000; } catch (_) {}
        ana.wave = { lo: ch[0], mid: ch[1], hi: ch[2], n, top, rate: dur > 10 ? n / dur : (f[1] && f[1][0]) || 10, prevLo: 0, prevHi: 0, at: -1 };
        ana.diag.wave = "ok (" + n + " points, " + ana.wave.rate.toFixed(1) + "/s)";
      } else if (r.extensionKind === 217) {
        if (!ok) {
          ana.diag.beats = "not available";
          continue;
        }
        const f = pbFields(r.extensionData.value);
        const beats = (f[2] || [])
          .map((b) => {
            const q = pbFields(b);
            return { t: (q[1] && q[1][0]) || 0, v: (q[3] && q[3][0]) || 0, dc: (q[5] && q[5][0]) || 0 };
          })
          .filter((b) => b.t > 0);
        ana.diag.beats = beats.length ? "ok (" + beats.length + ")" : "empty";
        if (beats.length > 8 && !ana.beats) {
          ana.beats = Float64Array.from(beats.map((b) => b.t));
          const bars = beats.filter((b) => b.v === 1 || b.dc > 0.5).map((b) => b.t);
          ana.bars = bars.length > 4 ? Float64Array.from(bars) : null;
          ana.tempo = 60 / ((beats[beats.length - 1].t - beats[0].t) / (beats.length - 1));
          ana.lastPos = -1;
          ana.src = "song";
        }
      }
    }
  }
  function firstAfter(arr, x) {
    let lo = 0, hi = arr.length;
    while (lo < hi) {
      const m = (lo + hi) >> 1;
      if (arr[m] <= x) lo = m + 1;
      else hi = m;
    }
    return lo;
  }
  // Fires shared.tickSerial on each beat of the song (and barSerial on the
  // first beat of each bar) from the playback position. Returns false when
  // there's no beat grid for this song.
  function songClock() {
    if (ana.src !== "song" || ana.uri !== shared.uri || !ana.beats || bpm.tapUri === shared.uri) return false;
    let pos;
    try {
      pos = (Spicetify.Player.getProgress() - (S.syncDelay || 0)) / 1000;
    } catch (_) {
      return false;
    }
    if (!isFinite(pos)) return false;
    const B = ana.beats, bars = ana.bars;
    const jumped = ana.lastPos < 0 || pos < ana.lastPos - 0.08 || pos - ana.lastPos > 1;
    let playing = true;
    try { playing = !!Spicetify.Player.isPlaying(); } catch (_) {}
    if (jumped || !playing) {
      // Start, seek or pause: find our place without firing.
      ana.idx = firstAfter(B, pos);
      if (bars) {
        ana.barIdx = firstAfter(bars, pos);
        const bs = ana.barIdx > 0 ? firstAfter(B, bars[ana.barIdx - 1] - 0.06) : 0;
        shared.beatInBar = Math.max(0, ana.idx - 1 - bs) % 4;
      }
      ana.lastPos = pos;
      return true;
    }
    ana.lastPos = pos;
    if (ana.idx < B.length && B[ana.idx] <= pos) {
      while (ana.idx < B.length && B[ana.idx] <= pos) ana.idx++;
      shared.tickSerial++;
      shared.beatInBar = (shared.beatInBar + 1) % 4;
      if (bars) {
        let down = false;
        while (ana.barIdx < bars.length && bars[ana.barIdx] <= pos + 0.06) {
          ana.barIdx++;
          down = true;
        }
        if (down) {
          shared.barSerial++;
          shared.beatInBar = 0;
        }
      }
    }
    return true;
  }
  function onSongChange() {
    const item = Spicetify.Player.data && Spicetify.Player.data.item;
    const uri = item && item.uri;
    if (!uri || uri === shared.uri) return;
    shared.uri = uri;
    let h = 7;
    for (let i = 0; i < uri.length; i++) h = (h * 31 + uri.charCodeAt(i)) | 0;
    shared.seed = Math.abs(h) % 65536;
    shared.colorSource = "default";
    loadColors(uri);
    loadAnalysis(uri);
    try {
      const md = (item && item.metadata) || {};
      const img = md.image_xlarge_url || md.image_large_url || md.image_url || "";
      const id = img.startsWith("spotify:image:") ? img.slice(14) : null;
      const url = id ? "https://i.scdn.co/image/" + id : img.startsWith("http") ? img : null;
      if (url) {
        const im = new Image();
        im.decoding = "async";
        im.src = url;
        shared.artImg = im;
      }
      colorsFromCover(uri, url);
    } catch (_) {}
  }
  Spicetify.Player.addEventListener("songchange", onSongChange);
  // Spotify can still be loading when we start, and the songchange event is
  // sometimes missed: check every 2 s that we have the current song (cheap).
  setInterval(onSongChange, 2000);
  onSongChange();

  // The helper hears Spotify after its volume slider, so turn quiet listening
  // back up to the track's real loudness (in dB) for the fixed-scale styles.
  function volumeDb() {
    let vol = 1;
    try {
      vol = Spicetify.Player.getVolume();
    } catch (_) {}
    if (typeof vol !== "number" || !isFinite(vol)) vol = 1;
    return -20 * Math.log10(Math.max(0.05, Math.min(1, vol)));
  }
  function kickHit(amount) {
    shared.kick = Math.min(1.4, shared.kick + amount);
    if (amount >= 0.3) {
      shared.beatSerial++;
      bpmOnset(performance.now());
    }
  }
  // Tempo estimate from the kicks: every gap between recent kicks (and gaps
  // spanning 2-4 kicks) votes for a tempo folded into 75-170 BPM; the
  // strongest vote wins once it's clear enough. Cheap: runs once per kick.
  const bpm = { on: [], value: 0, shown: 0, conf: 0, last: 0, period: 0, uri: null, tapUri: null };
  // Tap to the beat (Sound tab): 4+ taps in time set the tempo and where the
  // beat lands, for this song. It then runs like a metronome (kicks near a
  // beat still nudge it into place) and beats Spotify's grid and the kick
  // guess. Cleared on the next song.
  const taps = [];
  function tapBeat() {
    const now = performance.now();
    if (taps.length && now - taps[taps.length - 1] > 2000) taps.length = 0;
    taps.push(now);
    if (taps.length > 8) taps.shift();
    if (taps.length < 4) return taps.length;
    const gaps = [];
    for (let i = 1; i < taps.length; i++) gaps.push(taps[i] - taps[i - 1]);
    gaps.sort((a, b) => a - b);
    let per = gaps[gaps.length >> 1];
    while (per < 330) per *= 2; // keep it in 75-180 BPM
    while (per > 800) per /= 2;
    bpm.uri = shared.uri;
    bpm.tapUri = shared.uri;
    bpm.period = per;
    bpm.value = bpm.shown = Math.round(60000 / per);
    bpm.conf = 1;
    ana.src = "tap";
    clock.last = now;
    shared.tickSerial++;
    shared.beatInBar = 0;
    return taps.length;
  }
  function bpmOnset(now) {
    if (bpm.uri !== shared.uri) {
      bpm.uri = shared.uri;
      bpm.on.length = 0;
      bpm.value = bpm.shown = bpm.conf = 0;
    }
    if (bpm.tapUri === shared.uri) return; // tapped tempo wins
    const on = bpm.on;
    if (on.length && now - on[on.length - 1] < 180) return; // same hit
    on.push(now);
    while (on.length && now - on[0] > 10000) on.shift();
    bpm.last = now;
    if (on.length < 6) return;
    const hist = new Float32Array(100); // 75..174 BPM
    for (let i = 0; i < on.length; i++) {
      for (let j = i + 1; j < Math.min(on.length, i + 5); j++) {
        let b = 60000 / (on[j] - on[i]);
        if (!isFinite(b) || b <= 0) continue;
        // a gap can be 1, 2, 3 or 4 beats long: let each reading vote
        for (let n = 1; n <= 4; n++) {
          let t2 = b * n;
          while (t2 >= 175) t2 /= 2;
          while (t2 < 75) t2 *= 2;
          const wgt = n === 1 ? 1 : n === 2 ? 0.6 : 0.3;
          const c = t2 - 75;
          for (let d = -2; d <= 2; d++) {
            const k2 = Math.round(c) + d;
            if (k2 >= 0 && k2 < 100) hist[k2] += wgt * Math.exp(-((k2 - c) * (k2 - c)) / 1.5);
          }
        }
      }
    }
    let best = 0, sum = 0;
    for (let i = 0; i < 100; i++) {
      sum += hist[i];
      if (hist[i] > hist[best]) best = i;
    }
    // refine with the neighbours
    const a = hist[best - 1] || 0, b2 = hist[best], c2 = hist[best + 1] || 0;
    const off = a + c2 > 0 ? (c2 - a) / (2 * (2 * b2 - a - c2 || 1)) : 0;
    const est = 75 + best + Math.max(-0.5, Math.min(0.5, off));
    const conf = sum > 0 ? b2 / sum : 0;
    bpm.conf = bpm.conf * 0.7 + conf * 0.3;
    bpm.value = bpm.value && Math.abs(bpm.value - est) < 4 ? bpm.value * 0.8 + est * 0.2 : est;
    if (bpm.conf > 0.045) {
      bpm.shown = Math.round(bpm.value);
      bpm.period = 60000 / bpm.value;
    }
  }
  // Beat clock for the styles that change on the beat. Once the tempo is
  // known it locks onto it: a kick close to where a beat is due fires that
  // beat (and pulls the timing onto the kick), a beat with no kick is filled
  // in on time (drums dropped out, a soft kick missed), and a second hit
  // within half a beat is ignored, so one beat never counts twice. Without a
  // tempo yet, every kick is a beat (at most one per 200 ms). After about 8
  // beats with no kicks at all it stops, so quiet parts stay still.
  const clock = { last: 0, kickSeen: 0, lastKick: 0, dropSeen: 0 };
  function beatClock(now) {
    if (songClock()) return; // the song's own beat grid, when we have it
    // No bar lines without the song grid: a drop is almost always beat 1,
    // so the beat it lands on starts the count of 4.
    if (clock.dropSeen !== shared.dropSerial) {
      clock.dropSeen = shared.dropSerial;
      shared.beatInBar = 3;
    }
    const period = bpm.shown && bpm.period > 300 && bpm.period < 900 ? bpm.period : 0;
    const kicked = clock.kickSeen !== shared.beatSerial;
    if (kicked) {
      clock.kickSeen = shared.beatSerial;
      clock.lastKick = now;
    }
    const since = now - clock.last;
    if (!period) {
      if (kicked && since > 200) fire();
      return;
    }
    if (kicked && bpm.tapUri === shared.uri) {
      // tapped: kicks only nudge the timing, the beats come from the taps
      if (since < period * 0.15) clock.last = now;
      else if (since > period * 0.85) { clock.last = now; tick(); }
      return;
    }
    if (kicked) {
      if (since > period * 0.5) fire();
      else if (since < period * 0.25) clock.last = now; // the kick is the real beat: nudge the timing onto it
    } else if (since >= period * 1.04 && (now - clock.lastKick < period * 8 || bpm.tapUri === shared.uri)) {
      clock.last += period; // filled-in beat, kept on the grid
      if (now - clock.last > period) clock.last = now;
      shared.tickSerial++;
      shared.beatInBar = (shared.beatInBar + 1) % 4;
    }
    function fire() {
      clock.last = now;
      tick();
    }
    function tick() {
      shared.tickSerial++;
      shared.beatInBar = (shared.beatInBar + 1) % 4;
    }
  }
  // Where we are between two beats, for smooth beat-locked movement:
  // ph 0 -> 1 from the last beat to the next, per = seconds per beat,
  // inBar = which beat of the bar (0-3). From the song's beat grid when we
  // have it, otherwise the tempo clock. With no tempo, ph holds at 1 once a
  // beat is over, so things rest instead of drifting off the beat.
  function beatPhase() {
    const out = { ph: 1, per: 0.5, inBar: shared.beatInBar };
    if (ana.src === "song" && bpm.tapUri !== shared.uri && ana.uri === shared.uri && ana.beats && ana.idx > 0 && ana.idx < ana.beats.length) {
      const a = ana.beats[ana.idx - 1], b = ana.beats[ana.idx];
      out.per = Math.max(0.2, Math.min(1.5, b - a));
      out.ph = Math.max(0, Math.min(1, (ana.lastPos - a) / (b - a)));
      return out;
    }
    const period = bpm.period > 300 && bpm.period < 900 ? bpm.period : 0;
    if (period) out.per = period / 1000;
    out.ph = Math.max(0, Math.min(1, (performance.now() - clock.last) / (out.per * 1000)));
    return out;
  }
  function snareHit(amount) {
    shared.snare = Math.min(1.2, shared.snare + amount);
    if (amount >= 0.3) shared.snareSerial++;
  }

  // ===========================================================================
  // Helper connection (real audio)
  // ===========================================================================
  let retryMs = 2000;
  // Starting the helper: the installer registers a spicy-visualiser:// link
  // that starts it hidden. Only tried once this PC has had a working helper
  // (remembered), so Marketplace-only installs never see a "how do you want
  // to open this" box. A button in the panel can also try it by hand.
  const HELPER_SEEN_KEY = "spicy-visualiser:helper-seen";
  let lastLaunch = 0;
  function helperWanted() {
    let visible = false;
    for (const inst of instances) if (inst.isVisible()) visible = true;
    return visible && S.style !== "off";
  }
  // The helper's setup file. An add-on inside Spotify can't install programs,
  // so the button downloads it (in the web browser) for the user to open once.
  const HELPER_SETUP = "https://github.com/siamct/spicy-visualiser/raw/main/setup/SpicyVisualiserHelper.zip";
  const HELPER_STEP = "Downloading SpicyVisualiserHelper.zip. Open it from your downloads, click Extract all, then double-click Install helper.bat. If Windows asks, click More info, then Run anyway. The visualiser goes Live by itself.";
  function downloadHelper() {
    shared.downloaded = true;
    try {
      const a = document.createElement("a");
      a.href = HELPER_SETUP;
      a.target = "_blank";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (_) {
      try { window.open(HELPER_SETUP, "_blank"); } catch (_) {}
    }
  }
  const NOTICE_KEY = "spicy-visualiser:helper-notice";
  function launchHelper(byHand) {
    if (shared.helper === "live" || S.useHelper === false) return;
    let seen = false;
    try { seen = localStorage.getItem(HELPER_SEEN_KEY) === "1"; } catch (_) {}
    if (!seen && !byHand) return;
    const now = Date.now();
    if (!byHand && now - lastLaunch < 30000) return;
    lastLaunch = now;
    shared.launchFailed = false;
    try { window.open("spicy-visualiser://start", "_blank"); } catch (_) {}
    retryMs = 1200;
    // No connection a few seconds later: it isn't installed (or was removed).
    setTimeout(() => {
      if (shared.helper !== "live" && lastLaunch === now) {
        shared.launchFailed = true;
        refreshPanels();
      }
    }, 7000);
    refreshPanels();
  }
  function connectHelper() {
    if (S.useHelper === false) return setTimeout(connectHelper, 2000); // turned off: just wait
    let ws;
    try {
      ws = new WebSocket(HELPER_URL);
    } catch (_) {
      return retry();
    }
    ws.onopen = () => {
      retryMs = 2000;
      try { localStorage.setItem(HELPER_SEEN_KEY, "1"); } catch (_) {}
      shared.ws = ws;
      shared.sentState = "";
      sendHelperState();
      shared.helper = "live";
      refreshPanels();
    };
    ws.onmessage = (ev) => {
      try {
        const d = JSON.parse(ev.data);
        if (S.syncDelay > 0) {
          shared.queue.push([performance.now(), d]);
          if (shared.queue.length > 120) shared.queue.shift();
        } else applyFrame(d);
      } catch (_) {}
    };
    function applyFrame(d) {
      if ((d.a || 0) > 0.0008) shared.helperLoudAt = performance.now();
      // Connected but hearing nothing (wrong output device, muted...): the
      // song data keeps things moving instead, until sound comes back.
      if (shared.helperQuiet) return;
      {
        const b = d.b || [];
        const m = b.length;
        if (m === NB) for (let i = 0; i < NB; i++) shared.live.bands[i] = b[i] || 0;
        else if (m > 1)
          for (let i = 0; i < NB; i++) {
            const pos = (i / (NB - 1)) * (m - 1);
            const lo = Math.floor(pos), f = pos - lo;
            shared.live.bands[i] = (b[lo] || 0) * (1 - f) + (b[Math.min(m - 1, lo + 1)] || 0) * f;
          }
        if (Array.isArray(d.ld)) {
          for (let i = 0; i < 40; i++) shared.live.ld[i] = d.ld[i] ?? -90;
          shared.live.hasLd = true;
        }
        shared.live.abs = d.a || 0;
        if (Array.isArray(d.lo)) {
          for (let i = 0; i < 40; i++) shared.live.lo[i] = d.lo[i] || 0;
          shared.live.hasLo = true;
        }
        shared.live.level = d.l || 0;
        shared.live.at = performance.now();
        if (d.k) kickHit(d.k * (S.beatSens ?? 1));
        if (d.s) snareHit(d.s * 0.8);
      }
    }
    shared.applyFrame = applyFrame;
    ws.onclose = () => {
      if (shared.helper !== "offline") {
        shared.helper = "offline";
        refreshPanels();
      }
      retry();
    };
    ws.onerror = () => {};
  }
  // Tell the helper whether anyone can see us, so it can rest when nothing
  // is on screen (the deep-bass ring, "lo", is no longer needed by any style).
  function sendHelperState() {
    const ws = shared.ws;
    if (!ws || ws.readyState !== 1) return;
    let visible = false;
    for (const inst of instances) if (inst.isVisible()) visible = true;
    const active = visible && S.style !== "off";
    const key = String(active);
    if (key === shared.sentState) return;
    shared.sentState = key;
    try {
      ws.send(JSON.stringify({ cmd: "state", active, lo: false }));
    } catch (_) {}
  }
  function retry() {
    // Quick retries while the visualiser is on screen (the helper may be
    // starting up), slow ones otherwise.
    setTimeout(connectHelper, helperWanted() ? Math.min(retryMs, 3000) : retryMs);
    retryMs = Math.min(15000, retryMs * 1.5);
  }
  connectHelper();

  // Small debug hook (Spotify devtools console): SpicyVisualiser.state(), SpicyVisualiser.particles()
  window.SpicyVisualiser = {
    particles: () => [...instances].map((v) => {
      const P2 = v.particles;
      const bad = P2.filter((q) => !isFinite(q.x) || !isFinite(q.y)).length;
      const on = P2.filter((q) => q.x >= 0 && q.x <= v.w && q.y >= 0 && q.y <= v.h).length;
      return { n: P2.length, onScreen: on, nan: bad, w: v.w, h: v.h, sample: P2.slice(0, 3).map((q) => [q.x | 0, q.y | 0, (q.ox || 0) | 0, (q.oy || 0) | 0]) };
    }),
    state: () => ({ helper: shared.helper, live: isLive(), energy: +shared.energy.toFixed(3), kick: +shared.kick.toFixed(3), style: S.style, queued: shared.queue.length, colors: shared.colorSource, palette: shared.target.map((c) => c.map(Math.round)), ticks: shared.tickSerial, bars: shared.barSerial, beats: ana.src, tempo: ana.tempo ? +ana.tempo.toFixed(1) : 0, head: +shared.head.toFixed(2), noLyr: +shared.noLyr.toFixed(2), bpm: bpm.shown, bpmRaw: +bpm.value.toFixed(1), bpmConf: +bpm.conf.toFixed(3), songData: !!shared.songData, wave: !!ana.wave, diag: ana.diag }),
  };

  // ===========================================================================
  // Audio update (once per frame)
  // ===========================================================================
  function updateShared(now, p, model) {
    // Every window uses the main window's clock, so a popout (which has its own
    // clock) can't make things run at the wrong speed.
    if (shared.lastFrame && now - shared.lastFrame < 2) return;
    const dt = Math.min(0.1, (now - (shared.lastFrame || now)) / 1000) || 0.016;
    shared.lastFrame = now;
    shared.time = now / 1000;
    // Delayed frames (Bluetooth sync) are released when their time comes.
    while (shared.queue.length && (S.syncDelay <= 0 || shared.queue[0][0] <= now - S.syncDelay)) {
      const f = shared.queue.shift();
      if (shared.applyFrame) shared.applyFrame(f[1]);
      shared.live.at = now;
    }
    const t = shared.time;

    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++) shared.album[i][j] += (shared.target[i][j] - shared.album[i][j]) * Math.min(1, dt * 2.5);

    // No helper: use Spotify's sound data for this song, when there is some.
    shared.songData = false;
    const playing = !!Spicetify.Player.isPlaying();
    if (shared.helper === "live" && S.useHelper === false) {
      try { shared.ws.close(); } catch (_) {}
    }
    // Quiet for 3 s while a song plays: the helper can't hear Spotify.
    if (shared.helper !== "live" || !playing || !shared.helperLoudAt) shared.helperLoudAt = now;
    const quiet = shared.helper === "live" && now - (shared.helperLoudAt || now) > 3000;
    if (quiet !== !!shared.helperQuiet) {
      shared.helperQuiet = quiet;
      refreshPanels();
    }
    const raw = shared.raw;
    let te;
    if (shared.arUri !== shared.uri) {
      shared.arUri = shared.uri;
      shared.bFloor.fill(-1);
    }
    if (isLive()) {
      raw.set(shared.live.bands);
      te = shared.live.level;
    } else {
      // No audio to follow (no helper, no song data): stay low and still
      // rather than make something up.
      raw.fill(0.02);
      te = 0.05;
    }

    const sens = p.sensitivity;
    const sm = p.smoothing;
    // Bass boost: lifts the lowest bands so kicks stand out.
    const boostEdge = NB * 0.28;
    // Headroom: on loud, dense songs nearly every band sat at the top, so
    // the styles were pinned at full and looked still. Track how full the
    // spectrum is on average (over a few seconds) and, when it's crowded,
    // scale everything down so the loud parts still have room to jump.
    // Only ever turns down, and keeps the shape (kicks stay tallest).
    if (isLive()) {
      let fill = 0;
      for (let i = 0; i < NB; i++) fill += raw[i] * sens * (i < boostEdge ? 1 + p.bassBoost * (1 - i / boostEdge) : 1);
      fill /= NB;
      shared.fill += (fill - shared.fill) * Math.min(1, dt * (fill > shared.fill ? 1.2 : 0.3));
    }
    const fillWant = Math.min(0.6, 0.38 * sens);
    const head = isLive() && shared.fill > fillWant ? fillWant / shared.fill : 1;
    shared.head = head;
    let bass = 0;
    let treble = 0;
    const gravity = 22 - 18 * sm; // how hard bars fall
    const attack = 40 - 26 * sm;
    const release = 12 - 9 * sm;
    for (let i = 0; i < NB; i++) {
      const boost = i < boostEdge ? 1 + p.bassBoost * (1 - i / boostEdge) : 1;
      let target = raw[i] * sens * boost * head;
      // Auto range (Sound tab): each band tracks its own quiet level and its
      // recent top, and is stretched between the two, so on songs where
      // everything sits high the bars still go up and down instead of
      // pinning at the top. Blended with the plain level by the slider.
      // Only for the helper's live sound: Spotify's song data is already
      // scaled to the song, and stretching it again made it jumpy.
      const ar = p.autoRange ?? 0.6;
      if (ar > 0 && isLive()) {
        let fl = shared.bFloor[i], ce = shared.bCeil[i];
        if (fl < 0) {
          // New song: start from where this band is now, not from zero
          // (which stretched everything to the top for the first seconds).
          fl = target * 0.6;
          ce = Math.max(0.3, target);
        }
        fl += (target - fl) * Math.min(1, dt * (target < fl ? 6 : 0.3));
        ce = target > ce ? target : ce + (fl + 0.25 - ce) * Math.min(1, dt * 0.2);
        shared.bFloor[i] = fl;
        shared.bCeil[i] = ce;
        const ex = Math.max(0, (target - fl) / Math.max(0.25, ce - fl));
        target = target * (1 - ar) + Math.min(1, ex) * 0.92 * ar;
      }
      target = Math.min(1, target);
      // Punch: up almost instantly, down with gravity (Monstercat / cava feel).
      if (target >= shared.punch[i]) {
        shared.punch[i] += (target - shared.punch[i]) * Math.min(1, dt * 45);
        shared.pvel[i] = 0;
      } else {
        shared.pvel[i] += gravity * dt;
        shared.punch[i] = Math.max(target, shared.punch[i] - shared.pvel[i] * dt);
      }
      // Smooth: glides both ways.
      shared.smooth[i] += (target - shared.smooth[i]) * Math.min(1, dt * (target > shared.smooth[i] ? attack : release));
      if (i < 10) bass += shared.smooth[i];
      if (i >= 40) treble += shared.smooth[i];
    }
    te = Math.min(1, te * sens);
    shared.energy += (te - shared.energy) * Math.min(1, dt * (te > shared.energy ? 10 : 2.5));
    shared.bass = bass / 10;
    shared.treble = treble / (NB - 40);
    // Drop: a loud kick after 1.5 s+ of quiet (cheap, a few sums per frame).
    shared.eS += (shared.energy - shared.eS) * Math.min(1, dt * 4);
    shared.quietT = shared.energy < 0.28 ? shared.quietT + dt : Math.max(0, shared.quietT - dt * 0.5);
    if (shared.quietT > 1.5 && shared.eS > 0.45 && shared.kick > 0.4) {
      shared.dropSerial++;
      shared.quietT = 0;
    }
    shared.kick *= Math.exp(-dt * 6);
    shared.snare *= Math.exp(-dt * 8);
    shared.histPos = (shared.histPos + 1) % HIST;
    shared.hist[shared.histPos].set(model === "punch" ? shared.punch : shared.smooth);
    beatClock(now);
    let pb = 0;
    for (let i = 0; i < 10; i++) pb += shared.punch[i];
    shared.bassPunch = pb / 10;
  }

  let MODEL_NOW = "smooth";
  // Band at p (0 = bass, 1 = treble), optionally from a few frames ago.
  function bandAt(p, delay = 0) {
    const arr = delay ? shared.hist[(shared.histPos - Math.min(HIST - 1, delay) + HIST) % HIST] : MODEL_NOW === "punch" ? shared.punch : shared.smooth;
    const pos = Math.max(0, Math.min(1, p)) * (NB - 1);
    const lo = Math.floor(pos);
    const hi = Math.min(NB - 1, lo + 1);
    const f = pos - lo;
    return arr[lo] * (1 - f) + arr[hi] * f;
  }

  // Monstercat smoothing (as in cava): every bar lifts its neighbours, fading
  // by `factor` per step, which gives the smooth "hills" look.
  function monstercatFilter(vals, factor) {
    const n = vals.length;
    const out = vals.slice();
    for (let i = 0; i < n; i++) {
      let d = vals[i];
      for (let j = i - 1; j >= 0; j--) {
        d /= factor;
        if (d < 0.004) break;
        if (out[j] < d) out[j] = d;
      }
      d = vals[i];
      for (let j = i + 1; j < n; j++) {
        d /= factor;
        if (d < 0.004) break;
        if (out[j] < d) out[j] = d;
      }
    }
    return out;
  }

  // ===========================================================================
  // Sprites (pre-drawn soft dots)
  // ===========================================================================
  function spriteCache(build) {
    const cache = new Map();
    let frame = -1, made = 0, last = null;
    return (c) => {
      const key = ((c[0] >> 4) << 8) | ((c[1] >> 4) << 4) | (c[2] >> 4);
      let s = cache.get(key);
      if (s) return (last = s);
      if (frame !== shared.lastFrame) { frame = shared.lastFrame; made = 0; }
      if (made >= 4 && last) return last; // budget used: a near colour for one frame
      made++;
      if (cache.size > 600) cache.clear();
      s = document.createElement("canvas");
      s.width = s.height = 64;
      const g = s.getContext("2d");
      const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      build(grad, c.map((v) => v | 0));
      g.fillStyle = grad;
      g.fillRect(0, 0, 64, 64);
      cache.set(key, s);
      return (last = s);
    };
  }
  const sprite = spriteCache((g, [r, gg, b]) => {
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.12, `rgba(${r},${gg},${b},0.95)`);
    g.addColorStop(0.4, `rgba(${r},${gg},${b},0.3)`);
    g.addColorStop(1, `rgba(${r},${gg},${b},0)`);
  });
  const softSprite = spriteCache((g, [r, gg, b]) => {
    g.addColorStop(0, `rgba(${r},${gg},${b},1)`);
    g.addColorStop(0.5, `rgba(${r},${gg},${b},0.35)`);
    g.addColorStop(1, `rgba(${r},${gg},${b},0)`);
  });
  // Gaussian-style falloff: no visible edge at all (used for the lyric glow).
  const featherSprite = spriteCache((g, [r, gg, b]) => {
    for (let i = 0; i <= 12; i++) {
      const x = i / 12;
      g.addColorStop(x, `rgba(${r},${gg},${b},${Math.exp(-x * x * 5).toFixed(4) * (1 - x)})`);
    }
  });

  function smoothClosed(ctx, pts) {
    const n = pts.length;
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const start = mid(pts[n - 1], pts[0]);
    ctx.moveTo(start[0], start[1]);
    for (let i = 0; i < n; i++) {
      const m = mid(pts[i], pts[(i + 1) % n]);
      ctx.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
    }
    ctx.closePath();
  }
  function blurRing(arr, passes) {
    let a = arr;
    for (let k = 0; k < passes; k++) {
      const n = a.length;
      const b = new Array(n);
      for (let i = 0; i < n; i++) b[i] = (a[(i - 1 + n) % n] + 2 * a[i] + a[(i + 1) % n]) / 4;
      a = b;
    }
    return a;
  }

  // ===========================================================================
  // NCS sphere renderer (WebGL2). Shaders from Konsl/spicetify-visualizer (MIT).
  // ===========================================================================
  const QUAD_VS = `__PARTICLE_VS__`;
  const PARTICLE_FS = `__PARTICLE_FS__`;
  const DOT_VS = `__DOT_VS__`;
  const DOT_FS = `__DOT_FS__`;
  const BLUR_VS = `__BLUR_VS__`;
  const BLUR_FS = `__BLUR_FS__`;
  const FIN_VS = `__FIN_VS__`;
  const FIN_FS = `__FIN_FS__`;

  let ncsRenderer;
  function getNcs() {
    if (ncsRenderer === undefined) {
      try {
        ncsRenderer = createNcs();
      } catch (e) {
        console.error("[Spicy Visualiser] NCS sphere unavailable:", e);
        ncsRenderer = null;
      }
    }
    return ncsRenderer;
  }

  function createNcs() {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 4;
    const gl = cv.getContext("webgl2", { premultipliedAlpha: true, antialias: false, preserveDrawingBuffer: true });
    if (!gl || !gl.getExtension("EXT_color_buffer_float")) return null;
    const shader = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const program = (vs, fs) => {
      const p = gl.createProgram();
      gl.attachShader(p, shader(gl.VERTEX_SHADER, vs));
      gl.attachShader(p, shader(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      const u = {};
      const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) {
        const name = gl.getActiveUniform(p, i).name;
        u[name] = gl.getUniformLocation(p, name);
      }
      return { p, u, pos: gl.getAttribLocation(p, "inPosition") };
    };
    const part = program(QUAD_VS, PARTICLE_FS);
    const dot = program(DOT_VS, DOT_FS);
    const blur = program(BLUR_VS, BLUR_FS);
    const fin = program(FIN_VS, FIN_FS);

    const target = (filter) => {
      const fb = gl.createFramebuffer();
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      return { fb, tex };
    };
    const particles = target(gl.NEAREST);
    const dots = target(gl.NEAREST);
    const blurX = target(gl.LINEAR);
    const blurY = target(gl.NEAREST);
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);

    let size = 0;
    let dotCount = 0;
    const useQuad = (prog) => {
      gl.useProgram(prog.p);
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.enableVertexAttribArray(prog.pos);
      gl.vertexAttribPointer(prog.pos, 2, gl.FLOAT, false, 0, 0);
    };

    function render(px, u) {
      if (gl.isContextLost()) return null;
      if (px !== size) {
        size = px;
        cv.width = cv.height = size;
        for (const t of [dots, blurX, blurY]) {
          gl.bindTexture(gl.TEXTURE_2D, t.tex);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, size, size, 0, gl.RED, gl.UNSIGNED_BYTE, null);
        }
      }
      const count = Math.round(Math.max(90, Math.min(u.maxDots, size * 0.85)));
      if (count !== dotCount) {
        dotCount = count;
        gl.bindTexture(gl.TEXTURE_2D, particles.tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG32F, count, count, 0, gl.RG, gl.FLOAT, null);
      }
      const amp = u.amplitude;
      // 1. Dot positions: a grid pushed around by 3D noise, wrapped onto a sphere.
      gl.disable(gl.BLEND);
      gl.bindFramebuffer(gl.FRAMEBUFFER, particles.fb);
      gl.viewport(0, 0, count, count);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      useQuad(part);
      gl.uniform1f(part.u.uNoiseOffset, u.noiseOffset);
      gl.uniform1f(part.u.uAmplitude, amp);
      gl.uniform1i(part.u.uSeed, u.seed);
      gl.uniform1f(part.u.uDotSpacing, 0.9);
      gl.uniform1f(part.u.uDotOffset, -0.45);
      gl.uniform1f(part.u.uSphereRadius, 0.675 + 0.225 * amp);
      gl.uniform1f(part.u.uFeather, Math.pow(amp + 3, 2) * (45 / 1568));
      gl.uniform1f(part.u.uNoiseFrequency, 4);
      gl.uniform1f(part.u.uNoiseAmplitude, 0.32 * 0.9);
      gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
      // 2. Draw the dots.
      gl.enable(gl.BLEND);
      gl.blendEquation(gl.MAX);
      gl.bindFramebuffer(gl.FRAMEBUFFER, dots.fb);
      gl.viewport(0, 0, size, size);
      gl.clear(gl.COLOR_BUFFER_BIT);
      useQuad(dot);
      const dotRadius = 0.9 / count;
      gl.uniform1i(dot.u.uDotCount, count);
      gl.uniform1f(dot.u.uDotRadius, dotRadius);
      gl.uniform1f(dot.u.uDotRadiusPX, dotRadius * 0.5 * size);
      gl.uniform1i(dot.u.uParticleTexture, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, particles.tex);
      gl.drawArraysInstanced(gl.TRIANGLE_FAN, 0, 4, count * count);
      // 3. Blur (two passes) for the glow.
      useQuad(blur);
      gl.uniform1f(blur.u.uBlurRadius, 0.01 * size);
      gl.uniform1i(blur.u.uInputTexture, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, blurX.fb);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(blur.u.uBlurDirection, 1 / size, 0);
      gl.bindTexture(gl.TEXTURE_2D, dots.tex);
      gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
      gl.bindFramebuffer(gl.FRAMEBUFFER, blurY.fb);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(blur.u.uBlurDirection, 0, 1 / size);
      gl.bindTexture(gl.TEXTURE_2D, blurX.tex);
      gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
      // 4. Combine sharp dots + glow in the chosen colour.
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, size, size);
      gl.clear(gl.COLOR_BUFFER_BIT);
      useQuad(fin);
      gl.uniform3f(fin.u.uOutputColor, u.color[0] / 255, u.color[1] / 255, u.color[2] / 255);
      gl.uniform1i(fin.u.uBlurredTexture, 0);
      gl.uniform1i(fin.u.uOriginalTexture, 1);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, blurY.tex);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, dots.tex);
      gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
      gl.activeTexture(gl.TEXTURE0);
      return cv;
    }
    return { render };
  }

  // ===========================================================================
  // Styles. v = this visualiser, p = the style's settings, U = size unit
  // (1 in a normal window, smaller in a small popout).
  // ===========================================================================
  const DRAW = {};

  // Wobble shake, like the videos: smooth sways whose size and speed follow
  // the bass. Each sway picks a new random size and direction as it passes
  // the middle, so it never looks like a loop or random jitter.
  function newAxis() {
    return { ph: Math.random() * 6.28, amp: 1, spd: 1, off: Math.random() * 6.28 };
  }
  function shakeAxis(ax, mult, dt) {
    const before = Math.floor(ax.ph / Math.PI);
    ax.ph += (Math.PI / 4) * 60 * dt * mult * ax.spd;
    if (Math.floor(ax.ph / Math.PI) !== before) {
      ax.amp = 0.9 + Math.random() * 0.7;
      ax.spd = 0.9 + Math.random() * 0.7;
    }
    return Math.sin(ax.ph + ax.off) * ax.amp;
  }

  // Where circular styles sit: around the album art if it's showing.
  // Where circle styles sit: the middle of the view (default), or round the
  // album art when "Circle at: Album art" is picked and the art is on screen.
  function circleSpot(v, p, factor) {
    if (p.circleAt === "art") {
      const art = v.artCircle();
      if (art) return { x: art.x, y: art.y, r: art.r * 1.06, art: true };
    }
    return { x: v.w / 2, y: v.h / 2, r: Math.min(v.w, v.h) * factor * p.size, art: false };
  }

  // Particles: a living field of light. Points drift through a slow swirling
  // flow, nearby ones link up into constellations, kicks blow them outwards
  // (then they drift back), bass makes them swell, hi-hats make them twinkle.
  DRAW.particles = (v, p, dt, t) => {
    const { ctx, w, h, U } = v;
    const e = shared.energy, bass = shared.bassPunch || 0, k = Math.min(1, shared.kick), tre = shared.treble || 0;
    const want = Math.round(120 * p.particles);
    const P2 = v.particles;
    while (P2.length < want)
      P2.push({ x: Math.random() * w, y: Math.random() * h, vx: 0, vy: 0, ox: 0, oy: 0, ovx: 0, ovy: 0, z: 0.25 + Math.random() * 0.75, c: Math.random(), ph: Math.random() * 6.3, tw: Math.random() * 6.3 });
    if (P2.length > want) P2.length = want;
    // Flow speed eases with the music so it never jerks.
    const flowTarget = (0.35 + 1.2 * e + 0.6 * bass) * p.speed;
    v.pFlow = (v.pFlow || flowTarget) + (flowTarget - (v.pFlow || flowTarget)) * Math.min(1, dt * 2.5);
    const cx = w / 2, cy = h / 2, far = Math.max(w, h);
    // Burst on each beat of the beat clock (in time with the song), not on
    // every kick-like hit; harder when there's a kick on the beat.
    const kicked = v.beatSeen !== shared.tickSerial;
    if (kicked) v.beatSeen = shared.tickSerial;
    const burst = Math.max(0.45, Math.min(1, shared.kick)) * (shared.beatInBar === 0 ? 1.25 : 1);
    for (const q of P2) {
      // Swirling flow from a stream function: it can't pile points up in one
      // place, so they stay spread out (two layers of swirl for variety).
      const X = (q.x / U) * 0.006 + t * 0.11, Y = (q.y / U) * 0.006 - t * 0.09;
      const X2 = (q.x / U) * 0.013 - t * 0.07, Y2 = (q.y / U) * 0.011 + t * 0.13;
      const fx = -Math.sin(X) * Math.sin(Y) - 0.5 * Math.sin(X2) * Math.sin(Y2) + 0.25;
      const fy = -Math.cos(X) * Math.cos(Y) - 0.5 * Math.cos(X2) * Math.cos(Y2);
      const sp = 22 * U * v.pFlow * (0.45 + q.z);
      q.vx += (fx * sp + Math.sin(t * 0.7 + q.ph) * 3 * U - q.vx) * Math.min(1, dt * 1.2);
      q.vy += (fy * sp + Math.cos(t * 0.6 + q.ph) * 3 * U - q.vy) * Math.min(1, dt * 1.2);
      // Kicks throw each point outwards on a spring, so it pulses out and
      // settles back to where it was (x/y is its resting place in the flow).
      if (kicked) {
        const dx = q.x - cx, dy = q.y - cy, d = Math.hypot(dx, dy) + 1;
        const push = (420 * U * burst * (0.4 + q.z) * p.size) / (1 + d / (far * 0.6));
        q.ovx += (dx / d) * push;
        q.ovy += (dy / d) * push;
      }
      const sdt = Math.min(dt, 0.033), om = 6, ze = 0.75;
      q.ovx += (-om * om * q.ox - 2 * ze * om * q.ovx) * sdt;
      q.ovy += (-om * om * q.oy - 2 * ze * om * q.ovy) * sdt;
      q.ox += q.ovx * sdt;
      q.oy += q.ovy * sdt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      // Drifted off screen: fade back in somewhere else (wrapping round made
      // points get stuck just off the edges).
      const m = 20 * U;
      if (q.x < -m || q.x > w + m || q.y < -m || q.y > h + m) {
        q.x = Math.random() * w;
        q.y = Math.random() * h;
        q.ox = q.oy = q.ovx = q.ovy = 0;
        q.fade = 0;
      }
      q.fade = Math.min(1, (q.fade ?? 1) + dt * 0.8);
    }
    // Constellation lines between close points (grouped into a few strokes).
    const D = 75 * U * p.size * (1 + 0.25 * bass);
    const D2 = D * D;
    const buckets = [[], [], [], []];
    for (let i = 0; i < P2.length; i++) {
      const a = P2[i];
      if (a.z < 0.45) continue;
      const ax = a.x + a.ox, ay = a.y + a.oy;
      for (let j = i + 1; j < P2.length; j++) {
        const b = P2[j];
        if (b.z < 0.45) continue;
        const bx = b.x + b.ox, by = b.y + b.oy;
        const dx = ax - bx, dy = ay - by, d2 = dx * dx + dy * dy;
        if (d2 < D2) buckets[Math.min(3, Math.floor((1 - Math.sqrt(d2) / D) * 4 * Math.min(a.fade ?? 1, b.fade ?? 1)))].push(ax, ay, bx, by);
      }
    }
    const lineCol = colorAt(0.5);
    ctx.lineWidth = Math.max(0.6, 0.9 * U);
    for (let bkt = 0; bkt < 4; bkt++) {
      const arr = buckets[bkt];
      if (!arr.length) continue;
      ctx.beginPath();
      for (let i = 0; i < arr.length; i += 4) {
        ctx.moveTo(arr[i], arr[i + 1]);
        ctx.lineTo(arr[i + 2], arr[i + 3]);
      }
      ctx.strokeStyle = v.rgba(lineCol, ((bkt + 1) / 4) * (0.1 + 0.3 * e + 0.35 * k));
      ctx.stroke();
    }
    // The points themselves.
    for (const q of P2) {
      q.tw += dt * (1.5 + 6 * tre);
      const tw = 0.65 + 0.35 * Math.sin(q.tw);
      const r = (1.4 + 2.6 * q.z) * U * p.size * (1 + 0.5 * bass * q.z + 0.6 * k * q.z);
      v.glow(q.x + q.ox, q.y + q.oy, r * 2.2, mix(WHITE, colorAt(q.c), 0.55), (0.3 + 0.6 * q.z) * tw * (q.fade ?? 1));
    }
    v.soft(cx, cy, far * 0.35, colorAt(0.5), 0.05 + 0.12 * bass + 0.12 * k);
  };

  DRAW.monstercat = (v, p, dt, t) => {
    const { ctx, w, h, U } = v;
    const n = Math.max(8, Math.round(p.barCount));
    const margin = w * 0.06;
    const slot = (w - margin * 2) / n;
    const bw = slot * 0.74;
    const both = p.position === "both";
    const maxH = h * (both ? 0.22 : 0.34) * p.size;

    // Bass on the left, like Monstercat. Neighbour smoothing for the "hills".
    const raw = new Array(n);
    for (let i = 0; i < n; i++) raw[i] = bandAt(Math.pow(i / (n - 1), 1.1) * 0.95);
    const vals = monstercatFilter(raw, 1.75 + p.smoothing * 1.5);

    // Bar colour (Look tab):
    //  Flow (default) - the colours as a gradient across the bars
    //  Frequency - a fixed gradient: bass colour on the left, treble right
    //  Area - coloured by how high up the screen: low parts one colour, the
    //    tops of tall bars another
    //  Bar - each bar is one colour, picked by how tall that bar is
    //  Solid - one colour for all bars, fading to the next on the beat
    // Beat changes ease over about half a second (they used to snap).
    // Colours stay put: no sliding sideways and no changes on the beat.
    v.mcOff = 0;
    v.mcDrift = 0;
    const mode = p.mcColor || "flow";
    const both0 = p.position === "both";
    const maxH0 = h * (both0 ? 0.22 : 0.34) * p.size;
    let fill;
    if (mode === "solid") fill = v.rgba(colorAt(cyc(0.2 + v.mcOff)), 1);
    else if (mode === "height" || mode === "bar") fill = null; // made per row below
    else {
      const off = mode === "flow" ? v.mcOff + v.mcDrift : 0;
      fill = ctx.createLinearGradient(margin, 0, w - margin, 0);
      for (let s = 0; s <= 6; s++) fill.addColorStop(s / 6, v.rgba(colorAt(cyc(s / 6 + off)), 1));
    }
    const heightFill = (baseY, top) => {
      const g = ctx.createLinearGradient(0, baseY, 0, top ? baseY + maxH0 : baseY - maxH0);
      for (let s = 0; s <= 4; s++) g.addColorStop(s / 4, v.rgba(colorAt(cyc(s / 4 * 0.9 + v.mcOff * 0.5)), 1));
      return g;
    };
    const rows = both ? [false, true] : [p.position === "top"];
    const floorY = unitArea(v).floor;
    for (const top of rows) {
      const baseY = top ? h * 0.12 : Math.min(h * 0.88, floorY - h * 0.03);
      if (mode === "bar") {
        // Each bar one colour by its own height: bars grouped into 6 heights
        // (6 fills instead of one per bar keeps it cheap).
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        ctx.shadowBlur = (4 + 8 * shared.kick) * U;
        for (let g = 0; g < 6; g++) {
          ctx.beginPath();
          let any = false;
          for (let i = 0; i < n; i++) {
            const val = Math.min(1, vals[i]);
            if (Math.min(5, Math.floor(val * 6)) !== g) continue;
            const bh = Math.max(2 * U, val * maxH);
            ctx.rect(margin + i * slot + (slot - bw) / 2, top ? baseY : baseY - bh, bw, bh);
            any = true;
          }
          if (!any) continue;
          const col = colorAt(cyc((g / 5) * 0.9 + v.mcOff * 0.5));
          ctx.shadowColor = v.rgba(col, 0.85);
          ctx.fillStyle = v.rgba(col, 1);
          ctx.fill();
        }
        ctx.restore();
        continue;
      }
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const bh = Math.max(2 * U, Math.min(1, vals[i]) * maxH);
        const x = margin + i * slot + (slot - bw) / 2;
        ctx.rect(x, top ? baseY : baseY - bh, bw, bh);
      }
      ctx.save();
      ctx.globalCompositeOperation = "source-over"; // keep the colours (adding onto the glow washed them to white)
      ctx.shadowColor = v.rgba(colorAt(0.2), 0.85);
      ctx.shadowBlur = (4 + 8 * shared.kick) * U;
      ctx.fillStyle = fill || heightFill(baseY, top);
      ctx.fill();
      ctx.restore();
    }

    // Particles drift slowly to the right; a kick gives them a push.
    const want = Math.round(110 * p.particles);
    const P2 = v.particles;
    while (P2.length < want) P2.push({ x: Math.random() * w, y: Math.random() * h, z: 0.25 + Math.random() * 0.75, ph: Math.random() * 6.3 });
    if (P2.length > want) P2.length = want;
    const mcTarget = 30 + 120 * shared.energy + 110 * (shared.bassPunch || 0) + 140 * shared.kick;
    v.mcSpeed = (v.mcSpeed || mcTarget) + (mcTarget - (v.mcSpeed || mcTarget)) * Math.min(1, dt * (mcTarget > v.mcSpeed ? 6 : 1.5));
    const speed = v.mcSpeed * U * p.speed;
    const tint = mix(WHITE, colorAt(0.2), 0.3);
    for (const q of P2) {
      q.x += speed * q.z * dt;
      q.y += (Math.sin(t * 0.6 + q.ph) * 6 - 3) * q.z * dt * U * p.speed;
      if (q.x > w + 10) { q.x = -10; q.y = Math.random() * h; }
      if (q.y < -10) q.y = h + 10;
      if (q.y > h + 10) q.y = -10;
      v.glow(q.x, q.y, (1.6 + 3.4 * q.z) * U, tint, 0.2 + 0.45 * q.z);
    }
  };

  DRAW.ncs = (v, p, dt) => {
    const r = getNcs();
    if (!r) return DRAW.particles(v, p, dt, shared.time);
    const spot = circleSpot(v, p, 0.3);
    // Loudness on a fixed scale, like the original (which used the track's
    // real loudness, not a level that adjusts itself). Moving average ~0.15 s.
    let loud;
    if (isLive()) {
      const a = shared.live.abs * Math.pow(10, volumeDb() / 20); // undo Spotify's volume
      loud = Math.min(1, a * 1.9 * p.sensitivity); // ~0.5-0.7 for loud music, ~0.1 for quiet
    } else loud = Math.min(1, shared.energy * 0.6);
    v.ncsAmp = (v.ncsAmp || 0) + (loud - (v.ncsAmp || 0)) * Math.min(1, dt / 0.15);
    const amp = v.ncsAmp;
    // The dots only move when there's sound: the flow advances with loudness
    // (silence = still), so it never plays like a loop.
    v.ncsOffset = (v.ncsOffset || 0) + dt * (0.04 + amp * 1.1) * p.speed;
    const R = spot.art ? spot.r * 1.6 * p.size : spot.r * 1.25;
    const px = Math.max(64, Math.min(1400, Math.round((2 * R) / 0.9)));
    const c = colorAt(0.5);
    // If this computer struggles, quietly render smaller and with fewer dots.
    v.ncsScale = v.ncsScale || 1;
    const t0 = performance.now();
    const eco = v.lowPower ? 0.65 : 1;
    const inner = Math.max(96, Math.round(px * ({ low: 0.75, medium: 1, high: 1.25 }[S.quality] || 1) * v.ncsScale * eco));
    const out = r.render(inner, { amplitude: amp, noiseOffset: v.ncsOffset, seed: shared.seed, color: c, maxDots: Math.round(({ low: 190, medium: 280, high: 360 }[S.quality] || 280) * v.ncsScale * eco) });
    if (!out) return;
    v.ctx.globalAlpha = Math.min(1, CP.brightness);
    v.ctx.drawImage(out, spot.x - px / 2, spot.y - px / 2, px, px);
    const took = performance.now() - t0;
    v.ncsTime = v.ncsTime === undefined ? took : v.ncsTime * 0.9 + took * 0.1;
    if (v.ncsTime > 20 && v.ncsScale > 0.35) {
      v.ncsScale *= 0.8;
      v.ncsTime = 12;
    }
    v.ctx.globalAlpha = 1;
  };

  DRAW.radial = (v, p, dt) => {
    const { ctx, w, h, U } = v;
    const spot = circleSpot(v, p, 0.17);
    const { x: cx, y: cy } = spot;
    const r0 = spot.r * (1 + 0.06 * shared.kick);
    const maxLen = Math.min(w, h) * 0.2 * p.size;
    const half = Math.max(12, Math.round(p.barCount));
    const N = half * 2;
    let vals = new Array(half);
    for (let i = 0; i < half; i++) vals[i] = bandAt(Math.pow(i / (half - 1), 1.1) * 0.9);
    vals = monstercatFilter(vals, 1.6 + p.smoothing * 1.4);
    const rot = 0; // stays still (it used to turn a notch on every beat)
    v.soft(cx, cy, r0 * 2.5, colorAt(0.5), 0.2 + 0.3 * (shared.bassPunch || 0) + 0.2 * shared.kick);
    ctx.lineCap = "round";
    ctx.lineWidth = Math.max(1.2 * U, ((2 * Math.PI * r0) / N) * 0.55);
    for (let i = 0; i < N; i++) {
      const j = i < half ? i : N - 1 - i;
      const val = Math.min(1, vals[j]);
      const len = 1.5 * U + val * maxLen;
      const a = (i / N) * Math.PI * 2 - Math.PI / 2 + rot;
      const cs = Math.cos(a), sn = Math.sin(a);
      ctx.strokeStyle = v.rgba(colorAt(j / half), 0.55 + 0.45 * val);
      ctx.beginPath();
      ctx.moveTo(cx + cs * (r0 + 2 * U), cy + sn * (r0 + 2 * U));
      ctx.lineTo(cx + cs * (r0 + 2 * U + len), cy + sn * (r0 + 2 * U + len));
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, r0, 0, Math.PI * 2);
    ctx.strokeStyle = v.rgba(WHITE, 0.35 + 0.45 * shared.kick);
    ctx.lineWidth = (1.5 + 2 * shared.kick) * U;
    ctx.stroke();
  };

  DRAW.mirror = (v, p) => {
    const { ctx, w, h, U } = v;
    const perSide = Math.max(6, Math.round(p.barCount / 2));
    const gap = w / (perSide * 2);
    const bw = gap * 0.6;
    const both = p.position === "both";
    const maxH = h * (both ? 0.11 : 0.16) * p.size;
    const lines = both ? [h * 0.18, h * 0.82] : [p.position === "top" ? h * 0.2 : h * 0.8];
    const raw = new Array(perSide);
    for (let i = 0; i < perSide; i++) raw[i] = bandAt((i / (perSide - 1)) * 0.92);
    const vals = monstercatFilter(raw, 2 + p.smoothing * 1.5);
    for (const y0 of lines) {
      ctx.save();
      ctx.shadowColor = v.rgba(colorAt(0.3), 0.8);
      ctx.shadowBlur = (5 + 12 * shared.kick) * U;
      for (let i = 0; i < perSide; i++) {
        const q = i / (perSide - 1);
        const up = Math.max(bw / 2, Math.min(1, vals[i]) * maxH);
        const down = up * 0.7;
        const grad = ctx.createLinearGradient(0, y0 - up, 0, y0 + down);
        grad.addColorStop(0, v.rgba(colorAt(q), 0.95));
        grad.addColorStop(0.58, v.rgba(colorAt(0.5 + q / 2), 0.85));
        grad.addColorStop(1, v.rgba(colorAt(0.5 + q / 2), 0.1));
        ctx.fillStyle = grad;
        for (const side of [-1, 1]) {
          const x = w / 2 + side * (i + 0.5) * gap - bw / 2;
          v.roundRect(x, y0 - up, bw, up + down, bw / 2);
        }
      }
      ctx.restore();
    }
  };

  // ---------------------------------------------------------------------------
  // The music-driven fluid shared by LED Plasma (on LED dots) and Plasma
  // (smooth). Fills `d` (cols x rows RGBA). The music sets how fast it flows
  // (loudness, bass, a surge on each kick), how hard it swirls (bass), how
  // fine it shimmers (treble) and how bright it is. On each step of the beat
  // clock the colours sweep a third of the way round the palette; a drop
  // gives it a big swirl. It is kept fairly dim on purpose so white lyrics
  // stay readable over it: deep colour, never near white.
  function fluidFrame(st, d, cols, rows, p, dt, ghost) {
    const lut = st.lut || (st.lut = new Uint8ClampedArray(256 * 3));
    for (let i = 0; i < 256; i++) {
      const c = colorAt(0.5 - 0.5 * Math.cos((i / 256) * Math.PI * 2));
      lut[i * 3] = c[0];
      lut[i * 3 + 1] = c[1];
      lut[i * 3 + 2] = c[2];
    }
    const k = Math.min(1, shared.kick);
    const e = shared.energy, bass = shared.bassPunch || 0, tre = shared.treble || 0;
    const fl = st.fl || (st.fl = { t: Math.random() * 50, spd: 0.3, swirl: 0.5, lum: 0.3, surge: 0, off: 0, offT: 0, dropSeen: shared.dropSerial, tickSeen: shared.tickSerial, beat: 0 });
    // Moves ON THE BEAT: each beat of the beat clock (the song's own beat
    // grid when Spotify gives it, otherwise the tempo-locked kick clock)
    // gives the flow a push that dies away before the next beat, so it
    // surges forward in time with the song and coasts in between. Loudness
    // and bass only nudge it a little now.
    if (fl.tickSeen !== shared.tickSerial) { fl.tickSeen = shared.tickSerial; fl.beat = 1; }
    const per = bpm.period > 300 && bpm.period < 900 ? bpm.period / 1000 : 0.5;
    fl.beat *= Math.exp(-dt * (4 / per)); // gone by about the next beat
    if (fl.dropSeen !== shared.dropSerial) { fl.dropSeen = shared.dropSerial; fl.surge = 1.6; }
    fl.surge *= Math.exp(-dt * 1.5);
    const spdT = (0.08 + 0.15 * e + 0.15 * bass + 2.2 * fl.beat + 1.2 * fl.surge) * p.speed;
    fl.spd += (spdT - fl.spd) * Math.min(1, dt * 14);
    fl.t += dt * fl.spd;
    const swT = 0.35 + 0.35 * bass + 0.45 * fl.beat + 0.5 * fl.surge;
    fl.swirl += (swT - fl.swirl) * Math.min(1, dt * 8);
    // Brightness: a pulse on each beat, a little loudness; tops out well
    // below full (readability).
    const lumT = 0.16 + 0.2 * e + 0.32 * fl.beat;
    fl.lum += (lumT - fl.lum) * Math.min(1, dt * 16);
    const steps = beatSteps(fl, p);
    fl.offT = steps * 85; // a third of the palette per step
    fl.off += (fl.offT - fl.off) * Math.min(1, dt * 9);
    const F = fl.t, sw = fl.swirl, lum = fl.lum, off = fl.off, shim = 0.7 * tre;
    const aspect = cols / rows;
    for (let y = 0; y < rows; y++) {
      const y0 = (y / rows - 0.5) * 2.6;
      for (let x = 0; x < cols; x++) {
        const x0 = (x / cols - 0.5) * 2.6 * aspect;
        // Two layers of warping give the swirling, liquid movement.
        const wx = x0 + sw * (Math.sin(y0 * 1.3 + F * 0.7) + 0.6 * Math.sin(x0 * 0.9 - F * 0.5));
        const wy = y0 + sw * (Math.cos(x0 * 1.1 + F * 0.6) + 0.6 * Math.sin(y0 * 1.7 - F * 0.8));
        const wx2 = wx + sw * 0.6 * Math.sin(wy * 1.2 - F * 0.4);
        const wy2 = wy + sw * 0.6 * Math.cos(wx * 1.4 + F * 0.3);
        const val = Math.sin(wx2 * 1.5 + F) + Math.sin(wy2 * 1.8 - F * 0.7) + Math.sin((wx2 + wy2) * 0.9 + F * 0.5) + shim * Math.sin(wx2 * 6 + wy2 * 5 + F * 3);
        const idx = (((((val + 3.7) / 7.4) * 255 + off) | 0) & 255) * 3;
        const shade = Math.pow(0.5 + 0.5 * Math.sin(val * 1.4), 1.6);
        const bright = Math.min(0.72, ghost + shade * lum);
        const o = (y * cols + x) * 4;
        d[o] = lut[idx] * bright;
        d[o + 1] = lut[idx + 1] * bright;
        d[o + 2] = lut[idx + 2] * bright;
        d[o + 3] = 255;
      }
    }
  }

  // Plasma: the same fluid as LED Plasma, drawn smooth (no dots). Worked out
  // on a small grid (about 96 across) and scaled up with smoothing.
  DRAW.plasma = (v, p, dt) => {
    const PW = 96, PH = Math.max(24, Math.min(96, Math.round((PW * v.h) / Math.max(1, v.w))));
    let pl = v.plasma;
    if (!pl || pl.PH !== PH) {
      const c = document.createElement("canvas");
      c.width = PW;
      c.height = PH;
      const g = c.getContext("2d");
      pl = v.plasma = { c, g, PH, img: g.createImageData(PW, PH), fl: pl && pl.fl, lut: pl && pl.lut };
    }
    fluidFrame(pl, pl.img.data, PW, PH, p, dt, 0.03);
    pl.g.putImageData(pl.img, 0, 0);
    const ctx = v.ctx;
    ctx.globalCompositeOperation = "source-over";
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "medium";
    ctx.globalAlpha = A_(1, v);
    ctx.drawImage(pl.c, 0, 0, v.w, v.h);
    ctx.globalAlpha = 1;
  };

  DRAW.warp = (v, p, dt) => {
    const { ctx, w, h, U } = v;
    const cx = w / 2;
    const cy = h / 2;
    const want = Math.round(240 * p.particles);
    const P2 = v.particles;
    const spawn = (far) => ({ x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2, z: far ? 1 : 0.2 + Math.random() * 0.8, c: Math.random() });
    while (P2.length < want) P2.push(spawn(false));
    if (P2.length > want) P2.length = want;
    // Speed follows loudness + bass, eased (fast up, slower down) so it's steady.
    // A surge on every beat that dies away by the next one (bigger on the
    // first beat of the bar), so the stars rush in time with the song.
    if (v.wTick !== shared.tickSerial) { v.wTick = shared.tickSerial; v.wBeat = shared.beatInBar === 0 ? 1.3 : 1; }
    v.wBeat = (v.wBeat || 0) * Math.exp(-dt * (3.5 / beatPhase().per));
    const wTarget = (0.1 + 0.6 * Math.pow(shared.energy, 1.4) + 0.3 * (shared.bassPunch || 0) + 0.25 * Math.min(1, shared.kick) + 1.1 * v.wBeat) * p.speed;
    v.wSpeed = (v.wSpeed || wTarget) + (wTarget - (v.wSpeed || wTarget)) * Math.min(1, dt * (wTarget > v.wSpeed ? 7 : 1.8));
    const speed = v.wSpeed;
    const scale = Math.max(w, h) * 0.5;
    ctx.lineCap = "round";
    for (let i = 0; i < P2.length; i++) {
      const q = P2[i];
      const zPrev = q.z + speed * dt * 2.5 + 0.004;
      q.z -= speed * dt;
      if (q.z <= 0.02) {
        P2[i] = spawn(true);
        continue;
      }
      const sx = cx + (q.x / q.z) * scale, sy = cy + (q.y / q.z) * scale;
      if (sx < -20 || sx > w + 20 || sy < -20 || sy > h + 20) {
        P2[i] = spawn(true);
        continue;
      }
      const near = 1 - q.z;
      ctx.strokeStyle = v.rgba(mix(WHITE, colorAt(q.c), 0.6), 0.15 + 0.85 * near);
      ctx.lineWidth = (0.6 + near * 2.6) * U;
      ctx.beginPath();
      ctx.moveTo(cx + (q.x / zPrev) * scale, cy + (q.y / zPrev) * scale);
      ctx.lineTo(sx, sy);
      ctx.stroke();
    }
    v.soft(cx, cy, Math.max(w, h) * 0.12 * (1 + shared.bass), colorAt(0.5), 0.18 + 0.3 * shared.kick);
  };

  // ---------------------------------------------------------------------------
  // Beat Motion: smooth movement locked to the song's beat, nothing random.
  // It reads where we are between two beats (beatPhase), so it moves the
  // whole time, not just on hits. Three looks:
  //  Sweep - a soft band of light glides across the screen once per beat,
  //          back and forth, leaving a fading trail; colour changes per bar.
  //  Radar - an arm goes round once per bar (4 beats) past four beat marks;
  //          kicks leave glowing blips that fade over the bar.
  //  Rings - a ring ripples out from the middle on every beat, a bigger
  //          brighter one on the first beat of each bar.
  // Cheap: a handful of shapes per frame, see-through so lyrics read.
  const ease = (x) => 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, x)));
  const cyc = (q) => 1 - Math.abs((((q % 2) + 2) % 2) - 1); // 0..1..0, no jumps
  DRAW.motion = (v, p, dt, t) => {
    const { ctx, w, h, U } = v;
    const st = v.motion || (v.motion = { tick: shared.tickSerial, kick: shared.beatSerial, beats: 0, bars: 0, blips: [], rings: [], flash: 0 });
    const bp = beatPhase();
    const k = Math.min(1, shared.kick), bass = shared.bassPunch || 0;
    if (st.tick !== shared.tickSerial) {
      st.tick = shared.tickSerial;
      st.beats++;
      if (bp.inBar === 0) st.bars++;
      st.flash = bp.inBar === 0 ? 1 : 0.6;
      st.rings.push({ age: 0, big: bp.inBar === 0, c: st.bars });
      if (st.rings.length > 8) st.rings.shift();
    }
    st.flash *= Math.exp(-dt * (3 / bp.per));
    const look = p.motionLook || "sweep";
    const col = (q) => colorAt(cyc(q + st.bars * 0.35));

    if (look === "sweep") {
      // Back and forth: even beats left -> right, odd beats right -> left.
      const pos = (b, ph) => { const x = ease(ph); return b % 2 ? 1 - x : x; };
      const bw = w * 0.16 * p.size;
      const c = col(0.3);
      for (let g = 6; g >= 0; g--) {
        // the trail: where the band was a little earlier (same beat only)
        const ph = bp.ph - g * 0.05;
        if (ph < 0) continue;
        const x = pos(st.beats, ph) * (w + bw) - bw / 2;
        const a = (g === 0 ? 0.3 : 0.16 * (1 - g / 7)) * (0.55 + 0.45 * st.flash + 0.3 * bass);
        const grad = ctx.createLinearGradient(x - bw / 2, 0, x + bw / 2, 0);
        grad.addColorStop(0, v.rgba(c, 0));
        grad.addColorStop(0.5, v.rgba(g === 0 ? mix(c, WHITE, 0.35) : c, a));
        grad.addColorStop(1, v.rgba(c, 0));
        ctx.fillStyle = grad;
        ctx.fillRect(x - bw / 2, 0, bw, h);
      }
      // a thin bright line along the bottom shows the beat count in the bar
      const floor = unitArea(v).floor;
      for (let i = 0; i < 4; i++) {
        const on = i === bp.inBar;
        ctx.fillStyle = v.rgba(on ? mix(c, WHITE, 0.4) : c, on ? 0.75 : 0.18);
        ctx.fillRect(w * (0.3 + i * 0.1) + 2 * U, floor - 10 * U, w * 0.1 - 4 * U, 3 * U * p.size);
      }
      return;
    }

    const spot = circleSpot(v, p, 0.3);
    const cx = spot.x, cy = spot.y, R = spot.r;
    const c = col(0.5);

    if (look === "radar") {
      // One turn per bar: 4 beats, the arm passes a mark on each beat.
      const turn = ((bp.inBar + bp.ph) / 4) * Math.PI * 2 - Math.PI / 2;
      ctx.lineWidth = Math.max(1, 1.2 * U);
      ctx.strokeStyle = v.rgba(c, 0.18);
      ctx.beginPath();
      for (const f of [0.35, 0.7, 1]) { ctx.moveTo(cx + R * f, cy); ctx.arc(cx, cy, R * f, 0, Math.PI * 2); }
      ctx.stroke();
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 - Math.PI / 2, on = i === bp.inBar;
        ctx.strokeStyle = v.rgba(on ? WHITE : c, on ? 0.5 + 0.5 * st.flash : 0.3);
        ctx.lineWidth = (on ? 3 : 2) * U;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * R * 0.92, cy + Math.sin(a) * R * 0.92);
        ctx.lineTo(cx + Math.cos(a) * R * 1.08, cy + Math.sin(a) * R * 1.08);
        ctx.stroke();
      }
      // the fading wedge behind the arm
      const W = 0.9;
      for (let s = 0; s < 8; s++) {
        const a1 = turn - (s / 8) * W, a0 = turn - ((s + 1) / 8) * W;
        ctx.fillStyle = v.rgba(c, 0.16 * (1 - s / 8) * (0.7 + 0.5 * st.flash));
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, R, a0, a1);
        ctx.closePath();
        ctx.fill();
      }
      ctx.strokeStyle = v.rgba(mix(c, WHITE, 0.5), 0.8);
      ctx.lineWidth = 2 * U;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(turn) * R, cy + Math.sin(turn) * R);
      ctx.stroke();
      // kicks leave blips under the arm, further out for harder kicks
      if (st.kick !== shared.beatSerial) {
        st.kick = shared.beatSerial;
        st.blips.push({ a: turn, r: R * (0.25 + 0.7 * Math.min(1, 0.3 + bass * 0.8 + Math.random() * 0.2)), life: 1 });
        if (st.blips.length > 16) st.blips.shift();
      }
      for (let i = st.blips.length - 1; i >= 0; i--) {
        const b = st.blips[i];
        b.life -= dt / (bp.per * 4);
        if (b.life <= 0) { st.blips.splice(i, 1); continue; }
        v.glow(cx + Math.cos(b.a) * b.r, cy + Math.sin(b.a) * b.r, (3 + 4 * b.life) * U * p.size, mix(c, WHITE, 0.4), 0.8 * b.life);
      }
      v.soft(cx, cy, R * 0.5, c, 0.08 + 0.15 * st.flash);
      return;
    }

    // Rings: ripple out from the middle on each beat.
    const life = bp.per * 3;
    const far = Math.hypot(w, h) * 0.5;
    for (let i = st.rings.length - 1; i >= 0; i--) {
      const r = st.rings[i];
      r.age += dt;
      const q = r.age / life;
      if (q >= 1) { st.rings.splice(i, 1); continue; }
      const rad = R * 0.35 + (far - R * 0.35) * (1 - Math.pow(1 - q, 2.2)); // fast out, slowing
      const rc = colorAt(cyc(r.c * 0.35 + 0.5));
      ctx.strokeStyle = v.rgba(r.big ? mix(rc, WHITE, 0.3) : rc, (r.big ? 0.7 : 0.45) * (1 - q) * (1 - q));
      ctx.lineWidth = (r.big ? 5 : 2.5) * U * p.size * (1 - 0.5 * q);
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.stroke();
    }
    // the middle breathes with the beat
    const pulse = 1 - ease(bp.ph);
    ctx.strokeStyle = v.rgba(mix(c, WHITE, 0.4), 0.35 + 0.45 * pulse);
    ctx.lineWidth = 2 * U;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.35 * (1 + 0.08 * pulse + 0.05 * k), 0, Math.PI * 2);
    ctx.stroke();
    v.soft(cx, cy, R * 0.6, c, 0.08 + 0.18 * st.flash);
  };

  // ---------------------------------------------------------------------------
  // Drum & Bass: a growling "reese" bass wave (three detuned strands) that
  // pumps on kicks, speed streaks racing past at breakbeat pace, and on every
  // snare a white flash streak and a quick horizontal glitch.
  DRAW.dnb = (v, p, dt, t) => {
    const { ctx, w, h, U } = v;
    const e = shared.energy, bass = shared.bassPunch || 0, k = Math.min(1, shared.kick);
    const st = v.dnb || (v.dnb = { streaks: [], flash: 0, glitch: 0, snareSeen: shared.snareSerial, phase: 0 });
    // Streaks.
    const want = Math.round(22 * p.particles); // was 60: too many lines
    const S2 = st.streaks;
    const spawn = (bright) => ({ x: w + Math.random() * w * (bright ? 0.1 : 1), y: Math.random() * h, len: (40 + Math.random() * 160) * U, z: bright ? 1 : 0.25 + Math.random() * 0.75, c: Math.random(), bright });
    while (S2.filter((q) => !q.bright).length < want) S2.push(spawn(false));
    if (st.snareSeen !== shared.snareSerial) {
      st.snareSeen = shared.snareSerial;
      st.flash = 1;
      st.glitch = 1;
      for (let i = 0; i < 3; i++) S2.push(spawn(true));
    }
    const sp = (500 + 1500 * e + 900 * k) * U * p.speed;
    ctx.lineCap = "round";
    for (let i = S2.length - 1; i >= 0; i--) {
      const q = S2[i];
      q.x -= sp * q.z * (q.bright ? 1.6 : 1) * dt;
      if (q.x + q.len < -10) {
        if (q.bright || S2.length > want + 10) S2.splice(i, 1);
        else Object.assign(q, spawn(false), { x: w + Math.random() * 40 * U });
        continue;
      }
      const col = q.bright ? WHITE : mix(WHITE, colorAt(q.c), 0.6);
      ctx.strokeStyle = v.rgba(col, (q.bright ? 0.8 : 0.08 + 0.25 * q.z) * (0.6 + 0.6 * e));
      ctx.lineWidth = (q.bright ? 2.2 : 0.6 + 1.4 * q.z) * U;
      ctx.beginPath();
      ctx.moveTo(q.x, q.y);
      ctx.lineTo(q.x + q.len * (q.bright ? 1.5 : 1), q.y);
      ctx.stroke();
    }
    // Reese bass wave.
    const y0 = h * 0.74;
    const A = h * 0.13 * p.size * (0.12 + 0.9 * bass + 0.45 * k);
    // The wave rolls one full swing every 2 beats (locked to the tempo),
    // with a push on each beat that settles before the next.
    const lbp = beatPhase();
    if (st.tick !== shared.tickSerial) { st.tick = shared.tickSerial; st.push = 1; }
    st.push = (st.push || 0) * Math.exp(-dt * (4 / lbp.per));
    st.phase += dt * ((Math.PI / lbp.per) * (0.8 + 0.4 * e) + 6 * st.push) * p.speed;
    const growl = 0.4 + 1.6 * (shared.treble || 0) + 0.8 * e;
    for (let strand = 0; strand < 3; strand++) {
      const det = 1 + strand * 0.045; // detuned, like a reese
      ctx.beginPath();
      for (let x = 0; x <= w; x += 4 * U) {
        const q = x / w;
        const env = Math.sin(Math.PI * q);
        const y = y0 + A * env * (Math.sin(q * 9 * det + st.phase * det) * 0.7 + Math.sin(q * 31 * det - st.phase * 2.3) * 0.3 * growl);
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.strokeStyle = v.rgba(strand === 0 ? WHITE : colorAt(strand / 2), strand === 0 ? 0.8 : 0.65);
      ctx.lineWidth = (strand === 0 ? 2 : 3.5) * U * (1 + 0.6 * k);
      ctx.stroke();
    }
    v.soft(w / 2, y0, Math.max(w, h) * 0.32, colorAt(0.5), 0.12 + 0.3 * bass + 0.25 * k);
    // Snare: flash + glitch slices.
    st.flash *= Math.exp(-dt * 9);
    if (st.flash > 0.02) {
      ctx.globalAlpha = A_(0.1 * st.flash, v);
      ctx.drawImage(softSprite(WHITE), -w * 0.2, -h * 0.4, w * 1.4, h * 1.8);
      ctx.globalAlpha = 1;
    }
    st.glitch *= Math.exp(-dt * 14);
    if (st.glitch > 0.15) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      for (let i = 0; i < 3; i++) {
        const sy = Math.random() * h, sh = h * (0.02 + Math.random() * 0.05);
        const dx = (Math.random() - 0.5) * 40 * U * st.glitch;
        ctx.drawImage(ctx.canvas, 0, sy, w, sh, dx, sy, w, sh);
      }
      ctx.restore();
    }
  };
  const A_ = (a, v) => Math.max(0, Math.min(1, a * CP.brightness * (1 + 0.3 * shared.noLyr)));

  // ---------------------------------------------------------------------------
  // ASCII: a terminal spectrum made of characters. Brighter characters at the
  // top of each bar, peak markers that fall slowly, and faint flickering code.
  const ASCII_RAMP = " .:-=+*#%@";
    DRAW.ascii = (v, p, dt, t) => {
    const { ctx, w, h, U } = v;
    const cell = Math.max(6, Math.round(10 * U * p.size));
    const cw = cell * 0.62;
    const cols = Math.max(8, Math.floor(w / cw));
    const rows = Math.max(6, Math.floor(h / cell));
    const st = v.asc || (v.asc = { peaks: [] });
    if (st.peaks.length !== cols) st.peaks = new Array(cols).fill(0);
    ctx.font = `700 ${cell}px ui-monospace, Consolas, "Courier New", monospace`;
    ctx.textBaseline = "top";
    const both = p.position === "both";
    const spanRows = Math.floor(rows * (both ? 0.3 : 0.45));
    let vals = new Array(cols);
    for (let i = 0; i < cols; i++) vals[i] = bandAt((i / (cols - 1)) * 0.92);
    vals = monstercatFilter(vals, 1.8 + p.smoothing * 1.4);
    const rowsList = both ? [false, true] : [p.position === "top"];
    unitArea(v);
    for (let c = 0; c < cols; c++) {
      const val = Math.min(1, vals[c]);
      const hc = val * spanRows;
      st.peaks[c] = Math.max(hc, st.peaks[c] - dt * 6 * p.speed);
      const col = colorAt(c / (cols - 1));
      const x = c * cw;
      for (const top of rowsList) {
        for (let r = 0; r < Math.ceil(hc); r++) {
          const frac = (r + 1) / Math.max(1, hc);
          // solid from the floor up; only the very top character is lighter,
          // by how far into it the bar reaches (it used to be light at the
          // bottom, which made the bars look like they were floating)
          const tip = r === Math.ceil(hc) - 1;
          const ch = tip ? ASCII_RAMP[Math.min(9, 3 + Math.floor((hc - r) * 6))] : "#";
          const y = top ? r * cell : v.huArea.floor - (r + 1) * cell;
          ctx.fillStyle = v.rgba(mix(col, WHITE, tip ? 0.45 : 0), 0.6 + 0.4 * frac);
          ctx.fillText(ch, x, y);
        }
        const pr = Math.floor(st.peaks[c]);
        if (pr > 0) {
          ctx.fillStyle = v.rgba(mix(col, WHITE, 0.6), 0.9);
          ctx.fillText("_", x, top ? pr * cell : v.huArea.floor - (pr + 1) * cell);
        }
      }
    }
  };

  // Where the lyrics column is, and where anything sitting on top of the
  // bottom of it starts (Spicy's popout song bar, a theme's player bar...),
  // so bottom-docked styles sit just above it instead of hiding behind it.
  // Cached; re-checked twice a second.
  function unitArea(v) {
    if (v.huArea && v.frame - v.huArea.f <= 30) return v.huArea;
    const w = v.w, h = v.h;
    let x0 = 0, x1 = w, floor = h;
    try {
      const lc = v.box.querySelector(".LyricsContainer");
      const br = v.box.getBoundingClientRect();
      const r = lc && lc.getBoundingClientRect();
      if (r && r.width > 100) {
        x0 = Math.max(0, (r.left - br.left) * v.scale);
        x1 = Math.min(w, (r.right - br.left) * v.scale);
      }
      const doc = v.box.ownerDocument;
      const L = r && r.width > 100 ? r.left : br.left, W = r && r.width > 100 ? r.width : br.width;
      let clear = br.bottom;
      for (const fx of [0.25, 0.5, 0.75]) {
        for (const fy of [0.985, 0.93, 0.87]) {
          const X = L + W * fx, Y = br.top + br.height * fy;
          for (let el of doc.elementsFromPoint(X, Y)) {
            if (el === v.canvas || (el.closest && el.closest(".lp-panel, .lp-button"))) continue;
            if (el.contains(v.box) || (lc && lc.contains(el))) break; // nothing covering here
            if (el.closest && el.closest(".spicy-dynamic-bg")) break;
            // climb to the whole bar (but not to something page-sized)
            while (el.parentElement && !el.parentElement.contains(v.box)) {
              const pr = el.parentElement.getBoundingClientRect();
              if (pr.height > br.height * 0.4) break;
              el = el.parentElement;
            }
            const er = el.getBoundingClientRect();
            if (er.height < br.height * 0.4 && er.top > br.top + br.height * 0.5) clear = Math.min(clear, er.top);
            break;
          }
        }
      }
      floor = Math.max(h * 0.5, Math.min(h, (clear - br.top) * v.scale));
    } catch (_) {}
    v.huArea = { f: v.frame, x0, x1, floor, covered: floor < h - 2 };
    return v.huArea;
  }
  // Panel background for the display styles (glass picks up the album colour).

  // How many "steps" a beat-stepping style has made: one per N clock beats.
  function beatSteps(st, p) {
    if (st.tickSeen === undefined) { st.tickSeen = shared.tickSerial; st.ticks = 0; st.step = st.step || 0; st.barDrop = shared.dropSerial; }
    if (p.colorMove === "still") {
      // Still colours: hold the current step; pick up from here if switched back.
      st.tickSeen = shared.tickSerial; st.ticks = 0; st.barSeen = shared.barSerial; st.barDrop = shared.dropSerial;
      return st.step;
    }
    const every = Math.max(1, Number(p.beatEvery) || 1);
    if (ana.src === "song" && ana.bars && every >= 4 && bpm.tapUri !== shared.uri) {
      // Song grid: change on the bar lines (4 = every bar, 8 = every 2nd bar).
      if (st.barSeen === undefined) st.barSeen = shared.barSerial;
      if (st.barSeen !== shared.barSerial) {
        st.barCount = (st.barCount || 0) + (shared.barSerial - st.barSeen);
        st.barSeen = shared.barSerial;
        while (st.barCount >= every / 4) { st.barCount -= every / 4; st.step++; st.stepAt = performance.now(); }
      }
      st.tickSeen = shared.tickSerial;
      st.barDrop = shared.dropSerial;
      return st.step;
    }
    st.barSeen = shared.barSerial;
    if (st.barDrop !== shared.dropSerial) {
      // A drop almost always lands on the first beat of a bar: restart the
      // count there, so "every 4 / 8 beats" changes on the bar, not mid-bar.
      st.barDrop = shared.dropSerial;
      st.tickSeen = shared.tickSerial;
      st.ticks = 0;
      st.step++;
      st.stepAt = performance.now();
    }
    if (st.tickSeen !== shared.tickSerial) {
      st.ticks += shared.tickSerial - st.tickSeen;
      st.tickSeen = shared.tickSerial;
      while (st.ticks >= every) { st.ticks -= every; st.step++; st.stepAt = performance.now(); }
    }
    return st.step;
  }

  // ---------------------------------------------------------------------------
  // Geometric Shapes: flat, hard-edged blocks like a modern poster, no glow.
  // Slanted bars slide in from both edges, each one's length driven by a part
  // of the spectrum. On every beat the colours step round one place (a snap,
  // no easing); a drop shuffles the whole arrangement. Brutalist variant:
  // plain white slabs on a heavy grid, lengths snapped to the grid, with
  // monospace LOW / MID / HIGH labels cut out of the slabs.
  function geoLayout(n, seed) {
    let s = seed || 1;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const first = rnd() < 0.5 ? -1 : 1;
    const out = [];
    for (let i = 0; i < n; i++) {
      out.push({
        side: i % 2 ? -first : first, // alternate edges so the middle stays clear
        c: (rnd() * 3) | 0,
        stripes: rnd() < 0.3,
        lift: 0.85 + rnd() * 0.3,
      });
    }
    return out;
  }
  DRAW.geometric = (v, p, dt, t) => {
    const { ctx, w, h, U } = v;
    ctx.globalCompositeOperation = "source-over"; // flat colour, overlaps stay flat
    const brut = p.variant === "brutalist";
    const n = brut ? (h < 380 * v.scale ? 5 : 7) : h < 380 * v.scale ? 4 : 6;
    const st = v.geo || (v.geo = { step: 0, beatSeen: shared.beatSerial, dropSeen: shared.dropSerial, seed: shared.seed, n: 0 });
    if (st.n !== n || st.seedFor !== shared.seed) {
      st.n = n;
      st.seedFor = shared.seed;
      st.seed = shared.seed;
      st.blocks = geoLayout(n, st.seed);
    }
    beatSteps(st, p);
    if (st.dropSeen !== shared.dropSerial) {
      st.dropSeen = shared.dropSerial;
      st.seed = (st.seed * 7 + 13) % 65521 || 1;
      st.blocks = geoLayout(n, st.seed);
    }
    const pal = [colorAt(0), colorAt(0.5), colorAt(1)];
    const top = h * 0.08, span = h * 0.84;
    const pitch = span / n;
    const bh = brut ? pitch * 0.62 : pitch + 1; // poster: bands touch, no gaps
    const slant = brut ? 0 : bh * 0.85;
    const maxLen = (brut ? w * 0.4 : w * 0.3) * p.size;
    const grid = w / 16;

    if (brut) {
      // Heavy grid behind the slabs.
      ctx.strokeStyle = v.rgba(WHITE, 0.08);
      ctx.lineWidth = Math.max(1, 2 * U);
      ctx.beginPath();
      for (let x = grid; x < w; x += grid) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let i = 0; i <= n; i++) {
        const y = top + i * pitch - (pitch - bh) / 2;
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();
    } else {
      // One big flat band crossing behind everything, edged with a thick
      // line; it hops a step per beat.
      const bandW = w * 0.2;
      const x0 = w * (0.14 + 0.17 * (st.step % 4));
      ctx.beginPath();
      ctx.moveTo(x0 + h * 0.45, 0);
      ctx.lineTo(x0 + h * 0.45 + bandW, 0);
      ctx.lineTo(x0 + bandW - h * 0.45, h);
      ctx.lineTo(x0 - h * 0.45, h);
      ctx.closePath();
      ctx.fillStyle = v.rgba(pal[(st.step + 2) % 3], 0.1);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x0 + h * 0.45 + bandW * 1.15, 0);
      ctx.lineTo(x0 + bandW * 1.15 - h * 0.45, h);
      ctx.strokeStyle = v.rgba(pal[(st.step + 1) % 3], 0.3);
      ctx.lineWidth = Math.max(3, bh * 0.16);
      ctx.stroke();
    }

    const fontPx = Math.max(7, Math.round(bh * 0.42));
    if (brut) {
      ctx.font = `700 ${fontPx}px ui-monospace, Consolas, "Courier New", monospace`;
      ctx.textBaseline = "middle";
    }
    let loudest = 0, loudVal = -1;
    const vals = [];
    for (let i = 0; i < n; i++) {
      // Each block reads its own slice of the spectrum (bass at the top).
      const a = i / n, b = (i + 1) / n;
      let sum = 0;
      for (let k = 0; k < 4; k++) sum += bandAt((a + ((b - a) * (k + 0.5)) / 4) * 0.9);
      const val = Math.min(1, (sum / 4) * st.blocks[i].lift);
      vals.push(val);
      if (val > loudVal) { loudVal = val; loudest = i; }
    }
    for (let i = 0; i < n; i++) {
      const blk = st.blocks[i];
      let len = (brut ? grid * 0.75 : w * 0.14) + vals[i] * maxLen; // poster: ultra wide
      if (!brut) len = Math.min(len, w * 0.5 - slant - w * 0.02); // each side stays in its own half
      if (brut) len = Math.max(1, Math.round(len / grid)) * grid; // snap to the grid, no easing
      const y = top + i * pitch;
      const left = blk.side < 0;
      // Parallelogram from the edge: the far end is cut on the slant.
      const shape = (yy, hh) => {
        // where the slanted cut is at this height (stripes share one cut line)
        const cut = (yv) => len + slant * (1 - (yv - y) / bh);
        ctx.beginPath();
        if (left) {
          ctx.moveTo(-slant, yy);
          ctx.lineTo(cut(yy), yy);
          ctx.lineTo(cut(yy + hh), yy + hh);
          ctx.lineTo(-slant, yy + hh);
        } else {
          ctx.moveTo(w + slant, yy);
          ctx.lineTo(w - cut(yy + hh) + slant, yy);
          ctx.lineTo(w - cut(yy) + slant, yy + hh);
          ctx.lineTo(w + slant, yy + hh);
        }
        ctx.closePath();
        ctx.fill();
      };
      if (brut) {
        // see-through (was 92% solid white, hard to read the lyrics over)
        ctx.fillStyle = v.rgba(i === loudest && loudVal > 0.35 ? pal[0] : WHITE, i === loudest && loudVal > 0.35 ? 0.42 : 0.26);
        shape(y, bh);
        // Label cut out of the slab, so it reads as dark text.
        const label = (i < n / 3 ? "LOW" : i < (2 * n) / 3 ? "MID" : "HIGH") + " " + String(i + 1).padStart(2, "0");
        const tw = ctx.measureText(label).width;
        if (len > tw + fontPx * 1.2) {
          ctx.globalCompositeOperation = "destination-out";
          ctx.fillStyle = "#000";
          ctx.textAlign = left ? "left" : "right";
          ctx.fillText(label, left ? fontPx * 0.6 : w - fontPx * 0.6, y + bh / 2);
          ctx.globalCompositeOperation = "source-over";
        }
      } else {
        const col = pal[(blk.c + st.step) % 3];
        const draw = () => {
          if (blk.stripes) {
            // Two thick parallel stripes instead of one block.
            const sh = bh * 0.42;
            shape(y, sh);
            shape(y + bh - sh, sh);
          } else shape(y, bh);
        };
        ctx.fillStyle = v.rgba(col, 0.42); // see-through, so white lyrics read over it
        draw();
      }
    }
    if (brut) ctx.textAlign = "start";
  };

  // ---------------------------------------------------------------------------
  // Bauhaus Tiles: a poster grid of flat shapes (quarter circles, half
  // circles, circles, corner triangles), see-through so the lyrics read over
  // it. Each tile's shape grows with its part of the spectrum (bass on the
  // left); on each beat-clock step about a third of the tiles turn a quarter
  // (a quick snap) and every colour steps round one place; a drop reshuffles
  // the whole grid. A few dozen flat fills per frame.
  function bauhausLayout(n, seed) {
    let s = seed || 1;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const out = [];
    for (let i = 0; i < n; i++) {
      const rot = (rnd() * 4) | 0;
      out.push({
        type: (rnd() * 4) | 0, // 0 quarter, 1 half, 2 circle, 3 triangle
        rot, ang: rot * (Math.PI / 2),
        c: (rnd() * 3) | 0,
        bg: rnd() < 0.4 ? (rnd() * 3) | 0 : -1, // some tiles get a faint flat background
        turn: rnd(),
      });
    }
    return out;
  }
  DRAW.bauhaus = (v, p, dt, t) => {
    const { ctx, w, h } = v;
    ctx.globalCompositeOperation = "source-over";
    const rowsN = h < 380 * v.scale ? 3 : 4;
    const tile = Math.max(8, (h / rowsN) / Math.max(0.6, Math.min(1.6, p.size)));
    const rows = Math.ceil(h / tile), cols = Math.ceil(w / tile);
    const x0 = (w - cols * tile) / 2, y0 = (h - rows * tile) / 2;
    const n = rows * cols;
    const st = v.bh || (v.bh = { step: 0, dropSeen: shared.dropSerial, n: 0, seedFor: -1 });
    if (st.n !== n || st.seedFor !== shared.seed) {
      st.n = n;
      st.seedFor = shared.seed;
      st.seed = shared.seed || 1;
      st.tiles = bauhausLayout(n, st.seed);
    }
    if (st.dropSeen !== shared.dropSerial) {
      st.dropSeen = shared.dropSerial;
      st.seed = (st.seed * 7 + 13) % 65521 || 1;
      st.tiles = bauhausLayout(n, st.seed);
    }
    const before = st.step;
    beatSteps(st, p);
    if (st.step !== before) {
      // A different third of the tiles turns on each step.
      for (let i = 0; i < n; i++) {
        const tl = st.tiles[i];
        if ((tl.turn + st.step * 0.618) % 1 < 0.34) tl.rot++;
      }
    }
    const pal = [colorAt(0), colorAt(0.5), colorAt(1)];
    const k = Math.min(1, shared.kick);
    const ease = Math.min(1, dt * 16);
    const half = tile / 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const tl = st.tiles[i];
        tl.ang += (tl.rot * (Math.PI / 2) - tl.ang) * ease;
        // Its slice of the spectrum: bass on the left, a little offset per row.
        const pos = Math.min(0.92, (c / Math.max(1, cols - 1)) * 0.85 + r * 0.02);
        const val = Math.min(1, (bandAt(pos) + bandAt(Math.min(0.95, pos + 0.03))) * 0.6);
        const sc = Math.min(1, 0.35 + 0.65 * val + 0.06 * k);
        const cx = x0 + c * tile + half, cy = y0 + r * tile + half;
        if (tl.bg >= 0) {
          ctx.fillStyle = v.rgba(pal[(tl.bg + st.step + 1) % 3], 0.12);
          ctx.fillRect(cx - half, cy - half, tile + 0.5, tile + 0.5);
        }
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(tl.ang);
        ctx.beginPath();
        if (tl.type === 0) {
          ctx.moveTo(-half, -half);
          ctx.arc(-half, -half, tile * sc, 0, Math.PI / 2);
        } else if (tl.type === 1) {
          ctx.moveTo(-half * sc, half);
          ctx.arc(0, half, half * sc, Math.PI, Math.PI * 2);
        } else if (tl.type === 2) {
          ctx.arc(0, 0, half * 0.9 * sc, 0, Math.PI * 2);
        } else {
          ctx.moveTo(-half, half);
          ctx.lineTo(-half + tile * sc, half);
          ctx.lineTo(-half, half - tile * sc);
        }
        ctx.closePath();
        ctx.fillStyle = v.rgba(pal[(tl.c + st.step) % 3], 0.42);
        ctx.fill();
        ctx.restore();
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Speaker cone physics shared by Subwoofer and Speaker Grille: a cone on a
  // spring. Kicks knock it outwards, the bass holds it out, it springs back
  // with a little overshoot; a drop gives one huge push. st.x is how far out
  // it is (0 = rest, about 1 = a big kick).
  function speakerMove(st, dt, strict) {
    if (st.kickSeen !== shared.beatSerial) {
      st.kickSeen = shared.beatSerial;
      // strict (Speaker Grille): only a hit with real bass behind it counts,
      // so hi-hats and snares that trip the kick detector don't move it.
      const real = !strict || (shared.bassPunch || 0) > 0.32;
      if (real) st.vel += strict ? 10 * Math.min(1.2, shared.kick) : 9 * Math.min(1.2, shared.kick + 0.3);
      st.realKick = real;
    } else st.realKick = false;
    if (st.dropSeen !== shared.dropSerial) {
      st.dropSeen = shared.dropSerial;
      st.vel += 24;
      st.shock = 1;
    }
    const target = 0.35 * (shared.bassPunch || 0);
    const n = Math.max(1, Math.ceil(dt / 0.008));
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      const acc = (target - st.x) * 160 - st.vel * 14;
      st.vel += acc * h;
      st.x += st.vel * h;
    }
    st.x = Math.max(-0.6, Math.min(1.8, st.x));
    st.shock = (st.shock || 0) * Math.exp(-dt * 1.6);
  }

  // Subwoofer: a big speaker drawn in light (outlines and sheen, so it sits
  // over the background like the other styles). Kicks punch the cone out and
  // it springs back, the rubber surround wobbles with the bass, a ring of
  // light round it changes colour on the beat, a drop gives one huge push
  // plus a shockwave. On the album art, the art is the middle of the cone.
  DRAW.sub = (v, p, dt, t) => {
    const { ctx, w, h, U } = v;
    const st = v.sub || (v.sub = { x: 0, vel: 0, kickSeen: shared.beatSerial, dropSeen: shared.dropSerial, shock: 0 });
    speakerMove(st, dt);
    const step = beatSteps(st, p);
    const e = shared.energy, k = Math.min(1, shared.kick), bass = shared.bassPunch || 0, x = st.x;
    const spot = circleSpot(v, p, 0.3);
    const cx = spot.x, cy = spot.y;
    const R = spot.art ? Math.min(spot.r * 2.1 * p.size, Math.min(w, h) * 0.46) : Math.min(w, h) * 0.34 * p.size;
    const capR = spot.art ? spot.r : R * 0.3;
    const pal = [colorAt(0), colorAt(0.5), colorAt(1)];
    const cA = pal[step % 3], cB = pal[(step + 1) % 3], cC = pal[(step + 2) % 3];
    const pop = 1 + 0.06 * x; // the cone comes forward
    v.soft(cx, cy, R * 1.7, cA, 0.08 + 0.16 * e + 0.22 * Math.max(0, x));
    // Cone sheen: light catches the cone as it pushes out.
    const g = ctx.createRadialGradient(cx - R * 0.15, cy - R * 0.2, capR, cx, cy, R * 0.9 * pop);
    g.addColorStop(0, v.rgba(mix(cA, WHITE, 0.3), 0.04 + 0.1 * Math.max(0, x)));
    g.addColorStop(1, v.rgba(cA, 0.02));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.88 * pop, 0, Math.PI * 2);
    ctx.arc(cx, cy, capR, 0, Math.PI * 2, true);
    ctx.fill();
    // Cone ridges: inner rings move further than outer ones (depth).
    ctx.lineWidth = Math.max(1, 1.2 * U);
    for (let i = 1; i <= 5; i++) {
      const r0 = capR + ((R * 0.86 - capR) * i) / 6;
      const rr = r0 * (1 + x * (1 - r0 / R) * 0.5);
      ctx.strokeStyle = v.rgba(mix(cB, WHITE, 0.2), 0.12 + 0.05 * i * (0.5 + e));
      ctx.beginPath();
      ctx.arc(cx, cy, rr, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Rubber surround: a rolled ring that wobbles with the bass.
    const sr = R * 0.94 * pop;
    ctx.beginPath();
    for (let i = 0; i <= 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      const rr = sr + Math.sin(a * 5 + t * 17) * bass * 2.5 * U + Math.sin(a * 3 - t * 11) * k * 2 * U;
      const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.strokeStyle = v.rgba(cB, 0.25 + 0.3 * e);
    ctx.lineWidth = R * 0.09;
    ctx.stroke();
    ctx.strokeStyle = v.rgba(mix(cB, WHITE, 0.5), 0.5);
    ctx.lineWidth = Math.max(1, 1.5 * U);
    ctx.stroke();
    // Highlight on the top-left of the surround.
    ctx.beginPath();
    ctx.arc(cx, cy, sr - R * 0.02, Math.PI * 1.05, Math.PI * 1.45);
    ctx.strokeStyle = v.rgba(WHITE, 0.25 + 0.2 * Math.max(0, x));
    ctx.lineWidth = Math.max(1.5, R * 0.025);
    ctx.lineCap = "round";
    ctx.stroke();
    // Dust cap (or a ring round the album art).
    if (spot.art) {
      ctx.beginPath();
      ctx.arc(cx, cy, capR * (1.02 + 0.03 * x), 0, Math.PI * 2);
      ctx.strokeStyle = v.rgba(mix(cA, WHITE, 0.4), 0.6);
      ctx.lineWidth = Math.max(1.5, 2.5 * U);
      ctx.stroke();
    } else {
      const cr = capR * (1 + 0.22 * x);
      const cg = ctx.createRadialGradient(cx - cr * 0.35, cy - cr * 0.4, cr * 0.05, cx, cy, cr);
      cg.addColorStop(0, v.rgba(mix(cA, WHITE, 0.6), 0.55));
      cg.addColorStop(1, v.rgba(cA, 0.12));
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fill();
    }
    // Frame ring with bolts.
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.06, 0, Math.PI * 2);
    ctx.strokeStyle = v.rgba(mix(cC, WHITE, 0.5), 0.3);
    ctx.lineWidth = Math.max(1, 2.5 * U);
    ctx.stroke();
    ctx.fillStyle = v.rgba(mix(cC, WHITE, 0.6), 0.55);
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      const bx = cx + Math.cos(a) * R * 1.13, by = cy + Math.sin(a) * R * 1.13;
      ctx.moveTo(bx + 2.4 * U, by);
      ctx.arc(bx, by, 2.4 * U, 0, Math.PI * 2);
    }
    ctx.fill();
    // Light ring: changes colour on the beat, brightens with the music.
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.22, 0, Math.PI * 2);
    ctx.strokeStyle = v.rgba(cA, 0.1 + 0.15 * e);
    ctx.lineWidth = 12 * U;
    ctx.stroke();
    ctx.strokeStyle = v.rgba(mix(cA, WHITE, 0.3), 0.35 + 0.5 * e);
    ctx.lineWidth = Math.max(1.5, 2.5 * U);
    ctx.stroke();
    // Drop: a shockwave ring rolling out.
    if (st.shock > 0.03) {
      ctx.beginPath();
      ctx.arc(cx, cy, R * (1.25 + (1 - st.shock) * 2.5), 0, Math.PI * 2);
      ctx.strokeStyle = v.rgba(mix(cA, WHITE, 0.4), 0.6 * st.shock);
      ctx.lineWidth = (3 + 10 * st.shock) * U;
      ctx.stroke();
    }
  };

  // Seeded random numbers (same layout every time for the same seed).
  const rngFrom = (seed) => {
    let s = seed % 2147483646 || 1;
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
  };

  // ---------------------------------------------------------------------------
  // Trap Circle: the classic trap-channel circle, with nothing in the middle.
  // The spectrum is wrapped round a circle, mirrored left / right, the bass
  // starting at the bottom and the treble meeting at the top. Eight solid
  // layers: white in front, then yellow, red, pink, dark blue, blue, light
  // blue and green behind it ("Classic" colours; album colours replace the
  // seven behind). Each layer further back is the spectrum from a few frames
  // earlier, pushed out a little further, so on every hit the colours burst
  // out from behind the white edge and trail after it. The circle bounces
  // with the bass, the view shakes, and white dust flies out towards you,
  // faster on the bass.
  // Shape: quiet parts are squashed down (power curve), each point snaps up
  // and falls back smoothly, and the outline is smoothed twice so it's made
  // of rounded bumps, not spikes.
  const TRAP_N = 48; // points per side
  const TRAP_LAYERS = [[255, 255, 0], [255, 0, 0], [255, 102, 255], [51, 51, 153], [0, 0, 255], [51, 204, 255], [0, 255, 0]];
  DRAW.trap = (v, p, dt, t) => {
    const { ctx, w, h, U } = v;
    const N = TRAP_N, HIST = 24, L = 8;
    let st = v.trap;
    if (!st) st = v.trap = { val: new Float32Array(N), hist: Array.from({ length: HIST }, () => new Float32Array(N)), hi: 0, dust: [], bounce: 0, histT: 0 };
    const k = Math.min(1, shared.kick), bass = shared.bassPunch || 0;
    // 1. Spectrum -> N points (more points for the bass).
    // Rises quickly (not instantly) and falls back smoothly, so it moves
    // with the music without jittering.
    const fall = 1.2 + 3 * (1 - p.smoothing);
    for (let i = 0; i < N; i++) {
      const x = bandAt(Math.pow(i / (N - 1), 1.6) * 0.72);
      st.val[i] = x > st.val[i] ? st.val[i] + (x - st.val[i]) * Math.min(1, dt * 22) : Math.max(x, st.val[i] - dt * fall * (0.15 + st.val[i]));
    }
    let a = Float32Array.from(st.val), b = new Float32Array(N);
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < N; i++) {
        let s = 0, wsum = 0;
        for (let d = -3; d <= 3; d++) {
          const j = Math.max(0, Math.min(N - 1, i + d)), wt = 4 - Math.abs(d);
          s += a[j] * wt;
          wsum += wt;
        }
        b[i] = s / wsum;
      }
      [a, b] = [b, a];
    }
    // Only what stands out shows: take away most of the ring's average
    // level (on loud songs every band is high, which made one fat blob),
    // then curve it so small differences stay small. Then scale by a slowly
    // moving peak, so loud and quiet songs both end up a similar size.
    let mean = 0;
    for (let i = 0; i < N; i++) mean += a[i];
    mean /= N;
    let top = 0;
    for (let i = 0; i < N; i++) {
      const x = Math.max(0, a[i] - 0.5 * mean) / Math.max(0.3, 1 - 0.5 * mean);
      a[i] = Math.pow(x, 1.35);
      if (a[i] > top) top = a[i];
    }
    st.peak = Math.max(top, (st.peak || 0.5) - dt * 0.15);
    const norm = 0.85 / Math.max(0.25, st.peak);
    for (let i = 0; i < N; i++) a[i] = Math.min(1, a[i] * norm);
    // keep a history at a steady rate (~60 per second), for the layer delays
    st.histT += dt;
    while (st.histT >= 1 / 60) {
      st.histT -= 1 / 60;
      st.hi = (st.hi + 1) % HIST;
      st.hist[st.hi].set(a);
    }
    const frame = (back) => st.hist[(st.hi - back + HIST * 4) % HIST];

    const spot = circleSpot(v, p, 0.17);
    const cx = spot.x, cy = spot.y;
    st.bounce += ((0.05 * bass + 0.03 * k) - st.bounce) * Math.min(1, dt * 14);
    const R0 = spot.r * (1 + st.bounce);
    const maxLen = spot.r * 0.42 * p.size;
    const classic = p.colorMode === "classic";

    // 2. Dust flying out towards you (3D: starts small near the middle,
    // speeds up and grows as it comes closer).
    const want = Math.round(140 * p.particles);
    while (st.dust.length < want) st.dust.push({ a: Math.random() * Math.PI * 2, z: 0.2 + Math.random() * 0.8, s: 0.5 + Math.random() });
    if (st.dust.length > want) st.dust.length = want;
    const zsp = (0.05 + 0.9 * bass + 0.4 * k) * p.speed;
    const far = Math.hypot(w, h) * 0.55;
    ctx.fillStyle = v.rgba(WHITE, 0.6);
    ctx.beginPath();
    for (const d of st.dust) {
      d.z -= dt * zsp * d.z * 1.5 + dt * 0.02;
      const r = (R0 * 0.9) / Math.max(0.05, d.z);
      if (d.z <= 0.05 || r > far) {
        d.z = 0.8 + Math.random() * 0.2;
        d.a = Math.random() * Math.PI * 2;
        continue;
      }
      const sz = d.s * U * (0.4 + 0.5 / d.z);
      const x = cx + Math.cos(d.a) * r, y = cy + Math.sin(d.a) * r;
      ctx.moveTo(x + sz, y);
      ctx.arc(x, y, sz, 0, Math.PI * 2);
    }
    ctx.fill();

    // 3. The layers, back to front, as solid shapes round an empty middle.
    ctx.globalCompositeOperation = "source-over";
    const ang = (i, side) => Math.PI / 2 - side * (i / (N - 1)) * Math.PI; // bottom -> top
    for (let layer = L - 1; layer >= 0; layer--) {
      const vals = frame(layer * 2);
      const push = 1 + layer * 0.035; // further back = a touch further out
      const pts = [];
      for (const side of [1, -1]) {
        for (let n = 0; n < N; n++) {
          const i = side === 1 ? n : N - 1 - n;
          if (side === -1 && (i === 0 || i === N - 1)) continue;
          const r = R0 + 2 * U * (1 + layer * 0.5) + vals[i] * maxLen * push;
          const an = ang(i, side);
          pts.push(cx + Math.cos(an) * r, cy + Math.sin(an) * r);
        }
      }
      const M = pts.length / 2;
      ctx.beginPath();
      ctx.moveTo((pts[(M - 1) * 2] + pts[0]) / 2, (pts[(M - 1) * 2 + 1] + pts[1]) / 2);
      for (let j = 0; j < M; j++) {
        const x = pts[j * 2], y = pts[j * 2 + 1];
        const nx = pts[((j + 1) % M) * 2], ny = pts[((j + 1) % M) * 2 + 1];
        ctx.quadraticCurveTo(x, y, (x + nx) / 2, (y + ny) / 2);
      }
      ctx.closePath();
      ctx.moveTo(cx + R0, cy);
      ctx.arc(cx, cy, R0, 0, Math.PI * 2, true);
      const col = layer === 0 ? WHITE : classic ? TRAP_LAYERS[layer - 1] : colorAt((layer - 1) / (L - 2));
      ctx.fillStyle = v.rgba(col, layer === 0 ? 0.9 : 0.85);
      ctx.fill("evenodd");
    }
    ctx.globalCompositeOperation = "lighter";
  };

  // ---------------------------------------------------------------------------
  // Retro Bars: the classic old media-player spectrum. Segmented bars where
  // the colour belongs to the height, not the bar: blue / green at the
  // bottom, yellow in the middle, orange / red at the top. Peak caps hang for
  // a moment, then drop. No panel or box behind it. One fill per segment row.
  DRAW.retro = (v, p, dt, t) => {
    const { ctx, w, h, U } = v;
    ctx.globalCompositeOperation = "source-over";
    const st = v.retro || (v.retro = { peaks: [], hold: [] });
    const step = 0, classic = CP.colorMode === "classic"; // no beat-based colour changes
    const floor = unitArea(v).floor - 6 * U;
    const n = Math.max(10, Math.round(p.barCount / 2));
    const x0 = w * 0.04, x1 = w * 0.96;
    const gap = (x1 - x0) / n, bw = gap * 0.74;
    const segH = Math.max(2, 4.2 * U * p.size), segGap = Math.max(1, 1.4 * U);
    const pitch = segH + segGap;
    const maxSegs = Math.max(8, Math.floor((floor * 0.5) / pitch));
    if (st.peaks.length !== n) {
      st.peaks = new Array(n).fill(0);
      st.hold = new Array(n).fill(0);
    }
    const rows = Array.from({ length: maxSegs }, () => []);
    const xs = new Array(n);
    for (let i = 0; i < n; i++) {
      const x = x0 + i * gap + (gap - bw) / 2;
      xs[i] = x;
      const val = Math.min(1, bandAt(Math.pow(i / (n - 1), 1.15) * 0.92));
      const segs = Math.round(val * maxSegs);
      for (let s = 0; s < segs; s++) rows[s].push(x);
      if (segs >= st.peaks[i]) {
        st.peaks[i] = segs;
        st.hold[i] = 0.35;
      } else if (st.hold[i] > 0) st.hold[i] -= dt;
      else st.peaks[i] = Math.max(segs, st.peaks[i] - dt * 16 * p.speed);
    }
    for (let s = 0; s < maxSegs; s++) {
      const arr = rows[s];
      if (!arr.length) continue;
      const y = floor - (s + 1) * pitch + segGap;
      ctx.fillStyle = v.rgba(colorAt(classic ? s / (maxSegs - 1) : cyc(s / (maxSegs - 1) + step * 0.3)), 0.88);
      ctx.beginPath();
      for (const x of arr) ctx.rect(x, y, bw, segH);
      ctx.fill();
    }
    // Peak caps: one colour.
    ctx.fillStyle = v.rgba(mix(colorAt(cyc(1 + step * 0.25)), WHITE, 0.45), 0.9);
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const pk = Math.round(st.peaks[i]);
      if (pk < 1) continue;
      ctx.rect(xs[i], floor - (pk + 1) * pitch + segGap, bw, Math.max(1.5, segH * 0.6));
    }
    ctx.fill();
  };

  // ---------------------------------------------------------------------------
  // Neuro Mesh (drum & bass): a wireframe landscape rolling towards you.
  // The spectrum is fed in at the front (bass in the middle) and scrolls
  // back, faster when it's loud. The whole mesh twists along its length,
  // wobbling at a rate set by the bass, like a reese bass; every snare
  // glitches it (rows jump sideways, a cyan / magenta split); drops light it
  // up and give it a big twist. ~750 points, a few batched strokes.
  // Ridges look: flat stacked lines, the classic pulsar-plot look. Each line
  // is a spectrum frame (newest at the bottom, drifting up), flat at the
  // edges and rising into peaks in the middle; each line hides the ones
  // behind it. Rough (default): a little jagged, like a real plot. Smooth:
  // rounded curves, no jitter.
  function drawRidges(v, p, dt) {
    const { ctx, w, h, U } = v;
    const R = 44, C = 72, smooth = p.neuroLine === "smooth";
    let st = v.ridges;
    if (!st || st.smooth !== smooth) {
      st = v.ridges = { rows: [], acc: 0, flash: 0, glitch: 0, smooth, dropSeen: shared.dropSerial, snareSeen: shared.snareSerial, shift: new Float32Array(R) };
      for (let r = 0; r < R; r++) st.rows.push({ v: new Float32Array(C), n: new Float32Array(C) });
    }
    const e = shared.energy;
    if (st.dropSeen !== shared.dropSerial) { st.dropSeen = shared.dropSerial; st.flash = 1; }
    if (st.snareSeen !== shared.snareSerial) {
      st.snareSeen = shared.snareSerial;
      st.glitch = 1;
      for (let r = 0; r < R; r++) st.shift[r] = Math.random() < 0.15 ? (Math.random() - 0.5) * 0.04 : 0;
    }
    st.flash *= Math.exp(-dt * 1.5);
    st.glitch *= Math.exp(-dt * 10);
    st.acc += dt * (5 + 9 * e) * p.speed;
    while (st.acc >= 1) {
      st.acc -= 1;
      const row = st.rows.pop();
      for (let c = 0; c < C; c++) {
        const x = c / (C - 1), dx = Math.abs(x * 2 - 1);
        // flat sides, a bumpy middle
        const env = Math.pow(Math.max(0, 1 - Math.pow(dx / 0.62, 2)), 2);
        const q = p.neuroMirror === "on" ? dx : x;
        row.v[c] = Math.min(1.3, bandAt(q * 0.85)) * env;
        row.n[c] = smooth ? 0 : (Math.random() - 0.5) * (0.02 + 0.22 * row.v[c]) + (Math.random() - 0.5) * 0.015;
      }
      if (smooth) {
        for (let pass = 0; pass < 2; pass++) {
          const a = Float32Array.from(row.v);
          for (let c = 1; c < C - 1; c++) row.v[c] = (a[c - 1] + 2 * a[c] + a[c + 1]) / 4;
        }
      }
      st.rows.unshift(row);
    }
    const W = Math.min(w * 0.55, h * 1.05) * p.size, H = h * 0.66;
    const x0 = (w - W) / 2, bottom = h * 0.5 + H / 2;
    const sp = H / R, A = sp * 10 * p.size;
    const classic = CP.colorMode === "classic";
    const step = beatSteps(st, p);
    ctx.lineWidth = Math.max(1, 1.3 * U);
    ctx.lineJoin = "round";
    for (let r = R - 1; r >= 0; r--) {
      const base = bottom - (r + st.acc) * sp;
      const row = st.rows[r];
      const sh = st.glitch > 0.1 ? st.shift[r] * st.glitch * W : 0;
      const pts = new Float32Array(C * 2);
      for (let c = 0; c < C; c++) {
        pts[c * 2] = x0 + (c / (C - 1)) * W + sh;
        pts[c * 2 + 1] = base - (row.v[c] + row.n[c]) * A;
      }
      const path = () => {
        ctx.beginPath();
        ctx.moveTo(pts[0], pts[1]);
        if (smooth) {
          for (let c = 1; c < C - 1; c++) ctx.quadraticCurveTo(pts[c * 2], pts[c * 2 + 1], (pts[c * 2] + pts[c * 2 + 2]) / 2, (pts[c * 2 + 1] + pts[c * 2 + 3]) / 2);
          ctx.lineTo(pts[(C - 1) * 2], pts[(C - 1) * 2 + 1]);
        } else for (let c = 1; c < C; c++) ctx.lineTo(pts[c * 2], pts[c * 2 + 1]);
      };
      // hide what's behind this line
      path();
      ctx.lineTo(pts[(C - 1) * 2], base + sp * 2);
      ctx.lineTo(pts[0], base + sp * 2);
      ctx.closePath();
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "#000";
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
      path();
      const age = (r + st.acc) / R;
      const fade = Math.min(1, (1 - age) * 6, (r + st.acc) * 1.5); // fade in at the bottom, out at the top
      const col = classic ? WHITE : colorAt(((age + step / 3) % 1));
      ctx.strokeStyle = v.rgba(mix(col, WHITE, 0.6 * st.flash), Math.max(0, fade) * Math.min(1, 0.62 + 0.35 * st.flash));
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "lighter";
  }
  DRAW.neuro = (v, p, dt, t) => {
    if (p.neuroLook === "ridges") return drawRidges(v, p, dt);
    const { ctx, w, h, U } = v;
    const lines = p.neuroLook === "lines";
    const COLS = lines ? 64 : 34, ROWS = lines ? 26 : 22;
    let st = v.neuro;
    if (!st || st.rows.length !== ROWS || st.rows[0].length !== COLS) {
      st = v.neuro = { rows: Array.from({ length: ROWS }, () => new Float32Array(COLS)), acc: 0, phase: 0, glitch: 0, flash: 0, snareSeen: shared.snareSerial, dropSeen: shared.dropSerial, shift: new Float32Array(ROWS) };
    }
    const e = shared.energy, k = Math.min(1, shared.kick), bass = shared.bassPunch || 0;
    const step = beatSteps(st, p);
    if (st.snareSeen !== shared.snareSerial) {
      st.snareSeen = shared.snareSerial;
      st.glitch = 1;
      for (let r = 0; r < ROWS; r++) st.shift[r] = Math.random() < 0.3 ? (Math.random() - 0.5) * 0.12 : 0;
    }
    if (st.dropSeen !== shared.dropSerial) {
      st.dropSeen = shared.dropSerial;
      st.flash = 1;
    }
    st.glitch *= Math.exp(-dt * 10);
    st.flash *= Math.exp(-dt * 1.5);
    // Feed rows in at the front.
    st.acc += dt * (8 + 22 * e) * p.speed;
    while (st.acc >= 1) {
      st.acc -= 1;
      const r = st.rows.pop();
      // One-sided by default: bass on the left, treble on the right.
      // "Mirror: On" puts the bass in the middle, mirrored both ways.
      const mirror = p.neuroMirror === "on";
      for (let c = 0; c < COLS; c++) {
        const q = mirror ? Math.abs((c / (COLS - 1)) * 2 - 1) : c / (COLS - 1);
        r[c] = Math.min(1.2, bandAt(q * 0.85));
      }
      st.rows.unshift(r);
    }
    st.phase += dt * (1.5 + 9 * bass + 4 * st.flash) * p.speed;
    // Twist (Look tab): off by default; Low / High roll it along its length.
    const twist = (typeof p.neuroTwist === "number" ? p.neuroTwist : { low: 0.3, high: 1 }[p.neuroTwist] || 0) * (0.12 + 0.75 * bass + 0.8 * st.flash);
    const cx = w / 2, hor = h * 0.36, camH = 0.45;
    const P = new Float32Array(ROWS * COLS * 2);
    for (let r = 0; r < ROWS; r++) {
      const z = (r + st.acc) / ROWS; // 0 front .. 1 back
      const d = 0.6 + z * 3.2;
      const roll = twist * Math.sin(st.phase - z * 4);
      const cr = Math.cos(roll), sr = Math.sin(roll);
      const sh = st.glitch > 0.1 ? st.shift[r] * st.glitch : 0;
      const row = st.rows[r];
      for (let c = 0; c < COLS; c++) {
        const x = (c / (COLS - 1)) * 2 - 1 + sh;
        const y = row[c] * 0.3 * p.size;
        const yy = y - 0.1;
        const rx = x * cr - yy * sr, ry = 0.1 + x * sr + yy * cr;
        const o = (r * COLS + c) * 2;
        P[o] = cx + (rx * w * 0.55) / d;
        P[o + 1] = hor + ((camH - ry) * h * 0.75) / d;
      }
    }
    const pal = (q) => colorAt((q + step / 3) % 1);
    const boost = 1 + 0.8 * st.flash;
    const drawMesh = (dx, tint, am) => {
      // depth groups: front rows brightest
      for (let g = 0; g < 4; g++) {
        const r0 = Math.floor((g * ROWS) / 4), r1 = Math.floor(((g + 1) * ROWS) / 4);
        ctx.beginPath();
        for (let r = r0; r < r1; r++) {
          for (let c = 0; c < COLS; c++) {
            const o = (r * COLS + c) * 2;
            c ? ctx.lineTo(P[o] + dx, P[o + 1]) : ctx.moveTo(P[o] + dx, P[o + 1]);
          }
        }
        for (let c = 0; c < COLS; c += 2) {
          for (let r = r0; r <= Math.min(ROWS - 1, r1); r++) {
            const o = (r * COLS + c) * 2;
            r === r0 ? ctx.moveTo(P[o] + dx, P[o + 1]) : ctx.lineTo(P[o] + dx, P[o + 1]);
          }
        }
        const col = tint || mix(pal(g / 4), WHITE, g === 0 ? 0.25 : 0);
        ctx.strokeStyle = v.rgba(col, (0.75 - g * 0.17) * (0.55 + 0.45 * e) * boost * am);
        ctx.lineWidth = Math.max(1, (1.6 - g * 0.25) * U);
        ctx.stroke();
      }
    };
    v.soft(cx, hor + h * 0.3, Math.max(w, h) * 0.45, pal(0), 0.08 + 0.15 * bass + 0.3 * st.flash);
    if (lines) {
      // Lines look: stacked wave lines only, back to front, each one hiding
      // the lines behind it (the classic stacked-waves cover look).
      for (let r = ROWS - 1; r >= 0; r--) {
        const z = (r + st.acc) / ROWS;
        ctx.beginPath();
        for (let c = 0; c < COLS; c++) {
          const o = (r * COLS + c) * 2;
          c ? ctx.lineTo(P[o], P[o + 1]) : ctx.moveTo(P[o], P[o + 1]);
        }
        const o0 = r * COLS * 2, o1 = (r * COLS + COLS - 1) * 2;
        ctx.save();
        ctx.lineTo(P[o1], h);
        ctx.lineTo(P[o0], h);
        ctx.closePath();
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = "#000";
        ctx.fill();
        ctx.restore();
        ctx.beginPath();
        for (let c = 0; c < COLS; c++) {
          const o = (r * COLS + c) * 2;
          c ? ctx.lineTo(P[o], P[o + 1]) : ctx.moveTo(P[o], P[o + 1]);
        }
        ctx.strokeStyle = v.rgba(mix(pal(z), WHITE, 0.55 - 0.4 * z), (0.95 - 0.7 * z) * (0.6 + 0.4 * e) * boost);
        ctx.lineWidth = Math.max(1, (1.8 - z) * U);
        ctx.stroke();
      }
      return;
    }
    drawMesh(0, null, 1);
    if (st.glitch > 0.15) {
      drawMesh(-6 * U * st.glitch, [40, 230, 255], 0.6 * st.glitch);
      drawMesh(6 * U * st.glitch, [255, 50, 200], 0.6 * st.glitch);
    }
    // Front edge: the newest spectrum line, brightest.
    ctx.beginPath();
    for (let c = 0; c < COLS; c++) {
      const o = c * 2;
      c ? ctx.lineTo(P[o], P[o + 1]) : ctx.moveTo(P[o], P[o + 1]);
    }
    ctx.strokeStyle = v.rgba(mix(pal(0), WHITE, 0.5), 0.6 + 0.4 * k);
    ctx.lineWidth = Math.max(1.5, 2.6 * U);
    ctx.stroke();
  };

  // ---------------------------------------------------------------------------
  // Ink in Water: a cheap fake of ink clouds, no real fluid maths. A small
  // canvas (160 wide) keeps last frame's ink, smeared a touch outwards and
  // faded a little each frame (two quick image copies), and a few dozen ink
  // blobs drift through a made-up swirling current, leaving soft trails.
  // Kicks drop a cluster of blobs in from the top (they sink and spread),
  // the bass makes the current swirl harder, snares flick a small splash,
  // drops burst ink out of the middle, colours step on the beat.
  DRAW.ink = (v, p, dt, t) => {
    const { ctx, w, h } = v;
    const W = 160, H = Math.max(40, Math.min(160, Math.round((160 * h) / Math.max(1, w))));
    let st = v.ink;
    if (!st || st.H !== H) {
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      st = v.ink = { c, g: c.getContext("2d"), H, blobs: [], kickSeen: shared.beatSerial, snareSeen: shared.snareSerial, dropSeen: shared.dropSerial, ft: Math.random() * 50 };
    }
    const g = st.g;
    const e = shared.energy, k = Math.min(1, shared.kick), bass = shared.bassPunch || 0;
    const step = beatSteps(st, p);
    const sp = p.speed;
    const ink = (q) => colorAt((q + step / 3) % 1);
    const add = (x, y, vx, vy, n, col, size) => {
      for (let i = 0; i < n && st.blobs.length < 70; i++)
        st.blobs.push({ x: x + (Math.random() - 0.5) * 6, y: y + (Math.random() - 0.5) * 6, vx: vx + (Math.random() - 0.5) * 20, vy: vy + (Math.random() - 0.5) * 20, life: 1, r: size * (0.6 + Math.random() * 0.8), c: col });
    };
    if (st.kickSeen !== shared.beatSerial) {
      st.kickSeen = shared.beatSerial;
      if (bass > 0.2 || !isLive()) add(W * (0.12 + Math.random() * 0.76), -2, 0, (40 + 60 * k) * sp, 5, ink(Math.random() * 0.3), 5 + 4 * k);
    }
    if (st.snareSeen !== shared.snareSerial) {
      st.snareSeen = shared.snareSerial;
      add(W * Math.random(), H * (0.2 + Math.random() * 0.6), (Math.random() - 0.5) * 80 * sp, 0, 2, mix(ink(0.6), WHITE, 0.3), 3);
    }
    if (st.dropSeen !== shared.dropSerial) {
      st.dropSeen = shared.dropSerial;
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        add(W / 2, H / 2, Math.cos(a) * 90 * sp, Math.sin(a) * 90 * sp, 1, ink(i / 10), 9);
      }
    }
    // 1. Old ink: smear outwards a touch, then fade.
    g.globalCompositeOperation = "copy"; // replace, don't stack (stacking turned it white)
    g.globalAlpha = 1;
    g.drawImage(st.c, -0.6, -0.4, W + 1.2, H + 0.8);
    g.globalCompositeOperation = "destination-out";
    g.fillStyle = `rgba(0,0,0,${Math.min(0.5, dt * 0.7)})`;
    g.fillRect(0, 0, W, H);
    // 2. Blobs drifting through a made-up swirling current.
    st.ft += dt * (0.2 + 0.6 * bass) * sp;
    const swirl = (14 + 70 * bass) * sp, T = st.ft;
    g.globalCompositeOperation = "source-over"; // ink tints, never piles up to white
    for (let i = st.blobs.length - 1; i >= 0; i--) {
      const b = st.blobs[i];
      const nx = b.x / W * 6, ny = b.y / H * 4;
      const fx = Math.sin(ny * 1.7 + T * 1.3) + 0.6 * Math.sin(nx * 0.9 - ny * 1.1 + T);
      const fy = Math.cos(nx * 1.4 - T * 1.1) + 0.5 * Math.cos(ny * 2.1 + T * 0.7);
      b.vx += (fx * swirl - b.vx) * Math.min(1, dt * 0.9);
      b.vy += (fy * swirl * 0.7 + 12 - b.vy) * Math.min(1, dt * 0.9); // ink sinks a little
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.r += dt * 3; // spreads out
      b.life -= dt * 0.22;
      if (b.life <= 0 || b.x < -20 || b.x > W + 20 || b.y > H + 20) { st.blobs.splice(i, 1); continue; }
      g.globalAlpha = 0.1 * b.life;
      g.drawImage(softSprite(b.c), b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
    }
    g.globalAlpha = 1;
    g.globalCompositeOperation = "source-over";
    // 3. Up to full size, smooth, kept below white so lyrics read.
    ctx.globalCompositeOperation = "source-over";
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "medium";
    ctx.globalAlpha = A_(0.85, v);
    ctx.drawImage(st.c, 0, 0, w, h);
    ctx.globalAlpha = 1;
  };

  // ---------------------------------------------------------------------------
  // LED Wall: everything shown on a panel of round LEDs, with the unlit ones
  // faintly visible. Cheap: the picture is worked out at one pixel per LED
  // (a few thousand pixels), scaled up, cut into dots by a pre-drawn mask,
  // then a soft copy on top gives the bloom.
  // Two styles share it: LED Wall (bars with falling peak dots) and LED
  // Plasma (a fluid whose flow, swirl and brightness follow the music).
  DRAW.led = (v, p, dt, t) => {
    const { ctx, w, h, U } = v;
    const cell = Math.max(4, Math.round(6 * U * p.size));
    const cols = Math.ceil(w / cell), rows = Math.ceil(h / cell);
    let st = v.led;
    if (!st || st.cols !== cols || st.rows !== rows || st.cell !== cell) {
      const c = document.createElement("canvas");
      c.width = cols;
      c.height = rows;
      const g = c.getContext("2d");
      const mask = document.createElement("canvas");
      mask.width = cols * cell;
      mask.height = rows * cell;
      const mg = mask.getContext("2d");
      mg.fillStyle = "#fff";
      mg.beginPath();
      const r = cell * 0.4;
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++) {
          mg.moveTo(x * cell + cell / 2 + r, y * cell + cell / 2);
          mg.arc(x * cell + cell / 2, y * cell + cell / 2, r, 0, Math.PI * 2);
        }
      mg.fill();
      st = v.led = { cols, rows, cell, c, g, img: g.createImageData(cols, rows), mask, peaks: new Float32Array(cols), pt: Math.random() * 50, ring: 9, beatSeen: shared.beatSerial, lut: new Uint8ClampedArray(256 * 3) };
    }
    const d = st.img.data;
    const ghost = 0.07; // unlit LEDs still show faintly
    const k = Math.min(1, shared.kick);
    const put = (o, c, b) => {
      d[o] = c[0] * b;
      d[o + 1] = c[1] * b;
      d[o + 2] = c[2] * b;
      d[o + 3] = 255;
    };
    if (p._style === "ledplasma") {
      fluidFrame(st, d, cols, rows, p, dt, ghost);
    } else {
      // Spectrum: bars two LEDs wide with a gap, standing on the floor.
      const nb = Math.max(6, Math.floor(cols / 3));
      let vals = new Array(nb);
      for (let i = 0; i < nb; i++) vals[i] = bandAt(Math.pow(i / (nb - 1), 1.1) * 0.92);
      vals = monstercatFilter(vals, 1.8 + p.smoothing * 1.4);
      const floorRow = Math.min(rows, Math.floor(unitArea(v).floor / cell));
      const maxRows = Math.max(4, Math.floor(floorRow * 0.55 * Math.min(1.6, p.size)));
      const dim = colorAt(0.5);
      for (let i = 0; i < d.length; i += 4) {
        d[i] = dim[0] * ghost;
        d[i + 1] = dim[1] * ghost;
        d[i + 2] = dim[2] * ghost;
        d[i + 3] = 255;
      }
      for (let i = 0; i < nb; i++) {
        const hRows = Math.min(maxRows, Math.round(Math.min(1, vals[i]) * maxRows));
        st.peaks[i] = Math.max(hRows, st.peaks[i] - dt * 14 * p.speed);
        const pk = Math.round(st.peaks[i]);
        for (let r = 0; r < Math.max(hRows, pk + 1); r++) {
          const y = floorRow - 1 - r;
          if (y < 0) break;
          const isPeak = r === pk && pk > 0;
          if (r >= hRows && !isPeak) continue;
          const frac = r / maxRows;
          const c = isPeak ? mix(colorAt(1), WHITE, 0.5) : colorAt(frac);
          for (let xx = 0; xx < 2; xx++) {
            const x = i * 3 + xx;
            if (x >= cols) continue;
            put((y * cols + x) * 4, c, isPeak ? 1 : 0.75 + 0.25 * frac + 0.2 * k);
          }
        }
      }
    }
    st.g.putImageData(st.img, 0, 0);
    const W = cols * cell, H = rows * cell;
    ctx.globalCompositeOperation = "source-over";
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = A_(1, v);
    ctx.drawImage(st.c, 0, 0, W, H);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(st.mask, 0, 0);
    // Bloom: a soft copy over the dots.
    ctx.globalCompositeOperation = "lighter";
    ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha = A_((p._style === "ledplasma" ? 0.12 : 0.22) + 0.15 * k, v);
    ctx.drawImage(st.c, 0, 0, W, H);
    ctx.globalAlpha = 1;
  };
  DRAW.ledplasma = DRAW.led;

  // ===========================================================================
  // Stylesheet (main window + popout). Only our own elements are styled.
  // ===========================================================================
  const STYLE_ID = "spicy-visualiser-style";
  const CSS = `__CSS__`;
  function ensureStyle(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    const st = doc.createElement("style");
    st.id = STYLE_ID;
    st.textContent = CSS;
    (doc.head || doc.documentElement).appendChild(st);
  }

  const ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="10" width="2.6" height="8" rx="1.3"/><rect x="7.4" y="6" width="2.6" height="12" rx="1.3"/><rect x="11.8" y="3" width="2.6" height="15" rx="1.3"/><rect x="16.2" y="8" width="2.6" height="10" rx="1.3"/><rect x="2" y="20" width="18" height="1.4" rx=".7" opacity=".5"/></svg>`;

  const TABS = [["style", "Style"], ["look", "Look"], ["sound", "Sound"], ["lyrics", "Lyrics"], ["more", "More"]];
  const TAB_ICON = {
    style: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
    look: '<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.7-.9 1.4-1.8-.4-1.2.4-2.2 1.6-2.2H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10Z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10.5" cy="7" r="1.2"/><circle cx="15" cy="7.5" r="1.2"/>',
    sound: '<path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2"/>',
    lyrics: '<path d="M4 6h16M4 11h16M4 16h10"/>',
    more: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
    about: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/>',
  };

  function panelHTML() {
    const seg = (key, items, scope) =>
      `<div class="lp-seg" data-key="${key}" data-scope="${scope}">${items.map(([v, l]) => `<button data-v="${v}">${l}</button>`).join("")}</div>`;
    const slider = (key, label, min, max, step, scope, uses) =>
      `<div class="lp-row" ${uses ? `data-uses="${uses}"` : ""}><div class="lp-label"><span>${label}</span><span class="lp-val" data-for="${key}" data-scope="${scope}"></span></div><input type="range" min="${min}" max="${max}" step="${step}" data-key="${key}" data-scope="${scope}"></div>`;
    const toggle = (key, label, desc) =>
      `<label class="lp-toggle"><span><span class="lp-tname">${label}</span>${desc ? `<span class="lp-tdesc">${desc}</span>` : ""}</span><input type="checkbox" data-key="${key}" data-scope="global"></label>`;
    const group = (title, body, uses) => `<div class="lp-group" ${uses ? `data-uses="${uses}"` : ""}><div class="lp-gtitle">${title}</div>${body}</div>`;
    const u = (k) => USES[k].join(",");
    const allBut = STYLES.map((x) => x[0]).filter((x) => x !== "off").join(",");
    return `
      <div class="lp-top">
        <div class="lp-head">
          <div class="lp-title"><span class="lp-logo">${ICON}</span><div><h3>Spicy Visualiser</h3><div class="lp-sub lp-where"></div></div></div>
          <div class="lp-pill" title=""><span class="lp-dot"></span><span class="lp-pill-text"></span></div>
          <button class="lp-icon-btn lp-expand" title="Open all settings"><svg viewBox="0 0 24 24"><path d="M14 5h5v5M10 19H5v-5M19 5l-6 6M5 19l6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button><button class="lp-icon-btn lp-min" title="Make smaller"><svg viewBox="0 0 24 24"><path d="M6 12h12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button>
          <button class="lp-icon-btn lp-close" title="Close"><svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7 7 17" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button>
        </div>
        <div class="lp-tabs" data-key="tab" data-scope="global">
          ${TABS.map(([k, l]) => `<button data-v="${k}"><svg viewBox="0 0 24 24" aria-hidden="true">${TAB_ICON[k]}</svg><span>${l}</span></button>`).join("")}
        </div>
      </div>
      <div class="lp-body">

      <div class="lp-page" data-page="style">
        <div class="lp-cards" data-key="__style" data-scope="global">${STYLE_GROUPS.map(([cat, keys]) => (cat ? `<div class="lp-cat">${cat}</div>` : "") + keys.map((k) => STYLES.find((x) => x[0] === k)).sort((x, y) => (x[0] === "off") - (y[0] === "off") || x[1].localeCompare(y[1])).map(([v, l]) => `<button data-v="${v}"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${STYLE_ICON[v] || ""}</svg><span>${l}</span></button>`).join("")).join("")}</div>
        <div class="lp-hint"></div>
      </div>

      <div class="lp-page" data-page="look">
        <div class="lp-needs-style">
          ${group("Colours", `${seg("colorMode", [["album", "Album art"], ["custom", "Custom"], ["rainbow", "Rainbow"], ["classic", "Classic"]], "style")}
            <div class="lp-row"><div class="lp-label"><span>Colour changes</span></div>${seg("colorMove", [["move", "Moving"], ["still", "Still"]], "style")}</div>
            <div class="lp-colors" data-show-color><label><input type="color" data-key="color1" data-scope="style">Colour 1</label><label><input type="color" data-key="color2" data-scope="style">Colour 2</label></div>`)}
          ${group("Appearance", slider("opacity", "Opacity", 0.1, 1, 0.05, "style") + slider("blur", "Blur", 0, 20, 0.5, "style") + slider("brightness", "Brightness", 0.2, 1.6, 0.05, "style") + slider("size", "Size", 0.4, 2, 0.05, "style"))}
          ${group("Layout", slider("barCount", "Bar count", 16, 128, 1, "style", u("barCount")) + slider("neuroTwist", "Twist", 0, 1, 0.05, "style", u("neuroTwist")) + `<div class="lp-row" data-uses="${u("position")}"><div class="lp-label"><span>Position</span></div>${seg("position", [["bottom", "Bottom"], ["top", "Top"], ["both", "Both"]], "style")}</div><div class="lp-row" data-uses="${u("variant")}"><div class="lp-label"><span>Look</span></div>${seg("variant", [["poster", "Poster"], ["brutalist", "Brutalist"]], "style")}</div><div class="lp-row" data-uses="${u("motionLook")}"><div class="lp-label"><span>Look</span></div>${seg("motionLook", [["sweep", "Sweep"], ["radar", "Radar"], ["rings", "Rings"]], "style")}</div><div class="lp-row" data-uses="${u("neuroLook")}"><div class="lp-label"><span>Look</span></div>${seg("neuroLook", [["mesh", "Mesh"], ["lines", "Lines"], ["ridges", "Ridges"]], "style")}</div><div class="lp-row" data-uses="${u("neuroLine")}"><div class="lp-label"><span>Ridges line</span></div>${seg("neuroLine", [["rough", "Rough"], ["smooth", "Smooth"]], "style")}</div><div class="lp-row" data-uses="${u("neuroMirror")}"><div class="lp-label"><span>Mirror</span></div>${seg("neuroMirror", [["off", "Off"], ["on", "On"]], "style")}</div><div class="lp-row" data-uses="${u("circleAt")}"><div class="lp-label"><span>Circle at</span></div>${seg("circleAt", [["middle", "Middle"], ["art", "Album art"]], "style")}</div><div class="lp-row" data-uses="${u("mcColor")}"><div class="lp-label"><span>Bar colour</span></div>${seg("mcColor", [["flow", "Flow"], ["frequency", "Freq."], ["height", "Area"], ["bar", "Bar"], ["solid", "Solid"]], "style")}</div><div class="lp-row" data-uses="${u("beatEvery")}"><div class="lp-label"><span>Change every</span></div>${seg("beatEvery", [["1", "Beat"], ["2", "2"], ["4", "4"], ["8", "8 beats"]], "style")}</div>`, [...new Set([...USES.barCount, ...USES.position, ...USES.variant, ...USES.motionLook, ...USES.neuroLook, ...USES.neuroLine, ...USES.neuroTwist, ...USES.neuroMirror, ...USES.circleAt, ...USES.mcColor, ...USES.beatEvery])].join(","))}
        </div>
      </div>

      <div class="lp-page" data-page="sound">
        <div class="lp-needs-style">
          ${group("How it reacts", slider("sensitivity", "Sensitivity", 0.3, 3, 0.05, "style") + slider("bassBoost", "Bass / kick boost", 0, 2, 0.05, "style", u("bassBoost")) + slider("smoothing", "Smoothing (fall speed)", 0, 1, 0.05, "style", u("smoothing")) + slider("autoRange", "Auto range (less peaking)", 0, 1, 0.05, "style"))}
          ${group("Beat", slider("beatSens", "Beat sensitivity", 0.4, 2, 0.05, "global") + `<div class="lp-beatrow"><button class="lp-tap">Tap to the beat</button><span class="lp-beatinfo"></span></div>`)}
          ${group("Movement", slider("shake", "Shake", 0, 1, 0.05, "style", allBut) + slider("speed", "Speed", 0.1, 2.5, 0.05, "style", u("speed")) + slider("particles", "Particles", 0, 2.5, 0.05, "style", u("particles")))}
        </div>
      </div>

      <div class="lp-page" data-page="lyrics">
        ${group("Highlight", `${seg("lyricGlow", [["off", "Off"], ["word", "Word"], ["line", "Line"]], "global")}
          <div data-show-if="lyricGlow"><div class="lp-label"><span>Look</span></div>${seg("glowStyle", [["soft", "Soft"], ["fade", "Fade"], ["sweep", "Sweep"], ["underline", "Underline"]], "global")}
          ${slider("glowStrength", "Strength", 0.2, 2, 0.05, "global")}</div>`)}
        <div class="lp-note">Drawn behind the lyrics, never on them, so Spicy Lyrics' own animation stays exactly as it is.</div>
      </div>

      <div class="lp-page" data-page="more">
        <div class="lp-group"><div class="lp-gtitle">Sound source</div>${toggle("useHelper", "Use the helper", "Hears the real music (Windows). Off: the visualiser is off too")}<div class="lp-status-text"></div><div class="lp-note lp-get-note"></div><div class="lp-btnrow"><button class="lp-reset lp-get-helper">Install helper</button><button class="lp-reset lp-start-helper">Start the helper</button></div></div>
        ${group("Beat effects", toggle("kickPulse", "Pulse on kicks", "The visual swells a little on each kick") + toggle("kickFlash", "Flash on kicks", "A soft flash of colour"))}
        ${group("Sync", slider("syncDelay", "Audio delay (Bluetooth)", 0, 400, 10, "global") + `<div class="lp-note">Visuals ahead of the sound? With Bluetooth headphones the sound arrives later than it's played. Slide this until the beat lines up.</div>`)}
        ${group("Performance", toggle("ecoUnfocused", "Save power when Spotify isn't focused", "Drops to 30 fps while you're gaming or in another app") + `<div class="lp-label"><span>Frame rate</span></div>${seg("fps", [["30", "30 fps"], ["60", "60 fps"], ["max", "Max"]], "global")}<div class="lp-label"><span>Quality</span></div>${seg("quality", [["low", "Low"], ["medium", "Medium"], ["high", "High"]], "global")}<div class="lp-note">Everything stops (including the helper) when the lyrics view isn't on screen.</div>`)}
        ${group("General", toggle("dimPaused", "Dim when paused") + toggle("noLyricsBoost", "Fuller with no lyrics", "Songs with no lyrics, or lyrics that don't move: the visual gets brighter and bigger, and keeps the beat"))}
        <button class="lp-reset">Reset this style's settings</button>
      </div>
      </div>`;
  }

  const instances = new Set();
  function refreshPanels() {
    for (const inst of instances) inst.refreshPanel();
    if (settingsEl) refreshPanelEl(settingsEl.querySelector(".lp-panel"), document);
  }
  let settingsEl = null;

  const styleKey = () => S.style;
  function write(scope, key, value) {
    if (key === "__style") {
      S.style = value;
      save();
    } else if (scope === "style") setStyleValue(styleKey(), key, value);
    else {
      S[key] = value;
      save();
    }
  }
  function read(scope, key) {
    if (key === "__style") return styleKey();
    return scope === "style" ? P(styleKey())[key] : S[key];
  }

  function wirePanel(p, doc, opts) {
    p.addEventListener("click", (e) => {
      e.stopPropagation();
      if (e.target.closest(".lp-close")) return opts.close();
      if (e.target.closest(".lp-min")) return p.classList.toggle("lp-mini");
      if (e.target.closest(".lp-expand")) return opts.expand && opts.expand();
      if (e.target.closest(".lp-tabs button")) p.classList.remove("lp-mini");
      if (e.target.closest(".lp-tap")) {
        const n = tapBeat();
        const b = p.querySelector(".lp-tap");
        b.textContent = n < 4 ? `Tap ${4 - n} more` : "Tap to the beat";
        refreshPanelEl(p, doc);
        return;
      }
      if (e.target.closest(".lp-start-helper")) return launchHelper(true);
      if (e.target.closest(".lp-get-helper")) {
        downloadHelper();
        const note = p.querySelector(".lp-get-note");
        if (note) note.textContent = HELPER_STEP;
        return;
      }
      if (e.target.closest(".lp-reset")) {
        delete S.per[styleKey()];
        return save();
      }
      const b = e.target.closest("[data-key] > button");
      if (!b) return;
      write(b.parentElement.dataset.scope, b.parentElement.dataset.key, b.dataset.v);
      refreshPanels();
    });
    for (const ev of ["pointerdown", "mousedown", "wheel", "keydown", "dblclick"]) p.addEventListener(ev, (e) => e.stopPropagation());
    p.querySelectorAll("input").forEach((inp) =>
      inp.addEventListener("input", () => {
        const val = inp.type === "checkbox" ? inp.checked : inp.type === "range" ? parseFloat(inp.value) : inp.value;
        write(inp.dataset.scope, inp.dataset.key, val);
        refreshPanels();
      })
    );
    if (!opts.peek) return;
    // Peek: while you drag a slider, everything else in the panel fades out
    // so you can see what it does to the visual.
    const endPeek = () => {
      p.classList.remove("lp-peek");
      p.querySelectorAll(".lp-active-row").forEach((r) => r.classList.remove("lp-active-row"));
    };
    p.addEventListener("pointerdown", (e) => {
      const r = e.target.closest('input[type="range"]');
      if (!r) return;
      const row = r.closest(".lp-row");
      if (row) row.classList.add("lp-active-row");
      p.classList.add("lp-peek");
    }, true);
    doc.addEventListener("pointerup", endPeek, true);
    doc.addEventListener("pointercancel", endPeek, true);
  }

  function refreshPanelEl(p, doc) {
    if (!p) return;
    const style = styleKey();
    const name = (STYLES.find((s) => s[0] === style) || ["", ""])[1];
    const where = p.querySelector(".lp-where");
    if (where) where.textContent = "Now playing: " + name;
    const bi = p.querySelector(".lp-beatinfo");
    if (bi) {
      const tapped = bpm.tapUri === shared.uri;
      bi.textContent = tapped ? `Tapped: ${bpm.shown} BPM (this song)` : ana.src === "song" && ana.uri === shared.uri ? `Song's own beats${ana.tempo ? ", " + Math.round(ana.tempo) + " BPM" : ""}` : bpm.shown ? `From the kicks: ~${bpm.shown} BPM` : "Listening for the beat...";
    }
    if (p._shownTab !== S.tab) {
      p._shownTab = S.tab;
      const body = p.querySelector(".lp-body");
      if (body) body.scrollTop = 0;
    }
    const tab = p.querySelector('.lp-page[data-page="' + S.tab + '"]') ? S.tab : "style";
    p.querySelectorAll(".lp-page").forEach((pg) => pg.classList.toggle("lp-hidden", pg.dataset.page !== tab));
    const pt = p.querySelector(".lp-ptitle");
    if (pt) pt.textContent = tab === "about" ? "About" : (TABS.find((t) => t[0] === tab) || ["", ""])[1];
    p.querySelectorAll(".lp-needs-style").forEach((el) => el.classList.toggle("lp-off", style === "off"));
    p.querySelectorAll("[data-key] > button").forEach((b) => {
      const host = b.parentElement;
      b.classList.toggle("lp-sel", read(host.dataset.scope, host.dataset.key) === b.dataset.v);
    });
    p.querySelectorAll(".lp-tabs button").forEach((b) => b.classList.toggle("lp-sel", b.dataset.v === tab));
    p.querySelectorAll("input").forEach((inp) => {
      if (doc.activeElement === inp) return;
      const val = read(inp.dataset.scope, inp.dataset.key);
      if (inp.type === "checkbox") inp.checked = !!val;
      else inp.value = val;
    });
    p.querySelectorAll(".lp-val").forEach((el) => {
      const key = el.dataset.for;
      const val = read(el.dataset.scope, key);
      el.textContent = key === "barCount" ? String(Math.round(val)) : key === "blur" ? val + "px" : key === "syncDelay" ? Math.round(val) + " ms" : Math.round(val * 100) + "%";
    });
    p.querySelector(".lp-hint").textContent = HINT[style] || "";
    p.querySelectorAll("[data-uses]").forEach((el) => el.classList.toggle("lp-hidden", !el.dataset.uses.split(",").includes(style)));
    p.querySelectorAll("[data-show-if]").forEach((el) => el.classList.toggle("lp-hidden", S[el.dataset.showIf] === "off"));
    p.querySelector("[data-show-color]").classList.toggle("lp-hidden", P(style).colorMode !== "custom");
    CP = P(style);
    const c = colorAt(0.3);
    p.style.setProperty("--lp-accent", `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`);
    const use = S.useHelper !== false;
    const quiet = shared.helper === "live" && !!shared.helperQuiet;
    const live = use && shared.helper === "live" && !quiet;
    const off = !use || shared.helper === "offline";
    p.querySelector(".lp-dot").className = "lp-dot " + (live ? "lp-live" : off || quiet ? "lp-offline" : "");
    p.querySelector(".lp-pill-text").textContent = live ? "Live" : !use ? "Off" : quiet ? "No sound" : off ? "No helper" : "Connecting";
    const long = live
      ? "Connected: reacting to the music live."
      : quiet
        ? "The helper is running but hears no sound. Is Spotify playing through your default speakers or headphones?"
        : !use
        ? "Helper off, so the visualiser is off too. It only moves to the real music."
        : off
        ? "The helper isn't running. The visualiser only moves to the real music, so it stays empty until the helper is on."
        : "Connecting to the helper…";
    p.querySelector(".lp-pill").title = long;
    p.querySelector(".lp-status-text").textContent = long;
    let seen = false;
    try { seen = localStorage.getItem(HELPER_SEEN_KEY) === "1"; } catch (_) {}
    const need = use && shared.helper !== "live"; // not connected: offer install / start
    const sh = p.querySelector(".lp-start-helper");
    if (sh) {
      sh.classList.toggle("lp-hidden", !need || !seen);
      sh.textContent = Date.now() - lastLaunch < 7000 && !shared.launchFailed ? "Starting…" : "Start the helper";
    }
    p.querySelectorAll(".lp-get-helper, .lp-get-note").forEach((el) => el.classList.toggle("lp-hidden", !need));
    const gn = p.querySelector(".lp-get-note");
    if (gn) gn.textContent = shared.downloaded
      ? HELPER_STEP
      : seen && shared.launchFailed
      ? "The helper didn't start. It may not be installed on this PC any more: install it again."
      : "Spotify doesn't let add-ons hear the music, so the visualiser needs its small helper (Windows) to react properly. It only listens while the visualiser is on screen.";
    const dg = p.querySelector(".lp-diag");
    if (dg) {
      const d = ana.diag || {};
      const names = [["audioData", "Audio data"], ["analysis", "Audio analysis"], ["wave", "Waveform"], ["beats", "Beats"], ["meta", "Metadata"]];
      dg.textContent = "Spotify data for this song: " + (names.filter(([k]) => d[k]).map(([k, n]) => n + " " + d[k]).join(" · ") || "checking…");
    }
  }

  // ===========================================================================
  // Full settings window: opened from Spotify's profile menu, or from the
  // expand button in the panel. Same controls as the panel, laid out with a
  // sidebar like Spicy Lyrics' own settings.
  // ===========================================================================
  const VERSION = "0.9.0";
  function openSettings(tab) {
    ensureStyle(document);
    if (tab) S.tab = tab;
    if (settingsEl) return refreshPanels();
    const wrap = document.createElement("div");
    wrap.className = "lp-modal-wrap";
    wrap.innerHTML = `<div class="lp-panel lp-modal lp-open" role="dialog" aria-label="Spicy Visualiser settings">${panelHTML()}</div>`;
    const p = wrap.firstElementChild;
    // Sidebar: logo, title, the tabs as a list, then the helper status.
    const top = p.querySelector(".lp-top");
    const close = p.querySelector(".lp-close");
    p.querySelectorAll(".lp-min, .lp-expand").forEach((b) => b.remove());
    const head = p.querySelector(".lp-head");
    head.querySelector(".lp-title").innerHTML = `<span class="lp-logo">${ICON}</span><span class="lp-brand">Spicy Visualiser</span>`;
    head.insertAdjacentHTML("afterend", `<h2 class="lp-mtitle">Settings</h2>`);
    const tabs = p.querySelector(".lp-tabs");
    tabs.insertAdjacentHTML("beforeend", `<div class="lp-navsep"></div><button data-v="about"><svg viewBox="0 0 24 24" aria-hidden="true">${TAB_ICON.about}</svg><span>About</span></button>`);
    top.appendChild(p.querySelector(".lp-pill"));
    // Content: page title + close button, then the page.
    const body = p.querySelector(".lp-body");
    body.insertAdjacentHTML("afterbegin", `<div class="lp-phead"><h1 class="lp-ptitle"></h1></div>`);
    body.querySelector(".lp-phead").appendChild(close);
    body.insertAdjacentHTML("beforeend", `<div class="lp-page" data-page="about">
      <div class="lp-group"><div class="lp-gtitle">Spicy Visualiser</div>
        <div class="lp-note">Version ${VERSION}. A music visualiser for Spicy Lyrics: 19 styles drawn behind the lyrics, coloured from the album cover.</div>
        <div class="lp-links"><a href="https://github.com/siamct/spicy-visualiser" target="_blank" rel="noopener">GitHub</a><a href="https://github.com/siamct/spicy-visualiser/blob/main/docs/STYLES.md" target="_blank" rel="noopener">Styles guide</a><a href="https://github.com/siamct/spicy-visualiser#install" target="_blank" rel="noopener">Full install</a></div></div>
      <div class="lp-group"><div class="lp-gtitle">Where to find it</div>
        <div class="lp-note">Open Spicy Lyrics and click the bars icon at the top right for quick settings while you watch. This window is in Spotify's profile menu.</div></div>
    </div>`);
    const shut = () => {
      wrap.classList.add("lp-closing");
      setTimeout(() => wrap.remove(), 180);
      settingsEl = null;
      document.removeEventListener("keydown", onKey, true);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        shut();
      }
    };
    document.addEventListener("keydown", onKey, true);
    wrap.addEventListener("pointerdown", (e) => {
      if (e.target === wrap) shut();
    });
    wirePanel(p, document, { close: shut, peek: false });
    settingsEl = wrap;
    document.body.appendChild(wrap);
    refreshPanels();
  }

  // "Spicy Visualiser Settings" in the profile menu (like ST and Spicy Lyrics).
  (function addMenu() {
    if (!Spicetify.Menu || !Spicetify.Menu.Item) return setTimeout(addMenu, 500);
    const icon = `<svg viewBox="0 0 16 16" fill="currentColor"><rect x="1.5" y="7" width="2" height="6" rx="1"/><rect x="5" y="4" width="2" height="9" rx="1"/><rect x="8.5" y="2" width="2" height="11" rx="1"/><rect x="12" y="5.5" width="2" height="7.5" rx="1"/></svg>`;
    try {
      new Spicetify.Menu.Item("Spicy Visualiser Settings", false, () => openSettings(), icon).register();
    } catch (_) {
      try {
        new Spicetify.Menu.Item("Spicy Visualiser Settings", false, () => openSettings()).register();
      } catch (_) {}
    }
  })();

  // ===========================================================================
  // One visualiser per Spicy Lyrics page (main window or popout)
  // ===========================================================================
  function createInstance(page) {
    const box = page.querySelector(":scope > .ContentBox");
    const doc = page.ownerDocument;
    const win = doc.defaultView;
    // Small views: the popout window, or Spicy's card in Spotify's sidebar.
    const isPop = doc !== document || page.classList.contains("CardMode");
    ensureStyle(doc);

    const canvas = doc.createElement("canvas");
    canvas.className = "lp-canvas";
    box.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    const v = {
      page, box, ctx, isPop, w: 0, h: 0, U: 1, scale: QUALITY_SCALE[S.quality] || 0.5,
      alive: true, focus: null, lineBox: null, activeLine: null, activeWord: null,
      lastLine: null, lastWord: null, glows: [], anims: new Map(),
      particles: [], beatSeen: 0, flash: 0, frame: 0, raf: 0, panel: null, styleNow: null,
    };

    const A = (a) => Math.max(0, Math.min(1, a * CP.brightness));
    v.rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${A(a)})`;
    v.glow = (x, y, r, c, a) => {
      if (r <= 0.5) return;
      ctx.globalAlpha = A(a);
      ctx.drawImage(sprite(c), x - r, y - r, r * 2, r * 2);
      ctx.globalAlpha = 1;
    };
    v.soft = (x, y, r, c, a) => {
      if (r <= 0.5) return;
      ctx.globalAlpha = A(a);
      ctx.drawImage(softSprite(c), x - r, y - r, r * 2, r * 2);
      ctx.globalAlpha = 1;
    };
    v.roundRect = (x, y, w, h, r) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.fill();
    };
    // Reading layout every frame forces the browser to re-measure the page
    // while Spicy animates it, which costs frames. Cache for 250 ms.
    v.artCircle = () => {
      const now = performance.now();
      if (v.artCache && now - v.artCache.at < 250) return v.artCache.val;
      const val = measureArt();
      v.artCache = { at: now, val };
      return val;
    };
    function measureArt() {
      const el = box.querySelector(".NowBar .MediaImageContainer");
      if (!el) return null;
      const r = el.getBoundingClientRect();
      if (r.width < 60 || r.height < 60) return null;
      const br = box.getBoundingClientRect();
      if (r.right < br.left || r.left > br.right || r.bottom < br.top || r.top > br.bottom) return null;
      if (win.getComputedStyle(el).opacity === "0") return null;
      return { x: (r.left + r.width / 2 - br.left) * v.scale, y: (r.top + r.height / 2 - br.top) * v.scale, r: (Math.max(r.width, r.height) / 2) * v.scale };
    };

    function rectOf(el) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return null;
      const br = box.getBoundingClientRect();
      if (r.bottom < br.top || r.top > br.bottom) return null;
      const s = v.scale;
      return { x: (r.left + r.width / 2 - br.left) * s, y: (r.top + r.height / 2 - br.top) * s, w: r.width * s, h: r.height * s, cssH: r.height };
    }

    // -- Glow behind the lyrics ----------------------------------------------------
    // Styles: soft (a feathered blob), fade (a band behind the line that fades
    // out to the right), sweep (a band that fills up to the word being sung),
    // underline (a glowing line under the text). Each glow fades in, follows
    // its words, and fades out when the next one starts.
    function updateGlows(dt) {
      const mode = S.lyricGlow;
      const gs = S.glowStyle;
      const lineStyle = gs === "fade" || gs === "sweep";
      const el = mode === "off" ? null : lineStyle || mode === "line" ? v.activeLine : v.activeWord || v.activeLine;
      for (const g of v.glows) g.target = g.el === el ? 1 : 0;
      if (el && !v.glows.some((g) => g.el === el)) v.glows.push({ el, a: 0, target: 1, box: null, head: null });
      const k = Math.min(1, shared.kick);
      const strength = S.glowStrength * (0.32 + 0.38 * k + 0.12 * (shared.bassPunch || 0) + 0.12 * shared.snare);
      const col = colorAt(0.5);
      for (let i = v.glows.length - 1; i >= 0; i--) {
        const g = v.glows[i];
        g.a += (g.target - g.a) * Math.min(1, dt * (g.target > g.a ? 10 : 3.5));
        if (g.el.isConnected && (!g.box || g.target === 0 || (v.frame + i) % 3 === 0)) {
          const b = g.el.classList.contains("line") ? measureLine(g.el) : rectOf(g.el);
          if (b) {
            const f = Math.min(1, dt * 14);
            g.box = g.box ? { x: g.box.x + (b.x - g.box.x) * f, y: g.box.y + (b.y - g.box.y) * f, w: b.w, h: b.h } : b;
          }
          g.right = g.el.classList.contains("OppositeAligned") || !!g.el.closest(".OppositeAligned");
        }
        if (!g.el.isConnected) g.target = 0; // word gone: fade out where it was
        if (!g.box || (g.target === 0 && g.a < 0.01)) {
          if (g.target === 0) v.glows.splice(i, 1);
          continue;
        }
        const b = g.box;
        const alpha = A(strength * g.a);
        if (gs === "soft") {
          const W = b.w + b.h * 1.8, H = b.h * 2.1;
          ctx.globalAlpha = alpha;
          ctx.drawImage(featherSprite(col), b.x - W / 2, b.y - H / 2, W, H);
          ctx.globalAlpha = 1;
          continue;
        }
        const pad = b.h * 0.5;
        const left = b.x - b.w / 2 - pad, right = b.x + b.w / 2 + pad;
        const bandH = gs === "underline" ? Math.max(2, b.h * 0.13) : b.h * 0.95;
        const y = gs === "underline" ? b.y + b.h * 0.5 : b.y - bandH / 2;
        const rgb = `${col[0] | 0},${col[1] | 0},${col[2] | 0}`;
        let grad;
        if (gs === "fade") {
          grad = ctx.createLinearGradient(g.right ? right : left, 0, g.right ? left : right, 0);
          grad.addColorStop(0, `rgba(${rgb},${alpha})`);
          grad.addColorStop(0.35, `rgba(${rgb},${alpha * 0.55})`);
          grad.addColorStop(1, `rgba(${rgb},0)`);
        } else if (gs === "sweep") {
          // Head = the word being sung (or the line's end for line-only lyrics).
          let hx = g.right ? left : right;
          if (v.activeWord && g.el === v.activeLine && S.lyricGlow === "word") {
            const wb = rectOf(v.activeWord);
            if (wb) hx = g.right ? wb.x - wb.w / 2 : wb.x + wb.w / 2;
          }
          g.head = g.head === null ? hx : g.head + (hx - g.head) * Math.min(1, dt * 12);
          const start = g.right ? right : left;
          const tail = g.head + (g.right ? -1 : 1) * b.h * 0.8;
          grad = ctx.createLinearGradient(start, 0, tail, 0);
          const span = Math.abs(tail - start) || 1;
          const headAt = Math.min(0.999, Math.abs(g.head - start) / span);
          grad.addColorStop(0, `rgba(${rgb},${alpha * 0.18})`);
          grad.addColorStop(headAt, `rgba(${rgb},${alpha})`);
          grad.addColorStop(1, `rgba(${rgb},0)`);
          ctx.save();
          ctx.filter = `blur(${(b.h * 0.3).toFixed(1)}px)`;
          ctx.fillStyle = grad;
          ctx.fillRect(Math.min(start, tail), y, span, bandH);
          ctx.restore();
          continue;
        } else {
          grad = ctx.createLinearGradient(left, 0, right, 0);
          grad.addColorStop(0, `rgba(${rgb},0)`);
          const ua = Math.min(1, alpha * 1.6);
          grad.addColorStop(0.2, `rgba(${rgb},${ua})`);
          grad.addColorStop(0.8, `rgba(${rgb},${ua})`);
          grad.addColorStop(1, `rgba(${rgb},0)`);
        }
        ctx.save();
        ctx.filter = `blur(${(gs === "underline" ? b.h * 0.12 : b.h * 0.3).toFixed(1)}px)`;
        ctx.fillStyle = grad;
        ctx.fillRect(left, y, right - left, bandH);
        ctx.restore();
      }
    }

    // -- Button + settings panel --------------------------------------------------------
    function ensureButton() {
      const controls = box.querySelector(".ViewControls");
      if (!controls || !controls.children.length || controls.querySelector(".lp-button")) return;
      const btn = doc.createElement("button");
      btn.className = "ViewControl lp-button";
      btn.innerHTML = ICON;
      btn.title = "Spicy Visualiser";
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        togglePanel();
      });
      controls.insertBefore(btn, controls.querySelector("#Close") || null);
      sync();
    }

    // First time without the helper: say why it isn't fully accurate, once.
    let noticeAt = 0;
    function maybeNotice() {
      if (box.querySelector(".lp-notice") || shared.helper === "live" || S.useHelper === false) return;
      try {
        if (localStorage.getItem(NOTICE_KEY)) return;
        // A helper that worked before is started automatically: only speak up if that failed.
        if (localStorage.getItem(HELPER_SEEN_KEY) === "1" && !shared.launchFailed) return;
      } catch (_) {
        return;
      }
      if (!noticeAt) noticeAt = performance.now() + 5000; // give a helper time to connect
      if (performance.now() < noticeAt || styleKey() === "off") return;
      const n = doc.createElement("div");
      n.className = "lp-notice";
      // Shown once, ever: the panel's Sound source section has it after that.
      try { localStorage.setItem(NOTICE_KEY, "1"); } catch (_) {}
      n.innerHTML = `<div class="lp-notice-title">${ICON}<span>Spicy Visualiser</span></div><p>The visualiser only moves to the real music, and Spotify doesn't let add-ons hear it. Its small helper (Windows) does the listening, so it stays empty until the helper is installed.</p><div class="lp-notice-row"><button class="lp-notice-go">Install helper</button><button class="lp-notice-no">OK</button></div>`;
      n.querySelector(".lp-notice-go").addEventListener("click", (e) => {
        e.stopPropagation();
        downloadHelper();
        n.querySelector("p").textContent = HELPER_STEP;
        n.querySelector(".lp-notice-go").remove();
        n.querySelector(".lp-notice-no").textContent = "Close";
      });
      n.querySelector(".lp-notice-no").addEventListener("click", (e) => {
        e.stopPropagation();
        n.remove();
      });
      box.appendChild(n);
    }
    v.maybeNotice = () => {
      maybeNotice();
      const n = box.querySelector(".lp-notice");
      if (n && (shared.helper === "live" || S.useHelper === false)) n.remove();
    };

    function buildPanel() {
      const p = doc.createElement("div");
      p.className = "lp-panel";
      p.innerHTML = panelHTML();
      wirePanel(p, doc, { close: () => togglePanel(false), expand: () => { togglePanel(false); openSettings(); }, peek: true });
      box.appendChild(p);
      v.panel = p;
      refreshPanel();
    }
    function refreshPanel() {
      refreshPanelEl(v.panel, doc);
    }

    function togglePanel(force) {
      if (!v.panel) buildPanel();
      const open = force !== undefined ? force : !v.panel.classList.contains("lp-open");
      v.panel.classList.toggle("lp-open", open);
      if (open) refreshPanel();
    }
    const closeOnOutside = (e) => {
      if (!v.panel || !v.panel.classList.contains("lp-open")) return;
      if (e.target.closest && (e.target.closest(".lp-panel") || e.target.closest(".lp-button"))) return;
      togglePanel(false);
    };
    doc.addEventListener("pointerdown", closeOnOutside, true);

    function sync() {
      const style = styleKey();
      const p = P(style);
      const on = style !== "off";
      canvas.style.opacity = on ? String(p.opacity) : "0";
      v.shownOpacity = -1; // let the loop put the pause dimming / no-lyrics lift back on
      v.shownOpacity = on ? p.opacity : 0;
      canvas.style.filter = on && p.blur > 0 ? `blur(${p.blur}px)` : "";
      // Head Unit draws a solid dark panel, which "screen" blending would hide.
      canvas.style.mixBlendMode = "";
      const btn = box.querySelector(".ViewControls .lp-button");
      if (btn) btn.classList.toggle("lp-active", on);
      if (v.styleNow !== style) {
        v.particles.length = 0;
        v.styleNow = style;
      }
      const q = QUALITY_SCALE[S.quality] || 0.5;
      if (q !== v.scale) {
        v.scale = q;
        v.w = v.h = 0;
        v.particles.length = 0;
        v.focus = null;
        v.glows.length = 0;
        v.artCache = null;
        v.focusCache = null;
      }
      refreshPanel();
      if (on) start();
    }
    v.sync = sync;
    v.isVisible = () => {
      try {
        return page.isConnected && doc.visibilityState === "visible";
      } catch (_) {
        return false;
      }
    };
    v.refreshPanel = refreshPanel;

    // -- Reading the lyrics (read only) ---------------------------------------------------
    function readLyrics() {
      const content = box.querySelector(".LyricsContent");
      const line = content ? content.querySelector(".line.Active") || content.querySelector(".Active") : null;
      if (line !== v.lastLine) {
        v.lastLine = line; // read only: new lines never move the visual
      }
      let word = line ? line.querySelector(".word.Active") : null;
      if (word && word.closest(".word-group") && !word.classList.contains("word-group")) {
        // A word split into letters: glow the whole word, not one letter.
        word = word.closest(".word-group") || word;
      }
      if (word && word !== v.lastWord) {
        v.lastWord = word;
        const r = word.getBoundingClientRect();
        if (r.height) v.wordCssH = r.height;
      }
      v.activeLine = line;
      v.activeWord = word;
      // What kind of lyrics this song has (checked about twice a second):
      // synced (a line lights up now and then), static (lines, but none ever
      // lights up: Spicy shows them plain white) or none at all.
      const now = performance.now();
      if (line) v.lastActiveAt = now;
      if (v.frame % 30 === 0) {
        const lines = content ? content.querySelectorAll(".line").length : 0;
        if (shared.uri !== v.lyrUri) { v.lyrUri = shared.uri; v.lyrSince = now; }
        const grace = now - (v.lyrSince || now) < 4000; // give a new song a moment to load
        v.lyrKind = !lines && !grace ? "none" : now - (v.lastActiveAt || 0) > 8000 && !grace ? "static" : "synced";
      }
    }

    function measureLine(line) {
      const r = line.getBoundingClientRect();
      if (!r.width || !r.height) return null;
      const br = box.getBoundingClientRect();
      if (r.bottom < br.top || r.top > br.bottom) return null;
      let left = r.left, right = r.right;
      const words = line.querySelectorAll(".word");
      if (words.length) {
        const a = words[0].getBoundingClientRect();
        const b = words[words.length - 1].getBoundingClientRect();
        left = Math.min(a.left, b.left);
        right = Math.max(a.right, b.right);
      }
      const s = v.scale;
      return { x: ((left + right) / 2 - br.left) * s, y: (r.top + r.height / 2 - br.top) * s, w: (right - left) * s, h: r.height * s };
    }

    function focusPoint() {
      if (v.focusCache && v.frame - v.focusCache.f < 15) return { ...v.focusCache.val };
      const val = measureFocus();
      v.focusCache = { f: v.frame, val };
      return { ...val };
    }
    function measureFocus() {
      const lc = box.querySelector(".LyricsContainer");
      const br = box.getBoundingClientRect();
      if (lc) {
        const r = lc.getBoundingClientRect();
        if (r.width) return { x: (r.left + r.width / 2 - br.left) * v.scale, y: (r.top + r.height * 0.45 - br.top) * v.scale };
      }
      return { x: v.w / 2, y: v.h / 2 };
    }

    function resize() {
      const w = Math.max(1, Math.round(box.clientWidth * v.scale));
      const h = Math.max(1, Math.round(box.clientHeight * v.scale));
      if (w !== v.w || h !== v.h) {
        if (v.w > 1 && v.h > 1) {
          const now = performance.now();
          if (v.pendW !== w || v.pendH !== h) {
            v.pendW = w;
            v.pendH = h;
            v.pendAt = now;
            return;
          }
          if (now - v.pendAt < 160) return;
        }
        // Keep particles where they were (scaled), so resizing the popout
        // doesn't make everything jump or reset.
        if (v.w > 1 && v.h > 1) {
          const sx = w / v.w, sy = h / v.h;
          // (Warp stores stars in 3D, not pixels, so it needs no scaling.)
          if (v.styleNow !== "warp") for (const q of v.particles) { q.x *= sx; q.y *= sy; }
          if (v.focus) { v.focus.x *= sx; v.focus.y *= sy; }
          v.glows.length = 0;
        }
        v.w = canvas.width = w;
        v.h = canvas.height = h;
        v.U = Math.max(0.35, Math.min(w, h) / 360);
      }
    }

    // -- Main loop -------------------------------------------------------------------------
    function loop() {
      v.raf = 0;
      if (!v.alive) return;
      if (!page.isConnected || win.closed) return destroy();
      const now = performance.now();
      const style = styleKey();
      if (style === "off") {
        ctx.clearRect(0, 0, v.w, v.h);
        v.glows.length = 0;
        return;
      }
      // Ask for the next frame first, so one bad frame can never stop the loop.
      v.raf = win.requestAnimationFrame(loop);
      // Frame cap. When Spotify isn't the active window (e.g. you're in a
      // game) it drops to 30 fps to save power.
      let focused = true;
      try {
        focused = doc.hasFocus() || document.hasFocus();
      } catch (_) {}
      v.lowPower = S.ecoUnfocused && !focused;
      const cap = v.idle ? 4 : v.lowPower ? 30 : S.fps === "max" ? 0 : Number(S.fps) || 60;
      if (cap && v.last && now - v.last < 1000 / cap - 2) return;
      const dt = Math.min(0.1, Math.max(0.001, (now - (v.last || now - 16)) / 1000));
      v.last = now;
      const t = now / 1000;
      try {
        const p = P(style);
        CP = p;
        MODEL_NOW = MODEL[style] || "punch";
        updateShared(now, p, MODEL_NOW);
        resize();
        if (v.frame % 10 === 0) v.playing = !!Spicetify.Player.isPlaying();
        {
          // checked every frame (just a compare), written only on a change
          const playing = v.playing ?? true;
          const want = (styleKey() === "off" ? 0 : Math.min(1, p.opacity + 0.25 * shared.noLyr)) * (playing || !S.dimPaused ? 1 : 0.35);
          if (Math.abs(want - (v.shownOpacity ?? -1)) > 0.01) {
            canvas.style.opacity = String(want);
            v.shownOpacity = want;
          }
        }
        if (v.frame++ % 30 === 0) {
          ensureButton();
          if (v.panel && v.panel.classList.contains("lp-open")) refreshPanel();
        }
        readLyrics();
        // Only the real music drives it: without the helper's sound, nothing
        // is drawn, and the loop idles at a few frames a second.
        if (!helperFeeding()) {
          if (!v.idle) {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, v.w, v.h);
            v.glows.length = 0;
            v.idle = true;
          }
          return;
        }
        v.idle = false;
        // No lyrics / static lyrics: ease up to a fuller look.
        const nl = S.noLyricsBoost ? { none: 1, static: 0.5 }[v.lyrKind] || 0 : 0;
        shared.noLyr += (nl - shared.noLyr) * Math.min(1, dt * 0.8);
        const c = focusPoint();
        if (!v.focus) v.focus = c;
        v.focus.x += (c.x - v.focus.x) * Math.min(1, dt * 4);
        v.focus.y += (c.y - v.focus.y) * Math.min(1, dt * 4);
        v.flash *= Math.exp(-dt * 3);

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
        ctx.filter = "none";
        ctx.clearRect(0, 0, v.w, v.h);
        // Pulse on kicks + wobble shake (per style), applied to the whole visual.
        const z = (S.kickPulse ? 1 + 0.035 * Math.min(1, shared.kick) : 1) * (1 + 0.08 * shared.noLyr);
        let dx = 0, dy = 0;
        if (p.shake > 0) {
          const mult = Math.min(1, 0.7 * (shared.bassPunch || 0) + 0.6 * shared.kick);
          if (!v.shX) { v.shX = newAxis(); v.shY = newAxis(); }
          // 100% = the old 40% (anything bigger looked wild).
          const disp = ((8 * v.h) / 1080) * Math.min(1, p.shake) * mult;
          dx = shakeAxis(v.shX, mult, dt) * disp;
          dy = shakeAxis(v.shY, mult, dt) * disp;
        }
        ctx.setTransform(z, 0, 0, z, (v.w / 2) * (1 - z) + dx, (v.h / 2) * (1 - z) + dy);
        ctx.globalCompositeOperation = "lighter";
        DRAW[style](v, p, dt, t);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 1;
        if (S.kickFlash && shared.kick > 0.05) {
          ctx.globalAlpha = A(0.14 * Math.min(1, shared.kick));
          ctx.drawImage(softSprite(colorAt(0.5)), -v.w * 0.25, -v.h * 0.6, v.w * 1.5, v.h * 2.2);
          ctx.globalAlpha = 1;
        }
        updateGlows(dt, t);
      } catch (err) {
        if ((v.errCount = (v.errCount || 0) + 1) < 5) console.error("[Spicy Visualiser]", err);
      }
    }

    function start() {
      if (!v.raf && v.alive) v.raf = win.requestAnimationFrame(loop);
    }

    function destroy() {
      v.alive = false;
      if (v.raf) win.cancelAnimationFrame(v.raf);
      doc.removeEventListener("pointerdown", closeOnOutside, true);
      canvas.remove();
      if (v.panel) v.panel.remove();
      const btn = box.querySelector(".lp-button");
      if (btn) btn.remove();
      instances.delete(v);
    }
    v.destroy = destroy;

    instances.add(v);
    ensureButton();
    const keepButton = win.setInterval(() => {
      if (!v.alive || !page.isConnected) return win.clearInterval(keepButton);
      ensureButton();
    }, 1000);
    win.requestAnimationFrame(sync);
    return v;
  }

  // ===========================================================================
  // Find Spicy Lyrics pages (main window + popout window)
  // ===========================================================================
  function scan(doc) {
    if (!doc) return;
    const page = doc.getElementById("SpicyLyricsPage");
    if (!page) return;
    const box = page.querySelector(":scope > .ContentBox");
    if (!box || box.querySelector(":scope > canvas.lp-canvas")) return;
    for (const inst of instances) if (inst.page === page) return;
    createInstance(page);
  }

  setInterval(() => {
    sendHelperState();
    if (shared.helper !== "live" && helperWanted()) launchHelper(false);
    for (const inst of instances) if (inst.maybeNotice && inst.isVisible()) inst.maybeNotice();
    scan(document);
    try {
      const pip = window.documentPictureInPicture && window.documentPictureInPicture.window;
      if (pip && !pip.closed) scan(pip.document);
    } catch (_) {}
    for (const inst of instances) if (!inst.page.isConnected) inst.destroy();
  }, 500);
})();
