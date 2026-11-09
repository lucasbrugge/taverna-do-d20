(() => {
  'use strict';

  const writeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
  let pendingCsrf = null;

  function readCsrfCookie() {
    const cookie = document.cookie.split(';')
      .map((value) => value.trim())
      .find((value) => value.startsWith('XSRF-TOKEN='));

    return cookie ? decodeURIComponent(cookie.slice('XSRF-TOKEN='.length)) : null;
  }

  function csrfToken() {
    // Atualiza o cookie antes de cada escrita, inclusive após logout/expiração.
    // Escritas simultâneas compartilham a mesma inicialização da sessão.
    if (!pendingCsrf) {
      pendingCsrf = fetch('/sanctum/csrf-cookie', {
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      }).then((response) => {
        if (!response.ok) {
          throw new Error(`Falha ao obter CSRF em /sanctum/csrf-cookie (${response.status}).`);
        }

        const token = readCsrfCookie();
        if (!token) {
          throw new Error('Cookie XSRF-TOKEN ausente. Confira os cookies e a configuração de sessão do Sanctum para este host.');
        }

        return token;
      }).finally(() => {
        pendingCsrf = null;
      });
    }

    return pendingCsrf;
  }

  window.ui = SwaggerUIBundle({
    url: '/api/docs/openapi.yaml',
    dom_id: '#swagger-ui',
    deepLinking: true,
    filter: true,
    displayRequestDuration: true,
    withCredentials: true,
    validatorUrl: null,
    supportedSubmitMethods: ['get', 'post', 'put', 'patch', 'delete', 'head'],
    requestInterceptor: async (request) => {
      const url = new URL(request.url, window.location.origin);
      if (url.origin !== window.location.origin) {
        throw new Error('O Try it out deve usar a mesma origem desta documentação.');
      }

      request.credentials = 'same-origin';
      request.headers = request.headers || {};
      // Swagger pode incluir accept: */*. Evita combinar dois cabeçalhos e
      // fazer o Laravel negociar HTML em vez de retornar os erros JSON.
      for (const name of Object.keys(request.headers)) {
        if (name.toLowerCase() === 'accept') delete request.headers[name];
      }
      request.headers.Accept = 'application/json';

      if (writeMethods.has((request.method || 'GET').toUpperCase())) {
        request.headers['X-XSRF-TOKEN'] = await csrfToken();
      }

      return request;
    },
  });
})();
