// 定义环境变量的类型，让 TypeScript 知道 env.STATUS_KV 的存在和类型
export interface Env {
	STATUS_KV: KVNamespace;
    // 如果你要用 Secrets 来管理 Webhook URL，可以在这里定义
    DISCORD_WEBHOOK_URL: string;
}

// 要监控的网站列表
const SITES_TO_MONITOR = [
	{ name: 'Google', url: 'https://www.google.com' },
	{ name: 'GitHub', url: 'https://www.github.com' },
	{ name: 'Cloudflare', url: 'https://www.cloudflare.com' },
    // 可以添加一个会失败的例子来测试
	{ name: 'Invalid Site', url: 'https://thissitedoesnotexist12345.com' },
];

/**
 * 当 Cron 触发器被触发时，Cloudflare 会调用这个 scheduled 方法
 */
export default {
	async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
		console.log("Cron job started: Checking site statuses...");

		// 使用 Promise.all 并行检查所有网站，效率更高
		const checkPromises = SITES_TO_MONITOR.map(site => checkSite(site, env));
		await Promise.all(checkPromises);

		console.log("Cron job finished.");
	},
};

/**
 * 检查单个网站的状态，并与 KV 中的旧状态比较
 * @param site - 要检查的网站对象 { name, url }
 * @param env - 环境变量，包含 KV Namespace
 */
async function checkSite(site: { name: string; url: string }, env: Env) {
	const kvKey = `status:${site.url}`;
	const previousStatus = await env.STATUS_KV.get(kvKey) || 'UNKNOWN';

	let currentStatus: 'UP' | 'DOWN';
	let errorMessage: string | null = null;
    let statusCode: number | null = null;

	try {
        // 设置超时，防止请求卡死太久
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时

		const response = await fetch(site.url, {
            signal: controller.signal,
            // 伪装成浏览器，避免一些网站的 User-Agent 限制
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        clearTimeout(timeoutId);

		currentStatus = response.ok ? 'UP' : 'DOWN'; // response.ok 检查状态码是否在 200-299 范围内
        statusCode = response.status;
	} catch (error) {
		currentStatus = 'DOWN';
		if (error instanceof Error) {
			errorMessage = error.message;
		}
	}

	console.log(`[${site.name}] URL: ${site.url}, Status: ${currentStatus}, Previous: ${previousStatus}`);

	// 只有当状态发生变化时，才更新 KV 并发送通知
	if (currentStatus !== previousStatus) {
		// 使用 ctx.waitUntil 确保异步操作在函数返回后也能完成
		// ctx.waitUntil(env.STATUS_KV.put(kvKey, currentStatus));
        await env.STATUS_KV.put(kvKey, currentStatus);

		const message = `🚨 Status Change for ${site.name} 🚨\n` +
			`URL: ${site.url}\n` +
			`New Status: **${currentStatus}** (was ${previousStatus})\n` +
            `${statusCode ? `Status Code: ${statusCode}\n`: ''}`+
			`${errorMessage ? `Error: ${errorMessage}\n` : ''}` +
			`Timestamp: ${new Date().toUTCString()}`;

		await sendDiscordNotification(message, env);
	}
}

/**
 * 发送通知到 Discord Webhook
 * @param message - 要发送的消息内容
 * @param env - 环境变量，用于获取 Webhook URL
 */
async function sendDiscordNotification(message: string, env: Env) {
	// 强烈建议将 Webhook URL 存储在 Worker Secrets 中，而不是硬编码
	// wrangler secret put DISCORD_WEBHOOK_URL
	const webhookUrl = env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
        console.error("DISCORD_WEBHOOK_URL is not set. Cannot send notification.");
        return;
    }

	await fetch(webhookUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			content: message,
		}),
	});
}
