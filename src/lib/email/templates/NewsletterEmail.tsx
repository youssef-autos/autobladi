import * as React from "react"
import { Link, Section, Text } from "@react-email/components"

import {
  COLORS,
  EmailHeading,
  EmailLayout,
  EmailParagraph,
} from "../layout"

export type NewsletterItem = {
  title: string
  excerpt: string | null
  url: string
  imageUrl?: string | null
}

type Props = {
  preheader: string
  introHeading: string
  introText: string
  items: NewsletterItem[]
  unsubscribeUrl: string
  lang?: "ar" | "fr"
}

export function NewsletterEmail({
  preheader,
  introHeading,
  introText,
  items,
  unsubscribeUrl,
  lang = "ar",
}: Props) {
  const ar = lang === "ar"
  return (
    <EmailLayout lang={lang} preview={preheader} unsubscribeUrl={unsubscribeUrl}>
      <EmailHeading>{introHeading}</EmailHeading>
      <EmailParagraph>{introText}</EmailParagraph>

      {items.map((item, idx) => (
        <Section
          key={idx}
          style={{
            borderTop: `1px solid ${COLORS.border}`,
            paddingTop: "20px",
            marginTop: "20px",
          }}
        >
          {item.imageUrl && (
            // Email clients can't execute next/image — a plain <img> with
            // explicit width is the only portable choice here.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imageUrl}
              alt=""
              width="536"
              style={{
                width: "100%",
                maxWidth: "536px",
                height: "auto",
                borderRadius: "10px",
                display: "block",
                marginBottom: "12px",
              }}
            />
          )}
          <Link
            href={item.url}
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: COLORS.dark,
              textDecoration: "none",
            }}
          >
            {item.title}
          </Link>
          {item.excerpt && (
            <Text
              style={{
                margin: "8px 0 12px 0",
                fontSize: "14px",
                lineHeight: 1.6,
                color: COLORS.text,
              }}
            >
              {item.excerpt}
            </Text>
          )}
          <Link
            href={item.url}
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: COLORS.red,
              textDecoration: "none",
            }}
          >
            {ar ? "اقرأ المزيد ←" : "Lire la suite →"}
          </Link>
        </Section>
      ))}
    </EmailLayout>
  )
}

export default NewsletterEmail
