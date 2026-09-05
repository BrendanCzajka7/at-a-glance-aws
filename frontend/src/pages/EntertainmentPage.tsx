import type {
  Dispatch,
  SetStateAction,
} from "react";

import DashboardLayout from "../components/DashboardLayout";

import type {
  TicketmasterData,
  TmdbData,
  MusicBrainzData,
} from "../types";

type EntertainmentPageProps = {
  ticketmaster: TicketmasterData | null;
  tmdb: TmdbData | null;
  musicbrainz: MusicBrainzData | null;

  activeGenres: number[];
  setActiveGenres: Dispatch<
    SetStateAction<number[]>
  >;

  directorsEnabled: boolean;
  setDirectorsEnabled: Dispatch<
    SetStateAction<boolean>
  >;

  showTrackedArtists: boolean;
  setShowTrackedArtists: Dispatch<
    SetStateAction<boolean>
  >;
};

const eventTime = (
  value: string | null
) => {
  if (!value) return "";

  const [hour, minute] = value
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

const eventDate = (value: string) => {
  const [year, month, date] = value
    .split("-")
    .map(Number);

  return new Date(
    year,
    month - 1,
    date
  ).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

export default function EntertainmentPage({
  ticketmaster,
  tmdb,
  musicbrainz,
  activeGenres,
  setActiveGenres,
  directorsEnabled,
  setDirectorsEnabled,
  showTrackedArtists,
  setShowTrackedArtists,
}: EntertainmentPageProps) {
  const visibleMovies =
    tmdb?.movies.filter((movie) => {
      const genreMatch = movie.matches.some(
        (match) =>
          match.kind === "genre" &&
          activeGenres.includes(match.id)
      );

      const directorMatch =
        directorsEnabled &&
        movie.matches.some(
          (match) => match.kind === "director"
        );

      return genreMatch || directorMatch;
    }) ?? [];

  const toggleGenre = (genreId: number) => {
    setActiveGenres((current) =>
      current.includes(genreId)
        ? current.filter((id) => id !== genreId)
        : [...current, genreId]
    );
  };

  return (
    <DashboardLayout
      className="entertainment-main"
      topLeft={
        <section className="card entertainment-ticketmaster">
          <div className="entertainment-heading">
            <h2>Shows nearby</h2>

            <span>
              {ticketmaster?.events.length ?? 0} within{" "}
              {ticketmaster?.radius_miles ?? 75} mi
            </span>
          </div>

          <div className="event-scroll">
            {ticketmaster?.events.map((event) => (
              <a
                className="event-card"
                key={event.id}
                href={event.ticket_url ?? undefined}
                target="_blank"
                rel="noreferrer"
              >
                <div className="event-image">
                  {event.image_url ? (
                    <img
                      src={event.image_url}
                      alt=""
                    />
                  ) : (
                    <div className="event-image-empty" />
                  )}
                </div>

                <div className="event-info">
                  <div className="event-when">
                    {eventDate(event.date)}

                    {event.time
                      ? ` • ${eventTime(event.time)}`
                      : ""}
                  </div>

                  <strong>{event.name}</strong>

                  <span>
                    {event.venue}

                    {event.city
                      ? ` • ${event.city}`
                      : ""}

                    {event.state
                      ? `, ${event.state}`
                      : ""}
                  </span>

                  <small>
                    {event.distance_miles} mi away
                  </small>
                </div>
              </a>
            ))}

            {ticketmaster &&
              ticketmaster.events.length === 0 && (
                <div className="empty-card">
                  No shows found for the next 5 days.
                </div>
              )}
          </div>
        </section>
      }
      bottomLeft={
        <section className="card entertainment-movies">
          <div className="movie-top">
            <div className="entertainment-heading movie-heading">
              <h2>Movies</h2>

              <span>
                {visibleMovies.length} upcoming
              </span>
            </div>

            <div className="movie-filters">
              {tmdb?.filters.genres.map((genre) => (
                <button
                  key={genre.id}
                  className={`movie-filter ${
                    activeGenres.includes(genre.id)
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    toggleGenre(genre.id)
                  }
                >
                  {genre.name}
                </button>
              ))}

              {tmdb &&
                tmdb.filters.directors.length > 0 && (
                  <button
                    className={`movie-filter ${
                      directorsEnabled
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setDirectorsEnabled(
                        (current) => !current
                      )
                    }
                  >
                    Directors
                  </button>
                )}
            </div>
          </div>

          <div className="event-scroll movie-scroll">
            {visibleMovies.map((movie) => (
              <a
                className="event-card movie-card"
                key={movie.id}
                href={movie.source_url}
                target="_blank"
                rel="noreferrer"
              >
                <div className="event-image movie-image">
                  {movie.poster_url ? (
                    <img
                      src={movie.poster_url}
                      alt=""
                    />
                  ) : (
                    <div className="event-image-empty" />
                  )}
                </div>

                <div className="event-info">
                  <div className="event-when">
                    {eventDate(movie.release_date)}
                  </div>

                  <strong>{movie.title}</strong>

                  <span>
                    {movie.matches
                      .map((match) => match.name)
                      .join(" • ")}
                  </span>
                </div>
              </a>
            ))}

            {tmdb &&
              visibleMovies.length === 0 && (
                <div className="empty-card">
                  No movies match the selected
                  filters.
                </div>
              )}
          </div>
        </section>
      }
      right={
        <aside className="card entertainment-music">
          <div className="entertainment-heading">
            <h2>Upcoming music</h2>

            <button
              className="tracking-button"
              onClick={() =>
                setShowTrackedArtists(true)
              }
            >
              See artists
            </button>
          </div>

          <div className="music-release-list">
            {musicbrainz?.releases.map(
              (release) => (
                <a
                  className="music-release"
                  key={release.id}
                  href={release.source_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="music-release-date">
                    {eventDate(release.date)}
                  </div>

                  <strong>
                    {release.artist_name}
                  </strong>

                  <span className="music-release-title">
                    {release.title}
                  </span>

                  {(release.type ||
                    release.country) && (
                    <small>
                      {[
                        release.type,
                        release.country,
                      ]
                        .filter(Boolean)
                        .join(" • ")}
                    </small>
                  )}
                </a>
              )
            )}

            {musicbrainz &&
              musicbrainz.releases.length === 0 && (
                <div className="empty-card">
                  No upcoming releases found.
                </div>
              )}
          </div>

          {showTrackedArtists && (
            <div className="tracking-panel">
              <div className="tracking-panel-header">
                <div>
                  <h2>Tracked artists</h2>

                  <span>
                    {musicbrainz?.artists.length ?? 0}
                  </span>
                </div>

                <button
                  className="tracking-close"
                  onClick={() =>
                    setShowTrackedArtists(false)
                  }
                >
                  ×
                </button>
              </div>

              <div className="tracked-artist-list">
                {musicbrainz?.artists.map(
                  (artist) => {
                    const failed =
                      musicbrainz.failed_artists.includes(
                        artist.name
                      );

                    return (
                      <div
                        className="tracked-artist"
                        key={
                          artist.musicbrainz_artist_id
                        }
                      >
                        <span>{artist.name}</span>

                        {failed && (
                          <small>retry</small>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}
        </aside>
      }
    />
  );
}