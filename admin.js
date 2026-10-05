(()=>{
"use strict";

const API="https://sybxbyaywznbwipbssso.supabase.co/functions/v1/admin-orders";
const ADMIN_PIN="250808";
let pin=sessionStorage.getItem("esh-admin-pin")||"";
let orders=[];

const $=(selector)=>document.querySelector(selector);
const money=(value)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(value)||0);
const esc=(value)=>String(value??"").replace(/[&<>"]/g,(char)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[char]));

const settings=()=>({
 name:localStorage.getItem("esh-sender-name")||"Eletroshopp",
 cep:localStorage.getItem("esh-sender-cep")||"84261-000",
 address:localStorage.getItem("esh-sender-address")||"",
 city:localStorage.getItem("esh-sender-city")||"Telêmaco Borba - PR"
});

async function api(method="GET",body=null){
 const response=await fetch(API+"?t="+Date.now(),{
  method,
  cache:"no-store",
  headers:{
   "Content-Type":"application/json",
   "x-admin-pin":pin,
   "Cache-Control":"no-cache"
  },
  body:body?JSON.stringify(body):undefined
 });
 const data=await response.json().catch(()=>({}));
 if(!response.ok) throw new Error(data.error||data.message||"Painel indisponível");
 return data;
}

function showLogin(message=""){
 const login=$("#login"),app=$("#app");
 if(login) login.hidden=false;
 if(app) app.hidden=true;
 const msg=$("#loginMsg");
 if(msg) msg.textContent=message;
}

function showApp(){
 const login=$("#login"),app=$("#app");
 if(login) login.hidden=true;
 if(app) app.hidden=false;
}

function printDoc(order,label){
 const sender=settings();
 const buyer=order.buyer||{};
 const freight=order.freight||{};
 const items=Array.isArray(order.items)?order.items:[];
 const buyerAddress=[buyer.street&&("Rua: "+buyer.street),buyer.number&&("Nº "+buyer.number),buyer.complement&&("Complemento: "+buyer.complement),buyer.neighborhood&&("Bairro: "+buyer.neighborhood),buyer.city&&("Cidade: "+buyer.city),buyer.state&&("UF: "+buyer.state),buyer.cep&&("CEP: "+buyer.cep)].filter(Boolean);
 const fullBuyerAddress=buyerAddress.length?buyerAddress:[buyer.address||"Endereço não informado"];
 const origin=[sender.address,sender.city,"CEP: "+sender.cep].filter(Boolean);
 const rows=items.map(item=>"<tr><td><b>"+esc((item.quantity||1)+"× "+(item.name||"Produto"))+"</b><br><small>"+esc(item.description||"")+"</small></td><td>"+money(item.price)+"</td><td>"+money((item.price||0)*(item.quantity||1))+"</td></tr>").join("");
 const freightName=esc(freight.name||freight.service||"Frete");
 const freightDays=esc(freight.days||"");
 const buyerBlock="<b>"+esc(buyer.name||"")+"</b><br>"+fullBuyerAddress.map(esc).join("<br>")+"<br>WhatsApp: "+esc(buyer.phone||"Não informado");
 const originBlock=origin.map(esc).join("<br>");
 const content=label
  ? "<div class='label'><h1>ELETROSHOPP</h1><h2>ETIQUETA DE ENVIO</h2><div class='code'>"+esc(order.id)+"</div><hr><h3>REMETENTE</h3><p><b>"+esc(sender.name)+"</b><br>"+originBlock+"</p><h3>DESTINATÁRIO</h3><p>"+buyerBlock+"</p><h3>CONTEÚDO DO ENVIO</h3><table><thead><tr><th>Produto</th><th>Unit.</th><th>Subtotal</th></tr></thead><tbody>"+rows+"</tbody></table><p><b>Produtos:</b> "+money(order.total_products)+"<br><b>Frete:</b> "+money(freight.price)+" — "+freightName+(freightDays?" — "+freightDays+" dias":"")+"<br><strong>TOTAL:</strong> "+money(order.grand_total)+"</p><div class='barcode'>|||| "+esc(order.id)+" ||||</div></div>"
  : "<div class='sheet'><h1>ELETROSHOPP — PEDIDO</h1><p><b>Pedido:</b> "+esc(order.id)+"<br><b>Data:</b> "+esc(order.created_at?new Date(order.created_at).toLocaleString("pt-BR"):"")+"<br><b>Status:</b> "+esc(order.status||"novo")+"</p><h2>Remetente</h2><p><b>"+esc(sender.name)+"</b><br>"+originBlock+"</p><h2>Destinatário</h2><p>"+buyerBlock+"</p><h2>Produtos</h2><table><thead><tr><th>Produto</th><th>Unit.</th><th>Subtotal</th></tr></thead><tbody>"+rows+"</tbody></table><hr><p>Subtotal: "+money(order.total_products)+"<br>Frete: "+money(freight.price)+" — "+freightName+(freightDays?" — "+freightDays+" dias":"")+"<br><b>Total: "+money(order.grand_total)+"</b><br>Pagamento: "+esc(order.payment||"A combinar")+"</p></div>";
 const win=window.open("","_blank");
 if(!win){alert("Permita pop-ups para imprimir.");return;}
 win.document.write("<!doctype html><html><head><meta charset='utf-8'><title>"+esc(order.id)+"</title><style>body{font:14px Arial;color:#111;margin:20px}.sheet{max-width:850px;margin:auto}.label{width:100mm;min-height:150mm;padding:6mm;box-sizing:border-box}.label h1,.label h2{text-align:center}.code{text-align:center;font-size:20px;font-weight:bold}table{width:100%;border-collapse:collapse}th,td{padding:6px 3px;border-bottom:1px solid #ccc;text-align:left}.barcode{text-align:center;border:2px dashed #111;padding:12px;margin-top:18px;font:700 18px monospace;letter-spacing:2px}@page{margin:8mm}@media print{body{margin:0}}</style></head><body>"+content+"</body></html>");
 win.document.close();
 setTimeout(()=>win.print(),400);
}
function render(list){
 const safeList=Array.isArray(list)?list:[];
 const summary=$("#summary");
 const ordersEl=$("#orders");
 const stat=$("#statOrders");
 if(summary) summary.textContent=safeList.length+" pedido(s)";
 if(stat) stat.textContent=safeList.length;
 if(!ordersEl) return;
 if(!safeList.length){
  ordersEl.innerHTML="<div class='empty'>Nenhum pedido encontrado.</div>";
  return;
 }
 ordersEl.innerHTML=safeList.map((order)=>{
  const buyer=order.buyer||{};
  const freight=order.freight||{};
  const items=Array.isArray(order.items)?order.items:[];
  const options=["novo","em_separacao","enviado","entregue","cancelado"].map((status)=>{
   const label={novo:"Novo",em_separacao:"Em separação",enviado:"Enviado",entregue:"Entregue",cancelado:"Cancelado"}[status];
   return "<option value='"+status+"' "+(order.status===status?"selected":"")+">"+label+"</option>";
  }).join("");
  return "<article class='order'><div class='order-head'><div><b>"+esc(order.id)+"</b><small>"+esc(order.created_at?new Date(order.created_at).toLocaleString("pt-BR"):"")+"</small></div><span class='badge'>"+esc(order.status||"novo")+"</span></div><div class='meta'><div><small>Cliente</small>"+esc(buyer.name||"—")+"</div><div><small>WhatsApp</small>"+esc(buyer.phone||"—")+"</div><div><small>CEP de entrega</small>"+esc(buyer.cep||"—")+"</div></div><p><small>Endereço de entrega</small>"+esc(buyer.address||"—")+"</p>"+items.map((item)=>"<div class='item'><span>"+esc((item.quantity||1)+"× "+(item.name||"Produto"))+"</span><b>"+money((item.price||0)*(item.quantity||1))+"</b></div>").join("")+"<div class='totals'><span>Produtos: <b>"+money(order.total_products)+"</b></span><span>Frete: <b>"+money(freight.price)+"</b></span><strong>Total: "+money(order.grand_total)+"</strong></div><div class='order-actions'><select data-status='"+esc(order.id)+"'>"+options+"</select><button class='print-btn' data-print='"+esc(order.id)+"'>🖨 Imprimir pedido</button><button class='label-btn' data-label='"+esc(order.id)+"'>🏷 Imprimir etiqueta</button></div></article>";
 }).join("");
}

async function loadOrders(){
 try{
  const data=await api("GET");
  orders=Array.isArray(data)?data:(Array.isArray(data.orders)?data.orders:[]);
  render(orders);
  const msg=$("#loginMsg");
  if(msg) msg.textContent="";
 }catch(error){
  const summary=$("#summary");
  if(summary) summary.textContent="Erro ao consultar pedidos";
  const msg=$("#loginMsg");
  if(msg) msg.textContent="Acesso aceito, mas não foi possível carregar os pedidos: "+error.message;
 }
}

async function login(){
 const input=$("#pin");
 pin=(input?.value||"").replace(/\D/g,"").slice(0,6);
 if(pin.length!==6){showLogin("Digite o PIN de 6 dígitos.");return;}
 if(pin!==ADMIN_PIN){showLogin("PIN inválido.");return;}
 sessionStorage.setItem("esh-admin-pin",pin);
 showApp();
 await loadOrders();
}

function logout(){
 pin="";
 sessionStorage.removeItem("esh-admin-pin");
 showLogin("");
 const input=$("#pin");
 if(input){input.value="";input.focus();}
}

function init(){
 const enter=$("#enter"),input=$("#pin"),refresh=$("#refresh"),logoutButton=$("#logout");
 if(!enter||!input){
  console.error("Eletroshopp Admin: elementos de login não encontrados.");
  return;
 }
 enter.addEventListener("click",login);
 input.addEventListener("keydown",(event)=>{if(event.key==="Enter") login();});
 refresh?.addEventListener("click",loadOrders);
 logoutButton?.addEventListener("click",logout);

 document.addEventListener("change",async(event)=>{
  const id=event.target?.dataset?.status;
  if(!id)return;
  try{await api("POST",{id,status:event.target.value});await loadOrders();}
  catch(error){alert(error.message);}
 });

 document.addEventListener("click",(event)=>{
  const printId=event.target?.dataset?.print;
  const labelId=event.target?.dataset?.label;
  if(printId){const order=orders.find((item)=>item.id===printId);if(order)printDoc(order,false);}
  if(labelId){const order=orders.find((item)=>item.id===labelId);if(order)printDoc(order,true);}
 });

 if(pin===ADMIN_PIN){showApp();loadOrders();}else{showLogin("");}
}

if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init);
else init();
})();