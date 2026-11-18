"""Small public web shell for the authenticated Victor API."""

import json
from pathlib import Path


ASSETS = {
    "index.html": "text/html; charset=utf-8",
    "app.js": "application/javascript; charset=utf-8",
    "styles.css": "text/css; charset=utf-8",
}
WEB_DIR = Path(__file__).resolve().parent.parent / "web"


def web_response(event, cognito_domain, client_id):
    context = event["requestContext"]
    base = f'https://{context["domainName"]}/{context["stage"]}'
    headers = {
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
        "x-frame-options": "DENY",
        "referrer-policy": "no-referrer",
        "strict-transport-security": "max-age=31536000; includeSubDomains",
        "content-security-policy": (
            "default-src 'none'; script-src 'self'; style-src 'self'; "
            f"connect-src 'self' {cognito_domain}; "
            "base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
        ),
    }
    route = event.get("routeKey")
    if route == "GET /web":
        return {"statusCode": 302, "headers": {**headers, "location": f"{base}/web/index.html"}, "body": ""}
    if route == "GET /web/{asset}":
        name = (event.get("pathParameters") or {}).get("asset")
        if name == "config.js":
            content_type = "application/javascript; charset=utf-8"
            body = "window.VICTOR_CONFIG = " + json.dumps({
                "apiBaseUrl": base,
                "cognitoDomain": cognito_domain,
                "clientId": client_id,
            }) + ";"
        elif name in ASSETS:
            content_type = ASSETS[name]
            body = (WEB_DIR / name).read_text(encoding="utf-8")
        else:
            return {"statusCode": 404, "headers": headers, "body": "Not found."}
    else:
        return {"statusCode": 404, "headers": headers, "body": "Not found."}
    return {"statusCode": 200, "headers": {**headers, "content-type": content_type}, "body": body}
