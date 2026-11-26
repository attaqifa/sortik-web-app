# Hanya untuk deploy (Render). Pengembangan lokal tetap: php -S 127.0.0.1:8080 -t public backend/dev-router.php
# Produksi memakai Apache + mod_php, bukan server bawaan `php -S` (yang menurut dokumentasi PHP
# tidak dibuat untuk produksi: tanpa batas waktu, keepalive, atau pembatasan koneksi).
FROM php:8.3-apache

RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq-dev \
    && docker-php-ext-install pdo_pgsql \
    && rm -rf /var/lib/apt/lists/*

# setelan PHP produksi: galat tidak tampil ke klien, versi PHP tidak diumumkan
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini" \
    && printf 'expose_php = Off\nupload_max_filesize = 2M\npost_max_size = 3M\n' > "$PHP_INI_DIR/conf.d/sortik.ini"

# Render memberi nomor port lewat variabel PORT; Apache membacanya sebagai ${PORT}
ENV PORT=10000
COPY docker/sortik.conf /etc/apache2/sites-available/sortik.conf
# mod_php hanya boleh berjalan dengan mpm_prefork. Matikan MPM lain yang mungkin ikut aktif,
# kalau tidak Apache gagal start dengan "AH00534: More than one MPM loaded".
RUN rm -f /etc/apache2/mods-enabled/mpm_event.* /etc/apache2/mods-enabled/mpm_worker.* \
    && a2enmod mpm_prefork rewrite \
    && a2dissite 000-default \
    && a2ensite sortik \
    && echo 'Listen ${PORT}' > /etc/apache2/ports.conf

WORKDIR /app
COPY backend ./backend
COPY public ./public

# proses kerja Apache berjalan sebagai www-data (bukan root); kode cukup bisa dibaca
RUN chown -R root:root /app && chmod -R a+rX,go-w /app

EXPOSE 10000

# Jaga-jaga saat start: pastikan hanya mpm_prefork yang aktif, lalu jalankan Apache seperti biasa.
CMD ["sh", "-c", "rm -f /etc/apache2/mods-enabled/mpm_event.* /etc/apache2/mods-enabled/mpm_worker.*; exec apache2-foreground"]
