import { StorefrontApp } from './controllers/StorefrontApp.js';

// Ponto de entrada: inicializa a aplicação. Não contém lógica de negócio.
const app = new StorefrontApp();
void app.start();
