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

## Current Cloud Server Deployment

- Public URL: `https://gougou.8.220.135.31.sslip.io/`
- SSH: `ecs-user@8.220.135.31`
- Remote project path: `/home/ecs-user/gougou-room`
- Frontend path: `/home/ecs-user/gougou-room/public`
- Room server path: `/home/ecs-user/gougou-room/server/server.js`
- Runtime command: `/usr/bin/node /home/ecs-user/gougou-room/server/server.js`
- Health check: `https://gougou.8.220.135.31.sslip.io/health`

Deployment steps:

1. Back up remote files into `/home/ecs-user/backups/deploy_YYYYMMDD_HHMMSS.tgz`.
2. Copy `index.html`, `styles.css`, and `game.js` to `/home/ecs-user/gougou-room/public/`.
3. Copy `server/server.js` to `/home/ecs-user/gougou-room/server/server.js` when the server changes.
4. Restart the Node room server.
5. Verify `/health` and open the public page with a cache-busting query string.
