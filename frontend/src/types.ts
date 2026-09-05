export type Location = {
  key: string;
  name: string;
  timezone: string;
};

export type Hour = {
  time: string;
  temperature_f: number | null;
};

export type Day = {
  date: string;
  temperature_max_f: number | null;
  temperature_min_f: number | null;
  precipitation_probability: number | null;
  uv_index: number | null;
  sunrise: string | null;
  sunset: string | null;
  weather_code: number | null;
};

export type Weather = {
  current: {
    temperature_f: number | null;
    wind_speed_mph: number | null;
    wind_direction_degrees: number | null;
    is_day: number | null;
  };
  hourly: Hour[];
  daily: Day[];
};

export type BackgroundPhoto = {
  id: number;
  themes: string[];
  key: string;
  photographer: string | null;
  photographer_url: string | null;
  pexels_url: string | null;
};

export type BackgroundData = {
  schema_version: number;
  source: string;
  generated_at: string;
  themes: string[];
  photos: BackgroundPhoto[];
};

export type TicketmasterEvent = {
  id: string;
  name: string;
  date: string;
  time: string | null;
  venue: string | null;
  city: string | null;
  state: string | null;
  distance_miles: number;
  genre: string | null;
  sub_genre: string | null;
  image_url: string | null;
  ticket_url: string | null;
};

export type TicketmasterData = {
  schema_version: number;
  source: string;
  generated_at: string;
  location_key: string;
  location_name: string;
  radius_miles: number;
  days: number;
  events: TicketmasterEvent[];
};

export type TmdbMatch = {
  kind: "genre" | "director";
  id: number;
  name: string;
};

export type TmdbMovie = {
  id: number;
  title: string;
  overview: string | null;
  release_date: string;
  poster_url: string | null;
  vote_average: number | null;
  popularity: number | null;
  source_url: string;
  matches: TmdbMatch[];
};

export type TmdbFilter = {
  id: number;
  name: string;
};

export type TmdbData = {
  schema_version: number;
  source: string;
  generated_at: string;
  days_ahead: {
    genres: number;
    directors: number;
  };
  filters: {
    genres: TmdbFilter[];
    directors: TmdbFilter[];
  };
  movies: TmdbMovie[];
};

export type MusicArtist = {
  name: string;
  musicbrainz_artist_id: string;
};

export type MusicRelease = {
  id: string;
  artist_name: string;
  musicbrainz_artist_id: string;
  title: string;
  date: string;
  status: string | null;
  type: string | null;
  country: string | null;
  source_url: string;
};

export type MusicBrainzData = {
  schema_version: number;
  source: string;
  generated_at: string;
  days_ahead: number;
  artists: MusicArtist[];
  failed_artists: string[];
  releases: MusicRelease[];
};

export type WikimediaKind =
  | "selected"
  | "events"
  | "births"
  | "deaths";

export type WikimediaItem = {
  year: number;
  text: string;
  title: string | null;
  source_url: string | null;
  kind: WikimediaKind;
};

export type WikimediaData = {
  schema_version: number;
  source: string;
  generated_at: string;
  date: string;
  selected: WikimediaItem[];
  events: WikimediaItem[];
  births: WikimediaItem[];
  deaths: WikimediaItem[];
};

export type TriviaItem = {
  question: string;
  answer: string;
};

export type TriviaData = {
  questions: TriviaItem[];
};

export type WordItem = {
  word: string;
  definition: string;
};

export type WordData = {
  words: WordItem[];
};

export type Page =
  | "weather"
  | "entertainment"
  | "knowledge";