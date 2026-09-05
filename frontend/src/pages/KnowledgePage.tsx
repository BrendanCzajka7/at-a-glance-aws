import DashboardLayout from "../components/DashboardLayout";

import type {
  WikimediaData,
  WikimediaItem,
  TriviaItem,
  WordItem,
} from "../types";

type KnowledgePageProps = {
  wikimedia: WikimediaData | null;
  knowledgeDate: string;
  now: Date;

  trivia: TriviaItem[];
  showTriviaAnswer: boolean;
  setShowTriviaAnswer: (
    show: boolean
  ) => void;

  words: WordItem[];
};

const knowledgeDateLabel = (
  value: string
) => {
  const [year, month, day] = value
    .split("-")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day
  ).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
};

const dayOfYearIndex = (
  value: Date,
  length: number
) => {
  if (length === 0) return 0;

  const start = new Date(
    value.getFullYear(),
    0,
    1
  );

  const today = new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate()
  );

  const dayOfYear = Math.floor(
    (today.getTime() - start.getTime()) /
      86400000
  );

  return dayOfYear % length;
};

function WikimediaCard({
  item,
}: {
  item: WikimediaItem;
}) {
  const label =
    item.kind === "selected"
      ? "Selected"
      : item.kind === "events"
        ? "Event"
        : item.kind === "births"
          ? "Birth"
          : "Death";

  return (
    <a
      className="knowledge-card"
      href={item.source_url ?? undefined}
      target={
        item.source_url
          ? "_blank"
          : undefined
      }
      rel={
        item.source_url
          ? "noreferrer"
          : undefined
      }
    >
      <div className="knowledge-card-top">
        <span>{label}</span>
        <b>{item.year}</b>
      </div>

      <strong>
        {item.title ?? item.text}
      </strong>

      <p>{item.text}</p>
    </a>
  );
}

export default function KnowledgePage({
  wikimedia,
  knowledgeDate,
  now,
  trivia,
  showTriviaAnswer,
  setShowTriviaAnswer,
  words,
}: KnowledgePageProps) {
  const wikimediaItems =
    wikimedia
      ? [
          ...wikimedia.selected,
          ...wikimedia.events,
          ...wikimedia.births,
          ...wikimedia.deaths,
        ].filter(
          (item, index, items) =>
            index ===
            items.findIndex(
              (other) =>
                other.year === item.year &&
                other.text === item.text
            )
        )
      : [];

  const todaysTrivia =
    trivia.length > 0
      ? trivia[
          dayOfYearIndex(
            now,
            trivia.length
          )
        ]
      : null;

  const todaysWord =
    words.length > 0
      ? words[
          dayOfYearIndex(
            now,
            words.length
          )
        ]
      : null;

  return (
    <DashboardLayout
      className="knowledge-main"
      topLeft={
        <section className="card knowledge-wikimedia">
          <div className="knowledge-heading">
            <h2>On this day</h2>

            <span>
              {wikimedia
                ? knowledgeDateLabel(
                    wikimedia.date
                  )
                : knowledgeDateLabel(
                    knowledgeDate
                  )}
            </span>
          </div>

          <div className="event-scroll knowledge-event-scroll">
            {wikimediaItems.map(
              (item, index) => (
                <WikimediaCard
                  key={`${item.kind}-${item.year}-${index}`}
                  item={item}
                />
              )
            )}

            {wikimedia &&
              wikimediaItems.length === 0 && (
                <div className="empty-card">
                  No Wikimedia data available for
                  today.
                </div>
              )}
          </div>
        </section>
      }
      bottomLeft={
        <section className="card knowledge-trivia">
          <div className="trivia-heading">
            <h2>Daily trivia</h2>

            {todaysTrivia && (
              <button
                className="tracking-button"
                onClick={() =>
                  setShowTriviaAnswer(true)
                }
              >
                See answer
              </button>
            )}
          </div>

          <div className="trivia-content">
            {todaysTrivia ? (
              <strong>
                {todaysTrivia.question}
              </strong>
            ) : (
              <span>
                No trivia available.
              </span>
            )}
          </div>

          {showTriviaAnswer &&
            todaysTrivia && (
              <div className="tracking-panel">
                <div className="tracking-panel-header">
                  <div>
                    <h2>Answer</h2>
                  </div>

                  <button
                    className="tracking-close"
                    onClick={() =>
                      setShowTriviaAnswer(false)
                    }
                  >
                    ×
                  </button>
                </div>

                <div className="trivia-answer">
                  <strong>
                    {todaysTrivia.answer}
                  </strong>
                </div>
              </div>
            )}
        </section>
      }
      right={
        <aside className="card knowledge-word">
          <h2>Word of the day</h2>

          {todaysWord ? (
            <div className="word-content">
              <strong className="word-title">
                {todaysWord.word}
              </strong>

              <div className="word-divider" />

              <p className="word-definition">
                {todaysWord.definition}
              </p>
            </div>
          ) : (
            <div className="word-empty">
              No word available.
            </div>
          )}
        </aside>
      }
    />
  );
}