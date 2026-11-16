import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { pool } from "../src/lib/db";

const templates = [
  ["Checklist de Web a medida", "Páginas web a medida", ["Validar alcance", "Revisar versión móvil", "Comprobar publicación"]],
  ["Checklist de WordPress/WooCommerce", "WordPress/WooCommerce", ["Crear respaldo", "Validar plugins y tema", "Probar flujo de compra"]],
  ["Checklist de Meta Ads", "Meta Ads", ["Revisar objetivo y presupuesto", "Validar creatividades", "Registrar resultados"]],
  ["Checklist de Facebook", "Facebook", ["Preparar copy y creatividades", "Revisar enlaces", "Programar publicación"]],
  ["Checklist de Instagram", "Instagram", ["Revisar formato y copy", "Validar portada", "Programar contenido"]],
  ["Checklist de Fotografía", "Fotografía", ["Validar lista de tomas", "Seleccionar fotografías", "Exportar originales finales"]],
  ["Checklist de Edición de video", "Edición de video", ["Revisar material", "Editar y subtitular", "Exportar versiones"]],
  ["Checklist de Subida de contenidos", "Subida de contenidos", ["Validar archivos y textos", "Cargar contenido", "Revisar vista publicada"]],
  ["Checklist de Soporte", "Soporte", ["Registrar incidencia", "Validar solución", "Documentar cambios"]],
  ["Checklist de Conexiones vía API", "Conexiones vía API", ["Confirmar contrato de API", "Probar integración", "Validar manejo de errores"]],
] as const;

async function main() {
  const sql = await fs.readFile(path.join(process.cwd(), "schema.sql"), "utf8");
  for (const statement of sql.split(";").map((value) => value.trim()).filter(Boolean)) await pool.query(statement);
  const [expenseColumns] = await pool.query<any[]>("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='expenses'");
  const existingExpenseColumns = new Set(expenseColumns.map((column: any) => column.COLUMN_NAME));
  for (const [column, definition] of [["clientId", "VARCHAR(36) NULL"], ["projectId", "VARCHAR(36) NULL"], ["dailyAmount", "DECIMAL(12,2) NULL"], ["days", "INT NULL"]] as const) if (!existingExpenseColumns.has(column)) await pool.query(`ALTER TABLE expenses ADD COLUMN ${column} ${definition}`);
  const [paymentColumns] = await pool.query<any[]>("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='payments'");
  const existingPaymentColumns = new Set(paymentColumns.map((column: any) => column.COLUMN_NAME));
  if (existingPaymentColumns.has("clientId")) await pool.query("ALTER TABLE payments MODIFY COLUMN clientId VARCHAR(36) NULL");
  if (!existingPaymentColumns.has("paymentType")) await pool.query("ALTER TABLE payments ADD COLUMN paymentType VARCHAR(30) NOT NULL DEFAULT 'CLIENT_INCOME' AFTER projectId");
  const names = ["The Color Bar Salon", "Cocolpan", "Azumi", "Divino Pekado", "Utah Mechanical School", "Aikikai"];
  for (const name of names) { const [rows] = await pool.query<any[]>("SELECT id FROM clients WHERE name=? LIMIT 1", [name]); if (!rows.length) await pool.query("INSERT INTO clients (id,name) VALUES (?,?)", [crypto.randomUUID(), name]); }
  for (const [name, service, items] of templates) { const [rows] = await pool.query<any[]>("SELECT id FROM checklistTemplates WHERE service=? LIMIT 1", [service]); if (!rows.length) { const id = crypto.randomUUID(); await pool.query("INSERT INTO checklistTemplates (id,name,service) VALUES (?,?,?)", [id, name, service]); for (const [position, title] of items.entries()) await pool.query("INSERT INTO checklistTemplateItems (id,templateId,title,position) VALUES (?,?,?,?)", [crypto.randomUUID(), id, title, position]); } }
  const [projectCount] = await pool.query<any[]>("SELECT COUNT(*) count FROM projects");
  if (!Number(projectCount[0].count)) {
    const [clients] = await pool.query<any[]>("SELECT id,name FROM clients ORDER BY name");
    const samples = [["The Color Bar Salon", "Promoción de rubias", "Meta Ads", "ADVERTISING", "IN_PROGRESS", "HIGH", 1, 3], ["Cocolpan", "Actualización del sitio", "WordPress/WooCommerce", "DEVELOPMENT", "IN_REVIEW", "HIGH", 2, -2], ["Azumi", "Calendario editorial", "Instagram", "CONTENT", "IN_PROGRESS", "MEDIUM", 1, 5], ["Divino Pekado", "Producción de reels", "Edición de video", "DESIGN", "NOT_STARTED", "MEDIUM", 0, 12], ["Utah Mechanical School", "Soporte y mantenimiento", "Soporte", "SUPPORT", "NOT_STARTED", "LOW", 0, 15], ["Aikikai", "Publicación de contenidos", "Subida de contenidos", "CLOSURE", "COMPLETED", "LOW", 4, -6]] as const;
    for (const [clientName, name, service, phase, status, priority, completed, dueOffset] of samples) { const client = clients.find((item: any) => item.name === clientName); if (!client) continue; const id = crypto.randomUUID(); const start = new Date(); start.setDate(start.getDate() - 10); const due = new Date(); due.setDate(due.getDate() + dueOffset); await pool.query("INSERT INTO projects (id,clientId,name,description,services,phase,status,priority,startDate,dueDate,isExample) VALUES (?,?,?,?,?,?,?,?,?,?,1)", [id, client.id, name, "Proyecto de ejemplo editable.", JSON.stringify([service]), phase, status, priority, start, due]); for (let i = 0; i < 4; i++) await pool.query("INSERT INTO tasks (id,projectId,title,phase,status) VALUES (?,?,?,?,?)", [crypto.randomUUID(), id, ["Definir alcance", "Preparar materiales", "Revisar avance", "Cerrar entrega"][i], phase, i < completed ? "DONE" : "TODO"]); }
  }
  console.log("MySQL listo: esquema y seed aplicados.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => pool.end());
