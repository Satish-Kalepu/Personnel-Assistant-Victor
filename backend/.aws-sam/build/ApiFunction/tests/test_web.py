"""Web shell only exposes static assets and public connection settings."""

import sys
import unittest
from pathlib import Path


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.web import web_response  # noqa: E402


class WebResponseTests(unittest.TestCase):
    def call(self, route, asset=None):
        event = {
            "routeKey": route,
            "requestContext": {"domainName": "example.execute-api.ap-south-1.amazonaws.com", "stage": "v1"},
            "pathParameters": {"asset": asset} if asset else None,
        }
        return web_response(event, "https://signin.example.test", "public-client-id")

    def test_page_redirect_and_html(self):
        redirect = self.call("GET /web")
        self.assertEqual(302, redirect["statusCode"])
        self.assertEqual("https://example.execute-api.ap-south-1.amazonaws.com/v1/web/index.html", redirect["headers"]["location"])
        page = self.call("GET /web/{asset}", "index.html")
        self.assertEqual(200, page["statusCode"])
        self.assertIn("text/html", page["headers"]["content-type"])
        self.assertIn('id="chat-form"', page["body"])
        self.assertIn("frame-ancestors 'none'", page["headers"]["content-security-policy"])

    def test_config_contains_only_public_settings(self):
        response = self.call("GET /web/{asset}", "config.js")
        self.assertEqual(200, response["statusCode"])
        self.assertIn("public-client-id", response["body"])
        self.assertIn("/v1", response["body"])
        self.assertNotIn("secret", response["body"].lower())

    def test_unknown_asset_is_not_read(self):
        response = self.call("GET /web/{asset}", "../app/core.py")
        self.assertEqual(404, response["statusCode"])


if __name__ == "__main__":
    unittest.main()
