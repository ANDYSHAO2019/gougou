# 角色精灵编辑器 - 已完成

## 需求
用户想要一个可编辑的角色精灵系统，能替换狗狗的待机/攻击/死亡三个状态的图片。

## 实现方案

### 原有系统分析
- `StaticDogSprite` 类管理精灵播放，`assetsForDog()` 返回 `happy`/`bark`/`dead` 三态图片路径
- 默认路径：`./assets/dogs/player/idle_000.png`、`attack_003.png`、`lose_005.png`
- 狗狗在战斗画面是 `<img class="sprite-frame">`，CSS 控制动画

### 新增功能

**HTML (`index.html`)**
- 选择画面底部加"编辑角色"按钮
- 新增 sprite editor modal，包含3个上传格子和操作按钮

**CSS (`styles.css`)**
- `.sprite-editor-modal` 居中弹窗
- `.sprite-slots` 3列布局，每格支持拖拽/点击上传
- `.slot-clear` 清除自定义图片

**JavaScript (`game.js`)**
- `SPRITE_EDITOR_KEY` localStorage key: `"barkBattleCustomSprites"`
- `assetsForDog()` 优先读 localStorage，自定义图片以 base64 存储
- `openSpriteEditor()` / `closeSpriteEditor()` / `saveSpriteEditor()` / `resetSpriteEditor()`
- 支持拖拽和点击两种上传方式
- 保存后立即刷新当前战斗中的角色精灵

### 使用方法
1. 选择画面点「编辑角色」
2. 三个格子分别对应 待机/攻击/死亡，点击或拖拽图片到格子
3. 点「保存并应用」，图片以 base64 存入浏览器 localStorage
4. 点「恢复默认」清除自定义，恢复原始图片
5. 编辑完点「开始对战」，战斗中显示的就是你上传的角色

### 技术细节
- 自定义精灵存储在 `localStorage['barkBattleCustomSprites']`，JSON 格式 `{ happy: "data:image/...", bark: "...", dead: "..." }`
- 存储 base64 而非文件路径，保证刷新后依然有效
- 三个状态都未上传时不写入 localStorage（节省空间）

## Git
- 分支: qcodex-dev
- Commit: e7fe1f6
