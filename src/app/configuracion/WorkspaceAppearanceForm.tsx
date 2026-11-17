"use client";

import { useEffect, useState } from "react";
import { useWorkspaceSettings, type WorkspaceSettings } from "@/app/components/WorkspaceSettings";

export default function WorkspaceAppearanceForm() {
  const { settings, save, reset } = useWorkspaceSettings();
  const [draft, setDraft] = useState(settings);
  const [saved, setSaved] = useState(false);
  useEffect(() => setDraft(settings), [settings]);
  function update<K extends keyof WorkspaceSettings>(key: K, value: WorkspaceSettings[K]) { setDraft((current) => ({ ...current, [key]: value })); setSaved(false); }
  function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); save(draft); setSaved(true); }
  function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => update("logoUrl", String(reader.result));
    reader.readAsDataURL(file);
  }
  return <form className="appearance-form" onSubmit={submit}>
    <div className="appearance-preview"><div className="brand-logo preview-logo">{draft.logoUrl ? <img src={draft.logoUrl} alt="" /> : "↗"}</div><div><strong>{draft.title || "Nombre de tu espacio"}</strong><small>Vista previa del espacio</small></div></div>
    <div className="form-grid appearance-grid">
      <div className="field"><label htmlFor="workspaceTitle">Título visible</label><input id="workspaceTitle" value={draft.title} onChange={(event) => update("title", event.target.value)} placeholder="Digital Solutions" maxLength={60} /></div>
      <div className="field"><label htmlFor="workspaceLogo">Logo por URL</label><input id="workspaceLogo" value={draft.logoUrl.startsWith("data:") ? "" : draft.logoUrl} onChange={(event) => update("logoUrl", event.target.value)} placeholder="https://.../logo.png" /></div>
      <div className="field"><label htmlFor="workspaceLogoFile">Subir logo</label><input id="workspaceLogoFile" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={upload} /><small className="field-help">Máximo 1 MB. Se guarda en este navegador.</small></div>
      <div className="field color-field"><label htmlFor="workspacePrimary">Color principal</label><div><input id="workspacePrimary" type="color" value={draft.primaryColor} onChange={(event) => update("primaryColor", event.target.value)} /><code>{draft.primaryColor}</code></div></div>
      <div className="field color-field"><label htmlFor="workspaceAccent">Color de acento</label><div><input id="workspaceAccent" type="color" value={draft.accentColor} onChange={(event) => update("accentColor", event.target.value)} /><code>{draft.accentColor}</code></div></div>
    </div>
    <div className="appearance-actions"><button className="btn lime" type="submit">Guardar apariencia</button><button className="btn ghost" type="button" onClick={() => { reset(); setDraft({ title: "Jhorman Nieto P", logoUrl: "", primaryColor: "#12382f", accentColor: "#d9fa6c" }); setSaved(true); }}>Restaurar valores</button>{saved && <span className="success-text" role="status">Cambios guardados</span>}</div>
  </form>;
}
