const CACHE="eletroshopp-final-v12";
const CORE=["./","./index.html","./manifest.webmanifest","./cart-fix.js"];

const BRAND_CSS=String.raw`<style id="eletroshopp-brand-v12">
:root{--esh-red:#e30613;--esh-red-dark:#b8000b;--esh-blue:#0057b8;--esh-blue-dark:#073b78;--esh-bg:#f5f8fc;--esh-text:#101828}
html,body{background:var(--esh-bg)!important;color:var(--esh-text)}
body{font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
header,.header,.topbar,.navbar,.nav{border-bottom:3px solid var(--esh-red)!important}
button,.btn,.button,[role="button"]{border-radius:12px!important;font-weight:800!important}
button:not([disabled]),.btn-primary,.primary,.buy,.add-cart{background:linear-gradient(135deg,var(--esh-red),var(--esh-red-dark))!important;color:#fff!important;border-color:var(--esh-red)!important;box-shadow:0 5px 16px rgba(227,6,19,.22)!important}
button:not([disabled]):hover,.btn-primary:hover,.primary:hover,.buy:hover,.add-cart:hover{background:linear-gradient(135deg,#f51a25,var(--esh-red))!important}
.price,.preco,.valor{color:var(--esh-blue)!important;font-weight:900!important}
.tag,.badge,.category{border-color:var(--esh-blue)!important;color:var(--esh-blue)!important}
.card,.product-card,.produto{border:1px solid #dbe6f4!important;box-shadow:0 8px 28px rgba(0,54,120,.08)!important}
a{color:var(--esh-blue)}
#cart,.cart-button{background:var(--esh-blue)!important;color:#fff!important}
.esh-cart-price{color:var(--esh-blue)!important;font-weight:900}
#esh-splash-v12{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:linear-gradient(145deg,#061a33 0%,#073b78 62%,#e30613 100%);color:#fff;transition:opacity .35s ease,visibility .35s ease}
#esh-splash-v12.hide{opacity:0;visibility:hidden;pointer-events:none}
#esh-splash-v12 .esh-splash-box{text-align:center;padding:32px 28px}
#esh-splash-v12 .esh-logo{width:92px;height:92px;border-radius:24px;object-fit:contain;background:#fff;padding:8px;box-shadow:0 16px 50px rgba(0,0,0,.28);margin-bottom:18px}
#esh-splash-v12 .esh-name{font-size:34px;font-weight:950;letter-spacing:-1px}
#esh-splash-v12 .esh-name span{color:#ff3340}
#esh-splash-v12 .esh-sub{margin-top:7px;font-size:14px;font-weight:700;opacity:.88}
#esh-splash-v12 .esh-loader{width:150px;height:4px;background:rgba(255,255,255,.2);border-radius:99px;margin:24px auto 0;overflow:hidden}
#esh-splash-v12 .esh-loader i{display:block;width:45%;height:100%;background:#fff;border-radius:99px;animation:eshload 1s ease-in-out infinite}
@keyframes eshload{0%{transform:translateX(-110%)}100%{transform:translateX(330%)}}
@media(prefers-reduced-motion:reduce){#esh-splash-v12{transition:none}#esh-splash-v12 .esh-loader i{animation:none}}
</style>`;

const SPLASH=String.raw`<div id="esh-splash-v12" aria-hidden="true"><div class="esh-splash-box"><img class="esh-logo" src="./icon-192.png" alt="Eletroshopp"><div class="esh-name">Eletro<span>shopp</span></div><div class="esh-sub">Tecnologia e acessórios</div><div class="esh-loader"><i></i></div></div></div>`;
const BOOT=String.raw`<script id="eletroshopp-boot-v12">
(function(){
  function ready(){
    var s=document.getElementById("esh-splash-v12");
    if(s){
      setTimeout(function(){s.classList.add("hide");setTimeout(function(){s.remove()},450)},900);
    }
    try{
      if(!document.querySelector('script[data-esh-cart-fix]')){
        var x=document.createElement("script");
        x.src="./cart-fix.js?v=12";
        x.setAttribute("data-esh-cart-fix","");
        document.head.appendChild(x);
      }
    }catch(e){}
    try{
      var m=document.querySelector('meta[name="theme-color"]');
      if(!m){m=document.createElement("meta");m.name="theme-color";document.head.appendChild(m)}
      m.content="#e30613";
    }catch(e){}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ready,{once:true});else ready();
})();
</script>`;

function headersFor(body){
  const h=new Headers(body.headers);
  h.delete("content-length");
  h.delete("content-encoding");
  h.set("content-type","text/html; charset=utf-8");
  return h;
}

async function networkDocument(req){
  try{
    const res=await fetch(req,{cache:"no-store"});
    const type=res.headers.get("content-type")||"";
    if(!type.includes("text/html"))return res;
    const html=await res.text();
    let out=html;
    if(!out.includes("eletroshopp-brand-v12"))out=out.replace(/<\/head\s*>/i,BRAND_CSS+"</head>");
    if(!out.includes("esh-splash-v12"))out=out.replace(/<body([^>]*)>/i,"<body$1>"+SPLASH);
    if(!out.includes("eletroshopp-boot-v12"))out=out.replace(/<\/body\s*>/i,BOOT+"</body>");
    return new Response(out,{status:res.status,statusText:res.statusText,headers:headersFor(res)});
  }catch(e){
    const cached=await caches.match(req);
    return cached||caches.match("./index.html")||new Response("Offline",{status:503});
  }
}

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const u=new URL(event.request.url);
  if(u.pathname.endsWith("/sw.js")){
    event.respondWith(fetch(event.request,{cache:"no-store"}));return;
  }
  if(u.pathname.endsWith("/cart-fix.js")){
    event.respondWith(fetch(event.request,{cache:"no-store"}));return;
  }
  const documentRequest=event.request.mode==="navigate"||u.pathname.endsWith("/index.html")||u.pathname.endsWith("/");
  if(documentRequest){event.respondWith(networkDocument(event.request));return;}
  event.respondWith(caches.match(event.request).then(cached=>{
    if(cached)return cached;
    return fetch(event.request).then(res=>{
      if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(event.request,copy)).catch(()=>{})}
      return res;
    }).catch(()=>cached);
  }));
});