#!/bin/bash
set -euo pipefail
umask 077
app="$HOME/victor-stage"
if [ -L "$app" ]; then printf 'Refusing a symlink application path.\n' >&2; exit 1; fi
if [ -e "$app" ] && [ ! -f "$app/.victor-managed" ]; then printf 'Existing directory is not managed by this deployment.\n' >&2; exit 1; fi
mkdir -p "$app"
printf 'victor-stage\n' > "$app/.victor-managed"
for folder in "$app/shared" "$app/releases" "$app/docker-config" "$app/docker-config/cli-plugins"; do
  if [ -L "$folder" ]; then printf 'Refusing symlink deployment subdirectory.\n' >&2; exit 1; fi
  mkdir -p "$folder"
done
printf 'Dedicated user-owned stage directories ready. No system services changed.\n'
