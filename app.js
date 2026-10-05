(()=>{"use strict";
const SUPABASE_URL="https://sybxbyaywznbwipbssso.supabase.co";
const SUPABASE_KEY="sb_publishable_3iXGUzzTaypiGou7K7UFEw_OW1qKljR";
const ORIGIN_CEP="84272402";
const WHATSAPP="5542998157736";
// O catálogo oficial local é a fonte de verdade das imagens; não sobrescrever imagens com o legado.
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const money=v=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(v)||0);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const svgFallback=(name,type="watch")=>{
 const icon=type==="audio"?"🎧":type==="tools"?"🧰":type==="games"?"🎮":"⌚";
 return "data:image/svg+xml;charset=UTF-8,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 700"><defs><linearGradient id="a"><stop stop-color="#ff1744"/><stop offset="1" stop-color="#7d001f"/></linearGradient></defs><rect width="700" height="700" rx="50" fill="#101522"/><circle cx="350" cy="300" r="180" fill="url(#a)" opacity=".9"/><text x="350" y="350" text-anchor="middle" font-size="130">'+icon+'</text><text x="350" y="565" text-anchor="middle" font-family="Arial" font-size="28" font-weight="700" fill="#fff">'+esc(name).slice(0,28)+'</text></svg>');
};
const knownImages=[
 ["wz06","https://wearzonebrasil.com.br/cdn/shop/files/7_1_0a635579-9c40-455e-8125-f4a80491c1c6.png?v=1745332423"],
 ["zone buds","https://wearzonebrasil.com.br/cdn/shop/files/8_1_b77af2a7-b34e-449c-be5f-1e1b9a066911.png?v=1745332489"],
 ["action","https://wearzonebrasil.com.br/cdn/shop/files/vetor_cima_2.png?v=1721154074"],
 ["pulse","https://wearzonebrasil.com.br/cdn/shop/files/vetoresquerda_2.png?v=1721155685"],
 ["flare","https://wearzonebrasil.com.br/cdn/shop/files/000_1_1.png?v=1767107150"],
 ["easy","https://wearzonebrasil.com.br/cdn/shop/files/PRETO_2_9cd57d55-1181-4fd5-900a-c117936703cf.png?v=1743620951"],
 ["brave","https://wearzonebrasil.com.br/cdn/shop/files/8.png?v=1744054971"],
 ["kron","https://wearzonebrasil.com.br/cdn/shop/files/G11-_02_077a01e3-743d-461d-a869-24e846242cfb.png?v=1784205183"]
];
function imageFor(p){
 if(p?.name==="Óculos inteligente W93 PRO")return "https://cdn.shopify.com/s/files/1/0787/9285/1677/files/ChatGPTImage18deago.de2026_20_54_40.png?v=1787097433";
 if(p.image&&String(p.image).trim())return p.image;
 const n=(p.name||"").toLowerCase();
 const k=knownImages.find(x=>n.includes(x[0]));
 if(k)return k[1];
 const c=(p.category||"").toLowerCase();
 return svgFallback(p.name,c.includes("fone")||c.includes("áudio")?"audio":c.includes("ferrament")?"tools":c.includes("game")?"games":"watch");
}
function normalize(p,i){return{
 id:String(p.id??p.code??p.codigo??i+1),name:p.name||p.nome||"Produto Eletroshopp",
 description:p.description||p.desc||p.descricao||"Tecnologia e praticidade para o seu dia a dia.",
 price:Number(p.price??p.sale??p.preco)||0,category:p.category||p.categoria||"Outros",brand:p.brand||p.marca||"Eletroshopp",
 image:imageFor(p),stock:Number(p.stock??0),weight:Number(p.weight||0.3),width:Number(p.width||15),height:Number(p.height||10),length:Number(p.length||20)
};}
async function getProducts(){
 let base=Array.isArray(window.ELETRO_PRODUCTS)?window.ELETRO_PRODUCTS:[];
 if(!base.length){
  try{const t=await fetch("data/products.json?v=20261005-rebuild14",{cache:"no-store"}).then(r=>r.json());base=t}catch(e){base=[]}
 }
 let out=base.map(normalize).filter(p=>p.price>0);
 return out;
}
let products=[],cart=[],state={search:"",category:"",brand:"",sort:"relevance"};
try{cart=JSON.parse(localStorage.getItem("eletroshopp-cart-v3")||"[]").filter(x=>x&&x.id)}catch(e){}
const count=()=>cart.reduce((n,x)=>n+(Number(x.qty)||1),0);
const total=()=>cart.reduce((n,x)=>n+(Number(x.price)||0)*(Number(x.qty)||1),0);
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("show");clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove("show"),2200)}
function save(){localStorage.setItem("eletroshopp-cart-v3",JSON.stringify(cart));renderCart();$("#cartCount").textContent=count()}
function open(id){$(id)?.classList.add("open");document.body.classList.add("locked")}
function close(id){$(id)?.classList.remove("open");if(!$(".drawer.open"))document.body.classList.remove("locked")}
function add(id){const p=products.find(x=>x.id===String(id));if(!p)return toast("Produto não encontrado");const x=cart.find(x=>x.id===p.id);x?x.qty=(Number(x.qty)||1)+1:cart.push({id:p.id,name:p.name,price:p.price,image:p.image,qty:1});save();open("#cart");toast("Produto adicionado ao carrinho")}
function change(id,d){const x=cart.find(x=>x.id===String(id));if(!x)return;x.qty=(Number(x.qty)||1)+d;if(x.qty<=0)cart=cart.filter(y=>y.id!==x.id);save()}
function card(p){return '<article class="product-card"><div class="product-image"><img loading="lazy" src="'+p.image+'" alt="'+esc(p.name)+'" onerror="this.onerror=null;this.src=\''+svgFallback(p.name)+'\'"></div><div class="product-info"><span class="eyebrow">'+esc(p.category)+'</span><h3>'+esc(p.name)+'</h3><p>'+esc(p.description)+'</p><div class="card-bottom"><strong>'+money(p.price)+'</strong><button class="add" data-add="'+esc(p.id)+'">🛒 Adicionar ao carrinho</button></div></div></article>'}
function filtered(){const q=state.search.toLowerCase().trim();let r=products.filter(p=>(!state.category||p.category===state.category)&&(!state.brand||p.brand===state.brand)&&(!q||[p.name,p.description,p.category,p.brand].join(" ").toLowerCase().includes(q)));if(state.sort==="priceAsc")r.sort((a,b)=>a.price-b.price);if(state.sort==="priceDesc")r.sort((a,b)=>b.price-a.price);return r}
function chips(){const cats=[...new Set(products.map(p=>p.category).filter(Boolean))].sort(),brands=[...new Set(products.map(p=>p.brand).filter(Boolean))].sort();$("#cats").innerHTML='<button class="chip '+(!state.category?"active":"")+'" data-category="">Todos</button>'+cats.map(x=>'<button class="chip '+(state.category===x?"active":"")+'" data-category="'+esc(x)+'">'+esc(x)+'</button>').join("");$("#brands").innerHTML='<button class="chip '+(!state.brand?"active":"")+'" data-brand="">Todas as marcas</button>'+brands.map(x=>'<button class="chip '+(state.brand===x?"active":"")+'" data-brand="'+esc(x)+'">'+esc(x)+'</button>').join("")}
function render(){
 const r=filtered();
 $("#products").innerHTML=r.length?r.map(card).join(""):'<div class="empty">Nenhum produto encontrado.</div>';
 $("#count").textContent=r.length+" produtos";
 const featured=[...products].sort((a,b)=>Number(Boolean(b.image))-Number(Boolean(a.image))).slice(0,8);
 $("#featured").innerHTML=featured.map(card).join("");
 chips();$("#cartCount").textContent=count();renderCart();
}
function renderCart(){
 const c=$("#cartItems");
 c.innerHTML=cart.length?cart.map(x=>'<div class="cart-row"><img src="'+x.image+'" onerror="this.onerror=null;this.src=\''+svgFallback(x.name)+'\'"><div class="cart-main"><b>'+esc(x.name)+'</b><small>'+money(x.price)+'</small><div class="qty"><button data-minus="'+esc(x.id)+'">−</button><span>'+x.qty+'</span><button data-plus="'+esc(x.id)+'">+</button><button class="remove" data-remove="'+esc(x.id)+'">Excluir</button></div></div></div>').join(""):'<div class="empty">Seu carrinho está vazio.</div>';
 $("#cartTotal").textContent=money(total());
}
function checkout(){
 if(!cart.length)return toast("Adicione um produto primeiro");
 $("#orderSummary").innerHTML=cart.map(x=>'<div><span>'+x.qty+'× '+esc(x.name)+'</span><b>'+money(x.price*x.qty)+'</b></div>').join("");
 $("#orderSubtotal").textContent=money(total());close("#cart");open("#checkout");
}
async function lookupCep(){
 const cep=$("#cep").value.replace(/\D/g,"");
 if(cep.length!==8)return;
 const msg=$("#cepStatus");
 if(msg)msg.textContent="Consultando CEP…";
 try{
  const r=await fetch("https://viacep.com.br/ws/"+cep+"/json/",{cache:"no-store"});
  const d=await r.json();
  if(d.erro)throw Error("CEP não encontrado");
  $("#buyerStreet").value=d.logradouro||"";
  $("#buyerNeighborhood").value=d.bairro||"";
  $("#buyerCity").value=d.localidade||"";
  $("#buyerState").value=d.uf||"";
  if(msg)msg.textContent=[d.localidade,d.uf].filter(Boolean).join(" - ");
  $("#buyerNumber").focus();
  await freight(true);
 }catch(e){
  if(msg)msg.textContent=e.message||"CEP não encontrado";
  $("#freight").innerHTML='<div class="freight-error">Confira o CEP informado.</div>';
 }
}
async function freight(auto=false){
 const cep=$("#cep").value.replace(/\D/g,"");
 if(cep.length!==8)return toast("Digite um CEP válido");
 $("#freight").innerHTML='<div class="loading">'+(auto?"Consultando frete para este CEP…":"Calculando frete…")+'</div>';
 try{
  const productsPayload=cart.map(x=>{const p=products.find(y=>y.id===String(x.id))||{};return{id:Number(x.id)||undefined,code:x.id,name:x.name,quantity:Number(x.qty)||1,value:Number(x.price)||0,category:p.category||"Eletrônicos",weight:Number(p.weight||0.3),width:Number(p.width||15),height:Number(p.height||10),length:Number(p.length||20)}});
  const r=await fetch(SUPABASE_URL+"/functions/v1/frenet-quote",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+SUPABASE_KEY},body:JSON.stringify({fromPostalCode:ORIGIN_CEP,toPostalCode:cep,products:productsPayload})});
  const d=await r.json().catch(()=>({}));
  if(!r.ok||!Array.isArray(d.quotes)||!d.quotes.length)throw Error(d.error||d.message||"Nenhuma opção de frete encontrada.");
  $("#freight").innerHTML=d.quotes.slice(0,4).map((q,i)=>'<label class="freight-option"><input type="radio" name="shipping" value="'+encodeURIComponent(JSON.stringify(q))+'" '+(i===0?"checked":"")+'><span><b>'+esc(q.name||q.company||"Entrega")+'</b><small>'+esc(String(q.days||"")+" dias")+'</small></span><strong>'+money(q.price)+'</strong></label>').join("");
 }catch(e){$("#freight").innerHTML='<div class="freight-error">'+esc(e.message||"Erro ao calcular frete.")+'</div>'}
}
async function finish(){
 const name=$("#buyerName").value.trim(),phone=$("#buyerPhone").value.trim(),cep=$("#cep").value.replace(/\D/g,""),number=$("#buyerNumber").value.trim(),street=$("#buyerStreet").value.trim(),complement=$("#buyerComplement").value.trim(),neighborhood=$("#buyerNeighborhood").value.trim(),city=$("#buyerCity").value.trim(),uf=$("#buyerState").value.trim(),si=document.querySelector('input[name="shipping"]:checked');
 const address=[street,number,complement,neighborhood,city&&uf?city+" - "+uf:city].filter(Boolean).join(", ");
 if(!name||!phone||cep.length!==8||!street||!number||!city||!uf||!si)return toast("Preencha nome, telefone, CEP, endereço e número");
 const shipping=JSON.parse(decodeURIComponent(si.value));
 const order={id:"ESH-"+Date.now(),buyer:{name,phone,cep,address},items:cart.map(x=>({id:x.id,name:x.name,price:x.price,quantity:x.qty})),totalProducts:total(),freight:shipping,grandTotal:total()+Number(shipping.price||0),weight:cart.reduce((n,x)=>{const p=products.find(y=>y.id===String(x.id));return n+(Number(p?.weight||0.3)*(Number(x.qty)||1))},0),createdAt:new Date().toISOString(),payment:"A combinar"};
 const b=$("#finish");b.disabled=true;b.textContent="Enviando…";
 try{
  const r=await fetch(SUPABASE_URL+"/functions/v1/create-order",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+SUPABASE_KEY},body:JSON.stringify(order)});
  const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||"Não foi possível registrar o pedido");
  const msg=["Olá! Quero fazer este pedido na Eletroshopp.",order.id,"Cliente: "+name,"Telefone: "+phone,"CEP: "+cep,"Endereço: "+address,"Frete: "+money(shipping.price||0),"Total: "+money(order.grandTotal),"",...order.items.map(x=>x.quantity+"x "+x.name+" - "+money(x.price*x.quantity))].join("\n");
  cart=[];save();location.href="https://wa.me/"+WHATSAPP+"?text="+encodeURIComponent(msg);
 }catch(e){toast(e.message||"Erro no pedido");b.disabled=false;b.textContent="Finalizar pedido"}
}
document.addEventListener("click",e=>{
 const b=e.target.closest("[data-add],[data-category],[data-brand],[data-minus],[data-plus],[data-remove],[data-open-cart],[data-close-cart],[data-checkout],[data-close-checkout],[data-freight],[data-finish],[data-scroll-catalog]");
 if(!b)return;
 if(b.dataset.add!==undefined)add(b.dataset.add);
 else if(b.dataset.category!==undefined){state.category=b.dataset.category;render()}
 else if(b.dataset.brand!==undefined){state.brand=b.dataset.brand;render()}
 else if(b.dataset.minus!==undefined)change(b.dataset.minus,-1);
 else if(b.dataset.plus!==undefined)change(b.dataset.plus,1);
 else if(b.dataset.remove!==undefined){cart=cart.filter(x=>x.id!==b.dataset.remove);save()}
 else if(b.dataset.openCart!==undefined)open("#cart");
 else if(b.dataset.closeCart!==undefined)close("#cart");
 else if(b.dataset.checkout!==undefined)checkout();
 else if(b.dataset.closeCheckout!==undefined)close("#checkout");
 else if(b.dataset.freight!==undefined)freight();
 else if(b.dataset.finish!==undefined)finish();
 else if(b.dataset.scrollCatalog!==undefined)$("#catalogo")?.scrollIntoView({behavior:"smooth"});
});
$("#search").addEventListener("input",e=>{state.search=e.target.value;render()});
$("#sort").addEventListener("change",e=>{state.sort=e.target.value;render()});
const phoneEl=$("#buyerPhone"),cepEl=$("#cep"),numberEl=$("#buyerNumber");

phoneEl?.addEventListener("input",e=>{let v=e.target.value.replace(/\D/g,"").slice(0,11);e.target.value=v.length<=10?v.replace(/(\d{2})(\d{4})(\d{0,4})/,"($1) $2-$3").replace(/-$/,""):v.replace(/(\d{2})(\d{5})(\d{0,4})/,"($1) $2-$3").replace(/-$/,"")});
cepEl?.addEventListener("input",e=>{let v=e.target.value.replace(/\D/g,"").slice(0,8);e.target.value=v.length>5?v.slice(0,5)+"-"+v.slice(5):v;$("#freight").innerHTML="";if($("#cepStatus"))$("#cepStatus").textContent=""});
cepEl?.addEventListener("blur",lookupCep);
numberEl?.addEventListener("input",()=>{$("#freight").innerHTML=""});

(async()=>{try{products=await getProducts();if(!products.length)throw Error("Catálogo vazio");render();$("#status").textContent=products.length+" produtos disponíveis";}catch(e){console.error(e);$("#status").textContent="Catálogo indisponível";$("#products").innerHTML='<div class="empty">Não foi possível carregar o catálogo.</div>'}})();
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js?v=20261004-rebuild14").catch(()=>{}));
window.Eletroshopp={addToCart:add};
})();