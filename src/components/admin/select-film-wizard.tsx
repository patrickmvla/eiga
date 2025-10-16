"use client";

import { useMemo, useState } from "react";
import { TmdbSearch } from "@/components/suggest/tmdb-search";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Picked = {
  tmdbId: number;
  title: string;
  year?: number | null;
  posterUrl?: string | null;
};

export const SelectFilmWizard = ({
  defaultWeekStart,
  initialPick,
  action = "/api/admin/films/schedule", 
}: {
  defaultWeekStart: string; 
  initialPick?: Picked | null;
  action?: string;
}) => {
  const [picked, setPicked] = useState<Picked | null>(initialPick ?? null);
  const [why, setWhy] = useState("");
  const [themes, setThemes] = useState("");
  const [technical, setTechnical] = useState("");
  const [context, setContext] = useState("");
  const [weekStart, setWeekStart] = useState(defaultWeekStart);
  const [status, setStatus] = useState<"upcoming" | "current">("upcoming");

  const canSubmit = useMemo(
    () => !!picked && weekStart.length > 0,
    [picked, weekStart]
  );

  return (
    <form method="POST" action={action} className="grid gap-4">
      {/* Honeypot */}
      <Input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="absolute left-[-9999px] top-[-9999px] h-0 w-0 opacity-0"
        aria-hidden="true"
      />

      <fieldset className="grid gap-4">
        {/* TMDB search and pick */}
        <TmdbSearch onPick={setPicked} initial={initialPick ?? null} />

        {/* Hidden fields from pick */}
        <Input type="hidden" name="tmdb_id" value={picked?.tmdbId ?? ""} />
        <Input type="hidden" name="title" value={picked?.title ?? ""} />
        {picked?.year ? (
          <Input type="hidden" name="year" value={String(picked.year)} />
        ) : null}
        {picked?.posterUrl ? (
          <Input type="hidden" name="poster_url" value={picked.posterUrl} />
        ) : null}

        {/* The Setup */}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label htmlFor="why" className="mb-1 block text-xs text-muted-foreground">
              Why this film
            </Label>
            <Textarea
              id="why"
              name="why"
              rows={3}
              placeholder="Why now, and why for this group?"
              value={why}
              onChange={(e) => setWhy(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="themes" className="mb-1 block text-xs text-muted-foreground">
              Themes to consider (one per line)
            </Label>
            <Textarea
              id="themes"
              name="themes"
              rows={4}
              placeholder={"e.g., Restraint as romance\nMemory as mise-en-scène"}
              value={themes}
              onChange={(e) => setThemes(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="technical" className="mb-1 block text-xs text-muted-foreground">
              Technical notes (optional, one per line)
            </Label>
            <Textarea
              id="technical"
              name="technical"
              rows={4}
              placeholder={"e.g., Framing through thresholds\nMotifs in score"}
              value={technical}
              onChange={(e) => setTechnical(e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="context" className="mb-1 block text-xs text-muted-foreground">
              Context (optional)
            </Label>
            <Input
              id="context"
              name="context"
              placeholder="Thread or programming context (e.g., melancholy in East Asian cinema)"
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
          </div>
        </div>

        {/* Schedule */}
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label htmlFor="week_start" className="mb-1 block text-xs text-muted-foreground">
              Week start (Monday)
            </Label>
            <Input
              id="week_start"
              name="week_start"
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              The film will drop at 00:00 on this date.
            </p>
          </div>

          <div>
            <Label htmlFor="status" className="mb-1 block text-xs text-muted-foreground">
              Status
            </Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as "upcoming" | "current")}
              name="status"
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Set status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="current">Set as current now</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-2">
          <Button type="submit" size="sm" disabled={!canSubmit}>
            Schedule film
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