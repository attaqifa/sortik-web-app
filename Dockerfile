# Hanya untuk deploy (Render). Pengembangan lokal tetap: php -S 127.0.0.1:8080 -t public backend/dev-router.php
FROM php:8.3-cli

RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq-dev \
    && docker-php-ext-install pdo_pgsql \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY backend ./backend
COPY public ./public

# beberapa proses agar satu request lambat tidak memblokir yang lain
ENV PHP_CLI_SERVER_WORKERS=4

# Render memberi nomor port lewat variabel PORT
CMD ["sh", "-c", "php -S 0.0.0.0:${PORT:-10000} -t public backend/dev-router.php"]
