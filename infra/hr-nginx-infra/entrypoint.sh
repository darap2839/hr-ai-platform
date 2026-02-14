#!/bin/sh
set -e

TEMPLATE_DIR="/etc/nginx/templates"
OUTPUT_DIR="/etc/nginx/conf.d"
VARS='${DOMAIN_NAME} ${LISTEN_BLOCK}'

mkdir -p "$OUTPUT_DIR"

if [ "$SSL" = "true" ]; then
  echo "SSL enabled — using HTTPS listen block and creating redirect"

  CERT_PATH="/etc/ssl/fullchain.pem"
  KEY_PATH="/etc/ssl/privkey.pem"

  if [ ! -f "$CERT_PATH" ] || [ ! -f "$KEY_PATH" ]; then
    echo "SSL certificates not found, generating self-signed certificate for domain $DOMAIN_NAME"

    mkdir -p /etc/ssl

    export OPENSSL_CONF=/dev/null

    openssl req -x509 -nodes -days 365 \
      -subj "/CN=$DOMAIN_NAME" \
      -newkey rsa:2048 \
      -keyout "$KEY_PATH" \
      -out "$CERT_PATH"
  else
    echo "SSL certificates found, using existing files"
  fi

  LISTEN_BLOCK="listen 443 ssl http2;
    ssl_certificate     $CERT_PATH;
    ssl_certificate_key $KEY_PATH;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_stapling off;
    ssl_stapling_verify off;
    # TLS 1.2 ciphers (TLS 1.3 отдельно через ssl_conf_command)
    ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305';
    ssl_prefer_server_ciphers on;

    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1h;
    ssl_ecdh_curve X25519:secp384r1;

    # ALPN/HTTP2 ок, добавим OCSP stapling
#    ssl_stapling on;
#    ssl_stapling_verify on;
    ssl_trusted_certificate $CERT_PATH;

    # TLS 1.3 ciphersuites
    ssl_conf_command Ciphersuites TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256;
  "

  export DOMAIN_NAME LISTEN_BLOCK

  for tpl in "$TEMPLATE_DIR"/*.conf.template; do
    out="$OUTPUT_DIR/$(basename "$tpl" .template)"
    echo "Rendering $tpl → $out"
    envsubst "$VARS" < "$tpl" > "$out"
  done

  redirect_conf="$OUTPUT_DIR/default.conf"
  echo "Generating HTTP→HTTPS redirect: $redirect_conf"
  cat > "$redirect_conf" <<EOF
server {
    listen 80;
    server_name ${DOMAIN_NAME};
    return 301 https://\$host\$request_uri;
}
EOF

else
  echo "SSL disabled — using HTTP only, removing redirect"

  LISTEN_BLOCK="listen 80;"

  export DOMAIN_NAME LISTEN_BLOCK

  for tpl in "$TEMPLATE_DIR"/*.conf.template; do
    out="$OUTPUT_DIR/$(basename "$tpl" .template)"
    echo "Rendering $tpl → $out"
    envsubst "$VARS" < "$tpl" > "$out"
  done

  rm -f "$OUTPUT_DIR/default.conf"
fi

exec "$@"
