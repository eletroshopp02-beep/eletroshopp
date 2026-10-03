(function(){
"use strict";
if(window.__ESH_CART_FIX_V14)return;
window.__ESH_CART_FIX_V13=true;

const KEY="eletro_cart_v2";
const LEGACY_KEY="eletroshopp_cart_v2";
const SUPABASE_URL="https://sybxbyaywznbwipbssso.supabase.co";
const SUPABASE_KEY="sb_publishable_3iXGUzzTaypiGou7K7UFEw_OW1qKljR";
const FROM_CEP="84272402";

function listProducts(){try{return Array.isArray(products)?products:[]}catch(e){return []}}
function q(v){return Math.max(1,Math.min(99,Number(v)||1))}
function num(v){return Number(String(v??"").replace(",","."))||0}
function price(p){
  const s=String(p?.sale??"").replace(/[^0-9,.-]/g,"");
  return num(s.includes(",")?s.replace(/\./g,"").replace(",","."):s);
}
function money(v){return num(v).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}
function save(){try{localStorage.setItem(KEY,JSON.stringify(cart));localStorage.setItem(LEGACY_KEY,JSON.stringify(cart.map(p=>({code:p.code,qty:q(p._qty)}))))}catch(e){}}
function load(){
  let raw=[];
  try{raw=JSON.parse(localStorage.getItem(KEY)||"[]");if(!Array.isArray(raw)||!raw.length)raw=JSON.parse(localStorage.getItem(LEGACY_KEY)||"[]")}catch(e){}
  return raw.map(i=>{const code=String(i?.code??"");const p=listProducts().find(x=>String(x.code)===code);return p?Object.assign({},p,{_qty:q(i?._qty??i?.qty)}):null}).filter(Boolean);
}
function render(){
  const count=cart.reduce((s,p)=>s+q(p._qty),0);
  const top=document.getElementById("cart"),floating=document.getElementById("cartFloatCount");
  if(top)top.textContent="🛒 Carrinho ("+count+")";if(floating)floating.textContent=String(count);
  const box=document.getElementById("eletroCartItems"),total=document.getElementById("eletroCartTotal");if(!box||!total)return;
  if(!cart.length){box.innerHTML='<div class="emptycart">Seu carrinho está vazio.<br>Adicione produtos para continuar.</div>';total.textContent="Total dos produtos: R$ 0,00";return}
  box.innerHTML=cart.map((p,i)=>'<div class="cart-line"><img src="'+String(p.image||"")+'" alt=""><div class="cart-product-info"><b>'+String(p.name||"")+'</b><div class="esh-cart-price">'+String(p.sale||"")+'</div></div><div class="qty"><button type="button" data-esh-qty="'+i+'|−">−</button><b>'+q(p._qty)+'</b><button type="button" data-esh-qty="'+i+'|+">+</button></div><button type="button" class="remove-item" data-esh-remove="'+i+'">🗑️</button></div>').join("");
  total.textContent="Total dos produtos: "+money(cart.reduce((s,p)=>s+price(p)*q(p._qty),0));updateWeight();
}
function add(code,amount){
  const p=listProducts().find(x=>String(x.code)===String(code));if(!p||p.soldout)return false;
  const item=cart.find(x=>String(x.code)===String(code));if(item)item._qty=Math.min(99,q(item._qty)+q(amount));else cart.push(Object.assign({},p,{_qty:q(amount)}));
  save();render();return true;
}
window.__eletroAddToCart=(code,amount=1)=>{const ok=add(code,amount);if(ok&&typeof window.showEletroToast==="function")window.showEletroToast("Produto adicionado ao carrinho!");return ok};
window.add=(code)=>window.__eletroAddToCart(code,1);
window.addQuantityToCart=(code,n)=>window.__eletroAddToCart(code,n);
window.changeEletroQty=(i,d)=>{if(!cart?.[i])return;cart[i]._qty=q(cart[i]._qty)+Number(d||0);if(cart[i]._qty<=0)cart.splice(i,1);save();render();invalidateFreight()};
window.removeEletroCartItem=(i)=>{if(cart?.[i]){cart.splice(i,1);save();render();invalidateFreight()}};
window.clearEletroCart=()=>{cart.length=0;try{localStorage.removeItem(KEY);localStorage.removeItem(LEGACY_KEY)}catch(e){}render();invalidateFreight()};
window.openEletroCart=()=>{render();document.getElementById("eletroCart")?.classList.add("open")};
window.closeEletroCart=()=>document.getElementById("eletroCart")?.classList.remove("open");

function invalidateFreight(){window.__ESH_FREIGHT_OPTIONS=[];const box=freightBox();if(box&&/freight-option|Falha ao calcular|Consultando tarifas reais/i.test(box.textContent||""))box.innerHTML=""}
function findCep(){const inputs=[...document.querySelectorAll("input")];const named=inputs.find(x=>/cep|postal|postcode/i.test((x.id||"")+" "+(x.name||"")+" "+(x.placeholder||"")));const value=named?.value||inputs.map(x=>x.value).find(v=>/^\s*\d{5}-?\d{3}\s*$/.test(String(v||"")));return String(value||"").replace(/\D/g,"")}
function freightBox(){return document.getElementById("freightResults")||document.getElementById("eletroFreightResults")||[...document.querySelectorAll("body *")].find(x=>x.children.length===0&&/Consultando tarifas reais|Calcular frete/i.test(x.textContent||""))?.parentElement||null}
function shippingProducts(){return cart.map((p,i)=>({id:p.id??p.code??i+1,code:String(p.code??""),name:String(p.name??"Produto"),width:Math.max(1,num(p.width??p.largura??p.shipping_width)||8),height:Math.max(1,num(p.height??p.altura??p.shipping_height)||4),length:Math.max(1,num(p.length??p.comprimento??p.shipping_length)||20),weight:Math.max(.01,num(p.weight??p.peso??p.shipping_weight)||.30),value:price(p),quantity:q(p._qty),category:p.category||"Eletrônicos"}))}
function updateWeight(){
  const ps=shippingProducts();
  const w=ps.reduce((s,p)=>s+p.weight*p.quantity,0);
  const label="📦 Peso estimado do pacote "+w.toFixed(2).replace(".",",")+" kg";
  [...document.querySelectorAll("body *")]
    .filter(x=>x.children.length===0&&/Peso estimado do pacote/i.test(x.textContent||""))
    .forEach(x=>{
      x.textContent=label;
      const parent=x.parentElement;
      if(parent){
        [...parent.children].forEach(child=>{
          if(child!==x && /^\s*\d+[,.]\d+\s*kg\s*$/i.test(child.textContent||"")) child.remove();
        });
      }
    });
}
let freightProgressTimer=null;
function stopFreightProgress(){if(freightProgressTimer){clearInterval(freightProgressTimer);freightProgressTimer=null}}
function startFreightProgress(box){
  stopFreightProgress();
  if(!document.getElementById("eshFreightProgressStyle")){
    const s=document.createElement("style");s.id="eshFreightProgressStyle";s.textContent=".freight-progress-wrap{padding:10px 0}.freight-progress-title{color:#ef233c;font-weight:700;margin-bottom:9px}.freight-progress-track{height:10px;background:rgba(255,255,255,.10);border-radius:999px;overflow:hidden;border:1px solid rgba(255,255,255,.08)}.freight-progress-bar{height:100%;width:4%;background:linear-gradient(90deg,#ff1e2d,#ff5964);border-radius:999px;transition:width .8s ease;box-shadow:0 0 12px rgba(255,30,45,.55)}.freight-progress-text{font-size:13px;opacity:.78;margin-top:8px;text-align:center}";document.head.appendChild(s)
  }
  if(!box)return;
  box.innerHTML='<div class="freight-progress-wrap"><div class="freight-progress-title">⏳ Consultando tarifas reais...</div><div class="freight-progress-track"><div class="freight-progress-bar" id="eshFreightProgressBar"></div></div><div class="freight-progress-text" id="eshFreightProgressText">Conectando à Frenet...</div></div>';
  let p=4,sec=0;
  const bar=box.querySelector("#eshFreightProgressBar"),txt=box.querySelector("#eshFreightProgressText");
  freightProgressTimer=setInterval(()=>{
    sec++;
    if(p<90)p+=p<40?6:p<70?3:1;
    if(bar)bar.style.width=p+"%";
    if(txt)txt.textContent=sec<5?"Enviando dados do pedido...":sec<12?"Consultando transportadoras...":sec<20?"Aguardando tarifas e prazos...":"Finalizando cotação...";
  },1000);
}
function finishFreightProgress(box,success){
  stopFreightProgress();
  const bar=box?.querySelector("#eshFreightProgressBar");
  if(bar){bar.style.width=success?"100%":"0%"}
}
async function quoteFreight(){
  const box=freightBox();if(!cart.length){if(box)box.innerHTML='<div class="freight-error">Adicione um produto ao carrinho.</div>';return}
  const cep=findCep();if(!/^\d{8}$/.test(cep)){if(box)box.innerHTML='<div class="freight-error">Informe um CEP de destino válido.</div>';return}
  const productsForQuote=shippingProducts();updateWeight();startFreightProgress(box);
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),18000);
  try{
    const r=await fetch(SUPABASE_URL+"/functions/v1/frenet-quote",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json","apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY},body:JSON.stringify({fromPostalCode:FROM_CEP,toPostalCode:cep,products:productsForQuote}),signal:controller.signal});
    const raw=await r.text();let data={};try{data=raw?JSON.parse(raw):{}}catch(e){data={message:raw}}if(!r.ok){
      const detail=data?.details?.message||data?.details?.error||data?.details?.Message||"";
      throw new Error(data.error||detail||data.message||("HTTP "+r.status));
    }
    const opts=Array.isArray(data.quotes)?data.quotes:[];if(!opts.length)throw new Error(data.error||"Nenhuma opção de envio encontrada.");window.__ESH_FREIGHT_OPTIONS=opts;
    finishFreightProgress(box,true);if(box){box.innerHTML=opts.map((o,i)=>'<button type="button" class="freight-option" data-esh-freight="'+i+'"><span><b>🚚 '+String(o.company?o.company+" — ":"")+(o.name||"Frete")+'</b><small>'+(o.days??"consulte")+' dias úteis</small></span><strong>'+money(o.price)+'</strong></button>').join("");box.querySelectorAll("[data-esh-freight]").forEach(btn=>btn.addEventListener("click",()=>{const o=window.__ESH_FREIGHT_OPTIONS[Number(btn.dataset.eshFreight)];window.state=window.state||{};window.state.freight={id:String(o.id||o.name||"frete"),name:o.name||"Frete",company:o.company||"",price:num(o.price),days:o.days??"",carrierCode:o.carrierCode||""};box.querySelectorAll("[data-esh-freight]").forEach(x=>x.classList.remove("selected"));btn.classList.add("selected");if(typeof window.updateSummary==="function")try{window.updateSummary()}catch(e){}}))}
  }catch(e){stopFreightProgress();console.error("Eletroshopp Frenet",e);if(box)box.innerHTML='<div class="freight-error">Falha ao calcular o frete: '+String(e.name==="AbortError"?"tempo esgotado":e.message||"erro desconhecido")+'</div>'}finally{clearTimeout(timer)}
}
window.addEventListener("click",function(e){
  const target=e.target?.closest?.("#quoteFreight");if(target){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();quoteFreight();return}
  const qtyBtn=e.target?.closest?.("[data-esh-qty]");if(qtyBtn){e.preventDefault();e.stopPropagation();const [i,op]=qtyBtn.dataset.eshQty.split("|");window.changeEletroQty(Number(i),op==="+"?1:-1);return}
  const rm=e.target?.closest?.("[data-esh-remove]");if(rm){e.preventDefault();e.stopPropagation();window.removeEletroCartItem(Number(rm.dataset.eshRemove));return}
  const b=e.target?.closest?.("button");if(!b)return;const label=(b.innerText||b.textContent||"").trim().toLowerCase();if(!/adicionar ao carrinho|comprar agora/.test(label))return;
  let n=b,code=null;for(let i=0;n&&i<10;i++,n=n.parentElement){code=n.getAttribute?.("data-code");if(code)break;const oc=n.getAttribute?.("onclick")||"";const m=oc.match(/(?:addDirectToCart|addFromDetail|buyNowFromDetail|addQuantityToCart|add)\s*\(\s*['"]([^'"]+)['"]/i);if(m){code=m[1];break}}
  if(code){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();window.__eletroAddToCart(code,1);try{window.openEletroCart()}catch(_){}}
},true);
function boot(){if(typeof cart==="undefined"||!Array.isArray(cart))return setTimeout(boot,100);const loaded=load();cart.length=0;loaded.forEach(x=>cart.push(x));render()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();setTimeout(boot,500);
})();