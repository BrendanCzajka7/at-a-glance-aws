import json
import math
import os
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

import boto3


BUCKET = "at-a-glance-574152485008-us-east-2-an"
LOCATIONS_KEY = "config/locations.json"

RADIUS_MILES = 75
DAYS_AHEAD = 5

TICKETMASTER_URL = "https://app.ticketmaster.com/discovery/v2/events.json"

_BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz"

s3 = boto3.client("s3")


def load_locations():
    response = s3.get_object(
        Bucket=BUCKET,
        Key=LOCATIONS_KEY,
    )

    return json.loads(
        response["Body"].read().decode("utf-8")
    )["locations"]


def encode_geohash(latitude, longitude, precision=9):
    lat_interval = [-90.0, 90.0]
    lon_interval = [-180.0, 180.0]

    geohash = []
    bits = [16, 8, 4, 2, 1]

    bit = 0
    char_value = 0
    even_bit = True

    while len(geohash) < precision:
        if even_bit:
            mid = sum(lon_interval) / 2

            if longitude >= mid:
                char_value |= bits[bit]
                lon_interval[0] = mid
            else:
                lon_interval[1] = mid

        else:
            mid = sum(lat_interval) / 2

            if latitude >= mid:
                char_value |= bits[bit]
                lat_interval[0] = mid
            else:
                lat_interval[1] = mid

        even_bit = not even_bit

        if bit < 4:
            bit += 1
        else:
            geohash.append(_BASE32[char_value])
            bit = 0
            char_value = 0

    return "".join(geohash)


def distance_miles(lat1, lon1, lat2, lon2):
    earth_radius_miles = 3958.8

    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)

    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat1_rad)
        * math.cos(lat2_rad)
        * math.sin(delta_lon / 2) ** 2
    )

    c = 2 * math.atan2(
        math.sqrt(a),
        math.sqrt(1 - a),
    )

    return earth_radius_miles * c


def safe_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def pick_best_image(images):
    if not images:
        return None

    landscape = [
        image
        for image in images
        if image.get("ratio") == "16_9"
        and image.get("url")
    ]

    choices = landscape or [
        image
        for image in images
        if image.get("url")
    ]

    if not choices:
        return None

    return max(
        choices,
        key=lambda image: image.get("width", 0),
    ).get("url")


def fetch_ticketmaster_events(location):
    api_key = os.environ["TICKETMASTER_API_KEY"]

    start = datetime.now(timezone.utc)
    end = start + timedelta(days=DAYS_AHEAD)

    geo_point = encode_geohash(
        location["latitude"],
        location["longitude"],
    )

    params = {
        "apikey": api_key,
        "classificationName": "music",
        "geoPoint": geo_point,
        "radius": RADIUS_MILES,
        "unit": "miles",
        "countryCode": "US",
        "sort": "date,asc",
        "size": 100,
        "startDateTime": start.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "endDateTime": end.strftime("%Y-%m-%dT%H:%M:%SZ"),
    }

    url = (
        TICKETMASTER_URL
        + "?"
        + urllib.parse.urlencode(params)
    )

    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "At-a-Glance/1.0",
            "Accept": "application/json",
        },
    )

    with urllib.request.urlopen(
        request,
        timeout=20,
    ) as response:
        data = json.load(response)

    return data.get("_embedded", {}).get("events", [])


def normalize_events(raw_events, location):
    events = []
    seen = set()

    for raw in raw_events:
        event_id = raw.get("id")
        name = raw.get("name")

        if not event_id or not name:
            continue

        if event_id in seen:
            continue

        seen.add(event_id)

        start = (
            (raw.get("dates") or {})
            .get("start")
            or {}
        )

        event_date = start.get("localDate")
        event_time = start.get("localTime")

        if not event_date:
            continue

        venues = (
            (raw.get("_embedded") or {})
            .get("venues")
            or []
        )

        if not venues:
            continue

        venue = venues[0]

        location_data = venue.get("location") or {}

        latitude = safe_float(
            location_data.get("latitude")
        )

        longitude = safe_float(
            location_data.get("longitude")
        )

        if latitude is None or longitude is None:
            continue

        distance = distance_miles(
            location["latitude"],
            location["longitude"],
            latitude,
            longitude,
        )

        if distance > RADIUS_MILES:
            continue

        classification = (
            raw.get("classifications") or [{}]
        )[0]

        genre = (
            classification.get("genre") or {}
        ).get("name")

        sub_genre = (
            classification.get("subGenre") or {}
        ).get("name")

        city = (
            venue.get("city") or {}
        ).get("name")

        state = (
            venue.get("state") or {}
        ).get("stateCode")

        events.append({
            "id": event_id,
            "name": name,
            "date": event_date,
            "time": event_time,
            "venue": venue.get("name"),
            "city": city,
            "state": state,
            "distance_miles": round(distance, 1),
            "genre": genre,
            "sub_genre": sub_genre,
            "image_url": pick_best_image(
                raw.get("images") or []
            ),
            "ticket_url": raw.get("url"),
        })

    events.sort(
        key=lambda event: (
            event["date"],
            event["time"] or "",
        )
    )

    return events


def save_location_events(location, events):
    data = {
        "schema_version": 1,
        "source": "ticketmaster",
        "generated_at": datetime.now(
            timezone.utc
        ).isoformat(),
        "location_key": location["key"],
        "location_name": location["name"],
        "radius_miles": RADIUS_MILES,
        "days_ahead": DAYS_AHEAD,
        "events": events,
    }

    key = (
        f'data/ticketmaster/'
        f'{location["key"]}.json'
    )

    s3.put_object(
        Bucket=BUCKET,
        Key=key,
        Body=json.dumps(
            data,
            indent=2
        ).encode("utf-8"),
        ContentType="application/json",
        CacheControl="no-cache",
    )


def lambda_handler(event, context):
    locations = load_locations()

    failures = []
    total_events = 0

    for location in locations:
        try:
            raw_events = fetch_ticketmaster_events(
                location
            )

            events = normalize_events(
                raw_events,
                location,
            )

            save_location_events(
                location,
                events,
            )

            total_events += len(events)

            print(
                f'OK {location["key"]}: '
                f'{len(events)} events'
            )

        except Exception as error:
            print(
                f'ERROR {location.get("key")}: '
                f'{type(error).__name__}: {error}'
            )

            failures.append(location.get("key"))

    if failures:
        raise RuntimeError(
            "Ticketmaster failed for: "
            + ", ".join(failures)
        )

    return {
        "processed_locations": len(locations),
        "total_events": total_events,
    }