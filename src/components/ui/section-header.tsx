import { Separator } from "@/components/ui/separator"
import type { ReactNode } from "react"

type SectionHeaderProps = {
  title: string
  subtitle?: string
  action?: ReactNode
  className?: string
}

export const SectionHeader = ({ title, subtitle, action, className }: SectionHeaderProps) => (
  <div className={["mb-4", className].filter(Boolean).join(" ")}>
    <div className="flex items-center justify-between gap-4">
      <div>
        <h2 className="text-balance text-base font-semibold tracking-tight md:text-lg">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0 text-sm text-muted-foreground">{action}</div> : null}
    </div>
    <Separator className="mt-3 bg-border" />
  </div>
)