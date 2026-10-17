const CACHE='hanzi-reader-v1';
const FILES=['./','./index.html','./style.css','./app.js','./worker.js','./manifest.webmanifest','./vendor/hanzi_lookup.js','./vendor/hanzi_lookup_bg.wasm','./data/dictionary.json','./icons/icon.svg','./icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png','./credits.html'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('hanzi-reader-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(caches.open(CACHE).then(async c=>(await c.match(e.request))||fetch(e.request)));});
self.addEventListener('message',e=>{if(e.data==='check')e.waitUntil(caches.open(CACHE).then(async c=>{const all=await Promise.all(FILES.map(f=>c.match(new URL(f,self.location.href))));e.ports[0]?.postMessage(all.every(Boolean));}));});
