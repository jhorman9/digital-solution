import { NextResponse } from "next/server";
import crypto from "node:crypto";
import * as webpush from "web-push";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { isAuthenticated } from "@/lib/auth";
import { pool } from "@/lib/db";

type DueExpense = { id: string; expenseDate: string; days: number | null; concept: string; clientName: string };
type Subscription = { id: string; endpoint: string; p256dh: string; auth: string };

function todayInPanama() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Panama", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
function addDays(value: string, days: number) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
function label(value: string) {
  return new Intl.DateTimeFormat("es-PA", { dateStyle: "medium", timeZone: "America/Panama" }).format(new Date(`${value}T12:00:00Z`));
}

export async function POST(request: Request) {
  const cronSecret = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!(await isAuthenticated()) && (!process.env.PUSH_CRON_SECRET || cronSecret !== process.env.PUSH_CRON_SECRET)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_SUBJECT) return NextResponse.json({ error: "VAPID no configurado" }, { status: 503 });

  webpush.setVapidDetails(process.env.VAPID_SUBJECT, process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  const today = todayInPanama();
  const [expenses] = await pool.query<(DueExpense & RowDataPacket)[]>("SELECT e.id, DATE_FORMAT(e.expenseDate, '%Y-%m-%d') expenseDate, e.days, e.concept, c.name clientName FROM expenses e JOIN clients c ON c.id=e.clientId WHERE e.clientId IS NOT NULL");
  const [subscriptions] = await pool.query<(Subscription & RowDataPacket)[]>("SELECT id,endpoint,p256dh,auth FROM pushSubscriptions");
  let sent = 0;

  for (const expense of expenses) {
    const endDate = addDays(expense.expenseDate, Math.max(1, Number(expense.days || 1)) - 1);
    const kind = endDate < today ? "EXPIRED" : endDate === today ? "DUE" : endDate === addDays(today, 1) ? "DUE_TOMORROW" : null;
    if (!kind) continue;
    const [created] = await pool.query<ResultSetHeader>("INSERT IGNORE INTO pushNotificationLog (id,expenseId,kind,notificationDate) VALUES (?,?,?,?)", [crypto.randomUUID(), expense.id, kind, today]);
    if (!created.affectedRows) continue;
    const title = kind === "EXPIRED" ? "Publicidad vencida" : kind === "DUE" ? "Publicidad vence hoy" : "Publicidad vence mañana";
    const body = `${expense.clientName} · ${expense.concept} · finaliza ${label(endDate)}`;
    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, JSON.stringify({ title, body, url: "/marketing" }));
        sent += 1;
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) await pool.query("DELETE FROM pushSubscriptions WHERE id=?", [subscription.id]);
      }
    }
  }
  return NextResponse.json({ ok: true, sent, checkedAt: today });
}
