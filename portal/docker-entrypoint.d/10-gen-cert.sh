#!/bin/sh
set -eu

CERT_DIR="/etc/nginx/certs"
CERT_CRT="${CERT_DIR}/tls.crt"
CERT_KEY="${CERT_DIR}/tls.key"

mkdir -p "${CERT_DIR}"

if [ ! -s "${CERT_CRT}" ] || [ ! -s "${CERT_KEY}" ]; then
  openssl req -x509 -nodes -newkey rsa:2048 -days 3650 \
    -subj "/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" \
    -keyout "${CERT_KEY}" \
    -out "${CERT_CRT}" >/dev/null 2>&1
fi

