import { escapeHtml, money, imageOf, dateTime, statusBadge } from './format.js';
import { addressForm, addressLabel } from './addressForm.js';

/** As páginas montam apenas HTML, lendo dados dos Services; sem verbos HTTP aqui. */
export function createPages(app) {
  const { state, root, services } = app;
  const refreshCart = () => app.refreshCart();
  const requireLogin = () => app.requireLogin();
function productCard(product) {
  return `<div class="col">
    <article class="card h-100 shadow-sm">
      ${imageOf(product)}
      <div class="card-body d-flex flex-column gap-2">
        <h3 class="h6 mb-0">${escapeHtml(product.name)}</h3>
        <p class="text-secondary small flex-grow-1 mb-0">${escapeHtml(String(product.description ?? '').slice(0, 110))}</p>
        <div class="d-flex justify-content-between align-items-center gap-2">
          <span class="price">${money(product.price)}</span>
          <span class="badge ${product.available ? 'badge-stock' : 'badge-out'}">${product.available ? `${product.stock} disponíveis` : 'Esgotado'}</span>
        </div>
        <a class="btn btn-outline-primary" href="#produto/${Number(product.id)}">Ver produto</a>
      </div>
    </article>
  </div>`;
}

async function catalogPage() {
  const data = await services.catalog.list(state.filters);
  const items = data.data ?? [];
  const meta = data.meta ?? {};
  const options = state.categories.map((category) =>
    `<option value="${escapeHtml(category.slug)}" ${state.filters.category === category.slug ? 'selected' : ''}>${escapeHtml(category.name)}</option>`
  ).join('');
  const page = Number(meta.current_page ?? 1);
  const pages = Number(meta.last_page ?? 1);
  root.innerHTML = `
    <section class="hero">
      <p class="text-uppercase small text-warning mb-2">Equipamentos para grandes aventuras</p>
      <h1>Taverna do D20</h1>
      <p class="lead mb-0">Dados, livros, miniaturas e acessórios para sua próxima campanha.</p>
    </section>
    <section aria-labelledby="catalog-title">
      <h2 id="catalog-title" class="section-title h3">Nosso catálogo</h2>
      <form class="row g-2 mb-4" data-form="filters">
        <div class="col-12 col-md-5">
          <label class="form-label" for="search">Buscar</label>
          <input class="form-control" id="search" name="search" maxlength="100" value="${escapeHtml(state.filters.search)}" placeholder="Nome do produto">
        </div>
        <div class="col-6 col-md-3">
          <label class="form-label" for="category">Categoria</label>
          <select id="category" class="form-select" name="category">
            <option value="">Todas</option>${options}
          </select>
        </div>
        <div class="col-6 col-md-2">
          <label class="form-label" for="sort">Ordenar</label>
          <select id="sort" class="form-select" name="sort">
            ${[['recent','Recentes'],['price_asc','Menor preço'],['price_desc','Maior preço']]
              .map(([key,label])=>`<option value="${key}" ${state.filters.sort === key ? 'selected':''}>${label}</option>`).join('')}
          </select>
        </div>
        <div class="col-12 col-md-2 d-grid align-self-end"><button class="btn btn-primary">Filtrar</button></div>
      </form>
      ${items.length ? `<div class="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-4 g-3">${items.map(productCard).join('')}</div>` : '<p>Nenhum produto encontrado.</p>'}
      <div class="d-flex gap-2 align-items-center justify-content-center mt-4">
        <button class="btn btn-outline-light" data-page="${page-1}" ${page<=1?'disabled':''}>Anterior</button>
        <span>Página ${page} de ${pages}</span>
        <button class="btn btn-outline-light" data-page="${page+1}" ${page>=pages?'disabled':''}>Próxima</button>
      </div>
    </section>`;
}

async function productPage(id) {
  const data = await services.catalog.get(id);
  const p = data.data;
  root.innerHTML = `
    <div class="mb-3"><a href="#catalogo">← Voltar ao catálogo</a></div>
    <div class="row g-4 align-items-start">
      <div class="col-lg-5">${imageOf(p, 'product-photo')}</div>
      <div class="col-lg-7">
        <h1>${escapeHtml(p.name)}</h1>
        <p class="text-secondary">${escapeHtml(p.category?.name ?? '')}</p>
        <p class="price fs-2">${money(p.price)}</p>
        <p>${escapeHtml(p.description)}</p>
        <p class="badge ${p.available ? 'badge-stock' : 'badge-out'}">${p.available ? `Em estoque: ${p.stock}` : 'Indisponível'}</p>
        ${p.available ? `<form class="d-flex gap-2 flex-wrap mt-3" data-form="add-product" data-id="${Number(p.id)}">
          <label class="align-self-center" for="qty">Quantidade</label>
          <input class="form-control cart-qty" id="qty" name="quantity" type="number" min="1" max="${Number(p.stock)}" value="1" required>
          <button class="btn btn-primary">Adicionar ao carrinho</button>
        </form>` : ''}
      </div>
    </div>`;
}

async function cartPage() {
  const cart = await refreshCart();
  const items = cart.items ?? [];
  const invalid = items.some((item) => !item.available);
  root.innerHTML = `<h1 class="h2 section-title">Seu carrinho</h1>
    ${items.length ? `
      <div class="row g-4">
        <div class="col-lg-8">
          <div class="list-group">
            ${items.map((item) => `<div class="list-group-item p-3">
              <div class="d-flex flex-wrap justify-content-between gap-3">
                <div class="flex-grow-1">
                  <h2 class="h6"><a href="#produto/${Number(item.product_id)}">${escapeHtml(item.name ?? `Produto ${item.product_id}`)}</a></h2>
                  <p class="small text-secondary mb-2">Unidade: ${money(item.unit_price)} · Estoque: ${Number(item.stock)}</p>
                  ${item.available ? '' : '<span class="badge badge-out mb-2">Indisponível — ajuste ou remova</span>'}
                  <form class="d-flex gap-2 align-items-center" data-form="cart-quantity" data-id="${Number(item.id)}">
                    <label class="visually-hidden" for="qty-${Number(item.id)}">Quantidade</label>
                    <input class="form-control cart-qty" type="number" id="qty-${Number(item.id)}" name="quantity" min="0" value="${Number(item.quantity)}" required>
                    <button class="btn btn-sm btn-outline-primary">Atualizar</button>
                    <button class="btn btn-sm btn-outline-danger" type="button" data-action="remove-item" data-id="${Number(item.id)}">Remover</button>
                  </form>
                </div>
                <strong class="line-price">${money(item.subtotal)}</strong>
              </div>
            </div>`).join('')}
          </div>
        </div>
        <div class="col-lg-4"><div class="panel p-4 rounded-3">
          <h2 class="h5">Resumo</h2>
          <p>${Number(cart.items_count)} item(ns)</p>
          <p class="d-flex justify-content-between"><span>Subtotal</span><strong>${money(cart.total)}</strong></p>
          <p class="text-secondary small">Frete grátis nesta versão acadêmica.</p>
          <a class="btn btn-primary w-100 ${invalid ? 'disabled' : ''}" ${invalid ? 'aria-disabled="true"' : 'href="#checkout"'}>Finalizar compra</a>
          ${invalid ? '<p class="small text-warning mt-2">Corrija os itens indisponíveis antes do checkout.</p>' : ''}
        </div></div>
      </div>` : '<div class="panel rounded p-4"><p>Seu carrinho está vazio.</p><a class="btn btn-primary" href="#catalogo">Explorar produtos</a></div>'}`;
}

async function checkoutPage() {
  if (!requireLogin()) return;
  const [cart, addressResponse] = await Promise.all([
    refreshCart(), services.addresses.list(),
  ]);
  const addresses = addressResponse.data ?? [];
  if (!cart.items?.length) {
    root.innerHTML = '<h1>Checkout</h1><p>Seu carrinho está vazio.</p><a href="#catalogo">Voltar ao catálogo</a>';
    return;
  }
  const unavailable = cart.items.some((item) => !item.available);
  root.innerHTML = `
    <h1 class="h2 section-title">Finalizar pedido</h1>
    <div class="row g-4">
      <section class="col-lg-7">
        <div class="panel p-4 rounded-3 mb-3">
          <h2 class="h5">Endereço de entrega</h2>
          ${addresses.length ? `<form data-form="checkout" class="mb-0">
            <label for="address" class="form-label">Selecione um endereço</label>
            <select class="form-select mb-3" name="address_id" id="address" required>
              ${addresses.map((a) => `<option value="${Number(a.id)}" ${state.selectedAddress === a.id ? 'selected' : ''}>${addressLabel(a)}</option>`).join('')}
            </select>
            <button class="btn btn-primary" ${unavailable?'disabled':''}>Confirmar pedido — ${money(cart.total)}</button>
          </form>` : '<p>Cadastre um endereço antes de confirmar.</p>'}
          ${unavailable ? '<p class="text-warning mt-2">Há itens sem estoque. Ajuste o carrinho primeiro.</p>' : ''}
        </div>
        <div class="panel p-4 rounded-3">
          <h2 class="h5">Novo endereço</h2>
          ${addressForm()}
        </div>
      </section>
      <aside class="col-lg-5"><div class="panel rounded-3 p-4">
        <h2 class="h5">Revisão</h2>
        ${cart.items.map((item) => `<p class="d-flex gap-2 justify-content-between"><span>${escapeHtml(item.name)} × ${Number(item.quantity)}</span><strong>${money(item.subtotal)}</strong></p>`).join('')}
        <hr><p class="d-flex justify-content-between"><span>Frete</span><strong>Grátis</strong></p>
        <p class="d-flex justify-content-between price"><span>Total estimado</span><strong>${money(cart.total)}</strong></p>
        <p class="small text-secondary">Preço e estoque serão recalculados na confirmação pela API.</p>
      </div></aside>
    </div>`;
}

async function ordersPage() {
  if (!requireLogin()) return;
  const data = await services.orders.list(state.orderPage);
  const orders = data.data ?? [];
  const page = Number(data.meta?.current_page ?? 1);
  const pages = Number(data.meta?.last_page ?? 1);
  root.innerHTML = `<h1 class="h2 section-title">Meus pedidos</h1>
    ${orders.length ? `<div class="list-group">
      ${orders.map((o) => `<a class="list-group-item list-group-item-action p-3" href="#pedido/${Number(o.id)}">
        <div class="d-flex flex-wrap justify-content-between gap-2">
          <span><strong>Pedido #${Number(o.id)}</strong><small class="d-block text-secondary">${dateTime(o.created_at)}</small></span>
          <span>${statusBadge(o.status)}</span><strong>${money(o.total)}</strong>
        </div>
      </a>`).join('')}</div>
      <div class="d-flex gap-2 align-items-center justify-content-center mt-4">
        <button class="btn btn-outline-light" data-orders-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>Anterior</button>
        <span>Página ${page} de ${pages}</span>
        <button class="btn btn-outline-light" data-orders-page="${page + 1}" ${page >= pages ? 'disabled' : ''}>Próxima</button>
      </div>` : '<p>Você ainda não realizou nenhuma compra.</p><a href="#catalogo">Ver produtos</a>'}`;
}

async function orderPage(id) {
  if (!requireLogin()) return;
  const data = await services.orders.get(id);
  const order = data.data;
  const addr = order.shipping_address ?? {};
  root.innerHTML = `<a href="#pedidos">← Meus pedidos</a>
    <div class="d-flex flex-wrap justify-content-between gap-3 my-3">
      <h1 class="h2">Pedido #${Number(order.id)}</h1>${statusBadge(order.status)}
    </div>
    <p>Realizado em ${dateTime(order.created_at)}</p>
    <div class="row g-4">
      <div class="col-lg-7"><div class="panel rounded-3 p-4">
        <h2 class="h5">Produtos</h2>
        ${(order.items ?? []).map((item) => `<div class="d-flex justify-content-between gap-3 border-bottom py-2">
          <span>${escapeHtml(item.product_name)} — ${Number(item.quantity)} × ${money(item.unit_price)}</span>
          <strong>${money(item.subtotal)}</strong>
        </div>`).join('')}
        <div class="d-flex justify-content-between pt-3"><span>Subtotal</span><span>${money(order.subtotal)}</span></div>
        <div class="d-flex justify-content-between"><span>Frete</span><span>${money(order.shipping)}</span></div>
        <div class="d-flex justify-content-between price mt-2"><span>Total</span><strong>${money(order.total)}</strong></div>
      </div></div>
      <div class="col-lg-5"><div class="panel rounded-3 p-4">
        <h2 class="h5">Entrega</h2>
        <p>${escapeHtml(addr.recipient_name)}<br>${escapeHtml(addr.street)}, ${escapeHtml(addr.number)}<br>
          ${escapeHtml(addr.complement ?? '')}<br>${escapeHtml(addr.district)}<br>
          ${escapeHtml(addr.city)}/${escapeHtml(addr.state)} — ${escapeHtml(addr.postal_code)}</p>
        <hr><p class="small text-secondary">Pagamento: ${order.paid_at ? dateTime(order.paid_at) : 'ainda não confirmado'}</p>
        ${order.status === 'pending_payment' ? `
          <p class="small text-warning">Pagamento simulado, sem cartão ou cobrança real.</p>
          <button class="btn btn-primary w-100 mb-2" data-action="pay" data-id="${Number(order.id)}">Confirmar pagamento simulado</button>
          <button class="btn btn-outline-danger w-100" data-action="cancel-order" data-id="${Number(order.id)}">Cancelar pedido</button>` : ''}
      </div></div>
    </div>`;
}

async function profilePage() {
  if (!requireLogin()) return;
  const data = await services.addresses.list();
  const addresses = data.data ?? [];
  state.addresses = addresses;
  root.innerHTML = `<h1 class="h2 section-title">Meu perfil</h1>
    <div class="panel p-4 rounded-3 mb-4">
      <p class="mb-1"><strong>Nome:</strong> ${escapeHtml(state.user.name)}</p>
      <p class="mb-0"><strong>E-mail:</strong> ${escapeHtml(state.user.email)}</p>
    </div>
    <h2 class="h4">Meus endereços</h2>
    <div class="list-group mb-4">
      ${addresses.length ? addresses.map((a) => `<div class="list-group-item d-flex justify-content-between flex-wrap gap-2">
        <span>${addressLabel(a)}</span>
        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-outline-primary" data-action="edit-address" data-id="${Number(a.id)}">Editar</button>
          <button class="btn btn-sm btn-outline-danger" data-action="remove-address" data-id="${Number(a.id)}">Excluir</button>
        </div>
      </div>`).join('') : '<p>Nenhum endereço cadastrado.</p>'}
    </div>
    <div class="panel p-4 rounded-3"><h2 class="h5">${state.editingAddress ? "Editar endereço" : "Adicionar endereço"}</h2>
      ${addressForm(state.editingAddress)}
    </div>`;
}

function authPage(kind) {
  const isRegister = kind === 'cadastrar';
  root.innerHTML = `<div class="row justify-content-center"><div class="col-lg-6">
    <div class="panel p-4 rounded-3">
      <h1 class="h2">${isRegister ? 'Criar conta' : 'Entrar na Taverna'}</h1>
      <p class="text-secondary">Sua sessão utiliza cookies do Laravel Sanctum.</p>
      <form data-form="${isRegister ? 'register' : 'login'}">
        ${isRegister ? '<div class="mb-3"><label class="form-label">Nome<input class="form-control" name="name" required maxlength="255" autocomplete="name"></label></div>' : ''}
        <div class="mb-3"><label class="form-label">E-mail<input class="form-control" type="email" name="email" required autocomplete="email"></label></div>
        <div class="mb-3"><label class="form-label">Senha<input class="form-control" type="password" name="password" minlength="8" required autocomplete="${isRegister ? 'new-password' : 'current-password'}"></label></div>
        ${isRegister ? '<div class="mb-3"><label class="form-label">Confirmar senha<input class="form-control" type="password" name="password_confirmation" minlength="8" required autocomplete="new-password"></label></div>' : ''}
        <button class="btn btn-primary w-100">${isRegister ? 'Cadastrar' : 'Entrar'}</button>
      </form>
      <p class="mt-3 mb-0">${isRegister ? '<a href="#entrar">Já tenho uma conta</a>' : '<a href="#cadastrar">Quero me cadastrar</a>'}</p>
    </div>
  </div></div>`;
}


  return { catalogPage, productPage, cartPage, checkoutPage,
    ordersPage, orderPage, profilePage, authPage };
}
