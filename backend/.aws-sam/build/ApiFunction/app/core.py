"""Pure Phase 1 behavior; AWS adapters live in handler.py."""

import json
import re
import uuid
from datetime import datetime, timezone

MODES = {"personal", "practice"}
MAX_MESSAGE = 4000
SECRET_CUE = re.compile(
    r"(?i)\b(password|passcode|pin|otp|secret|api[_ -]?key|token|credential|"
    r"account\s*(?:number|no\.?|#)|iban|cvv|card\s*number|routing\s*number)\b"
)
ACCOUNT_SHAPE = re.compile(r"(?<!\w)(?:\d[ -]?){9,18}(?!\w)")
JSON_FENCE = re.compile(r"\A```(?:json)?[ \t]*\r?\n(?P<body>.*?)\r?\n```\Z", re.IGNORECASE | re.DOTALL)


class ApiError(Exception):
    def __init__(self, status, code, message):
        super().__init__(message)
        self.status = status
        self.code = code
        self.message = message


def now():
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds")


def partition(subject, mode):
    if not subject or mode not in MODES:
        raise ApiError(400, "invalid_mode", "Choose Personal or English Practice.")
    return f"USER#{subject}#MODE#{mode}"


def fact_partition(subject):
    return f"USER#{subject}#FACTS"


def check_message(value):
    if not isinstance(value, str) or not value.strip() or len(value) > MAX_MESSAGE:
        raise ApiError(400, "invalid_message", f"Message must be 1–{MAX_MESSAGE} characters.")
    if SECRET_CUE.search(value) or ACCOUNT_SHAPE.search(value):
        raise ApiError(
            422,
            "secret_hold",
            "This may contain a password or account detail. Secret saving and passkey access are not enabled in Phase 1; the message was not sent or saved.",
        )
    return value.strip()


def message_record(subject, mode, role, content, conversation_id, timestamp):
    message_id = str(uuid.uuid4())
    turn_order = "0" if role == "user" else "1"
    return {
        "pk": partition(subject, mode),
        "sk": f"MSG#{timestamp}#{turn_order}#{message_id}",
        "id": message_id,
        "conversationId": conversation_id,
        "role": role,
        "content": content,
        "createdAt": timestamp,
    }


def fact_record(subject, source, raw):
    if not isinstance(raw, dict):
        return None
    fields = [raw.get(key) for key in ("subject", "predicate", "object")]
    if any(not isinstance(field, str) or not field.strip() or len(field) > 160 for field in fields):
        return None
    if any(SECRET_CUE.search(field) or ACCOUNT_SHAPE.search(field) for field in fields):
        return None
    try:
        confidence = float(raw.get("confidence", 0))
    except (TypeError, ValueError):
        return None
    if not 0.7 <= confidence <= 1:
        return None
    fact_id = str(uuid.uuid4())
    return {
        "pk": fact_partition(subject),
        "sk": f"FACT#{fact_id}",
        "id": fact_id,
        "subject": fields[0].strip(),
        "predicate": fields[1].strip(),
        "object": fields[2].strip(),
        "confidence": str(round(confidence, 3)),
        "sourceMessageId": source["id"],
        "sourceConversationId": source["conversationId"],
        "createdAt": now(),
        "updatedAt": now(),
    }


def parse_personal_answer(text):
    if isinstance(text, str):
        fenced = JSON_FENCE.fullmatch(text.strip())
        if fenced:
            text = fenced.group("body")
    try:
        payload = json.loads(text)
    except (TypeError, ValueError):
        raise ApiError(502, "model_format", "Victor could not parse the model response. Try again.")
    if not isinstance(payload, dict) or not isinstance(payload.get("reply"), str):
        raise ApiError(502, "model_format", "Victor could not parse the model response. Try again.")
    facts = payload.get("facts", [])
    return payload["reply"][:MAX_MESSAGE], facts if isinstance(facts, list) else []


class Service:
    def __init__(self, repo, model, budget=None):
        self.repo = repo
        self.model = model
        self.budget = budget

    def chat(self, subject, body):
        mode = body.get("mode")
        partition(subject, mode)
        content = check_message(body.get("message"))
        conversation_id = body.get("conversationId") or str(uuid.uuid4())
        try:
            uuid.UUID(conversation_id)
        except (ValueError, TypeError):
            raise ApiError(400, "invalid_conversation", "Invalid conversation ID.")
        prior = self.repo.messages(subject, mode, conversation_id, 12)
        facts = self.repo.facts(subject, 30) if mode == "personal" else []
        if self.budget:
            self.budget.reserve(subject)
        reply_text = self.model.reply(mode, prior, content, facts)
        if mode == "personal":
            reply, proposals = parse_personal_answer(reply_text)
        else:
            reply, proposals = reply_text[:MAX_MESSAGE], []
        if not reply.strip():
            raise ApiError(502, "empty_reply", "Victor did not return a reply. Try again.")
        turn_timestamp = now()
        source = message_record(subject, mode, "user", content, conversation_id, turn_timestamp)
        answer = message_record(subject, mode, "assistant", reply, conversation_id, turn_timestamp)
        records = [source, answer]
        for raw in proposals[:5]:
            fact = fact_record(subject, source, raw)
            if fact:
                records.append(fact)
        self.repo.save(records)
        return {"conversationId": conversation_id, "reply": answer, "factsAdded": len(records) - 2}

    def history(self, subject, mode, conversation_id):
        partition(subject, mode)
        if conversation_id:
            try:
                uuid.UUID(conversation_id)
            except (ValueError, TypeError):
                raise ApiError(400, "invalid_conversation", "Invalid conversation ID.")
        return {"messages": self.repo.messages(subject, mode, conversation_id, 100)}

    def list_facts(self, subject):
        return {"facts": self.repo.facts(subject, 100)}

    def update_fact(self, subject, fact_id, body):
        try:
            uuid.UUID(fact_id)
        except (ValueError, TypeError):
            raise ApiError(400, "invalid_fact", "Invalid fact ID.")
        current = self.repo.get_fact(subject, fact_id)
        if not current:
            raise ApiError(404, "not_found", "Fact not found.")
        if "reviewed" in body and body["reviewed"] is not True:
            raise ApiError(400, "invalid_fact", "reviewed must be true when provided.")
        if not any(key in body for key in ("subject", "predicate", "object")) and body.get("reviewed") is not True:
            raise ApiError(400, "invalid_fact", "Provide a correction or reviewed=true.")
        proposed = {key: body.get(key, current[key]) for key in ("subject", "predicate", "object")}
        if any(proposed[key] != current[key] for key in proposed):
            proposed["confidence"] = current["confidence"]
            checked = fact_record(subject, {"id": current["sourceMessageId"], "conversationId": current["sourceConversationId"]}, proposed)
            if not checked:
                raise ApiError(400, "invalid_fact", "Fact fields are invalid or may contain confidential details.")
            current.update({key: checked[key] for key in ("subject", "predicate", "object")})
            current["corrected"] = True
        reviewed_at = now()
        current["reviewed"] = True
        current["reviewedAt"] = reviewed_at
        current["updatedAt"] = reviewed_at
        self.repo.save([current])
        return {"fact": current}

    def delete_fact(self, subject, fact_id):
        self.repo.delete_fact(subject, fact_id)
        return {"deleted": True}
