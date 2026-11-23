FROM node:24.15.0-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
FROM nginxinc/nginx-unprivileged:1.28.0-alpine
COPY --chown=nginx:nginx nginx.conf.template /etc/nginx/victor.conf.template
COPY --chown=nginx:nginx start.sh /etc/nginx/victor-start.sh
ENV ALB_TRUSTED_CIDR=127.0.0.1/32
EXPOSE 8080
HEALTHCHECK --interval=20s --timeout=4s CMD wget -q -O /dev/null http://127.0.0.1:8080/health || exit 1
ENTRYPOINT ["sh", "/etc/nginx/victor-start.sh"]
