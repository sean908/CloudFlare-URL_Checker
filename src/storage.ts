import { MonitorSite, GlobalConfig, SiteStatus, DEFAULT_CONFIG, DailyStats } from './types';

// KV 键名常量
const KEYS = {
	SITES_LIST: 'sites:list',
	CONFIG: 'config:global',
	siteStatus: (url: string) => `status:${url}`,
	dailyStats: (date: string) => `stats:daily:${date}`,
	lastReportDate: () => 'report:last-date',
};

/**
 * 获取所有监控站点
 */
export async function getSites(kv: KVNamespace): Promise<MonitorSite[]> {
	const data = await kv.get(KEYS.SITES_LIST, 'json');
	return (data as MonitorSite[]) || [];
}

/**
 * 保存站点列表
 */
export async function saveSites(kv: KVNamespace, sites: MonitorSite[]): Promise<void> {
	await kv.put(KEYS.SITES_LIST, JSON.stringify(sites));
}

/**
 * 添加新站点
 */
export async function addSite(kv: KVNamespace, alias: string, url: string): Promise<MonitorSite> {
	const sites = await getSites(kv);

	// 检查 URL 是否已存在
	if (sites.some(s => s.url === url)) {
		throw new Error('URL already exists');
	}

	const newSite: MonitorSite = {
		id: crypto.randomUUID(),
		alias,
		url,
		enabled: true,
		createdAt: new Date().toISOString(),
	};

	sites.push(newSite);
	await saveSites(kv, sites);
	return newSite;
}

/**
 * 更新站点
 */
export async function updateSite(
	kv: KVNamespace,
	id: string,
	updates: Partial<Pick<MonitorSite, 'alias' | 'url' | 'enabled'>>
): Promise<MonitorSite> {
	const sites = await getSites(kv);
	const index = sites.findIndex(s => s.id === id);

	if (index === -1) {
		throw new Error('Site not found');
	}

	// 如果 URL 变化，删除旧的状态数据（避免 KV 空间浪费）
	const oldUrl = sites[index].url;
	if (updates.url && updates.url !== oldUrl) {
		await kv.delete(KEYS.siteStatus(oldUrl));
	}

	sites[index] = { ...sites[index], ...updates };
	await saveSites(kv, sites);
	return sites[index];
}

/**
 * 删除站点
 */
export async function deleteSite(kv: KVNamespace, id: string): Promise<void> {
	const sites = await getSites(kv);
	const filtered = sites.filter(s => s.id !== id);

	if (filtered.length === sites.length) {
		throw new Error('Site not found');
	}

	// 删除站点状态
	const deletedSite = sites.find(s => s.id === id);
	if (deletedSite) {
		await kv.delete(KEYS.siteStatus(deletedSite.url));
	}

	await saveSites(kv, filtered);
}

/**
 * 获取全局配置
 */
export async function getConfig(kv: KVNamespace): Promise<GlobalConfig> {
	const data = await kv.get(KEYS.CONFIG, 'json');
	return (data as GlobalConfig) || DEFAULT_CONFIG;
}

/**
 * 保存全局配置
 */
export async function saveConfig(kv: KVNamespace, config: GlobalConfig): Promise<void> {
	await kv.put(KEYS.CONFIG, JSON.stringify(config));
}

/**
 * 获取站点状态
 */
export async function getSiteStatus(kv: KVNamespace, url: string): Promise<SiteStatus | null> {
	const data = await kv.get(KEYS.siteStatus(url), 'json');
	return data as SiteStatus | null;
}

/**
 * 保存站点状态
 */
export async function saveSiteStatus(kv: KVNamespace, status: SiteStatus): Promise<void> {
	await kv.put(KEYS.siteStatus(status.url), JSON.stringify(status));
}

/**
 * 获取指定日期的统计数据
 */
export async function getDailyStats(kv: KVNamespace, date: string): Promise<DailyStats | null> {
	const data = await kv.get(KEYS.dailyStats(date), 'json');
	return data as DailyStats | null;
}

/**
 * 更新每日统计数据（增量更新）
 */
export async function updateDailyStats(
	kv: KVNamespace,
	date: string,
	siteUrl: string,
	siteAlias: string,
	isFailed: boolean
): Promise<void> {
	const key = KEYS.dailyStats(date);

	// 获取现有数据
	const existing = await kv.get(key, 'json') as DailyStats | null;

	const stats: DailyStats = existing || {
		date,
		sites: {}
	};

	// 初始化或更新站点统计
	if (!stats.sites[siteUrl]) {
		stats.sites[siteUrl] = {
			alias: siteAlias,
			totalChecks: 0,
			failedChecks: 0
		};
	}

	// 每次都更新 alias，确保与站点列表同步
	stats.sites[siteUrl].alias = siteAlias;

	stats.sites[siteUrl].totalChecks++;
	if (isFailed) {
		stats.sites[siteUrl].failedChecks++;
	}

	// 保存，TTL 8 天自动过期
	await kv.put(key, JSON.stringify(stats), {
		expirationTtl: 8 * 24 * 3600 // 8 days
	});
}

/**
 * 获取最后发送日报的日期
 */
export async function getLastReportDate(kv: KVNamespace): Promise<string | null> {
	return await kv.get(KEYS.lastReportDate());
}

/**
 * 设置最后发送日报的日期
 */
export async function setLastReportDate(kv: KVNamespace, date: string): Promise<void> {
	await kv.put(KEYS.lastReportDate(), date);
}
