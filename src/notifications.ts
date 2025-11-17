import { Env, CheckResult } from './types';

/**
 * 发送邮件通知（使用 MailChannels）
 */
export async function sendEmailNotification(
	recipients: string[],
	result: CheckResult,
	env: Env
): Promise<void> {
	if (!env.EMAIL_FROM) {
		console.warn('EMAIL_FROM not configured, skipping email notification');
		return;
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
	try {
		await fetch('https://api.mailchannels.net/tx/v1/send', {
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
		console.log(`Email sent to ${recipients.length} recipient(s)`);
	} catch (error) {
		console.error('Failed to send email:', error);
	}
}

/**
 * 发送 Telegram 通知
 */
export async function sendTelegramNotification(
	chatIds: string[],
	result: CheckResult,
	env: Env
): Promise<void> {
	if (!env.TELEGRAM_BOT_TOKEN) {
		console.warn('TELEGRAM_BOT_TOKEN not configured, skipping Telegram notification');
		return;
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

	for (const chatId of chatIds) {
		try {
			await fetch(apiUrl, {
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
			console.log(`Telegram notification sent to chat ${chatId}`);
		} catch (error) {
			console.error(`Failed to send Telegram to chat ${chatId}:`, error);
		}
	}
}

/**
 * 发送 Bark 通知
 */
export async function sendBarkNotification(
	deviceKeys: string[],
	result: CheckResult,
	env: Env
): Promise<void> {
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

	for (const deviceKey of deviceKeys) {
		try {
			const url = `${barkEndpoint}/${deviceKey}/${encodeURIComponent(title)}/${encodeURIComponent(body)}`;
			await fetch(url, { method: 'GET' });
			console.log(`Bark notification sent to device ${deviceKey}`);
		} catch (error) {
			console.error(`Failed to send Bark to device ${deviceKey}:`, error);
		}
	}
}

/**
 * 发送所有已启用的通知
 */
export async function sendNotifications(
	result: CheckResult,
	config: any,
	env: Env
): Promise<void> {
	const promises: Promise<void>[] = [];

	if (config.notifications.email?.enabled && config.notifications.email.recipients.length > 0) {
		promises.push(sendEmailNotification(config.notifications.email.recipients, result, env));
	}

	if (config.notifications.telegram?.enabled && config.notifications.telegram.chatIds.length > 0) {
		promises.push(sendTelegramNotification(config.notifications.telegram.chatIds, result, env));
	}

	if (config.notifications.bark?.enabled && config.notifications.bark.deviceKeys.length > 0) {
		promises.push(sendBarkNotification(config.notifications.bark.deviceKeys, result, env));
	}

	await Promise.all(promises);
}
