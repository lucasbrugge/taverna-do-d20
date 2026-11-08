import { validateCategory, validateProduct } from '../utils/adminValidation.js';

/** Traduz eventos da interface administrativa em chamadas aos Services. */
export class AdminController {
  constructor(app) { this.app = app; }

  attach(doc) {
    doc.addEventListener('submit', (event) => { void this.onSubmit(event); });
    doc.addEventListener('click', (event) => { void this.onClick(event); });
  }

  showErrors(form, errors) {
    form.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
    form.querySelectorAll('[data-admin-error]').forEach((el) => el.remove());
    for (const [key, text] of Object.entries(errors)) {
      const input = form.elements.namedItem(key);
      if (!input || !('classList' in input)) continue;
      input.classList.add('is-invalid');
      const message = form.ownerDocument.createElement('div');
      message.className = 'invalid-feedback d-block';
      message.dataset.adminError = key;
      message.textContent = Array.isArray(text) ? text.join(' ') : String(text);
      input.insertAdjacentElement('afterend', message);
    }
    form.querySelector('.is-invalid')?.focus();
  }

  async onSubmit(event) {
    const form = event.target.closest('form[data-admin-form]');
    if (!form) return;
    event.preventDefault();
    const { app } = this;
    if (!app.isAdmin()) return app.notify('Acesso restrito a administradores.', 'danger');
    const button = form.querySelector('button[type="submit"]');
    if (button) button.disabled = true;
    try {
      const kind = form.dataset.adminForm;
      const raw = Object.fromEntries(new FormData(form));
      if (kind === 'category') {
        const result = validateCategory(raw);
        if (!result.valid) return this.showErrors(form, result.errors);
        if (form.dataset.id) {
          await app.services.adminCategories.update(form.dataset.id, result.data); // PUT
        } else {
          await app.services.adminCategories.create(result.data);             // POST
        }
        app.state.admin.editingCategoryId = null;
        app.notify(form.dataset.id ? 'Categoria atualizada.' : 'Categoria criada.');
        return await app.render();
      }
      if (kind === 'product') {
        const image = form.elements.namedItem('image')?.files?.[0] ?? null;
        const result = validateProduct(raw, image);
        if (!result.valid) return this.showErrors(form, result.errors);
        const body = new FormData(form);
        for (const [key, value] of Object.entries(result.data)) {
          if (key !== 'image') body.set(key, String(value));
        }
        if (!image || image.size === 0) body.delete('image');
        if (form.dataset.id) {
          await app.services.adminProducts.update(form.dataset.id, body); // POST + _method PATCH
        } else {
          await app.services.adminProducts.create(body);             // POST multipart
          app.state.admin.productPage = 1;
        }
        app.state.admin.editingProductId = null;
        app.notify(form.dataset.id ? 'Produto atualizado.' : 'Produto cadastrado.');
        return await app.render();
      }
      if (kind === 'order-filter') {
        app.state.admin.orderStatus = String(raw.status ?? '');
        app.state.admin.orderPage = 1;
        return await app.render();
      }
    } catch (error) {
      if (error.response?.status === 422 && error.response?.data?.errors) {
        this.showErrors(form, error.response.data.errors);
      }
      app.notify(app.errorText(error), 'danger');
    } finally {
      if (button?.isConnected) button.disabled = false;
    }
  }

  async onClick(event) {
    const { app } = this;
    const { state, services } = app;
    const productsPage = event.target.closest('[data-admin-products-page]');
    const ordersPage = event.target.closest('[data-admin-orders-page]');
    const button = event.target.closest('[data-admin-action]');
    if (!productsPage && !ordersPage && !button) return;
    if (!app.isAdmin()) return app.notify('Acesso restrito a administradores.', 'danger');

    if (productsPage) {
      state.admin.productPage = Number(productsPage.dataset.adminProductsPage);
      state.admin.editingProductId = null;
      return void app.render();
    }
    if (ordersPage) {
      state.admin.orderPage = Number(ordersPage.dataset.adminOrdersPage);
      return void app.render();
    }

    const action = button.dataset.adminAction;
    const id = Number(button.dataset.id);
    if (action === 'cancel-product-edit') {
      state.admin.editingProductId = null;
      return void app.render();
    }
    if (action === 'cancel-category-edit') {
      state.admin.editingCategoryId = null;
      return void app.render();
    }
    if (action === 'edit-product') {
      state.admin.editingProductId = id;
      await app.render();
      return app.root.querySelector('form[data-admin-form="product"]')?.scrollIntoView({ behavior: 'smooth' });
    }
    if (action === 'edit-category') {
      state.admin.editingCategoryId = id;
      await app.render();
      return app.root.querySelector('form[data-admin-form="category"]')?.scrollIntoView({ behavior: 'smooth' });
    }
    if (action === 'delete-product' && !window.confirm('Excluir logicamente este produto?')) return;
    if (action === 'delete-category' && !window.confirm('Excluir esta categoria? A operação falhará se houver produtos vinculados.')) return;
    if (action === 'advance-order' && !window.confirm(`Alterar pedido #${id} para ${button.dataset.status === 'shipped' ? 'enviado' : 'entregue'}?`)) return;

    button.disabled = true;
    try {
      if (action === 'delete-product') {
        await services.adminProducts.remove(id);  // DELETE /api/admin/products/{id}
        state.admin.editingProductId = null;
        app.notify('Produto excluído logicamente.');
        return await app.render();
      }
      if (action === 'delete-category') {
        await services.adminCategories.remove(id); // DELETE /api/admin/categories/{id}
        state.admin.editingCategoryId = null;
        app.notify('Categoria excluída.');
        return await app.render();
      }
      if (action === 'advance-order') {
        await services.adminOrders.advance(id, button.dataset.status); // PATCH
        app.notify('Status do pedido atualizado.');
        return await app.render();
      }
    } catch (error) {
      app.notify(app.errorText(error), 'danger');
    } finally {
      if (button.isConnected) button.disabled = false;
    }
  }
}
