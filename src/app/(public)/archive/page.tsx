import Link from "next/link"
import { ChevronLeft, ChevronRight, Info, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SectionHeader } from "@/components/ui/section-header"

import {
  getPublicArchive,
  type PublicArchiveItem,
  type ArchiveSort,
  type ArchiveFilter,
} from "@/lib/db/queries"

export const revalidate = 3600

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const perPage = 24

const getParam = (
  sp: Record<string, string | string[] | undefined> | undefined,
  key: string,
  fallback = ""
) => {
  const v = sp?.[key]
  return Array.isArray(v) ? v[0] ?? fallback : v ?? fallback
}

const toInt = (val: string | undefined, def: number) => {
  const n = Number(val)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def
}

const buildQuery = (params: Record<string, string | undefined>) => {
  const usp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v && v.length) usp.set(k, v)
  })
  const q = usp.toString()
  return q ? `?${q}` : ""
}

/* Active filter summary chips */
const ActiveChips = ({
  q,
  sort,
  filter,
  decade,
}: {
  q: string
  sort: ArchiveSort
  filter: ArchiveFilter
  decade: string
}) => {
  const base = { q, sort, filter, decade, page: undefined as string | undefined }

  const chip = (label: string, href: string) => (
    <Link
      key={label}
      href={href}
      className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground hover:bg-card/80"
    >
      {label}
      <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] text-primary">×</span>
    </Link>
  )

  const chips: React.ReactNode[] = []

  if (q) {
    const href = `/archive${buildQuery({ ...base, q: "" })}`
    chips.push(chip(`Search: “${q}”`, href))
  }
  if (filter !== "all") {
    const href = `/archive${buildQuery({ ...base, filter: "all" })}`
    const label = filter === "consensus" ? "Filter: consensus" : "Filter: controversial"
    chips.push(chip(label, href))
  }
  if (decade !== "all") {
    const href = `/archive${buildQuery({ ...base, decade: "all" })}`
    chips.push(chip(`Decade: ${decade}s`, href))
  }

  if (chips.length === 0) return null

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {chips}
      <Link
        href="/archive"
        className="text-xs text-muted-foreground underline-offset-4 hover:underline"
      >
        Reset all
      </Link>
    </div>
  )
}

const FilmRow = ({ film }: { film: PublicArchiveItem }) => {
  const avg = typeof film.avgScore === "number" ? film.avgScore : null
  const dissent = typeof film.dissent === "number" ? film.dissent : null
  const avgPct = avg ? Math.max(0, Math.min(100, (avg / 10) * 100)) : 0

  return (
    <Card className="border-border bg-card/40">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">{film.title}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {film.year} • {film.reviewsCount}/10 reviews
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md border border-border bg-primary/10 px-2 py-1 text-xs text-foreground">
              <span className="tabular-nums">{avg ? avg.toFixed(1) : "—"}</span>
              <span className="text-muted-foreground">avg</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-border bg-card/60 px-2 py-1 text-xs text-foreground">
              <span className="tabular-nums">{dissent ? dissent.toFixed(1) : "—"}</span>
              <span className="text-muted-foreground">dissent</span>
            </span>
          </div>
        </div>

        {/* Subtle average score meter */}
        <div className="mt-3 h-1.5 rounded-full bg-white/10">
          <div
            className="h-1.5 rounded-full bg-primary/70"
            style={{ width: `${avgPct}%` }}
            aria-hidden="true"
          />
        </div>
      </CardContent>
    </Card>
  )
}

const FilterBar = ({
  q,
  sort,
  filter,
  decade,
}: {
  q: string
  sort: ArchiveSort
  filter: ArchiveFilter
  decade: string
}) => {
  const decades = ["all", "1950", "1960", "1970", "1980", "1990", "2000", "2010", "2020"]

  return (
    <form method="GET" className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto] md:items-end">
      {/* Search */}
      <div className="md:col-span-1">
        <label htmlFor="q" className="mb-1 block text-xs text-muted-foreground">
          Search
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Search title…"
            className="w-full rounded-md border border-border bg-card/60 px-8 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Sort */}
      <div>
        <label htmlFor="sort" className="mb-1 block text-xs text-muted-foreground">
          Sort
        </label>
        <select
          id="sort"
          name="sort"
          defaultValue={sort}
          className="w-full rounded-md border border-border bg-card/60 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="recent">Most recent</option>
          <option value="rating">Highest rated</option>
          <option value="dissent">Most controversial</option>
          <option value="alpha">A–Z</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>

      {/* Filter */}
      <div>
        <label htmlFor="filter" className="mb-1 block text-xs text-muted-foreground">
          Filter
        </label>
        <select
          id="filter"
          name="filter"
          defaultValue={filter}
          className="w-full rounded-md border border-border bg-card/60 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">All</option>
          <option value="consensus">Consensus</option>
          <option value="controversial">Controversial</option>
        </select>
      </div>

      {/* Decade */}
      <div>
        <label htmlFor="decade" className="mb-1 block text-xs text-muted-foreground">
          Decade
        </label>
        <select
          id="decade"
          name="decade"
          defaultValue={decade}
          className="w-full rounded-md border border-border bg-card/60 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {decades.map((d) => (
            <option key={d} value={d}>
              {d === "all" ? "All decades" : `${d}s`}
            </option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 md:ml-2">
        <Button asChild variant="outline" size="sm" aria-label="Reset filters" className="w-full md:w-auto">
          <Link href="/archive">Reset</Link>
        </Button>
        <Button type="submit" size="sm" className="w-full md:w-auto">
          Apply
        </Button>
      </div>

      {/* Helper note */}
      <div className="md:col-span-5">
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5" />
          “Dissent” reflects how divided the group was (standard deviation of scores).
        </div>
      </div>
    </form>
  )
}

const Paginator = ({
  page,
  total,
  q,
  sort,
  filter,
  decade,
}: {
  page: number
  total: number
  q: string
  sort: ArchiveSort
  filter: ArchiveFilter
  decade: string
}) => {
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  if (totalPages <= 1) return null

  const prev = page > 1 ? page - 1 : null
  const next = page < totalPages ? page + 1 : null

  return (
    <nav className="mt-6 flex items-center justify-between" aria-label="Pagination">
      <div className="text-xs text-muted-foreground">
        Page {page} of {totalPages}
      </div>
      <div className="flex items-center gap-2">
        <Button
          asChild
          variant="outline"
          size="sm"
          aria-label="Previous page"
          className={!prev ? "pointer-events-none opacity-40" : ""}
        >
          <Link
            href={`/archive${buildQuery({
              q,
              sort,
              filter,
              decade,
              page: prev ? String(prev) : undefined,
            })}`}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Prev
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="sm"
          aria-label="Next page"
          className={!next ? "pointer-events-none opacity-40" : ""}
        >
          <Link
            href={`/archive${buildQuery({
              q,
              sort,
              filter,
              decade,
              page: next ? String(next) : undefined,
            })}`}
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </nav>
  )
}

const Page = async ({ searchParams }: PageProps) => {
  const sp = await searchParams

  const q = getParam(sp, "q")
  const sort = (getParam(sp, "sort", "recent") as ArchiveSort) ?? "recent"
  const filter = (getParam(sp, "filter", "all") as ArchiveFilter) ?? "all"
  const decade = getParam(sp, "decade", "all")
  const page = toInt(getParam(sp, "page"), 1)

  const decadeOpt = decade !== "all" && /^\d{4}$/.test(decade) ? Number(decade) : ("all" as const)

  const result = await getPublicArchive({
    q,
    filter,
    decade: decadeOpt,
    sort,
    page,
    perPage,
  }).catch(() => null)

  const total = result?.total ?? 0
  const items: PublicArchiveItem[] = result?.items ?? []

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 md:py-14">
      <SectionHeader title="Archive" subtitle={`Browse ${total} films discussed by the club`} />

      <Card className="mb-6 border-border bg-card/40">
        <CardContent className="p-6">
          <FilterBar q={q} sort={sort} filter={filter} decade={decade} />
          <ActiveChips q={q} sort={sort} filter={filter} decade={decade} />
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <Card className="text-center">
          <CardContent className="p-10 text-sm text-muted-foreground">
            No films match your filters. Try adjusting your search or{" "}
            <Link href="/archive" className="text-primary underline underline-offset-4">
              reset filters
            </Link>
            .
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3">
            {items.map((film) => (
              <FilmRow key={film.id} film={film} />
            ))}
          </div>

          <Paginator page={page} total={total} q={q} sort={sort} filter={filter} decade={decade} />
        </>
      )}
    </main>
  )
}

export default Page