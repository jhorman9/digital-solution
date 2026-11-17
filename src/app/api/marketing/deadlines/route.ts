import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { isAuthenticated } from "@/lib/auth";
import { pool } from "@/lib/db";

type Deadline = RowDataPacket & {
  id: string;
  expenseDate: string;
  days: number | null;
  concept: string;
  clientName: string;
};

export async function GET() {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const [rows] = await pool.query<Deadline[]>(
    "SELECT e.id, DATE_FORMAT(e.expenseDate, '%Y-%m-%d') expenseDate, e.days, e.concept, c.name clientName FROM expenses e JOIN clients c ON c.id=e.clientId WHERE e.clientId IS NOT NULL",
  );
  return NextResponse.json({ deadlines: rows });
}
