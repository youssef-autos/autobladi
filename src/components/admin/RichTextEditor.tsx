"use client"

import { useRef } from "react"
import { Editor } from "@tinymce/tinymce-react"

type Props = {
  value: string
  onChange: (v: string) => void
  dir?: "rtl" | "ltr"
  height?: number
  placeholder?: string
}

export function RichTextEditor({
  value,
  onChange,
  dir = "rtl",
  height = 450,
  placeholder,
}: Props) {
  const editorRef = useRef<unknown>(null)

  return (
    <Editor
      tinymceScriptSrc="https://cdn.jsdelivr.net/npm/tinymce@7/tinymce.min.js"
      onInit={(_evt, editor) => {
        editorRef.current = editor
      }}
      value={value}
      onEditorChange={(content) => onChange(content)}
      init={{
        height,
        placeholder,
        menubar: "file edit view insert format tools table",
        directionality: dir,
        language: dir === "rtl" ? "ar" : "fr_FR",
        skin: "oxide",
        content_css: "default",
        plugins: [
          "advlist",
          "autolink",
          "lists",
          "link",
          "image",
          "charmap",
          "preview",
          "anchor",
          "searchreplace",
          "visualblocks",
          "code",
          "fullscreen",
          "insertdatetime",
          "media",
          "table",
          "help",
          "wordcount",
          "directionality",
          "emoticons",
        ],
        toolbar:
          "undo redo | blocks fontfamily fontsize | " +
          "bold italic underline strikethrough | " +
          "link image media table | " +
          "alignleft aligncenter alignright alignjustify | " +
          "bullist numlist outdent indent | " +
          "ltr rtl | emoticons charmap | " +
          "code fullscreen | removeformat help",
        content_style: `
          @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap');
          body {
            font-family: 'Tajawal', sans-serif;
            font-size: 15px;
            line-height: 1.7;
            color: #333;
            padding: 0.5rem;
            direction: ${dir};
          }
          h1,h2,h3 { font-family: 'Tajawal', sans-serif; color: #1a1a1a; }
          a { color: #c1272d; }
          img { max-width: 100%; height: auto; border-radius: 8px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; }
          th { background: #f5f5f5; }
          blockquote { border-left: 4px solid #d4a00e; padding-left: 1rem; margin-left: 0; color: #555; }
        `,
        image_advtab: true,
        automatic_uploads: false,
        file_picker_types: "image",
        promotion: false,
        branding: false,
      }}
      licenseKey="gpl"
    />
  )
}
