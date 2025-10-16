import Image from "next/image"

export type ActorCardProps = {
  name: string
  role?: string
  profileUrl: string | null
  note: string
  className?: string
}

export const ActorCard = ({ name, role, profileUrl, note, className }: ActorCardProps) => (
  <div className={["group flex gap-3 rounded-md border border-border bg-card/40 p-3 transition-colors hover:bg-card/60", className].filter(Boolean).join(" ")}>
    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border/60 bg-muted/40">
      {profileUrl ? (
        <Image
          src={profileUrl}
          alt={name}
          fill
          sizes="64px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-muted-foreground">
          {name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
        </div>
      )}
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-sm font-medium text-foreground">{name}</div>
      {role ? <div className="text-xs italic text-muted-foreground">as {role}</div> : null}
      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{note}</p>
    </div>
  </div>
)