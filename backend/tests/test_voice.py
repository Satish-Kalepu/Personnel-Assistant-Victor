import sys
import unittest
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.core import ApiError
from app.voice import VoiceService


class Budget:
    def __init__(self):
        self.calls = []
    def reserve(self, subject, amount):
        self.calls.append((subject, amount))


class Repo:
    def __init__(self, reply):
        self.reply = reply
    def get_message(self, subject, mode, key):
        if subject == "owner" and mode == "personal" and key == self.reply["sk"]:
            return self.reply


class VoiceTests(unittest.TestCase):
    def setUp(self):
        self.reply = {
            "id": str(uuid.uuid4()), "createdAt": "2026-11-19T12:00:00.000+00:00",
            "role": "assistant", "content": "Hello. How can I help?",
        }
        self.reply["sk"] = f'MSG#{self.reply["createdAt"]}#1#{self.reply["id"]}'
        self.budget = Budget()
        self.voice = VoiceService(Repo(self.reply), self.budget, "wss://voice.example.test/voice")
        self.body = {"mode": "personal", "messageId": self.reply["id"], "createdAt": self.reply["createdAt"]}

    def test_disabled_gateway_has_no_reservation(self):
        disabled = VoiceService(Repo(self.reply), self.budget, "")
        with self.assertRaises(ApiError) as caught:
            disabled.session("owner", {"mode": "personal"})
        self.assertEqual(caught.exception.status, 503)
        self.assertEqual(self.budget.calls, [])

    def test_session_reserves_shared_budget_and_has_bounded_duration(self):
        self.assertEqual(self.voice.session("owner", {"mode": "practice"})["maxSeconds"], 300)
        self.assertEqual(self.budget.calls, [("owner", 10)])
        with self.assertRaises(ApiError):
            self.voice.session("owner", {"mode": "unknown"})
        self.assertEqual(len(self.budget.calls), 1)

    def test_speech_only_uses_owned_saved_reply_not_submitted_text(self):
        response = self.voice.speech("owner", {**self.body, "text": "arbitrary synthesis input"})
        self.assertEqual(response["text"], self.reply["content"])
        self.assertEqual(self.budget.calls, [("owner", 1)])

    def test_other_subject_mode_and_non_assistant_are_rejected(self):
        for subject, body in (("other", self.body), ("owner", {**self.body, "mode": "practice"})):
            with self.assertRaises(ApiError) as caught:
                self.voice.speech(subject, body)
            self.assertEqual(caught.exception.status, 404)
        self.reply["role"] = "user"
        with self.assertRaises(ApiError):
            self.voice.speech("owner", self.body)
        self.assertEqual(self.budget.calls, [])

    def test_confidential_reply_is_held_before_synthesis_reservation(self):
        self.reply["content"] = "The password is a synthetic test value."
        with self.assertRaises(ApiError) as caught:
            self.voice.speech("owner", self.body)
        self.assertEqual(caught.exception.code, "secret_hold")
        self.assertEqual(self.budget.calls, [])

    def test_bad_message_reference_is_not_a_table_key_escape(self):
        for body in ({**self.body, "createdAt": "../other"}, {**self.body, "messageId": "invalid"}, {"mode": "personal"}):
            with self.assertRaises(ApiError) as caught:
                self.voice.speech("owner", body)
            self.assertEqual(caught.exception.status, 400)
        self.assertEqual(self.budget.calls, [])

    def test_longer_speech_reservation_is_proportional(self):
        self.reply["content"] = "A useful ordinary response. " * 100
        self.voice.speech("owner", self.body)
        self.assertEqual(self.budget.calls[-1], ("owner", 6))
