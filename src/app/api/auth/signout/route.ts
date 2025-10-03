// app/api/auth/signout/route.ts
import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth/utils';

export async function POST() {
  await destroySession();
  return NextResponse.redirect('/login', { status: 303 });
}