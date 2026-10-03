const SUPABASE_URL="https://sybxbyaywznbwipbssso.supabase.co";
const SUPABASE_KEY="sb_publishable_3iXGUzzTaypiGou7K7UFEw_OW1qKljR";
const WA="5542998157736";
const $=s=>document.querySelector(s);
const money=v=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(v)||0);
const state={products:[],items:JSON.parse(localStorage.getItem("eletroshopp-cart")||"[]"),freight:null};
async function invokeFunction(name,body){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),28000);
  try{
    const r=await fetch(SUPABASE_URL+"/functions/v1/"+name,{
      method:"POST",
      headers:{"Content-Type":"application/json","Accept":"application/json","apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY},
      body:JSON.stringify(body),
      signal:controller.signal
    });
    const raw=await r.text();
    let data=null;try{data=raw?JSON.parse(raw):null;}catch{data={message:raw};}
    if(!r.ok)throw new Error(data?.error||data?.message||("HTTP "+r.status));
    return {data,error:null};
  }catch(e){
    if(e?.name==="AbortError")throw new Error("A cotação excedeu 28 segundos. A conexão com o servidor de frete não respondeu.");
    throw e;
  }finally{clearTimeout(timer);}
}

function priceOf(p){
  if(typeof p.price==="number") return p.price;
  const s=String(p.sale??p.price??"").replace(/[^0-9,.-]/g,"").replace(/\./g,"").replace(",",".");
  return Number(s)||0;
}
function categoryOf(p){
  const n=(p.name+" "+p.code).toLowerCase();
  if(/fone|earbud|buds|headset|airpod/.test(n)) return "Fones";
  if(/ferrament|chave|alicate|kit\b|jogo\b|furadeira|parafus|soquete|broca/.test(n)) return "Ferramentas";
  if(/smartwatch|rel[oó]gio|watch|ultra|pulseira/.test(n)) return "Smartwatches";
  if(/carregador|cabo|fonte|adaptador|suporte|acess[oó]rio/.test(n)) return "Acessórios";
  return "Eletrônicos";
}
function normalize(p){
  return {
    id:String(p.code||p.name||crypto.randomUUID()),
    code:String(p.code||""),
    name:String(p.name||"Produto"),
    description:String(p.desc||p.description||""),
    price:priceOf(p),
    image:String(p.image||""),
    category:categoryOf(p),
    soldout:Boolean(p.soldout||p.esgotado||p.stock===0||!p.sale||String(p.status||"").toLowerCase().includes("esgot")),
    weight:Number(p.weight)||0.35,
    width:Number(p.width)||8,
    height:Number(p.height)||4,
    length:Number(p.length)||20,
    raw:p
  };
}
async function loadCatalog(){
  const r=await fetch("./data/products.json",{cache:"no-store"});
  if(!r.ok) throw new Error("Não foi possível carregar o catálogo.");
  const raw=await r.json();
  state.products=raw.map(normalize).filter(p=>p.name&&p.price>=0);
}
function saveCart(){localStorage.setItem("eletroshopp-cart",JSON.stringify(state.items));renderCart();}
function categories(){
  return [...new Set(state.products.map(p=>p.category))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
}
function renderCategories(){
  const el=$("#category");
  el.innerHTML='<option value="">Todas as categorias</option>';
  categories().forEach(c=>el.insertAdjacentHTML("beforeend",`<option value="${c}">${c}</option>`));
}
function filtered(){
  const q=$("#search").value.trim().toLowerCase(), c=$("#category").value;
  return state.products.filter(p=>(!q||[p.name,p.code,p.description,p.category].join(" ").toLowerCase().includes(q))&&(!c||p.category===c));
}
function render(){
  const list=filtered();
  $("#status").textContent=list.length?`${list.length} produto(s) • ${state.products.filter(p=>!p.soldout).length} disponíveis`:"Nenhum produto encontrado";
  $("#products").innerHTML=list.map(p=>`<article class="card ${p.soldout?"soldout":""}">
    <div class="visual"><img src="${p.image}" alt="${p.name}" loading="lazy"></div>
    <div class="card-body"><span class="tag">${p.category}</span><h2>${p.name}</h2><p>${p.description}</p>
    <strong class="price">${p.soldout?"Indisponível":money(p.price)}</strong>
    <button data-add="${p.id}" type="button" ${p.soldout?"disabled":""}>${p.soldout?"Sem estoque":"Adicionar ao carrinho"}</button></div>
  </article>`).join("");
}
function renderCart(){
  const count=state.items.reduce((s,i)=>s+i.qty,0);
  const total=state.items.reduce((s,i)=>s+i.price*i.qty,0);
  $("#cartCount").textContent=count;
  $("#cartTotal").textContent=money(total);
  $("#cartItems").innerHTML=state.items.length?state.items.map(i=>`<div class="cart-line"><span>${i.name} × ${i.qty}</span><b>${money(i.price*i.qty)}</b></div>`).join(""):"<p>Seu carrinho está vazio.</p>";
}
function openCart(){$("#cartPanel").classList.add("open");$("#backdrop").classList.add("show");}
function closeCart(){$("#cartPanel").classList.remove("open");$("#backdrop").classList.remove("show");}
function openCheckout(){
  if(!state.items.length)return alert("Adicione um produto ao carrinho.");
  closeCart();$("#checkoutModal").classList.add("open");$("#checkoutModal").setAttribute("aria-hidden","false");updateSummary();
}
function closeCheckout(){$("#checkoutModal").classList.remove("open");$("#checkoutModal").setAttribute("aria-hidden","true");}
function cleanCep(v){return String(v||"").replace(/\D/g,"").slice(0,8);}
function formatCep(v){const c=cleanCep(v);return c.length>5?c.slice(0,5)+"-"+c.slice(5):c;}
function specs(){
  const products=state.items.map(i=>{
    const p=state.products.find(x=>String(x.id)===String(i.id)||String(x.code)===String(i.code))||{};
    return {
      id:i.id,
      code:i.code,
      width:Number(i.width)||Number(p.width)||8,
      height:Number(i.height)||Number(p.height)||4,
      length:Number(i.length)||Number(p.length)||20,
      weight:Number(i.weight)||Number(p.weight)||0.30,
      value:Number(i.price)||Number(p.price)||0,
      quantity:Math.max(1,Number(i.qty)||1),
      category:p.category||"Eletrônicos"
    };
  });
  const weight=products.reduce((s,p)=>s+p.weight*p.quantity,0);
  return {products,weight:Number(Math.max(.1,weight).toFixed(3))};
}
function updateSummary(){
  const productsTotal=state.items.reduce((s,i)=>s+i.price*i.qty,0), freight=state.freight?.price||0;
  $("#checkoutSummary").innerHTML=`<div><span>Produtos</span><b>${money(productsTotal)}</b></div><div><span>Frete</span><b>${state.freight?money(freight):"Calcule o frete"}</b></div><div class="grand"><span>Total</span><b>${money(productsTotal+freight)}</b></div>`;
}
async function fillCep(){
  const cep=cleanCep($("#buyerCep").value);$("#buyerCep").value=formatCep(cep);
  if(cep.length!==8)return;
  try{
    const r=await fetch("https://viacep.com.br/ws/"+cep+"/json/");
    const d=await r.json();
    if(d.erro)return;
    $("#buyerAddress").value=d.logradouro||"";
    $("#buyerNeighborhood").value=d.bairro||"";
    $("#buyerCity").value=[d.localidade,d.uf].filter(Boolean).join("/");
  }catch(e){console.warn("ViaCEP",e);}
}
async function quoteFreight(){
  const cep=cleanCep($("#buyerCep").value);
  if(cep.length!==8)return alert("Digite um CEP válido.");
  const box=$("#freightResults");box.innerHTML='<div class="loading">⏳ Consultando tarifas reais...</div>';
  try{
    const s=specs();
    const payload={fromPostalCode:"84272402",toPostalCode:cep,products:s.products};
    const {data,error}=await invokeFunction("frenet-quote",payload);
    if(error)throw error;
    const opts=Array.isArray(data?.quotes)?data.quotes:[];
    if(!opts.length)throw new Error(data?.error||"Nenhuma opção de envio encontrada.");
    window.__quotes=opts;
    box.innerHTML=opts.map((o,i)=>`<button type="button" class="freight-option" data-i="${i}"><span><b>🚚 ${o.company?o.company+" — ":""}${o.name||"Frete"}</b><small>${o.days??"consulte"} dias úteis</small></span><strong>${money(o.price)}</strong></button>`).join("");
    box.querySelectorAll(".freight-option").forEach(b=>b.addEventListener("click",()=>{
      const o=window.__quotes[Number(b.dataset.i)];
      state.freight={id:String(o.id||o.name||"frete"),name:o.name||"Frete",company:o.company||"",price:Number(o.price),days:o.days??"",carrierCode:o.carrierCode||""};
      box.querySelectorAll(".freight-option").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");updateSummary();
    }));
  }catch(e){
    console.error(e);
    const msg=String(e?.message||"").trim();
    box.innerHTML='<div class="freight-error">'+(msg||"Não foi possível calcular o frete agora. Verifique o CEP e tente novamente.")+'</div>';
  }
}
async function confirmOrder(e){
  e.preventDefault();
  if(!state.freight)return alert("Calcule e selecione uma opção de frete antes de confirmar.");
  const buyer={name:$("#buyerName").value.trim(),phone:$("#buyerPhone").value.trim(),cep:cleanCep($("#buyerCep").value),address:$("#buyerAddress").value.trim(),number:$("#buyerNumber").value.trim(),neighborhood:$("#buyerNeighborhood").value.trim(),complement:$("#buyerComplement").value.trim(),city:$("#buyerCity").value.trim()};
  const total=state.items.reduce((s,i)=>s+i.price*i.qty,0);
  const order={id:"ELET-"+Date.now().toString(36).toUpperCase(),createdAt:new Date().toISOString(),status:"novo",payment:$("#payment").value,freight:state.freight,totalProducts:total,grandTotal:total+state.freight.price,weight:specs().weight,buyer,items:state.items.map(i=>({code:i.code,name:i.name,sale:money(i.price),qty:i.qty}))};
  const btn=e.submitter;btn.disabled=true;btn.textContent="Registrando pedido...";
  try{
    const {data,error}=await invokeFunction("create-order",order);
    if(error||data?.ok!==true)throw error||new Error(data?.error||"Falha ao registrar pedido");
    const lines=order.items.map(i=>`${i.qty}x ${i.name} — ${i.sale}`).join("\n");
    const msg=`Olá! Quero confirmar o pedido ${order.id}.\n\n${lines}\n\nProdutos: ${money(order.totalProducts)}\nFrete: ${money(order.freight.price)} (${order.freight.days} dias úteis)\nTotal: ${money(order.grandTotal)}\n\nCliente: ${buyer.name}\nWhatsApp: ${buyer.phone}\nEndereço: ${buyer.address}, ${buyer.number} — ${buyer.neighborhood} — ${buyer.city}\nCEP: ${buyer.cep}\nPagamento: ${order.payment}`;
    localStorage.removeItem("eletroshopp-cart");window.location.href="https://wa.me/"+WA+"?text="+encodeURIComponent(msg);
  }catch(err){
    console.error(err);
    alert("Não foi possível registrar o pedido. Ele não foi enviado ao WhatsApp.\n\n"+(err.message||"Tente novamente."));
    btn.disabled=false;btn.textContent="Confirmar pedido e abrir WhatsApp";
  }
}
document.addEventListener("click",e=>{
  const id=e.target.dataset.add;
  if(id){
    const p=state.products.find(x=>x.id===id);if(!p||p.soldout)return;
    const item=state.items.find(x=>x.id===id);
    item?item.qty++:state.items.push({id:p.id,code:p.code,name:p.name,price:p.price,weight:p.weight,width:p.width,height:p.height,length:p.length,qty:1});
    saveCart();return;
  }
  if(e.target.closest("#cartButton"))openCart();
  if(e.target.closest("#closeCart")||e.target.id==="backdrop")closeCart();
  if(e.target.closest("#checkout"))openCheckout();
  if(e.target.closest("#closeCheckout"))closeCheckout();
  if(e.target.closest("#quoteFreight"))quoteFreight();
});
$("#search").addEventListener("input",render);
$("#category").addEventListener("change",render);
$("#buyerCep").addEventListener("input",fillCep);
$("#checkoutForm").addEventListener("submit",confirmOrder);

(async function init(){
  try{
    await loadCatalog();
    renderCategories();render();renderCart();
  }catch(e){
    console.error(e);$("#status").textContent="Não foi possível carregar o catálogo.";$("#products").innerHTML='<div class="freight-error">Erro ao carregar os produtos. Tente atualizar a página.</div>';
  }
  if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
})();
