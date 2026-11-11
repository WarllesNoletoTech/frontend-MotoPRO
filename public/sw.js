/* MotoPRO 1.7: somente recursos públicos. NUNCA guardar /api, HTML privado ou cookies. */
const CACHE_NAME='motopro-public-v1.7.0';
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
self.addEventListener('push',event=>{
 let payload={};
 try{payload=event.data?.json()||{};}catch{}
 const title='MotoPRO · Avisos';
 const url=payload.url==='/app/avisos'?'/app/avisos':'/app/avisos';
 event.waitUntil(self.registration.showNotification(title,{
  body:'Existem avisos para você conferir no aplicativo.',
  icon:'/icon-192.png',badge:'/icon-192.png',
  tag:'motopro-avisos',renotify:false,data:{url}
 }));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(async clients=>{
  const target=self.location.origin+'/app/avisos';
  const existing=clients.find(c=>c.url.startsWith(self.location.origin+'/app'));
  if(existing){await existing.focus();if('navigate' in existing)await existing.navigate(target);return;}
  return self.clients.openWindow(target);
 }));
});
