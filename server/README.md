# 山野泊车 API

Express + PostgreSQL 的本地可运行服务。路线、营地、照片动态公开可读；写入和图片上传必须登录，修改只能由原作者执行。生产模式的图片写入阿里云 OSS，本地开发写入 `uploads/`。

## 本地启动

需要 Node.js 24、npm、Docker（或 PostgreSQL 17）。在 `server/` 目录运行：

```bash
npm ci
docker compose up -d db
cp .env.example .env
npm run migrate
npm run start
```

`GET http://127.0.0.1:4000/health` 应返回 `{"status":"ok"}`。运行 `npm run typecheck`，然后在服务启动时运行 `npm run test:smoke`，可验证双账号、公开内容、作者权限及图片上传。测试账号仅在非生产环境、显式启用且请求来自本机回环地址时开放。

## 中国大陆/阿里云部署路径

1. 在目标地域准备阿里云 RDS PostgreSQL 17、私有 OSS Bucket，以及 ECS 或容器服务中的 API 实例。数据库和 OSS 使用同地域；配置安全组，仅允许 API 访问数据库，不要将数据库端口公开到互联网。OSS 上传用最小权限账号，仅授予指定 Bucket 的写入权限；图片读取域名配置 HTTPS。正式内容访问策略和 OSS Bucket 读权限需按产品隐私要求设定，本原型假定公开图片可读。
2. 使用 `docker build -t campcar-api ./server` 构建。将 `server/.env.example` 中的变量通过云端密钥管理/环境配置注入，勿提交 `.env`。设置 `NODE_ENV=production`、`DATABASE_URL`、随机且至少 32 字符的 `JWT_SECRET`、HTTPS `PUBLIC_BASE_URL`、OSS 参数、`DEV_LOGIN_ENABLED=false`。`CORS_ORIGINS` 仅允许需要的网页来源。微信密钥只放服务端。
3. 在发布 API 前运行一次 `npm run migrate`，然后启动容器。配置 HTTPS 反向代理、域名解析、健康检查、日志、数据库备份和告警。将移动端 `EXPO_PUBLIC_API_URL` 设为 API 的 HTTPS 域名后重新构建 App；不要把密钥放入 `EXPO_PUBLIC_*`。公网提供中国大陆服务时，确认域名备案和应用所需资质。
4. 开通微信开放平台“移动应用”，准备 AppID、AppSecret、iOS Bundle ID 与 Universal Link、Android 包名及签名。服务端填写 `WECHAT_APP_ID`、`WECHAT_APP_SECRET`；移动端仍需集成对应原生微信 SDK 并制作开发构建，将微信授权 `code` 传给现有 `POST /auth/wechat`。当前 Expo Go 中不能直接验证真正的微信登录，不应把本地测试登录当成生产替代。

当前只是可运行架构，不是已部署的线上服务。发布前还需要接入内容审核、举报/下架、真实营地数据核验、隐私政策与个人信息处理流程；高德导航和照片上传需在真机验证。数据表在 `migrations/001_init.sql`，上传限制为每张 5 MB 的 JPEG/PNG/WebP。
