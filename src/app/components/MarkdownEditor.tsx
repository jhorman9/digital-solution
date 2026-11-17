"use client";

import { useState } from "react";
import { renderMarkdown } from "@/lib/markdown";

export default function MarkdownEditor({ name, defaultValue = "", placeholder, rows = 8 }: { name: string; defaultValue?: string; placeholder?: string; rows?: number }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div className="markdown-editor">
      <div className="markdown-pane">
        <span className="markdown-pane-label">Escribe en Markdown</span>
        <textarea className="markdown-input" name={name} value={value} onChange={(event) => setValue(event.target.value)} placeholder={placeholder} rows={rows} maxLength={100000} aria-label="Descripción en Markdown" />
        <small className="field-help">Usa # títulos, - listas, **negritas**, *cursivas*, enlaces y bloques de código.</small>
      </div>
      <div className="markdown-pane">
        <span className="markdown-pane-label">Vista previa</span>
        <div className="markdown-preview" aria-live="polite" dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }} />
      </div>
    </div>
  );
}
