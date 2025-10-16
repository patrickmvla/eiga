// app/api/auth/signout/route.ts
import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/utils";

// Next 15 requires absolute URLs for redirects
export async function POST(req: Request) {
  await destroySession();
  return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
}