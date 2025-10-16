import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, MessageSquare, ShieldCheck, Ticket } from "lucide-react";
import Link from "next/link";

type InviteCtaProps = {
  seatsAvailable: number;
  className?: string;
};

export const InviteCta = ({ seatsAvailable, className }: InviteCtaProps) => (
  <Card
    className={[
      "relative overflow-hidden rounded-2xl border border-border bg-card/50 shadow-lg",
      className,
    ]
      .filter(Boolean)
      .join(" ")}
  >
    {/* Olive glow + subtle vignette */}
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-foreground/5" />
    <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(70%_80%_at_50%_30%,black,transparent)]" />

    <CardContent className="relative z-10 p-6 text-center md:p-10">
      <div className="mb-3 flex items-center justify-center">
        <Badge
          className={
            seatsAvailable > 0
              ? "border-primary/20 bg-primary/10 text-foreground"
              : "border-border bg-muted/40 text-muted-foreground"
          }
          aria-live="polite"
        >
          {seatsAvailable > 0
            ? `${seatsAvailable} seat${seatsAvailable === 1 ? "" : "s"} open`
            : "Waitlist only"}
        </Badge>
      </div>

      <h3 className="text-2xl font-semibold tracking-tight">
        Interested in joining Eiga?
      </h3>
      <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
        A small, serious club for weekly film discourse. Request an invite, tell
        us about your tastes, and we’ll reach out when a seat opens.
      </p>

      {/* Feature bullets */}
      <ul className="mx-auto mt-6 grid max-w-3xl grid-cols-2 gap-3 text-left text-sm text-muted-foreground sm:grid-cols-4">
        <li className="flex items-center justify-center gap-2 sm:justify-start">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Curated members
        </li>
        <li className="flex items-center justify-center gap-2 sm:justify-start">
          <MessageSquare className="h-4 w-4 text-primary" />
          Thoughtful reviews
        </li>
        <li className="flex items-center justify-center gap-2 sm:justify-start">
          <Clock className="h-4 w-4 text-primary" />
          One film / week
        </li>
        <li className="flex items-center justify-center gap-2 sm:justify-start">
          <Ticket className="h-4 w-4 text-primary" />
          10 seats total
        </li>
      </ul>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/request-invite">Request an invite</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/archive">Browse archive</Link>
        </Button>
      </div>
    </CardContent>
  </Card>
);
