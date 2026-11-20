import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core import ApiError, Service, check_message, parse_personal_answer


class FakeRepo:
    def __init__(self):
        self.records = []

    def save(self, records):
        for record in records:
            self.records = [
                item for item in self.records
                if (item["pk"], item["sk"]) != (record["pk"], record["sk"])
            ]
            self.records.append(record.copy())

    def messages(self, subject, mode, conversation_id, limit):
        prefix = f"USER#{subject}#MODE#{mode}"
        result = [
            item for item in self.records
            if item["pk"] == prefix and item["sk"].startswith("MSG#")
            and (not conversation_id or item["conversationId"] == conversation_id)
        ]
        return sorted(result, key=lambda item: item["sk"])[-limit:]

    def facts(self, subject, limit):
        return [
            item for item in self.records
            if item["pk"] == f"USER#{subject}#FACTS"
        ][:limit]

    def get_fact(self, subject, fact_id):
        return next((item for item in self.facts(subject, 100) if item["id"] == fact_id), None)

    def delete_fact(self, subject, fact_id):
        self.records = [
            item for item in self.records
            if (item["pk"], item["sk"]) != (f"USER#{subject}#FACTS", f"FACT#{fact_id}")
        ]


class FakeModel:
    def __init__(self):
        self.calls = []

    def reply(self, mode, prior, content, facts):
        self.calls.append((mode, prior, content, facts))
        if mode == "practice":
            return "Let's practice English."
        return json.dumps({
            "reply": "I will remember that.",
            "facts": [{
                "subject": "User",
                "predicate": "likes",
                "object": "tea",
                "confidence": 0.9,
            }],
        })


class FakeBudget:
    def __init__(self, limit=2):
        self.limit = limit
        self.reserved = {}

    def reserve(self, subject):
        used = self.reserved.get(subject, 0)
        if used >= self.limit:
            raise ApiError(429, "budget_hold", "Monthly processing allowance reached.")
        self.reserved[subject] = used + 1


class ServiceTests(unittest.TestCase):
    def test_voice_uses_the_same_secret_hold_and_mode_boundary(self):
        class VoiceModel(FakeModel):
            def reply(self, mode, prior, content, facts, voice=False):
                self.voice = voice
                return super().reply(mode, prior, content, facts)
        repo, model = FakeRepo(), VoiceModel()
        service = Service(repo, model)
        service.chat("user-a", {"mode": "practice", "message": "Hello", "voice": True})
        self.assertTrue(model.voice)
        self.assertEqual(model.calls[0][3], [])
        with self.assertRaises(ApiError):
            service.chat("user-a", {"mode": "personal", "message": "my password is a test", "voice": True})
        self.assertEqual(len(model.calls), 1)

    def setUp(self):
        self.repo = FakeRepo()
        self.model = FakeModel()
        self.service = Service(self.repo, self.model)

    def test_personal_fact_has_source_and_can_be_corrected_and_deleted(self):
        result = self.service.chat("user-a", {"mode": "personal", "message": "I like tea."})
        self.assertEqual(result["factsAdded"], 1)
        fact = self.service.list_facts("user-a")["facts"][0]
        source = self.service.history("user-a", "personal", result["conversationId"])["messages"][0]
        self.assertEqual(fact["sourceMessageId"], source["id"])
        self.assertEqual(fact["confidence"], "0.9")
        updated = self.service.update_fact("user-a", fact["id"], {"object": "coffee"})["fact"]
        self.assertEqual(updated["object"], "coffee")
        self.assertTrue(updated["reviewed"])
        self.assertTrue(updated["corrected"])
        self.assertEqual(updated["createdAt"], fact["createdAt"])
        self.service.delete_fact("user-a", fact["id"])
        self.assertEqual(self.service.list_facts("user-a")["facts"], [])

    def test_confirm_fact_preserves_text_and_creation_time(self):
        self.service.chat("user-a", {"mode": "personal", "message": "I like tea."})
        fact = self.service.list_facts("user-a")["facts"][0]
        original = {key: fact[key] for key in ("subject", "predicate", "object", "createdAt")}
        confirmed = self.service.update_fact("user-a", fact["id"], {"reviewed": True})["fact"]
        self.assertTrue(confirmed["reviewed"])
        self.assertIn("reviewedAt", confirmed)
        self.assertNotIn("corrected", confirmed)
        self.assertEqual(original, {key: confirmed[key] for key in original})
        self.service.chat("user-a", {"mode": "personal", "message": "How are you?"})
        self.assertIn(fact["id"], [item["id"] for item in self.model.calls[-1][3]])

    def test_practice_never_receives_personal_history_or_facts(self):
        self.service.chat("user-a", {"mode": "personal", "message": "I like tea."})
        result = self.service.chat("user-a", {"mode": "practice", "message": "How are you?"})
        self.assertEqual(self.model.calls[-1][0], "practice")
        self.assertEqual(self.model.calls[-1][1], [])
        self.assertEqual(self.model.calls[-1][3], [])
        self.assertEqual(self.service.history("user-a", "practice", result["conversationId"])["messages"][0]["content"], "How are you?")
        self.assertEqual(self.service.list_facts("user-a")["facts"][0]["object"], "tea")

    def test_owner_cannot_read_another_owner_records(self):
        self.service.chat("user-a", {"mode": "personal", "message": "I like tea."})
        self.assertEqual(self.service.history("user-b", "personal", None)["messages"], [])
        self.assertEqual(self.service.list_facts("user-b")["facts"], [])

    def test_suspected_secret_is_held_before_model_and_storage(self):
        for message in ("my password is orchid", "account number 1234", "4111 1111 1111 1111"):
            with self.subTest(message=message), self.assertRaises(ApiError) as context:
                self.service.chat("user-a", {"mode": "personal", "message": message})
            self.assertEqual(context.exception.code, "secret_hold")
        self.assertEqual(self.model.calls, [])
        self.assertEqual(self.repo.records, [])

    def test_invalid_mode_and_invalid_fact_are_rejected(self):
        with self.assertRaises(ApiError):
            self.service.chat("user-a", {"mode": "unknown", "message": "Hello"})
        with self.assertRaises(ApiError):
            self.service.update_fact("user-a", "not-a-uuid", {"object": "x"})

    def test_budget_holds_third_chat_across_modes_and_services(self):
        budget = FakeBudget()
        first_phone = Service(self.repo, self.model, budget)
        second_phone = Service(self.repo, self.model, budget)
        first_phone.chat("user-a", {"mode": "personal", "message": "I like tea."})
        second_phone.chat("user-a", {"mode": "practice", "message": "Hello."})
        with self.assertRaises(ApiError) as context:
            first_phone.chat("user-a", {"mode": "personal", "message": "Another question."})
        self.assertEqual(context.exception.code, "budget_hold")
        self.assertEqual(len(self.model.calls), 2)

    def test_secret_hold_does_not_use_allowance(self):
        budget = FakeBudget()
        guarded = Service(self.repo, self.model, budget)
        with self.assertRaises(ApiError):
            guarded.chat("user-a", {"mode": "personal", "message": "my password is orchid"})
        self.assertEqual(budget.reserved, {})

    def test_personal_answer_accepts_one_json_fence_but_rejects_extra_text(self):
        fenced = '```json\n{"reply":"Hello","facts":[]}\n```'
        self.assertEqual(parse_personal_answer(fenced), ("Hello", []))
        with self.assertRaises(ApiError) as context:
            parse_personal_answer(fenced + "\nAdditional commentary")
        self.assertEqual(context.exception.code, "model_format")


if __name__ == "__main__":
    unittest.main()
