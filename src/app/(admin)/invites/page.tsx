/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(admin)/invites/page.tsx
import Link from "next/link"

import { Card, CardContent } from "@/components/ui/card"
import { SectionHeader } from "@/components/ui/section-header"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

import { db } from "@/lib/db/client"
import { invites, users as usersTable } from "@/drizzle/schema"
import { desc, eq, sql as dsql } from "drizzle-orm"

type Invite = {
  code: string
  createdAt: string // ISO
  expiresAt: string // ISO
  usedBy?: string | null
  usedAt?: string | null
}
type WaitlistEntry = {
  id: number
  name: string
  email: string
  letterboxd?: string | null
  about: string
  createdAt: string // ISO
}

type AdminInvitesData = {
  seatsAvailable: number
  invites: Invite[]
  waitlist: WaitlistEntry[]
}

// Best-effort fetch for settings
async function fetchSeatsAvailable(): Promise<number> {
  try {
    const rows: any = await db.execute(
      dsql`select key, value from "settings" where key = 'seatsAvailable' limit 1`
    )
    const rec =
      Array.isArray(rows) ? rows[0] : "rows" in (rows as any) ? (rows as any).rows?.[0] : null
    if (!rec) return 0
    const n = Number(rec.value)
    return Number.isFinite(n) ? Math.max(0, Math.min(10, Math.floor(n))) : 0
  } catch {
    return 0
  }
}

const fetchAdminInvitesData = async (): Promise<AdminInvitesData> => {
  // Invites list with usedBy username (if present)
  const rows = await db
    .select({
      code: invites.code,
      createdAt: invites.createdAt,
      expiresAt: invites.expiresAt,
      usedAt: invites.usedAt,
      usedBy: usersTable.username, // nullable when usedBy is null
    })
    .from(invites)
    .leftJoin(usersTable, eq(usersTable.id, invites.usedBy))
    .orderBy(desc(invites.createdAt))
    .limit(200)

  const invs: Invite[] = rows.map((r) => ({
    code: r.code,
    createdAt: String(r.createdAt),
    expiresAt: String(r.expiresAt),
    usedAt: r.usedAt ? String(r.usedAt) : null,
    usedBy: r.usedBy ?? null,
  }))

  // Waitlist (best-effort: table may not exist)
  let waitlist: WaitlistEntry[] = []
  try {
    const wrows: any = await db.execute(
      dsql`select id, name, email, letterboxd, about, created_at from "waitlist" order by created_at desc limit 50`
    )
    const arr = Array.isArray(wrows) ? (wrows as any) : "rows" in (wrows as any) ? (wrows as any).rows : []
    waitlist = (arr as any[]).map((w) => ({
      id: Number(w.id),
      name: String(w.name),
      email: String(w.email),
      letterboxd: w.letterboxd ? String(w.letterboxd) : null,
      about: String(w.about),
      createdAt: String(w.created_at ?? w.createdAt ?? new Date().toISOString()),
    }))
  } catch {
    // table may not exist; leave waitlist empty
    waitlist = []
  }

  const seatsAvailable = await fetchSeatsAvailable()

  return {
    seatsAvailable,
    invites: invs,
    waitlist,
  }
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  })

const inviteStatus = (i: Invite) => {
  const now = Date.now()
  const exp = new Date(i.expiresAt).getTime()
  if (i.usedAt) return { label: "Used", cls: "border-border bg-card/60 text-muted-foreground" }
  if (exp < now)
    return { label: "Expired", cls: "border-destructive/30 bg-destructive/10 text-destructive" }
  return { label: "Unused", cls: "border-primary/30 bg-primary/10 text-foreground" }
}

const StatusBadge = ({ label, cls }: { label: string; cls: string }) => (
  <span className={["inline-flex rounded-full px-2 py-0.5 text-xs", cls].join(" ")}>{label}</span>
)

const Page = async () => {
  const data = await fetchAdminInvitesData()
  const { seatsAvailable, invites, waitlist } = data

  const unusedInvites = invites.filter(
    (i) => !i.usedAt && new Date(i.expiresAt).getTime() > Date.now()
  ).length
  const usedInvites = invites.filter((i) => !!i.usedAt).length
  const expiredInvites = invites.filter(
    (i) => !i.usedAt && new Date(i.expiresAt).getTime() <= Date.now()
  ).length

  return (
    <>
      <SectionHeader
        title="Invites & Waitlist"
        subtitle="Manage access and keep the circle at its intimate scale."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/manage">Back to Manage</Link>
          </Button>
        }
      />

      {/* Summary */}
      <div className="grid gap-3 md:grid-cols-4">
        <Card className="border-border bg-card/40">
          <CardContent className="p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Seats available</div>
            <div className="mt-1 tabular-nums text-lg font-semibold text-foreground">
              {seatsAvailable}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">Shown on public landing badge</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/40">
          <CardContent className="p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Unused invites</div>
            <div className="mt-1 tabular-nums text-lg font-semibold text-foreground">
              {unusedInvites}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/40">
          <CardContent className="p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Used</div>
            <div className="mt-1 tabular-nums text-lg font-semibold text-foreground">{usedInvites}</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/40">
          <CardContent className="p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Expired</div>
            <div className="mt-1 tabular-nums text-lg font-semibold text-foreground">
              {expiredInvites}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Direct invite */}
      <section className="mt-8">
        <SectionHeader
          title="Send a direct invite"
          subtitle="Creates a code and emails a link to the recipient."
        />
        <Card className="border-border bg-card/40">
          <CardContent className="p-6">
            <form
              method="POST"
              action="/api/admin/invites/send"
              className="grid gap-3 md:grid-cols-3 md:items-end"
            >
              <div>
                <Label htmlFor="to_email" className="mb-1 block text-xs text-muted-foreground">
                  Recipient email
                </Label>
                <Input
                  id="to_email"
                  name="to_email"
                  type="email"
                  required
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <Label htmlFor="expires_in_days" className="mb-1 block text-xs text-muted-foreground">
                  Expires in (days)
                </Label>
                <Input id="expires_in_days" name="expires_in_days" type="number" min={1} max={90} defaultValue={14} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm">
                  Send invite
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/invites#waitlist">Pick from waitlist</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>

      {/* Bulk generation */}
      <section className="mt-8">
        <SectionHeader
          title="Generate invite codes"
          subtitle="Create one or more codes to share manually."
        />
        <Card className="border-border bg-card/40">
          <CardContent className="p-6">
            <form
              method="POST"
              action="/api/admin/invites/create"
              className="grid gap-3 md:grid-cols-4 md:items-end"
            >
              <div>
                <Label htmlFor="quantity" className="mb-1 block text-xs text-muted-foreground">
                  Quantity
                </Label>
                <Input id="quantity" name="quantity" type="number" min={1} max={20} defaultValue={3} />
              </div>
              <div>
                <Label
                  htmlFor="expires_in_days_2"
                  className="mb-1 block text-xs text-muted-foreground"
                >
                  Expires in (days)
                </Label>
                <Input
                  id="expires_in_days_2"
                  name="expires_in_days"
                  type="number"
                  min={1}
                  max={90}
                  defaultValue={14}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="note" className="mb-1 block text-xs text-muted-foreground">
                  Note (optional)
                </Label>
                <Input
                  id="note"
                  name="note"
                  placeholder="Context for these codes (internal)"
                />
              </div>
              <div>
                <Button type="submit" size="sm">
                  Generate
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>

      {/* Waitlist */}
      <section id="waitlist" className="mt-10">
        <SectionHeader
          title="Waitlist"
          subtitle="Approve strong fits by sending invites when seats open."
        />
        {waitlist.length === 0 ? (
          <Card className="border-border bg-card/40">
            <CardContent className="p-6 text-sm text-muted-foreground">
              The waitlist is empty.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {waitlist.map((w) => (
              <Card key={w.id} className="border-border bg-card/40">
                <CardContent className="grid gap-3 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-foreground">{w.name}</div>
                      <div className="text-xs text-muted-foreground">{w.email}</div>
                      {w.letterboxd ? (
                        <a
                          href={w.letterboxd}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-foreground underline underline-offset-4 hover:opacity-80"
                        >
                          Letterboxd
                        </a>
                      ) : null}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Joined {formatDate(w.createdAt)}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{w.about}</p>

                  <div className="flex flex-wrap items-center gap-2">
                    <form method="POST" action="/api/admin/waitlist/approve">
                      <Input type="hidden" name="id" value={String(w.id)} />
                      <Input type="hidden" name="expires_in_days" value="14" />
                      <Button type="submit" size="sm">
                        Send invite
                      </Button>
                    </form>
                    <form method="POST" action="/api/admin/waitlist/reject">
                      <Input type="hidden" name="id" value={String(w.id)} />
                      <Button type="submit" size="sm" variant="destructive">
                        Reject
                      </Button>
                    </form>
                    <form method="POST" action="/api/admin/waitlist/archive">
                      <Input type="hidden" name="id" value={String(w.id)} />
                      <Button type="submit" size="sm" variant="outline">
                        Archive
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          We email approved waitlist entries an invite link with an expiry window. Keep the circle at
          10—only send invites when a seat opens.
        </p>
      </section>

      {/* Invites table */}
      <section className="mt-10">
        <SectionHeader title="Invite codes" subtitle="Track unused, used, and expired codes." />
        {invites.length === 0 ? (
          <Card className="border-border bg-card/40">
            <CardContent className="p-6 text-sm text-muted-foreground">
              No invites yet. Generate or send one above.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-2">
            {invites.map((i) => {
              const st = inviteStatus(i)
              const isUnused = st.label === "Unused"
              const isExpired = st.label === "Expired"
              return (
                <Card
                  key={i.code}
                  className="grid gap-2 border-border bg-card/40 md:grid-cols-[1fr_auto] md:items-center"
                >
                  <CardContent className="p-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md border border-border bg-card/60 px-2 py-0.5 font-mono text-sm tracking-tight text-foreground">
                          {i.code}
                        </span>
                        <StatusBadge label={st.label} cls={st.cls} />
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Created {formatDate(i.createdAt)} • Expires {formatDate(i.expiresAt)}{" "}
                        {i.usedBy ? (
                          <>
                            • Used by <span className="text-foreground">@{i.usedBy}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-2 flex shrink-0 items-center justify-end gap-2 md:mt-0">
                      {isUnused && !isExpired ? (
                        <>
                          <form method="POST" action="/api/admin/invites/revoke">
                            <Input type="hidden" name="code" value={i.code} />
                            <Button type="submit" size="sm" variant="destructive">
                              Revoke
                            </Button>
                          </form>
                          <form method="POST" action="/api/admin/invites/extend">
                            <Input type="hidden" name="code" value={i.code} />
                            <Input type="hidden" name="extend_days" value="7" />
                            <Button type="submit" size="sm" variant="outline">
                              Extend +7d
                            </Button>
                          </form>
                        </>
                      ) : (
                        <form method="POST" action="/api/admin/invites/delete">
                          <Input type="hidden" name="code" value={i.code} />
                          <Button type="submit" size="sm" variant="outline">
                            Remove
                          </Button>
                        </form>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Unused codes can be revoked or extended. Used/expired codes can be removed for housekeeping.
        </p>
      </section>
    </>
  )
}

export default Page