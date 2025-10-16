import { SectionHeader } from "@/components/ui/section-header"

export type ThemeTextItem = { title: string; year?: number }

type ThemeTextListProps = {
  title: string
  subtitle: string
  items: ThemeTextItem[]
  className?: string
}

export const ThemeTextList = ({
  title,
  subtitle,
  items,
  className,
}: ThemeTextListProps) => (
  <section className={["mt-10", className].filter(Boolean).join(" ")}>
    <SectionHeader title={title} subtitle={subtitle} />
    <div className="rounded-2xl border border-border bg-card/20 p-4">
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
        {items.map((f) => (
          <li
            key={`${f.title}-${f.year ?? "n/a"}`}
            className="flex items-center justify-between gap-2"
          >
            <span className="truncate text-sm">{f.title}</span>
            <span className="text-xs text-muted-foreground">{f.year ?? ""}</span>
          </li>
        ))}
      </ul>
    </div>
  </section>
)