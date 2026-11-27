# The styles

A quick tour of every Spicy Visualiser style: what you're looking at, what it reacts to, and the settings worth trying.

Open the visualiser panel with the bars button at the top right of Spicy Lyrics. The **Style** tab picks the style. Most settings live in **Look**. **Sound** holds how it reacts and the beat options, including **Fit each song** (on by default), which learns each song's levels as it plays so quiet and loud songs both move well.

Every style:
- sits behind the lyrics, which stay on top and readable;
- takes its colours from the album cover;
- gets a little fuller on songs with no lyrics, or with static lyrics that don't move.

On songs with no lyrics, the song name and artist take the place of Spicy Lyrics' "No lyrics" box, except in fullscreen, where Spicy's box is left alone (click it to see the box again; you can turn it off in the panel's settings).

> The pictures show just the visualiser (no lyrics), all playing the same test song. The colours come from the album cover, so they change between a few made-up albums.
---

## Bars & meters

### Monstercat
![Monstercat](screenshots/styles/monstercat.jpg)

The spectrum as a row of bars, with bass on the left and treble on the right. Bars snap up on a hit and fall back with a bit of gravity. A few particles drift behind them.

- **Bar colour** (Look):
  - **Flow** (default): the album colours as a slowly drifting gradient across the bars, gliding to new colours on the beat.
  - **Freq.**: bass colour on the left, treble colour on the right.
  - **Area**: colour by height on screen, so tall peaks reach a different colour (below).
  - **Bar**: each bar is one colour, picked by how tall it is.
  - **Solid**: one colour for all the bars.
- **Change every**: how many beats between colour shifts (1, 2, 4 or 8).

### Mirror Bars
![Mirror Bars](screenshots/styles/mirror.jpg)

Bars reflected up and down from a centre line, with the bass in the middle. Thin and calm, so it suits busy lyric pages.

### LED Meters
![LED Meters](screenshots/styles/ledm.jpg)

Studio LED ladders along the bottom, one per part of the spectrum: green, then yellow, then red at the top, each lit segment glowing. A peak light hangs for a moment, then drops.

### LED Wall
![LED Wall](screenshots/styles/led.jpg)

A panel of LED dots. Unlit dots stay faintly visible, so it reads like real hardware. Spectrum bars light up, with falling peak dots.

### ASCII
![ASCII](screenshots/styles/ascii.jpg)

A terminal-style spectrum made of characters, with falling peak markers.

### VU Meters
![VU Meters](screenshots/styles/vu.jpg)

One meter with two needles, like a stereo meter: one for the bass (low), one for the mids and highs (high). It sits in the middle, or beside the album art when the art is showing. The needles are a little sluggish and swing past before settling (**Smoothing** sets how sluggish), and a peak light comes on when a needle goes into the red. Five looks (**Look**):
- **Classic** (above): night hi-fi, a face glowing warm amber from behind in a dark room, the print and needles as dark silhouettes (black is low, red is high);
- **Minimal**: no box, just a thin scale in the album's colours, a red zone that glows (brighter when a needle's in it) and two thin needles in the album's colours;
- **Broadcast**: an old radio-studio meter, matte black face, white print marked 1 to 7, with a red needle and a green one;
- **Holo**: two floating arcs of ticks (outer low, inner high) that light up to their needles, with a glowing needle line and a faint scanline shimmer. Its needle is heavier and only really moves on bigger changes;
- **HUD**: a sci-fi gauge, two segmented level arcs inside a slowly turning ring.

### Oscilloscope
![Oscilloscope](screenshots/styles/scope.jpg)

A glowing line tracing the sound like an old scope, over a faint grid:
- quiet parts are a calm wave; as the music gets busy the trace curls round into looping figure shapes;
- the line glows on for a moment after it passes, like a real scope screen;
- **Colours: Classic** (default) is green phosphor; the other colour modes use those colours.

---

## Holo

Thin ticks that glow when lit and stay faintly visible when not, a slow shimmer running down them and scanlines drifting over, in the album's colours (the same look as the VU Meters' Holo face). Their levels are heavy: they rise quickly and sink slowly, so they don't flicker. **Smoothing** sets how slowly they sink.

### Holo Radar
![Holo Radar](screenshots/styles/holoradar.jpg)

A ring of ticks round the middle, one for each part of the spectrum (bass at the top, mirrored on both sides), lit by the sound. A sweep line turns slowly and lights the ticks it passes, and each kick leaves a blip that fades. It sits beside the album art when the art is showing.

### Holo Spectrum
![Holo Spectrum](screenshots/styles/holospec.jpg)

The spectrum as a row of columns made of short glowing ticks along the bottom, coloured across from the album. A peak tick hangs over each column, then drops.

### Holo Rings
![Holo Rings](screenshots/styles/holorings.jpg)

Three nested rings of ticks: bass inside, then mids, highs outside. Each turns its own way at its own speed (faster on heavy bass) and lights up with its part of the sound.

### Pitch Trail
![Pitch Trail](screenshots/styles/pitchtrail.jpg)

Like a piano roll turned sideways, but only looking back. A glowing line follows where the sound sits in pitch (low at the bottom, high at the top) and scrolls left, leaving a trail. The strongest pitches at each moment leave short dashes, like notes on a roll. It's the rough pitch (each step is about two piano keys), not exact notes or chords.

## Circles

### Radial Bars
![Radial Bars](screenshots/styles/radial.jpg)

The spectrum as bars round a ring, which turns a notch on every beat. It sits around the album art when the art is on screen.

### Sphere
![Sphere](screenshots/styles/ncs.jpg)

A slowly turning ball of glowing dots:
- a flowing pattern pushes the dots outwards, more the louder it is, so it swells and bulges with the music and stays a calm sphere in quiet parts;
- it only moves when there's sound, and kicks give it a quick pulse;
- **Circle at** can put it round the album art.

### Subwoofer
![Subwoofer](screenshots/styles/sub.jpg)

A speaker drawn in light:
- kicks punch the cone out and it springs back;
- the surround wobbles with the bass;
- the light ring fades to a new colour on the beat.

### Trap
![Trap](screenshots/styles/trap.jpg)

The classic trap-channel circle, empty in the middle. The spectrum is mirrored round a ring, bass at the top, exaggerated like the trap channels; the rest barely moves, so it sits still when there's no bass. A white layer sits in front, and seven colour layers burst out behind it on every hit. The circle bounces with the bass, and white dust flies towards you. Set **Circle at** to the art and it wraps the album cover instead.

### Starfield Tunnel
![Starfield Tunnel](screenshots/styles/tunnel.jpg)

Flying down a gently bending tunnel of glowing rings, with stars streaming past:
- the bass widens the rings and speeds you up;
- kicks make the nearest rings flash;
- the colours step round on the beat.

---

## On the beat

These styles follow the song's beat more than the raw spectrum, so they keep a steady rhythm.

Three drum styles show only the drum hits, nothing else, in the album's colours. They spring up on each hit and swing a little past before settling, like a VU needle (**Smoothing** sets how loose), and with **Fit each song** on they learn each song's drum levels, so quiet and loud songs both hit hard.

### Drum Pulses
![Drum Pulses](screenshots/styles/drums.jpg)

Two big soft shapes, kick on the left (a deep, heavy thump), snare on the right (a sharp, quick snap). A thin ring marks each one's peak, hangs, then shrinks back.

### Drum Pads
![Drum Pads](screenshots/styles/drumpads.jpg)

Four drum-machine pads (kick, snare, hi-hat, bass) that light up as each is hit, then fade.

### Drum Waves
![Drum Waves](screenshots/styles/drumwaves.jpg)

Each kick sends a wave in from the left, each snare one in from the right. Where two meet they burst into a flash that spreads up and down. Harder hits make brighter waves.

### Geometric
![Geometric](screenshots/styles/geometric.jpg)

Bold, flat slanted bands like a modern poster, one per slice of the spectrum, sliding in from the edges. Colours step on the beat. The **Brutalist** variant adds a heavy grid and cut-out labels.

### Bauhaus
![Bauhaus](screenshots/styles/bauhaus.jpg)

A poster grid of flat circles, half circles, quarter circles and triangles.
- Shapes grow with their part of the spectrum.
- Tiles turn a quarter on the beat and the colours step round.

---

## Liquid colour

### Plasma
![Plasma](screenshots/styles/plasma.jpg)

A smooth glowing fluid. It flows faster, swirls harder and glows brighter as the music builds, surges on kicks, and its colours sweep round on the beat. The quietest style, good when you mainly want the lyrics.

### LED Plasma
![LED Plasma](screenshots/styles/ledplasma.jpg)

The same fluid as Plasma, shown on the LED dot panel.

### Oil Slick
![Oil Slick](screenshots/styles/oil.jpg)

Rainbow swirls like oil on a wet road at night:
- it just flows; the bass stirs the swirls harder and moves the colours;
- the colours shift slowly round on the beat;
- **Colours: Classic** (default) is the oil rainbow; the other colour modes tint it.

### Liquid Chrome
![Liquid Chrome](screenshots/styles/chrome.jpg)

A sheet of glossy black liquid metal:
- mostly dark, so the lyrics stay easy to read, with thin highlights in the album's colours sliding over its curves;
- it rolls slowly and the bass swells the waves; no beat effects, it just flows.

### Liquid
![Liquid](screenshots/styles/dnb.jpg)

A flowing three-strand bass wave that pumps on kicks, with speed streaks racing past and a flash on every snare. Made with drum & bass in mind.

### Kaleidoscope
![Kaleidoscope](screenshots/styles/kaleido.jpg)

Mirrored trails of colour that keep zooming out from the middle, warping and smearing with the music, like the old media-player visualisers:
- the spectrum drops in sharp shards of colour, mirrored round the middle;
- the bass makes it zoom and swirl faster, kicks flash it;
- darker in the middle so the lyrics stay readable.

---

## Sky & light

### Aurora
![Aurora](screenshots/styles/aurora.jpg)

Northern lights over a starry sky:
- three curtains of light in the album's colours ripple sideways, with fine rays running up them;
- the bass lifts them higher and taller, loudness makes them brighter and faster, kicks make them flare.

### Galaxy
![Galaxy](screenshots/styles/galaxy.jpg)

Drifting slowly through a coloured nebula, stars streaming past:
- the bass makes the gas glow brighter and swirl;
- loudness speeds up the flight, kicks make the stars flash.

### Ribbon
![Ribbon](screenshots/styles/ribbon.jpg)

Soft sheets of light rolling across the screen, like the wave on an old games-console home menu:
- no drawn lines: each sheet is soft at its edges and brighter where it folds over, and runs right across the screen;
- the music sets how fast they flow and the bass makes the waves bigger; each kick makes them flash brighter and turns their colours a little further round;
- a few sparkles drift along with them.

### Ombre
![Ombre](screenshots/styles/ombre.jpg)

Rich colour glowing in from the left and right sides, with the middle left dark behind the lyrics:
- the colours run down each side as a soft gradient and slowly turn;
- the bass drives it: it pushes the glow further in and makes it brighter, and kicks give it a soft pulse.

### Warp
![Warp](screenshots/styles/warp.jpg)

Hyperspace stars flying past, faster on the bass, with a surge on every beat.

---

## Textures

### Graphite
![Graphite](screenshots/styles/prism.jpg)

A dark, slightly mossy stone surface with little flecks of rainbow shimmer scattered over it, thicker towards the middle:
- the stone slowly drifts and warps, and a slow wave of light travels over it, bringing flecks out in new places while others fade back; the rainbow keeps sliding through them; louder parts and the bass bring out more of them, kicks make them flare;
- **Colours: Classic** (default) is the rainbow shimmer; the other colour modes tint it.

### Rain on Glass
![Rain on Glass](screenshots/styles/rain.jpg)

Looking out of a rainy window at night:
- big, soft out-of-focus lights in the album's colours glow behind the glass;
- drops keep landing (the bass sets how hard it rains, kicks bring a burst); drops that touch join up, and heavy ones run down, picking up the drops in their way;
- they leave a faint wet smear that breaks into little beads and dries up within a few seconds, and drops left sitting slowly evaporate.

### Smoke
![Smoke](screenshots/styles/smoke.jpg)

Soft coloured smoke curling up from the bottom:
- louder parts make it thicker and rise faster;
- the bass stirs it into curls, and kicks puff out a burst from below;
- the colours turn on the beat.

### Lava Lamp
![Lava Lamp](screenshots/styles/lava.jpg)

Lumpy blobs of colour rising and sinking, stretching, merging and splitting:
- louder parts make them move faster;
- the bass swells them and kicks give them a wobble;
- the colours step round on the beat.

### Bubbles
![Bubbles](screenshots/styles/bubbles.jpg)

Soap bubbles floating up, each a clear film with a thin rainbow rim and a bright window reflection:
- the bass sends more up, and faster; kicks pop a few;
- **Colours: Classic** (default) is the soap-film rainbow; the other colour modes tint the rims;
- **Particles** sets how many.

---

## 3D

### Neuro Mesh
![Neuro Mesh](screenshots/styles/neuro.jpg)

A wireframe landscape rolling towards you, shaped by the spectrum. It glitches on snares.

Three looks (**Look**):
- Mesh (above);
- Lines: stacked wave lines;
- Ridges: flat stacked lines like the classic pulsar-plot album cover (below).

### Particles
![Particles](screenshots/styles/particles.jpg)

A field of light that drifts in a gentle flow and links up into constellations. It bursts outwards on kicks and twinkles with the hi-hats.

---

## If the beat feels off

**Fit each song** (Sound tab, on by default) learns each song's kick level in its first few seconds, so busy bass doesn't fire on every note and quiet songs still catch their kicks. Beat sensitivity still works on top of it.

Open the **Sound** tab, then **Fine-tune**:
- **Tap to the beat**: tap the button along with the song 4 or more times, and everything locks to your tempo for that song.
- **Beat sensitivity**: lower it if it's catching beats that aren't there, raise it if it misses soft kicks.
- The panel also shows where the beat is coming from: your taps, the song's own beat data, or the kicks it hears.
