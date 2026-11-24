import Markdown, { defaultUrlTransform } from "react-markdown";

export default function EditorialMarkdown({ source }: { source: string }) {
  return (
    <Markdown
      skipHtml
      urlTransform={(url, key) => {
        if (key === "src" && !url.startsWith("/archive/")) return "";
        if (/^[\\/]{2}/.test(url)) return "";
        return defaultUrlTransform(url);
      }}
    >
      {source}
    </Markdown>
  );
}
