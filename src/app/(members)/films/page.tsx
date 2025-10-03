// app/(members)/films/page.tsx
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { MemberFilmCard } from "@/components/films/MemberFilmCard";
import { FilterBar } from "@/components/films/FilterBar";
import { Paginator } from "@/components/films/Paginator";
import {
  perPage,
  applyFilters,
  applySort,
  getParam,
  getParamArray,
  toNum,
} from "@/components/films/utils";
import type { FilmItem } from "@/components/films/types";

export const revalidate = 600;

// Mock data — swap with DB results
const MOCK: FilmItem[] = [
  {
    id: 201,
    title: "The Conversation",
    year: 1974,
    director: "Francis Ford Coppola",
    posterUrl: "/images/mock-1.jpg",
    avgScore: 8.6,
    dissent: 1.2,
    myScore: 8.0,
    genres: ["Thriller", "Drama"],
    country: "US",
    reviewsSample: [
      "Paranoia scored into tape hiss; surveillance as confession.",
    ],
    discussionsSample: ["Sound design as POV; guilt and responsibility."],
  },
  {
    id: 203,
    title: "Memories of Murder",
    year: 2003,
    director: "Bong Joon-ho",
    posterUrl: "/images/mock-3.jpg",
    avgScore: 8.8,
    dissent: 0.9,
    myScore: 9.0,
    genres: ["Crime", "Drama"],
    country: "KR",
    reviewsSample: ["Hopelessness as procedural; the ending stares back."],
    discussionsSample: ["Rain, mud, and the bureaucratic sublime."],
  },
  {
    id: 205,
    title: "A Brighter Summer Day",
    year: 1991,
    director: "Edward Yang",
    posterUrl: "/images/mock-5.jpg",
    avgScore: 8.9,
    dissent: 1.0,
    myScore: null,
    genres: ["Drama"],
    country: "TW",
  },
  {
    id: 209,
    title: "In the Mood for Love",
    year: 2000,
    director: "Wong Kar-wai",
    posterUrl: "/images/mock-poster.jpg",
    avgScore: 9.1,
    dissent: 1.3,
    myScore: 8.5,
    genres: ["Romance", "Drama"],
    country: "HK",
  },
  {
    id: 214,
    title: "Seven Samurai",
    year: 1954,
    director: "Akira Kurosawa",
    posterUrl: "/images/mock-4.jpg",
    avgScore: 9.0,
    dissent: 1.1,
    myScore: 9.0,
    genres: ["Adventure", "Drama"],
    country: "JP",
  },
  {
    id: 220,
    title: "Beau Travail",
    year: 1999,
    director: "Claire Denis",
    posterUrl: "/images/mock-8.jpg",
    avgScore: 8.2,
    dissent: 2.0,
    myScore: null,
    genres: ["Drama"],
    country: "FR",
    reviewsSample: ["Bodies as choreography; the final dance as verdict."],
  },
  {
    id: 216,
    title: "The Tree of Life",
    year: 2011,
    director: "Terrence Malick",
    posterUrl: "/images/mock-2.jpg",
    avgScore: 7.8,
    dissent: 2.8,
    myScore: 7.0,
    genres: ["Drama"],
    country: "US",
  },
  {
    id: 207,
    title: "La Cérémonie",
    year: 1995,
    director: "Claude Chabrol",
    posterUrl: "/images/mock-7.jpg",
    avgScore: 7.7,
    dissent: 2.6,
    myScore: null,
    genres: ["Thriller", "Drama"],
    country: "FR",
  },
  {
    id: 204,
    title: "The Red Shoes",
    year: 1948,
    director: "Powell & Pressburger",
    posterUrl: "/images/mock-4.jpg",
    avgScore: 8.2,
    dissent: 1.7,
    myScore: 8.0,
    genres: ["Drama", "Romance"],
    country: "UK",
  },
  {
    id: 212,
    title: "Stalker",
    year: 1979,
    director: "Andrei Tarkovsky",
    posterUrl: "/images/mock-6.jpg",
    avgScore: 8.4,
    dissent: 1.8,
    myScore: null,
    genres: ["Sci-Fi", "Drama"],
    country: "RU",
    reviewsSample: ["Faith and doubt in the same frame for minutes on end."],
  },
];

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const Page = ({ searchParams }: PageProps) => {
  // Params
  const q = getParam(searchParams, "q", "")!;
  const sort = (getParam(searchParams, "sort", "recent") ?? "recent") as
    | "recent"
    | "rating"
    | "dissent"
    | "alpha"
    | "oldest";
  const filter = (getParam(searchParams, "filter", "all") ?? "all") as
    | "all"
    | "consensus"
    | "controversial";
  const decade = getParam(searchParams, "decade", "all")!;
  const genre = getParam(searchParams, "genre", "all")!;
  const country = getParam(searchParams, "country", "all")!;
  const min = toNum(getParam(searchParams, "min"), 1);
  const max = toNum(getParam(searchParams, "max"), 10);
  const page = Math.max(
    1,
    Math.floor(toNum(getParam(searchParams, "page"), 1))
  );

  // searchIn: accept multiple ?in= OR a compact comma string
  const inMulti = getParamArray(searchParams, "in");
  const searchIn =
    inMulti.length > 0
      ? inMulti
      : (getParam(searchParams, "in", "") ?? "").split(",").filter(Boolean);

  // Compute
  const filtered = applyFilters(MOCK, {
    q,
    searchIn,
    filter,
    decade,
    genre,
    country,
    min,
    max,
  });
  const sorted = applySort(filtered, sort);
  const total = sorted.length;
  const start = (page - 1) * perPage;
  const items = sorted.slice(start, start + perPage);

  return (
    <>
      <SectionHeader
        title="Films"
        subtitle="Archive of all films and member discussions."
        action={
          <ButtonLink href="/suggest" variant="outline" size="md">
            Suggest a film
          </ButtonLink>
        }
      />

      <Card padding="lg" className="mb-6">
        <FilterBar
          q={q}
          sort={sort}
          filter={filter}
          decade={decade}
          genre={genre}
          country={country}
          min={min}
          max={max}
          searchIn={searchIn}
          basePath="/films"
        />
        <p className="mt-3 text-xs text-neutral-500">
          Search scopes include titles/years/directors by default; you can also
          search member reviews and discussion content.
        </p>
      </Card>

      {items.length === 0 ? (
        <Card padding="lg" className="text-center text-sm text-neutral-400">
          No films match your filters. Try adjusting your search.
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {items.map((film) => (
            <MemberFilmCard key={film.id} film={film} />
          ))}
        </div>
      )}

      <Paginator
        page={page}
        total={total}
        perPage={perPage}
        basePath="/films"
        params={{
          q,
          sort,
          filter,
          decade,
          genre,
          country,
          min: String(min),
          max: String(max),
          in: searchIn.join(","), // compact preserve
        }}
      />
    </>
  );
};

export default Page;
