# Manual stage Nginx update

Only edit the existing TLS server block whose server_name is ai_test.satishk.com in /etc/nginx/nginx.conf. Keep its listen, certificate and certificate-key directives and all other sites unchanged.

Replace its location / and any existing exact /voice location with the two blocks in [ai_test.locations.conf](../deploy/nginx/ai_test.locations.conf). Paste them inside that server block; they are not a full nginx.conf. Do not add duplicate location blocks.

Back up the existing file before editing. After editing:

```sh
sudo nginx -t && sudo systemctl reload nginx
```

Reload only when syntax validation succeeds. The app stays on loopback port 18080; do not publish MongoDB, Redis or the mail viewer. No ALB is used by the current domain route. The app trusts only this Docker edge gateway (172.19.0.1/32) for forwarded client addresses; recheck it if the dedicated network is recreated. X-Forwarded-For is overwritten with the TLS peer address to avoid trusting client-supplied values. This exact configuration assumes direct client-to-host TLS; review it before inserting an ALB/CDN.

SMTP TLS/authentication passed from the operator laptop without sending an email. The app now uses the HTTPS origin and production Secure cookies. SMTP TLS/authentication also passed from the EC2 app. The fragment passed the host Nginx 1.22.1 syntax check using an isolated unprivileged test configuration; the complete real proxy configuration must still pass the administrator command above. Actual inbox delivery, verified sender policy, bounce/suppression and browser/Pixel voice acceptance still require testing.
