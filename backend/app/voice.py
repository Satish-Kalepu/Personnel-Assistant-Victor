"""Speech configuration, shared allowance, and owned-reply checks.

Sarvam audio connections live in voice-gateway, not in the HTTP Lambda.
"""
import math
import re
import uuid
from datetime import datetime

from app.core import ApiError, check_message, partition


class VoiceService:
    def __init__(self, repo, budget, gateway_url):
        self.repo, self.budget, self.gateway_url = repo, budget, gateway_url

    def config(self):
        return {"gatewayUrl": self.gateway_url, "provider": "sarvam", "language": "en-IN"}

    def session(self, subject, body):
        partition(subject, body.get("mode"))
        if not self.gateway_url:
            raise ApiError(503, "voice_unavailable", "Voice is not enabled yet. Text chat is available.")
        # Five minutes maximum; pessimistic reservation, not the provider invoice.
        self.budget.reserve(subject, 10)
        return {"maxSeconds": 300, "sampleRate": 16000}

    def speech(self, subject, body):
        mode = body.get("mode")
        partition(subject, mode)
        if not self.gateway_url:
            raise ApiError(503, "voice_unavailable", "Voice is not enabled yet.")
        message_id, created_at = body.get("messageId"), body.get("createdAt")
        try:
            uuid.UUID(message_id)
            if not isinstance(created_at, str) or not re.fullmatch(r"[0-9T:.+Z-]{20,40}", created_at):
                raise ValueError()
            datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        except (ValueError, TypeError, AttributeError):
            raise ApiError(400, "invalid_message", "Choose a reply to read aloud.") from None
        reply = self.repo.get_message(subject, mode, f"MSG#{created_at}#1#{message_id}")
        if not reply or reply.get("role") != "assistant":
            raise ApiError(404, "not_found", "Reply not found.")
        text = check_message(reply.get("content"))
        # At research rates, INR 1/1k chars. INR 60/USD is a deliberately
        # conservative conversion assumption, not an exchange-rate quotation.
        self.budget.reserve(subject, max(1, math.ceil(len(text) / 1000 * 2)))
        return {"text": text}
