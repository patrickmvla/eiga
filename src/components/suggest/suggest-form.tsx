"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TmdbSearch } from "./tmdb-search";

type Picked = {
  tmdbId: number;
  title: string;
  year?: number | null;
  posterUrl?: string | null;
};

export const SuggestForm = ({
  disabled = false,
  action = "/api/suggestions",
}: {
  disabled?: boolean;
  action?: string;
}) => {
  const [picked, setPicked] = useState<Picked | null>(null);
  const [pitch, setPitch] = useState("");

  const pitchLen = pitch.trim().length;
  const validPitch = pitchLen >= 10 && pitchLen <= 500;
  const canSubmit = !!picked && validPitch && !disabled;

  const helper = useMemo(() => {
    if (pitchLen === 0) return "Write 2–3 sentences (10–500 characters).";
    if (pitchLen < 10)
      return `Keep going… ${10 - pitchLen} more to meet the minimum.`;
    if (pitchLen > 500) return `Please trim ${pitchLen - 500} characters.`;
    return `${pitchLen} / 500 characters`;
  }, [pitchLen]);

  const helperTone =
    pitchLen === 0 || validPitch ? "text-muted-foreground" : "text-destructive";

  return (
    <form method="POST" action={action} className="grid gap-4">
      {/* Honeypot (shadcn Input, visually hidden) */}
      <Input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="absolute left-[-9999px] top-[-9999px] h-0 w-0 opacity-0"
        aria-hidden="true"
      />

      <fieldset disabled={disabled} className="grid gap-4 disabled:opacity-60">
        <TmdbSearch onPick={setPicked} disabled={disabled} />

        {/* Hidden fields populated when picked (shadcn Input) */}
        <Input type="hidden" name="tmdb_id" value={picked?.tmdbId ?? ""} />
        <Input type="hidden" name="title" value={picked?.title ?? ""} />
        {picked?.year ? (
          <Input type="hidden" name="year" value={String(picked.year)} />
        ) : null}
        {picked?.posterUrl ? (
          <Input type="hidden" name="poster_url" value={picked.posterUrl} />
        ) : null}

        <div>
          <Label
            htmlFor="pitch"
            className="mb-1 block text-xs text-muted-foreground"
          >
            Your pitch
          </Label>
          <Textarea
            id="pitch"
            name="pitch"
            required
            minLength={10}
            maxLength={500}
            rows={5}
            placeholder="Why this film? What should we pay attention to? Where does it fit in our ongoing threads?"
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
            aria-describedby="pitch-help"
            aria-invalid={pitchLen > 0 && !validPitch ? "true" : "false"}
          />
          <div
            id="pitch-help"
            className={["mt-1 text-xs", helperTone].join(" ")}
          >
            {helper}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button type="submit" size="sm" disabled={!canSubmit}>
            Submit suggestion
          </Button>
          {!picked ? (
            <span className="text-xs text-muted-foreground">
              Pick a film to enable submission.
            </span>
          ) : null}
        </div>
      </fieldset>
    </form>
  );
};
