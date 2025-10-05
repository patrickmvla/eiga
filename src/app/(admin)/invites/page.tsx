/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(admin)/invites/page.tsx
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ButtonLink } from '@/components/ui/ButtonLink';

import { db } from '@/lib/db/client';
import { invites, users as usersTable } from '@/drizzle/schema';
import { desc, eq, sql as dsql } from 'drizzle-orm';

type Invite = {
  code: string;
  createdAt: string;   // ISO
  expiresAt: string;   // ISO
  usedBy?: string | null;
  usedAt?: string | null;
};
type WaitlistEntry = {
  id: number;
  name: string;
  email: string;
  letterboxd?: string | null;
  about: string;
  createdAt: string; // ISO
};

type AdminInvitesData = {
  seatsAvailable: number;
  invites: Invite[];
  waitlist: WaitlistEntry[];
};

// Best-effort fetch for settings
async function fetchSeatsAvailable(): Promise<number> {
  try {
    const rows: any = await db.execute(
      dsql`select key, value from "settings" where key = 'seatsAvailable' limit 1`
    );
    const rec =
      Array.isArray(rows) ? rows[0] : ('rows' in (rows as any) ? (rows as any).rows?.[0] : null);
    if (!rec) return 0;
    const n = Number(rec.value);
    return Number.isFinite(n) ? Math.max(0, Math.min(10, Math.floor(n))) : 0;
  } catch {
    return 0;
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
    .limit(200);

  const invs: Invite[] = rows.map((r) => ({
    code: r.code,
    createdAt: String(r.createdAt),
    expiresAt: String(r.expiresAt),
    usedAt: r.usedAt ? String(r.usedAt) : null,
    usedBy: r.usedBy ?? null,
  }));

  // Waitlist (best-effort: table may not exist)
  let waitlist: WaitlistEntry[] = [];
  try {
    const wrows: any = await db.execute(
      dsql`select id, name, email, letterboxd, about, created_at from "waitlist" order by created_at desc limit 50`
    );
    const arr =
      Array.isArray(wrows) ? (wrows as any) : ('rows' in (wrows as any) ? (wrows as any).rows : []);
    waitlist = (arr as any[]).map((w) => ({
      id: Number(w.id),
      name: String(w.name),
      email: String(w.email),
      letterboxd: w.letterboxd ? String(w.letterboxd) : null,
      about: String(w.about),
      createdAt: String(w.created_at ?? w.createdAt ?? new Date().toISOString()),
    }));
  } catch {
    // table may not exist; leave waitlist empty
    waitlist = [];
  }

  const seatsAvailable = await fetchSeatsAvailable();

  return {
    seatsAvailable,
    invites: invs,
    waitlist,
  };
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });

const inviteStatus = (i: Invite) => {
  const now = Date.now();
  const exp = new Date(i.expiresAt).getTime();
  if (i.usedAt) return { label: 'Used', cls: 'border-white/10 bg-white/5 text-neutral-300' };
  if (exp < now) return { label: 'Expired', cls: 'border-red-500/30 bg-red-500/10 text-red-300' };
  return { label: 'Unused', cls: 'border-olive-500/30 bg-olive-500/10 text-olive-200' };
};

const StatusBadge = ({ label, cls }: { label: string; cls: string }) => (
  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${cls}`}>{label}</span>
);

const Page = async () => {
  const data = await fetchAdminInvitesData();
  const { seatsAvailable, invites, waitlist } = data;

  const unusedInvites = invites.filter((i) => !i.usedAt && new Date(i.expiresAt).getTime() > Date.now()).length;
  const usedInvites = invites.filter((i) => !!i.usedAt).length;
  const expiredInvites = invites.filter((i) => !i.usedAt && new Date(i.expiresAt).getTime() <= Date.now()).length;

  return (
    <>
      <SectionHeader
        title="Invites & Waitlist"
        subtitle="Manage access and keep the circle at its intimate scale."
        action={<ButtonLink href="/manage" variant="outline" size="md">Back to Manage</ButtonLink>}
      />

      {/* Summary */}
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="text-xs uppercase tracking-wide text-neutral-400">Seats available</div>
          <div className="mt-1 text-lg font-semibold text-white tabular-nums">{seatsAvailable}</div>
          <div className="mt-1 text-xs text-neutral-500">
            Shown on public landing badge
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="text-xs uppercase tracking-wide text-neutral-400">Unused invites</div>
          <div className="mt-1 text-lg font-semibold text-white tabular-nums">{unusedInvites}</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="text-xs uppercase tracking-wide text-neutral-400">Used</div>
          <div className="mt-1 text-lg font-semibold text-white tabular-nums">{usedInvites}</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="text-xs uppercase tracking-wide text-neutral-400">Expired</div>
          <div className="mt-1 text-lg font-semibold text-white tabular-nums">{expiredInvites}</div>
        </div>
      </div>

      {/* Direct invite */}
      <section className="mt-8">
        <SectionHeader title="Send a direct invite" subtitle="Creates a code and emails a link to the recipient." />
        <Card padding="lg">
          <form method="POST" action="/api/admin/invites/send" className="grid gap-3 md:grid-cols-3 md:items-end">
            <div>
              <label htmlFor="to_email" className="mb-1 block text-xs text-neutral-400">
                Recipient email
              </label>
              <input
                id="to_email"
                name="to_email"
                type="email"
                required
                placeholder="you@example.com"
                className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
              />
            </div>
            <div>
              <label htmlFor="expires_in_days" className="mb-1 block text-xs text-neutral-400">
                Expires in (days)
              </label>
              <input
                id="expires_in_days"
                name="expires_in_days"
                type="number"
                min={1}
                max={90}
                defaultValue={14}
                className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-lg bg-olive-500 px-4 py-2 text-sm font-semibold text-neutral-950 transition-colors hover:bg-olive-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-olive-400/40"
              >
                Send invite
              </button>
              <Link
                href="/invites#waitlist"
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-200 hover:bg-white/10"
              >
                Pick from waitlist
              </Link>
            </div>
          </form>
        </Card>
      </section>

      {/* Bulk generation */}
      <section className="mt-8">
        <SectionHeader title="Generate invite codes" subtitle="Create one or more codes to share manually." />
        <Card padding="lg">
          <form method="POST" action="/api/admin/invites/create" className="grid gap-3 md:grid-cols-4 md:items-end">
            <div>
              <label htmlFor="quantity" className="mb-1 block text-xs text-neutral-400">Quantity</label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                min={1}
                max={20}
                defaultValue={3}
                className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
              />
            </div>
            <div>
              <label htmlFor="expires_in_days_2" className="mb-1 block text-xs text-neutral-400">Expires in (days)</label>
              <input
                id="expires_in_days_2"
                name="expires_in_days"
                type="number"
                min={1}
                max={90}
                defaultValue={14}
                className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="note" className="mb-1 block text-xs text-neutral-400">Note (optional)</label>
              <input
                id="note"
                name="note"
                placeholder="Context for these codes (internal)"
                className="w-full rounded-lg border border-white/10 bg-neutral-900/50 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-olive-400/40"
              />
            </div>
            <div>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-lg bg-olive-500 px-4 py-2 text-sm font-semibold text-neutral-950 transition-colors hover:bg-olive-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-olive-400/40"
              >
                Generate
              </button>
            </div>
          </form>
        </Card>
      </section>

      {/* Waitlist */}
      <section id="waitlist" className="mt-10">
        <SectionHeader title="Waitlist" subtitle="Approve strong fits by sending invites when seats open." />
        {waitlist.length === 0 ? (
          <Card padding="lg" className="text-sm text-neutral-400">
            The waitlist is empty.
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {waitlist.map((w) => (
              <Card key={w.id} padding="lg" className="grid gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">{w.name}</div>
                    <div className="text-xs text-neutral-500">{w.email}</div>
                    {w.letterboxd ? (
                      <a
                        href={w.letterboxd}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-neutral-300 underline underline-offset-4 hover:text-white"
                      >
                        Letterboxd
                      </a>
                    ) : null}
                  </div>
                  <div className="text-xs text-neutral-500">Joined {formatDate(w.createdAt)}</div>
                </div>
                <p className="text-sm text-neutral-300">{w.about}</p>

                <div className="flex flex-wrap items-center gap-2">
                  <form method="POST" action="/api/admin/waitlist/approve">
                    <input type="hidden" name="id" value={w.id} />
                    <input type="hidden" name="expires_in_days" value="14" />
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-md bg-olive-500 px-3 py-1.5 text-sm font-semibold text-neutral-950 transition-colors hover:bg-olive-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-olive-400/40"
                    >
                      Send invite
                    </button>
                  </form>
                  <form method="POST" action="/api/admin/waitlist/reject">
                    <input type="hidden" name="id" value={w.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
                    >
                      Reject
                    </button>
                  </form>
                  <form method="POST" action="/api/admin/waitlist/archive">
                    <input type="hidden" name="id" value={w.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-neutral-200 transition-colors hover:bg-white/10"
                    >
                      Archive
                    </button>
                  </form>
                </div>
              </Card>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-neutral-500">
          We email approved waitlist entries an invite link with an expiry window. Keep the circle at 10—only send invites when a seat opens.
        </p>
      </section>

      {/* Invites table */}
      <section className="mt-10">
        <SectionHeader title="Invite codes" subtitle="Track unused, used, and expired codes." />
        {invites.length === 0 ? (
          <Card padding="lg" className="text-sm text-neutral-400">
            No invites yet. Generate or send one above.
          </Card>
        ) : (
          <div className="grid gap-2">
            {invites.map((i) => {
              const st = inviteStatus(i);
              const isUnused = st.label === 'Unused';
              const isExpired = st.label === 'Expired';
              return (
                <Card key={i.code} padding="md" className="grid gap-2 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-sm tracking-tight text-neutral-100">
                        {i.code}
                      </span>
                      <StatusBadge label={st.label} cls={st.cls} />
                    </div>
                    <div className="mt-1 text-xs text-neutral-500">
                      Created {formatDate(i.createdAt)} • Expires {formatDate(i.expiresAt)}{' '}
                      {i.usedBy ? (
                        <>
                          • Used by <span className="text-neutral-300">@{i.usedBy}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center justify-end gap-2">
                    {isUnused && !isExpired ? (
                      <>
                        <form method="POST" action="/api/admin/invites/revoke">
                          <input type="hidden" name="code" value={i.code} />
                          <button
                            className="inline-flex items-center justify-center rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-200 transition-colors hover:bg-red-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
                            type="submit"
                          >
                            Revoke
                          </button>
                        </form>
                        <form method="POST" action="/api/admin/invites/extend">
                          <input type="hidden" name="code" value={i.code} />
                          <input type="hidden" name="extend_days" value="7" />
                          <button
                            className="inline-flex items-center justify-center rounded-md border border-olive-500/30 bg-olive-500/10 px-3 py-1.5 text-xs text-olive-200 transition-colors hover:bg-olive-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-olive-400/40"
                            type="submit"
                          >
                            Extend +7d
                          </button>
                        </form>
                      </>
                    ) : (
                      <form method="POST" action="/api/admin/invites/delete">
                        <input type="hidden" name="code" value={i.code} />
                        <button
                          className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-neutral-200 transition-colors hover:bg-white/10"
                          type="submit"
                        >
                          Remove
                        </button>
                      </form>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
        <p className="mt-3 text-xs text-neutral-500">
          Unused codes can be revoked or extended. Used/expired codes can be removed for housekeeping.
        </p>
      </section>
    </>
  );
};

export default Page;