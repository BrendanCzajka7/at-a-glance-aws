import json
import time
import urllib.parse
import urllib.request
import urllib.error
from datetime import date, datetime, timedelta, timezone

import boto3


BUCKET = "at-a-glance-574152485008-us-east-2-an"

ARTISTS_KEY = "config/artists.json"
OUTPUT_KEY = "data/musicbrainz.gjson"

DAYS_AHEAD = 31

BASE_URL = "https://musicbrainz.org/ws/2/release"

USER_AGENT = (
    "AtAGlance/1.0 "
    "(https://d6ul0xqk7ua47.cloudfront.net)"
)

s3 = boto3.client("s3")


def load_artists():
    response = s3.get_object(
        Bucket=BUCKET,
        Key=ARTISTS_KEY,
    )

    config = json.loads(
        response["Body"].read().decode("utf-8")
    )

    return config["artists"]


def fetch_releases(artist):
    start = date.today()
    end = start + timedelta(days=DAYS_AHEAD)

    query = (
        f'arid:{artist["musicbrainz_artist_id"]} '
        f'AND date:[{start.isoformat()} TO {end.isoformat()}]'
    )

    params = {
        "query": query,
        "fmt": "json",
        "limit": 100,
    }

    url = BASE_URL + "?" + urllib.parse.urlencode(params)

    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "application/json",
        },
    )

    delays = [2, 5]

    for attempt in range(3):
        try:
            with urllib.request.urlopen(
                request,
                timeout=20,
            ) as response:
                data = json.load(response)

            return data.get("releases", [])

        except urllib.error.HTTPError as error:
            if error.code not in (429, 500, 502, 503, 504):
                raise

            if attempt >= 2:
                raise

            delay = delays[attempt]

            print(
                f'RETRY {artist["name"]}: '
                f'HTTP {error.code}, waiting {delay}s'
            )

            time.sleep(delay)

        except (TimeoutError, urllib.error.URLError) as error:
            if attempt >= 2:
                raise

            delay = delays[attempt]

            print(
                f'RETRY {artist["name"]}: '
                f'{type(error).__name__}, waiting {delay}s'
            )

            time.sleep(delay)


def normalize_releases(raw_releases, artist):
    releases = []
    seen = set()

    for raw in raw_releases:
        release_id = raw.get("id")
        title = raw.get("title")
        release_date = raw.get("date")

        if not release_id or not title or not release_date:
            continue

        # Ignore partial dates such as just "2026" or "2026-09".
        try:
            parsed_date = date.fromisoformat(release_date)
        except ValueError:
            continue

        dedupe_key = (
            artist["musicbrainz_artist_id"],
            title.lower().strip(),
            parsed_date.isoformat(),
        )

        if dedupe_key in seen:
            continue

        seen.add(dedupe_key)

        release_group = raw.get("release-group") or {}

        release_type = (
            release_group.get("primary-type")
            or raw.get("status")
        )

        releases.append({
            "id": release_id,
            "artist_name": artist["name"],
            "musicbrainz_artist_id": artist[
                "musicbrainz_artist_id"
            ],
            "title": title,
            "date": parsed_date.isoformat(),
            "status": raw.get("status"),
            "type": release_type,
            "country": raw.get("country"),
            "source_url": (
                f"https://musicbrainz.org/release/{release_id}"
            ),
        })

    return releases


def save_data(artists, releases, failures):
    releases.sort(
        key=lambda item: (
            item["date"],
            item["artist_name"].lower(),
            item["title"].lower(),
        )
    )

    data = {
        "schema_version": 1,
        "source": "musicbrainz",
        "generated_at": datetime.now(
            timezone.utc
        ).isoformat(),
        "days_ahead": DAYS_AHEAD,
        "artists": artists,
        "failed_artists": failures,
        "releases": releases,
    }

    s3.put_object(
        Bucket=BUCKET,
        Key=OUTPUT_KEY,
        Body=json.dumps(
            data,
            indent=2,
        ).encode("utf-8"),
        ContentType="application/json",
        CacheControl="no-cache",
    )


def lambda_handler(event, context):
    artists = load_artists()

    all_releases = []
    failures = []

    for index, artist in enumerate(artists):
        try:
            raw_releases = fetch_releases(artist)

            releases = normalize_releases(
                raw_releases,
                artist,
            )

            all_releases.extend(releases)

            print(
                f'OK {artist["name"]}: '
                f'{len(releases)} releases'
            )

        except Exception as error:
            print(
                f'ERROR {artist.get("name")}: '
                f'{type(error).__name__}: {error}'
            )

            failures.append(artist.get("name"))

        # MusicBrainz asks clients not to hammer the API.
        if index < len(artists) - 1:
            time.sleep(1.1)

    save_data(
        artists,
        all_releases,
        failures,
    )

    return {
        "processed_artists": len(artists),
        "total_releases": len(all_releases),
    }