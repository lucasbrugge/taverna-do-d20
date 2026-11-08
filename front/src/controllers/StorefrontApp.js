import { AuthService } from '../services/AuthService.js';
import { CatalogService } from '../services/CatalogService.js';
import { CartService } from '../services/CartService.js';
import { AddressService } from '../services/AddressService.js';
import { OrderService } from '../services/OrderService.js';
import { createPages } from '../ui/pages.js';
import { escapeHtml } from '../ui/format.js';
import { EventsController } from './EventsController.js';

/** Controla estado, navegação e ciclo de vida. Não executa SQL nem monta payload HTTP. */
export class StorefrontApp {
  constructor(doc = document, locationRef = window.location) {
    this.root = doc.querySelector('#app');
    this.header = doc.querySelector('#site-header');
    this.noticeArea = doc.querySelector('#notice');
    this.location = locationRef;
    this.state = {
      user: null, cart: null, categories: [], addresses: [],
      filters: { search: '', category: '', sort: 'recent', page: 1 },
      orderPage: 1, afterLogin: null, selectedAddress: null,
      editingAddress: null,
    };
    this.services = {
      auth: new AuthService(), catalog: new CatalogService(),
      cart: new CartService(), addresses: new AddressService(),
      orders: new OrderService(),
    };
    this.pages = createPages(this);
    this.events = new EventsController(this);
    this.doc = doc;
  }

  currentRoute() { return this.location.hash.slice(1) || 'catalogo'; }

  go(hash) {
    if (this.location.hash === hash) void this.render();
    else this.location.hash = hash;
  }

  notify(message, type = 'success') {
    this.noticeArea.replaceChildren();
    const box = this.doc.createElement('div');
    box.className = `alert alert-${type}`;
    box.textContent = message; // Nunca inserir mensagem do backend com innerHTML.
    this.noticeArea.append(box);
  }

  errorText(error) {
    const errors = error.response?.data?.errors;
    const details = errors ? Object.values(errors).flat().join(' · ') : '';
    return details || error.response?.data?.message || error.message || 'Falha na requisição.';
  }

  refreshHeader() {
    const user = this.state.user;
    const count = Number(this.state.cart?.items_count ?? 0);
    this.header.innerHTML = `<nav class="navbar navbar-expand-lg">
      <div class="container d-flex gap-3 flex-wrap align-items-center">
        <a class="navbar-brand fs-4" href="#catalogo">Taverna do D20</a>
        <div class="d-flex flex-wrap align-items-center gap-3 ms-lg-auto">
          <a class="nav-link" href="#catalogo">Catálogo</a>
          <a class="nav-link" href="#carrinho">Carrinho <span class="badge text-bg-secondary">${count}</span></a>
          ${user ? `
            <a class="nav-link" href="#pedidos">Meus pedidos</a>
            <a class="nav-link" href="#perfil">${escapeHtml(user.name)}</a>
            <button type="button" class="btn btn-sm btn-outline-light" data-action="logout">Sair</button>
          ` : `
            <a class="nav-link" href="#entrar">Entrar</a>
            <a class="btn btn-sm btn-outline-primary" href="#cadastrar">Criar conta</a>
          `}
        </div>
      </div>
    </nav>`;
  }

  async refreshCart() {
    this.state.cart = await this.services.cart.get();
    this.refreshHeader();
    return this.state.cart;
  }

  requireLogin() {
    if (this.state.user) return true;
    this.state.afterLogin = `#${this.currentRoute()}`;
    this.notify('Entre ou cadastre-se para continuar. Seu carrinho permanecerá salvo.', 'info');
    this.go('#entrar');
    return false;
  }

  async render() {
    this.refreshHeader();
    this.root.innerHTML = '<p class="text-secondary">Carregando...</p>';
    const route = this.currentRoute();
    try {
      if (route === 'catalogo') return await this.pages.catalogPage();
      if (route === 'carrinho') return await this.pages.cartPage();
      if (route === 'checkout') return await this.pages.checkoutPage();
      if (route === 'pedidos') return await this.pages.ordersPage();
      if (route === 'perfil') return await this.pages.profilePage();
      if (route === 'entrar' || route === 'cadastrar') return this.pages.authPage(route);
      if (/^produto\/[1-9]\d*$/.test(route)) return await this.pages.productPage(Number(route.split('/')[1]));
      if (/^pedido\/[1-9]\d*$/.test(route)) return await this.pages.orderPage(Number(route.split('/')[1]));
      this.root.innerHTML = '<h1>Página não encontrada</h1><a href="#catalogo">Voltar ao catálogo</a>';
    } catch (error) {
      if (error.response?.status === 401 && ['checkout', 'pedidos', 'perfil', 'pedido'].includes(route.split('/')[0])) {
        this.state.user = null;
        return this.requireLogin();
      }
      this.notify(this.errorText(error), 'danger');
      this.root.innerHTML = '<h1>Não foi possível carregar esta página</h1><a href="#catalogo">Voltar ao catálogo</a>';
    }
  }

  async start() {
    this.events.attach(this.doc);
    window.addEventListener('hashchange', () => { void this.render(); });
    try {
      await this.services.auth.csrf();
      try {
        this.state.user = await this.services.auth.current();
      } catch (error) {
        if (error.response?.status !== 401) throw error;
      }
      const categories = await this.services.catalog.categories();
      this.state.categories = categories.data ?? [];
      await this.refreshCart();
      await this.render();
    } catch (error) {
      this.notify(`Falha ao conectar com a API: ${this.errorText(error)}`, 'danger');
      this.root.innerHTML = '<p>Confira se Laravel e Vite estão em execução nas portas 8001 e 5173.</p>';
    }
  }
}
