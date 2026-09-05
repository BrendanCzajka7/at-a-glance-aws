import type { Hour } from "../types";

const TEMP_COLORS: [
  number,
  [number, number, number],
][] = [
  [20, [37, 80, 130]],
  [32, [57, 117, 170]],
  [45, [112, 178, 207]],
  [60, [164, 191, 171]],
  [70, [217, 203, 108]],
  [80, [223, 144, 68]],
  [90, [214, 79, 67]],
];

const n = (
  value: number | null | undefined
) =>
  value == null
    ? "—"
    : Math.round(value);

const hour = (value: string) => {
  const h = Number(
    value.slice(11, 13)
  );

  if (h === 0) return "12a";
  if (h < 12) return `${h}a`;
  if (h === 12) return "12p";

  return `${h - 12}p`;
};

function tempColor(
  temperature: number
) {
  const first = TEMP_COLORS[0];
  const last = TEMP_COLORS.at(-1)!;

  if (temperature <= first[0]) {
    return `rgb(${first[1]})`;
  }

  if (temperature >= last[0]) {
    return `rgb(${last[1]})`;
  }

  const index =
    TEMP_COLORS.findIndex(
      ([temp]) =>
        temperature <= temp
    );

  const [aTemp, a] =
    TEMP_COLORS[index - 1];

  const [bTemp, b] =
    TEMP_COLORS[index];

  const progress =
    (temperature - aTemp) /
    (bTemp - aTemp);

  return `rgb(${a
    .map((value, i) =>
      Math.round(
        value +
          (b[i] - value) *
            progress
      )
    )
    .join(",")})`;
}

function currentHourKey(
  timezone: string
) {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        hourCycle: "h23",
      }
    ).formatToParts(new Date());

  const get = (type: string) =>
    parts.find(
      (part) =>
        part.type === type
    )?.value ?? "";

  return (
    `${get("year")}-` +
    `${get("month")}-` +
    `${get("day")}T` +
    `${get("hour")}`
  );
}

export default function TemperatureChart({
  hours,
  timezone,
}: {
  hours: Hour[];
  timezone: string;
}) {
  const key =
    currentHourKey(timezone);

  const start =
    hours.findIndex((item) =>
      item.time.startsWith(key)
    );

  const data = hours
    .slice(
      start >= 0 ? start : 0,
      (start >= 0 ? start : 0) +
        12
    )
    .filter(
      (
        item
      ): item is Hour & {
        temperature_f: number;
      } =>
        item.temperature_f != null
    );

  if (data.length < 2) {
    return null;
  }

  const width = 900;
  const height = 250;
  const padding = 40;

  const temperatures =
    data.map(
      (item) =>
        item.temperature_f
    );

  const min =
    Math.min(...temperatures) - 3;

  const max =
    Math.max(...temperatures) + 3;

  const points = data.map(
    (item, index) => ({
      ...item,

      x:
        padding +
        (index /
          (data.length - 1)) *
          (width -
            padding * 2),

      y:
        padding +
        ((max -
          item.temperature_f) /
          (max - min)) *
          (height -
            padding * 2),
    })
  );

  const path = points
    .map(
      (point, index) =>
        `${index ? "L" : "M"} ${point.x} ${point.y}`
    )
    .join(" ");

  return (
    <svg
      className="chart"
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        <linearGradient id="temp-line">
          {points.map(
            (point, index) => (
              <stop
                key={point.time}
                offset={`${
                  (index /
                    (points.length -
                      1)) *
                  100
                }%`}
                stopColor={tempColor(
                  point.temperature_f
                )}
              />
            )
          )}
        </linearGradient>
      </defs>

      <path
        d={path}
        fill="none"
        stroke="url(#temp-line)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {points.map(
        (point, index) => {
          const label =
            index === 0 ||
            index ===
              points.length - 1 ||
            index % 2 === 0;

          return (
            <g key={point.time}>
              <circle
                cx={point.x}
                cy={point.y}
                r={
                  index === 0
                    ? 6
                    : 4
                }
                fill="white"
              />

              {label && (
                <>
                  <text
                    className="chart-temp"
                    x={point.x}
                    y={
                      point.y - 16
                    }
                    textAnchor="middle"
                  >
                    {n(
                      point.temperature_f
                    )}
                    °
                  </text>

                  <text
                    className="chart-time"
                    x={point.x}
                    y={height - 8}
                    textAnchor="middle"
                  >
                    {index === 0
                      ? "NOW"
                      : hour(
                          point.time
                        )}
                  </text>
                </>
              )}
            </g>
          );
        }
      )}
    </svg>
  );
}