(() => {
  "use strict";

  const SUPABASE_URL = "https://sybxbyaywznbwipbssso.supabase.co";
  const SUPABASE_KEY = "sb_publishable_3iXGUzzTaypiGou7K7UFEw_OW1qKljR";
  const ORIGIN_CEP = "84261000";
  const WHATSAPP = "5542999999999";

  const $ = (selector) => document.querySelector(selector);
  const money = (value) => new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(value) || 0);

  const escapeHtml = (value) => String(value == null ? "" : value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));

  const fallbackImage = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><rect width="600" height="600" rx="40" fill="#111522"/><path d="M330 90 190 330h105l-25 180 140-245H305z" fill="#ff2442"/></svg>'
  );

  const products = (Array.isArray(window.ELETRO_PRODUCTS) ? window.ELETRO_PRODUCTS : []).map((item, index) => ({
    id: String(item.id == null ? index : item.id),
    name: item.name || "Produto",
    description: item.description || "Produto Eletroshopp.",
    price: Number(item.price) || 0,
    category: item.category || "Outros",
    brand: item.brand || item.marca || item.category || "Eletroshopp",
    image: item.image || fallbackImage
  }));

  let cart = [];
  try {
    cart = JSON.parse(localStorage.getItem("eletroshopp-cart") || "[]");
  } catch (_) {
    cart = [];
  }

  let state = { search: "", category: "", brand: "", sort: "relevance" };

  function saveCart() {
    localStorage.setItem("eletroshopp-cart", JSON.stringify(cart));
    renderCartBadge();
    renderCart();
  }

  function cartCount() {
    return cart.reduce((sum, item) => sum + (Number(item.qty) || 1), 0);
  }

  function cartTotal() {
    return cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 1), 0);
  }

  function showToast(message) {
    let toast = $("#toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    window.setTimeout(() => toast.classList.remove("show"), 1800);
  }

  function addToCart(id) {
    const product = products.find((item) => item.id === String(id));
    if (!product) {
      showToast("Produto não encontrado");
      return;
    }

    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      existing.qty = (Number(existing.qty) || 1) + 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        qty: 1
      });
    }

    saveCart();
    openDrawer("#cart");
    showToast("Produto adicionado ao carrinho");
  }

  function changeQuantity(id, delta) {
    const item = cart.find((entry) => entry.id === String(id));
    if (!item) return;

    item.qty = (Number(item.qty) || 1) + delta;
    if (item.qty <= 0) {
      cart = cart.filter((entry) => entry !== item);
    }
    saveCart();
  }

  function filteredProducts() {
    const query = state.search.trim().toLowerCase();

    const result = products.filter((product) => {
      const matchesCategory = !state.category || product.category === state.category;
      const matchesBrand = !state.brand || product.brand === state.brand;
      const haystack = [
        product.name,
        product.description,
        product.category,
        product.brand
      ].join(" ").toLowerCase();
      const matchesSearch = !query || haystack.includes(query);
      return matchesCategory && matchesBrand && matchesSearch;
    });

    if (state.sort === "priceAsc") result.sort((a, b) => a.price - b.price);
    if (state.sort === "priceDesc") result.sort((a, b) => b.price - a.price);

    return result;
  }

  function productCard(product) {
    return [
      '<article class="product-card">',
      '<div class="product-img">',
      '<img loading="lazy" src="', product.image, '" alt="', escapeHtml(product.name), '" onerror="this.src=\'', fallbackImage, '\'">',
      '</div>',
      '<div class="product-info">',
      '<span class="eyebrow">', escapeHtml(product.category), "</span>",
      "<h3>", escapeHtml(product.name), "</h3>",
      "<p>", escapeHtml(product.description), "</p>",
      "<strong>", money(product.price), "</strong>",
      '<button class="add" type="button" data-add="', escapeHtml(product.id), '">Adicionar ao carrinho</button>',
      "</div>",
      "</article>"
    ].join("");
  }

  function renderProducts() {
    const list = filteredProducts();
    $("#products").innerHTML = list.length
      ? list.map(productCard).join("")
      : '<div class="empty">Nenhum produto encontrado.</div>';
    $("#count").textContent = list.length + " produtos encontrados";
  }

  function renderFeatured() {
    $("#featured").innerHTML = products.slice(0, 8).map(productCard).join("");
  }

  function renderFilters() {
    const categories = [...new Set(products.map((item) => item.category).filter(Boolean))].sort();
    const brands = [...new Set(products.map((item) => item.brand).filter(Boolean))].sort();

    $("#cats").innerHTML =
      '<button type="button" class="chip ' + (!state.category ? "active" : "") + '" data-category="">Todos</button>' +
      categories.map((item) =>
        '<button type="button" class="chip ' + (state.category === item ? "active" : "") +
        '" data-category="' + escapeHtml(item) + '">' + escapeHtml(item) + "</button>"
      ).join("");

    $("#brands").innerHTML =
      '<button type="button" class="chip ' + (!state.brand ? "active" : "") + '" data-brand="">Todas</button>' +
      brands.map((item) =>
        '<button type="button" class="chip ' + (state.brand === item ? "active" : "") +
        '" data-brand="' + escapeHtml(item) + '">' + escapeHtml(item) + "</button>"
      ).join("");
  }

  function renderCartBadge() {
    $("#cartCount").textContent = String(cartCount());
  }

  function renderCart() {
    const container = $("#cartItems");

    if (!cart.length) {
      container.innerHTML = '<div class="empty">Seu carrinho está vazio.</div>';
    } else {
      container.innerHTML = cart.map((item) => [
        '<div class="cart-row">',
        '<img src="', item.image || fallbackImage, '" alt="">',
        "<div>",
        "<b>", escapeHtml(item.name), "</b>",
        "<small>", money(item.price), "</small>",
        '<div class="qty">',
        '<button type="button" data-minus="', escapeHtml(item.id), '">−</button>',
        "<span>", String(item.qty), "</span>",
        '<button type="button" data-plus="', escapeHtml(item.id), '">+</button>',
        '<button type="button" class="remove" data-remove="', escapeHtml(item.id), '">Excluir</button>',
        "</div></div></div>"
      ].join("")).join("");
    }

    $("#cartTotal").textContent = money(cartTotal());
  }

  function openDrawer(id) {
    $(id).classList.add("open");
    document.body.classList.add("locked");
  }

  function closeDrawer(id) {
    $(id).classList.remove("open");
    if (!document.querySelector(".drawer.open")) {
      document.body.classList.remove("locked");
    }
  }

  function openCheckout() {
    if (!cart.length) {
      showToast("Adicione produtos primeiro");
      return;
    }

    $("#orderSummary").innerHTML = cart.map((item) =>
      "<div>" + item.qty + "× " + escapeHtml(item.name) +
      " <b>" + money(item.price * item.qty) + "</b></div>"
    ).join("");

    $("#orderSubtotal").textContent = money(cartTotal());
    closeDrawer("#cart");
    openDrawer("#checkout");
  }

  async function calculateFreight() {
    const cep = ($("#cep").value || "").replace(/\D/g, "");

    if (cep.length !== 8) {
      showToast("Digite um CEP válido");
      return;
    }

    $("#freight").innerHTML = '<span class="loading">Calculando frete…</span>';

    try {
      const response = await fetch(
        SUPABASE_URL + "/functions/v1/frenet-quote",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + SUPABASE_KEY
          },
          body: JSON.stringify({
            fromPostalCode: ORIGIN_CEP,
            toPostalCode: cep,
            items: cart.map((item) => ({
              sku: item.id,
              quantity: item.qty,
              price: item.price,
              weight: 1,
              width: 15,
              height: 10,
              length: 20
            }))
          })
        }
      );

      const data = await response.json();

      if (!response.ok || !Array.isArray(data.quotes) || !data.quotes.length) {
        throw new Error(data.error || "Frete indisponível");
      }

      $("#freight").innerHTML = data.quotes.slice(0, 4).map((quote, index) => [
        '<label class="freight-option">',
        '<input type="radio" name="shipping" value="', escapeHtml(JSON.stringify(quote)), '" ', index === 0 ? "checked" : "", ">",
        "<span><b>", escapeHtml(quote.name || quote.company || "Entrega"), "</b>",
        "<small>", escapeHtml(quote.days || ""), " dias</small></span>",
        "<strong>", money(quote.price), "</strong>",
        "</label>"
      ].join("")).join("");
    } catch (error) {
      $("#freight").innerHTML = '<div class="freight-error">' + escapeHtml(error.message) + "</div>";
    }
  }

  async function finishOrder() {
    const name = $("#buyerName").value.trim();
    const phone = $("#buyerPhone").value.trim();
    const cep = ($("#cep").value || "").replace(/\D/g, "");
    const address = $("#buyerAddress").value.trim();
    const shippingInput = document.querySelector('input[name="shipping"]:checked');

    if (!name || !phone || cep.length !== 8 || !address || !shippingInput) {
      showToast("Preencha os dados e calcule o frete");
      return;
    }

    const shipping = JSON.parse(shippingInput.value);
    const order = {
      id: "ESH-" + Date.now(),
      customer: { name, phone, cep, address },
      items: cart.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.qty
      })),
      subtotal: cartTotal(),
      freight: shipping,
      total: cartTotal() + Number(shipping.price || 0),
      created_at: new Date().toISOString()
    };

    const button = $("#finish");
    button.disabled = true;
    button.textContent = "Enviando pedido…";

    try {
      const response = await fetch(
        SUPABASE_URL + "/functions/v1/create-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + SUPABASE_KEY
          },
          body: JSON.stringify(order)
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível registrar o pedido");
      }

      const lines = order.items.map((item) =>
        item.quantity + "x " + item.name + " - " + money(item.price * item.quantity)
      );

      const message = [
        "Olá! Quero fazer este pedido na Eletroshopp.",
        "Pedido: " + order.id,
        "Cliente: " + name,
        "Total: " + money(order.total),
        "",
        lines.join("\n")
      ].join("\n");

      cart = [];
      saveCart();
      window.location.href = "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(message);
    } catch (error) {
      showToast(error.message);
      button.disabled = false;
      button.textContent = "Finalizar pedido";
    }
  }

  document.addEventListener("click", (event) => {
    const target = event.target.closest("button");
    if (!target) return;

    if (target.dataset.add) addToCart(target.dataset.add);
    else if (target.dataset.category !== undefined) {
      state.category = target.dataset.category;
      renderFilters();
      renderProducts();
    }
    else if (target.dataset.brand !== undefined) {
      state.brand = target.dataset.brand;
      renderFilters();
      renderProducts();
    }
    else if (target.dataset.minus) changeQuantity(target.dataset.minus, -1);
    else if (target.dataset.plus) changeQuantity(target.dataset.plus, 1);
    else if (target.dataset.remove) {
      cart = cart.filter((item) => item.id !== target.dataset.remove);
      saveCart();
    }
    else if (target.dataset.openCart !== undefined) openDrawer("#cart");
    else if (target.dataset.closeCart !== undefined) closeDrawer("#cart");
    else if (target.dataset.checkout !== undefined) openCheckout();
    else if (target.dataset.closeCheckout !== undefined) closeDrawer("#checkout");
    else if (target.dataset.freight !== undefined) calculateFreight();
    else if (target.dataset.finish !== undefined) finishOrder();
  });

  $("#search").addEventListener("input", (event) => {
    state.search = event.target.value;
    renderProducts();
  });

  $("#sort").addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderProducts();
  });

  if (!products.length) {
    $("#products").innerHTML = '<div class="empty">Catálogo temporariamente indisponível.</div>';
  } else {
    renderFilters();
    renderFeatured();
    renderProducts();
  }

  renderCart();
  renderCartBadge();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
  }
})();