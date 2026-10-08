const CACHE="eletroshopp-stable6";
const SHELL=["./","./index.html","./styles.css","./app.js","./data/store-products.js","./assets/logo.svg","./assets/splash.svg","./assets/app-bg.svg"];
const isSameOrigin=u=>u.origin===self.location.origin;
const isDataFile=u=>/\/data\/(store-products|catalog-images)\.js$/i.test(u.pathname);
const isNavigation=r=>r.mode==="navigate"||r.destination==="document";
async function networkFirst(request){
 const cached=await caches.match(request,{ignoreSearch:true});
 try{
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),4500);
  const response=await fetch(request,{signal:controller.signal,cache:"no-store"});
  clearTimeout(timer);
  if(response.ok){const c=await caches.open(CACHE);c.put(request,response.clone());}
  return response;
 }catch(e){return cached||new Response("Offline",{status:503,statusText:"Offline"});}
}
async function staleWhileRevalidate(request){
 const cached=await caches.match(request);
 const update=fetch(request).then(response=>{if(response.ok)caches.open(CACHE).then(c=>c.put(request,response.clone()));return response}).catch(()=>null);
 return cached||await update||new Response("",{status:503});
}
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
 if(e.request.method!=="GET")return;
 const u=new URL(e.request.url);
 if(!isSameOrigin(u))return;
 if(isNavigation(e.request)||isDataFile(u))e.respondWith(networkFirst(e.request));
 else e.respondWith(staleWhileRevalidate(e.request));
});