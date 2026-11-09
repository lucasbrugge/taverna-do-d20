# Documentação da API

Acesse a aplicação pelo proxy existente:

- UI pública: `http://127.0.0.1:8080/api/docs` (também aceita `/api/docs/`).
- OpenAPI 3.0.3: `http://127.0.0.1:8080/api/docs/openapi.yaml`.

Os arquivos estão em `public/api/docs/index.html`, `public/api/docs/openapi.yaml`
e `public/api/docs/assets/`. O `file_server` de `api/Caddyfile` serve esse diretório
diretamente de `public`, antes do `php_server`, inclusive sem barra final. Isso
é necessário porque o `php_server` original encaminhava `/api/docs` ao Laravel,
resultando em 404. Arquivos ausentes no diretório de documentação continuam
retornando 404 estático. Não há rotas Laravel, Blade ou dependência de `front/`
para servir a documentação.

## Autenticação no Try it out

1. Abra a UI no mesmo host da aplicação, mantendo o mesmo host durante a sessão.
2. Execute `POST /api/auth/login` ou `POST /api/auth/register` com JSON válido.
3. Execute as operações autenticadas; o navegador preserva a sessão.
4. Execute `POST /api/auth/logout` para encerrar a sessão.

`assets/swagger-initializer.js` solicita `/sanctum/csrf-cookie` antes de cada
escrita, compartilha solicitações CSRF simultâneas, decodifica `XSRF-TOKEN` e
envia `X-XSRF-TOKEN`. Os cookies são gerenciados pelo navegador, incluindo o
cookie HttpOnly de sessão. O interceptor usa `credentials: same-origin`, rejeita
outras origens e define `Accept: application/json`. O validador remoto está
desativado; carregar ou usar a UI não depende de CDN ou serviço externo.

O host precisa estar em `SANCTUM_STATEFUL_DOMAINS`, como já exige o frontend.
O Compose inclui `127.0.0.1:8080` e `localhost:8080` por padrão. O nome do cookie
de sessão é configurável em `config/session.php`; a UI não fixa esse nome nem
solicita credenciais em um diálogo Authorize. O YAML descreve o acesso por
operação (`x-access: public`, `session` ou `admin`), sem criar esquemas de token.
`servers: [{url: /}]` mantém a origem e os paths incluem `/api` explicitamente;
o endpoint CSRF permanece em `/sanctum/csrf-cookie`.

## Contrato e fontes

As 35 operações em 25 caminhos correspondem às rotas de `routes/api.php`
(incluindo ambos PUT/PATCH registrados) e ao endpoint CSRF do Sanctum. HEAD
implícito dos GET é descrito nas informações gerais. `/`, `/up` e as rotas de
storage do framework não fazem parte do contrato público deste proxy.

Antes de atualizar o YAML, confira `php artisan route:list -vv` e o código:

- `routes/api.php`, `bootstrap/app.php`, `config/auth.php`, `config/sanctum.php`
  e `config/session.php`: registro, middleware e sessão.
- `app/Http/Controllers/Api/`, `app/Http/Requests/`, `app/Services/`:
  validação, autorização, status HTTP e efeitos de negócio.
- `app/Http/Resources/`, `app/Models/`, `database/migrations/`:
  serialização, relações carregadas, casts e persistência.
- `app/Http/Middleware/EnsureUserIsAdmin.php` e `User::isAdmin()`:
  administração exige `role === 'admin'`. Endereços só podem ser alterados pelo
  proprietário; pedidos podem ser consultados/cancelados pelo proprietário ou
  admin, mas o pagamento exige o comprador.

Preserve os contratos distintos: `/api/user` retorna o model sem `data`, os
Resources usam `data`, e o carrinho retorna um resumo direto. Apenas produtos
(12 por página) e pedidos (10) são paginados. Listas de pedidos omitem `items`;
`customer` aparece apenas na administração. O cadastro retorna o model sem
refresh e pode apresentar `role: null` antes de carregar o default do banco.
A criação de produto também conserva os tipos de entrada de `price` e `stock`;
leituras posteriores usam os tipos retornados pelo banco.

## Publicação e verificação

O Dockerfile já copia `public` e o Caddyfile; não existe volume de código no
Compose. Na raiz do repositório, reconstrua somente a API para publicar:

```sh
docker compose up -d --build --no-deps api
curl --fail-with-body --include http://127.0.0.1:8080/api/docs
curl --fail-with-body --include http://127.0.0.1:8080/api/docs/openapi.yaml
curl --fail-with-body --head http://127.0.0.1:8080/api/docs/assets/swagger-ui-bundle.js
```

Exija 200 sem redirecionamento nos dois primeiros URLs, HTML na página e YAML
OpenAPI no segundo corpo. Valide o YAML com um validador OpenAPI 3.0 e compare
os métodos/paths às rotas registradas. No navegador, confirme a renderização
das 35 operações, a requisição da especificação em seu URL exato e a ausência
de 404 nos assets. Teste catálogo, login, `/api/auth/me`, logout e a restrição
403 das operações administrativas para um cliente. Nas escritas, confira a
chamada CSRF 204 anterior e o cabeçalho `X-XSRF-TOKEN`, usando os cookies da
mesma origem.

## Assets vendorizados

Distribuição oficial [`swagger-ui-dist@5.34.1`](https://www.npmjs.com/package/swagger-ui-dist/v/5.34.1),
obtida do [tarball do registro npm](https://registry.npmjs.org/swagger-ui-dist/-/swagger-ui-dist-5.34.1.tgz).
Integridade SHA-512 do pacote, conferida antes da extração:

```text
sha512-VSr8fXfI93obYaQicLJbLUKGRxDojj/SfRJDDLCioGTUBj4BK/Nj4eE9jCeCAnJxVLi7iS+08PbiZLyrQKBkJQ==
```

Foram copiados `swagger-ui-bundle.js`, `swagger-ui.css`, `favicon-32x32.png`,
`LICENSE`, `NOTICE` e `swagger-ui-bundle.js.LICENSE.txt`, sem modificações.
O initializer é código deste projeto. Não é necessário instalar npm no backend
nem executar build do frontend. Ao atualizar a distribuição, confira a
integridade do pacote, preserve os avisos de licença e repita as verificações
de renderização, sessão e CSRF.

Referências: [configuração do Swagger UI](https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/)
e [file_server do Caddy](https://caddyserver.com/docs/caddyfile/directives/file_server).
