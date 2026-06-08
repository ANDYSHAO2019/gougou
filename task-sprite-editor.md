# 资源编辑器 - 完成

## 需求
用户想要游戏中所有资源开放编辑：背景图、UI、特效、角色精灵。

## 实现方案

### 架构
- `ASSET_EDITOR_KEY = "barkBattleAssetsV2"` localStorage key
- `getCustomAssets()` / `saveCustomAssets()` 管理 JSON 数据
- `applyAssets()` 将颜色写入 CSS 变量 (`--asset-XXX`)，图片直接写 style
- CSS 覆盖规则把所有 `--asset-XXX` 变量应用到实际元素

### 四 TAB 设计

**背景页 (tab-bg)**
- `arenaBg` - 主背景图（上传，推荐 1200×675px）
- `skyColor` - 天空颜色（颜色选择器）
- `groundColor` - 地面颜色
- `sunColor` - 太阳颜色
- `cloudColor` - 云朵颜色
- `fenceColor` - 围栏颜色

**角色页 (tab-character)**
- `happy` - 待机状态图片
- `bark` - 攻击状态图片
- `dead` - 死亡状态图片

**特效页 (tab-effects)**
- `waveColor` - 音波颜色
- `sparkColor` - 星星粒子颜色
- `koWinColor` - 胜利色（推条玩家侧）
- `koLoseColor` - 失败色（推条敌方侧）
- `comboColor` - COMBO 显示颜色
- `dangerColor` - 危险警告颜色

**UI页 (tab-ui)**
- `btnPrimary` - 主按钮颜色
- `btnSecondary` - 次按钮颜色
- `cardBg` - 狗卡背景色
- `hudBg` - 顶部 HUD 背景色
- `micMeterColor` - 麦克风音量条颜色

### 技术细节
- 图片以 base64 存储在 localStorage（最大约 2MB per image）
- 颜色通过 CSS 变量 `var(--asset-XXX)` 覆盖硬编码值
- 背景图通过 `arena.style.backgroundImage = url(...)` 直接设置
- 页面加载时 `applyAssets(getCustomAssets())` 立即应用已保存资源
- 恢复默认：清除 localStorage，刷新 CSS 变量

### Git
- 分支: qcodex-dev
- Commit: 2e9c172
