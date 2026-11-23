#!/bin/bash
set -euo pipefail
printf '%s' "$MONGO_REPLICA_KEY" > /data/configdb/replica.key
chmod 400 /data/configdb/replica.key
chown mongodb:mongodb /data/configdb/replica.key
unset MONGO_REPLICA_KEY
exec /usr/local/bin/docker-entrypoint.sh mongod --replSet rs0 --keyFile /data/configdb/replica.key --bind_ip_all --wiredTigerCacheSizeGB 0.25
