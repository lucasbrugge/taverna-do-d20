import { AddressValidator } from "../utils/addressValidation.js";
import { CepController } from "./CepController.js";
import { showAddressErrors } from "../ui/addressForm.js";

/** Recebe eventos de interface, valida e delega ao Service correto. */
export class EventsController {
  constructor(app, cep = new CepController()) {
    this.app = app;
    this.cep = cep;
  }

  attach(doc) {
    // Delegação: também funciona após a página ser recriada por render().
    doc.addEventListener("submit", (event) => {
      void this.onSubmit(event);
    });
    doc.addEventListener("click", (event) => {
      void this.onClick(event);
    });
    doc.addEventListener("input", (event) => this.cep.onInput(event));
    doc.addEventListener("focusout", (event) => this.cep.onBlur(event));
  }

  async onSubmit(event) {
    const form = event.target.closest("form[data-form]");
    if (!form) return;
    event.preventDefault();
    const { app } = this;
    const { state, services } = app;
    const kind = form.dataset.form;
    const data = Object.fromEntries(new FormData(form));
    const button = form.querySelector(
      'button[type="submit"], button:not([type])',
    );
    if (button) button.disabled = true;
    try {
      if (kind === "profile") {
        const result = await services.auth.updateProfile({
          name: data.name.trim(),
          email: data.email.trim(),
        });

        state.user = result.data;

        app.notify("Dados pessoais atualizados com sucesso.");

        return await app.render();
      }
      if (kind === "filters") {
        state.filters = {
          search: data.search.trim(),
          category: data.category,
          sort: data.sort,
          page: 1,
        };
        return await app.render();
      }
      if (kind === "register" || kind === "login") {
        const result =
          kind === "register"
            ? await services.auth.register(data)
            : await services.auth.login(data.email, data.password);
        state.user = result.data;
        await app.refreshCart();
        const adjustments = result.cart_merge?.adjustments ?? [];
        app.notify(
          adjustments.length
            ? `Conta autenticada. Carrinho ajustado por disponibilidade: ${adjustments.length} item(ns).`
            : "Você entrou na Taverna! O carrinho foi preservado.",
          adjustments.length ? "warning" : "success",
        );
        const destination = state.afterLogin || "#catalogo";
        state.afterLogin = null;
        return app.go(destination);
      }
      if (kind === "add-product") {
        await services.cart.add(form.dataset.id, data.quantity);
        await app.refreshCart();
        return app.notify("Produto adicionado ao carrinho.");
      }
      if (kind === "cart-quantity") {
        await services.cart.update(form.dataset.id, data.quantity);
        app.notify("Quantidade atualizada.");
        return await app.render();
      }
      if (kind === "address") {
        const result = AddressValidator.validate(data);
        showAddressErrors(form, result.errors);
        if (!result.valid) {
          app.notify("Revise os campos destacados do endereço.", "warning");
          form.querySelector(".is-invalid")?.focus();
          return;
        }
        const id = form.dataset.id;
        try {
          const saved = id
            ? await services.addresses.update(id, result.address) // PUT
            : await services.addresses.create(result.address); // POST
          state.selectedAddress = saved.data.id;
          state.editingAddress = null;
          app.notify(id ? "Endereço atualizado." : "Endereço cadastrado.");
          return await app.render();
        } catch (error) {
          if (error.response?.status === 422 && error.response?.data?.errors) {
            showAddressErrors(form, error.response.data.errors);
          }
          throw error;
        }
      }
      if (kind === "checkout") {
        const response = await services.orders.checkout(data.address_id);
        await app.refreshCart();
        app.notify("Pedido criado! Agora confirme o pagamento simulado.");
        return app.go(`#pedido/${response.data.id}`);
      }
    } catch (error) {
      app.notify(app.errorText(error), "danger");
    } finally {
      if (button?.isConnected) button.disabled = false;
    }
  }

  async onClick(event) {
    const { app } = this;
    const { state, services } = app;
    const pageButton = event.target.closest("[data-page]");
    if (pageButton) {
      state.filters.page = Number(pageButton.dataset.page);
      return void app.render();
    }
    const orderPageButton = event.target.closest("[data-orders-page]");
    if (orderPageButton) {
      state.orderPage = Number(orderPageButton.dataset.ordersPage);
      return void app.render();
    }
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const kind = button.dataset.action;
    const id = Number(button.dataset.id);
    if (kind === "lookup-cep") {
      return await this.cep.lookup(
        button.closest('form[data-form="address"]'),
        { force: true },
      );
    }
    if (kind === "cancel-edit-address") {
      state.editingAddress = null;
      return await app.render();
    }
    if (kind === "edit-address") {
      const address = state.addresses.find((a) => Number(a.id) === id);
      if (!address) return app.notify("Endereço não encontrado.", "warning");
      state.editingAddress = address;
      await app.render();
      return app.root
        .querySelector('form[data-form="address"]')
        ?.scrollIntoView({ behavior: "smooth" });
    }
    if (
      kind === "cancel-order" &&
      !window.confirm("Cancelar este pedido e devolver o estoque?")
    )
      return;
    if (
      kind === "remove-address" &&
      !window.confirm("Excluir este endereço cadastrado?")
    )
      return;
    button.disabled = true;
    try {
      if (kind === "logout") {
        await services.auth.logout();
        state.user = null;
        state.cart = null;
        state.editingAddress = null;
        await app.refreshCart();
        app.notify("Sessão encerrada.");
        return app.go("#catalogo");
      }
      if (kind === "remove-item") {
        await services.cart.remove(id);
        app.notify("Item removido do carrinho.");
        return await app.render();
      }
      if (kind === "pay") {
        await services.orders.pay(id);
        app.notify("Pagamento fictício confirmado. Nenhum valor foi cobrado.");
        return await app.render();
      }
      if (kind === "cancel-order") {
        await services.orders.cancel(id);
        app.notify("Pedido cancelado e estoque devolvido.");
        return await app.render();
      }
      if (kind === "remove-address") {
        await services.addresses.remove(id); // DELETE
        if (Number(state.selectedAddress) === id) state.selectedAddress = null;
        if (Number(state.editingAddress?.id) === id)
          state.editingAddress = null;
        app.notify(
          "Endereço excluído. Pedidos anteriores continuam preservados.",
        );
        return await app.render();
      }
    } catch (error) {
      app.notify(app.errorText(error), "danger");
    } finally {
      if (button.isConnected) button.disabled = false;
    }
  }
}
