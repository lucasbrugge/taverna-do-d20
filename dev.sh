
#!/usr/bin/env bash

set -Eeuo pipefail

# Garante a execução na pasta do projeto.
cd "$(dirname "$0")"

MODE="${1:-up}"

echo "===================================="
echo "       TAVERNA DO D20"
echo "       Docker + FrankenPHP"
echo "===================================="

# Verifica a configuração antes de alterar containers.
docker compose config --quiet

case "$MODE" in
    up)
        echo "Iniciando sem apagar os dados..."
        ;;

    reset)
        echo ""
        echo "ATENÇÃO: RESET DE DESENVOLVIMENTO!"
        echo "Serão removidos os volumes deste Compose."
        echo "Isso apaga o banco e os uploads nesses volumes."
        echo ""

        read -r -p "Digite APAGAR para confirmar: " CONFIRM

        if [[ "$CONFIRM" != "APAGAR" ]]; then
            echo "Operação cancelada."
            exit 1
        fi

        echo "Removendo containers e volumes do projeto..."

        docker compose down \
            --volumes \
            --remove-orphans
        ;;

    *)
        echo "Uso: ./dev.sh [up|reset]"
        exit 1
        ;;
esac

echo ""
echo "Construindo e iniciando os containers..."

docker compose up \
    -d \
    --build \
    --wait \
    --wait-timeout 180

echo ""
echo "Executando migrations..."

docker compose exec -T api \
    php artisan migrate --force

if [[ "$MODE" == "reset" ]]; then
    echo ""
    echo "Preparando armazenamento de imagens..."

    docker compose exec -T api \
        php artisan storage:link

    echo ""
    echo "Executando DatabaseSeeder..."

    docker compose exec -T api \
        php artisan db:seed --force
fi

echo ""
echo "Limpando caches do Laravel..."

docker compose exec -T api \
    php artisan optimize:clear

echo ""
echo "Verificando os containers..."

docker compose ps

echo ""
echo "===================================="
echo " Taverna do D20 iniciada!"
echo " http://127.0.0.1:8080"
echo "===================================="
