/* MotoPRO 1.8.1: somente recursos públicos. NUNCA guardar /api, HTML privado ou cookies. */
const CACHE_NAME='motopro-public-v1.8.3';
const SAFE_FILES=['/offline.html','/icon.svg'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(SAFE_FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 if(event.request.mode!=='navigate'||event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
 event.respondWith(fetch(event.request).catch(()=>caches.match('/offline.html')));
});
const NOTICE_PATHS=['/app/avisos','/app/moto','/app/recorrentes','/app/particulares','/app/assinatura','/app/admin'];
self.addEventListener('push',event=>{
 let payload={};
 try{payload=event.data?.json()||{};}catch{}
 const title=typeof payload.title==='string'&&payload.title.length<=75?payload.title:'MotoPRO · Avisos';
 const body=typeof payload.body==='string'&&payload.body.length<=180?payload.body:'Existem avisos para você conferir no aplicativo.';
 const url=NOTICE_PATHS.includes(payload.url)?payload.url:'/app/avisos';
 event.waitUntil(self.registration.showNotification(title,{
  body,icon:'/icon-192.png',badge:'/icon-192.png',
  tag:'motopro-avisos',renotify:false,data:{url}
 }));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(async clients=>{
  const route=NOTICE_PATHS.includes(event.notification.data?.url)?event.notification.data.url:'/app/avisos';
  const target=self.location.origin+route;
  const existing=clients.find(c=>c.url.startsWith(self.location.origin+'/app'));
  if(existing){await existing.focus();if('navigate' in existing)await existing.navigate(target);return;}
  return self.clients.openWindow(target);
 }));
});
