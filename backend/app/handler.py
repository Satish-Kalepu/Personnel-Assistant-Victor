"""API Gateway Lambda adapter."""

import json
import os
from datetime import datetime, timedelta, timezone

import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

from app.core import ApiError, Service, fact_partition, partition
from app.web import web_response

TABLE = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])
MODEL = boto3.client("bedrock-runtime", region_name=os.environ.get("AWS_REGION", "ap-south-1"))


class DynamoRepo:
    def save(self, records):
        with TABLE.batch_writer() as batch:
            for record in records:
                batch.put_item(Item=record)

    def messages(self, subject, mode, conversation_id, limit):
        response = TABLE.query(
            KeyConditionExpression=Key("pk").eq(partition(subject, mode)) & Key("sk").begins_with("MSG#"),
            ScanIndexForward=False,
            Limit=200,
        )
        items = response.get("Items", [])
        if conversation_id:
            items = [item for item in items if item["conversationId"] == conversation_id]
        return list(reversed(items[:limit]))

    def facts(self, subject, limit):
        response = TABLE.query(
            KeyConditionExpression=Key("pk").eq(fact_partition(subject)) & Key("sk").begins_with("FACT#"),
            Limit=limit,
            ConsistentRead=True,
        )
        return response.get("Items", [])

    def get_fact(self, subject, fact_id):
        return TABLE.get_item(
            Key={"pk": fact_partition(subject), "sk": f"FACT#{fact_id}"},
            ConsistentRead=True,
        ).get("Item")

    def delete_fact(self, subject, fact_id):
        TABLE.delete_item(Key={"pk": fact_partition(subject), "sk": f"FACT#{fact_id}"})


class BedrockModel:
    def reply(self, mode, prior, content, facts):
        if mode == "practice":
            system = "You are Victor, a friendly English conversation partner. Help the user practice naturally; gently correct a few important errors. Do not refer to personal memory."
        else:
            system = (
                "You are Victor, a personal assistant. Answer helpfully. Return ONLY JSON with keys "
                "'reply' (string) and 'facts' (array of up to five objects with subject, predicate, object, confidence). "
                "Extract only explicit durable user facts from the current user message, with confidence >= 0.7. "
                "Do not invent facts. Never include passwords, tokens, account numbers, or financial credentials "
                "in facts. Existing memory (unverified, user-correctable): "
                + json.dumps([
                    {key: item[key] for key in ("subject", "predicate", "object")}
                    for item in facts
                ], ensure_ascii=False)
            )
        messages = [
            {"role": item["role"], "content": [{"text": item["content"]}]}
            for item in prior
        ]
        messages.append({"role": "user", "content": [{"text": content}]})
        response = MODEL.converse(
            modelId=os.environ["BEDROCK_MODEL_ID"],
            system=[{"text": system}],
            messages=messages,
            inferenceConfig={"maxTokens": 700, "temperature": 0.3},
        )
        return "".join(block.get("text", "") for block in response["output"]["message"]["content"])


class MonthlyBudget:
    """Atomically reserve a conservative per-chat estimate across devices."""

    def __init__(self):
        self.limit = int(os.environ["MONTHLY_ALLOWANCE_CENTS"])
        self.per_chat = int(os.environ["CHAT_RESERVE_CENTS"])

    def reserve(self, subject):
        month = datetime.now(timezone(timedelta(hours=5, minutes=30))).strftime("%Y-%m")
        remaining = self.limit - self.per_chat
        if remaining < 0:
            raise ApiError(429, "budget_hold", "Monthly processing allowance reached.")
        try:
            TABLE.update_item(
                Key={"pk": f"USER#{subject}#BUDGET#{month}", "sk": "ALLOWANCE"},
                UpdateExpression="ADD reservedCents :amount",
                ConditionExpression="attribute_not_exists(reservedCents) OR reservedCents <= :remaining",
                ExpressionAttributeValues={":amount": self.per_chat, ":remaining": remaining},
            )
        except ClientError as error:
            if error.response.get("Error", {}).get("Code") == "ConditionalCheckFailedException":
                raise ApiError(429, "budget_hold", "Monthly processing allowance reached.") from None
            raise


SERVICE = Service(DynamoRepo(), BedrockModel(), MonthlyBudget())


def result(status, payload):
    return {
        "statusCode": status,
        "headers": {"content-type": "application/json", "cache-control": "no-store"},
        "body": json.dumps(payload, ensure_ascii=False),
    }


def handler(event, _context):
    try:
        route = event.get("routeKey", "")
        if route in {"GET /web", "GET /web/{asset}"}:
            return web_response(event, os.environ["COGNITO_DOMAIN"], os.environ["COGNITO_CLIENT_ID"])
        claims = event["requestContext"]["authorizer"]["jwt"]["claims"]
        subject = claims["sub"]
        if claims.get("token_use") != "access":
            raise ApiError(401, "unauthorized", "Access token required.")
        query = event.get("queryStringParameters") or {}
        body = json.loads(event.get("body") or "{}")
        if not isinstance(body, dict):
            raise ApiError(400, "invalid_body", "JSON object required.")
        if route == "POST /chat":
            return result(200, SERVICE.chat(subject, body))
        if route == "GET /messages":
            return result(200, SERVICE.history(subject, query.get("mode"), query.get("conversationId")))
        if route == "GET /facts":
            return result(200, SERVICE.list_facts(subject))
        if route == "PATCH /facts/{id}":
            return result(200, SERVICE.update_fact(subject, event["pathParameters"]["id"], body))
        if route == "DELETE /facts/{id}":
            return result(200, SERVICE.delete_fact(subject, event["pathParameters"]["id"]))
        raise ApiError(404, "not_found", "Route not found.")
    except ApiError as error:
        return result(error.status, {"error": error.code, "message": error.message})
    except (KeyError, TypeError, ValueError, json.JSONDecodeError):
        return result(400, {"error": "invalid_request", "message": "Invalid request."})
