import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";
const COOKIE = "ds_session";
function signature(value: string) { return crypto.createHmac("sha256", process.env.SESSION_SECRET || "dev-secret").update(value).digest("hex"); }
export async function isAuthenticated() { const c = (await cookies()).get(COOKIE)?.value || ""; return c === `owner.${signature("owner")}`; }
export async function requireAuth() { if (!(await isAuthenticated())) redirect("/login"); }
export async function login(email: string, password: string) { if (email === process.env.OWNER_EMAIL && password === process.env.OWNER_PASSWORD) { (await cookies()).set(COOKIE, `owner.${signature("owner")}`, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 30, path: "/" }); return true; } return false; }
export async function logout() { (await cookies()).delete(COOKIE); }
