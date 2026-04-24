# 前端 Nginx 静态部署经验

本文记录 PureTrans React Web 前端的实际可用部署方式：`pnpm build` 生成 `dist/`，再由 Nginx 直接托管静态文件。

这套方案替代 `pnpm preview + systemd`。实际部署中，`pnpm preview` 在 systemd 下遇到过 `node` 路径不可见的问题；Nginx 静态托管更稳定，也更接近生产部署。

当前服务器约定：

- 项目目录：`/home/winbeau/PureTrans`
- 前端目录：`/home/winbeau/PureTrans/web-frontend`
- Nginx 静态目录：`/var/www/puretrans-web`
- 域名：`winbeau.top`
- 后端本机地址：`http://127.0.0.1:8000`

## 1. 确认域名解析

```bash
ping winbeau.top
```

成功标志：

```text
PING winbeau.top (124.71.228.242)
```

## 2. 停用前端 systemd 预览服务

如果之前创建过 `puretrans-web-frontend.service`，先停掉：

```bash
sudo systemctl disable --now puretrans-web-frontend.service
```

即使这个服务不存在，后续 Nginx 静态部署也不依赖它。

## 3. 构建前端

进入前端目录：

```bash
cd /home/winbeau/PureTrans/web-frontend
```

写入构建时 API 地址：

```bash
printf 'VITE_API_BASE_URL=http://winbeau.top\n' > .env
```

说明：`>` 会覆盖整个 `.env`。当前 Web 前端只需要这一行，所以可以这样写。

安装依赖并构建：

```bash
pnpm install --frozen-lockfile
pnpm build
```

成功标志：

```text
✓ built in ...
```

并生成：

```text
web-frontend/dist/index.html
```

## 4. 发布 dist 到 Nginx 静态目录

```bash
sudo mkdir -p /var/www/puretrans-web
sudo rm -rf /var/www/puretrans-web/*
sudo cp -r dist/. /var/www/puretrans-web/
sudo chown -R www-data:www-data /var/www/puretrans-web
```

验证文件存在：

```bash
ls -la /var/www/puretrans-web
```

至少应看到：

```text
index.html
assets/
```

## 5. 配置 Nginx

创建或编辑站点：

```bash
sudo nano /etc/nginx/sites-available/puretrans-web
```

内容：

```nginx
server {
    listen 80;
    server_name winbeau.top www.winbeau.top;

    root /var/www/puretrans-web;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

启用站点：

```bash
sudo ln -sf /etc/nginx/sites-available/puretrans-web /etc/nginx/sites-enabled/puretrans-web
sudo nginx -t
sudo systemctl reload nginx
```

成功标志：

```text
syntax is ok
test is successful
```

## 6. 验证前后端

验证页面：

```bash
curl -I http://winbeau.top/
```

成功标志：

```text
HTTP/1.1 200 OK
Content-Type: text/html
```

验证后端反代：

```bash
curl http://winbeau.top/api/health
```

成功返回示例：

```json
{"requestId":"...","status":"ok","wechatConfigured":true}
```

最后在浏览器访问：

```text
http://winbeau.top
```

页面右上角应显示后端在线。

## 7. 失败经验：Nginx 返回 502

现象：

```text
HTTP/1.1 502 Bad Gateway
```

如果 Nginx 配置是代理到 `127.0.0.1:5174`，说明它依赖前端 `pnpm preview` 服务；当前推荐方案不再这样做。

修复方式：把 Nginx 改为静态托管：

```nginx
root /var/www/puretrans-web;
index index.html;

location / {
    try_files $uri $uri/ /index.html;
}
```

然后重新发布 `dist/`：

```bash
cd /home/winbeau/PureTrans/web-frontend
pnpm build
sudo rm -rf /var/www/puretrans-web/*
sudo cp -r dist/. /var/www/puretrans-web/
sudo chown -R www-data:www-data /var/www/puretrans-web
sudo nginx -t
sudo systemctl reload nginx
```

## 8. 失败经验：pnpm preview 的 systemd 服务启动失败

现象：

```text
/usr/bin/env: 'node': No such file or directory
puretrans-web-frontend.service: Failed with result 'exit-code'
```

原因：交互式 shell 能找到 Node，但 systemd 环境里的 `PATH` 不一定包含 Node 所在目录。

处理结论：当前不再使用 `pnpm preview + systemd` 托管前端。改用 Nginx 静态目录后，前端不需要常驻 Node 进程。

## 9. 失败经验：页面能打开但后端离线

优先检查前端构建时 API 地址：

```bash
cd /home/winbeau/PureTrans/web-frontend
cat .env
```

应为：

```dotenv
VITE_API_BASE_URL=http://winbeau.top
```

如果改过 `.env`，必须重新构建并重新复制 `dist/`：

```bash
pnpm build
sudo rm -rf /var/www/puretrans-web/*
sudo cp -r dist/. /var/www/puretrans-web/
sudo chown -R www-data:www-data /var/www/puretrans-web
sudo systemctl reload nginx
```

同时检查后端 CORS：

```bash
cd /home/winbeau/PureTrans/backend
cat .env
```

需要包含：

```dotenv
PURETRANS_CORS_ORIGINS=http://winbeau.top,http://www.winbeau.top,http://124.71.228.242:5174,http://localhost:5174,http://localhost:5173,capacitor://localhost
```

改完后端 `.env` 需要：

```bash
sudo systemctl restart puretrans-backend.service
```

## 10. 日常更新流程

以后更新前端代码时执行：

```bash
cd /home/winbeau/PureTrans
git pull
cd web-frontend
pnpm install --frozen-lockfile
printf 'VITE_API_BASE_URL=http://winbeau.top\n' > .env
pnpm build
sudo rm -rf /var/www/puretrans-web/*
sudo cp -r dist/. /var/www/puretrans-web/
sudo chown -R www-data:www-data /var/www/puretrans-web
sudo nginx -t
sudo systemctl reload nginx
```

后端没有变更时，不需要重启后端。

## 11. 后续 HTTPS

当前验证的是 HTTP。后续要启用 HTTPS，可在 Nginx 稳定后执行：

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d winbeau.top -d www.winbeau.top
```

启用 HTTPS 后，需要把前端 `.env` 和后端 CORS 从 `http://winbeau.top` 同步切换到 `https://winbeau.top`，再重新构建前端并重启后端。
