import { Env } from './types';
import { runMonitoringCheck } from './monitor';
import { handleApiRequest } from './api';
import { adminHTML } from './admin';
import { fakeNginxPage } from './fake-page';
import { createLogger } from './logger';
import { getConfig } from './storage';
import { checkAndSendDailyReport } from './daily-report';

/**
 * 验证 URL 中的 token 参数
 */
function validateToken(url: URL, env: Env): boolean {
	// 如果没有设置 ADMIN_TOKEN，则不需要验证
	if (!env.ADMIN_TOKEN) {
		return true;
	}

	// 从 URL 参数获取 token
	const token = url.searchParams.get('tk');
	return token === env.ADMIN_TOKEN;
}

/**
 * 返回伪造的 Nginx 页面
 */
function returnFakePage(): Response {
	return new Response(fakeNginxPage, {
		status: 200,
		headers: {
			'Content-Type': 'text/html; charset=utf-8',
			'Server': 'nginx/1.24.0',
		},
	});
}

/**
 * Cloudflare Worker 入口点
 */
export default {
	/**
	 * HTTP 请求处理
	 */
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		// Token 验证（除了 OPTIONS 请求）
		if (request.method !== 'OPTIONS' && !validateToken(url, env)) {
			return returnFakePage();
		}

		// CORS 预检请求
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				},
			});
		}

		// API 路由
		if (url.pathname.startsWith('/api/')) {
			return handleApiRequest(request, env);
		}

		// 管理后台
		if (url.pathname === '/' || url.pathname === '/admin') {
			return new Response(adminHTML, {
				headers: {
					'Content-Type': 'text/html; charset=utf-8',
				},
			});
		}

		// 手动触发检查（用于测试）
		if (url.pathname === '/check') {
			ctx.waitUntil(runMonitoringCheck(env));
			return new Response('Monitoring check triggered', {
				headers: { 'Content-Type': 'text/plain' },
			});
		}

		return new Response('Not Found', { status: 404 });
	},

	/**
	 * 定时任务处理
	 */
	async scheduled(_controller: ScheduledController, env: Env, _ctx: ExecutionContext): Promise<void> {
		const logger = createLogger(env);
		logger.info('Cron job triggered:', new Date().toISOString());

		// 运行监控检查
		await runMonitoringCheck(env);

		// 检查并发送每日报告
		const config = await getConfig(env.STATUS_KV);
		await checkAndSendDailyReport(config, env);
	},
};
