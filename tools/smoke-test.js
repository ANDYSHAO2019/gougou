const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const requiredFiles = [
  "index.html",
  "styles.css",
  "game.js",
  "assets/backgrounds/backyard-arena-ai-clean_001.jpg",
  "assets/dogs/player/idle_000.png",
  "assets/dogs/player/attack_003.png",
  "assets/dogs/player/lose_005.png",
  "assets/audio/ai-barks/dog-bark-1.wav",
  "assets/audio/ai-barks/dog-bark-2.wav",
  "assets/audio/ai-barks/dog-bark-3.wav",
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const file of requiredFiles) {
  assert(fs.existsSync(path.join(root, file)), `Missing required file: ${file}`);
}

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const js = fs.readFileSync(path.join(root, "game.js"), "utf8");

for (const id of [
  "arena",
  "selectScreen",
  "battleScreen",
  "startBtn",
  "micMeter",
  "barkStats",
  "onlineBox",
  "hostOnlineBtn",
  "joinOnlineBtn",
  "localSignal",
  "remoteSignal",
]) {
  assert(html.includes(`id="${id}"`), `Missing DOM id: ${id}`);
}

for (const asset of [
  "backyard-arena-ai-clean_001.jpg",
  "dog-bark-1.wav",
  "dog-bark-2.wav",
  "dog-bark-3.wav",
]) {
  assert(css.includes(asset) || js.includes(asset), `Asset is not referenced: ${asset}`);
}

execFileSync("node", ["--check", path.join(root, "game.js")], { stdio: "inherit" });
console.log("Smoke test passed.");
