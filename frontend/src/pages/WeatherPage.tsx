import DashboardLayout from "../components/DashboardLayout";
import Icon, { ForecastIcon } from "../components/Icon";
import TemperatureChart from "../components/TemperatureChart";
import type { Location, Weather } from "../types";

type WeatherPageProps = {
  weather: Weather;
  locations: Location[];
  location: string;
  localDate: string;
  localTime: string;
};

const n = (
  value: number | null | undefined
) => (value == null ? "—" : Math.round(value));

const day = (value: string) => {
  const [year, month, date] = value
    .split("-")
    .map(Number);

  return new Date(
    year,
    month - 1,
    date
  ).toLocaleDateString(undefined, {
    weekday: "short",
  });
};

const time = (value: string | null) => {
  if (!value) return "—";

  const [hour, minute] = value
    .slice(11, 16)
    .split(":")
    .map(Number);

  return new Date(
    2000,
    0,
    1,
    hour,
    minute
  ).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
};

const wind = (
  degrees: number | null
) => {
  if (degrees == null) return "";

  return [
    "N",
    "NE",
    "E",
    "SE",
    "S",
    "SW",
    "W",
    "NW",
  ][Math.round(degrees / 45) % 8];
};

export default function WeatherPage({
  weather,
  locations,
  location,
  localDate,
  localTime,
}: WeatherPageProps) {
  const today = weather.daily[0];

  return (
    <DashboardLayout
      topLeft={
        <section className="card current">
          <div className="current-top">
            <div className="date">
              {localDate} <span>•</span> {localTime}
            </div>

            <div className="high-low">
              <span>
                H <b>{n(today.temperature_max_f)}°</b>
              </span>

              <span>
                L <b>{n(today.temperature_min_f)}°</b>
              </span>
            </div>
          </div>

          <div className="current-main">
            <div className="big-temp">
              {n(weather.current.temperature_f)}
              <sup>°</sup>
            </div>

            <div className="stats">
              <div>
                <Icon type="rain" />
                <b>
                  {n(today.precipitation_probability)}%
                </b>
              </div>

              <div>
                <Icon type="wind" />
                <b>
                  {n(weather.current.wind_speed_mph)} mph{" "}
                  {wind(
                    weather.current.wind_direction_degrees
                  )}
                </b>
              </div>

              <div>
                <Icon type="uv" />
                <b>{n(today.uv_index)}</b>
              </div>

              <div className="sun">
                <Icon type="sunrise" />
                <b>{time(today.sunrise)}</b>
              </div>

              <div className="sun">
                <Icon type="sunset" />
                <b>{time(today.sunset)}</b>
              </div>
            </div>
          </div>
        </section>
      }
      bottomLeft={
        <section className="card hourly">
          <h2>Next 12 hours</h2>

          <TemperatureChart
            hours={weather.hourly}
            timezone={
              locations.find(
                (item) => item.key === location
              )?.timezone ?? "America/Chicago"
            }
          />
        </section>
      }
      right={
        <aside className="card forecast">
          <h2>Coming up</h2>

          <div className="forecast-list">
            {weather.daily.slice(1).map((forecast) => (
              <div
                className="forecast-row"
                key={forecast.date}
              >
                <b>{day(forecast.date)}</b>

                <ForecastIcon
                  code={forecast.weather_code}
                />

                <span className="rain">
                  {(forecast.precipitation_probability ??
                    0) >= 15
                    ? `${n(
                        forecast.precipitation_probability
                      )}%`
                    : ""}
                </span>

                <strong>
                  {n(forecast.temperature_max_f)}°
                </strong>

                <span>
                  {n(forecast.temperature_min_f)}°
                </span>
              </div>
            ))}
          </div>
        </aside>
      }
    />
  );
}