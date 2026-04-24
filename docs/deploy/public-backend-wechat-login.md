# 公网服务器后端接入与真机微信登录部署

本文把当前微信登录链路固定为一套长期可用的部署方式：

- 后端固定运行在公网服务器 `124.71.228.242:8000`
- 后端使用 `systemd + uv` 托管
- 前端在构建时通过 `frontend/.env.production.local` 注入后端地址

完成一次配置后，普通用户安装 APK 即可直接点击“使用微信登录”，不需要再手动输入任何微信相关信息。

## 1. 服务器准备

默认假设：

- Linux 云服务器地址为 `124.71.228.242`
- 项目代码部署在 `/opt/puretrans`
- 后端工作目录为 `/opt/puretrans/backend`
- 已安装 Python 3.11+、`uv`，并已把后端依赖同步完成

如目录不同，只需要同步修改 `systemd` 模板里的 `WorkingDirectory`。

## 2. 配置服务器环境变量

仓库中提供了示例文件 [backend/.env.production.example](/home/winbeau/Android/PureTrans/backend/.env.production.example:1)，真实值不要写入 git。

在服务器上创建目录和真实环境文件：

```bash
sudo mkdir -p /etc/puretrans
sudo cp /opt/puretrans/backend/.env.production.example /etc/puretrans/backend.env
sudo chmod 600 /etc/puretrans/backend.env
```

然后编辑 `/etc/puretrans/backend.env`，至少包含以下变量：

```dotenv
PURETRANS_WECHAT_APP_ID=你的微信开放平台 AppID
PURETRANS_WECHAT_APP_SECRET=你的微信开放平台 AppSecret
PURETRANS_AUTH_STATE_SIGNING_KEY=长随机字符串A
PURETRANS_SESSION_SIGNING_KEY=长随机字符串B
PURETRANS_SESSION_TTL_SECONDS=7200
PURETRANS_CORS_ORIGINS=capacitor://localhost,http://localhost
```

要求：

- `PURETRANS_AUTH_STATE_SIGNING_KEY` 和 `PURETRANS_SESSION_SIGNING_KEY` 必须是两条不同的长随机字符串
- 所有微信密钥和签名 key 只保留在服务器环境，不进入前端，不进入仓库
- 当前移动端默认只需要 `capacitor://localhost,http://localhost` 这组 CORS 来源

## 3. 安装并启用 systemd 服务

仓库中提供了模板 [deploy/puretrans-backend.service.example](/home/winbeau/Android/PureTrans/deploy/puretrans-backend.service.example:1)。

部署步骤：

```bash
sudo cp /opt/puretrans/deploy/puretrans-backend.service.example /etc/systemd/system/puretrans-backend.service
sudo systemctl daemon-reload
sudo systemctl enable --now puretrans-backend.service
sudo systemctl status puretrans-backend.service
```

模板中的核心启动命令固定为：

```bash
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

`systemd` 通过 `EnvironmentFile=/etc/puretrans/backend.env` 加载真实环境变量，因此不需要每次登录服务器后手动 `export`。

如果你使用的运行用户不是 `puretrans`，需要同时调整服务文件中的 `User` 和 `Group`。

## 4. 验证后端健康状态

服务启动后，在服务器本机或任意能访问公网 IP 的终端执行：

```bash
curl http://124.71.228.242:8000/api/health
```

预期返回 JSON 中包含：

- `status: "ok"`
- `wechatConfigured: true`

如果 `wechatConfigured` 为 `false`，说明 `/etc/puretrans/backend.env` 中仍缺少微信登录相关配置。

## 5. 配置前端生产地址

仓库中提供了示例文件 [frontend/.env.production.example](/home/winbeau/Android/PureTrans/frontend/.env.production.example:1)。

在本地开发机创建真实构建配置：

```bash
cp frontend/.env.production.example frontend/.env.production.local
```

确保 `frontend/.env.production.local` 中固定指向公网后端：

```dotenv
VITE_API_BASE_URL=http://124.71.228.242:8000
```

注意：

- 移动端不能使用 `127.0.0.1` 或 `localhost` 访问你电脑上的后端
- 真机安装包里的请求地址来自构建时 env，改地址后需要重新构建 APK
- `frontend/.env.production.local` 已加入 `.gitignore`，不要提交真实环境文件

## 6. 构建、同步与打包 APK

在项目根目录按以下顺序执行：

```bash
cd frontend
pnpm build
pnpm cap sync android
cd android
gradle assembleDebug
```

如果 `./gradlew assembleDebug` 因下载 Gradle 超时，而系统 `gradle --version` 显示为 `8.7`，优先使用系统 `gradle assembleDebug`。

## 7. 安装到真机并验证微信登录

把生成的 debug APK 安装到 Android 真机后，至少验证以下流程：

1. 启动 App，登录页不再显示“后端未完成微信登录配置”
2. “使用微信登录”按钮可点击
3. 点击按钮后能够拉起微信
4. 微信授权完成后能够回跳 App
5. 回跳后成功调用 `/api/auth/wechat/exchange` 并建立会话

如果第 1 步失败，优先检查：

- `frontend/.env.production.local` 是否是公网地址
- APK 是否在修改 env 后重新执行了 `pnpm build` 和 `pnpm cap sync android`
- 服务器 `/api/health` 返回的 `wechatConfigured` 是否为 `true`

## 8. 后续切换 HTTPS 或域名

当前默认使用 `http://124.71.228.242:8000`，这次实现不额外引入域名和 HTTPS。

后续如果切换到正式域名或反向代理 HTTPS，默认不需要修改微信登录业务代码，只需要调整：

- `frontend/.env.production.local` 中的 `VITE_API_BASE_URL`
- 服务器的反向代理或监听配置

只要后端认证 API 保持不变，前后端的微信登录链路不需要重写。
