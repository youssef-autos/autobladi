"use client"

import { CheckCheck, Check } from "lucide-react"
import { useFormatter } from "next-intl"

import { cn } from "@/lib/utils"

type Props = {
  content: string
  createdAt: string
  isFromMe: boolean
  isRead?: boolean
  showTimestamp?: boolean
  isFirstInGroup?: boolean
  isLastInGroup?: boolean
}

export function MessageBubble({
  content,
  createdAt,
  isFromMe,
  isRead = false,
  showTimestamp = true,
  isFirstInGroup = true,
  isLastInGroup = true,
}: Props) {
  const format = useFormatter()
  const time = format.dateTime(new Date(createdAt), {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div
      className={cn(
        "flex flex-col max-w-[78%] md:max-w-[65%]",
        isFromMe ? "items-end self-end" : "items-start self-start",
      )}
    >
      <div
        className={cn(
          "px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words",
          isFromMe
            ? "bg-moroccan-red-50 text-foreground"
            : "bg-white text-foreground border border-border",
          // Rounded corners — square the "tail" side when grouped
          "rounded-2xl",
          isFromMe && isLastInGroup && "rounded-ee-sm",
          !isFromMe && isLastInGroup && "rounded-es-sm",
          isFirstInGroup ? "" : "mt-0.5",
        )}
      >
        {content}
      </div>
      {showTimestamp && (
        <div
          className={cn(
            "mt-1 flex items-center gap-1 text-[10px] text-muted-foreground tabular-nums",
            isFromMe ? "flex-row-reverse" : "flex-row",
          )}
        >
          <span>{time}</span>
          {isFromMe &&
            (isRead ? (
              <CheckCheck
                className="size-3 text-moroccan-mint-500"
                aria-hidden="true"
              />
            ) : (
              <Check className="size-3" aria-hidden="true" />
            ))}
        </div>
      )}
    </div>
  )
}
