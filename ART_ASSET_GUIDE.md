# 汪汪对决美术资产规范

## 角色序列帧

角色资源放在：

- `assets/dogs/player/`
- `assets/dogs/enemy/`

每只狗需要一个 `manifest.json`，用于告诉游戏每个动作对应哪些 PNG 帧。

推荐透明 PNG，尺寸统一为 `512x512` 或 `768x768`。角色需要在画布中居中，脚底位置尽量一致，避免播放时跳动。

## 动作清单

第一版建议每只狗准备这些动作：

| 动作 | 用途 | 建议帧数 | 循环 |
| --- | --- | ---: | --- |
| `idle` | 待机摇尾巴、眨眼 | 6-10 | 是 |
| `attack` | 张嘴汪叫、身体前冲 | 5-8 | 否 |
| `hit` | 受击后退、惊讶表情 | 4-6 | 否 |
| `tired` | 疲劳喘气、舌头伸出 | 6-8 | 是 |
| `win` | 胜利跳跃、转圈 | 8-12 | 是 |
| `lose` | 失败趴下、耳朵垂下 | 6-10 | 否 |

## 命名建议

```text
assets/dogs/player/
  manifest.json
  idle_000.png
  idle_001.png
  attack_000.png
  attack_001.png
  hit_000.png
  win_000.png
  lose_000.png
```

## manifest 示例

```json
{
  "actions": {
    "idle": {
      "fps": 8,
      "loop": true,
      "frames": [
        "idle_000.png",
        "idle_001.png",
        "idle_002.png",
        "idle_003.png"
      ]
    },
    "attack": {
      "fps": 14,
      "loop": false,
      "frames": [
        "attack_000.png",
        "attack_001.png",
        "attack_002.png",
        "attack_003.png"
      ]
    },
    "hit": {
      "fps": 12,
      "loop": false,
      "frames": [
        "hit_000.png",
        "hit_001.png",
        "hit_002.png"
      ]
    },
    "win": {
      "fps": 10,
      "loop": true,
      "frames": [
        "win_000.png",
        "win_001.png",
        "win_002.png",
        "win_003.png"
      ]
    },
    "lose": {
      "fps": 8,
      "loop": false,
      "frames": [
        "lose_000.png",
        "lose_001.png",
        "lose_002.png",
        "lose_003.png"
      ]
    }
  }
}
```

## 美术方向

当前项目选择第 1 张概念图方向：

- 明亮后院竞技场
- 软萌卡通手游质感
- 粗白描边
- 高饱和但不刺眼
- 角色动作夸张、表情清楚
- 攻击不要凶狠，保持可爱玩闹感

## 后续可扩展

后续还可以把这些也改成序列帧或位图资源：

- 背景后院
- 擂台
- 声波特效
- 暴击特效
- 胜利彩带
- 狗狗头像
