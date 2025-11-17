import { Env, CheckResult, NotificationLog, GlobalConfig } from './types';

/**
 * 发送邮件通知（使用 MailChannels）
 */
export async function sendEmailNotification(
	recipients: string[],
	result: CheckResult,
	env: Env
): Promise<{ success: boolean; error?: string }> {
	if (!env.EMAIL_FROM) {
		console.warn('EMAIL_FROM not configured, skipping email notification');
		return { success: false, error: 'EMAIL_FROM not configured' };
	}

	const subject = result.failedSites.length > 0
		? `[Alert] ${result.failedSites.length} Site(s) Down - ${new Date(result.timestamp).toUTCString()}`
		: `[OK] All Sites Up - ${new Date(result.timestamp).toUTCString()}`;

	let body = `Monitoring Report\n`;
	body += `Time: ${new Date(result.timestamp).toUTCString()}\n`;
	body += `Total Sites Checked: ${result.totalSites}\n`;
	body += `Failed Sites: ${result.failedSites.length}\n\n`;

	if (result.failedSites.length > 0) {
		body += `Failed Sites:\n`;
		result.failedSites.forEach(site => {
			body += `- ${site.alias} (${site.url})\n`;
			if (site.error) {
				body += `  Error: ${site.error}\n`;
			}
		});
	} else {
		body += `All sites are operational.\n`;
	}

	// 使用 MailChannels API（Cloudflare Workers 免费邮件发送）
	// 注意：MailChannels 在本地开发环境可能无法使用，需要部署到 Cloudflare Workers
	try {
		console.log(`Sending email to ${recipients.length} recipient(s) via MailChannels`);
		const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				personalizations: [
					{
						to: recipients.map(email => ({ email })),
					},
				],
				from: {
					email: env.EMAIL_FROM,
					name: 'Site Monitor',
				},
				subject,
				content: [
					{
						type: 'text/plain',
						value: body,
					},
				],
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			const error = `HTTP ${response.status}: ${errorText.substring(0, 200)}`;
			console.error('Failed to send email:', error);

			// 如果是 401 错误，可能是在本地开发环境
			if (response.status === 401) {
				console.warn('MailChannels requires deployment to Cloudflare Workers. Email will work in production.');
			}

			return { success: false, error };
		}

		console.log(`Email sent to ${recipients.length} recipient(s)`);
		return { success: true };
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : 'Unknown error';
		console.error('Failed to send email:', errorMsg);
		return { success: false, error: errorMsg };
	}
}

/**
 * 发送 Telegram 通知
 */
export async function sendTelegramNotification(
	chatIds: string[],
	result: CheckResult,
	env: Env
): Promise<{ success: boolean; error?: string }> {
	if (!env.TELEGRAM_BOT_TOKEN) {
		console.warn('TELEGRAM_BOT_TOKEN not configured, skipping Telegram notification');
		return { success: false, error: 'TELEGRAM_BOT_TOKEN not configured' };
	}

	let message = `🔔 *Site Monitoring Report*\n\n`;
	message += `⏰ Time: ${new Date(result.timestamp).toUTCString()}\n`;
	message += `📊 Total Sites: ${result.totalSites}\n`;
	message += `❌ Failed: ${result.failedSites.length}\n\n`;

	if (result.failedSites.length > 0) {
		message += `*Failed Sites:*\n`;
		result.failedSites.forEach(site => {
			message += `🔻 *${site.alias}*\n`;
			message += `   URL: \`${site.url}\`\n`;
			if (site.error) {
				message += `   Error: ${site.error}\n`;
			}
		});
	} else {
		message += `✅ All sites are operational!`;
	}

	const apiUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
	const errors: string[] = [];

	for (const chatId of chatIds) {
		try {
			console.log(`Sending Telegram notification to chat ${chatId}`);
			const response = await fetch(apiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					chat_id: chatId,
					text: message,
					parse_mode: 'Markdown',
				}),
			});

			if (!response.ok) {
				const responseText = await response.text();
				const error = `Chat ${chatId}: HTTP ${response.status} - ${responseText.substring(0, 100)}`;
				console.error(`Failed to send Telegram to chat ${chatId}:`, error);
				errors.push(error);
			} else {
				const result = await response.json();
				console.log(`Telegram notification sent to chat ${chatId}`, result);
			}
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			console.error(`Failed to send Telegram to chat ${chatId}:`, errorMsg);
			errors.push(`Chat ${chatId}: ${errorMsg}`);
		}
	}

	return errors.length === 0
		? { success: true }
		: { success: false, error: errors.join('; ') };
}

/**
 * 发送 Bark 通知
 */
export async function sendBarkNotification(
	deviceKeys: string[],
	result: CheckResult,
	env: Env
): Promise<{ success: boolean; error?: string }> {
	const barkEndpoint = env.BARK_ENDPOINT || 'https://api.day.app';

	const title = result.failedSites.length > 0
		? `⚠️ ${result.failedSites.length} Site(s) Down`
		: `✅ All Sites Up`;

	let body = `Time: ${new Date(result.timestamp).toUTCString()}\n`;
	body += `Checked: ${result.totalSites} sites\n`;

	if (result.failedSites.length > 0) {
		body += `Failed:\n`;
		result.failedSites.forEach(site => {
			body += `- ${site.alias}\n`;
		});
	}

	const errors: string[] = [];

	for (const deviceKey of deviceKeys) {
		try {
			// 清理 deviceKey 和 endpoint，避免双斜杠
			const cleanEndpoint = barkEndpoint.replace(/\/$/, '');
			const cleanKey = deviceKey.replace(/^\//, '').replace(/\/$/, '');
			const url = `${cleanEndpoint}/${cleanKey}/${encodeURIComponent(title)}/${encodeURIComponent(body)}`;

			console.log(`Sending Bark notification to: ${url.substring(0, 100)}...`);
			const response = await fetch(url, { method: 'GET' });

			if (!response.ok) {
				const error = `Device ${deviceKey}: HTTP ${response.status}`;
				console.error(`Failed to send Bark to device ${deviceKey}:`, error);
				errors.push(error);
			} else {
				console.log(`Bark notification sent to device ${deviceKey}`);
			}
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Unknown error';
			console.error(`Failed to send Bark to device ${deviceKey}:`, errorMsg);
			errors.push(`Device ${deviceKey}: ${errorMsg}`);
		}
	}

	return errors.length === 0
		? { success: true }
		: { success: false, error: errors.join('; ') };
}

/**
 * 发送所有已启用的通知并记录日志
 */
export async function sendNotifications(
	result: CheckResult,
	config: GlobalConfig,
	env: Env
): Promise<void> {
	console.log('=== Starting notification dispatch ===');
	console.log(`Failed sites count: ${result.failedSites.length}`);
	console.log(`Email enabled: ${config.notifications.email?.enabled}, Recipients: ${config.notifications.email?.recipients.length || 0}`);
	console.log(`Telegram enabled: ${config.notifications.telegram?.enabled}, Chat IDs: ${config.notifications.telegram?.chatIds.length || 0}`);
	console.log(`Bark enabled: ${config.notifications.bark?.enabled}, Device keys: ${config.notifications.bark?.deviceKeys.length || 0}`);

	const channels: NotificationLog['channels'] = [];

	// 发送邮件
	if (config.notifications.email?.enabled && config.notifications.email.recipients.length > 0) {
		console.log('Attempting to send email notification...');
		const emailResult = await sendEmailNotification(config.notifications.email.recipients, result, env);
		console.log(`Email result: ${emailResult.success ? 'SUCCESS' : 'FAILED'} ${emailResult.error || ''}`);
		channels.push({
			type: 'email',
			success: emailResult.success,
			error: emailResult.error,
			recipients: config.notifications.email.recipients,
		});
	} else {
		console.log('Email notification skipped (not enabled or no recipients)');
	}

	// 发送 Telegram
	if (config.notifications.telegram?.enabled && config.notifications.telegram.chatIds.length > 0) {
		console.log('Attempting to send Telegram notification...');
		const telegramResult = await sendTelegramNotification(config.notifications.telegram.chatIds, result, env);
		console.log(`Telegram result: ${telegramResult.success ? 'SUCCESS' : 'FAILED'} ${telegramResult.error || ''}`);
		channels.push({
			type: 'telegram',
			success: telegramResult.success,
			error: telegramResult.error,
			recipients: config.notifications.telegram.chatIds,
		});
	} else {
		console.log('Telegram notification skipped (not enabled or no chat IDs)');
	}

	// 发送 Bark
	if (config.notifications.bark?.enabled && config.notifications.bark.deviceKeys.length > 0) {
		console.log('Attempting to send Bark notification...');
		const barkResult = await sendBarkNotification(config.notifications.bark.deviceKeys, result, env);
		console.log(`Bark result: ${barkResult.success ? 'SUCCESS' : 'FAILED'} ${barkResult.error || ''}`);
		channels.push({
			type: 'bark',
			success: barkResult.success,
			error: barkResult.error,
			recipients: config.notifications.bark.deviceKeys,
		});
	} else {
		console.log('Bark notification skipped (not enabled or no device keys)');
	}

	// 总是保存通知日志（即使没有发送任何通知）
	await saveNotificationLog(env.STATUS_KV, {
		id: crypto.randomUUID(),
		timestamp: new Date().toISOString(),
		result,
		channels,
	});

	if (channels.length > 0) {
		console.log(`Notifications sent via ${channels.length} channel(s)`);
	} else {
		console.log('No notification channels configured');
	}
}

/**
 * 保存通知日志（保留最近 50 条）
 */
async function saveNotificationLog(kv: KVNamespace, log: NotificationLog): Promise<void> {
	const KEY = 'notifications:history';
	const MAX_LOGS = 50;

	try {
		const existingData = await kv.get(KEY, 'json');
		const logs: NotificationLog[] = (existingData as NotificationLog[]) || [];

		// 添加新日志到开头
		logs.unshift(log);

		// 保留最近 50 条
		const trimmedLogs = logs.slice(0, MAX_LOGS);

		await kv.put(KEY, JSON.stringify(trimmedLogs));
		console.log(`Notification log saved (${log.channels.length} channels)`);
	} catch (error) {
		console.error('Failed to save notification log:', error);
	}
}

/**
 * 获取通知日志历史
 */
export async function getNotificationLogs(kv: KVNamespace): Promise<NotificationLog[]> {
	const KEY = 'notifications:history';
	try {
		const data = await kv.get(KEY, 'json');
		return (data as NotificationLog[]) || [];
	} catch (error) {
		console.error('Failed to get notification logs:', error);
		return [];
	}
}
