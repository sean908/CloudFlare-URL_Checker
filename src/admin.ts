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
        .auth-section { margin-bottom: 20px; padding: 15px; background: #fff3cd; border-radius: 4px; }
        .auth-section input { margin-top: 10px; }
        .notification-config { margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 4px; }
        .notification-config h4 { margin-bottom: 10px; }
        .tag-input { display: flex; flex-wrap: wrap; gap: 5px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; min-height: 40px; }
        .tag { background: #007bff; color: white; padding: 4px 8px; border-radius: 4px; display: flex; align-items: center; gap: 5px; }
        .tag button { background: transparent; border: none; color: white; cursor: pointer; padding: 0 4px; }
        .tag-input input { border: none; outline: none; flex: 1; min-width: 150px; }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Site Monitor Dashboard</h1>
            <p>Manage your monitored sites and notifications</p>

            <div class="auth-section" id="authSection">
                <label>Admin Token (if configured):</label>
                <input type="password" id="adminToken" placeholder="Enter admin token">
            </div>

            <div class="tabs">
                <button class="tab active" onclick="switchTab('sites')">Sites</button>
                <button class="tab" onclick="switchTab('config')">Configuration</button>
                <button class="tab" onclick="switchTab('status')">Status</button>
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

        function getAuthHeaders() {
            const token = document.getElementById('adminToken').value;
            return token ? { 'Authorization': 'Bearer ' + token } : {};
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
        }

        async function loadSites() {
            try {
                const res = await fetch(API_BASE + '/sites', { headers: getAuthHeaders() });
                const data = await res.json();
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
            } catch (error) {
                alert('Failed to load sites: ' + error.message);
            }
        }

        async function loadConfig() {
            try {
                const res = await fetch(API_BASE + '/config', { headers: getAuthHeaders() });
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
            } catch (error) {
                alert('Failed to load config: ' + error.message);
            }
        }

        async function loadStatus() {
            try {
                const res = await fetch(API_BASE + '/status', { headers: getAuthHeaders() });
                const data = await res.json();
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
            } catch (error) {
                alert('Failed to load status: ' + error.message);
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
            const res = await fetch(API_BASE + '/sites', { headers: getAuthHeaders() });
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
                await fetch(API_BASE + '/sites/' + id, {
                    method: 'DELETE',
                    headers: getAuthHeaders()
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
                const url = id ? API_BASE + '/sites/' + id : API_BASE + '/sites';
                const method = id ? 'PUT' : 'POST';
                await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
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
                }
            };

            try {
                await fetch(API_BASE + '/config', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                    body: JSON.stringify(config)
                });
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
