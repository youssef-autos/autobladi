import { cn } from "@/lib/utils"
import { GoldAccent } from "@/components/ui/GoldAccent"

type Props = {
  title: string
  subtitle?: string
  align?: "center" | "start"
  className?: string
  as?: "h1" | "h2" | "h3"
}

const sizeByLevel = {
  h1: "text-4xl md:text-5xl lg:text-6xl",
  h2: "text-3xl md:text-4xl",
  h3: "text-2xl md:text-3xl",
}

export function SectionTitle({
  title,
  subtitle,
  align = "center",
  className,
  as: Tag = "h2",
}: Props) {
  const isCenter = align === "center"
  return (
    <div
      className={cn(
        "space-y-3",
        isCenter ? "text-center" : "text-start",
        className,
      )}
    >
      <Tag
        className={cn(
          "font-display font-bold tracking-tight text-foreground",
          sizeByLevel[Tag],
        )}
      >
        {title}
      </Tag>
      <GoldAccent className={isCenter ? "mx-auto" : ""} />
      {subtitle && (
        <p
          className={cn(
            "text-muted-foreground text-base md:text-lg max-w-2xl",
            isCenter && "mx-auto",
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}
