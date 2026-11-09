import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// Endpoint keep-warm: dipanggil cron eksternal tiap 4-5 menit supaya
// compute Neon tidak suspend dan instance Vercel tetap hangat.
// Tanpa ini, kunjungan pertama setelah idle menanggung cold start
// (0.5-2 detik) yang terasa sebagai "app lemot tiba-tiba".
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, at: new Date().toISOString() });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
