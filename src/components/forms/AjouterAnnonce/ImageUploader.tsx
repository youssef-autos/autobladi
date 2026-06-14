"use client"

import { useCallback, useRef, useState } from "react"
import Image from "next/image"
import { Loader2, Star, Trash2, Upload } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { uploadWithWatermark } from "@/lib/storage/upload"
import { cn } from "@/lib/utils"

export type UploadedImage = {
  id: string
  url: string
  thumbnail_url: string
  is_main: boolean
}

type Props = {
  images: UploadedImage[]
  onChange: (images: UploadedImage[]) => void
}

const MAX_BYTES = 10 * 1024 * 1024
const MAX_COUNT = 15
const ACCEPT = "image/jpeg,image/jpg,image/png,image/webp"

export function ImageUploader({ images, onChange }: Props) {
  const t = useTranslations("ajouter.step3")
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(0)

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files)
      if (images.length + list.length > MAX_COUNT) {
        toast.error(t("tooLarge"))
        return
      }

      const validated = list.filter((f) => {
        if (f.size > MAX_BYTES) {
          toast.error(`${f.name}: ${t("fileTooLarge")}`)
          return false
        }
        if (!ACCEPT.split(",").includes(f.type)) {
          toast.error(`${f.name}: ${t("invalidType")}`)
          return false
        }
        return true
      })

      if (validated.length === 0) return

      setUploading((c) => c + validated.length)
      const uploaded: UploadedImage[] = []
      await Promise.all(
        validated.map(async (file) => {
          try {
            const { mainUrl, thumbnailUrl } = await uploadWithWatermark(file)
            uploaded.push({
              id: crypto.randomUUID(),
              url: mainUrl,
              thumbnail_url: thumbnailUrl,
              is_main: false,
            })
          } catch (err) {
            const message = err instanceof Error ? err.message : "upload_failed"
            toast.error(`${file.name}: ${message}`)
          }
        }),
      )
      setUploading((c) => Math.max(0, c - validated.length))

      if (uploaded.length === 0) return
      const merged = [...images, ...uploaded]
      // First image becomes main if none designated yet
      if (!merged.some((i) => i.is_main)) {
        merged[0] = { ...merged[0], is_main: true }
      }
      onChange(merged)
    },
    [images, onChange, t],
  )

  function setMain(id: string) {
    onChange(images.map((img) => ({ ...img, is_main: img.id === id })))
  }

  function remove(id: string) {
    const next = images.filter((img) => img.id !== id)
    if (next.length > 0 && !next.some((i) => i.is_main)) {
      next[0] = { ...next[0], is_main: true }
    }
    onChange(next)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files?.length) {
      handleFiles(e.dataTransfer.files)
    }
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
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
          "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed bg-moroccan-sand-50/40 px-6 py-12 cursor-pointer transition-colors",
          dragOver
            ? "border-moroccan-red-500 bg-moroccan-red-50/40"
            : "border-moroccan-gold-500/40 hover:border-moroccan-gold-500",
        )}
      >
        <span className="inline-flex items-center justify-center size-12 rounded-2xl bg-white text-moroccan-red-500 shadow-card">
          <Upload className="size-5" aria-hidden="true" />
        </span>
        <p className="font-semibold text-foreground text-center">{t("dropTitle")}</p>
        <p className="text-xs text-muted-foreground text-center">{t("dropHint")}</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files)
            e.target.value = ""
          }}
        />
      </div>

      {uploading > 0 && (
        <div className="rounded-xl bg-moroccan-gold-50/40 px-4 py-3 text-sm text-moroccan-gold-700 inline-flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          {t("uploading")} ({uploading})
        </div>
      )}

      {images.length > 0 && (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((img) => (
            <li
              key={img.id}
              className={cn(
                "relative group aspect-[4/3] rounded-xl overflow-hidden bg-moroccan-sand-50 border-2 transition-colors",
                img.is_main
                  ? "border-moroccan-gold-500 ring-2 ring-moroccan-gold-500/20"
                  : "border-transparent",
              )}
            >
              <Image
                src={img.thumbnail_url}
                alt=""
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover"
              />
              {img.is_main && (
                <span className="absolute top-2 start-2 inline-flex items-center gap-1 rounded-full bg-moroccan-gold-500 text-white px-2 py-0.5 text-[10px] font-semibold shadow-sm">
                  <Star className="size-3 fill-white" aria-hidden="true" />
                  {t("isMain")}
                </span>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
              <div className="absolute bottom-2 inset-x-2 flex items-center justify-between gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!img.is_main && (
                  <button
                    type="button"
                    onClick={() => setMain(img.id)}
                    aria-label={t("setMain")}
                    className="inline-flex size-7 items-center justify-center rounded-full bg-white/95 text-moroccan-gold-700 hover:bg-white"
                  >
                    <Star className="size-3.5" aria-hidden="true" />
                  </button>
                )}
                <span className="flex-1" />
                <button
                  type="button"
                  onClick={() => remove(img.id)}
                  aria-label={t("remove")}
                  className="inline-flex size-7 items-center justify-center rounded-full bg-white/95 text-destructive hover:bg-white"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">{t("tip")}</p>

      {images.length > 0 && images.length < 3 && (
        <p className="text-sm text-destructive">{t("tooSmall")}</p>
      )}
    </div>
  )
}
