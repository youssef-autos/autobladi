"use client"

import { useRef, useState, useTransition } from "react"
import { FileJson, Upload, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { bulkImportBrands } from "@/app/[locale]/admin/brands/actions"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MoroccanButton } from "@/components/ui/MoroccanButton"
import {
  brandImportItemSchema,
  type BrandImportItem,
} from "@/lib/validations/brand"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BrandImportDialog({ open, onOpenChange }: Props) {
  const t = useTranslations("adminPanel.brandsPage")
  const tUp = useTranslations("adminPanel.brandsPage.upload")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [items, setItems] = useState<BrandImportItem[] | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleFile(file: File) {
    setError(null)
    setItems(null)
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const raw = JSON.parse(String(reader.result))
        if (!Array.isArray(raw)) {
          setError(tUp("invalidFile"))
          return
        }
        const parsed: BrandImportItem[] = []
        for (let i = 0; i < raw.length; i++) {
          const result = brandImportItemSchema.safeParse(raw[i])
          if (!result.success) {
            setError(
              tUp("invalidEntry", {
                index: i + 1,
                reason: result.error.issues[0]?.path?.join(".") ?? "invalid",
              }),
            )
            return
          }
          parsed.push(result.data)
        }
        setItems(parsed)
      } catch {
        setError(tUp("invalidFile"))
      }
    }
    reader.readAsText(file)
  }

  function onDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file && file.name.toLowerCase().endsWith(".json")) {
      handleFile(file)
    } else {
      setError(tUp("invalidFile"))
    }
  }

  function onImport() {
    if (!items) return
    startTransition(async () => {
      const res = await bulkImportBrands(items)
      if (!res.ok) {
        toast.error(t("toast.error"), { description: res.error })
        return
      }
      const { imported, updated } = res.data ?? { imported: 0, updated: 0 }
      toast.success(tUp("summary", { imported, updated }))
      setItems(null)
      setFileName(null)
      onOpenChange(false)
    })
  }

  function reset() {
    setItems(null)
    setFileName(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset()
        onOpenChange(o)
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{tUp("title")}</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground -mt-2">{tUp("subtitle")}</p>

        <label
          htmlFor="brand-json-input"
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="mt-4 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-moroccan-gold-500/40 bg-moroccan-gold-50/30 p-8 cursor-pointer hover:bg-moroccan-gold-50/60 transition-colors"
        >
          <FileJson className="size-10 text-moroccan-gold-600" aria-hidden="true" />
          <p className="text-sm text-foreground font-medium">
            {fileName ?? tUp("dropOrClick")}
          </p>
          <input
            id="brand-json-input"
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
            className="sr-only"
          />
        </label>

        {error && (
          <div
            role="alert"
            className="mt-3 flex items-start gap-2 rounded-xl bg-moroccan-red-50 border border-moroccan-red-500/30 px-3 py-2 text-sm text-moroccan-red-700"
          >
            <X className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {items && (
          <div className="mt-3 rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-2 bg-moroccan-sand-50/60 text-xs font-semibold text-foreground">
              {tUp("preview", { count: items.length })}
            </div>
            <div className="max-h-64 overflow-y-auto text-xs">
              <table className="w-full">
                <thead className="bg-moroccan-sand-50/30 text-muted-foreground">
                  <tr>
                    <th className="text-start px-3 py-1.5">name</th>
                    <th className="text-start px-3 py-1.5">slug</th>
                    <th className="text-start px-3 py-1.5">logo_url</th>
                    <th className="text-start px-3 py-1.5">order</th>
                    <th className="text-start px-3 py-1.5">active</th>
                  </tr>
                </thead>
                <tbody>
                  {items.slice(0, 50).map((b, idx) => (
                    <tr key={idx} className="border-t border-border">
                      <td className="px-3 py-1.5 font-medium">{b.name}</td>
                      <td className="px-3 py-1.5 font-mono text-muted-foreground">
                        {b.slug ?? "(auto)"}
                      </td>
                      <td className="px-3 py-1.5 text-muted-foreground truncate max-w-[180px]">
                        {b.logo_url ?? "—"}
                      </td>
                      <td className="px-3 py-1.5 text-muted-foreground">
                        {b.order_index ?? 0}
                      </td>
                      <td className="px-3 py-1.5 text-muted-foreground">
                        {(b.is_active ?? true) ? "✓" : "✗"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {items.length > 50 && (
                <p className="px-3 py-2 text-muted-foreground border-t border-border">
                  + {items.length - 50} …
                </p>
              )}
            </div>
          </div>
        )}

        <details className="mt-3 text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            {tUp("format")}
          </summary>
          <pre className="mt-2 rounded-xl bg-brand-dark text-white p-3 overflow-x-auto text-[11px]">{`[
  {
    "name": "BMW",
    "slug": "bmw",
    "logo_url": "https://example.com/bmw.png",
    "order_index": 1,
    "is_active": true
  }
]`}</pre>
        </details>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={pending}
            className="h-10 px-4 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-moroccan-sand-50"
          >
            {t("form.cancel")}
          </button>
          <MoroccanButton
            type="button"
            size="sm"
            onClick={onImport}
            disabled={!items || pending}
            loading={pending}
          >
            <Upload className="size-4 me-1.5" aria-hidden="true" />
            {pending ? tUp("importing") : tUp("import")}
          </MoroccanButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}
