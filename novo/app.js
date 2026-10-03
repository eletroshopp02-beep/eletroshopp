import { products } from "./data/products.js";

const state={items:JSON.parse(localStorage.getItem("eletroshopp-cart")||"[]")};
const $=s=>document.querySelector(s);
const money=v=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v);

function save(){localStorage.setItem("eletroshopp-cart",JSON.stringify(state.items));renderCart();}
function categories(){return [...new Set(products.map(p=>p.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR"));}
function renderCategories(){const el=$("#category");categories().forEach(c=>el.insertAdjacentHTML("beforeend",`<option value="${c}">${c}</option>`));}
function filtered(){const q=$("#search").value.trim().toLowerCase(),c=$("#category").value;return products.filter(p=>(!q||p.name.toLowerCase().includes(q)||p.description?.toLowerCase().includes(q))&&(!c||p.category===c));}
function render(){const list=filtered();$("#status").textContent=list.length?`${list.length} produto(s)`:"Nenhum produto encontrado";$("#products").innerHTML=list.map(p=>`<article class="card"><img src="${p.image||""}" alt="${p.name}" loading="lazy"><div class="card-body"><h3>${p.name}</h3><div class="price">${money(p.price)}</div><button data-add="${p.id}" type="button">Adicionar ao carrinho</button></div></article>`).join("");}
function renderCart(){const total=state.items.reduce((s,i)=>s+i.price*i.qty,0);$("#cartCount").textContent=state.items.reduce((s,i)=>s+i.qty,0);$("#cartTotal").textContent=money(total);$("#cartItems").innerHTML=state.items.length?state.items.map(i=>`<div style="display:flex;justify-content:space-between;gap:8px;padding:10px 0;border-bottom:1px solid #eee"><span>${i.name} × ${i.qty}</span><strong>${money(i.price*i.qty)}</strong></div>`).join(""):"<p>Seu carrinho está vazio.</p>";}
document.addEventListener("click",e=>{const id=e.target.dataset.add;if(id){const p=products.find(x=>x.id===id);const item=state.items.find(x=>x.id===id);item?item.qty++:state.items.push({...p,qty:1});save();}if(e.target.closest("#cartButton")){$("#cartPanel").classList.add("open");$("#backdrop").classList.add("show");}if(e.target.closest("#closeCart")||e.target.id==="backdrop"){$("#cartPanel").classList.remove("open");$("#backdrop").classList.remove("show");}});
$("#search").addEventListener("input",render);$("#category").addEventListener("change",render);$("#checkout").addEventListener("click",()=>alert("Checkout será conectado ao endereço, frete, pedido e WhatsApp na próxima etapa."));
renderCategories();render();renderCart();
