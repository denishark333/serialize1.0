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
    if (!fs.existsSync(CORE_PATH)) return;
    const coreCode = fs.readFileSync(CORE_PATH, 'utf8');
    const payload = JSON.stringify({
        id: Math.floor(Math.random() * 1000),
        method: "Runtime.evaluate",
        params: { expression: coreCode }
    });

    const req = http.request({
        hostname: 'localhost',
        port: PORT,
        path: `/devtools/page/${tabId}`,
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        }
    }, (res) => {
        res.on('data', () => {}); // Consome a resposta para evitar hang up
    });

    // TRATAMENTO DE ERRO PARA NÃO DERRUBAR O PROCESSO
    req.on('error', (e) => {
        console.error(`[Serialize] Erro na injeção (Aba ${tabId}): ${e.message}`);
    });

    req.write(payload);
    req.end();
}

console.log("Serialize Bridge iniciado. Monitorando YouTube...");

setInterval(async () => {
    const tabs = await getTabs();
    console.log(`[Serialize] Monitorando... Abas abertas: ${tabs.length}`);
    
    const ytTabs = tabs.filter(t => t.url && t.url.includes('youtube.com') && t.type === 'page');
    
    for (const tab of ytTabs) {
        console.log(`[Serialize] Injetando na aba: ${tab.title}`);
        inject(tab.id);
    }
}, 5000);
