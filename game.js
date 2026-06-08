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
    rejectedUntilQuiet: false,
    rejection: "",
    rejectionUntil: 0,
  },
  online: {
    role: "",
    peer: null,
    channel: null,
    connected: false,
    localReady: false,
    remoteReady: false,
    roundStarting: false,
    remoteDogId: "golden",
    roomId: "",
  },
};

const el = {
  arena: document.querySelector("#arena"),
  selectScreen: document.querySelector("#selectScreen"),
  battleScreen: document.querySelector("#battleScreen"),
  dogCards: document.querySelector("#dogCards"),
  selectTitle: document.querySelector("#selectTitle"),
  confirmDogBtn: document.querySelector("#confirmDogBtn"),
  aiModeBtn: document.querySelector("#aiModeBtn"),
  onlineModeBtn: document.querySelector("#onlineModeBtn"),
  onlineBox: document.querySelector("#onlineBox"),
  hostOnlineBtn: document.querySelector("#hostOnlineBtn"),
  joinOnlineBtn: document.querySelector("#joinOnlineBtn"),
  copySignalBtn: document.querySelector("#copySignalBtn"),
  roomCode: document.querySelector("#roomCode"),
  onlineStatus: document.querySelector("#onlineStatus"),
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
  const dogImages = new Set();
  for (const dog of DOGS) {
    dogImages.add(dog.portrait);
    const assets = assetsForDog(dog);
    Object.values(assets).forEach((src) => dogImages.add(src));
  }
  await Promise.allSettled([
    preloadImage("./assets/backgrounds/backyard-arena-ai-clean_001.jpg"),
    ...Array.from(dogImages, preloadImage),
    ...aiBarkPool.map(preloadAudio),
  ]);
}

class StaticDogSprite {
  constructor({ dog, image, assets }) {
    this.dog = dog;
    this.image = image;
    this.assets = assets;
    this.returnTimer = 0;
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
    const src = this.assets[action] || this.assets.happy;
    if (!src) return;
    window.clearTimeout(this.returnTimer);
    this.image.src = src;
    this.dog.classList.remove("happy", "bark", "dead", "hit", "tired");
    this.dog.classList.add(action);
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

const assetsForDog = (dog) => dog.assets || DEFAULT_DOG_ASSETS;

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

function setMode(mode) {
  game.mode = mode;
  el.aiModeBtn?.classList.toggle("active", mode === "ai");
  el.onlineModeBtn?.classList.toggle("active", mode === "online");
  el.onlineBox?.classList.toggle("hidden", mode !== "online");
  el.confirmDogBtn.textContent = mode === "online" ? "进入联网对战" : "开始对战";
}

function closeOnlineConnection() {
  game.online.channel?.close();
  game.online.peer?.destroy?.();
  Object.assign(game.online, {
    role: "",
    peer: null,
    channel: null,
    connected: false,
    localReady: false,
    remoteReady: false,
    roundStarting: false,
    remoteDogId: "golden",
    roomId: "",
  });
  setOnlineStatus("未连接");
}

function makeRoomId() {
  return `gougou${Math.random().toString(36).slice(2, 8)}`;
}

function requirePeerJs() {
  if (typeof Peer === "undefined") {
    throw new Error("联网服务加载失败，请刷新页面");
  }
}

function createOnlinePeer(role, id) {
  closeOnlineConnection();
  requirePeerJs();
  const peer = new Peer(id || undefined, {
    host: "0.peerjs.com",
    port: 443,
    path: "/",
    secure: true,
    debug: 1,
  });
  game.online.peer = peer;
  game.online.role = role;
  peer.on("connection", (connection) => {
    if (game.online.channel && game.online.channel.open) {
      connection.close();
      return;
    }
    setupOnlineChannel(connection);
  });
  peer.on("disconnected", () => {
    game.online.connected = false;
    setOnlineStatus("连接中断");
  });
  peer.on("close", () => {
    game.online.connected = false;
    setOnlineStatus("连接关闭");
  });
  peer.on("error", (error) => {
    game.online.connected = false;
    setOnlineStatus(error?.type === "unavailable-id" ? "房间号已被占用" : "联网失败");
  });
  return peer;
}

function setupOnlineChannel(channel) {
  game.online.channel = channel;
  channel.on("open", () => {
    game.online.connected = true;
    setOnlineStatus("已连接");
    sendOnlineMessage("hello", { dogId: game.selectedDogId, name: currentDog().name });
  });
  channel.on("close", () => {
    game.online.connected = false;
    setOnlineStatus("连接关闭");
  });
  channel.on("error", () => {
    game.online.connected = false;
    setOnlineStatus("连接失败");
  });
  channel.on("data", (data) => {
    try {
      handleOnlineMessage(typeof data === "string" ? JSON.parse(data) : data);
    } catch {
      setOnlineStatus("收到无效消息");
    }
  });
}

function sendOnlineMessage(type, payload = {}) {
  const channel = game.online.channel;
  if (!channel || !channel.open) return false;
  channel.send(JSON.stringify({ type, payload, at: Date.now() }));
  return true;
}

async function createOnlineRoom() {
  setMode("online");
  const roomId = makeRoomId();
  const peer = createOnlinePeer("host", roomId);
  setOnlineStatus("创建房间中");
  await new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("创建超时，请重试")), 9000);
    peer.on("open", (id) => {
      window.clearTimeout(timer);
      game.online.roomId = id;
      if (el.roomCode) el.roomCode.value = id;
      setOnlineStatus("等待朋友加入");
      resolve(id);
    });
    peer.on("error", (error) => {
      window.clearTimeout(timer);
      reject(error);
    });
  });
}

async function joinOnlineRoom() {
  setMode("online");
  const roomId = el.roomCode?.value.trim();
  if (!roomId) throw new Error("请输入房间号");
  const peer = createOnlinePeer("guest");
  game.online.roomId = roomId;
  setOnlineStatus("加入房间中");
  await new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("连接超时，请检查房间号")), 12000);
    peer.on("open", () => {
      const connection = peer.connect(roomId, { reliable: true });
      setupOnlineChannel(connection);
      connection.on("open", () => {
        window.clearTimeout(timer);
        resolve();
      });
      connection.on("error", (error) => {
        window.clearTimeout(timer);
        reject(error);
      });
    });
    peer.on("error", (error) => {
      window.clearTimeout(timer);
      reject(error);
    });
  });
}

function handleOnlineMessage(message) {
  const { type, payload = {} } = message;
  if (type === "hello" || type === "dog") {
    game.online.remoteDogId = payload.dogId || game.online.remoteDogId;
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
  } catch {
    game.wp = 0;
    game.unlocked = ["shiba"];
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
      sendOnlineMessage("dog", { dogId: dog.id, name: dog.name });
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
    setOnlineStatus("未连接也可先进入，开局前需连接");
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
  sendOnlineMessage("dog", { dogId: game.selectedDogId, name: player.name });
  resetGame();
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

const FX_GLYPHS = ["汪", "BARK!", "WOOF!", "艹", "@", "#", "!", "*", "!!"];

function dogBurstPoint(side) {
  const dog = side === "player" ? el.playerDog : el.enemyDog;
  const dogRect = dog.getBoundingClientRect();
  const arenaRect = el.arena.getBoundingClientRect();
  return {
    x: dogRect.left + dogRect.width * 0.5 - arenaRect.left,
    y: dogRect.top + dogRect.height * 0.48 - arenaRect.top,
  };
}

function addWave(side, intensity = 0.5) {
  const strength = clamp(intensity, 0.25, 1);
  const point = dogBurstPoint(side);
  const group = document.createElement("div");
  group.className = `impact-burst ${side}-burst`;
  group.style.left = `${point.x}px`;
  group.style.top = `${point.y}px`;
  group.style.setProperty("--power", strength.toFixed(2));
  group.style.setProperty("--wave-size", `${150 + strength * 250}px`);
  group.style.setProperty("--wave-border", `${7 + strength * 8}px`);
  group.style.setProperty("--wave-opacity", `${0.74 + strength * 0.22}`);
  group.style.setProperty("--wave-scale", `${1.72 + strength * 1.1}`);
  const waveCount = Math.round(3 + strength * 4);
  for (let index = 0; index < waveCount; index += 1) {
    const wave = document.createElement("span");
    wave.className = index % 2 ? "wide-wave soft-ring" : "wide-wave hard-ring";
    wave.style.setProperty("--i", index);
    wave.style.setProperty("--tilt", `${-10 + Math.random() * 20}deg`);
    wave.style.setProperty("--oval", `${0.82 + Math.random() * 0.18}`);
    group.appendChild(wave);
  }
  const particleCount = Math.round(7 + strength * 18);
  for (let index = 0; index < particleCount; index += 1) {
    const spark = document.createElement("span");
    const asGlyph = Math.random() < 0.72;
    const angle = Math.random() * Math.PI * 2;
    const distance = 54 + Math.random() * (130 + strength * 190);
    const lift = -24 + Math.random() * 48;
    spark.className = asGlyph ? "impact-glyph" : index % 2 ? "impact-spark star" : "impact-spark bolt";
    if (asGlyph) spark.textContent = FX_GLYPHS[Math.floor(Math.random() * FX_GLYPHS.length)];
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
  el.fxLayer.appendChild(group);
  window.setTimeout(() => group.remove(), 980);
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
    el.micLabel.textContent = tired ? "喘口气" : isBark ? "有效汪汪" : "听候汪汪";
    if (!tired && result.rejected) el.micLabel.textContent = result.reason;
    if (!tired && !isBark && listening) el.micLabel.textContent = "识别中";
  } else {
    updateMicFeedback(level, false, false);
  }

  requestAnimationFrame(micLoop);
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
    sendOnlineMessage("ready", { dogId: game.selectedDogId });
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
el.copySignalBtn?.addEventListener("click", async () => {
  const roomId = el.roomCode?.value.trim();
  if (!roomId) {
    setOnlineStatus("请先创建房间");
    return;
  }
  try {
    await navigator.clipboard.writeText(roomId);
    setOnlineStatus("已复制房间号");
  } catch {
    el.roomCode?.select();
    setOnlineStatus("请手动复制房间号");
  }
});
[el.confirmDogBtn, el.startBtn, el.nextBtn, el.muteBtn, el.aiModeBtn, el.onlineModeBtn, el.hostOnlineBtn, el.joinOnlineBtn, el.copySignalBtn].forEach((button) => {
  button?.addEventListener("pointerdown", playUiClick);
});

el.muteBtn.addEventListener("click", () => {
  game.muted = !game.muted;
  el.muteBtn.textContent = game.muted ? "×" : "♪";
});

loadSave();
renderDogCards();
showSelect();
loadSpriteAssets();
preloadGameAssets();
micLoop();
