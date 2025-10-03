// app/(members)/suggest/page.tsx
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';
import { SuggestForm } from '@/components/suggest/SuggestForm';

type Suggestion = {
  id: number;
  tmdbId: number;
  title: string;
  year?: number | null;
  posterUrl?: string | null;
  status: 'pending' | 'selected' | 'rejected' | 'expired';
  weekSuggested: string; // ISO date
};

type PageData = {
  hasSubmittedThisWeek: boolean;
  nextResetAt: string; // ISO Monday 00:00
  mySuggestions: Suggestion[];
};

// Mock data — replace with DB query
const fetchSuggestData = async (): Promise<PageData> => {
  const now = new Date();
  const day = now.getDay(); // 0 Sun, 1 Mon
  const monday = new Date(now);
  const diffToMon = ((day + 6) % 7);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - diffToMon);
  const nextReset = new Date(monday);
  nextReset.setDate(monday.getDate() + 7);

  return {
    hasSubmittedThisWeek: false,
    nextResetAt: nextReset.toISOString(),
    mySuggestions: [
      {
        id: 1,
        tmdbId: 76122,
        title: 'The Ascent',
        year: 1977,
        status: 'pending',
        weekSuggested: monday.toISOString(),
      },
      {
        id: 2,
        tmdbId: 14161,
        title: 'Beau Travail',
        year: 1999,
        status: 'selected',
        weekSuggested: new Date(monday.getTime() - 7 * 86400000).toISOString(),
      },
      {
        id: 3,
        tmdbId: 37797,
        title: 'La Cérémonie',
        year: 1995,
        status: 'expired',
        weekSuggested: new Date(monday.getTime() - 35 * 86400000).toISOString(),
      },
    ],
  };
};

const formatCountdown = (targetISO: string) => {
  const now = new Date();
  const target = new Date(targetISO);
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return 'soon';
  const mins = Math.floor(diff / 60000);
  const d = Math.floor(mins / (60 * 24));
  const h = Math.floor((mins % (60 * 24)) / 60);
  const m = mins % 60;
  return [d ? `${d}d` : null, h ? `${h}h` : null, `${m}m`].filter(Boolean).join(' ');
};

const StatusBadge = ({ status }: { status: Suggestion['status'] }) => {
  const map: Record<Suggestion['status'], string> = {
    pending: 'border-white/10 bg-white/5 text-neutral-300',
    selected: 'border-olive-500/30 bg-olive-500/10 text-olive-200',
    rejected: 'border-red-500/30 bg-red-500/10 text-red-300',
    expired: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
  };
  const label: Record<Suggestion['status'], string> = {
    pending: 'Pending',
    selected: 'Selected',
    rejected: 'Rejected',
    expired: 'Expired',
  };
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${map[status]}`}>{label[status]}</span>;
};

const Page = async () => {
  const data = await fetchSuggestData();
  const { hasSubmittedThisWeek, nextResetAt, mySuggestions } = data;

  return (
    <>
      <SectionHeader
        title="Suggest a film"
        subtitle="One suggestion per week. Admin selects Sunday night."
        action={<span className="text-xs text-neutral-500">Resets in {formatCountdown(nextResetAt)}</span>}
      />

      {/* Submission form */}
      <Card padding="lg" className={hasSubmittedThisWeek ? 'opacity-70' : ''}>
        {hasSubmittedThisWeek ? (
          <div className="mb-4 rounded-md border border-white/10 bg-white/5 p-3 text-sm text-neutral-300">
            You’ve used your weekly suggestion. You can submit again after the reset.
          </div>
        ) : null}
        <SuggestForm disabled={hasSubmittedThisWeek} action="/api/suggestions" />
        <p className="mt-3 text-xs text-neutral-500">
          Suggestions expire after 4 weeks if not selected. Admin balances eras, regions, and forms across weeks.
        </p>
      </Card>

      {/* Guidelines */}
      <section className="mt-8">
        <Card padding="lg">
          <h3 className="text-sm font-semibold text-neutral-100">What makes a good pitch?</h3>
          <ul className="mt-2 list-disc pl-5 text-sm text-neutral-300">
            <li>Name the thread it fits (e.g., “melancholy in East Asian cinema”).</li>
            <li>Mention specific elements to watch (form, sound, performance, context).</li>
            <li>Keep it focused—2–3 sentences is ideal.</li>
          </ul>
        </Card>
      </section>

      {/* Your recent suggestions */}
      <section className="mt-8">
        <SectionHeader title="Your recent suggestions" />
        {mySuggestions.length === 0 ? (
          <Card padding="lg" className="text-sm text-neutral-400">
            You haven’t suggested anything yet. Start with a title and a focused pitch.
          </Card>
        ) : (
          <div className="grid gap-3">
            {mySuggestions.map((s) => (
              <Card key={s.id} padding="md" className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white">
                    {s.title} {s.year ? <span className="text-neutral-400">({s.year})</span> : null}
                  </div>
                  <div className="mt-0.5 text-xs text-neutral-500">
                    Suggested week of {new Date(s.weekSuggested).toLocaleDateString()}
                  </div>
                </div>
                <StatusBadge status={s.status} />
              </Card>
            ))}
          </div>
        )}
      </section>
    </>
  );
};

export default Page;