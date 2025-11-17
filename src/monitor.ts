import { Env, MonitorSite, SiteStatus, CheckResult } from './types';
import { getSites, getConfig, getSiteStatus, saveSiteStatus } from './storage';
import { sendNotifications } from './notifications';

/**
 * 定时任务：检查所有站点
 */
export async function runMonitoringCheck(env: Env): Promise<void> {
	console.log('=== Starting monitoring check ===');

	const [sites, config] = await Promise.all([
		getSites(env.STATUS_KV),
		getConfig(env.STATUS_KV),
	]);

	console.log(`Failure threshold: ${config.failureThreshold}`);

	// 只检查已启用的站点
	const enabledSites = sites.filter(s => s.enabled);

	console.log(`Total sites: ${sites.length}, Enabled: ${enabledSites.length}`);

	if (enabledSites.length === 0) {
		console.log('No enabled sites to monitor');
		return;
	}

	// 并行检查所有站点
	const checkResults = await Promise.all(
		enabledSites.map(site => checkSite(site, config.failureThreshold, env))
	);

	// 收集失败的站点
	const failedSites = checkResults
		.filter(r => r.isFailed)
		.map(r => ({
			alias: r.site.alias,
			url: r.site.url,
			error: r.error,
		}));

	const result: CheckResult = {
		totalSites: enabledSites.length,
		failedSites,
		timestamp: new Date().toISOString(),
	};

	console.log(`Check completed: ${enabledSites.length} sites, ${failedSites.length} failed`);

	// 只有在有失败站点时才发送通知
	if (failedSites.length > 0) {
		console.log(`Triggering notifications for ${failedSites.length} failed site(s)`);
		await sendNotifications(result, config, env);
	} else {
		// 即使没有失败，也记录一次检查日志（但不发送通知）
		console.log('All sites are operational, no notifications sent');
		console.log(`Checked sites: ${enabledSites.map(s => s.alias).join(', ')}`);
	}
}

/**
 * 检查单个站点
 */
async function checkSite(
	site: MonitorSite,
	failureThreshold: number,
	env: Env
): Promise<{
	site: MonitorSite;
	isFailed: boolean;
	error?: string;
}> {
	let isCurrentlyDown = false;
	let errorMessage: string | undefined;
	let statusCode: number | undefined;

	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

		const response = await fetch(site.url, {
			signal: controller.signal,
			headers: {
				'User-Agent': 'Mozilla/5.0 (compatible; SiteMonitor/1.0)',
			},
		});

		clearTimeout(timeoutId);
		statusCode = response.status;
		isCurrentlyDown = !response.ok; // 非 2xx 状态码视为失败

		if (isCurrentlyDown) {
			errorMessage = `HTTP ${response.status} ${response.statusText}`;
		}
	} catch (error) {
		isCurrentlyDown = true;
		if (error instanceof Error) {
			errorMessage = error.message;
		} else {
			errorMessage = 'Unknown error';
		}
	}

	// 获取之前的状态
	const previousStatus = await getSiteStatus(env.STATUS_KV, site.url);

	let newStatus: SiteStatus;

	if (isCurrentlyDown) {
		// 当前检查失败
		const consecutiveFailures = (previousStatus?.consecutiveFailures || 0) + 1;

		newStatus = {
			url: site.url,
			consecutiveFailures,
			lastStatus: consecutiveFailures >= failureThreshold ? 'FAILED' : previousStatus?.lastStatus || 'OK',
			lastChecked: new Date().toISOString(),
			lastError: errorMessage,
			statusCode,
		};

		// 只有达到阈值后才标记为真正失败
		const isFailed = consecutiveFailures >= failureThreshold;

		// 如果状态从 OK 变为 FAILED，或者仍然是 FAILED，记录日志
		if (isFailed && previousStatus?.lastStatus !== 'FAILED') {
			console.log(`[ALERT] ${site.alias} (${site.url}) is DOWN after ${consecutiveFailures} failures`);
		}

		await saveSiteStatus(env.STATUS_KV, newStatus);

		return {
			site,
			isFailed,
			error: errorMessage,
		};
	} else {
		// 当前检查成功
		newStatus = {
			url: site.url,
			consecutiveFailures: 0,
			lastStatus: 'OK',
			lastChecked: new Date().toISOString(),
			statusCode,
		};

		// 如果从 FAILED 恢复到 OK，记录日志
		if (previousStatus?.lastStatus === 'FAILED') {
			console.log(`[RECOVERY] ${site.alias} (${site.url}) is back UP`);
		}

		await saveSiteStatus(env.STATUS_KV, newStatus);

		return {
			site,
			isFailed: false,
		};
	}
}
