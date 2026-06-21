import { App } from "@modelcontextprotocol/ext-apps/app-with-deps";

const root = document.getElementById("root");

function render(url, kind) {
  if (!url) {
    root.innerHTML = `<div class="msg">Still rendering… ask me to check again.</div>`;
    return;
  }
  const isVideo = kind === "video" || /\.mp4(\?|$)/i.test(url);
  root.innerHTML = isVideo
    ? `<video src="${url}" controls autoplay loop playsinline></video>`
    : `<img src="${url}" alt="" />`;
}

function extract(result) {
  // Prefer structured data; only fall back to a *media* URL in text (never a status/handle URL).
  const sc = result?.structuredContent;
  if (sc?.url) return { url: sc.url, kind: sc.kind };
  const text = (result?.content || []).map((c) => c?.text || "").join(" ");
  const m = text.match(/https?:\/\/\S+\.(mp4|webm|mov|png|jpe?g|webp|gif)(\?\S*)?/i);
  if (m) return { url: m[0], kind: /\.(mp4|webm|mov)/i.test(m[0]) ? "video" : "image" };
  return { url: null };
}

const app = new App({ name: "Geoflix Media", version: "1.0.0" });

app.ontoolresult = (result) => {
  const { url, kind } = extract(result);
  render(url, kind);
};

// Show whatever the initial render data is, if provided on load.
try {
  if (app.toolResult) {
    const { url, kind } = extract(app.toolResult);
    render(url, kind);
  }
} catch {}
