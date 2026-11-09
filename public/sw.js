// Service worker mínimo: não armazena informações privadas nem respostas autenticadas.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
