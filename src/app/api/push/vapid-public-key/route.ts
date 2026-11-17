import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";

export async function GET() {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) return NextResponse.json({ error: "VAPID no configurado" }, { status: 503 });
  return NextResponse.json({ publicKey: key });
}
