// components/approach/watch-for-list.tsx
import {
  FileText,
  Users,
  Camera,
  Palette,
  AudioLines,
  Scissors,
  Ruler,
  Scale,
  Layers,
  MoveRight,
  ChevronRight,
} from "lucide-react"

export const WatchForList = ({
  items,
  variant = "chips",
  className,
}: {
  items: string[]
  variant?: "chips" | "list"
  className?: string
}) => {
  const pickIcon = (label: string) => {
    const s = label.toLowerCase()
    if (s.startsWith("screenplay")) return FileText
    if (s.startsWith("perform")) return Users
    if (s.startsWith("camera")) return Camera
    if (s.startsWith("color") || s.includes("light")) return Palette
    if (s.startsWith("sound")) return AudioLines
    if (s.startsWith("editing")) return Scissors
    if (s.includes("design")) return Ruler
    if (s.startsWith("structure")) return Layers
    if (s.startsWith("ethics")) return Scale
    if (s.startsWith("movement") || s.startsWith("choreography")) return MoveRight
    return ChevronRight
  }

  if (variant === "chips") {
    return (
      <ul className={["flex flex-wrap gap-2", className].filter(Boolean).join(" ")}>
        {items.map((item, i) => {
          const Icon = pickIcon(item)
          return (
            <li
              key={i}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-card/50 px-2.5 py-1 text-xs text-muted-foreground"
            >
              <Icon className="h-3.5 w-3.5 text-primary" />
              <span>{item}</span>
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <ul className={["grid gap-2 text-sm text-muted-foreground md:grid-cols-2", className].filter(Boolean).join(" ")}>
      {items.map((item, i) => {
        const Icon = pickIcon(item)
        return (
          <li key={i} className="flex gap-2">
            <Icon className="mt-0.5 h-4 w-4 flex-none text-primary" />
            <span>{item}</span>
          </li>
        )
      })}
    </ul>
  )
}