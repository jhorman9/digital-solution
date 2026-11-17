import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { isAuthenticated } from "@/lib/auth";
import { pool } from "@/lib/db";

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({ p256dh: z.string().min(1).max(255), auth: z.string().min(1).max(255) }),
});

export async function POST(request: Request) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const parsed = subscriptionSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Suscripción inválida" }, { status: 400 });
  const { endpoint, keys } = parsed.data;
  await pool.query(
    "INSERT INTO pushSubscriptions (id,endpoint,p256dh,auth) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE p256dh=VALUES(p256dh),auth=VALUES(auth)",
    [crypto.randomUUID(), endpoint, keys.p256dh, keys.auth],
  );
  return NextResponse.json({ ok: true });
}
