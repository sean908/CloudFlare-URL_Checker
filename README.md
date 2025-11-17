# URLChecker - Cloudflare Worker 网站监控系统

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/sean908/CloudFlare-URL_Checker)

基于 Cloudflare Workers 的网站监控与告警服务，提供 Web 管理后台、多渠道通知和 KV 持久化，以轻量方式守护站点可用性。

## 核心特性
- 定时监控（Cron 触发）自动巡检站点运行状态
- Web 管理后台，支持站点与配置的可视化管理
- 多渠道通知（Email / Telegram / Bark）及时推送告警
- 失败阈值配置，连续失败后再告警，降低误报
- 日常报告，按计划汇总每日运行与可用性
- KV 存储状态持久化，记录站点状态与通知日志

## 部署选项

选择最适合你的部署方式：

### 方式 1：一键部署（推荐，最简单）

点击上方的 "Deploy to Cloudflare Workers" 按钮，按照提示操作：
1. 授权 GitHub 访问
2. 自动创建 KV namespace 和配置资源
3. 设置环境变量（ADMIN_TOKEN 等）
4. 约 5 分钟完成部署

### 方式 2：GitHub Actions 自动部署

适合需要持续集成的场景：
1. Fork 本仓库
2. 在 GitHub Settings > Secrets 中配置：
   - `CLOUDFLARE_API_TOKEN`（[获取方式](https://dash.cloudflare.com/profile/api-tokens)）
   - `CLOUDFLARE_ACCOUNT_ID`（[在仪表板查看](https://dash.cloudflare.com/)）
3. 在 Actions 标签页手动触发 "Deploy to Cloudflare Workers" 工作流

详细步骤见 [DEPLOYMENT.md - GitHub Actions 部署](#github-actions-自动部署)。

### 方式 3：本地部署（开发者）

适合本地开发和调试：
```bash
# 1. 克隆仓库
git clone https://github.com/sean908/CloudFlare-URL_Checker
cd CloudFlare-URL_Checker

# 2. 安装依赖
npm install

# 3. 配置本地环境变量（复制示例文件）
cp .dev.vars.example .dev.vars
# 编辑 .dev.vars 填入真实值

# 4. 本地开发
npm run dev

# 5. 部署到生产
wrangler secret put ADMIN_TOKEN  # 设置生产环境 secrets
npm run deploy
```

详细步骤见 [DEPLOYMENT.md](./DEPLOYMENT.md)。

## 技术栈
- Cloudflare Workers
- TypeScript
- KV Storage
- Cron Triggers

## 文档导航
- 详细部署指南：`DEPLOYMENT.md`

