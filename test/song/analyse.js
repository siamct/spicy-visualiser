// Runs the helper's own analysis code over test/out/song.wav, 60 times a
// second, and saves what the helper would have sent to the visualiser:
//   node test/song/analyse.js  ->  test/out/song-frames.json
// The analysis part of helper.js is loaded as-is (no server, no capture), so
// the shots show what real audio through the real helper looks like.
"use strict";
const fs = require("fs");
const path = require("path");

const src = fs.readFileSync(path.join(__dirname, "..", "..", "helper", "helper.js"), "utf8");
const from = src.indexOf("// Audio buffer");
const to = src.indexOf("// Capturing Spotify");
if (from < 0 || to < 0) throw new Error("helper.js layout changed");
const body = src.slice(src.lastIndexOf("\n", from), src.lastIndexOf("\n// ----", to));

let clock = 0;
const make = new Function(
  "Date",
  "needLo",
  "const SAMPLE_RATE = 48000, BANDS = 64;\n" + body + "\nreturn { pushPcm, analyse };"
);
const helper = make({ now: () => clock }, () => true);

const wav = fs.readFileSync(path.join(__dirname, "..", "out", "song.wav"));
const data = wav.subarray(44); // plain 16-bit stereo PCM written by make-track.py
const STEP = 800; // samples per update = 60 updates a second at 48 kHz
const frames = [];
for (let i = 0; i + STEP * 4 <= data.length; i += STEP * 4) {
  helper.pushPcm(data.subarray(i, i + STEP * 4));
  clock += 1000 / 60;
  frames.push(helper.analyse());
}
const out = path.join(__dirname, "..", "out", "song-frames.json");
fs.writeFileSync(out, JSON.stringify(frames));
const kicks = frames.filter((f) => f.k > 0).length;
console.log(out, frames.length, "frames,", kicks, "kicks,", frames.filter((f) => f.s > 0).length, "snares");
