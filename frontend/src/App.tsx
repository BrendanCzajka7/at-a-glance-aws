import { useEffect, useState } from "react";

import Header from "./components/Header";
import type { PickerItem } from "./components/Picker";

import WeatherPage from "./pages/WeatherPage";
import EntertainmentPage from "./pages/EntertainmentPage";
import KnowledgePage from "./pages/KnowledgePage";

import useWeatherData from "./hooks/useWeatherData";
import useEntertainmentData from "./hooks/useEntertainmentData";
import useKnowledgeData from "./hooks/useKnowledgeData";
import useBackground from "./hooks/useBackground";
import usePageNavigation from "./hooks/usePageNavigation";

import {
  localDateKey,
  themeName,
} from "./utils";

export default function App() {
  const [now, setNow] = useState(new Date());

  const knowledgeDate = localDateKey(now);

  const {
    locations,
    location,
    setLocation,
    weather,
    weatherLoading,
    weatherError,
  } = useWeatherData();

  const {
    ticketmaster,
    tmdb,
    musicbrainz,
    ticketmasterLoading,
    activeGenres,
    setActiveGenres,
    directorsEnabled,
    setDirectorsEnabled,
    showTrackedArtists,
    setShowTrackedArtists,
  } = useEntertainmentData(location);

  const {
    wikimedia,
    trivia,
    words,
    showTriviaAnswer,
    setShowTriviaAnswer,
    wikimediaLoading,
  } = useKnowledgeData(knowledgeDate);

  const {
    backgrounds,
    theme,
    setTheme,
    backgroundUrl,
    backgroundError,
  } = useBackground();

  const {
    page,
    setPage,
  } = usePageNavigation();

  useEffect(() => {
    const id = window.setInterval(
      () => setNow(new Date()),
      30000
    );

    return () => {
      window.clearInterval(id);
    };
  }, []);

  if (!weather) {
    return (
      <div className="app-page loading-page">
        {weatherError ||
          backgroundError ||
          "Loading..."}
      </div>
    );
  }

  const localDate = now.toLocaleDateString(
    undefined,
    {
      weekday: "long",
      month: "long",
      day: "numeric",
    }
  );

  const localTime = now.toLocaleTimeString(
    undefined,
    {
      hour: "numeric",
      minute: "2-digit",
    }
  );

  const themeItems: PickerItem[] =
    backgrounds?.themes.map((item) => ({
      key: item,
      name: themeName(item),
    })) ?? [];

  const locationItems: PickerItem[] =
    locations.map((item) => ({
      key: item.key,
      name: item.name,
    }));

  const backgroundImage = backgroundUrl
    ? `
        linear-gradient(
          rgba(4, 12, 18, 0.28),
          rgba(4, 12, 18, 0.50)
        ),
        url("${backgroundUrl}")
      `
    : undefined;

  const pageLoading =
    page === "weather"
      ? weatherLoading
      : page === "entertainment"
        ? ticketmasterLoading
        : wikimediaLoading;

  return (
    <div
      className={`app-page ${
        weather.current.is_day === 0
          ? "night"
          : ""
      }`}
      style={{ backgroundImage }}
    >
      <Header
        page={page}
        setPage={setPage}
        themeItems={themeItems}
        theme={theme}
        setTheme={setTheme}
        locationItems={locationItems}
        location={location}
        setLocation={setLocation}
      />

      {pageLoading && (
        <div className="loading-line" />
      )}

      {page === "weather" && (
        <WeatherPage
          weather={weather}
          locations={locations}
          location={location}
          localDate={localDate}
          localTime={localTime}
        />
      )}

      {page === "entertainment" && (
        <EntertainmentPage
          ticketmaster={ticketmaster}
          tmdb={tmdb}
          musicbrainz={musicbrainz}
          activeGenres={activeGenres}
          setActiveGenres={setActiveGenres}
          directorsEnabled={directorsEnabled}
          setDirectorsEnabled={setDirectorsEnabled}
          showTrackedArtists={showTrackedArtists}
          setShowTrackedArtists={setShowTrackedArtists}
        />
      )}

      {page === "knowledge" && (
        <KnowledgePage
          wikimedia={wikimedia}
          knowledgeDate={knowledgeDate}
          now={now}
          trivia={trivia}
          showTriviaAnswer={showTriviaAnswer}
          setShowTriviaAnswer={setShowTriviaAnswer}
          words={words}
        />
      )}
    </div>
  );
}