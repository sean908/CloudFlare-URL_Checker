# 部署指南

## 准备工作

你的 KV Namespace 已经创建好了：
- Production ID: `Prod_ID`
- Preview ID: `Prev_ID`

## 一键部署指南（推荐）

使用 Cloudflare Workers Deploy Button 可以在 5 分钟内完成部署，无需本地环境配置。

### 部署步骤

1. **点击部署按钮**

   在 [README.md](./README.md) 顶部点击 "Deploy to Cloudflare Workers" 按钮，或直接访问：
   ```
   https://deploy.workers.cloudflare.com/?url=https://github.com/sean908/CloudFlare-URL_Checker
   ```

2. **授权 GitHub 访问**

   首次使用需要授权 Cloudflare Workers 访问你的 GitHub 账户。

3. **配置部署**

   系统会自动：
   - Fork 仓库到你的 GitHub 账户
   - 创建新的 KV Namespace
   - 配置 Workers 项目

4. **设置环境变量**

   在部署界面设置以下 secrets（必需）：
   - `ADMIN_TOKEN`: 管理后台访问令牌（建议使用强随机字符串）

   可选 secrets：
   - `TELEGRAM_BOT_TOKEN`: Telegram Bot Token（从 @BotFather 获取）
   - `BARK_ENDPOINT`: 自建 Bark 服务器地址（使用官方服务则不需要）

5. **完成部署**

   点击 "Deploy" 按钮，等待约 1-2 分钟。部署成功后会显示 Worker URL：
   ```
   https://CloudFlare-URL_Checker.YOUR_SUBDOMAIN.workers.dev
   ```

6. **访问管理后台**

   使用设置的 `ADMIN_TOKEN` 访问：
   ```
   https://CloudFlare-URL_Checker.YOUR_SUBDOMAIN.workers.dev/?tk=your-admin-token
   ```

### 后续配置

部署完成后，在管理后台完成以下配置：

1. **配置通知接收者**（Configuration 标签页）
   - 添加 Email 收件人、Telegram Chat ID 或 Bark 设备 Key
   - 勾选要启用的通知渠道

2. **添加监控站点**（Sites 标签页）
   - 点击 "+ Add Site" 添加要监控的网站
   - 输入站点别名和 URL

3. **配置日常报告**（可选，Configuration 标签页）
   - 启用日常报告
   - 设置时区和报告时间

---

## GitHub Actions 自动部署

适合需要持续集成/持续部署（CI/CD）的场景。每次推送代码或手动触发，自动部署到 Cloudflare Workers。

### 前置条件

1. **Cloudflare API Token**

   访问 [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens) 页面：

   - 点击 "Create Token"
   - 选择 "Edit Cloudflare Workers" 模板
   - 或自定义权限：
     - Account > Cloudflare Pages > Edit
     - Account > Account Settings > Read
     - User > User Details > Read
     - Zone > Workers Routes > Edit
     - Zone > Workers Scripts > Edit
   - 点击 "Continue to summary" → "Create Token"
   - **复制生成的 Token**（只显示一次，请妥善保存）

2. **Cloudflare Account ID**

   访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)：

   - 登录后，在右侧栏查看 "Account ID"
   - 或者在任意 Worker 页面的 URL 中找到：
     ```
     https://dash.cloudflare.com/<ACCOUNT_ID>/workers/...
     ```

### 配置步骤

1. **Fork 本仓库**

   点击 GitHub 页面右上角的 "Fork" 按钮。

2. **配置 GitHub Secrets**

   在你 Fork 的仓库中：

   - 进入 `Settings` > `Secrets and variables` > `Actions`
   - 点击 "New repository secret"
   - 添加以下 secrets：

     | Name | Value | 说明 |
     |------|-------|------|
     | `CLOUDFLARE_API_TOKEN` | 你的 API Token | 从步骤 1 获取 |
     | `CLOUDFLARE_ACCOUNT_ID` | 你的 Account ID | 从步骤 2 获取 |

3. **手动触发部署**

   - 进入仓库的 `Actions` 标签页
   - 选择 "Deploy to Cloudflare Workers" 工作流
   - 点击 "Run workflow" > "Run workflow"
   - 等待部署完成（约 1-2 分钟）

4. **查看部署结果**

   在 Actions 页面查看部署日志，成功后会显示 Worker URL。

### 自动触发部署（可选）

如果希望每次推送代码时自动部署，修改 `.github/workflows/deploy.yml`：

```yaml
on:
  push:
    branches:
      - main  # 推送到 main 分支时自动部署
  workflow_dispatch:  # 保留手动触发选项
```

### 首次部署后的配置

首次通过 GitHub Actions 部署后，仍需手动配置以下生产环境 secrets：

```bash
# 在本地安装 wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 设置生产环境 secrets
wrangler secret put ADMIN_TOKEN
wrangler secret put TELEGRAM_BOT_TOKEN  # 可选
wrangler secret put BARK_ENDPOINT  # 可选
```

或者在 Cloudflare Dashboard 中手动设置：
- 进入 Workers & Pages > 你的 Worker > Settings > Variables
- 添加 Environment Variables 和 Secrets

---

## 本地开发指南

### 环境要求

- **Node.js**: 16+ ([下载地址](https://nodejs.org))
- **npm**: 8+ (通常随 Node.js 安装)
- **Wrangler CLI**: 4.40.3+ (`npm install -g wrangler`)

### 设置本地开发环境

#### 1. 安装依赖

```bash
npm install
```

#### 2. 创建 `.dev.vars` 文件

在项目根目录创建 `.dev.vars` 文件（已在 `.gitignore` 中，不会被提交）：

```bash
# 本地开发环境变量
ADMIN_TOKEN=test-token-123
TELEGRAM_BOT_TOKEN=your_bot_token_here
BARK_ENDPOINT=http://your-bark-server:port
LOG_LEVEL=DEBUG
```

**说明**：
- `ADMIN_TOKEN`: 本地测试用的访问令牌（可随意设置）
- `TELEGRAM_BOT_TOKEN`: 你的 Telegram Bot Token（可选）
- `BARK_ENDPOINT`: 自建 Bark 服务器地址（可选，使用官方服务则不需要）
- `LOG_LEVEL`: 日志级别，本地开发建议使用 `DEBUG`

#### 3. 启动开发服务器

```bash
npm run dev
```

成功启动后会看到：
```
⛅️ wrangler dev is listening on http://localhost:8787
```

#### 4. 访问本地管理后台

```
http://localhost:8787/?tk=test-token-123
```

### 本地环境限制

⚠️ **本地开发环境的已知限制**：

| 通知渠道 | 本地支持 | 说明 |
|---------|---------|------|
| **Email (MailChannels)** | ❌ | 返回 401 错误。MailChannels 仅在生产环境（已部署的 Workers）中可用。 |
| **Telegram** | ⚠️ | 可能失败，原因是 Workers 本地沙箱环境限制。 |
| **Bark** | ✅ | 完全支持，前提是 Bark 服务器可从本地网络访问。 |

**本地测试建议**：
1. 使用 Bark 作为本地测试的主要通知渠道
2. 使用 `/trigger-report` 端点测试日常报告功能
3. Email 和 Telegram 的完整测试需要部署到生产环境

## 本地部署步骤（Wrangler CLI）

适合熟悉命令行工具的开发者，提供完全的控制权。

### 1. 设置生产环境 Secrets

```bash
# 设置管理后台访问令牌（必须）
wrangler secret put ADMIN_TOKEN
# 输入一个强密码，例如: my-super-secret-token-2024

# 设置 Telegram Bot Token（可选）
wrangler secret put TELEGRAM_BOT_TOKEN
# 输入你的 bot token

# 设置 Bark 服务端点（可选）
wrangler secret put BARK_ENDPOINT
# 输入你的 Bark 服务器地址
```

### 2. 更新邮件发件人（可选）

编辑 `wrangler.jsonc`，修改 `EMAIL_FROM`:

```jsonc
"vars": {
  "EMAIL_FROM": "你的邮箱@example.com"
}
```

### 3. 部署到 Cloudflare Workers

```bash
npm run deploy
```

部署成功后，你会看到类似这样的输出：
```
Published suc-bhecker (1.23 sec)
  https://CloudFlare-URL_Checker.your-subdomain.workers.dev
```

### 4. 访问管理后台

使用你设置的 ADMIN_TOKEN 访问：
```
https://CloudFlare-URL_Checker.your-subdomain.workers.dev/?tk=your-admin-token
```

**注意**：没有 token 或 token 错误时，会显示伪造的 nginx 页面。

### 5. 配置通知（在管理后台）

1. 打开 Configuration 标签页
2. 配置通知接收者：
   - **Email**: 添加收件人邮箱
   - **Telegram**: 添加 Chat ID (TG_ID)
   - **Bark**: 添加设备 Key (BARK_KEY)
3. 勾选要启用的通知渠道
4. 点击 "Save Configuration"

#### 配置日常报告（可选）

日常报告功能会定期发送监控统计信息，帮助你了解站点健康状况和 Worker 运行状态。

**在管理后台 Configuration 标签页配置**：

1. **启用日常报告**：勾选 "Enable Daily Report"
2. **设置时区**：
   - 格式：`+H` 或 `-H`（单/双位数字）
   - 示例：
     - `+8` - UTC+8（中国、新加坡等）
     - `-5` - UTC-5（美国东部时间）
     - `+0` - UTC（默认值）
3. **设置报告时间**：
   - 格式：`HH:mm`（24 小时制）
   - 示例：`09:00`（每天 9 点发送）
4. 点击 "Save Configuration"

**测试日常报告**：

```bash
# 本地环境
curl "http://localhost:8787/trigger-report?tk=test-token-123"

# 生产环境
curl "https://CloudFlare-URL_Checker.your-subdomain.workers.dev/trigger-report?tk=your-admin-token"
```

**说明**：
- `/trigger-report` 端点会绕过时间和日期检查，立即生成并发送报告
- 报告包含：每日检查次数、失败次数、可用率等统计信息
- 日常统计数据保留 8 天（自动清理）
- 报告通过所有已启用的通知渠道发送

### 6. 添加监控站点

1. 切换到 Sites 标签页
2. 点击 "+ Add Site"
3. 输入站点别名和 URL
4. 点击 "Save"

### 7. 测试通知

手动触发一次检查：
```bash
curl "https://CloudFlare-URL_Checker.your-subdomain.workers.dev/check?tk=your-admin-token"
```

然后查看：
1. **Notifications 标签页**：查看通知日志
2. **你的手机/邮箱/Telegram**：应该收到通知

## 调试 API 参考

系统提供了几个调试端点，用于手动触发功能和测试配置。所有端点都需要通过 `?tk=xxx` 参数进行认证。

### 1. 手动触发监控检查

**端点**: `/check?tk=xxx`

**用途**: 手动触发一次完整的监控检查，无需等待 Cron 触发。

**本地环境示例**:
```bash
curl "http://localhost:8787/check?tk=test-token-123"
```

**生产环境示例**:
```bash
curl "https://CloudFlare-URL_Checker.your-subdomain.workers.dev/check?tk=your-admin-token"
```

**返回信息**:
```json
{
  "success": true,
  "message": "Check completed",
  "stats": {
    "total": 5,
    "failed": 1,
    "notificationsSent": true
  }
}
```

**适用场景**:
- 验证监控逻辑是否正常工作
- 测试通知发送功能
- 快速检查所有站点状态（不等待 Cron）
- 调试配置更改后的效果

### 2. 手动触发日常报告

**端点**: `/trigger-report?tk=xxx`

**用途**: 立即生成并发送日常报告，绕过时间和日期检查。

**本地环境示例**:
```bash
curl "http://localhost:8787/trigger-report?tk=test-token-123"
```

**生产环境示例**:
```bash
curl "https://CloudFlare-URL_Checker.your-subdomain.workers.dev/trigger-report?tk=your-admin-token"
```

**返回信息**:
```json
{
  "success": true,
  "message": "Daily report sent successfully",
  "stats": {
    "totalSites": 5,
    "totalChecks": 48,
    "totalFailures": 2
  }
}
```

**适用场景**:
- 测试日常报告功能
- 验证报告格式和内容
- 测试通知渠道（Email/Telegram/Bark）
- 调试时区和时间设置

**注意事项**:
- 该端点会强制生成报告，即使当天已经发送过
- 报告基于当前（按时区计算的）日期的统计数据
- 如果没有监控数据，报告会显示"暂无数据"

## 验证部署

### 检查 Cron 任务是否运行

```bash
# 查看实时日志
wrangler tail
```

等待 5 分钟（默认 cron 间隔），你应该看到：
```
Cron job triggered: 2024-10-02T...
Check completed: X sites, Y failed
```

### 检查通知是否发送

在生产环境，所有三种通知方式都应该正常工作：
- ✅ Email (MailChannels)
- ✅ Telegram
- ✅ Bark

## 更新 Secret

如果需要修改 token 或其他 secret：

```bash
wrangler secret put ADMIN_TOKEN
# 输入新的 token

# 无需重新部署，立即生效
```

## 回滚

如果需要回滚到之前的版本：

```bash
# 查看部署历史
wrangler deployments list

# 回滚到指定版本
wrangler rollback --message "Rollback to previous version"
```

## 故障排查

### 部署失败

```bash
# 检查 wrangler 版本
wrangler --version

# 更新 wrangler
npm install -g wrangler@latest

# 重试部署
npm run deploy
```

### 无法访问管理后台

1. 检查 URL 中是否包含 `?tk=xxx`
2. 确认 token 与设置的 `ADMIN_TOKEN` 一致
3. 尝试重新设置 secret

### 通知未发送

1. 查看 Notifications 标签页，检查日志中的错误信息
2. 确认通知渠道已启用且配置了接收者
3. 检查 secret 是否正确设置
4. 查看实时日志：`wrangler tail`

## 监控和维护

### 查看实时日志

```bash
wrangler tail
```

### 查看 KV 存储使用情况

```bash
wrangler kv:key list --namespace-id=NS_ID
```

### 手动清理通知日志

如果需要清理历史通知日志：

```bash
wrangler kv:key delete "notifications:history" --namespace-id=NS_ID
```

## 成本

- **Cloudflare Workers**: 免费层级（100,000 请求/天）
- **KV 存储**: 免费层级（1GB 存储，1000 次写入/天）
- **MailChannels**: 免费（Cloudflare 合作伙伴）
- **Telegram**: 免费
- **Bark**: 取决于你的服务器

