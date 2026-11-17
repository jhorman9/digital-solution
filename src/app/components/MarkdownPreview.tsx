import { renderMarkdown } from "@/lib/markdown";

export default function MarkdownPreview({ value }: { value: string | null | undefined }) {
  return <div className="markdown-preview project-description" dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }} />;
}
