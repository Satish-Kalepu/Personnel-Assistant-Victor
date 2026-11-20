FROM node:24.15.0-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
FROM nginxinc/nginx-unprivileged:1.28.0-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/victor.conf.template
ENV ALB_TRUSTED_CIDR=127.0.0.1/32
EXPOSE 8080
HEALTHCHECK --interval=20s --timeout=4s CMD wget -q -O /dev/null http://127.0.0.1:8080/health || exit 1
ENTRYPOINT ["sh", "-c", "envsubst '${ALB_TRUSTED_CIDR}' < /etc/nginx/victor.conf.template > /tmp/nginx.conf && exec nginx -c /tmp/nginx.conf -g 'daemon off;'"]
