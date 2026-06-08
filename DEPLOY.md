# 公网部署说明

这个项目是纯静态网页，可以部署到 GitHub Pages 或 Gitee Pages。

## GitHub Pages

1. 在 GitHub 新建一个公开仓库，例如 `bark-battle`。
2. 把仓库地址发给我，例如：

```text
https://github.com/你的用户名/bark-battle.git
```

3. 我会把当前项目推送到仓库。
4. 在仓库设置里开启 Pages：
   - `Settings`
   - `Pages`
   - `Build and deployment`
   - Source 选择 `Deploy from a branch`
   - Branch 选择 `master` 或 `main`
   - Folder 选择 `/root`

最终地址通常是：

```text
https://你的用户名.github.io/bark-battle/
```

## Gitee Pages

1. 在 Gitee 新建一个公开仓库。
2. 把仓库地址发给我，例如：

```text
https://gitee.com/你的用户名/bark-battle.git
```

3. 我会把当前项目推送到仓库。
4. 在 Gitee 仓库里开启 Gitee Pages 服务。

## 注意

- 麦克风权限需要 HTTPS，GitHub Pages 满足这个条件。
- Gitee Pages 是否支持 HTTPS 取决于当前账号和 Pages 配置。
- 联网对战当前使用 ntfy 公开 topic 自动交换 WebRTC 信令，房主复制房间号给朋友即可。
- 如果要做“随机匹配/排行榜/永久房间”，需要额外部署一个游戏服务器。
