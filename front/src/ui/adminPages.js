import { escapeHtml, money, imageOf, dateTime, statusBadge } from './format.js';

const statusOptions = [
  ['', 'Todos'],
  ['pending_payment', 'Aguardando pagamento'],
  ['paid', 'Pago'],
  ['shipped', 'Enviado'],
  ['delivered', 'Entregue'],
  ['canceled', 'Cancelado'],
];
const integer = (v) => Number.isSafeInteger(Number(v)) && Number(v) >= 0 ? Number(v) : 0;
const html = (v) => escapeHtml(v ?? '');

function adminHeading(title, active) {
  const sections = [['produtos','Produtos'], ['categorias','Categorias'], ['pedidos','Pedidos']];
  return `<div class="d-flex justify-content-between gap-3 flex-wrap align-items-center mb-3">
    <div><p class="small text-uppercase text-warning mb-1">Área restrita</p><h1 class="h2 mb-0">${html(title)}</h1></div>
    <a href="#catalogo" class="btn btn-sm btn-outline-light">Ver loja</a>
  </div>
  <nav class="admin-tabs mb-4 d-flex flex-wrap gap-2" aria-label="Navegação administrativa">
    ${sections.map(([id,label]) => `<a class="btn ${active === id ? 'btn-primary' : 'btn-outline-primary'}" href="#admin/${id}" ${active === id ? 'aria-current="page"' : ''}>${label}</a>`).join('')}
  </nav>`;
}

export function categoryForm(category = null) {
  const editing = Boolean(category);
  return `<form data-admin-form="category" ${editing ? `data-id="${integer(category.id)}"` : ''} class="admin-form">
    <h2 class="h5 mb-3">${editing ? 'Editar categoria' : 'Nova categoria'}</h2>
    <div class="row g-3">
      <div class="col-md-6"><label class="form-label" for="admin-category-name">Nome</label>
        <input class="form-control" id="admin-category-name" name="name" required maxlength="255" value="${html(category?.name)}"></div>
      <div class="col-md-6"><label class="form-label" for="admin-category-slug">Slug</label>
        <input class="form-control" id="admin-category-slug" name="slug" required maxlength="255" pattern="[a-z0-9]+(-[a-z0-9]+)*" value="${html(category?.slug)}" placeholder="exemplo-de-categoria"></div>
    </div>
    <div class="mt-3 d-flex gap-2 flex-wrap">
      <button type="submit" class="btn btn-primary">${editing ? 'Salvar alterações' : 'Criar categoria'}</button>
      ${editing ? '<button type="button" class="btn btn-outline-light" data-admin-action="cancel-category-edit">Cancelar edição</button>' : ''}
    </div>
  </form>`;
}

export function productForm(product = null, categories = []) {
  const editing = Boolean(product);
  return `<form data-admin-form="product" ${editing ? `data-id="${integer(product.id)}"` : ''} class="admin-form">
    <h2 class="h5 mb-3">${editing ? `Editar produto #${integer(product.id)}` : 'Novo produto'}</h2>
    <div class="row g-3">
      <div class="col-md-7"><label class="form-label" for="admin-product-name">Nome</label>
        <input class="form-control" id="admin-product-name" name="name" required maxlength="255" value="${html(product?.name)}"></div>
      <div class="col-md-5"><label class="form-label" for="admin-product-category">Categoria</label>
        <select class="form-select" id="admin-product-category" name="category_id" required>
          <option value="">Selecione</option>
          ${categories.map((c) => `<option value="${integer(c.id)}" ${integer(product?.category?.id) === integer(c.id) ? 'selected' : ''}>${html(c.name)}</option>`).join('')}
        </select></div>
      <div class="col-12"><label class="form-label" for="admin-product-description">Descrição</label>
        <textarea class="form-control" id="admin-product-description" name="description" rows="3" required maxlength="10000">${html(product?.description)}</textarea></div>
      <div class="col-sm-4"><label class="form-label" for="admin-product-price">Preço (R$)</label>
        <input class="form-control" id="admin-product-price" name="price" type="number" required min="0.01" max="99999999.99" step="0.01" value="${html(product?.price)}"></div>
      <div class="col-sm-4"><label class="form-label" for="admin-product-stock">Estoque</label>
        <input class="form-control" id="admin-product-stock" name="stock" type="number" required min="0" step="1" value="${integer(product?.stock ?? 0)}"></div>
      <div class="col-sm-4"><label class="form-label" for="admin-product-active">Disponibilidade</label>
        <select class="form-select" id="admin-product-active" name="is_active" required>
          <option value="1" ${product?.is_active !== false && product?.is_active !== 0 ? 'selected' : ''}>Ativo</option>
          <option value="0" ${product?.is_active === false || product?.is_active === 0 ? 'selected' : ''}>Inativo</option>
        </select></div>
      <div class="col-12"><label class="form-label" for="admin-product-image">Imagem (JPG, PNG ou WebP; até 2 MiB)</label>
        <input class="form-control" id="admin-product-image" name="image" type="file" accept="image/jpeg,image/png,image/webp">
        <div class="form-text">${editing ? 'Deixe sem arquivo para manter a imagem atual.' : 'Imagem opcional.'}</div></div>
      ${editing && product?.image_url ? `<div class="col-12"><p class="small mb-2">Imagem atual:</p>${imageOf(product,'admin-current-image')}</div>` : ''}
    </div>
    <div class="mt-3 d-flex gap-2 flex-wrap">
      <button type="submit" class="btn btn-primary">${editing ? 'Salvar alterações' : 'Cadastrar produto'}</button>
      ${editing ? '<button type="button" class="btn btn-outline-light" data-admin-action="cancel-product-edit">Cancelar edição</button>' : ''}
    </div>
  </form>`;
}

function pager(page, pages, attribute) {
  return `<div class="d-flex align-items-center justify-content-center flex-wrap gap-2 mt-3">
    <button class="btn btn-sm btn-outline-light" ${attribute}="${page - 1}" ${page <= 1 ? 'disabled' : ''}>Anterior</button>
    <span class="small">Página ${page} de ${pages}</span>
    <button class="btn btn-sm btn-outline-light" ${attribute}="${page + 1}" ${page >= pages ? 'disabled' : ''}>Próxima</button>
  </div>`;
}

export function createAdminPages(app) {
  const { root, state, services } = app;

  async function categoriesPage() {
    const response = await services.adminCategories.list();
    state.categories = response.data ?? [];
    const selected = state.categories.find((c) => integer(c.id) === integer(state.admin.editingCategoryId)) ?? null;
    root.innerHTML = `${adminHeading('Gerenciar categorias', 'categorias')}
      <section class="panel p-4 rounded-3 mb-4">${categoryForm(selected)}</section>
      <section aria-label="Categorias cadastradas">
        <h2 class="h5 mb-3">Categorias (${state.categories.length})</h2>
        <div class="table-responsive"><table class="table table-hover align-middle">
          <thead><tr><th>Nome</th><th>Slug</th><th class="text-end">Ações</th></tr></thead>
          <tbody>${state.categories.map((c) => `<tr>
            <td>${html(c.name)}</td><td><code>${html(c.slug)}</code></td>
            <td class="text-end admin-actions">
              <button class="btn btn-sm btn-outline-primary" data-admin-action="edit-category" data-id="${integer(c.id)}">Editar</button>
              <button class="btn btn-sm btn-outline-danger" data-admin-action="delete-category" data-id="${integer(c.id)}">Excluir</button>
            </td></tr>`).join('')}</tbody>
        </table></div>
        ${state.categories.length ? '' : '<p>Nenhuma categoria cadastrada.</p>'}
        <p class="small text-secondary">Categorias com produtos vinculados não podem ser excluídas (HTTP 409).</p>
      </section>`;
  }

  async function productsPage() {
    const response = await services.adminProducts.list(state.admin.productPage);
    const products = response.data ?? [];
    state.admin.products = products;
    const page = integer(response.meta?.current_page) || 1;
    const pages = integer(response.meta?.last_page) || 1;
    const selected = products.find((p) => integer(p.id) === integer(state.admin.editingProductId)) ?? null;
    if (state.admin.editingProductId && !selected) {
      state.admin.editingProductId = null; // O item editado não está na página atual.
    }
    root.innerHTML = `${adminHeading('Gerenciar produtos', 'produtos')}
      <section class="panel p-4 rounded-3 mb-4">${productForm(selected, state.categories)}</section>
      <section aria-label="Produtos cadastrados">
        <h2 class="h5 mb-3">Produtos — página ${page}</h2>
        <div class="table-responsive"><table class="table table-hover align-middle">
          <thead><tr><th>Produto</th><th>Categoria</th><th>Preço</th><th>Estoque</th><th>Situação</th><th class="text-end">Ações</th></tr></thead>
          <tbody>${products.map((p) => `<tr>
            <td><strong>${html(p.name)}</strong><span class="d-block text-secondary small">#${integer(p.id)}</span></td>
            <td>${html(p.category?.name ?? '—')}</td>
            <td>${money(p.price)}</td><td>${integer(p.stock)}</td>
            <td><span class="badge ${p.is_active ? 'badge-stock' : 'badge-out'}">${p.is_active ? 'Ativo' : 'Inativo'}</span></td>
            <td class="text-end admin-actions">
              <button class="btn btn-sm btn-outline-primary" data-admin-action="edit-product" data-id="${integer(p.id)}">Editar</button>
              <button class="btn btn-sm btn-outline-danger" data-admin-action="delete-product" data-id="${integer(p.id)}">Excluir</button>
            </td></tr>`).join('')}</tbody>
        </table></div>
        ${products.length ? '' : '<p>Nenhum produto nesta página.</p>'}
        ${pager(page, pages, 'data-admin-products-page')}
        <p class="small text-secondary mt-3">A exclusão é lógica: produtos de pedidos antigos continuam no histórico.</p>
      </section>`;
  }

  async function ordersPage() {
    const response = await services.adminOrders.list({
      page: state.admin.orderPage,
      status: state.admin.orderStatus,
    });
    const orders = response.data ?? [];
    const page = integer(response.meta?.current_page) || 1;
    const pages = integer(response.meta?.last_page) || 1;
    root.innerHTML = `${adminHeading('Gerenciar pedidos', 'pedidos')}
      <section class="panel p-3 rounded-3 mb-3">
        <form data-admin-form="order-filter" class="d-flex flex-wrap align-items-end gap-3">
          <div class="flex-grow-1"><label for="admin-order-status" class="form-label">Filtrar por status</label>
            <select class="form-select" name="status" id="admin-order-status">${statusOptions.map(([value,label]) => `<option value="${value}" ${state.admin.orderStatus === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div>
          <button class="btn btn-primary" type="submit">Filtrar pedidos</button>
        </form>
      </section>
      <div class="list-group">
        ${orders.map((o) => `<a href="#admin/pedido/${integer(o.id)}" class="list-group-item list-group-item-action p-3">
          <div class="d-flex align-items-center justify-content-between gap-3 flex-wrap">
            <span><strong>Pedido #${integer(o.id)}</strong><span class="d-block text-secondary small">${html(o.customer?.name ?? 'Cliente')} · ${dateTime(o.created_at)}</span></span>
            ${statusBadge(o.status)}<strong>${money(o.total)}</strong>
          </div></a>`).join('')}
      </div>
      ${orders.length ? '' : '<p>Nenhum pedido encontrado.</p>'}
      ${pager(page, pages, 'data-admin-orders-page')}`;
  }

  async function orderDetailPage(id) {
    const response = await services.adminOrders.detail(id);
    const order = response.data;
    const shippingAddress = order.shipping_address ?? {};
    const canShip = order.status === 'paid';
    const canDeliver = order.status === 'shipped';
    root.innerHTML = `${adminHeading(`Pedido #${integer(order.id)}`, 'pedidos')}
      <a class="d-inline-block mb-3" href="#admin/pedidos">← Voltar aos pedidos</a>
      <div class="row g-3"><section class="col-lg-7"><div class="panel p-4 rounded-3 h-100">
        <div class="d-flex gap-2 justify-content-between align-items-center flex-wrap mb-3"><h2 class="h5 mb-0">Itens do pedido</h2>${statusBadge(order.status)}</div>
        ${(order.items ?? []).map((i) => `<div class="d-flex flex-wrap justify-content-between border-bottom py-2 gap-2">
          <span>${html(i.product_name)} — ${integer(i.quantity)} × ${money(i.unit_price)}</span><strong>${money(i.subtotal)}</strong>
        </div>`).join('')}
        <div class="d-flex justify-content-between mt-3"><span>Subtotal</span><strong>${money(order.subtotal)}</strong></div>
        <div class="d-flex justify-content-between"><span>Frete</span><strong>${money(order.shipping)}</strong></div>
        <div class="d-flex justify-content-between mt-2 price"><span>Total</span><strong>${money(order.total)}</strong></div>
      </div></section>
      <aside class="col-lg-5"><div class="panel p-4 rounded-3 mb-3">
        <h2 class="h5">Endereço registrado no pedido</h2>
        <p>${html(shippingAddress.recipient_name)}<br>${html(shippingAddress.street)}, ${html(shippingAddress.number)}<br>
          ${html(shippingAddress.complement)}<br>${html(shippingAddress.district)}<br>
          ${html(shippingAddress.city)}/${html(shippingAddress.state)} — ${html(shippingAddress.postal_code)}</p>
        <h2 class="h5">Datas</h2>
        <p class="small mb-1">Criado: ${dateTime(order.created_at)}</p>
        <p class="small mb-1">Pago: ${dateTime(order.paid_at)}</p>
        <p class="small mb-1">Enviado: ${dateTime(order.shipped_at)}</p>
        <p class="small">Entregue: ${dateTime(order.delivered_at)}</p>
      </div><div class="panel p-4 rounded-3">
        <h2 class="h5">Atualizar status</h2>
        ${canShip ? `<button class="btn btn-primary w-100" data-admin-action="advance-order" data-id="${integer(order.id)}" data-status="shipped">Marcar como enviado</button>` : ''}
        ${canDeliver ? `<button class="btn btn-primary w-100" data-admin-action="advance-order" data-id="${integer(order.id)}" data-status="delivered">Marcar como entregue</button>` : ''}
        ${!canShip && !canDeliver ? '<p class="text-secondary small mb-0">Nenhuma transição administrativa disponível neste estado.</p>' : ''}
        <p class="text-secondary small mt-3 mb-0">Somente pago → enviado → entregue é permitido nesta área.</p>
      </div></aside></div>`;
  }

  return { categoriesPage, productsPage, ordersPage, orderDetailPage };
}
