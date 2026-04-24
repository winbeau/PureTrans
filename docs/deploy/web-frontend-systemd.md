# React Web 演示前端 systemd 部署

本文把 `web-frontend/` 固定为一套可长期重启、可巡检、可复现的服务器部署方式。

默认假设：

- 项目部署在 `/opt/puretrans`
- Web 前端目录为 `/opt/puretrans/web-frontend`
- 后端公网地址为 `http://124.71.228.242:8000`
- 前端公网访问地址为 `http://124.71.228.242:5174`
- 服务器已安装 Node.js、`pnpm`

## 1. 准备前端环境

```bash
cd /opt/puretrans/web-frontend
pnpm install --frozen-lockfile
cp .env.example .env
```

确认 `.env` 指向后端：

```dotenv
VITE_API_BASE_URL=http://124.71.228.242:8000
```

## 2. 构建静态资源

每次拉取新代码后执行：

```bash
cd /opt/puretrans/web-frontend
pnpm install --frozen-lockfile
pnpm build
```

`pnpm preview` 只负责服务已经构建好的 `dist/`，所以代码更新后必须重新 `pnpm build`。

## 3. 安装 systemd 服务

仓库提供模板 `deploy/puretrans-web-frontend.service.example`。

```bash
sudo cp /opt/puretrans/deploy/puretrans-web-frontend.service.example /etc/systemd/system/puretrans-web-frontend.service
sudo systemctl daemon-reload
sudo systemctl enable --now puretrans-web-frontend.service
sudo systemctl status puretrans-web-frontend.service
```

如果服务器运行用户不是 `puretrans`，同步修改服务文件中的 `User`、`Group` 和目录权限。

## 4. 验证

检查服务：

```bash
systemctl status puretrans-web-frontend.service
journalctl -u puretrans-web-frontend.service -f
```

检查页面：

```bash
curl -I http://124.71.228.242:5174/
```

浏览器访问：

```text
http://124.71.228.242:5174/
```

页面右上角应显示后端在线。后端需要允许前端 Origin：

```dotenv
PURETRANS_CORS_ORIGINS=http://124.71.228.242:5174,http://localhost:5174,http://localhost:5173,capacitor://localhost
```

修改后端 CORS 后需要重启后端服务。

## 5. 常用运维命令

```bash
sudo systemctl restart puretrans-web-frontend.service
sudo systemctl stop puretrans-web-frontend.service
sudo systemctl start puretrans-web-frontend.service
sudo journalctl -u puretrans-web-frontend.service -n 100 --no-pager
```

更新前端代码的推荐顺序：

```bash
cd /opt/puretrans
git pull
cd web-frontend
pnpm install --frozen-lockfile
pnpm build
sudo systemctl restart puretrans-web-frontend.service
```

## 6. 后续生产化建议

`pnpm preview` 适合作为当前演示前端的 systemd 托管方式。后续如果接入正式域名和 HTTPS，建议改为：

- `pnpm build` 产出 `web-frontend/dist/`
- Nginx 或 Caddy 直接服务静态文件
- Nginx/Caddy 由系统自带 `systemd` 服务托管
- `/api` 可通过反向代理转发到后端 `127.0.0.1:8000`

这样可以把公网只暴露 `80/443`，并把 `5174/8000` 收敛为内网监听端口。
