import json
import os
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta, timezone

import boto3


BUCKET = "at-a-glance-574152485008-us-east-2-an"
CONFIG_KEY = "config/tmdb.json"
OUTPUT_KEY = "data/tmdb.json"

BASE_URL = "https://api.themoviedb.org/3"
IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"

GENRE_DAYS_AHEAD = 2
DIRECTOR_DAYS_AHEAD = 30

s3 = boto3.client("s3")


def load_config():
    response = s3.get_object(
        Bucket=BUCKET,
        Key=CONFIG_KEY,
    )

    return json.loads(
        response["Body"].read().decode("utf-8")
    )


def tmdb_get(path, params=None):
    api_key = os.environ["TMDB_API_KEY"]

    query = dict(params or {})
    query["api_key"] = api_key

    url = (
        f"{BASE_URL}{path}?"
        + urllib.parse.urlencode(query)
    )

    request = urllib.request.Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": "AtAGlance/1.0",
        },
    )

    with urllib.request.urlopen(
        request,
        timeout=20,
    ) as response:
        return json.loads(
            response.read().decode("utf-8")
        )


def discover_movies(extra_params, days_ahead):
    start = date.today()
    end = start + timedelta(days=days_ahead)

    params = {
        "include_adult": "false",
        "include_video": "false",
        "language": "en-US",
        "page": 1,
        "sort_by": "primary_release_date.asc",
        "region": "US",
        "with_release_type": "2|3",
        "primary_release_date.gte": start.isoformat(),
        "primary_release_date.lte": end.isoformat(),
        **extra_params,
    }

    data = tmdb_get(
        "/discover/movie",
        params,
    )

    return data.get("results", [])


def add_movies(
    movies_by_id,
    raw_movies,
    match_kind,
    match_id,
    match_name,
):
    for raw in raw_movies:
        movie_id = raw.get("id")
        title = raw.get("title")
        release_date = raw.get("release_date")

        if not movie_id or not title or not release_date:
            continue

        if movie_id not in movies_by_id:
            poster_path = raw.get("poster_path")

            movies_by_id[movie_id] = {
                "id": movie_id,
                "title": title,
                "overview": raw.get("overview"),
                "release_date": release_date,
                "poster_url": (
                    f"{IMAGE_BASE_URL}{poster_path}"
                    if poster_path
                    else None
                ),
                "vote_average": raw.get("vote_average"),
                "popularity": raw.get("popularity"),
                "source_url": (
                    f"https://www.themoviedb.org/movie/{movie_id}"
                ),
                "matches": [],
            }

        movie = movies_by_id[movie_id]

        match = {
            "kind": match_kind,
            "id": match_id,
            "name": match_name,
        }

        if match not in movie["matches"]:
            movie["matches"].append(match)


def save_data(config, movies):
    enabled_genres = [
        {
            "id": item["id"],
            "name": item["name"],
        }
        for item in config.get("genres", [])
        if item.get("enabled", True)
    ]

    enabled_directors = [
        {
            "id": item["id"],
            "name": item["name"],
        }
        for item in config.get("directors", [])
        if item.get("enabled", True)
    ]

    data = {
        "schema_version": 1,
        "source": "tmdb",
        "generated_at": datetime.now(
            timezone.utc
        ).isoformat(),
        "days_ahead": {
            "genres": GENRE_DAYS_AHEAD,
            "directors": DIRECTOR_DAYS_AHEAD,
        },
        "filters": {
            "genres": enabled_genres,
            "directors": enabled_directors,
        },
        "movies": sorted(
            movies,
            key=lambda movie: (
                movie["release_date"],
                movie["title"].lower(),
            ),
        ),
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
    config = load_config()

    movies_by_id = {}

    genres = [
        item
        for item in config.get("genres", [])
        if item.get("enabled", True)
    ]

    directors = [
        item
        for item in config.get("directors", [])
        if item.get("enabled", True)
    ]

    failures = []

    for genre in genres:
        try:
            raw_movies = discover_movies(
                {
                    "with_genres": str(
                        genre["id"]
                    )
                },
                GENRE_DAYS_AHEAD,
            )

            add_movies(
                movies_by_id,
                raw_movies,
                "genre",
                genre["id"],
                genre["name"],
            )

            print(
                f"OK genre {genre['name']}: "
                f"{len(raw_movies)} movies"
            )

        except Exception as exc:
            print(
                f"ERROR genre {genre['name']}: {exc}"
            )
            failures.append(
                f"genre:{genre['name']}"
            )

    for director in directors:
        try:
            raw_movies = discover_movies(
                {
                    "with_crew": str(
                        director["id"]
                    )
                },
                DIRECTOR_DAYS_AHEAD,
            )

            add_movies(
                movies_by_id,
                raw_movies,
                "director",
                director["id"],
                director["name"],
            )

            print(
                f"OK director {director['name']}: "
                f"{len(raw_movies)} movies"
            )

        except Exception as exc:
            print(
                f"ERROR director "
                f"{director['name']}: {exc}"
            )
            failures.append(
                f"director:{director['name']}"
            )

    if failures:
        raise RuntimeError(
            "TMDB fetch failed for: "
            + ", ".join(failures)
        )

    movies = list(
        movies_by_id.values()
    )

    save_data(
        config,
        movies,
    )

    return {
        "genres": len(genres),
        "directors": len(directors),
        "total_movies": len(movies),
    }