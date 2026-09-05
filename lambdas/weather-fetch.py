import json
import urllib.parse
import urllib.request
from datetime import datetime, timezone

import boto3


BUCKET = "at-a-glance-574152485008-us-east-2-an"
LOCATIONS_KEY = "config/locations.json"

s3 = boto3.client("s3")


def load_locations():
    response = s3.get_object(
        Bucket=BUCKET,
        Key=LOCATIONS_KEY,
    )

    config = json.loads(
        response["Body"].read().decode("utf-8")
    )

    return config["locations"]


def fetch_weather(location):
    params = {
        "latitude": location["latitude"],
        "longitude": location["longitude"],
        "timezone": location["timezone"],
        "temperature_unit": "fahrenheit",
        "wind_speed_unit": "mph",
        "precipitation_unit": "inch",
        "forecast_days": 7,

        "current": ",".join([
            "temperature_2m",
            "apparent_temperature",
            "precipitation",
            "weather_code",
            "wind_speed_10m",
            "wind_gusts_10m",
            "wind_direction_10m",
            "cloud_cover",
            "is_day",
        ]),

        "hourly": ",".join([
            "temperature_2m",
            "apparent_temperature",
            "precipitation_probability",
            "weather_code",
            "wind_speed_10m",
            "wind_gusts_10m",
            "wind_direction_10m",
            "cloud_cover",
            "uv_index",
        ]),

        "daily": ",".join([
            "weather_code",
            "temperature_2m_max",
            "temperature_2m_min",
            "precipitation_probability_max",
            "uv_index_max",
            "sunrise",
            "sunset",
        ]),
    }

    url = (
        "https://api.open-meteo.com/v1/forecast?"
        + urllib.parse.urlencode(params)
    )

    with urllib.request.urlopen(url, timeout=15) as response:
        return json.load(response)


def normalize_weather(raw, location):
    current_raw = raw["current"]
    hourly_raw = raw["hourly"]
    daily_raw = raw["daily"]

    current_hour = current_raw["time"][:13] + ":00"

    try:
        start_index = hourly_raw["time"].index(current_hour)
    except ValueError:
        start_index = 0

    hourly = []

    for i in range(
        start_index,
        min(start_index + 24, len(hourly_raw["time"]))
    ):
        hourly.append({
            "time": hourly_raw["time"][i],
            "temperature_f": hourly_raw["temperature_2m"][i],
            "apparent_temperature_f":
                hourly_raw["apparent_temperature"][i],
            "precipitation_probability":
                hourly_raw["precipitation_probability"][i],
            "weather_code": hourly_raw["weather_code"][i],
            "wind_speed_mph": hourly_raw["wind_speed_10m"][i],
            "wind_gust_mph": hourly_raw["wind_gusts_10m"][i],
            "wind_direction_degrees":
                hourly_raw["wind_direction_10m"][i],
            "cloud_cover_percent":
                hourly_raw["cloud_cover"][i],
            "uv_index": hourly_raw["uv_index"][i],
        })

    daily = []

    for i in range(min(7, len(daily_raw["time"]))):
        daily.append({
            "date": daily_raw["time"][i],
            "temperature_max_f":
                daily_raw["temperature_2m_max"][i],
            "temperature_min_f":
                daily_raw["temperature_2m_min"][i],
            "precipitation_probability":
                daily_raw["precipitation_probability_max"][i],
            "uv_index": daily_raw["uv_index_max"][i],
            "sunrise": daily_raw["sunrise"][i],
            "sunset": daily_raw["sunset"][i],
            "weather_code": daily_raw["weather_code"][i],
        })

    return {
        "schema_version": 1,
        "source": "open-meteo",
        "location_key": location["key"],
        "location_name": location["name"],
        "generated_at": datetime.now(timezone.utc).isoformat(),

        "current": {
            "time": current_raw.get("time"),
            "temperature_f":
                current_raw.get("temperature_2m"),
            "apparent_temperature_f":
                current_raw.get("apparent_temperature"),
            "precipitation_inches":
                current_raw.get("precipitation"),
            "weather_code":
                current_raw.get("weather_code"),
            "wind_speed_mph":
                current_raw.get("wind_speed_10m"),
            "wind_gust_mph":
                current_raw.get("wind_gusts_10m"),
            "wind_direction_degrees":
                current_raw.get("wind_direction_10m"),
            "cloud_cover_percent":
                current_raw.get("cloud_cover"),
            "is_day":
                current_raw.get("is_day"),
        },

        "hourly": hourly,
        "daily": daily,
    }


def save_weather(weather):
    key = f'data/weather/{weather["location_key"]}.json'

    s3.put_object(
        Bucket=BUCKET,
        Key=key,
        Body=json.dumps(weather),
        ContentType="application/json",
        CacheControl="public, max-age=300",
    )


def lambda_handler(event, context):
    locations = load_locations()
    failures = []

    for location in locations:
        try:
            raw = fetch_weather(location)
            weather = normalize_weather(raw, location)
            save_weather(weather)

            print(
                f'OK {location["key"]} '
                f'{weather["generated_at"]}'
            )

        except Exception as error:
            print(
                f'ERROR {location.get("key")}: '
                f'{type(error).__name__}: {error}'
            )

            failures.append(location.get("key"))

    if failures:
        raise RuntimeError(
            f'Weather failed for: {", ".join(failures)}'
        )

    return {
        "processed": len(locations)
    }