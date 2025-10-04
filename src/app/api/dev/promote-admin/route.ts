// app/api/dev/promote-admin/route.ts
import { users } from "@/drizzle/schema";
import { db } from "@/lib/db/client";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_EMAIL = "mvlapatrick@gmail.com";
const ADMIN_USERNAME_BASE = "mvlapatrick";

export async function GET() {
  // Dev safeguard
  if (
    process.env.NODE_ENV === "production" ||
    process.env.EIGA_OPEN_ADMIN !== "1"
  ) {
    return new NextResponse("Not found", { status: 404 });
  }

  // 1) If user exists by email → set role admin + active
  const existing = await db
    .select({
      id: users.id,
      email: users.email,
      username: users.username,
      role: users.role,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.email, ADMIN_EMAIL))
    .limit(1);

  if (existing[0]) {
    await db
      .update(users)
      .set({ role: "admin", isActive: true })
      .where(eq(users.id, existing[0].id));

    return NextResponse.json({
      ok: true,
      action: "updated",
      user: { ...existing[0], role: "admin", isActive: true },
    });
  }

  // 2) Else create user with unique username
  const uniqueUsername = async (base: string) => {
    let name = base;
    let i = 1;

    while (true) {
      const clash = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, name))
        .limit(1);
      if (clash.length === 0) return name;
      name = `${base}${i++}`;
    }
  };

  const username = await uniqueUsername(ADMIN_USERNAME_BASE);

  const inserted = await db
    .insert(users)
    .values({
      email: ADMIN_EMAIL,
      username,
      role: "admin",
      isActive: true,
    })
    .returning({
      id: users.id,
      email: users.email,
      username: users.username,
      role: users.role,
      isActive: users.isActive,
    });

  return NextResponse.json({ ok: true, action: "created", user: inserted[0] });
}
