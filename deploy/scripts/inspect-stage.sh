#!/bin/bash
set -eu
printf 'OS/architecture\n'
. /etc/os-release
printf '%s %s\n' "$PRETTY_NAME" "$(uname -m)"
printf 'Available capacity\n'
free -m
df -h / "$HOME"
printf 'Docker containers (metadata only)\n'
docker ps -a --format '{{.Names}} {{.Image}} {{.Status}} {{.Ports}}'
printf 'Listening ports\n'
netstat -lnt 2>/dev/null
printf 'User tool availability\n'
for tool in curl sha256sum tar gzip node python3; do command -v "$tool" || true; done
printf 'Application paths\n'
if [ -e "$HOME/victor-stage" ]; then ls -ld "$HOME/victor-stage"; else printf 'Dedicated app directory does not exist yet.\n'; fi
