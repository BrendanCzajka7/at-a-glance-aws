import { useEffect, useState } from "react";
import { pickDailyPhoto } from "../utils";
import type { BackgroundData } from "../types";

export default function useBackground() {
  const [backgrounds, setBackgrounds] =
    useState<BackgroundData | null>(null);

  const [theme, setTheme] = useState(
    () => localStorage.getItem("at-a-glance-theme") ?? ""
  );

  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [backgroundError, setBackgroundError] = useState("");

  useEffect(() => {
    if (!theme) return;

    localStorage.setItem("at-a-glance-theme", theme);
  }, [theme]);

  useEffect(() => {
    fetch("/data/backgrounds.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error();
        }

        return response.json();
      })
      .then((data: BackgroundData) => {
        setBackgrounds(data);

        setTheme((current) =>
          data.themes.includes(current)
            ? current
            : data.themes[0] ?? ""
        );
      })
      .catch(() => {
        setBackgroundError("Could not load backgrounds.");
      });
  }, []);

  useEffect(() => {
    if (!backgrounds || !theme) return;

    const photo = pickDailyPhoto(
      backgrounds.photos,
      theme
    );

    if (!photo) return;

    const nextUrl = `/${photo.key}`;
    const image = new Image();

    let cancelled = false;

    image.src = nextUrl;

    image
      .decode()
      .then(() => {
        if (!cancelled) {
          setBackgroundUrl(nextUrl);
        }
      })
      .catch(() => {
        image.onload = () => {
          if (!cancelled) {
            setBackgroundUrl(nextUrl);
          }
        };
      });

    return () => {
      cancelled = true;
    };
  }, [backgrounds, theme]);

  return {
    backgrounds,
    theme,
    setTheme,
    backgroundUrl,
    backgroundError,
  };
}