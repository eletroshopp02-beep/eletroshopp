(function(){
  "use strict";
  if(window.__ESH_CART_FIX_V12)return;
  window.__ESH_CART_FIX_V12=true;

  const KEY="eletro_cart_v2";
  const LEGACY_KEY="eletroshopp_cart_v2";

  function getProducts(){
    try{return Array.isArray(products)?products:[]}catch(e){return []}
  }
  function qty(v){return Math.max(1,Math.min(99,Number(v)||1))}
  function money(v){return (Number(v)||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}
  function price(p){
    const raw=String(p&&p.sale||"").trim().replace(/[^0-9,.-]/g,"");
    const normalized=raw.includes(",")?raw.replace(/\./g,"").replace(",","."):raw;
    return Number.parseFloat(normalized)||0;
  }
  function save(){
    try{
      localStorage.setItem(KEY,JSON.stringify(cart));
      localStorage.setItem(LEGACY_KEY,JSON.stringify(cart.map(p=>({code:p.code,qty:qty(p._qty)}))));
    }catch(e){}
  }
  function load(){
    let raw=[];
    try{
      raw=JSON.parse(localStorage.getItem(KEY)||"[]");
      if(!Array.isArray(raw)||!raw.length)raw=JSON.parse(localStorage.getItem(LEGACY_KEY)||"[]");
    }catch(e){raw=[]}
    const list=getProducts();
    return raw.map(item=>{
      const code=String(item&&item.code||"");
      const p=list.find(x=>String(x.code)===code);
      return p?Object.assign({},p,{_qty:qty(item._qty??item.qty)}):null;
    }).filter(Boolean);
  }
  function setCount(n){
    const top=document.getElementById("cart");
    const floating=document.getElementById("cartFloatCount");
    if(top)top.textContent="🛒 Carrinho ("+n+")";
    if(floating)floating.textContent=String(n);
  }
  function render(){
    try{
      const n=cart.reduce((sum,p)=>sum+qty(p._qty),0);
      setCount(n);
      const box=document.getElementById("eletroCartItems");
      const totalEl=document.getElementById("eletroCartTotal");
      if(!box||!totalEl)return;
      if(!cart.length){
        box.innerHTML='<div class="emptycart">Seu carrinho está vazio.<br>Adicione produtos para continuar.</div>';
        totalEl.textContent="Total dos produtos: R$ 0,00";
        return;
      }
      box.innerHTML=cart.map((p,i)=>'<div class="cart-line"><img src="'+String(p.image||"")+'" alt=""><div class="cart-product-info"><b>'+String(p.name||"")+'</b><div class="esh-cart-price">'+String(p.sale||"")+'</div></div><div class="qty"><button type="button" data-esh-qty="'+i+'|−">−</button><b>'+qty(p._qty)+'</b><button type="button" data-esh-qty="'+i+'|+">+</button></div><button type="button" class="remove-item" data-esh-remove="'+i+'" title="Excluir produto">🗑️</button></div>').join("");
      totalEl.textContent="Total dos produtos: "+money(cart.reduce((sum,p)=>sum+price(p)*qty(p._qty),0));
      if(typeof updateWeightLabel==="function")try{updateWeightLabel()}catch(_){}
    }catch(e){console.error("Eletroshopp carrinho",e)}
  }
  function add(code,amount){
    const key=String(code||"");
    const p=getProducts().find(x=>String(x.code)===key);
    if(!p||p.soldout)return false;
    const q=Math.max(1,Math.min(99,Number(amount)||1));
    const item=cart.find(x=>String(x.code)===key);
    if(item)item._qty=Math.min(99,qty(item._qty)+q);
    else cart.push(Object.assign({},p,{_qty:q}));
    save();render();
    return true;
  }
  function toast(){
    try{if(typeof showEletroToast==="function")showEletroToast("Produto adicionado ao carrinho!")}catch(_){}
  }
  window.__eletroAddToCart=function(code,amount){
    const ok=add(code,amount||1);
    if(ok)toast();
    return ok;
  };
  window.add=function(code){return window.__eletroAddToCart(code,1)};
  window.addQuantityToCart=function(code,amount){return window.__eletroAddToCart(code,amount||1)};
  window.addDirectToCart=function(code){
    const ok=window.__eletroAddToCart(code,1);
    if(ok&&typeof openEletroCart==="function")openEletroCart();
    return ok;
  };
  window.addFromDetail=function(code){
    const amount=typeof getDetailQty==="function"?getDetailQty():1;
    const ok=window.__eletroAddToCart(code,amount);
    if(!ok)return false;
    try{if(typeof closeProductDetail==="function")closeProductDetail()}catch(_){}
    try{if(typeof openEletroCart==="function")openEletroCart()}catch(_){}
    return true;
  };
  window.buyNowFromDetail=function(code){return window.addFromDetail(code)};
  window.changeEletroQty=function(i,d){
    if(!cart[i])return;
    cart[i]._qty=qty(cart[i]._qty)+Number(d||0);
    if(cart[i]._qty<=0)cart.splice(i,1);
    save();render();
    try{if(typeof invalidateFreight==="function")invalidateFreight()}catch(_){}
  };
  window.removeEletroCartItem=function(i){
    if(!cart[i])return;
    cart.splice(i,1);save();render();
    try{if(typeof invalidateFreight==="function")invalidateFreight()}catch(_){}
  };
  window.clearEletroCart=function(){
    cart.length=0;
    try{localStorage.removeItem(KEY);localStorage.removeItem(LEGACY_KEY)}catch(_){}
    render();
    try{if(typeof invalidateFreight==="function")invalidateFreight()}catch(_){}
  };
  window.openEletroCart=function(){
    render();
    const el=document.getElementById("eletroCart");
    if(el)el.classList.add("open");
  };
  window.closeEletroCart=function(){
    const el=document.getElementById("eletroCart");
    if(el)el.classList.remove("open");
  };

  function codeFromElement(el){
    let n=el;
    for(let depth=0;n&&depth<10;depth++,n=n.parentElement){
      const direct=n.getAttribute&&n.getAttribute("data-code");
      if(direct)return direct;
      const onclick=n.getAttribute&&n.getAttribute("onclick")||"";
      const m=onclick.match(/(?:addDirectToCart|addFromDetail|buyNowFromDetail|addQuantityToCart|add|openProductDetail)\s*\(\s*['"]([^'"]+)['"]/i);
      if(m)return m[1];
    }
    return null;
  }

  function cepDestino(){
    const els=[...document.querySelectorAll("input")];
    const hit=els.find(x=>/cep|postal/i.test((x.id||"")+" "+(x.name||"")+" "+(x.placeholder||"")));
    if(hit)return String(hit.value||"").replace(/\\D/g,"");
    const any=els.find(x=>/^\\d{5}-?\\d{3}$/.test(String(x.value||"").trim()));
    return any?String(any.value).replace(/\\D/g,""):"";
  }

  function freightBox(){
    const direct=document.getElementById("freightResults")||document.getElementById("eletroFreightResults");
    if(direct)return direct;
    const leaf=[...document.querySelectorAll("body *")].find(x=>x.children.length===0&&/Consultando tarifas reais/i.test(x.textContent||""));
    return leaf?.parentElement||null;
  }

  function shippingProducts(){
    return cart.map((p,i)=>({
      id:p.id??p.code??i+1,
      code:p.code??"",
      name:p.name??"Produto",
      width:Number(p.width??p.largura??p.shipping_width)||8,
      height:Number(p.height??p.altura??p.shipping_height)||4,
      length:Number(p.length??p.comprimento??p.shipping_length)||20,
      weight:Number(p.weight??p.peso??p.shipping_weight)||0.30,
      value:price(p),
      quantity:qty(p._qty),
      category:p.category||"Eletrônicos"
    }));
  }

  async function realFreightQuote(){
    const box=freightBox();
    if(!cart.length){if(box)box.innerHTML='<div class="freight-error">Adicione um produto ao carrinho.</div>';return;}
    const to=cepDestino();
    if(!/^\\d{8}$/.test(to)){if(box)box.innerHTML='<div class="freight-error">Informe um CEP de destino válido.</div>';return;}
    if(box)box.innerHTML='<div class="loading">⏳ Consultando tarifas reais...</div>';
    const products=shippingProducts();
    const weight=products.reduce((s,p)=>s+p.weight*p.quantity,0);
    const payload={fromPostalCode:"84272402",toPostalCode:to,products};
    try{
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),28000);
      let response;
      try{
        response=await fetch("https://sybxbyaywznbwipbssso.supabase.co/functions/v1/frenet-quote",{
          method:"POST",
          headers:{
            "Content-Type":"application/json",
            "Accept":"application/json",
            "apikey":"sb_publishable_3iXGUzzTaypiGou7K7UFEw_OW1qKljR",
            "Authorization":"Bearer sb_publishable_3iXGUzzTaypiGou7K7UFEw_OW1qKljR"
          },
          body:JSON.stringify(payload),
          signal:controller.signal
        });
      }finally{clearTimeout(timer);}
      const raw=await response.text();
      let data;try{data=raw?JSON.parse(raw):{};}catch{data={message:raw};}
      if(!response.ok)throw new Error(data?.error||data?.message||("HTTP "+response.status));
      const opts=Array.isArray(data?.quotes)?data.quotes:[];
      if(!opts.length)throw new Error(data?.error||"Nenhuma opção de envio encontrada.");
      window.__ESH_FREIGHT_OPTIONS=opts;
      if(window.state)window.state.freight=null;
      if(box)box.innerHTML=opts.map((o,i)=>'<button type="button" class="freight-option" data-esh-freight="'+i+'"><span><b>🚚 '+(o.company?o.company+" — ":"")+(o.name||"Frete")+'</b><small>'+(o.days??"consulte")+' dias úteis</small></span><strong>'+money(o.price)+'</strong></button>').join("");
      box?.querySelectorAll("[data-esh-freight]").forEach(btn=>btn.addEventListener("click",()=>{
        const o=window.__ESH_FREIGHT_OPTIONS[Number(btn.dataset.eshFreight)];
        if(window.state)window.state.freight={id:String(o.id||o.name||"frete"),name:o.name||"Frete",company:o.company||"",price:Number(o.price),days:o.days??"",carrierCode:o.carrierCode||""};
        box.querySelectorAll("[data-esh-freight]").forEach(x=>x.classList.remove("selected"));btn.classList.add("selected");
        if(typeof updateSummary==="function")try{updateSummary()}catch(_){}
      }));
      const weightEl=[...document.querySelectorAll("*")].find(x=>/Peso estimado do pacote/i.test(x.textContent||"")&&x.children.length);
      if(weightEl)weightEl.textContent="📦 Peso estimado do pacote "+weight.toFixed(2).replace(".",",")+" kg";
    }catch(e){
      console.error("Eletroshopp Frenet",e);
      if(box)box.innerHTML='<div class="freight-error">Falha ao calcular o frete: '+String(e?.message||"erro desconhecido")+'</div>';
    }
  }

  document.addEventListener("click",function(e){
    const q=e.target.closest&&e.target.closest("[data-esh-qty]");
    if(q){
      const parts=q.getAttribute("data-esh-qty").split("|");
      e.preventDefault();e.stopPropagation();
      window.changeEletroQty(Number(parts[0]),parts[1]==="+"?1:-1);
      return;
    }
    const rm=e.target.closest&&e.target.closest("[data-esh-remove]");
    if(rm){
      e.preventDefault();e.stopPropagation();
      window.removeEletroCartItem(Number(rm.getAttribute("data-esh-remove")));
      return;
    }
    const quote=e.target.closest&&e.target.closest("#quoteFreight");
    if(quote){e.preventDefault();e.stopImmediatePropagation();realFreightQuote();return;}
    const b=e.target.closest&&e.target.closest("button");
    if(!b)return;
    const label=(b.innerText||b.textContent||"").trim().toLowerCase();
    if(!/adicionar ao carrinho|comprar agora/.test(label))return;
    const code=codeFromElement(b);
    if(!code)return;
    e.preventDefault();e.stopImmediatePropagation();
    window.__eletroAddToCart(code,1);
    try{if(typeof openEletroCart==="function")openEletroCart()}catch(_){}
  },true);

  function boot(){
    try{
      if(typeof cart==="undefined")return setTimeout(boot,100);
      const loaded=load();
      cart.length=0;
      loaded.forEach(x=>cart.push(x));
      render();
      if(typeof window.updateEletroCart==="function")try{window.updateEletroCart()}catch(_){}
    }catch(e){console.error("Eletroshopp boot",e)}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
  setTimeout(boot,500);
})();