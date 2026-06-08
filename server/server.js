const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");
const { WebSocketServer } = require("ws");

const PORT = Number(process.env.PORT || 3001);
const PUBLIC_DIR = process.env.PUBLIC_DIR || path.join(__dirname, "public");
const ROOM_TTL_MS = 1000 * 60 * 20;
const HEARTBEAT_MS = 1000 * 25;

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".wav": "audio/wav",
};

const rooms = new Map();
const sockets = new Map();

function makeId(prefix, bytes = 5) {
  return `${prefix}${crypto.randomBytes(bytes).toString("hex")}`;
}

function send(socket, type, payload = {}) {
  if (socket.readyState !== 1) return;
  socket.send(JSON.stringify({ type, payload, at: Date.now() }));
}

function roomSnapshot(room) {
  return {
    roomId: room.id,
    players: Array.from(room.clients.values()).map((client) => ({
      id: client.id,
      role: client.role,
      dogId: client.dogId,
      ready: client.ready,
    })),
  };
}

function broadcast(room, type, payload = {}, exceptId = "") {
  for (const client of room.clients.values()) {
    if (client.id === exceptId) continue;
    send(client.socket, type, payload);
  }
}

function broadcastRoom(room) {
  broadcast(room, "room", roomSnapshot(room));
}

function getClient(socket) {
  return sockets.get(socket);
}

function createRoom(socket, payload = {}) {
  leaveRoom(socket, false);
  const roomId = makeId("gougou", 5);
  const client = {
    id: makeId("p", 4),
    socket,
    role: "host",
    dogId: payload.dogId || "shiba",
    ready: false,
    roomId,
  };
  const room = {
    id: roomId,
    clients: new Map([[client.id, client]]),
    createdAt: Date.now(),
    touchedAt: Date.now(),
  };
  rooms.set(roomId, room);
  sockets.set(socket, client);
  send(socket, "created", { roomId, clientId: client.id, role: client.role });
  broadcastRoom(room);
}

function joinRoom(socket, payload = {}) {
  const roomId = String(payload.roomId || "").trim();
  const room = rooms.get(roomId);
  if (!room) {
    send(socket, "error", { message: "房间不存在" });
    return;
  }
  if (room.clients.size >= 2 && !Array.from(room.clients.values()).some((client) => client.socket === socket)) {
    send(socket, "error", { message: "房间已满" });
    return;
  }
  leaveRoom(socket, false);
  const client = {
    id: makeId("p", 4),
    socket,
    role: "guest",
    dogId: payload.dogId || "shiba",
    ready: false,
    roomId,
  };
  room.clients.set(client.id, client);
  room.touchedAt = Date.now();
  sockets.set(socket, client);
  send(socket, "joined", { roomId, clientId: client.id, role: client.role });
  broadcast(room, "peer-joined", roomSnapshot(room), client.id);
  broadcastRoom(room);
}

function relay(socket, type, payload = {}) {
  const client = getClient(socket);
  if (!client) {
    send(socket, "error", { message: "请先创建或加入房间" });
    return;
  }
  const room = rooms.get(client.roomId);
  if (!room) return;
  room.touchedAt = Date.now();
  if (type === "dog") client.dogId = payload.dogId || client.dogId;
  if (type === "ready") client.ready = true;
  if (type === "start") {
    for (const item of room.clients.values()) item.ready = false;
  }
  broadcast(room, "relay", { type, payload, from: client.id }, client.id);
  if (type === "dog" || type === "ready") broadcastRoom(room);
}

function leaveRoom(socket, notify = true) {
  const client = getClient(socket);
  if (!client) return;
  const room = rooms.get(client.roomId);
  sockets.delete(socket);
  if (!room) return;
  room.clients.delete(client.id);
  if (notify) broadcast(room, "peer-left", { message: "对方已离开" });
  if (room.clients.size === 0) {
    rooms.delete(room.id);
  } else {
    room.touchedAt = Date.now();
    broadcastRoom(room);
  }
}

function handleMessage(socket, raw) {
  let message;
  try {
    message = JSON.parse(raw.toString());
  } catch {
    send(socket, "error", { message: "消息格式错误" });
    return;
  }
  const { type, payload = {} } = message;
  if (type === "create") return createRoom(socket, payload);
  if (type === "join") return joinRoom(socket, payload);
  if (type === "leave") return leaveRoom(socket);
  if (["hello", "dog", "ready", "start", "attack", "end"].includes(type)) {
    return relay(socket, type, payload);
  }
  send(socket, "error", { message: "未知消息" });
}

function safeFilePath(urlPath) {
  const parsed = decodeURIComponent(urlPath.split("?")[0]);
  const normalized = parsed === "/" ? "/index.html" : parsed;
  const filePath = path.normalize(path.join(PUBLIC_DIR, normalized));
  return filePath.startsWith(path.normalize(PUBLIC_DIR)) ? filePath : "";
}

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, rooms: rooms.size, sockets: sockets.size }));
    return;
  }
  const filePath = safeFilePath(req.url || "/");
  if (!filePath) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.stat(filePath, (statError, stat) => {
    if (statError || !stat.isFile()) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
      "Cache-Control": ext === ".html" ? "no-store" : "public, max-age=60",
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (socket) => {
  socket.isAlive = true;
  socket.on("pong", () => {
    socket.isAlive = true;
  });
  socket.on("message", (message) => handleMessage(socket, message));
  socket.on("close", () => leaveRoom(socket));
  socket.on("error", () => leaveRoom(socket));
  send(socket, "connected", { clientId: makeId("tmp", 3) });
});

setInterval(() => {
  for (const socket of wss.clients) {
    if (!socket.isAlive) {
      socket.terminate();
      continue;
    }
    socket.isAlive = false;
    socket.ping();
  }
  const now = Date.now();
  for (const [roomId, room] of rooms) {
    if (now - room.touchedAt > ROOM_TTL_MS) {
      broadcast(room, "room-expired", { message: "房间已过期" });
      rooms.delete(roomId);
    }
  }
}, HEARTBEAT_MS);

server.listen(PORT, "127.0.0.1", () => {
  console.log(`gougou room server listening on http://127.0.0.1:${PORT}`);
});
