import mysql, { type QueryResult, type RowDataPacket } from "mysql2/promise";

const globalForDb = globalThis as unknown as { pool?: mysql.Pool };
function config() {
  const url = new URL(process.env.DATABASE_URL || "mysql://root@localhost:3306/digital_solutions");
  return { host: url.hostname, port: Number(url.port || 3306), user: decodeURIComponent(url.username), password: decodeURIComponent(url.password), database: url.pathname.slice(1), timezone: "Z", waitForConnections: true, connectionLimit: 5, maxIdle: 5, idleTimeout: 60_000, enableKeepAlive: true, keepAliveInitialDelay: 0, connectTimeout: 10_000 };
}
const mysqlPool = globalForDb.pool ?? mysql.createPool(config());
if (process.env.NODE_ENV !== "production") globalForDb.pool = mysqlPool;

function isReadQuery(sql: string) {
  return /^(SELECT|SHOW|WITH|DESCRIBE|EXPLAIN)\b/i.test(sql.trim());
}

async function resilientQuery<T extends QueryResult>(sql: string, values: unknown[] = []) {
  try {
    return await mysqlPool.query<T>(sql, values);
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (!isReadQuery(sql) || !["ECONNRESET", "PROTOCOL_CONNECTION_LOST", "ETIMEDOUT", "EPIPE"].includes(code || "")) throw error;
    await new Promise((resolve) => setTimeout(resolve, 150));
    return mysqlPool.query<T>(sql, values);
  }
}

export const pool = { query: resilientQuery, end: () => mysqlPool.end() };
type Where = { archived?: boolean; clientId?: string; status?: string | { in?: string[]; not?: string }; dueDate?: { lt?: Date } };
type DbAdapter = {
  client: { count(args?: any): Promise<number>; findMany(args?: any): Promise<any[]>; create(args: any): Promise<any> };
  project: { count(args?: any): Promise<number>; findMany(args?: any): Promise<any[]>; findUnique(args: any): Promise<any | null>; create(args: any): Promise<any>; update(args: any): Promise<any> };
  task: { findUnique(args: any): Promise<any | null>; update(args: any): Promise<any> };
  checklistTemplate: { count(args?: any): Promise<number>; create(args: any): Promise<any>; findMany(args?: any): Promise<any[]> };
  metric: { findMany(args?: any): Promise<any[]>; create(args: any): Promise<any> };
  payment: { findMany(args?: any): Promise<any[]>; create(args: any): Promise<any>; updateStatus(args: any): Promise<any> };
};
function whereSql(w: Where = {}) { const a: string[] = []; const v: unknown[] = []; if (w.clientId) { a.push("clientId = ?"); v.push(w.clientId); } if (typeof w.status === "string") { a.push("status = ?"); v.push(w.status); } if (w.status && typeof w.status === "object") { if (w.status.in) { a.push(`status IN (${w.status.in.map(() => "?").join(",")})`); v.push(...w.status.in); } if (w.status.not) { a.push("status <> ?"); v.push(w.status.not); } } if (w.dueDate?.lt) { a.push("dueDate < ?"); v.push(w.dueDate.lt); } return { sql: a.length ? `WHERE ${a.join(" AND ")}` : "", values: v }; }
async function enrichProject(p: RowDataPacket, include?: Record<string, unknown>) { if (!include) return p; if (include.client) { const [r] = await pool.query<RowDataPacket[]>("SELECT * FROM clients WHERE id=?", [p.clientId]); p.client = r[0]; } if (include.tasks) { const [r] = await pool.query<RowDataPacket[]>("SELECT * FROM tasks WHERE projectId=? ORDER BY createdAt", [p.id]); p.tasks = r; } if (include.followUps) { const [r] = await pool.query<RowDataPacket[]>("SELECT * FROM followUps WHERE projectId=? ORDER BY date", [p.id]); p.followUps = r; } for (const [key, table] of [["history", "histories"], ["deliverables", "deliverables"], ["checklistItems", "checklistItems"], ["changeRequests", "changeRequests"], ["resources", "resources"]] as const) if (include[key]) { const orderColumn = table === "histories" ? "date" : table === "resources" ? "title" : "createdAt"; const [r] = await pool.query<RowDataPacket[]>(`SELECT * FROM ${table} WHERE projectId=? ORDER BY ${orderColumn} DESC`, [p.id]); p[key] = r; } return p; }
// The small adapter intentionally exposes a Prisma-like shape while keeping the storage layer in mysql2.
// Route-level validation is handled by Zod; SQL values are always parameterized below.
export const db: DbAdapter = {
  client: {
    count: async ({ where = {} }: { where?: Where } = {}) => { const clause = where.archived === false ? "WHERE archived=0" : ""; const [r] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) count FROM clients ${clause}`); return Number(r[0].count); },
    findMany: async ({ where = {}, include }: { where?: Where; include?: Record<string, unknown> } = {}) => { const clause = where.archived === false ? "WHERE archived=0" : ""; const [r] = await pool.query<RowDataPacket[]>(`SELECT * FROM clients ${clause} ORDER BY name`); for (const c of r) if (include?._count) { const [n] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) count FROM projects WHERE clientId=?", [c.id]); c._count = { projects: Number(n[0].count) }; } return r; },
    create: async ({ data }: { data: Record<string, unknown> }) => { const id = crypto.randomUUID(); await pool.query("INSERT INTO clients (id,name,contactName,email,phone,website,notes,archived) VALUES (?,?,?,?,?,?,?,0)", [id, data.name, data.contactName || null, data.email || null, data.phone || null, data.website || null, data.notes || null]); return { id }; }
  },
  project: {
    count: async ({ where = {} }: { where?: Where } = {}) => { const w = whereSql(where); const [r] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) count FROM projects ${w.sql}`, w.values); return Number(r[0].count); },
    findMany: async ({ where = {}, include, take }: { where?: Where; include?: Record<string, unknown>; take?: number } = {}) => { const w = whereSql(where); const [r] = await pool.query<RowDataPacket[]>(`SELECT * FROM projects ${w.sql} ORDER BY dueDate ${take ? `LIMIT ${Number(take)}` : ""}`, w.values); return Promise.all(r.map(p => enrichProject(p, include))); },
    findUnique: async ({ where, include, select }: { where: { id: string }; include?: Record<string, unknown>; select?: Record<string, unknown> }) => { const [r] = await pool.query<RowDataPacket[]>("SELECT * FROM projects WHERE id=? LIMIT 1", [where.id]); if (!r[0]) return null; if (select?.status) return { status: r[0].status }; return enrichProject(r[0], include); },
    create: async ({ data }: { data: Record<string, unknown> }) => { const id = crypto.randomUUID(); await pool.query("INSERT INTO projects (id,clientId,name,description,services,phase,status,priority,startDate,dueDate,isExample) VALUES (?,?,?,?,?,?,?,?,?,?,?)", [id, data.clientId, data.name, data.description || null, JSON.stringify(data.services || []), data.phase, data.status, data.priority, data.startDate, data.dueDate, data.isExample ? 1 : 0]); const h = data.history as { create?: { type: string; description: string } } | undefined; if (h?.create) await pool.query("INSERT INTO histories (id,projectId,type,description,date) VALUES (?,?,?,?,NOW())", [crypto.randomUUID(), id, h.create.type, h.create.description]); return { id }; },
    update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => { if (data.status) await pool.query("UPDATE projects SET status=? WHERE id=?", [data.status, where.id]); const h = data.history as { create?: { type: string; description: string } } | undefined; if (h?.create) await pool.query("INSERT INTO histories (id,projectId,type,description,date) VALUES (?,?,?,?,NOW())", [crypto.randomUUID(), where.id, h.create.type, h.create.description]); return { id: where.id }; }
  },
  task: { findUnique: async ({ where }: { where: { id: string } }) => { const [r] = await pool.query<RowDataPacket[]>("SELECT * FROM tasks WHERE id=?", [where.id]); return r[0] || null; }, update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => { await pool.query("UPDATE tasks SET status=?,completedAt=? WHERE id=?", [data.status, data.completedAt || null, where.id]); return { id: where.id }; } },
  checklistTemplate: { count: async () => { const [r] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) count FROM checklistTemplates"); return Number(r[0].count); }, create: async ({ data }: { data: { name: string; service: string; items: { create: { title: string; position: number }[] } } }) => { const id = crypto.randomUUID(); await pool.query("INSERT INTO checklistTemplates (id,name,service) VALUES (?,?,?)", [id, data.name, data.service]); for (const i of data.items.create) await pool.query("INSERT INTO checklistTemplateItems (id,templateId,title,position) VALUES (?,?,?,?)", [crypto.randomUUID(), id, i.title, i.position]); return { id }; }, findMany: async ({ include }: { include?: Record<string, unknown> } = {}) => { const [r] = await pool.query<RowDataPacket[]>("SELECT * FROM checklistTemplates ORDER BY name"); for (const t of r) if (include?.items) { const [items] = await pool.query<RowDataPacket[]>("SELECT * FROM checklistTemplateItems WHERE templateId=? ORDER BY position", [t.id]); t.items = items; } return r; } },
  metric: { findMany: async ({ take }: { include?: Record<string, unknown>; orderBy?: unknown; take?: number } = {}) => { const [r] = await pool.query<RowDataPacket[]>(`SELECT m.*,p.name projectName,c.name clientName FROM metrics m JOIN projects p ON p.id=m.projectId JOIN clients c ON c.id=p.clientId ORDER BY m.date DESC LIMIT ${Number(take || 50)}`); return r.map(m => ({ ...m, project: { name: m.projectName, client: { name: m.clientName } } })); }, create: async ({ data }: { data: Record<string, unknown> }) => { const id = crypto.randomUUID(); await pool.query("INSERT INTO metrics (id,projectId,date,platform,name,investment,impressions,reach,clicks,results,interactions,publications) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", [id, data.projectId, data.date, data.platform, data.name, data.investment || null, data.impressions || null, data.reach || null, data.clicks || null, data.results || null, data.interactions || null, data.publications || null]); return { id }; } },
  payment: {
    findMany: async ({ clientId, status, from, to }: { clientId?: string; status?: string; from?: string; to?: string } = {}) => { const conditions: string[] = []; const values: unknown[] = []; if (clientId) { conditions.push("p.clientId=?"); values.push(clientId); } if (status) { conditions.push("p.status=?"); values.push(status); } if (from) { conditions.push("p.paymentDate>=?"); values.push(from); } if (to) { conditions.push("p.paymentDate<=?"); values.push(to); } const [rows] = await pool.query<RowDataPacket[]>(`SELECT p.*, c.name clientName, pr.name projectName FROM payments p JOIN clients c ON c.id=p.clientId LEFT JOIN projects pr ON pr.id=p.projectId ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""} ORDER BY p.paymentDate DESC, p.createdAt DESC`, values); return rows.map((row) => ({ ...row, client: { name: row.clientName }, project: row.projectName ? { name: row.projectName } : null })); },
    create: async ({ data }: { data: Record<string, unknown> }) => { const id = crypto.randomUUID(); const status = data.status || "PENDING"; await pool.query("INSERT INTO payments (id,clientId,projectId,paymentDate,amount,concept,status,notes,confirmedAt) VALUES (?,?,?,?,?,?,?,?,?)", [id, data.clientId, data.projectId || null, data.paymentDate, data.amount, data.concept, status, data.notes || null, status === "CONFIRMED" ? new Date() : null]); return { id }; },
    updateStatus: async ({ where, status }: { where: { id: string }; status: "PENDING" | "CONFIRMED" }) => { await pool.query("UPDATE payments SET status=?,confirmedAt=? WHERE id=?", [status, status === "CONFIRMED" ? new Date() : null, where.id]); return { id: where.id }; },
  }
};
