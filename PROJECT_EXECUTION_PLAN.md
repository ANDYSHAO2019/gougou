# 汪汪大作战持续迭代执行清单

## 当前状态

- 当前分支：`qcodex-dev`
- 最新提交：`aa6febe Add configurable asset editor foundation`
- 主游戏入口：`index.html`
- 主逻辑：`game.js`
- 样式：`styles.css`
- 云端房间服务：`server/server.js`
- 本地测试地址：`http://localhost:5173/`
- 公网测试地址：`https://gougou.8.220.135.31.sslip.io/`

## 已完成能力

- AI 对战基础玩法
- 麦克风狗叫检测与校准
- AI 狗叫音效随机池
- 角色图片与背景图资源
- 声波、文字粒子、震屏等战斗反馈
- 胜负结算、WP、解锁、连胜
- 云服务器 WebSocket 房间对战
- 联网房间大厅 UI
- 资源编辑器基础版
  - 角色图本地替换
  - 背景图本地替换
  - 声波颜色、文字粒子、粒子强度配置
  - JSON 导入/导出

## 优先级

### P0 稳定底座

1. 每轮改动都必须通过：
   - `node --check game.js`
   - `node tools/smoke-test.js`
   - 必要时跑浏览器双页面测试
2. 每个大阶段做 `backups/vXXX_*` 备份。
3. 每个可验证迭代提交到当前分支。

### P1 资源编辑器完善

1. 角色资源按狗狗类型单独配置，而不是全局替换。
2. 背景页增加恢复默认、预览一致性。
3. 特效页增加实时预览按钮。
4. 配置页支持导出下载、导入校验、错误提示。

### P2 美术生产流程

1. 增加更多狗狗类型配置模板。
2. 支持角色单帧和序列帧两种模式。
3. 支持资源包 JSON + 图片引用结构。
4. 让编辑器生成可部署的资源包。

### P3 联网与发布

1. 服务器保存资源包，让朋友看到同一套资源。
2. 给房间增加资源包版本同步。
3. 让 GitHub Pages 和云服务器部署流程更清楚。

### P4 玩法扩展

1. 排行榜、录音回放、PWA。
2. 更强的狗叫识别模型。
3. 更多特效与场景。

## 当前执行轮

目标：完成 P1-1，角色资源按狗狗类型单独配置。

验收：

- [x] 资源编辑器角色页可以选择狗狗类型。
- [x] 不同狗狗保存不同的待机、吼叫、死亡图。
- [x] 旧的全局角色配置仍能兼容。
- [x] 游戏中当前狗和对手狗读取各自配置。
- [x] smoke test 通过。
- [x] 浏览器验证柴犬/黄金犬配置互不覆盖。

## 下一执行轮

目标：完成 P1-2，背景页增加恢复默认和实时一致性。

验收：

- [x] 背景页能清除已上传背景。
- [x] 背景预览、游戏场景、导出配置三者一致。
- [x] 导入空背景配置后恢复默认背景。
- [x] smoke test 通过。

## 后续执行轮

目标：完成 P1-3，特效页增加实时预览按钮。

验收：

- [x] 特效页可以直接播放玩家/对手声波预览。
- [x] 预览读取当前颜色、文字粒子、粒子强度。
- [x] 不需要进入战斗也能看到特效效果。
- [x] smoke test 通过。

## 再下一执行轮

目标：完成 P1-4，配置页支持更可靠的导入导出。

验收：

- [x] 导出按钮可以下载 JSON 文件。
- [x] 导入 JSON 有格式校验和状态提示。
- [x] 导入失败不会覆盖当前配置。
- [x] smoke test 通过。

## 下一阶段建议

目标：进入 P2，美术生产流程。

优先任务：

1. [x] 定义资源包结构，区分本地预览配置和可部署资源包。
2. 角色编辑器支持单帧/序列帧模式切换。
3. 增加资源包导入时的容量提示和图片压缩建议。
4. 增加编辑器内的战斗场景预览。

P2-1 完成：

- 配置增加 `kind: "gougou-asset-config"`。
- 配置增加 `schemaVersion: 1`。
- 保存时写入 `updatedAt`。
- 配置页显示当前 JSON 大小和风险提示。

P2-2A runtime target:
- [x] Sprite assets support existing single-frame string values.
- [x] Sprite assets support sequence-frame objects: `{ "frames": [], "fps": 8, "loop": true }`.
- [x] Runtime preloading includes every frame in sequence assets.
- [x] Browser validation confirms custom sequence frames animate in the dog sprite.
- [x] `node --check game.js` and `node tools/smoke-test.js` pass.

P2-2B editor target:
- [x] Character editor exposes single-frame and sequence-frame modes per action slot.
- [x] Multi-image upload stores sequence assets as `{ "frames": [], "fps": 8, "loop": true }`.
- [x] One-image upload remains compatible with string sprite assets.
- [x] Browser validation confirms editor upload/save writes both formats correctly.
- [x] `node --check game.js` and `node tools/smoke-test.js` pass.

P2-3 capacity target:
- [x] Config page shows size, risk level, and practical image compression advice.
- [x] Uploading sprite frames reports immediate frame count and size.
- [x] Browser validation confirms OK/Warn/Danger capacity states render correctly.
- [x] `node --check game.js` and `node tools/smoke-test.js` pass.

P2-4 editor battle preview target:
- [x] Character editor includes a compact battle-scene preview.
- [x] Preview reflects current dog sprite drafts and background draft.
- [x] Preview battle button plays bark pose and real wave/glyph effect.
- [x] Browser validation confirms preview updates after upload and effect preview creates particles.
- [x] `node --check game.js` and `node tools/smoke-test.js` pass.

P3-1 online asset sync target:
- [x] Host sends current asset config with online hello/dog/ready messages.
- [x] Guest applies host asset config as a temporary synced pack.
- [x] Leaving the room clears temporary synced asset config.
- [x] Browser validation confirms guest receives host custom sprite/background.
- [x] `node --check game.js` and `node tools/smoke-test.js` pass.

P3-2 online asset status target:
- [x] Online lobby displays local asset pack hash and size.
- [x] Guest lobby displays waiting/synced host asset pack state.
- [x] Asset status refreshes after editor save/import.
- [x] Browser validation confirms host/local and guest/synced status text.
- [x] `node --check game.js` and `node tools/smoke-test.js` pass.

P3-3 online asset E2E target:
- [x] Public room server health endpoint responds OK.
- [x] Two independent browser pages can create and join a real room.
- [x] Guest receives host custom sprite through real WebSocket relay.
- [x] Guest lobby shows synced host asset pack hash/size.
- [x] Host and guest can leave the room cleanly after the test.

P3-4 cloud deployment target:
- [x] Remote server files backed up before deploy.
- [x] Latest `index.html`, `styles.css`, `game.js`, and `server/server.js` copied to cloud server.
- [x] Node room server restarted on the cloud server.
- [x] Public `/health` endpoint responds OK after deploy.
- [x] Public page loads with latest asset sync UI and editor battle preview.
- [x] `DEPLOY.md` documents current cloud deployment path and steps.

P4-1 PWA target:
- [x] App includes `manifest.webmanifest`.
- [x] App registers a conservative network-first service worker.
- [x] Cloud server serves `.webmanifest` with manifest MIME type.
- [x] Browser validation confirms manifest link and service worker file are reachable.
- [x] Public deployment serves manifest/service worker correctly after deploy.
- [x] `node --check game.js`, `node --check server/server.js`, and `node tools/smoke-test.js` pass.
