const CACHE="eletroshopp-final-v11";
const CORE=["./","./index.html","./manifest.webmanifest"];

async function networkFirst(req){
  try{
    const res=await fetch(req,{cache:"no-store"});
    return res;
  }catch(e){
    const cached=await caches.match(req);
    return cached||caches.match("./index.html")||new Response("Offline",{status:503});
  }
}

self.addEventListener("install",event=>{
  event.waitUntil(
    caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  if(url.pathname.endsWith("/sw.js")){
    event.respondWith(fetch(event.request,{cache:"no-store"}));
    return;
  }
  const documentRequest=event.request.mode==="navigate"||url.pathname.endsWith("/index.html")||url.pathname.endsWith("/");
  if(documentRequest){
    event.respondWith(networkFirst(event.request));
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached=>{
      if(cached)return cached;
      return fetch(event.request).then(res=>{
        if(res.ok){
          const copy=res.clone();
          caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});
        }
        return res;
      }).catch(()=>cached);
    })
  );
});