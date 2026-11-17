"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { RowDataPacket } from "mysql2/promise";
import { db, pool } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

const text = (value: FormDataEntryValue | null) => String(value || "").trim();
const optionalNumber = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.coerce.number().min(0).optional(),
);
const clientSchema = z.object({
  name: z.string().min(2),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
});
const projectSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().min(2),
  description: z.string().optional(),
  services: z.string().min(1),
  phase: z.enum([
    "DISCOVERY",
    "DESIGN",
    "DEVELOPMENT",
    "CONTENT",
    "ADVERTISING",
    "SUPPORT",
    "CLOSURE",
  ]),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "IN_REVIEW", "COMPLETED"]),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  startDate: z.coerce.date(),
  dueDate: z.coerce.date(),
});
const idSchema = z.string().uuid();
const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida");

export async function createClient(form: FormData) {
  await requireAuth();
  const data = clientSchema.parse(Object.fromEntries(form));
  await db.client.create({ data });
  revalidatePath("/clientes");
  revalidatePath("/");
}
export async function updateClient(form: FormData) {
  await requireAuth();
  const id = idSchema.parse(text(form.get("id")));
  const data = clientSchema.parse(Object.fromEntries(form));
  await pool.query(
    "UPDATE clients SET name=?,contactName=?,email=?,phone=?,website=?,notes=? WHERE id=?",
    [
      data.name,
      data.contactName || null,
      data.email || null,
      data.phone || null,
      data.website || null,
      data.notes || null,
      id,
    ],
  );
  revalidatePath("/clientes");
  revalidatePath("/proyectos");
}
export async function archiveClient(form: FormData) {
  await requireAuth();
  const id = idSchema.parse(text(form.get("id")));
  await pool.query("UPDATE clients SET archived=1 WHERE id=?", [id]);
  revalidatePath("/clientes");
}

export async function restoreClient(form: FormData) {
  await requireAuth();
  const id = idSchema.parse(text(form.get("id")));
  await pool.query("UPDATE clients SET archived=0 WHERE id=?", [id]);
  revalidatePath("/clientes");
  revalidatePath("/proyectos");
}

export async function deleteClient(form: FormData) {
  await requireAuth();
  const id = idSchema.parse(text(form.get("id")));
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT
      (SELECT COUNT(*) FROM projects WHERE clientId=?) AS projects,
      (SELECT COUNT(*) FROM payments WHERE clientId=?) AS payments,
      (SELECT COUNT(*) FROM clientRevenues WHERE clientId=?) AS revenues,
      (SELECT COUNT(*) FROM expenses WHERE clientId=?) AS marketing`,
    [id, id, id, id],
  );
  const related = rows[0];
  if (related && Object.values(related).some((value) => Number(value) > 0)) {
    redirect(
      `/clientes?error=${encodeURIComponent("No se puede eliminar una empresa con historial. Archívala para conservar sus proyectos y movimientos.")}`,
    );
  }
  await pool.query("DELETE FROM clients WHERE id=?", [id]);
  revalidatePath("/clientes");
  revalidatePath("/proyectos");
  revalidatePath("/ingresos-clientes");
  revalidatePath("/marketing");
  revalidatePath("/");
}

export async function createProject(form: FormData) {
  await requireAuth();
  const raw = projectSchema.parse(Object.fromEntries(form));
  const p = await db.project.create({
    data: {
      ...raw,
      services: raw.services
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      history: { create: { type: "CREATED", description: "Proyecto creado" } },
    },
  });
  revalidatePath("/");
  revalidatePath("/proyectos");
  redirect(`/proyectos/${p.id}`);
}
export async function updateProjectStatus(
  id: string,
  status: "NOT_STARTED" | "IN_PROGRESS" | "IN_REVIEW" | "COMPLETED",
) {
  await requireAuth();
  const old = await db.project.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!old) throw new Error("Proyecto no encontrado");
  if (old.status !== status)
    await db.project.update({
      where: { id },
      data: {
        status,
        history: {
          create: {
            type: "STATUS",
            description: `Estado cambiado a ${status}`,
          },
        },
      },
    });
  revalidatePath("/");
  revalidatePath("/proyectos");
  revalidatePath(`/proyectos/${id}`);
}

export async function updateProjectName(id: string, name: string) {
  await requireAuth();
  const projectId = idSchema.parse(id);
  const nextName = z.string().min(2).max(180).parse(name.trim());
  await pool.query("UPDATE projects SET name=? WHERE id=?", [
    nextName,
    projectId,
  ]);
  await pool.query(
    "INSERT INTO histories (id,projectId,type,description,date) VALUES (?,?,?,?,NOW())",
    [
      crypto.randomUUID(),
      projectId,
      "UPDATED",
      `Título cambiado a ${nextName}`,
    ],
  );
  revalidatePath("/proyectos");
  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/");
  return { ok: true };
}

export async function deleteProject(id: string) {
  await requireAuth();
  const projectId = idSchema.parse(id);
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT
    (SELECT COUNT(*) FROM tasks WHERE projectId=?) +
    (SELECT COUNT(*) FROM checklistItems WHERE projectId=?) +
    (SELECT COUNT(*) FROM deliverables WHERE projectId=?) +
    (SELECT COUNT(*) FROM followUps WHERE projectId=?) +
    (SELECT COUNT(*) FROM changeRequests WHERE projectId=?) +
    (SELECT COUNT(*) FROM resources WHERE projectId=?) +
    (SELECT COUNT(*) FROM histories WHERE projectId=?) +
    (SELECT COUNT(*) FROM metrics WHERE projectId=?) AS related`,
    [
      projectId,
      projectId,
      projectId,
      projectId,
      projectId,
      projectId,
      projectId,
      projectId,
    ],
  );
  if (Number(rows[0]?.related || 0) > 0)
    return {
      ok: false,
      error:
        "Este proyecto tiene historial o trabajo relacionado. Archívalo para conservar esos datos.",
    };
  await pool.query("DELETE FROM projects WHERE id=?", [projectId]);
  revalidatePath("/proyectos");
  revalidatePath("/");
  return { ok: true };
}

export async function archiveProject(id: string) {
  await requireAuth();
  const projectId = idSchema.parse(id);
  await pool.query("UPDATE projects SET archived=1 WHERE id=?", [projectId]);
  await pool.query(
    "INSERT INTO histories (id,projectId,type,description,date) VALUES (?,?,?,?,NOW())",
    [
      crypto.randomUUID(),
      projectId,
      "ARCHIVED",
      "Proyecto archivado para conservar su historial",
    ],
  );
  revalidatePath("/proyectos");
  revalidatePath("/");
  return { ok: true };
}

export async function restoreProject(id: string) {
  await requireAuth();
  const projectId = idSchema.parse(id);
  await pool.query("UPDATE projects SET archived=0 WHERE id=?", [projectId]);
  await pool.query(
    "INSERT INTO histories (id,projectId,type,description,date) VALUES (?,?,?,?,NOW())",
    [
      crypto.randomUUID(),
      projectId,
      "RESTORED",
      "Proyecto habilitado nuevamente",
    ],
  );
  revalidatePath("/proyectos");
  revalidatePath("/");
  return { ok: true };
}
export async function updateProjectPhase(form: FormData) {
  await requireAuth();
  const id = idSchema.parse(text(form.get("projectId")));
  const phase = z
    .enum([
      "DISCOVERY",
      "DESIGN",
      "DEVELOPMENT",
      "CONTENT",
      "ADVERTISING",
      "SUPPORT",
      "CLOSURE",
    ])
    .parse(text(form.get("phase")));
  await pool.query("UPDATE projects SET phase=? WHERE id=?", [phase, id]);
  await pool.query(
    "INSERT INTO histories (id,projectId,type,description,date) VALUES (?,?,?,?,NOW())",
    [crypto.randomUUID(), id, "PHASE", `Fase cambiada a ${phase}`],
  );
  revalidatePath(`/proyectos/${id}`);
  revalidatePath("/proyectos");
}

export async function createMetric(form: FormData) {
  await requireAuth();
  const schema = z.object({
    projectId: idSchema,
    date: z.coerce.date(),
    platform: z.string().min(1),
    name: z.string().min(1),
    investment: optionalNumber,
    impressions: optionalNumber,
    reach: optionalNumber,
    clicks: optionalNumber,
    results: optionalNumber,
    interactions: optionalNumber,
    publications: optionalNumber,
  });
  await db.metric.create({ data: schema.parse(Object.fromEntries(form)) });
  revalidatePath("/metricas");
}

const paymentSchema = z.object({
  clientId: idSchema,
  projectId: z.preprocess(
    (value) => (value === "" ? undefined : value),
    idSchema.optional(),
  ),
  paymentDate: calendarDateSchema,
  amount: z.coerce.number().positive(),
  concept: z.string().min(2),
  status: z.enum(["PENDING", "CONFIRMED"]),
  notes: z.string().optional(),
});
export async function createPayment(form: FormData) {
  await requireAuth();
  const data = paymentSchema.parse(Object.fromEntries(form));
  await db.payment.create({
    data: { ...data, paymentType: "PERSONAL_PAYMENT" },
  });
  revalidatePath("/pagos-personales");
  revalidatePath("/");
}
const clientRevenueSchema = z.object({
  clientId: idSchema,
  revenueDate: calendarDateSchema,
  amount: z.coerce.number().positive(),
  concept: z.string().min(2),
  notes: z.string().optional(),
});
export async function createClientRevenue(form: FormData) {
  await requireAuth();
  const data = clientRevenueSchema.parse(Object.fromEntries(form));
  await db.clientRevenue.create({ data });
  revalidatePath("/ingresos-clientes");
  revalidatePath("/");
}
const personalPaymentSchema = z.object({
  paymentDate: calendarDateSchema,
  amount: z.coerce.number().positive(),
  concept: z.string().min(2),
  status: z.enum(["PENDING", "CONFIRMED"]),
  notes: z.string().optional(),
});
export async function createPersonalPayment(form: FormData) {
  await requireAuth();
  const data = personalPaymentSchema.parse(Object.fromEntries(form));
  await db.payment.create({ data: { ...data, paymentType: "PERSONAL" } });
  revalidatePath("/pagos-personales");
  revalidatePath("/");
}
export async function confirmPayment(form: FormData) {
  await requireAuth();
  const id = idSchema.parse(text(form.get("id")));
  const status = z
    .enum(["PENDING", "CONFIRMED"])
    .parse(text(form.get("status")));
  await db.payment.updateStatus({ where: { id }, status });
  revalidatePath("/pagos-personales");
  revalidatePath("/");
}

const expenseSchema = z.object({
  clientId: idSchema,
  projectId: z.preprocess(
    (value) => (value === "" ? undefined : value),
    idSchema.optional(),
  ),
  expenseDate: calendarDateSchema,
  dailyAmount: z.coerce.number().positive(),
  days: z.coerce.number().int().min(1).max(366),
  category: z.string().min(2),
  concept: z.string().min(2),
  notes: z.string().optional(),
});
export async function createExpense(form: FormData) {
  await requireAuth();
  const data = expenseSchema.parse(Object.fromEntries(form));
  await db.expense.create({
    data: { ...data, amount: data.dailyAmount * data.days },
  });
  revalidatePath("/gastos");
  revalidatePath("/marketing");
  revalidatePath("/pagos");
  revalidatePath("/");
}
const personalExpenseSchema = z.object({
  expenseDate: calendarDateSchema,
  amount: z.coerce.number().positive(),
  category: z.string().min(2),
  concept: z.string().min(2),
  notes: z.string().optional(),
});
export async function createPersonalExpense(form: FormData) {
  await requireAuth();
  const data = personalExpenseSchema.parse(Object.fromEntries(form));
  await db.expense.create({
    data: { ...data, dailyAmount: data.amount, days: 1 },
  });
  revalidatePath("/gastos");
  revalidatePath("/");
}

export async function createTemplate(form: FormData) {
  await requireAuth();
  const name = z
    .string()
    .min(2)
    .parse(text(form.get("name")));
  const service = z
    .string()
    .min(2)
    .parse(text(form.get("service")));
  const items = text(form.get("items"))
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!items.length) throw new Error("Agrega al menos un ítem");
  const id = crypto.randomUUID();
  await pool.query(
    "INSERT INTO checklistTemplates (id,name,service) VALUES (?,?,?)",
    [id, name, service],
  );
  for (const [position, title] of items.entries())
    await pool.query(
      "INSERT INTO checklistTemplateItems (id,templateId,title,position) VALUES (?,?,?,?)",
      [crypto.randomUUID(), id, title, position],
    );
  revalidatePath("/plantillas");
}
export async function updateTemplate(form: FormData) {
  await requireAuth();
  const id = idSchema.parse(text(form.get("id")));
  const name = z
    .string()
    .min(2)
    .parse(text(form.get("name")));
  const service = z
    .string()
    .min(2)
    .parse(text(form.get("service")));
  const items = text(form.get("items"))
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!items.length) throw new Error("Agrega al menos un ítem");
  await pool.query(
    "UPDATE checklistTemplates SET name=?,service=? WHERE id=?",
    [name, service, id],
  );
  await pool.query("DELETE FROM checklistTemplateItems WHERE templateId=?", [
    id,
  ]);
  for (const [position, title] of items.entries())
    await pool.query(
      "INSERT INTO checklistTemplateItems (id,templateId,title,position) VALUES (?,?,?,?)",
      [crypto.randomUUID(), id, title, position],
    );
  revalidatePath("/plantillas");
}

export async function toggleTask(idOrForm: string | FormData) {
  const id = typeof idOrForm === "string" ? idOrForm : text(idOrForm.get("id"));
  await requireAuth();
  const task = await db.task.findUnique({ where: { id } });
  if (!task) return;
  await db.task.update({
    where: { id },
    data: {
      status: task.status === "DONE" ? "TODO" : "DONE",
      completedAt: task.status === "DONE" ? null : new Date(),
    },
  });
  if (task.status !== "DONE")
    await pool.query(
      "INSERT INTO histories (id,projectId,type,description,date) VALUES (?,?,?,?,NOW())",
      [
        crypto.randomUUID(),
        task.projectId,
        "TASK",
        `Tarea completada: ${task.title}`,
      ],
    );
  revalidatePath(`/proyectos/${task.projectId}`);
}
export async function toggleChecklist(idOrForm: string | FormData) {
  const id = typeof idOrForm === "string" ? idOrForm : text(idOrForm.get("id"));
  await requireAuth();
  const [rows] = await pool.query<any[]>(
    "SELECT * FROM checklistItems WHERE id=?",
    [id],
  );
  const item = rows[0];
  if (!item) return;
  const completed = item.completed ? 0 : 1;
  await pool.query(
    "UPDATE checklistItems SET completed=?,completedAt=? WHERE id=?",
    [completed, completed ? new Date() : null, id],
  );
  if (completed)
    await pool.query(
      "INSERT INTO histories (id,projectId,type,description,date) VALUES (?,?,?,?,NOW())",
      [
        crypto.randomUUID(),
        item.projectId,
        "CHECKLIST",
        `Checklist completado: ${item.title}`,
      ],
    );
  revalidatePath(`/proyectos/${item.projectId}`);
}
export async function createTask(form: FormData) {
  await requireAuth();
  const projectId = idSchema.parse(text(form.get("projectId")));
  const title = z
    .string()
    .min(2)
    .parse(text(form.get("title")));
  const phase = text(form.get("phase")) || "DISCOVERY";
  await pool.query(
    "INSERT INTO tasks (id,projectId,title,phase,status,dueDate) VALUES (?,?,?,?,?,?)",
    [
      crypto.randomUUID(),
      projectId,
      title,
      phase,
      "TODO",
      text(form.get("dueDate")) || null,
    ],
  );
  revalidatePath(`/proyectos/${projectId}`);
}
export async function createChecklistItem(form: FormData) {
  await requireAuth();
  const projectId = idSchema.parse(text(form.get("projectId")));
  const title = z
    .string()
    .min(2)
    .parse(text(form.get("title")));
  const phase = text(form.get("phase")) || "DISCOVERY";
  await pool.query(
    "INSERT INTO checklistItems (id,projectId,title,phase) VALUES (?,?,?,?)",
    [crypto.randomUUID(), projectId, title, phase],
  );
  revalidatePath(`/proyectos/${projectId}`);
}
export async function applyTemplate(form: FormData) {
  await requireAuth();
  const projectId = idSchema.parse(text(form.get("projectId")));
  const templateId = idSchema.parse(text(form.get("templateId")));
  const phase = text(form.get("phase")) || "DISCOVERY";
  const [items] = await pool.query<any[]>(
    "SELECT * FROM checklistTemplateItems WHERE templateId=? ORDER BY position",
    [templateId],
  );
  for (const item of items) {
    const [existing] = await pool.query<any[]>(
      "SELECT id FROM checklistItems WHERE projectId=? AND templateItemId=? AND phase=? LIMIT 1",
      [projectId, item.id, phase],
    );
    if (!existing.length)
      await pool.query(
        "INSERT INTO checklistItems (id,projectId,title,phase,templateItemId) VALUES (?,?,?,?,?)",
        [crypto.randomUUID(), projectId, item.title, phase, item.id],
      );
  }
  revalidatePath(`/proyectos/${projectId}`);
}
export async function createDeliverable(form: FormData) {
  await requireAuth();
  const projectId = idSchema.parse(text(form.get("projectId")));
  const name = z
    .string()
    .min(2)
    .parse(text(form.get("name")));
  await pool.query(
    "INSERT INTO deliverables (id,projectId,name,url,dueDate) VALUES (?,?,?,?,?)",
    [
      crypto.randomUUID(),
      projectId,
      name,
      text(form.get("url")) || null,
      text(form.get("dueDate")) || null,
    ],
  );
  revalidatePath(`/proyectos/${projectId}`);
}
export async function createFollowUp(form: FormData) {
  await requireAuth();
  const projectId = idSchema.parse(text(form.get("projectId")));
  const title = z
    .string()
    .min(2)
    .parse(text(form.get("title")));
  await pool.query(
    "INSERT INTO followUps (id,projectId,title,date,notes) VALUES (?,?,?,?,?)",
    [
      crypto.randomUUID(),
      projectId,
      title,
      text(form.get("date")),
      text(form.get("notes")) || null,
    ],
  );
  revalidatePath(`/proyectos/${projectId}`);
}
export async function createChangeRequest(form: FormData) {
  await requireAuth();
  const projectId = idSchema.parse(text(form.get("projectId")));
  const title = z
    .string()
    .min(2)
    .parse(text(form.get("title")));
  await pool.query(
    "INSERT INTO changeRequests (id,projectId,title,description) VALUES (?,?,?,?)",
    [
      crypto.randomUUID(),
      projectId,
      title,
      text(form.get("description")) || null,
    ],
  );
  revalidatePath(`/proyectos/${projectId}`);
}
export async function createResource(form: FormData) {
  await requireAuth();
  const projectId = idSchema.parse(text(form.get("projectId")));
  const title = z
    .string()
    .min(2)
    .parse(text(form.get("title")));
  await pool.query(
    "INSERT INTO resources (id,projectId,type,title,value,platform,accountIdentifier,passwordManagerUrl) VALUES (?,?,?,?,?,?,?,?)",
    [
      crypto.randomUUID(),
      projectId,
      text(form.get("type")) || "LINK",
      title,
      text(form.get("value")) || null,
      text(form.get("platform")) || null,
      text(form.get("accountIdentifier")) || null,
      text(form.get("passwordManagerUrl")) || null,
    ],
  );
  revalidatePath(`/proyectos/${projectId}`);
}
export async function createHistory(form: FormData) {
  await requireAuth();
  const projectId = idSchema.parse(text(form.get("projectId")));
  const description = z
    .string()
    .min(2)
    .parse(text(form.get("description")));
  await pool.query(
    "INSERT INTO histories (id,projectId,type,description,date) VALUES (?,?,?,?,?)",
    [
      crypto.randomUUID(),
      projectId,
      "MANUAL",
      description,
      text(form.get("date")) || new Date(),
    ],
  );
  revalidatePath(`/proyectos/${projectId}`);
}
