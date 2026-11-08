import { register, login, me, logout } from "./api.js";

const result = document.querySelector("#result");

function showResult(data) {
  result.textContent = JSON.stringify(data, null, 2);
}

function showError(error) {
  showResult({
    status: error.response?.status ?? "Sem resposta",
    message: error.response?.data?.message ?? error.message,
    errors: error.response?.data?.errors ?? {},
  });
}

// Cadastro
document
  .querySelector("#registerForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      const response = await register(data);
      showResult(response);
      form.reset();
    } catch (error) {
      showError(error);
    }
  });

// Login
document
  .querySelector("#loginForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      const response = await login(data.email, data.password);

      showResult(response);
      form.reset();
    } catch (error) {
      showError(error);
    }
  });

// Consultar usuário autenticado
document.querySelector("#meButton").addEventListener("click", async () => {
  try {
    showResult(await me());
  } catch (error) {
    showError(error);
  }
});

// Logout
document.querySelector("#logoutButton").addEventListener("click", async () => {
  try {
    showResult(await logout());
  } catch (error) {
    showError(error);
  }
});
