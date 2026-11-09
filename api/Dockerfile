FROM dunglas/frankenphp:1-php8.4-bookworm

ENV COMPOSER_ALLOW_SUPERUSER=1 \
    SERVER_NAME=:80

RUN install-php-extensions \
    pdo_mysql mbstring bcmath intl zip gd opcache

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

WORKDIR /app
COPY . /app
COPY Caddyfile /etc/frankenphp/Caddyfile

RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini" \
    && composer install --no-dev --prefer-dist --no-interaction --no-progress --no-scripts --optimize-autoloader \
    && mkdir -p storage/app/public storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R ug+rwX storage bootstrap/cache

EXPOSE 80
# A imagem FrankenPHP já inicia o Caddy + servidor PHP.
