type IconType =
  | "rain"
  | "wind"
  | "uv"
  | "sunrise"
  | "sunset"
  | "cloud";

type IconProps = {
  type: IconType;
  size?: number;
};

export default function Icon({
  type,
  size = 28,
}: IconProps) {
  const stroke = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const paths = {
    rain: (
      <>
        <path
          d="M5 13h13a4 4 0 0 0 0-8 6 6 0 0 0-11 2A3 3 0 0 0 5 13Z"
          {...stroke}
        />
        <path
          d="M8 17l-1 3m5-3-1 3m5-3-1 3"
          {...stroke}
        />
      </>
    ),

    wind: (
      <>
        <path
          d="M3 8h12c3 0 3-4 0-4"
          {...stroke}
        />
        <path
          d="M3 12h16c3 0 3 5 0 5"
          {...stroke}
        />
        <path
          d="M3 16h8"
          {...stroke}
        />
      </>
    ),

    uv: (
      <>
        <circle
          cx="12"
          cy="12"
          r="4"
          {...stroke}
        />
        <path
          d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2m0-14-2 2M7 17l-2 2"
          {...stroke}
        />
      </>
    ),

    sunrise: (
      <path
        d="M4 18h16M6 15a6 6 0 0 1 12 0M12 3v7M9 6l3-3 3 3"
        {...stroke}
      />
    ),

    sunset: (
      <path
        d="M4 18h16M6 15a6 6 0 0 1 12 0M12 3v7M9 7l3 3 3-3"
        {...stroke}
      />
    ),

    cloud: (
      <path
        d="M5 16h13a4 4 0 0 0 0-8 6 6 0 0 0-11 2A3 3 0 0 0 5 16Z"
        {...stroke}
      />
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
    >
      {paths[type]}
    </svg>
  );
}

export function ForecastIcon({
  code,
}: {
  code: number | null;
}) {
  if (code != null && code >= 51) {
    return <Icon type="rain" size={34} />;
  }

  return <Icon type="cloud" size={34} />;
}