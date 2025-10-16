import Image from "next/image"
import { Card } from "@/components/ui/card"
import { ImageOff } from "lucide-react"

export type PosterTileProps = {
  title: string
  year?: number | null
  posterUrl?: string | null
  className?: string
}

export const PosterTile = ({ title, year, posterUrl, className }: PosterTileProps) => (
  <Card className={["group overflow-hidden", className].filter(Boolean).join(" ")}>
    <div className="relative aspect-[2/3]">
      {posterUrl ? (
        <Image
          src={posterUrl}
          alt={`${title}${year ? ` (${year})` : ""}`}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted/40 text-muted-foreground">
          <ImageOff className="h-6 w-6" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <div className="truncate text-sm font-medium text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground">{year ?? ""}</div>
      </div>
    </div>
  </Card>
)