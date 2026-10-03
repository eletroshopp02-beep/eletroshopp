const CACHE="eletroshopp-final-v16";
const CORE=["./","./index.html","./manifest.webmanifest","./app.js","./cart-fix.js"];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});
async function networkFirst(req){
  try{
    const res=await fetch(req,{cache:"no-store"});
    if(res&&res.ok){
      const copy=res.clone();
      caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});
    }
    return res;
  }catch(e){
    return caches.match(req).then(c=>c||caches.match("./index.html")||new Response("Offline",{status:503}));
  }
}
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const u=new URL(event.request.url);
  if(u.origin!==location.origin)return;
  if(u.pathname.endsWith("/sw.js")||event.request.mode==="navigate"||u.pathname.endsWith("/index.html")||u.pathname.endsWith("/")){
    event.respondWith(networkFirst(event.request));return;
  }
  event.respondWith(caches.match(event.request).then(cached=>{
    if(cached)return cached;
    return fetch(event.request).then(res=>{
      if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(event.request,copy)).catch(()=>{});}
      return res;
    }).catch(()=>cached);
  }));
});