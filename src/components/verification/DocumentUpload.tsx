"use client"

import { useCallback, useRef, useState } from "react"
import { File as FileIcon, Loader2, Trash2, Upload } from "lucide-react"
import { useTranslations } from "next-intl"

import { uploadToPrivateBucket } from "@/lib/storage/upload-private"
import {
  MAX_VERIFICATION_BYTES,
  VERIFICATION_MIME_TYPES,
} from "@/lib/validations/verification"
import { cn } from "@/lib/utils"

const ACCEPT = VERIFICATION_MIME_TYPES.join(",")

type Props = {
  label: string
  help?: string
  prefix: string
  userId: string
  value: { path: string; filename: string; contentType: string } | null
  onChange: (
    value: { path: string; filename: string; contentType: string } | null,
  ) => void
  required?: boolean
}

export function DocumentUpload({
  label,
  help,
  prefix,
  userId,
  value,
  onChange,
  required,
}: Props) {
  const t = useTranslations("verification.form")
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback(
    async (file: File) => {
      setError(null)
      if (!VERIFICATION_MIME_TYPES.includes(file.type as never)) {
        setError(t("fileTypeError"))
        return
      }
      if (file.size > MAX_VERIFICATION_BYTES) {
        setError(t("fileTooLarge"))
        return
      }
      setUploading(true)
      try {
        const result = await uploadToPrivateBucket("verifications", file, {
          userId,
          prefix,
        })
        onChange(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : t("uploadFailed"))
      } finally {
        setUploading(false)
      }
    },
    [onChange, prefix, t, userId],
  )

  function remove() {
    onChange(null)
    setError(null)
  }

  if (value) {
    return (
      <div className="space-y-1.5">
        <p className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ms-1">*</span>}
        </p>
        <div className="flex items-center gap-3 rounded-2xl border border-moroccan-mint-500/30 bg-moroccan-mint-500/5 p-4">
          <FileIcon
            className="size-5 text-moroccan-mint-500 shrink-0"
            aria-hidden="true"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {value.filename}
            </p>
            <p className="text-xs text-moroccan-mint-500">{t("uploaded")}</p>
          </div>
          <button
            type="button"
            onClick={remove}
            aria-label={t("remove")}
            className="inline-flex items-center justify-center size-8 rounded-lg text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ms-1">*</span>}
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const f = e.dataTransfer.files?.[0]
          if (f) void handleFile(f)
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed bg-moroccan-sand-50/40 px-6 py-8 cursor-pointer transition-colors",
          dragOver
            ? "border-moroccan-red-500 bg-moroccan-red-50/40"
            : "border-moroccan-gold-500/40 hover:border-moroccan-gold-500",
          uploading && "opacity-60 pointer-events-none",
        )}
      >
        <span className="inline-flex items-center justify-center size-10 rounded-xl bg-white text-moroccan-red-500 shadow-card">
          {uploading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Upload className="size-4" aria-hidden="true" />
          )}
        </span>
        <p className="text-sm font-medium text-foreground text-center">
          {uploading ? t("uploading") : t("selectFile")}
        </p>
        {help && (
          <p className="text-xs text-muted-foreground text-center">{help}</p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void handleFile(f)
            e.target.value = ""
          }}
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
