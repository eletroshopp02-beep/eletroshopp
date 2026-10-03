(function(){
  const CART_KEY='eletroshopp_cart_v2';
  const getProducts=()=>{try{return products||[]}catch(e){return []}};
  const loadSaved=()=>{
    try{
      const saved=JSON.parse(localStorage.getItem(CART_KEY)||'[]');
      const list=getProducts();
      return saved.map(s=>{const p=list.find(x=>String(x.code)===String(s.code));return p?Object.assign({},p,{_qty:Math.max(1,Number(s.qty)||1}):null}).filter(Boolean);
    }catch(e){return []}
  };
  const persist=()=>{
    try{localStorage.setItem(CART_KEY,JSON.stringify(cart.map(p=>({code:p.code,qty:p._qty||1})))}catch(e){}
  };
  const sync=()=>{
    try{cart=Array.isArray(cart)?cart:loadSaved()}catch(e){}
    try{persist()}catch(e){}
    if(typeof window.updateEletroCart==='function')window.updateEletroCart();
  };
  try{
    const saved=loadSaved();
    if(saved.length){cart=saved;}
  }catch(e){console.warn('Carrinho salvo',e)}
  const originalUpdate=window.updateEletroCart;
  window.updateEletroCart=function(){
    try{
      const n=cart.reduce((s,p)=>s+(Number(p._qty)||1),0);
      const c=document.getElementById('cartFloatCount'); if(c)c.textContent=n;
      const top=document.getElementById('cart'); if(top)top.textContent='🛒 Carrinho ('+n+')';
      const box=document.getElementById('eletroCartItems'), totalEl=document.getElementById('eletroCartTotal');
      if(!box||!totalEl)return;
      if(!cart.length){box.innerHTML='<div class="emptycart">Seu carrinho está vazio.<br>Adicione produtos para continuar.</div>';totalEl.textContent='Total dos produtos: R$ 0,00';return;}
      box.innerHTML=cart.map((p,i)=>'<div class="cart-line"><img src="'+String(p.image||'')+'" alt=""><div class="cart-product-info"><b>'+String(p.name||'')+'</b><div style="color:#2196f3;font-weight:900">'+String(p.sale||'')+'</div></div><div class="qty"><button type="button" onclick="changeEletroQty('+i+',-1)">−</button><b>'+(p._qty||1)+'</b><button type="button" onclick="changeEletroQty('+i+',1)">+</button></div><button class="remove-item" title="Excluir produto" onclick="removeEletroCartItem('+i+')">🗑️</button></div>').join('');
      const total=cart.reduce((s,p)=>s+eprice(p)*(p._qty||1),0);
      totalEl.textContent='Total dos produtos: '+total.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
      if(typeof updateWeightLabel==='function')updateWeightLabel();
    }catch(e){console.error('Carrinho:',e)}
  };
  window.add=function(code){
    const p=getProducts().find(x=>String(x.code)===String(code));
    if(!p||p.soldout)return;
    const item=cart.find(x=>String(x.code)===String(code));
    if(item)item._qty=(Number(item._qty)||1)+1;
    else cart.push(Object.assign({},p,{_qty:1}));
    persist();window.updateEletroCart();
  };
  window.addQuantityToCart=function(code,qty){for(let i=0;i<Math.max(1,Number(qty)||1);i++)window.add(code)};
  window.changeEletroQty=function(i,d){
    if(!cart[i])return;
    cart[i]._qty=(Number(cart[i]._qty)||1)+Number(d||0);
    if(cart[i]._qty<=0)cart.splice(i,1);
    persist();if(typeof invalidateFreight==='function')invalidateFreight();window.updateEletroCart();
  };
  window.removeEletroCartItem=function(i){
    if(!cart[i])return;cart.splice(i,1);persist();if(typeof invalidateFreight==='function')invalidateFreight();window.updateEletroCart();
  };
  window.clearEletroCart=function(){
    cart=[];try{localStorage.removeItem(CART_KEY)}catch(e){}
    if(typeof selectedFreight!=='undefined')selectedFreight=null;
    if(typeof invalidateFreight==='function')invalidateFreight();
    window.updateEletroCart();
  };
  window.openEletroCart=function(){
    window.updateEletroCart();
    const el=document.getElementById('eletroCart');if(el)el.classList.add('open');
  };
  window.closeEletroCart=function(){const el=document.getElementById('eletroCart');if(el)el.classList.remove('open')};
  const btn=document.getElementById('cart');if(btn)btn.onclick=()=>window.openEletroCart();
  const float=document.getElementById('cartFloat');if(float)float.onclick=()=>window.openEletroCart();
  window.updateEletroCart();
})();