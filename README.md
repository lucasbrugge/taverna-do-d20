# Taverna do D20

Loja virtual acadêmica dedicada a produtos de RPG. O projeto implementa uma API REST em Laravel e um frontend em HTML, CSS e JavaScript, com banco MySQL e serviços gerenciados por Docker Compose.

> **Projeto acadêmico:** os pagamentos são simulados. Não são solicitados nem armazenados dados de cartão.

## Funcionalidades

- Catálogo público de produtos, detalhes, busca, categorias, ordenação e paginação.
- Carrinho de visitante persistido no servidor e carrinho de usuário autenticado.
- Fusão dos carrinhos durante o login/registro, limitada ao estoque disponível.
- Cadastro de endereços com preenchimento por CEP via ViaCEP.
- Checkout autenticado com validação de estoque, criação do pedido e preços congelados.
- Pagamento simulado, histórico de pedidos, cancelamento de pedidos pendentes e devolução de estoque.
- Área administrativa para gerenciar produtos, categorias, estoque e status dos pedidos.
- Documentação interativa da API com Swagger UI e OpenAPI.

## Tecnologias e arquitetura

| Camada | Tecnologia | Função |
| --- | --- | --- |
| Frontend | JavaScript, Vite, Axios, Bootstrap | Interface e consumo da API |
| Frontend HTTP | Nginx | Serve os arquivos compilados do Vite |
| Proxy reverso | Nginx | Entrada única HTTP, encaminha requisições e serve imagens |
| API | PHP 8.4, Laravel 12, FrankenPHP/Caddy | Regras de negócio e endpoints REST |
| Autenticação | Laravel Sanctum (sessão/cookies/CSRF) | Login de clientes e administradores |
| Persistência | MySQL 8.4 | Produtos, usuários, carrinhos, pedidos e endereços |
| Infraestrutura | Docker Compose | Inicialização e redes entre serviços |

Fluxo: **Navegador → proxy → frontend (HTML/JS) ou API (FrankenPHP + Laravel) → MySQL**.

A API utiliza MVC e **Service Layer**: rotas identificam as ações, Controllers recebem requisições, Form Requests validam entradas, Services executam regras, Models/Eloquent acessam dados e Resources organizam as respostas JSON.

```text
.
├── api/                      # Laravel, migrations, seeders, Swagger e FrankenPHP
│   ├── app/Http/Controllers/
│   ├── app/Http/Requests/
│   ├── app/Http/Resources/
│   ├── app/Services/
│   ├── database/
│   ├── public/api/docs/     # Swagger UI e openapi.yaml
│   ├── Caddyfile
│   ├── Dockerfile
│   └── Dockerfile.dev
├── front/                    # Frontend JavaScript + Vite
│   ├── src/controllers/
│   ├── src/services/
│   ├── src/ui/
│   ├── src/main.js
│   ├── index.html
│   ├── nginx.conf
│   └── Dockerfile
├── proxy/                    # Entrada HTTP única (Nginx)
│   ├── default.conf
│   └── Dockerfile
├── compose.yaml
├── dev.sh
└── .env.example
```

## Pré-requisitos

- Git, Docker Engine com Docker Compose (`docker compose`) e OpenSSL para gerar uma chave.
- Porta local **8080** disponível (ou ajuste `FRONTEND_PORT`).

## Instalação para desenvolvimento

```bash
git clone https://github.com/lucasbrugge/taverna-do-d20.git
cd taverna-do-d20
cp .env.example .env
```

Abra o `.env` da raiz e configure `MYSQL_PASSWORD` e `MYSQL_ROOT_PASSWORD` com senhas locais. Gere uma chave **única** de 32 bytes para a aplicação:

```bash
printf 'base64:%s\n' "$(openssl rand -base64 32)"
```

Copie o resultado completo para a variável `APP_KEY=` do `.env`. Não utilize a chave publicada em exemplos e não envie sua chave em mensagens ou commits. **Não troque a chave de uma instalação existente sem planejar o impacto sobre sessões e dados criptografados.**

Na primeira execução, quando ainda não houver dados a preservar:

```bash
chmod +x dev.sh
./dev.sh reset
```

O modo `reset` solicita confirmação, remove os **volumes gerenciados por este Compose**, inicia os containers, executa as migrations e popula o banco com os seeders. **Ele apaga o banco e as imagens do volume**. Use apenas no ambiente local de desenvolvimento.

No uso diário, mantenha os dados:

```bash
./dev.sh up
```

`up` inicia/reconstrói os containers e executa as migrations pendentes, mas **não** executa os seeders novamente.

## Endereços locais

| Recurso | URL |
| --- | --- |
| Loja virtual | http://127.0.0.1:8080 |
| Catálogo (API) | http://127.0.0.1:8080/api/products |
| Swagger UI | http://127.0.0.1:8080/api/docs |
| Especificação OpenAPI | http://127.0.0.1:8080/api/docs/openapi.yaml |

Use sempre o mesmo host (`127.0.0.1` ou `localhost`) durante o login, pois os cookies de sessão e a proteção CSRF dependem da origem utilizada. Os caminhos `/api` e `/sanctum` são repassados pelo proxy ao FrankenPHP.

## Contas demonstrativas

Disponíveis após `./dev.sh reset`, somente no ambiente `local` ou `testing`:

| Perfil | E-mail |
| --- | --- |
| Administrador | `demo.admin@taverna.test` |
| Cliente 1 | `demo.cliente1@taverna.test` |
| Cliente 2 | `demo.cliente2@taverna.test` |
| Cliente 3 | `demo.cliente3@taverna.test` |

Senha demonstrativa padrão: `TavernaDemo@2026!`. O `UserSeeder` permite substituí-la por `DEMO_SEED_PASSWORD` no ambiente de execução da API. **Não use essas credenciais em produção.**

O `DatabaseSeeder` executa, nesta ordem: `CategorySeeder`, `ProductSeeder`, `ProductImageSeeder`, `UserSeeder`, `OrderSeeder` e `CartSeeder`. Os dados iniciais incluem 3 categorias, 30 produtos e exemplos de carrinhos e pedidos em vários estados.

## Regras de negócio essenciais

**Carrinho e fusão:** o carrinho de visitante é persistido no servidor e associado a um cookie próprio. No login/registro, os itens passam para o carrinho da conta. Produtos repetidos têm suas quantidades somadas, respeitando o estoque. O identificador de visitante é descartado depois da fusão.

**Pedido e estoque:** o checkout exige login e um endereço do usuário, valida carrinho e disponibilidade, calcula os valores no servidor e grava pedido/itens com preços e endereço daquele momento. O estoque é reduzido dentro de uma transação; o carrinho é esvaziado após a criação bem-sucedida. O frete da demonstração é gratuito (valor fixo igual a zero).

**Pagamento e status:** `pending_payment` → `paid` → `shipped` → `delivered`. É possível cancelar um pedido em `pending_payment`, devolvendo as unidades ao estoque. Pagamento é uma ação **simulada**, sem gateway e sem cartão.

**Autorização:** clientes acessam somente suas informações e pedidos, enquanto rotas administrativas exigem o papel `admin`; a validação é feita no backend, não apenas na interface.

## Comandos de manutenção

```bash
# Ver containers
docker compose ps

# Logs da API
docker compose logs --tail=100 api

# Ver rotas
docker compose exec api php artisan route:list

# Migrations pendentes
docker compose exec api php artisan migrate --force

# Seeders de desenvolvimento (não rodar repetidamente sobre pedidos/estoques reais)
docker compose exec api php artisan db:seed --force

# Parar sem excluir os dados
docker compose down
```

**Nunca use `docker compose down -v` quando quiser preservar o banco e os uploads.** Os volumes `mysql_data` e `product_images` são gerenciados pelo Compose.

## Documentação da API

Swagger UI em `/api/docs`. A especificação está em `api/public/api/docs/openapi.yaml`. A explicação de autenticação por sessão, cookies e CSRF está em `api/docs/swagger-ui.md`.

Para conferir a infraestrutura:

```bash
docker compose config --quiet
docker compose ps
curl -i http://127.0.0.1:8080/api/products
curl -i http://127.0.0.1:8080/api/docs/openapi.yaml
```

## Entrega e observações

O frontend é feito em **HTML/CSS/JavaScript, sem Blade**. Ele utiliza uma única entrada HTML com telas organizadas em módulos JavaScript. A publicação do frontend ocorre via build Vite, servido pelo Nginx. O `proxy/` fornece a entrada HTTP única para frontend, API, CSRF e imagens.

Verifique o checklist funcional exigido pelo professor antes da entrega, principalmente a **edição de nome/e-mail do perfil**, que ainda precisa ser implementada/validada. Os testes automatizados de regras de negócio não fazem parte da lista explícita de itens obrigatórios do enunciado, embora sejam recomendados.
