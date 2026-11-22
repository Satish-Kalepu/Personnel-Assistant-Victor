#!/bin/sh
set -eu
set -o pipefail

# The frontend is a read-only Compose mount, published before this container starts.
assets=/usr/share/nginx/html
test -r "$assets/index.html"
test -r "$assets/voice-worklet.js"
test -d "$assets/assets"
find "$assets" -type f | while IFS= read -r file; do
  test -r "$file" || { echo "Unreadable frontend asset: $file" >&2; exit 1; }
done

envsubst '${ALB_TRUSTED_CIDR}' < /etc/nginx/victor.conf.template > /tmp/nginx.conf
nginx -t -c /tmp/nginx.conf
if [ "${1:-}" = --check ]; then exit 0; fi
exec nginx -c /tmp/nginx.conf -g 'daemon off;'
