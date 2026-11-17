import { NextResponse } from "next/server";
import * as webpush from "web-push";
import type { RowDataPacket } from "mysql2";
import { isAuthenticated } from "@/lib/auth";
import { pool } from "@/lib/db";

type Subscription = RowDataPacket & { id: string; endpoint: string; p256dh: string; auth: string };

export async function POST() {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_SUBJECT) return NextResponse.json({ error: "VAPID no configurado" }, { status: 503 });
  webpush.setVapidDetails(process.env.VAPID_SUBJECT, process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  const [subscriptions] = await pool.query<Subscription[]>("SELECT id,endpoint,p256dh,auth FROM pushSubscriptions");
  let sent = 0;
  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, JSON.stringify({ title: "Prueba de Digital Solutions", body: "Las notificaciones push están funcionando.", url: "/marketing" }));
      sent += 1;
    } catch (error) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) await pool.query("DELETE FROM pushSubscriptions WHERE id=?", [subscription.id]);
    }
  }
  return NextResponse.json({ ok: true, sent });
}
