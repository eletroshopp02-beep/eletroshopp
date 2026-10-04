import { products as sourceProducts } from "./data/products.js";

const SUPABASE_URL="https://sybxbyaywznbwipbssso.supabase.co";
const SUPABASE_KEY="sb_publishable_3iXGUzzTaypiGou7K7UFEw_OW1qKljR";
const WHATSAPP="5542998157736";
const FROM_CEP="84272402";

const $=s=>document.querySelector(s);
const money=v=>Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const clean=s=>String(s??"").replace(/\D/g,"");
const escape=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const state={products:[],cart:[],category:"",brand:"",sort:"",query:"",freight:null};

function inferCategory(p){
  const n=String(p.name||"").toLowerCase();
  if(/óculos|oculos|glasses/.test(n)) return "Óculos inteligentes";
  if(/fone|buds|earbud|headset|airpod|zone buds|wz0[68]/.test(n)) return "Fones";
  if(/pulseira|kit com pulseiras/.test(n)) return "Acessórios";
  if(/watch|smartwatch|microwear|gswear|horizon|kron|flare|brave|action|life|easy|pulse/.test(n)) return "Smartwatches";
  return p.category||"Eletrônicos";
}
function brand(p){
  const n=String(p.name||"").toLowerCase();
  if(n.includes("microwear")) return "Microwear";
  if(n.includes("wearzone")) return "Wearzone";
  if(n.includes("gswear")) return "GSWear";
  return "Eletroshopp";
}
function normalize(p){
  return {
    id:String(p.id||p.code||p.name),
    code:String(p.code||p.id||""),
    name:String(p.name||"Produto"),
    description:String(p.description||p.desc||""),
    price:Number(p.price)||0,
    image:typeof p.image==="string"&&p.image.startsWith("data:image")?p.image:"",
    category:inferCategory(p),
    brand:brand(p),
    weight:Number(p.weight)||0.3,width:Number(p.width)||8,height:Number(p.height)||4,length:Number(p.length)||20,
    soldout:Boolean(p.soldout||p.esgotado)
  };
}
function fallback(p){
  const svg="<svg xmlns='http://www.w3.org/2000/svg' width='700' height='700'><rect width='100%' height='100%' fill='#111722'/><text x='50%' y='46%' text-anchor='middle' font-size='110'>⌚</text><text x='50%' y='60%' text-anchor='middle' fill='white' font-family='Arial' font-size='28' font-weight='700'>"+escape(p.name)+"</text></svg>";
  return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);
}
function save(){localStorage.setItem("eletroshopp-cart-v3",JSON.stringify(state.cart.map(x=>({id:x.id,qty:x.qty}))));}
function loadCart(){try{const raw=JSON.parse(localStorage.getItem("eletroshopp-cart-v3")||"[]");state.cart=raw.map(x=>{const p=state.products.find(y=>y.id===x.id);return p?{...p,qty:Math.max(1,Number(x.qty)||1)}:null}).filter(Boolean)}catch{state.cart=[]}}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove("show"),2200)}
function card(p){
  const img=p.image||fallback(p);
  return `<article class="card">
    <div class="visual"><img src="${img}" alt="${escape(p.name)}" loading="lazy" onerror="this.onerror=null;this.src='${fallback(p)}'"></div>
    <div class="card-body"><span class="tag">${escape(p.category)}</span><h2>${escape(p.name)}</h2><div class="desc">${escape(p.description)}</div><strong class="price">${money(p.price)}</strong>
    <button class="add" type="button" data-add="${escape(p.id)}" ${p.soldout?"disabled":""}>${p.soldout?"Sem estoque":"Adicionar ao carrinho"}</button></div>
  </article>`;
}
function renderChips(){
  const cats=[...new Set(state.products.map(p=>p.category))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
  const brands=[...new Set(state.products.map(p=>p.brand))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
  $("#categoryChips").innerHTML=[["Todos",""] ,...cats.map(x=>[x,x])].map(([n,v])=>`<button type="button" class="${state.category===v?"active":""}" data-category="${escape(v)}">${escape(n)}</button>`).join("");
  $("#brandChips").innerHTML=[["Todas as marcas",""],...brands.map(x=>[x,x])].map(([n,v])=>`<button type="button" class="${state.brand===v?"active":""}" data-brand="${escape(v)}">${escape(n)}</button>`).join("");
  $("#sortChips").innerHTML=[["Relevância",""],["Menor preço","asc"],["Maior preço","desc"]].map(([n,v])=>`<button type="button" class="${state.sort===v?"active":""}" data-sort="${v}">${n}</button>`).join("");
}
function renderQuick(){
  const q=[["⌚","Smartwatches","Relógios inteligentes"],["🎧","Fones","Som para seu dia"],["👓","Óculos","Tecnologia inteligente"],["🎁","Acessórios","Kits e acessórios"],["🔥","Ofertas","Menores preços"]];
  $("#quickCats").innerHTML=q.map((x,i)=>`<button type="button" class="quick-card" data-quick="${i}"><span>${x[0]}</span><b>${x[1]}</b><small>${x[2]}</small></button>`).join("");
}
function filtered(){
  let list=state.products.filter(p=>{
    const q=state.query.toLowerCase();
    return (!q||[p.name,p.code,p.description,p.brand,p.category].join(" ").toLowerCase().includes(q))&&(!state.category||p.category===state.category)&&(!state.brand||p.brand===state.brand)&&p.price>0;
  });
  if(state.sort==="asc")list.sort((a,b)=>a.price-b.price);
  if(state.sort==="desc")list.sort((a,b)=>b.price-a.price);
  return list;
}
function render(){
  const list=filtered();
  $("#status").textContent=`${list.length} produtos • ${state.products.filter(p=>p.price>0&&!p.soldout).length} disponíveis`;
  $("#products").innerHTML=list.length?list.map(card).join(""):'<div class="empty catalog-empty">Nenhum produto encontrado.</div>';
}
function renderFeatured(){ $("#featured").innerHTML=state.products.filter(p=>p.price>0&&!p.soldout).slice(0,10).map(card).join(""); }
function renderCart(){
  const qty=state.cart.reduce((s,p)=>s+p.qty,0), total=state.cart.reduce((s,p)=>s+p.price*p.qty,0);
  $("#cartCount").textContent=qty;$("#cartTotal").textContent=money(total);
  $("#cartItems").innerHTML=state.cart.length?state.cart.map((p,i)=>`<div class="cart-line"><img src="${p.image||fallback(p)}" alt=""><div class="cart-info"><b>${escape(p.name)}</b><small>${money(p.price)}</small><div class="qty"><button type="button" data-minus="${i}">−</button><span>${p.qty}</span><button type="button" data-plus="${i}">+</button></div></div><button class="remove" type="button" data-remove="${i}">✕</button></div>`).join(""):'<div class="empty">Seu carrinho está vazio.</div>';
}
function openCart(){renderCart();$("#cartPanel").classList.add("open");$("#backdrop").classList.add("show")}
function closeCart(){ $("#cartPanel").classList.remove("open");$("#backdrop").classList.remove("show") }
function openCheckout(){if(!state.cart.length){toast("Adicione um produto primeiro.");return}closeCart();$("#checkoutModal").classList.add("open");packageInfo();summary()}
function closeCheckout(){$("#checkoutModal").classList.remove("open")}
function packageData(){
  const weight=state.cart.reduce((s,p)=>s+p.weight*p.qty,0);
  return {weight:Math.max(.1,Number(weight.toFixed(3))),products:state.cart.map(p=>({id:p.id,code:p.code,name:p.name,width:p.width,height:p.height,length:p.length,weight:p.weight,value:p.price,quantity:p.qty,category:p.category}))};
}
function packageInfo(){$("#packageInfo").textContent="📦 "+packageData().weight.toFixed(2).replace(".",",")+" kg • "+state.cart.reduce((s,p)=>s+p.qty,0)+" item(ns)"}
function summary(){const products=state.cart.reduce((s,p)=>s+p.price*p.qty,0),fre=state.freight?.price||0;$("#checkoutSummary").innerHTML=`<div><span>Produtos</span><b>${money(products)}</b></div><div><span>Frete</span><b>${state.freight?money(fre):"Calcule o frete"}</b></div><div class="grand"><span>Total</span><b>${money(products+fre)}</b></div>`}

async function quote(){
  const cep=clean($("#buyerCep").value);
  if(cep.length!==8){toast("Digite um CEP válido.");return}
  $("#freightResults").innerHTML='<div class="loading">⏳ Calculando frete…</div>';
  try{
    const r=await fetch(SUPABASE_URL+"/functions/v1/frenet-quote",{method:"POST",headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY},body:JSON.stringify({fromPostalCode:FROM_CEP,toPostalCode:cep,products:packageData().products})});
    const d=await r.json().catch(()=>({}));
    if(!r.ok||d.ok===false)throw Error(d.error||d.details?.message||"Frenet não retornou cotação.");
    const opts=Array.isArray(d.quotes)?d.quotes:[];
    if(!opts.length)throw Error("Nenhuma opção de frete para este CEP.");
    $("#freightResults").innerHTML=opts.map((o,i)=>`<button type="button" class="freight-option" data-freight="${i}"><span><b>🚚 ${escape(o.company?o.company+" — ":"")}${escape(o.name||"Frete")}</b><small>${o.days??"Consulte"} dias úteis</small></span><strong>${money(o.price)}</strong></button>`).join("");
    window.__quotes=opts;
    $("#freightResults").querySelectorAll("[data-freight]").forEach(btn=>btn.addEventListener("click",()=>{const o=window.__quotes[+btn.dataset.freight];state.freight={id:o.id,name:o.name,company:o.company,price:Number(o.price),days:o.days};$("#freightResults").querySelectorAll("button").forEach(x=>x.classList.remove("selected"));btn.classList.add("selected");summary()}));
  }catch(e){$("#freightResults").innerHTML=`<div class="freight-error">${escape(e.message||"Não foi possível calcular o frete.")}</div>`}
}
async function fillCep(){
  const cep=clean($("#buyerCep").value);
  $("#buyerCep").value=cep.length>5?cep.slice(0,5)+"-"+cep.slice(5):cep;
  if(cep.length!==8)return;
  try{const d=await fetch("https://viacep.com.br/ws/"+cep+"/json/").then(r=>r.json());if(!d.erro){$("#buyerAddress").value=d.logradouro||"";$("#buyerNeighborhood").value=d.bairro||"";$("#buyerCity").value=[d.localidade,d.uf].filter(Boolean).join("/")}}catch{}
}
async function submitOrder(e){
  e.preventDefault();
  if(!state.cart.length){toast("Carrinho vazio.");return}
  if(!state.freight){toast("Calcule e selecione o frete.");return}
  const b={name:$("#buyerName").value.trim(),phone:$("#buyerPhone").value.trim(),cep:clean($("#buyerCep").value),address:$("#buyerAddress").value.trim(),number:$("#buyerNumber").value.trim(),neighborhood:$("#buyerNeighborhood").value.trim(),complement:$("#buyerComplement").value.trim(),city:$("#buyerCity").value.trim(),note:$("#buyerNote").value.trim()};
  const total=state.cart.reduce((s,p)=>s+p.price*p.qty,0);
  const order={id:"ELET-"+Date.now().toString(36).toUpperCase(),createdAt:new Date().toISOString(),status:"novo",payment:$("#payment").value,freight:state.freight,totalProducts:total,grandTotal:total+state.freight.price,weight:packageData().weight,buyer:b,items:state.cart.map(p=>({code:p.code,name:p.name,sale:money(p.price),qty:p.qty}))};
  const btn=e.submitter;btn.disabled=true;btn.textContent="Registrando pedido…";
  try{
    const r=await fetch(SUPABASE_URL+"/functions/v1/create-order",{method:"POST",headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY},body:JSON.stringify(order)});
    const d=await r.json().catch(()=>({}));
    if(!r.ok||d.ok===false)throw Error(d.error||"Falha ao registrar pedido.");
    const lines=order.items.map(i=>i.qty+"x "+i.name+" — "+i.sale).join("\n");
    const msg="Olá! Quero confirmar o pedido "+order.id+".\n\n"+lines+"\n\nProdutos: "+money(order.totalProducts)+"\nFrete: "+money(order.freight.price)+" ("+(order.freight.days||"")+" dias úteis)\nTotal: "+money(order.grandTotal)+"\n\nCliente: "+b.name+"\nWhatsApp: "+b.phone+"\nEndereço: "+b.address+", "+b.number+" — "+b.neighborhood+" — "+b.city+"\nCEP: "+b.cep+"\nPagamento: "+order.payment+(b.complement?"\nComplemento: "+b.complement:"")+(b.note?"\nObservação: "+b.note:"");
    localStorage.removeItem("eletroshopp-cart-v3");location.href="https://wa.me/"+WHATSAPP+"?text="+encodeURIComponent(msg);
  }catch(err){toast(err.message||"Erro ao registrar pedido.");btn.disabled=false;btn.textContent="Confirmar pedido e abrir WhatsApp"}
}

function add(id){const p=state.products.find(x=>x.id===id);if(!p||p.soldout)return;const old=state.cart.find(x=>x.id===id);old?old.qty++:state.cart.push({...p,qty:1});save();renderCart();toast(p.name+" adicionado ao carrinho");}
document.addEventListener("click",e=>{
  const addBtn=e.target.closest("[data-add]");if(addBtn){add(addBtn.dataset.add);return}
  const plus=e.target.closest("[data-plus]");if(plus){state.cart[+plus.dataset.plus].qty++;save();renderCart();return}
  const minus=e.target.closest("[data-minus]");if(minus){const i=+minus.dataset.minus;state.cart[i].qty--;if(state.cart[i].qty<1)state.cart.splice(i,1);save();renderCart();return}
  const rem=e.target.closest("[data-remove]");if(rem){state.cart.splice(+rem.dataset.remove,1);save();renderCart();return}
  const cat=e.target.closest("[data-category]");if(cat){state.category=cat.dataset.category;renderChips();render();return}
  const br=e.target.closest("[data-brand]");if(br){state.brand=br.dataset.brand;renderChips();render();return}
  const sort=e.target.closest("[data-sort]");if(sort){state.sort=sort.dataset.sort;renderChips();render();return}
  const quick=e.target.closest("[data-quick]");if(quick){const i=+quick.dataset.quick;if(i===0)state.category="Smartwatches";else if(i===1)state.category="Fones";else if(i===2)state.category="Óculos inteligentes";else if(i===3)state.category="Acessórios";else{state.category="";state.sort="asc"}renderChips();render();$("#catalog").scrollIntoView({behavior:"smooth"});return}
  if(e.target.closest("#cartButton")||e.target.closest("#heroCart"))openCart();
  if(e.target.closest("#closeCart")||e.target.id==="backdrop")closeCart();
  if(e.target.closest("#checkout"))openCheckout();
  if(e.target.closest("#closeCheckout"))closeCheckout();
  if(e.target.closest("#quoteFreight"))quote();
  if(e.target.closest("#heroShop")||e.target.closest("#promoShop"))$("#catalog").scrollIntoView({behavior:"smooth"});
});
$("#search").addEventListener("input",e=>{state.query=e.target.value;render()});
$("#buyerCep").addEventListener("input",fillCep);
$("#checkoutForm").addEventListener("submit",submitOrder);

state.products=sourceProducts.map(normalize).filter(p=>p.name&&p.price>0);
loadCart();renderQuick();renderChips();renderFeatured();render();renderCart();
console.info("Eletroshopp reconstruído:",state.products.length,"produtos");
