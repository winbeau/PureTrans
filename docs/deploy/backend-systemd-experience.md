# 后端 systemd 部署经验

本文记录 PureTrans 后端在服务器上用 `systemd` 长期运行的实际部署步骤、验证方式和踩坑处理。

当前服务器约定：

- 项目目录：`/home/winbeau/PureTrans`
- 后端目录：`/home/winbeau/PureTrans/backend`
- 后端端口：`8000`
- 公网 IP：`124.71.228.242`
- 域名：`winbeau.top`
- 运行用户：`winbeau`

## 1. 先确认手动启动可用

```bash
cd /home/winbeau/PureTrans/backend
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

成功标志：

```text
Uvicorn running on http://0.0.0.0:8000
```

确认后按 `Ctrl+C` 停掉。不要让手动进程和 systemd 同时抢占 `8000` 端口。

## 2. 确认 uv 路径

```bash
command -v uv
```

把输出写进 service 的 `ExecStart`。例如输出是：

```text
/home/winbeau/.local/bin/uv
```

则服务启动命令使用：

```text
/home/winbeau/.local/bin/uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## 3. 创建 systemd 服务

```bash
sudo nano /etc/systemd/system/puretrans-backend.service
```

内容：

```ini
[Unit]
Description=PureTrans Backend Service
After=network.target

[Service]
Type=simple
User=winbeau
Group=winbeau
WorkingDirectory=/home/winbeau/PureTrans/backend
ExecStart=/home/winbeau/.local/bin/uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

如果 `command -v uv` 输出不同，替换 `ExecStart` 里的 `uv` 路径。

## 4. 启动并设置开机自启

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now puretrans-backend.service
```

查看状态：

```bash
sudo systemctl status puretrans-backend.service --no-pager
```

成功标志：

```text
Active: active (running)
```

## 5. 验证接口

本机验证：

```bash
curl http://127.0.0.1:8000/api/health
```

公网验证：

```bash
curl http://124.71.228.242:8000/api/health
```

域名经 Nginx 反代验证：

```bash
curl http://winbeau.top/api/health
```

成功返回示例：

```json
{"requestId":"...","status":"ok","wechatConfigured":true}
```

## 6. 日常运维命令

```bash
sudo systemctl restart puretrans-backend.service
sudo systemctl stop puretrans-backend.service
sudo systemctl start puretrans-backend.service
sudo systemctl status puretrans-backend.service --no-pager
sudo journalctl -u puretrans-backend.service -f
sudo journalctl -u puretrans-backend.service -n 100 --no-pager
```

## 7. 失败经验：8000 端口被占用

现象：

```text
ERROR: [Errno 98] error while attempting to bind on address ('0.0.0.0', 8000): address already in use
puretrans-backend.service: Failed with result 'exit-code'
```

原因：之前手动执行的 `uv run uvicorn ... --port 8000` 还在运行，systemd 无法绑定端口。

排查：

```bash
sudo lsof -iTCP:8000 -sTCP:LISTEN
```

停掉占用进程：

```bash
sudo kill $(sudo lsof -tiTCP:8000 -sTCP:LISTEN)
```

再重启服务：

```bash
sudo systemctl restart puretrans-backend.service
sudo systemctl status puretrans-backend.service --no-pager
```

经验：后端交给 systemd 后，不再手动长期运行 `uv run uvicorn ...`。需要重启时只用 `systemctl restart`。

## 8. 失败经验：前端显示后端离线但后端日志 200

现象：

```text
"GET /api/health HTTP/1.1" 200 OK
```

但前端仍显示后端离线。

常见原因：浏览器跨域请求被 CORS 拦截。后端确实返回了 200，但浏览器不允许前端读取结果。

修复 `backend/.env`：

```dotenv
PURETRANS_CORS_ORIGINS=http://winbeau.top,http://www.winbeau.top,http://124.71.228.242:5174,http://localhost:5174,http://localhost:5173,capacitor://localhost
```

重启后端：

```bash
sudo systemctl restart puretrans-backend.service
```

注意：`backend/.env` 里有真实 Dify key，不能提交到 git。仓库只提交 `.env.example` 和 `.env.production.example`。
