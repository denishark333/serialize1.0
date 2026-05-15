const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 9222;
const CORE_PATH = path.join(process.env.APPDATA, 'Serialize', 'core.js');

async function getTabs() {
    return new Promise((resolve) => {
        http.get(`http://localhost:${PORT}/json`, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); } catch (e) { resolve([]); }
            });
        }).on('error', () => resolve([]));
    });
}

async function inject(tabId) {
    const coreCode = fs.readFileSync(CORE_PATH, 'utf8');
    const payload = JSON.stringify({
        id: 1,
        method: "Runtime.evaluate",
        params: { expression: coreCode }
    });

    const req = http.request({
        hostname: 'localhost',
        port: PORT,
        path: `/devtools/page/${tabId}`,
        method: 'POST'
    });
    req.write(payload);
    req.end();
}

// Loop de monitoramento
setInterval(async () => {
    const tabs = await getTabs();
    console.log(`[Serialize] Monitorando... Abas abertas: ${tabs.length}`); // <-- ADICIONE ESTA LINHA
    const ytTabs = tabs.filter(t => t.url && t.url.includes('youtube.com') && t.type === 'page');
    
    for (const tab of ytTabs) {
        inject(tab.id);
    }
}, 3000); // Checa a cada 3 segundos
