// app/(members)/suggest/page.tsx
import { redirect } from "next/navigation"

import { SectionHeader } from "@/components/ui/section-header"
import { Card, CardContent } from "@/components/ui/card"
import { SuggestForm } from "@/components/suggest/suggest-form"
import { auth } from "@/lib/auth/utils"
import { getSuggestPageData } from "@/lib/db/queries"

type SuggestStatus = "pending" | "selected" | "rejected" | "expired"

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" })

const formatCountdown = (targetISO: string) => {
  const now = new Date()
  const target = new Date(targetISO)
  const diff = target.getTime() - now.getTime()
  if (diff <= 0) return "soon"
  const mins = Math.floor(diff / 60000)
  const d = Math.floor(mins / (60 * 24))
  const h = Math.floor((mins % (60 * 24)) / 60)
  const m = mins % 60
  return [d ? `${d}d` : null, h ? `${h}h` : null, `${m}m`].filter(Boolean).join(" ")
}

const StatusBadge = ({ status }: { status: SuggestStatus }) => {
  const map: Record<SuggestStatus, { cls: string; label: string }> = {
    pending: { cls: "border-border bg-card/60 text-muted-foreground", label: "Pending" },
    selected: { cls: "border-primary/30 bg-primary/10 text-foreground", label: "Selected" },
    rejected: { cls: "border-destructive/30 bg-destructive/10 text-destructive", label: "Rejected" },
    expired: { cls: "border-border bg-card/60 text-muted-foreground", label: "Expired" },
  }
  const m = map[status]
  return <span className={["inline-flex rounded-full px-2 py-0.5 text-xs", m.cls].join(" ")}>{m.label}</span>
}

const Page = async () => {
  const session = await auth()
  if (!session?.user) {
    redirect("/login?callbackUrl=/suggest")
  }

  const data = await getSuggestPageData(session.user.id).catch(() => null)

  const hasSubmittedThisWeek = data?.hasSubmittedThisWeek ?? false
  const nextResetAt = data?.nextResetAt ?? new Date(Date.now() + 7 * 86400000).toISOString()
  const mySuggestions = data?.mySuggestions ?? []

  return (
    <>
      <SectionHeader
        title="Suggest a film"
        subtitle="One suggestion per week. Admin selects Sunday night."
        action={
          <span className="text-xs text-muted-foreground" suppressHydrationWarning>
            Resets in {formatCountdown(nextResetAt)}
          </span>
        }
      />

      {/* Submission form */}
      <Card className={["mb-6 border-border bg-card/40", hasSubmittedThisWeek ? "opacity-70" : ""].join(" ")}>
        <CardContent className="p-6">
          {hasSubmittedThisWeek ? (
            <div className="mb-4 rounded-md border border-border bg-card/60 p-3 text-sm text-muted-foreground">
              You’ve used your weekly suggestion. You can submit again after the reset.
            </div>
          ) : null}
          <SuggestForm disabled={hasSubmittedThisWeek} action="/api/suggestions" />
          <p className="mt-3 text-xs text-muted-foreground">
            Suggestions expire after 4 weeks if not selected. Admin balances eras, regions, and forms across weeks.
          </p>
        </CardContent>
      </Card>

      {/* Guidelines */}
      <section className="mt-8">
        <Card className="border-border bg-card/40">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-foreground">What makes a good pitch?</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
              <li>Name the thread it fits (e.g., “melancholy in East Asian cinema”).</li>
              <li>Mention specific elements to watch (form, sound, performance, context).</li>
              <li>Keep it focused—2–3 sentences is ideal.</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Your recent suggestions */}
      <section className="mt-8">
        <SectionHeader title="Your recent suggestions" />
        {mySuggestions.length === 0 ? (
          <Card className="border-border bg-card/40">
            <CardContent className="p-6 text-sm text-muted-foreground">
              You haven’t suggested anything yet. Start with a title and a focused pitch.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {mySuggestions.map((s) => (
              <Card key={s.id} className="border-border bg-card/40">
                <CardContent className="grid gap-2 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-foreground">{s.title}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        Suggested week of {formatDate(s.weekSuggested)}
                      </div>
                    </div>
                    <StatusBadge status={s.status as SuggestStatus} />
                  </div>
                  {s.pitch ? <p className="line-clamp-2 text-sm text-muted-foreground">{s.pitch}</p> : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </>
  )
}

export default Page