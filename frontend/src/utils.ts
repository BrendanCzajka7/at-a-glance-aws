import type { BackgroundPhoto } from "./types";

export function pickDailyPhoto(
  photos: BackgroundPhoto[],
  theme: string
) {
  const matches = photos.filter((photo) =>
    photo.themes.includes(theme)
  );

  if (!matches.length) return null;

  const today = new Date();

  const dateKey =
    `${today.getFullYear()}-` +
    `${today.getMonth() + 1}-` +
    `${today.getDate()}`;

  let hash = 0;
  const seed = `${dateKey}:${theme}`;

  for (let i = 0; i < seed.length; i++) {
    hash =
      (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  return matches[hash % matches.length];
}

export function localDateKey(
  value: Date
) {
  const year = value.getFullYear();

  const month = String(
    value.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    value.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function themeName(
  value: string
) {
  return value
    .split(" ")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}