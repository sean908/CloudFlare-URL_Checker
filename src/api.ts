import { Env, MonitorSite, GlobalConfig } from './types';
import { getSites, addSite, updateSite, deleteSite, getConfig, saveConfig, getSiteStatus } from './storage';

/**
 * API 路由处理器
 */
export async function handleApiRequest(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	const path = url.pathname;

	// 简单的 Token 认证
	const config = await getConfig(env.STATUS_KV);
	if (config.adminToken) {
		const authHeader = request.headers.get('Authorization');
		const token = authHeader?.replace('Bearer ', '');

		if (token !== config.adminToken) {
			return jsonResponse({ error: 'Unauthorized' }, 401);
		}
	}

	// 路由分发
	if (path === '/api/sites' && request.method === 'GET') {
		return handleGetSites(env);
	}

	if (path === '/api/sites' && request.method === 'POST') {
		return handleAddSite(request, env);
	}

	if (path.startsWith('/api/sites/') && request.method === 'PUT') {
		const id = path.split('/')[3];
		return handleUpdateSite(id, request, env);
	}

	if (path.startsWith('/api/sites/') && request.method === 'DELETE') {
		const id = path.split('/')[3];
		return handleDeleteSite(id, env);
	}

	if (path === '/api/config' && request.method === 'GET') {
		return handleGetConfig(env);
	}

	if (path === '/api/config' && request.method === 'PUT') {
		return handleUpdateConfig(request, env);
	}

	if (path === '/api/status' && request.method === 'GET') {
		return handleGetStatus(env);
	}

	return jsonResponse({ error: 'Not found' }, 404);
}

// GET /api/sites - 获取所有站点
async function handleGetSites(env: Env): Promise<Response> {
	try {
		const sites = await getSites(env.STATUS_KV);
		return jsonResponse({ sites });
	} catch (error) {
		return jsonResponse({ error: 'Failed to fetch sites' }, 500);
	}
}

// POST /api/sites - 添加站点
async function handleAddSite(request: Request, env: Env): Promise<Response> {
	try {
		const body = await request.json() as { alias: string; url: string };

		if (!body.alias || !body.url) {
			return jsonResponse({ error: 'alias and url are required' }, 400);
		}

		// 验证 URL 格式
		try {
			new URL(body.url);
		} catch {
			return jsonResponse({ error: 'Invalid URL format' }, 400);
		}

		const site = await addSite(env.STATUS_KV, body.alias, body.url);
		return jsonResponse({ site }, 201);
	} catch (error) {
		if (error instanceof Error && error.message === 'URL already exists') {
			return jsonResponse({ error: error.message }, 409);
		}
		return jsonResponse({ error: 'Failed to add site' }, 500);
	}
}

// PUT /api/sites/:id - 更新站点
async function handleUpdateSite(id: string, request: Request, env: Env): Promise<Response> {
	try {
		const body = await request.json() as Partial<MonitorSite>;

		// 如果更新 URL，验证格式
		if (body.url) {
			try {
				new URL(body.url);
			} catch {
				return jsonResponse({ error: 'Invalid URL format' }, 400);
			}
		}

		const site = await updateSite(env.STATUS_KV, id, body);
		return jsonResponse({ site });
	} catch (error) {
		if (error instanceof Error && error.message === 'Site not found') {
			return jsonResponse({ error: error.message }, 404);
		}
		return jsonResponse({ error: 'Failed to update site' }, 500);
	}
}

// DELETE /api/sites/:id - 删除站点
async function handleDeleteSite(id: string, env: Env): Promise<Response> {
	try {
		await deleteSite(env.STATUS_KV, id);
		return jsonResponse({ success: true });
	} catch (error) {
		if (error instanceof Error && error.message === 'Site not found') {
			return jsonResponse({ error: error.message }, 404);
		}
		return jsonResponse({ error: 'Failed to delete site' }, 500);
	}
}

// GET /api/config - 获取配置
async function handleGetConfig(env: Env): Promise<Response> {
	try {
		const config = await getConfig(env.STATUS_KV);
		return jsonResponse({ config });
	} catch (error) {
		return jsonResponse({ error: 'Failed to fetch config' }, 500);
	}
}

// PUT /api/config - 更新配置
async function handleUpdateConfig(request: Request, env: Env): Promise<Response> {
	try {
		const body = await request.json() as GlobalConfig;
		await saveConfig(env.STATUS_KV, body);
		return jsonResponse({ config: body });
	} catch (error) {
		return jsonResponse({ error: 'Failed to update config' }, 500);
	}
}

// GET /api/status - 获取所有站点状态
async function handleGetStatus(env: Env): Promise<Response> {
	try {
		const sites = await getSites(env.STATUS_KV);
		const statusPromises = sites.map(async site => {
			const status = await getSiteStatus(env.STATUS_KV, site.url);
			return {
				...site,
				status,
			};
		});

		const sitesWithStatus = await Promise.all(statusPromises);
		return jsonResponse({ sites: sitesWithStatus });
	} catch (error) {
		return jsonResponse({ error: 'Failed to fetch status' }, 500);
	}
}

// 辅助函数：返回 JSON 响应
function jsonResponse(data: any, status: number = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		},
	});
}
