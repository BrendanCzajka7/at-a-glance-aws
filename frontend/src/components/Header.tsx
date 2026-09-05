import Picker, { type PickerItem } from "./Picker";

import type { Page } from "../types";

type HeaderProps = {
  page: Page;
  setPage: (page: Page) => void;

  themeItems: PickerItem[];
  theme: string;
  setTheme: (theme: string) => void;

  locationItems: PickerItem[];
  location: string;
  setLocation: (location: string) => void;
};

export default function Header({
  page,
  setPage,
  themeItems,
  theme,
  setTheme,
  locationItems,
  location,
  setLocation,
}: HeaderProps) {
  return (
    <header className="top-bar">
      <div className="top-bar-inner">
        <div className="page-nav">
          <button
            className={page === "weather" ? "active" : ""}
            onClick={() => setPage("weather")}
          >
            Weather
          </button>

          <button
            className={page === "entertainment" ? "active" : ""}
            onClick={() => setPage("entertainment")}
          >
            Entertainment
          </button>

          <button
            className={page === "knowledge" ? "active" : ""}
            onClick={() => setPage("knowledge")}
          >
            Knowledge
          </button>
        </div>

        <div className="top-bar-controls">
          <Picker
            items={themeItems}
            value={theme}
            onChange={setTheme}
            className="theme-picker"
          />

          <Picker
            items={locationItems}
            value={location}
            onChange={setLocation}
            className="location-picker"
          />
        </div>
      </div>
    </header>
  );
}