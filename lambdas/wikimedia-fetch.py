import json
import urllib.request
from datetime import datetime, timedelta, timezone

import boto3


BUCKET = "at-a-glance-574152485008-us-east-2-an"
OUTPUT_PREFIX = "data/wikimedia"

BASE_URL = "https://en.wikipedia.org/api/rest_v1/feed/onthisday"

USER_AGENT = (
    "AtAGlance/1.0 "
    "(personal daily knowledge dashboard)"
)

ITEMS_PER_GROUP = 5
DAYS_TO_GENERATE = 3

s3 = boto3.client("s3")


def trim(value, max_length):
    if not value:
        return None

    clean = " ".join(value.split())

    if len(clean) <= max_length:
        return clean

    return clean[: max_length - 1].rstrip() + "…"


def normalize_item(kind, item):
    pages = item.get("pages") or []
    primary_page = pages[0] if pages else {}

    title = (
        primary_page.get("normalizedtitle")
        or primary_page.get(
            "titles", {}
        ).get("normalized")
        or primary_page.get("displaytitle")
        or primary_page.get("title")
    )

    source_url = (
        primary_page
        .get("content_urls", {})
        .get("desktop", {})
        .get("page")
    )

    return {
        "year": item.get("year"),
        "text": trim(
            item.get("text"),
            220,
        ),
        "title": title,
        "source_url": source_url,
        "kind": kind,
    }


def pick_items(kind, items):
    candidates = [
        item
        for item in items
        if item.get("text")
        and item.get("year") is not None
    ]

    candidates = sorted(
        candidates,
        key=lambda item: (
            len(item.get("text", "")) < 45,
            len(item.get("text", "")),
        ),
    )

    return [
        normalize_item(kind, item)
        for item in candidates[:ITEMS_PER_GROUP]
    ]


def fetch_day(target_date):
    month = f"{target_date.month:02d}"
    day = f"{target_date.day:02d}"

    url = (
        f"{BASE_URL}/all/"
        f"{month}/{day}"
    )

    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "application/json",
        },
    )

    with urllib.request.urlopen(
        request,
        timeout=20,
    ) as response:
        data = json.load(response)

    return {
        "schema_version": 1,
        "source": "wikimedia",
        "generated_at": datetime.now(
            timezone.utc
        ).isoformat(),
        "date": target_date.isoformat(),
        "selected": pick_items(
            "selected",
            data.get("selected", []),
        ),
        "events": pick_items(
            "events",
            data.get("events", []),
        ),
        "births": pick_items(
            "births",
            data.get("births", []),
        ),
        "deaths": pick_items(
            "deaths",
            data.get("deaths", []),
        ),
    }


def write_day(target_date, output):
    key = (
        f"{OUTPUT_PREFIX}/"
        f"{target_date.isoformat()}.json"
    )

    s3.put_object(
        Bucket=BUCKET,
        Key=key,
        Body=json.dumps(
            output,
            ensure_ascii=False,
            indent=2,
        ).encode("utf-8"),
        ContentType="application/json",
        CacheControl="no-cache",
    )

    return key


def lambda_handler(event, context):
    today = datetime.now(
        timezone.utc
    ).date()

    written = []

    for offset in range(DAYS_TO_GENERATE):
        target_date = (
            today
            + timedelta(days=offset)
        )

        output = fetch_day(
            target_date
        )

        key = write_day(
            target_date,
            output,
        )

        written.append({
            "date": target_date.isoformat(),
            "key": key,
            "selected": len(
                output["selected"]
            ),
            "events": len(
                output["events"]
            ),
            "births": len(
                output["births"]
            ),
            "deaths": len(
                output["deaths"]
            ),
        })

    return {
        "statusCode": 200,
        "body": json.dumps({
            "generated_days": len(written),
            "files": written,
        }),
    }