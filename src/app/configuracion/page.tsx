import AppShell from "@/app/components/AppShell";
import PushNotificationButton from "@/app/components/PushNotificationButton";

export default function ConfigurationPage() {
  return (
    <AppShell>
      <div className="content settings-page">
        <div className="page-head">
          <div>
            <div className="eyebrow">Espacio de trabajo</div>
            <h1 className="title">Configuración</h1>
            <p className="subtitle">Administra avisos y preferencias de tu operación.</p>
          </div>
        </div>
        <section className="card settings-card">
          <div className="settings-card-copy">
            <span className="settings-icon" aria-hidden="true">🔔</span>
            <div>
              <h2 className="section-title">Avisos de vencimientos</h2>
              <p className="subtitle">Recibe alertas cuando una publicidad venza mañana, hoy o haya vencido.</p>
            </div>
          </div>
          <div className="settings-card-actions">
            <PushNotificationButton />
            <p className="settings-help">Activa los permisos en este dispositivo. Puedes enviar una prueba para confirmar que el canal funciona.</p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
