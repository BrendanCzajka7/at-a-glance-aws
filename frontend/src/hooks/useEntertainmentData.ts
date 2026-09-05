import { useEffect, useState } from "react";
import type {
  TicketmasterData,
  TmdbData,
  MusicBrainzData,
} from "../types";

export default function useEntertainmentData(location: string) {
  const [ticketmaster, setTicketmaster] =
    useState<TicketmasterData | null>(null);

  const [tmdb, setTmdb] =
    useState<TmdbData | null>(null);

  const [musicbrainz, setMusicbrainz] =
    useState<MusicBrainzData | null>(null);

  const [ticketmasterLoading, setTicketmasterLoading] =
    useState(false);

  const [activeGenres, setActiveGenres] =
    useState<number[]>([]);

  const [directorsEnabled, setDirectorsEnabled] =
    useState(true);

  const [showTrackedArtists, setShowTrackedArtists] =
    useState(false);

  useEffect(() => {
    if (!location) return;

    setTicketmasterLoading(true);

    fetch(`/data/ticketmaster/${location}.json`)
      .then((response) => {
        if (!response.ok) {
          throw new Error();
        }

        return response.json();
      })
      .then((data: TicketmasterData) => {
        setTicketmaster(data);
      })
      .catch(() => {
        setTicketmaster(null);
      })
      .finally(() => {
        setTicketmasterLoading(false);
      });
  }, [location]);

  useEffect(() => {
    fetch("/data/tmdb.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error();
        }

        return response.json();
      })
      .then((data: TmdbData) => {
        setTmdb(data);

        setActiveGenres(
          data.filters.genres.map((genre) => genre.id)
        );
      })
      .catch(() => {
        setTmdb(null);
      });
  }, []);

  useEffect(() => {
    fetch("/data/musicbrainz.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error();
        }

        return response.json();
      })
      .then((data: MusicBrainzData) => {
        setMusicbrainz(data);
      })
      .catch(() => {
        setMusicbrainz(null);
      });
  }, []);

  return {
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
  };
}