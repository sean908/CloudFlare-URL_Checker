/**
 * 管理后台 HTML 页面
 */
export const adminHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Site Monitor - Admin Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; margin-bottom: 10px; }
        .tabs { display: flex; gap: 10px; margin-top: 20px; }
        .tab { padding: 10px 20px; background: #eee; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }
        .tab.active { background: #007bff; color: white; }
        .content { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: 600; }
        .status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .status.ok { background: #d4edda; color: #155724; }
        .status.failed { background: #f8d7da; color: #721c24; }
        .status.unknown { background: #e2e3e5; color: #383d41; }
        .status.success { background: #d4edda; color: #155724; }
        .status.error { background: #f8d7da; color: #721c24; }
        button { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }
        .btn-primary { background: #007bff; color: white; }
        .btn-danger { background: #dc3545; color: white; }
        .btn-success { background: #28a745; color: white; }
        .btn-secondary { background: #6c757d; color: white; }
        button:hover { opacity: 0.9; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: 500; color: #333; }
        input, textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }
        .checkbox-group { display: flex; align-items: center; gap: 8px; }
        .checkbox-group input { width: auto; }
        .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); align-items: center; justify-content: center; }
        .modal.show { display: flex; }
        .modal-content { background: white; padding: 30px; border-radius: 8px; width: 90%; max-width: 500px; }
        .modal-header { margin-bottom: 20px; }
        .modal-footer { margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end; }
        .notification-config { margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 4px; }
        .notification-config h4 { margin-bottom: 10px; }
        .tag-input { display: flex; flex-wrap: wrap; gap: 5px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; min-height: 40px; }
        .tag { background: #007bff; color: white; padding: 4px 8px; border-radius: 4px; display: flex; align-items: center; gap: 5px; }
        .tag button { background: transparent; border: none; color: white; cursor: pointer; padding: 0 4px; }
        .tag-input input { border: none; outline: none; flex: 1; min-width: 150px; }
        .notification-log { border: 1px solid #ddd; border-radius: 4px; padding: 15px; margin-bottom: 15px; }
        .notification-log-header { display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #eee; }
        .notification-log-time { font-weight: 600; color: #333; }
        .notification-log-summary { color: #666; font-size: 14px; }
        .notification-channels { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px; }
        .channel-badge { padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 500; }
        .channel-badge.email { background: #e3f2fd; color: #1976d2; }
        .channel-badge.telegram { background: #e8f5e9; color: #388e3c; }
        .channel-badge.bark { background: #fff3e0; color: #f57c00; }
        .failed-sites-list { margin-top: 10px; padding: 10px; background: #fff5f5; border-radius: 4px; }
        .failed-sites-list li { margin: 5px 0; color: #c53030; }
        .empty-state { text-align: center; padding: 40px; color: #999; }

        /* Mobile cards container - hidden on desktop */
        .mobile-cards {
            display: none;
        }

        /* Card styles for mobile */
        .site-card, .status-card {
            border: 1px solid #ddd;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 12px;
            background: white;
        }

        .card-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding-bottom: 8px;
            border-bottom: 1px solid #f0f0f0;
        }

        .card-row:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: none;
        }

        .card-label {
            font-weight: 600;
            color: #666;
            font-size: 13px;
        }

        .card-value {
            color: #333;
            font-size: 13px;
            text-align: right;
            word-break: break-all;
        }

        .card-actions {
            display: flex;
            gap: 8px;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid #f0f0f0;
        }

        .card-actions button {
            flex: 1;
        }

        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
            body { padding: 10px; }
            header { padding: 15px; }
            .content { padding: 15px; }
            h1 { font-size: 20px; }

            /* Tabs - allow wrapping */
            .tabs { flex-wrap: wrap; gap: 8px; }
            .tab { padding: 8px 12px; font-size: 13px; }

            /* Hide tables, show cards on mobile */
            table { display: none; }
            .mobile-cards { display: block; }

            /* Button adjustments */
            button { font-size: 13px; padding: 6px 12px; }

            /* Tag input */
            .tag-input input { min-width: 80px; }

            /* Notification logs */
            .notification-log-header { flex-direction: column; gap: 8px; align-items: flex-start; }
            .notification-channels { gap: 6px; }
            .channel-badge { padding: 4px 8px; font-size: 11px; }

            /* Modal - full screen on mobile */
            .modal-content {
                width: 100%;
                height: 100%;
                max-width: 100%;
                border-radius: 0;
                padding: 20px;
            }

            /* Empty state */
            .empty-state { padding: 20px; font-size: 14px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Site Monitor Dashboard</h1>
            <p>Monitoring your sites with automated health checks</p>

            <div class="tabs">
                <button class="tab active" onclick="switchTab('sites')">Sites</button>
                <button class="tab" onclick="switchTab('config')">Configuration</button>
                <button class="tab" onclick="switchTab('status')">Status</button>
                <button class="tab" onclick="switchTab('notifications')">Notifications</button>
            </div>
        </header>

        <div class="content">
            <div id="sitesTab" class="tab-content active">
                <button class="btn-primary" onclick="openAddSiteModal()">+ Add Site</button>
                <table id="sitesTable">
                    <thead>
                        <tr>
                            <th>Alias</th>
                            <th>URL</th>
                            <th>Enabled</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
                <div id="sitesCards" class="mobile-cards"></div>
            </div>

            <div id="configTab" class="tab-content">
                <form id="configForm">
                    <div class="form-group">
                        <label>Cron Schedule:</label>
                        <input type="text" id="cronSchedule" value="*/5 * * * *">
                        <small>Default: */5 * * * * (every 5 minutes)</small>
                    </div>

                    <div class="form-group">
                        <label>Failure Threshold:</label>
                        <input type="number" id="failureThreshold" value="1" min="1">
                        <small>Consecutive failures before alerting</small>
                    </div>

                    <div class="notification-config">
                        <h4>Email Notifications</h4>
                        <div class="checkbox-group">
                            <input type="checkbox" id="emailEnabled">
                            <label for="emailEnabled">Enable Email</label>
                        </div>
                        <div class="form-group">
                            <label>Recipients (press Enter to add):</label>
                            <div class="tag-input" id="emailRecipients" onclick="focusTagInput(this)">
                                <input type="text" placeholder="email@example.com" onkeydown="handleTagInput(event, 'emailRecipients')">
                            </div>
                        </div>
                    </div>

                    <div class="notification-config">
                        <h4>Telegram Notifications</h4>
                        <div class="checkbox-group">
                            <input type="checkbox" id="telegramEnabled">
                            <label for="telegramEnabled">Enable Telegram</label>
                        </div>
                        <div class="form-group">
                            <label>Chat IDs (press Enter to add):</label>
                            <div class="tag-input" id="telegramChatIds" onclick="focusTagInput(this)">
                                <input type="text" placeholder="123456789" onkeydown="handleTagInput(event, 'telegramChatIds')">
                            </div>
                        </div>
                    </div>

                    <div class="notification-config">
                        <h4>Bark Notifications</h4>
                        <div class="checkbox-group">
                            <input type="checkbox" id="barkEnabled">
                            <label for="barkEnabled">Enable Bark</label>
                        </div>
                        <div class="form-group">
                            <label>Device Keys (press Enter to add):</label>
                            <div class="tag-input" id="barkDeviceKeys" onclick="focusTagInput(this)">
                                <input type="text" placeholder="your_device_key" onkeydown="handleTagInput(event, 'barkDeviceKeys')">
                            </div>
                        </div>
                    </div>

                    <div class="notification-config">
                        <h4>📊 Daily Report</h4>
                        <div class="checkbox-group">
                            <input type="checkbox" id="dailyReportEnabled">
                            <label for="dailyReportEnabled">Enable Daily Report</label>
                        </div>
                        <div class="form-group">
                            <label>Timezone:</label>
                            <input type="text" id="dailyReportTimezone" placeholder="+8" value="+0">
                            <small>Format: +8 (UTC+8) or -5 (UTC-5), default +0 (UTC)</small>
                        </div>
                        <div class="form-group">
                            <label>Report Time:</label>
                            <input type="time" id="dailyReportTime" value="09:00">
                            <small>Daily report will be sent at this time (in your timezone)</small>
                        </div>
                    </div>

                    <button type="submit" class="btn-success">Save Configuration</button>
                </form>
            </div>

            <div id="statusTab" class="tab-content">
                <button class="btn-secondary" onclick="loadStatus()">Refresh Status</button>
                <table id="statusTable">
                    <thead>
                        <tr>
                            <th>Alias</th>
                            <th>URL</th>
                            <th>Status</th>
                            <th>Consecutive Failures</th>
                            <th>Last Checked</th>
                            <th>Last Error</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
                <div id="statusCards" class="mobile-cards"></div>
            </div>

            <div id="notificationsTab" class="tab-content">
                <button class="btn-secondary" onclick="loadNotifications()">Refresh Logs</button>
                <div id="notificationLogs"></div>
            </div>
        </div>
    </div>

    <!-- Add/Edit Site Modal -->
    <div id="siteModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="modalTitle">Add Site</h2>
            </div>
            <form id="siteForm">
                <input type="hidden" id="siteId">
                <div class="form-group">
                    <label>Alias:</label>
                    <input type="text" id="siteAlias" required>
                </div>
                <div class="form-group">
                    <label>URL:</label>
                    <input type="url" id="siteUrl" required>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" id="siteEnabled" checked>
                    <label for="siteEnabled">Enabled</label>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="closeSiteModal()">Cancel</button>
                    <button type="submit" class="btn-primary">Save</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        const API_BASE = window.location.origin + '/api';
        let currentTab = 'sites';

        // 从 URL 获取 token
        function getToken() {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get('tk') || '';
        }

        function buildApiUrl(path) {
            const token = getToken();
            const url = new URL(API_BASE + path, window.location.origin);
            if (token) {
                url.searchParams.set('tk', token);
            }
            return url.toString();
        }

        function switchTab(tab) {
            currentTab = tab;
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            event.target.classList.add('active');
            document.getElementById(tab + 'Tab').classList.add('active');

            if (tab === 'sites') loadSites();
            if (tab === 'config') loadConfig();
            if (tab === 'status') loadStatus();
            if (tab === 'notifications') loadNotifications();
        }

        async function loadSites() {
            try {
                const res = await fetch(buildApiUrl('/sites'));
                const data = await res.json();

                // Populate table (for desktop)
                const tbody = document.querySelector('#sitesTable tbody');
                tbody.innerHTML = data.sites.map(site => \`
                    <tr>
                        <td>\${site.alias}</td>
                        <td>\${site.url}</td>
                        <td>\${site.enabled ? '✓' : '✗'}</td>
                        <td>\${new Date(site.createdAt).toLocaleString()}</td>
                        <td>
                            <button class="btn-primary" onclick="editSite('\${site.id}')">Edit</button>
                            <button class="btn-danger" onclick="deleteSite('\${site.id}')">Delete</button>
                        </td>
                    </tr>
                \`).join('');

                // Populate cards (for mobile)
                const cardsContainer = document.getElementById('sitesCards');
                cardsContainer.innerHTML = data.sites.map(site => \`
                    <div class="site-card">
                        <div class="card-row">
                            <span class="card-label">Alias:</span>
                            <span class="card-value">\${site.alias}</span>
                        </div>
                        <div class="card-row">
                            <span class="card-label">URL:</span>
                            <span class="card-value">\${site.url}</span>
                        </div>
                        <div class="card-row">
                            <span class="card-label">Enabled:</span>
                            <span class="card-value">\${site.enabled ? '✓' : '✗'}</span>
                        </div>
                        <div class="card-row">
                            <span class="card-label">Created:</span>
                            <span class="card-value">\${new Date(site.createdAt).toLocaleString()}</span>
                        </div>
                        <div class="card-actions">
                            <button class="btn-primary" onclick="editSite('\${site.id}')">Edit</button>
                            <button class="btn-danger" onclick="deleteSite('\${site.id}')">Delete</button>
                        </div>
                    </div>
                \`).join('');
            } catch (error) {
                alert('Failed to load sites: ' + error.message);
            }
        }

        async function loadConfig() {
            try {
                const res = await fetch(buildApiUrl('/config'));
                const data = await res.json();
                const cfg = data.config;

                document.getElementById('cronSchedule').value = cfg.cronSchedule;
                document.getElementById('failureThreshold').value = cfg.failureThreshold;

                document.getElementById('emailEnabled').checked = cfg.notifications.email?.enabled || false;
                setTags('emailRecipients', cfg.notifications.email?.recipients || []);

                document.getElementById('telegramEnabled').checked = cfg.notifications.telegram?.enabled || false;
                setTags('telegramChatIds', cfg.notifications.telegram?.chatIds || []);

                document.getElementById('barkEnabled').checked = cfg.notifications.bark?.enabled || false;
                setTags('barkDeviceKeys', cfg.notifications.bark?.deviceKeys || []);

                // Daily Report
                document.getElementById('dailyReportEnabled').checked = cfg.dailyReport?.enabled || false;
                document.getElementById('dailyReportTimezone').value = cfg.dailyReport?.timezone || '+0';
                document.getElementById('dailyReportTime').value = cfg.dailyReport?.reportTime || '09:00';
            } catch (error) {
                alert('Failed to load config: ' + error.message);
            }
        }

        async function loadStatus() {
            try {
                const res = await fetch(buildApiUrl('/status'));
                const data = await res.json();

                // Populate table (for desktop)
                const tbody = document.querySelector('#statusTable tbody');
                tbody.innerHTML = data.sites.map(site => {
                    const status = site.status || {};
                    const statusClass = status.lastStatus === 'OK' ? 'ok' : status.lastStatus === 'FAILED' ? 'failed' : 'unknown';
                    return \`
                        <tr>
                            <td>\${site.alias}</td>
                            <td>\${site.url}</td>
                            <td><span class="status \${statusClass}">\${status.lastStatus || 'UNKNOWN'}</span></td>
                            <td>\${status.consecutiveFailures || 0}</td>
                            <td>\${status.lastChecked ? new Date(status.lastChecked).toLocaleString() : 'Never'}</td>
                            <td>\${status.lastError || '-'}</td>
                        </tr>
                    \`;
                }).join('');

                // Populate cards (for mobile)
                const cardsContainer = document.getElementById('statusCards');
                cardsContainer.innerHTML = data.sites.map(site => {
                    const status = site.status || {};
                    const statusClass = status.lastStatus === 'OK' ? 'ok' : status.lastStatus === 'FAILED' ? 'failed' : 'unknown';
                    return \`
                        <div class="status-card">
                            <div class="card-row">
                                <span class="card-label">Alias:</span>
                                <span class="card-value">\${site.alias}</span>
                            </div>
                            <div class="card-row">
                                <span class="card-label">URL:</span>
                                <span class="card-value">\${site.url}</span>
                            </div>
                            <div class="card-row">
                                <span class="card-label">Status:</span>
                                <span class="card-value"><span class="status \${statusClass}">\${status.lastStatus || 'UNKNOWN'}</span></span>
                            </div>
                            <div class="card-row">
                                <span class="card-label">Failures:</span>
                                <span class="card-value">\${status.consecutiveFailures || 0}</span>
                            </div>
                            <div class="card-row">
                                <span class="card-label">Last Checked:</span>
                                <span class="card-value">\${status.lastChecked ? new Date(status.lastChecked).toLocaleString() : 'Never'}</span>
                            </div>
                            <div class="card-row">
                                <span class="card-label">Error:</span>
                                <span class="card-value">\${status.lastError || '-'}</span>
                            </div>
                        </div>
                    \`;
                }).join('');
            } catch (error) {
                alert('Failed to load status: ' + error.message);
            }
        }

        async function loadNotifications() {
            try {
                const res = await fetch(buildApiUrl('/notifications'));
                const data = await res.json();
                const container = document.getElementById('notificationLogs');

                if (data.logs.length === 0) {
                    container.innerHTML = '<div class="empty-state">No notification logs yet</div>';
                    return;
                }

                container.innerHTML = data.logs.map(log => {
                    const channelsHtml = log.channels.map(ch => {
                        const statusClass = ch.success ? 'success' : 'error';
                        const recipients = ch.recipients ? \` (\${ch.recipients.length})\` : '';
                        return \`<span class="status \${statusClass}">\${ch.type.toUpperCase()}\${recipients}</span>\`;
                    }).join(' ');

                    const failedSitesHtml = log.result.failedSites.length > 0 ? \`
                        <div class="failed-sites-list">
                            <strong>Failed Sites:</strong>
                            <ul>
                                \${log.result.failedSites.map(s => \`<li>\${s.alias} - \${s.url}\${s.error ? ' (' + s.error + ')' : ''}</li>\`).join('')}
                            </ul>
                        </div>
                    \` : '';

                    return \`
                        <div class="notification-log">
                            <div class="notification-log-header">
                                <div class="notification-log-time">\${new Date(log.timestamp).toLocaleString()}</div>
                                <div class="notification-log-summary">
                                    Checked: \${log.result.totalSites} | Failed: \${log.result.failedSites.length}
                                </div>
                            </div>
                            <div class="notification-channels">
                                \${channelsHtml}
                            </div>
                            \${failedSitesHtml}
                        </div>
                    \`;
                }).join('');
            } catch (error) {
                alert('Failed to load notifications: ' + error.message);
            }
        }

        function openAddSiteModal() {
            document.getElementById('modalTitle').textContent = 'Add Site';
            document.getElementById('siteForm').reset();
            document.getElementById('siteId').value = '';
            document.getElementById('siteModal').classList.add('show');
        }

        function closeSiteModal() {
            document.getElementById('siteModal').classList.remove('show');
        }

        async function editSite(id) {
            const res = await fetch(buildApiUrl('/sites'));
            const data = await res.json();
            const site = data.sites.find(s => s.id === id);
            if (!site) return;

            document.getElementById('modalTitle').textContent = 'Edit Site';
            document.getElementById('siteId').value = site.id;
            document.getElementById('siteAlias').value = site.alias;
            document.getElementById('siteUrl').value = site.url;
            document.getElementById('siteEnabled').checked = site.enabled;
            document.getElementById('siteModal').classList.add('show');
        }

        async function deleteSite(id) {
            if (!confirm('Are you sure you want to delete this site?')) return;
            try {
                await fetch(buildApiUrl('/sites/' + id), {
                    method: 'DELETE'
                });
                loadSites();
            } catch (error) {
                alert('Failed to delete site: ' + error.message);
            }
        }

        document.getElementById('siteForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('siteId').value;
            const data = {
                alias: document.getElementById('siteAlias').value,
                url: document.getElementById('siteUrl').value,
                enabled: document.getElementById('siteEnabled').checked
            };

            try {
                const path = id ? '/sites/' + id : '/sites';
                const method = id ? 'PUT' : 'POST';
                await fetch(buildApiUrl(path), {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                closeSiteModal();
                loadSites();
            } catch (error) {
                alert('Failed to save site: ' + error.message);
            }
        });

        document.getElementById('configForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const config = {
                cronSchedule: document.getElementById('cronSchedule').value,
                failureThreshold: parseInt(document.getElementById('failureThreshold').value),
                notifications: {
                    email: {
                        enabled: document.getElementById('emailEnabled').checked,
                        recipients: getTags('emailRecipients')
                    },
                    telegram: {
                        enabled: document.getElementById('telegramEnabled').checked,
                        chatIds: getTags('telegramChatIds')
                    },
                    bark: {
                        enabled: document.getElementById('barkEnabled').checked,
                        deviceKeys: getTags('barkDeviceKeys')
                    }
                },
                dailyReport: {
                    enabled: document.getElementById('dailyReportEnabled').checked,
                    timezone: document.getElementById('dailyReportTimezone').value.trim() || '+0',
                    reportTime: document.getElementById('dailyReportTime').value || '09:00'
                }
            };

            try {
                const response = await fetch(buildApiUrl('/config'), {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(config)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    alert('Failed to save config: ' + (errorData.error || 'Unknown error'));
                    return;
                }

                alert('Configuration saved successfully!');
            } catch (error) {
                alert('Failed to save config: ' + error.message);
            }
        });

        function handleTagInput(event, containerId) {
            if (event.key === 'Enter') {
                event.preventDefault();
                const input = event.target;
                const value = input.value.trim();
                if (value) {
                    addTag(containerId, value);
                    input.value = '';
                }
            }
        }

        function addTag(containerId, value) {
            const container = document.getElementById(containerId);
            const input = container.querySelector('input');
            const tag = document.createElement('span');
            tag.className = 'tag';
            tag.innerHTML = \`\${value} <button onclick="this.parentElement.remove()">&times;</button>\`;
            container.insertBefore(tag, input);
        }

        function getTags(containerId) {
            const container = document.getElementById(containerId);
            return Array.from(container.querySelectorAll('.tag')).map(tag => tag.textContent.replace('×', '').trim());
        }

        function setTags(containerId, values) {
            const container = document.getElementById(containerId);
            container.querySelectorAll('.tag').forEach(tag => tag.remove());
            values.forEach(value => addTag(containerId, value));
        }

        function focusTagInput(container) {
            container.querySelector('input').focus();
        }

        // Load sites on page load
        loadSites();
    </script>
</body>
</html>`;
