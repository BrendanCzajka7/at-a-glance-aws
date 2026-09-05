import json
import os
import random
import urllib.parse
import urllib.request
from datetime import datetime, timezone

import boto3


BUCKET = "at-a-glance-574152485008-us-east-2-an"

THEMES = [
    "forest mist",
    "pine forest fog",
    "alpine lake mountains",
    "ocean cliff waves",
    "surf beach sunrise",
    "glacier valley",
    "desert canyon dawn",
    "northern lights forest",
    "waterfall jungle",
    "mountain road clouds",
]

PER_THEME = 5

s3 = boto3.client("s3")


def fetch_theme(theme):
    api_key = os.environ["PEXELS_API_KEY"]

    params = urllib.parse.urlencode({
        "query": theme,
        "orientation": "landscape",
        "size": "large",
        "per_page": PER_THEME,
    })

    url = f"https://api.pexels.com/v1/search?{params}"

    request = urllib.request.Request(
        url,
        headers={
            "Authorization": api_key,
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json",
        },
    )

    with urllib.request.urlopen(request, timeout=20) as response:
        return json.load(response).get("photos", [])


def download_image(url):
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0",
        },
    )

    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read()


def lambda_handler(event, context):
    photos_by_id = {}

    # Get photos from Pexels
    for theme in THEMES:
        print(f"Fetching {theme}")

        photos = fetch_theme(theme)

        print(f"Found {len(photos)} photos for {theme}")

        for photo in photos:
            photo_id = photo["id"]

            if photo_id not in photos_by_id:
                photos_by_id[photo_id] = {
                    "id": photo_id,
                    "themes": [],
                    "photographer": photo.get("photographer"),
                    "photographer_url": photo.get("photographer_url"),
                    "pexels_url": photo.get("url"),
                    "src": photo.get("src") or {},
                }

            if theme not in photos_by_id[photo_id]["themes"]:
                photos_by_id[photo_id]["themes"].append(theme)

    photos = list(photos_by_id.values())
    random.shuffle(photos)

    output = []

    # Download each image and save it to S3
    for photo in photos:
        src = photo["src"]

        image_url = (
            src.get("large2x")
            or src.get("large")
            or src.get("landscape")
        )

        if not image_url:
            print(f"Skipping {photo['id']} - no image URL")
            continue

        key = f"images/backgrounds/{photo['id']}.jpg"

        print(f"Downloading {photo['id']}")

        image_bytes = download_image(image_url)

        print(f"Uploading {key}")

        s3.put_object(
            Bucket=BUCKET,
            Key=key,
            Body=image_bytes,
            ContentType="image/jpeg",
            CacheControl="public, max-age=31536000, immutable",
        )

        output.append({
            "id": photo["id"],
            "themes": photo["themes"],
            "key": key,
            "photographer": photo["photographer"],
            "photographer_url": photo["photographer_url"],
            "pexels_url": photo["pexels_url"],
        })

    # Create backgrounds.json
    data = {
        "schema_version": 1,
        "source": "pexels",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "themes": THEMES,
        "photos": output,
    }

    print("Writing data/backgrounds.json")

    s3.put_object(
        Bucket=BUCKET,
        Key="data/backgrounds.json",
        Body=json.dumps(data, indent=2).encode("utf-8"),
        ContentType="application/json",
        CacheControl="no-cache",
    )

    print(f"SUCCESS - saved {len(output)} backgrounds")

    return {
        "statusCode": 200,
        "photos": len(output),
        "themes": len(THEMES),
    }