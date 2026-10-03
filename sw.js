const CACHE="eletroshopp-final-v9";
const CORE=["./","./index.html","./manifest.webmanifest"];

const CART_PATCH=String.raw`<script>
(function(){
  if(window.__ELETRO_CART_PATCH_V9)return;
  window.__ELETRO_CART_PATCH_V9=true;

  function getCode(el){
    let n=el;
    for(let depth=0;n&&depth<6;depth++,n=n.parentElement){
      const s=(n.getAttribute&&n.getAttribute("onclick"))||"";
      const m=s.match(/(?:addFromDetail|buyNowFromDetail|addQuantityToCart|add)\s*\(\s*['"]([^'"]+)['"]/i);
      if(m)return m[1];
      const d=n.dataset||{};
      if(d.code)return d.code;
      if(d.productCode)return d.productCode;
      const attrs=["data-product","data-id","data-code"];
      for(const a of attrs){const v=n.getAttribute&&n.getAttribute(a);if(v)return v}
    }
    return null;
  }

  function callAdd(code,qty){
    if(!code)return false;
    try{
      if(typeof window.addQuantityToCart==="function"){
        const r=window.addQuantityToCart(code,qty||1);
        if(r!==false)return true;
      }
    }catch(e){console.error("Eletroshopp cart patch",e)}
    try{
      if(typeof window.add==="function"){
        window.add(code);
        for(let i=1;i<(qty||1);i++)window.add(code);
        if(typeof window.updateEletroCart==="function")window.updateEletroCart();
        return true;
      }
    }catch(e){console.error("Eletroshopp cart fallback",e)}
    return false;
  }

  document.addEventListener("click",function(e){
    const b=e.target.closest&&e.target.closest("button,a");
    if(!b)return;
    const txt=(b.innerText||b.textContent||"").trim().toLowerCase();
    if(!/(adicionar ao carrinho|adicionar|comprar agora)/i.test(txt))return;
    if(/ver detalhes e comprar/i.test(txt))return;
    const code=getCode(b);
    if(code){
      e.preventDefault();
      e.stopImmediatePropagation();
      const ok=callAdd(code,1);
      if(ok && typeof window.showEletroToast==="function")window.showEletroToast("Produto adicionado ao carrinho!");
      if(ok && typeof window.openEletroCart==="function")window.openEletroCart();
    }
  },true);

  const originalAdd=window.addQuantityToCart;
  if(typeof originalAdd==="function"){
    window.addQuantityToCart=function(code,qty){
      const r=originalAdd.call(this,code,qty);
      try{if(typeof window.updateEletroCart==="function")window.updateEletroCart()}catch(_){}
      return r===undefined?true:r;
    };
  }
})();
</script>`;

async function networkResponse(req){
  return fetch(req,{cache:"no-store"});
}
async function documentResponse(req){
  try{
    const res=await networkResponse(req);
    const type=res.headers.get("content-type")||"";
    if(!type.includes("text/html"))return res;
    const html=await res.text();
    const patched=html.includes("__ELETRO_CART_PATCH_V9")?html:html.replace(/<\/body\s*>/i,CART_PATCH+"</body>");
    return new Response(patched,{status:res.status,statusText:res.statusText,headers:res.headers});
  }catch(e){
    const cached=await caches.match(req);
    if(cached)return cached;
    const fallback=await caches.match("./index.html");
    return fallback||new Response("Offline",{status:503});
  }
}

self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  const u=new URL(e.request.url);
  const isDocument=e.request.mode==="navigate"||u.pathname.endsWith("/index.html")||u.pathname.endsWith("/");
  if(isDocument){
    e.respondWith(documentResponse(e.request));
    return;
  }
  if(u.pathname.endsWith("/sw.js")){
    e.respondWith(networkResponse(e.request));
    return;
  }
  e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(res=>{
    const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});return res;
  }).catch(()=>cached)));
});