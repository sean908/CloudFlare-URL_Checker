import { Env } from './types';
import { runMonitoringCheck } from './monitor';
import { handleApiRequest } from './api';
import { adminHTML } from './admin';

/**
 * Cloudflare Worker 入口点
 */
export default {
	/**
	 * HTTP 请求处理
	 */
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

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
		console.log('Cron job triggered:', new Date().toISOString());
		await runMonitoringCheck(env);
	},
};
