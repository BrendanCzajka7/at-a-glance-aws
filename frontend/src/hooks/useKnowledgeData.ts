import { useEffect, useState } from "react";
import type {
  WikimediaData,
  TriviaItem,
  TriviaData,
  WordItem,
  WordData,
} from "../types";

export default function useKnowledgeData(knowledgeDate: string) {
  const [wikimedia, setWikimedia] =
    useState<WikimediaData | null>(null);

  const [trivia, setTrivia] =
    useState<TriviaItem[]>([]);

  const [words, setWords] =
    useState<WordItem[]>([]);

  const [showTriviaAnswer, setShowTriviaAnswer] =
    useState(false);

  const [wikimediaLoading, setWikimediaLoading] =
    useState(false);

  useEffect(() => {
    fetch("/config/trivia.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error();
        }

        return response.json();
      })
      .then((data: TriviaData) => {
        setTrivia(data.questions);
      })
      .catch(() => {
        setTrivia([]);
      });
  }, []);

  useEffect(() => {
    fetch("/config/words.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error();
        }

        return response.json();
      })
      .then((data: WordData) => {
        setWords(data.words);
      })
      .catch(() => {
        setWords([]);
      });
  }, []);

  useEffect(() => {
    setWikimediaLoading(true);

    fetch(`/data/wikimedia/${knowledgeDate}.json`)
      .then((response) => {
        if (!response.ok) {
          throw new Error();
        }

        return response.json();
      })
      .then((data: WikimediaData) => {
        setWikimedia(data);
      })
      .catch(() => {
        setWikimedia(null);
      })
      .finally(() => {
        setWikimediaLoading(false);
      });
  }, [knowledgeDate]);

  return {
    wikimedia,
    trivia,
    words,
    showTriviaAnswer,
    setShowTriviaAnswer,
    wikimediaLoading,
  };
}