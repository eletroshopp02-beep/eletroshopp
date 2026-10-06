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
 cep:"84272-402",
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
function updateFinance(list){
 const valid=(Array.isArray(list)?list:[]).filter(o=>String(o.status||"novo")!=="cancelado");
 const revenue=valid.reduce((sum,o)=>sum+Number(o.grand_total||0),0);
 const freight=valid.reduce((sum,o)=>sum+Number((o.freight||{}).price||0),0);
 const ticket=valid.length?revenue/valid.length:0;
 $("#statRevenue")&&($("#statRevenue").textContent=money(revenue));
 $("#financeRevenue")&&($("#financeRevenue").textContent=money(revenue));
 $("#financeFreight")&&($("#financeFreight").textContent=money(freight));
 $("#financeTicket")&&($("#financeTicket").textContent=money(ticket));
 $("#chartTotal")&&($("#chartTotal").textContent=money(revenue));
 const chart=$("#salesChart");
 if(!chart)return;
 const days=[];
 const today=new Date(); today.setHours(0,0,0,0);
 for(let i=6;i>=0;i--){const d=new Date(today);d.setDate(today.getDate()-i);days.push({key:d.toISOString().slice(0,10),label:d.toLocaleDateString("pt-BR",{weekday:"short"}).replace(".","")+" "+String(d.getDate()).padStart(2,"0")});}
 const values=days.map(day=>valid.filter(o=>o.created_at&&new Date(o.created_at).toISOString().slice(0,10)===day.key).reduce((sum,o)=>sum+Number(o.grand_total||0),0));
 const max=Math.max(...values,1);
 chart.innerHTML=days.map((day,i)=>{const value=values[i],height=Math.max(3,(value/max)*145);return "<div class='chart-col'><div class='chart-value'>"+esc(value?money(value):"R$ 0")+"</div><div class='chart-bar' style='height:"+height+"px' title='"+esc(day.label+": "+money(value))+"'></div><div class='chart-label'>"+esc(day.label)+"</div></div>";}).join("");
}
function accountingData(){try{return JSON.parse(localStorage.getItem("esh-accounting-data")||"{}")}catch{return {}}}
function saveAccountingData(d){localStorage.setItem("esh-accounting-data",JSON.stringify(d))}
function accountingMonth(){const el=$("#accountingMonth");if(!el)return "";if(!el.value){const d=new Date();el.value=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")}return el.value}
function updateAccounting(list){
 const data=accountingData(),costs=data.costs||{},expenses=data.expenses||[],month=accountingMonth();
 const valid=(Array.isArray(list)?list:[]).filter(o=>o.status!=="cancelado"&&monthKey(o.created_at)===month),products={};
 valid.forEach(o=>(o.items||[]).forEach(i=>{const k=String(i.id||i.name);products[k]??={id:i.id||"",name:i.name||"Produto",qty:0,sales:0};products[k].qty+=Number(i.quantity||1);products[k].sales+=Number(i.price||0)*Number(i.quantity||1)}));
 const rows=Object.values(products).map(p=>{const key=String(p.id||p.name),has=Object.prototype.hasOwnProperty.call(costs,key),unit=Number(costs[key]||0);return {...p,key,has,unit,cost:unit*p.qty,profit:p.sales-unit*p.qty}});
 const known=rows.filter(p=>p.has),exp=expenses.filter(e=>e.month===month),expenseTotal=exp.reduce((a,e)=>a+Number(e.value||0),0),net=known.reduce((a,p)=>a+p.profit,0)-expenseTotal,pending=rows.length-known.length;
 $("#financeRevenue")&&($("#financeRevenue").textContent=money(valid.reduce((a,o)=>a+Number(o.grand_total||0),0)));
 $("#financeFreight")&&($("#financeFreight").textContent=money(valid.reduce((a,o)=>a+Number((o.freight||{}).price||0),0)));
 $("#financeTicket")&&($("#financeTicket").textContent=money(valid.length?valid.reduce((a,o)=>a+Number(o.grand_total||0),0)/valid.length:0));
 $("#financeProfit")&&($("#financeProfit").textContent=(pending?"~ ":"")+money(net));
 $("#statProfit")&&($("#statProfit").textContent=(pending?"~ ":"")+money(net));
 const ce=$("#costsList"); if(ce){const all={},orders=(Array.isArray(list)?list:[]).filter(o=>o.status!=="cancelado");orders.forEach(o=>(o.items||[]).forEach(i=>{const k=String(i.id||i.name);all[k]={id:i.id||"",name:i.name||"Produto"}}));ce.innerHTML=Object.values(all).sort((a,b)=>a.name.localeCompare(b.name)).map(p=>{const k=String(p.id||p.name),v=costs[k];return "<div class='cost-row "+(v==null?"pending":"")+"'><div><strong>"+esc(p.name)+"</strong><small>"+(v==null?"Custo não informado":"Custo por unidade")+"</small></div><input class='cost-input' data-cost='"+esc(k)+"' type='number' min='0' step='0.01' value='"+(v==null?"":v)+"' placeholder='R$ 0,00'></div>"}).join("")||"<div class='empty-mini'>Nenhum produto vendido ainda.</div>"}
 const ee=$("#expensesList");if(ee)ee.innerHTML=exp.map(e=>"<div class='expense-row'><div><b>"+esc(e.desc)+"</b><small>"+e.month+"</small></div><b>"+money(e.value)+"</b><button class='delete-expense' data-expense='"+esc(e.id)+"'>×</button></div>").join("")||"<div class='empty-mini'>Nenhuma despesa neste mês.</div>";
 const pr=$("#profitRanking");if(pr)pr.innerHTML=rows.sort((a,b)=>b.profit-a.profit).map(p=>"<tr><td><b>"+esc(p.name)+"</b></td><td>"+p.qty+"</td><td>"+money(p.sales)+"</td><td>"+(p.has?money(p.cost):"—")+"</td><td class='"+(p.has?"profit-good":"profit-pending")+"'>"+(p.has?money(p.profit):"Pendente")+"</td><td>"+(p.has&&p.sales?(p.profit/p.sales*100).toFixed(1)+"%":"—")+"</td></tr>").join("")||"<tr><td colspan='6' class='empty-mini'>Nenhuma venda neste mês.</td></tr>";
 const mc=$("#monthlyChart");if(mc){
  const now=new Date(),months=[];
  for(let i=5;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);months.push({key:d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0"),label:d.toLocaleDateString("pt-BR",{month:"short",year:"2-digit"}).replace(".","")})}
  const monthOrders=(Array.isArray(list)?list:[]).filter(o=>o.status!=="cancelado"); const vals=months.map(m=>monthOrders.filter(o=>monthKey(o.created_at)===m.key).reduce((a,o)=>a+Number(o.grand_total||0),0)),mx=Math.max(...vals,1);
  mc.innerHTML=months.map((m,i)=>"<div class='monthly-col'><div class='monthly-value'>"+money(vals[i])+"</div><div class='monthly-bar' style='height:"+Math.max(4,120*vals[i]/mx)+"px'></div><div class='monthly-label'>"+esc(m.label)+"</div></div>").join("");
 }
 const title=$("#finance")?.querySelector(".finance-head p");if(title)title.textContent="Mês "+month+" • "+valid.length+" pedido(s) • "+(pending?"Há produtos sem custo cadastrado.":"Todos os custos estão cadastrados.");
}
function monthKey(date){const d=new Date(date);return isNaN(d)?"":d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")}
function updateDeleteControls(){const checks=[...document.querySelectorAll("[data-order-select]")],checked=checks.filter(x=>x.checked),all=$("#selectAllOrders");if(all){all.checked=checks.length>0&&checked.length===checks.length;all.indeterminate=checked.length>0&&checked.length<checks.length}const btn=$("#deleteSelected");if(btn)btn.disabled=checked.length===0;const count=$("#selectedCount");if(count)count.textContent=checked.length;}
function render(list){
 const safeList=Array.isArray(list)?list:[];
 const summary=$("#summary");
 const ordersEl=$("#orders");
 const stat=$("#statOrders");
 if(summary) summary.textContent=safeList.length+" pedido(s)";
 const selected=new Set([...document.querySelectorAll("[data-order-select]:checked")].map(x=>x.value));
 if(stat) stat.textContent=safeList.length;
 updateFinance(safeList);
 updateAccounting(safeList);
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
  return "<article class='order'><div class='order-head'><div class='order-select'><input type='checkbox' data-order-select value=\""+esc(order.id)+"\" "+(selected.has(String(order.id))?"checked":"")+"><div><b>"+esc(order.id)+"</b><small>"+esc(order.created_at?new Date(order.created_at).toLocaleString("pt-BR"):"")+"</small></div></div><span class='badge'>"+esc(order.status||"novo")+"</span></div><div class='meta'><div><small>Cliente</small>"+esc(buyer.name||"—")+"</div><div><small>WhatsApp</small>"+esc(buyer.phone||"—")+"</div><div><small>CEP de entrega</small>"+esc(buyer.cep||"—")+"</div></div><p><small>Endereço de entrega</small>"+esc(buyer.address||"—")+"</p>"+items.map((item)=>"<div class='item'><span>"+esc((item.quantity||1)+"× "+(item.name||"Produto"))+"</span><b>"+money((item.price||0)*(item.quantity||1))+"</b></div>").join("")+"<div class='totals'><span>Produtos: <b>"+money(order.total_products)+"</b></span><span>Frete: <b>"+money(freight.price)+"</b></span><strong>Total: "+money(order.grand_total)+"</strong></div><div class='order-actions'><select data-status='"+esc(order.id)+"'>"+options+"</select><button class='print-btn' data-print='"+esc(order.id)+"'>🖨 Imprimir pedido</button><button class='label-btn' data-label='"+esc(order.id)+"'>🏷 Imprimir etiqueta</button></div></article>";
 }).join("");
}

async function loadOrders(){
 const refresh=$("#refresh");
 if(refresh){refresh.disabled=true;refresh.classList.add("is-loading");refresh.textContent="↻ Atualizando...";}
 try{
  const data=await api("GET");
  orders=Array.isArray(data)?data:(Array.isArray(data.orders)?data.orders:[]);
  render(orders);
  updateDeleteControls();
  const msg=$("#loginMsg");
  if(msg) msg.textContent="";
 }catch(error){
  const summary=$("#summary");
  if(summary) summary.textContent="Erro ao consultar pedidos";
  const msg=$("#loginMsg");
  if(msg) msg.textContent="Acesso aceito, mas não foi possível carregar os pedidos: "+error.message;
 }finally{
  if(refresh){refresh.disabled=false;refresh.classList.remove("is-loading");refresh.textContent="↻ Atualizar";}
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
 $("#selectAllOrders")?.addEventListener("change",event=>{document.querySelectorAll("[data-order-select]").forEach(x=>x.checked=event.target.checked);updateDeleteControls();});
 $("#deleteSelected")?.addEventListener("click",async()=>{const ids=[...document.querySelectorAll("[data-order-select]:checked")].map(x=>x.value);if(!ids.length)return;const ok=confirm(ids.length===1?"Excluir este pedido permanentemente?":"Excluir os "+ids.length+" pedidos selecionados permanentemente?");if(!ok)return;const btn=$("#deleteSelected");if(btn){btn.disabled=true;btn.textContent="🗑 Excluindo..."}try{await Promise.all(ids.map(id=>api("DELETE",{id})));await loadOrders();}catch(error){alert("Não foi possível excluir todos os pedidos: "+error.message);await loadOrders();}finally{if(btn)btn.innerHTML="🗑 Excluir selecionados <span id=\"selectedCount\">0</span>";updateDeleteControls();}});

 logoutButton?.addEventListener("click",logout);
document.querySelectorAll(".panel-tab").forEach(tab=>tab.addEventListener("click",()=>{
  const target=tab.dataset.panel;
  document.querySelectorAll(".panel-tab").forEach(x=>x.classList.toggle("active",x===tab));
  document.querySelectorAll(".admin-panel").forEach(panel=>panel.classList.toggle("active",panel.id==="panel-overview"?target==="overview":panel.dataset.panelSection===target));
  const title=$("#topTitle");
  if(title) title.textContent={overview:"Resumo",finance:"Financeiro",accounting:"Contabilidade",orders:"Pedidos"}[target]||"Painel";
}));
 const month=$("#accountingMonth");if(month){month.value=accountingMonth();month.addEventListener("change",()=>updateAccounting(orders))}
 $("#addExpense")?.addEventListener("click",()=>{
  const desc=($("#expenseDesc")?.value||"").trim(),value=Number($("#expenseValue")?.value||0);
  if(!desc||value<=0){alert("Informe descrição e valor.");return}
  const d=accountingData();d.expenses=Array.isArray(d.expenses)?d.expenses:[];d.expenses.push({id:"EXP-"+Date.now(),desc,value,month:accountingMonth()});saveAccountingData(d);
  if($("#expenseDesc"))$("#expenseDesc").value="";if($("#expenseValue"))$("#expenseValue").value="";updateAccounting(orders);
 });

 document.addEventListener("change",async(event)=>{
  const cost=event.target?.dataset?.cost;
  if(cost){const d=accountingData();d.costs=d.costs||{};const v=Number(event.target.value||0);if(v>0)d.costs[cost]=v;else delete d.costs[cost];saveAccountingData(d);updateAccounting(orders);return}
  const id=event.target?.dataset?.status;
  if(!id)return;
  try{await api("POST",{id,status:event.target.value});await loadOrders();}
  catch(error){alert(error.message);}
 });

 document.addEventListener("change",(event)=>{if(event.target?.matches("[data-order-select]")){updateDeleteControls();}});

 document.addEventListener("click",(event)=>{
  const expense=event.target?.dataset?.expense;
  if(expense){const d=accountingData();d.expenses=(d.expenses||[]).filter(x=>x.id!==expense);saveAccountingData(d);updateAccounting(orders);return}
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