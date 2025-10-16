// app/(members)/profile/[username]/edit/page.tsx
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { SectionHeader } from "@/components/ui/section-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import { auth } from "@/lib/auth/utils"
import { db } from "@/lib/db/client"
import { users } from "@/drizzle/schema"
import { eq } from "drizzle-orm"

type PageProps = {
  params: Promise<{ username: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const getParam = (
  sp: Record<string, string | string[] | undefined>,
  key: string,
  def = ""
) => {
  const v = sp?.[key]
  return (Array.isArray(v) ? v[0] : v) ?? def
}

const errorMessage = (code?: string) => {
  switch (code) {
    case "invalid":
      return "Please check your entries and try again."
    case "username_in_use":
      return "That username is taken. Please choose another."
    case "forbidden":
      return "You can only edit your own profile."
    case "server":
      return "Something went wrong. Please try again shortly."
    default:
      return null
  }
}

const Page = async ({ params, searchParams }: PageProps) => {
  const { username } = await params

  const session = await auth()
  if (!session?.user) {
    redirect(`/login?callbackUrl=/profile/${username}/edit`)
  }

  const isAdmin = session.user.role === "admin"
  const isMe = session.user.username.toLowerCase() === username.toLowerCase()
  if (!isMe && !isAdmin) {
    redirect(`/profile/${username}?error=forbidden`)
  }

  // Load current user by username
  const row = await db
    .select({
      id: users.id,
      username: users.username,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.username, username))
    .limit(1)

  const u = row[0]
  if (!u) notFound()

  // Await searchParams (Next 15 requirement)
  const sp = await searchParams
  const saved = getParam(sp, "saved") === "1"
  const error = getParam(sp, "error") || undefined

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 md:py-14">
      <SectionHeader
        title="Edit profile"
        subtitle="Update your public profile details."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href={`/profile/${u.username}`}>Back to profile</Link>
          </Button>
        }
      />

      {saved ? (
        <Card className="mb-6 border-primary/30 bg-primary/10" aria-live="polite">
          <CardContent className="p-6">
            <h3 className="text-foreground">Profile updated</h3>
            <p className="mt-2 text-sm text-muted-foreground">Your changes are saved.</p>
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <Card className="mb-6 border-destructive/30 bg-destructive/10" aria-live="assertive">
          <CardContent className="p-6">
            <h3 className="text-foreground">Could not update profile</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {errorMessage(error) ?? "Please try again."}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border bg-card/40">
        <CardContent className="p-6">
          <form
            method="POST"
            action="/api/profile/update"
            acceptCharset="UTF-8"
            className="grid gap-4"
            noValidate
          >
            {/* Honeypot */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              className="absolute left-[-9999px] top-[-9999px] h-0 w-0 opacity-0"
              aria-hidden="true"
            />

            {/* Needed to authorize server route and compute redirect */}
            <input type="hidden" name="current_username" value={u.username} />

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="username" className="mb-1 block text-xs text-muted-foreground">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  minLength={3}
                  maxLength={20}
                  pattern="^[A-Za-z0-9_]+$"
                  title="3–20 characters. Letters, numbers, and underscore only."
                  required
                  defaultValue={u.username}
                  placeholder="e.g., mizoguchi_fan"
                  aria-describedby="username-help"
                  className="w-full rounded-md border border-border bg-card/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <p id="username-help" className="mt-1 text-xs text-muted-foreground">
                  3–20 characters, letters/numbers/underscore.
                </p>
              </div>

              <div>
                <label htmlFor="avatar_url" className="mb-1 block text-xs text-muted-foreground">
                  Avatar URL (optional)
                </label>
                <input
                  id="avatar_url"
                  name="avatar_url"
                  type="url"
                  inputMode="url"
                  defaultValue={u.avatarUrl ?? ""}
                  placeholder="https://…"
                  className="w-full rounded-md border border-border bg-card/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Public image URL. Leave blank to keep current avatar.
                </p>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-3">
              <Button type="submit" size="sm">
                Save changes
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/profile/${u.username}`}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}

export default Page