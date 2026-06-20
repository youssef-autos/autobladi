"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ClipboardCopy, Code2, Maximize2, Minimize2, Palette, Play, Terminal } from "lucide-react"
import { toast } from "sonner"

const DEFAULT_HTML = `<div class="container">
  <h1>مرحباً بك</h1>
  <p>ابدأ بكتابة الكود هنا...</p>
</div>`

const DEFAULT_CSS = `.container {
  font-family: 'Tajawal', sans-serif;
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

h1 {
  color: #c1272d;
  font-size: 2rem;
  margin-bottom: 1rem;
}

p {
  color: #555;
  font-size: 1.1rem;
}`

const DEFAULT_JS = `// JavaScript هنا
console.log("مرحباً!");`

type Tab = "html" | "css" | "js"

export function CodePlayground() {
  const [html, setHtml] = useState(DEFAULT_HTML)
  const [css, setCss] = useState(DEFAULT_CSS)
  const [js, setJs] = useState(DEFAULT_JS)
  const [activeTab, setActiveTab] = useState<Tab>("html")
  const [fullPreview, setFullPreview] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const buildSrcdoc = useCallback(() => {
    return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet"/>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Tajawal',sans-serif;background:#fff;color:#333}
${css}
</style>
</head>
<body>
${html}
<script>
try{
${js}
}catch(e){console.error(e)}
</script>
</body>
</html>`
  }, [html, css, js])

  useEffect(() => {
    const t = setTimeout(() => {
      const iframe = iframeRef.current
      if (!iframe) return
      iframe.srcdoc = buildSrcdoc()
    }, 400)
    return () => clearTimeout(t)
  }, [buildSrcdoc])

  function copyFullCode() {
    navigator.clipboard.writeText(buildSrcdoc())
    toast.success("تم نسخ الكود الكامل")
  }

  function copyHtmlOnly() {
    navigator.clipboard.writeText(html)
    toast.success("تم نسخ HTML")
  }

  const activeValue = activeTab === "html" ? html : activeTab === "css" ? css : js
  const setActiveValue = activeTab === "html" ? setHtml : activeTab === "css" ? setCss : setJs

  const tabs: { key: Tab; label: string; icon: typeof Code2 }[] = [
    { key: "html", label: "HTML", icon: Code2 },
    { key: "css", label: "CSS", icon: Palette },
    { key: "js", label: "JavaScript", icon: Terminal },
  ]

  return (
    <div className={`flex-1 min-h-0 grid gap-3 ${fullPreview ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"}`}>
      {/* Editor panel */}
      {!fullPreview && (
        <div className="flex flex-col min-h-0 rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border bg-moroccan-sand-50/50">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors " +
                  (activeTab === t.key
                    ? "bg-brand-dark text-white"
                    : "text-muted-foreground hover:bg-moroccan-sand-100")
                }
              >
                <t.icon className="size-3.5" />
                {t.label}
              </button>
            ))}
            <div className="ms-auto flex items-center gap-1">
              <button
                type="button"
                onClick={copyHtmlOnly}
                title="نسخ HTML"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-muted-foreground hover:bg-moroccan-sand-100"
              >
                <ClipboardCopy className="size-3" />
                HTML
              </button>
              <button
                type="button"
                onClick={copyFullCode}
                title="نسخ الكود الكامل"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-moroccan-red-600 hover:bg-moroccan-red-50"
              >
                <ClipboardCopy className="size-3" />
                الكل
              </button>
            </div>
          </div>

          {/* Textarea */}
          <textarea
            value={activeValue}
            onChange={(e) => setActiveValue(e.target.value)}
            spellCheck={false}
            dir="ltr"
            className="flex-1 min-h-0 w-full resize-none bg-[#1e1e2e] text-[#cdd6f4] font-mono text-[13px] leading-relaxed p-4 focus:outline-none selection:bg-moroccan-red-500/30"
          />
        </div>
      )}

      {/* Preview panel */}
      <div className="flex flex-col min-h-0 rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-moroccan-sand-50/50">
          <div className="flex items-center gap-1.5">
            <Play className="size-3.5 text-moroccan-mint-600" />
            <span className="text-xs font-semibold text-foreground">المعاينة</span>
          </div>
          <button
            type="button"
            onClick={() => setFullPreview(!fullPreview)}
            title={fullPreview ? "تصغير" : "تكبير"}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:bg-moroccan-sand-100"
          >
            {fullPreview ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          </button>
        </div>
        <iframe
          ref={iframeRef}
          title="preview"
          sandbox="allow-scripts"
          className="flex-1 min-h-0 w-full bg-white"
        />
      </div>
    </div>
  )
}
