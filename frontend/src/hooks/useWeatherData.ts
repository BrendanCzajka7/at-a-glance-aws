import { useEffect, useState } from "react";
import type { Location, Weather } from "../types";

export default function useWeatherData() {
  const [locations, setLocations] = useState<Location[]>([]);

  const [location, setLocation] = useState(
    () => localStorage.getItem("at-a-glance-location") ?? ""
  );

  const [weather, setWeather] = useState<Weather | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");

  useEffect(() => {
    if (!location) return;

    localStorage.setItem("at-a-glance-location", location);
  }, [location]);

  useEffect(() => {
    fetch("/config/locations.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error();
        }

        return response.json();
      })
      .then(({ locations }: { locations: Location[] }) => {
        setLocations(locations);

        setLocation((current) =>
          locations.some((item) => item.key === current)
            ? current
            : locations[0]?.key ?? ""
        );
      })
      .catch(() => {
        setWeatherError("Could not load locations.");
      });
  }, []);

  useEffect(() => {
    if (!location) return;

    setWeatherError("");
    setWeatherLoading(true);

    fetch(`/data/weather/${location}.json`)
      .then((response) => {
        if (!response.ok) {
          throw new Error();
        }

        return response.json();
      })
      .then((data: Weather) => {
        setWeather(data);
      })
      .catch(() => {
        setWeatherError("Could not load weather.");
      })
      .finally(() => {
        setWeatherLoading(false);
      });
  }, [location]);

  return {
    locations,
    location,
    setLocation,
    weather,
    weatherLoading,
    weatherError,
  };
}