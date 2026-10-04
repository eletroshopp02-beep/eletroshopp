import { products } from "./data/store-products.js?v=20261004-images2";

window.ELETRO_PRODUCTS = products;

async function start(){
  try{
    await import("./app.js?v=20261004-ui15");
  }catch(err){
    console.error("Eletroshopp boot:", err);
    const key="esh-clean-cart";
    const find=(id)=>products.find(p=>String(p.id||p.code||p.name)===String(id));
    const normalize=(p)=>({id:String(p.id||p.code||p.name),name:p.name||"Produto",price:Number(p.price||0),image:p.image||"",category:p.category||"Eletrônicos"});
    let items=[];
    try{items=JSON.parse(localStorage.getItem(key)||"[]").map(i=>{const p=find(i.id||i.code);return p?{...normalize(p),qty:Math.max(1,Number(i.qty)||1)}:null}).filter(Boolean)}catch{}
    const save=()=>localStorage.setItem(key,JSON.stringify(items.map(i=>({id:i.id,qty:i.qty}))));
    const render=()=>{
      const count=items.reduce((s,i)=>s+i.qty,0);
      const total=items.reduce((s,i)=>s+i.price*i.qty,0);
      const cc=document.querySelector("#cartCount"),ct=document.querySelector("#cartTotal"),ci=document.querySelector("#cartItems");
      if(cc)cc.textContent=count;
      if(ct)ct.textContent=total.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
      if(ci)ci.innerHTML=items.length?items.map((i,n)=>'<div class="cart-line"><div><b>'+i.name+'</b><small>'+i.price.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})+'</small></div><div class="qty"><button data-minus="'+n+'">−</button> '+i.qty+' <button data-plus="'+n+'">+</button></div><button data-remove="'+n+'">🗑️</button></div>').join(""):'<div class="empty">Seu carrinho está vazio.</div>';
    };
    const open=()=>{render();document.querySelector("#cartPanel")?.classList.add("open");document.querySelector("#backdrop")?.classList.add("show")};
    document.addEventListener("click",e=>{
      const add=e.target.closest("[data-add]");
      if(add){const p=find(add.dataset.add);if(!p)return;const i=items.find(x=>x.id===String(p.id||p.code||p.name));i?i.qty++:items.push({...normalize(p),qty:1});save();render();return}
      const m=e.target.closest("[data-minus]");if(m){if(--items[+m.dataset.minus].qty<=0)items.splice(+m.dataset.minus,1);save();render();return}
      const pl=e.target.closest("[data-plus]");if(pl){items[+pl.dataset.plus].qty++;save();render();return}
      const rm=e.target.closest("[data-remove]");if(rm){items.splice(+rm.dataset.remove,1);save();render();return}
      if(e.target.closest("#cartButton")||e.target.closest("#heroCart"))open();
      if(e.target.closest("#closeCart")||e.target.id==="backdrop"){document.querySelector("#cartPanel")?.classList.remove("open");document.querySelector("#backdrop")?.classList.remove("show")}
    });
    render();
  }
}
start();