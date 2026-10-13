# 山野泊车

一个面向露营与房车自驾的 iOS / Android 应用原型，使用 Expo SDK 57、React Native 和 TypeScript。

## 已实现

- 浏览、搜索和筛选自驾路线；创建、编辑包含多日途经点和备注的路书；通过系统分享路书文本。
- 从相册选择照片，发布带地点和文字的动态。
- 浏览、搜索和收录营地，记录营位价格、房车补水/接电情况及对应费用。
- 在路线途经点或营地详情中打开高德地图。填写经纬度时直接打开驾车导航；仅有名称时打开地图搜索，供用户确认准确地点。
- 路书、营地、动态和收藏保存在当前设备。照片复制到应用文档目录，以便重新打开应用后继续显示。
- 可选云端服务：PostgreSQL 存储路线、营地与动态；图片上传至本地开发目录或阿里云 OSS。登录后可公开发布，也可手动同步已有本机内容。

首启展示的路线、营地和动态均为示例。示例营地的设施和费用是演示数据，不能作为实际出行依据。

## 本地运行

需要 Node.js 22.13+ 或 24.3+、npm，以及手机上的 Expo Go。安卓或 iOS 模拟器为可选。

```bash
cd /workspace/campcar
npm ci
npm start
```

在同一网络下使用 Expo Go 扫描终端二维码。也可运行 `npm run android`、`npm run ios` 或 `npm run web`。开发检查：

```bash
npm run typecheck
npx expo export --platform all
```

## 本机联调云端功能

云端 API 独立放在 [`server/`](server/README.md)。需要 Docker 或本机 PostgreSQL：

```bash
cd server
npm ci
docker compose up -d db
cp .env.example .env
npm run migrate
npm run start
```

另一个终端回到仓库根目录，复制 `.env.example` 为 `.env`，再运行 `npm start`。网页可以使用示例的 `127.0.0.1`；手机真机须将 API 地址及服务端 `PUBLIC_BASE_URL` 都改为开发电脑可访问的局域网 IP，并让后端监听该地址。开发账号入口只在 `DEV_LOGIN_ENABLED=true` 且请求来自本机回环地址时可用，因此真机联调需等正式登录接入或使用模拟器的本地转发。本地测试账号不是微信账号，不能用于生产。

## 当前范围

没有配置 API 时仍可离线试用。已具备可本地运行的跨账号公开内容和图片上传架构，但尚未接入微信移动应用 SDK；`/auth/wechat` 仅是服务端授权码交换接口，需先取得微信开放平台移动应用资质和参数。评论、内容审核与举报、正式上架所需隐私/合规流程均未实现。系统分享会发送路书或营地的文字内容。正式上架前，还需在实体 iOS/Android 设备上验证相册和地图唤起。
