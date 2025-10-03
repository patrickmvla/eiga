// components/films/FilterBar.tsx
import { ButtonLink } from "@/components/ui/ButtonLink";

export const FilterBar = ({
  q,
  sort,
  filter,
  decade,
  genre,
  country,
  min,
  max,
  searchIn,
  basePath = "/films",
  decades = [
    "all",
    "1950",
    "1960",
    "1970",
    "1980",
    "1990",
    "2000",
    "2010",
    "2020",
  ],
  genres = [
    "all",
    "Drama",
    "Thriller",
    "Romance",
    "Adventure",
    "Crime",
    "Sci-Fi",
  ],
  countries = ["all", "US", "FR", "JP", "KR", "UK", "TW", "HK", "RU"],
}: {
  q: string;
  sort: string;
  filter: string;
  decade: string;
  genre: string;
  country: string;
  min: number;
  max: number;
  searchIn: string[];
  basePath?: string;
  decades?: string[];
  genres?: string[];
  countries?: string[];
}) => {
  const isChecked = (k: string) => searchIn.includes(k);

  return (
    <form method="GET" className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="md:col-span-2">
          <label htmlFor="q" className="mb-1 block text-xs text-neutral-400">
            Search
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Search title, year, director… or expand scope below"
            className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
          />
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-400">
            <span className="mr-2">Search in:</span>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                name="in"
                value="titles"
                defaultChecked={isChecked("titles") || searchIn.length === 0}
                className="h-3.5 w-3.5 rounded border-white/20 bg-neutral-900/60 text-olive-500 focus:outline-none focus:ring-olive-400/40"
              />
              Titles
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                name="in"
                value="reviews"
                defaultChecked={isChecked("reviews")}
                className="h-3.5 w-3.5 rounded border-white/20 bg-neutral-900/60 text-olive-500 focus:outline-none focus:ring-olive-400/40"
              />
              Member reviews
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                name="in"
                value="discussions"
                defaultChecked={isChecked("discussions")}
                className="h-3.5 w-3.5 rounded border-white/20 bg-neutral-900/60 text-olive-500 focus:outline-none focus:ring-olive-400/40"
              />
              Discussion threads
            </label>
          </div>
        </div>

        <div className="">
          <label className="mb-1 block text-xs text-neutral-400">
            Rating range
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              name="min"
              min={1}
              max={10}
              step="0.1"
              defaultValue={min}
              className="w-20 rounded-lg border border-white/10 bg-neutral-900/50 px-2 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
            />
            <span className="text-neutral-500">to</span>
            <input
              type="number"
              name="max"
              min={1}
              max={10}
              step="0.1"
              defaultValue={max}
              className="w-20 rounded-lg border border-white/10 bg-neutral-900/50 px-2 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div>
          <label htmlFor="sort" className="mb-1 block text-xs text-neutral-400">
            Sort
          </label>
          <select
            id="sort"
            name="sort"
            defaultValue={sort}
            className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
          >
            <option value="recent">Most recent</option>
            <option value="rating">Highest rated</option>
            <option value="dissent">Most controversial</option>
            <option value="alpha">A–Z</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="filter"
            className="mb-1 block text-xs text-neutral-400"
          >
            Filter
          </label>
          <select
            id="filter"
            name="filter"
            defaultValue={filter}
            className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
          >
            <option value="all">All</option>
            <option value="consensus">Consensus</option>
            <option value="controversial">Controversial</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="decade"
            className="mb-1 block text-xs text-neutral-400"
          >
            Decade
          </label>
          <select
            id="decade"
            name="decade"
            defaultValue={decade}
            className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
          >
            {decades.map((d) => (
              <option key={d} value={d}>
                {d === "all" ? "All decades" : `${d}s`}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-2">
          <div>
            <label
              htmlFor="genre"
              className="mb-1 block text-xs text-neutral-400"
            >
              Genre
            </label>
            <select
              id="genre"
              name="genre"
              defaultValue={genre}
              className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
            >
              {genres.map((g) => (
                <option key={g} value={g}>
                  {g === "all" ? "All genres" : g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="country"
              className="mb-1 block text-xs text-neutral-400"
            >
              Country
            </label>
            <select
              id="country"
              name="country"
              defaultValue={country}
              className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
            >
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c === "all" ? "All countries" : c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <ButtonLink
          href={basePath}
          variant="ghost"
          size="md"
          ariaLabel="Reset filters"
        >
          Reset
        </ButtonLink>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-lg bg-olive-500 px-4 py-2 text-sm font-semibold text-neutral-950 transition-colors hover:bg-olive-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-olive-400/40"
        >
          Apply
        </button>
      </div>
    </form>
  );
};
