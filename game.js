const DOGS = [
  {
    id: "shiba",
    name: "柴犬",
    cost: 0,
    stars: 2,
    skill: "稳定汪叫",
    power: 1,
    stamina: 1,
    tolerance: 1.12,
    crit: 0.92,
    barkPitch: 360,
    aiDelay: [2100, 3900],
    portrait: "./assets/dogs/player/idle_000.png",
    description: "新手友好，叫声判定更宽容。",
  },
  {
    id: "golden",
    name: "黄金犬",
    cost: 150,
    stars: 3,
    skill: "长叫压制",
    power: 1.12,
    stamina: 1.08,
    tolerance: 1,
    crit: 1,
    barkPitch: 240,
    aiDelay: [1900, 3500],
    portrait: "./assets/dogs/player/idle_000.png",
    description: "耐力更好，适合稳定连叫。",
  },
  {
    id: "fighter",
    name: "斗犬血统",
    cost: 300,
    stars: 4,
    skill: "暴击推进",
    power: 1.22,
    stamina: 0.92,
    tolerance: 0.92,
    crit: 1.18,
    barkPitch: 185,
    aiDelay: [1600, 3100],
    portrait: "./assets/dogs/player/attack_003.png",
    description: "爆发强，但更容易疲劳。",
  },
];

const STORAGE_KEY = "barkBattleSaveV1";
const AI_BARK_SOUNDS = [
  "./assets/audio/ai-barks/dog-bark-1.wav",
  "./assets/audio/ai-barks/dog-bark-2.wav",
  "./assets/audio/ai-barks/dog-bark-3.wav",
];
const BALANCE = {
  roundSeconds: 35,
  micFloor: 0.024,
  micRange: 0.19,
  barkThreshold: 0.28,
  hotThreshold: 0.72,
  comboWindow: 1200,
  maxCombo: 4,
  tiredCombo: 4,
  tiredWindow: 980,
  cooldownBase: 430,
  tiredPenalty: 0.7,
  playerPushMin: 4,
  playerPushMax: 26,
  enemyPushMin: 5,
  enemyPushMax: 21,
  barkEndThreshold: 0.16,
  barkMinDuration: 90,
  barkMaxDuration: 620,
  barkMinGap: 180,
  barkMinPeak: 0.34,
  barkMinAverage: 0.2,
  sustainMinDuration: 420,
  sustainPulseGap: 520,
  sustainMinLevel: 0.5,
  barkMaxInstantRise: 0.78,
  barkLongReject: 900,
  calibrationAmbientMs: 900,
  calibrationBarkMs: 1500,
  minMicRange: 0.12,
  maxMicRange: 0.28,
};

const game = {
  push: 0,
  timeLeft: 30,
  running: false,
  muted: false,
  combo: 1,
  lastBarkAt: 0,
  playerCooldownUntil: 0,
  timerId: 0,
  aiId: 0,
  audioContext: null,
  analyser: null,
  micStream: null,
  data: null,
  toneContext: null,
  selectedDogId: "shiba",
  enemyDogId: "golden",
  mode: "ai",
  matchIndex: 0,
  wp: 0,
  winStreak: 0,
  unlocked: ["shiba"],
  stats: {
    wins: 0,
    losses: 0,
    draws: 0,
    bestStreak: 0,
    recent: [],
  },
  barkStats: {
    accepted: 0,
    rejected: 0,
  },
  barkDetector: {
    active: false,
    startAt: 0,
    peak: 0,
    sum: 0,
    samples: 0,
    previousLevel: 0,
    lowFrames: 0,
    lastAcceptedAt: 0,
    lastSustainAt: 0,
    rejectedUntilQuiet: false,
    rejection: "",
    rejectionUntil: 0,
  },
  online: {
    role: "",
    peer: null,
    channel: null,
    socket: null,
    connected: false,
    localReady: false,
    remoteReady: false,
    roundStarting: false,
    remoteDogId: "golden",
    roomId: "",
    sessionId: "",
    syncedAssetConfig: null,
    syncedAssetHash: "",
  },
};

const el = {
  arena: document.querySelector("#arena"),
  selectScreen: document.querySelector("#selectScreen"),
  battleScreen: document.querySelector("#battleScreen"),
  dogCards: document.querySelector("#dogCards"),
  selectTitle: document.querySelector("#selectTitle"),
  battleStatsSummary: document.querySelector("#battleStatsSummary"),
  battleStatsRecent: document.querySelector("#battleStatsRecent"),
  resetStatsBtn: document.querySelector("#resetStatsBtn"),
  confirmDogBtn: document.querySelector("#confirmDogBtn"),
  aiModeBtn: document.querySelector("#aiModeBtn"),
  onlineModeBtn: document.querySelector("#onlineModeBtn"),
  onlineBox: document.querySelector("#onlineBox"),
  hostOnlineBtn: document.querySelector("#hostOnlineBtn"),
  joinOnlineBtn: document.querySelector("#joinOnlineBtn"),
  copySignalBtn: document.querySelector("#copySignalBtn"),
  leaveOnlineBtn: document.querySelector("#leaveOnlineBtn"),
  onlineEnterBtn: document.querySelector("#onlineEnterBtn"),
  roomCode: document.querySelector("#roomCode"),
  roomStateBadge: document.querySelector("#roomStateBadge"),
  onlineStatus: document.querySelector("#onlineStatus"),
  assetSyncStatus: document.querySelector("#assetSyncStatus"),
  localPlayerName: document.querySelector("#localPlayerName"),
  localPlayerDog: document.querySelector("#localPlayerDog"),
  localReadyState: document.querySelector("#localReadyState"),
  remotePlayerName: document.querySelector("#remotePlayerName"),
  remotePlayerDog: document.querySelector("#remotePlayerDog"),
  remoteReadyState: document.querySelector("#remoteReadyState"),
  wpText: document.querySelector("#wpText"),
  startBtn: document.querySelector("#startBtn"),
  nextBtn: document.querySelector("#nextBtn"),
  muteBtn: document.querySelector("#muteBtn"),
  pushPlayer: document.querySelector("#pushPlayer"),
  pushEnemy: document.querySelector("#pushEnemy"),
  pushMarker: document.querySelector("#pushMarker"),
  timer: document.querySelector("#timer"),
  roundLabel: document.querySelector("#roundLabel"),
  countdown: document.querySelector("#countdown"),
  micMeter: document.querySelector("#micMeter"),
  micLabel: document.querySelector("#micLabel"),
  micPanel: document.querySelector(".mic-panel"),
  barkStats: document.querySelector("#barkStats"),
  playerName: document.querySelector("#playerName"),
  enemyName: document.querySelector("#enemyName"),
  playerDog: document.querySelector("#playerDog"),
  enemyDog: document.querySelector("#enemyDog"),
  playerSprite: document.querySelector("#playerSprite"),
  enemySprite: document.querySelector("#enemySprite"),
  fxLayer: document.querySelector("#fxLayer"),
  combo: document.querySelector("#combo"),
  dangerLabel: document.querySelector("#dangerLabel"),
  barkCallout: document.querySelector("#barkCallout"),
  koPanel: document.querySelector("#koPanel"),
  koTitle: document.querySelector("#koTitle"),
  koReward: document.querySelector("#koReward"),
  spriteEditorModal: document.querySelector("#spriteEditorModal"),
  spriteEditorBtn: document.querySelector("#spriteEditorBtn"),
  spriteEditorClose: document.querySelector("#spriteEditorClose"),
  spriteSaveBtn: document.querySelector("#spriteSaveBtn"),
  spriteResetBtn: document.querySelector("#spriteResetBtn"),
  assetTabs: document.querySelectorAll(".asset-tab"),
  assetPanels: document.querySelectorAll(".asset-tab-panel"),
  assetDogSelect: document.querySelector("#assetDogSelect"),
  assetBattlePreview: document.querySelector("#assetBattlePreview"),
  assetPreviewStage: document.querySelector("#assetPreviewStage"),
  assetPreviewPlayer: document.querySelector("#assetPreviewPlayer"),
  assetPreviewEnemy: document.querySelector("#assetPreviewEnemy"),
  assetPreviewBattleBtn: document.querySelector("#assetPreviewBattleBtn"),
  assetBackgroundInput: document.querySelector("#assetBackgroundInput"),
  assetBackgroundClear: document.querySelector("#assetBackgroundClear"),
  assetBackgroundPreview: document.querySelector("#assetBackgroundPreview"),
  assetWaveColor: document.querySelector("#assetWaveColor"),
  assetEnemyWaveColor: document.querySelector("#assetEnemyWaveColor"),
  assetWaveImageInput: document.querySelector("#assetWaveImageInput"),
  assetEnemyWaveImageInput: document.querySelector("#assetEnemyWaveImageInput"),
  assetWaveImageClear: document.querySelector("#assetWaveImageClear"),
  assetEnemyWaveImageClear: document.querySelector("#assetEnemyWaveImageClear"),
  assetGlyphs: document.querySelector("#assetGlyphs"),
  assetParticleBoost: document.querySelector("#assetParticleBoost"),
  assetWaveCount: document.querySelector("#assetWaveCount"),
  assetPreviewPlayerFx: document.querySelector("#assetPreviewPlayerFx"),
  assetPreviewEnemyFx: document.querySelector("#assetPreviewEnemyFx"),
  assetEffectPreview: document.querySelector("#assetEffectPreview"),
  assetConfigText: document.querySelector("#assetConfigText"),
  assetExportBtn: document.querySelector("#assetExportBtn"),
  assetDownloadBtn: document.querySelector("#assetDownloadBtn"),
  assetImportBtn: document.querySelector("#assetImportBtn"),
  assetConfigStatus: document.querySelector("#assetConfigStatus"),
  assetConfigSize: document.querySelector("#assetConfigSize"),
  assetConfigAdvice: document.querySelector("#assetConfigAdvice"),
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const currentDog = () => DOGS.find((dog) => dog.id === game.selectedDogId) || DOGS[0];
const enemyDog = () => DOGS.find((dog) => dog.id === game.enemyDogId) || DOGS[1];
const aiBarkPool = AI_BARK_SOUNDS.map((src) => {
  const audio = new Audio(src);
  audio.preload = "auto";
  return audio;
});
const imageCache = new Map();

function preloadImage(src) {
  if (!src || imageCache.has(src)) return Promise.resolve();
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = src;
    imageCache.set(src, image);
  });
}

function preloadAudio(audio) {
  return new Promise((resolve) => {
    if (!audio) {
      resolve();
      return;
    }
    const done = () => resolve();
    audio.addEventListener("canplaythrough", done, { once: true });
    audio.addEventListener("error", done, { once: true });
    audio.load();
    window.setTimeout(done, 900);
  });
}

async function preloadGameAssets() {
  const config = getAssetConfig();
  const dogImages = new Set();
  for (const dog of DOGS) {
    dogImages.add(dog.portrait);
    const assets = assetsForDog(dog);
    Object.values(assets).forEach((asset) => collectSpriteAssetImages(asset, dogImages));
  }
  await Promise.allSettled([
    preloadImage("./assets/backgrounds/backyard-arena-ai-clean_001.jpg"),
    preloadImage(config.background.image),
    ...Array.from(dogImages, preloadImage),
    ...aiBarkPool.map(preloadAudio),
  ]);
}

function collectSpriteAssetImages(asset, bucket) {
  if (!asset) return;
  if (typeof asset === "string") {
    bucket.add(asset);
    return;
  }
  if (Array.isArray(asset.frames)) {
    asset.frames.filter(Boolean).forEach((src) => bucket.add(src));
  }
}

class StaticDogSprite {
  constructor({ dog, image, assets }) {
    this.dog = dog;
    this.image = image;
    this.assets = assets;
    this.returnTimer = 0;
    this.frameTimer = 0;
    this.frameIndex = 0;
  }

  load() {
    this.dog.classList.add("sprite-mode", "static-mode");
    this.play("happy");
  }

  setAssets(assets) {
    this.assets = assets;
    this.play("happy");
  }

  play(action, { lock = 0 } = {}) {
    const asset = this.assets[action] || this.assets.happy;
    if (!asset) return;
    window.clearTimeout(this.returnTimer);
    window.clearInterval(this.frameTimer);
    this.dog.classList.remove("happy", "bark", "dead", "hit", "tired");
    this.dog.classList.add(action);
    if (typeof asset === "string") {
      this.image.src = asset;
    } else if (Array.isArray(asset.frames) && asset.frames.length) {
      const frames = asset.frames.filter(Boolean);
      const frameMs = Math.max(50, Math.round(1000 / (Number(asset.fps) || 8)));
      this.frameIndex = 0;
      this.image.src = frames[0];
      if (frames.length > 1) {
        this.frameTimer = window.setInterval(() => {
          this.frameIndex += 1;
          if (this.frameIndex >= frames.length) {
            if (asset.loop) {
              this.frameIndex = 0;
            } else {
              this.frameIndex = frames.length - 1;
              window.clearInterval(this.frameTimer);
            }
          }
          this.image.src = frames[this.frameIndex];
        }, frameMs);
      }
    }
    if (lock && action !== "dead") {
      this.returnTimer = window.setTimeout(() => {
        this.play("happy");
      }, lock);
    }
  }
}

const DEFAULT_DOG_ASSETS = {
  happy: "./assets/dogs/player/idle_000.png",
  bark: "./assets/dogs/player/attack_003.png",
  dead: "./assets/dogs/player/lose_005.png",
};

// ── 角色精灵编辑器 ─────────────────────────────────────────
const SPRITE_EDITOR_KEY = "barkBattleCustomSprites";
const ASSET_CONFIG_KEY = "barkBattleAssetConfigV1";
const DEFAULT_ASSET_CONFIG = {
  kind: "gougou-asset-config",
  schemaVersion: 1,
  updatedAt: "",
  sprites: {},
  dogs: {},
  background: {
    image: "",
  },
  effects: {
    waveColor: "#ffffff",
    enemyWaveColor: "#ff5c48",
    waveImage: "",
    enemyWaveImage: "",
    glyphs: ["汪", "BARK!", "WOOF!", "@", "#", "!", "*"],
    particleBoost: 1,
    waveCount: 3,
  },
};

function cloneAssetConfig(config) {
  return JSON.parse(JSON.stringify(config));
}

function normalizeAssetConfig(config = {}) {
  const base = cloneAssetConfig(DEFAULT_ASSET_CONFIG);
  const next = {
    ...base,
    ...config,
    sprites: { ...base.sprites, ...(config.sprites || {}) },
    dogs: { ...base.dogs, ...(config.dogs || {}) },
    background: { ...base.background, ...(config.background || {}) },
    effects: { ...base.effects, ...(config.effects || {}) },
  };
  if (typeof next.effects.glyphs === "string") {
    next.effects.glyphs = next.effects.glyphs.split(",").map((item) => item.trim()).filter(Boolean);
  }
  if (!Array.isArray(next.effects.glyphs) || !next.effects.glyphs.length) {
    next.effects.glyphs = [...DEFAULT_ASSET_CONFIG.effects.glyphs];
  }
  next.effects.particleBoost = clamp(Number(next.effects.particleBoost) || 1, 0.5, 1.8);
  next.effects.waveCount = Math.round(clamp(Number(next.effects.waveCount) || DEFAULT_ASSET_CONFIG.effects.waveCount, 1, 8));
  return next;
}

function getAssetConfig() {
  if (game.online?.syncedAssetConfig) {
    return normalizeAssetConfig(game.online.syncedAssetConfig);
  }
  try {
    const stored = JSON.parse(localStorage.getItem(ASSET_CONFIG_KEY));
    if (stored) return normalizeAssetConfig(stored);
  } catch {}
  try {
    const legacySprites = JSON.parse(localStorage.getItem(SPRITE_EDITOR_KEY)) || {};
    if (Object.keys(legacySprites).length) return normalizeAssetConfig({ sprites: legacySprites });
  } catch {}
  return cloneAssetConfig(DEFAULT_ASSET_CONFIG);
}

function saveAssetConfig(config) {
  const normalized = normalizeAssetConfig(config);
  normalized.updatedAt = new Date().toISOString();
  localStorage.setItem(ASSET_CONFIG_KEY, JSON.stringify(normalized));
  applyAssetConfig(normalized);
}

function setAssetConfigStatus(message, kind = "info") {
  if (!el.assetConfigStatus) return;
  el.assetConfigStatus.textContent = message;
  el.assetConfigStatus.dataset.kind = kind;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function assetCapacityInfo(bytes) {
  if (bytes > 4 * 1024 * 1024) {
    return {
      risk: "danger",
      label: "Large",
      advice: "建议压缩图片或减少序列帧数量；浏览器本地存储可能接近上限。",
    };
  }
  if (bytes > 2 * 1024 * 1024) {
    return {
      risk: "warn",
      label: "Medium",
      advice: "建议把角色图控制在 512px 内，序列帧先做 3-6 帧测试。",
    };
  }
  return {
    risk: "ok",
    label: "OK",
    advice: "容量适合本地预览和 JSON 备份。",
  };
}

function updateAssetConfigSize(config = getAssetConfig()) {
  if (!el.assetConfigSize) return;
  const bytes = new Blob([JSON.stringify(config)]).size;
  const info = assetCapacityInfo(bytes);
  el.assetConfigSize.textContent = `Config size: ${formatBytes(bytes)} · ${info.label}`;
  el.assetConfigSize.dataset.risk = info.risk;
  if (el.assetConfigAdvice) {
    el.assetConfigAdvice.textContent = info.advice;
    el.assetConfigAdvice.dataset.risk = info.risk;
  }
}

function downloadAssetConfig() {
  const text = JSON.stringify(getAssetConfig(), null, 2);
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `gougou-assets-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setAssetConfigStatus("已下载 JSON 配置", "ok");
}

function applyAssetConfig(config = getAssetConfig()) {
  const normalized = normalizeAssetConfig(config);
  const effects = normalized.effects;
  document.documentElement.style.setProperty("--asset-wave-color", effects.waveColor);
  document.documentElement.style.setProperty("--asset-enemy-wave-color", effects.enemyWaveColor);
  if (normalized.background.image) {
    el.arena.style.backgroundImage = `linear-gradient(180deg, rgba(255,255,255,0.06), rgba(50,132,57,0.08)), url("${normalized.background.image}")`;
  } else {
    el.arena.style.backgroundImage = "";
  }
  if (el.assetBackgroundPreview) {
    setBackgroundDraft(normalized.background.image);
  }
}

function setBackgroundDraft(image = "") {
  if (!el.assetBackgroundPreview) return;
  el.assetBackgroundPreview.dataset.assetImage = image || "";
  el.assetBackgroundPreview.style.backgroundImage = image ? `url("${image}")` : "";
  if (el.assetBackgroundInput && !image) el.assetBackgroundInput.value = "";
}

function setWaveImageDraft(side, image = "") {
  const input = side === "enemy" ? el.assetEnemyWaveImageInput : el.assetWaveImageInput;
  if (!input) return;
  input.dataset.assetImage = image || "";
  if (!image) input.value = "";
}

function waveImageDraft(side) {
  const input = side === "enemy" ? el.assetEnemyWaveImageInput : el.assetWaveImageInput;
  return input?.dataset.assetImage || "";
}

function readImageFile(file, callback) {
  if (!file || !file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = (event) => callback(event.target.result);
  reader.readAsDataURL(file);
}

function readImageFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("Not an image file"));
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = () => reject(reader.error || new Error("Unable to read image"));
    reader.readAsDataURL(file);
  });
}

function effectDraftFromEditor() {
  return normalizeAssetConfig({
    effects: {
      waveColor: el.assetWaveColor?.value || DEFAULT_ASSET_CONFIG.effects.waveColor,
      enemyWaveColor: el.assetEnemyWaveColor?.value || DEFAULT_ASSET_CONFIG.effects.enemyWaveColor,
      waveImage: waveImageDraft("player") || getAssetConfig().effects.waveImage || "",
      enemyWaveImage: waveImageDraft("enemy") || getAssetConfig().effects.enemyWaveImage || "",
      glyphs: el.assetGlyphs?.value || DEFAULT_ASSET_CONFIG.effects.glyphs,
      particleBoost: Number(el.assetParticleBoost?.value || 1),
      waveCount: Number(el.assetWaveCount?.value || DEFAULT_ASSET_CONFIG.effects.waveCount),
    },
  }).effects;
}

function previewAssetEffect(side) {
  if (!el.assetEffectPreview) return;
  el.assetEffectPreview.innerHTML = "";
  const rect = el.assetEffectPreview.getBoundingClientRect();
  createImpactBurst(
    side,
    0.86,
    { x: rect.width / 2, y: rect.height / 2 },
    el.assetEffectPreview,
    effectDraftFromEditor(),
  );
}

function slotDraftAsset(state) {
  const wrapper = document.querySelector(`.sprite-slot[data-state="${state}"]`);
  const frames = JSON.parse(wrapper?.dataset.frames || "[]").filter(Boolean);
  const mode = wrapper?.querySelector(".slot-mode")?.value || "single";
  if (mode === "sequence" && frames.length > 1) {
    return { frames, fps: Number(wrapper.dataset.fps) || 8, loop: wrapper.dataset.loop !== "0" };
  }
  return frames[0] || DEFAULT_DOG_ASSETS[state];
}

function updateAssetBattlePreview(action = "happy") {
  if (!el.assetPreviewStage || !el.assetPreviewPlayer || !el.assetPreviewEnemy) return;
  const background = el.assetBackgroundPreview?.dataset.assetImage || getAssetConfig().background.image;
  el.assetPreviewStage.style.backgroundImage = background
    ? `linear-gradient(180deg, rgba(255,255,255,0.06), rgba(50,132,57,0.08)), url("${background}")`
    : "";
  const playerAsset = slotDraftAsset(action);
  const enemyAsset = assetsForDog(enemyDog()).happy;
  el.assetPreviewPlayer.src = spriteAssetFrames(playerAsset)[0] || DEFAULT_DOG_ASSETS[action];
  el.assetPreviewEnemy.src = spriteAssetFrames(enemyAsset)[0] || DEFAULT_DOG_ASSETS.happy;
}

function previewAssetBattle() {
  if (!el.assetPreviewStage || !el.assetPreviewPlayer) return;
  updateAssetBattlePreview("bark");
  el.assetPreviewPlayer.classList.remove("bark");
  void el.assetPreviewPlayer.offsetWidth;
  el.assetPreviewPlayer.classList.add("bark");
  const rect = el.assetPreviewStage.getBoundingClientRect();
  createImpactBurst(
    "player",
    0.78,
    { x: rect.width * 0.34, y: rect.height * 0.48 },
    el.assetPreviewStage,
    effectDraftFromEditor(),
  );
  window.setTimeout(() => {
    el.assetPreviewPlayer.classList.remove("bark");
    updateAssetBattlePreview("happy");
  }, 460);
}

function getCustomSprites(dogId = "") {
  const config = getAssetConfig();
  return (dogId && config.dogs?.[dogId]) || config.sprites || {};
}

function saveCustomSprites(map, dogId = "") {
  const config = getAssetConfig();
  if (dogId) {
    config.dogs ||= {};
    config.dogs[dogId] = map || {};
  } else {
    config.sprites = map || {};
  }
  saveAssetConfig(config);
}

function assetsForDog(dog) {
  const custom = getCustomSprites(dog?.id);
  // 优先用 localStorage 自定义图片，没有则用默认
  return {
    happy: custom.happy || DEFAULT_DOG_ASSETS.happy,
    bark:  custom.bark  || DEFAULT_DOG_ASSETS.bark,
    dead:  custom.dead  || DEFAULT_DOG_ASSETS.dead,
  };
}

// 加载当前自定义精灵到编辑器 UI
function editorDogId() {
  return el.assetDogSelect?.value || game.selectedDogId || DOGS[0].id;
}

function editorDog() {
  return DOGS.find((dog) => dog.id === editorDogId()) || currentDog();
}

function populateAssetDogSelect() {
  if (!el.assetDogSelect) return;
  const previous = el.assetDogSelect.value || game.selectedDogId;
  el.assetDogSelect.innerHTML = DOGS.map((dog) => `<option value="${dog.id}">${dog.name}</option>`).join("");
  el.assetDogSelect.value = DOGS.some((dog) => dog.id === previous) ? previous : game.selectedDogId;
}

function loadSpriteEditorUI() {
  const config = getAssetConfig();
  populateAssetDogSelect();
  const custom = getCustomSprites(editorDogId());
  for (const state of ["happy", "bark", "dead"]) {
    renderSpriteSlot(state, custom[state] || DEFAULT_DOG_ASSETS[state], Boolean(custom[state]));
  }
  if (el.assetBackgroundPreview) {
    setBackgroundDraft(config.background.image);
  }
  if (el.assetWaveColor) el.assetWaveColor.value = config.effects.waveColor;
  if (el.assetEnemyWaveColor) el.assetEnemyWaveColor.value = config.effects.enemyWaveColor;
  setWaveImageDraft("player", config.effects.waveImage || "");
  setWaveImageDraft("enemy", config.effects.enemyWaveImage || "");
  if (el.assetGlyphs) el.assetGlyphs.value = config.effects.glyphs.join(",");
  if (el.assetParticleBoost) el.assetParticleBoost.value = config.effects.particleBoost;
  if (el.assetWaveCount) el.assetWaveCount.value = config.effects.waveCount;
  if (el.assetConfigText) el.assetConfigText.value = JSON.stringify(config, null, 2);
  updateAssetConfigSize(config);
  updateAssetBattlePreview();
}

function openSpriteEditor() {
  loadSpriteEditorUI();
  el.spriteEditorModal?.classList.remove("hidden");
}

function closeSpriteEditor() {
  el.spriteEditorModal?.classList.add("hidden");
}

// 将用户选择的文件转为 base64，写入对应 slot
function spriteSlotId(state) {
  return `slot${state.charAt(0).toUpperCase() + state.slice(1)}`;
}

function spriteAssetFrames(asset) {
  if (!asset) return [];
  if (typeof asset === "string") return [asset];
  if (Array.isArray(asset.frames)) return asset.frames.filter(Boolean);
  return [];
}

function renderSpriteSlot(state, asset, isCustom = true) {
  const slot = document.getElementById(spriteSlotId(state));
  if (!slot) return;
  const wrapper = slot.closest(".sprite-slot");
  const mode = wrapper.querySelector(".slot-mode");
  const meta = wrapper.querySelector(".slot-meta");
  const frames = spriteAssetFrames(asset);
  const displayFrames = frames.length ? frames : [DEFAULT_DOG_ASSETS[state]];
  const isSequence = typeof asset === "object" && frames.length > 1;
  slot.src = displayFrames[0];
  wrapper.dataset.frames = JSON.stringify(displayFrames);
  wrapper.dataset.custom = isCustom ? "1" : "";
  wrapper.dataset.fps = typeof asset === "object" && asset.fps ? String(asset.fps) : "8";
  wrapper.dataset.loop = typeof asset === "object" && asset.loop === false ? "0" : "1";
  wrapper.classList.toggle("has-image", isCustom);
  if (mode) mode.value = isSequence ? "sequence" : "single";
  if (meta) meta.textContent = `${displayFrames.length} frame${displayFrames.length > 1 ? "s" : ""}`;
}

async function handleSpriteFileInput(state, files) {
  const imageFiles = Array.from(files || []).filter((file) => file.type.startsWith("image/"));
  if (!imageFiles.length) return;
  const frames = await Promise.all(imageFiles.map(readImageFileAsDataUrl));
  renderSpriteSlot(state, frames.length > 1 ? { frames, fps: 8, loop: true } : frames[0], true);
  updateAssetBattlePreview();
  const bytes = new Blob(frames).size;
  const info = assetCapacityInfo(bytes);
  setAssetConfigStatus(`Loaded ${frames.length} frame${frames.length > 1 ? "s" : ""}: ${formatBytes(bytes)} · ${info.label}`, info.risk === "danger" ? "warn" : info.risk);
}

function spriteSlotAssetForSave(slot, state) {
  const wrapper = slot.closest(".sprite-slot");
  const frames = JSON.parse(wrapper.dataset.frames || "[]").filter(Boolean);
  const mode = wrapper.querySelector(".slot-mode")?.value || "single";
  if (mode !== "sequence" || frames.length < 2) return slot.src;
  return {
    frames,
    fps: Number(wrapper.dataset.fps) || 8,
    loop: wrapper.dataset.loop !== "0",
  };
}

function saveSpriteEditor() {
  const config = getAssetConfig();
  const custom = {};
  for (const state of ["happy", "bark", "dead"]) {
    const slot = document.getElementById(`slot${state.charAt(0).toUpperCase() + state.slice(1)}`);
    if (slot.src && !slot.src.includes(DEFAULT_DOG_ASSETS[state])) {
      // 只保存用户自定义的（非默认路径）
      const isDefault = Object.entries(DEFAULT_DOG_ASSETS).every(
        ([k, v]) => k === state || !slot.src.includes(v)
      );
      if (!isDefault || slot.src.startsWith("data:")) {
        custom[state] = spriteSlotAssetForSave(slot, state);
      }
    }
  }
  config.dogs ||= {};
  config.dogs[editorDogId()] = custom;
  config.background.image = el.assetBackgroundPreview ? (el.assetBackgroundPreview.dataset.assetImage || "") : config.background.image || "";
  config.effects.waveColor = el.assetWaveColor?.value || DEFAULT_ASSET_CONFIG.effects.waveColor;
  config.effects.enemyWaveColor = el.assetEnemyWaveColor?.value || DEFAULT_ASSET_CONFIG.effects.enemyWaveColor;
  config.effects.waveImage = waveImageDraft("player");
  config.effects.enemyWaveImage = waveImageDraft("enemy");
  config.effects.glyphs = (el.assetGlyphs?.value || "").split(",").map((item) => item.trim()).filter(Boolean);
  config.effects.particleBoost = Number(el.assetParticleBoost?.value || 1);
  config.effects.waveCount = Number(el.assetWaveCount?.value || DEFAULT_ASSET_CONFIG.effects.waveCount);
  saveAssetConfig(config);
  updateAssetConfigSize(getAssetConfig());
  updateAssetSyncStatus();
  // 立刻刷新当前角色的精灵
  const player = currentDog();
  sprites.player.setAssets(assetsForDog(player));
  const enemy = enemyDog();
  sprites.enemy.setAssets(assetsForDog(enemy));
  closeSpriteEditor();
}

function resetSpriteEditor() {
  localStorage.removeItem(ASSET_CONFIG_KEY);
  localStorage.removeItem(SPRITE_EDITOR_KEY);
  applyAssetConfig(DEFAULT_ASSET_CONFIG);
  loadSpriteEditorUI();
  updateAssetConfigSize(DEFAULT_ASSET_CONFIG);
  const player = currentDog();
  sprites.player.setAssets(assetsForDog(player));
  const enemy = enemyDog();
  sprites.enemy.setAssets(assetsForDog(enemy));
}

// ── 初始化 sprite editor 事件 ────────────────────────────
function initSpriteEditor() {
  const modal = el.spriteEditorModal;
  if (!modal) return;

  // 关闭按钮
  el.spriteEditorClose?.addEventListener("click", closeSpriteEditor);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeSpriteEditor();
  });
  el.assetTabs?.forEach((tab) => {
    tab.addEventListener("click", () => {
      const activeTab = tab.dataset.tab;
      el.assetTabs.forEach((item) => item.classList.toggle("active", item === tab));
      el.assetPanels.forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === activeTab));
    });
  });
  el.assetBackgroundInput?.addEventListener("change", () => {
    const file = el.assetBackgroundInput.files?.[0];
    readImageFile(file, (dataUrl) => {
      setBackgroundDraft(dataUrl);
      updateAssetBattlePreview();
    });
  });
  el.assetBackgroundClear?.addEventListener("click", () => {
    setBackgroundDraft("");
    updateAssetBattlePreview();
  });
  el.assetPreviewPlayerFx?.addEventListener("click", () => previewAssetEffect("player"));
  el.assetPreviewEnemyFx?.addEventListener("click", () => previewAssetEffect("enemy"));
  el.assetPreviewBattleBtn?.addEventListener("click", previewAssetBattle);
  el.assetWaveImageInput?.addEventListener("change", () => {
    const file = el.assetWaveImageInput.files?.[0];
    readImageFile(file, (dataUrl) => {
      setWaveImageDraft("player", dataUrl);
      previewAssetEffect("player");
    });
  });
  el.assetEnemyWaveImageInput?.addEventListener("change", () => {
    const file = el.assetEnemyWaveImageInput.files?.[0];
    readImageFile(file, (dataUrl) => {
      setWaveImageDraft("enemy", dataUrl);
      previewAssetEffect("enemy");
    });
  });
  el.assetWaveImageClear?.addEventListener("click", () => {
    setWaveImageDraft("player", "");
    previewAssetEffect("player");
  });
  el.assetEnemyWaveImageClear?.addEventListener("click", () => {
    setWaveImageDraft("enemy", "");
    previewAssetEffect("enemy");
  });
  el.assetWaveCount?.addEventListener("input", () => previewAssetEffect("player"));
  el.assetDogSelect?.addEventListener("change", loadSpriteEditorUI);
  el.assetExportBtn?.addEventListener("click", () => {
    if (el.assetConfigText) el.assetConfigText.value = JSON.stringify(getAssetConfig(), null, 2);
    updateAssetConfigSize();
    setAssetConfigStatus("已导出到文本框", "ok");
  });
  el.assetDownloadBtn?.addEventListener("click", downloadAssetConfig);
  el.assetImportBtn?.addEventListener("click", () => {
    try {
      const parsed = JSON.parse(el.assetConfigText?.value || "{}");
      const config = normalizeAssetConfig(parsed);
      saveAssetConfig(config);
      loadSpriteEditorUI();
      updateAssetConfigSize(config);
      updateAssetSyncStatus();
      sprites.player.setAssets(assetsForDog(currentDog()));
      sprites.enemy.setAssets(assetsForDog(enemyDog()));
      setAssetConfigStatus("导入成功，已应用配置", "ok");
    } catch {
      setAssetConfigStatus("JSON 格式错误，未覆盖当前配置", "error");
    }
  });

  // 文件上传
  for (const state of ["happy", "bark", "dead"]) {
    const input = modal.querySelector(`.slot-input[data-state="${state}"]`);
    input?.addEventListener("change", () => {
      if (input.files?.length) handleSpriteFileInput(state, input.files);
    });

    const uploadBtn = modal.querySelector(`.slot-upload[data-state="${state}"]`);
    uploadBtn?.addEventListener("click", (event) => {
      event.stopPropagation();
      input?.click();
    });

    const mode = modal.querySelector(`.slot-mode[data-state="${state}"]`);
    mode?.addEventListener("click", (event) => event.stopPropagation());
    mode?.addEventListener("change", () => {
      const slot = document.getElementById(spriteSlotId(state));
      const wrapper = slot.closest(".sprite-slot");
      const meta = wrapper.querySelector(".slot-meta");
      const frames = JSON.parse(wrapper.dataset.frames || "[]").filter(Boolean);
      if (mode.value === "single" && frames.length) {
        wrapper.dataset.frames = JSON.stringify([frames[0]]);
        slot.src = frames[0];
        if (meta) meta.textContent = "1 frame";
      } else if (meta) {
        meta.textContent = `${frames.length || 1} frame${frames.length > 1 ? "s" : ""}`;
      }
      updateAssetBattlePreview();
    });

    // 清除按钮
    const clearBtn = modal.querySelector(`.slot-clear[data-state="${state}"]`);
    clearBtn?.addEventListener("click", () => {
      renderSpriteSlot(state, DEFAULT_DOG_ASSETS[state], false);
      updateAssetBattlePreview();
      const input2 = modal.querySelector(`.slot-input[data-state="${state}"]`);
      if (input2) input2.value = "";
    });

    // 拖拽支持
    const slotEl = modal.querySelector(`.sprite-slot[data-state="${state}"]`);
    slotEl?.addEventListener("dragover", (e) => { e.preventDefault(); slotEl.classList.add("drag-over"); });
    slotEl?.addEventListener("dragleave", () => slotEl.classList.remove("drag-over"));
    slotEl?.addEventListener("drop", (e) => {
      e.preventDefault();
      slotEl.classList.remove("drag-over");
      if (e.dataTransfer.files?.length) handleSpriteFileInput(state, e.dataTransfer.files);
    });
  }

  el.spriteEditorBtn?.addEventListener("click", openSpriteEditor);
  el.spriteSaveBtn?.addEventListener("click", saveSpriteEditor);
  el.spriteResetBtn?.addEventListener("click", resetSpriteEditor);
}

// 主初始化入口末尾调用 initSpriteEditor()

const sprites = {
  player: new StaticDogSprite({
    dog: el.playerDog,
    image: el.playerSprite,
    assets: DEFAULT_DOG_ASSETS,
  }),
  enemy: new StaticDogSprite({
    dog: el.enemyDog,
    image: el.enemySprite,
    assets: DEFAULT_DOG_ASSETS,
  }),
};

function setOnlineStatus(text) {
  if (el.onlineStatus) el.onlineStatus.textContent = text;
}

function updateOnlineLobbyUI(statusText = "") {
  const localDog = currentDog();
  const remoteDog = DOGS.find((dog) => dog.id === game.online.remoteDogId);
  const hasRoom = Boolean(game.online.roomId);
  const connected = Boolean(game.online.connected);
  const isHost = game.online.role === "host";

  if (el.localPlayerName) el.localPlayerName.textContent = game.online.role ? (isHost ? "房主" : "你") : "你";
  if (el.localPlayerDog) el.localPlayerDog.textContent = localDog.name;
  if (el.localReadyState) {
    el.localReadyState.textContent = hasRoom ? (game.online.localReady ? "已准备" : "已进房") : "未进入房间";
  }
  if (el.remotePlayerName) el.remotePlayerName.textContent = connected ? (isHost ? "朋友" : "房主") : "等待加入";
  if (el.remotePlayerDog) el.remotePlayerDog.textContent = connected ? (remoteDog?.name || "已选择") : "--";
  if (el.remoteReadyState) {
    el.remoteReadyState.textContent = connected ? (game.online.remoteReady ? "已准备" : "已连接") : "未连接";
  }
  if (el.roomStateBadge) {
    el.roomStateBadge.textContent = connected ? "已连接" : hasRoom ? "等待中" : "好友房间";
  }
  updateAssetSyncStatus();
  if (statusText) setOnlineStatus(statusText);
  if (el.hostOnlineBtn) el.hostOnlineBtn.disabled = hasRoom;
  if (el.joinOnlineBtn) el.joinOnlineBtn.disabled = hasRoom;
  if (el.copySignalBtn) el.copySignalBtn.disabled = !hasRoom;
  if (el.leaveOnlineBtn) el.leaveOnlineBtn.disabled = !hasRoom;
  if (el.onlineEnterBtn) el.onlineEnterBtn.disabled = !connected;
}

function updateAssetSyncStatus() {
  if (!el.assetSyncStatus) return;
  const pack = onlineAssetPack();
  const hasRoom = Boolean(game.online.roomId);
  if (game.online.role === "guest") {
    if (game.online.syncedAssetConfig) {
      el.assetSyncStatus.textContent = `Asset pack: synced host ${game.online.syncedAssetHash.slice(0, 8)} · ${formatBytes(pack.bytes)}`;
      el.assetSyncStatus.dataset.state = "synced";
    } else {
      el.assetSyncStatus.textContent = "Asset pack: waiting for host";
      el.assetSyncStatus.dataset.state = "waiting";
    }
    return;
  }
  el.assetSyncStatus.textContent = `Asset pack: local ${pack.hash.slice(0, 8)} · ${formatBytes(pack.bytes)}`;
  el.assetSyncStatus.dataset.state = hasRoom ? "synced" : "local";
}

function enterOnlineBattle() {
  if (!game.online.connected) {
    updateOnlineLobbyUI("请先创建或加入房间");
    setOnlineStatus("请先创建或加入房间");
    return;
  }
  showBattle();
}

function setMode(mode) {
  game.mode = mode;
  el.aiModeBtn?.classList.toggle("active", mode === "ai");
  el.onlineModeBtn?.classList.toggle("active", mode === "online");
  el.onlineBox?.classList.toggle("hidden", mode !== "online");
  el.selectScreen?.classList.toggle("online-select", mode === "online");
  el.confirmDogBtn.classList.toggle("hidden", mode === "online");
  updateOnlineLobbyUI(mode === "online" ? "选择创建或加入房间" : "");
  el.confirmDogBtn.textContent = mode === "online" ? "进入联网对战" : "开始对战";
}

function closeOnlineConnection() {
  game.online.socket?.close?.();
  Object.assign(game.online, {
    role: "",
    peer: null,
    channel: null,
    socket: null,
    connected: false,
    localReady: false,
    remoteReady: false,
    roundStarting: false,
    remoteDogId: "golden",
    roomId: "",
    sessionId: "",
    syncedAssetConfig: null,
    syncedAssetHash: "",
  });
  if (el.roomCode) el.roomCode.value = "";
  updateOnlineLobbyUI("选择创建或加入房间");
  setOnlineStatus("未连接");
}

const ROOM_SERVER_URL = "wss://gougou.8.220.135.31.sslip.io/ws";

function roomSocketUrl() {
  if (location.hostname === "gougou.8.220.135.31.sslip.io") {
    return `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`;
  }
  return ROOM_SERVER_URL;
}

function roomInviteUrl(roomId = game.online.roomId) {
  const url = new URL(location.href);
  url.searchParams.set("room", roomId);
  return url.toString();
}

function updateRoomUrl(roomId = game.online.roomId) {
  if (!roomId || !history.replaceState) return;
  history.replaceState(null, "", roomInviteUrl(roomId));
}

function applyRoomFromUrl() {
  const roomId = new URLSearchParams(location.search).get("room");
  if (!roomId) return;
  setMode("online");
  if (el.roomCode) el.roomCode.value = roomId.trim();
  updateOnlineLobbyUI("已填入邀请房间号，点击加入房间");
}

function sendRoomCommand(type, payload = {}) {
  const socket = game.online.socket;
  if (!socket || socket.readyState !== WebSocket.OPEN) return false;
  socket.send(JSON.stringify({ type, payload, at: Date.now() }));
  return true;
}

function hashText(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function onlineAssetPack() {
  const config = getAssetConfig();
  const text = JSON.stringify(config);
  const bytes = new Blob([text]).size;
  return {
    kind: config.kind,
    schemaVersion: config.schemaVersion,
    hash: hashText(text),
    bytes,
    config,
  };
}

function onlinePlayerPayload(extra = {}) {
  return {
    dogId: game.selectedDogId,
    name: currentDog().name,
    role: game.online.role,
    assetPack: onlineAssetPack(),
    ...extra,
  };
}

function applySyncedAssetPack(pack, senderRole = "") {
  if (!pack?.config || game.online.role !== "guest" || senderRole !== "host") return false;
  if (pack.hash && pack.hash === game.online.syncedAssetHash) return false;
  game.online.syncedAssetConfig = normalizeAssetConfig(pack.config);
  game.online.syncedAssetHash = pack.hash || hashText(JSON.stringify(game.online.syncedAssetConfig));
  applyAssetConfig(game.online.syncedAssetConfig);
  sprites.player.setAssets(assetsForDog(currentDog()));
  sprites.enemy.setAssets(assetsForDog(enemyDog()));
  updateOnlineLobbyUI(`已同步房主资源包 ${formatBytes(pack.bytes || 0)}`);
  return true;
}

function handleRoomMessage(message) {
  const { type, payload = {} } = message;
  if (type === "connected") return;
  if (type === "created" || type === "joined") {
    game.online.role = payload.role || game.online.role;
    game.online.roomId = payload.roomId || game.online.roomId;
    game.online.connected = type === "joined";
    game.online.localReady = false;
    game.online.remoteReady = false;
    if (el.roomCode) el.roomCode.value = game.online.roomId;
    updateRoomUrl(game.online.roomId);
    setOnlineStatus(type === "created" ? "等待朋友加入" : "已连接，可以进入对战");
    updateOnlineLobbyUI(type === "created" ? "房间已创建，复制邀请给朋友" : "已连接，可以进入战斗场地");
    if (type === "joined") {
      sendOnlineMessage("hello", onlinePlayerPayload());
    }
    return;
  }
  if (type === "peer-joined") {
    game.online.connected = true;
    game.online.remoteReady = false;
    updateOnlineLobbyUI("朋友已加入，可以进入战斗场地");
    setOnlineStatus("已连接，可以进入对战");
    sendOnlineMessage("hello", onlinePlayerPayload());
    return;
  }
  if (type === "peer-left" || type === "room-expired") {
    game.online.connected = false;
    game.online.remoteReady = false;
    updateOnlineLobbyUI(payload.message || "对方已离开房间");
    setOnlineStatus(payload.message || "对方已离开");
    return;
  }
  if (type === "room") {
    const peers = payload.players || [];
    const local = peers.find((player) => player.role === game.online.role);
    const remote = peers.find((player) => player.role !== game.online.role);
    if (local) game.online.localReady = Boolean(local.ready);
    game.online.remoteReady = Boolean(remote?.ready);
    game.online.connected = peers.length >= 2;
    if (remote?.dogId) game.online.remoteDogId = remote.dogId;
    updateOnlineLobbyUI();
    return;
  }
  if (type === "relay") {
    handleOnlineMessage({ type: payload.type, payload: payload.payload || {} });
    return;
  }
  if (type === "error") {
    setOnlineStatus(payload.message || "联网失败");
  }
}

function connectRoomServer() {
  return new Promise((resolve, reject) => {
    closeOnlineConnection();
    const socket = new WebSocket(roomSocketUrl());
    game.online.socket = socket;
    const timer = window.setTimeout(() => {
      reject(new Error("连接服务器超时"));
      socket.close();
    }, 10000);
    socket.addEventListener("open", () => {
      window.clearTimeout(timer);
      resolve(socket);
    }, { once: true });
    socket.addEventListener("message", (event) => {
      try {
        handleRoomMessage(JSON.parse(event.data));
      } catch {
        setOnlineStatus("服务器消息无效");
      }
    });
    socket.addEventListener("close", () => {
      game.online.connected = false;
      game.online.remoteReady = false;
      updateOnlineLobbyUI("服务器连接已关闭");
      setOnlineStatus("服务器连接关闭");
    });
    socket.addEventListener("error", () => {
      updateOnlineLobbyUI("服务器连接失败，请重试");
      setOnlineStatus("服务器连接失败");
    });
  });
}

function sendOnlineMessage(type, payload = {}) {
  return sendRoomCommand(type, payload);
}

async function createOnlineRoom() {
  setMode("online");
  updateOnlineLobbyUI("正在连接服务器...");
  setOnlineStatus("连接服务器中");
  await connectRoomServer();
  sendRoomCommand("create", { dogId: game.selectedDogId });
}

async function joinOnlineRoom() {
  setMode("online");
  updateOnlineLobbyUI("正在连接服务器...");
  const roomId = el.roomCode?.value.trim();
  if (!roomId) throw new Error("请输入房间号");
  setOnlineStatus("连接服务器中");
  await connectRoomServer();
  setOnlineStatus("加入房间中");
  sendRoomCommand("join", { roomId, dogId: game.selectedDogId });
}

function leaveOnlineRoom() {
  sendRoomCommand("leave");
  closeOnlineConnection();
  updateOnlineLobbyUI("已离开房间");
}

function handleOnlineMessage(message) {
  const { type, payload = {} } = message;
  applySyncedAssetPack(payload.assetPack, payload.role);
  if (type === "hello" || type === "dog") {
    game.online.remoteDogId = payload.dogId || game.online.remoteDogId;
    updateOnlineLobbyUI();
    if (game.mode === "online" && !el.battleScreen.classList.contains("hidden")) {
      chooseEnemyForMatch();
      const enemy = enemyDog();
      sprites.enemy.setAssets(assetsForDog(enemy));
      el.enemyName.textContent = `${enemy.name} P2P →`;
    }
    return;
  }

  if (type === "ready") {
    game.online.remoteReady = true;
    updateOnlineLobbyUI("对方已准备");
    setOnlineStatus("对方已准备");
    if (game.online.role === "host" && game.online.localReady && !game.online.roundStarting) {
      beginOnlineRound(true);
    }
    return;
  }

  if (type === "start") {
    beginOnlineRound(false);
    return;
  }

  if (type === "attack") {
    applyRemoteAttack(payload);
    return;
  }

  if (type === "end") {
    const result = payload.result === "win" ? "lose" : payload.result === "lose" ? "win" : "draw";
    endGame(result, false);
  }
}

function applyRemoteAttack({ amount = 8, power = 0.5, critical = false } = {}) {
  if (!game.running) return;
  const pushAmount = clamp(Number(amount) || 8, BALANCE.enemyPushMin, BALANCE.playerPushMax);
  triggerDog(el.enemyDog, "attack", 300);
  triggerDog(el.playerDog, "hit", 340);
  playDogAction("enemy", "attack", 300);
  addWave("enemy", critical ? 1 : clamp(power, 0.35, 1));
  addPushText("enemy", pushAmount, critical);
  showBarkCallout("enemy", critical);
  pushBattle("enemy", pushAmount);
  playRandomAiBark({ pitch: enemyDog().barkPitch, volume: critical ? 0.38 : 0.28, growl: critical });
  if (critical || pushAmount >= 14) shakeArena(critical);
}

function normalizeBattleStats(stats = {}) {
  return {
    wins: Number(stats.wins) || 0,
    losses: Number(stats.losses) || 0,
    draws: Number(stats.draws) || 0,
    bestStreak: Number(stats.bestStreak) || 0,
    recent: Array.isArray(stats.recent) ? stats.recent.slice(0, 5) : [],
  };
}

function renderBattleStats() {
  if (!el.battleStatsSummary || !el.battleStatsRecent) return;
  const stats = normalizeBattleStats(game.stats);
  el.battleStatsSummary.textContent = `${stats.wins}W / ${stats.losses}L / ${stats.draws}D · Best ${stats.bestStreak}`;
  el.battleStatsRecent.textContent = stats.recent.length
    ? `Recent: ${stats.recent.map((item) => item.result.toUpperCase()).join(" · ")}`
    : "No battles yet";
}

function recordBattleResult(result, reward) {
  game.stats = normalizeBattleStats(game.stats);
  if (result === "win") game.stats.wins += 1;
  else if (result === "lose") game.stats.losses += 1;
  else game.stats.draws += 1;
  game.stats.bestStreak = Math.max(game.stats.bestStreak, game.winStreak);
  game.stats.recent.unshift({
    result,
    mode: game.mode,
    dogId: game.selectedDogId,
    enemyDogId: game.enemyDogId,
    reward,
    at: Date.now(),
  });
  game.stats.recent = game.stats.recent.slice(0, 5);
}

function resetBattleStats() {
  if (!window.confirm("Reset local battle stats? WP and unlocked dogs will stay.")) return;
  game.stats = normalizeBattleStats();
  saveGame();
  renderBattleStats();
}

function loadSave() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const save = JSON.parse(raw);
    game.wp = Number(save.wp) || 0;
    game.winStreak = Number(save.winStreak) || 0;
    game.unlocked = Array.isArray(save.unlocked) ? save.unlocked : ["shiba"];
    game.selectedDogId = save.selectedDogId || "shiba";
    game.matchIndex = Number(save.matchIndex) || 0;
    game.stats = normalizeBattleStats(save.stats);
  } catch {
    game.wp = 0;
    game.unlocked = ["shiba"];
    game.stats = normalizeBattleStats();
  }
}

function saveGame() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      wp: game.wp,
      winStreak: game.winStreak,
      unlocked: game.unlocked,
      selectedDogId: game.selectedDogId,
      matchIndex: game.matchIndex,
      stats: normalizeBattleStats(game.stats),
    }),
  );
}

function chooseEnemyForMatch() {
  if (game.mode === "online") {
    game.enemyDogId = game.online.remoteDogId || "golden";
    return;
  }
  const rotation = ["golden", "shiba", "fighter"];
  game.enemyDogId = rotation[game.matchIndex % rotation.length];
  if (game.enemyDogId === game.selectedDogId) {
    game.enemyDogId = rotation[(game.matchIndex + 1) % rotation.length];
  }
}

function loadSpriteAssets() {
  sprites.player.load();
  sprites.enemy.load();
}

function renderDogCards() {
  el.selectTitle.textContent = `选择你的狗 · 第 ${game.matchIndex + 1} 场${game.winStreak ? ` · 连胜 ${game.winStreak}` : ""}`;
  el.wpText.textContent = `WP ${game.wp}`;
  renderBattleStats();
  el.dogCards.innerHTML = "";
  for (const dog of DOGS) {
    const unlocked = game.unlocked.includes(dog.id);
    const affordable = game.wp >= dog.cost;
    const selected = dog.id === game.selectedDogId;
    const card = document.createElement("button");
    card.type = "button";
    card.className = `dog-card ${selected ? "selected" : ""} ${unlocked ? "" : "locked"}`;
    card.dataset.id = dog.id;
    const priceText = unlocked ? (selected ? "已出战" : "可出战") : affordable ? `${dog.cost} WP 解锁` : `${dog.cost} WP`;
    card.innerHTML = `
      <span class="card-preview"><img src="${dog.portrait}" alt="" /></span>
      <span class="card-heading">
        <strong>${dog.name}</strong>
        <span>${"★".repeat(dog.stars)}</span>
      </span>
      <small>${dog.description}</small>
      <span class="stat-row"><b>力量</b><i style="--value:${clamp(dog.power / 1.3, 0, 1)}"></i></span>
      <span class="stat-row"><b>耐力</b><i style="--value:${clamp(dog.stamina / 1.2, 0, 1)}"></i></span>
      <span class="stat-row"><b>宽容</b><i style="--value:${clamp(dog.tolerance / 1.2, 0, 1)}"></i></span>
      <em>${priceText}</em>
    `;
    card.addEventListener("click", () => {
      playUiClick();
      if (!unlocked) {
        if (!affordable) {
          pulseWp();
          return;
        }
        game.wp -= dog.cost;
        game.unlocked.push(dog.id);
        playUnlockSound();
      }
      game.selectedDogId = dog.id;
      saveGame();
      sendOnlineMessage("dog", onlinePlayerPayload({ dogId: dog.id, name: dog.name }));
      updateOnlineLobbyUI();
      renderDogCards();
    });
    el.dogCards.appendChild(card);
  }
}

function pulseWp() {
  el.wpText.classList.remove("pulse");
  void el.wpText.offsetWidth;
  el.wpText.classList.add("pulse");
}

function showSelect() {
  game.running = false;
  window.clearInterval(game.timerId);
  window.clearTimeout(game.aiId);
  el.selectScreen.classList.remove("hidden");
  el.battleScreen.classList.add("hidden");
  renderDogCards();
}

function showBattle() {
  if (game.mode === "online" && !game.online.connected) {
    setOnlineStatus("请先创建或加入房间");
    return;
  }
  el.selectScreen.classList.add("hidden");
  el.battleScreen.classList.remove("hidden");
  chooseEnemyForMatch();
  const player = currentDog();
  const enemy = enemyDog();
  sprites.player.setAssets(assetsForDog(player));
  sprites.enemy.setAssets(assetsForDog(enemy));
  el.playerName.textContent = `← ${player.name}`;
  el.enemyName.textContent = game.mode === "online" ? `${enemy.name} P2P →` : `${enemy.name} AI →`;
  sendOnlineMessage("dog", onlinePlayerPayload({ dogId: game.selectedDogId, name: player.name }));
  resetGame();
  if (game.mode === "online") {
    el.startBtn.disabled = false;
    el.startBtn.textContent = "准备开局";
    el.roundLabel.textContent = "P2P";
    el.countdown.textContent = "双方准备后开战";
    updateOnlineLobbyUI("已进入战斗场地，点击准备开局");
  }
}

function updateHud() {
  const playerShare = clamp(50 + game.push / 2, 0, 100);
  const enemyShare = 100 - playerShare;
  el.pushPlayer.style.width = `${playerShare}%`;
  el.pushEnemy.style.width = `${enemyShare}%`;
  el.pushMarker.style.left = `${playerShare}%`;
  el.timer.textContent = game.timeLeft;
  updateDogPositions();
  updateDangerFeedback();
}

function updateBarkStats() {
  if (!el.barkStats) return;
  el.barkStats.textContent = `${game.barkStats.accepted}/${game.barkStats.rejected} · T${BALANCE.barkThreshold.toFixed(2)}`;
}

function updateDogPositions() {
  const shift = clamp(game.push * 2.05, -190, 190);
  el.playerDog.style.setProperty("--dog-shift", `${shift}px`);
  el.enemyDog.style.setProperty("--dog-shift", `${shift}px`);
}

function updateDangerFeedback() {
  const danger = Math.abs(game.push);
  const playerLosing = game.push < -70;
  const enemyLosing = game.push > 70;
  el.arena.classList.toggle("near-ko", danger >= 70 && game.running);
  el.arena.classList.toggle("critical-ko", danger >= 88 && game.running);
  el.playerDog.classList.toggle("under-pressure", playerLosing);
  el.enemyDog.classList.toggle("under-pressure", enemyLosing);
  el.dangerLabel.className = `danger-label ${danger >= 70 && game.running ? "show" : ""} ${
    playerLosing ? "player-risk" : enemyLosing ? "enemy-risk" : ""
  }`;
}

function resetGame() {
  game.push = 0;
  game.timeLeft = BALANCE.roundSeconds;
  game.combo = 1;
  game.lastBarkAt = 0;
  game.playerCooldownUntil = 0;
  game.barkStats.accepted = 0;
  game.barkStats.rejected = 0;
  resetBarkSegment();
  game.barkDetector.previousLevel = 0;
  game.barkDetector.rejectedUntilQuiet = false;
  game.barkDetector.rejectionUntil = 0;
  game.barkDetector.lastSustainAt = 0;
  el.playerDog.className = "dog fighter player";
  el.enemyDog.className = "dog fighter enemy";
  el.playerDog.style.setProperty("--dog-shift", "0px");
  el.enemyDog.style.setProperty("--dog-shift", "0px");
  el.playerDog.classList.add("sprite-mode", "static-mode");
  el.enemyDog.classList.add("sprite-mode", "static-mode");
  sprites.player.play("happy");
  sprites.enemy.play("happy");
  el.combo.classList.remove("show");
  el.koPanel.classList.remove("show");
  el.arena.classList.remove("danger-wash", "near-ko", "critical-ko", "ko-win", "ko-lose", "ko-draw", "ko-impact");
  el.roundLabel.textContent = "READY";
  el.countdown.textContent = "";
  el.startBtn.textContent = "开始对战";
  updateHud();
  updateBarkStats();
}

function playTone(freq, duration = 0.12, type = "sine", volume = 0.05) {
  if (game.muted) return;
  game.toneContext ||= new AudioContext();
  const now = game.toneContext.currentTime;
  const osc = game.toneContext.createOscillator();
  const gain = game.toneContext.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.connect(gain).connect(game.toneContext.destination);
  osc.start(now);
  osc.stop(now + duration);
}

function playBarkSound({ pitch = 240, volume = 0.08, growl = false } = {}) {
  if (game.muted) return;
  game.toneContext ||= new AudioContext();
  const ctx = game.toneContext;
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(volume, now + 0.025);
  master.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
  master.connect(ctx.destination);

  const makeOsc = (freq, start, duration, type = "sawtooth") => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq * 1.25, now + start);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.72, now + start + duration);
    gain.gain.setValueAtTime(0.0001, now + start);
    gain.gain.exponentialRampToValueAtTime(1, now + start + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);
    osc.connect(gain).connect(master);
    osc.start(now + start);
    osc.stop(now + start + duration);
  };

  makeOsc(pitch, 0, 0.16);
  makeOsc(pitch * 1.38, 0.09, 0.13, "square");
  if (growl) makeOsc(pitch * 0.55, 0.02, 0.24, "sawtooth");
}

function playRandomAiBark({ pitch = 240, volume = 0.12, growl = false } = {}) {
  if (game.muted) return;
  const source = aiBarkPool[Math.floor(Math.random() * aiBarkPool.length)];
  if (!source) {
    playBarkSound({ pitch, volume, growl });
    return;
  }

  const bark = source.cloneNode();
  bark.volume = clamp(volume, 0.02, 1);
  bark.playbackRate = clamp(0.92 + Math.random() * 0.18 + (growl ? -0.06 : 0), 0.82, 1.16);
  bark.play().catch(() => playBarkSound({ pitch, volume, growl }));
}

function triggerDog(dog, className, duration = 360) {
  dog.classList.remove(className);
  void dog.offsetWidth;
  dog.classList.add(className);
  window.setTimeout(() => dog.classList.remove(className), duration);
}

function playDogAction(side, action, duration = 360) {
  const mappedAction = action === "attack" ? "bark" : action === "lose" ? "dead" : "happy";
  sprites[side]?.play(mappedAction, { lock: duration });
}

const DEFAULT_FX_GLYPHS = DEFAULT_ASSET_CONFIG.effects.glyphs;

function dogBurstPoint(side) {
  const dog = side === "player" ? el.playerDog : el.enemyDog;
  const dogRect = dog.getBoundingClientRect();
  const arenaRect = el.arena.getBoundingClientRect();
  return {
    x: dogRect.left + dogRect.width * 0.5 - arenaRect.left,
    y: dogRect.top + dogRect.height * 0.48 - arenaRect.top,
  };
}

function createImpactBurst(side, intensity = 0.5, point = { x: 0, y: 0 }, container = el.fxLayer, effects = getAssetConfig().effects) {
  const strength = clamp(intensity, 0.25, 1);
  const glyphs = effects.glyphs?.length ? effects.glyphs : DEFAULT_FX_GLYPHS;
  const particleBoost = clamp(Number(effects.particleBoost) || 1, 0.5, 1.8);
  const group = document.createElement("div");
  group.className = `impact-burst ${side}-burst`;
  group.style.left = `${point.x}px`;
  group.style.top = `${point.y}px`;
  group.style.setProperty("--power", strength.toFixed(2));
  group.style.setProperty("--wave-size", `${150 + strength * 250}px`);
  group.style.setProperty("--wave-border", `${7 + strength * 8}px`);
  group.style.setProperty("--wave-opacity", `${0.74 + strength * 0.22}`);
  group.style.setProperty("--wave-scale", `${1.72 + strength * 1.1}`);
  group.style.setProperty("--wave-color", side === "enemy" ? effects.enemyWaveColor : effects.waveColor);
  const waveImage = side === "enemy" ? effects.enemyWaveImage : effects.waveImage;
  const baseWaveCount = Math.round(clamp(Number(effects.waveCount) || DEFAULT_ASSET_CONFIG.effects.waveCount, 1, 8));
  const waveCount = Math.round(clamp(baseWaveCount + strength * 1.5, 1, 10));
  for (let index = 0; index < waveCount; index += 1) {
    const wave = document.createElement("span");
    wave.className = `${index % 2 ? "wide-wave soft-ring" : "wide-wave hard-ring"}${waveImage ? " image-ring" : ""}`;
    wave.style.setProperty("--i", index);
    wave.style.setProperty("--tilt", `${-10 + Math.random() * 20}deg`);
    wave.style.setProperty("--spin", `${(Math.random() < 0.5 ? -1 : 1) * (80 + Math.random() * 220)}deg`);
    wave.style.setProperty("--oval", `${0.82 + Math.random() * 0.18}`);
    if (waveImage) wave.style.setProperty("--wave-image", `url("${waveImage}")`);
    group.appendChild(wave);
  }
  const particleCount = Math.round((7 + strength * 18) * particleBoost);
  for (let index = 0; index < particleCount; index += 1) {
    const spark = document.createElement("span");
    const asGlyph = Math.random() < 0.72;
    const angle = Math.random() * Math.PI * 2;
    const distance = 54 + Math.random() * (130 + strength * 190);
    const lift = -24 + Math.random() * 48;
    spark.className = asGlyph ? "impact-glyph" : index % 2 ? "impact-spark star" : "impact-spark bolt";
    if (asGlyph) spark.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
    spark.style.setProperty("--x", `${-18 + Math.random() * 36}px`);
    spark.style.setProperty("--y", `${-18 + Math.random() * 36}px`);
    spark.style.setProperty("--r", `${-80 + Math.random() * 160}deg`);
    spark.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
    spark.style.setProperty("--dy", `${Math.sin(angle) * distance + lift}px`);
    spark.style.setProperty("--delay", `${Math.random() * 120}ms`);
    spark.style.setProperty("--hue", `${28 + Math.random() * 34}deg`);
    spark.style.setProperty("--size", `${22 + Math.random() * 34 * strength}px`);
    group.appendChild(spark);
  }
  container.appendChild(group);
  window.setTimeout(() => group.remove(), 980);
  return group;
}

function addWave(side, intensity = 0.5) {
  createImpactBurst(side, intensity, dogBurstPoint(side), el.fxLayer);
}

function addPushText(side, amount, critical = false) {
  const damage = document.createElement("span");
  damage.className = `damage ${side === "player" ? "enemy-damage" : "player-damage"}`;
  damage.textContent = critical ? `+${amount}!` : `+${amount}`;
  el.fxLayer.appendChild(damage);
  window.setTimeout(() => damage.remove(), 760);
}

function showCombo() {
  el.combo.textContent = `COMBO x${game.combo}`;
  el.combo.classList.add("show");
  window.clearTimeout(showCombo.hideId);
  showCombo.hideId = window.setTimeout(() => el.combo.classList.remove("show"), 720);
}

function showBarkCallout(side, critical = false) {
  el.barkCallout.textContent = critical ? "叫!!!" : "叫!";
  el.barkCallout.className = `bark-callout show ${side} ${critical ? "critical" : ""}`;
  window.clearTimeout(showBarkCallout.hideId);
  showBarkCallout.hideId = window.setTimeout(() => {
    el.barkCallout.classList.remove("show", "player", "enemy", "critical");
  }, 520);
}

function shakeArena(strong = false) {
  el.arena.classList.remove("screen-shake", "heavy-shake");
  void el.arena.offsetWidth;
  el.arena.classList.add(strong ? "heavy-shake" : "screen-shake");
  window.setTimeout(() => el.arena.classList.remove("screen-shake", "heavy-shake"), strong ? 360 : 220);
}

function pushBattle(side, amount) {
  const direction = side === "player" ? 1 : -1;
  game.push = clamp(game.push + direction * amount, -100, 100);
  updateHud();
  checkEnd();
}

function playPlayerHitFeedback(power, critical = false) {
  const pitch = critical ? 660 : 360 + power * 260;
  playTone(pitch, critical ? 0.11 : 0.075, critical ? "triangle" : "square", critical ? 0.055 : 0.032);
  if (critical) {
    window.setTimeout(() => playTone(880, 0.08, "triangle", 0.04), 70);
  }
}

function playUiClick() {
  playTone(520, 0.045, "triangle", 0.026);
}

function playUnlockSound() {
  playTone(620, 0.08, "triangle", 0.045);
  window.setTimeout(() => playTone(840, 0.1, "triangle", 0.045), 80);
}

function playWinSound() {
  [740, 920, 1120].forEach((freq, index) => {
    window.setTimeout(() => playTone(freq, 0.14, "triangle", 0.055), index * 120);
  });
}

function playLoseSound() {
  playTone(220, 0.18, "sine", 0.05);
  window.setTimeout(() => playTone(160, 0.22, "sine", 0.045), 150);
}

function playerAttack(power) {
  const now = performance.now();
  if (!game.running || now < game.playerCooldownUntil) return;

  const player = currentDog();
  const closeCombo = now - game.lastBarkAt < BALANCE.comboWindow;
  game.combo = closeCombo ? clamp(game.combo + 1, 1, BALANCE.maxCombo) : 1;
  game.lastBarkAt = now;
  game.playerCooldownUntil = now + Math.round(BALANCE.cooldownBase / player.stamina);

  const tired = game.combo >= BALANCE.tiredCombo;
  const critical = power > clamp(BALANCE.hotThreshold / player.crit, 0.55, 0.82);
  const base = Math.round((4 + power * 12) * player.power);
  const pushAmount = clamp(
    Math.round(base * (1 + (game.combo - 1) * 0.14)),
    BALANCE.playerPushMin,
    BALANCE.playerPushMax,
  );

  triggerDog(el.playerDog, "attack", 300);
  triggerDog(el.enemyDog, "hit", 340);
  playDogAction("player", "attack", tired ? 520 : 300);
  addWave("player", critical ? 1 : power);
  addPushText("player", pushAmount, critical);
  showBarkCallout("player", critical);
  showCombo();
  const appliedPush = tired ? Math.round(pushAmount * BALANCE.tiredPenalty) : pushAmount;
  pushBattle("player", appliedPush);
  if (game.mode === "online") {
    sendOnlineMessage("attack", { amount: appliedPush, power, critical });
  }
  playPlayerHitFeedback(power, critical);
  if (critical || pushAmount >= 18) shakeArena(critical || pushAmount >= 24);
}

function enemyAttack() {
  if (!game.running) return;
  const enemy = enemyDog();
  const pressureBoost = game.push > 55 ? 1.08 : game.push < -55 ? 0.92 : 1;
  const pushAmount = clamp(
    Math.round((5 + Math.random() * 8) * enemy.power * pressureBoost),
    BALANCE.enemyPushMin,
    BALANCE.enemyPushMax,
  );
  const critical = pushAmount > 12;
  triggerDog(el.enemyDog, "attack", 300);
  triggerDog(el.playerDog, "hit", 340);
  playDogAction("enemy", "attack", 300);
  addWave("enemy", clamp(pushAmount / 18, 0.35, 1));
  addPushText("enemy", pushAmount, critical);
  showBarkCallout("enemy", critical);
  pushBattle("enemy", pushAmount);
  playRandomAiBark({ pitch: enemy.barkPitch, volume: critical ? 0.42 : 0.32, growl: critical });
  playTone(220 + Math.random() * 80, 0.13, "sawtooth", 0.04);
  if (critical || pushAmount >= 14) shakeArena(critical);
}

function scheduleAi() {
  window.clearTimeout(game.aiId);
  if (!game.running) return;
  const [minDelay, maxDelay] = enemyDog().aiDelay;
  const pressureDelay = game.push > 55 ? -260 : game.push < -55 ? 280 : 0;
  const delay = clamp(minDelay + Math.random() * (maxDelay - minDelay) + pressureDelay, 1200, 4600);
  game.aiId = window.setTimeout(() => {
    enemyAttack();
    scheduleAi();
  }, delay);
}

async function setupMic() {
  if (game.analyser) return;
  if (location.protocol === "file:") {
    throw new Error("请用 http://127.0.0.1:5173/ 打开，file 模式不能使用麦克风");
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("当前浏览器或页面环境不支持麦克风输入");
  }
  game.micStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: false,
    },
  });
  game.audioContext = new AudioContext();
  const source = game.audioContext.createMediaStreamSource(game.micStream);
  game.analyser = game.audioContext.createAnalyser();
  game.analyser.fftSize = 1024;
  game.data = new Uint8Array(game.analyser.fftSize);
  source.connect(game.analyser);
}

function readMic() {
  if (!game.analyser) return 0;
  game.analyser.getByteTimeDomainData(game.data);
  let sum = 0;
  for (const sample of game.data) {
    const normalized = (sample - 128) / 128;
    sum += normalized * normalized;
  }
  return Math.sqrt(sum / game.data.length);
}

function updateMicFeedback(level, active, tired) {
  el.micPanel?.style.setProperty("--mic-level", level.toFixed(2));
  el.micPanel?.classList.toggle("mic-active", active);
  el.micPanel?.classList.toggle("mic-hot", level > BALANCE.hotThreshold);
  el.micPanel?.classList.toggle("mic-tired", tired);
  el.micPanel?.classList.toggle("mic-rejected", performance.now() < game.barkDetector.rejectionUntil);
}

function resetBarkSegment() {
  Object.assign(game.barkDetector, {
    active: false,
    startAt: 0,
    peak: 0,
    sum: 0,
    samples: 0,
    lowFrames: 0,
  });
}

function rejectBark(reason, hold = 520) {
  game.barkDetector.rejection = reason;
  game.barkDetector.rejectionUntil = performance.now() + hold;
  game.barkStats.rejected += 1;
  updateBarkStats();
  resetBarkSegment();
  return { accepted: false, rejected: true, reason };
}

function analyzeBarkSegment(now) {
  const detector = game.barkDetector;
  const dog = currentDog();
  const minPeak = BALANCE.barkMinPeak / dog.tolerance;
  const minAverage = BALANCE.barkMinAverage / dog.tolerance;
  const duration = now - detector.startAt;
  const average = detector.samples ? detector.sum / detector.samples : 0;
  const sinceLast = now - detector.lastAcceptedAt;
  const peak = detector.peak;

  if (duration < BALANCE.barkMinDuration) return rejectBark("敲击太短");
  if (duration > BALANCE.barkMaxDuration) return rejectBark("拖太长了");
  if (peak < minPeak || average < minAverage) return rejectBark("不像汪汪");
  if (sinceLast < BALANCE.barkMinGap) return rejectBark("太急了", 300);

  detector.lastAcceptedAt = now;
  game.barkStats.accepted += 1;
  updateBarkStats();
  const shapeScore = clamp((duration - BALANCE.barkMinDuration) / 260, 0, 1);
  const peakScore = clamp((peak - BALANCE.barkMinPeak) / (1 - BALANCE.barkMinPeak), 0, 1);
  const averageScore = clamp((average - BALANCE.barkMinAverage) / 0.45, 0, 1);
  const power = clamp(0.35 + peakScore * 0.45 + averageScore * 0.25 + shapeScore * 0.12, 0.32, 1);
  resetBarkSegment();
  return { accepted: true, power, duration, peak, average };
}

function acceptSustainedBark(now, level) {
  const detector = game.barkDetector;
  detector.lastAcceptedAt = now;
  detector.lastSustainAt = now;
  game.barkStats.accepted += 1;
  updateBarkStats();
  const power = clamp(0.28 + level * 0.42 + detector.peak * 0.2, 0.34, 0.82);
  Object.assign(detector, {
    active: true,
    startAt: now,
    peak: level,
    sum: level,
    samples: 1,
    lowFrames: 0,
  });
  return { accepted: true, sustained: true, power };
}

function detectBark(level, now) {
  const detector = game.barkDetector;
  const threshold = BALANCE.barkThreshold / currentDog().tolerance;
  const instantRise = level - detector.previousLevel;
  detector.previousLevel = level;

  if (detector.rejectedUntilQuiet) {
    if (level < BALANCE.barkEndThreshold) detector.rejectedUntilQuiet = false;
    return { accepted: false };
  }

  if (!detector.active) {
    if (level > threshold) {
      detector.active = true;
      detector.startAt = now;
      detector.peak = level;
      detector.sum = level;
      detector.samples = 1;
      detector.lowFrames = 0;
    }
    return { accepted: false };
  }

  detector.peak = Math.max(detector.peak, level);
  detector.sum += level;
  detector.samples += 1;

  const duration = now - detector.startAt;
  const sustainLevel = Math.max(BALANCE.sustainMinLevel, threshold + 0.16);
  if (
    duration >= BALANCE.sustainMinDuration &&
    detector.peak >= sustainLevel &&
    level >= BALANCE.barkEndThreshold &&
    now - detector.lastSustainAt >= BALANCE.sustainPulseGap
  ) {
    return acceptSustainedBark(now, level);
  }

  if (duration > BALANCE.barkLongReject) {
    detector.rejectedUntilQuiet = true;
    return rejectBark("拖太长了", 900);
  }

  if (level < BALANCE.barkEndThreshold) {
    detector.lowFrames += 1;
    if (detector.lowFrames >= 2) return analyzeBarkSegment(now);
  } else {
    detector.lowFrames = 0;
  }

  return { accepted: false, listening: true };
}

async function sampleMicStats(duration, label) {
  const startedAt = performance.now();
  const values = [];
  el.micLabel.textContent = label;
  return new Promise((resolve) => {
    const tick = () => {
      const raw = readMic();
      values.push(raw);
      const preview = clamp((raw - BALANCE.micFloor) / BALANCE.micRange, 0, 1);
      el.micMeter.style.width = `${Math.round(preview * 100)}%`;
      updateMicFeedback(preview, preview > BALANCE.barkThreshold, false);
      if (performance.now() - startedAt >= duration) {
        const sorted = values.slice().sort((a, b) => a - b);
        const percentile = (p) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] || 0;
        resolve({
          min: sorted[0] || 0,
          max: sorted[sorted.length - 1] || 0,
          avg: values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length),
          p70: percentile(0.7),
          p90: percentile(0.9),
        });
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
}

async function calibrateBarkInput() {
  el.roundLabel.textContent = "SET";
  el.countdown.textContent = "安静";
  const ambient = await sampleMicStats(BALANCE.calibrationAmbientMs, "环境校准");

  el.countdown.textContent = "试叫";
  playTone(520, 0.08, "triangle", 0.04);
  const sample = await sampleMicStats(BALANCE.calibrationBarkMs, "试叫一声汪");

  const floor = clamp(ambient.p90 + 0.006, 0.012, 0.07);
  const sampleHeadroom = Math.max(sample.max - floor, BALANCE.minMicRange);
  BALANCE.micFloor = floor;
  BALANCE.micRange = clamp(sampleHeadroom * 1.35, BALANCE.minMicRange, BALANCE.maxMicRange);
  BALANCE.barkThreshold = clamp((Math.max(ambient.p90 + 0.028, floor + sampleHeadroom * 0.2) - BALANCE.micFloor) / BALANCE.micRange, 0.22, 0.42);
  BALANCE.barkEndThreshold = clamp(BALANCE.barkThreshold * 0.55, 0.1, 0.22);
  BALANCE.barkMinPeak = clamp(BALANCE.barkThreshold + 0.08, 0.3, 0.52);
  BALANCE.barkMinAverage = clamp(BALANCE.barkThreshold * 0.72, 0.16, 0.28);

  resetBarkSegment();
  game.barkDetector.previousLevel = 0;
  game.barkDetector.rejectionUntil = 0;
  game.barkDetector.lastSustainAt = 0;
  updateMicFeedback(0, false, false);
  el.micMeter.style.width = "0%";
  el.countdown.textContent = "";
}

function micLoop() {
  const volume = readMic();
  const level = clamp((volume - BALANCE.micFloor) / BALANCE.micRange, 0, 1);
  el.micMeter.style.width = `${Math.round(level * 100)}%`;

  if (game.running) {
    const now = performance.now();
    const result = detectBark(level, now);
    const isBark = Boolean(result.accepted);
    const listening = Boolean(result.listening) || game.barkDetector.active;
    const tired = now - game.lastBarkAt < BALANCE.tiredWindow && game.combo >= BALANCE.tiredCombo;
    updateMicFeedback(level, listening || isBark, tired);
    el.playerDog.classList.toggle("tired", tired);
    if (isBark) playerAttack(tired ? result.power * BALANCE.tiredPenalty : result.power);
    el.micLabel.textContent = tired ? "喘口气" : result.sustained ? "持续压制" : isBark ? "有效汪汪" : "听候汪汪";
    if (!tired && result.rejected) el.micLabel.textContent = result.reason;
    if (!tired && !isBark && listening) el.micLabel.textContent = "识别中";
  } else {
    updateMicFeedback(level, false, false);
  }

  requestAnimationFrame(micLoop);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

async function countdown() {
  const steps = ["3", "2", "1", "BARK!"];
  for (const step of steps) {
    el.countdown.textContent = step;
    playTone(step === "BARK!" ? 660 : 360, 0.08, "triangle", 0.045);
    await new Promise((resolve) => window.setTimeout(resolve, 620));
  }
}

async function beginOnlineRound(notifyPeer) {
  if (game.online.roundStarting) return;
  game.online.roundStarting = true;
  updateOnlineLobbyUI("双方准备完成，开战倒计时");
  if (notifyPeer) sendOnlineMessage("start");
  await countdown();
  game.running = true;
  game.online.roundStarting = false;
  el.startBtn.textContent = "联网对战中";
  el.roundLabel.textContent = "P2P";
  el.countdown.textContent = "";
  el.micLabel.textContent = "听候汪汪";
  window.clearInterval(game.timerId);
  game.timerId = window.setInterval(() => {
    game.timeLeft -= 1;
    updateHud();
    if (game.timeLeft <= 0) finishByTime();
  }, 1000);
}

async function startOnlineGame() {
  if (!game.online.connected) {
    setOnlineStatus("请先建立连接");
    el.micLabel.textContent = "请先联网";
    return;
  }
  el.startBtn.disabled = true;
  el.startBtn.textContent = "准备中";
  el.roundLabel.textContent = "P2P";
  try {
    await setupMic();
    resetGame();
    await calibrateBarkInput();
    game.online.localReady = true;
    sendOnlineMessage("ready", onlinePlayerPayload({ dogId: game.selectedDogId }));
    updateOnlineLobbyUI(game.online.remoteReady ? "双方已准备，正在同步开局" : "你已准备，等待对方");
    setOnlineStatus(game.online.remoteReady ? "双方已准备" : "等待对方准备");
    el.startBtn.textContent = game.online.remoteReady ? "同步开局" : "等待对方";
    if (game.online.role === "host" && game.online.remoteReady) {
      beginOnlineRound(true);
    }
  } catch (error) {
    el.roundLabel.textContent = "ERROR";
    el.countdown.textContent = "无法使用麦克风";
    el.micLabel.textContent = error.message;
    el.startBtn.disabled = false;
    el.startBtn.textContent = "重试";
  }
}

async function startGame() {
  if (game.mode === "online") {
    await startOnlineGame();
    return;
  }
  el.startBtn.disabled = true;
  el.startBtn.textContent = "准备中";
  el.roundLabel.textContent = "MIC";
  el.micLabel.textContent = "请求权限";

  try {
    await setupMic();
    resetGame();
    await calibrateBarkInput();
    await countdown();
    game.running = true;
    el.startBtn.textContent = "对战中";
    el.roundLabel.textContent = "BATTLE";
    el.countdown.textContent = "";
    el.micLabel.textContent = "听候汪汪";
    scheduleAi();
    window.clearInterval(game.timerId);
    game.timerId = window.setInterval(() => {
      game.timeLeft -= 1;
      updateHud();
      if (game.timeLeft <= 0) finishByTime();
    }, 1000);
  } catch (error) {
    el.roundLabel.textContent = "ERROR";
    el.countdown.textContent = "无法使用麦克风";
    el.micLabel.textContent = error.message;
    el.startBtn.disabled = false;
    el.startBtn.textContent = "重试";
  }
}

function finishByTime() {
  if (game.push === 0) {
    endGame("draw");
  } else {
    endGame(game.push > 0 ? "win" : "lose");
  }
}

function checkEnd() {
  if (game.push >= 100) endGame("win");
  if (game.push <= -100) endGame("lose");
}

function rewardFor(result) {
  if (result === "win") return 150 + Math.min(game.winStreak, 5) * 25;
  if (result === "lose") return 30;
  return 60;
}

function endGame(result, notifyPeer = true) {
  if (!game.running) return;
  game.running = false;
  if (game.mode === "online" && notifyPeer) {
    sendOnlineMessage("end", { result });
  }
  game.online.localReady = false;
  game.online.remoteReady = false;
  window.clearInterval(game.timerId);
  window.clearTimeout(game.aiId);
  el.startBtn.disabled = false;
  el.startBtn.textContent = "再来一局";
  el.roundLabel.textContent = result === "win" ? "WIN" : result === "lose" ? "LOSE" : "DRAW";
  el.countdown.textContent = result === "win" ? "胜利" : result === "lose" ? "失败" : "平局";
  el.micLabel.textContent = "战斗结束";
  el.arena.classList.add("danger-wash", "ko-impact", `ko-${result}`);
  shakeArena(true);
  window.setTimeout(() => el.arena.classList.remove("ko-impact"), 520);

  if (result === "win") {
    game.winStreak += 1;
  } else if (result === "lose") {
    game.winStreak = 0;
  }
  const reward = rewardFor(result);
  game.wp += reward;
  game.matchIndex += 1;
  recordBattleResult(result, reward);
  saveGame();

  if (result === "win") {
    el.playerDog.classList.add("win");
    el.enemyDog.classList.add("dead");
    sprites.player.play("happy");
    sprites.enemy.play("dead");
    showKo("K.O. WIN!!", `+${reward} WP`);
    playWinSound();
  } else if (result === "lose") {
    el.playerDog.classList.add("dead");
    el.enemyDog.classList.add("win");
    sprites.player.play("dead");
    sprites.enemy.play("happy");
    showKo("K.O. LOSE", `+${reward} WP`);
    playLoseSound();
  } else {
    showKo("DRAW", `+${reward} WP`);
    playTone(420, 0.18, "triangle", 0.045);
  }
}

function showKo(title, reward) {
  el.koTitle.textContent = title;
  el.koReward.textContent = reward;
  el.koPanel.classList.add("show");
}

el.confirmDogBtn.addEventListener("click", showBattle);
el.startBtn.addEventListener("click", startGame);
el.nextBtn.addEventListener("click", showSelect);
el.resetStatsBtn?.addEventListener("click", resetBattleStats);
el.aiModeBtn?.addEventListener("click", () => setMode("ai"));
el.onlineModeBtn?.addEventListener("click", () => setMode("online"));
el.hostOnlineBtn?.addEventListener("click", async () => {
  try {
    await createOnlineRoom();
  } catch (error) {
    setOnlineStatus(error.message);
  }
});
el.joinOnlineBtn?.addEventListener("click", async () => {
  try {
    await joinOnlineRoom();
  } catch (error) {
    setOnlineStatus(error.message);
  }
});
el.leaveOnlineBtn?.addEventListener("click", leaveOnlineRoom);
el.copySignalBtn?.addEventListener("click", async () => {
  const roomId = el.roomCode?.value.trim();
  if (!roomId) {
    setOnlineStatus("请先创建房间");
    return;
  }
  try {
    await navigator.clipboard.writeText(roomInviteUrl(roomId));
    setOnlineStatus("已复制邀请链接");
  } catch {
    el.roomCode?.select();
    setOnlineStatus("请手动复制房间号");
  }
});
el.onlineEnterBtn?.addEventListener("click", enterOnlineBattle);
[el.confirmDogBtn, el.startBtn, el.nextBtn, el.resetStatsBtn, el.muteBtn, el.aiModeBtn, el.onlineModeBtn, el.hostOnlineBtn, el.joinOnlineBtn, el.copySignalBtn, el.leaveOnlineBtn, el.onlineEnterBtn].forEach((button) => {
  button?.addEventListener("pointerdown", playUiClick);
});

el.muteBtn.addEventListener("click", () => {
  game.muted = !game.muted;
  el.muteBtn.textContent = game.muted ? "×" : "♪";
});

loadSave();
applyAssetConfig();
renderDogCards();
showSelect();
updateOnlineLobbyUI("选择创建或加入房间");
applyRoomFromUrl();
initSpriteEditor();
loadSpriteAssets();
preloadGameAssets();
registerServiceWorker();
micLoop();
