import { login } from "@/lib/auth";
import { redirect } from "next/navigation";
async function action(form: FormData) {
  "use server";
  const ok = await login(
    String(form.get("email")),
    String(form.get("password")),
  );
  if (ok) redirect("/");
  redirect("/login?error=1");
}
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const q = await searchParams;
  return (
    <main className="login">
      <section className="login-box">
        <div className="brand">
          Digital Solutions<span>Operations workspace</span>
        </div>
        <h1 className="title">Acceso privado</h1>
        <p className="subtitle">
          Gestiona clientes, proyectos y entregas en un solo lugar.
        </p>
        {q.error && <p className="error">Correo o contraseña incorrectos.</p>}
        <form action={action}>
          <div className="field">
            <label htmlFor="email">Correo del propietario</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </div>
          <button className="btn lime" type="submit">
            Entrar al panel
          </button>
        </form>
      </section>
    </main>
  );
}
