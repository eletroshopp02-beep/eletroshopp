(()=>{"use strict";
const SUPABASE_URL="https://sybxbyaywznbwipbssso.supabase.co",SUPABASE_KEY="sb_publishable_3iXGUzzTaypiGou7K7UFEw_OW1qKljR",ORIGIN_CEP="84272402",WHATSAPP="5542998157736";
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const money=v=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(v)||0);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fallback=(name,type="watch")=>{const i=type==="audio"?"🎧":type==="tools"?"🧰":type==="games"?"🎮":type==="glasses"?"👓":"⌚";return"data:image/svg+xml;charset=UTF-8,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 700"><rect width="700" height="700" rx="40" fill="#eef0f4"/><circle cx="350" cy="300" r="180" fill="#ff1744"/><text x="350" y="350" text-anchor="middle" font-size="130">'+i+'</text><text x="350" y="570" text-anchor="middle" font-family="Arial" font-size="28" font-weight="700" fill="#222">'+esc(name).slice(0,28)+'</text></svg>')};
let catalogImages={},catalogImageList=[],products=[],cart=[],state={search:"",category:"",brand:"",sort:"relevance",limit:12};
function norm(v){return String(v??"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim()}
function collectImages(v,key="",out={}){if(typeof v==="string"&&v.startsWith("data:image/")){if(key)out[norm(key)]=v;catalogImageList.push(v);return out}if(Array.isArray(v)){v.forEach((x,i)=>collectImages(x,String(i),out));return out}if(v&&typeof v==="object"){Object.entries(v).forEach(([k,x])=>collectImages(x,k,out));}return out}
async function loadCatalogImages(){
 try{
  const t=await fetch("data/catalog-images.js?v=20261005-images2",{cache:"no-store"}).then(r=>r.text());
  const transformed=t.replace(/^\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/gm,"window.__ESH_IMG_$1=");
  new Function(transformed)();
  const keys=Object.keys(window).filter(k=>k.startsWith("__ESH_IMG_"));
  keys.forEach(k=>collectImages(window[k],k.replace("__ESH_IMG_",""),catalogImages));
  collectImages(window.CATALOG_IMAGES,"CATALOG_IMAGES",catalogImages);
 }catch(e){console.warn("catalog images unavailable",e)}
}
function imageFor(p,index){
 const keys=[p.code,p.id,p.name];
 for(const k of keys){const v=catalogImages[norm(k)];if(v)return v}
 const n=norm(p.name),cat=norm(p.category);
 const supplierImages={
  "action":"https://wearzonebrasil.com.br/cdn/shop/files/vetor_cima_2.png?v=1721154074",
  "pulse":"https://wearzonebrasil.com.br/cdn/shop/files/vetoresquerda_2.png?v=1721155685",
  "easy":"https://wearzonebrasil.com.br/cdn/shop/files/PRETO_2_9cd57d55-1181-4fd5-900a-c117936703cf.png?v=1743620951",
  "life":"https://wearzonebrasil.com.br/cdn/shop/files/SemTitulo-4.png?v=1742327527",
  "brave":"https://wearzonebrasil.com.br/cdn/shop/files/8.png?v=1744054971",
  "flare":"https://wearzonebrasil.com.br/cdn/shop/files/000_1_1.png?v=1767107150",
  "kron":"https://wearzonebrasil.com.br/cdn/shop/files/G11-_02_077a01e3-743d-461d-a869-24e846242cfb.png?v=1784205183",
  "wz06":"https://wearzonebrasil.com.br/cdn/shop/files/7_1_0a635579-9c40-455e-8125-f4a80491c1c6.png?v=1745332423",
  "wz08":"https://wearzonebrasil.com.br/cdn/shop/files/6_1_b23ef4e6-9c94-47de-bc96-2f3b9bc4a662.png?v=1745332561",
  "zone buds":"https://wearzonebrasil.com.br/cdn/shop/files/8_1_b77af2a7-b34e-449c-be5f-1e1b9a066911.png?v=1745332489"
 };
 for(const k of Object.keys(supplierImages)){if(n===k||n.includes(k))return supplierImages[k]}
 return fallback(p.name,cat.includes("fone")?"audio":cat.includes("ferrament")?"tools":cat.includes("controle")?"games":cat.includes("oculos")?"glasses":"watch")
}
function normalize(p,i){return{id:String(p.id??p.code??i+1),code:p.code||p.id||"",name:p.name||"Produto Eletroshopp",description:p.description||"Produto do catálogo atualizado do fornecedor.",price:Number(p.price)||0,category:p.category||"Smartwatch",brand:p.brand||"Eletroshopp",image:imageFor(p,i),stock:Number(p.stock??0),weight:Number(p.weight||.3),width:Number(p.width||15),height:Number(p.height||10),length:Number(p.length||20)}}
async function getProducts(){
 let base=Array.isArray(window.ELETRO_PRODUCTS)?window.ELETRO_PRODUCTS:[];
 if(!base.length){try{const t=await fetch("data/store-products.js?v=20261005-catalogfix5",{cache:"no-store"}).then(r=>r.text());new Function(t)();base=Array.isArray(window.ELETRO_PRODUCTS)?window.ELETRO_PRODUCTS:[]}catch(e){console.warn("catalog fallback",e)}}
 return base.map(normalize).filter(p=>p.price>0||p.stock===0)
}
try{cart=JSON.parse(localStorage.getItem("eletroshopp-cart-v3")||"[]").filter(x=>x&&x.id)}catch(e){}
const count=()=>cart.reduce((n,x)=>n+(Number(x.qty)||1),0),total=()=>cart.reduce((n,x)=>n+(Number(x.price)||0)*(Number(x.qty)||1),0);
function toast(m){const t=$("#toast");if(!t)return;t.textContent=m;t.classList.add("show");clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove("show"),2200)}
function open(id){$(id)?.classList.add("open");document.body.style.overflow="hidden"}function close(id){$(id)?.classList.remove("open");if(!$(".drawer.open"))document.body.style.overflow=""}
function save(){localStorage.setItem("eletroshopp-cart-v3",JSON.stringify(cart));renderCart();$("#cartCount").textContent=count();window.dispatchEvent(new Event("cart-updated"))}
function add(id){const p=products.find(x=>x.id===String(id));if(!p)return;const x=cart.find(x=>x.id===p.id);x?x.qty++:cart.push({id:p.id,name:p.name,price:p.price,image:p.image,qty:1});save();open("#cart")}
function change(id,d){const x=cart.find(x=>x.id===String(id));if(!x)return;x.qty+=d;if(x.qty<=0)cart=cart.filter(y=>y.id!==x.id);save()}
function card(p){
 const fb=encodeURIComponent(fallback(p.name,norm(p.category).includes("fone")?"audio":norm(p.category).includes("ferrament")?"tools":norm(p.category).includes("oculos")?"glasses":"watch"));
 return '<article class="product-card"><div class="product-image"><img loading="lazy" src="'+esc(p.image)+'" alt="'+esc(p.name)+'" data-fallback="'+fb+'" onerror="this.onerror=null;this.src=decodeURIComponent(this.dataset.fallback)"></div><div class="product-info"><h3>'+esc(p.name)+'</h3><p>'+esc(p.description)+'</p><div class="rating">★★★★★</div><div class="price">'+(p.price?money(p.price):"Consulte")+'</div><button class="add" data-add="'+esc(p.id)+'">🛒 Adicionar</button></div></article>'
}
function filtered(){
 const q=norm(state.search);
 let r=products.filter(p=>(!state.category||p.category===state.category)&&(!state.brand||p.brand===state.brand)&&(!q||norm([p.name,p.description,p.category,p.brand].join(" ")).includes(q)));
 if(state.sort==="priceAsc")r.sort((a,b)=>a.price-b.price);
 if(state.sort==="priceDesc")r.sort((a,b)=>b.price-a.price);
 return r
}
function render(){
 const r=filtered(),visible=r.slice(0,state.limit);
 $("#products").innerHTML=visible.length?visible.map(card).join(""):'<div class="empty">Nenhum produto encontrado.</div>';
 $("#count").textContent=r.length+" produtos";
 const order=["ACTION","BRAVE","FLARE","PULSE","LIFE","KRON","Zone Buds 01","WZ06"];
 const featured=order.map(c=>products.find(p=>p.code===c)).filter(Boolean);
 products.forEach(p=>{if(!featured.includes(p)&&featured.length<8)featured.push(p)});
 $("#featured").innerHTML=featured.slice(0,8).map(card).join("");
 $("#cartCount").textContent=count();renderCart();
 $$(".category-chips .chip").forEach(b=>b.classList.toggle("active",(b.dataset.category||"")===state.category));
 const s=$("#catalogSentinel"); if(s)s.hidden=visible.length>=r.length;
}
function renderCart(){const c=$("#cartItems");if(!c)return;c.innerHTML=cart.length?cart.map(x=>{const fb=encodeURIComponent(fallback(x.name));return '<div class="cart-row"><img src="'+esc(x.image)+'" data-fallback="'+fb+'" onerror="this.onerror=null;this.src=decodeURIComponent(this.dataset.fallback)"><div class="cart-main"><b>'+esc(x.name)+'</b><small>'+money(x.price)+'</small><div class="qty"><button data-minus="'+esc(x.id)+'">−</button><span>'+x.qty+'</span><button data-plus="'+esc(x.id)+'">+</button><button class="remove" data-remove="'+esc(x.id)+'">Excluir</button></div></div></div>'}).join(""):'<div class="empty">Seu carrinho está vazio.</div>';$("#cartTotal").textContent=money(total())}
function checkout(){if(!cart.length)return toast("Adicione um produto primeiro");$("#orderSummary").innerHTML=cart.map(x=>'<div><span>'+x.qty+'× '+esc(x.name)+'</span><b>'+money(x.price*x.qty)+'</b></div>').join("");$("#orderSubtotal").textContent=money(total());close("#cart");open("#checkout")}
async function lookupCep(){
 const cep=$("#cep").value.replace(/\D/g,"");
 if(cep.length!==8)return;
 $("#cepStatus").textContent="Validando CEP…";
 try{
  const [via,brasil]=await Promise.allSettled([
   fetch("https://viacep.com.br/ws/"+cep+"/json/",{cache:"no-store"}).then(r=>r.ok?r.json():Promise.reject(Error("ViaCEP indisponível"))),
   fetch("https://brasilapi.com.br/api/cep/v2/"+cep,{cache:"no-store"}).then(r=>r.ok?r.json():Promise.reject(Error("BrasilAPI indisponível")))
  ]);
  const a=via.status==="fulfilled"&&!via.value.erro?via.value:null;
  const b=brasil.status==="fulfilled"?brasil.value:null;
  const d=a||b;
  if(!d)throw Error("CEP não encontrado");
  const street=a?.logradouro||b?.street||"";
  const neighborhood=a?.bairro||b?.neighborhood||"";
  const city=a?.localidade||b?.city||"";
  const uf=a?.uf||b?.state||"";
  const street2=b?.street||"";
  const city2=b?.city||"";
  const uf2=b?.state||"";
  if(a&&b&&((street&&street2&&norm(street)!==norm(street2))||(city&&city2&&norm(city)!==norm(city2))||(uf&&uf2&&norm(uf)!==norm(uf2)))){
   throw Error("As bases de CEP retornaram endereços diferentes. Confira o CEP.");
  }
  if(!street||!city||!uf)throw Error("CEP sem endereço completo");
  $("#buyerStreet").value=street;
  $("#buyerNeighborhood").value=neighborhood;
  $("#buyerCity").value=city;
  $("#buyerState").value=uf;
  const m=$("#mapAddress");
  if(m){
   m.href="https://www.google.com/maps/search/?api=1&query="+encodeURIComponent([street,$("#buyerNumber").value.trim(),neighborhood,city,uf,cep].filter(Boolean).join(", "));
   m.textContent="📍 Conferir endereço no Google Maps";
   m.hidden=false;
  }
  $("#cepStatus").textContent=[street,neighborhood,city,uf].filter(Boolean).join(" • ");
  await freight(true);
 }catch(e){
  $("#buyerStreet").value="";
  $("#buyerNeighborhood").value="";
  $("#buyerCity").value="";
  $("#buyerState").value="";
  const m=$("#mapAddress");if(m)m.hidden=true;
  $("#cepStatus").textContent=e.message||"Não foi possível validar o CEP";
  $("#freight").innerHTML='<div class="freight-error">'+esc(e.message||"Confira o CEP informado.")+'</div>';
 }
}async function freight(auto=false){const cep=$("#cep").value.replace(/\D/g,"");if(cep.length!==8)return;$("#freight").innerHTML='<div class="loading">'+(auto?"Consultando frete para este CEP…":"Calculando frete…")+"</div>";try{const payload=cart.map(x=>{const p=products.find(y=>y.id===x.id)||{};return{id:Number(x.id)||undefined,code:x.id,name:x.name,quantity:x.qty,value:x.price,category:p.category,weight:p.weight,width:p.width,height:p.height,length:p.length}});const r=await fetch(SUPABASE_URL+"/functions/v1/frenet-quote",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+SUPABASE_KEY},body:JSON.stringify({fromPostalCode:ORIGIN_CEP,toPostalCode:cep,products:payload})});const d=await r.json().catch(()=>({}));if(!r.ok||!Array.isArray(d.quotes)||!d.quotes.length)throw Error(d.error||d.message||"Nenhuma opção de frete encontrada.");$("#freight").innerHTML=d.quotes.slice(0,4).map((q,i)=>'<label class="freight-option"><input type="radio" name="shipping" value="'+encodeURIComponent(JSON.stringify(q))+'" '+(i?"":"checked")+'><span><b>'+esc(q.name||q.company||"Entrega")+'</b><small>'+esc(String(q.days||"")+" dias")+'</small></span><strong>'+money(q.price)+'</strong></label>').join("")}catch(e){$("#freight").innerHTML='<div class="freight-error">'+esc(e.message||"Erro ao calcular frete.")+"</div>"}}
async function finish(){const name=$("#buyerName").value.trim(),phone=$("#buyerPhone").value.trim(),cep=$("#cep").value.replace(/\D/g,""),number=$("#buyerNumber").value.trim(),street=$("#buyerStreet").value.trim(),complement=$("#buyerComplement").value.trim(),neighborhood=$("#buyerNeighborhood").value.trim(),city=$("#buyerCity").value.trim(),uf=$("#buyerState").value.trim(),si=document.querySelector('input[name="shipping"]:checked');if(!name||!phone||cep.length!==8||!street||!number||!city||!uf||!si)return toast("Preencha nome, telefone, CEP, endereço e número");const shipping=JSON.parse(decodeURIComponent(si.value)),address=[street,number,complement,neighborhood,city+" - "+uf].filter(Boolean).join(", "),order={id:"ESH-"+Date.now(),buyer:{name,phone,cep,address,street,number,complement,neighborhood,city,state:uf},items:cart.map(x=>{const p=products.find(y=>y.id===x.id)||{};return{id:x.id,name:x.name,description:p.description||"",price:x.price,quantity:x.qty,image:x.image,category:p.category||"",brand:p.brand||"",weight:p.weight||0,width:p.width||0,height:p.height||0,length:p.length||0}}),totalProducts:total(),freight:shipping,grandTotal:total()+Number(shipping.price||0),weight:cart.reduce((n,x)=>n+(Number(products.find(p=>p.id===x.id)?.weight||.3)*x.qty),0),createdAt:new Date().toISOString(),payment:"A combinar"};const b=$("#finish");b.disabled=true;b.textContent="Preparando pagamento…";try{const r=await fetch(SUPABASE_URL+"/functions/v1/create-order",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+SUPABASE_KEY},body:JSON.stringify(order)});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||"Não foi possível registrar o pedido");const pay=await fetch(SUPABASE_URL+"/functions/v1/infinitepay-checkout",{method:"POST",headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY},body:JSON.stringify({order_nsu:order.id})});const pd=await pay.json().catch(()=>({}));if(!pay.ok||!pd.url)throw Error(pd.error||"Não foi possível criar o pagamento na InfinitePay");cart=[];save();location.href=pd.url}catch(e){toast(e.message||"Erro no pedido");b.disabled=false;b.textContent="Pagar com InfinitePay"}}
document.addEventListener("click",e=>{const b=e.target.closest("[data-add],[data-category],[data-open-cart],[data-close-cart],[data-checkout],[data-close-checkout],[data-freight],[data-finish],[data-scroll-catalog],[data-scroll-top],[data-focus-search],[data-minus],[data-plus],[data-remove]");if(!b)return;if(b.dataset.add!==undefined)add(b.dataset.add);else if(b.dataset.category!==undefined){state.category=b.dataset.category;state.limit=12;render();$("#catalogo")?.scrollIntoView({behavior:"smooth"})}else if(b.dataset.openCart!==undefined)open("#cart");else if(b.dataset.closeCart!==undefined)close("#cart");else if(b.dataset.checkout!==undefined)checkout();else if(b.dataset.closeCheckout!==undefined)close("#checkout");else if(b.dataset.freight!==undefined)freight();else if(b.dataset.finish!==undefined)finish();else if(b.dataset.scrollCatalog!==undefined)$("#catalogo")?.scrollIntoView({behavior:"smooth"});else if(b.dataset.scrollTop!==undefined)window.scrollTo({top:0,behavior:"smooth"});else if(b.dataset.focusSearch!==undefined){$("#catalogo")?.scrollIntoView({behavior:"smooth"});setTimeout(()=>$("#search")?.focus(),250)}else if(b.dataset.minus!==undefined)change(b.dataset.minus,-1);else if(b.dataset.plus!==undefined)change(b.dataset.plus,1);else if(b.dataset.remove!==undefined){cart=cart.filter(x=>x.id!==b.dataset.remove);save()}});
$("#search").addEventListener("input",e=>{state.search=e.target.value;state.limit=12;$("#searchTop").value=e.target.value;render()});$("#searchTop").addEventListener("input",e=>{state.search=e.target.value;state.limit=12;$("#search").value=e.target.value;render()});$("#sort").addEventListener("change",e=>{state.sort=e.target.value;state.limit=12;render()});
$("#buyerPhone")?.addEventListener("input",e=>{let v=e.target.value.replace(/\D/g,"").slice(0,11);e.target.value=v.length<=10?v.replace(/(\d{2})(\d{4})(\d{0,4})/,"($1) $2-$3").replace(/-$/,""):v.replace(/(\d{2})(\d{5})(\d{0,4})/,"($1) $2-$3").replace(/-$/,"")});
let ct;$("#cep")?.addEventListener("input",e=>{let v=e.target.value.replace(/\D/g,"").slice(0,8);e.target.value=v.length>5?v.slice(0,5)+"-"+v.slice(5):v;$("#freight").innerHTML="";if(v.length===8){clearTimeout(ct);ct=setTimeout(lookupCep,250)}});$("#cep")?.addEventListener("blur",lookupCep);
let nt;$("#buyerNumber")?.addEventListener("input",()=>{clearTimeout(nt);if($("#cep").value.replace(/\D/g,"").length===8&&$("#buyerNumber").value.trim()){const m=$("#mapAddress"),street=$("#buyerStreet").value,neigh=$("#buyerNeighborhood").value,city=$("#buyerCity").value,uf=$("#buyerState").value,cep=$("#cep").value;if(m&&street){m.href="https://www.google.com/maps/search/?api=1&query="+encodeURIComponent([street,$("#buyerNumber").value,neigh,city,uf,cep].filter(Boolean).join(", "));m.hidden=false}nt=setTimeout(()=>freight(true),400)}});
(async()=>{await loadCatalogImages();products=await getProducts();if(!products.length)throw Error("Catálogo vazio");render();const h1=products.find(p=>p.code==="ACTION")||products.find(p=>p.category==="Smartwatch")||products[0],h2=products.find(p=>p.code==="FLARE")||products.find(p=>p.code==="BRAVE")||products.find(p=>p.category==="Smartwatch")||products[1];if(h1){$("#heroImg1").src=h1.image;$("#heroImg1").onerror=()=>{$("#heroImg1").src=fallback(h1.name,"watch")}}if(h2){$("#heroImg2").src=h2.image;$("#heroImg2").onerror=()=>{$("#heroImg2").src=fallback(h2.name,"watch")}}})().catch(e=>{console.error(e);$("#products").innerHTML='<div class="empty">Não foi possível carregar o catálogo.</div>'});
const sentinel=$("#catalogSentinel");if(sentinel&&"IntersectionObserver"in window){const io=new IntersectionObserver(es=>{if(es[0].isIntersecting){const total=filtered().length;if(state.limit<total){state.limit+=12;render()}}},{rootMargin:"500px"});io.observe(sentinel)}else{window.addEventListener("scroll",()=>{if(innerHeight+scrollY>document.body.offsetHeight-700){const total=filtered().length;if(state.limit<total){state.limit+=12;render()}}})}
if("serviceWorker"in navigator&&location.pathname.startsWith("/loja/"))window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js?v=20261006-loja").catch(()=>{}));
window.Eletroshopp={addToCart:add};
})();