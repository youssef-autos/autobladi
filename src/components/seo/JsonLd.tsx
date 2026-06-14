type Props = {
  /**
   * Either a single schema.org object or an array of them. Arrays are
   * useful when you want to emit, say, a `Vehicle` plus a `BreadcrumbList`
   * on the same page — one `<script>` tag with both lets Google parse
   * both without you babysitting the order.
   */
  data: Record<string, unknown> | Array<Record<string, unknown>>
}

/**
 * Server-rendered JSON-LD block. Safe to use anywhere — it serializes
 * with proper escaping for `</script>` sequences (the only XSS vector
 * here, since we control the inputs).
 */
export function JsonLd({ data }: Props) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c")
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}
